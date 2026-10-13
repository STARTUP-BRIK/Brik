import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { PLANOS } from '../../config/planos.js'
import { salvarOnboarding } from '../../lib/salvarOnboarding.js'
import { useAuthStore } from '../../stores/useAuthStore.js'
import { useOnboardingStore } from '../../stores/useOnboardingStore.js'
import { EQUIPE, TEMPO_BUSCA, TEMPO_RESPOSTA, caminho, defeitoResumo, listaCategorias, proximo, reais, regiao } from './fluxo.js'
import { Botao, Check, Etiqueta, Grafico, Radar, Rotulo, Tela, Xis } from './pecas.jsx'
import { SAIDA, brilho, destaque } from './estilo.js'

// 19 e 20: o plano de brique com as respostas dele e a escolha de plano, que
// conclui o onboarding. (A conta já foi criada na 01a.)

// Preço mensal do Pro (config/planos.js, o mesmo da página /planos).
const PRECO_PRO = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
  PLANOS.find((p) => p.value === 'pro').preco.mensal,
)

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

      <Botao to={proximo('plano')} seta>
        Escolher meu plano
      </Botao>
    </Tela>
  )
}

// Cartão de plano, com o rádio no canto.
function Plano({ on, onClick, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`relative block w-full rounded-[18px] border-[1.5px] p-[18px] text-left text-ink ${
        on ? 'border-ob-destaque bg-ob-destaque/6' : 'border-line bg-surface-card'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute right-[18px] top-[18px] flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${
          on ? 'border-ob-destaque' : 'border-ink/40'
        }`}
      >
        <span className={`h-[11px] w-[11px] rounded-full ${on ? 'bg-ob-destaque' : ''}`} />
      </span>
      {children}
    </button>
  )
}

function Vantagem({ icone, className = '', children }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      {icone}
      {children}
    </span>
  )
}

// 20 · Escolha de plano. Sem teste grátis: o radar montado fica salvo e o
// gratuito aparece como ferramenta completa de controle. É aqui que as
// respostas vão para a conta e o onboarding termina.
export function Planos() {
  const navigate = useNavigate()
  const r = useOnboardingStore()
  const session = useAuthStore((state) => state.session)
  const carregando = useAuthStore((state) => state.carregando)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const pro = r.plano === 'pro'

  // Sem conta (aberto direto pelo endereço): volta para a criação da conta.
  if (!carregando && !session) return <Navigate to={caminho('cadastro')} replace />

  async function comecar() {
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

  return (
    <Tela className="px-5 pb-7 pt-14">
      <Rotulo className="text-mute">Último passo</Rotulo>
      <h1 id="planos" className="mt-2.5 text-[30px] font-bold leading-[1.12] tracking-[-0.02em] text-ob-titulo">
        Como você quer começar?
      </h1>

      <div role="radiogroup" aria-labelledby="planos" className="mt-[22px] flex flex-col gap-3">
        <Plano on={pro} onClick={() => r.responder({ plano: 'pro' })}>
          <span className="flex items-center gap-2">
            <span className="text-xl font-bold text-ob-titulo">Pro</span>
            <span className="rounded-full bg-ob-destaque/14 px-2 py-[3px] text-xs font-medium text-ob-destaque">Radar + Dashboard</span>
          </span>
          <span className="mt-2.5 flex items-baseline gap-1">
            <span className="text-[28px] font-bold tracking-[-0.02em] text-ob-titulo">{PRECO_PRO}</span>
            <span className="text-sm text-mute">/mês</span>
          </span>
          <span className="mt-3.5 flex flex-col gap-2 text-sm leading-[1.35]">
            {['O radar que você acabou de montar', 'Alertas em menos de 5 minutos', `Dashboard com a meta de ${reais(r.meta)}`].map((v) => (
              <Vantagem key={v} icone={<Check width="16" height="16" className="shrink-0 text-ob-destaque" />}>
                {v}
              </Vantagem>
            ))}
          </span>
        </Plano>

        <Plano on={!pro} onClick={() => r.responder({ plano: 'gratis' })}>
          <span className="flex items-center gap-2">
            <span className="text-xl font-bold text-ob-titulo">Gratuito</span>
            <span className="rounded-full bg-surface-raise px-2 py-[3px] text-xs font-medium text-mute">R$ 0</span>
          </span>
          <span className="mt-2 block text-sm text-mute">O controle completo do seu brique.</span>
          <span className="mt-3.5 flex flex-col gap-2 text-sm leading-[1.35]">
            <Vantagem icone={<Check width="16" height="16" className="shrink-0 text-gain" />}>Compras, vendas e lucro por aparelho</Vantagem>
            <Vantagem icone={<Check width="16" height="16" className="shrink-0 text-gain" />}>Meta mensal de {reais(r.meta)}</Vantagem>
            <Vantagem icone={<Xis className="shrink-0 text-mute" />} className="text-mute">
              Sem radar e sem alertas
            </Vantagem>
          </span>
        </Plano>
      </div>

      <p className="mt-3.5 flex items-start gap-2 text-[13px] leading-[1.45] text-mute">
        <Radar width="16" height="16" className="mt-px shrink-0 text-ob-destaque" />
        Seu radar fica salvo. Dá para assinar o Pro quando quiser.
      </p>

      {erro && (
        <p role="alert" className="mt-3 text-[13px] text-loss">
          {erro}
        </p>
      )}

      <Botao onClick={comecar} disabled={salvando || !session}>
        {salvando ? 'Salvando…' : pro ? 'Assinar o Pro' : 'Começar no gratuito'}
      </Botao>
    </Tela>
  )
}
