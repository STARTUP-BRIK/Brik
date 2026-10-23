import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// Folga em px para cada lado do ponto de troca: a barra só aparece um pouco
// depois de as categorias saírem da tela e só some um pouco antes de elas
// voltarem, para não piscar quando a rolagem para bem em cima do ponto.
const FOLGA = 24

// Barra compacta do Início no celular: quando as categorias com ícone
// (`alvoRef`) saem da tela, desce do topo uma faixa mínima, na cor de fundo da página, com o "B" da
// logo e as categorias como abas de texto; a ativa fica escura com um traço
// embaixo, que desliza de uma aba para a outra. Fica fixa por cima da página,
// sem entrar no fluxo, então o conteúdo não pula na troca. À direita, o raio
// e o Filtros só com o ícone (`filtros(oculto)` desenha os dois). No desktop
// não existe (lg:hidden).
function CabecalhoCompacto({ alvoRef, categorias, ativa, onCategoria, filtros }) {
  const [compacto, setCompacto] = useState(false)
  const abasRef = useRef(null)
  const [traco, setTraco] = useState(null)

  useEffect(() => {
    let quadro = 0
    const medir = () => {
      quadro = 0
      const alvo = alvoRef.current
      if (!alvo) return
      // Distância do fim das categorias ao topo da tela: negativa quando já saíram.
      const fim = alvo.getBoundingClientRect().bottom
      setCompacto((atual) => (atual ? fim < FOLGA : fim < -FOLGA))
    }
    const agendar = () => {
      if (!quadro) quadro = requestAnimationFrame(medir)
    }
    medir()
    window.addEventListener('scroll', agendar, { passive: true })
    window.addEventListener('resize', agendar)
    return () => {
      window.removeEventListener('scroll', agendar)
      window.removeEventListener('resize', agendar)
      cancelAnimationFrame(quadro)
    }
  }, [alvoRef])

  // Com a barra por cima, o foco do teclado (Tab até um card) e os saltos de
  // rolagem param abaixo dela, sem deixar o anúncio escondido atrás.
  useEffect(() => {
    const html = document.documentElement
    html.style.scrollPaddingTop = 'calc(4rem + env(safe-area-inset-top))'
    return () => {
      html.style.scrollPaddingTop = ''
    }
  }, [])

  // Posição do traço: embaixo do texto da aba ativa. Sem categoria, ele some.
  useLayoutEffect(() => {
    const aba = abasRef.current?.querySelector('[aria-pressed="true"] span')
    setTraco(aba ? { left: aba.offsetLeft, width: aba.offsetWidth } : null)
  }, [ativa, categorias])

  return (
    <div
      // Escondida, sai da ordem do Tab e dos leitores de tela: as mesmas ações
      // já estão no header completo, que é o que está à vista.
      inert={!compacto}
      className={`barra-compacta fixed inset-x-0 top-0 z-40 mx-auto max-w-md border-b border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden ${
        compacto ? 'barra-compacta-visivel' : ''
      }`}
    >
      <div ref={abasRef} className="relative flex h-12 items-center gap-1 pl-4 pr-1">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
          aria-label="Brik, voltar ao topo"
          className="barra-compacta-item mr-1.5 flex h-12 shrink-0 items-center"
        >
          {/* Só o "B": a logo inteira vira máscara presa à esquerda e o resto
              ("Brik") fica de fora: no arquivo (676 px de altura) o símbolo vai até
              x = 550 e o texto só começa em x = 645. */}
          <span
            aria-hidden="true"
            className="block aspect-[580/676] h-7 bg-brik [mask:url(/logoBrik.png)_left/auto_100%_no-repeat]"
          />
        </button>

        <nav aria-label="Atalhos de categoria" className="flex min-w-0 items-center">
          {categorias.map(({ value, label }, i) => {
            const active = ativa === value
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => onCategoria(active ? null : value)}
                style={{ '--i': i }}
                className={`barra-compacta-item group flex h-12 items-center whitespace-nowrap text-sm ${
                  active ? 'text-ink' : 'text-mute hover:text-ink'
                }`}
              >
                <span className="rounded-md px-2 py-1.5 transition-colors group-hover:bg-surface-raise">{label}</span>
              </button>
            )
          })}
        </nav>

        {/* Raio e Filtros: só os ícones, o Filtros encostado na borda direita. */}
        <div className="barra-compacta-item ml-auto flex shrink-0 items-center" style={{ '--i': categorias.length }}>
          {filtros(!compacto)}
        </div>

        <span
          aria-hidden="true"
          className="barra-compacta-traco absolute -bottom-px h-0.5 rounded-full bg-ink"
          style={traco ? { left: traco.left, width: traco.width } : { opacity: 0 }}
        />
      </div>
    </div>
  )
}

export default CabecalhoCompacto
