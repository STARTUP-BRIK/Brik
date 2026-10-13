// Localização do aparelho, como alternativa ao CEP no raio de busca
// (onboarding, tela 12). O navegador pede a permissão da pessoa. A coordenada
// fica com 4 casas (~10 m), para o mapa marcar a rua dela; o banco recebe só 3
// casas (~100 m, ver lib/salvarOnboarding.js).

const casas = (valor, n) => Math.round(valor * 10 ** n) / 10 ** n

// { lat, lng } do aparelho. Rejeita com o GeolocationPositionError do
// navegador (code 1 = sem permissão) ou um erro comum se não houver suporte.
export function posicaoAtual() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('Sem geolocalização neste navegador'))
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: casas(coords.latitude, 4), lng: casas(coords.longitude, 4) }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60 * 1000 },
    )
  })
}

// Endereço de uma coordenada: rua, número, bairro, cidade, UF e o CEP que o
// mapa conhece. O Nominatim (OpenStreetMap) traz tudo isso; o BigDataCloud, de
// reserva, só cidade e UF. Os dois são públicos (sem chave) e aceitam chamada
// do navegador; é uma consulta por pessoa. Se nenhum responder, volta vazio: o
// raio funciona só com a coordenada.
export async function enderecoDaPosicao({ lat, lng }) {
  try {
    const resposta = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=pt-BR`,
    )
    if (resposta.ok) {
      const a = (await resposta.json()).address ?? {}
      const cidade = a.city ?? a.town ?? a.village ?? a.municipality ?? ''
      return {
        rua: a.road ?? '',
        numero: a.house_number ?? '',
        bairro: [a.suburb, a.neighbourhood, a.city_district].find((nome) => nome && nome !== cidade) ?? '',
        cidade,
        uf: (a['ISO3166-2-lvl4'] ?? '').replace('BR-', ''),
        cepDoMapa: (a.postcode ?? '').replace(/\D/g, ''),
      }
    }
  } catch {
    // Fora do ar: tenta a reserva.
  }

  try {
    const resposta = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`,
    )
    if (resposta.ok) {
      const d = await resposta.json()
      const cidade = d.city || d.locality || ''
      return { rua: '', numero: '', bairro: '', cidade, uf: (d.principalSubdivisionCode ?? '').replace('BR-', ''), cepDoMapa: '' }
    }
  } catch {
    // Sem endereço: segue só com a coordenada.
  }
  return { rua: '', numero: '', bairro: '', cidade: '', uf: '', cepDoMapa: '' }
}

const semAcento = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

// Faixa de numeração do "complemento" do ViaCEP: "até 1379/1380",
// "de 2176/2177 a 3077/3078", "de 6200/6201 ao fim", "de 1001 a 2999 - lado
// ímpar". Um número sozinho ("1998") é o CEP de um prédio só.
function faixa(complemento) {
  const texto = semAcento(complemento)
  const numeros = (trecho) => (trecho.match(/\d+/g) ?? []).map(Number)
  const lado = texto.includes('lado par') ? 0 : texto.includes('lado impar') ? 1 : null
  let m = texto.match(/^ate ([\d/]+)/)
  if (m) return { min: 0, max: Math.max(...numeros(m[1])), lado }
  m = texto.match(/^de ([\d/]+) ao fim/)
  if (m) return { min: Math.min(...numeros(m[1])), max: Infinity, lado }
  m = texto.match(/^de ([\d/]+) a ([\d/]+)/)
  if (m) return { min: Math.min(...numeros(m[1])), max: Math.max(...numeros(m[2])), lado }
  m = texto.match(/^(\d+)$/)
  if (m) return { min: Number(m[1]), max: Number(m[1]), lado: null }
  return null
}

// O CEP de um endereço: procura a rua no ViaCEP (que lista os CEPs dela com
// as faixas de numeração) e escolhe pelo número e pelo bairro. Sem a rua, ou
// se o ViaCEP não ajudar, fica o CEP que o mapa conhece (menos preciso).
export async function cepDoEndereco({ rua, numero, bairro, cidade, uf, cepDoMapa }) {
  const reserva = cepDoMapa?.length === 8 ? cepDoMapa : ''
  if (!rua || !cidade || !uf || rua.length < 3 || cidade.length < 3) return reserva

  let lista = []
  try {
    const resposta = await fetch(
      `https://viacep.com.br/ws/${uf}/${encodeURIComponent(cidade)}/${encodeURIComponent(rua)}/json/`,
    )
    if (resposta.ok) lista = await resposta.json()
  } catch {
    return reserva
  }
  if (!Array.isArray(lista) || !lista.length) return reserva

  // A busca do ViaCEP é por trecho do nome: fica só a rua com o nome igual.
  const mesmaRua = lista.filter((item) => semAcento(item.logradouro) === semAcento(rua))
  const candidatos = mesmaRua.length ? mesmaRua : lista
  const digitos = (item) => item.cep.replace(/\D/g, '')

  const n = Number.parseInt(numero, 10)
  if (Number.isFinite(n)) {
    const naFaixa = candidatos.find((item) => {
      const f = faixa(item.complemento ?? '')
      return f && n >= f.min && n <= f.max && (f.lado === null || n % 2 === f.lado)
    })
    if (naFaixa) return digitos(naFaixa)
  }

  // Sem número: a rua de um CEP só, ou o CEP do mapa se ele for da rua, ou o
  // primeiro do mesmo bairro.
  if (candidatos.length === 1) return digitos(candidatos[0])
  if (reserva && candidatos.some((item) => digitos(item) === reserva)) return reserva
  const doBairro = candidatos.find((item) => bairro && semAcento(item.bairro) === semAcento(bairro))
  return doBairro ? digitos(doBairro) : reserva || digitos(candidatos[0])
}
