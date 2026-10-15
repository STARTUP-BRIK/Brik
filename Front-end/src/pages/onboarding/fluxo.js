// Ordem das telas do onboarding, para onde cada uma leva (algumas ramificam pela
// resposta) e os textos que repetem as respostas da pessoa. As telas ficam em
// /onboarding/:passo. A primeira é o cadastro (01a); antes dele vem o login.

import { idsDaCategoria } from '../../config/modelos.js'

export const LOGIN = '/login'
export const caminho = (passo) => `/onboarding/${passo}`

// Largura da barra de progresso de cada pergunta, como no canvas.
export const PROGRESSO = {
  equipe: 16,
  tempo: 23,
  diagnostico: 35,
  resposta: 41,
  'primeira-proposta': 47,
  categorias: 52,
  modelos: 56,
  oportunidade: 58,
  defeito: 60,
  raio: 65,
  lucro: 68,
  meta: 71,
}

// Etapas do painel da esquerda no computador (PainelEtapas, em pecas.jsx):
// cada uma com as telas que fazem parte dela.
export const ETAPAS = [
  { titulo: 'Sua conta', texto: 'Seus dados e como você prefere ver o Brik.', passos: ['cadastro', 'tema'] },
  { titulo: 'O jeito Brik', texto: 'Como o Brik encontra as oportunidades por você.', passos: ['rolagem', 'jeito-melhor', 'solucao'] },
  {
    titulo: 'Sobre você',
    texto: 'Quanto tempo a busca toma hoje e quão rápido você responde.',
    passos: ['equipe', 'tempo', 'diagnostico', 'resposta', 'primeira-proposta'],
  },
  {
    titulo: 'Seu radar',
    texto: 'O que você revende, até onde vai buscar, quanto lucra hoje e a sua meta.',
    passos: ['categorias', 'modelos', 'defeito', 'raio', 'lucro', 'meta', 'montagem'],
  },
  { titulo: 'Seu plano', texto: 'O caminho daqui até a sua meta.', passos: ['radar', 'alerta', 'alertas', 'dashboard', 'plano', 'planos'] },
]

// --- Respostas ---------------------------------------------------------------

// 04. `pessoas`: quantas contam na estimativa de horas (ponto médio da faixa).
export const EQUIPE = {
  sozinho: { titulo: 'Faço tudo sozinho', pessoas: 1 },
  um: { titulo: '1 pessoa', pessoas: 1, resumo: '1 pessoa' },
  dois: { titulo: 'De 2 a 4 pessoas', pessoas: 3, resumo: '2 a 4 pessoas' },
  mais: { titulo: 'Mais de 4 pessoas', pessoas: 6, resumo: 'mais de 4 pessoas' },
}

// 05. `horas`: ponto médio da faixa, por dia. `curto`: como volta nas telas
// seguintes ("1 a 2 h por dia").
export const TEMPO_BUSCA = {
  m30: { titulo: 'Menos de 30 min', detalhe: 'Uma olhada rápida', horas: 0.25, curto: 'menos de 30 min' },
  h1: { titulo: '30 min a 1 hora', detalhe: 'Algumas olhadas no dia', horas: 0.75, curto: '30 min a 1 h' },
  h2: { titulo: '1 a 2 horas', detalhe: 'Faz parte da rotina', horas: 1.5, curto: '1 a 2 h' },
  h3: { titulo: 'Mais de 2 horas', detalhe: 'Quase um turno de trabalho', horas: 3, curto: 'mais de 2 h' },
}

// 08. `curto`: como a resposta volta nas telas seguintes.
export const TEMPO_RESPOSTA = {
  hora: { titulo: 'Na hora', detalhe: 'Menos de 5 min', curto: 'na hora' },
  rapido: { titulo: 'Rápido', detalhe: 'Até 30 min', curto: 'até 30 min depois' },
  quando: { titulo: 'Quando dá', detalhe: 'Algumas horas depois', curto: 'algumas horas depois' },
  lembro: { titulo: 'Quando lembro', detalhe: 'No fim do dia ou depois', curto: 'no fim do dia ou depois' },
}

// 10. As mesmas categorias do app (config/categorias.js).
export const CATEGORIAS_ONB = {
  iphone: { plural: 'iPhones', singular: 'iPhone' },
  videogame_console: { plural: 'videogames', singular: 'videogame' },
}

