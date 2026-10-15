import { useEffect, useRef, useState } from 'react'
import { buscarCep, mascaraCep } from '../../lib/cep.js'
import { cepDoEndereco, enderecoDaPosicao, posicaoAtual } from '../../lib/localizacao.js'
import { aplicarRadar } from '../../lib/salvarOnboarding.js'
import { useOnboardingStore } from '../../stores/useOnboardingStore.js'
import {
  CATEGORIAS_ONB,
  foraDePE,
  PROGRESSO,
  TEMPO_RESPOSTA,
  anterior,
  defeitoResumo,
  listaCategorias,
  mesAtual,
  modelosValidos,
  proximo,
  reais,
  reaisCentavos,
  regiao,
  valorDaHora,
} from './fluxo.js'
import { Botao, BotaoDesligado, Celular, Check, Controle, Etiqueta, Grafico, Lampada, Mira, Opcoes, Pino, Rotulo, Subtitulo, Tela, Titulo, Topo } from './pecas.jsx'
import { SAIDA, brilho, destaque } from './estilo.js'
import { MapaReal } from './MapaReal.jsx'
import { CartaoNotificacao } from './Climax.jsx'
import { MODELOS, idsDaCategoria } from '../../config/modelos.js'
import { NIVEIS } from '../../config/categorias.js'

// 10 a 14: o que adapta o produto (categorias, defeito, raio, lucro de hoje,
// meta) e a montagem do radar, que repete cada resposta.

const ICONES = { iphone: Celular, videogame_console: Controle }
const NOMES = { iphone: 'iPhones', videogame_console: 'Videogames' }

function Pergunta({ passo, children }) {
  return (
    <Tela className="px-5 pb-7 pt-11">
      <Topo voltar={anterior(passo, useOnboardingStore.getState())} progresso={PROGRESSO[passo]} />
      {children}
    </Tela>
  )
}

// Pílula de escolha (atalhos de raio e meta, categorias que conserta).
const pilula = (on) =>
  `rounded-full border-[1.5px] text-sm ${on ? 'border-ob-destaque bg-ob-destaque/12 text-ob-destaque' : 'border-line bg-surface-card text-ink'}`

// 10 · Categoria.
export function Categorias() {
  const categorias = useOnboardingStore((state) => state.categorias)
  const responder = useOnboardingStore((state) => state.responder)

  const alternar = (valor) =>
    responder({
      categorias: categorias.includes(valor)
        ? categorias.filter((c) => c !== valor)
        : Object.keys(CATEGORIAS_ONB).filter((c) => c === valor || categorias.includes(c)),
    })

  return (
    <Pergunta passo="categorias">
      <Rotulo>Seu radar · 1 de 5</Rotulo>
      <Titulo>O que você revende?</Titulo>
      <Subtitulo>Pode marcar as duas.</Subtitulo>

      <div className="mt-[26px] grid grid-cols-2 gap-3">
        {Object.keys(CATEGORIAS_ONB).map((valor) => {
          const on = categorias.includes(valor)
          const Icone = ICONES[valor]
          return (
            <button
              key={valor}
              type="button"
              aria-pressed={on}
              onClick={() => alternar(valor)}
              className={`relative flex h-44 flex-col justify-between rounded-[18px] border-[1.5px] p-4 text-left text-ob-titulo ${on ? 'border-ob-destaque bg-ob-destaque/8' : 'border-line bg-surface-card'
                }`}
            >
              <span
                aria-hidden="true"
                className={`absolute right-3.5 top-3.5 flex h-6 w-6 items-center justify-center rounded-full border-2 ${on ? 'border-ob-destaque bg-ob-destaque text-ob-sobre-destaque' : 'border-ink/40 text-transparent'
                  }`}
              >
                <Check largura={3} width="14" height="14" />
              </span>
              <Icone width="40" height="40" strokeWidth="1.6" className={on ? 'text-ob-destaque' : 'text-ink'} />
              <span className="text-lg font-bold">{NOMES[valor]}</span>
            </button>
          )
        })}
      </div>

      {categorias.length ? (
        <Botao to={proximo('categorias', {})}>Continuar</Botao>
      ) : (
        <BotaoDesligado>Marque pelo menos uma</BotaoDesligado>
      )}
    </Pergunta>
  )
}

// Anúncio ilustrativo da notificação de exemplo da 10b, um por categoria (no
// formato dos anúncios do feed; o do iPhone é o mesmo da 02b).
const EXEMPLO_DE_ALERTA = {
  iphone: {
    title: 'iPhone 13 128GB, bateria 89%',
    price: 1000,
    market_price: 1620,
    opportunity_level: 'extraordinaria',
    location_city: 'Recife',
  },
  videogame_console: {
    title: 'PS5 Slim 1TB com 2 controles',
    price: 2100,
    market_price: 2900,
    opportunity_level: 'otima',
    location_city: 'Recife',
  },
}

