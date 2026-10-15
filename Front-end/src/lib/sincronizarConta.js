import { useAuthStore } from '../stores/useAuthStore.js'
import { PREFERENCIAS_PADRAO, usePreferenciasStore } from '../stores/usePreferenciasStore.js'
import { useSalvosStore } from '../stores/useSalvosStore.js'
import { carregarInteresses, salvarInteresses } from './interesses.js'
import { supabase } from './supabase.js'

// Liga os dados do usuário ao banco conforme a sessão muda (importado em
// main.jsx). No login: carrega os ajustes (public.configuracoes), os salvos e o
// que veio do onboarding: os modelos de que a pessoa quer ser avisada
// (public.interesses_notificacao), a meta e o plano (public.preferencias).
// Depois, cada mudança de ajuste e de modelos é gravada. No logout: volta tudo
// ao padrão, para a próxima conta neste navegador não herdar nada.

// Campo do store -> coluna de public.configuracoes.
const COLUNAS = {
  modoEscuro: 'modo_escuro',
  ocultarValores: 'ocultar_valores',
  categorias: 'categorias',
  nivelMinimo: 'nivel_minimo',
  mostrarDefeito: 'mostrar_defeito',
  cidade: 'cidade',
  niveis: 'niveis',
  precoMaximo: 'preco_maximo',
  filtroDefeito: 'filtro_defeito',
  notificacoes: 'notificacoes',
  passosFeitos: 'passos_feitos',
}

const paraLinha = (estado) => Object.fromEntries(Object.entries(COLUNAS).map(([campo, col]) => [col, estado[campo]]))

function paraEstado(linha) {
  const estado = Object.fromEntries(Object.entries(COLUNAS).map(([campo, col]) => [campo, linha[col]]))
  // numeric chega como string; notificações novas ganham o padrão.
  estado.precoMaximo = linha.preco_maximo == null ? null : Number(linha.preco_maximo)
  estado.notificacoes = { ...PREFERENCIAS_PADRAO.notificacoes, ...linha.notificacoes }
  return estado
}

let usuario = null
// O que está no banco, para só gravar quando algo mudou de fato.
let gravado = null
// Enquanto aplica o que veio do banco, a mudança no store não volta para ele.
let aplicandoDoBanco = false
let timer = null

async function gravar() {
  const linha = paraLinha(usePreferenciasStore.getState())
  const texto = JSON.stringify(linha)
  if (!usuario || texto === gravado) return
  const { error } = await supabase.from('configuracoes').upsert({ user_id: usuario, ...linha })
  if (error) console.error('Erro ao salvar as configurações:', error.message)
  else gravado = texto
}

async function carregarConfiguracoes(userId) {
  const { data, error } = await supabase.from('configuracoes').select('*').eq('user_id', userId).maybeSingle()
  if (usuario !== userId) return
  if (error) {
    console.error('Erro ao carregar as configurações:', error.message)
    return
  }
  if (!data) {
    // Primeira vez com a tabela: leva o que já estava neste navegador.
    gravar()
    return
  }
  aplicandoDoBanco = true
  usePreferenciasStore.setState(paraEstado(data))
  aplicandoDoBanco = false
  gravado = JSON.stringify(paraLinha(usePreferenciasStore.getState()))
}

// --- Modelos de interesse, meta e plano (do onboarding) ------------------------

// Os modelos que estão no banco (lista ordenada, em texto), para só gravar
// quando a lista mudou de fato. null enquanto não carregou.
let interessesGravados = null
let timerInteresses = null
const chaveModelos = (lista) => JSON.stringify([...lista].sort())

async function gravarInteresses() {
  const modelos = usePreferenciasStore.getState().modelosNotificacao
  const chave = chaveModelos(modelos)
  if (!usuario || chave === interessesGravados) return
  const userId = usuario
  try {
    await salvarInteresses(userId, modelos)
    if (usuario === userId) interessesGravados = chave
  } catch (error) {
    console.error('Erro ao salvar os modelos das notificações:', error.message)
  }
}

async function carregarDoOnboarding(userId) {
  const [prefs, metas, modelos] = await Promise.all([
    supabase.from('preferencias').select('meta_lucro_mensal, plano').eq('user_id', userId).maybeSingle(),
    // À parte: se a coluna do histórico ainda não existir, a meta e o plano carregam igual.
    supabase.from('preferencias').select('metas_mensais').eq('user_id', userId).maybeSingle(),
    carregarInteresses(userId).catch((error) => {
      console.error('Erro ao carregar os modelos das notificações:', error.message)
      return null
    }),
  ])
  if (usuario !== userId) return

  const estado = {}
  if (prefs.error) console.error('Erro ao carregar a meta e o plano:', prefs.error.message)
  else if (prefs.data) {
    // A conta manda: sem meta nela, o dashboard pede uma (e não fica um valor
    // antigo deste aparelho).
    estado.metaMensal = prefs.data.meta_lucro_mensal != null ? Number(prefs.data.meta_lucro_mensal) : null
    if (prefs.data.plano) estado.planoAtual = prefs.data.plano
  }
  if (metas.data?.metas_mensais) estado.metasMensais = metas.data.metas_mensais
  if (modelos?.length) estado.modelosNotificacao = modelos
  aplicandoDoBanco = true
  usePreferenciasStore.setState(estado)
  aplicandoDoBanco = false

  if (modelos === null) return
  interessesGravados = chaveModelos(modelos)
  // Conta sem modelos no banco, mas com modelos neste aparelho (onboarding feito
  // antes de a tabela existir): leva os daqui.
  if (!modelos.length && usePreferenciasStore.getState().modelosNotificacao.length) gravarInteresses()
}

function aoMudarSessao({ session }) {
  const id = session?.user.id ?? null
  if (id === usuario) return
  const saiu = usuario !== null
  usuario = id
  gravado = null
  interessesGravados = null
  clearTimeout(timer)
  clearTimeout(timerInteresses)

  if (!id) {
    if (saiu) {
      aplicandoDoBanco = true
      usePreferenciasStore.getState().resetar()
      aplicandoDoBanco = false
      useSalvosStore.getState().limpar()
    }
    return
  }

  // Fora do callback do Auth: chamar o Supabase dentro dele trava o cliente.
  setTimeout(() => {
    carregarConfiguracoes(id)
    carregarDoOnboarding(id)
    useSalvosStore.getState().carregar()
  }, 0)
}

usePreferenciasStore.subscribe((estado, anterior) => {
  if (aplicandoDoBanco || !usuario) return
  // Junta mudanças seguidas (arrastar a régua de preço, marcar vários modelos).
  if (gravado !== null) {
    clearTimeout(timer)
    timer = setTimeout(gravar, 600)
  }
  if (interessesGravados !== null && estado.modelosNotificacao !== anterior.modelosNotificacao) {
    clearTimeout(timerInteresses)
    timerInteresses = setTimeout(gravarInteresses, 600)
  }
})

aoMudarSessao(useAuthStore.getState())
useAuthStore.subscribe(aoMudarSessao)
