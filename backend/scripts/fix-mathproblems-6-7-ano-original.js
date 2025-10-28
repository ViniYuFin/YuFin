const mongoose = require('mongoose');
require('dotenv').config();

// Schema simplificado para Lesson
const lessonSchema = new mongoose.Schema({
  title: String,
  type: String,
  grade: String,
  content: mongoose.Schema.Types.Mixed
}, { strict: false });

const Lesson = mongoose.model('Lesson', lessonSchema);

async function fixMathProblems6e7AnoOriginal() {
  try {
    console.log('🔧 CORRIGINDO LIÇÕES MATH-PROBLEMS - 6º E 7º ANO (ESTRUTURA ORIGINAL)');
    console.log('═'.repeat(80));
    
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI não encontrada no arquivo .env');
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // 6º ANO - Contando Moedas e Notas
    const contandoMoedas = await Lesson.findOne({ 
      title: "Contando Moedas e Notas", 
      grade: "6º Ano" 
    });
    
    if (contandoMoedas) {
      console.log('📝 Corrigindo: Contando Moedas e Notas (6º Ano)');
      
      const newContent = {
        ...contandoMoedas.content,
        problems: [
          {
            id: 1,
            level: "básico",
            title: "Troco Simples",
            context: "João comprou um lanche por R$ 15,50 e pagou com uma nota de R$ 20,00.",
            question: "Quanto ele deve receber de troco?",
            givenData: {
              precoLanche: 15.50,
              valorPago: 20.00
            },
            formula: "Troco = Valor Pago - Preço do Produto",
            steps: [
              "Identificar o preço do lanche: R$ 15,50",
              "Identificar o valor pago: R$ 20,00",
              "Calcular o troco: R$ 20,00 - R$ 15,50 = R$ 4,50"
            ],
            hint: "Subtraia o preço do produto do valor pago para encontrar o troco.",
            answer: 4.5,
            explanation: "Para calcular o troco, subtraímos o preço do produto (R$ 15,50) do valor pago (R$ 20,00). Troco = R$ 20,00 - R$ 15,50 = R$ 4,50.",
            tolerance: 0.01
          },
          {
            id: 2,
            level: "básico",
            title: "Contando Moedas",
            context: "Maria tem 8 moedas de R$ 0,50 e 12 moedas de R$ 0,25.",
            question: "Qual o valor total que ela possui?",
            givenData: {
              moedas50: 8,
              moedas25: 12
            },
            formula: "Total = (Quantidade × Valor da Moeda) + (Quantidade × Valor da Moeda)",
            steps: [
              "Calcular valor das moedas de R$ 0,50: 8 × R$ 0,50 = R$ 4,00",
              "Calcular valor das moedas de R$ 0,25: 12 × R$ 0,25 = R$ 3,00",
              "Somar os valores: R$ 4,00 + R$ 3,00 = R$ 7,00"
            ],
            hint: "Multiplique a quantidade de moedas pelo valor de cada uma, depois some os resultados.",
            answer: 7,
            explanation: "Calculamos: 8 moedas de R$ 0,50 = R$ 4,00; 12 moedas de R$ 0,25 = R$ 3,00. Total: R$ 4,00 + R$ 3,00 = R$ 7,00.",
            tolerance: 0.01
          },
          {
            id: 3,
            level: "intermediário",
            title: "Troco com Múltiplas Notas",
            context: "Pedro comprou um produto por R$ 57,30 e pagou com 3 notas de R$ 20,00.",
            question: "Quanto ele deve receber de troco?",
            givenData: {
              precoProduto: 57.30,
              quantidadeNotas: 3,
              valorNota: 20.00
            },
            formula: "Troco = (Quantidade × Valor da Nota) - Preço do Produto",
            steps: [
              "Calcular o total pago: 3 × R$ 20,00 = R$ 60,00",
              "Identificar o preço do produto: R$ 57,30",
              "Calcular o troco: R$ 60,00 - R$ 57,30 = R$ 2,70"
            ],
            hint: "Primeiro calcule o total pago, depois subtraia o preço do produto.",
            answer: 2.7,
            explanation: "O cliente pagou 3 × R$ 20,00 = R$ 60,00. O troco é R$ 60,00 - R$ 57,30 = R$ 2,70.",
            tolerance: 0.01
          },
          {
            id: 4,
            level: "intermediário",
            title: "Contando Cédulas",
            context: "Ana tem 5 notas de R$ 100, 8 notas de R$ 50 e 12 notas de R$ 20.",
            question: "Qual o valor total em dinheiro?",
            givenData: {
              notas100: 5,
              notas50: 8,
              notas20: 12
            },
            formula: "Total = (Notas100 × 100) + (Notas50 × 50) + (Notas20 × 20)",
            steps: [
              "Calcular valor das notas de R$ 100: 5 × R$ 100 = R$ 500",
              "Calcular valor das notas de R$ 50: 8 × R$ 50 = R$ 400",
              "Calcular valor das notas de R$ 20: 12 × R$ 20 = R$ 240",
              "Somar todos os valores: R$ 500 + R$ 400 + R$ 240 = R$ 1.340"
            ],
            hint: "Organize os cálculos por tipo de cédula para evitar erros.",
            answer: 1340,
            explanation: "Calculamos: 5×R$ 100 = R$ 500; 8×R$ 50 = R$ 400; 12×R$ 20 = R$ 240. Total: R$ 500 + R$ 400 + R$ 240 = R$ 1.340.",
            tolerance: 0.01
          },
          {
            id: 5,
            level: "avançado",
            title: "Troco Otimizado",
            context: "Um cliente precisa receber R$ 6,25 de troco.",
            question: "Qual a menor quantidade de moedas e notas para dar esse valor?",
            givenData: {
              valorTroco: 6.25
            },
            formula: "Use a maior cédula/moeda possível primeiro",
            steps: [
              "Usar 1 nota de R$ 5,00 = R$ 5,00",
              "Restante: R$ 6,25 - R$ 5,00 = R$ 1,25",
              "Usar 1 moeda de R$ 1,00 = R$ 1,00",
              "Restante: R$ 1,25 - R$ 1,00 = R$ 0,25",
              "Usar 1 moeda de R$ 0,25 = R$ 0,25"
            ],
            hint: "Sempre use as cédulas e moedas de maior valor primeiro para minimizar a quantidade.",
            answer: 3,
            explanation: "Para dar R$ 6,25 de troco: 1 nota de R$ 5,00 + 1 moeda de R$ 1,00 + 1 moeda de R$ 0,25 = 3 peças. Esta é a forma mais eficiente.",
            tolerance: 0.01
          }
        ]
      };
      
      await Lesson.updateOne(
        { _id: contandoMoedas._id },
        { $set: { content: newContent } }
      );
      
      console.log('   ✅ Corrigida com sucesso!');
      console.log('   📊 Problemas: 5');
    }
    
    // 6º ANO - Porcentagens no dia a dia
    const porcentagens = await Lesson.findOne({ 
      title: "Porcentagens no dia a dia", 
      grade: "6º Ano" 
    });
    
    if (porcentagens) {
      console.log('\n📝 Corrigindo: Porcentagens no dia a dia (6º Ano)');
      
      const newContent = {
        ...porcentagens.content,
        problems: [
          {
            id: 1,
            level: "básico",
            title: "Desconto Simples",
            context: "Uma camiseta custa R$ 80,00 e está com 15% de desconto.",
            question: "Qual o valor do desconto?",
            givenData: {
              precoOriginal: 80,
              desconto: 15
            },
            formula: "Desconto = Preço Original × (Desconto ÷ 100)",
            steps: [
              "Identificar o preço original: R$ 80,00",
              "Identificar o desconto: 15%",
              "Calcular o desconto: R$ 80,00 × 0,15 = R$ 12,00"
            ],
            hint: "Para calcular porcentagem, multiplique o valor pela taxa em decimal (15% = 0,15).",
            answer: 12,
            explanation: "Para calcular 15% de R$ 80,00: R$ 80,00 × 0,15 = R$ 12,00 de desconto.",
            tolerance: 0.01
          },
          {
            id: 2,
            level: "básico",
            title: "Preço com Desconto",
            context: "Um tênis custa R$ 120,00 com 25% de desconto.",
            question: "Qual o preço final que o cliente pagará?",
            givenData: {
              precoOriginal: 120,
              desconto: 25
            },
            formula: "Preço Final = Preço Original - (Preço Original × Desconto)",
            steps: [
              "Calcular o desconto: R$ 120,00 × 25% = R$ 30,00",
              "Calcular o preço final: R$ 120,00 - R$ 30,00 = R$ 90,00"
            ],
            hint: "Calcule primeiro o desconto, depois subtraia do preço original.",
            answer: 90,
            explanation: "Desconto: R$ 120,00 × 25% = R$ 30,00. Preço final: R$ 120,00 - R$ 30,00 = R$ 90,00.",
            tolerance: 0.01
          },
          {
            id: 3,
            level: "intermediário",
            title: "Aumento Salarial",
            context: "Carlos recebe R$ 1.500,00 de salário e teve um aumento de 8%.",
            question: "Qual será seu novo salário?",
            givenData: {
              salarioAtual: 1500,
              aumento: 8
            },
            formula: "Novo Salário = Salário Atual + (Salário Atual × Aumento)",
            steps: [
              "Calcular o aumento: R$ 1.500,00 × 8% = R$ 120,00",
              "Calcular o novo salário: R$ 1.500,00 + R$ 120,00 = R$ 1.620,00"
            ],
            hint: "Para aumento, some o valor do aumento ao valor original.",
            answer: 1620,
            explanation: "Aumento: R$ 1.500,00 × 8% = R$ 120,00. Novo salário: R$ 1.500,00 + R$ 120,00 = R$ 1.620,00.",
            tolerance: 0.01
          },
          {
            id: 4,
            level: "intermediário",
            title: "Porcentagem de Lucro",
            context: "Ana comprou um produto por R$ 200,00 e vendeu por R$ 280,00.",
            question: "Qual a porcentagem de lucro?",
            givenData: {
              precoCompra: 200,
              precoVenda: 280
            },
            formula: "Porcentagem de Lucro = ((Preço de Venda - Preço de Compra) ÷ Preço de Compra) × 100",
            steps: [
              "Calcular o lucro: R$ 280,00 - R$ 200,00 = R$ 80,00",
              "Calcular a porcentagem: (R$ 80,00 ÷ R$ 200,00) × 100 = 40%"
            ],
            hint: "Para calcular porcentagem de lucro: (lucro ÷ preço de compra) × 100.",
            answer: 40,
            explanation: "Lucro: R$ 280,00 - R$ 200,00 = R$ 80,00. Porcentagem: (R$ 80,00 ÷ R$ 200,00) × 100 = 40%.",
            tolerance: 0.01
          },
          {
            id: 5,
            level: "avançado",
            title: "Inflação e Perda de Poder de Compra",
            context: "Com inflação de 6% ao ano, uma pessoa tem R$ 1.000,00.",
            question: "Quanto ela precisa ganhar para manter o mesmo poder de compra?",
            givenData: {
              valorInicial: 1000,
              inflacao: 6
            },
            formula: "Valor Ajustado = Valor Inicial × (1 + Inflação)",
            steps: [
              "Identificar a inflação: 6% = 0,06",
              "Calcular o valor ajustado: R$ 1.000,00 × (1 + 0,06) = R$ 1.000,00 × 1,06 = R$ 1.060,00"
            ],
            hint: "Para compensar inflação, multiplique por (1 + taxa de inflação).",
            answer: 1060,
            explanation: "Para manter o poder de compra com 6% de inflação: R$ 1.000,00 × 1,06 = R$ 1.060,00.",
            tolerance: 0.01
          }
        ]
      };
      
      await Lesson.updateOne(
        { _id: porcentagens._id },
        { $set: { content: newContent } }
      );
      
      console.log('   ✅ Corrigida com sucesso!');
      console.log('   📊 Problemas: 5');
    }
    
    // 7º ANO - Pesquisa de Preços
    const pesquisaPrecos = await Lesson.findOne({ 
      title: "Pesquisa de Preços", 
      grade: "7º Ano" 
    });
    
    if (pesquisaPrecos) {
      console.log('\n📝 Corrigindo: Pesquisa de Preços (7º Ano)');
      
      const newContent = {
        ...pesquisaPrecos.content,
        problems: [
          {
            id: 1,
            level: "básico",
            title: "Comparação Simples",
            context: "Um produto custa R$ 8,50 na Loja A e R$ 7,90 na Loja B.",
            question: "Qual a economia comprando na Loja B?",
            givenData: {
              precoLojaA: 8.50,
              precoLojaB: 7.90
            },
            formula: "Economia = Preço Loja A - Preço Loja B",
            steps: [
              "Identificar o preço na Loja A: R$ 8,50",
              "Identificar o preço na Loja B: R$ 7,90",
              "Calcular a economia: R$ 8,50 - R$ 7,90 = R$ 0,60"
            ],
            hint: "Sempre compare preços antes de comprar para economizar.",
            answer: 0.6,
            explanation: "Comprando na Loja B, você economiza R$ 8,50 - R$ 7,90 = R$ 0,60.",
            tolerance: 0.01
          },
          {
            id: 2,
            level: "básico",
            title: "Compra em Quantidade",
            context: "Você precisa comprar 5 unidades de um produto. Na Loja A cada unidade custa R$ 2,30. Na Loja B, o pacote com 5 unidades custa R$ 10,50.",
            question: "Qual é mais barato?",
            givenData: {
              quantidade: 5,
              precoUnitarioLojaA: 2.30,
              precoPacoteLojaB: 10.50
            },
            formula: "Custo Total = Quantidade × Preço Unitário",
            steps: [
              "Calcular custo na Loja A: 5 × R$ 2,30 = R$ 11,50",
              "Identificar custo na Loja B: R$ 10,50",
              "Comparar: R$ 11,50 vs R$ 10,50 - Loja B é mais barata por R$ 1,00"
            ],
            hint: "Calcule o custo total em cada loja para comparar.",
            answer: 1,
            explanation: "Na Loja A: 5 × R$ 2,30 = R$ 11,50. Na Loja B: R$ 10,50. A Loja B é mais barata por R$ 1,00.",
            tolerance: 0.01
          },
          {
            id: 3,
            level: "intermediário",
            title: "Desconto Percentual",
            context: "Um produto custa R$ 45,00 e está com 20% de desconto.",
            question: "Qual o preço final?",
            givenData: {
              precoOriginal: 45,
              desconto: 20
            },
            formula: "Preço Final = Preço Original × (1 - Desconto)",
            steps: [
              "Calcular o desconto: R$ 45,00 × 20% = R$ 9,00",
              "Calcular o preço final: R$ 45,00 - R$ 9,00 = R$ 36,00"
            ],
            hint: "Aplique o desconto percentual ao preço original.",
            answer: 36,
            explanation: "Desconto: R$ 45,00 × 20% = R$ 9,00. Preço com desconto: R$ 45,00 - R$ 9,00 = R$ 36,00.",
            tolerance: 0.01
          },
          {
            id: 4,
            level: "intermediário",
            title: "Frete e Preço Total",
            context: "Loja A: produto R$ 25,00 + frete R$ 8,00. Loja B: produto R$ 28,00 + frete R$ 5,00.",
            question: "Qual tem o menor preço total?",
            givenData: {
              produtoLojaA: 25,
              freteLojaA: 8,
              produtoLojaB: 28,
              freteLojaB: 5
            },
            formula: "Preço Total = Preço do Produto + Frete",
            steps: [
              "Calcular preço total Loja A: R$ 25,00 + R$ 8,00 = R$ 33,00",
              "Calcular preço total Loja B: R$ 28,00 + R$ 5,00 = R$ 33,00",
              "Comparar: Ambas têm o mesmo preço total de R$ 33,00"
            ],
            hint: "Sempre some produto + frete para comparar o preço total.",
            answer: 33,
            explanation: "Loja A: R$ 25,00 + R$ 8,00 = R$ 33,00. Loja B: R$ 28,00 + R$ 5,00 = R$ 33,00. Ambas têm o mesmo preço total.",
            tolerance: 0.01
          },
          {
            id: 5,
            level: "avançado",
            title: "Promoção 3 por 2",
            context: "Uma loja tem promoção 'Leve 3, pague 2'. Se você comprar 7 produtos de R$ 5,00 cada.",
            question: "Quanto pagará?",
            givenData: {
              quantidade: 7,
              precoUnitario: 5,
              promocao: "Leve 3, pague 2"
            },
            formula: "Organize os produtos em grupos conforme a promoção",
            steps: [
              "Com 7 produtos: 2 grupos de 3 (paga 2 em cada) + 1 produto avulso",
              "Calcular: (2×2×R$ 5,00) + (1×R$ 5,00) = R$ 20,00 + R$ 5,00 = R$ 25,00"
            ],
            hint: "Organize os produtos em grupos conforme a promoção para calcular corretamente.",
            answer: 25,
            explanation: "Com 7 produtos: 2 grupos de 3 (paga 2 em cada) + 1 produto avulso. Total: (2×2×R$ 5,00) + (1×R$ 5,00) = R$ 20,00 + R$ 5,00 = R$ 25,00.",
            tolerance: 0.01
          }
        ]
      };
      
      await Lesson.updateOne(
        { _id: pesquisaPrecos._id },
        { $set: { content: newContent } }
      );
      
      console.log('   ✅ Corrigida com sucesso!');
      console.log('   📊 Problemas: 5');
    }
    
    // 7º ANO - Juros Simples
    const jurosSimples = await Lesson.findOne({ 
      title: "Juros Simples", 
      grade: "7º Ano" 
    });
    
    if (jurosSimples) {
      console.log('\n📝 Corrigindo: Juros Simples (7º Ano)');
      
      const newContent = {
        ...jurosSimples.content,
        problems: [
          {
            id: 1,
            level: "básico",
            title: "Juros Simples Básico",
            context: "Maria emprestou R$ 1.000,00 para João por 3 meses a uma taxa de 2% ao mês.",
            question: "Quanto João pagará de juros?",
            givenData: {
              capital: 1000,
              taxa: 2,
              tempo: 3
            },
            formula: "J = C × i × t",
            steps: [
              "Identificar os dados: C = R$ 1.000,00, i = 2% = 0,02, t = 3 meses",
              "Aplicar a fórmula: J = 1.000 × 0,02 × 3",
              "Calcular: J = 1.000 × 0,06 = R$ 60,00"
            ],
            hint: "Fórmula dos juros simples: J = C × i × t (Capital × taxa × tempo).",
            answer: 60,
            explanation: "J = C × i × t = R$ 1.000,00 × 2% × 3 = R$ 1.000,00 × 0,02 × 3 = R$ 60,00.",
            tolerance: 0.01
          },
          {
            id: 2,
            level: "básico",
            title: "Montante com Juros Simples",
            context: "Pedro investiu R$ 2.000,00 em uma aplicação que rende 1,5% ao mês.",
            question: "Quanto ele terá após 4 meses?",
            givenData: {
              capital: 2000,
              taxa: 1.5,
              tempo: 4
            },
            formula: "M = C + J = C + (C × i × t)",
            steps: [
              "Calcular os juros: R$ 2.000,00 × 1,5% × 4 = R$ 120,00",
              "Calcular o montante: R$ 2.000,00 + R$ 120,00 = R$ 2.120,00"
            ],
            hint: "Montante = Capital + Juros. Calcule os juros primeiro, depois some ao capital.",
            answer: 2120,
            explanation: "Juros: R$ 2.000,00 × 1,5% × 4 = R$ 120,00. Montante: R$ 2.000,00 + R$ 120,00 = R$ 2.120,00.",
            tolerance: 0.01
          },
          {
            id: 3,
            level: "intermediário",
            title: "Taxa Anual para Mensal",
            context: "Ana investiu R$ 3.000,00 a uma taxa anual de 12% por 6 meses.",
            question: "Quanto ela terá ao final?",
            givenData: {
              capital: 3000,
              taxaAnual: 12,
              tempo: 6
            },
            formula: "Taxa Mensal = Taxa Anual ÷ 12, depois M = C + J",
            steps: [
              "Converter taxa anual para mensal: 12% ÷ 12 = 1%",
              "Calcular os juros: R$ 3.000,00 × 1% × 6 = R$ 180,00",
              "Calcular o montante: R$ 3.000,00 + R$ 180,00 = R$ 3.180,00"
            ],
            hint: "Para converter taxa anual em mensal, divida por 12.",
            answer: 3180,
            explanation: "Taxa mensal: 12% ÷ 12 = 1%. Juros: R$ 3.000,00 × 1% × 6 = R$ 180,00. Montante: R$ 3.000,00 + R$ 180,00 = R$ 3.180,00.",
            tolerance: 0.01
          },
          {
            id: 4,
            level: "intermediário",
            title: "Tempo para Dobrar o Capital",
            context: "Carlos tem R$ 5.000,00 e quer dobrar esse valor investindo a 2% ao mês.",
            question: "Em quantos meses ele conseguirá?",
            givenData: {
              capital: 5000,
              taxa: 2,
              meta: 10000
            },
            formula: "t = J ÷ (C × i)",
            steps: [
              "Calcular juros necessários: R$ 10.000,00 - R$ 5.000,00 = R$ 5.000,00",
              "Aplicar a fórmula: t = R$ 5.000,00 ÷ (R$ 5.000,00 × 2%)",
              "Calcular: t = R$ 5.000,00 ÷ R$ 100,00 = 50 meses"
            ],
            hint: "Para dobrar o capital, os juros devem ser iguais ao capital inicial.",
            answer: 50,
            explanation: "Juros necessários: R$ 10.000,00 - R$ 5.000,00 = R$ 5.000,00. Tempo: R$ 5.000,00 ÷ (R$ 5.000,00 × 2%) = R$ 5.000,00 ÷ R$ 100,00 = 50 meses.",
            tolerance: 0.01
          },
          {
            id: 5,
            level: "avançado",
            title: "Comparação de Investimentos",
            context: "Lucas tem R$ 4.000,00 para investir por 8 meses. Opção A: 1,8% ao mês. Opção B: 1,5% ao mês.",
            question: "Qual rende mais?",
            givenData: {
              capital: 4000,
              tempo: 8,
              taxaA: 1.8,
              taxaB: 1.5
            },
            formula: "J = C × i × t para cada opção",
            steps: [
              "Calcular juros Opção A: R$ 4.000,00 × 1,8% × 8 = R$ 576,00",
              "Calcular juros Opção B: R$ 4.000,00 × 1,5% × 8 = R$ 480,00",
              "Comparar: Opção A rende R$ 96,00 a mais"
            ],
            hint: "Compare os juros de cada opção para decidir qual é mais vantajosa.",
            answer: 96,
            explanation: "Opção A: R$ 4.000,00 × 1,8% × 8 = R$ 576,00. Opção B: R$ 4.000,00 × 1,5% × 8 = R$ 480,00. Diferença: R$ 576,00 - R$ 480,00 = R$ 96,00.",
            tolerance: 0.01
          }
        ]
      };
      
      await Lesson.updateOne(
        { _id: jurosSimples._id },
        { $set: { content: newContent } }
      );
      
      console.log('   ✅ Corrigida com sucesso!');
      console.log('   📊 Problemas: 5');
    }
    
    console.log('\n═'.repeat(80));
    console.log('✅ Corrigidas: 4 | ❌ Erros: 0');
    console.log('🔌 Desconectado do MongoDB');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir lições:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixMathProblems6e7AnoOriginal();
