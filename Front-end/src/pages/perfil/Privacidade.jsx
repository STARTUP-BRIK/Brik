import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Grupo, Interruptor, Linha, Nota, SubPagina } from '../../components/SubPagina.jsx'
import { baixarMeusDados } from '../../lib/exportarDados.js'
import { useUsuarioId } from '../../stores/useAuthStore.js'
import { usePreferenciasStore } from '../../stores/usePreferenciasStore.js'

// Privacidade. "Ocultar valores" fica no aparelho (o Dashboard lê a preferência
// ao abrir); "Baixar meus dados" gera a planilha da conta (lib/exportarDados.js).
function Privacidade() {
  const ocultarValores = usePreferenciasStore((state) => state.ocultarValores)
  const setOcultarValores = usePreferenciasStore((state) => state.setOcultarValores)
  const userId = useUsuarioId()
  const logado = Boolean(userId) && userId !== 'carregando'
  const [baixando, setBaixando] = useState(false)
  const [erro, setErro] = useState(null)

  async function baixar() {
    setBaixando(true)
    setErro(null)
    try {
      const { metaMensal, metasMensais } = usePreferenciasStore.getState()
      await baixarMeusDados({ metaMensal, metasMensais })
    } catch (e) {
      console.error('Erro ao baixar os dados:', e)
      setErro('Não deu para baixar agora. Tente de novo.')
    } finally {
      setBaixando(false)
    }
  }

  return (
    <SubPagina titulo="Privacidade" descricao="Controle o que aparece na sua tela e os dados da sua conta.">
      <Grupo titulo="Nesta tela">
        <Linha
          titulo="Ocultar valores ao abrir o Dashboard"
          detalhe="Lucro, capital e preços começam escondidos. Toque no olho do Dashboard para mostrar."
        >
          <Interruptor ligado={ocultarValores} onChange={setOcultarValores} label="Ocultar valores ao abrir o Dashboard" />
        </Linha>
      </Grupo>

      <Grupo titulo="Sua conta">
        <Linha titulo="Alterar senha">
          <Link
            to="/perfil/alterar-senha"
            viewTransition
            className="shrink-0 rounded-full bg-brik px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            Alterar
          </Link>
        </Linha>
        <Linha
          titulo="Baixar meus dados"
          detalhe={
            erro ? (
              <span className="text-loss">{erro}</span>
            ) : (
              'Planilha com seu estoque, vendas, resumo do Dashboard, metas e cálculos.'
            )
          }
        >
          <button
            type="button"
            onClick={baixar}
            disabled={baixando || !logado}
            className="shrink-0 rounded-full bg-brik px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {baixando ? 'Baixando…' : 'Baixar'}
          </button>
        </Linha>
        <Linha titulo="Excluir conta" detalhe="Apaga sua conta e tudo o que você guardou no Brik.">
          <Link
            to="/perfil/apagar-conta"
            viewTransition
            className="shrink-0 rounded-full bg-loss px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            Excluir
          </Link>
        </Linha>
      </Grupo>

      <Nota>A preferência de ocultar valores fica salva neste aparelho.</Nota>
    </SubPagina>
  )
}

export default Privacidade
