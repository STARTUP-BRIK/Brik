import { useId, useRef, useState } from 'react'
import { formatCompact } from '../../lib/format.js'
import { COLOR } from './palette.js'
import { useHidden } from './hidden.js'

const W = 340
const H = 150
const PAD = { l: 36, r: 12, t: 10, b: 24 }
const PLOT_W = W - PAD.l - PAD.r
const PLOT_H = H - PAD.t - PAD.b
const SURFACE = COLOR.surface
const GRID = COLOR.line
const MUTED = COLOR.mute

// Marcas de eixo "redondas" (1k, 2k, 2,5k, 5k, 10k…) que cobrem o intervalo dos dados.
function niceTicks(min, max) {
  const raw = ((max - min) || max || 1) / 3
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw)
  const start = Math.floor(min / step) * step
  const ticks = [start]
  for (let i = 1; ticks[ticks.length - 1] < max; i++) ticks.push(Math.round((start + i * step) * 100) / 100)
  return ticks
}

// Áreas da faixa entre as séries `a` e `b`, cortadas onde elas se cruzam. Cada
// área junta os trechos seguidos de mesmo sinal (sem emendas no desenho) e sabe
// se `a` está acima (positivo) ou abaixo (negativo) de `b`.
function areasDaFaixa(a, b, xAt, yAt) {
  const pedacos = []
  for (let i = 0; i < a.length - 1; i++) {
    const d0 = a[i] - b[i]
    const d1 = a[i + 1] - b[i + 1]
    const p = (x, va, vb) => ({ x, ya: yAt(va), yb: yAt(vb) })
    const ini = p(xAt(i), a[i], b[i])
    const fim = p(xAt(i + 1), a[i + 1], b[i + 1])
    if (d0 * d1 < 0) {
      // Cruzaram no meio do trecho: divide no ponto exato do cruzamento.
      const t = d0 / (d0 - d1)
      const meio = p(ini.x + t * (fim.x - ini.x), a[i] + t * (a[i + 1] - a[i]), b[i] + t * (b[i + 1] - b[i]))
      pedacos.push({ de: ini, ate: meio, positivo: d0 > 0 }, { de: meio, ate: fim, positivo: d1 > 0 })
    } else {
      pedacos.push({ de: ini, ate: fim, positivo: d0 + d1 >= 0 })
    }
  }
  const areas = []
  for (const { de, ate, positivo } of pedacos) {
    const ultima = areas[areas.length - 1]
    if (ultima && ultima.positivo === positivo) ultima.trecho.push(ate)
    else areas.push({ positivo, trecho: [de, ate] })
  }
  // Polígono: ida pela linha de a, volta pela linha de b.
  return areas.map(({ positivo, trecho }) => ({
    positivo,
    pontos: [...trecho.map((q) => `${q.x},${q.ya}`), ...[...trecho].reverse().map((q) => `${q.x},${q.yb}`)].join(' '),
  }))
}

