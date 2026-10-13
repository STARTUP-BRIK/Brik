// Localização do aparelho, como alternativa ao CEP no raio de busca
// (onboarding, tela 12). O navegador pede a permissão da pessoa; a coordenada
// é arredondada para ~100 m (3 casas), o bastante para o raio, sem guardar
// onde ela está exatamente.

const arredondar = (valor) => Math.round(valor * 1000) / 1000

// { lat, lng } do aparelho. Rejeita com o GeolocationPositionError do
// navegador (code 1 = sem permissão) ou um erro comum se não houver suporte.
export function posicaoAtual() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('Sem geolocalização neste navegador'))
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: arredondar(coords.latitude), lng: arredondar(coords.longitude) }),
      reject,
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    )
  })
}

// Bairro, cidade e UF de uma coordenada. O Nominatim (OpenStreetMap) traz o
// bairro; o BigDataCloud, de reserva, só cidade e UF. Os dois são públicos (sem
// chave) e aceitam chamada do navegador; é uma consulta por pessoa. Se nenhum
// responder, volta vazio: o raio funciona só com a coordenada.
export async function enderecoDaPosicao({ lat, lng }) {
  try {
    const resposta = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=pt-BR`,
    )
    if (resposta.ok) {
      const a = (await resposta.json()).address ?? {}
      const cidade = a.city ?? a.town ?? a.village ?? a.municipality ?? ''
      const bairro = [a.suburb, a.neighbourhood, a.city_district].find((nome) => nome && nome !== cidade) ?? ''
      return { bairro, cidade, uf: (a['ISO3166-2-lvl4'] ?? '').replace('BR-', '') }
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
      return { bairro: '', cidade: d.city || d.locality || '', uf: (d.principalSubdivisionCode ?? '').replace('BR-', '') }
    }
  } catch {
    // Sem endereço: segue só com a coordenada.
  }
  return { bairro: '', cidade: '', uf: '' }
}
