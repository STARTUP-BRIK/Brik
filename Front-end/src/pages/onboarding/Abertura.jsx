import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { mascaraTelefone } from '../../lib/format.js'
import { lembrarSessao, provedoresAtivos, supabase } from '../../lib/supabase.js'
import { mensagemErro, useAuthStore } from '../../stores/useAuthStore.js'
import { useOnboardingStore } from '../../stores/useOnboardingStore.js'
import { usePreferenciasStore } from '../../stores/usePreferenciasStore.js'
import { ConfirmarEmail } from './ConfirmarEmail.jsx'
import { BOAS_VINDAS, caminho } from './fluxo.js'
import { Cadeado, Envelope, Fone, Google, Olho, Pessoa, SetaDireita, SetaVoltar, Tela } from './pecas.jsx'
import { SAIDA } from './estilo.js'

// 01, 01a e 01b: a porta de entrada, antes de qualquer pergunta. As duas
// primeiras usam o fundo verde do login (.login-bg), igual nos dois temas; a
// 01b já mostra o tema escolhido. A conta é criada na 01a, logo no começo: o
// onboarding inteiro já acontece com ela.

// Fundo do login com o petróleo fixo (tema-claro devolve --color-brik ao claro).
function FundoVerde({ className, children }) {
  return (
    <Tela classeFundo="tema-claro login-bg text-paper" className={className}>
      {children}
    </Tela>
  )
}

// 01 · Boas-vindas: quem é novo começa o onboarding; quem tem conta entra.
export function BoasVindas() {
  const logado = useAuthStore((state) => Boolean(state.session))
  // De onde a RotaProtegida trouxe a pessoa: o login devolve para lá.
  const { state } = useLocation()
  if (logado) return <Navigate to="/" replace />

  return (
    <FundoVerde className="px-4 pb-7">
      <span aria-hidden="true" className="absolute left-[196px] top-[440px] h-40 w-40 rounded-full bg-mint/60 blur-[40px]" />
      <span aria-hidden="true" className="absolute -left-10 top-[660px] h-44 w-44 rounded-full bg-[#1f7a5c]/70 blur-[40px]" />

      <div className="relative flex flex-1 flex-col items-center justify-center gap-5 pb-6">
        <img src="/logoBrik.png" alt="Brik" className="block h-[84px] w-auto" />
        <p className="text-sm font-medium uppercase tracking-[0.32em] text-paper/80">Garimpe ofertas</p>
      </div>

      <main
        className="ob-anima glass-card rounded-3xl px-5 pb-5 pt-7"
        style={{ animation: `ob-sobe-14 .7s ${SAIDA} both` }}
      >
        <h1 className="text-[27px] font-bold leading-[1.15] tracking-[-0.015em]">
          As melhores oportunidades da região, antes de todo mundo.
        </h1>
        <p className="mt-3 text-sm leading-normal text-paper/82">
          O Brik procura, compara com o preço da região e te avisa quando aparece anúncio abaixo da média.
        </p>

        <Link
          to={caminho('nome')}
          className="mt-6 flex h-[50px] items-center justify-center gap-2 rounded-xl bg-paper text-[15px] font-bold text-brik shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)]"
        >
          Começar
          <SetaDireita />
        </Link>
        <Link
          to="/login"
          state={state}
          className="mt-2.5 flex h-[50px] items-center justify-center rounded-xl bg-white/10 text-[15px] font-medium text-paper shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)]"
        >
          Já tenho conta ·<span className="ml-1 font-bold text-mint">Entrar</span>
        </Link>
      </main>
    </FundoVerde>
  )
}

// Campo sobre o fundo verde: rótulo em cima, caixa branca com o ícone. `ajuda`:
// uma linha pequena embaixo; `children`: o que vai no fim da caixa (o olho da senha).
function CampoVerde({ id, label, Icone, ajuda, children, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-bold">
        {label}
      </label>
      <div className="ob-campo-verde flex h-[50px] items-center gap-2.5 rounded-xl bg-white pl-3.5 pr-1.5 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.4)]">
        <Icone width="18" height="18" className="shrink-0 text-brik" />
        <input
          id={id}
          aria-describedby={ajuda ? `${id}-ajuda` : undefined}
          className="min-w-0 flex-1 border-0 bg-transparent text-base text-[#2b2b2b] outline-none ob-sem-contorno placeholder:text-[#2b2b2b]/45"
          {...props}
        />
        {children}
      </div>
      {ajuda && (
        <p id={`${id}-ajuda`} className="mt-1.5 flex items-center gap-1.5 text-xs text-paper/75">
          <Cadeado width="13" height="13" className="shrink-0 text-mint" />
          {ajuda}
        </p>
      )}
    </div>
  )
}