// Gráfico de linhas (até ~4 séries) com área sob a primeira, marcador no fim,
// cursor + dica com todas as séries no ponto e tabela para leitores de tela.
// Com `faixa` ({ key, label, entre: [a, b], positivo, negativo }), em vez da área
// sob a primeira série pinta o espaço entre as séries a e b: na cor `positivo`
// onde a fica acima de b e na `negativo` onde fica abaixo. O valor da faixa
// (a − b) entra na dica, na legenda e na tabela.
function LineChart({ labels, series, faixa, formatValue, ariaLabel }) {
  const hidden = useHidden()
  const gradientId = `area-${useId().replace(/:/g, '')}`
  const svgRef = useRef(null)
  const [active, setActive] = useState(null)

  const n = labels.length
  const all = series.flatMap((s) => s.values)

  if (n === 0 || all.length === 0) {
    return (
      <div className="flex h-[150px] items-center justify-center text-sm text-mute">
        Sem dados neste período
      </div>
    )
  }

  const ticks = niceTicks(Math.min(...all), Math.max(...all))
  const lo = ticks[0]
  const hi = ticks[ticks.length - 1]
  const xAt = (i) => PAD.l + (n > 1 ? (i * PLOT_W) / (n - 1) : PLOT_W / 2)
  const yAt = (v) => PAD.t + PLOT_H - ((v - lo) / (hi - lo)) * PLOT_H
  const baseline = PAD.t + PLOT_H

  const points = (values) => values.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ')

  // Rótulos do eixo X: no máximo ~7, sempre incluindo o último.
  const every = Math.ceil(n / 7)
  const showLabel = (i) => i % every === 0 || i === n - 1

  function moveTo(clientX) {
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * W
    const i = Math.round(((x - PAD.l) / PLOT_W) * (n - 1))
    setActive(Math.min(Math.max(i, 0), n - 1))
  }

  function onKeyDown(event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    setActive((current) => {
      const from = current ?? n - 1
      return Math.min(Math.max(from + (event.key === 'ArrowRight' ? 1 : -1), 0), n - 1)
    })
  }

  const primary = series[0]
  const [sa, sb] = faixa ? faixa.entre.map((key) => series.find((s) => s.key === key)) : []
  const diferenca = (i) => sa.values[i] - sb.values[i]
  const corDaFaixa = (v) => (v >= 0 ? faixa.positivo : faixa.negativo)
  const tooltipLeft = active === null ? 0 : Math.min(Math.max((xAt(active) / W) * 100, 24), 76)

  return (
    <div>
      <div
        role="group"
        aria-roledescription="gráfico"
        aria-label={`${ariaLabel}. Use as setas para percorrer os pontos.`}
        tabIndex={0}
        className="relative touch-pan-y rounded-lg outline-offset-4"
        onPointerMove={(e) => moveTo(e.clientX)}
        onPointerDown={(e) => moveTo(e.clientX)}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((current) => current ?? n - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={onKeyDown}
      >
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={primary.color} stopOpacity="0.14" />
              <stop offset="1" stopColor={primary.color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.l} x2={W - PAD.r} y1={yAt(tick)} y2={yAt(tick)} stroke={GRID} strokeWidth="1" />
              {!hidden && (
                <text
                  x={PAD.l - 8}
                  y={yAt(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill={MUTED}
                  fontSize="9"
                  fontFamily="ui-monospace, monospace"
                >
                  {formatCompact(tick)}
                </text>
              )}
            </g>
          ))}

          {labels.map(
            (label, i) =>
              showLabel(i) && (
                <text
                  key={i}
                  x={xAt(i)}
                  y={H - 6}
                  textAnchor="middle"
                  fill={MUTED}
                  fontSize="9"
                  fontFamily="ui-monospace, monospace"
                >
                  {label}
                </text>
              ),
          )}

          {faixa &&
            n > 1 &&
            areasDaFaixa(sa.values, sb.values, xAt, yAt).map(({ pontos, positivo }, i) => (
              <polygon key={i} points={pontos} fill={positivo ? faixa.positivo : faixa.negativo} fillOpacity="0.25" />
            ))}

          {!faixa && n > 1 && (
            <polygon
              points={`${xAt(0)},${baseline} ${points(primary.values)} ${xAt(n - 1)},${baseline}`}
              fill={`url(#${gradientId})`}
            />
          )}

          {[...series].reverse().map((s) => (
            <polyline
              key={s.key}
              points={points(s.values)}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={s.dashed ? '4 4' : undefined}
            />
          ))}

          {active === null ? (
            <circle
              cx={xAt(n - 1)}
              cy={yAt(primary.values[n - 1])}
              r="4"
              fill={primary.color}
              stroke={SURFACE}
              strokeWidth="2"
            />
          ) : (
            <>
              <line x1={xAt(active)} x2={xAt(active)} y1={PAD.t} y2={baseline} stroke={MUTED} strokeWidth="1" />
              {series.map((s) => (
                <circle
                  key={s.key}
                  cx={xAt(active)}
                  cy={yAt(s.values[active])}
                  r="4"
                  fill={s.color}
                  stroke={SURFACE}
                  strokeWidth="2"
                />
              ))}
            </>
          )}
        </svg>

        {active !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 min-w-32 -translate-x-1/2 rounded-xl border border-line bg-surface-raise px-3 py-2 text-xs shadow-lg"
            style={{ left: `${tooltipLeft}%` }}
          >
            <p className="mb-1 font-mono text-[10px] text-mute">{labels[active]}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-0 w-3.5 shrink-0 border-t-2"
                  style={{ borderColor: s.color, borderStyle: s.dashed ? 'dotted' : 'solid' }}
                />
                <strong className="font-bold text-strong">{hidden ? '••••' : formatValue(s.values[active])}</strong>
                <span className="text-mute">{s.label}</span>
              </p>
            ))}
            {faixa && (
              <p className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-3.5 shrink-0 rounded-sm opacity-60"
                  style={{ background: corDaFaixa(diferenca(active)) }}
                />
                <strong className="font-bold" style={{ color: corDaFaixa(diferenca(active)) }}>
                  {hidden ? '••••' : `${diferenca(active) > 0 ? '+' : ''}${formatValue(diferenca(active))}`}
                </strong>
                <span className="text-mute">{faixa.label}</span>
              </p>
            )}
          </div>
        )}
      </div>

      <ul className="mt-3 flex gap-4 border-t border-line pt-3 text-xs text-mute">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <svg width="16" height="4" aria-hidden="true">
              <line
                x1="1"
                x2="15"
                y1="2"
                y2="2"
                stroke={s.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={s.dashed ? '2 3' : undefined}
              />
            </svg>
            {s.label}
          </li>
        ))}
        {faixa && (
          <li className="flex items-center gap-2">
            {/* Meio azul, meio vermelho: a mesma área muda de cor com o sinal. */}
            <span aria-hidden="true" className="flex h-2.5 w-4 overflow-hidden rounded-sm opacity-60">
              <span className="flex-1" style={{ background: faixa.positivo }} />
              <span className="flex-1" style={{ background: faixa.negativo }} />
            </span>
            {faixa.label}
          </li>
        )}
      </ul>

      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Ponto</th>
            {series.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
            {faixa && <th scope="col">{faixa.label}</th>}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={i}>
              <th scope="row">{label}</th>
              {series.map((s) => (
                <td key={s.key}>{hidden ? 'oculto' : formatValue(s.values[i])}</td>
              ))}
              {faixa && <td>{hidden ? 'oculto' : formatValue(diferenca(i))}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default LineChart
