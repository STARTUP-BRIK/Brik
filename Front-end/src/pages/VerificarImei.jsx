import { useState } from 'react'
import BrandHeader from '../components/BrandHeader.jsx'
import { LightbulbIcon, ShieldCheckIcon, WarningIcon } from '../components/icons.jsx'
import { consultarImei } from '../lib/imei.js'

// Verificar IMEI: no desktop o link fica na TopBar; no celular, no menu do "+"
// da navbar. Antes de consultar, confere o formato (15 dígitos, o último pelo
// algoritmo de Luhn); a consulta vai ao imei.info pela Edge Function
// consultar-imei (lib/imei.js): Buscar iPhone (iCloud) e lista de bloqueio.

const DIGITOS = 15

// Os dois cards do resultado. `bom`: o valor que libera a compra (ativo/
// bloqueado = false); null = o imei.info não respondeu claro.
const CARDS = [
  {
    chave: 'fmi',
    campo: 'ativo',
    titulo: 'Buscar iPhone (iCloud)',
    sim: { selo: 'Ativado', texto: 'Preso a uma conta Apple. Só compre depois que o vendedor desligar na sua frente.' },
    nao: { selo: 'Desligado', texto: 'Não está preso a nenhuma conta Apple.' },
  },
  {
    chave: 'blacklist',
    campo: 'bloqueado',
    titulo: 'Lista de bloqueio',
    sim: { selo: 'Bloqueado', texto: 'O IMEI aparece como perdido, roubado ou bloqueado. Não compre.' },
    nao: { selo: 'Limpo', texto: 'Nenhum registro de bloqueio encontrado.' },
  },
]

// Luhn sobre os 15 dígitos: da direita para a esquerda, dobra um sim, um não.
function imeiValido(imei) {
  if (!/^\d{15}$/.test(imei)) return false
  let soma = 0
  for (let i = 0; i < DIGITOS; i++) {
    let d = Number(imei[DIGITOS - 1 - i])
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    soma += d
  }
  return soma % 10 === 0
}

const ONDE_ACHAR = [
  { titulo: 'No próprio aparelho', texto: 'Disque *#06# e o IMEI aparece na tela.' },
  { titulo: 'No iPhone', texto: 'Ajustes > Geral > Sobre, logo abaixo do número de série.' },
  { titulo: 'Na caixa ou na nota fiscal', texto: 'Confira se é o mesmo número do aparelho: se não bater, desconfie.' },
]