// --- Para onde cada tela leva --------------------------------------------------

// A conta é criada na 01a (cadastro): todas as telas seguintes pedem sessão.
export function proximo(passo, r = {}) {
  const seguinte = {
    cadastro: 'tema',
    tema: 'rolagem',
    rolagem: 'jeito-melhor',
    'jeito-melhor': 'solucao',
    solucao: 'equipe',
    equipe: 'tempo',
    tempo: 'diagnostico',
    diagnostico: 'resposta',
    resposta: 'primeira-proposta',
    'primeira-proposta': 'categorias',
    categorias: 'modelos',
    modelos: 'oportunidade',
    oportunidade: 'defeito',
    defeito: 'raio',
    raio: 'lucro',
    lucro: 'meta',
    meta: 'montagem',
    montagem: 'radar',
    radar: 'alerta',
    alerta: 'alertas',
    alertas: 'dashboard',
    dashboard: 'plano',
    plano: 'planos',
  }[passo]
  return seguinte ? caminho(seguinte) : '/'
}

// A seta de voltar das telas que têm uma (as outras não voltam, como no canvas).
export function anterior(passo, r = {}) {
  const volta = {
    cadastro: LOGIN,
    equipe: caminho('solucao'),
    tempo: caminho('equipe'),
    diagnostico: caminho('tempo'),
    resposta: caminho('diagnostico'),
    'primeira-proposta': caminho('resposta'),
    categorias: caminho('primeira-proposta'),
    modelos: caminho('categorias'),
    oportunidade: caminho('modelos'),
    defeito: caminho('oportunidade'),
    raio: caminho('defeito'),
    lucro: caminho('raio'),
    meta: caminho('lucro'),
  }
  return volta[passo] ?? null
}

// --- Contas e textos que repetem as respostas -----------------------------------

const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

export const reais = (valor) => `R$ ${inteiro.format(valor)}`
// 1.5 -> "1,5"
export const numero = (valor) => decimal.format(valor)
// Horas arredondadas como no canvas: 10,5 h vira "10h"; abaixo de 2 h, uma casa.
export const horasCurtas = (valor) => (valor >= 2 ? inteiro.format(Math.floor(valor)) : decimal.format(valor))

// Horas por semana de uma pessoa e da equipe toda, e o mês (× 4,3 semanas).
export function horas(r) {
  const porDia = TEMPO_BUSCA[r.tempoBusca].horas
  const pessoas = r.equipe === 'sozinho' ? 1 : EQUIPE[r.equipe].pessoas
  const porPessoa = porDia * 7
  const semana = porPessoa * pessoas
  return { porDia, pessoas, porPessoa, semana, mes: Math.round(semana * 4.3) }
}

// Quanto vale cada hora de busca (12b × 05): o lucro do mês dividido pelas
// horas do mês rolando anúncio. É o que cada uma dessas horas custa hoje e o
// que pode render negociando. `brik`: quanto sai cada hora com o Pro. Sem
// lucro ainda (quem está começando), `porHora` fica null e só as horas contam.
export function valorDaHora(r, precoPro) {
  const { mes } = horas(r)
  return {
    mes,
    porHora: r.lucroAtual > 0 && mes > 0 ? r.lucroAtual / mes : null,
    brik: mes > 0 ? precoPro / mes : null,
  }
}

// Com centavos ("R$ 0,84"), para os valores por hora.
const centavos = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const reaisCentavos = (valor) => centavos.format(valor)

// "iPhones e videogames", "iPhones" ou "Videogames" (maiuscula: no começo da frase).
export function listaCategorias(categorias, { maiuscula = false, singular = false } = {}) {
  const nomes = categorias.map((c) => CATEGORIAS_ONB[c]?.[singular ? 'singular' : 'plural']).filter(Boolean)
  const texto = juntar(nomes)
  // "iPhone" se escreve assim até no começo da frase.
  return maiuscula && !texto.startsWith('iPhone') ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto
}

// Em quais categorias aceita defeito: só as que ele marcou na 10.
export function consertaValido(r) {
  if (r.defeito === 'nao') return []
  return r.conserta.filter((c) => r.categorias.includes(c))
}

// Modelos marcados na 10b que são das categorias marcadas na 10.
export function modelosValidos(r) {
  const validos = new Set(r.categorias.flatMap(idsDaCategoria))
  return r.modelos.filter((m) => validos.has(m))
}

