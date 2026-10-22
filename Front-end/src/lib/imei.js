import { supabase } from './supabase.js'

// Verificar IMEI pela Edge Function "consultar-imei" (supabase/functions/
// consultar-imei): ela tem a chave do imei.info, confere o plano e o limite do
// dia. Devolve { imei, modelo, fmi: { ativo }, blacklist: { bloqueado } }, com
// ativo/bloqueado true, false ou null (não deu para confirmar).
export async function consultarImei(imei) {
  const { data, error } = await supabase.functions.invoke('consultar-imei', { body: { imei } })
  if (error) {
    // A função responde { erro } nos casos que ela mesma recusa.
    const detalhe = await error.context?.json?.().catch(() => null)
    throw new Error(detalhe?.erro ?? error.message)
  }
  return data
}
