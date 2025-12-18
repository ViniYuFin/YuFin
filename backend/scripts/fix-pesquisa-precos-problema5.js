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

async function fixPesquisaPrecosProblema5() {
  try {
    console.log('🔧 CORRIGINDO PESQUISA DE PREÇOS - PROBLEMA 5');
    console.log('═'.repeat(60));
    
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI não encontrada no arquivo .env');
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // Buscar a lição
    const pesquisaPrecos = await Lesson.findOne({ 
      title: "Pesquisa de Preços", 
      grade: "7º Ano" 
    });
    
    if (pesquisaPrecos) {
      console.log('📝 Corrigindo: Pesquisa de Preços - Problema 5');
      
      // Corrigir a resposta do Problema 5 (Promoção 3 por 2)
      // Cálculo: 7 produtos = 2 grupos de 3 (paga 2 em cada) + 1 produto avulso = 5 produtos pagos
      // 5 × R$ 10,00 = R$ 50,00
      await Lesson.updateOne(
        { 
          _id: pesquisaPrecos._id,
          "content.problems.4.title": "Promoção 3 por 2"
        },
        { 
          $set: { 
            "content.problems.4.answer": 50,
            "content.problems.4.explanation": "Com 7 produtos: 2 grupos de 3 (paga 2 em cada) + 1 produto avulso. Total de 5 produtos pagos. 5 × R$ 10,00 = R$ 50,00."
          }
        }
      );
      
      console.log('   ✅ Problema 5 corrigido:');
      console.log('   📊 Resposta corrigida: 50 (era 25)');
      console.log('   📊 Explicação: 2 grupos de 3 (paga 2) + 1 avulso = 5 produtos × R$ 10,00 = R$ 50,00');
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

fixPesquisaPrecosProblema5();
