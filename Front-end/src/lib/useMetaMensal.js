import { useUsuarioId } from '../stores/useAuthStore.js'
import { useOnboardingStore } from '../stores/useOnboardingStore.js'
import { usePreferenciasStore } from '../stores/usePreferenciasStore.js'
import { chaveDoMes, comNovaMeta, metaDoMes } from './metas.js'
import { supabase } from './supabase.js'

// Meta de lucro do mês, escolhida no onboarding (tela 13). Fica em metaMensal
// das preferências, que o login preenche com a da conta
// (preferencias.meta_lucro_mensal, ver lib/sincronizarConta.js), e o histórico
// mês a mês em metasMensais (preferencias.metas_mensais). Na demonstração do
// onboarding, a resposta da tela 13.
// `salvarMeta`: troca a meta (o lápis) a partir deste mês, na hora no aparelho e na conta.
// `metaEm(data)`: a meta que valia no mês daquela data.
export function useMetaMensal(exemplo) {
  const doOnboarding = useOnboardingStore((state) => state.meta)
  const doAparelho = usePreferenciasStore((state) => state.metaMensal)
  const metas = usePreferenciasStore((state) => state.metasMensais)
  const userId = useUsuarioId()
  const meta = exemplo ? doOnboarding : doAparelho

  async function salvarMeta(valor) {
    if (exemplo) return useOnboardingStore.getState().responder({ meta: valor })
    const { metaMensal, metasMensais } = usePreferenciasStore.getState()
    const historico = comNovaMeta(metasMensais, metaMensal, valor)
    usePreferenciasStore.setState({ metaMensal: valor, metasMensais: historico })
    if (!userId || userId === 'carregando') return
    // Em duas idas: se a coluna do histórico ainda não existir no banco, a meta
    // atual continua sendo salva.
    const [atual, mensais] = await Promise.all([
      supabase.from('preferencias').update({ meta_lucro_mensal: valor }).eq('user_id', userId),
      supabase.from('preferencias').update({ metas_mensais: historico }).eq('user_id', userId),
    ])
    if (atual.error) console.error('Erro ao salvar a meta:', atual.error.message)
    if (mensais.error) console.warn('Histórico das metas não salvo na conta:', mensais.error.message)
  }

  const metaEm = (data) => (exemplo ? meta : metaDoMes(metas, meta, chaveDoMes(data)))

  return { meta, metaEm, salvarMeta }
}
