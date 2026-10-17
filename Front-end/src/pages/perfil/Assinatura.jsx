import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Grupo, Linha, Nota, SubPagina } from '../../components/SubPagina.jsx'
import { PLANOS } from '../../config/planos.js'
import { cancelarAssinatura, minhaAssinatura } from '../../lib/assinatura.js'
import { usePreferenciasStore } from '../../stores/usePreferenciasStore.js'

// Meu plano: a situação da assinatura (public.assinaturas, ver lib/assinatura.js)
// e o cancelamento. Quem cancela segue no plano até o fim do período já pago
// (pago_ate) e não é cobrado de novo; depois disso o banco passa para o Free.
// Trocar ou voltar a assinar é na tela de planos.

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
const data = (dia) => new Date(`${dia}T12:00:00`).toLocaleDateString('pt-BR')

// Nome e preço do plano assinado, a partir de config/planos.js.
function descricaoDoPlano({ plano, ciclo }) {
  const config = PLANOS.find((p) => p.value === plano)
  if (!config) return { nome: plano, preco: '' }
  const anual = ciclo === 'YEARLY'
  const valor = anual ? config.preco.anual : config.preco.mensal
  return { nome: config.nome, preco: valor ? `${reais.format(valor)} / ${anual ? 'ano' : config.periodo}` : '' }
}

// Título e explicação da situação. `noPeriodo`: ainda há dias pagos para usar.
function situacao({ status, pago_ate }, nome) {
  const noPeriodo = Boolean(pago_ate && pago_ate >= hoje())
  if (status === 'ativa') return { titulo: 'Ativa', detalhe: `Renova em ${data(pago_ate)}.`, cor: 'text-profit' }
  if (status === 'pendente') {
    return {
      titulo: 'Aguardando pagamento',
      detalhe: noPeriodo
        ? `Seu acesso atual continua até ${data(pago_ate)}.`
        : 'Pague a fatura do Asaas para liberar o plano. Fechou a fatura? Assine de novo em Planos.',
      cor: 'text-ink/60',
    }
  }
  if (status === 'atrasada') {
    return {
      titulo: 'Pagamento atrasado',
      detalhe: noPeriodo
        ? `Seu acesso vai até ${data(pago_ate)}. Pague a fatura para não perder o ${nome}.`
        : `O ${nome} foi pausado. Assine de novo para voltar.`,
      cor: 'text-loss',
    }
  }
  return {
    titulo: 'Cancelada',
    detalhe: noPeriodo
      ? `Você usa o ${nome} até ${data(pago_ate)}. Depois, volta para o Free, sem novas cobranças.`
      : 'Sem novas cobranças. Você está no Free.',
    cor: 'text-ink/60',
  }
}

const botaoSecundario =
  'flex h-12 items-center justify-center rounded-xl border border-line text-sm font-bold text-ink transition-colors hover:bg-surface-raise'

function Assinatura() {
  const [assinatura, setAssinatura] = useState()
  const [erro, setErro] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  useEffect(() => {
    minhaAssinatura()
      .then(setAssinatura)
      .catch(() => setErro('Não foi possível carregar sua assinatura. Tente de novo em instantes.'))
  }, [])

  async function cancelar() {
    setCancelando(true)
    setErro('')
    try {
      const resultado = await cancelarAssinatura()
      if (resultado.plano === 'gratis') usePreferenciasStore.setState({ planoAtual: 'gratis' })
      setAssinatura(await minhaAssinatura())
      setConfirmando(false)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCancelando(false)
    }
  }

  if (assinatura === undefined && !erro) {
    return (
      <SubPagina titulo="Meu plano">
        <p className="px-1 text-sm text-ink/60">Carregando…</p>
      </SubPagina>
    )
  }

  // Nunca assinou: está no Free.
  if (!assinatura?.plano) {
    return (
      <SubPagina titulo="Meu plano">
        <Grupo>
          <Linha titulo="Free" detalhe="Assine para o radar te avisar das oportunidades antes de todo mundo." />
        </Grupo>
        {erro && (
          <p role="alert" className="px-1 text-sm text-loss">
            {erro}
          </p>
        )}
        <Link to="/planos" viewTransition className="flex h-12 items-center justify-center rounded-xl bg-brik text-sm font-bold text-white transition-opacity hover:opacity-90">
          Ver planos
        </Link>
      </SubPagina>
    )
  }

  const { nome, preco } = descricaoDoPlano(assinatura)
  const { titulo, detalhe, cor } = situacao(assinatura, nome)
  const podeCancelar = assinatura.status !== 'cancelada'
  const fimDoPeriodo = assinatura.pago_ate && assinatura.pago_ate >= hoje() ? data(assinatura.pago_ate) : null

  return (
    <SubPagina titulo="Meu plano" descricao="Sua assinatura, cobrança e cancelamento.">
      <Grupo titulo="Assinatura">
        <Linha titulo={nome} detalhe={preco} />
        <Linha titulo="Situação" detalhe={detalhe}>
          <span className={`shrink-0 text-xs font-bold ${cor}`}>{titulo}</span>
        </Linha>
      </Grupo>

      {erro && (
        <p role="alert" className="px-1 text-sm text-loss">
          {erro}
        </p>
      )}

      {confirmando ? (
        <section className="flex flex-col gap-3 rounded-2xl bg-surface-card px-4 py-4 ring-1 ring-loss/40">
          <h2 className="text-sm font-bold text-ink">Cancelar a assinatura?</h2>
          <p className="text-sm text-ink/70">
            {fimDoPeriodo
              ? `Você continua no ${nome} até ${fimDoPeriodo} e não será cobrado de novo. Depois, volta para o Free.`
              : 'Você volta para o Free agora e não será cobrado de novo.'}
          </p>
          <button
            type="button"
            onClick={cancelar}
            disabled={cancelando}
            className="flex h-12 items-center justify-center rounded-xl bg-loss text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {cancelando ? 'Cancelando…' : 'Sim, cancelar'}
          </button>
          <button type="button" onClick={() => setConfirmando(false)} disabled={cancelando} className={botaoSecundario}>
            Manter assinatura
          </button>
        </section>
      ) : (
        <div className="flex flex-col gap-2.5">
          <Link to="/planos" viewTransition className="flex h-12 items-center justify-center rounded-xl bg-brik text-sm font-bold text-white transition-opacity hover:opacity-90">
            {podeCancelar ? 'Trocar de plano' : 'Assinar de novo'}
          </Link>
          {podeCancelar && (
            <button type="button" onClick={() => setConfirmando(true)} className={`${botaoSecundario} text-loss`}>
              Cancelar assinatura
            </button>
          )}
        </div>
      )}

      <Nota>
        Pagamentos processados pelo Asaas. Desistiu nos 7 primeiros dias da assinatura? Escreva para{' '}
        <a href="mailto:startupbrik@gmail.com" className="underline">
          startupbrik@gmail.com
        </a>{' '}
        que devolvemos o valor.
      </Nota>
    </SubPagina>
  )
}

export default Assinatura
