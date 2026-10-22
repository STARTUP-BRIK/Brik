// Apaga a conta de quem está logado. O site não pode fazer isso sozinho (precisa
// da chave de serviço do Supabase), então passa por aqui:
//   1. apaga as fotos da pessoa no R2 (pasta <user_id>/ dos buckets);
//   2. remove a assinatura no Asaas, se houver, para não cobrar quem saiu;
//   3. apaga o usuário em auth.users. As tabelas do public (profiles,
//      preferencias, estoque, salvos, calculos, configuracoes, interesses_notificacao,
//      notificacoes_enviadas, consultas_imei, assinaturas) têm FK com ON DELETE
//      CASCADE e somem junto.
// Secrets: os mesmos R2_* da função "r2" e o ASAAS_API_KEY (o ambiente sai da
// chave, como no asaas-checkout). A chave de serviço o Supabase já injeta.
//
// POST JSON { confirmar: true } -> { ok: true }

import { createClient } from 'npm:@supabase/supabase-js@2'
import { AwsClient } from 'npm:aws4fetch@1.0.20'

const BUCKETS = ['brik-estoque', 'brik-avatars']

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const conta = Deno.env.get('R2_ACCOUNT_ID')
const chaveId = Deno.env.get('R2_ACCESS_KEY_ID')
const segredo = Deno.env.get('R2_SECRET_ACCESS_KEY')
const r2 = new AwsClient({ accessKeyId: chaveId ?? '', secretAccessKey: segredo ?? '', service: 's3', region: 'auto' })

const chaveServico =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? ''
const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', chaveServico, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const asaasKey = Deno.env.get('ASAAS_API_KEY')
const asaasUrl =
  Deno.env.get('ASAAS_API_URL') ||
  (asaasKey?.startsWith('$aact_hmlg_') ? 'https://api-sandbox.asaas.com/v3' : 'https://api.asaas.com/v3')

// Remove a assinatura no Asaas. Se falhar, a conta não é apagada: melhor tentar
// de novo do que apagar e o Asaas seguir cobrando.
async function cancelarAssinatura(uid: string) {
  const { data } = await admin
    .from('assinaturas')
    .select('asaas_subscription_id, status')
    .eq('user_id', uid)
    .maybeSingle()
  if (!data?.asaas_subscription_id || data.status === 'cancelada') return
  if (!asaasKey) throw new Error('Falta o secret ASAAS_API_KEY para cancelar a assinatura.')
  const resposta = await fetch(`${asaasUrl}/subscriptions/${data.asaas_subscription_id}`, {
    method: 'DELETE',
    headers: { access_token: asaasKey, 'User-Agent': 'Brik' },
  })
  if (!resposta.ok && resposta.status !== 404) {
    throw new Error(`Asaas DELETE respondeu ${resposta.status}: ${await resposta.text()}`)
  }
}

const desescapar = (texto: string) =>
  texto.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')

// Lista as chaves de <bucket>/<uid>/ (ListObjectsV2, 1000 por página).
async function listar(bucket: string, uid: string) {
  const chaves: string[] = []
  let continuacao = ''
  do {
    const url = new URL(`https://${conta}.r2.cloudflarestorage.com/${bucket}`)
    url.searchParams.set('list-type', '2')
    url.searchParams.set('prefix', `${uid}/`)
    if (continuacao) url.searchParams.set('continuation-token', continuacao)
    const resposta = await r2.fetch(url.toString())
    if (!resposta.ok) throw new Error(`R2 recusou listar (${resposta.status}): ${await resposta.text()}`)
    const xml = await resposta.text()
    for (const [, chave] of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) chaves.push(desescapar(chave))
    continuacao = /<IsTruncated>true<\/IsTruncated>/.test(xml)
      ? desescapar(xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)?.[1] ?? '')
      : ''
  } while (continuacao)
  return chaves
}

async function apagarFotos(uid: string) {
  for (const bucket of BUCKETS) {
    const chaves = await listar(bucket, uid)
    await Promise.all(
      chaves.map(async (chave) => {
        const url = `https://${conta}.r2.cloudflarestorage.com/${bucket}/${chave.split('/').map(encodeURIComponent).join('/')}`
        const resposta = await r2.fetch(url, { method: 'DELETE' })
        if (!resposta.ok && resposta.status !== 404) throw new Error(`R2 recusou apagar (${resposta.status})`)
      }),
    )
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return responder({ erro: 'Método não permitido.' }, 405)
  if (!conta || !chaveId || !segredo || !chaveServico) {
    return responder({ erro: 'Função não configurada: faltam secrets do R2 ou a chave de serviço.' }, 500)
  }

  // verify_jwt já barrou quem não mandou um JWT válido; aqui pega quem é.
  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
  const { data, error } = await admin.auth.getClaims(token)
  const uid = data?.claims?.sub
  if (error || !uid || data.claims.role !== 'authenticated') return responder({ erro: 'Faça login.' }, 401)

  const corpo = await req.json().catch(() => ({}))
  if (corpo?.confirmar !== true) return responder({ erro: 'Confirme que quer apagar a conta.' }, 400)

  try {
    // Fotos primeiro: se o R2 falhar, a conta continua e a pessoa pode tentar de novo.
    await apagarFotos(uid)
    await cancelarAssinatura(uid)
    const { error: erroAuth } = await admin.auth.admin.deleteUser(uid)
    if (erroAuth) throw erroAuth
    return responder({ ok: true })
  } catch (erro) {
    console.error(erro)
    return responder({ erro: 'Não foi possível apagar a conta agora. Tente de novo em instantes.' }, 502)
  }
})
