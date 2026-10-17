import { TrashIcon } from './icons.jsx'
import { resultado } from '../lib/calc.js'
import { paraValores } from '../lib/calculos.js'
import { formatBRL, formatDecimal } from '../lib/format.js'

// Um cálculo salvo (public.calculos) na lista: nome, data, custo, venda, lucro e
// margem. Usado na CalculadoraHome (tocar reabre na calculadora; tem a lixeira) e
// na escolha do cálculo de um produto do estoque (tocar usa o cálculo; sem lixeira).

const dataCurta = (iso) => new Date(iso).toLocaleDateString('pt-BR')

function CalculoSalvo({ calculo, onAbrir, onApagar }) {
  const r = resultado(paraValores(calculo))
  const tom = r.lucro > 0 ? 'text-profit' : r.lucro < 0 ? 'text-loss' : 'text-ink'

  return (
    <li className="flex items-center gap-2 rounded-2xl bg-surface-card p-1.5 pr-2 ring-1 ring-line">
      <button
        type="button"
        onClick={() => onAbrir(calculo)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-surface-raise"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold text-ink">{calculo.nome}</span>
          <span className="block text-[11px] text-mute">
            {dataCurta(calculo.created_at)} · custo {formatBRL(r.custo)} · venda {formatBRL(r.venda)}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className={`block text-sm font-bold tabular-nums ${tom}`}>{formatBRL(r.lucro)}</span>
          <span className="block text-[11px] tabular-nums text-mute">
            {r.margem == null ? '—' : `${formatDecimal(r.margem)}%`}
          </span>
        </span>
      </button>
      {onApagar && (
        <button
          type="button"
          onClick={() => onApagar(calculo)}
          aria-label={`Excluir o cálculo ${calculo.nome}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-mute transition-colors hover:bg-loss/10 hover:text-loss"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </li>
  )
}

export default CalculoSalvo
