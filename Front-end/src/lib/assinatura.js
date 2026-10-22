import { supabase } from './supabase.js'

// Assinatura pelo Asaas. As Edge Functions (supabase/functions/asaas-*) falam com
// o Asaas; o site só lê public.assinaturas (cada pessoa a sua, pela RLS).
//   asaas-checkout: cria a cobrança e devolve o link da fatura (Pix, cartão ou
//     boleto). O plano só muda quando o pagamento confirma (asaas-webhook).
//   asaas-cancelar: para as próximas cobranças; o plano fica até pago_ate.

// A função responde { erro } nos casos que ela mesma recusa.
async function chamar(funcao, body) {
  const { data, error } = await supabase.functions.invoke(funcao, { body })
  if (error) {
    const detalhe = await error.context?.json?.().catch(() => null)
    throw new Error(detalhe?.erro ?? error.message)
  }
  return data
}

// { plano, ciclo, status, pago_ate, cancelada_em } ou null (nunca assinou).
// status: 'pendente' | 'ativa' | 'atrasada' | 'cancelada'.
export async function minhaAssinatura() {
  const { data, error } = await supabase
    .from('assinaturas')
    .select('asaas_customer_id, plano, ciclo, status, pago_ate, cancelada_em')
    .maybeSingle()
  if (error) throw error
  return data
}

// Já tem cliente no Asaas? Então não precisa pedir o CPF de novo.
export async function temCadastroAsaas() {
  return Boolean((await minhaAssinatura())?.asaas_customer_id)
}

export async function linkDePagamento({ plano, anual, cpf }) {
  return (await chamar('asaas-checkout', { plano, anual, cpf })).url
}

// -> { status: 'cancelada', pago_ate, plano } (plano 'gratis' quando já não
// havia período pago para usar).
export function cancelarAssinatura() {
  return chamar('asaas-cancelar', {})
}
