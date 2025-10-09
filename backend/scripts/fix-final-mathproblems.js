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

async function fixFinalMathProblems() {
  try {
    console.log('🔧 CORREÇÃO FINAL DOS PROBLEMAS MATH-PROBLEMS');
    console.log('═'.repeat(80));
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // 1. Corrigir Pesquisa de Preços - Problema 2
    const pesquisaPrecos = await Lesson.findOne({ 
      title: "Pesquisa de Preços", 
      grade: "7º Ano" 
    });
    
    if (pesquisaPrecos) {
      console.log('📝 Corrigindo: Pesquisa de Preços - Problema 2');
      
      // Mudar a pergunta para ser mais clara
      await Lesson.updateOne(
        { 
          _id: pesquisaPrecos._id,
          "content.problems.1.title": "Compra em Quantidade"
        },
        { 
          $set: { 
            "content.problems.1.question": "Qual o preço da opção mais barata?",
            "content.problems.1.answer": 10.5,
            "content.problems.1.explanation": "Na Loja A: 5 × R$ 2,30 = R$ 11,50. Na Loja B: R$ 10,50. A Loja B é mais barata, custando R$ 10,50."
          }
        }
      );
      
      console.log('   ✅ Problema 2 corrigido: Pergunta alterada para "Qual o preço da opção mais barata?"');
      console.log('   📊 Resposta: 10.5');
    }
    
    // 2. Corrigir Juros Simples - Problema 5
    const jurosSimples = await Lesson.findOne({ 
      title: "Juros Simples", 
      grade: "7º Ano" 
    });
    
    if (jurosSimples) {
      console.log('\n📝 Corrigindo: Juros Simples - Problema 5');
      
      // Mudar a pergunta para ser mais clara
      await Lesson.updateOne(
        { 
          _id: jurosSimples._id,
          "content.problems.4.title": "Comparação de Investimentos"
        },
        { 
          $set: { 
            "content.problems.4.question": "Qual é a diferença entre as duas opções?",
            "content.problems.4.answer": 96,
            "content.problems.4.explanation": "Opção A: R$ 4.000,00 × 1,8% × 8 = R$ 576,00. Opção B: R$ 4.000,00 × 1,5% × 8 = R$ 480,00. A diferença é R$ 576,00 - R$ 480,00 = R$ 96,00."
          }
        }
      );
      
      console.log('   ✅ Problema 5 corrigido: Pergunta alterada para "Qual é a diferença entre as duas opções?"');
      console.log('   📊 Resposta: 96');
    }
    
    // 3. Corrigir Contando Moedas e Notas - Problema 4
    const contandoMoedas = await Lesson.findOne({ 
      title: "Contando Moedas e Notas", 
      grade: "6º Ano" 
    });
    
    if (contandoMoedas) {
      console.log('\n📝 Corrigindo: Contando Moedas e Notas - Problema 4');
      
      // Corrigir a resposta
      await Lesson.updateOne(
        { 
          _id: contandoMoedas._id,
          "content.problems.3.title": "Contando Cédulas"
        },
        { 
          $set: { 
            "content.problems.3.answer": 1140,
            "content.problems.3.explanation": "Calculamos: 5×R$ 100 = R$ 500; 8×R$ 50 = R$ 400; 12×R$ 20 = R$ 240. Total: R$ 500 + R$ 400 + R$ 240 = R$ 1.140."
          }
        }
      );
      
      console.log('   ✅ Problema 4 corrigido: Resposta = 1140');
    }
    
    console.log('\n═'.repeat(80));
    console.log('✅ Correções finais aplicadas!');
    console.log('🔌 Desconectado do MongoDB');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir problemas:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixFinalMathProblems();
