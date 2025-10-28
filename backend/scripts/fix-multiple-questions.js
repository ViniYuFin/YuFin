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

// Correções para simplificar múltiplas perguntas
const corrections = [
  {
    title: "Decisões de Investimento em Negócios",
    grade: "2º Ano EM",
    exampleIndex: 0, // Maria
    newScenario: "Maria analisa investir R$ 80.000 em uma empresa que promete retorno de 15% ao ano. Em 3 anos, quanto terá?",
    newAnswer: 121720,
    newExplanation: "Investimento: R$ 80.000 × (1,15)^3 = R$ 80.000 × 1,521 = R$ 121.720. O retorno composto é muito atrativo!"
  },
  {
    title: "Decisões de Investimento em Negócios", 
    grade: "2º Ano EM",
    exampleIndex: 1, // João
    newScenario: "João investe R$ 50.000 em uma startup por 10% de participação (equity). Se a empresa for vendida por R$ 2 milhões em 5 anos, quanto João receberá?",
    newAnswer: 200000,
    newExplanation: "Participação: 10% de R$ 2.000.000 = R$ 200.000. Investimento inicial: R$ 50.000. Lucro: R$ 150.000 (300% de retorno em 5 anos)!"
  },
  {
    title: "Decisões de Investimento em Negócios",
    grade: "2º Ano EM", 
    exampleIndex: 3, // Carlos
    newScenario: "Carlos investe R$ 100.000 em um negócio que gera R$ 2.000/mês de lucro líquido. Qual o payback em meses?",
    newAnswer: 50,
    newExplanation: "Payback = Investimento ÷ Lucro mensal = R$ 100.000 ÷ R$ 2.000 = 50 meses. Em pouco mais de 4 anos recupera o investimento!"
  },
  {
    title: "Governança Corporativa",
    grade: "2º Ano EM",
    exampleIndex: 0, // Ana
    newScenario: "Ana investe R$ 20.000 em uma empresa com dividend yield de 6% ao ano. Quanto receberá de dividendos por ano?",
    newAnswer: 1200,
    newExplanation: "Dividendos anuais = R$ 20.000 × 6% = R$ 1.200. Uma empresa com boa governança paga dividendos consistentes!"
  },
  {
    title: "Riscos Sistêmicos",
    grade: "3º Ano EM",
    exampleIndex: 5, // Sofia
    newScenario: "Sofia aloca R$ 250.000: 70% em ativos de risco (rendimento esperado 12%), 30% em hedge (custo 2% ao ano). Sem crise, quanto rende?",
    newAnswer: 19500,
    newExplanation: "Risco: R$ 175.000 × 12% = R$ 21.000. Hedge: R$ 75.000 × (-2%) = -R$ 1.500. Total: +R$ 19.500. O hedge protege mas tem custo!"
  },
  {
    title: "Diversificação Inicial",
    grade: "8º Ano",
    exampleIndex: 1, // Sofia
    newScenario: "Sofia investiu todo seu dinheiro (R$ 5.000) em ações de uma única empresa que caiu 40%. Quanto ela perdeu?",
    newAnswer: 2000,
    newExplanation: "Perda = R$ 5.000 × 40% = R$ 2.000. Sem diversificação, o risco é total! Diversificar reduz perdas."
  },
  {
    title: "Decisões Financeiras do Dia a Dia",
    grade: "9º Ano",
    exampleIndex: 4, // Carlos
    newScenario: "Carlos desliga aparelhos da tomada e reduz a conta de luz em 15%. Se a conta era R$ 200/mês, quanto economizará em 1 ano?",
    newAnswer: 360,
    newExplanation: "Economia mensal = R$ 200 × 15% = R$ 30. Economia anual = R$ 30 × 12 = R$ 360. Pequenas ações geram grandes economias!"
  },
  {
    title: "Finanças Sustentáveis",
    grade: "9º Ano",
    exampleIndex: 0, // Ana
    newScenario: "Ana quer instalar energia solar. O sistema custa R$ 18.000 e economizará R$ 250/mês na conta de luz. Em quantos meses o investimento se pagará?",
    newAnswer: 72,
    newExplanation: "Payback = Investimento ÷ Economia mensal = R$ 18.000 ÷ R$ 250 = 72 meses (6 anos). Depois disso, é só lucro!"
  },
  {
    title: "Ética e Responsabilidade Financeira",
    grade: "9º Ano",
    exampleIndex: 0, // Ana
    newScenario: "Ana investe R$ 25.000 em um fundo ESG com retorno esperado de 10% ao ano. Um fundo tradicional oferece 12% ao ano. Em 5 anos, quanto ela 'abre mão' por investir de forma sustentável?",
    newAnswer: 3795,
    newExplanation: "ESG: R$ 25.000 × (1,10)^5 ≈ R$ 40.263. Tradicional: R$ 25.000 × (1,12)^5 ≈ R$ 44.058. Diferença: R$ 3.795. Mas ela investe alinhada com seus valores!"
  },
  {
    title: "Ética e Responsabilidade Financeira",
    grade: "9º Ano",
    exampleIndex: 3, // Sofia
    newScenario: "Sofia faz voluntariado 4 horas/semana. Se ela trabalhasse essas horas ganhando R$ 25/hora, 'perderia' quanto por mês?",
    newAnswer: 400,
    newExplanation: "Horas por mês: 4 × 4 semanas = 16 horas. Valor perdido: 16 × R$ 25 = R$ 400. Mas o impacto social não tem preço!"
  }
];

async function fixMultipleQuestions() {
  try {
    console.log('🔧 CORRIGINDO MÚLTIPLAS PERGUNTAS NAS LIÇÕES');
    console.log('═'.repeat(80));
    
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI não encontrada no arquivo .env');
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    let correctedCount = 0;
    
    for (const correction of corrections) {
      try {
        console.log(`📝 Corrigindo: ${correction.title} (${correction.grade})`);
        console.log(`   Exemplo ${correction.exampleIndex + 1}`);
        
        const result = await Lesson.updateOne(
          { 
            title: correction.title,
            grade: correction.grade
          },
          { 
            $set: { 
              [`content.examples.${correction.exampleIndex}.scenario`]: correction.newScenario,
              [`content.examples.${correction.exampleIndex}.answer`]: correction.newAnswer,
              [`content.examples.${correction.exampleIndex}.explanation`]: correction.newExplanation
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`   ✅ Corrigido com sucesso!`);
          console.log(`   Nova pergunta: ${correction.newScenario.substring(0, 80)}...`);
          console.log(`   Nova resposta: R$ ${correction.newAnswer}`);
          correctedCount++;
        } else {
          console.log(`   ⚠️  Lição não encontrada ou não modificada`);
        }
        
        console.log('');
        
      } catch (error) {
        console.error(`   ❌ Erro:`, error.message);
      }
    }
    
    console.log('═'.repeat(80));
    console.log('📊 RESUMO DAS CORREÇÕES');
    console.log('═'.repeat(80));
    console.log(`✅ Questões corrigidas: ${correctedCount}/${corrections.length}`);
    console.log(`🎯 Todas as lições agora têm apenas uma pergunta por exemplo`);
    console.log(`📝 Respostas focadas e diretas`);
    
    console.log('\n✅ Correções concluídas!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

fixMultipleQuestions();
