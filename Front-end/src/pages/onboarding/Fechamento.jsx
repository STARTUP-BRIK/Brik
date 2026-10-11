import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { salvarOnboarding } from '../../lib/salvarOnboarding.js'
import { lembrarSessao, provedoresAtivos, supabase } from '../../lib/supabase.js'
import { mensagemErro, useAuthStore } from '../../stores/useAuthStore.js'
import { useOnboardingStore } from '../../stores/useOnboardingStore.js'
import {
  EQUIPE,
  TEMPO_BUSCA,
  TEMPO_RESPOSTA,
  anterior,
  caminho,
  defeitoResumo,
  listaCategorias,
  proximo,
  reais,
  regiao,
} from './fluxo.js'
import { Botao, Check, Envelope, Etiqueta, Google, Grafico, Olho, Cadeado, Radar, Rotulo, SetaVoltar, Tela, Titulo, Xis } from './pecas.jsx'
import { SAIDA, brilho, destaque } from './estilo.js'

// 19, 19b e 20: o plano de brique com as respostas dele, a conta (no pico do
// valor) e a escolha de plano, que conclui o onboarding.

const Forte = ({ children }) => <strong className="font-bold text-ob-titulo">{children}</strong>

// 19 · Conclusão: onde está (04, 05, 08), para onde quer ir (13) e como chegar
// (10 a 12 + dashboard).
export function Conclusao() {
  const r = useOnboardingStore()
  const logado = useAuthStore((state) => Boolean(state.session))
  const busca = `${TEMPO_BUSCA[r.tempoBusca].curto} por dia`
  const resposta = TEMPO_RESPOSTA[r.tempoResposta].curto
  const defeito = defeitoResumo(r)
  const defeitoFrase = defeito
    ? defeito.so
      ? `com defeito só em ${defeito.texto}`
      : `com defeito em ${defeito.texto}`
    : 'só aparelho funcionando'

  const passos = [
    {
      atraso: '.1s',
      ponto: <span aria-hidden="true" className="absolute -left-[33px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-mute bg-surface" />,
      rotulo: <Etiqueta>Onde você está</Etiqueta>,
      conteudo: (
        <p className="mt-2 text-[15px] leading-normal">
          {r.equipe === 'sozinho' ? (
            <>
              Você faz tudo <Forte>sozinho</Forte>, passa <Forte>{busca}</Forte> procurando e responde <Forte>{resposta}</Forte>.
            </>
          ) : r.equipe === 'um' ? (
            <>
              Você tem <Forte>1 pessoa</Forte> na equipe, que passa <Forte>{busca}</Forte> procurando, e responde{' '}
              <Forte>{resposta}</Forte>.
            </>
          ) : (
            <>
              Sua equipe tem <Forte>{EQUIPE[r.equipe].resumo}</Forte>, cada uma passa <Forte>{busca}</Forte> procurando, e você
              responde <Forte>{resposta}</Forte>.
            </>
          )}
        </p>
      ),
    },
    {
      atraso: '.35s',
      ponto: (
        <span
          aria-hidden="true"
          className="absolute -left-[34px] top-px h-4 w-4 rounded-full bg-ob-destaque"
          style={{ boxShadow: `0 0 0 5px ${destaque(15)}` }}
        />
      ),
      rotulo: <Etiqueta className="text-ob-destaque">Para onde quer ir</Etiqueta>,
      conteudo: (
        <p className="mt-2 flex items-baseline gap-2 leading-[1.1]">
          <span className="text-4xl font-bold tracking-[-0.025em] text-ob-titulo">{reais(r.meta)}</span>
          <span className="text-[15px] text-mute">de lucro por mês</span>
        </p>
      ),
    },
    {
      atraso: '.6s',
      ponto: <span aria-hidden="true" className="absolute -left-[33px] top-0.5 h-3.5 w-3.5 rounded-full bg-ob-circulo" />,
      rotulo: <Etiqueta>Como chegar</Etiqueta>,
      conteudo: (
        <>
          <div className="mt-2.5 flex gap-3 rounded-[14px] border border-line bg-surface-card p-3.5">
            <span aria-hidden="true" className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-ob-circulo">
              <Radar width="18" height="18" className="text-[#0f4c5c]" />
            </span>
            <p className="text-sm leading-[1.45]">
              <Forte>Radar</Forte> de {listaCategorias(r.categorias)} em {regiao(r)}, {defeitoFrase}, avisando em menos de 5 min.
            </p>
          </div>
          <div className="mt-2 flex gap-3 rounded-[14px] border border-line bg-surface-card p-3.5">
            <span aria-hidden="true" className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-ob-circulo">
              <Grafico className="text-[#0f4c5c]" />
            </span>
            <p className="text-sm leading-[1.45]">
              <Forte>Dashboard</Forte> acompanhando cada real até a meta.
            </p>
          </div>
        </>
      ),
    },
  ]

  return (
    <Tela className="px-6 pb-7 pt-14" fundo={`radial-gradient(90% 40% at 50% 0%, ${brilho(22)}, transparent 70%), var(--color-surface)`}>
      <Rotulo className="text-ob-destaque">Seu plano de brique</Rotulo>
      <h1 className="mt-2.5 text-[31px] font-bold leading-[1.12] tracking-[-0.02em] text-ob-titulo">Daqui até a sua meta.</h1>

      <div className="relative mt-7">
        <span aria-hidden="true" className="absolute bottom-10 left-[11px] top-3 w-0.5 rounded-sm bg-line" />
        <ol className="pl-[38px]">
          {passos.map((passo, i) => (
            <li
              key={passo.atraso}
              className={`ob-anima relative ${i < passos.length - 1 ? 'pb-[22px]' : ''}`}
              style={{ animation: `ob-sobe-10 .5s ${SAIDA} ${passo.atraso} both` }}
            >
              {passo.ponto}
              {passo.rotulo}
              {passo.conteudo}
            </li>
          ))}
        </ol>
      </div>

      <Botao to={proximo('plano', r, { logado })} seta>
        Escolher meu plano
      </Botao>
    </Tela>
  )
}

