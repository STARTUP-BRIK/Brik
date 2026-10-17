// Cancelar a assinatura (tela /perfil/assinatura). Remove a assinatura no Asaas,
// o que para as próximas cobranças, e marca como cancelada. O plano continua
// até o fim do período já pago (assinaturas.pago_ate); depois o pg_cron
// (private.encerrar_assinaturas_vencidas) passa para o Free. Sem período pago
// (nunca pagou ou já venceu), volta para o Free na hora.
// O aviso SUBSCRIPTION_DELETED que o Asaas manda em seguida chega ao
// asaas-webhook e dá no mesmo.
//
// Secret: ASAAS_API_KEY (o ambiente sai da chave, como no asaas-checkout).
//
// POST -> { status: 'cancelada', pago_ate, plano }

import { createClient } from 'npm:@supabase/supabase-js@2'

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

// Data de hoje em Brasília (YYYY-MM-DD).
const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return responder({ erro: 'Método não permitido.' }, 405)
  if (!apiKey || !chaveServico) return responder({ erro: 'Função não configurada: falta o secret ASAAS_API_KEY.' }, 500)

  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
  const { data, error } = await admin.auth.getClaims(token)
  const uid = data?.claims?.sub
  if (error || !uid || data.claims.role !== 'authenticated') return responder({ erro: 'Faça login.' }, 401)

  const { data: assinatura } = await admin
    .from('assinaturas')
    .select('asaas_subscription_id, status, pago_ate, cancelada_em')
    .eq('user_id', uid)
    .maybeSingle()
  if (!assinatura?.asaas_subscription_id) return responder({ erro: 'Você não tem uma assinatura.' }, 404)
  if (assinatura.status === 'cancelada') return responder({ erro: 'Sua assinatura já está cancelada.' }, 409)

  try {
    const resposta = await fetch(`${apiUrl}/subscriptions/${assinatura.asaas_subscription_id}`, {
      method: 'DELETE',
      headers: { access_token: apiKey, 'User-Agent': 'Brik' },
    })
    // 404: o Asaas já não tem essa assinatura (removida no painel); só falta marcar aqui.
    if (!resposta.ok && resposta.status !== 404) {
      throw new Error(`Asaas DELETE respondeu ${resposta.status}: ${await resposta.text()}`)
    }

    const agora = new Date().toISOString()
    const { error: erroGravar } = await admin
      .from('assinaturas')
      .update({ status: 'cancelada', cancelada_em: assinatura.cancelada_em ?? agora, updated_at: agora })
      .eq('user_id', uid)
    if (erroGravar) throw erroGravar

    const noPeriodoPago = Boolean(assinatura.pago_ate && assinatura.pago_ate >= hoje())
    if (!noPeriodoPago) {
      const { error: erroPlano } = await admin.from('preferencias').update({ plano: 'gratis' }).eq('user_id', uid)
      if (erroPlano) throw erroPlano
    }
    return responder({ status: 'cancelada', pago_ate: noPeriodoPago ? assinatura.pago_ate : null, plano: noPeriodoPago ? null : 'gratis' })
  } catch (erro) {
    console.error(erro)
    return responder({ erro: 'Não foi possível cancelar agora. Tente de novo em instantes.' }, 502)
  }
})
