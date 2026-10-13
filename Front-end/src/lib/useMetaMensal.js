import { useEffect, useState } from 'react'
import { useUsuarioId } from '../stores/useAuthStore.js'
import { useOnboardingStore } from '../stores/useOnboardingStore.js'
import { usePreferenciasStore } from '../stores/usePreferenciasStore.js'
import { supabase } from './supabase.js'

// Meta de lucro do mês, escolhida no onboarding (tela 13). Vale a da conta
// (preferencias.meta_lucro_mensal); enquanto essa coluna não existe no banco
// (ver lib/salvarOnboarding.js), vale a guardada no aparelho (metaMensal das
// preferências). Na demonstração do onboarding, a resposta da tela 13.
// `salvarMeta`: troca a meta (o lápis do card). Muda na hora no aparelho e
// tenta gravar na conta; sem a coluna, fica só no aparelho.
export function useMetaMensal(exemplo) {
  const doOnboarding = useOnboardingStore((state) => state.meta)
  const doAparelho = usePreferenciasStore((state) => state.metaMensal)
  const local = exemplo ? doOnboarding : doAparelho
  const userId = useUsuarioId()
  const [daConta, setDaConta] = useState(null)

  useEffect(() => {
    if (exemplo || !userId || userId === 'carregando') return
    let ativo = true
    supabase
      .from('preferencias')
      .select('meta_lucro_mensal')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        // Sem a coluna (ou sem linha), fica a meta do aparelho.
        if (ativo && !error && data?.meta_lucro_mensal != null) setDaConta(Number(data.meta_lucro_mensal))
      })
    return () => {
      ativo = false
    }
  }, [exemplo, userId])

  async function salvarMeta(valor) {
    if (exemplo) return useOnboardingStore.getState().responder({ meta: valor })
    usePreferenciasStore.getState().setMetaMensal(valor)
    if (!userId || userId === 'carregando') return
    setDaConta(valor)
    const { error } = await supabase.from('preferencias').update({ meta_lucro_mensal: valor }).eq('user_id', userId)
    if (error) console.warn('Meta salva só neste aparelho:', error.message)
  }

  return { meta: (exemplo ? null : daConta) ?? local, salvarMeta }
}
