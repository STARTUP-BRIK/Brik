import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import PaginaPlanos from '../Planos.jsx'
import { PROTECAO_ATIVA } from '../../config/protecao.js'
import { salvarOnboarding } from '../../lib/salvarOnboarding.js'
import { useAuthStore } from '../../stores/useAuthStore.js'
import { useOnboardingStore } from '../../stores/useOnboardingStore.js'
import { PLANOS } from '../../config/planos.js'
import {
  EQUIPE,
  TEMPO_BUSCA,
  TEMPO_RESPOSTA,
  caminho,
  defeitoResumo,
  listaCategorias,
  proximo,
  reais,
  reaisCentavos,
  regiao,
  valorDaHora,
} from './fluxo.js'
import { Botao, Etiqueta, Grafico, Radar, Rotulo, Tela } from './pecas.jsx'
import { SAIDA, brilho, destaque } from './estilo.js'

// 19 e 20: o plano de brique com as respostas dele e a escolha de plano (a tela
// de planos do app), que conclui o onboarding. (A conta já foi criada na 01a.)

const Forte = ({ children }) => <strong className="font-bold text-ob-titulo">{children}</strong>

// 19 · Conclusão: onde está (04, 05, 08), para onde quer ir (13) e como chegar
// (10 a 12 + dashboard).
export function Conclusao() {
  const r = useOnboardingStore()
  const busca = `${TEMPO_BUSCA[r.tempoBusca].curto} por dia`
  const resposta = TEMPO_RESPOSTA[r.tempoResposta].curto
  const defeito = defeitoResumo(r)
  const defeitoFrase = defeito
    ? defeito.so
      ? `com defeito só em ${defeito.texto}`
      : `com defeito em ${defeito.texto}`
    : 'só aparelho funcionando'

  const passos = [
    {
      atraso: '.1s',
      ponto: <span aria-hidden="true" className="absolute -left-[33px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-mute bg-surface" />,
      rotulo: <Etiqueta>Onde você está</Etiqueta>,
      conteudo: (
        <p className="mt-2 text-[15px] leading-normal">
          {r.equipe === 'sozinho' ? (
            <>
              Você faz tudo <Forte>sozinho</Forte>, passa <Forte>{busca}</Forte> procurando e responde <Forte>{resposta}</Forte>.
            </>
          ) : r.equipe === 'um' ? (
            <>
              Você tem <Forte>1 pessoa</Forte> na equipe, que passa <Forte>{busca}</Forte> procurando, e responde{' '}
              <Forte>{resposta}</Forte>.
            </>
          ) : (
            <>
              Sua equipe tem <Forte>{EQUIPE[r.equipe].resumo}</Forte>, cada uma passa <Forte>{busca}</Forte> procurando, e você
              responde <Forte>{resposta}</Forte>.
            </>
          )}
        </p>
      ),
    },
    {
      atraso: '.35s',
      ponto: (
        <span
          aria-hidden="true"
          className="absolute -left-[34px] top-px h-4 w-4 rounded-full bg-ob-destaque"
          style={{ boxShadow: `0 0 0 5px ${destaque(15)}` }}
        />
      ),
      rotulo: <Etiqueta className="text-ob-destaque">Para onde quer ir</Etiqueta>,
      conteudo: (
        <p className="mt-2 flex items-baseline gap-2 leading-[1.1]">
          <span className="text-4xl font-bold tracking-[-0.025em] text-ob-titulo">{reais(r.meta)}</span>
          <span className="text-[15px] text-mute">de lucro por mês</span>
        </p>
      ),
    },
    {
      atraso: '.6s',
      ponto: <span aria-hidden="true" className="absolute -left-[33px] top-0.5 h-3.5 w-3.5 rounded-full bg-ob-circulo" />,
      rotulo: <Etiqueta>Como chegar</Etiqueta>,
      conteudo: (
        <>
          <div className="mt-2.5 flex gap-3 rounded-[14px] border border-line bg-surface-card p-3.5">
            <span aria-hidden="true" className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-ob-circulo">
              <Radar width="18" height="18" className="text-[#0f4c5c]" />
            </span>
            <p className="text-sm leading-[1.45]">
              <Forte>Radar</Forte> de {listaCategorias(r.categorias)} em {regiao(r)}, {defeitoFrase}, avisando em menos de 5 min.
            </p>
          </div>
          <div className="mt-2 flex gap-3 rounded-[14px] border border-line bg-surface-card p-3.5">
            <span aria-hidden="true" className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-ob-circulo">
              <Grafico className="text-[#0f4c5c]" />
            </span>
            <p className="text-sm leading-[1.45]">
              <Forte>Dashboard</Forte> acompanhando cada real até a meta.
            </p>
          </div>
        </>
      ),
    },
  ]

  return (
    <Tela className="px-6 pb-7 pt-14" fundo={`radial-gradient(90% 40% at 50% 0%, ${brilho(22)}, transparent 70%), var(--color-surface)`}>
      <Rotulo className="text-ob-destaque">Seu plano de brique</Rotulo>
      <h1 className="mt-2.5 text-[31px] font-bold leading-[1.12] tracking-[-0.02em] text-ob-titulo">Daqui até a sua meta.</h1>

      <div className="relative mt-7">
        <span aria-hidden="true" className="absolute bottom-10 left-[11px] top-3 w-0.5 rounded-sm bg-line" />
        <ol className="pl-[38px]">
          {passos.map((passo, i) => (
            <li
              key={passo.atraso}
              className={`ob-anima relative ${i < passos.length - 1 ? 'pb-[22px]' : ''}`}
              style={{ animation: `ob-sobe-10 .5s ${SAIDA} ${passo.atraso} both` }}
            >
              {passo.ponto}
              {passo.rotulo}
              {passo.conteudo}
            </li>
          ))}
        </ol>
      </div>

      <Botao to={proximo('plano', r)} seta>
        Escolher meu plano
      </Botao>
    </Tela>
  )
}

