import { useState } from 'react'
import CalculoSalvo from './CalculoSalvo.jsx'
import { CalculatorIcon, ChevronRightIcon } from './icons.jsx'
import { EMPTY } from '../lib/calc.js'
import { listarCalculos, paraValores } from '../lib/calculos.js'
import { formatBRL, reaisParaNumero } from '../lib/format.js'
import Calculadora from '../pages/Calculadora.jsx'

// Custo e valor de venda de um produto do estoque saem de um cálculo. No
// formulário (AdicionarProduto) é um acordeão: fechado, mostra o que o cálculo
// deu; aberto, lista os cálculos salvos (public.calculos), e tocar em um usa ele
// na hora. Embaixo, "Adicionar novo cálculo" abre direto a calculadora, por cima
// do formulário e sem trocar de rota (para não perder as fotos e os campos), que
// termina em "Usar no produto". O novo cálculo sempre começa vazio, mesmo com o
// produto já preenchido por um cálculo salvo ou na edição.
// custo/venda: os valores atuais do formulário, com máscara ("1.234,56").
// onUsar recebe os valores da calculadora ({ compra, reparos, transporte,
// outros, venda }, strings em reais inteiros).

const CAIXA = 'w-full rounded-lg border border-line bg-surface-card text-[15px] text-ink'

function CalculoDoProduto({ custo, venda, onUsar }) {
  const [aberto, setAberto] = useState(false)
  const [calculando, setCalculando] = useState(false)
  // null enquanto carrega; só busca na primeira vez que o acordeão abre.
  const [calculos, setCalculos] = useState(null)
  const [erro, setErro] = useState('')

  function alternar() {
    if (!aberto && calculos === null) {
      listarCalculos()
        .then(setCalculos)
        .catch((error) => {
          console.error('Erro ao carregar os cálculos:', error)
          setErro('Não foi possível carregar seus cálculos.')
          setCalculos([])
        })
    }
    setAberto((a) => !a)
  }

  function usar(values) {
    onUsar(values)
    setCalculando(false)
    setAberto(false)
  }

  const preenchido = custo !== '' || venda !== ''
  const lucro = reaisParaNumero(venda) - reaisParaNumero(custo)
  const tom = lucro > 0 ? 'text-profit' : lucro < 0 ? 'text-loss' : 'text-ink/60'

  return (
    <div className={`${CAIXA} ${aberto ? 'border-brik' : ''}`}>
      <button
        type="button"
        onClick={alternar}
        aria-expanded={aberto}
        aria-controls="calculo-do-produto"
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <CalculatorIcon className="h-6 w-6 shrink-0 text-brik" />
        <span className="min-w-0 flex-1">
          {preenchido ? (
            <>
              <span className="block truncate">
                Custo R$ {custo || '0,00'} · Venda R$ {venda || '0,00'}
              </span>
              <span className={`block text-xs font-medium ${tom}`}>Lucro {formatBRL(lucro)}</span>
            </>
          ) : (
            <>
              <span className="block">Cálculo do produto</span>
              <span className="block text-xs text-ink/50">Custo e valor de venda</span>
            </>
          )}
        </span>
        <ChevronRightIcon
          className={`h-4 w-4 shrink-0 text-ink/40 transition-transform ${aberto ? 'rotate-90' : ''}`}
        />
      </button>

      {aberto && (
        <div id="calculo-do-produto" className="border-t border-line px-3 pb-3 pt-3">
          {erro && (
            <p role="alert" className="mb-2 rounded-lg bg-loss/10 px-3 py-2 text-sm text-loss">
              {erro}
            </p>
          )}

          {calculos === null ? (
            <ul className="flex flex-col gap-2" aria-busy="true" aria-label="Carregando cálculos">
              {[0, 1].map((i) => (
                <li key={i} className="skeleton h-16 rounded-2xl" />
              ))}
            </ul>
          ) : calculos.length === 0 ? (
            !erro && <p className="px-1 text-sm text-ink/60">Você ainda não tem cálculos salvos.</p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto" aria-label="Cálculos salvos">
              {calculos.map((calculo) => (
                <CalculoSalvo key={calculo.id} calculo={calculo} onAbrir={(c) => usar(paraValores(c))} />
              ))}
            </ul>
          )}

          {/* Degradê só do petróleo: do escuro ao petróleo clareado com o verde-água
              da marca (mint), sem sombra. Os dois vêm do tema, então acompanham o escuro. */}
          <button
            type="button"
            onClick={() => setCalculando(true)}
            className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-brik-dark via-brik to-[color-mix(in_oklab,var(--color-brik),var(--color-mint)_35%)] py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-95"
          >
            <CalculatorIcon className="h-5 w-5 shrink-0" />
            Adicionar novo cálculo
          </button>
        </div>
      )}

      {calculando && (
        <div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-surface">
          <Calculadora inicial={EMPTY} onVoltar={() => setCalculando(false)} onUsar={usar} />
        </div>
      )}
    </div>
  )
}

export default CalculoDoProduto
