import { useId } from 'react'
import { Pino } from './pecas.jsx'

// O card de anúncio da alegoria da 02b: o card do feed (ProductCard) como está
// no canvas, com uma ilustração no lugar da foto. Não é um anúncio real.

const SELO = {
  boa: { rotulo: 'Bom negócio', classe: 'bg-level-boa text-level-boa-ink' },
  otima: { rotulo: 'Ótimo negócio', classe: 'bg-level-otima text-white' },
  extraordinaria: { rotulo: 'Extraordinário', classe: 'bg-level-extra text-white' },
}

// iPhone azul de costas, inclinado.
function IphoneAzul({ id }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ecebe6" /><stop offset="1" stopColor="#d6d3ca" /></linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#bcd2e4" /><stop offset="1" stopColor="#8eaecb" /></linearGradient>
      </defs>
      <rect width="160" height="120" fill={`url(#${id}f)`} />
      <ellipse cx="84" cy="107" rx="30" ry="5" fill="#000000" fillOpacity="0.14" />
      <g transform="rotate(-14 80 60)">
        <rect x="57" y="12" width="46" height="94" rx="10" fill={`url(#${id}c)`} stroke="#000000" strokeOpacity="0.12" strokeWidth="0.8" />
        <rect x="61" y="16" width="20" height="20" rx="5.5" fill="#ffffff" fillOpacity="0.28" />
        <circle cx="66.5" cy="21.5" r="3.8" fill="#1d2226" stroke="#6f8597" strokeWidth="0.9" />
        <circle cx="75.5" cy="30.5" r="3.8" fill="#1d2226" stroke="#6f8597" strokeWidth="0.9" />
        <circle cx="66.5" cy="21.5" r="1.2" fill="#3b4a57" />
        <circle cx="75.5" cy="30.5" r="1.2" fill="#3b4a57" />
        <circle cx="76" cy="21" r="1.3" fill="#f3e3b5" />
      </g>
    </>
  )
}

const DESENHOS = { 'iphone-azul': IphoneAzul }

export function Ilustracao({ desenho }) {
  const id = useId().replace(/:/g, '')
  const Desenho = DESENHOS[desenho]
  return (
    <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="block">
      <Desenho id={id} />
    </svg>
  )
}

export function CardExemplo({ anuncio, className = '' }) {
  const selo = SELO[anuncio.selo]

  return (
    <article
      className={`relative flex flex-1 flex-col overflow-hidden rounded-2xl bg-surface-card text-left text-ink shadow-[0_6px_18px_-6px_rgba(43,43,43,0.25),0_0_0_1px_color-mix(in_srgb,var(--color-ink)_5%,transparent)] ${className}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-brik/5">
        <Ilustracao desenho={anuncio.desenho} />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-3 pb-14 pt-3">
        <div>
          <h2 className="line-clamp-2 min-h-[2.5em] text-[13px] font-medium leading-[1.25]">{anuncio.titulo}</h2>
          <p className="mt-1 flex items-center gap-1 text-[11px] leading-4 text-ink/60">
            <Pino width="14" height="14" className="shrink-0" />
            <span className="truncate">{anuncio.local}</span>
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-2 text-[11px] leading-[1.25] text-ink/60">
          <div>
            <dt>Valor</dt>
            <dd className="mt-0.5 text-[15px] font-bold text-ink">{anuncio.valor}</dd>
          </div>
          <div>
            <dt>Média de mercado</dt>
            <dd className="mt-0.5 text-[15px] font-medium text-ink/70">{anuncio.media}</dd>
          </div>
        </dl>

        <p className="flex items-baseline justify-between rounded-lg bg-gain-bg px-2.5 py-1.5 leading-normal text-gain">
          <span className="text-[11px] font-medium">Lucro</span>
          <span className="text-[15px] font-bold">
            {anuncio.lucro} <span className="text-[11px] font-medium">({anuncio.pct})</span>
          </span>
        </p>
      </div>

      <div className="absolute bottom-3 left-3 right-12 flex items-center gap-2">
        <span className={`whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-bold leading-normal ${selo.classe}`}>{selo.rotulo}</span>
        <span
          title="Anúncio da OLX"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7e22ce] text-[8px] font-bold text-white"
        >
          olx
        </span>
      </div>

      <span aria-hidden="true" className="absolute bottom-2 right-2 flex p-1">
        <svg width="24" height="24" viewBox="0 0 24 24" className="fill-line">
          <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z" />
        </svg>
      </span>
    </article>
  )
}
