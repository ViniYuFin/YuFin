const mongoose = require('mongoose');
require('dotenv').config();

// Schema simplificado para Lesson
const lessonSchema = new mongoose.Schema({
  title: String,
  type: String,
  content: mongoose.Schema.Types.Mixed
}, { strict: false });

const Lesson = mongoose.model('Lesson', lessonSchema);

async function listBudgetLessons() {
  try {
    console.log('🔍 INVESTIGANDO LIÇÕES BUDGET DISTRIBUTION');
    console.log('===============================================');
    
    // Conectar ao MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    // Primeiro, vamos ver quantas lições existem no total
    const totalLessons = await Lesson.countDocuments();
    console.log(`📊 TOTAL DE LIÇÕES NO BANCO: ${totalLessons}`);
    
    // Vamos ver alguns exemplos de lições para entender a estrutura
    const sampleLessons = await Lesson.find({}).limit(5);
    console.log('\n🔍 AMOSTRAS DE LIÇÕES:');
    sampleLessons.forEach((lesson, index) => {
      console.log(`${index + 1}. Título: ${lesson.title}`);
      console.log(`   Tipo: ${lesson.type}`);
      console.log(`   ID: ${lesson._id}`);
      console.log('   ────────────────────────────────────────────');
    });
    
    // Tentar diferentes variações do tipo
    const variations = [
      'BudgetDistributionLesson',
      'budget',
      'Budget',
      'budget-distribution',
      'BudgetDistribution'
    ];
    
    console.log('\n🔍 TESTANDO DIFERENTES TIPOS:');
    for (const variation of variations) {
      const count = await Lesson.countDocuments({ type: variation });
      console.log(`   ${variation}: ${count} lições`);
    }
    
    // Buscar todas as lições do tipo "budget-distribution"
    const budgetLessons = await Lesson.find({ type: 'budget-distribution' });
    
    console.log(`\n📊 TOTAL DE LIÇÕES BUDGET DISTRIBUTION: ${budgetLessons.length}`);
    console.log('===============================================\n');
    
    if (budgetLessons.length === 0) {
      console.log('❌ Nenhuma lição budget-distribution encontrada!');
      return;
    }
    
    // Listar cada lição
    budgetLessons.forEach((lesson, index) => {
      console.log(`${index + 1}. 📋 ${lesson.title}`);
      console.log(`   🆔 ID: ${lesson._id}`);
      console.log(`   📝 Tipo: ${lesson.type}`);
      
      // Verificar se tem grade (série)
      if (lesson.grade) {
        console.log(`   🎓 Série: ${lesson.grade}`);
      }
      
      // Verificar se tem content
      if (lesson.content) {
        if (lesson.content.title) {
          console.log(`   📖 Título do Conteúdo: ${lesson.content.title}`);
        }
        if (lesson.content.description) {
          console.log(`   📄 Descrição: ${lesson.content.description.substring(0, 100)}...`);
        }
        if (lesson.content.categories && Array.isArray(lesson.content.categories)) {
          console.log(`   🏷️  Categorias: ${lesson.content.categories.length}`);
        }
        if (lesson.content.budget) {
          console.log(`   💰 Orçamento: R$ ${lesson.content.budget}`);
        }
      }
      
      console.log('   ────────────────────────────────────────────');
    });
    
    console.log(`\n✅ Listagem concluída! Total: ${budgetLessons.length} lições budget-distribution`);
    
  } catch (error) {
    console.error('❌ Erro ao listar lições budget:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar o script
listBudgetLessons();
