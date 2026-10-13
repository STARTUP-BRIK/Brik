import { useState } from 'react'
import { PencilIcon } from '../icons.jsx'
import { formatBRL, formatInt } from '../../lib/format.js'
import { useReveal } from './reveal.js'
import { Card, Eyebrow, Masked } from './ui.jsx'

// Card da meta: o lucro do mês sobre a meta, a barra que vai enchendo e quanto
// por cento já foi batido. Passando da meta, a barra fica cheia e o texto diz
// quanto passou. O lápis troca o valor da meta ali mesmo (`onMeta`).
function MetaDoMes({ step, meta, onMeta, lucro, mes }) {
  const reveal = useReveal(step)
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState('')
  const pct = meta > 0 ? Math.max(0, Math.round((lucro / meta) * 100)) : 0
  const falta = meta - lucro
  const batida = meta > 0 && lucro >= meta
  const novo = Number(rascunho.replace(/\D/g, ''))

  function editar() {
    setRascunho(formatInt(meta))
    setEditando(true)
  }

  function salvar(event) {
    event.preventDefault()
    if (!(novo > 0)) return
    onMeta(novo)
    setEditando(false)
  }

  return (
    <Card {...reveal(0, 'p-5')} aria-labelledby="meta-titulo">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div {...reveal(1, 'flex items-center gap-1.5')}>
            <Eyebrow as="h2" id="meta-titulo">
              Meta de {mes}
            </Eyebrow>
            {!editando && (
              <button
                type="button"
                onClick={editar}
                aria-label="Editar a meta"
                title="Editar a meta"
                className="-my-2 flex h-8 w-8 items-center justify-center rounded-lg text-mute transition-colors hover:bg-surface-raise hover:text-strong"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {editando ? (
            // Enter salva; Esc ou Cancelar volta sem mudar.
            <form onSubmit={salvar} onKeyDown={(event) => event.key === 'Escape' && setEditando(false)} className="mt-3">
              <label className="flex items-center gap-2 rounded-xl border border-line bg-surface-card px-3 py-2 focus-within:border-strong">
                <span className="text-sm font-medium text-mute">R$</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  aria-label="Meta de lucro do mês, em reais"
                  value={rascunho}
                  onChange={(event) => {
                    const digitos = event.target.value.replace(/\D/g, '').slice(0, 7)
                    setRascunho(digitos ? formatInt(Number(digitos)) : '')
                  }}
                  className="min-w-0 flex-1 bg-transparent text-xl font-bold text-strong outline-none"
                />
              </label>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  className="rounded-lg border border-line px-3.5 py-1.5 text-sm font-medium text-strong transition-colors hover:bg-surface-raise"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!(novo > 0)}
                  className="rounded-lg bg-strong px-3.5 py-1.5 text-sm font-bold text-surface transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Salvar meta
                </button>
              </div>
            </form>
          ) : (
            <p {...reveal(2, 'mt-3 flex flex-wrap items-baseline gap-x-1.5')}>
              <span className="text-[28px] font-bold leading-none tracking-tight">
                <Masked>{formatBRL(Math.max(0, lucro))}</Masked>
              </span>
              <span className="text-sm text-mute">
                de <Masked>{formatBRL(meta)}</Masked>
              </span>
            </p>
          )}
        </div>
        <p
          {...reveal(2, `rounded-xl px-3 py-1.5 text-right ${batida ? 'bg-profit/12 text-profit' : 'bg-surface-raise text-strong'}`)}
        >
          <span className="block text-[22px] font-bold leading-none">{formatInt(pct)}%</span>
          <span className="mt-0.5 block text-[10px] text-mute">da meta</span>
        </p>
      </div>

      <div
        {...reveal(3, 'mt-4 h-3 overflow-hidden rounded-full bg-surface-raise')}
        role="progressbar"
        aria-label={`Meta de ${mes}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(pct, 100)}
        aria-valuetext={`${pct}% da meta`}
      >
        <div className="meta-barra h-full rounded-full bg-profit transition-[width] duration-500" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>

      <p {...reveal(3, 'mt-2.5 text-xs text-mute')}>
        {batida ? (
          <>
            Meta batida!{' '}
            {lucro > meta && (
              <>
                <strong className="font-bold text-profit">
                  <Masked>{formatBRL(lucro - meta)}</Masked>
                </strong>{' '}
                acima.
              </>
            )}
          </>
        ) : (
          <>
            Faltam{' '}
            <strong className="font-bold text-strong">
              <Masked>{formatBRL(falta)}</Masked>
            </strong>{' '}
            de lucro para bater a meta.
          </>
        )}
      </p>
    </Card>
  )
}

export default MetaDoMes
