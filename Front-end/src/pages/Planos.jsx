import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandHeader from '../components/BrandHeader.jsx'
import { FotoPerfil } from '../components/conta.jsx'
import { StarIcon } from '../components/icons.jsx'
import { PLANOS } from '../config/planos.js'
import { linkDePagamento, minhaAssinatura, temCadastroAsaas } from '../lib/assinatura.js'
import { fotoDaConta, usePerfil } from '../lib/conta.js'
import { usePreferenciasStore } from '../stores/usePreferenciasStore.js'

// Escolha de plano: Free, Intermedium (cobrança semanal) e Pro, com a chave
// mensal/anual. O Pro fica em destaque, no centro. O plano em que a pessoa está
// leva a foto dela (ou o ícone de usuário) no canto. Assinar leva para a fatura
// do Asaas (lib/assinatura.js); no onboarding, o pagamento fica para depois.
//
// `inicio`: a mesma tela como último passo do onboarding (tela 20). Aí o Free
// vira "Começar no gratuito", que conclui o onboarding (`inicio.onGratis`), e
// ainda não há plano atual para marcar. `inicio.chamada`: o que vem logo abaixo
// do título (o valor das horas de busca contra o preço do Pro).

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

const Check = ({ className = '' }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <path d="m3.5 8.3 2.9 2.9 6.1-6.4" />
  </svg>
)

const Xis = ({ className = '' }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={className}>
    <path d="m4.5 4.5 7 7m0-7-7 7" />
  </svg>
)

