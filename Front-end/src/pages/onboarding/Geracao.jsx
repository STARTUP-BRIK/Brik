import { useState } from 'react'
import { MODELOS } from '../../config/modelos.js'
import { SAIDA } from './estilo.js'
import { Check } from './pecas.jsx'

// Escolha dos modelos de que a pessoa quer aviso, por geração (iPhone 17,
// PlayStation 5...). A mesma no onboarding (10b, SeuRadar.jsx) e nas
// Notificações do perfil.

const SetaGeracao = ({ aberta }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={`shrink-0 text-mute transition-transform duration-200 ${aberta ? 'rotate-180' : ''}`}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

// Caixa de marcar a geração inteira: marcada, parcial (só alguns modelos, com
// o traço) ou vazia. Funciona com a geração aberta ou fechada.
function CaixaGeracao({ estado, nome, onClick }) {
  const cheia = estado !== 'vazia'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={estado === 'marcada' ? true : estado === 'parcial' ? 'mixed' : false}
      aria-label={`Todos os modelos de ${nome}`}
      onClick={onClick}
      className="-ml-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
    >
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 items-center justify-center rounded-md border-[1.5px] transition-colors ${
          cheia ? 'border-ob-destaque bg-ob-destaque text-ob-sobre-destaque' : 'border-ink/30 bg-surface-card'
        }`}
      >
        {estado === 'marcada' && <Check largura={3.2} width="13" height="13" />}
        {estado === 'parcial' && <span className="h-0.5 w-2.5 rounded-full bg-current" />}
      </span>
    </button>
  )
}

// Uma geração num cartão que abre e fecha. No cabeçalho: a caixa que marca a
// geração toda, o nome, quantos estão marcados e a seta. Aberta, mostra os
// modelos para marcar um a um.
export function Geracao({ grupo, marcados, aberta, onAbrir, onMarcar }) {
  const ids = grupo.modelos.map((m) => m.id)
  const n = ids.filter((id) => marcados.has(id)).length
  const estado = n === 0 ? 'vazia' : n === ids.length ? 'marcada' : 'parcial'
  const painel = `geracao-${ids[0]}`
  return (
    <section
      aria-label={grupo.grupo}
      className={`shrink-0 rounded-2xl border bg-surface-card transition-colors ${n ? 'border-ob-destaque/35' : 'border-line'}`}
    >
      <div className="flex items-center gap-1 pl-3 pr-2">
        <CaixaGeracao estado={estado} nome={grupo.grupo} onClick={() => onMarcar(ids, estado !== 'marcada')} />
        <button
          type="button"
          aria-expanded={aberta}
          aria-controls={painel}
          onClick={onAbrir}
          className="flex h-[52px] min-w-0 flex-1 items-center gap-2 rounded-xl pr-1.5 text-left"
        >
          <span className="flex-1 truncate text-[15px] font-bold text-ink">{grupo.grupo}</span>
          <span className={`text-xs ${n ? 'font-bold text-ob-destaque' : 'text-mute'}`}>
            {n ? `${n} de ${ids.length}` : `${ids.length} modelos`}
          </span>
          <SetaGeracao aberta={aberta} />
        </button>
      </div>

      {aberta && (
        <div
          id={painel}
          className="ob-anima flex flex-wrap gap-2 px-3.5 pb-3.5"
          style={{ animation: `ob-abre .25s ${SAIDA} both` }}
        >
          {grupo.modelos.map((modelo) => {
            const on = marcados.has(modelo.id)
            return (
              <button
                key={modelo.id}
                type="button"
                aria-pressed={on}
                onClick={() => onMarcar([modelo.id], !on)}
                className={`inline-flex h-10 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-sm font-bold transition-colors ${
                  on ? 'border-ob-destaque bg-ob-destaque text-ob-sobre-destaque' : 'border-line bg-surface-card text-ink hover:border-ob-destaque/40'
                }`}
              >
                {on && <Check largura={3} width="13" height="13" />}
                {modelo.nome}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

// Gerações abertas ("iphone:iPhone 17"), de todas as categorias: trocar de aba
// ou fechar uma geração não mexe no que está marcado. Começam abertas a mais
// nova de cada categoria e as que já têm algum modelo marcado.
export function useGeracoesAbertas(categorias, marcados) {
  const [abertas, setAbertas] = useState(
    () =>
      new Set(
        categorias.flatMap((c) =>
          MODELOS[c]
            .filter((g, i) => i === 0 || g.modelos.some((m) => marcados.has(m.id)))
            .map((g) => `${c}:${g.grupo}`),
        ),
      ),
  )
  const alternar = (chave) =>
    setAbertas((atuais) => {
      const novas = new Set(atuais)
      if (novas.has(chave)) novas.delete(chave)
      else novas.add(chave)
      return novas
    })
  return [abertas, alternar]
}
