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

async function updateMathProblems8e9Ano() {
  try {
    console.log('🔄 ATUALIZANDO LIÇÕES MATH-PROBLEMS - 8º E 9º ANO');
    console.log('═'.repeat(80));
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // 8º ANO - Juros Compostos
    const jurosCompostos = await Lesson.findOne({ 
      title: "Juros Compostos", 
      grade: "8º Ano" 
    });
    
    if (jurosCompostos) {
      console.log('📝 Atualizando: Juros Compostos (8º Ano)');
      
      const newContent = {
        ...jurosCompostos.content,
        problems: [
          {
            title: "Juros Compostos Simples",
            difficulty: "básico",
            situation: "Ana investiu R$ 1.000,00 em uma aplicação que rende 1% ao mês. Quanto ela terá após 3 meses?",
            providedData: [
              { label: "Capital (C)", value: "R$ 1.000,00" },
              { label: "Taxa (i)", value: "1% ao mês" },
              { label: "Tempo (t)", value: "3 meses" }
            ],
            answer: 1030.3,
            explanation: "M = C × (1 + i)^t = R$ 1.000,00 × (1 + 0,01)^3 = R$ 1.000,00 × 1,030301 = R$ 1.030,30.",
            tip: "Fórmula dos juros compostos: M = C × (1 + i)^t. Os juros rendem sobre o montante anterior."
          },
          {
            title: "Comparação com Juros Simples",
            difficulty: "básico",
            situation: "Pedro tem R$ 2.000,00 para investir por 2 anos. Opção A: juros compostos a 2% ao ano. Opção B: juros simples a 2% ao ano. Qual rende mais?",
            providedData: [
              { label: "Capital (C)", value: "R$ 2.000,00" },
              { label: "Taxa (i)", value: "2% ao ano" },
              { label: "Tempo (t)", value: "2 anos" }
            ],
            answer: 80.8,
            explanation: "Juros compostos: M = R$ 2.000,00 × (1,02)^2 = R$ 2.080,80. Juros simples: M = R$ 2.000,00 + (R$ 2.000,00 × 0,02 × 2) = R$ 2.080,00. Diferença: R$ 0,80.",
            tip: "Juros compostos sempre rendem mais que juros simples no longo prazo."
          },
          {
            title: "Investimento de Longo Prazo",
            difficulty: "intermediário",
            situation: "Maria investiu R$ 5.000,00 em um fundo que rende 0,8% ao mês. Quanto ela terá após 1 ano?",
            providedData: [
              { label: "Capital (C)", value: "R$ 5.000,00" },
              { label: "Taxa (i)", value: "0,8% ao mês" },
              { label: "Tempo (t)", value: "12 meses" }
            ],
            answer: 5501.69,
            explanation: "M = R$ 5.000,00 × (1 + 0,008)^12 = R$ 5.000,00 × 1,100338693 = R$ 5.501,69.",
            tip: "Para investimentos de longo prazo, juros compostos fazem grande diferença."
          },
          {
            title: "Taxa Anual para Mensal",
            difficulty: "intermediário",
            situation: "Carlos investiu R$ 3.000,00 a uma taxa anual de 12% por 6 meses. Quanto ele terá ao final?",
            providedData: [
              { label: "Capital (C)", value: "R$ 3.000,00" },
              { label: "Taxa anual", value: "12% ao ano" },
              { label: "Tempo", value: "6 meses" }
            ],
            answer: 3184.56,
            explanation: "Taxa mensal: 12% ÷ 12 = 1%. M = R$ 3.000,00 × (1 + 0,01)^6 = R$ 3.000,00 × 1,06152 = R$ 3.184,56.",
            tip: "Para converter taxa anual em mensal, divida por 12. Para juros compostos, use a fórmula M = C × (1 + i)^t."
          },
          {
            title: "Meta de Investimento",
            difficulty: "avançado",
            situation: "Lucas quer ter R$ 10.000,00 em 2 anos. Se ele investir a 1,5% ao mês, quanto precisa investir hoje?",
            providedData: [
              { label: "Meta (M)", value: "R$ 10.000,00" },
              { label: "Taxa (i)", value: "1,5% ao mês" },
              { label: "Tempo (t)", value: "24 meses" }
            ],
            answer: 6995.43,
            explanation: "C = M ÷ (1 + i)^t = R$ 10.000,00 ÷ (1 + 0,015)^24 = R$ 10.000,00 ÷ 1,4295028 = R$ 6.995,43.",
            tip: "Para descobrir o capital inicial, use a fórmula inversa: C = M ÷ (1 + i)^t."
          }
        ],
        tips: [
          "Juros compostos rendem juros sobre juros, crescendo exponencialmente.",
          "Fórmula: M = C × (1 + i)^t, onde M = montante, C = capital, i = taxa, t = tempo.",
          "A taxa deve estar na mesma unidade de tempo do período.",
          "Juros compostos sempre rendem mais que juros simples no longo prazo.",
          "Para metas futuras, calcule o capital necessário usando a fórmula inversa.",
          "Use calculadora científica para potências.",
          "Compare diferentes opções de investimento considerando o tempo.",
          "Lembre-se: tempo é o maior aliado dos juros compostos."
        ]
      };
      
      await Lesson.updateOne(
        { _id: jurosCompostos._id },
        { $set: { content: newContent } }
      );
      
      console.log('   ✅ Atualizada com sucesso!');
      console.log('   📊 Problemas: 5');
      console.log('   💡 Dicas: 8');
    }
    
    // 9º ANO - Análise de Fluxo de Caixa
    const fluxoCaixa = await Lesson.findOne({ 
      title: "Análise de Fluxo de Caixa", 
      grade: "9º Ano" 
    });
    
    if (fluxoCaixa) {
      console.log('\n📝 Atualizando: Análise de Fluxo de Caixa (9º Ano)');
      
      const newContent = {
        ...fluxoCaixa.content,
        problems: [
          {
            title: "Poupança Simples",
            difficulty: "básico",
            situation: "João quer economizar R$ 1.000,00 em 1 ano. Se ele conseguir uma taxa de 0,5% ao mês, quanto terá ao final?",
            providedData: [
              { label: "Capital (C)", value: "R$ 1.000,00" },
              { label: "Taxa (i)", value: "0,5% ao mês" },
              { label: "Tempo (t)", value: "12 meses" }
            ],
            answer: 1061.68,
            explanation: "M = C × (1 + i)^t = R$ 1.000,00 × (1 + 0,005)^12 = R$ 1.000,00 × 1,06168 = R$ 1.061,68. João ganhou R$ 61,68 de juros.",
            tip: "Poupança é um investimento conservador com baixo risco e baixo retorno."
          },
          {
            title: "Investimento em CDB",
            difficulty: "básico",
            situation: "Maria investiu R$ 5.000,00 em um CDB que rende 1,2% ao mês. Quanto ela terá após 18 meses?",
            providedData: [
              { label: "Capital (C)", value: "R$ 5.000,00" },
              { label: "Taxa (i)", value: "1,2% ao mês" },
              { label: "Tempo (t)", value: "18 meses" }
            ],
            answer: 6197.53,
            explanation: "M = R$ 5.000,00 × (1 + 0,012)^18 = R$ 5.000,00 × 1,239506 = R$ 6.197,53. Maria ganhou R$ 1.197,53 de juros.",
            tip: "CDB (Certificado de Depósito Bancário) é mais rentável que poupança, mas com prazo fixo."
          },
          {
            title: "Financiamento de Carro",
            difficulty: "intermediário",
            situation: "Carlos financiou um carro de R$ 30.000,00 em 24 parcelas a 2% ao mês. Qual o valor total que ele pagará?",
            providedData: [
              { label: "Valor financiado", value: "R$ 30.000,00" },
              { label: "Taxa (i)", value: "2% ao mês" },
              { label: "Parcelas", value: "24 meses" }
            ],
            answer: 24261.75,
            explanation: "Parcela = R$ 30.000,00 × [0,02 × (1,02)^24] ÷ [(1,02)^24 - 1] = R$ 1.594,24. Total: R$ 1.594,24 × 24 = R$ 38.261,75. Juros: R$ 38.261,75 - R$ 30.000,00 = R$ 8.261,75.",
            tip: "Financiamentos têm juros compostos, aumentando significativamente o valor total."
          },
          {
            title: "Aplicação com Taxa Anual",
            difficulty: "intermediário",
            situation: "Ana investiu R$ 2.000,00 em um fundo que rende 8% ao ano. Quanto ela terá após 3 anos?",
            providedData: [
              { label: "Capital (C)", value: "R$ 2.000,00" },
              { label: "Taxa (i)", value: "8% ao ano" },
              { label: "Tempo (t)", value: "3 anos" }
            ],
            answer: 2519.42,
            explanation: "M = R$ 2.000,00 × (1 + 0,08)^3 = R$ 2.000,00 × 1,259712 = R$ 2.519,42. Ana ganhou R$ 519,42 de juros.",
            tip: "Fundos de investimento podem ter diferentes perfis de risco e retorno."
          },
          {
            title: "Comparação de Investimentos",
            difficulty: "avançado",
            situation: "Lucas tem R$ 10.000,00 para investir por 5 anos. Opção A: 1% ao mês. Opção B: 12% ao ano. Qual é mais vantajosa?",
            providedData: [
              { label: "Capital (C)", value: "R$ 10.000,00" },
              { label: "Tempo (t)", value: "5 anos" },
              { label: "Opção A", value: "1% ao mês" },
              { label: "Opção B", value: "12% ao ano" }
            ],
            answer: 3225,
            explanation: "Opção A: M = R$ 10.000,00 × (1,01)^60 = R$ 18.166,97. Opção B: M = R$ 10.000,00 × (1,12)^5 = R$ 17.623,42. Diferença: R$ 18.166,97 - R$ 17.623,42 = R$ 543,55. A Opção A é mais vantajosa.",
            tip: "Sempre compare investimentos no mesmo período e considere a capitalização (mensal vs anual)."
          }
        ],
        tips: [
          "Fluxo de caixa mostra entradas e saídas de dinheiro ao longo do tempo.",
          "Valor presente é o valor atual de um montante futuro.",
          "Valor futuro é quanto um investimento valerá no futuro.",
          "Taxa de juros efetiva considera a capitalização (mensal, anual, etc.).",
          "Compare investimentos convertendo para a mesma unidade de tempo.",
          "Considere o risco além do retorno nos investimentos.",
          "Diversifique seus investimentos para reduzir riscos.",
          "Use calculadora financeira ou planilhas para cálculos complexos."
        ]
      };
      
      await Lesson.updateOne(
        { _id: fluxoCaixa._id },
        { $set: { content: newContent } }
      );
      
      console.log('   ✅ Atualizada com sucesso!');
      console.log('   📊 Problemas: 5');
      console.log('   💡 Dicas: 8');
    }
    
    console.log('\n═'.repeat(80));
    console.log('✅ Atualizadas: 2 | ❌ Erros: 0');
    console.log('🔌 Desconectado do MongoDB');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar lições:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

updateMathProblems8e9Ano();
