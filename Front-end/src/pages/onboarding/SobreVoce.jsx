import { useOnboardingStore } from '../../stores/useOnboardingStore.js'
import {
  EQUIPE,
  PROGRESSO,
  TEMPO_BUSCA,
  TEMPO_RESPOSTA,
  anterior,
  horas,
  horasCurtas,
  numero,
  proximo,
} from './fluxo.js'
import { Botao, Etiqueta, Grupo, Nota, Opcoes, Pessoa, Radar, Resposta, Rotulo, SetaBaixo, Subtitulo, Tela, Titulo, Topo } from './pecas.jsx'
import { SAIDA } from './estilo.js'

// 04 a 09: equipe, tempo procurando, horas por semana, diagnóstico, tempo de
// resposta e a primeira proposta. Do 05 ao 07 há três variantes, pela resposta
// da 04: sozinho (a), equipe de 2 ou mais (b) e 1 pessoa na equipe (c, no
// singular).

const respostas = () => useOnboardingStore.getState()

// Moldura das perguntas: seta de voltar, progresso e o conteúdo.
function Pergunta({ passo, children }) {
  return (
    <Tela className="px-5 pb-7 pt-11">
      <Topo voltar={anterior(passo, respostas())} progresso={PROGRESSO[passo]} />
      {children}
    </Tela>
  )
}

// 04 · Equipe.
export function Equipe() {
  const equipe = useOnboardingStore((state) => state.equipe)
  const responder = useOnboardingStore((state) => state.responder)

  return (
    <Pergunta passo="equipe">
      <Rotulo>Sobre você · 1</Rotulo>
      <Titulo id="pergunta">Quantas pessoas você tem na equipe responsável por encontrar ofertas?</Titulo>
      <Opcoes
        rotulo="pergunta"
        compacta
        className="mt-7"
        opcoes={Object.entries(EQUIPE).map(([valor, { titulo }]) => ({ valor, titulo }))}
        valor={equipe}
        onEscolher={(valor) => responder({ equipe: valor })}
      />
      <Botao to={proximo('equipe', { equipe })}>Continuar</Botao>
    </Pergunta>
  )
}

// 05 · Tempo procurando: de quem faz sozinho, de cada pessoa da equipe, ou da
// pessoa da equipe.
export function Tempo() {
  const r = useOnboardingStore()
  const pergunta = {
    sozinho: 'Quanto tempo por dia você passa procurando anúncio?',
    um: 'Quanto tempo por dia a pessoa da sua equipe passa procurando anúncio?',
  }[r.equipe] ?? 'Quanto tempo por dia cada pessoa da equipe passa procurando anúncio?'
  const subtitulo = r.equipe === 'dois' || r.equipe === 'mais'
    ? 'Em média, somando OLX, Marketplace e grupos de WhatsApp.'
    : 'Somando OLX, Marketplace e grupos de WhatsApp.'

  return (
    <Pergunta passo="tempo">
      <Rotulo>Sobre você · 2</Rotulo>
      <Titulo id="pergunta">{pergunta}</Titulo>
      <Subtitulo>{subtitulo}</Subtitulo>
      <Opcoes
        rotulo="pergunta"
        opcoes={Object.entries(TEMPO_BUSCA).map(([valor, { titulo, detalhe }]) => ({ valor, titulo, detalhe }))}
        valor={r.tempoBusca}
        onEscolher={(valor) => r.responder({ tempoBusca: valor })}
      />
      <Botao to={proximo('tempo', r)}>Continuar</Botao>
    </Pergunta>
  )
}

const DIAS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

