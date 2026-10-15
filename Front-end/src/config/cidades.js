// A OLX devolve o local como "Cidade, Bairro" em location_neighborhood (o
// location_city do worker é sempre "Recife", então não serve). O filtro de raio
// do Início acha o ponto do anúncio a partir disso em lib/lugares.js.

export function cidadeDe(item) {
  return item.location_neighborhood?.split(',')[0].trim() || null
}
