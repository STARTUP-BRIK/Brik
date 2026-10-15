import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// Feed de ofertas. Vem da função ofertas_feed() do banco, que já filtra pelo
// plano de quem chama (config/planos.js) e traz a média de mercado
// (market_price, de media_precos_mercado; null com menos de 3 amostras). A
// tabela anuncios_ativos não é lida direto: o plano vale no servidor.
export const useOpportunitiesStore = create((set) => ({
  items: [],
  loading: false,

  fetchOpportunities: async () => {
    set({ loading: true })

    const { data, error } = await supabase.rpc('ofertas_feed')

    if (error) {
      console.error('Erro ao buscar oportunidades:', error.message)
      set({ items: [], loading: false })
      return
    }

    set({ items: data, loading: false })
  },
}))
