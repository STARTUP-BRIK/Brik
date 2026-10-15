import { useEffect, useState } from 'react'

// Bairros e cidades de Pernambuco (OpenStreetMap), em public/lugares-pe.json:
// [nome, lat, lng, tipo], tipo 'b' bairro, 'v' vizinhança, 'c' cidade. Gerado
// uma vez pela Overpass API, com a consulta
//   node["place"~"^(suburb|neighbourhood|quarter|town|city)$"](-9.55,-41.45,-7.15,-34.75);
// Carregado uma vez por visita: dá os nomes no mapa do raio (onboarding e
// Início) e o ponto de cada anúncio no filtro de raio do Início.
let lugaresCarregados = null

// null enquanto carrega; [] se o arquivo não veio (tenta de novo na próxima montagem).
export function useLugares() {
  const [lugares, setLugares] = useState(lugaresCarregados)
  useEffect(() => {
    if (lugaresCarregados) return
    let ativo = true
    fetch('/lugares-pe.json')
      .then((resposta) => resposta.json())
      .then((lista) => {
        lugaresCarregados = lista
        if (ativo) setLugares(lista)
      })
      .catch(() => {
        if (ativo) setLugares([])
      })
    return () => {
      ativo = false
    }
  }, [])
  return lugares
}

export function distanciaKm(lat1, lng1, lat2, lng2) {
  const rad = (g) => (g * Math.PI) / 180
  const h = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

const semAcento = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

// Cidades e bairros por nome (sem acento), montado uma vez por lista.
const indices = new WeakMap()
function indice(lugares) {
  let i = indices.get(lugares)
  if (i) return i
  i = { cidades: new Map(), bairros: new Map() }
  for (const [nome, lat, lng, tipo] of lugares) {
    const chave = semAcento(nome)
    if (tipo === 'c') {
      if (!i.cidades.has(chave)) i.cidades.set(chave, { lat, lng })
    } else {
      if (!i.bairros.has(chave)) i.bairros.set(chave, [])
      i.bairros.get(chave).push({ lat, lng })
    }
  }
  indices.set(lugares, i)
  return i
}

// Centro de uma cidade de PE pelo nome, ou null.
export function pontoDaCidade(lugares, cidade) {
  if (!lugares?.length || !cidade) return null
  return indice(lugares).cidades.get(semAcento(cidade)) ?? null
}

// Até onde um bairro com o nome certo ainda conta como da cidade do anúncio
// (há bairros de mesmo nome em várias cidades: fica o mais perto do centro).
const BAIRRO_ATE_KM = 25

// Ponto de um anúncio. A OLX dá o local como "Cidade, Bairro" em
// location_neighborhood (às vezes só a cidade): vale o bairro, se o mapa o
// conhece perto da cidade, senão o centro da cidade. null se nem a cidade for
// conhecida.
export function pontoDoAnuncio(lugares, item) {
  const texto = item.location_neighborhood ?? ''
  const virgula = texto.indexOf(',')
  const cidade = virgula < 0 ? texto : texto.slice(0, virgula)
  const centro = pontoDaCidade(lugares, cidade)
  if (!centro || virgula < 0) return centro

  let melhor = null
  let menor = BAIRRO_ATE_KM
  for (const ponto of indice(lugares).bairros.get(semAcento(texto.slice(virgula + 1))) ?? []) {
    const km = distanciaKm(centro.lat, centro.lng, ponto.lat, ponto.lng)
    if (km <= menor) {
      menor = km
      melhor = ponto
    }
  }
  return melhor ?? centro
}