// Campo da 19b, no tema da tela.
function Campo({ id, label, Icone, className = 'mt-4', children, ...props }) {
  return (
    <>
      <label htmlFor={id} className={`text-[13px] font-bold ${className}`}>
        {label}
      </label>
      <div className="mt-2 flex h-[52px] items-center gap-2.5 rounded-xl border-[1.5px] border-line bg-surface-card pl-3.5 pr-1.5 focus-within:border-ob-destaque">
        <Icone className="shrink-0 text-ob-destaque" />
        <input
          id={id}
          className="min-w-0 flex-1 border-0 bg-transparent text-base text-ink outline-none placeholder:text-mute"
          {...props}
        />
        {children}
      </div>
    </>
  )
}

const ESPERA_REENVIO = 60

// Confirmação do e-mail por código (a mesma do cadastro, no visual da tela).
function ConfirmarEmail({ email, onConfirmado, onVoltar }) {
  const [codigo, setCodigo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [espera, setEspera] = useState(ESPERA_REENVIO)

  useEffect(() => {
    if (espera === 0) return
    const timer = setTimeout(() => setEspera(espera - 1), 1000)
    return () => clearTimeout(timer)
  }, [espera])

  async function confirmar(event) {
    event.preventDefault()
    setEnviando(true)
    setErro('')
    const { error } = await supabase.auth.verifyOtp({ email, token: codigo, type: 'email' })
    setEnviando(false)
    if (error) return setErro(mensagemErro(error))
    onConfirmado()
  }

  async function reenviar() {
    setErro('')
    setAviso('')
    setEspera(ESPERA_REENVIO)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) setErro(mensagemErro(error))
    else setAviso('Enviamos um novo código.')
  }

  return (
    <form onSubmit={confirmar} className="flex flex-1 flex-col">
      <button type="button" onClick={onVoltar} aria-label="Voltar" className="-ml-3 flex h-11 w-11 items-center justify-center rounded-xl text-ink">
        <SetaVoltar />
      </button>
      <Rotulo className="mt-4 text-ob-destaque">Falta pouco</Rotulo>
      <Titulo className="mt-2.5">Confirme seu e-mail</Titulo>
      <p className="mt-2.5 text-[15px] leading-[1.45] text-mute">
        Enviamos um código para <strong className="break-all font-bold text-ink">{email}</strong>. Digite-o abaixo para ativar sua conta.
      </p>

      <label htmlFor="codigo" className="sr-only">
        Código
      </label>
      <input
        id="codigo"
        value={codigo}
        onChange={(event) => setCodigo(event.target.value.replace(/\D/g, '').slice(0, 10))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        autoFocus
        className="mt-6 h-[60px] rounded-xl border-[1.5px] border-line bg-surface-card text-center text-2xl font-bold tracking-[0.35em] text-ink outline-none placeholder:text-ink/25 focus:border-ob-destaque"
      />

      {erro && (
        <p role="alert" className="mt-3 text-[13px] text-loss">
          {erro}
        </p>
      )}
      {aviso && (
        <p role="status" className="mt-3 text-[13px] text-gain">
          {aviso}
        </p>
      )}

      <p className="mt-4 text-[13px] text-mute">
        Não recebeu?{' '}
        {espera > 0 ? (
          <span>Reenvie em {espera}s</span>
        ) : (
          <button type="button" onClick={reenviar} className="font-bold text-ob-destaque underline underline-offset-2">
            Reenviar código
          </button>
        )}
      </p>

      <Botao type="submit" disabled={enviando || codigo.length < 6}>
        {enviando ? 'Confirmando…' : 'Confirmar'}
      </Botao>
    </form>
  )
}

// 19b · Criar conta, no pico do valor: ele acabou de ver o radar e a meta, e
// o plano precisa de conta. Google em destaque; nome e WhatsApp já vieram da
// 01a, então só e-mail e senha.
export function Conta() {
  const navigate = useNavigate()
  const meta = useOnboardingStore((state) => state.meta)
  const nome = useOnboardingStore((state) => state.nome)
  const telefone = useOnboardingStore((state) => state.telefone)
  const logado = useAuthStore((state) => Boolean(state.session))
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmarEmail, setConfirmarEmail] = useState('')
  const planos = caminho('planos')

  // Mesma regra do cadastro do app: e-mail válido e senha com 6 ou mais.
  const pode = /\S+@\S+\.\S+/.test(email) && senha.length >= 6

  if (logado) return <Navigate to={planos} replace />

  async function comGoogle() {
    setErro('')
    const ativos = await provedoresAtivos()
    if (ativos && !ativos.google) return setErro('Entrar com Google ainda não está disponível.')
    lembrarSessao(true)
    // Volta direto para os planos; as respostas continuam no aparelho.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${planos}` },
    })
    if (error) setErro(mensagemErro(error))
  }

  async function criar(event) {
    event.preventDefault()
    if (!pode) return
    setEnviando(true)
    setErro('')
    lembrarSessao(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { data: { nome: nome.trim(), telefone: telefone.replace(/\D/g, '') } },
    })
    setEnviando(false)
    if (error) return setErro(mensagemErro(error))
    // Com confirmação de e-mail ligada, um e-mail já cadastrado não dá erro:
    // volta um usuário sem identidades.
    if (data.user?.identities?.length === 0) return setErro('Já existe uma conta com esse e-mail. Entre pela tela de login.')
    if (data.session) navigate(planos)
    else setConfirmarEmail(email.trim())
  }

  return (
    <Tela className="px-5 pb-6 pt-11">
      {confirmarEmail ? (
        <ConfirmarEmail email={confirmarEmail} onConfirmado={() => navigate(planos)} onVoltar={() => setConfirmarEmail('')} />
      ) : (
        <form onSubmit={criar} className="flex flex-1 flex-col">
          <Link
            to={anterior('conta', {})}
            aria-label="Voltar"
            className="-ml-3 flex h-11 w-11 items-center justify-center rounded-xl text-ink"
          >
            <SetaVoltar />
          </Link>

          <Rotulo className="mt-4 text-ob-destaque">Seu radar está pronto</Rotulo>
          <Titulo className="mt-2.5">Crie sua conta para salvar tudo isso.</Titulo>

          <ul className="mt-4 flex flex-wrap gap-2">
            {['Seu radar', `Meta de ${reais(meta)}`, 'Suas respostas'].map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-card px-2.5 py-1.5 text-[12.5px]"
              >
                <Check width="14" height="14" className="text-ob-destaque" />
                {item}
              </li>
            ))}
          </ul>

          <Botao onClick={comGoogle} className="mt-6 gap-2.5">
            <Google />
            Continuar com Google
          </Botao>

          <div aria-hidden="true" className="mt-[18px] flex items-center gap-2.5 text-xs text-mute">
            <span className="h-px flex-1 bg-line" />
            ou com e-mail
            <span className="h-px flex-1 bg-line" />
          </div>

          <Campo
            id="email"
            label="E-mail"
            Icone={Envelope}
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Campo
            id="senha"
            label="Senha"
            Icone={Cadeado}
            className="mt-3.5"
            type={mostrar ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Mínimo de 6 caracteres"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
          >
            <button
              type="button"
              aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={mostrar}
              onClick={() => setMostrar(!mostrar)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-ob-destaque"
            >
              <Olho fechado={mostrar} />
            </button>
          </Campo>

          {erro && (
            <p role="alert" className="mt-3 text-[13px] text-loss">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={!pode || enviando}
            className={`mt-auto flex h-[52px] items-center justify-center rounded-xl border-[1.5px] text-[15px] font-bold ${
              pode ? 'border-ob-destaque text-ob-destaque' : 'border-line text-mute'
            } disabled:cursor-not-allowed ${enviando ? 'cursor-wait opacity-70' : ''}`}
          >
            {enviando ? 'Criando conta…' : 'Criar conta e continuar'}
          </button>
          <p className="mt-3 text-center text-xs leading-[1.45] text-mute">
            Ao criar a conta, você aceita os Termos de Uso e a{' '}
            <a href="/privacidade.html" target="_blank" rel="noreferrer" className="font-bold text-ob-destaque underline underline-offset-2">
              Política de Privacidade
            </a>
            .
          </p>
        </form>
      )}
    </Tela>
  )
}

// Cartão de plano, com o rádio no canto.
function Plano({ on, onClick, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`relative block w-full rounded-[18px] border-[1.5px] p-[18px] text-left text-ink ${
        on ? 'border-ob-destaque bg-ob-destaque/6' : 'border-line bg-surface-card'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute right-[18px] top-[18px] flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${
          on ? 'border-ob-destaque' : 'border-ink/40'
        }`}
      >
        <span className={`h-[11px] w-[11px] rounded-full ${on ? 'bg-ob-destaque' : ''}`} />
      </span>
      {children}
    </button>
  )
}

