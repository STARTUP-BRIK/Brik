import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon, PinIcon } from './icons.jsx'
import { MapaReal } from '../pages/onboarding/MapaReal.jsx'
import { classeBotaoPainel, classePosicaoPainel, useFecharPainel } from '../lib/usePainel.js'

// Filtro de raio do Início: uma pílula de vidro sobre o petróleo (ou, com
// `lateral`, o botão da coluna do desktop) que abre um painel com o mapa do raio
// (o mesmo da tela 12 do onboarding) e a régua de 1 a 100 km. O raio já vem
// do onboarding; o feed mostra só os anúncios até ele (o filtro em si é em
// Home). `centro`: o ponto de partida ({ lat, lng }) ou null, quando não se sabe
// de onde a pessoa sai. `local`: o nome dele. `total`: ofertas dentro do raio.

const ATALHOS = [5, 10, 20, 50]
// Raio do círculo no mapa, em px.
const RAIO_NO_MAPA = 52

const plural = (n) => `${n} ${n === 1 ? 'oferta' : 'ofertas'}`

function FiltroRaio({ raio, onRaio, centro, local, total, lateral = false }) {
  const [aberto, setAberto] = useState(false)
  const raizRef = useRef(null)
  const botaoRef = useRef(null)
  const reguaRef = useRef(null)

  // Aberto: fecha com clique fora e com Esc, e o foco vai para a régua.
  useFecharPainel(aberto, setAberto, raizRef, botaoRef)
  useEffect(() => {
    if (aberto) reguaRef.current?.focus({ preventScroll: true })
  }, [aberto])

  return (
    <div ref={raizRef} className={`relative ${lateral ? 'w-full' : 'w-fit'}`}>
      <button
        ref={botaoRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
        className={classeBotaoPainel(lateral, aberto)}
      >
        <span className="sr-only">Raio de busca:</span>
        <PinIcon
          aria-hidden="true"
          className={`shrink-0 ${lateral ? 'h-4 w-4 text-brik' : 'h-3.5 w-3.5 text-mint sm:h-4 sm:w-4'}`}
        />
        <span className={`truncate ${lateral ? 'flex-1 text-left' : 'max-w-[8.5rem] sm:max-w-[14rem]'}`}>
          {centro ? `Até ${raio} km` : 'Todas as cidades'}
        </span>
        <span
          className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
            lateral ? 'bg-surface-raise text-mute' : 'bg-white/15'
          }`}
        >
          {total}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-300 ${lateral ? 'h-4 w-4' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'} ${
            aberto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {aberto && (
        <div
          className={`painel-pop ${classePosicaoPainel(lateral)} overflow-hidden rounded-2xl bg-surface-card p-3 text-ink ring-1 ring-line sm:p-4`}
        >
          {centro ? (
            <>
              <div className="overflow-hidden rounded-xl border border-line bg-[#e9ece6] dark:bg-[#13201f]">
                <MapaReal lat={centro.lat} lng={centro.lng} raioKm={raio} raioPx={RAIO_NO_MAPA} altura={150}>
                  {local && (
                    <span className="absolute left-2 top-2 max-w-[70%] truncate rounded-full bg-surface-card/90 px-2 py-1 text-[10px] font-bold text-ink">
                      {local}
                    </span>
                  )}
                </MapaReal>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <label htmlFor={lateral ? 'raio-lateral' : 'raio'} className="text-sm font-bold">
                  Raio
                </label>
                <span className="text-xl font-bold tabular-nums text-brik">{raio} km</span>
              </div>
              <input
                ref={reguaRef}
                id={lateral ? 'raio-lateral' : 'raio'}
                type="range"
                min="1"
                max="100"
                step="1"
                value={raio}
                onChange={(event) => onRaio(Number(event.target.value))}
                aria-valuetext={`${raio} quilômetros`}
                className="mt-1 w-full cursor-pointer accent-brik"
              />
              <div aria-hidden="true" className="flex justify-between text-[10px] text-mute">
                <span>1 km</span>
                <span>100 km</span>
              </div>

              <div className="mt-2 flex gap-1.5">
                {ATALHOS.map((km) => (
                  <button
                    key={km}
                    type="button"
                    aria-pressed={raio === km}
                    onClick={() => onRaio(km)}
                    className={`flex-1 rounded-full py-1 text-xs font-medium transition-colors ${
                      raio === km ? 'bg-brik text-paper' : 'bg-surface-raise text-ink hover:bg-line/70'
                    }`}
                  >
                    {km} km
                  </button>
                ))}
              </div>

              <p className="mt-3 text-xs text-mute" aria-live="polite">
                {plural(total)} até {raio} km{local ? ` de ${local}` : ''}
              </p>
            </>
          ) : (
            <p className="text-sm text-mute">
              Não sabemos de onde você sai, então o feed mostra ofertas de todas as cidades.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default FiltroRaio
