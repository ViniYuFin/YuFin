const mongoose = require('mongoose');
require('dotenv').config();

// Schema simplificado para Lesson
const lessonSchema = new mongoose.Schema({
  title: String,
  type: String,
  content: mongoose.Schema.Types.Mixed
}, { strict: false });

const Lesson = mongoose.model('Lesson', lessonSchema);

async function checkLessonsTime() {
  try {
    console.log('🔍 CONSULTANDO TEMPO DAS LIÇÕES');
    console.log('===============================================');
    
    // Conectar ao MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    // Buscar todas as lições
    const lessons = await Lesson.find({});
    
    console.log(`📊 TOTAL DE LIÇÕES: ${lessons.length}`);
    
    let lessonsOver20Min = [];
    let lessonsWithTime = 0;
    
    lessons.forEach(lesson => {
      if (lesson.estimatedTime) {
        lessonsWithTime++;
        const timeInMinutes = parseInt(lesson.estimatedTime);
        
        if (timeInMinutes > 30) {
          lessonsOver20Min.push({
            id: lesson._id,
            title: lesson.title,
            type: lesson.type,
            grade: lesson.grade,
            currentTime: timeInMinutes,
            estimatedTime: lesson.estimatedTime
          });
        }
      }
    });
    
    console.log(`\n📋 LIÇÕES COM TEMPO ESPECIFICADO: ${lessonsWithTime}`);
    console.log(`⚠️  LIÇÕES COM TEMPO > 30 MIN: ${lessonsOver20Min.length}`);
    
    if (lessonsOver20Min.length > 0) {
      console.log('\n🔍 LIÇÕES QUE PRECISAM SER AJUSTADAS:');
      console.log('===============================================');
      
      lessonsOver20Min.forEach((lesson, index) => {
        console.log(`${index + 1}. 📖 ${lesson.title}`);
        console.log(`   🆔 ID: ${lesson.id}`);
        console.log(`   📝 Tipo: ${lesson.type}`);
        console.log(`   🎓 Série: ${lesson.grade || 'Não especificada'}`);
        console.log(`   ⏱️  Tempo atual: ${lesson.currentTime} minutos`);
        console.log(`   📄 Tempo completo: ${lesson.estimatedTime}`);
        console.log('   ────────────────────────────────────────────');
      });
      
      console.log(`\n📊 RESUMO:`);
      console.log(`   Total de lições: ${lessons.length}`);
      console.log(`   Lições com tempo: ${lessonsWithTime}`);
      console.log(`   Lições > 30min: ${lessonsOver20Min.length}`);
      console.log(`   Percentual: ${((lessonsOver20Min.length / lessonsWithTime) * 100).toFixed(1)}%`);
    } else {
      console.log('\n✅ NENHUMA LIÇÃO COM TEMPO > 30 MINUTOS ENCONTRADA!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao consultar tempos das lições:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar o script
checkLessonsTime();
