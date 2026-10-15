import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useOnboardingStore } from '../../stores/useOnboardingStore.js'
import {
  EQUIPE,
  PROGRESSO,
  TEMPO_BUSCA,
  TEMPO_RESPOSTA,
  anterior,
  horas,
  horasCurtas,
  numero,
  proximo,
} from './fluxo.js'
import { Botao, Grupo, Opcoes, Pessoa, Radar, Resposta, Rotulo, Subtitulo, Tela, Titulo, Topo, Letras } from './pecas.jsx'
import { SAIDA, destaque } from './estilo.js'

// 04 a 09: equipe, tempo procurando, diagnóstico, tempo de resposta e a
// primeira proposta. Do 05 ao 07 há três variantes, pela resposta
// da 04: sozinho (a), equipe de 2 ou mais (b) e 1 pessoa na equipe (c, no
// singular).

const respostas = () => useOnboardingStore.getState()

// Moldura das perguntas: seta de voltar, progresso e o conteúdo.
function Pergunta({ passo, children }) {
  return (
    <Tela className="px-5 pb-7 pt-11">
      <Topo voltar={anterior(passo, respostas())} progresso={PROGRESSO[passo]} />
      {children}
    </Tela>
  )
}

// Abertura do bloco "Sobre você" (ms): o título aparece grande no meio da
// tela, segura um pouco e voa até o canto de cima, onde vira o rótulo da 04.
const ABERTURA = { aparece: 100, voa: 1500, voo: 800, some: 2150 }
// A partir daqui (s) entra o resto da tela.
const DEPOIS_DA_ABERTURA = 2.3

