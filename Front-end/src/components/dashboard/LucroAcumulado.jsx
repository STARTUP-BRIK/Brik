import { useState } from 'react'
import { EyeIcon, EyeOffIcon, PencilIcon } from '../icons.jsx'
import { linhaDaMeta } from '../../lib/dashboard.js'
import { formatBRL, formatInt } from '../../lib/format.js'
import FormMeta from './FormMeta.jsx'
import LineChart from './LineChart.jsx'
import { COLOR } from './palette.js'
import { useReveal } from './reveal.js'
import { Card, Delta, Eyebrow, Masked, Segmented } from './ui.jsx'

const RANGES = [
  { value: '30D', label: '30D', compare: '30 dias anteriores' },
  { value: '90D', label: '90D', compare: '90 dias anteriores' },
  { value: '12M', label: '12M', compare: '12 meses anteriores' },
]

// Lucro acumulado em linha cheia e a meta em linha tracejada: uma reta que sai
// do zero e sobe no ritmo da meta mensal. Cada mês usa a meta que tinha
// (`metaEm`), então subir a meta não piora os meses que já passaram. Lucro
// acima da reta é estar em dia com a meta; abaixo, atrás dela.
const SERIES_STYLE = {
  lucro: { key: 'lucro', label: 'Lucro', color: COLOR.accent },
  meta: { key: 'meta', label: 'Meta', color: COLOR.mute, dashed: true },
}

function LucroAcumulado({ step, data, meta, metaEm, onMeta, hidden, onToggleHidden }) {
  const [range, setRange] = useState('30D')
  const [editando, setEditando] = useState(false)
  const reveal = useReveal(step)
  const period = data.periodos[range]
  const { compare } = RANGES.find((r) => r.value === range)
  const temMeta = meta > 0

  const n = period.lucro.length
  const linhaMeta = temMeta && n ? linhaDaMeta(range, metaEm) : []
  // Hoje (o último ponto): quanto o lucro está acima ou abaixo da reta da meta.
  const ritmo = linhaMeta.length ? period.lucro[n - 1] - linhaMeta[n - 1] : null

  return (
    <Card {...reveal(0, 'p-5')}>
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow {...reveal(1)}>Lucro acumulado</Eyebrow>
          <p {...reveal(2, 'mt-3 flex items-baseline gap-1.5')}>
            <span className="text-lg font-medium text-mute">R$</span>
            <span className="text-[44px] font-bold leading-none tracking-tight">
              <Masked>{formatInt(period.total)}</Masked>
            </span>
          </p>
        </div>

        <button
          type="button"
          aria-pressed={hidden}
          aria-label={hidden ? 'Mostrar valores' : 'Ocultar valores'}
          onClick={onToggleHidden}
          {...reveal(
            1,
            'flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-raise text-mute transition-colors hover:text-strong',
          )}
        >
          {hidden ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>

      <p {...reveal(3, 'mt-3 flex items-center gap-2 text-xs text-mute')}>
        {period.variacao != null && (
          <span className="rounded-md bg-profit/10 px-2 py-1 text-xs">
            <Delta value={period.variacao} />
          </span>
        )}
        vs. {compare}
      </p>

      {/* A meta mensal com o lápis para trocar. Quem ainda não tem meta (contas de
          antes do onboarding pedir) define aqui mesmo. */}
      <div {...reveal(3, 'mt-4')}>
        {!temMeta ? (
          <div className="rounded-xl bg-surface-raise p-3.5">
            <p className="text-sm font-bold text-strong">Defina sua meta de lucro mensal</p>
            <p className="mt-0.5 text-xs text-mute">Ela vira a linha do gráfico que mostra se você está no ritmo.</p>
            <FormMeta onSalvar={onMeta} className="mt-3" />
          </div>
        ) : editando ? (
          <FormMeta
            inicial={meta}
            onSalvar={(valor) => {
              onMeta(valor)
              setEditando(false)
            }}
            onCancelar={() => setEditando(false)}
          />
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-mute">
            Meta mensal
            <strong className="font-bold text-strong">
              <Masked>{formatBRL(meta)}</Masked>
            </strong>
            <button
              type="button"
              onClick={() => setEditando(true)}
              aria-label="Editar a meta"
              title="Editar a meta"
              className="-my-2 flex h-8 w-8 items-center justify-center rounded-lg text-mute transition-colors hover:bg-surface-raise hover:text-strong"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </p>
        )}
      </div>

      <Segmented
        label="Período"
        options={RANGES}
        value={range}
        onChange={setRange}
        {...reveal(4, 'mt-4')}
      />

      <div {...reveal(5, 'mt-4')}>
        <LineChart
          labels={period.labels}
          series={[
            { ...SERIES_STYLE.lucro, values: period.lucro },
            ...(temMeta ? [{ ...SERIES_STYLE.meta, values: linhaMeta }] : []),
          ]}
          formatValue={formatBRL}
          ariaLabel={`Lucro${temMeta ? ' e meta' : ''}, ${compare.replace(' anteriores', '')}`}
        />
        {ritmo != null && (
          <p className="mt-3 text-xs text-mute">
            Você está{' '}
            <strong className={`font-bold ${ritmo >= 0 ? 'text-profit' : 'text-loss'}`}>
              <Masked>{formatBRL(Math.abs(ritmo))}</Masked>
            </strong>{' '}
            {ritmo >= 0 ? 'acima do ritmo da meta.' : 'atrás do ritmo da meta.'}
          </p>
        )}
      </div>
    </Card>
  )
}

export default LucroAcumulado
