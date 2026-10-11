import { useEffect, useState } from 'react'
import { CalculatorIcon } from '../../components/icons.jsx'
import { CardExemplo } from './CardExemplo.jsx'
import { EXEMPLOS } from './exemplos.js'
import { caminho } from './fluxo.js'
import { Botao, Caixa, Grafico, Radar, Tela } from './pecas.jsx'
import { SAIDA, brilho, destaque } from './estilo.js'

// 02, 02b e 03: o problema (rolar anúncio sem parar) e a solução (o Brik busca).

const ANUNCIOS = [
  { t: 'iPhone 13 · 128GB', p: 'R$ 2.700', l: 'Jaboatão · ontem' },
  { t: 'Xbox Series S', p: 'R$ 1.800', l: 'Paulista · há 5 h' },
  { t: 'iPhone 11 · 128GB', p: 'R$ 1.500', l: 'Casa Amarela · há 1 h' },
  { t: 'PS4 Pro 1TB', p: 'R$ 1.600', l: 'Olinda · há 2 dias' },
  { t: 'iPhone 12 Pro · 256GB', p: 'R$ 3.400', l: 'Boa Viagem · há 3 h' },
  { t: 'Nintendo Switch OLED', p: 'R$ 2.100', l: 'Camaragibe · ontem' },
  { t: 'iPhone XR · 64GB', p: 'R$ 1.150', l: 'Recife · há 40 min' },
  { t: 'PS5 Slim', p: 'R$ 3.400', l: 'Jaboatão · há 6 h' },
  { t: 'iPhone 14 · 128GB', p: 'R$ 3.900', l: 'Paulista · há 2 h' },
  { t: 'Xbox One S', p: 'R$ 900', l: 'Igarassu · há 4 dias' },
]

// O relógio começa em 01:47:12 e anda enquanto a tela está aberta.
function useRelogio(inicio) {
  const [segundos, setSegundos] = useState(inicio)
  useEffect(() => {
    const timer = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])
  const dois = (n) => String(n).padStart(2, '0')
  return `${dois(Math.floor(segundos / 3600))}:${dois(Math.floor((segundos % 3600) / 60))}:${dois(segundos % 60)}`
}

