// "2026-01": a chave de um mês no histórico das metas.
export const chaveDoMes = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`

// Antes de qualquer mês: guarda a meta que valia antes de o histórico existir.
const DESDE_SEMPRE = '0000-00'

// Meta que valeu num mês. Cada mês fica com a meta que tinha: trocar a meta
// em fevereiro não muda a régua de janeiro. Vale a última meta definida até
// aquele mês; antes da primeira, a primeira; sem histórico, a meta atual.
export function metaDoMes(metas, metaAtual, chave) {
  const chaves = Object.keys(metas).sort()
  if (!chaves.length) return metaAtual
  const ate = chaves.filter((c) => c <= chave)
  return metas[ate.length ? ate[ate.length - 1] : chaves[0]]
}

// Histórico com a nova meta valendo a partir deste mês. A meta de antes, se
// ainda não estava no histórico, fica guardada para os meses que passaram.
export function comNovaMeta(metas, metaAnterior, valor, hoje = new Date()) {
  const chave = chaveDoMes(hoje)
  const novo = { ...metas, [chave]: valor }
  if (metaAnterior > 0 && !Object.keys(metas).some((c) => c < chave)) novo[DESDE_SEMPRE] = metaAnterior
  return novo
}
