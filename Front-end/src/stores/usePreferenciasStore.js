import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CATEGORIAS, NIVEIS } from '../config/categorias.js'

// Ajustes do app: telas do Meu Perfil e filtros do Início. A fonte é a linha
// do usuário em public.configuracoes (lib/sincronizarConta.js carrega no login e
// grava a cada mudança); o localStorage guarda uma cópia, para a tela já abrir
// com os ajustes certos antes de o banco responder.

// Valores de quem ainda não mexeu em nada. É para eles que o app volta no logout.
export const PREFERENCIAS_PADRAO = {
  // Configurações > Aparência: o app inteiro no modo escuro (main.jsx aplica).
  modoEscuro: false,

  // Privacidade: o Dashboard já abre com os valores escondidos.
  ocultarValores: false,

  // Configurações: o que o Início mostra.
  categorias: CATEGORIAS.map((c) => c.value),
  nivelMinimo: 'boa',
  // false esconde de vez os aparelhos com defeito (o botão Filtros nem oferece).
  mostrarDefeito: true,

  // Início: filtro de raio. O feed mostra só os anúncios a até `raio` km de
  // `origem` ({ lat, lng, cidade, bairro }, o ponto de partida do onboarding;
  // sem lat/lng vale o centro da cidade). Os dois vêm de public.preferencias
  // (distancia_km, lat, lng, cidade; lib/sincronizarConta.js carrega e grava o
  // raio). null: sem ponto, o feed não filtra por distância.
  raio: 15,
  origem: null,

  // Início: botão Filtros. Quais selos aparecem (dentro do mínimo das
  // Configurações) e o máximo que a pessoa quer gastar (null = sem limite).
  niveis: NIVEIS.map((n) => n.value),
  precoMaximo: null,
  // Aparelhos com defeito: 'todos', 'sem' (só sem defeito) ou 'so' (só com).
  filtroDefeito: 'todos',
  // Data do anúncio (lib/postagem.js): ordem 'recentes' ou 'antigos' e período
  // ('todos', 'hoje', '3d', '7d', '30d'). Ficam só no aparelho (não vão para
  // public.configuracoes).
  ordem: 'recentes',
  periodo: 'todos',

  // Notificações. boa/otima/extraordinaria: e-mail por oportunidade daquele
  // nível (worker/notificacoes.js, mesmo padrão em NIVEIS_PADRAO; "bom negócio"
  // começa desligado por ser volume alto). Os outros ainda não são enviados.
  notificacoes: {
    boa: false,
    otima: true,
    extraordinaria: true,
    estoqueParado: false,
    novidades: false,
  },

  // Notificações: de quais modelos a pessoa quer ser avisada (ids de
  // config/modelos.js). Vem da tela de modelos do onboarding; na conta, fica em
  // public.interesses_notificacao (lib/sincronizarConta.js carrega e grava).
  modelosNotificacao: [],

  // Plano em que a pessoa está (config/planos.js; na conta, preferencias.plano).
  // Sem pagamento integrado, todo mundo está no Free; a assinatura, quando
  // existir, troca este valor.
  planoAtual: 'gratis',

  // Dashboard: meta de lucro do mês, em reais. Vem do onboarding (tela 13) e o
  // lápis do card troca. Na conta, preferencias.meta_lucro_mensal (ver
  // lib/useMetaMensal.js).
  metaMensal: 2000,

  // Passos para seu primeiro Brique: índices dos passos marcados.
  passosFeitos: [],
}

export const usePreferenciasStore = create(
  persist(
    (set) => ({
      ...PREFERENCIAS_PADRAO,

      resetar: () => set(PREFERENCIAS_PADRAO),
      setModoEscuro: (modoEscuro) => set({ modoEscuro }),
      setOcultarValores: (ocultarValores) => set({ ocultarValores }),
      setNivelMinimo: (nivelMinimo) => set({ nivelMinimo }),
      setRaio: (raio) => set({ raio }),
      setNiveis: (niveis) => set({ niveis }),
      setPrecoMaximo: (precoMaximo) => set({ precoMaximo }),
      setMostrarDefeito: (mostrarDefeito) => set({ mostrarDefeito }),
      setFiltroDefeito: (filtroDefeito) => set({ filtroDefeito }),
      setOrdem: (ordem) => set({ ordem }),
      setPeriodo: (periodo) => set({ periodo }),
      setModelosNotificacao: (modelosNotificacao) => set({ modelosNotificacao }),
      setMetaMensal: (metaMensal) => set({ metaMensal }),
      // Pelo menos uma categoria fica ligada, senão o Início ficaria sempre vazio.
      alternarCategoria: (value) =>
        set(({ categorias }) => {
          if (!categorias.includes(value)) return { categorias: [...categorias, value] }
          return categorias.length > 1 ? { categorias: categorias.filter((c) => c !== value) } : {}
        }),
      setNotificacao: (key, ligada) =>
        set(({ notificacoes }) => ({ notificacoes: { ...notificacoes, [key]: ligada } })),
      alternarPasso: (indice) =>
        set(({ passosFeitos }) => ({
          passosFeitos: passosFeitos.includes(indice)
            ? passosFeitos.filter((i) => i !== indice)
            : [...passosFeitos, indice],
        })),
    }),
    { name: 'brik-preferencias' },
  ),
)