// 01a · Cadastro, logo no começo: Google em destaque ou nome, WhatsApp, e-mail
// e senha. Com a conta criada (e o e-mail confirmado, quando o projeto pede), o
// onboarding segue para o tema. Quem já tem conta pula direto para lá.
export function Nome() {
  const nome = useOnboardingStore((state) => state.nome)
  const telefone = useOnboardingStore((state) => state.telefone)
  const responder = useOnboardingStore((state) => state.responder)
  const logado = useAuthStore((state) => Boolean(state.session))
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmarEmail, setConfirmarEmail] = useState('')
  const seguinte = caminho('tema')

  // Mesma regra do cadastro do app: e-mail válido e senha com 6 ou mais.
  const pode =
    nome.trim().length > 0 &&
    telefone.replace(/\D/g, '').length >= 10 &&
    /\S+@\S+\.\S+/.test(email) &&
    senha.length >= 6

  // Com a sessão criada (cadastro, código confirmado ou volta do Google), segue.
  if (logado) return <Navigate to={seguinte} replace />

  async function comGoogle() {
    setErro('')
    const ativos = await provedoresAtivos()
    if (ativos && !ativos.google) return setErro('Entrar com Google ainda não está disponível.')
    lembrarSessao(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${seguinte}` },
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
    if (data.user?.identities?.length === 0) return setErro('Já existe uma conta com esse e-mail.')
    // Com sessão, o `logado` acima já leva adiante; sem, falta o código.
    if (!data.session) setConfirmarEmail(email.trim())
  }

  return (
    <FundoVerde className="px-5 pb-6 pt-11">
      {confirmarEmail ? (
        // Confirmado o código, a sessão nova leva adiante (o `logado` acima).
        <ConfirmarEmail verde email={confirmarEmail} onVoltar={() => setConfirmarEmail('')} />
      ) : (
        <form onSubmit={criar} className="flex flex-1 flex-col">
          <Link to={BOAS_VINDAS} aria-label="Voltar" className="-ml-3 flex h-11 w-11 items-center justify-center rounded-xl text-paper">
            <SetaVoltar />
          </Link>

          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-mint">Prazer, eu sou o Brik</p>
          <h1 className="mt-2.5 text-[30px] font-bold leading-[1.12] tracking-[-0.02em]">E você, como se chama?</h1>
          <p className="mt-2 text-[15px] leading-[1.45] text-paper/80">Crie sua conta. O resto a gente monta junto.</p>

          <button
            type="button"
            onClick={comGoogle}
            className="mt-5 flex h-[50px] items-center justify-center gap-2.5 rounded-xl bg-paper text-[15px] font-bold text-brik shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)]"
          >
            <Google />
            Continuar com Google
          </button>

          <div aria-hidden="true" className="mt-4 flex items-center gap-2.5 text-xs text-paper/70">
            <span className="h-px flex-1 bg-paper/35" />
            ou com e-mail
            <span className="h-px flex-1 bg-paper/35" />
          </div>

          <div className="mt-3 flex flex-col gap-3">
            <CampoVerde
              id="nome"
              label="Seu nome"
              Icone={Pessoa}
              autoComplete="given-name"
              placeholder="Como quer ser chamado"
              value={nome}
              onChange={(event) => responder({ nome: event.target.value })}
            />
            <CampoVerde
              id="telefone"
              label="Seu WhatsApp"
              Icone={Fone}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="(81) 99999-9999"
              ajuda="Só para falar sobre a sua conta. Nada de spam."
              value={telefone}
              onChange={(event) => responder({ telefone: mascaraTelefone(event.target.value) })}
            />
            <CampoVerde
              id="email"
              label="E-mail"
              Icone={Envelope}
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <CampoVerde
              id="senha"
              label="Senha"
              Icone={Cadeado}
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-brik"
              >
                <Olho fechado={mostrar} />
              </button>
            </CampoVerde>
          </div>

          {erro && (
            <p role="alert" className="mt-3 text-[13px] text-loss-soft">
              {erro}{' '}
              {erro.startsWith('Já existe') && (
                <Link to="/login" className="font-bold text-mint underline underline-offset-2">
                  Entrar
                </Link>
              )}
            </p>
          )}

          <button
            type="submit"
            disabled={!pode || enviando}
            className={`mt-auto flex h-[52px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold ${
              pode
                ? 'border-[1.5px] border-mint text-mint'
                : 'bg-white/12 text-paper/60 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]'
            } ${enviando ? 'cursor-wait opacity-70' : ''}`}
          >
            {enviando ? 'Criando conta…' : 'Criar conta e continuar'}
            {!enviando && <SetaDireita />}
          </button>
          <p className="mt-2.5 text-center text-xs leading-[1.45] text-paper/70">
            Ao criar a conta, você aceita os Termos de Uso e a{' '}
            <a href="/privacidade.html" target="_blank" rel="noreferrer" className="font-bold text-mint underline underline-offset-2">
              Política de Privacidade
            </a>
            .
          </p>
        </form>
      )}
    </FundoVerde>
  )
}

// Miniatura do app num tema, desenhada só com blocos (cores fixas de cada tema).
function Miniatura({ escuro }) {
  const c = escuro
    ? { fundo: '#0e1618', topo: '#123f4a', busca: '#152124', icone: '#2a8aa0', card: '#152124', foto: '#1e2c30', linha: '#2b3b3f', lucro: '#16302a' }
    : { fundo: '#f8f7f4', topo: '#0f4c5c', busca: '#ffffff', icone: '#0f4c5c', card: '#ffffff', foto: '#e6e3dc', linha: '#d9d9d6', lucro: '#ddefe8' }
  const card = (
    <span
      className="block h-[104px] rounded-lg"
      style={{ background: c.card, boxShadow: escuro ? undefined : '0 2px 6px -3px rgba(43,43,43,0.3)' }}
    >
      <span className="block h-10 rounded-t-lg" style={{ background: c.foto }} />
      <span className="mx-1.5 mt-2 block h-[5px] rounded-[3px]" style={{ background: c.linha }} />
      <span className="mx-1.5 mt-1.5 block h-2.5 rounded-[3px]" style={{ background: c.lucro }} />
    </span>
  )
  return (
    <span
      aria-hidden="true"
      className="relative block h-[200px] w-[120px] overflow-hidden rounded-[18px]"
      style={{
        background: c.fundo,
        boxShadow: escuro
          ? '0 0 0 1px rgba(230,235,234,0.12), 0 10px 24px -12px rgba(0,0,0,0.5)'
          : '0 0 0 1px rgba(43,43,43,0.12), 0 10px 24px -12px rgba(0,0,0,0.4)',
      }}
    >
      <span className="block h-[52px] rounded-b-[14px] p-2.5" style={{ background: c.topo }}>
        <span className="block h-[7px] w-[34px] rounded bg-paper" />
        <span className="mt-[9px] block h-3.5 rounded-full" style={{ background: c.busca }} />
      </span>
      <span className="flex justify-center gap-3.5 py-[9px]">
        <span className="h-[18px] w-[18px] rounded-md" style={{ background: c.icone }} />
        <span className="h-[18px] w-[18px] rounded-md" style={{ background: c.icone }} />
      </span>
      <span className="grid grid-cols-2 gap-1.5 px-2">
        {card}
        {card}
      </span>
    </span>
  )
}

// 01b · Tema. Muda o app inteiro na hora do toque (é o mesmo interruptor das
// Configurações); vem marcado o tema atual, que de partida é o claro.
export function Tema() {
  const modoEscuro = usePreferenciasStore((state) => state.modoEscuro)
  const setModoEscuro = usePreferenciasStore((state) => state.setModoEscuro)

  const opcao = (escuro, rotulo) => {
    const on = modoEscuro === escuro
    return (
      <button
        type="button"
        role="radio"
        aria-checked={on}
        onClick={() => setModoEscuro(escuro)}
        className={`flex flex-col items-center gap-3.5 rounded-[20px] border-2 bg-surface-card px-3 pb-4 pt-3.5 text-ink transition-colors duration-[350ms] ${
          on ? 'border-ob-destaque' : 'border-line'
        }`}
      >
        <Miniatura escuro={escuro} />
        <span className="flex w-full items-center justify-center gap-2 text-[15px] font-bold">
          <span
            className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 ${
              on ? 'border-ob-destaque' : 'border-mute'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${on ? 'bg-ob-destaque' : ''}`} />
          </span>
          {rotulo}
        </span>
      </button>
    )
  }

  return (
    <Tela className="px-5 pb-7 pt-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Antes de começar</p>
      <h1 id="tema" className="mt-3 text-[30px] font-bold leading-[1.12] tracking-[-0.02em] text-ob-titulo">
        Como você prefere ver o Brik?
      </h1>
      <p className="mt-2.5 text-[15px] leading-[1.45] text-mute">Dá para trocar depois em Configurações.</p>

      <div role="radiogroup" aria-labelledby="tema" className="mt-7 grid grid-cols-2 gap-3">
        {opcao(false, 'Claro')}
        {opcao(true, 'Escuro')}
      </div>

      <Link
        to={caminho('rolagem')}
        className="mt-auto flex h-[52px] items-center justify-center gap-2 rounded-xl bg-ob-botao text-[15px] font-bold text-ob-botao-texto"
      >
        Continuar
        <SetaDireita />
      </Link>
    </Tela>
  )
}
