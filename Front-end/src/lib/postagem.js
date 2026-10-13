// Quando o anúncio foi postado: o card do feed mostra, e o botão Filtros ordena
// e filtra por período.
//
// `postado_em` é a data da postagem no OLX (o worker lê do scraper). Anúncio
// raspado antes dessa coluna existir ainda não tem: vale a primeira vez que o
// Brik o viu (`first_seen_at`), e o card diz "Visto" em vez de "Postado".

export const dataDoAnuncio = (item) => item.postado_em ?? item.first_seen_at ?? item.created_at ?? null

// Períodos do filtro; `dias`: quantos dias para trás contam (1 = só hoje).
export const PERIODOS = [
  { value: 'todos', label: 'Qualquer data' },
  { value: 'hoje', label: 'Hoje', dias: 1, resumo: 'de hoje' },
  { value: '3d', label: '3 dias', dias: 3, resumo: 'últimos 3 dias' },
  { value: '7d', label: '7 dias', dias: 7, resumo: 'últimos 7 dias' },
  { value: '30d', label: '30 dias', dias: 30, resumo: 'últimos 30 dias' },
]

export const ORDENS = [
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'antigos', label: 'Mais antigos', resumo: 'mais antigos' },
]

const inicioDoDia = (data) => new Date(data.getFullYear(), data.getMonth(), data.getDate())

// Início do período, contado em dias do calendário: "Hoje" começa à meia-noite;
// "7 dias" é hoje e os 6 dias antes. null em "Qualquer data".
export function inicioDoPeriodo(periodo, agora = new Date()) {
  const dias = PERIODOS.find((p) => p.value === periodo)?.dias
  if (!dias) return null
  const inicio = inicioDoDia(agora)
  inicio.setDate(inicio.getDate() - (dias - 1))
  return inicio
}

const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const diaMes = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
const diaMesAno = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })

// "Postado hoje, 14:32", "Postado ontem, 09:10", "Postado em 3 de out." (com o
// ano se não for o atual). null se o anúncio não tem data.
export function textoDaPostagem(item, agora = new Date()) {
  const iso = dataDoAnuncio(item)
  if (!iso) return null
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return null
  const verbo = item.postado_em ? 'Postado' : 'Visto'
  const dias = Math.round((inicioDoDia(agora) - inicioDoDia(data)) / 86400000)
  if (dias <= 0) return `${verbo} hoje, ${hora.format(data)}`
  if (dias === 1) return `${verbo} ontem, ${hora.format(data)}`
  const formato = data.getFullYear() === agora.getFullYear() ? diaMes : diaMesAno
  return `${verbo} em ${formato.format(data)}`
}
