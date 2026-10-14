import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PROTECAO_ATIVA } from '../config/protecao.js'
import { useAuthStore } from '../stores/useAuthStore.js'

// Porteiro das rotas do app. Sem sessão, vai para o login (de onde a
// pessoa começa o onboarding ou entra; guarda de onde veio, para voltar depois
// de entrar). Com sessão mas sem o onboarding feito (quizRespondido: há linha
// em public.preferencias), vai para o onboarding: conta nova, ou que nunca
// respondeu, não chega ao feed antes dele. Enquanto a sessão ou isso ainda
// estão sendo consultados, não mostra nada: na abertura a splash está por cima.
//
// A chave PROTECAO_ATIVA (config/protecao.js, o onboarding também lê) só decide
// se é preciso estar logado: desligada, quem não tem sessão navega livre, mas
// uma conta logada sem o onboarding feito continua indo para ele.

function RotaProtegida() {
  const location = useLocation()
  const session = useAuthStore((state) => state.session)
  const carregando = useAuthStore((state) => state.carregando)
  const quizRespondido = useAuthStore((state) => state.quizRespondido)

  if (carregando) return null
  if (!session) return PROTECAO_ATIVA ? <Navigate to="/login" replace state={{ de: location.pathname }} /> : <Outlet />
  if (quizRespondido === null) return null
  if (!quizRespondido) return <Navigate to="/onboarding/tema" replace />
  return <Outlet />
}

export default RotaProtegida
