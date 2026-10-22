// Assinar um plano (tela /planos). Cria o cliente e a assinatura no Asaas e
// devolve o link da 1ª fatura, onde a pessoa escolhe Pix, cartão ou boleto
// (billingType UNDEFINED). Quem libera o plano é o asaas-webhook, quando o
// pagamento confirma; aqui o plano não muda.
//
// Secret: ASAAS_API_KEY. O ambiente sai da própria chave: $aact_hmlg_ é do
// sandbox, o resto da conta real. ASAAS_API_URL, se existir, tem prioridade.
//
// Os preços ficam aqui, não no front: a tela só mostra (config/planos.js do
// site). Mudou o preço? Mudar nos dois.
//
// POST JSON { plano: 'pro' | 'intermedium', anual?: boolean, cpf?: string }
//   -> { url }  (cpf é obrigatório só na 1ª assinatura, para criar o cliente)

import { createClient } from 'npm:@supabase/supabase-js@2'

const PRECOS: Record<string, { ciclo: string; valor: number; nome: string }> = {
  'pro:mensal': { ciclo: 'MONTHLY', valor: 37.9, nome: 'Brik Pro (mensal)' },
  'pro:anual': { ciclo: 'YEARLY', valor: 439.9, nome: 'Brik Pro (anual)' },
  'intermedium:mensal': { ciclo: 'WEEKLY', valor: 23.9, nome: 'Brik Intermedium (semanal)' },
}

const apiKey = Deno.env.get('ASAAS_API_KEY')
const apiUrl =
  Deno.env.get('ASAAS_API_URL') ||
  (apiKey?.startsWith('$aact_hmlg_') ? 'https://api-sandbox.asaas.com/v3' : 'https://api.asaas.com/v3')

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

function cpfValido(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false
  for (const n of [9, 10]) {
    let soma = 0
    for (let i = 0; i < n; i++) soma += Number(cpf[i]) * (n + 1 - i)
    if (((soma * 10) % 11) % 10 !== Number(cpf[n])) return false
  }
  return true
}

async function asaas(metodo: string, caminho: string, corpo?: unknown) {
  const resposta = await fetch(`${apiUrl}${caminho}`, {
    method: metodo,
    headers: { access_token: apiKey ?? '', 'Content-Type': 'application/json', 'User-Agent': 'Brik' },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    const descricao = dados?.errors?.[0]?.description
    if (resposta.status === 400 && descricao) throw new ErroDoPedido(descricao)
    // Chave de um ambiente e URL do outro: diz quais, sem mostrar a chave
    // ($aact_prod_ = conta real, $aact_hmlg_ = sandbox).
    if (dados?.errors?.[0]?.code === 'invalid_environment') {
      throw new ErroDoPedido(`Chave e endereço do Asaas não combinam: URL ${apiUrl}, chave ${(apiKey ?? '').slice(0, 11)}…`, 500)
    }
    throw new Error(`Asaas ${metodo} ${caminho} respondeu ${resposta.status}: ${JSON.stringify(dados)}`)
  }
  return dados
}

// Data de hoje em Brasília (YYYY-MM-DD): a 1ª cobrança vence hoje.
const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return responder({ erro: 'Método não permitido.' }, 405)
  const faltando = [
    !apiKey && 'ASAAS_API_KEY',
    !chaveServico && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean)
  if (faltando.length) {
    const parecidos = Object.keys(Deno.env.toObject()).filter((nome) => /asa+s/i.test(nome))
    console.error('Secrets faltando:', faltando, 'nomes parecidos:', parecidos)
    return responder({ erro: `Função não configurada: falta ${faltando.join(', ')}. Parecidos: ${parecidos.join(', ') || 'nenhum'}.` }, 500)
  }

  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
  const { data, error } = await admin.auth.getClaims(token)
  const uid = data?.claims?.sub
  if (error || !uid || data.claims.role !== 'authenticated') return responder({ erro: 'Faça login.' }, 401)

  try {
    const corpo = await req.json().catch(() => ({}))
    const preco = PRECOS[`${corpo?.plano}:${corpo?.anual ? 'anual' : 'mensal'}`]
    if (!preco) throw new ErroDoPedido('Esse plano não está disponível.')

    const { data: atual } = await admin.from('assinaturas').select('*').eq('user_id', uid).maybeSingle()
    if (atual?.status === 'ativa' && atual.plano === corpo.plano && atual.ciclo === preco.ciclo) {
      throw new ErroDoPedido('Você já assina esse plano.', 409)
    }

    let cliente = atual?.asaas_customer_id as string | undefined
    if (!cliente) {
      const cpf = String(corpo?.cpf ?? '').replace(/\D/g, '')
      if (!cpfValido(cpf)) throw new ErroDoPedido('Informe um CPF válido.')
      const { data: usuario } = await admin.auth.admin.getUserById(uid)
      const email = usuario?.user?.email
      const nome = usuario?.user?.user_metadata?.full_name ?? usuario?.user?.user_metadata?.name ?? email ?? 'Cliente Brik'
      const novo = await asaas('POST', '/customers', { name: nome, cpfCnpj: cpf, email, externalReference: uid })
      cliente = novo.id as string
    }

    // Troca de plano ou nova tentativa: a assinatura anterior sai do Asaas. O
    // webhook ignora os avisos dela, porque só vale a que está na tabela.
    if (atual?.asaas_subscription_id) {
      await asaas('DELETE', `/subscriptions/${atual.asaas_subscription_id}`).catch((e) => console.error(e))
    }

    // Cancelou e voltou para o mesmo plano ainda no período pago: a 1ª cobrança
    // nova só vence quando esse período acaba, para não pagar duas vezes.
    const reativando =
      atual?.status === 'cancelada' &&
      atual.plano === corpo.plano &&
      atual.ciclo === preco.ciclo &&
      Boolean(atual.pago_ate && atual.pago_ate > hoje())

    const assinatura = await asaas('POST', '/subscriptions', {
      customer: cliente,
      billingType: 'UNDEFINED',
      value: preco.valor,
      nextDueDate: reativando ? atual.pago_ate : hoje(),
      cycle: preco.ciclo,
      description: preco.nome,
      externalReference: uid,
    })

    // Plano e status: a troca só vale quando o webhook confirmar o pagamento.
    // Até lá, quem já pagava segue com o plano em preferencias.
    const { error: erroGravar } = await admin.from('assinaturas').upsert({
      user_id: uid,
      asaas_customer_id: cliente,
      asaas_subscription_id: assinatura.id,
      plano: corpo.plano,
      ciclo: preco.ciclo,
      status: 'pendente',
      cancelada_em: null,
      updated_at: new Date().toISOString(),
    })
    if (erroGravar) throw erroGravar

    const cobrancas = await asaas('GET', `/subscriptions/${assinatura.id}/payments`)
    const url = cobrancas?.data?.[0]?.invoiceUrl
    if (!url) throw new Error(`Assinatura ${assinatura.id} sem fatura.`)
    return responder({ url })
  } catch (erro) {
    if (erro instanceof ErroDoPedido) return responder({ erro: erro.message }, erro.status)
    console.error(erro)
    return responder({ erro: 'Não foi possível iniciar o pagamento. Tente de novo em instantes.' }, 502)
  }
})