const SetaGeracao = ({ aberta }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={`shrink-0 text-mute transition-transform duration-200 ${aberta ? 'rotate-180' : ''}`}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

// Caixa de marcar a geração inteira: marcada, parcial (só alguns modelos, com
// o traço) ou vazia. Funciona com a geração aberta ou fechada.
function CaixaGeracao({ estado, nome, onClick }) {
  const cheia = estado !== 'vazia'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={estado === 'marcada' ? true : estado === 'parcial' ? 'mixed' : false}
      aria-label={`Todos os modelos de ${nome}`}
      onClick={onClick}
      className="-ml-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
    >
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 items-center justify-center rounded-md border-[1.5px] transition-colors ${
          cheia ? 'border-ob-destaque bg-ob-destaque text-ob-sobre-destaque' : 'border-ink/30 bg-surface-card'
        }`}
      >
        {estado === 'marcada' && <Check largura={3.2} width="13" height="13" />}
        {estado === 'parcial' && <span className="h-0.5 w-2.5 rounded-full bg-current" />}
      </span>
    </button>
  )
}

// Uma geração (iPhone 17, PlayStation 5...) num cartão que abre e fecha. No
// cabeçalho: a caixa que marca a geração toda, o nome, quantos estão marcados e
// a seta. Aberta, mostra os modelos para marcar um a um.
function Geracao({ grupo, marcados, aberta, onAbrir, onMarcar }) {
  const ids = grupo.modelos.map((m) => m.id)
  const n = ids.filter((id) => marcados.has(id)).length
  const estado = n === 0 ? 'vazia' : n === ids.length ? 'marcada' : 'parcial'
  const painel = `geracao-${ids[0]}`
  return (
    <section
      aria-label={grupo.grupo}
      className={`shrink-0 rounded-2xl border bg-surface-card transition-colors ${n ? 'border-ob-destaque/35' : 'border-line'}`}
    >
      <div className="flex items-center gap-1 pl-3 pr-2">
        <CaixaGeracao estado={estado} nome={grupo.grupo} onClick={() => onMarcar(ids, estado !== 'marcada')} />
        <button
          type="button"
          aria-expanded={aberta}
          aria-controls={painel}
          onClick={onAbrir}
          className="flex h-[52px] min-w-0 flex-1 items-center gap-2 rounded-xl pr-1.5 text-left"
        >
          <span className="flex-1 truncate text-[15px] font-bold text-ink">{grupo.grupo}</span>
          <span className={`text-xs ${n ? 'font-bold text-ob-destaque' : 'text-mute'}`}>
            {n ? `${n} de ${ids.length}` : `${ids.length} modelos`}
          </span>
          <SetaGeracao aberta={aberta} />
        </button>
      </div>

      {aberta && (
        <div
          id={painel}
          className="ob-anima flex flex-wrap gap-2 px-3.5 pb-3.5"
          style={{ animation: `ob-abre .25s ${SAIDA} both` }}
        >
          {grupo.modelos.map((modelo) => {
            const on = marcados.has(modelo.id)
            return (
              <button
                key={modelo.id}
                type="button"
                aria-pressed={on}
                onClick={() => onMarcar([modelo.id], !on)}
                className={`inline-flex h-10 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-sm font-bold transition-colors ${
                  on ? 'border-ob-destaque bg-ob-destaque text-ob-sobre-destaque' : 'border-line bg-surface-card text-ink hover:border-ob-destaque/40'
                }`}
              >
                {on && <Check largura={3} width="13" height="13" />}
                {modelo.nome}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

// 10b · Modelos: de quais modelos das categorias marcadas na 10 a pessoa quer
// ser avisada (sem dividir por capacidade). Com as duas categorias, uma aba para
// cada. A lista rola dentro da tela; a tela em si não rola.
export function Modelos() {
  const categorias = useOnboardingStore((state) => state.categorias)
  const modelos = useOnboardingStore((state) => state.modelos)
  const responder = useOnboardingStore((state) => state.responder)
  const [aba, setAba] = useState(categorias[0])
  const atual = categorias.includes(aba) ? aba : categorias[0]

  const marcados = new Set(modelos)
  const contagem = (categoria) => idsDaCategoria(categoria).filter((id) => marcados.has(id)).length
  const total = categorias.reduce((soma, c) => soma + contagem(c), 0)
  const faltando = categorias.find((c) => contagem(c) === 0)
  const daAba = idsDaCategoria(atual)
  const abaToda = daAba.every((id) => marcados.has(id))

  const marcar = (ids, ligar) => {
    const resto = modelos.filter((m) => !ids.includes(m))
    responder({ modelos: ligar ? [...resto, ...ids] : resto })
  }

  // Gerações abertas ("iphone:iPhone 17"), de todas as abas: trocar de aba ou
  // fechar uma geração não mexe no que está marcado. Começam abertas a mais
  // nova de cada categoria e as que já têm algum modelo marcado.
  const [abertas, setAbertas] = useState(
    () =>
      new Set(
        categorias.flatMap((c) =>
          MODELOS[c]
            .filter((g, i) => i === 0 || g.modelos.some((m) => marcados.has(m.id)))
            .map((g) => `${c}:${g.grupo}`),
        ),
      ),
  )
  const alternarGeracao = (chave) =>
    setAbertas((atuais) => {
      const novas = new Set(atuais)
      if (novas.has(chave)) novas.delete(chave)
      else novas.add(chave)
      return novas
    })

  return (
    <Pergunta passo="modelos">
      <Rotulo>Seu radar · 2 de 5</Rotulo>
      <Titulo>Quais produtos você quer ser notificado?</Titulo>

      {/* Como o alerta chega, com um exemplo da categoria da aba aberta. */}
      <div key={`alerta-${atual}`} className="ob-anima mt-4" style={{ animation: `ob-sobe-10 .45s ${SAIDA} both` }}>
        <CartaoNotificacao item={EXEMPLO_DE_ALERTA[atual]} suave aria-hidden="true" />
      </div>
      <Subtitulo className="mt-5">Você só recebe alerta dos modelos que marcar.</Subtitulo>

      {categorias.length > 1 && (
        <div role="tablist" className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-surface-raise p-1">
          {categorias.map((categoria) => {
            const on = categoria === atual
            const n = contagem(categoria)
            const Icone = ICONES[categoria]
            return (
              <button
                key={categoria}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setAba(categoria)}
                className={`flex h-10 items-center justify-center gap-2 rounded-full text-sm font-bold ${on ? 'bg-surface-card text-ob-titulo shadow-[0_2px_8px_-3px_rgba(0,0,0,0.3)]' : 'text-mute'
                  }`}
              >
                <Icone width="18" height="18" />
                {NOMES[categoria]}
                {n > 0 && (
                  <span className="min-w-5 rounded-full bg-ob-destaque px-1.5 text-[11px] leading-5 text-ob-sobre-destaque">{n}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ob-titulo">{NOMES[atual]}</p>
        <button type="button" onClick={() => marcar(daAba, !abaToda)} className="text-sm font-bold text-ob-destaque">
          {abaToda ? 'Desmarcar todos' : 'Marcar todos'}
        </button>
      </div>

      <div
        key={atual}
        className="ob-anima ob-sem-barra -mx-5 mt-1 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-5 pb-6 pt-2"
        style={{
          animation: 'ob-mostra .25s ease both',
          // As gerações somem aos poucos nas bordas da lista, indicando que ela rola.
          maskImage: 'linear-gradient(to bottom, transparent, black 10px, black calc(100% - 28px), transparent)',
        }}
      >
        {MODELOS[atual].map((grupo) => (
          <Geracao
            key={grupo.grupo}
            grupo={grupo}
            marcados={marcados}
            aberta={abertas.has(`${atual}:${grupo.grupo}`)}
            onAbrir={() => alternarGeracao(`${atual}:${grupo.grupo}`)}
            onMarcar={marcar}
          />
        ))}
      </div>

      {faltando ? (
        <BotaoDesligado className="mt-3">
          {total ? `Marque um modelo de ${CATEGORIAS_ONB[faltando].singular}` : 'Marque pelo menos um modelo'}
        </BotaoDesligado>
      ) : (
        <Botao to={proximo('modelos', {})} className="mt-3">
          Continuar · {total} {total === 1 ? 'modelo' : 'modelos'}
        </Botao>
      )}
    </Pergunta>
  )
}

// 10c · Oportunidades: de quais níveis a pessoa quer e-mail (um por anúncio,
// worker/notificacoes.js). Pode marcar mais de um; vem com ótimo e
// extraordinário, os de menos volume.
const VOLUME_DO_NIVEL = {
  boa: 'O que mais aparece',
  otima: 'Aparece menos',
  extraordinaria: 'Raro: a melhor chance de lucro',
}

export function Oportunidade() {
  const niveis = useOnboardingStore((state) => state.niveisAlerta)
  const responder = useOnboardingStore((state) => state.responder)

  const alternar = (valor) =>
    responder({
      niveisAlerta: niveis.includes(valor)
        ? niveis.filter((n) => n !== valor)
        : NIVEIS.map((n) => n.value).filter((n) => n === valor || niveis.includes(n)),
    })

  return (
    <Pergunta passo="oportunidade">
      <Rotulo>Seu radar · 3 de 5</Rotulo>
      <Titulo>Quais oportunidades você quer receber?</Titulo>
      <Subtitulo>Cada uma chega no seu e-mail assim que aparece. Pode marcar mais de uma.</Subtitulo>

      <div className="mt-6">
        {NIVEIS.map(({ value, label, desconto }, i) => {
          const on = niveis.includes(value)
          return (
            <button
              key={value}
              type="button"
              aria-pressed={on}
              onClick={() => alternar(value)}
              className={`flex min-h-16 w-full items-center gap-3.5 rounded-[14px] border-[1.5px] px-4 py-3 text-left text-ink ${
                i < NIVEIS.length - 1 ? 'mb-2.5' : ''
              } ${on ? 'border-ob-destaque bg-ob-destaque/8' : 'border-line bg-surface-card'}`}
            >
              <span className="flex flex-1 flex-col gap-[3px]">
                <span className="text-[15px] font-medium">{label}</span>
                <span className="text-[12.5px] text-mute">
                  {desconto}% ou mais abaixo do mercado · {VOLUME_DO_NIVEL[value]}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  on ? 'border-ob-destaque bg-ob-destaque text-ob-sobre-destaque' : 'border-ink/40 text-transparent'
                }`}
              >
                <Check largura={3} width="14" height="14" />
              </span>
            </button>
          )
        })}
      </div>

      {niveis.length ? (
        <Botao to={proximo('oportunidade', {})}>Continuar</Botao>
      ) : (
        <BotaoDesligado>Marque pelo menos uma</BotaoDesligado>
      )}
    </Pergunta>
  )
}

