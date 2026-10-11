import { aplicarRadar } from '../../lib/salvarOnboarding.js'
import { useOnboardingStore } from '../../stores/useOnboardingStore.js'
import {
  CATEGORIAS_ONB,
  CIDADES_PE,
  PROGRESSO,
  TEMPO_RESPOSTA,
  anterior,
  defeitoResumo,
  listaCategorias,
  mesAtual,
  proximo,
  reais,
  regiao,
} from './fluxo.js'
import { Botao, BotaoDesligado, Celular, Check, Controle, Etiqueta, Grafico, Lampada, Opcoes, Pino, Rotulo, Subtitulo, Tela, Titulo, Topo } from './pecas.jsx'
import { SAIDA, brilho, destaque } from './estilo.js'

// 10 a 14: o que adapta o produto (categorias, defeito, raio, meta) e a
// montagem do radar, que repete cada resposta.

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
      <Rotulo>Seu radar · 1 de 3</Rotulo>
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
              className={`relative flex h-44 flex-col justify-between rounded-[18px] border-[1.5px] p-4 text-left text-ob-titulo ${
                on ? 'border-ob-destaque bg-ob-destaque/8' : 'border-line bg-surface-card'
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute right-3.5 top-3.5 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  on ? 'border-ob-destaque bg-ob-destaque text-ob-sobre-destaque' : 'border-ink/40 text-transparent'
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
      <Rotulo>Seu radar · 2 de 3</Rotulo>
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
// de 1 a 100 km. O mapa é esquemático e se afasta conforme o raio cresce (com
// 15 km fica no tamanho do canvas); o círculo cresce pouco, para 1 km e 100 km
// caberem no mesmo quadro.
export function Raio() {
  const cidade = useOnboardingStore((state) => state.cidade)
  const raio = useOnboardingStore((state) => state.raio)
  const responder = useOnboardingStore((state) => state.responder)
  const diametro = Math.round(60 + 55 * Math.log10(raio))
  const zoom = Math.pow(15 / raio, 0.6)

  return (
    <Pergunta passo="raio">
      <Rotulo>Seu radar · 3 de 3</Rotulo>
      <Titulo>Até onde você vai para buscar um aparelho?</Titulo>

      {/* O select nativo cobre a linha inteira: no celular abre a roleta do sistema. */}
      <label className="relative mt-5 flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] border-line bg-surface-card px-3.5 py-2.5 text-left text-ink focus-within:border-ob-destaque">
        <Pino width="20" height="20" className="shrink-0 text-ob-destaque" />
        <span className="flex flex-1 flex-col gap-px">
          <span className="text-xs text-mute">Buscar a partir de</span>
          <span className="text-[15px] font-medium">{cidade}, PE</span>
        </span>
        <span aria-hidden="true" className="text-sm font-bold text-ob-destaque">
          Alterar
        </span>
        <select
          aria-label="Buscar a partir de"
          value={cidade}
          onChange={(event) => responder({ cidade: event.target.value })}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {CIDADES_PE.map((c) => (
            <option key={c.nome} value={c.nome}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>

      <div
        aria-hidden="true"
        className="relative mt-3 h-[210px] overflow-hidden rounded-[18px] border border-line bg-[#e9ece6] dark:bg-[#13201f]"
      >
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
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ob-destaque bg-ob-destaque/12 transition-[width,height] duration-[250ms] ease-[ease]"
          style={{ width: diametro, height: diametro }}
        />
        <span
          className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ob-circulo bg-ob-destaque"
          style={{ boxShadow: `0 0 0 6px ${destaque(25)}` }}
        />
        <span className="absolute bottom-3 left-3 rounded-full bg-[rgba(14,22,24,0.85)] px-2.5 py-1 font-mono text-xs text-mint">
          raio de {raio} km
        </span>
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

      <Botao to={proximo('raio', {})}>Continuar com {raio} km</Botao>
    </Pergunta>
  )
}

const inteiro = new Intl.NumberFormat('pt-BR')

// 13 · Meta de lucro mensal. Vai para a conclusão e vira a meta do dashboard.
export function Meta() {
  const meta = useOnboardingStore((state) => state.meta)
  const responder = useOnboardingStore((state) => state.responder)
  const metaFmt = meta > 0 ? inteiro.format(meta) : ''

  return (
    <Pergunta passo="meta">
      <Rotulo>Sua meta</Rotulo>
      <Titulo>Quanto você quer lucrar por mês com o brique?</Titulo>

      <label htmlFor="meta" className="mt-[26px] text-[13px] font-bold text-ink">
        Meta de lucro mensal
      </label>
      <div className="mt-2 flex h-[76px] items-center gap-3 rounded-2xl border-[1.5px] border-ob-destaque bg-surface-card px-[18px]">
        <span className="text-xl font-bold text-ob-destaque">R$</span>
        <span aria-hidden="true" className="h-[34px] w-0.5 rounded-full bg-line" />
        <input
          id="meta"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={metaFmt}
          onChange={(event) => {
            const digitos = event.target.value.replace(/\D/g, '').slice(0, 7)
            responder({ meta: digitos ? Number(digitos) : 0 })
          }}
          className="min-w-0 flex-1 border-0 bg-transparent text-[34px] font-bold tracking-[-0.02em] text-ob-titulo outline-none"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {[1000, 2000, 5000, 10000].map((valor) => (
          <button
            key={valor}
            type="button"
            aria-pressed={meta === valor}
            onClick={() => responder({ meta: valor })}
            className={`h-11 px-4 font-medium ${pilula(meta === valor)}`}
          >
            {reais(valor)}
          </button>
        ))}
      </div>

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
          <Forte>{listaCategorias(r.categorias, { maiuscula: true })}</Forte>
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
