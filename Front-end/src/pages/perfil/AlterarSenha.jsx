import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '../../components/icons.jsx'
import { Grupo, Linha, Nota, SubPagina } from '../../components/SubPagina.jsx'
import { usePerfil } from '../../lib/conta.js'
import { supabase } from '../../lib/supabase.js'
import { mensagemErro } from '../../stores/useAuthStore.js'

// Alterar senha (Privacidade). Antes de trocar, confere a senha atual entrando de
// novo com ela: assim quem pegar o aparelho logado não troca a senha sozinho.
// Conta de login social não tem senha no Brik: a tela só explica isso.
const MINIMO = 6
const VAZIO = { atual: '', nova: '', confirmar: '' }

function CampoSenha({ id, label, ...props }) {
  const [mostrar, setMostrar] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="px-1 text-sm text-ink">
        {label}
      </label>
      <div className="flex h-12 items-center rounded-xl bg-surface-card pl-4 pr-1.5 ring-1 ring-line focus-within:ring-brik/60">
        <input
          id={id}
          type={mostrar ? 'text' : 'password'}
          required
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none"
          {...props}
        />
        <button
          type="button"
          onClick={() => setMostrar((atual) => !atual)}
          aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={mostrar}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-brik transition-colors hover:bg-brik/10"
        >
          {mostrar ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function AlterarSenha() {
  const { user, social } = usePerfil()
  const [form, setForm] = useState(VAZIO)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [pronto, setPronto] = useState(false)

  const campo = (nome) => ({
    value: form[nome],
    onChange: (e) => {
      setForm((atual) => ({ ...atual, [nome]: e.target.value }))
      setErro('')
      setPronto(false)
    },
  })
  const diferentes = form.confirmar !== '' && form.confirmar !== form.nova

  async function salvar(evento) {
    evento.preventDefault()
    if (enviando || diferentes) return
    if (form.nova.length < MINIMO) return setErro(`A nova senha precisa ter pelo menos ${MINIMO} caracteres.`)
    if (form.nova === form.atual) return setErro('A nova senha precisa ser diferente da atual.')

    setEnviando(true)
    setErro('')
    const { error: erroAtual } = await supabase.auth.signInWithPassword({ email: user.email, password: form.atual })
    if (erroAtual) {
      setEnviando(false)
      return setErro(erroAtual.code === 'invalid_credentials' ? 'Senha atual incorreta.' : mensagemErro(erroAtual))
    }

    const { error } = await supabase.auth.updateUser({ password: form.nova })
    setEnviando(false)
    if (error) {
      return setErro(
        error.code === 'same_password' ? 'A nova senha precisa ser diferente da atual.' : mensagemErro(error),
      )
    }
    setForm(VAZIO)
    setPronto(true)
  }

  if (social) {
    return (
      <SubPagina titulo="Alterar senha" voltarPara="/perfil/privacidade">
        <Grupo>
          <Linha
            titulo={`Você entra com ${social.nome}`}
            detalhe={`Sua conta não tem senha no Brik. Para mudar a senha, altere direto na sua conta ${social.nome}.`}
          />
        </Grupo>
      </SubPagina>
    )
  }

  return (
    <SubPagina titulo="Alterar senha" descricao="Use pelo menos 6 caracteres." voltarPara="/perfil/privacidade">
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <CampoSenha id="senha-atual" label="Senha atual" autoComplete="current-password" {...campo('atual')} />
        <CampoSenha id="senha-nova" label="Nova senha" autoComplete="new-password" minLength={MINIMO} {...campo('nova')} />
        <CampoSenha
          id="senha-confirmar"
          label="Confirme a nova senha"
          autoComplete="new-password"
          aria-invalid={diferentes || undefined}
          {...campo('confirmar')}
        />
        {diferentes && <p className="-mt-2 px-1 text-sm text-loss">As senhas não conferem.</p>}
        {erro && (
          <p role="alert" className="px-1 text-sm text-loss">
            {erro}
          </p>
        )}
        {pronto && (
          <p role="status" className="px-1 text-sm font-medium text-brik">
            Senha alterada.
          </p>
        )}
        <button
          type="submit"
          disabled={enviando || diferentes}
          className="flex h-12 items-center justify-center rounded-xl bg-brik text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enviando ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>

      <Nota>Esqueceu a senha atual? Saia da conta e use “Esqueci minha senha” na tela de login.</Nota>
    </SubPagina>
  )
}

export default AlterarSenha