// Chave Mensal / Anual.
function Cobranca({ anual, onChange }) {
  return (
    <div role="radiogroup" aria-label="Cobrança" className="mx-auto grid w-full max-w-xs grid-cols-2 gap-1 rounded-full bg-surface-raise p-1">
      {[
        { valor: false, label: 'Mensal/Semanal' },
        { valor: true, label: 'Anual' },
      ].map(({ valor, label }) => {
        const on = anual === valor
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(valor)}
            className={`h-10 rounded-full text-sm font-bold transition-colors ${on ? 'bg-brik text-paper shadow-sm' : 'text-ink/60 hover:text-ink'}`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// Bolinha com a foto da pessoa no cartão do plano atual.
function SeuPlano({ foto }) {
  return (
    <span className="absolute -top-4 left-5 flex items-center gap-2">
      <FotoPerfil src={foto} alt="" className="h-9 w-9 ring-4 ring-surface" iconClassName="h-5 w-5" />
      <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-surface shadow-sm">Seu plano</span>
    </span>
  )
}

// Botão de começar no gratuito (onboarding), no cartão do Free: salva as
// respostas e conclui o onboarding. Se der erro, o aviso aparece embaixo dele.
function BotaoGratis({ inicio }) {
  return (
    <>
      <button
        type="button"
        onClick={inicio.onGratis}
        disabled={inicio.salvando}
        className="flex h-12 w-full items-center justify-center rounded-xl border border-line text-sm font-bold text-ink transition-[background-color,opacity] hover:bg-surface-raise disabled:opacity-60"
      >
        {inicio.salvando ? 'Salvando…' : 'Começar no gratuito'}
      </button>
      {inicio.erro && (
        <p role="alert" className="mt-2.5 text-center text-xs leading-snug text-loss">
          {inicio.erro}
        </p>
      )}
    </>
  )
}

// Botão de assinar (fora do onboarding): pede o CPF na 1ª vez (o Asaas exige
// para criar o cliente) e leva para a fatura do Asaas, onde a pessoa escolhe
// Pix, cartão ou boleto. O plano muda sozinho quando o pagamento confirma.
// `reativar`: é o plano atual, mas a assinatura foi cancelada (ainda no período
// pago); a 1ª cobrança nova só vence no fim desse período (asaas-checkout).
function Assinar({ plano, anual, definido, reativar }) {
  const [pedeCpf, setPedeCpf] = useState(false)
  const [cpf, setCpf] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  async function pagar(event) {
    event?.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      if (!pedeCpf && !(await temCadastroAsaas())) {
        setPedeCpf(true)
        return
      }
      window.location.href = await linkDePagamento({ plano: plano.value, anual, cpf: pedeCpf ? cpf : undefined })
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  const estilo = `h-12 w-full rounded-xl text-sm font-bold transition-[background-color,opacity] disabled:cursor-not-allowed disabled:opacity-45 ${plano.popular ? 'bg-brik text-paper hover:bg-brik-dark' : 'bg-ink text-surface hover:opacity-90'}`

  return (
    <form onSubmit={pagar} className="flex flex-col gap-2.5">
      {pedeCpf && (
        <label className="flex flex-col gap-1 text-xs font-medium text-ink/70">
          CPF de quem vai pagar
          <input
            autoFocus
            required
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="h-11 rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brik"
          />
        </label>
      )}
      <button type="submit" disabled={!definido || enviando} className={estilo}>
        {!definido ? 'Indisponível' : enviando ? 'Abrindo pagamento…' : pedeCpf ? 'Continuar para o pagamento' : `${reativar ? 'Reativar' : 'Assinar'} o ${plano.nome}`}
      </button>
      {erro && (
        <p role="alert" className="text-center text-xs leading-snug text-loss">
          {erro}
        </p>
      )}
    </form>
  )
}

function Cartao({ plano, anual, indice, atual, cancelada, foto, escolhido, onEscolher, inicio }) {
  const valor = anual ? plano.preco.anual : plano.preco.mensal
  const periodo = anual ? 'ano' : plano.periodo
  const gratis = valor === 0
  const definido = valor != null

  return (
    <article
      aria-labelledby={`plano-${plano.value}`}
      className={`ob-anima relative flex flex-col rounded-3xl bg-surface-card p-6 ${plano.popular
        ? 'shadow-[0_24px_48px_-24px_rgba(15,76,92,0.55)] ring-2 ring-brik lg:-translate-y-3'
        : 'ring-1 ring-line'
        }`}
      style={{ animation: `ob-sobe-20 .6s cubic-bezier(.22,1,.36,1) ${0.1 + indice * 0.12}s both` }}
    >
      {atual && <SeuPlano foto={foto} />}
      {plano.popular && (
        <span className="absolute right-0 top-0 flex items-center gap-1 rounded-bl-2xl rounded-tr-3xl bg-brik px-3 py-1 text-xs font-bold text-paper">
          <StarIcon className="h-3.5 w-3.5" />
          Mais popular
        </span>
      )}

      <h2 id={`plano-${plano.value}`} className={`${atual ? 'mt-3' : ''} text-sm font-bold uppercase tracking-[0.14em] text-ink/55`}>
        {plano.nome}
      </h2>
      <p className="mt-1 text-sm text-ink/70">{plano.resumo}</p>

      <p className="mt-5 flex items-baseline gap-1.5">
        {/* key: o preço entra de novo ao trocar mensal/anual. */}
        <span key={`${anual}`} className="ob-anima text-[40px] font-bold leading-none tracking-tight text-ink" style={{ animation: 'ob-sobe-8 .3s ease-out both' }}>
          {definido ? (gratis ? 'R$ 0' : reais.format(valor)) : 'Indisponível'}
        </span>
        {definido && !gratis && <span className="text-sm font-medium text-ink/55">/ {periodo}</span>}
      </p>
      <p className="mt-1.5 min-h-4 text-xs text-ink/50">
        {gratis
          ? 'Para sempre, sem cartão'
          : definido
            ? `Cobrado por ${periodo}`
            : `Cobrança ${anual ? 'anual' : plano.periodo === 'semana' ? 'semanal' : 'mensal'}, valor em breve`}
      </p>

      <ul className="mt-5 flex flex-col gap-2.5 text-sm">
        {plano.vantagens.map(({ texto, fora }) => (
          <li key={texto} className={`flex items-start gap-2 ${fora ? 'text-ink/45' : 'text-ink'}`}>
            {fora ? <Xis className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0 text-profit" />}
            {texto}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        {atual && cancelada ? (
          <Assinar plano={plano} anual={anual} definido={definido} reativar />
        ) : atual ? (
          <p className="flex h-12 w-full items-center justify-center rounded-xl bg-surface-raise text-sm font-bold text-ink/60">
            Seu plano atual
          </p>
        ) : gratis && inicio ? (
          <BotaoGratis inicio={inicio} />
        ) : gratis ? (
          <Link
            to="/"
            viewTransition
            className="flex h-12 w-full items-center justify-center rounded-xl border border-line text-sm font-bold text-ink transition-colors hover:bg-surface-raise"
          >
            Continuar no Free
          </Link>
        ) : !inicio ? (
          <Assinar plano={plano} anual={anual} definido={definido} />
        ) : (
          <button
            type="button"
            disabled={!definido}
            onClick={() => onEscolher(plano.value)}
            className={`h-12 w-full rounded-xl text-sm font-bold transition-[background-color,opacity] disabled:cursor-not-allowed disabled:opacity-45 ${plano.popular ? 'bg-brik text-paper hover:bg-brik-dark' : 'bg-ink text-surface hover:opacity-90'
              }`}
          >
            {definido ? `Assinar o ${plano.nome}` : 'Indisponível'}
          </button>
        )}
        {escolhido && inicio && (
          <p role="status" className="mt-2.5 text-center text-xs leading-snug text-ink/60">
            Comece no gratuito: seu radar fica salvo e você assina quando quiser, em Planos.
          </p>
        )}
      </div>
    </article>
  )
}

function Planos({ inicio }) {
  const [anual, setAnual] = useState(false)
  const [escolhido, setEscolhido] = useState(null)
  const planoAtual = usePreferenciasStore((state) => state.planoAtual)
  const { user, perfil } = usePerfil()
  const foto = fotoDaConta(user, perfil)
  // Assinatura do plano atual cancelada (ainda no período pago): o cartão dele
  // oferece reativar em vez de "Seu plano atual".
  const [cancelada, setCancelada] = useState(false)

  useEffect(() => {
    if (inicio) return
    minhaAssinatura()
      .then((assinatura) => setCancelada(assinatura?.status === 'cancelada' && assinatura.plano === planoAtual))
      .catch(() => {})
  }, [inicio, planoAtual])

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-surface pb-28 shadow-xl lg:max-w-none lg:pb-16 lg:shadow-none">
      {/* Fora do Layout (último passo do onboarding) não há TopBar e a logo fica
          no header: no desktop, alinhada à coluna da página (px-5 + px-3 = px-8). */}
      <BrandHeader classeLogo="lg:mx-auto lg:max-w-5xl lg:px-3" />

      <main className="px-4 pt-6 lg:mx-auto lg:max-w-5xl lg:px-8 lg:pt-12">
        <div className="text-center">
          {inicio && <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-ink/50">Último passo</p>}
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink lg:text-[40px]">
            {inicio ? 'Como você quer começar?' : 'Escolha seu plano'}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink/60 lg:text-base">
            Comece grátis com o controle do seu brique. Assine para o radar te avisar das oportunidades antes de todo mundo.
          </p>
          {inicio?.chamada}
        </div>

        <div className="mt-6">
          <Cobranca anual={anual} onChange={setAnual} />
          {anual && (
            <p className="mt-2 text-center text-xs text-ink/55">Os valores do plano anual ainda vão ser definidos.</p>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-9 lg:mt-12 lg:grid-cols-3 lg:items-stretch lg:gap-5">
          {PLANOS.map((plano, indice) => (
            <Cartao
              key={plano.value}
              plano={plano}
              anual={anual}
              indice={indice}
              atual={!inicio && plano.value === planoAtual}
              cancelada={cancelada}
              foto={foto}
              escolhido={escolhido === plano.value}
              onEscolher={setEscolhido}
              inicio={inicio}
            />
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-ink/50">
          Preços em reais. Troque ou cancele quando quiser em Perfil → Meu plano: quem cancela segue no plano até o fim do
          período já pago, sem novas cobranças.
        </p>
      </main>
    </div>
  )
}

export default Planos
