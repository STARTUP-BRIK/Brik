import { useUsuarioId } from '../stores/useAuthStore.js'
import { useOnboardingStore } from '../stores/useOnboardingStore.js'
import { usePreferenciasStore } from '../stores/usePreferenciasStore.js'
import { supabase } from './supabase.js'

// Meta de lucro do mês, escolhida no onboarding (tela 13). Fica em metaMensal
// das preferências, que o login preenche com a da conta
// (preferencias.meta_lucro_mensal, ver lib/sincronizarConta.js). Na
// demonstração do onboarding, a resposta da tela 13.
// `salvarMeta`: troca a meta (o lápis do card), na hora no aparelho e na conta.
export function useMetaMensal(exemplo) {
  const doOnboarding = useOnboardingStore((state) => state.meta)
  const doAparelho = usePreferenciasStore((state) => state.metaMensal)
  const userId = useUsuarioId()

  async function salvarMeta(valor) {
    if (exemplo) return useOnboardingStore.getState().responder({ meta: valor })
    usePreferenciasStore.getState().setMetaMensal(valor)
    if (!userId || userId === 'carregando') return
    const { error } = await supabase.from('preferencias').update({ meta_lucro_mensal: valor }).eq('user_id', userId)
    if (error) console.error('Erro ao salvar a meta:', error.message)
  }

  return { meta: exemplo ? doOnboarding : doAparelho, salvarMeta }
}
