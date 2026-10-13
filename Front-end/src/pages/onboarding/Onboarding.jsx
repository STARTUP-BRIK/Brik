import { useLayoutEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Nome, Tema } from './Abertura.jsx'
import { Alerta, Dashboard, Feed, Permissao } from './Climax.jsx'
import { Conclusao, Conta, Planos } from './Fechamento.jsx'
import { JeitoMelhor, Rolagem, Solucao } from './Introducao.jsx'
import { Categorias, Defeito, Meta, Montagem, Raio } from './SeuRadar.jsx'
import { Diagnostico, Equipe, Horas, PrimeiraProposta, Resposta08, Tempo } from './SobreVoce.jsx'
import { caminho } from './fluxo.js'

// Onboarding (o desenho está no canvas "Onboarding Brik"). Substitui o quiz:
// começa antes de existir conta (a 01 é /boas-vindas), guarda as respostas no
// aparelho e cria a conta no fim (19b). Uma rota por tela, /onboarding/:passo,
// para o voltar do navegador funcionar.
const TELAS = {
  nome: Nome,
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
  defeito: Defeito,
  raio: Raio,
  meta: Meta,
  montagem: Montagem,
  radar: Feed,
  alerta: Alerta,
  alertas: Permissao,
  dashboard: Dashboard,
  plano: Conclusao,
  conta: Conta,
  planos: Planos,
}

function Onboarding() {
  const { passo } = useParams()
  const TelaAtual = TELAS[passo]

  // Cada tela começa do topo.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [passo])

  if (!TelaAtual) return <Navigate to={caminho('nome')} replace />
  // A key remonta a tela a cada passo: as animações de entrada rodam de novo.
  return <TelaAtual key={passo} />
}

export default Onboarding
