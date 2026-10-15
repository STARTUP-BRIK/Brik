import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePreferenciasStore } from '../../stores/usePreferenciasStore.js'
import { distanciaKm, useLugares } from '../../lib/lugares.js'
import { destaque } from './estilo.js'

// Mapa de verdade do raio de busca (tela 12), centrado no ponto da pessoa. Os
// tiles são os mapas "Canvas" da Esri (cinza claro ou escuro, com o tema), que
// trazem os nomes das ruas e não pedem chave. Sem biblioteca de mapa: são as
// imagens de 256 px de um nível de zoom inteiro, ampliadas até o zoom exato.
//
// O zoom sai do raio: o círculo tem `raioPx` de raio na tela e o mapa se
// afasta ou se aproxima para ele cobrir os quilômetros certos. Quando chega um
// ponto novo, o mapa abre na rua (zoom 16), com a bolinha e o nome dela, e
// depois se afasta até o raio.

const TILE = 256
// Os mapas Canvas vão até o nível 16; acima disso a imagem só é ampliada.
const ZOOM_MAXIMO = 16
const RUA = 16
// Abertura na rua: segura, depois se afasta (ms).
const ABERTURA = { segura: 1000, afasta: 1400 }

// Posição em pixels no mundo, no zoom z (Web Mercator, o dos tiles).
function pixelDoMundo(lat, lng, z) {
  const n = TILE * 2 ** z
  const seno = Math.sin((lat * Math.PI) / 180)
  return {
    x: ((lng + 180) / 360) * n,
    y: (0.5 - Math.log((1 + seno) / (1 - seno)) / (4 * Math.PI)) * n,
  }
}

// Zoom que anda até `alvo` quadro a quadro (desacelerando no fim), em vez de
// pular: segue o raio mesmo enquanto ele é arrastado. Com movimento reduzido,
// vai direto.
const DURACAO_ZOOM = 450

