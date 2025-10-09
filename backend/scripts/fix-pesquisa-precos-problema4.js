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

async function fixPesquisaPrecosProblema4() {
  try {
    console.log('🔧 CORRIGINDO PESQUISA DE PREÇOS - PROBLEMA 4');
    console.log('═'.repeat(60));
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // Buscar a lição
    const pesquisaPrecos = await Lesson.findOne({ 
      title: "Pesquisa de Preços", 
      grade: "7º Ano" 
    });
    
    if (pesquisaPrecos) {
      console.log('📝 Corrigindo: Pesquisa de Preços - Problema 4');
      
      // Corrigir os valores para criar um desafio real - Loja B será mais barata
      await Lesson.updateOne(
        { 
          _id: pesquisaPrecos._id,
          "content.problems.3.title": "Frete e Preço Total"
        },
        { 
          $set: { 
            "content.problems.3.givenData": {
              precoProdutoLojaA: 25.00,
              freteLojaA: 8.00,
              precoProdutoLojaB: 28.00,
              freteLojaB: 4.00
            },
            "content.problems.3.question": "Qual o menor preço total?",
            "content.problems.3.answer": 32,
            "content.problems.3.explanation": "Loja A: R$ 25,00 + R$ 8,00 = R$ 33,00. Loja B: R$ 28,00 + R$ 4,00 = R$ 32,00. A Loja B é mais barata com R$ 32,00."
          }
        }
      );
      
      console.log('   ✅ Problema 4 corrigido:');
      console.log('   📊 Loja A: R$ 25,00 + R$ 8,00 = R$ 33,00');
      console.log('   📊 Loja B: R$ 28,00 + R$ 4,00 = R$ 32,00');
      console.log('   📊 Resposta: 32 (Loja B é mais barata)');
    } else {
      console.log('   ⚠️  Lição "Pesquisa de Preços" não encontrada');
    }
    
    console.log('\n✅ Correção aplicada!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir problema:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

fixPesquisaPrecosProblema4();