function AberturaSobreVoce({ alvo }) {
  const texto = useRef(null)

  useLayoutEffect(() => {
    const el = texto.current
    const rotulo = alvo.current
    if (!el || !rotulo) return
    // Do canto do título grande ao canto do texto do rótulo, já do tamanho dele.
    const fonte = parseFloat(getComputedStyle(rotulo).fontSize)
    const escala = fonte / parseFloat(getComputedStyle(el).fontSize)
    const dx = rotulo.offsetLeft - el.offsetLeft
    const dy = rotulo.offsetTop + (rotulo.offsetHeight - fonte) / 2 - el.offsetTop
    const animacoes = [
      el.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], {
        duration: 600,
        delay: ABERTURA.aparece,
        easing: SAIDA,
        fill: 'backwards',
      }),
      el.animate([{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${escala})` }], {
        duration: ABERTURA.voo,
        delay: ABERTURA.voa,
        easing: 'cubic-bezier(.65,0,.35,1)',
        fill: 'forwards',
      }),
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, delay: ABERTURA.some, fill: 'forwards' }),
    ]
    return () => animacoes.forEach((animacao) => animacao.cancel())
  }, [alvo])

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span ref={texto} className="origin-top-left text-[44px] font-bold leading-none tracking-[-0.03em] text-ob-titulo">
        Sobre você
      </span>
    </div>
  )
}

// 04 · Equipe. Quem chega avançando da 03 vê antes a abertura "Sobre você"
// (quem volta da 05 não); com movimento reduzido, a abertura não roda.
export function Equipe() {
  const equipe = useOnboardingStore((state) => state.equipe)
  const responder = useOnboardingStore((state) => state.responder)
  const { state } = useLocation()
  const [abertura] = useState(
    () => Boolean(state?.abertura) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const rotulo = useRef(null)
  const entra = (atraso) =>
    abertura ? { animation: `ob-sobe-10 .6s ${SAIDA} ${DEPOIS_DA_ABERTURA + atraso}s both` } : undefined

  return (
    <Tela className="px-5 pb-7 pt-11">
      <div className="ob-anima" style={entra(0)}>
        <Topo voltar={anterior('equipe', respostas())} progresso={PROGRESSO.equipe} />
      </div>
      <p
        ref={rotulo}
        className="ob-anima mt-7 font-mono text-[11px] uppercase tracking-[0.18em] text-mute"
        style={abertura ? { animation: `ob-mostra .3s ease ${ABERTURA.some / 1000}s both` } : undefined}
      >
        Sobre você · 1
      </p>
      <div className="ob-anima" style={entra(0.1)}>
        <Titulo id="pergunta">Quantas pessoas você tem na equipe responsável por encontrar ofertas?</Titulo>
        <Opcoes
          rotulo="pergunta"
          compacta
          className="mt-7"
          opcoes={Object.entries(EQUIPE).map(([valor, { titulo }]) => ({ valor, titulo }))}
          valor={equipe}
          onEscolher={(valor) => responder({ equipe: valor })}
        />
      </div>
      <Botao to={proximo('equipe', { equipe })} className="ob-anima mt-auto" style={entra(0.3)}>
        Continuar
      </Botao>
      {abertura && <AberturaSobreVoce alvo={rotulo} />}
    </Tela>
  )
}

// 05 · Tempo procurando: de quem faz sozinho, de cada pessoa da equipe, ou da
// pessoa da equipe.
export function Tempo() {
  const r = useOnboardingStore()
  const pergunta = {
    sozinho: 'Quanto tempo por dia você passa procurando anúncio?',
    um: 'Quanto tempo por dia a pessoa da sua equipe passa procurando anúncio?',
  }[r.equipe] ?? 'Quanto tempo por dia cada pessoa da equipe passa procurando anúncio?'
  const subtitulo = r.equipe === 'dois' || r.equipe === 'mais'
    ? 'Em média, somando OLX, Marketplace e grupos de WhatsApp.'
    : 'Somando OLX, Marketplace e grupos de WhatsApp.'

  return (
    <Pergunta passo="tempo">
      <Rotulo>Sobre você · 2</Rotulo>
      <Titulo id="pergunta">{pergunta}</Titulo>
      <Subtitulo>{subtitulo}</Subtitulo>
      <Opcoes
        rotulo="pergunta"
        opcoes={Object.entries(TEMPO_BUSCA).map(([valor, { titulo, detalhe }]) => ({ valor, titulo, detalhe }))}
        valor={r.tempoBusca}
        onEscolher={(valor) => r.responder({ tempoBusca: valor })}
      />
      <Botao to={proximo('tempo', r)}>Continuar</Botao>
    </Pergunta>
  )
}

const DIAS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

// Quanto tempo a tela "Hoje" fica antes de dar lugar à "Com o Brik" (o
// suficiente para ler tudo com calma), e quanto dura a saída dela.
const TEMPO_HOJE = 10000
const SAIDA_HOJE = 500

// Tracinhos que sobem de cada dia até o total da semana (viewBox 350 × 150).
// Começam na bolinha, para se desenharem de baixo para cima.
const DIAS_X = [25, 75, 125, 175, 225, 275, 325]
const ramo = (x) => `M${x} 76C${x} 40 175 52 175 22V0`

// Ordem da tela "Hoje" (segundos): o título, as bolinhas dos dias uma a uma,
// os tracinhos subindo todos juntos e puxando o total da semana, o resto e,
// por último, o balão do mês.
const T = { titulo: 0.1, dias: 0.7, tracos: 2.4, total: 3.05, frase: 3.9, topicos: 4.6, mes: 6.2 }

// Entrada devagar de cada parte, uma depois da outra.
const devagar = (atraso, duracao = '.8s') => ({ animation: `ob-sobe-10 ${duracao} ${SAIDA} ${atraso}s both` })

// "Hoje": o tempo da semana rolando anúncio, espalhado pelos sete dias, e o
// que fica para depois. Entra na ordem de T: primeiro só "Hoje", depois os
// dias, os tracinhos puxando o total da semana e, por fim, o resto.
function Hoje({ quem, Icone, semana, porDia, mes, equipe, saindo }) {
  return (
    <div
      className="ob-anima flex flex-1 flex-col"
      style={saindo ? { opacity: 0, animation: `ob-apaga ${SAIDA_HOJE}ms ease both` } : undefined}
    >
      <h1 className="ob-anima mt-8 text-[44px] font-bold leading-none tracking-[-0.03em] text-ob-titulo" style={devagar(T.titulo, '.7s')}>
        Hoje
      </h1>
      <p className="ob-anima mt-3 text-[15px] leading-[1.45] text-mute" style={devagar(T.frase)}>
        {quem} passa a semana rolando anúncio.
      </p>

      <div className="mt-8 flex flex-col items-center">
        <div className="ob-anima flex items-center gap-2.5" style={{ animation: `ob-entra .6s ${SAIDA} ${T.total}s both` }}>
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raise text-ink">
            <Icone />
          </span>
          <span className="text-[26px] font-bold tracking-[-0.02em] text-loss">≈ {semana} h/sem</span>
        </div>

        <svg viewBox="0 0 350 150" className="mt-2 w-full max-w-[350px]" role="img" aria-label={`Cerca de ${porDia} horas por dia, nos sete dias da semana`}>
          {DIAS_X.map((x) => (
            <path
              key={`ramo-${x}`}
              d={ramo(x)}
              strokeDasharray="260"
              fill="none"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="ob-anima stroke-loss/50"
              style={{ animation: `ob-traco .8s ease-in-out ${T.tracos}s both` }}
            />
          ))}
          {DIAS_X.map((x, i) => (
            <g
              key={`dia-${x}`}
              className="ob-anima"
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: `ob-entra .5s ${SAIDA} ${(T.dias + i * 0.15).toFixed(2)}s both`,
              }}
            >
              <circle cx={x} cy="96" r="18" strokeWidth="1.5" className="fill-loss/12 stroke-loss/45" />
              <text x={x} y="96" textAnchor="middle" dominantBaseline="central" className="fill-loss text-[13px] font-bold">
                {DIAS[i]}
              </text>
            </g>
          ))}
          {/* As horas de cada dia chegam junto com o total. */}
          <g className="ob-anima" style={{ animation: `ob-mostra .5s ease ${T.total + 0.15}s both` }}>
            {DIAS_X.map((x) => (
              <text key={`horas-${x}`} x={x} y="134" textAnchor="middle" className="fill-mute font-mono text-[10px]">
                {porDia}h
              </text>
            ))}
          </g>
        </svg>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {['Negociando o que sobra', 'Fechando o negócio'].map((texto, i) => (
          <li key={texto} className="ob-anima flex items-center gap-3 text-[17px] font-medium text-ink" style={devagar(T.topicos + i * 0.8, '.9s')}>
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-mute" />
            {texto}
          </li>
        ))}
      </ul>

      <div className="ob-anima mt-6 rounded-2xl border border-line bg-surface-card p-4" style={devagar(T.mes)}>
        <p className="text-[15px] leading-[1.45]">
          No mês, são cerca de <strong className="font-bold text-ob-titulo">{mes} horas{equipe ? ' de equipe' : ''}</strong> rolando anúncio,{' '}
          <strong className="font-bold text-ob-destaque">em vez de negociando.</strong>
        </p>
      </div>
    </div>
  )
}

// Radar num círculo: o ponteiro gira e deixa o rastro, e os pontos acendem.
function RadarGirando() {
  const pontos = [
    { left: 118, top: 34, atraso: '0s' },
    { left: 136, top: 104, atraso: '.9s' },
    { left: 44, top: 116, atraso: '1.7s' },
  ]
  return (
    <div
      aria-hidden="true"
      className="ob-anima relative mt-8 h-44 w-44 shrink-0 self-center"
      style={{ animation: `ob-entra .6s ${SAIDA} .3s both` }}
    >
      <span className="absolute inset-0 rounded-full border-[1.5px] border-ob-destaque/25" />
      <span className="absolute inset-[30px] rounded-full border-[1.5px] border-ob-destaque/35" />
      <span className="absolute inset-[60px] rounded-full border-[1.5px] border-ob-destaque/50" />
      <span className="absolute bottom-0 left-[87px] top-0 w-px bg-ob-destaque/14" />
      <span className="absolute left-0 right-0 top-[87px] h-px bg-ob-destaque/14" />
      {/* Rastro atrás do ponteiro, no sentido do relógio. */}
      <div className="ob-anima absolute inset-0" style={{ animation: 'ob-gira 2.6s linear infinite' }}>
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: `conic-gradient(from 0deg, ${destaque(0)} 0deg, ${destaque(0)} 285deg, ${destaque(55)} 360deg)` }}
        />
        <span className="absolute left-1/2 top-0 h-1/2 w-0.5 -translate-x-1/2 rounded-full bg-ob-destaque" />
      </div>
      {pontos.map((p) => (
        <span
          key={p.left}
          className="ob-anima absolute h-2 w-2 rounded-full bg-ob-destaque"
          style={{
            left: p.left,
            top: p.top,
            boxShadow: '0 0 10px var(--color-ob-destaque)',
            animation: `ob-ponto 2.6s ease-in-out ${p.atraso} infinite`,
          }}
        />
      ))}
      <span className="absolute left-[83px] top-[83px] h-2.5 w-2.5 rounded-full bg-ob-circulo" />
    </div>
  )
}

// "Com o Brik": o radar varre, e quem procurava só negocia e fecha.
function ComBrik({ quem, Icone, sozinho, seguinte }) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="ob-anima mt-8 text-[44px] font-bold leading-none tracking-[-0.03em] text-ob-titulo" style={devagar(0.1, '.7s')}>
        Com o <span className="text-ob-destaque">Brik</span>
      </h1>

      <RadarGirando />

      <ul className="mt-8 flex flex-col gap-3.5">
        <li className="ob-anima flex items-center gap-3 text-[17px] font-medium leading-snug text-ink" style={devagar(0.9)}>
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ob-circulo">
            <Radar className="text-[#0f4c5c]" />
          </span>
          O radar varre tudo e avisa na hora.
        </li>
        <li className="ob-anima flex items-center gap-3 text-[17px] font-medium leading-snug text-ink" style={devagar(1.5)}>
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ob-titulo/12 text-ob-titulo">
            <Icone />
          </span>
          {quem} apenas negocia e fecha.
        </li>
      </ul>
      <p className="ob-anima mt-4 text-[13px] text-mute" style={devagar(2.1)}>
        {sozinho ? 'Você não precisa mais rolar anúncio.' : 'Ninguém precisa mais rolar anúncio.'}
      </p>

      <Botao to={seguinte} className="ob-anima mt-auto" style={devagar(2.6, '.6s')}>
        Continuar
      </Botao>
    </div>
  )
}

// 07 · Diagnóstico, em dois momentos: "Hoje" (o tempo que a busca toma) e,
// depois de dar tempo de ler, "Com o Brik" (o radar faz a busca).
export function Diagnostico() {
  const r = useOnboardingStore()
  const h = horas(r)
  const [fase, setFase] = useState('hoje')

  useEffect(() => {
    const saida = setTimeout(() => setFase('saindo'), TEMPO_HOJE - SAIDA_HOJE)
    const troca = setTimeout(() => setFase('brik'), TEMPO_HOJE)
    return () => {
      clearTimeout(saida)
      clearTimeout(troca)
    }
  }, [])

  const sozinho = r.equipe === 'sozinho'
  const um = r.equipe === 'um'
  const Icone = sozinho || um ? Pessoa : Grupo
  const quem = sozinho ? 'Você' : um ? 'A pessoa da sua equipe' : 'Sua equipe'

  return (
    <Pergunta passo="diagnostico">
      {fase === 'brik' ? (
        <ComBrik quem={quem} Icone={Icone} sozinho={sozinho} seguinte={proximo('diagnostico', r)} />
      ) : (
        <Hoje
          quem={quem}
          Icone={Icone}
          semana={horasCurtas(h.semana)}
          porDia={numero(h.semana / 7)}
          mes={h.mes}
          equipe={!sozinho && !um}
          saindo={fase === 'saindo'}
        />
      )}
    </Pergunta>
  )
}

// 08 · Tempo de resposta.
export function Resposta08() {
  const tempoResposta = useOnboardingStore((state) => state.tempoResposta)
  const responder = useOnboardingStore((state) => state.responder)

  return (
    <Pergunta passo="resposta">
      <Rotulo>Sobre você · 3</Rotulo>
      <Titulo id="pergunta">Quando aparece um anúncio bom, em quanto tempo você manda mensagem depois de postado?</Titulo>
      <Opcoes
        rotulo="pergunta"
        opcoes={Object.entries(TEMPO_RESPOSTA).map(([valor, { titulo, detalhe }]) => ({ valor, titulo, detalhe }))}
        valor={tempoResposta}
        onEscolher={(valor) => responder({ tempoResposta: valor })}
      />
      <Botao to={proximo('resposta', {})}>Continuar</Botao>
    </Pergunta>
  )
}

// Uma letra a cada 30 ms: o texto vai aparecendo no ritmo de quem lê.
const LETRA = 0.03

// Início de cada parte de um texto que aparece letra por letra, uma parte
// depois da outra, a partir de `inicio` (s). Devolve também o fim.
function emSequencia(partes, inicio) {
  let t = inicio
  const inicios = partes.map((parte) => {
    const comeco = t
    t += Array.from(parte).length * LETRA
    return comeco
  })
  return { inicios, fim: t }
}

const TITULO_09 = ['O vendedor recebe a primeira proposta, em média, ', '20 minutos', ' depois de postar.']
const FECHO_09 = ['Quem manda mensagem primeiro negocia sozinho com o vendedor. ', 'Com o alerta, você chega antes da primeira proposta.']

// 09 · Primeira proposta em ~20 min, em sequência: o título letra por letra; a
// linha do tempo (o anúncio postado, a linha descendo até a primeira proposta
// e, a um quarto dela, os 5 min do alerta do Brik); e o fecho, letra por letra.
export function PrimeiraProposta() {
  const tempoResposta = useOnboardingStore((state) => state.tempoResposta)
  const titulo = emSequencia(TITULO_09, 0.3)
  const t0 = titulo.fim + 0.3
  const T9 = { postado: t0, linha: t0 + 0.6, proposta: t0 + 2, brik: t0 + 2.7, fecho: t0 + 3.4, botao: t0 + 4.1 }
  const fecho = emSequencia(FECHO_09, T9.fecho)
  const entra = (atraso) => ({ animation: `ob-sobe-10 .5s ${SAIDA} ${atraso}s both` })

  return (
    <Pergunta passo="primeira-proposta">
      <Resposta rotulo="Você">{TEMPO_RESPOSTA[tempoResposta].curto}</Resposta>

      <h1 className="mt-5 text-[27px] font-bold leading-[1.16] tracking-[-0.015em] text-ob-titulo">
        <Letras texto={TITULO_09[0]} inicio={titulo.inicios[0]} passo={LETRA} />
        <span className="text-ob-destaque">
          <Letras texto={TITULO_09[1]} inicio={titulo.inicios[1]} passo={LETRA} />
        </span>
        <Letras texto={TITULO_09[2]} inicio={titulo.inicios[2]} passo={LETRA} />
      </h1>

      <div className="relative mt-7 h-[265px] shrink-0">
        {/* A linha desce de 0 min até a primeira proposta (~20 min). */}
        <span
          aria-hidden="true"
          className="ob-anima absolute left-[11px] top-2.5 h-[220px] w-0.5 origin-top rounded-sm bg-line"
          style={{ animation: `ob-enche-y 1.4s ease-in-out ${T9.linha}s both` }}
        />

        <div className="ob-anima absolute left-0 right-0 top-0 pl-[34px]" style={entra(T9.postado)}>
          <span aria-hidden="true" className="absolute left-1.5 top-[3px] h-3 w-3 rounded-full border-2 border-ink bg-surface" />
          <p className="font-mono text-[11px] tracking-[0.08em] text-mute">0 MIN</p>
          <p className="mt-[3px] text-[15px] text-ink">Anúncio postado</p>
        </div>

        {/* Os 5 min do alerta, a um quarto da linha (5 de 20 min). */}
        <div
          className="ob-anima absolute left-[34px] right-0 top-[45px] rounded-xl border border-ob-destaque/45 bg-ob-destaque/8 px-3 py-2.5"
          style={{ animation: `ob-entra .6s ${SAIDA} ${T9.brik}s both` }}
        >
          <span
            aria-hidden="true"
            className="ob-anima absolute -left-[30px] top-[13px] h-3.5 w-3.5 rounded-full bg-ob-destaque"
            style={{ animation: 'ob-brilho 1.6s ease-in-out infinite' }}
          />
          <p className="font-mono text-[11px] tracking-[0.08em] text-ob-destaque">MENOS DE 5 MIN</p>
          <p className="mt-[3px] text-[15px] font-bold text-ob-titulo">Você, com o alerta do Brik</p>
          <p className="mt-0.5 text-[13px] text-ob-destaque">Primeiro da fila</p>
        </div>

        <div className="ob-anima absolute left-0 right-0 top-[221px] pl-[34px]" style={entra(T9.proposta)}>
          <span aria-hidden="true" className="absolute left-1.5 top-[3px] h-3 w-3 rounded-full bg-ink" />
          <p className="font-mono text-[11px] tracking-[0.08em] text-mute">≈ 20 MIN</p>
          <p className="mt-[3px] text-[15px] text-ink">Chega a primeira proposta</p>
        </div>
      </div>

      <p className="mt-[26px] text-[15px] leading-[1.45] text-mute">
        <Letras texto={FECHO_09[0]} inicio={fecho.inicios[0]} passo={LETRA} />
        <strong className="font-bold text-ink">
          <Letras texto={FECHO_09[1]} inicio={fecho.inicios[1]} passo={LETRA} />
        </strong>
      </p>

      <Botao to={proximo('primeira-proposta', {})} className="ob-anima mt-auto" style={entra(T9.botao)}>
        Continuar
      </Botao>
    </Pergunta>
  )
}
