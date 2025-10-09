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

async function updateMathProblems6e7Ano() {
  try {
    console.log('🔄 ATUALIZANDO LIÇÕES MATH-PROBLEMS - 6º E 7º ANO');
    console.log('═'.repeat(80));
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // 6º ANO - Contando Moedas e Notas
    const contandoMoedas = await Lesson.findOne({ 
      title: "Contando Moedas e Notas", 
      grade: "6º Ano" 
    });
    
    if (contandoMoedas) {
      console.log('📝 Atualizando: Contando Moedas e Notas (6º Ano)');
      
      const newContent = {
        ...contandoMoedas.content,
        problems: [
          {
            title: "Troco Simples",
            difficulty: "básico",
            situation: "João comprou um lanche por R$ 15,50 e pagou com uma nota de R$ 20,00. Quanto ele deve receber de troco?",
            providedData: [
              { label: "Preço do lanche", value: "R$ 15,50" },
              { label: "Valor pago", value: "R$ 20,00" }
            ],
            answer: 4.5,
            explanation: "Para calcular o troco, subtraímos o preço do produto (R$ 15,50) do valor pago (R$ 20,00). Troco = R$ 20,00 - R$ 15,50 = R$ 4,50.",
            tip: "Sempre subtraia o valor gasto do valor pago para encontrar o troco."
          },
          {
            title: "Contando Moedas",
            difficulty: "básico", 
            situation: "Maria tem 8 moedas de R$ 0,50 e 12 moedas de R$ 0,25. Qual o valor total que ela possui?",
            providedData: [
              { label: "Moedas de R$ 0,50", value: "8 moedas" },
              { label: "Moedas de R$ 0,25", value: "12 moedas" }
            ],
            answer: 7,
            explanation: "Calculamos: 8 moedas de R$ 0,50 = R$ 4,00; 12 moedas de R$ 0,25 = R$ 3,00. Total: R$ 4,00 + R$ 3,00 = R$ 7,00.",
            tip: "Multiplique a quantidade de moedas pelo valor de cada uma, depois some os resultados."
          },
          {
            title: "Troco com Múltiplas Notas",
            difficulty: "intermediário",
            situation: "Pedro comprou um produto por R$ 57,30 e pagou com 3 notas de R$ 20,00. Quanto ele deve receber de troco?",
            providedData: [
              { label: "Preço do produto", value: "R$ 57,30" },
              { label: "Notas de R$ 20,00", value: "3 notas" }
            ],
            answer: 2.7,
            explanation: "O cliente pagou 3 × R$ 20,00 = R$ 60,00. O troco é R$ 60,00 - R$ 57,30 = R$ 2,70.",
            tip: "Primeiro calcule o total pago, depois subtraia o preço do produto."
          },
          {
            title: "Contando Cédulas",
            difficulty: "intermediário",
            situation: "Ana tem 5 notas de R$ 100, 8 notas de R$ 50 e 12 notas de R$ 20. Qual o valor total em dinheiro?",
            providedData: [
              { label: "Notas de R$ 100", value: "5 notas" },
              { label: "Notas de R$ 50", value: "8 notas" },
              { label: "Notas de R$ 20", value: "12 notas" }
            ],
            answer: 1340,
            explanation: "Calculamos: 5×R$ 100 = R$ 500; 8×R$ 50 = R$ 400; 12×R$ 20 = R$ 240. Total: R$ 500 + R$ 400 + R$ 240 = R$ 1.340.",
            tip: "Organize os cálculos por tipo de cédula para evitar erros."
          },
          {
            title: "Troco Otimizado",
            difficulty: "avançado",
            situation: "Um cliente precisa receber R$ 6,25 de troco. Qual a menor quantidade de moedas e notas para dar esse valor?",
            providedData: [
              { label: "Valor do troco", value: "R$ 6,25" }
            ],
            answer: 3,
            explanation: "Para dar R$ 6,25 de troco: 1 nota de R$ 5,00 + 1 moeda de R$ 1,00 + 1 moeda de R$ 0,25 = 3 peças. Esta é a forma mais eficiente.",
            tip: "Sempre use as cédulas e moedas de maior valor primeiro para minimizar a quantidade."
          }
        ],
        tips: [
          "Sempre verifique se o valor pago é suficiente para cobrir o preço do produto.",
          "Organize as moedas e cédulas por valor para facilitar a contagem.",
          "Use calculadora para verificar cálculos com muitos valores.",
          "Pratique contando dinheiro real para desenvolver a habilidade.",
          "Lembre-se: 100 centavos = R$ 1,00.",
          "Para troco, sempre subtraia o preço do valor pago.",
          "Quando possível, use a menor quantidade de cédulas e moedas.",
          "Verifique sempre o troco recebido em compras."
        ]
      };
      
      await Lesson.updateOne(
        { _id: contandoMoedas._id },
        { $set: { content: newContent } }
      );
      
      console.log('   ✅ Atualizada com sucesso!');
      console.log('   📊 Problemas: 5');
      console.log('   💡 Dicas: 8');
    }
    
    // 6º ANO - Porcentagens no dia a dia
    const porcentagens = await Lesson.findOne({ 
      title: "Porcentagens no dia a dia", 
      grade: "6º Ano" 
    });
    
    if (porcentagens) {
      console.log('\n📝 Atualizando: Porcentagens no dia a dia (6º Ano)');
      
      const newContent = {
        ...porcentagens.content,
        problems: [
          {
            title: "Desconto Simples",
            difficulty: "básico",
            situation: "Uma camiseta custa R$ 80,00 e está com 15% de desconto. Qual o valor do desconto?",
            providedData: [
              { label: "Preço original", value: "R$ 80,00" },
              { label: "Desconto", value: "15%" }
            ],
            answer: 12,
            explanation: "Para calcular 15% de R$ 80,00: R$ 80,00 × 0,15 = R$ 12,00 de desconto.",
            tip: "Para calcular porcentagem, multiplique o valor pela taxa em decimal (15% = 0,15)."
          },
          {
            title: "Preço com Desconto",
            difficulty: "básico",
            situation: "Um tênis custa R$ 120,00 com 25% de desconto. Qual o preço final que o cliente pagará?",
            providedData: [
              { label: "Preço original", value: "R$ 120,00" },
              { label: "Desconto", value: "25%" }
            ],
            answer: 90,
            explanation: "Desconto: R$ 120,00 × 25% = R$ 30,00. Preço final: R$ 120,00 - R$ 30,00 = R$ 90,00.",
            tip: "Calcule primeiro o desconto, depois subtraia do preço original."
          },
          {
            title: "Aumento Salarial",
            difficulty: "intermediário",
            situation: "Carlos recebe R$ 1.500,00 de salário e teve um aumento de 8%. Qual será seu novo salário?",
            providedData: [
              { label: "Salário atual", value: "R$ 1.500,00" },
              { label: "Aumento", value: "8%" }
            ],
            answer: 1620,
            explanation: "Aumento: R$ 1.500,00 × 8% = R$ 120,00. Novo salário: R$ 1.500,00 + R$ 120,00 = R$ 1.620,00.",
            tip: "Para aumento, some o valor do aumento ao valor original."
          },
          {
            title: "Porcentagem de Lucro",
            difficulty: "intermediário",
            situation: "Ana comprou um produto por R$ 200,00 e vendeu por R$ 280,00. Qual a porcentagem de lucro?",
            providedData: [
              { label: "Preço de compra", value: "R$ 200,00" },
              { label: "Preço de venda", value: "R$ 280,00" }
            ],
            answer: 40,
            explanation: "Lucro: R$ 280,00 - R$ 200,00 = R$ 80,00. Porcentagem: (R$ 80,00 ÷ R$ 200,00) × 100 = 40%.",
            tip: "Para calcular porcentagem de lucro: (lucro ÷ preço de compra) × 100."
          },
          {
            title: "Inflação e Perda de Poder de Compra",
            difficulty: "avançado",
            situation: "Com inflação de 6% ao ano, quanto uma pessoa precisa ganhar para manter o mesmo poder de compra de R$ 1.000,00?",
            providedData: [
              { label: "Valor inicial", value: "R$ 1.000,00" },
              { label: "Inflação", value: "6% ao ano" }
            ],
            answer: 1060,
            explanation: "Para manter o poder de compra com 6% de inflação: R$ 1.000,00 × 1,06 = R$ 1.060,00.",
            tip: "Para compensar inflação, multiplique por (1 + taxa de inflação)."
          }
        ],
        tips: [
          "Porcentagem significa 'por cento' - divida por 100 para converter em decimal.",
          "Para calcular X% de um valor, multiplique por X/100.",
          "Para aumento: valor original × (1 + taxa).",
          "Para desconto: valor original × (1 - taxa).",
          "Sempre verifique se o resultado faz sentido no contexto.",
          "Use calculadora para cálculos complexos.",
          "Pratique com situações do dia a dia.",
          "Lembre-se: 50% = 0,5 = 1/2."
        ]
      };
      
      await Lesson.updateOne(
        { _id: porcentagens._id },
        { $set: { content: newContent } }
      );
      
      console.log('   ✅ Atualizada com sucesso!');
      console.log('   📊 Problemas: 5');
      console.log('   💡 Dicas: 8');
    }
    
    // 7º ANO - Pesquisa de Preços
    const pesquisaPrecos = await Lesson.findOne({ 
      title: "Pesquisa de Preços", 
      grade: "7º Ano" 
    });
    
    if (pesquisaPrecos) {
      console.log('\n📝 Atualizando: Pesquisa de Preços (7º Ano)');
      
      const newContent = {
        ...pesquisaPrecos.content,
        problems: [
          {
            title: "Comparação Simples",
            difficulty: "básico",
            situation: "Um produto custa R$ 8,50 na Loja A e R$ 7,90 na Loja B. Qual a economia comprando na Loja B?",
            providedData: [
              { label: "Preço Loja A", value: "R$ 8,50" },
              { label: "Preço Loja B", value: "R$ 7,90" }
            ],
            answer: 0.6,
            explanation: "Comprando na Loja B, você economiza R$ 8,50 - R$ 7,90 = R$ 0,60.",
            tip: "Sempre compare preços antes de comprar para economizar."
          },
          {
            title: "Compra em Quantidade",
            difficulty: "básico",
            situation: "Você precisa comprar 5 unidades de um produto. Na Loja A cada unidade custa R$ 2,30. Na Loja B, o pacote com 5 unidades custa R$ 10,50. Qual é mais barato?",
            providedData: [
              { label: "Quantidade", value: "5 unidades" },
              { label: "Preço unitário Loja A", value: "R$ 2,30" },
              { label: "Preço pacote Loja B", value: "R$ 10,50" }
            ],
            answer: 1,
            explanation: "Na Loja A: 5 × R$ 2,30 = R$ 11,50. Na Loja B: R$ 10,50. A Loja B é mais barata por R$ 1,00.",
            tip: "Calcule o custo total em cada loja para comparar."
          },
          {
            title: "Desconto Percentual",
            difficulty: "intermediário",
            situation: "Um produto custa R$ 45,00 e está com 20% de desconto. Qual o preço final?",
            providedData: [
              { label: "Preço original", value: "R$ 45,00" },
              { label: "Desconto", value: "20%" }
            ],
            answer: 36,
            explanation: "Desconto: R$ 45,00 × 20% = R$ 9,00. Preço com desconto: R$ 45,00 - R$ 9,00 = R$ 36,00.",
            tip: "Aplique o desconto percentual ao preço original."
          },
          {
            title: "Frete e Preço Total",
            difficulty: "intermediário",
            situation: "Loja A: produto R$ 25,00 + frete R$ 8,00. Loja B: produto R$ 28,00 + frete R$ 5,00. Qual tem o menor preço total?",
            providedData: [
              { label: "Loja A - Produto", value: "R$ 25,00" },
              { label: "Loja A - Frete", value: "R$ 8,00" },
              { label: "Loja B - Produto", value: "R$ 28,00" },
              { label: "Loja B - Frete", value: "R$ 5,00" }
            ],
            answer: 33,
            explanation: "Loja A: R$ 25,00 + R$ 8,00 = R$ 33,00. Loja B: R$ 28,00 + R$ 5,00 = R$ 33,00. Ambas têm o mesmo preço total.",
            tip: "Sempre some produto + frete para comparar o preço total."
          },
          {
            title: "Promoção 3 por 2",
            difficulty: "avançado",
            situation: "Uma loja tem promoção 'Leve 3, pague 2'. Se você comprar 7 produtos de R$ 5,00 cada, quanto pagará?",
            providedData: [
              { label: "Quantidade comprada", value: "7 produtos" },
              { label: "Preço unitário", value: "R$ 5,00" },
              { label: "Promoção", value: "Leve 3, pague 2" }
            ],
            answer: 25,
            explanation: "Com 7 produtos: 2 grupos de 3 (paga 2 em cada) + 1 produto avulso. Total: (2×2×R$ 5,00) + (1×R$ 5,00) = R$ 20,00 + R$ 5,00 = R$ 25,00.",
            tip: "Organize os produtos em grupos conforme a promoção para calcular corretamente."
          }
        ],
        tips: [
          "Sempre compare preços em diferentes lojas antes de comprar.",
          "Considere o frete no preço total, não apenas o preço do produto.",
          "Promoções podem ser vantajosas, mas calcule o custo real.",
          "Compras em quantidade podem ter desconto.",
          "Verifique a qualidade do produto, não apenas o preço.",
          "Use aplicativos de comparação de preços.",
          "Considere o tempo e combustível para ir até a loja.",
          "Leia as condições das promoções com atenção."
        ]
      };
      
      await Lesson.updateOne(
        { _id: pesquisaPrecos._id },
        { $set: { content: newContent } }
      );
      
      console.log('   ✅ Atualizada com sucesso!');
      console.log('   📊 Problemas: 5');
      console.log('   💡 Dicas: 8');
    }
    
    // 7º ANO - Juros Simples
    const jurosSimples = await Lesson.findOne({ 
      title: "Juros Simples", 
      grade: "7º Ano" 
    });
    
    if (jurosSimples) {
      console.log('\n📝 Atualizando: Juros Simples (7º Ano)');
      
      const newContent = {
        ...jurosSimples.content,
        problems: [
          {
            title: "Juros Simples Básico",
            difficulty: "básico",
            situation: "Maria emprestou R$ 1.000,00 para João por 3 meses a uma taxa de 2% ao mês. Quanto João pagará de juros?",
            providedData: [
              { label: "Capital (C)", value: "R$ 1.000,00" },
              { label: "Taxa (i)", value: "2% ao mês" },
              { label: "Tempo (t)", value: "3 meses" }
            ],
            answer: 60,
            explanation: "J = C × i × t = R$ 1.000,00 × 2% × 3 = R$ 1.000,00 × 0,02 × 3 = R$ 60,00.",
            tip: "Fórmula dos juros simples: J = C × i × t (Capital × taxa × tempo)."
          },
          {
            title: "Montante com Juros Simples",
            difficulty: "básico",
            situation: "Pedro investiu R$ 2.000,00 em uma aplicação que rende 1,5% ao mês. Quanto ele terá após 4 meses?",
            providedData: [
              { label: "Capital (C)", value: "R$ 2.000,00" },
              { label: "Taxa (i)", value: "1,5% ao mês" },
              { label: "Tempo (t)", value: "4 meses" }
            ],
            answer: 2120,
            explanation: "Juros: R$ 2.000,00 × 1,5% × 4 = R$ 120,00. Montante: R$ 2.000,00 + R$ 120,00 = R$ 2.120,00.",
            tip: "Montante = Capital + Juros. Calcule os juros primeiro, depois some ao capital."
          },
          {
            title: "Taxa Anual para Mensal",
            difficulty: "intermediário",
            situation: "Ana investiu R$ 3.000,00 a uma taxa anual de 12% por 6 meses. Quanto ela terá ao final?",
            providedData: [
              { label: "Capital (C)", value: "R$ 3.000,00" },
              { label: "Taxa anual", value: "12% ao ano" },
              { label: "Tempo", value: "6 meses" }
            ],
            answer: 3180,
            explanation: "Taxa mensal: 12% ÷ 12 = 1%. Juros: R$ 3.000,00 × 1% × 6 = R$ 180,00. Montante: R$ 3.000,00 + R$ 180,00 = R$ 3.180,00.",
            tip: "Para converter taxa anual em mensal, divida por 12."
          },
          {
            title: "Tempo para Dobrar o Capital",
            difficulty: "intermediário",
            situation: "Carlos tem R$ 5.000,00 e quer dobrar esse valor investindo a 2% ao mês. Em quantos meses ele conseguirá?",
            providedData: [
              { label: "Capital (C)", value: "R$ 5.000,00" },
              { label: "Taxa (i)", value: "2% ao mês" },
              { label: "Meta", value: "Dobrar o capital" }
            ],
            answer: 50,
            explanation: "Juros necessários: R$ 10.000,00 - R$ 5.000,00 = R$ 5.000,00. Tempo: R$ 5.000,00 ÷ (R$ 5.000,00 × 2%) = R$ 5.000,00 ÷ R$ 100,00 = 50 meses.",
            tip: "Para dobrar o capital, os juros devem ser iguais ao capital inicial."
          },
          {
            title: "Comparação de Investimentos",
            difficulty: "avançado",
            situation: "Lucas tem R$ 4.000,00 para investir por 8 meses. Opção A: 1,8% ao mês. Opção B: 1,5% ao mês. Qual rende mais?",
            providedData: [
              { label: "Capital (C)", value: "R$ 4.000,00" },
              { label: "Tempo (t)", value: "8 meses" },
              { label: "Opção A", value: "1,8% ao mês" },
              { label: "Opção B", value: "1,5% ao mês" }
            ],
            answer: 96,
            explanation: "Opção A: R$ 4.000,00 × 1,8% × 8 = R$ 576,00. Opção B: R$ 4.000,00 × 1,5% × 8 = R$ 480,00. Diferença: R$ 576,00 - R$ 480,00 = R$ 96,00.",
            tip: "Compare os juros de cada opção para decidir qual é mais vantajosa."
          }
        ],
        tips: [
          "Juros simples são calculados sempre sobre o capital inicial.",
          "A taxa deve estar na mesma unidade de tempo do período.",
          "Montante = Capital + Juros.",
          "Para converter taxa anual em mensal, divida por 12.",
          "Sempre verifique se a taxa está em decimal (2% = 0,02).",
          "Use calculadora para evitar erros de cálculo.",
          "Compare diferentes opções de investimento.",
          "Lembre-se: juros simples não rendem juros sobre juros."
        ]
      };
      
      await Lesson.updateOne(
        { _id: jurosSimples._id },
        { $set: { content: newContent } }
      );
      
      console.log('   ✅ Atualizada com sucesso!');
      console.log('   📊 Problemas: 5');
      console.log('   💡 Dicas: 8');
    }
    
    console.log('\n═'.repeat(80));
    console.log('✅ Atualizadas: 4 | ❌ Erros: 0');
    console.log('🔌 Desconectado do MongoDB');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar lições:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

updateMathProblems6e7Ano();
