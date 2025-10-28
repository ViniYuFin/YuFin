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

// Função para randomizar array (algoritmo Fisher-Yates)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Função para randomizar alternativas de uma pergunta
function randomizeQuestion(question) {
  if (!question.options || question.options.length !== 4) {
    return question; // Retorna original se não tiver 4 opções
  }
  
  // Criar array com índices e valores
  const optionsWithIndex = question.options.map((option, index) => ({ option, originalIndex: index }));
  
  // Randomizar as opções
  const shuffledOptions = shuffleArray(optionsWithIndex);
  
  // Encontrar onde a resposta correta foi movida
  const correctOriginalIndex = question.correctAnswer;
  const newCorrectIndex = shuffledOptions.findIndex(item => item.originalIndex === correctOriginalIndex);
  
  // Criar nova pergunta com alternativas randomizadas
  const newQuestion = {
    ...question,
    options: shuffledOptions.map(item => item.option),
    correctAnswer: newCorrectIndex
  };
  
  return newQuestion;
}

async function randomizeRevisaoCelebracao() {
  try {
    console.log('🔀 RANDOMIZANDO ALTERNATIVAS DAS LIÇÕES REVISÃO E CELEBRAÇÃO');
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
      console.log('─'.repeat(60));
      
      if (!lesson.content || !lesson.content.questions) {
        console.log('   ⚠️  Sem perguntas encontradas');
        continue;
      }
      
      // Randomizar cada pergunta
      const randomizedQuestions = lesson.content.questions.map(randomizeQuestion);
      
      // Contar distribuição das respostas corretas
      const correctAnswersCount = { 0: 0, 1: 0, 2: 0, 3: 0 };
      randomizedQuestions.forEach(q => {
        if (correctAnswersCount.hasOwnProperty(q.correctAnswer)) {
          correctAnswersCount[q.correctAnswer]++;
        }
      });
      
      console.log('   📊 Nova distribuição das respostas corretas:');
      Object.entries(correctAnswersCount).forEach(([index, count]) => {
        const letter = String.fromCharCode(65 + parseInt(index)); // A, B, C, D
        const percentage = ((count / randomizedQuestions.length) * 100).toFixed(1);
        console.log(`      ${letter}: ${count}/${randomizedQuestions.length} (${percentage}%)`);
      });
      
      // Atualizar no banco de dados
      await Lesson.updateOne(
        { _id: lesson._id },
        { 
          $set: { 
            "content.questions": randomizedQuestions,
            "content.randomized": true,
            "content.randomizedAt": new Date()
          }
        }
      );
      
      console.log('   ✅ Alternativas randomizadas e salvas!');
      console.log('');
    }
    
    console.log('═'.repeat(80));
    console.log('🎉 TODAS AS LIÇÕES FORAM RANDOMIZADAS!');
    console.log('📝 As alternativas agora aparecerão em posições aleatórias a cada acesso');
    console.log('🔄 Para re-randomizar no futuro, execute este script novamente');
    
  } catch (error) {
    console.error('❌ Erro ao randomizar lições:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

randomizeRevisaoCelebracao();
