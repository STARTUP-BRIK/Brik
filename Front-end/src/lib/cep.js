// Endereço e coordenadas de um CEP, para o raio de busca (onboarding, tela 12).
// A AwesomeAPI vem primeiro: devolve a coordenada da rua. A BrasilAPI v2 é só
// a reserva para quando a AwesomeAPI está fora do ar: as coordenadas dela são
// as do centro da cidade, e ela devolve endereço até para CEP que não existe,
// então nunca é usada para contestar um "não encontrado" da AwesomeAPI.
// As duas são públicas (sem chave) e aceitam chamada do navegador.
//
// Devolve { cep, lat, lng, bairro, cidade, uf }, ou null se o CEP não existe.
// Lança erro quando nenhuma das duas respondeu.

const numero = (valor) => (valor == null || valor === '' ? null : Number(valor))

export async function buscarCep(cep) {
  const digitos = cep.replace(/\D/g, '')

  try {
    const resposta = await fetch(`https://cep.awesomeapi.com.br/json/${digitos}`)
    if (resposta.status === 404 || resposta.status === 400) return null
    if (resposta.ok) {
      const d = await resposta.json()
      return { cep: digitos, lat: numero(d.lat), lng: numero(d.lng), bairro: d.district ?? '', cidade: d.city ?? '', uf: d.state ?? '' }
    }
  } catch {
    // Sem rede ou fora do ar: tenta a reserva.
  }

  const resposta = await fetch(`https://brasilapi.com.br/api/cep/v2/${digitos}`)
  if (resposta.status === 404) return null
  if (!resposta.ok) throw new Error(`CEP indisponível (${resposta.status})`)
  const d = await resposta.json()
  const ponto = d.location?.coordinates
  return {
    cep: digitos,
    lat: numero(ponto?.latitude),
    lng: numero(ponto?.longitude),
    bairro: d.neighborhood ?? '',
    cidade: d.city ?? '',
    uf: d.state ?? '',
  }
}

// 51020000 -> "51020-000" enquanto digita.
export function mascaraCep(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}
