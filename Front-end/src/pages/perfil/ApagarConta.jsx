import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrashIcon } from '../../components/icons.jsx'
import { Nota, SubPagina } from '../../components/SubPagina.jsx'
import { supabase } from '../../lib/supabase.js'

// Apagar conta. Quem apaga é a Edge Function "apagar-conta" (supabase/functions/
// apagar-conta): fotos no R2, o usuário e, em cascata, tudo dele no banco. Para
// não apagar sem querer, a pessoa digita a palavra antes de liberar o botão.
const PALAVRA = 'APAGAR'

const O_QUE_SOME = [
  'Seu perfil e sua foto',
  'Seu estoque, com as fotos dos produtos',
  'Seus cálculos e ofertas salvas',
  'Suas configurações e alertas',
]

function ApagarConta() {
  const navigate = useNavigate()
  const [texto, setTexto] = useState('')
  const [apagando, setApagando] = useState(false)
  const [erro, setErro] = useState('')
  const pode = texto.trim().toUpperCase() === PALAVRA && !apagando

  async function apagar(evento) {
    evento.preventDefault()
    if (!pode) return
    setApagando(true)
    setErro('')
    const { error } = await supabase.functions.invoke('apagar-conta', { body: { confirmar: true } })
    if (error) {
      const detalhe = await error.context?.json?.().catch(() => null)
      setErro(detalhe?.erro ?? 'Não foi possível apagar a conta agora. Tente de novo em instantes.')
      setApagando(false)
      return
    }
    // A conta já não existe: limpa a sessão e o que ficou guardado neste aparelho.
    await supabase.auth.signOut({ scope: 'local' })
    try {
      Object.keys(localStorage)
        .filter((chave) => chave.startsWith('brik'))
        .forEach((chave) => localStorage.removeItem(chave))
    } catch {
      // Sem localStorage: nada a limpar.
    }
    navigate('/login', { replace: true, viewTransition: true })
  }

  return (
    <SubPagina
      titulo="Apagar conta"
      descricao="Essa ação é permanente e não pode ser desfeita."
      voltarPara="/perfil/privacidade"
    >
      <section className="rounded-2xl bg-surface-card px-4 py-4 ring-1 ring-loss/40">
        <h2 className="text-sm font-bold text-ink">O que será apagado</h2>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm text-ink/70">
          {O_QUE_SOME.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="text-loss">•</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={apagar} className="flex flex-col gap-3">
        <label htmlFor="confirmar-apagar" className="px-1 text-sm text-ink">
          Para confirmar, digite <strong>{PALAVRA}</strong>
        </label>
        <input
          id="confirmar-apagar"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          className="h-12 rounded-xl bg-surface-card px-4 text-sm text-ink ring-1 ring-line outline-none focus:ring-loss/60"
        />
        {erro && (
          <p role="alert" className="px-1 text-sm text-loss">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={!pode}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-loss text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <TrashIcon className="h-5 w-5" />
          {apagando ? 'Apagando…' : 'Apagar minha conta'}
        </button>
      </form>

      <Nota>Mudou de ideia? É só voltar: nada foi apagado ainda.</Nota>
    </SubPagina>
  )
}

export default ApagarConta
