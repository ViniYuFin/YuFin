const mongoose = require('mongoose');
require('dotenv').config();

// Conectar ao MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Schema da Lição
const lessonSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: String,
  content: mongoose.Schema.Types.Mixed,
  grade: String,
  module: Number,
  order: Number,
  difficulty: Number,
  estimatedTime: Number,
  bnccSkills: [String],
  isActive: Boolean
}, { collection: 'lessons' });

const Lesson = mongoose.model('Lesson', lessonSchema);

async function fixLessonsTime() {
  try {
    console.log('🔧 CORRIGINDO TEMPO DAS LIÇÕES');
    console.log('===============================================');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    // Buscar todas as lições
    const lessons = await Lesson.find({});
    console.log(`📊 TOTAL DE LIÇÕES: ${lessons.length}`);
    
    let lessonsFixed = 0;
    let lessonsOver30Min = [];
    
    // Identificar lições com tempo > 30 minutos
    lessons.forEach(lesson => {
      if (lesson.estimatedTime && lesson.estimatedTime > 30) {
        lessonsOver30Min.push(lesson);
      }
    });
    
    console.log(`⚠️  LIÇÕES COM TEMPO > 30 MIN: ${lessonsOver30Min.length}`);
    
    if (lessonsOver30Min.length === 0) {
      console.log('\n✅ NENHUMA LIÇÃO PRECISA SER CORRIGIDA!');
      return;
    }
    
    console.log('\n🔧 CORRIGINDO LIÇÕES...');
    console.log('===============================================');
    
    // Corrigir cada lição
    for (const lesson of lessonsOver30Min) {
      const oldTime = lesson.estimatedTime;
      
      // Calcular novo tempo baseado na série e tipo
      let newTime;
      
      if (lesson.grade === '6º Ano' || lesson.grade === '7º Ano') {
        // Lições mais básicas: 10-20 minutos
        newTime = Math.floor(Math.random() * 11) + 10; // 10-20
      } else if (lesson.grade === '8º Ano' || lesson.grade === '9º Ano') {
        // Lições intermediárias: 15-25 minutos
        newTime = Math.floor(Math.random() * 11) + 15; // 15-25
      } else if (lesson.grade === '1º Ano EM' || lesson.grade === '2º Ano EM' || lesson.grade === '3º Ano EM') {
        // Lições avançadas: 20-30 minutos
        newTime = Math.floor(Math.random() * 11) + 20; // 20-30
      } else {
        // Fallback: 15-25 minutos
        newTime = Math.floor(Math.random() * 11) + 15;
      }
      
      // Ajustar baseado no tipo de lição
      if (lesson.type === 'quiz' || lesson.type === 'match') {
        newTime = Math.min(newTime, 20); // Lições mais simples
      } else if (lesson.type === 'goals' || lesson.type === 'budget-distribution') {
        newTime = Math.min(newTime, 25); // Lições de cálculo
      } else if (lesson.type === 'simulation' || lesson.type === 'drag-drop') {
        newTime = Math.min(newTime, 30); // Lições mais complexas
      }
      
      // Atualizar no banco de dados
      await Lesson.updateOne(
        { _id: lesson._id },
        { $set: { estimatedTime: newTime } }
      );
      
      console.log(`${lessonsFixed + 1}. 📖 ${lesson.title}`);
      console.log(`   🆔 ID: ${lesson._id}`);
      console.log(`   📝 Tipo: ${lesson.type}`);
      console.log(`   🎓 Série: ${lesson.grade}`);
      console.log(`   ⏱️  Tempo: ${oldTime} → ${newTime} minutos`);
      console.log(`   ────────────────────────────────────────────`);
      
      lessonsFixed++;
    }
    
    console.log(`\n📊 RESUMO DA CORREÇÃO:`);
    console.log(`   Lições corrigidas: ${lessonsFixed}`);
    console.log(`   Percentual: ${((lessonsFixed / lessons.length) * 100).toFixed(1)}%`);
    
    // Verificar se ainda há lições com tempo > 30 minutos
    const remainingOver30 = await Lesson.countDocuments({ estimatedTime: { $gt: 30 } });
    console.log(`   Lições ainda > 30min: ${remainingOver30}`);
    
    if (remainingOver30 === 0) {
      console.log('\n✅ TODAS AS LIÇÕES FORAM CORRIGIDAS COM SUCESSO!');
    } else {
      console.log(`\n⚠️  Ainda restam ${remainingOver30} lições com tempo > 30 minutos.`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir tempos das lições:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar o script
fixLessonsTime();