// 20 · Escolha de plano: a mesma tela de planos do app (pages/Planos.jsx), com
// os três planos. "Começar no gratuito" conclui o onboarding: é aqui que as
// respostas vão para a conta. Os planos pagos ainda não cobram (sem pagamento
// integrado), então quem quer assinar também começa no gratuito por enquanto.
export function Planos() {
  const navigate = useNavigate()
  const session = useAuthStore((state) => state.session)
  const carregando = useAuthStore((state) => state.carregando)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Sem conta (aberto direto pelo endereço): volta para a criação da conta. Com a
  // proteção desligada (config/protecao.js, para testar o fluxo sem login), a
  // tela abre e o botão só leva ao feed, sem salvar nada.
  if (PROTECAO_ATIVA && !carregando && !session) return <Navigate to={caminho('cadastro')} replace />

  async function comecarGratis() {
    useOnboardingStore.getState().responder({ plano: 'gratis' })
    if (!session) return navigate('/', { replace: true })
    setSalvando(true)
    setErro('')
    try {
      await salvarOnboarding(session.user)
      useOnboardingStore.getState().limpar()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Erro ao concluir o onboarding:', error.message)
      setErro('Não foi possível salvar suas respostas. Tente de novo.')
      setSalvando(false)
    }
  }

  return <PaginaPlanos inicio={{ onGratis: comecarGratis, salvando, erro, chamada: <HorasDevolvidas /> }} />
}

const PRECO_PRO = PLANOS.find((plano) => plano.value === 'pro')?.preco.mensal

// Na escolha de plano, acima dos cartões: o que custa hoje cada hora rolando
// anúncio (lucro da 12b ÷ horas do mês, da 05) contra o que ela custa com o
// Pro, e o lucro que essas horas podem render negociando. Sem lucro informado
// (quem está começando), só as horas e o preço.
function HorasDevolvidas() {
  const r = useOnboardingStore()
  if (!PRECO_PRO) return null
  const { mes, porHora, brik } = valorDaHora(r, PRECO_PRO)
  if (!brik) return null
  const horasDe = `${mes} horas${r.equipe === 'sozinho' ? '' : ' de equipe'}`

  return (
    <section
      aria-label="Quanto valem suas horas de busca"
      className="ob-anima mx-auto mt-6 max-w-md rounded-3xl bg-surface-card p-5 text-left ring-1 ring-line"
      style={{ animation: `ob-sobe-10 .5s ${SAIDA} .05s both` }}
    >
      {porHora && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-surface-raise p-3.5">
            <p className="text-xs text-ink/60">Cada hora procurando hoje</p>
            <p className="mt-1 text-[22px] font-bold tracking-tight text-loss">{reaisCentavos(porHora)}</p>
          </div>
          <div className="rounded-2xl bg-brik/10 p-3.5 ring-1 ring-brik/40">
            <p className="text-xs text-ink/60">Cada hora com o Brik Pro</p>
            <p className="mt-1 text-[22px] font-bold tracking-tight text-brik">{reaisCentavos(brik)}</p>
          </div>
        </div>
      )}
      <p className="text-[15px] leading-normal text-ink">
        {porHora ? (
          <>
            Hoje você paga <strong className="font-bold">{reaisCentavos(porHora)}</strong> do seu lucro por cada uma das cerca de{' '}
            <strong className="font-bold">{horasDe}</strong> por mês rolando anúncio. O Brik faz essa busca por você e devolve essas
            horas, que negociando podem render até <strong className="font-bold text-profit">{reais(r.lucroAtual)} a mais</strong>{' '}
            por mês, por apenas <strong className="font-bold text-brik">{reaisCentavos(PRECO_PRO)}</strong>.
          </>
        ) : (
          <>
            São cerca de <strong className="font-bold">{horasDe}</strong> por mês rolando anúncio. O Brik faz essa busca por você e
            devolve essas horas para negociar, por apenas <strong className="font-bold text-brik">{reaisCentavos(PRECO_PRO)}</strong>{' '}
            por mês.
          </>
        )}
      </p>
    </section>
  )
}
