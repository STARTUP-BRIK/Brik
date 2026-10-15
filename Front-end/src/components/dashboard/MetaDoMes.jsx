import { useState } from 'react'
import { PencilIcon } from '../icons.jsx'
import { formatBRL, formatInt } from '../../lib/format.js'
import FormMeta from './FormMeta.jsx'
import { useReveal } from './reveal.js'
import { Card, Eyebrow, Masked } from './ui.jsx'

// Card da meta: o lucro do mês sobre a meta, a barra que vai enchendo e quanto
// por cento já foi batido. Passando da meta, a barra fica cheia e o texto diz
// quanto passou. O lápis troca o valor da meta ali mesmo (`onMeta`).
function MetaDoMes({ step, meta, onMeta, lucro, mes }) {
  const reveal = useReveal(step)
  const [editando, setEditando] = useState(false)
  const pct = meta > 0 ? Math.max(0, Math.round((lucro / meta) * 100)) : 0
  const falta = meta - lucro
  const batida = meta > 0 && lucro >= meta

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
                onClick={() => setEditando(true)}
                aria-label="Editar a meta"
                title="Editar a meta"
                className="-my-2 flex h-8 w-8 items-center justify-center rounded-lg text-mute transition-colors hover:bg-surface-raise hover:text-strong"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {editando ? (
            <FormMeta
              inicial={meta}
              onSalvar={(valor) => {
                onMeta(valor)
                setEditando(false)
              }}
              onCancelar={() => setEditando(false)}
              className="mt-3"
            />
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
