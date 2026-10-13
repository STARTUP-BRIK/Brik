import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { mensagemErro } from '../../stores/useAuthStore.js'
import { Botao, SetaVoltar } from './pecas.jsx'

// Espera entre um reenvio e outro: o Supabase recusa pedidos mais próximos.
const ESPERA_REENVIO = 60

// Cores das duas versões: `verde` é a do cadastro (01a, sobre o fundo do login);
// a outra segue o tema da tela (a conta da 19b).
const CORES = {
  verde: {
    voltar: 'text-paper',
    rotulo: 'text-mint',
    titulo: 'text-paper',
    texto: 'text-paper/80',
    forte: 'text-paper',
    campo: 'bg-white text-[#2b2b2b] placeholder:text-[#2b2b2b]/25 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.4)] focus:shadow-[0_0_0_2px_#a8dccf]',
    erro: 'text-loss-soft',
    aviso: 'text-mint',
    link: 'text-mint',
  },
  tema: {
    voltar: 'text-ink',
    rotulo: 'text-ob-destaque',
    titulo: 'text-ob-titulo',
    texto: 'text-mute',
    forte: 'text-ink',
    campo: 'border-[1.5px] border-line bg-surface-card text-ink placeholder:text-ink/25 focus:border-ob-destaque',
    erro: 'text-loss',
    aviso: 'text-gain',
    link: 'text-ob-destaque',
  },
}

// Confirmação do e-mail por código (o e-mail de cadastro traz um código que a
// pessoa digita aqui). Chega com o código acabado de enviar, então o reenvio
// começa bloqueado. Sem `onConfirmado`, quem segue é quem observa a sessão.
export function ConfirmarEmail({ email, onConfirmado, onVoltar, verde = false }) {
  const c = CORES[verde ? 'verde' : 'tema']
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
    onConfirmado?.()
  }

  async function reenviar() {
    setErro('')
    setAviso('')
    setEspera(ESPERA_REENVIO)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) setErro(mensagemErro(error))
    else setAviso('Enviamos um novo código.')
  }

  const desligado = enviando || codigo.length < 6
  const rotuloBotao = enviando ? 'Confirmando…' : 'Confirmar'

  return (
    <form onSubmit={confirmar} className="flex flex-1 flex-col">
      <button type="button" onClick={onVoltar} aria-label="Voltar" className={`-ml-3 flex h-11 w-11 items-center justify-center rounded-xl ${c.voltar}`}>
        <SetaVoltar />
      </button>
      <p className={`mt-4 font-mono text-[11px] uppercase tracking-[0.18em] ${c.rotulo}`}>Falta pouco</p>
      <h1 className={`mt-2.5 text-[28px] font-bold leading-[1.15] tracking-[-0.015em] ${c.titulo}`}>Confirme seu e-mail</h1>
      <p className={`mt-2.5 text-[15px] leading-[1.45] ${c.texto}`}>
        Enviamos um código para <strong className={`break-all font-bold ${c.forte}`}>{email}</strong>. Digite-o abaixo para ativar sua
        conta.
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
        className={`mt-6 h-[60px] rounded-xl text-center text-2xl font-bold tracking-[0.35em] outline-none ob-sem-contorno ${c.campo}`}
      />

      {erro && (
        <p role="alert" className={`mt-3 text-[13px] ${c.erro}`}>
          {erro}
        </p>
      )}
      {aviso && (
        <p role="status" className={`mt-3 text-[13px] ${c.aviso}`}>
          {aviso}
        </p>
      )}

      <p className={`mt-4 text-[13px] ${c.texto}`}>
        Não recebeu?{' '}
        {espera > 0 ? (
          <span>Reenvie em {espera}s</span>
        ) : (
          <button type="button" onClick={reenviar} className={`font-bold underline underline-offset-2 ${c.link}`}>
            Reenviar código
          </button>
        )}
      </p>

      {verde ? (
        <button
          type="submit"
          disabled={desligado}
          className="mt-auto flex h-[52px] items-center justify-center rounded-xl bg-paper text-[15px] font-bold text-brik shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] disabled:opacity-60"
        >
          {rotuloBotao}
        </button>
      ) : (
        <Botao type="submit" disabled={desligado}>
          {rotuloBotao}
        </Botao>
      )}
    </form>
  )
}
