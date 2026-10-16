// Verificar IMEI (tela /imei). Consulta o imei.info com a chave que fica só
// aqui (secret IMEIINFO_API_KEY) e devolve o resultado já traduzido para a tela.
// Duas consultas, cada uma um serviço pago do imei.info:
//   fmi       — APPLE: FMI Status [ON / OFF] ($0.05): Buscar iPhone ligado?
//   blacklist — BLACKLIST: Simple Check ($0.20): IMEI em lista de bloqueio?
// SERVICOS: os IDs desses serviços no imei.info (lista em
// GET /api/service/services/?API_KEY=...).
//
// Só planos pagos (preferencias.plano, ver config/planos.js do site). Cada
// consulta fica em public.consultas_imei: o mesmo IMEI e serviço consultado há
// menos de CACHE_MIN minutos sai do cache, sem cobrar de novo; e cada pessoa tem
// LIMITE_DIA consultas cobradas por 24 h.
//
// POST JSON { imei, servicos?: ('fmi' | 'blacklist')[] }
//   -> { imei, modelo, fmi?: { ativo }, blacklist?: { bloqueado } }
//   (ativo/bloqueado: true, false ou null quando o imei.info não respondeu claro)

import { createClient } from 'npm:@supabase/supabase-js@2'

const API = 'https://dash.imei.info'
const CACHE_MIN = 10
const LIMITE_DIA = 20
// A api-sync espera o resultado; se ainda vier 202, tenta mais algumas vezes.
const TENTATIVAS = 5
const ESPERA_MS = 3000

const PAGOS = ['pro', 'intermedium']
const SERVICOS = { fmi: 9, blacklist: 27 }
const chaveApi = Deno.env.get('IMEIINFO_API_KEY')

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const chaveServico =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? ''
const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', chaveServico, {
  auth: { persistSession: false, autoRefreshToken: false },
})

class ErroDoPedido extends Error {
  constructor(mensagem: string, public status = 400) {
    super(mensagem)
  }
}

// Luhn sobre os 15 dígitos (o mesmo da tela): barra erro de digitação antes de
// gastar uma consulta.
function imeiValido(imei: string) {
  if (!/^\d{15}$/.test(imei)) return false
  let soma = 0
  for (let i = 0; i < 15; i++) {
    let d = Number(imei[14 - i])
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    soma += d
  }
  return soma % 10 === 0
}

type Registro = { id?: number; status?: string; result?: Record<string, unknown> | null }

// GET /api-sync/check/<serviço>/: com 200 o resultado já vem; com 202 ainda
// está processando e sai em /api/search_history/<id>/.
async function consultarImeiInfo(servico: number, imei: string): Promise<Record<string, unknown>> {
  const url = new URL(`${API}/api-sync/check/${servico}/`)
  url.searchParams.set('API_KEY', chaveApi ?? '')
  url.searchParams.set('imei', imei)
  let resposta = await fetch(url)
  for (let i = 0; resposta.status === 202 && i < TENTATIVAS; i++) {
    const { id } = (await resposta.json()) as Registro
    await new Promise((r) => setTimeout(r, ESPERA_MS))
    resposta = await fetch(`${API}/api/search_history/${id}/?API_KEY=${encodeURIComponent(chaveApi ?? '')}`)
  }
  if (resposta.status === 402) throw new Error('imei.info sem saldo (402).')
  if (resposta.status === 422) throw new ErroDoPedido('O imei.info recusou esse IMEI. Confira o número.')
  if (!resposta.ok) throw new Error(`imei.info respondeu ${resposta.status}: ${await resposta.text()}`)

  const registro = (await resposta.json()) as Registro
  if (registro.status === 'In_progress') throw new ErroDoPedido('A consulta está demorando. Tente de novo em instantes.', 504)
  if (registro.status === 'Rejected' || registro.status === 'Refunded' || !registro.result) {
    throw new ErroDoPedido('O imei.info não conseguiu consultar esse IMEI (não foi cobrado).', 502)
  }
  return registro.result
}

const texto = (valor: unknown) => String(valor ?? '').trim().toLowerCase()

