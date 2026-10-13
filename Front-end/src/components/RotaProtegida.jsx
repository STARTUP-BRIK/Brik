import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore.js'

// Porteiro das rotas do app. Sem sessão, vai para as boas-vindas (de onde a
// pessoa começa o onboarding ou entra; guarda de onde veio, para voltar depois
// de entrar). Com sessão mas sem o onboarding feito (quizRespondido: há linha
// em public.preferencias), vai para o onboarding. Enquanto a sessão ou isso
// ainda estão sendo consultados, não mostra nada: na abertura a splash está
// por cima.

// Desligada durante o desenvolvimento, para navegar pelas telas sem login nem
// quiz. Voltar para true antes de publicar o site.
const PROTECAO_ATIVA = false

function RotaProtegida() {
  const location = useLocation()
  const session = useAuthStore((state) => state.session)
  const carregando = useAuthStore((state) => state.carregando)
  const quizRespondido = useAuthStore((state) => state.quizRespondido)

  if (!PROTECAO_ATIVA) return <Outlet />
  if (carregando) return null
  if (!session) return <Navigate to="/boas-vindas" replace state={{ de: location.pathname }} />
  if (quizRespondido === null) return null
  if (!quizRespondido) return <Navigate to="/onboarding/tema" replace />
  return <Outlet />
}

export default RotaProtegida
