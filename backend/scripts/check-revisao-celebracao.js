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

async function checkRevisaoCelebracao() {
  try {
    console.log('🔍 VERIFICANDO LIÇÕES REVISÃO E CELEBRAÇÃO');
    console.log('═'.repeat(80));
    
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI não encontrada no arquivo .env');
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // Buscar lições de revisão e celebração
    const lessons = await Lesson.find({ 
      title: { $regex: /Revisão e Celebração/i } 
    }).sort({ grade: 1, module: 1, order: 1 });
    
    console.log(`📚 Lições "Revisão e Celebração" encontradas: ${lessons.length}\n`);
    
    for (const lesson of lessons) {
      console.log(`🎓 ${lesson.grade} - ${lesson.title}`);
      console.log('─'.repeat(60));
      
      if (!lesson.content || !lesson.content.questions) {
        console.log('   ❌ SEM PERGUNTAS ENCONTRADAS');
        continue;
      }
      
      const questions = lesson.content.questions;
      let correctAnswersCount = { A: 0, B: 0, C: 0, D: 0 };
      
      questions.forEach((question, index) => {
        const correctAnswer = question.correctAnswer;
        if (correctAnswer && correctAnswersCount.hasOwnProperty(correctAnswer)) {
          correctAnswersCount[correctAnswer]++;
        }
        
        console.log(`   Pergunta ${index + 1}: Resposta correta = ${correctAnswer || 'NÃO DEFINIDA'}`);
      });
      
      console.log('\n   📊 Distribuição das respostas corretas:');
      Object.entries(correctAnswersCount).forEach(([letter, count]) => {
        const percentage = ((count / questions.length) * 100).toFixed(1);
        console.log(`      ${letter}: ${count}/${questions.length} (${percentage}%)`);
      });
      
      // Verificar se há predominância da letra A
      const totalQuestions = questions.length;
      const percentageA = (correctAnswersCount.A / totalQuestions) * 100;
      
      if (percentageA >= 70) {
        console.log(`   ⚠️  PROBLEMA: ${percentageA.toFixed(1)}% das respostas são A!`);
      } else {
        console.log(`   ✅ Distribuição aceitável (A = ${percentageA.toFixed(1)}%)`);
      }
      
      console.log('');
    }
    
    console.log('═'.repeat(80));
    console.log('✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar lições:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

checkRevisaoCelebracao();
