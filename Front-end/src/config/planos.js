// Planos do Brik (página /planos). Preço em reais; null = ainda não definido
// (a tela mostra "A definir"). `periodo`: a cobrança no plano mensal ("mês" ou
// "semana"); o anual é cobrado por ano. Ao definir um valor, é só preencher aqui.
//
// As vantagens são um rascunho a partir do que o app já faz: revisar antes de
// publicar, principalmente as do Intermedium.
//
// A ordem é a da tela: o Pro, mais popular, fica no centro.

export const PLANOS = [
  {
    value: 'gratis',
    nome: 'Free',
    resumo: 'O controle completo do seu brique.',
    preco: { mensal: 0, anual: 0 },
    periodo: 'mês',
    vantagens: [
      { texto: 'Estoque, compras e vendas por aparelho' },
      { texto: 'Dashboard com lucro e meta do mês' },
      { texto: 'Calculadora de brique' },
      { texto: 'Radar demonstrativo com baixas oportunidades' },
      { texto: 'Sem alertas', fora: true },
    ],
  },
  {
    value: 'pro',
    nome: 'Pro',
    resumo: 'Para quem vive de brique.',
    preco: { mensal: 37.9, anual: 439.90 },
    periodo: 'mês',
    popular: true,
    vantagens: [
      { texto: 'Todas as funcionalidades disponíveis' },
      { texto: 'Alertas de produtos que você procura' },
      { texto: 'Negócios extraordinários avisados na hora' },
      { texto: 'Todos os modelos e categorias do radar' },
    ],
  },
  {
    value: 'intermedium',
    nome: 'Intermedium',
    resumo: 'O radar no seu ritmo, pago por semana.',
    preco: { mensal: 23.9, anual: null },
    periodo: 'semana',
    vantagens: [
      { texto: 'Todas as funcionalidades disponíveis' },
      { texto: 'Alertas de produtos que você procura' },
      { texto: 'Negócios extraordinários avisados na hora' },
      { texto: 'Todos os modelos e categorias do radar' },
    ],
  },
]
