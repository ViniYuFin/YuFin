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

async function revertRevisaoCelebracaoRandomization() {
  try {
    console.log('🔄 REVERTENDO RANDOMIZAÇÃO DAS LIÇÕES REVISÃO E CELEBRAÇÃO');
    console.log('═'.repeat(80));
    
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI não encontrada no arquivo .env');
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // Buscar todas as lições de revisão e celebração
    const lessons = await Lesson.find({ 
      title: { $regex: /Revisão e Celebração/i } 
    }).sort({ grade: 1 });
    
    console.log(`📚 Lições encontradas: ${lessons.length}\n`);
    
    for (const lesson of lessons) {
      console.log(`🎓 ${lesson.grade} - ${lesson.title}`);
      
      // Remover os campos de randomização
      await Lesson.updateOne(
        { _id: lesson._id },
        { 
          $unset: { 
            "content.randomized": "",
            "content.randomizedAt": ""
          }
        }
      );
      
      console.log('   ✅ Campos de randomização removidos');
    }
    
    console.log('\n═'.repeat(80));
    console.log('🎉 RANDOMIZAÇÃO REVERTIDA!');
    console.log('📝 As lições voltaram ao estado original');
    console.log('🔄 A randomização agora acontece dinamicamente no frontend a cada acesso');
    
  } catch (error) {
    console.error('❌ Erro ao reverter randomização:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

revertRevisaoCelebracaoRandomization();
