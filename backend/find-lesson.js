const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');

// String de conexão
const MONGODB_URI = 'mongodb+srv://yufin:yufin123@yufin.7jqfb.mongodb.net/yufin?retryWrites=true&w=majority';

async function findLesson() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado com sucesso!');

    // Buscar lição de Finanças Comportamentais
    const lesson = await Lesson.findOne({ 
      title: /comportamentais/i,
      gradeId: /1º Ano EM/i
    });

    if (lesson) {
      console.log('\n=== LIÇÃO ENCONTRADA ===');
      console.log('ID:', lesson._id);
      console.log('Título:', lesson.title);
      console.log('Série:', lesson.gradeId);
      console.log('Módulo:', lesson.module);
      console.log('Ordem:', lesson.order);
      console.log('Tipo:', lesson.type);
      console.log('Tempo estimado:', lesson.estimatedTime);
      console.log('\n=== CONTEÚDO ===');
      console.log(JSON.stringify(lesson.content, null, 2));
    } else {
      console.log('Lição não encontrada');
      
      // Buscar todas as lições do 1º ano EM para referência
      console.log('\n=== LIÇÕES DO 1º ANO EM ===');
      const allLessons = await Lesson.find({ gradeId: /1º Ano EM/i });
      allLessons.forEach(l => {
        console.log(`- ${l.title} (${l.type})`);
      });
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado do MongoDB');
  }
}

findLesson();

