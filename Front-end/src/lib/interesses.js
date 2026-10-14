import { MODELOS, idsDaCategoria } from '../config/modelos.js'
import { supabase } from './supabase.js'

// Modelos de que a pessoa quer ser avisada, em public.interesses_notificacao
// (uma linha por pessoa e modelo; ids de config/modelos.js). Quem grava: o fim
// do onboarding e a tela de Notificações (via lib/sincronizarConta.js). Quem lê
// para avisar: o worker/notificador, com a service role.

// id do modelo -> categoria ('iphone-13-pro' -> 'iphone').
const CATEGORIA_DO_MODELO = new Map(
  Object.keys(MODELOS).flatMap((categoria) => idsDaCategoria(categoria).map((id) => [id, categoria])),
)

export async function carregarInteresses(userId) {
  const { data, error } = await supabase.from('interesses_notificacao').select('modelo').eq('user_id', userId)
  if (error) throw error
  return data.map((linha) => linha.modelo)
}

// Deixa o banco igual à lista: apaga os modelos que saíram e inclui os novos
// (os que já estavam ficam como estão). Ids fora de config/modelos.js são ignorados.
export async function salvarInteresses(userId, modelos) {
  const validos = [...new Set(modelos)].filter((id) => CATEGORIA_DO_MODELO.has(id))

  let apagar = supabase.from('interesses_notificacao').delete().eq('user_id', userId)
  if (validos.length) apagar = apagar.not('modelo', 'in', `(${validos.join(',')})`)
  const { error: erroApagar } = await apagar
  if (erroApagar) throw erroApagar

  if (!validos.length) return
  const { error: erroIncluir } = await supabase
    .from('interesses_notificacao')
    .upsert(
      validos.map((modelo) => ({ user_id: userId, modelo, categoria: CATEGORIA_DO_MODELO.get(modelo) })),
      { onConflict: 'user_id,modelo', ignoreDuplicates: true },
    )
  if (erroIncluir) throw erroIncluir
}
