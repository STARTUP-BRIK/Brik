import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Respostas do onboarding (pages/onboarding). Ele acontece antes de existir
// conta, então tudo fica no localStorage até a pessoa criar a conta (tela 19b);
// aí lib/salvarOnboarding.js leva para o banco. Os valores iniciais são as
// opções que o canvas do onboarding já traz marcadas.
export const RESPOSTAS_PADRAO = {
  // 01a
  nome: '',
  telefone: '',
  // 04: 'sozinho' | 'um' | 'dois' (2 a 4) | 'mais' (mais de 4)
  equipe: 'sozinho',
  // 05: 'm30' | 'h1' | 'h2' | 'h3' (ver TEMPO_BUSCA em pages/onboarding/fluxo.js)
  tempoBusca: 'h2',
  // 08: 'hora' | 'rapido' | 'quando' | 'lembro'
  tempoResposta: 'quando',
  // 10
  categorias: ['iphone', 'videogame_console'],
  // 11: 'sim' (eu conserto) | 'alguem' (alguém da equipe conserta) | 'nao'
  defeito: 'sim',
  // 11: em quais das categorias da 10 aceita aparelho com defeito
  conserta: ['iphone'],
  // 12: o CEP de onde a pessoa sai, o que ele dá (ponto, bairro, cidade e UF,
  // ver lib/cep.js) e o raio em km que ela topa andar.
  cep: '',
  lat: null,
  lng: null,
  bairro: '',
  cidade: '',
  uf: '',
  raio: 15,
  // 13: meta de lucro por mês, em reais
  meta: 2000,
  // 20: 'pro' | 'gratis'
  plano: 'pro',
}

export const useOnboardingStore = create(
  persist(
    (set) => ({
      ...RESPOSTAS_PADRAO,
      responder: (campos) => set(campos),
      limpar: () => set(RESPOSTAS_PADRAO),
    }),
    { name: 'brik-onboarding' },
  ),
)
