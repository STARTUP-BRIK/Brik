import { useLayoutEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Nome, Tema } from './Abertura.jsx'
import { Alerta, Dashboard, Feed, Permissao } from './Climax.jsx'
import { Conclusao, Planos } from './Fechamento.jsx'
import { JeitoMelhor, Rolagem, Solucao } from './Introducao.jsx'
import { Categorias, Defeito, Meta, Modelos, Montagem, Raio } from './SeuRadar.jsx'
import { Diagnostico, Equipe, Horas, PrimeiraProposta, Resposta08, Tempo } from './SobreVoce.jsx'
import { PROTECAO_ATIVA } from '../../config/protecao.js'
import { useAuthStore } from '../../stores/useAuthStore.js'
import { caminho } from './fluxo.js'

// Onboarding (o desenho está no canvas "Onboarding Brik"). Substitui o quiz:
// começa na criação da conta (01a, /onboarding/cadastro), aberta pelo
// "Cadastre-se" do login. Sem conta, nenhuma outra tela abre:
// todas voltam para a 01a. As respostas ficam no aparelho até os planos (20),
// que as levam para a conta. Uma rota por tela, /onboarding/:passo, para o
// voltar do navegador funcionar.
const TELAS = {
  cadastro: Nome,
  tema: Tema,
  rolagem: Rolagem,
  'jeito-melhor': JeitoMelhor,
  solucao: Solucao,
  equipe: Equipe,
  tempo: Tempo,
  horas: Horas,
  diagnostico: Diagnostico,
  resposta: Resposta08,
  'primeira-proposta': PrimeiraProposta,
  categorias: Categorias,
  modelos: Modelos,
  defeito: Defeito,
  raio: Raio,
  meta: Meta,
  montagem: Montagem,
  radar: Feed,
  alerta: Alerta,
  alertas: Permissao,
  dashboard: Dashboard,
  plano: Conclusao,
  planos: Planos,
}

function Onboarding() {
  const { passo } = useParams()
  const TelaAtual = TELAS[passo]
  const session = useAuthStore((state) => state.session)
  const carregando = useAuthStore((state) => state.carregando)

  // Cada tela começa do topo.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [passo])

  if (!TelaAtual) return <Navigate to={caminho('cadastro')} replace />
  // Só a criação da conta abre sem sessão. Enquanto a sessão guardada é lida
  // (inclusive na volta do login com Google), não mostra nada. Com a proteção
  // desligada (config/protecao.js), tudo abre sem login, para testar o fluxo.
  if (PROTECAO_ATIVA && passo !== 'cadastro') {
    if (carregando) return null
    if (!session) return <Navigate to={caminho('cadastro')} replace />
  }
  // A key remonta a tela a cada passo: as animações de entrada rodam de novo.
  return <TelaAtual key={passo} />
}

export default Onboarding