// 06 · Horas por semana. Sozinho e 1 pessoa: uma barra por dia da semana.
// Equipe: uma barra por pessoa.
export function Horas() {
  const r = useOnboardingStore()
  const h = horas(r)
  const curto = TEMPO_BUSCA[r.tempoBusca].curto
  const equipe = r.equipe === 'dois' || r.equipe === 'mais'

  return (
    <Pergunta passo="horas">
      {r.equipe === 'sozinho' && <Resposta rotulo="Você">{curto} por dia, sozinho</Resposta>}
      {r.equipe === 'um' && <Resposta rotulo="Equipe">1 pessoa, {curto} por dia</Resposta>}
      {equipe && <Resposta rotulo="Equipe">{EQUIPE[r.equipe].resumo}, {curto} cada</Resposta>}

      <p className="mt-7 flex items-baseline gap-1.5 leading-none text-ob-titulo">
        <span className="text-[44px] font-medium text-mute">≈</span>
        <span className="text-[108px] font-bold tracking-[-0.045em]">{horasCurtas(h.semana)}h</span>
      </p>
      <p className="mt-1.5 text-[22px] font-bold leading-[1.25] text-ob-titulo">
        {equipe
          ? 'por semana da sua equipe procurando anúncio.'
          : r.equipe === 'um'
            ? 'por semana da pessoa da sua equipe procurando anúncio.'
            : 'por semana procurando anúncio.'}
      </p>

      {equipe ? (
        <div className="mt-6">
          <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
            {numero(h.porDia)} h × 7 dias, por pessoa
          </p>
          {Array.from({ length: h.pessoas }, (_, i) => (
            <div key={i} className={`flex items-center gap-2.5 ${i < h.pessoas - 1 ? 'mb-2' : ''}`}>
              <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-raise text-ink">
                <Pessoa width="16" height="16" />
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-raise">
                <div
                  className="ob-anima h-full w-full origin-left rounded-full bg-ob-destaque"
                  style={{ animation: `ob-enche-x .6s ${SAIDA} ${0.05 + i * 0.15}s both` }}
                />
              </div>
              <span className="w-[46px] text-right font-mono text-[11px] text-mute">{numero(h.porPessoa)} h</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mute">{numero(h.porDia)} h × 7 dias</p>
          <div aria-hidden="true" className="grid h-11 grid-cols-7 items-end gap-1.5">
            {DIAS.map((_, i) => (
              <span
                key={i}
                className="ob-anima h-full origin-bottom rounded-lg bg-ob-destaque"
                style={{ animation: `ob-enche-y .5s ${SAIDA} ${(0.05 + i * 0.07).toFixed(2)}s both` }}
              />
            ))}
          </div>
          <div aria-hidden="true" className="mt-1.5 grid grid-cols-7 gap-1.5 text-center font-mono text-[10px] text-mute">
            {DIAS.map((dia, i) => (
              <span key={i}>{dia}</span>
            ))}
          </div>
        </div>
      )}

      {equipe ? (
        <div className="mt-[22px] rounded-2xl border border-line bg-surface-card p-4">
          <p className="text-[15px] leading-[1.45]">
            No mês, são cerca de <strong className="font-bold text-ob-titulo">{h.mes} horas de equipe</strong> rolando anúncio,{' '}
            <strong className="font-bold text-ob-destaque">em vez de negociando.</strong>
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-line bg-surface-card p-4">
          <p className="text-[15px] leading-[1.45]">
            No mês, são cerca de <strong className="font-bold text-ob-titulo">{h.mes} horas</strong>. Mais que uma semana inteira de
            trabalho, só procurando.
          </p>
          <p className="mt-3 border-t border-line pt-3 text-[15px] leading-[1.45]">
            {r.equipe === 'um' ? (
              <>
                Esse tempo poderia ir para negociar. <strong className="font-bold text-ob-destaque">Hoje vai para rolar anúncio.</strong>
              </>
            ) : (
              <>
                Quem tem equipe divide essa busca. <strong className="font-bold text-ob-destaque">Você carrega ela inteira.</strong>
              </>
            )}
          </p>
        </div>
      )}

      <Nota>
        {equipe
          ? `Estimativa: ${h.pessoas} pessoas × ${numero(h.porDia)} h por dia × 7 dias.`
          : 'Estimativa feita a partir das suas respostas.'}
      </Nota>

      <Botao to={proximo('horas', r)}>Continuar</Botao>
    </Pergunta>
  )
}

// Linha de um dos cartões do diagnóstico: círculo com ícone e o texto.
function Linha({ circulo, icone, nome, detalhe, comBorda = false }) {
  return (
    <div className={`mt-3 flex items-center gap-3 ${comBorda ? 'border-t border-ob-destaque/20 pt-3' : ''}`}>
      <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${circulo}`}>
        {icone}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-bold text-ob-titulo">{nome}</span>
        <span className="text-[13px] text-ob-titulo/78">{detalhe}</span>
      </span>
    </div>
  )
}

// 07 · Diagnóstico: devolve 04 e 05. A busca é o que mais consome e o que menos
// dá lucro, e o Brik vira a equipe de busca.
export function Diagnostico() {
  const r = useOnboardingStore()
  const h = horas(r)
  const sozinho = r.equipe === 'sozinho'
  const um = r.equipe === 'um'
  const Icone = sozinho || um ? Pessoa : Grupo
  const quem = sozinho ? 'Você' : um ? 'A pessoa da sua equipe' : 'Sua equipe'
  const semana = `≈ ${horasCurtas(sozinho ? h.porPessoa : h.semana)} h/sem`

  return (
    <Pergunta passo="diagnostico">
      <Rotulo className="mt-6 text-mute">Seu diagnóstico</Rotulo>
      <Titulo>
        {sozinho ? (
          <>
            Você faz o trabalho de uma equipe inteira. <span className="text-ob-destaque">Sozinho.</span>
          </>
        ) : (
          <>
            {um ? 'A pessoa da sua equipe procura.' : 'Sua equipe procura.'}{' '}
            <span className="text-ob-destaque">O Brik multiplica.</span>
          </>
        )}
      </Titulo>

      <div className="mt-[22px] rounded-2xl border border-line bg-surface-card p-4">
        <Etiqueta>Hoje</Etiqueta>
        <div className="mt-3 flex items-center gap-2.5">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raise text-ink">
            <Icone />
          </span>
          <span className="text-[15px] font-bold text-ob-titulo">{quem}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-baseline gap-1.5 rounded-[10px] border border-loss/40 bg-loss/12 px-3 py-2 text-sm font-bold text-loss">
            {sozinho ? 'Procura' : 'Rolando anúncio'} <span className="text-xs font-medium">{semana}</span>
          </span>
          {sozinho ? (
            <>
              <span className="rounded-[10px] bg-surface-raise px-3 py-2 text-sm font-medium">Negocia</span>
              <span className="rounded-[10px] bg-surface-raise px-3 py-2 text-sm font-medium">Vende</span>
            </>
          ) : (
            <span className="rounded-[10px] bg-surface-raise px-3 py-2 text-sm font-medium">Negociando o que sobra</span>
          )}
        </div>
      </div>

      <div aria-hidden="true" className="flex justify-center py-2 text-ob-destaque">
        <SetaBaixo />
      </div>

      <div className="rounded-2xl border border-ob-destaque/30 bg-ob-caixa-brik p-4">
        <Etiqueta className="text-ob-destaque">Com o Brik</Etiqueta>
        <Linha
          circulo="bg-ob-circulo"
          icone={<Radar className="text-[#0f4c5c]" />}
          nome="Radar"
          detalhe={sozinho ? 'procura o dia todo e te avisa' : 'varre tudo e avisa na hora'}
        />
        <Linha
          comBorda
          circulo="bg-ob-titulo/12 text-ob-titulo"
          icone={<Icone />}
          nome={quem}
          detalhe={sozinho ? 'negocia e vende, onde está o lucro' : 'só negocia e fecha'}
        />
      </div>

      <p className="mt-[18px] text-[15px] leading-[1.45] text-mute">
        {sozinho ? (
          <>
            Procurar é o que mais toma tempo e o que menos dá lucro.{' '}
            <strong className="font-bold text-ink">O Brik vira a sua equipe de busca.</strong>
          </>
        ) : um ? (
          <>
            Ninguém precisa mais rolar anúncio.{' '}
            <strong className="font-bold text-ink">O tempo dessa pessoa vai todo para negociar.</strong>
          </>
        ) : (
          <>
            Ninguém da equipe precisa rolar anúncio.{' '}
            <strong className="font-bold text-ink">O tempo de todo mundo vai para negociar.</strong>
          </>
        )}
      </p>

      <Botao to={proximo('diagnostico', r)}>Continuar</Botao>
    </Pergunta>
  )
}

// 08 · Tempo de resposta.
export function Resposta08() {
  const tempoResposta = useOnboardingStore((state) => state.tempoResposta)
  const responder = useOnboardingStore((state) => state.responder)

  return (
    <Pergunta passo="resposta">
      <Rotulo>Sobre você · 3</Rotulo>
      <Titulo id="pergunta">Quando aparece um anúncio bom, em quanto tempo você manda mensagem depois de postado?</Titulo>
      <Opcoes
        rotulo="pergunta"
        opcoes={Object.entries(TEMPO_RESPOSTA).map(([valor, { titulo, detalhe }]) => ({ valor, titulo, detalhe }))}
        valor={tempoResposta}
        onEscolher={(valor) => responder({ tempoResposta: valor })}
      />
      <Botao to={proximo('resposta', {})}>Continuar</Botao>
    </Pergunta>
  )
}

// 09 · Primeira proposta em ~20 min. A pessoa entra na linha do tempo pelo
// tempo de resposta da 08: antes dos 20 min está na frente; depois, já tem fila.
export function PrimeiraProposta() {
  const tempoResposta = useOnboardingStore((state) => state.tempoResposta)
  const resposta = TEMPO_RESPOSTA[tempoResposta]
  const naFrente = resposta.minutos < 20

  const marcos = [
    { minutos: 0, tipo: 'postado' },
    { minutos: 5, tipo: 'brik' },
    { minutos: 20, tipo: 'proposta' },
    { minutos: resposta.minutos + 0.5, tipo: 'voce' },
  ].sort((a, b) => a.minutos - b.minutos)

  const conteudo = {
    postado: (
      <>
        <span aria-hidden="true" className="absolute -left-7 top-[3px] h-3 w-3 rounded-full border-2 border-ink bg-surface" />
        <p className="font-mono text-[11px] tracking-[0.08em] text-mute">0 MIN</p>
        <p className="mt-[3px] text-[15px] text-ink">Anúncio postado</p>
      </>
    ),
    brik: (
      <>
        <span
          aria-hidden="true"
          className="ob-anima absolute -left-[30px] top-[13px] h-3.5 w-3.5 rounded-full bg-ob-destaque"
          style={{ animation: 'ob-brilho 1.6s ease-in-out infinite' }}
        />
        <p className="font-mono text-[11px] tracking-[0.08em] text-ob-destaque">MENOS DE 5 MIN</p>
        <p className="mt-[3px] text-[15px] font-bold text-ob-titulo">Você, com o alerta do Brik</p>
        <p className="mt-0.5 text-[13px] text-ob-destaque">Primeiro da fila</p>
      </>
    ),
    proposta: (
      <>
        <span aria-hidden="true" className="absolute -left-7 top-[3px] h-3 w-3 rounded-full bg-ink" />
        <p className="font-mono text-[11px] tracking-[0.08em] text-mute">≈ 20 MIN</p>
        <p className="mt-[3px] text-[15px] text-ink">Chega a primeira proposta</p>
      </>
    ),
    voce: (
      <>
        <span
          aria-hidden="true"
          className={`absolute -left-7 top-[3px] h-3 w-3 rounded-full border-2 bg-surface ${naFrente ? 'border-gain' : 'border-loss'}`}
        />
        <p className={`font-mono text-[11px] uppercase tracking-[0.08em] ${naFrente ? 'text-gain' : 'text-loss'}`}>{resposta.marco}</p>
        <p className="mt-[3px] flex items-center gap-2 text-[15px] text-ink">
          Você, hoje{' '}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${naFrente ? 'bg-gain/14 text-gain' : 'bg-loss/14 text-loss'}`}
          >
            {naFrente ? 'na frente' : 'já tem fila'}
          </span>
        </p>
      </>
    ),
  }

  return (
    <Pergunta passo="primeira-proposta">
      <Resposta rotulo="Você">{resposta.curto}</Resposta>

      <h1 className="mt-5 text-[27px] font-bold leading-[1.16] tracking-[-0.015em] text-ob-titulo">
        O vendedor recebe a primeira proposta, em média, <span className="text-ob-destaque">20 minutos</span> depois de postar.
      </h1>

      <div className="relative mt-7">
        <span aria-hidden="true" className="absolute bottom-[30px] left-[11px] top-2.5 w-0.5 rounded-sm bg-line" />
        <ol className="pl-[34px]">
          {marcos.map(({ tipo }, i) => {
            const ultimo = i === marcos.length - 1
            return tipo === 'brik' ? (
              <li
                key={tipo}
                className={`relative rounded-xl border border-ob-destaque/45 bg-ob-destaque/8 px-3 py-2.5 ${ultimo ? '' : 'mb-5'}`}
              >
                {conteudo[tipo]}
              </li>
            ) : (
              <li key={tipo} className={`relative ${ultimo ? '' : 'pb-5'}`}>
                {conteudo[tipo]}
              </li>
            )
          })}
        </ol>
      </div>

      <p className="mt-[26px] text-[15px] leading-[1.45] text-mute">
        Quem manda mensagem primeiro negocia sozinho com o vendedor.{' '}
        <strong className="font-bold text-ink">Com o alerta, você chega antes da primeira proposta.</strong>
      </p>

      <Botao to={proximo('primeira-proposta', {})}>Continuar</Botao>
    </Pergunta>
  )
}
