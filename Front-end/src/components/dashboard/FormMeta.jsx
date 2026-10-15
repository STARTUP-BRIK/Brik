import { useState } from 'react'
import { formatInt } from '../../lib/format.js'

// Campo da meta de lucro do mês, em reais. Enter salva; Esc ou Cancelar volta
// sem mudar (sem `onCancelar`, o botão Cancelar não aparece).
function FormMeta({ inicial, onSalvar, onCancelar, className = '' }) {
  const [rascunho, setRascunho] = useState(inicial > 0 ? formatInt(inicial) : '')
  const novo = Number(rascunho.replace(/\D/g, ''))

  function salvar(event) {
    event.preventDefault()
    if (novo > 0) onSalvar(novo)
  }

  return (
    <form onSubmit={salvar} onKeyDown={(event) => event.key === 'Escape' && onCancelar?.()} className={className}>
      <label className="flex items-center gap-2 rounded-xl border border-line bg-surface-card px-3 py-2 focus-within:border-strong">
        <span className="text-sm font-medium text-mute">R$</span>
        <input
          autoFocus={inicial > 0}
          inputMode="numeric"
          placeholder="0"
          aria-label="Meta de lucro do mês, em reais"
          value={rascunho}
          onChange={(event) => {
            const digitos = event.target.value.replace(/\D/g, '').slice(0, 7)
            setRascunho(digitos ? formatInt(Number(digitos)) : '')
          }}
          className="min-w-0 flex-1 bg-transparent text-xl font-bold text-strong outline-none placeholder:text-mute"
        />
      </label>
      <div className="mt-2 flex gap-2">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-lg border border-line px-3.5 py-1.5 text-sm font-medium text-strong transition-colors hover:bg-surface-raise"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={!(novo > 0)}
          className="rounded-lg bg-strong px-3.5 py-1.5 text-sm font-bold text-surface transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Salvar meta
        </button>
      </div>
    </form>
  )
}

export default FormMeta
