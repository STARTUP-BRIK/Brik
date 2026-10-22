import { STATUS } from '../data/produtosData.js'
import { listarCalculos } from './calculos.js'
import { dashboardDoEstoque } from './dashboard.js'
import { linhasDoEstoque } from './estoque.js'

// "Baixar meus dados" (Privacidade): uma planilha CSV com tudo o que a pessoa
// guardou — o estoque inteiro (vendidos inclusos), o resumo do Dashboard, as
// metas e os cálculos salvos. Vai no formato que o Excel em português abre
// direto: separador ";", vírgula decimal e BOM para os acentos.

const SEPARADOR = ';'

const celula = (valor) => {
  if (valor == null) return ''
  const texto = String(valor)
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

// Números sem separador de milhar, para o Excel ler como número.
const numero = (valor) => (valor == null || valor === '' ? null : Number(valor).toFixed(2).replace('.', ','))
const data = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR') : '')
const nomeDoStatus = (chave) => STATUS.find((s) => s.key === chave)?.label ?? chave

function secao(titulo, cabecalho, linhas) {
  return [[titulo], cabecalho, ...linhas, []]
}

function secaoEstoque(linhas) {
  return secao(
    'ESTOQUE',
    ['Produto', 'Categoria', 'Marca', 'Quantidade', 'Custo (un.)', 'Venda (un.)', 'Lucro total', 'Situação', 'Adicionado em', 'Vendido em', 'Descrição', 'Fotos'],
    linhas.map((l) => {
      const lucro = l.custo != null && l.venda != null ? (Number(l.venda) - Number(l.custo)) * l.quantidade : null
      return [
        l.titulo,
        l.categoria,
        l.marca,
        l.quantidade,
        numero(l.custo),
        numero(l.venda),
        numero(lucro),
        nomeDoStatus(l.status),
        data(l.created_at),
        data(l.vendido_em),
        l.descricao,
        l.fotos?.length ?? 0,
      ]
    }),
  )
}

function secaoDashboard(painel) {
  const { lucro, capitalParado, giroMedio, investimentoRetorno, mes } = painel
  return secao(
    `DASHBOARD (gerado em ${new Date().toLocaleDateString('pt-BR')})`,
    ['Indicador', 'Valor'],
    [
      ['Lucro últimos 30 dias', numero(lucro.periodos['30D'].total)],
      ['Lucro últimos 90 dias', numero(lucro.periodos['90D'].total)],
      ['Lucro últimos 12 meses', numero(lucro.periodos['12M'].total)],
      ['Capital parado', numero(capitalParado.valor)],
      ['Capital parado (% do investido)', numero(capitalParado.pct)],
      ['Itens em estoque', capitalParado.itens],
      ['Giro médio (dias até vender)', numero(giroMedio.dias)],
      ['Investido (vendas dos últimos 12 meses)', numero(investimentoRetorno.investido)],
      ['Retornado (vendas dos últimos 12 meses)', numero(investimentoRetorno.retornado)],
      ['ROI (%)', numero(investimentoRetorno.roi)],
      [`Lucro em ${mes.nome}`, numero(mes.lucro)],
      [`Unidades vendidas em ${mes.nome}`, mes.vendidos],
      [`Ticket médio em ${mes.nome}`, numero(mes.ticket)],
      [`Margem em ${mes.nome} (%)`, numero(mes.margem)],
    ],
  )
}

const secaoRois = (rois) =>
  secao('MELHORES ROIs POR MODELO', ['Modelo', 'Unidades', 'Lucro', 'ROI (%)'], rois.map((r) => [r.nome, r.un, numero(r.lucro), numero(r.roi)]))

// O histórico guarda "0000-00" para a meta de antes de o histórico existir.
function secaoMetas(metaAtual, metasMensais) {
  const linhas = Object.entries(metasMensais ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, valor]) => [mes === '0000-00' ? 'Antes do histórico' : mes.split('-').reverse().join('/'), numero(valor)])
  return secao('METAS DE LUCRO MENSAL', ['A partir de', 'Meta'], [...linhas, ['Meta atual', numero(metaAtual)]])
}

const secaoCalculos = (calculos) =>
  secao(
    'CÁLCULOS SALVOS',
    ['Nome', 'Compra', 'Reparos', 'Transporte', 'Outros', 'Venda', 'Lucro', 'Salvo em'],
    calculos.map((c) => {
      const custo = Number(c.compra) + Number(c.reparos) + Number(c.transporte) + Number(c.outros)
      return [c.nome, numero(c.compra), numero(c.reparos), numero(c.transporte), numero(c.outros), numero(c.venda), numero(c.venda - custo), data(c.created_at)]
    }),
  )

// Busca tudo da conta e baixa o arquivo. `metaMensal`/`metasMensais` vêm das
// preferências (as mesmas que o Dashboard usa).
export async function baixarMeusDados({ metaMensal, metasMensais }) {
  const [estoque, calculos] = await Promise.all([linhasDoEstoque(), listarCalculos()])
  const painel = dashboardDoEstoque(estoque)

  const linhas = [
    ['Meus dados no Brik'],
    [`Exportado em ${new Date().toLocaleString('pt-BR')}`],
    [],
    ...secaoDashboard(painel),
    ...secaoRois(painel.roisPorModelo),
    ...secaoMetas(metaMensal, metasMensais),
    ...secaoEstoque(estoque),
    ...secaoCalculos(calculos),
  ]
  const csv = linhas.map((linha) => linha.map(celula).join(SEPARADOR)).join('\r\n')

  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `brik-meus-dados-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
