import { consertaValido } from '../pages/onboarding/fluxo.js'
import { useAuthStore } from '../stores/useAuthStore.js'
import { useOnboardingStore } from '../stores/useOnboardingStore.js'
import { usePreferenciasStore } from '../stores/usePreferenciasStore.js'
import { supabase } from './supabase.js'

// Categorias e defeito do radar viram as Configurações do Início (com conta, o
// sincronizarConta grava em public.configuracoes). Antes do feed real (15), para
// ele já abrir filtrado pelo radar, e de novo no fim.
export function aplicarRadar() {
  const r = useOnboardingStore.getState()
  usePreferenciasStore.setState({ categorias: r.categorias, mostrarDefeito: consertaValido(r).length > 0 })
}

// Leva as respostas do onboarding (guardadas no aparelho) para a conta, no fim
// do onboarding (tela 20). A linha em public.preferencias é o que marca o
// onboarding como feito (é ela que a RotaProtegida consulta).
//
// As respostas sem lugar nas tabelas de antes (equipe, tempos, conserto, meta
// e plano) vão numa gravação à parte: enquanto as colunas não existirem no
// banco, ela falha sozinha e o resto segue. SQL das colunas:
//   alter table public.preferencias
//     add column equipe text, add column tempo_busca text,
//     add column tempo_resposta text, add column conserta text[],
//     add column meta_lucro_mensal numeric, add column plano text,
//     add column cep text, add column lat double precision,
//     add column lng double precision;
export async function salvarOnboarding(user) {
  const r = useOnboardingStore.getState()
  const conserta = consertaValido(r)

  aplicarRadar()

  // Nome e WhatsApp da 01a. Quem entrou pelo Google já tem o nome de lá.
  const social = user.app_metadata?.provider && user.app_metadata.provider !== 'email'
  const telefone = r.telefone.replace(/\D/g, '')
  const perfil = {}
  if (!social && r.nome.trim()) perfil.nome = r.nome.trim()
  if (telefone) perfil.telefone = telefone
  if (Object.keys(perfil).length) {
    const { error } = await supabase.from('profiles').update(perfil).eq('id', user.id)
    if (error) console.error('Erro ao salvar nome e telefone:', error.message)
  }

  // A linha que conta como onboarding feito. O onboarding não pergunta
  // orçamento: vai vazio, ou 0 se a coluna não aceitar vazio.
  const linha = {
    user_id: user.id,
    cidade: r.cidade,
    distancia_km: r.raio,
    categoria: r.categorias.length === 1 ? r.categorias[0] : null,
  }
  let { error } = await supabase.from('preferencias').upsert({ ...linha, orcamento: null })
  if (error?.code === '23502') ({ error } = await supabase.from('preferencias').upsert({ ...linha, orcamento: 0 }))
  if (error) throw error

  const { error: extras } = await supabase
    .from('preferencias')
    .update({
      equipe: r.equipe,
      tempo_busca: r.tempoBusca,
      tempo_resposta: r.tempoResposta,
      conserta,
      meta_lucro_mensal: r.meta,
      plano: r.plano,
      cep: r.cep || null,
      // No banco, ~100 m (3 casas) bastam para o raio.
      lat: r.lat == null ? null : Math.round(r.lat * 1000) / 1000,
      lng: r.lng == null ? null : Math.round(r.lng * 1000) / 1000,
    })
    .eq('user_id', user.id)
  if (extras) console.warn('Respostas do onboarding ainda sem coluna no banco:', extras.message)

  useAuthStore.setState({ quizRespondido: true })
}
