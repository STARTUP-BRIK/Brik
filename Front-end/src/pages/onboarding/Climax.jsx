import { useLayoutEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cidadeDe } from '../../config/cidades.js'
import { aplicarRadar } from '../../lib/salvarOnboarding.js'
import { useAuthStore } from '../../stores/useAuthStore.js'
import { useOnboardingStore } from '../../stores/useOnboardingStore.js'
import { useOpportunitiesStore } from '../../stores/useOpportunitiesStore.js'
import DashboardApp from '../Dashboard.jsx'
import Home from '../Home.jsx'
import { consertaValido, defeitoResumo, listaCategorias, proximo, regiao } from './fluxo.js'
import { Sino } from './pecas.jsx'
import { SAIDA } from './estilo.js'

// 15 a 18: o produto funcionando, já dentro do app. O feed é a Home de verdade
// (anúncios reais, filtrados pelo radar que a pessoa montou) e o dashboard é o
// Dashboard de verdade. As páginas rolam normalmente; por cima vai só a camada
// do onboarding: a pílula escura no pé (no lugar da navbar), a notificação e o
// pedido de permissão. A pílula é igual nos dois temas.

// A pílula do onboarding, fixa no pé da tela.
function Pilula({ atraso, ponto = false, titulo, texto, to }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div
        className="ob-anima pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-full bg-[rgba(14,22,24,0.9)] py-2 pl-[18px] pr-2 text-[#e6ebea] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_16px_32px_-12px_rgba(0,0,0,0.5)] backdrop-blur-[16px] backdrop-saturate-[160%]"
        style={{ animation: `ob-sobe-20 .5s ${SAIDA} ${atraso} both` }}
      >
        {ponto && (
          <span
            aria-hidden="true"
            className="ob-anima h-2 w-2 shrink-0 rounded-full bg-mint"
            style={{ animation: 'ob-pulsa 1.6s ease-in-out infinite' }}
          />
        )}
        <span className="flex-1 text-[12.5px] leading-[1.35]">
          <strong className="font-bold text-paper">{titulo}</strong>
          <br />
          {texto}
        </span>
        <Link
          to={to}
          className="flex h-11 shrink-0 items-center rounded-full bg-paper px-[18px] text-sm font-bold text-[#0f4c5c]"
        >
          Continuar
        </Link>
      </div>
    </div>
  )
}

// 15 · Feed: a Home do app, com o radar dele já buscando.
export function Feed() {
  // Quem chega direto aqui (recarregou a página) também vê o feed filtrado.
  useLayoutEffect(aplicarRadar, [])

  return (
    <>
      <Home />
      <Pilula
        atraso=".6s"
        ponto
        titulo="Seu radar já está buscando."
        texto="Anúncios de agora, do seu perfil."
        to={proximo('radar', {})}
      />
    </>
  )
}

const RANK = { boa: 0, otima: 1, extraordinaria: 2 }
const SELO = {
  boa: { rotulo: 'Bom negócio', classe: 'bg-level-boa text-level-boa-ink' },
  otima: { rotulo: 'Ótimo negócio', classe: 'bg-level-otima text-white' },
  extraordinaria: { rotulo: 'Extraordinário', classe: 'bg-level-extra text-white' },
}

const brl = (valor) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

// A oportunidade que a notificação mostra: a de maior selo que cabe no radar e,
// entre elas, a mais recente (o feed já vem do mais novo para o mais antigo, e
// a ordenação mantém essa ordem nos empates).
function useOportunidade() {
  const items = useOpportunitiesStore((state) => state.items)
  const r = useOnboardingStore()
  const conserta = consertaValido(r)
  return (
    items
      .filter(
        (item) =>
          r.categorias.includes(item.category) &&
          (!item.defeito || conserta.includes(item.category)) &&
          item.market_price != null &&
          item.market_price > item.price,
      )
      .sort((a, b) => (RANK[b.opportunity_level] ?? -1) - (RANK[a.opportunity_level] ?? -1))[0] ?? null
  )
}

