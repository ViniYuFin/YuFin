const mongoose = require('mongoose');
require('dotenv').config();

// Schema simplificado para Lesson
const lessonSchema = new mongoose.Schema({
  title: String,
  type: String,
  content: mongoose.Schema.Types.Mixed
}, { strict: false });

const Lesson = mongoose.model('Lesson', lessonSchema);

async function updatePrevidenciaScenarios() {
  try {
    console.log('🔍 ATUALIZANDO CENÁRIOS DA LIÇÃO "PREVIDÊNCIA E APOSENTADORIA"');
    console.log('===============================================');
    
    // Conectar ao MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    // Buscar a lição "Previdência e Aposentadoria"
    const lesson = await Lesson.findOne({ title: "Previdência e Aposentadoria" });
    
    if (!lesson) {
      console.log('❌ Lição "Previdência e Aposentadoria" não encontrada!');
      return;
    }
    
    console.log(`📖 Título: ${lesson.title}`);
    console.log(`🆔 ID: ${lesson._id}`);
    
    // Cenários específicos para Previdência e Aposentadoria
    const newScenarios = [
      {
        id: 'scenario-1',
        title: 'Início da Carreira',
        description: 'Jovem profissional - Comece a planejar desde cedo - Contribuições iniciais, tempo a favor',
        classLevel: 'iniciante',
        totalBudget: 3000,
        adjustments: {
          'Necessidades': { maxPercentage: 100, multiplier: 1.0 }
        },
        opportunities: [
          'Tempo a favor para juros compostos',
          'Contribuições menores necessárias',
          'Menos responsabilidades financeiras',
          'Oportunidade de diversificar investimentos',
          'Acesso a planos de previdência privada'
        ]
      },
      {
        id: 'scenario-2',
        title: 'Meio da Carreira',
        description: 'Profissional experiente - Acelere os investimentos - Maior renda, mais responsabilidades',
        classLevel: 'intermediario',
        totalBudget: 8000,
        adjustments: {
          'Necessidades': { maxPercentage: 100, multiplier: 1.0 }
        },
        opportunities: [
          'Maior capacidade de contribuição',
          'Experiência em investimentos',
          'Estabilidade profissional',
          'Acesso a produtos mais sofisticados',
          'Planejamento familiar integrado'
        ]
      },
      {
        id: 'scenario-3',
        title: 'Pré-Aposentadoria',
        description: 'Aproximando-se da aposentadoria - Foque na preservação - Menos tempo, mais capital',
        classLevel: 'avancado',
        totalBudget: 12000,
        adjustments: {
          'Necessidades': { maxPercentage: 100, multiplier: 1.0 }
        },
        opportunities: [
          'Capital acumulado significativo',
          'Foco em preservação de capital',
          'Renda complementar à aposentadoria',
          'Herança para família',
          'Segurança financeira garantida'
        ]
      }
    ];
    
    // Atualizar os cenários usando updateOne para garantir persistência
    const result = await Lesson.updateOne(
      { _id: lesson._id },
      { $set: { 'content.scenarios': newScenarios } }
    );
    
    if (result.modifiedCount === 0) {
      console.log('⚠️ Nenhum documento foi modificado');
    } else {
      console.log('✅ Documento atualizado com sucesso');
    }
    
    console.log('✅ Cenários atualizados com sucesso!');
    console.log('\n📊 NOVOS CENÁRIOS:');
    newScenarios.forEach((scenario, index) => {
      console.log(`${index + 1}. ${scenario.title}`);
      console.log(`   Descrição: ${scenario.description}`);
      console.log(`   Orçamento: R$ ${scenario.totalBudget}`);
      console.log(`   Oportunidades: ${scenario.opportunities.length}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar cenários:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar o script
updatePrevidenciaScenarios();