// 02 · Pergunta retórica, nada é salvo. Anúncios sobem sem parar e o relógio
// conta o tempo rolando.
export function Rolagem() {
  const tempo = useRelogio(6432)

  return (
    <Tela
      className="px-5 pb-7 pt-14"
      fundo={`radial-gradient(90% 40% at 50% 0%, ${brilho(22)}, transparent 70%), var(--color-surface)`}
    >
      <h1 className="text-[31px] font-bold leading-[1.12] tracking-[-0.02em] text-ob-titulo">
        Quantos anúncios você abriu hoje até achar <span className="text-ob-destaque">um</span> que valia a pena?
      </h1>

      <div className="relative mt-[22px] min-h-0 flex-1">
        <div
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0, #000 14%, #000 80%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 14%, #000 80%, transparent 100%)',
          }}
        >
          {/* Lista em dobro: a rolagem sobe metade da altura e recomeça sem emenda. */}
          <div className="ob-anima" style={{ animation: 'ob-rolar 5.5s linear infinite' }}>
            {[...ANUNCIOS, ...ANUNCIOS].map((a, i) => (
              <div
                key={i}
                className="mb-2.5 flex items-center gap-3 rounded-[14px] border border-[#dddcd6] bg-surface-card px-3 py-2.5 dark:border-[#22323a]"
              >
                <span className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[10px] bg-surface-raise">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="stroke-[#9a988f] dark:stroke-[#5f6f6d]">
                    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
                    <circle cx="9" cy="10" r="1.6" />
                    <path d="m20.5 16-5-5-8 8.5" />
                  </svg>
                </span>
                <span className="flex min-w-0 flex-col gap-0.5 leading-[1.2]">
                  <span className="text-sm font-medium text-ink">{a.t}</span>
                  <span className="text-[15px] font-bold text-ob-titulo">{a.p}</span>
                  <span className="text-[11.5px] text-mute">{a.l}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <span
          role="timer"
          aria-label="Tempo rolando anúncios"
          className="absolute right-0 top-1.5 z-[2] inline-flex items-center gap-2 rounded-full border border-loss/55 bg-white/92 px-3 py-[7px] font-mono text-xs text-loss shadow-[0_8px_20px_-10px_rgba(0,0,0,0.8)] dark:bg-[rgba(14,22,24,0.88)]"
        >
          <span className="ob-anima h-[7px] w-[7px] rounded-full bg-loss" style={{ animation: 'ob-pisca 1s steps(1) infinite' }} />
          rolando há {tempo}
        </span>
      </div>

      <Botao to={caminho('jeito-melhor')} sombra seta className="mt-[18px]">
        Tem um jeito melhor
      </Botao>
    </Tela>
  )
}

// 02b · Um quadrado da grade acende, a câmera aproxima nele (a grade cresce e
// apaga) e ele cresce até virar o card do app, com a média e o lucro.
export function JeitoMelhor() {
  // Centrado no quadrado do meio da grade (175, 260): o card ampliado tem ~456 px.
  const quadro = 'absolute left-16 top-[30px] h-[460px] w-[222px] rounded-[21px]'

  return (
    <Tela
      className="px-5 pb-7 pt-14"
      fundo={`radial-gradient(70% 45% at 50% 52%, ${destaque(14)}, transparent 70%), var(--color-surface)`}
    >
      <p className="relative z-[1] font-mono text-[11px] uppercase tracking-[0.18em] text-ob-destaque">Tem um jeito melhor</p>
      <h1 className="relative z-[1] mt-2.5 text-[30px] font-bold leading-[1.12] tracking-[-0.02em] text-ob-titulo">
        O Brik encontra o <span className="text-ob-destaque">um</span> por você.
      </h1>

      <div className="relative mt-3.5 h-[520px] w-[350px] shrink-0 self-center">
        <div
          aria-hidden="true"
          className="ob-anima absolute inset-0"
          style={{
            transformOrigin: '175px 260px',
            opacity: 0.3,
            transform: 'scale(2.4)',
            animation: 'ob-aproxima 1.1s cubic-bezier(.65,0,.35,1) .7s both',
          }}
        >
          <svg width="350" height="520" viewBox="0 0 350 520" className="block">
            <defs>
              <pattern id="ob-ladrilho" x="21" y="13" width="44" height="44" patternUnits="userSpaceOnUse">
                <rect x="5" y="5" width="34" height="34" rx="8" strokeWidth="1" className="fill-surface-card stroke-[#dddcd6] dark:stroke-[#22323a]" />
              </pattern>
              <radialGradient id="ob-esmaece" cx="50%" cy="50%" r="62%">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.7" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
              <mask id="ob-mascara">
                <rect width="350" height="520" fill="url(#ob-esmaece)" />
              </mask>
            </defs>
            <rect width="350" height="520" fill="url(#ob-ladrilho)" mask="url(#ob-mascara)" />
          </svg>
        </div>

        <div
          aria-hidden="true"
          className={`ob-anima ${quadro}`}
          style={{
            boxShadow: `0 0 0 1.5px ${destaque(55)}, 0 30px 80px -10px ${destaque(35)}`,
            animation: 'ob-mostra .6s ease 1.7s both',
          }}
        />
        <div
          className={`ob-anima ${quadro}`}
          style={{
            clipPath: 'inset(0 round 21px)',
            animation: `ob-acende .5s ${SAIDA} .1s both, ob-cresce .9s cubic-bezier(.65,0,.35,1) .8s both`,
          }}
        >
          {/* O card do feed no tamanho do canvas (171 px) ampliado 1,3×; sempre claro. */}
          <div className="tema-claro absolute left-0 top-0 flex h-[353.85px] w-[171px] origin-top-left scale-[1.3]">
            <CardExemplo anuncio={EXEMPLOS.iphone13} />
          </div>
          <div
            aria-hidden="true"
            className="ob-anima absolute inset-0 bg-ob-destaque"
            style={{ opacity: 0, animation: 'ob-apaga .4s ease 1.65s both' }}
          />
        </div>
      </div>

      <p
        className="ob-anima relative z-[1] mt-3.5 text-center text-[15px] leading-[1.45] text-mute"
        style={{ animation: `ob-sobe-8 .5s ${SAIDA} 1.95s both` }}
      >
        A <strong className="font-bold text-ink">média da região</strong> e o{' '}
        <strong className="font-bold text-ink">seu lucro</strong> já vêm calculados.
      </p>

      <Botao
        to={caminho('solucao')}
        sombra
        seta
        className="ob-anima relative z-[1] mt-auto"
        style={{ animation: `ob-sobe-8 .5s ${SAIDA} 1.95s both` }}
      >
        Continuar
      </Botao>
    </Tela>
  )
}

// A órbita começa a girar quando o último ícone termina de entrar (1,1 s de
// atraso + 0,6 s de entrada) e dá uma volta a cada 24 s.
const GIRO = '24s linear 1.7s infinite'

// Círculo claro com o ícone em petróleo e o nome por fora, com o centro em
// (x, y) da órbita. Enquanto a órbita gira, ele gira ao contrário: fica sempre
// em pé, com o nome legível.
function Orbita({ x, y, atraso, rotulo, rotuloEmCima, children }) {
  return (
    <div className="absolute h-16 w-16" style={{ left: x - 32, top: y - 32 }}>
      <div className="ob-anima h-full w-full" style={{ animation: `ob-gira ${GIRO} reverse` }}>
        <div className="ob-anima relative h-full w-full" style={{ animation: `ob-entra .6s ${SAIDA} ${atraso} both` }}>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ob-circulo shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)]">
            {children}
          </span>
          <span
            className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-bold text-ob-titulo ${
              rotuloEmCima ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            {rotulo}
          </span>
        </div>
      </div>
    </div>
  )
}

// 03 · O que o Brik faz: os aros pulsam do centro e os quatro ícones entram em
// órbita, um em cada canto, no sentido do relógio. Com os quatro na tela, a
// órbita passa a girar no sentido do relógio.
export function Solucao() {
  return (
    <Tela
      className="px-6 pb-7 pt-14"
      fundo={`radial-gradient(80% 45% at 50% 55%, ${brilho(20)}, transparent 70%), var(--color-surface)`}
    >
      <h1 className="text-[31px] font-bold leading-[1.12] tracking-[-0.02em] text-ob-titulo">Agora o Brik faz essa busca por você.</h1>
      <p className="mt-3 text-base leading-[1.45] text-mute">E guarda o resultado. Tudo num lugar só.</p>

      <div className="relative mx-auto mt-[92px] h-[300px] w-[300px] shrink-0">
        <span aria-hidden="true" className="ob-anima ob-onda absolute inset-0 rounded-full border-[1.5px] border-ob-destaque" style={{ animation: `ob-onda 2.8s ${SAIDA} infinite` }} />
        <span aria-hidden="true" className="ob-anima ob-onda absolute inset-0 rounded-full border-[1.5px] border-ob-destaque" style={{ animation: `ob-onda 2.8s ${SAIDA} 1.4s infinite` }} />
        <span aria-hidden="true" className="absolute inset-0 rounded-full border-[1.5px] border-ob-destaque/28" />
        <span aria-hidden="true" className="absolute inset-[46px] rounded-full border-[1.5px] border-dashed border-ob-destaque/38" />

        <div
          className="ob-anima absolute left-[92px] top-[92px] flex h-[116px] w-[116px] items-center justify-center rounded-full bg-[#0f4c5c]"
          style={{
            boxShadow: `0 0 0 10px ${destaque(8)}, 0 0 60px ${brilho(50)}`,
            animation: `ob-entra .6s ${SAIDA} both`,
          }}
        >
          <img src="/logoBrik.png" alt="Brik" className="block h-auto w-20" />
        </div>

        {/* Os quatro no aro de fora (raio de 150 px), um em cada diagonal. */}
        <div className="ob-anima absolute inset-0" style={{ animation: `ob-gira ${GIRO}` }}>
          <Orbita x={44} y={44} atraso=".35s" rotulo="Radar" rotuloEmCima>
            <Radar miolo width="30" height="30" className="text-[#0f4c5c]" />
          </Orbita>
          <Orbita x={256} y={44} atraso=".6s" rotulo="Estoque" rotuloEmCima>
            <Caixa width="30" height="30" className="text-[#0f4c5c]" />
          </Orbita>
          <Orbita x={256} y={256} atraso=".85s" rotulo="Dashboard">
            <Grafico width="30" height="30" className="text-[#0f4c5c]" />
          </Orbita>
          <Orbita x={44} y={256} atraso="1.1s" rotulo="Calculadora">
            <CalculatorIcon width="28" height="28" className="text-[#0f4c5c]" />
          </Orbita>
        </div>
      </div>

      <Botao to={caminho('equipe')} sombra seta>
        Montar o meu
      </Botao>
    </Tela>
  )
}
