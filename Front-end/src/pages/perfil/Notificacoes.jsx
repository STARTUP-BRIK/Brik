import { Fragment, useState } from 'react'
import { Grupo, Interruptor, Linha, Nota, SubPagina } from '../../components/SubPagina.jsx'
import { CATEGORIAS } from '../../config/categorias.js'
import { MODELOS, idsDaCategoria } from '../../config/modelos.js'
import { usePreferenciasStore } from '../../stores/usePreferenciasStore.js'

// Notificações. Por enquanto só guarda as escolhas: o envio dos avisos (push ou
// e-mail) ainda não existe. Quando existir, ele lê estas mesmas chaves.
const GRUPOS = [
  {
    titulo: 'Oportunidades',
    itens: [
      {
        key: 'oportunidades',
        titulo: 'Novas oportunidades',
        detalhe: 'Quando aparecer um bom negócio nas categorias que você escolheu nas Configurações.',
      },
      {
        key: 'extraordinarias',
        titulo: 'Negócios extraordinários',
        detalhe: 'Aviso na hora para ofertas 30% ou mais abaixo do preço de mercado.',
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

const Check = () => (
  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m2.5 6.2 2.3 2.3 4.7-4.9" />
  </svg>
)

// De quais modelos a pessoa quer aviso de oportunidade, uma aba por categoria
// do Brik. Já vem com o que ela marcou no onboarding (tela de modelos).
function ModelosDeInteresse() {
  const modelos = usePreferenciasStore((state) => state.modelosNotificacao)
  const setModelos = usePreferenciasStore((state) => state.setModelosNotificacao)
  const [aba, setAba] = useState(CATEGORIAS[0].value)
  const marcados = new Set(modelos)
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
      <div className="rounded-2xl bg-surface-card p-4 ring-1 ring-line">
        <p className="text-xs leading-snug text-ink/55">
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
                className={`flex h-9 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors ${
                  on ? 'bg-surface-card text-ink shadow-sm' : 'text-ink/60 hover:text-ink'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {n > 0 && <span className="min-w-5 rounded-full bg-brik px-1.5 text-[11px] font-bold leading-5 text-paper">{n}</span>}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-ink/55">
            {contagem(aba) ? `${contagem(aba)} de ${daAba.length} marcados` : 'Nenhum marcado: sem avisos desta categoria'}
          </p>
          <button type="button" onClick={() => marcar(daAba, !abaToda)} className="text-xs font-bold text-brik hover:underline">
            {abaToda ? 'Desmarcar todos' : 'Marcar todos'}
          </button>
        </div>

        <div role="tabpanel" className="mt-1">
          {MODELOS[aba].map((grupo) => {
            const ids = grupo.modelos.map((m) => m.id)
            const grupoTodo = ids.every((id) => marcados.has(id))
            return (
              <div key={grupo.grupo} className="mt-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wide text-ink/45">{grupo.grupo}</h3>
                  {ids.length > 1 && (
                    <button type="button" onClick={() => marcar(ids, !grupoTodo)} className="text-[11px] font-medium text-brik hover:underline">
                      {grupoTodo ? 'Desmarcar' : 'Marcar todos'}
                    </button>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {grupo.modelos.map((modelo) => {
                    const on = marcados.has(modelo.id)
                    return (
                      <button
                        key={modelo.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => marcar([modelo.id], !on)}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          on ? 'bg-brik text-paper' : 'bg-surface-raise text-ink hover:bg-line/70'
                        }`}
                      >
                        {on && <Check />}
                        {modelo.nome}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Notificacoes() {
  const notificacoes = usePreferenciasStore((state) => state.notificacoes)
  const setNotificacao = usePreferenciasStore((state) => state.setNotificacao)

  return (
    <SubPagina titulo="Notificações" descricao="Escolha sobre o que o Brik vai te avisar.">
      {GRUPOS.map(({ titulo, itens }, i) => (
        <Fragment key={titulo}>
          <Grupo titulo={titulo}>
            {itens.map(({ key, titulo: nome, detalhe }) => (
              <Linha key={key} titulo={nome} detalhe={detalhe}>
                <Interruptor ligado={notificacoes[key]} onChange={(ligada) => setNotificacao(key, ligada)} label={nome} />
              </Linha>
            ))}
          </Grupo>
          {/* Logo depois das oportunidades: os modelos de que elas avisam. */}
          {i === 0 && <ModelosDeInteresse />}
        </Fragment>
      ))}

      <Nota>
        Os avisos começam a chegar quando as notificações forem lançadas. Suas escolhas, incluindo
        os modelos que você acompanha, já ficam salvas na sua conta.
      </Nota>
    </SubPagina>
  )
}

export default Notificacoes