// 11 · Aparelho com defeito. Sozinho (11a): "Sim, eu conserto" ou "Não". Com
// equipe (11b, 1 pessoa ou mais): também "tem alguém na equipe que conserta".
export function Defeito() {
  const r = useOnboardingStore()
  const sozinho = r.equipe === 'sozinho'
  const opcoes = [
    { valor: 'sim', titulo: 'Sim, eu conserto', detalhe: 'Quero ver aparelho com defeito também' },
    !sozinho && { valor: 'alguem', titulo: 'Sim, tem alguém na equipe que conserta', detalhe: 'Quero ver aparelho com defeito também' },
    { valor: 'nao', titulo: 'Não', detalhe: 'Só aparelho funcionando' },
  ].filter(Boolean)
  // Quem trocou de "equipe" para "sozinho" depois de escolher "alguém".
  const escolha = sozinho && r.defeito === 'alguem' ? 'sim' : r.defeito

  const alternar = (valor) =>
    r.responder({
      conserta: r.conserta.includes(valor) ? r.conserta.filter((c) => c !== valor) : [...r.conserta, valor],
    })

  return (
    <Pergunta passo="defeito">
      <Rotulo>Seu radar · 4 de 5</Rotulo>
      <Titulo id="pergunta">Você procura aparelho com defeito?</Titulo>

      <aside className="mt-[18px] flex gap-2.5 rounded-xl bg-ob-destaque/7 p-3.5">
        <Lampada className="mt-px shrink-0 text-ob-destaque" />
        <div>
          <p className="text-xs font-bold text-ob-destaque">Dica</p>
          <p className="mt-1 text-[13px] leading-[1.45] text-ink">
            {sozinho ? 'Se você sabe consertar' : 'Se você ou alguém da sua equipe sabe consertar'}, o aparelho com defeito sai bem
            mais barato, e o conserto vira lucro.
          </p>
        </div>
      </aside>

      <Opcoes
        rotulo="pergunta"
        className="mt-[18px]"
        opcoes={opcoes}
        valor={escolha}
        onEscolher={(valor) => r.responder({ defeito: valor })}
      />

      {escolha !== 'nao' && (
        <section
          aria-labelledby="quais"
          className="ob-anima mt-5"
          style={{ animation: `ob-abre .35s ${SAIDA} both` }}
        >
          <p id="quais" className="text-sm font-bold text-ob-titulo">
            {escolha === 'alguem' ? 'Quais destes sua equipe conserta?' : 'Quais destes você conserta?'}
          </p>
          {/* Só as categorias marcadas na 10. */}
          <div className="mt-2.5 flex flex-wrap gap-2">
            {r.categorias.map((valor) => {
              const on = r.conserta.includes(valor)
              const Icone = ICONES[valor]
              return (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={on}
                  onClick={() => alternar(valor)}
                  className={`inline-flex h-11 items-center gap-2 px-4 font-bold ${pilula(on)}`}
                >
                  <Icone />
                  {NOMES[valor]}
                  <Check largura={3} width="14" height="14" className={on ? 'text-ob-destaque' : 'text-transparent'} />
                </button>
              )
            })}
          </div>
          <p className="mt-2.5 text-[12.5px] leading-[1.45] text-mute">
            Aparelho com defeito só aparece nas categorias que você marcar. Nas outras, só funcionando.
          </p>
        </section>
      )}

      <Botao to={proximo('defeito', {})}>Continuar</Botao>
    </Pergunta>
  )
}