// Defeito em parte das categorias: "só iPhone"; em todas: "iPhones e videogames".
export function defeitoResumo(r) {
  const conserta = consertaValido(r)
  if (!conserta.length) return null
  return conserta.length < r.categorias.length
    ? { so: true, texto: listaCategorias(conserta, { singular: true }) }
    : { so: false, texto: listaCategorias(conserta) }
}

export function juntar(itens) {
  if (itens.length <= 1) return itens[0] ?? ''
  return `${itens.slice(0, -1).join(', ')} e ${itens.at(-1)}`
}

// --- Cidades do raio ---------------------------------------------------------------

// Por ora só Pernambuco: é onde o scraper coleta os anúncios. Coordenadas do
// centro de cada cidade, para saber quais cabem no raio da 12 a partir do ponto
// do CEP. `curto`: como o nome aparece nas frases.
export const CIDADES_PE = [
  { nome: 'Abreu e Lima', lat: -7.9007, lng: -34.8984 },
  { nome: 'Cabo de Santo Agostinho', curto: 'Cabo', lat: -8.2822, lng: -35.0253 },
  { nome: 'Camaragibe', lat: -8.0217, lng: -34.9786 },
  { nome: 'Caruaru', lat: -8.276, lng: -35.9754 },
  { nome: 'Garanhuns', lat: -8.8829, lng: -36.4966 },
  { nome: 'Goiana', lat: -7.5606, lng: -35.0025 },
  { nome: 'Gravatá', lat: -8.2011, lng: -35.565 },
  { nome: 'Igarassu', lat: -7.8342, lng: -34.9064 },
  { nome: 'Ipojuca', lat: -8.3984, lng: -35.0634 },
  { nome: 'Jaboatão dos Guararapes', curto: 'Jaboatão', lat: -8.112, lng: -34.944 },
  { nome: 'Moreno', lat: -8.1186, lng: -35.092 },
  { nome: 'Olinda', lat: -8.0089, lng: -34.8553 },
  { nome: 'Paulista', lat: -7.9408, lng: -34.8728 },
  { nome: 'Petrolina', lat: -9.3986, lng: -40.5008 },
  { nome: 'Recife', lat: -8.0476, lng: -34.877 },
  { nome: 'Santa Cruz do Capibaribe', curto: 'Santa Cruz', lat: -7.9573, lng: -36.2047 },
  { nome: 'São Lourenço da Mata', curto: 'São Lourenço', lat: -8.0022, lng: -35.0182 },
  { nome: 'Vitória de Santo Antão', curto: 'Vitória', lat: -8.1181, lng: -35.2914 },
]

function distanciaKm(a, b) {
  const rad = (g) => (g * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

// Cidades no raio, medido a partir do ponto do CEP (sem ponto, do centro da
// cidade dele): a da pessoa primeiro, depois as outras de Pernambuco cujo
// centro cabe no raio, da mais perto para a mais longe.
export function cidadesNoRaio(r) {
  const propria = CIDADES_PE.find((c) => c.nome === r.cidade)
  const origem = r.lat != null ? { lat: r.lat, lng: r.lng } : (propria ?? CIDADES_PE.find((c) => c.nome === 'Recife'))
  const outras = CIDADES_PE.filter((c) => c !== propria)
    .map((c) => ({ ...c, km: distanciaKm(origem, c) }))
    .filter((c) => c.km <= r.raio)
    .sort((a, b) => a.km - b.km)
    .map((c) => c.curto ?? c.nome)
  const nome = propria ? (propria.curto ?? propria.nome) : r.cidade
  return nome ? [nome, ...outras] : outras
}

// CEP fora de Pernambuco: por ora o Brik só busca anúncios lá.
export const foraDePE = (r) => Boolean(r.uf) && r.uf !== 'PE'

// "Recife, Olinda e Jaboatão"; com mais de três, "Recife, Olinda, Paulista e mais 2".
export function regiao(r) {
  const cidades = cidadesNoRaio(r)
  if (!cidades.length) return 'sua região'
  if (cidades.length <= 3) return juntar(cidades)
  return `${cidades.slice(0, 3).join(', ')} e mais ${cidades.length - 3}`
}

// "Meta de outubro"
export const mesAtual = () => new Date().toLocaleString('pt-BR', { month: 'long' })
