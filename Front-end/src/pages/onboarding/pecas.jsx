import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LinhasFlutuantes } from '../../components/auth.jsx'
import { ETAPAS } from './fluxo.js'

// Peças das telas do onboarding, desenhadas como no canvas (390 × 844). No
// celular a tela ocupa tudo; no desktop ela se divide como o login: o painel
// da marca à esquerda, com as etapas, e a tela numa coluna à direita. As cores
// vêm dos tokens do index.css (surface, ink, mute, line e os ob-*), que já
// trocam no modo escuro.

// --- Ícones (os traços do canvas) ---------------------------------------------

const traco = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const SetaVoltar = (p) => (
  <svg width="22" height="22" strokeWidth="2.2" {...traco} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
)
export const SetaDireita = (p) => (
  <svg width="16" height="16" strokeWidth="2.2" {...traco} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)
export const SetaBaixo = (p) => (
  <svg width="22" height="22" strokeWidth="2.2" {...traco} {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
)
export const Check = ({ largura = 2.6, ...p }) => (
  <svg width="15" height="15" strokeWidth={largura} {...traco} {...p}>
    <path d="m5 12 5 5 9-10" />
  </svg>
)
export const Xis = (p) => (
  <svg width="16" height="16" strokeWidth="2.2" {...traco} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)
export const Pessoa = (p) => (
  <svg width="20" height="20" strokeWidth="1.8" {...traco} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
  </svg>
)
export const Grupo = (p) => (
  <svg width="20" height="20" strokeWidth="1.8" {...traco} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M17 14a5 5 0 0 1 4.5 5" />
  </svg>
)
export const Radar = ({ miolo = false, ...p }) => (
  <svg width="20" height="20" strokeWidth="1.8" {...traco} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <path d="M12 12 18.5 5.5" />
    {miolo && <circle cx="12" cy="12" r="1" fill="currentColor" />}
  </svg>
)
// Gráfico de barras com a seta subindo (o ícone do dashboard).
export const Grafico = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <rect x="3" y="14" width="3.6" height="7" rx=".6" />
    <rect x="8.4" y="10.5" width="3.6" height="10.5" rx=".6" />
    <rect x="13.8" y="7.5" width="3.6" height="13.5" rx=".6" />
    <path d="m3.5 10.5 6-5 3.5 2.5 6-5.2M15.6 2.9h3.9v3.9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
// Caixa (o estoque).
export const Caixa = (p) => (
  <svg width="20" height="20" strokeWidth="1.8" {...traco} {...p}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
    <path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5" />
  </svg>
)
export const Celular = (p) => (
  <svg width="16" height="16" strokeWidth="1.8" {...traco} {...p}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
    <path d="M10.5 5h3M11 18.5h2" />
  </svg>
)
export const Controle = ({ botoes = false, ...p }) => (
  <svg width="16" height="16" strokeWidth="1.8" {...traco} {...p}>
    <path d="M7 7h10a4.5 4.5 0 0 1 4.4 5.4l-.7 3.4a2.6 2.6 0 0 1-4.4 1.3L14.5 15h-5l-1.8 2.1a2.6 2.6 0 0 1-4.4-1.3l-.7-3.4A4.5 4.5 0 0 1 7 7Z" />
    <path d="M8 9.5v3M6.5 11h3" />
    {botoes && (
      <>
        <circle cx="15.5" cy="10" r=".6" fill="currentColor" />
        <circle cx="17.5" cy="12" r=".6" fill="currentColor" />
      </>
    )}
  </svg>
)
export const Pino = (p) => (
  <svg width="16" height="16" strokeWidth="1.8" {...traco} {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
)
// Mira (usar a localização do aparelho).
export const Mira = (p) => (
  <svg width="16" height="16" strokeWidth="2" {...traco} {...p}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
)
export const Sino = (p) => (
  <svg width="18" height="18" strokeWidth="1.8" {...traco} {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" />
    <path d="M10 18a2 2 0 0 0 4 0" />
  </svg>
)
export const Lampada = (p) => (
  <svg width="18" height="18" strokeWidth="1.8" {...traco} {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2v.1h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />
  </svg>
)
export const Info = (p) => (
  <svg width="14" height="14" strokeWidth="2" {...traco} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
)
export const Cadeado = (p) => (
  <svg width="18" height="18" strokeWidth="1.8" {...traco} {...p}>
    <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
  </svg>
)
export const Envelope = (p) => (
  <svg width="18" height="18" strokeWidth="1.8" {...traco} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
  </svg>
)
export const Olho = ({ fechado = false, ...p }) => (
  <svg width="18" height="18" strokeWidth="1.8" {...traco} {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
    {fechado && <path d="M4 4l16 16" />}
  </svg>
)
export const Fone = (p) => (
  <svg width="18" height="18" strokeWidth="1.8" {...traco} {...p}>
    <path d="M5 3.5h3.2l1.6 4.2-2.2 1.4a11 11 0 0 0 5.3 5.3l1.4-2.2 4.2 1.6V17a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 3 5.7 2 2 0 0 1 5 3.5Z" />
  </svg>
)
export const Google = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
  </svg>
)

// --- Moldura ----------------------------------------------------------------------

// Tamanho do celular do canvas: tudo cabe em 390 × 844.
const LARGURA = 390
const ALTURA = 844

// Escala que faz a tela caber na janela sem rolagem: 1 quando a janela tem ao
// menos 390 × 844; menor, a tela inteira diminui por igual. A área desenhada
// fica do tamanho da janela dividido pela escala, então nunca é menor que o
// canvas e, depois de escalada, ocupa a janela exata.
//
// Teclado: no celular ele encolhe a área visível (visualViewport). A escala não
// acompanha: vale a altura da janela sem o teclado (a maior já vista nesta
// largura), para os componentes ficarem do mesmo tamanho. Enquanto o teclado
// está aberto (`teclado`), a tela rola por dentro e o campo em foco vai para a
// parte visível. Uma queda pequena (barra do navegador) não conta como teclado.
const TECLADO_MIN = 150
const semTeclado = { largura: 0, altura: 0 }

function medirEncaixe() {
  const vv = window.visualViewport
  const largura = vv?.width ?? window.innerWidth
  const visivel = vv?.height ?? window.innerHeight
  // Largura nova (girou o celular, mudou a janela): mede de novo.
  if (Math.abs(semTeclado.largura - largura) > 1 || visivel > semTeclado.altura) {
    semTeclado.largura = largura
    semTeclado.altura = visivel
  }
  const teclado = semTeclado.altura - visivel > TECLADO_MIN
  const altura = teclado ? semTeclado.altura : visivel
  const escala = Math.min(1, largura / LARGURA, altura / ALTURA)
  return { escala, largura, altura, topo: vv?.offsetTop ?? 0, visivel, teclado }
}

function useEncaixe() {
  const [encaixe, setEncaixe] = useState(medirEncaixe)
  useEffect(() => {
    const atualizar = () => setEncaixe(medirEncaixe())
    const visivel = window.visualViewport
    // Saindo de um campo (o teclado fecha): no iPhone a janela termina de voltar
    // depois do último resize. Mede de novo no fim da animação do teclado.
    let espera
    const saiuDoCampo = () => {
      clearTimeout(espera)
      espera = setTimeout(() => {
        if (document.activeElement?.matches?.('input, textarea')) return
        window.scrollTo(0, 0)
        atualizar()
      }, 350)
    }
    window.addEventListener('resize', atualizar)
    visivel?.addEventListener('resize', atualizar)
    visivel?.addEventListener('scroll', atualizar)
    document.addEventListener('focusout', saiuDoCampo)
    return () => {
      clearTimeout(espera)
      window.removeEventListener('resize', atualizar)
      visivel?.removeEventListener('resize', atualizar)
      visivel?.removeEventListener('scroll', atualizar)
      document.removeEventListener('focusout', saiuDoCampo)
    }
  }, [])
  return encaixe
}

// Com o teclado aberto, leva o campo em foco para o meio da parte visível (ao
// abrir o teclado e ao passar de um campo para outro). Rola só a caixa da tela
// (`caixa`): o scrollIntoView rolaria também a página por trás, que ficava
// deslocada depois que o teclado fechava (faixa branca no lugar dele e a tela
// cortada). Ao fechar, a caixa e a página voltam para o topo.
function useCampoVisivel(teclado, caixa) {
  useEffect(() => {
    const el = caixa.current
    if (!teclado) {
      el?.scrollTo(0, 0)
      window.scrollTo(0, 0)
      return
    }
    const mostrar = () => {
      const campo = document.activeElement
      if (!el || !campo || !el.contains(campo)) return
      const r = campo.getBoundingClientRect()
      const c = el.getBoundingClientRect()
      el.scrollBy(0, r.top + r.height / 2 - (c.top + c.height / 2))
    }
    const quadro = requestAnimationFrame(mostrar)
    document.addEventListener('focusin', mostrar)
    return () => {
      cancelAnimationFrame(quadro)
      document.removeEventListener('focusin', mostrar)
    }
  }, [teclado, caixa])
}

// Enquanto a tela está aberta, a página por trás não rola nem estica (classe
// ob-travado no <html>, ver index.css), e o fundo dela fica da cor da tela: no
// celular, o gesto de rolar não leva mais a tela junto nem mostra a faixa branca.
// Conta as telas abertas: na troca de passo, a nova monta antes de a antiga sair.
let telasAbertas = 0

function useTravaPagina(pintura) {
  useLayoutEffect(() => {
    const raiz = document.documentElement
    telasAbertas += 1
    raiz.classList.add('ob-travado')
    // Cor sólida do fundo da tela; com gradiente (sem cor sólida), a do tema.
    const cor = pintura.current ? getComputedStyle(pintura.current).backgroundColor : ''
    if (cor && cor !== 'rgba(0, 0, 0, 0)' && cor !== 'transparent') raiz.style.setProperty('--ob-fundo-pagina', cor)
    else raiz.style.removeProperty('--ob-fundo-pagina')
    return () => {
      telasAbertas -= 1
      if (telasAbertas > 0) return
      raiz.classList.remove('ob-travado')
      raiz.style.removeProperty('--ob-fundo-pagina')
    }
  }, [pintura])
}

// `fundo`: estilo do fundo (cor ou gradientes), esticado na janela inteira.
// `classeFundo`: no lugar do fundo padrão (o verde do login, na 01 e 01a).
// A tela é presa à janela (fixed) e não rola (só com o teclado aberto, ver
// useEncaixe); o conteúdo fica numa coluna no meio, que no celular ocupa a
// largura toda.
export function Tela({ fundo, classeFundo, className = '', children }) {
  const { escala, largura, altura, topo, visivel, teclado } = useEncaixe()
  const pintura = useRef(null)
  const caixa = useRef(null)
  useTravaPagina(pintura)
  useCampoVisivel(teclado, caixa)
  return (
    // Com o teclado aberto ela rola, mas sem barra de rolagem (ob-sem-barra).
    <div
      ref={caixa}
      className={`ob-sem-barra fixed inset-x-0 overscroll-none ${teclado ? 'overflow-y-auto' : 'overflow-hidden'}`}
      style={{ top: topo, height: visivel }}
    >
      {/* Do tamanho da tela já escalada: o scale não muda o tamanho que o
          navegador usa para a rolagem. */}
      <div className="overflow-hidden" style={{ width: largura, height: altura }}>
        <div
          className="relative flex origin-top-left"
          style={{
            width: largura / escala,
            height: altura / escala,
            transform: escala < 1 ? `scale(${escala})` : undefined,
          }}
        >
          {/* No computador a tela se divide como no login: o painel da marca à
              esquerda, com as etapas, e a tela à direita, com o fundo dela e a
              coluna no meio. No celular só existe a parte da direita. */}
          <PainelEtapas />
          <div
            ref={pintura}
            className={`relative flex min-w-0 flex-1 flex-col transition-colors duration-[350ms] ${classeFundo ?? (fundo ? 'text-ink' : 'bg-surface text-ink')}`}
            style={{ background: fundo }}
          >
            <div
              className={`ob-coluna relative mx-auto flex h-full w-full max-w-md flex-col overflow-hidden lg:my-auto lg:h-[844px] lg:max-w-none lg:px-16 xl:px-20 ${className}`}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Painel da esquerda no computador: o mesmo fundo verde e as linhas do login,
// a logo e as etapas do onboarding, com a atual em destaque e as já feitas com
// o check. Fica sempre no verde, nos dois temas.
function PainelEtapas() {
  const { passo } = useParams()
  const atual = ETAPAS.findIndex((etapa) => etapa.passos.includes(passo))
  return (
    <aside className="tema-claro login-bg relative hidden w-[40%] max-w-[600px] shrink-0 flex-col overflow-hidden px-12 py-10 text-paper lg:flex">
      <div aria-hidden="true" className="absolute inset-0 text-mint [contain:strict]">
        <LinhasFlutuantes direcao={1} />
        <LinhasFlutuantes direcao={-1} />
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-brik-dark/90 via-brik-dark/30 to-transparent" />

      <img src="/logoBrik.png" alt="Brik" className="logo-marca relative h-9 w-auto self-start" />

      <ol className="relative my-auto flex flex-col">
        {ETAPAS.map((etapa, i) => {
          const feita = i < atual
          const agora = i === atual
          return (
            <li key={etapa.titulo} aria-current={agora ? 'step' : undefined} className="relative flex gap-4 pb-8 last:pb-0">
              {/* Linha que liga uma etapa à seguinte. */}
              {i < ETAPAS.length - 1 && (
                <span aria-hidden="true" className={`absolute left-[15px] top-9 bottom-1 w-px ${feita ? 'bg-mint' : 'bg-paper/20'}`} />
              )}
              <span
                aria-hidden="true"
                className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] font-mono text-xs ${
                  feita
                    ? 'border-mint bg-mint text-brik'
                    : agora
                      ? 'border-paper bg-paper text-brik'
                      : 'border-paper/40 bg-brik-dark/60 text-paper/70'
                }`}
              >
                {feita ? <Check largura={3} /> : i + 1}
              </span>
              <div className="pt-1">
                <p className={`text-lg font-bold leading-tight ${agora ? 'text-paper' : feita ? 'text-paper/80' : 'text-paper/60'}`}>
                  {etapa.titulo}
                </p>
                {agora && <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-paper/75">{etapa.texto}</p>}
              </div>
            </li>
          )
        })}
      </ol>

      <p className="relative max-w-sm text-sm leading-relaxed text-paper/70">
        Garimpamos a OLX e mostramos só o que está abaixo do preço de mercado.
      </p>
    </aside>
  )
}

// Seta de voltar e barra de progresso, no topo das perguntas.
export function Topo({ voltar, progresso }) {
  return (
    <div className="flex items-center gap-1.5">
      <Link
        to={voltar}
        aria-label="Voltar"
        className="-ml-3 flex h-11 w-11 items-center justify-center rounded-xl text-ink"
      >
        <SetaVoltar />
      </Link>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-raise">
        <div className="h-full rounded-full bg-ob-destaque" style={{ width: `${progresso}%` }} />
      </div>
    </div>
  )
}

// Texto que aparece letra por letra, a partir de `inicio` (s), uma letra a cada
// `passo` (s), para dar tempo de ler. Leitores de tela recebem a frase inteira.
export function Letras({ texto, inicio, passo }) {
  return (
    <>
      <span className="sr-only">{texto}</span>
      {Array.from(texto).map((letra, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="ob-anima"
          style={{ animation: `ob-mostra .12s linear ${(inicio + i * passo).toFixed(3)}s both` }}
        >
          {letra}
        </span>
      ))}
    </>
  )
}

// Rótulo pequeno em caixa alta, acima do título.
export function Rotulo({ className = 'mt-7 text-mute', children }) {
  return <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${className}`}>{children}</p>
}

export function Titulo({ id, className = 'mt-3', children }) {
  return (
    <h1 id={id} className={`text-[28px] font-bold leading-[1.15] tracking-[-0.015em] text-ob-titulo lg:text-[36px] ${className}`}>
      {children}
    </h1>
  )
}

export function Subtitulo({ className = 'mt-2.5', children }) {
  return <p className={`text-[15px] leading-[1.45] text-mute lg:text-base ${className}`}>{children}</p>
}

// Bolinha do rádio: aro e miolo no destaque quando marcada.
export function Bolinha({ on, tamanho = 'h-5 w-5', miolo = 'h-2.5 w-2.5' }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full border-2 ${tamanho} ${
        on ? 'border-ob-destaque' : 'border-ink/40'
      }`}
    >
      <span className={`rounded-full ${miolo} ${on ? 'bg-ob-destaque' : ''}`} />
    </span>
  )
}

// Grupo de opções de uma escolha só. `opcoes`: [{ valor, titulo, detalhe? }].
// `compacta`: uma linha só (a pergunta da equipe).
export function Opcoes({ rotulo, opcoes, valor, onEscolher, compacta = false, className = 'mt-6' }) {
  return (
    <div role="radiogroup" aria-labelledby={rotulo} className={className}>
      {opcoes.map((opcao, i) => {
        const on = opcao.valor === valor
        return (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onEscolher(opcao.valor)}
            className={`flex w-full items-center gap-3.5 rounded-[14px] border-[1.5px] px-4 text-left text-ink ${
              compacta ? 'min-h-[58px] py-3.5 text-[15px] font-medium' : 'min-h-16 py-3'
            } ${i < opcoes.length - 1 ? 'mb-2.5' : ''} ${
              on ? 'border-ob-destaque bg-ob-destaque/8' : 'border-line bg-surface-card'
            }`}
          >
            {compacta ? (
              <span className="flex-1">{opcao.titulo}</span>
            ) : (
              <span className="flex flex-1 flex-col gap-[3px]">
                <span className="text-[15px] font-medium">{opcao.titulo}</span>
                {opcao.detalhe && <span className="text-[12.5px] text-mute">{opcao.detalhe}</span>}
              </span>
            )}
            <Bolinha on={on} />
          </button>
        )
      })}
    </div>
  )
}

const BOTAO = 'flex h-[52px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold'

// Botão principal (marfim no escuro, petróleo no claro), sempre no pé da tela.
// Com `to` vira link; com `onClick`, botão. `sombra`: a das telas de abertura.
export function Botao({ to, onClick, sombra = false, seta = false, className = 'mt-auto', children, ...props }) {
  const classe = `${BOTAO} bg-ob-botao text-ob-botao-texto ${sombra ? 'shadow-[0_10px_24px_-12px_rgba(0,0,0,0.7)]' : ''} ${className}`
  const conteudo = (
    <>
      {children}
      {seta && <SetaDireita />}
    </>
  )
  if (to) {
    return (
      <Link to={to} onClick={onClick} className={classe} {...props}>
        {conteudo}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={`${classe} w-full disabled:cursor-wait disabled:opacity-70`} {...props}>
      {conteudo}
    </button>
  )
}

// O botão quando ainda falta responder algo.
export function BotaoDesligado({ className = 'mt-auto', children }) {
  return (
    <span aria-disabled="true" className={`${BOTAO} bg-surface-raise text-mute ${className}`}>
      {children}
    </span>
  )
}

// Pílula com a resposta da pessoa ("Você: 1 a 2 h por dia, sozinho").
export function Resposta({ rotulo, children }) {
  return (
    <div className="mt-6 inline-flex items-center gap-2 self-start rounded-full border border-line bg-surface-card px-3 py-2 text-[13px] text-mute">
      <Check className="text-ob-destaque" />
      {rotulo}: <strong className="font-bold text-ink">{children}</strong>
    </div>
  )
}

// Nota de rodapé com o "i" ("Estimativa feita a partir das suas respostas").
export function Nota({ children }) {
  return (
    <p className="mt-3 flex items-center gap-1.5 text-xs text-mute">
      <Info />
      {children}
    </p>
  )
}

// Rótulo de seção dentro dos cartões ("Hoje", "Com o Brik").
export function Etiqueta({ className = 'text-mute', children }) {
  return <p className={`m-0 font-mono text-[10px] uppercase tracking-[0.18em] ${className}`}>{children}</p>
}