function VerificarImei() {
  const [imei, setImei] = useState('')
  const completo = imei.length === DIGITOS
  const valido = completo && imeiValido(imei)
  const [consultando, setConsultando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')

  async function consultar(event) {
    event.preventDefault()
    if (!valido || consultando) return
    setConsultando(true)
    setErro('')
    setResultado(null)
    try {
      setResultado(await consultarImei(imei))
    } catch (e) {
      setErro(e.message)
    } finally {
      setConsultando(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-surface pb-28 shadow-xl lg:max-w-7xl lg:pb-16 lg:shadow-none">
      <BrandHeader />

      {/* Celular: uma coluna só (a navbar chega aqui pelo "+"). Desktop: na
          largura da TopBar (max-w-7xl), com a consulta à esquerda e as dicas de
          onde achar o IMEI numa coluna à direita. */}
      <main className="px-4 pt-6 lg:px-8 lg:pt-12">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brik text-paper lg:h-14 lg:w-14">
            <ShieldCheckIcon aria-hidden="true" className="h-7 w-7 lg:h-8 lg:w-8" />
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-ink lg:text-[34px]">Verificar IMEI</h1>
            <p className="text-sm text-ink/60 lg:text-base">
              Antes de comprar um celular usado, confira o IMEI para não levar um aparelho bloqueado.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3 rounded-2xl bg-level-boa px-4 py-4 lg:mt-8 lg:px-5 text-level-boa-ink" role="note">
          <WarningIcon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm lg:text-[15px]">
            <strong>A consulta ajuda, mas não é garantia.</strong> Nem todo aparelho roubado está registrado
            nas listas de bloqueio. Confira também a nota fiscal e teste o aparelho antes de pagar.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <form onSubmit={consultar} className="rounded-3xl bg-surface-card p-5 ring-1 ring-line lg:p-8">
            <label htmlFor="imei" className="text-base font-bold text-ink">
              IMEI do aparelho
            </label>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:gap-4">
              <input
                id="imei"
                inputMode="numeric"
                autoComplete="off"
                placeholder="15 dígitos"
                value={imei}
                onChange={(event) => {
                  setImei(event.target.value.replace(/\D/g, '').slice(0, DIGITOS))
                  setResultado(null)
                  setErro('')
                }}
                aria-describedby="imei-status"
                className="min-w-0 flex-1 rounded-2xl border border-line bg-surface-card px-4 py-3.5 font-mono text-xl tracking-[0.08em] lg:px-5 lg:py-4 lg:text-2xl lg:tracking-[0.12em] text-ink outline-none placeholder:font-sans placeholder:text-lg placeholder:tracking-normal placeholder:text-ink/35 focus:border-brik"
              />
              <button
                type="submit"
                disabled={!valido || consultando}
                className="rounded-2xl bg-brik px-10 py-3.5 text-lg font-bold lg:py-0 text-paper disabled:cursor-not-allowed disabled:opacity-40"
              >
                {consultando ? 'Consultando…' : 'Consultar'}
              </button>
            </div>

            {/* Um tracinho por dígito: dá para ver de longe quantos faltam. */}
            <div className="mt-4 flex gap-1.5" aria-hidden="true">
              {Array.from({ length: DIGITOS }, (_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i >= imei.length ? 'bg-surface-raise' : !completo ? 'bg-brik' : valido ? 'bg-profit' : 'bg-loss'
                  }`}
                />
              ))}
            </div>

            <p id="imei-status" aria-live="polite" className="mt-3 min-h-6 text-[15px]">
              {imei.length === 0 ? (
                <span className="text-ink/50">Digite o número do aparelho.</span>
              ) : !completo ? (
                <span className="text-ink/50">
                  {imei.length} de {DIGITOS} dígitos
                </span>
              ) : valido ? (
                <span className="font-medium text-profit">
                  ✓ Formato válido. Clique em Consultar.
                </span>
              ) : (
                <span className="font-medium text-loss">
                  ✗ Esse número não é um IMEI válido. Confira se digitou certo.
                </span>
              )}
            </p>

            <div className="mt-8 border-t border-line pt-6" aria-live="polite">
              <h2 className="text-sm font-bold text-ink">
                Resultado da consulta{resultado?.modelo ? ` · ${resultado.modelo}` : ''}
              </h2>
              {erro && <p className="mt-3 text-[15px] font-medium text-loss">{erro}</p>}
              <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CARDS.map(({ chave, campo, titulo, sim, nao }) => {
                  const valor = resultado?.[chave]?.[campo]
                  const estado = !resultado ? null : valor === true ? sim : valor === false ? nao : undefined
                  const cor = valor === true ? 'text-loss' : valor === false ? 'text-profit' : 'text-ink/50'
                  return (
                    <li
                      key={chave}
                      className={`rounded-2xl px-4 py-4 ${resultado ? 'ring-1 ring-line' : 'border border-dashed border-line'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-medium ${resultado ? 'text-ink' : 'text-ink/50'}`}>{titulo}</span>
                        <span className={`rounded-full bg-surface-raise px-2.5 py-1 text-[11px] font-bold ${cor}`}>
                          {consultando ? '…' : estado ? estado.selo : estado === undefined ? 'Sem resposta' : '—'}
                        </span>
                      </div>
                      {resultado && (
                        <p className="mt-2 text-sm leading-relaxed text-ink/60">
                          {estado ? estado.texto : 'Não foi possível confirmar. Tente de novo mais tarde.'}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </form>

          <section className="rounded-3xl bg-surface-card p-5 ring-1 ring-line lg:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <LightbulbIcon aria-hidden="true" className="h-5 w-5 text-brik" />
              Onde encontrar o IMEI
            </h2>
            <ol className="mt-4 flex flex-col gap-4">
              {ONDE_ACHAR.map(({ titulo, texto }, i) => (
                <li key={titulo} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-raise text-sm font-bold text-brik">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{titulo}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink/60">{texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </main>
    </div>
  )
}

export default VerificarImei
