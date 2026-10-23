import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useViewTransitionState } from 'react-router-dom'
import { NAV_ITEMS, ADD_ITEM, ADD_MENU } from '../config/navItems.js'
import { PlusIcon } from './icons.jsx'

const SPRING = 'cubic-bezier(0.22, 1.12, 0.36, 1)'
const SMOOTH = 'cubic-bezier(0.32, 0.72, 0, 1)'
const GLIDE = 'cubic-bezier(0.33, 0.02, 0.15, 1)'
const DRAG_THRESHOLD = 6

// As abas ficam em uma única pílula de vidro, metade de cada lado do botão "+".
const SPLIT = NAV_ITEMS.length / 2
const LEFT_ITEMS = NAV_ITEMS.slice(0, SPLIT)
const RIGHT_ITEMS = NAV_ITEMS.slice(SPLIT)

function getActiveIndex(pathname) {
  return NAV_ITEMS.findIndex(({ path }) =>
    path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`),
  )
}

const at = (x, sx = 1, sy = 1) => `translateX(${x}px) scale(${sx}, ${sy})`
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Lente de verdade (Liquid Glass): um filtro SVG no backdrop-filter que entorta o
// que está atrás da bolha. Só o Chromium aplica filtro SVG no fundo; o WebKit
// (Safari e qualquer navegador do iPhone) e o Firefox ficam com o vidro só em CSS.
// `userAgentData` só existe no Chromium.
const REFRACAO =
  typeof navigator !== 'undefined' &&
  'userAgentData' in navigator &&
  CSS.supports('backdrop-filter', 'url(#a)')

// Deslocamento máximo (px) que o mapa consegue descrever, metade para cada lado.
const LENTE_ESCALA = 80

// Mapa de deslocamento da bolha (uma pílula w x h): o vermelho diz quanto puxar
// em x e o verde em y, com 128 = parado. Na faixa da borda o fundo é puxado de
// dentro para fora, como na beirada curva de uma gota, e o miolo amplia como uma
// lupa. A lente só aparece em movimento, então pode ser forte.
function mapaDaLente(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const imagem = ctx.createImageData(w, h)
  const raio = h / 2
  const borda = Math.min(14, raio * 0.5) // largura da faixa que refrata
  const forca = 22 // px puxados para dentro bem na beirada
  const zoom = 0.2 // ~25% de ampliação no miolo
  const codifica = (px) => Math.max(0, Math.min(255, Math.round(128 + (px / LENTE_ESCALA) * 255)))

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5
      const py = y + 0.5
      // Distância até a borda da pílula: até o segmento central, menos o raio.
      const vx = px - Math.min(Math.max(px, raio), w - raio)
      const vy = py - raio
      const dist = Math.hypot(vx, vy)
      const dentro = raio - dist

      let dx = -(px - w / 2) * zoom
      let dy = -(py - h / 2) * zoom
      if (dentro < borda && dist > 0) {
        const curva = (1 - Math.max(dentro, 0) / borda) ** 2 * forca
        dx -= (vx / dist) * curva
        dy -= (vy / dist) * curva
      }

      const i = (y * w + x) * 4
      imagem.data[i] = codifica(dx)
      imagem.data[i + 1] = codifica(dy)
      imagem.data[i + 2] = 128
      imagem.data[i + 3] = 255
    }
  }
  ctx.putImageData(imagem, 0, 0)
  return canvas.toDataURL()
}

// Cada canal de cor é deslocado com uma força um pouco diferente e depois os três
// são somados: nas bordas eles se separam, a aberração cromática de uma lente.
const CANAIS = [
  { nome: 'r', escala: 1, matriz: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { nome: 'g', escala: 0.93, matriz: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { nome: 'b', escala: 0.86, matriz: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0' },
]

function FiltroLente({ w, h, mapa }) {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <filter
        id="lente-navbar"
        x="0"
        y="0"
        width={w}
        height={h}
        filterUnits="userSpaceOnUse"
        primitiveUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feImage href={mapa} x="0" y="0" width={w} height={h} preserveAspectRatio="none" result="mapa" />
        {CANAIS.map(({ nome, escala, matriz }) => [
          <feDisplacementMap
            key={`d${nome}`}
            in="SourceGraphic"
            in2="mapa"
            scale={LENTE_ESCALA * escala}
            xChannelSelector="R"
            yChannelSelector="G"
            result={`d${nome}`}
          />,
          <feColorMatrix key={nome} in={`d${nome}`} type="matrix" values={matriz} result={nome} />,
        ])}
        <feBlend in="r" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="b" mode="screen" result="rgb" />
        <feColorMatrix in="rgb" type="saturate" values="1.4" />
      </filter>
    </svg>
  )
}

function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const activeIndex = getActiveIndex(pathname)
  const [pressed, setPressed] = useState(false)
  // Menu do "+": escolher entre o estoque e o Verificar IMEI. Fecha ao trocar de
  // tela, ao tocar fora e no Esc.
  const [menuAberto, setMenuAberto] = useState(false)
  const [menuDaRota, setMenuDaRota] = useState(pathname)
  if (menuDaRota !== pathname) {
    setMenuDaRota(pathname)
    setMenuAberto(false)
  }
  const navRef = useRef(null)
  // A conta da calculadora é tela cheia, sem navbar. Só nas navegações de/para ela
  // a barra ganha um view-transition-name, e o index.css a faz descer ao sair e
  // subir ao voltar. Nas trocas de aba o nome fica de fora, para não transformar a barra
  // em imagem durante a transição e esconder a bolha deslizando.
  const paraCalculadora = useViewTransitionState('/calculadora/nova')
  const paraNovoProduto = useViewTransitionState('/adicionar/novo')
  const paraEditarPerfil = useViewTransitionState('/perfil/editar')
  const toCalculator = paraCalculadora || paraNovoProduto || paraEditarPerfil
  // A barra só vira imagem (view-transition-name) quando está SAINDO. Na volta
  // ela entra viva, animada por CSS: dentro de uma view transition o vidro perde
  // o fundo que ele borra, e sobrava só o "+" verde aparecendo sozinho.
  // Nasce true se a barra montou no meio da transição (ou seja, ela é a que está
  // chegando) e volta a false assim que a transição termina.
  const [chegando, setChegando] = useState(toCalculator)
  if (chegando && !toCalculator) setChegando(false)

  const rowRef = useRef(null)
  const lensRef = useRef(null)
  // A bolha tem duas camadas que andam juntas: o vidro claro, atrás dos ícones, e
  // a lente que refrata, na frente deles (só no Chromium, ver REFRACAO).
  const refractRef = useRef(null)
  const lenses = () => [lensRef.current, refractRef.current].filter(Boolean)
  const [lente, setLente] = useState(null) // tamanho e mapa do filtro da lente
  const slots = useRef({ x: [], width: 0 }) // posição (px) de cada aba dentro da linha
  const previousIndex = useRef(activeIndex)
  const dragFrom = useRef(null) // posição (px) de onde a bolha foi solta
  const drag = useRef({ armed: false, moved: false, startX: 0, x0: 0, x: 0 })
  const swallowClick = useRef(false)

  // Mede onde cada aba está (o "+" no meio faz a bolha não andar em passos iguais) e dimensiona a bolha para caber em uma aba.
  function measure() {
    const row = rowRef.current
    const lens = lensRef.current
    if (!row || !lens) return
    const items = [...row.querySelectorAll('[data-index]')]
    if (items.length !== NAV_ITEMS.length) return

    const rowBox = row.getBoundingClientRect()
    const boxes = items.map((item) => item.getBoundingClientRect())
    slots.current = { x: boxes.map((box) => box.left - rowBox.left), width: boxes[0].width }
    for (const layer of lenses()) {
      layer.style.top = `${boxes[0].top - rowBox.top}px`
      layer.style.width = `${boxes[0].width}px`
      layer.style.height = `${boxes[0].height}px`
    }

    // O mapa da lente é desenhado no tamanho exato da bolha; só refaz se mudar.
    const w = Math.round(boxes[0].width)
    const h = Math.round(boxes[0].height)
    if (REFRACAO && w && h) {
      setLente((atual) => (atual?.w === w && atual?.h === h ? atual : { w, h, mapa: mapaDaLente(w, h) }))
    }
  }

  // A bolha de vidro desliza de uma aba à outra e o ícone recém-selecionado dá um
  // pulo. Roda a cada mudança de rota, então também vale para o botão voltar e
  // para o arrastar.
  useLayoutEffect(() => {
    const lens = lensRef.current
    const previous = previousIndex.current
    const dropped = dragFrom.current
    previousIndex.current = activeIndex
    dragFrom.current = null

    if (!lens) return
    measure()
    // No desktop a barra fica escondida (lg:hidden) e as abas medem 0px: não há o
    // que animar, e a conta da duração dividiria por zero. Quando ela voltar a
    // aparecer, o ResizeObserver abaixo recoloca a bolha na aba certa.
    if (!slots.current.width) return
    if (activeIndex === -1) return

    const toX = slots.current.x[activeIndex]
    // Posição final; as animações abaixo partem de onde ela estava.
    for (const layer of lenses()) layer.style.transform = at(toX)

    if (previous === activeIndex) return

    // O deslize da bolha sempre acontece (é o feedback da navegação), mas com
    // "reduzir movimento" fica curto e sem pulo do ícone nem alongamento.
    const calm = reducedMotion()

    if (!calm) {
      rowRef.current
        .querySelector(`[data-index="${activeIndex}"] svg`)
        ?.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(0.94)', offset: 0.3 },
            { transform: 'scale(1.05)', offset: 0.65 },
            { transform: 'scale(1)' },
          ],
          { duration: 700, easing: SMOOTH },
        )
    }

    if (previous === -1 && dropped === null) return

    // Se outra troca ainda está em andamento, parte de onde a bolha está agora.
    let fromX = dropped ?? slots.current.x[previous]
    const running = lens.getAnimations()
    if (dropped === null && running.length > 0) {
      fromX = new DOMMatrix(getComputedStyle(lens).transform).e
    }
    for (const layer of lenses()) {
      layer.getAnimations({ subtree: true }).forEach((animation) => animation.cancel())
    }
    const bubble = lens.firstElementChild
    const glass = lenses().map((layer) => layer.firstElementChild)

    const distance = Math.abs(toX - fromX) / slots.current.width
    const duration = calm ? 200 : 760 + Math.min(distance, 3) * 110

    // Deslize contínuo: uma única curva de A até B, sem paradas no meio.
    for (const layer of lenses()) {
      layer.animate([{ transform: at(fromX) }, { transform: at(toX) }], {
        duration,
        easing: GLIDE,
      })
    }

    // Em movimento a bolha "vira líquido": o anel de blur das bordas cresce e fica
    // mais denso enquanto o centro continua nítido sobre o ícone; ao chegar, relaxa.
    const ring = (blur, opacity) => {
      const filter = `blur(${blur}px) brightness(1.35) saturate(1.5)`
      return { backdropFilter: filter, WebkitBackdropFilter: filter, opacity }
    }
    bubble.animate([ring(6, 0.6), { ...ring(12, 0.85), offset: 0.45 }, ring(6, 0.6)], {
      duration,
      easing: 'ease-in-out',
      pseudoElement: '::after',
    })
    bubble.animate(
      [
        { boxShadow: 'var(--lens-rim-rest)' },
        { boxShadow: 'var(--lens-rim-move)', offset: 0.45 },
        { boxShadow: 'var(--lens-rim-rest)' },
      ],
      { duration, easing: 'ease-in-out', pseudoElement: '::before' },
    )

    if (calm) return

    // A lupa acende logo na saída, viaja por cima das abas e some ao chegar: parada,
    // a bolha volta a ser só vidro.
    refractRef.current?.firstElementChild.animate(
      [{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }],
      { duration, easing: 'ease-in-out' },
    )

    // A gota se alonga no meio do caminho e volta ao normal, em curva própria.
    for (const layer of glass) {
      layer.animate(
        [
          { transform: 'scale(1, 1)' },
          { transform: `scale(${Math.min(1 + distance * 0.07, 1.22)}, 0.97)`, offset: 0.5 },
          { transform: 'scale(1, 1)' },
        ],
        { duration, easing: 'ease-in-out' },
      )
    }
  }, [activeIndex])

  // Reposiciona a bolha se a largura da tela (ou a fonte) mudar os tamanhos.
  useEffect(() => {
    const row = rowRef.current
    const replace = () => {
      if (drag.current.moved) return
      measure()
      const x = slots.current.x[previousIndex.current]
      if (x === undefined) return
      for (const layer of lenses()) layer.style.transform = at(x)
    }
    const observer = new ResizeObserver(replace)
    observer.observe(row)
    document.fonts?.ready.then(replace)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!menuAberto) return
    const fora = (event) => {
      if (!navRef.current?.contains(event.target)) setMenuAberto(false)
    }
    const esc = (event) => event.key === 'Escape' && setMenuAberto(false)
    document.addEventListener('pointerdown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [menuAberto])

  function onPointerDown(event) {
    const index = Number(event.target.closest('a')?.dataset.index)
    const grabbed = index === activeIndex
    const x0 = slots.current.x[activeIndex] ?? 0
    drag.current = { armed: grabbed, moved: false, startX: event.clientX, x0, x: x0 }
    setPressed(grabbed)
  }

  // Segurar a bolha da aba ativa e arrastar: ela acompanha o dedo e, ao soltar,
  // encaixa na aba mais próxima.
  function onPointerMove(event) {
    const state = drag.current
    const lens = lensRef.current
    if (!state.armed || !lens) return

    const dx = event.clientX - state.startX
    if (!state.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return
      state.moved = true
      rowRef.current.setPointerCapture(event.pointerId)
      for (const layer of lenses()) layer.getAnimations().forEach((animation) => animation.cancel())
    }

    const { x } = slots.current
    state.x = Math.min(Math.max(state.x0 + dx, x[0]), x[x.length - 1])
    for (const layer of lenses()) layer.style.transform = at(state.x, 1.04, 1)
  }

  function onPointerEnd() {
    const state = drag.current
    drag.current = { ...state, armed: false }
    setPressed(false)
    if (!state.moved) return

    swallowClick.current = true
    setTimeout(() => {
      swallowClick.current = false
    }, 50)

    const { x } = slots.current
    const target = x.reduce(
      (best, slot, index) => (Math.abs(slot - state.x) < Math.abs(x[best] - state.x) ? index : best),
      0,
    )
    if (target !== activeIndex) {
      dragFrom.current = state.x
      navigate(NAV_ITEMS[target].path, { viewTransition: true })
      return
    }

    for (const layer of lenses()) {
      layer.animate([{ transform: at(state.x, 1.04, 1) }, { transform: at(x[activeIndex]) }], {
        duration: 450,
        easing: SPRING,
      })
      layer.style.transform = at(x[activeIndex])
    }
  }

  function onPointerLeave() {
    if (drag.current.moved) return
    drag.current.armed = false
    setPressed(false)
  }

  function onClickCapture(event) {
    // O clique que vem logo após um arrastar não deve navegar de novo.
    if (swallowClick.current) event.preventDefault()
  }

  const renderItems = (items, offset) =>
    items.map(({ path, label, Icon }, i) => (
      <li key={path} className="flex-1">
        <NavLink
          to={path}
          end={path === '/'}
          viewTransition
          data-index={offset + i}
          draggable={false}
          className="nav-item flex h-16 flex-col items-center justify-center gap-1 rounded-full text-[10px] font-semibold min-[360px]:text-[11px]"
        >
          <Icon aria-hidden="true" className="h-7 w-7" />
          <span className="whitespace-nowrap">{label}</span>
        </NavLink>
      </li>
    ))

  return (
    <nav
      ref={navRef}
      aria-label="Navegação principal"
      className="glass-nav navbar-enter fixed inset-x-0 z-50 mx-auto w-[calc(100%-2rem)] max-w-sm lg:hidden"
      style={toCalculator && !chegando ? { viewTransitionName: 'navbar' } : undefined}
    >
      {menuAberto && (
        <ul
          id="menu-adicionar"
          className="menu-adicionar absolute inset-x-6 bottom-full mb-3 flex flex-col gap-1 rounded-3xl bg-surface-card p-2 shadow-xl ring-1 ring-line"
        >
          {ADD_MENU.map(({ path, label, descricao, Icon }) => (
            <li key={path}>
              <Link
                to={path}
                viewTransition
                className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors active:bg-surface-raise"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brik text-paper">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-[15px] font-bold text-ink">{label}</span>
                  <span className="block text-xs text-ink/60">{descricao}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div
        ref={rowRef}
        className="relative flex touch-none select-none items-center "
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onPointerLeave={onPointerLeave}
        onClickCapture={onClickCapture}
      >
        <div className="glass-bar absolute inset-0 rounded-full" aria-hidden="true" />

        <ul className="relative z-[2] flex w-full items-center p-1.5">
          {renderItems(LEFT_ITEMS, 0)}
          <li className="flex shrink-0 justify-center px-1">
            <button
              type="button"
              onClick={() => setMenuAberto((aberto) => !aberto)}
              aria-label={ADD_ITEM.label}
              aria-expanded={menuAberto}
              aria-controls="menu-adicionar"
              className="glass-add flex h-14 w-14 items-center justify-center rounded-full text-white"
            >
              <PlusIcon
                aria-hidden="true"
                className={`h-7 w-7 transition-transform duration-300 ${menuAberto ? 'rotate-45' : ''}`}
              />
            </button>
          </li>
          {renderItems(RIGHT_ITEMS, SPLIT)}
        </ul>

        <div
          ref={lensRef}
          aria-hidden="true"
          className={`pointer-events-none absolute left-0 z-[1] transition-opacity duration-200 ${
            activeIndex === -1 ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="glass-lens h-full w-full rounded-full" data-pressed={pressed} />
        </div>

        {/* A lupa fica na frente dos ícones para ampliá-los e entortá-los nas bordas,
            como o Liquid Glass. Só aparece no deslize e ao segurar a bolha. */}
        {REFRACAO && (
          <div
            ref={refractRef}
            aria-hidden="true"
            className={`pointer-events-none absolute left-0 z-[3] ${activeIndex === -1 ? 'invisible' : ''}`}
          >
            <div className="glass-refracao h-full w-full rounded-full" data-pressed={pressed} />
          </div>
        )}
        {lente && <FiltroLente {...lente} />}
      </div>
    </nav>
  )
}

export default Navbar
