import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { Grupo, Interruptor, Linha, Nota, SubPagina } from '../../components/SubPagina.jsx'
import { CATEGORIAS, NIVEIS } from '../../config/categorias.js'
import { MODELOS, idsDaCategoria } from '../../config/modelos.js'
import { planoPago } from '../../config/planos.js'
import { Geracao, useGeracoesAbertas } from '../onboarding/Geracao.jsx'
import { usePreferenciasStore } from '../../stores/usePreferenciasStore.js'

// Notificações. Os avisos de oportunidade saem por e-mail, um por anúncio
// (worker/notificacoes.js lê as chaves boa, otima, extraordinaria e defeito e os
// modelos marcados abaixo). Estoque parado e novidades ainda não são enviados.
const GRUPOS = [
  {
    titulo: 'Oportunidades por e-mail',
    itens: [
      ...NIVEIS.map(({ value, label, desconto }) => ({
        key: value,
        titulo: label,
        detalhe: `Anúncio novo ${desconto}% ou mais abaixo do preço de mercado, nos modelos que você acompanha.`,
      })),
      {
        key: 'defeito',
        titulo: 'Aparelhos com defeito',
        detalhe: 'Também avisar de anúncios com defeito informado. Desligado, só chegam aparelhos funcionando.',
      },
    ],
  },
  {
    titulo: 'Seu estoque',
    itens: [
      {
        key: 'estoqueParado',
        titulo: 'Produto parado',
        detalhe: 'Lembrete quando um produto do seu estoque ficar muito tempo sem vender.',
      },
    ],
  },
  {
    titulo: 'Brik',
    itens: [{ key: 'novidades', titulo: 'Novidades e dicas', detalhe: 'Recursos novos e dicas para seus briques.' }],
  },
]

// De quais modelos a pessoa quer aviso de oportunidade, uma aba por categoria
// do Brik, com a mesma escolha por geração do onboarding (Geracao). Já vem com
// o que ela marcou lá (tela de modelos).
function ModelosDeInteresse() {
  const modelos = usePreferenciasStore((state) => state.modelosNotificacao)
  const setModelos = usePreferenciasStore((state) => state.setModelosNotificacao)
  const [aba, setAba] = useState(CATEGORIAS[0].value)
  const marcados = new Set(modelos)
  const [abertas, alternarGeracao] = useGeracoesAbertas(
    CATEGORIAS.map((c) => c.value),
    marcados,
  )
  const contagem = (categoria) => idsDaCategoria(categoria).filter((id) => marcados.has(id)).length
  const daAba = idsDaCategoria(aba)
  const abaToda = daAba.every((id) => marcados.has(id))

  const marcar = (ids, ligar) => {
    const resto = modelos.filter((m) => !ids.includes(m))
    setModelos(ligar ? [...resto, ...ids] : resto)
  }

  return (
    <section aria-labelledby="modelos-titulo">
      <h2 id="modelos-titulo" className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
        Modelos que você acompanha
      </h2>
      <p className="px-1 text-xs leading-snug text-ink/55">
        Você só recebe aviso de oportunidade dos modelos marcados. Os que você escolheu no começo já vêm marcados.
      </p>

      <div role="tablist" aria-label="Categoria" className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-surface-raise p-1">
        {CATEGORIAS.map(({ value, label, Icon }) => {
          const on = value === aba
          const n = contagem(value)
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setAba(value)}
              className={`flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-bold transition-colors ${
                on ? 'bg-surface-card text-ink shadow-[0_2px_8px_-3px_rgba(0,0,0,0.3)]' : 'text-mute hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {n > 0 && (
                <span className="min-w-5 rounded-full bg-ob-destaque px-1.5 text-[11px] leading-5 text-ob-sobre-destaque">{n}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between px-1">
        <p className="text-xs text-ink/55">
          {contagem(aba) ? `${contagem(aba)} de ${daAba.length} marcados` : 'Nenhum marcado: sem avisos desta categoria'}
        </p>
        <button type="button" onClick={() => marcar(daAba, !abaToda)} className="text-sm font-bold text-ob-destaque">
          {abaToda ? 'Desmarcar todos' : 'Marcar todos'}
        </button>
      </div>

      <div key={aba} role="tabpanel" className="ob-anima mt-2.5 flex flex-col gap-2.5" style={{ animation: 'ob-mostra .25s ease both' }}>
        {MODELOS[aba].map((grupo) => (
          <Geracao
            key={grupo.grupo}
            grupo={grupo}
            marcados={marcados}
            aberta={abertas.has(`${aba}:${grupo.grupo}`)}
            onAbrir={() => alternarGeracao(`${aba}:${grupo.grupo}`)}
            onMarcar={marcar}
          />
        ))}
      </div>
    </section>
  )
}

function Notificacoes() {
  const notificacoes = usePreferenciasStore((state) => state.notificacoes)
  const setNotificacao = usePreferenciasStore((state) => state.setNotificacao)
  // Aviso de oportunidade é só dos planos pagos (o worker nem envia ao Free).
  // No Free os interruptores aparecem desligados e travados; o que a pessoa
  // escolheu fica guardado e volta a valer quando ela assinar.
  const pago = planoPago(usePreferenciasStore((state) => state.planoAtual))

  return (
    <SubPagina titulo="Notificações" descricao="Escolha sobre o que o Brik vai te avisar.">
      {GRUPOS.map(({ titulo, itens }, i) => (
        <Fragment key={titulo}>
          <Grupo titulo={titulo}>
            {i === 0 && !pago && (
              <li className="bg-surface-raise px-4 py-3 text-xs leading-snug text-ink/70">
                Avisos de oportunidade por e-mail são dos planos Pro e Intermedium.{' '}
                <Link to="/planos" viewTransition className="font-bold text-brik hover:underline">
                  Ver planos
                </Link>
              </li>
            )}
            {itens.map(({ key, titulo: nome, detalhe }) => {
              const bloqueado = i === 0 && !pago
              return (
                <Linha key={key} titulo={nome} detalhe={detalhe}>
                  <Interruptor
                    ligado={bloqueado ? false : notificacoes[key]}
                    onChange={(ligada) => setNotificacao(key, ligada)}
                    label={nome}
                    desativado={bloqueado}
                  />
                </Linha>
              )
            })}
          </Grupo>
          {/* Logo depois das oportunidades: os modelos de que elas avisam. */}
          {i === 0 && <ModelosDeInteresse />}
        </Fragment>
      ))}

      <Nota>
        Cada oportunidade chega em um e-mail separado, no endereço da sua conta. Produto parado e
        novidades ainda não são enviados.
      </Nota>
    </SubPagina>
  )
}

export default Notificacoes