// Devolve o zoom do momento e o nível de onde o movimento saiu (as imagens dele
// já estão carregadas e cobrem o quadro enquanto o mapa anda).
function useZoomSuave(alvo) {
  const [zoom, setZoom] = useState(alvo)
  const atual = useRef(alvo)
  const partida = useRef(Math.floor(alvo))

  useEffect(() => {
    const inicio = atual.current
    if (Math.abs(alvo - inicio) < 0.001) return
    partida.current = Math.floor(inicio)
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t0 = performance.now()
    let quadro
    const passo = (agora) => {
      const t = reduzido ? 1 : Math.min(1, (agora - t0) / DURACAO_ZOOM)
      atual.current = inicio + (alvo - inicio) * (1 - (1 - t) ** 3)
      // Chegou: a camada de partida não precisa mais ficar montada.
      if (t === 1) partida.current = Math.floor(alvo)
      setZoom(atual.current)
      if (t < 1) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [alvo])

  // eslint-disable-next-line react-hooks/refs
  return { zoom, partida: partida.current }
}

const MAXIMO_DE_NOMES = 14
const ORDEM = { c: 0, b: 1, v: 2 }
const cabe = (a, b) => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y

// Quais nomes entram e onde, com o mapa já no zoom do raio (`exato`): só os
// lugares dentro do raio, cidades primeiro e depois os bairros, do mais perto
// para o mais longe. O nome fica em cima do ponto do lugar ou, se ali não
// couber, logo abaixo, acima ou ao lado. Nenhum cobre outro, nem o ponto da
// pessoa com a rua, nem os textos dos cantos (o raio, que vem em children, e os
// créditos).
function escolherNomes({ lugares, lat, lng, exato, raioKm, largura, altura, larguraRua }) {
  const centro = pixelDoMundo(lat, lng, exato)
  const candidatos = []
  for (const [nome, latL, lngL, tipo] of lugares) {
    const km = distanciaKm(lat, lng, latL, lngL)
    if (km > raioKm) continue
    const p = pixelDoMundo(latL, lngL, exato)
    const x = p.x - centro.x + largura / 2
    const y = p.y - centro.y + altura / 2
    if (x < 0 || x > largura || y < 0 || y > altura) continue
    candidatos.push({ nome, tipo, km, x, y })
  }
  // Vizinhanças (loteamentos, vilas) só onde o OpenStreetMap não tem bairro.
  const temBairro = candidatos.some((c) => c.tipo === 'b')
  candidatos.sort((a, b) => ORDEM[a.tipo] - ORDEM[b.tipo] || a.km - b.km)

  const ocupados = [
    { x: largura / 2 - 12, y: altura / 2 - 12, w: 24, h: 24 },
    { x: largura / 2 - larguraRua / 2, y: altura / 2 - 40, w: larguraRua, h: 26 },
    { x: 0, y: altura - 42, w: 140, h: 42 },
    { x: largura - 180, y: altura - 18, w: 180, h: 18 },
  ]
  const escolhidos = []
  for (const c of candidatos) {
    if (escolhidos.length >= MAXIMO_DE_NOMES) break
    if (c.tipo === 'v' && temBairro) continue
    // Largura do nome em maiúsculas e negrito (11 px cidade, 10 px bairro), com folga.
    const w = c.nome.length * (c.tipo === 'c' ? 7.6 : 6.9) + 10
    const desvios = [[0, 0], [0, 14], [0, -14], [-(w / 2 + 6), 0], [w / 2 + 6, 0]]
    for (const [dx, dy] of desvios) {
      const caixa = { x: c.x + dx - w / 2, y: c.y + dy - 8, w, h: 16 }
      if (caixa.x < 2 || caixa.x + w > largura - 2 || caixa.y < 2 || caixa.y + 16 > altura - 2) continue
      if (!ocupados.every((o) => cabe(caixa, o))) continue
      ocupados.push(caixa)
      escolhidos.push({ ...c, dx, dy })
      break
    }
  }
  return escolhidos
}

// Nomes dos lugares dentro do raio: aparecem conforme o círculo chega até eles.
// A escolha é feita no zoom de destino e não muda enquanto o mapa anda; os
// nomes só acompanham o zoom do momento (`zoom`), sem piscar.
function NomesDosLugares({ lugares, lat, lng, zoom, exato, raioKm, largura, altura, larguraRua }) {
  const nomes = useMemo(
    () => escolherNomes({ lugares, lat, lng, exato, raioKm, largura, altura, larguraRua }),
    [lugares, lat, lng, exato, raioKm, largura, altura, larguraRua],
  )
  const escala = 2 ** (zoom - exato)

  return nomes.map((c) => (
    <span
      key={`${c.nome}|${c.tipo}`}
      className={`ob-anima pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap uppercase leading-4 [text-shadow:0_0_3px_var(--color-surface),0_0_3px_var(--color-surface),0_0_2px_var(--color-surface)] ${
        c.tipo === 'c' ? 'text-[11px] font-bold tracking-[0.04em] text-ink/80' : 'text-[10px] font-bold tracking-[0.06em] text-ink/60'
      }`}
      style={{
        left: largura / 2 + (c.x - largura / 2) * escala + c.dx,
        top: altura / 2 + (c.y - altura / 2) * escala + c.dy,
        animation: 'ob-mostra .4s ease both',
      }}
    >
      {c.nome}
    </span>
  ))
}

// Uma camada de tiles do nível de zoom `nivel` (inteiro), ampliada até o zoom
// `exato`, com o ponto (lat, lng) no meio da caixa. Cada imagem aparece com um
// fade quando termina de carregar (.ob-tile no index.css).
function Camada({ lat, lng, exato, nivel, largura, altura, escuro, className = '', style }) {
  const zoom = nivel ?? Math.min(ZOOM_MAXIMO, Math.max(2, Math.floor(exato)))
  const escala = 2 ** (exato - zoom)
  const centro = pixelDoMundo(lat, lng, zoom)
  // Camada vista de mais longe que o nível dela (escala < 1) não pede imagens
  // novas: fica com as que cobrem o quadro no tamanho natural, no centro.
  const cobertura = Math.max(escala, 1)
  const meiaLargura = largura / 2 / cobertura
  const meiaAltura = altura / 2 / cobertura
  const total = 2 ** zoom
  const estilo = escuro ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'

  const tiles = []
  for (let tx = Math.floor((centro.x - meiaLargura) / TILE); tx <= Math.floor((centro.x + meiaLargura) / TILE); tx++) {
    for (let ty = Math.floor((centro.y - meiaAltura) / TILE); ty <= Math.floor((centro.y + meiaAltura) / TILE); ty++) {
      if (ty < 0 || ty >= total) continue
      const x = ((tx % total) + total) % total
      tiles.push({ chave: `${zoom}/${tx}/${ty}`, caminho: `${zoom}/${ty}/${x}`, esquerda: tx * TILE - centro.x, topo: ty * TILE - centro.y })
    }
  }

  // A camada fica com o canto no ponto da pessoa (o meio da caixa) e amplia a
  // partir dele.
  return (
    <div
      className={`absolute ${className}`}
      style={{ left: largura / 2, top: altura / 2, transform: `scale(${escala})`, transformOrigin: '0 0', ...style }}
    >
      {tiles.map((t) => (
        <img
          key={t.chave}
          src={`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${estilo}/MapServer/tile/${t.caminho}`}
          alt=""
          draggable="false"
          decoding="async"
          onLoad={(evento) => (evento.currentTarget.dataset.ok = '')}
          className="ob-tile absolute max-w-none select-none"
          style={{ left: t.esquerda, top: t.topo, width: TILE, height: TILE }}
        />
      ))}
    </div>
  )
}

export function MapaReal({ lat, lng, raioKm, raioPx, rua, altura = 210, children }) {
  const escuro = usePreferenciasStore((state) => state.modoEscuro)
  const lugares = useLugares()
  const caixa = useRef(null)
  const [largura, setLargura] = useState(350)

  useLayoutEffect(() => {
    const el = caixa.current
    if (!el) return
    const medir = () => setLargura(el.clientWidth)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  // Abertura na rua a cada ponto novo: dura até o ponto entrar em `terminou`.
  const ponto = `${lat},${lng}`
  const [terminou, setTerminou] = useState(null)
  useEffect(() => {
    const timer = setTimeout(() => setTerminou(ponto), ABERTURA.segura + ABERTURA.afasta + 200)
    return () => clearTimeout(timer)
  }, [ponto])
  const naAbertura = terminou !== ponto

  // Zoom em que `raioKm` ocupa `raioPx`: metros por pixel = 156543 × cos(lat) / 2^z.
  const exato = Math.log2((raioPx * 156543.03392 * Math.cos((lat * Math.PI) / 180)) / (raioKm * 1000))
  const { zoom, partida } = useZoomSuave(exato)
  const nivelDe = (z) => Math.min(ZOOM_MAXIMO, Math.max(3, Math.floor(z)))
  const nivel = nivelDe(zoom)
  // Camadas, da mais longe (embaixo) para a mais perto (em cima): o nível de
  // destino (já carregando desde o começo do movimento), o de partida (já
  // carregado), o atual e um abaixo dele. Assim o mapa nunca pisca em branco
  // ao passar de um nível para outro. A key é o nível: a camada que já estava
  // carregada continua montada.
  const niveis = [...new Set([nivelDe(exato), nivelDe(partida), nivel - 1, nivel])].sort((a, b) => a - b)

  return (
    <div ref={caixa} className="relative overflow-hidden" style={{ height: altura }}>
      {niveis.map((n) => (
        <Camada key={n} lat={lat} lng={lng} exato={zoom} nivel={n} largura={largura} altura={altura} escuro={escuro} />
      ))}
      {/* A rua de perto, por cima, encolhendo e sumindo até o zoom do raio. */}
      {naAbertura && (
        <Camada
          lat={lat}
          lng={lng}
          exato={RUA}
          largura={largura}
          altura={altura}
          escuro={escuro}
          className="ob-anima"
          style={{
            '--ob-afasta': 2 ** (exato - RUA),
            animation: `ob-afasta ${ABERTURA.afasta}ms cubic-bezier(.65,0,.35,1) ${ABERTURA.segura}ms both`,
          }}
        />
      )}

      {/* Círculo do raio: entra quando o mapa termina de se afastar. */}
      <span
        className="ob-anima absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ob-destaque bg-ob-destaque/12 transition-[width,height] duration-[250ms] ease-[ease]"
        style={{
          width: raioPx * 2,
          height: raioPx * 2,
          animation: naAbertura ? `ob-mostra .5s ease ${(ABERTURA.segura + ABERTURA.afasta - 300) / 1000}s both` : undefined,
        }}
      />
      {/* Nomes dos bairros e cidades dentro do raio (depois da abertura na rua). */}
      {lugares && !naAbertura && (
        <NomesDosLugares
          lugares={lugares}
          lat={lat}
          lng={lng}
          zoom={zoom}
          exato={exato}
          raioKm={raioKm}
          largura={largura}
          altura={altura}
          // Largura da etiqueta da rua (11 px, negrito), até 80% do mapa.
          larguraRua={rua ? Math.min(largura * 0.8, rua.length * 6.2 + 22) : 0}
        />
      )}

      {/* O ponto da pessoa, com o nome da rua em cima. */}
      <span
        className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ob-circulo bg-ob-destaque"
        style={{ boxShadow: `0 0 0 6px ${destaque(25)}` }}
      />
      {rua && (
        <span className="absolute left-1/2 top-1/2 max-w-[80%] -translate-x-1/2 -translate-y-[calc(100%+14px)] truncate rounded-full bg-surface-card px-2.5 py-1 text-[11px] font-bold text-ink shadow-[0_4px_12px_-4px_rgba(0,0,0,0.35)]">
          {rua}
        </span>
      )}

      {children}
      <span className="absolute bottom-1 right-1.5 rounded bg-surface/75 px-1 text-[9px] leading-[14px] text-ink/60">
        © Esri, HERE, Garmin, OpenStreetMap
      </span>
    </div>
  )
}