// Notificação do Brik (componente do app, não do sistema), com um anúncio real.
function Notificacao({ item, como: Como = 'div', className = '', ...props }) {
  const selo = SELO[item.opportunity_level] ?? SELO.boa
  const cidade = cidadeDe(item) ?? item.location_city
  return (
    <div className="pointer-events-none fixed inset-x-0 top-2.5 z-50 flex justify-center px-2.5">
      <Como
        className={`pointer-events-auto flex w-full max-w-md gap-3 rounded-[22px] bg-white/97 p-3.5 text-ink shadow-[0_20px_44px_-14px_rgba(14,22,24,0.6),0_0_0_1px_rgba(43,43,43,0.06)] dark:bg-[rgba(21,33,36,0.97)] dark:shadow-[0_20px_44px_-14px_rgba(14,22,24,0.6),0_0_0_1px_rgba(230,235,234,0.08)] ${className}`}
        {...props}
      >
        <span aria-hidden="true" className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[11px] bg-[#0f4c5c]">
          <span className="block h-[26px] w-5 overflow-hidden">
            <img src="/logoBrik.png" alt="" className="block h-[26px] w-auto max-w-none" />
          </span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="flex justify-between text-xs leading-4 text-ink/60">
            <span>
              <strong className="font-bold text-ink">Brik</strong> · Radar
            </span>
            <span>agora</span>
          </span>
          <span className="flex items-center gap-1.5 text-sm font-bold leading-5">
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-normal ${selo.classe}`}>{selo.rotulo}</span>
            {cidade && <span className="truncate">em {cidade}</span>}
          </span>
          <span className="line-clamp-3 text-[13px] leading-[18px]">
            {item.title} por <strong className="font-bold">{brl(item.price)}</strong>. Média da região {brl(item.market_price)}:{' '}
            <strong className="font-bold text-gain">+{brl(item.market_price - item.price)} de lucro</strong>.
          </span>
        </span>
      </Como>
    </div>
  )
}

// 16 · Alerta: no feed real, a notificação desce com a melhor oportunidade dele
// (aparece assim que os anúncios carregam).
export function Alerta() {
  const item = useOportunidade()
  const seguinte = proximo('alerta', {})

  return (
    <>
      <Home />
      <div
        aria-hidden="true"
        className="ob-anima pointer-events-none fixed inset-0 z-40 bg-[rgba(14,22,24,0.34)]"
        style={{ animation: 'ob-mostra .4s ease-out .4s both' }}
      />
      {item && (
        <Notificacao
          item={item}
          como={Link}
          to={seguinte}
          className="ob-anima"
          style={{ animation: `ob-desce .7s ${SAIDA} .5s both` }}
        />
      )}
      <Pilula atraso="1.1s" titulo="É assim que cada oportunidade chega." texto='Antes de virar mais um "vendido".' to={seguinte} />
    </>
  )
}

// 17 · Pré-pedido da permissão de notificação, no pico do desejo e ligado ao
// filtro que ele montou. "Ativar alertas" dispara o pedido real do navegador.
export function Permissao() {
  const r = useOnboardingStore()
  const item = useOportunidade()
  const navigate = useNavigate()
  const defeito = defeitoResumo(r)
  const seguinte = proximo('alertas', {})

  async function ativar() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch {
        // Navegador sem suporte à versão com Promise: segue mesmo assim.
      }
    }
    navigate(seguinte)
  }

  const chips = [
    listaCategorias(r.categorias, { maiuscula: true }),
    defeito ? `Defeito: ${defeito.so ? `só ${defeito.texto}` : defeito.texto}` : 'Sem defeito',
    regiao(r),
  ]

  return (
    <>
      {/* O feed fica atrás do escurecido, sem receber toque nem foco. */}
      <div aria-hidden="true" inert>
        <Home />
      </div>
      <div
        aria-hidden="true"
        className="ob-anima fixed inset-0 z-40 bg-[rgba(14,22,24,0.62)]"
        style={{ animation: 'ob-mostra .3s ease-out both' }}
      />
      {item && <Notificacao item={item} aria-hidden="true" />}

      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center">
        <section
          aria-labelledby="pedido"
          className="ob-anima w-full max-w-md rounded-t-[28px] bg-surface px-6 pb-7 pt-3 leading-normal text-ink shadow-[0_-20px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_-20px_40px_-10px_rgba(0,0,0,0.35)]"
          style={{ animation: `ob-folha .5s ${SAIDA} .15s both` }}
        >
          <span aria-hidden="true" className="mx-auto block h-[5px] w-10 rounded-full bg-line" />

          <span aria-hidden="true" className="mt-[22px] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-ob-destaque/12 text-ob-destaque">
            <Sino width="26" height="26" />
          </span>

          <h2 id="pedido" className="mt-[18px] text-[25px] font-bold leading-[1.18] tracking-[-0.015em] text-ob-titulo">
            Quer receber esse alerta de verdade?
          </h2>
          <p className="mt-2.5 text-[15px] leading-[1.45] text-mute">Só avisamos quando aparecer o que você montou:</p>

          <div className="mt-3.5 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full bg-surface-raise px-3 py-2 text-[13px] font-medium">
                {chip}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={ativar}
            className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-ob-botao text-[15px] font-bold text-ob-botao-texto"
          >
            <Sino strokeWidth="2" />
            Ativar alertas
          </button>
          <Link to={seguinte} className="mt-1.5 flex h-[46px] items-center justify-center text-[15px] font-medium text-mute">
            Agora não
          </Link>
        </section>
      </div>
    </>
  )
}

// 18 · Dashboard: o do app, antes do plano, para o gratuito ter valor próprio.
// Sem conta ainda, abre com os números de exemplo do próprio Dashboard.
export function Dashboard() {
  const logado = useAuthStore((state) => Boolean(state.session))

  return (
    <>
      <DashboardApp exemplo={!logado} />
      <Pilula
        atraso="1s"
        titulo="Seu dashboard acompanha cada venda."
        texto={logado ? 'Incluído também no plano gratuito.' : 'Números de exemplo. Também no gratuito.'}
        to={proximo('dashboard', {})}
      />
    </>
  )
}
