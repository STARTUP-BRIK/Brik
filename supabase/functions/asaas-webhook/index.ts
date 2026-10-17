// Avisos do Asaas (cadastrado no painel em Integrações → Webhooks). O Asaas manda
// o token combinado no header asaas-access-token; tem que bater com o secret
// ASAAS_WEBHOOK_TOKEN. verify_jwt fica desligado (o Asaas não tem JWT).
//
// Só vale a assinatura que está em public.assinaturas: aviso de outra (uma
// antiga, trocada ou cancelada) é ignorado.
//   PAYMENT_CONFIRMED / PAYMENT_RECEIVED -> plano pago; pago_ate = vencimento + ciclo
//   PAYMENT_OVERDUE                      -> atrasada
//   SUBSCRIPTION_DELETED / _INACTIVATED  -> cancelada
// Atrasada ou cancelada, a pessoa segue no plano até pago_ate; depois disso o
// pg_cron (private.encerrar_assinaturas_vencidas) passa para o Free.
// Responde 200 mesmo quando ignora: com erro, o Asaas pausa a fila de avisos.

import { createClient } from 'npm:@supabase/supabase-js@2'

const tokenWebhook = Deno.env.get('ASAAS_WEBHOOK_TOKEN')

const chaveServico =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? ''
const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', chaveServico, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const ok = () => new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })

// O token é comparado em tempo constante.
function tokenConfere(recebido: string) {
  if (!tokenWebhook || recebido.length !== tokenWebhook.length) return false
  let diferenca = 0
  for (let i = 0; i < recebido.length; i++) diferenca |= recebido.charCodeAt(i) ^ tokenWebhook.charCodeAt(i)
  return diferenca === 0
}

// Data de hoje em Brasília (YYYY-MM-DD).
const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

// Fim do período que uma cobrança paga cobre: o vencimento dela mais o ciclo.
function fimDoPeriodo(vencimento: string, ciclo: string) {
  const data = new Date(`${vencimento}T12:00:00Z`)
  if (ciclo === 'WEEKLY') data.setUTCDate(data.getUTCDate() + 7)
  else if (ciclo === 'YEARLY') data.setUTCFullYear(data.getUTCFullYear() + 1)
  else data.setUTCMonth(data.getUTCMonth() + 1)
  return data.toISOString().slice(0, 10)
}

async function mudarPlano(uid: string, plano: string) {
  const { data } = await admin.from('preferencias').update({ plano }).eq('user_id', uid).select('user_id')
  if (!data?.length) {
    const { error } = await admin.from('preferencias').insert({ user_id: uid, plano })
    if (error) throw error
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Método não permitido.', { status: 405 })
  const recebido = req.headers.get('asaas-access-token') ?? ''
  if (!tokenConfere(recebido)) {
    console.error(
      !tokenWebhook
        ? 'Aviso recusado: o secret ASAAS_WEBHOOK_TOKEN não existe.'
        : `Aviso recusado: token diferente (${recebido ? `${recebido.length} caracteres, esperado ${tokenWebhook.length}` : 'Asaas não mandou token'}).`,
    )
    return new Response('Token inválido.', { status: 401 })
  }

  const evento = await req.json().catch(() => null)
  const tipo = String(evento?.event ?? '')
  const idAssinatura = evento?.payment?.subscription ?? evento?.subscription?.id
  if (!idAssinatura) {
    console.log(`Ignorado: ${tipo || 'aviso ilegível ou sem evento'} sem assinatura.`)
    return ok()
  }

  const { data: assinatura } = await admin
    .from('assinaturas')
    .select('user_id, plano, ciclo, pago_ate, cancelada_em')
    .eq('asaas_subscription_id', idAssinatura)
    .maybeSingle()
  if (!assinatura) {
    console.log(`Ignorado: ${tipo} da assinatura ${idAssinatura}, que não é a atual de ninguém.`)
    return ok()
  }

  const agora = new Date().toISOString()
  let mudanca: Record<string, unknown>
  let plano: string | null
  if (tipo === 'PAYMENT_CONFIRMED' || tipo === 'PAYMENT_RECEIVED') {
    const fim = fimDoPeriodo(evento?.payment?.dueDate ?? hoje(), assinatura.ciclo)
    // Só avança: um aviso repetido de uma cobrança antiga não encurta o período.
    const pagoAte = assinatura.pago_ate && assinatura.pago_ate > fim ? assinatura.pago_ate : fim
    mudanca = { status: 'ativa', pago_ate: pagoAte, cancelada_em: null }
    plano = assinatura.plano
  } else if (tipo === 'PAYMENT_OVERDUE' || tipo === 'SUBSCRIPTION_DELETED' || tipo === 'SUBSCRIPTION_INACTIVATED') {
    const cancelada = tipo !== 'PAYMENT_OVERDUE'
    mudanca = cancelada ? { status: 'cancelada', cancelada_em: assinatura.cancelada_em ?? agora } : { status: 'atrasada' }
    // Ainda dentro do período pago: o plano fica até lá (o pg_cron tira depois).
    plano = assinatura.pago_ate && assinatura.pago_ate >= hoje() ? null : 'gratis'
  } else {
    console.log(`Ignorado: evento ${tipo} não muda o plano.`)
    return ok()
  }
  console.log(`${tipo} da assinatura ${idAssinatura}: ${JSON.stringify(mudanca)}, plano ${plano ?? 'mantido'}.`)

  try {
    if (plano) await mudarPlano(assinatura.user_id, plano)
    const { error } = await admin
      .from('assinaturas')
      .update({ ...mudanca, updated_at: agora })
      .eq('user_id', assinatura.user_id)
    if (error) throw error
  } catch (erro) {
    // Aqui sim devolve erro: o Asaas tenta de novo depois.
    console.error(erro)
    return new Response('Falha ao gravar.', { status: 500 })
  }
  return ok()
})
