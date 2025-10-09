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

async function fixSpecificMathProblems() {
  try {
    console.log('🔧 CORRIGINDO PROBLEMAS ESPECÍFICOS DAS LIÇÕES MATH-PROBLEMS');
    console.log('═'.repeat(80));
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // 1. Corrigir Contando Moedas e Notas - Problema 5
    const contandoMoedas = await Lesson.findOne({ 
      title: "Contando Moedas e Notas", 
      grade: "6º Ano" 
    });
    
    if (contandoMoedas) {
      console.log('📝 Corrigindo: Contando Moedas e Notas - Problema 5');
      
      // Atualizar apenas o problema 5 (índice 4)
      await Lesson.updateOne(
        { 
          _id: contandoMoedas._id,
          "content.problems.4.title": "Troco Otimizado"
        },
        { 
          $set: { 
            "content.problems.4.answer": 3,
            "content.problems.4.explanation": "Para dar R$ 6,25 de troco: 1 nota de R$ 5,00 + 1 moeda de R$ 1,00 + 1 moeda de R$ 0,25 = 3 peças. Esta é a menor quantidade possível."
          }
        }
      );
      
      console.log('   ✅ Problema 5 corrigido: Resposta = 3 (quantidade de peças)');
    }
    
    // 2. Corrigir Pesquisa de Preços - Problema 2
    const pesquisaPrecos = await Lesson.findOne({ 
      title: "Pesquisa de Preços", 
      grade: "7º Ano" 
    });
    
    if (pesquisaPrecos) {
      console.log('\n📝 Corrigindo: Pesquisa de Preços - Problema 2');
      
      // Atualizar apenas o problema 2 (índice 1)
      await Lesson.updateOne(
        { 
          _id: pesquisaPrecos._id,
          "content.problems.1.title": "Compra em Quantidade"
        },
        { 
          $set: { 
            "content.problems.1.answer": 10.5,
            "content.problems.1.explanation": "Na Loja A: 5 × R$ 2,30 = R$ 11,50. Na Loja B: R$ 10,50. A Loja B é mais barata, custando R$ 10,50."
          }
        }
      );
      
      console.log('   ✅ Problema 2 corrigido: Resposta = 10.5 (preço da opção mais barata)');
    }
    
    // 3. Corrigir Juros Simples - Problema 2
    const jurosSimples = await Lesson.findOne({ 
      title: "Juros Simples", 
      grade: "7º Ano" 
    });
    
    if (jurosSimples) {
      console.log('\n📝 Corrigindo: Juros Simples - Problema 2');
      
      // Atualizar apenas o problema 2 (índice 1)
      await Lesson.updateOne(
        { 
          _id: jurosSimples._id,
          "content.problems.1.title": "Montante com Juros Simples"
        },
        { 
          $set: { 
            "content.problems.1.answer": 2120,
            "content.problems.1.explanation": "Juros: R$ 2.000,00 × 1,5% × 4 = R$ 120,00. Montante: R$ 2.000,00 + R$ 120,00 = R$ 2.120,00."
          }
        }
      );
      
      console.log('   ✅ Problema 2 corrigido: Resposta = 2120 (montante total)');
      
      // 4. Corrigir Juros Simples - Problema 5
      console.log('\n📝 Corrigindo: Juros Simples - Problema 5');
      
      // Atualizar apenas o problema 5 (índice 4)
      await Lesson.updateOne(
        { 
          _id: jurosSimples._id,
          "content.problems.4.title": "Comparação de Investimentos"
        },
        { 
          $set: { 
            "content.problems.4.answer": 96,
            "content.problems.4.explanation": "Opção A: R$ 4.000,00 × 1,8% × 8 = R$ 576,00. Opção B: R$ 4.000,00 × 1,5% × 8 = R$ 480,00. A Opção A rende R$ 96,00 a mais."
          }
        }
      );
      
      console.log('   ✅ Problema 5 corrigido: Resposta = 96 (diferença entre as opções)');
    }
    
    console.log('\n═'.repeat(80));
    console.log('✅ Problemas específicos corrigidos!');
    console.log('🔌 Desconectado do MongoDB');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir problemas:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixSpecificMathProblems();
