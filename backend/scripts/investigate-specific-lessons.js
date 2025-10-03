const mongoose = require('mongoose');
require('dotenv').config();

// Schema simplificado para Lesson
const lessonSchema = new mongoose.Schema({
  title: String,
  type: String,
  content: mongoose.Schema.Types.Mixed
}, { strict: false });

const Lesson = mongoose.model('Lesson', lessonSchema);

async function investigateSpecificLessons() {
  try {
    console.log('🔍 INVESTIGANDO LIÇÕES ESPECÍFICAS');
    console.log('===============================================');
    
    // Conectar ao MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    // IDs das lições específicas
    const lessonIds = [
      '68bf16663f2074bcdd61d1d6', // O Orçamento da Família
      '68b5f074206075fecfe052aa'  // Previdência e Aposentadoria (ID correto)
    ];
    
    for (const lessonId of lessonIds) {
      console.log(`\n📋 INVESTIGANDO LIÇÃO: ${lessonId}`);
      console.log('===============================================');
      
      const lesson = await Lesson.findById(lessonId);
      
      if (!lesson) {
        console.log('❌ Lição não encontrada!');
        continue;
      }
      
      console.log(`📖 Título: ${lesson.title}`);
      console.log(`📝 Tipo: ${lesson.type}`);
      console.log(`🎓 Série: ${lesson.grade || 'Não especificada'}`);
      
      if (lesson.content) {
        console.log('\n📊 ESTRUTURA DO CONTEÚDO:');
        console.log('===============================================');
        
        // Verificar se tem cenários
        if (lesson.content.scenarios) {
          console.log(`🎭 Cenários: ${lesson.content.scenarios.length}`);
          lesson.content.scenarios.forEach((scenario, index) => {
            console.log(`   ${index + 1}. ${scenario.title}`);
            console.log(`      ID: ${scenario.id}`);
            console.log(`      Descrição: ${scenario.description}`);
            if (scenario.adjustments) {
              console.log(`      Ajustes: ${Object.keys(scenario.adjustments).join(', ')}`);
            }
            if (scenario.opportunities) {
              console.log(`      Oportunidades: ${scenario.opportunities.length}`);
            }
          });
        }
        
        // Verificar categorias
        if (lesson.content.categories) {
          console.log(`\n🏷️  Categorias: ${lesson.content.categories.length}`);
          lesson.content.categories.forEach((category, index) => {
            console.log(`   ${index + 1}. ${category.name} (ID: ${category.id})`);
            console.log(`      Grupo: ${category.group || 'Não especificado'}`);
            console.log(`      Prioridade: ${category.priority || 'Não especificada'}`);
            console.log(`      Ícone: ${category.icon || 'Não especificado'}`);
            console.log(`      Descrição: ${category.description || 'Não especificada'}`);
          });
        }
        
        // Verificar orçamento total
        if (lesson.content.totalBudget) {
          console.log(`\n💰 Orçamento Total: R$ ${lesson.content.totalBudget}`);
        } else if (lesson.content.budget) {
          console.log(`\n💰 Orçamento: R$ ${lesson.content.budget}`);
        } else if (lesson.content.gameConfig?.totalBudget) {
          console.log(`\n💰 Orçamento (gameConfig): R$ ${lesson.content.gameConfig.totalBudget}`);
        }
        
        // Verificar se tem configurações especiais
        if (lesson.content.gameConfig) {
          console.log(`\n⚙️  Configurações do Jogo:`);
          console.log(`   Total Budget: ${lesson.content.gameConfig.totalBudget || 'Não especificado'}`);
          console.log(`   Outras configs: ${Object.keys(lesson.content.gameConfig).join(', ')}`);
        }
      }
      
      console.log('\n' + '='.repeat(50));
    }
    
    console.log('\n✅ Investigação concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao investigar lições:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar o script
investigateSpecificLessons();