// Quadras do mapa esquemático (350 × 210). Repetidas em volta, para sempre
// haver rua à vista quando o mapa se afasta.
const QUADRAS = [-2, -1, 0, 1, 2].flatMap((i) => [-2, -1, 0, 1, 2].map((j) => [i * 350, j * 210]))

// 12 · Raio de busca, como no Marketplace do Facebook: ponto de partida e raio
// de 1 a 100 km. Ao abrir, a tela já pede a localização do aparelho e preenche
// o CEP; quem não permitir digita o CEP. Com o ponto, o mapa é o real
// (MapaReal), centrado nele; antes, um mapa esquemático. Nos dois, o mapa se
// afasta conforme o raio cresce e o círculo cresce pouco, para 1 km e 100 km
// caberem no mesmo quadro.
// No mapa real o círculo do raio tem tamanho fixo (quase a altura do quadro, que
// é 210 px) e só o mapa aproxima e afasta: com 1 km fica perto da rua; com
// 100 km, mostra a região inteira.
const RAIO_NO_MAPA = 90

export function Raio() {
  const r = useOnboardingStore()
  const raio = r.raio
  const responder = r.responder
  // Mapa esquemático (antes de haver ponto): o círculo cresce pouco e o desenho
  // se afasta.
  const diametro = Math.round(60 + 55 * Math.log10(raio))
  const zoom = Math.pow(15 / raio, 0.6)

  // O ponto de partida vem do CEP, consultado assim que tem 8 dígitos
  // (lib/cep.js), ou da localização do aparelho (lib/localizacao.js). `busca`:
  // 'vazio', 'buscando', 'localizando', 'ok', 'nao-achou', 'erro',
  // 'sem-permissao' ou 'sem-local'. Quem volta para cá já com um ponto começa
  // em 'ok'. `pedido`: a consulta que vale (o CEP digitado ou 'local').
  const [digitado, setDigitado] = useState(() => mascaraCep(r.cep))
  const [busca, setBusca] = useState(r.cidade || r.lat != null ? 'ok' : 'vazio')
  const pedido = useRef(r.cep)

  async function usarLocalizacao() {
    pedido.current = 'local'
    setBusca('localizando')
    try {
      const posicao = await posicaoAtual()
      const endereco = await enderecoDaPosicao(posicao)
      // O CEP da rua e do número dela (ViaCEP); se não der, o do mapa.
      const cep = await cepDoEndereco(endereco).catch(() => endereco.cepDoMapa)
      if (pedido.current !== 'local') return
      responder({ origem: 'local', cep, ...posicao, rua: endereco.rua, bairro: endereco.bairro, cidade: endereco.cidade, uf: endereco.uf })
      setDigitado(mascaraCep(cep))
      pedido.current = cep
      setBusca('ok')
    } catch (erro) {
      if (pedido.current !== 'local') return
      pedido.current = ''
      // code 1: a pessoa (ou o navegador) negou a permissão.
      setBusca(erro?.code === 1 ? 'sem-permissao' : 'sem-local')
    }
  }

  async function digitar(valor) {
    const mascara = mascaraCep(valor)
    setDigitado(mascara)
    const digitos = mascara.replace(/\D/g, '')
    if (digitos.length < 8) {
      pedido.current = ''
      setBusca('vazio')
      return
    }
    if (digitos === pedido.current) return
    pedido.current = digitos
    setBusca('buscando')
    try {
      const achado = await buscarCep(digitos)
      // Outro CEP foi digitado enquanto este era consultado.
      if (pedido.current !== digitos) return
      if (!achado) return setBusca('nao-achou')
      responder({ ...achado, origem: 'cep' })
      setBusca('ok')
    } catch {
      if (pedido.current === digitos) {
        pedido.current = ''
        setBusca('erro')
      }
    }
  }

  const pediuAoAbrir = useRef(false)
  useEffect(() => {
    if (pediuAoAbrir.current || busca !== 'vazio') return
    pediuAoAbrir.current = true
    usarLocalizacao()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Quantos km o raio cobre, no canto do mapa.
  const rotuloRaio = (
    <span className="absolute bottom-3 left-3 rounded-full bg-[rgba(14,22,24,0.85)] px-2.5 py-1 font-mono text-xs text-mint">
      raio de {raio} km
    </span>
  )

  // No mapa esquemático: círculo do raio, ponto de partida e o rótulo. (O mapa
  // real desenha o círculo e o ponto ele mesmo.)
  const marcas = (
    <>
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ob-destaque bg-ob-destaque/12 transition-[width,height] duration-[250ms] ease-[ease]"
        style={{ width: diametro, height: diametro }}
      />
      <span
        className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ob-circulo bg-ob-destaque"
        style={{ boxShadow: `0 0 0 6px ${destaque(25)}` }}
      />
      {rotuloRaio}
    </>
  )

  const situacao = {
    vazio: <span className="text-mute">Os anúncios vão aparecer a partir daqui.</span>,
    buscando: <span className="text-mute">Procurando o CEP…</span>,
    'nao-achou': <span className="text-loss">Não achamos esse CEP. Confira os números.</span>,
    erro: <span className="text-loss">Não deu para consultar o CEP agora. Tente de novo.</span>,
    localizando: <span className="text-mute">Pegando sua localização…</span>,
    'sem-permissao': <span className="text-loss">Sem permissão para a localização. Digite o CEP.</span>,
    'sem-local': <span className="text-loss">Não deu para pegar sua localização. Digite o CEP.</span>,
    ok: (
      <span className="flex items-center gap-1.5 text-ink">
        <Check largura={3} width="14" height="14" className="shrink-0 text-ob-destaque" />
        <span className="truncate">
          {[r.bairro, r.cidade].filter(Boolean).join(', ') || 'Sua localização'}
          {r.cidade && r.uf && ` - ${r.uf}`}
          {r.origem === 'local' && <span className="text-mute"> · sua localização</span>}
        </span>
      </span>
    ),
  }[busca]

  return (
    <Pergunta passo="raio">
      <Rotulo>Seu radar · 5 de 5</Rotulo>
      <Titulo>Até onde você vai para buscar um produto?</Titulo>

      <div className="mt-5 flex items-center justify-between gap-3">
        <label htmlFor="cep" className="text-[13px] font-bold text-ink">
          Seu CEP
        </label>
        {/* -my-3: a área de toque fica com 44 px sem afastar o campo. */}
        <button
          type="button"
          onClick={usarLocalizacao}
          disabled={busca === 'localizando'}
          className="-my-3 flex items-center gap-1.5 py-3 text-[13px] font-bold text-ob-destaque disabled:opacity-60"
        >
          <Mira />
          Usar minha localização
        </button>
      </div>
      <div className="mt-2 flex h-14 items-center gap-3 rounded-[14px] border-[1.5px] border-line bg-surface-card px-3.5 focus-within:border-ob-destaque">
        <Pino width="20" height="20" className="shrink-0 text-ob-destaque" />
        <input
          id="cep"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          aria-describedby="cep-situacao"
          value={digitado}
          onChange={(event) => digitar(event.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent text-[17px] font-medium tracking-wide text-ink outline-none ob-sem-contorno placeholder:font-normal placeholder:text-mute/70"
        />
        {(busca === 'buscando' || busca === 'localizando') && (
          <span
            aria-hidden="true"
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-mute border-t-transparent motion-reduce:animate-none"
          />
        )}
      </div>
      <p id="cep-situacao" aria-live="polite" className="mt-1.5 min-h-[18px] text-[13px] leading-[18px]">
        {situacao}
      </p>
      {busca === 'ok' && foraDePE(r) && (
        <p className="mt-1 text-[12.5px] leading-[1.45] text-mute">Por enquanto o Brik busca anúncios só em Pernambuco.</p>
      )}

      <div
        aria-hidden="true"
        className="relative mt-3 h-[210px] overflow-hidden rounded-[18px] border border-line bg-[#e9ece6] dark:bg-[#13201f]"
      >
        {r.lat != null ? (
          <MapaReal lat={r.lat} lng={r.lng} raioKm={raio} raioPx={RAIO_NO_MAPA} rua={r.rua}>
            {rotuloRaio}
          </MapaReal>
        ) : (
          <>
            <svg viewBox="0 0 350 210" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 block h-full w-full">
              <defs>
                <g id="ob-quadra">
                  <path
                    d="M20 0 70 80l70 30 120 6M160 0l10 105-30 105M0 60l90 30 80 18M60 210l80-100 110-70M230 0l-30 90 20 120"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-[#dddcd6] dark:stroke-[#22323a]"
                  />
                  <path d="M0 175l120-50M100 0l20 60M300 210l-60-60" fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-[#e1e0da] dark:stroke-[#1c2a2e]" />
                </g>
              </defs>
              {/* Tudo se afasta a partir do centro (o ponto de partida). */}
              <g className="transition-transform duration-[250ms] ease-[ease]" style={{ transform: `scale(${zoom})`, transformOrigin: '175px 105px' }}>
                {QUADRAS.map(([x, y]) => (
                  <use key={`${x},${y}`} href="#ob-quadra" x={x} y={y} />
                ))}
                {/* O rio e o mar continuam além do quadro, para cobrir o mapa afastado. */}
                <path
                  d="M-700 150C-400 120-200 145 0 132C60 120 110 140 168 118s70-6 92 4"
                  fill="none"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="stroke-[#bcd3d8] dark:stroke-[#183038]"
                />
                <path
                  d="M262-700C280-400 250-200 268 0C254 52 276 98 258 146s4 64 10 64C282 400 250 600 270 900H1400V-700Z"
                  className="fill-[#cfe0e4] dark:fill-[#0a1416]"
                />
              </g>
            </svg>
            {marcas}
          </>
        )}
      </div>

      <div className="mt-[18px] flex items-baseline justify-between">
        <label htmlFor="raio" className="text-sm font-bold text-ob-titulo">
          Raio
        </label>
        <span className="text-[26px] font-bold tracking-[-0.02em] text-ob-destaque">{raio} km</span>
      </div>
      <input
        id="raio"
        type="range"
        min="1"
        max="100"
        step="1"
        value={raio}
        onChange={(event) => responder({ raio: Number(event.target.value) })}
        aria-valuetext={`${raio} quilômetros`}
        className="mt-1 h-8 w-full cursor-pointer accent-ob-destaque"
      />
      <div aria-hidden="true" className="flex justify-between font-mono text-[11px] text-mute">
        <span>1 km</span>
        <span>100 km</span>
      </div>

      <div className="mt-3.5 flex gap-2">
        {[5, 10, 20, 50].map((km) => (
          <button
            key={km}
            type="button"
            aria-pressed={raio === km}
            onClick={() => responder({ raio: km })}
            className={`h-11 flex-1 font-medium ${pilula(raio === km)}`}
          >
            {km} km
          </button>
        ))}
      </div>

      {busca === 'ok' ? (
        <Botao to={proximo('raio', {})}>Continuar com {raio} km</Botao>
      ) : (
        <BotaoDesligado>Informe seu CEP ou localização</BotaoDesligado>
      )}
    </Pergunta>
  )
}

const inteiro = new Intl.NumberFormat('pt-BR')

// Valor em reais por mês (12b e 13): o campo grande, só números, e os atalhos
// em pílula. `atalhos`: { valor, texto? } (sem texto, mostra o valor).
function CampoReais({ id, rotulo, valor, onMudar, atalhos }) {
  return (
    <>
      <label htmlFor={id} className="mt-[26px] text-[13px] font-bold text-ink">
        {rotulo}
      </label>
      <div className="mt-2 flex h-[76px] items-center gap-3 rounded-2xl border-[1.5px] border-ob-destaque bg-surface-card px-[18px]">
        <span className="text-xl font-bold text-ob-destaque">R$</span>
        <span aria-hidden="true" className="h-[34px] w-0.5 rounded-full bg-line" />
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={valor > 0 ? inteiro.format(valor) : ''}
          onChange={(event) => {
            const digitos = event.target.value.replace(/\D/g, '').slice(0, 7)
            onMudar(digitos ? Number(digitos) : 0)
          }}
          className="min-w-0 flex-1 border-0 bg-transparent text-[34px] font-bold tracking-[-0.02em] text-ob-titulo outline-none ob-sem-contorno"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {atalhos.map((atalho) => (
          <button
            key={atalho.valor}
            type="button"
            aria-pressed={valor === atalho.valor}
            onClick={() => onMudar(atalho.valor)}
            className={`h-11 px-4 font-medium ${pilula(valor === atalho.valor)}`}
          >
            {atalho.texto ?? reais(atalho.valor)}
          </button>
        ))}
      </div>
    </>
  )
}

// 12b · Lucro médio por mês hoje. Com o tempo procurando (05), dá quanto vale
// cada hora de busca, que volta na escolha de plano (20) ao lado do preço do Pro.
// "Estou começando" vale 0: aí a conta fica só nas horas.
export function Lucro() {
  const r = useOnboardingStore()
  const { mes, porHora } = valorDaHora(r, 0)

  return (
    <Pergunta passo="lucro">
      <Rotulo>Seu lucro hoje</Rotulo>
      <Titulo>Em média, quanto você já lucra por mês com o brique?</Titulo>
      <Subtitulo>Uma conta aproximada já serve.</Subtitulo>

      <CampoReais
        id="lucro"
        rotulo="Lucro médio por mês"
        valor={r.lucroAtual}
        onMudar={(valor) => r.responder({ lucroAtual: valor })}
        atalhos={[{ valor: 0, texto: 'Estou começando' }, { valor: 500 }, { valor: 1000 }, { valor: 2000 }, { valor: 5000 }]}
      />

      <div className="mt-6 rounded-2xl border border-line bg-surface-card p-4">
        <Etiqueta>Sua hora de busca</Etiqueta>
        {porHora ? (
          <>
            <p className="mt-2.5 text-[15px] text-ink">
              <strong className="text-xl font-bold text-ob-titulo">{reaisCentavos(porHora)}</strong> por hora
            </p>
            <p className="mt-2.5 text-[12.5px] leading-[1.45] text-mute">
              É o seu lucro dividido pelas cerca de {mes} horas{r.equipe === 'sozinho' ? '' : ' de equipe'} por mês rolando
              anúncio. Cada uma delas custa isso.
            </p>
          </>
        ) : (
          <p className="mt-2.5 text-[15px] leading-[1.45] text-ink">
            São cerca de <strong className="font-bold text-ob-titulo">{mes} horas</strong> por mês rolando anúncio que podem virar
            negociação.
          </p>
        )}
      </div>

      <Botao to={proximo('lucro', {})}>Continuar</Botao>
    </Pergunta>
  )
}

// 13 · Meta de lucro mensal. Vai para a conclusão e vira a meta do dashboard.
export function Meta() {
  const meta = useOnboardingStore((state) => state.meta)
  const lucroAtual = useOnboardingStore((state) => state.lucroAtual)
  const responder = useOnboardingStore((state) => state.responder)
  const metaFmt = meta > 0 ? inteiro.format(meta) : ''

  return (
    <Pergunta passo="meta">
      <Rotulo>Sua meta</Rotulo>
      <Titulo>Quanto você quer lucrar por mês com o brique?</Titulo>
      {lucroAtual > 0 && <Subtitulo>Hoje são cerca de {reais(lucroAtual)} por mês.</Subtitulo>}

      <CampoReais
        id="meta"
        rotulo="Meta de lucro mensal"
        valor={meta}
        onMudar={(valor) => responder({ meta: valor })}
        atalhos={[1000, 2000, 5000, 10000].map((valor) => ({ valor }))}
      />

      <div className="mt-6 rounded-2xl border border-line bg-surface-card p-4">
        <div className="flex items-center justify-between">
          <Etiqueta>No seu dashboard</Etiqueta>
          <Grafico className="text-mute" />
        </div>
        <p className="mt-2.5 text-sm text-mute">Meta de {mesAtual()}</p>
        <p className="mt-1 text-[15px] text-ink">
          <strong className="text-xl font-bold text-ob-titulo">R$ 0</strong> de R$ {metaFmt}
        </p>
        <div className="mt-2.5 h-1.5 rounded-full bg-surface-raise" />
        <p className="mt-2.5 text-[12.5px] leading-[1.45] text-mute">
          Cada compra e venda que você registrar soma aqui. Dá para mudar a meta quando quiser.
        </p>
      </div>

      {meta > 0 ? (
        <Botao to={proximo('meta', {})}>Montar meu radar</Botao>
      ) : (
        <BotaoDesligado>Escolha uma meta</BotaoDesligado>
      )}
    </Pergunta>
  )
}

// Item da montagem: entra com o check, um depois do outro.
function Item({ atraso, ultimo = false, children }) {
  return (
    <li
      className={`ob-anima flex items-start gap-3 ${ultimo ? '' : 'mb-3.5'}`}
      style={{ animation: `ob-sobe-10 .45s ${SAIDA} ${atraso}s both` }}
    >
      <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ob-destaque text-ob-sobre-destaque">
        <Check largura={3} width="14" height="14" />
      </span>
      <span className="text-[15px] leading-normal">{children}</span>
    </li>
  )
}

const Forte = ({ children }) => <strong className="font-bold text-ob-titulo">{children}</strong>

// 14 · Montagem do radar (~3 s): cada linha entra com check repetindo uma
// resposta, enquanto o radar gira; o botão aparece no fim.
export function Montagem() {
  const r = useOnboardingStore()
  const defeito = defeitoResumo(r)
  const modelos = modelosValidos(r).length
  const pontos = [
    { left: 150, top: 46, tamanho: 10, brilho: 12, atraso: '0s' },
    { left: 172, top: 128, tamanho: 8, brilho: 10, atraso: '.9s' },
    { left: 58, top: 150, tamanho: 8, brilho: 10, atraso: '1.7s' },
  ]

  return (
    <Tela
      className="px-6 pb-7 pt-14"
      fundo={`radial-gradient(90% 45% at 50% 22%, ${brilho(28)}, transparent 70%), var(--color-surface)`}
    >
      <Rotulo className="text-center text-ob-destaque">Montando seu radar</Rotulo>

      <div aria-hidden="true" className="relative mx-auto mt-[26px] h-56 w-56 shrink-0">
        <span className="absolute inset-0 rounded-full border-[1.5px] border-ob-destaque/25" />
        <span className="absolute inset-10 rounded-full border-[1.5px] border-ob-destaque/35" />
        <span className="absolute inset-20 rounded-full border-[1.5px] border-ob-destaque/50" />
        <span className="absolute bottom-0 left-[111px] top-0 w-px bg-ob-destaque/14" />
        <span className="absolute left-0 right-0 top-[111px] h-px bg-ob-destaque/14" />
        <span
          className="ob-anima absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, ${destaque(55)}, ${destaque(0)} 75deg, ${destaque(0)} 360deg)`,
            animation: 'ob-gira 2.6s linear infinite',
          }}
        />
        {pontos.map((p) => (
          <span
            key={p.left}
            className="ob-anima absolute rounded-full bg-ob-destaque"
            style={{
              left: p.left,
              top: p.top,
              width: p.tamanho,
              height: p.tamanho,
              boxShadow: `0 0 ${p.brilho}px var(--color-ob-destaque)`,
              animation: `ob-ponto 2.6s ease-in-out ${p.atraso} infinite`,
            }}
          />
        ))}
        <span className="absolute left-[106px] top-[106px] h-3 w-3 rounded-full bg-ob-circulo" />
      </div>

      <ul className="mt-[30px]">
        <Item atraso={0.4}>
          <Forte>{listaCategorias(r.categorias, { maiuscula: true })}</Forte>, {modelos}{' '}
          {modelos === 1 ? 'modelo' : 'modelos'}
        </Item>
        <Item atraso={0.9}>
          {defeito ? (
            defeito.so ? (
              <>
                Com defeito, só <Forte>{defeito.texto}</Forte>
              </>
            ) : (
              <>
                Com defeito em <Forte>{defeito.texto}</Forte>
              </>
            )
          ) : (
            <>
              Só aparelho <Forte>funcionando</Forte>
            </>
          )}
        </Item>
        <Item atraso={1.4}>
          Em <Forte>{regiao(r)}</Forte>
        </Item>
        <Item atraso={1.9}>
          <span className="flex flex-col">
            <span>
              Alerta em <Forte>menos de 5 minutos</Forte>
            </span>
            <span className="text-[13px] text-mute">Hoje você responde {TEMPO_RESPOSTA[r.tempoResposta].curto}</span>
          </span>
        </Item>
        <Item atraso={2.4} ultimo>
          Meta de <Forte>{reais(r.meta)} por mês</Forte> no dashboard
        </Item>
      </ul>

      <Botao
        to={proximo('montagem', {})}
        onClick={aplicarRadar}
        seta
        className="ob-anima mt-auto"
        style={{ animation: `ob-sobe-10 .45s ${SAIDA} 2.9s both` }}
      >
        Ver meu radar
      </Botao>
    </Tela>
  )
}
