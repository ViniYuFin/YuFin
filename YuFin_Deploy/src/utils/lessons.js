export const lessons = [
  // MÓDULO 1: INTRODUÇÃO AO DINHEIRO (6º Ano)
  {
    id: 1,
    module: "Introdução ao Dinheiro",
    title: "O que é o dinheiro?",
    type: "quiz",
    content: {
      question: "Qual é a função principal do dinheiro?",
      options: [
        { text: "Facilitar trocas e compras", correct: true },
        { text: "Apenas guardar em casa", correct: false },
      ],
      rewards: { xp: 50, yuCoins: 10, savings: 0.5 },
    },
  },
  {
    id: 2,
    module: "Introdução ao Dinheiro",
    title: "História do dinheiro",
    type: "drag-drop",
    content: {
      text: "🐷 Poupí: Arraste na ordem correta da evolução do dinheiro!",
      items: [
        { text: "Escambo (troca de bens)", order: 1 },
        { text: "Moedas de metal", order: 2 },
        { text: "Notas de papel", order: 3 },
        { text: "Dinheiro digital", order: 4 },
      ],
      rewards: { xp: 50, yuCoins: 10, savings: 0.5 },
    },
  },
  {
    id: 3,
    module: "Introdução ao Dinheiro",
    title: "Tipos de dinheiro",
    type: "classify",
    content: {
      text: "🐷 Poupí: Classifique cada tipo de dinheiro!",
      items: [
        { text: "Nota de R$10", category: "Físico", correct: true },
        { text: "Cartão de débito", category: "Digital", correct: true },
        { text: "Pix", category: "Digital", correct: true },
        { text: "Moeda de R$1", category: "Físico", correct: true },
      ],
      rewards: { xp: 50, yuCoins: 10, savings: 0.5 },
    },
  },

  // MÓDULO 2: FAMÍLIA E FINANÇAS (6º Ano)
  {
    id: 4,
    module: "Família e Finanças",
    title: "Receitas da família",
    type: "match",
    content: {
      text: "🐷 Poupí: Associe cada fonte de renda ao membro da família!",
      items: [
        { text: "Pai - Salário do trabalho", correct: true },
        { text: "Mãe - Venda de produtos", correct: true },
        { text: "Filho - Mesada", correct: true },
        { text: "Avó - Aposentadoria", correct: true },
      ],
      rewards: { xp: 60, yuCoins: 12, savings: 0.8 },
    },
  },
  {
    id: 5,
    module: "Família e Finanças",
    title: "Despesas básicas",
    type: "classify",
    content: {
      text: "🐷 Poupí: Classifique como despesa essencial ou não essencial!",
      items: [
        { text: "Aluguel", category: "Essencial", correct: true },
        { text: "Comida", category: "Essencial", correct: true },
        { text: "Videogame", category: "Não Essencial", correct: true },
        { text: "Conta de luz", category: "Essencial", correct: true },
      ],
      rewards: { xp: 60, yuCoins: 12, savings: 0.8 },
    },
  },
  {
    id: 6,
    module: "Família e Finanças",
    title: "Orçamento familiar",
    type: "simulation",
    content: {
      text: "🐷 Poupí: Organize um orçamento familiar de R$2000!",
      options: [
        { text: "R$800 moradia, R$600 alimentação, R$400 transporte, R$200 lazer", correct: true, feedback: "Perfeito! Orçamento equilibrado!" },
        { text: "R$1800 lazer, R$200 outras despesas", correct: false, feedback: "Priorize necessidades básicas primeiro!" },
        { text: "R$1000 moradia, R$500 alimentação, R$300 transporte, R$200 poupança", correct: true, feedback: "Excelente! Incluiu poupança!" },
      ],
      rewards: { xp: 60, yuCoins: 12, savings: 0.8 },
    },
  },

  // MÓDULO 3: NECESSIDADES VS DESEJOS (6º Ano)
  {
    id: 7,
    module: "Necessidades vs Desejos",
    title: "Diferenciando necessidades",
    type: "classify",
    content: {
      text: "🐷 Poupí: Classifique como necessidade ou desejo!",
      items: [
        { text: "Comida", category: "Necessidade", correct: true },
        { text: "Roupa", category: "Necessidade", correct: true },
        { text: "Videogame novo", category: "Desejo", correct: true },
        { text: "Remédio", category: "Necessidade", correct: true },
      ],
      rewards: { xp: 70, yuCoins: 15, savings: 1.0 },
    },
  },
  {
    id: 8,
    module: "Necessidades vs Desejos",
    title: "Priorizando gastos",
    type: "choices",
    content: {
      text: "🐷 Poupí: Você tem R$50. O que deve comprar primeiro?",
      options: [
        { text: "Comida para a semana (R$30)", correct: true, feedback: "Excelente! Priorizou necessidades básicas!" },
        { text: "Um brinquedo (R$50)", correct: false, feedback: "Pense nas necessidades primeiro!" },
        { text: "Comida (R$30) + poupar R$20", correct: true, feedback: "Perfeito! Equilibrou gastos e poupança!" },
      ],
      rewards: { xp: 70, yuCoins: 15, savings: 1.0 },
    },
  },
  {
    id: 9,
    module: "Necessidades vs Desejos",
    title: "Consumo consciente",
    type: "simulation",
    content: {
      text: "🐷 Poupí: Como fazer uma compra consciente?",
      options: [
        { text: "Pesquisar preços, comparar qualidade, pensar se realmente preciso", correct: true, feedback: "Perfeito! Consumo consciente!" },
        { text: "Comprar o primeiro que vejo", correct: false, feedback: "Sempre pesquise antes de comprar!" },
        { text: "Perguntar aos pais antes de comprar", correct: true, feedback: "Boa ideia! Consulte sua família!" },
      ],
      rewards: { xp: 70, yuCoins: 15, savings: 1.0 },
    },
  },

  // MÓDULO 4: POUPANÇA E METAS (6º Ano)
  {
    id: 10,
    module: "Poupança e Metas",
    title: "O que é poupança?",
    type: "quiz",
    content: {
      question: "Para que serve a poupança?",
      options: [
        { text: "Guardar dinheiro para o futuro", correct: true },
        { text: "Gastar tudo rapidamente", correct: false },
      ],
      rewards: { xp: 80, yuCoins: 18, savings: 1.2 },
    },
  },
  {
    id: 11,
    module: "Poupança e Metas",
    title: "Criando metas financeiras",
    type: "input",
    content: {
      text: "🐷 Poupí: Crie uma meta financeira!",
      input: { 
        placeholder: "Ex: Comprar um livro (R$30 em 3 meses)", 
        value: 30, 
        description: "Quanto você quer economizar e em quanto tempo?" 
      },
      rewards: { xp: 80, yuCoins: 18, savings: 1.2 },
    },
  },
  {
    id: 12,
    module: "Poupança e Metas",
    title: "Planejamento de poupança",
    type: "simulation",
    content: {
      text: "🐷 Poupí: Você recebe R$20 de mesada. Como organizar?",
      options: [
        { text: "R$10 gastos, R$7 poupança, R$3 doação", correct: true, feedback: "Excelente! Equilibrou tudo!" },
        { text: "R$20 gastos, R$0 poupança", correct: false, feedback: "Tente poupar um pouco!" },
        { text: "R$15 gastos, R$5 poupança", correct: true, feedback: "Bom! Começou a poupar!" },
      ],
      rewards: { xp: 80, yuCoins: 18, savings: 1.2 },
    },
  },
];