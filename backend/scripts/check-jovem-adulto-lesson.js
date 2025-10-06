const mongoose = require('mongoose');
require('dotenv').config();

// Schema simplificado para Lesson
const lessonSchema = new mongoose.Schema({
  title: String,
  type: String,
  content: mongoose.Schema.Types.Mixed
}, { strict: false });

const Lesson = mongoose.model('Lesson', lessonSchema);

async function checkJovemAdultoLesson() {
  try {
    console.log('🔍 INVESTIGANDO LIÇÃO "ORÇAMENTO DO JOVEM ADULTO"');
    console.log('===============================================');
    
    // Conectar ao MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    // Buscar a lição "Orçamento do Jovem Adulto"
    const lesson = await Lesson.findOne({ title: "Orçamento do Jovem Adulto" });
    
    if (!lesson) {
      console.log('❌ Lição "Orçamento do Jovem Adulto" não encontrada!');
      return;
    }
    
    console.log(`📖 Título: ${lesson.title}`);
    console.log(`📝 Tipo: ${lesson.type}`);
    console.log(`🎓 Série: ${lesson.grade || 'Não especificada'}`);
    
    if (lesson.content && lesson.content.categories) {
      console.log(`\n🏷️  Categorias: ${lesson.content.categories.length}`);
      lesson.content.categories.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.name} (ID: ${category.id})`);
        console.log(`      Grupo: ${category.group || 'Não especificado'}`);
        console.log(`      Prioridade: ${category.priority || 'Não especificada'}`);
        console.log(`      Ícone: ${category.icon || 'Não especificado'}`);
        console.log(`      Descrição: ${category.description || 'Não especificada'}`);
        
        // Se for a categoria de investimentos, mostrar detalhes completos
        if (category.name.toLowerCase().includes('investimento') || category.id.includes('investimento')) {
          console.log(`      ⭐ CATEGORIA DE INVESTIMENTOS ENCONTRADA!`);
          console.log(`      Detalhes completos:`, JSON.stringify(category, null, 2));
        }
        console.log('   ────────────────────────────────────────────');
      });
    }
    
    console.log('\n✅ Investigação concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao investigar lição:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar o script
checkJovemAdultoLesson();