function Vantagem({ icone, className = '', children }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      {icone}
      {children}
    </span>
  )
}

// 20 · Escolha de plano. Sem teste grátis: o radar montado fica salvo e o
// gratuito aparece como ferramenta completa de controle. É aqui que as
// respostas vão para a conta e o onboarding termina.
export function Planos() {
  const navigate = useNavigate()
  const r = useOnboardingStore()
  const session = useAuthStore((state) => state.session)
  const carregando = useAuthStore((state) => state.carregando)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const pro = r.plano === 'pro'

  // Sem conta (aberto direto pelo endereço): a conta vem antes.
  if (!carregando && !session) return <Navigate to={caminho('conta')} replace />

  async function comecar() {
    setSalvando(true)
    setErro('')
    try {
      await salvarOnboarding(session.user)
      useOnboardingStore.getState().limpar()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Erro ao concluir o onboarding:', error.message)
      setErro('Não foi possível salvar suas respostas. Tente de novo.')
      setSalvando(false)
    }
  }

  return (
    <Tela className="px-5 pb-7 pt-14">
      <Rotulo className="text-mute">Último passo</Rotulo>
      <h1 id="planos" className="mt-2.5 text-[30px] font-bold leading-[1.12] tracking-[-0.02em] text-ob-titulo">
        Como você quer começar?
      </h1>

      <div role="radiogroup" aria-labelledby="planos" className="mt-[22px] flex flex-col gap-3">
        <Plano on={pro} onClick={() => r.responder({ plano: 'pro' })}>
          <span className="flex items-center gap-2">
            <span className="text-xl font-bold text-ob-titulo">Pro</span>
            <span className="rounded-full bg-ob-destaque/14 px-2 py-[3px] text-xs font-medium text-ob-destaque">Radar + Dashboard</span>
          </span>
          <span className="mt-2.5 flex items-baseline gap-1">
            <span className="text-[28px] font-bold tracking-[-0.02em] text-ob-titulo">[PREÇO]</span>
            <span className="text-sm text-mute">/mês</span>
          </span>
          <span className="mt-3.5 flex flex-col gap-2 text-sm leading-[1.35]">
            {['O radar que você acabou de montar', 'Alertas em menos de 5 minutos', `Dashboard com a meta de ${reais(r.meta)}`].map((v) => (
              <Vantagem key={v} icone={<Check width="16" height="16" className="shrink-0 text-ob-destaque" />}>
                {v}
              </Vantagem>
            ))}
          </span>
        </Plano>

        <Plano on={!pro} onClick={() => r.responder({ plano: 'gratis' })}>
          <span className="flex items-center gap-2">
            <span className="text-xl font-bold text-ob-titulo">Gratuito</span>
            <span className="rounded-full bg-surface-raise px-2 py-[3px] text-xs font-medium text-mute">R$ 0</span>
          </span>
          <span className="mt-2 block text-sm text-mute">O controle completo do seu brique.</span>
          <span className="mt-3.5 flex flex-col gap-2 text-sm leading-[1.35]">
            <Vantagem icone={<Check width="16" height="16" className="shrink-0 text-gain" />}>Compras, vendas e lucro por aparelho</Vantagem>
            <Vantagem icone={<Check width="16" height="16" className="shrink-0 text-gain" />}>Meta mensal de {reais(r.meta)}</Vantagem>
            <Vantagem icone={<Xis className="shrink-0 text-mute" />} className="text-mute">
              Sem radar e sem alertas
            </Vantagem>
          </span>
        </Plano>
      </div>

      <p className="mt-3.5 flex items-start gap-2 text-[13px] leading-[1.45] text-mute">
        <Radar width="16" height="16" className="mt-px shrink-0 text-ob-destaque" />
        Seu radar fica salvo. Dá para assinar o Pro quando quiser.
      </p>

      {erro && (
        <p role="alert" className="mt-3 text-[13px] text-loss">
          {erro}
        </p>
      )}

      <Botao onClick={comecar} disabled={salvando || !session}>
        {salvando ? 'Salvando…' : pro ? 'Assinar o Pro' : 'Começar no gratuito'}
      </Botao>
    </Tela>
  )
}
