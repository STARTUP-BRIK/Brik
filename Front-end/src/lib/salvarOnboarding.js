import { NIVEIS } from '../config/categorias.js'
import { consertaValido, modelosValidos } from '../pages/onboarding/fluxo.js'
import { useAuthStore } from '../stores/useAuthStore.js'
import { useOnboardingStore } from '../stores/useOnboardingStore.js'
import { usePreferenciasStore } from '../stores/usePreferenciasStore.js'
import { salvarInteresses } from './interesses.js'
import { supabase } from './supabase.js'

// Categorias e defeito do radar viram as Configurações do Início (com conta, o
// sincronizarConta grava em public.configuracoes). Antes do feed real (15), para
// ele já abrir filtrado pelo radar, e de novo no fim. Os modelos (10b) e a meta
// (13) vão junto, e o raio (12) com o ponto de partida, para o filtro de raio
// do Início: as respostas do onboarding são apagadas no fim, e é das
// preferências que as Notificações e o card da meta do Dashboard leem. Os
// níveis de oportunidade (10c) ligam ou desligam os e-mails de cada nível.
export function aplicarRadar() {
  const r = useOnboardingStore.getState()
  usePreferenciasStore.setState(({ notificacoes }) => ({
    categorias: r.categorias,
    mostrarDefeito: consertaValido(r).length > 0,
    modelosNotificacao: modelosValidos(r),
    metaMensal: r.meta,
    raio: r.raio,
    origem: r.lat != null || r.cidade ? { lat: r.lat, lng: r.lng, cidade: r.cidade, bairro: r.bairro } : null,
    notificacoes: {
      ...notificacoes,
      ...Object.fromEntries(NIVEIS.map(({ value }) => [value, r.niveisAlerta.includes(value)])),
    },
  }))
}

// Leva as respostas do onboarding (guardadas no aparelho) para a conta, no fim
// do onboarding (tela 20, "Começar no gratuito"). Primeiro os modelos de que a
// pessoa quer ser avisada (public.interesses_notificacao); depois a linha em
// public.preferencias, que é o que marca o onboarding como feito (é ela que a
// RotaProtegida consulta). Assim, se algo falhar no meio, o onboarding não fica
// dado como feito sem os modelos, e "Começar no gratuito" pode ser tentado de novo.
export async function salvarOnboarding(user) {
  const r = useOnboardingStore.getState()

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

  await salvarInteresses(user.id, modelosValidos(r))

  // O onboarding não pergunta orçamento (a coluna fica vazia).
  const { error } = await supabase.from('preferencias').upsert({
    user_id: user.id,
    cidade: r.cidade,
    distancia_km: r.raio,
    categoria: r.categorias.length === 1 ? r.categorias[0] : null,
    equipe: r.equipe,
    tempo_busca: r.tempoBusca,
    tempo_resposta: r.tempoResposta,
    conserta: consertaValido(r),
    meta_lucro_mensal: r.meta > 0 ? r.meta : null,
    // O plano não vai daqui: só o servidor grava preferencias.plano (conta nova
    // entra no Free, ver config/planos.js).
    cep: r.cep || null,
    // No banco, ~100 m (3 casas) bastam para o raio.
    lat: r.lat == null ? null : Math.round(r.lat * 1000) / 1000,
    lng: r.lng == null ? null : Math.round(r.lng * 1000) / 1000,
  })
  if (error) throw error

  useAuthStore.setState({ quizRespondido: true })
}
