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

async function checkMultipleQuestions() {
  try {
    console.log('🔍 VERIFICANDO LIÇÕES COM MÚLTIPLAS PERGUNTAS');
    console.log('═'.repeat(80));
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // Buscar todas as lições do tipo "goals"
    const lessons = await Lesson.find({ type: "goals" }).sort({ grade: 1, module: 1, order: 1 });
    
    console.log(`📚 Total de lições "goals" encontradas: ${lessons.length}\n`);
    
    const lessonsWithMultipleQuestions = [];
    
    lessons.forEach((lesson, index) => {
      console.log(`\n${index + 1}. 📖 ${lesson.title} (${lesson.grade})`);
      console.log('─'.repeat(80));
      
      if (lesson.content.examples && lesson.content.examples.length > 0) {
        lesson.content.examples.forEach((example, exIndex) => {
          console.log(`\n   💡 Exemplo ${exIndex + 1} (${example.character}):`);
          console.log(`      Cenário: ${example.scenario}`);
          
          // Verificar se há múltiplas perguntas no cenário
          const questionMarks = (example.scenario.match(/\?/g) || []).length;
          const hasMultipleQuestions = questionMarks > 1;
          
          console.log(`      Perguntas encontradas: ${questionMarks}`);
          console.log(`      Resposta: R$ ${example.answer}`);
          
          if (hasMultipleQuestions) {
            console.log(`      ⚠️  MÚLTIPLAS PERGUNTAS DETECTADAS!`);
            lessonsWithMultipleQuestions.push({
              lesson: lesson.title,
              grade: lesson.grade,
              example: exIndex + 1,
              character: example.character,
              scenario: example.scenario,
              currentAnswer: example.answer
            });
          } else {
            console.log(`      ✅ Uma pergunta apenas`);
          }
        });
      }
    });
    
    console.log('\n\n' + '═'.repeat(80));
    console.log('📊 RESUMO - LIÇÕES COM MÚLTIPLAS PERGUNTAS');
    console.log('═'.repeat(80));
    
    if (lessonsWithMultipleQuestions.length > 0) {
      console.log(`\n⚠️  Encontradas ${lessonsWithMultipleQuestions.length} questões com múltiplas perguntas:\n`);
      
      lessonsWithMultipleQuestions.forEach((item, index) => {
        console.log(`${index + 1}. ${item.lesson} (${item.grade})`);
        console.log(`   Exemplo ${item.example} - ${item.character}`);
        console.log(`   Cenário: ${item.scenario.substring(0, 100)}...`);
        console.log(`   Resposta atual: R$ ${item.currentAnswer}`);
        console.log('');
      });
      
      console.log('🔧 AÇÕES NECESSÁRIAS:');
      console.log('   • Simplificar cenários para uma pergunta apenas');
      console.log('   • Focar na pergunta principal');
      console.log('   • Manter apenas uma resposta numérica');
      
    } else {
      console.log('\n✅ Nenhuma lição com múltiplas perguntas encontrada!');
      console.log('   Todas as lições já estão com uma pergunta por exemplo.');
    }
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar lições:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

checkMultipleQuestions();
