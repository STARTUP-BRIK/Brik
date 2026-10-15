import { Link } from 'react-router-dom'
import BrandHeader from './BrandHeader.jsx'
import { LockIcon } from './icons.jsx'
import { planoPago } from '../config/planos.js'
import { usePreferenciasStore } from '../stores/usePreferenciasStore.js'

// Telas só dos planos pagos (Pro e Intermedium, ver config/planos.js). No Free,
// a tela não abre: no lugar dela, o aviso com o caminho para os planos.
// `recurso`: o nome da tela, para o aviso.
//
// O plano vem de preferencias.plano (lib/sincronizarConta.js). Isto só barra a
// tela: o que tiver dado no servidor tem que conferir o plano lá também
// (plano_atual() no banco), como o feed faz.
function SoPlanoPago({ recurso, children }) {
  const plano = usePreferenciasStore((state) => state.planoAtual)
  if (planoPago(plano)) return children

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-surface pb-28 shadow-xl lg:max-w-7xl lg:pb-16 lg:shadow-none">
      <BrandHeader />
      <main className="flex flex-col items-center gap-2 px-8 py-16 text-center">
        <LockIcon aria-hidden="true" className="h-12 w-12 text-line" />
        <h1 className="mt-1 text-xl font-bold text-ink">{recurso}</h1>
        <p className="font-medium text-ink">Disponível nos planos Pro e Intermedium</p>
        <p className="max-w-sm text-sm text-ink/60">Assine um dos planos para usar esta ferramenta e ver todas as ofertas do radar.</p>
        <Link
          to="/planos"
          viewTransition
          className="mt-3 rounded-full bg-brik px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-brik-dark"
        >
          Ver planos
        </Link>
      </main>
    </div>
  )
}

export default SoPlanoPago
