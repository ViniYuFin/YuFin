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

async function analyzeRevisaoCelebracaoStructure() {
  try {
    console.log('🔍 ANÁLISE DA ESTRUTURA DAS LIÇÕES REVISÃO E CELEBRAÇÃO');
    console.log('═'.repeat(80));
    
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI não encontrada no arquivo .env');
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // Buscar uma lição de exemplo para analisar a estrutura
    const lesson = await Lesson.findOne({ 
      title: { $regex: /Revisão e Celebração/i },
      grade: "6º Ano"
    });
    
    if (!lesson) {
      console.log('❌ Lição não encontrada');
      return;
    }
    
    console.log(`📖 Analisando: ${lesson.grade} - ${lesson.title}`);
    console.log('─'.repeat(60));
    
    console.log('📋 Estrutura do conteúdo:');
    console.log(JSON.stringify(lesson.content, null, 2));
    
    if (lesson.content.questions && lesson.content.questions.length > 0) {
      console.log('\n🔍 Exemplo de pergunta:');
      const question = lesson.content.questions[0];
      console.log('Pergunta:', question.question);
      console.log('Alternativas:', question.alternatives);
      console.log('Resposta correta:', question.correctAnswer);
      console.log('Tipo da resposta:', typeof question.correctAnswer);
    }
    
  } catch (error) {
    console.error('❌ Erro ao analisar estrutura:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

analyzeRevisaoCelebracaoStructure();