// FMI: o imei.info manda { findmy: "on" | "off", fmi_active: true | false }.
function lerFmi(resultado: Record<string, unknown>) {
  if (typeof resultado.fmi_active === 'boolean') return { ativo: resultado.fmi_active }
  const findmy = texto(resultado.findmy)
  return { ativo: findmy === 'on' ? true : findmy === 'off' ? false : null }
}

// Blacklist: procura um campo com "blacklist" no nome e lê o valor ("clean",
// "blacklisted", true/false...). Sem campo reconhecível, devolve null e a tela
// mostra "não foi possível confirmar".
function lerBlacklist(resultado: Record<string, unknown>) {
  for (const [campo, valor] of Object.entries(resultado)) {
    if (!campo.toLowerCase().includes('blacklist')) continue
    if (typeof valor === 'boolean') return { bloqueado: valor }
    const v = texto(valor)
    if (/clean|limpo|^no$|not blacklisted|false/.test(v)) return { bloqueado: false }
    if (/blacklist|blocked|lost|stolen|^yes$|true/.test(v)) return { bloqueado: true }
  }
  return { bloqueado: null }
}

async function consultar(uid: string, imei: string, servico: 'fmi' | 'blacklist') {
  const desde = new Date(Date.now() - CACHE_MIN * 60_000).toISOString()
  const { data: cache } = await admin
    .from('consultas_imei')
    .select('resultado')
    .eq('imei', imei)
    .eq('servico', servico)
    .gte('created_at', desde)
    .not('resultado', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let resultado = cache?.resultado as Record<string, unknown> | undefined
  if (resultado) {
    await admin.from('consultas_imei').insert({ user_id: uid, imei, servico, resultado, cobrada: false })
  } else {
    resultado = await consultarImeiInfo(SERVICOS[servico], imei)
    await admin.from('consultas_imei').insert({ user_id: uid, imei, servico, resultado, cobrada: true })
  }
  return resultado
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return responder({ erro: 'Método não permitido.' }, 405)
  if (!chaveApi || !chaveServico) {
    return responder({ erro: 'Função não configurada: falta o secret IMEIINFO_API_KEY.' }, 500)
  }

  // verify_jwt já barrou quem não mandou um JWT válido; aqui pega quem é.
  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
  const { data, error } = await admin.auth.getClaims(token)
  const uid = data?.claims?.sub
  if (error || !uid || data.claims.role !== 'authenticated') return responder({ erro: 'Faça login.' }, 401)

  try {
    const corpo = await req.json().catch(() => ({}))
    const imei = String(corpo?.imei ?? '')
    if (!imeiValido(imei)) throw new ErroDoPedido('Esse número não é um IMEI válido.')
    const pedidos = Array.isArray(corpo?.servicos) ? corpo.servicos : ['fmi', 'blacklist']
    const servicos = (['fmi', 'blacklist'] as const).filter((s) => pedidos.includes(s))
    if (servicos.length === 0) throw new ErroDoPedido('Escolha ao menos uma consulta.')

    const { data: preferencias } = await admin.from('preferencias').select('plano').eq('user_id', uid).maybeSingle()
    if (!PAGOS.includes(preferencias?.plano ?? '')) {
      throw new ErroDoPedido('O Verificador de IMEI é dos planos Pro e Intermedium.', 403)
    }

    const { count } = await admin
      .from('consultas_imei')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('cobrada', true)
      .gte('created_at', new Date(Date.now() - 24 * 3600_000).toISOString())
    if ((count ?? 0) + servicos.length > LIMITE_DIA) {
      throw new ErroDoPedido(`Você chegou ao limite de ${LIMITE_DIA} consultas por dia. Tente amanhã.`, 429)
    }

    const resultados = await Promise.all(servicos.map((s) => consultar(uid, imei, s)))
    const resposta: Record<string, unknown> = { imei, modelo: null }
    servicos.forEach((servico, i) => {
      const r = resultados[i]
      resposta.modelo ??= r.model ?? r.brand_name ?? null
      resposta[servico] = servico === 'fmi' ? lerFmi(r) : lerBlacklist(r)
    })
    return responder(resposta)
  } catch (erro) {
    if (erro instanceof ErroDoPedido) return responder({ erro: erro.message }, erro.status)
    console.error(erro)
    return responder({ erro: 'Não foi possível consultar agora. Tente de novo em instantes.' }, 502)
  }
})
