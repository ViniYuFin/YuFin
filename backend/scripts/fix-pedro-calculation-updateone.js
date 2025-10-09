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

async function fixPedroCalculationWithUpdateOne() {
  try {
    console.log('🔧 CORRIGINDO CÁLCULO DO PEDRO - DIVERSIFICAÇÃO INICIAL (updateOne)');
    console.log('═'.repeat(60));
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // Buscar a lição "Diversificação Inicial" do 8º Ano
    const lesson = await Lesson.findOne({ 
      title: "Diversificação Inicial", 
      grade: "8º Ano" 
    });
    
    if (!lesson) {
      console.log('❌ Lição "Diversificação Inicial" não encontrada!');
      return;
    }
    
    console.log(`📖 Lição encontrada: ${lesson.title}`);
    console.log(`🆔 ID: ${lesson._id}`);
    
    // Verificar o exemplo atual do Pedro
    if (lesson.content.examples && lesson.content.examples.length > 0) {
      const pedroExample = lesson.content.examples[0];
      
      console.log(`\n🔍 Exemplo atual do Pedro:`);
      console.log(`   Resposta: R$ ${pedroExample.answer}`);
      console.log(`   Cenário: ${pedroExample.scenario.substring(0, 100)}...`);
      
      // Usar updateOne para corrigir apenas o exemplo específico
      const result = await Lesson.updateOne(
        { 
          _id: lesson._id,
          "content.examples.0.character": "Pedro"
        },
        { 
          $set: { 
            "content.examples.0.answer": 25.5,
            "content.examples.0.explanation": "Poupança: R$ 1.500 × 0,5% = R$ 7,50. Fundos: R$ 900 × 1% = R$ 9,00. Ações: R$ 600 × 1,5% = R$ 9,00. Total: R$ 7,50 + R$ 9,00 + R$ 9,00 = R$ 25,50."
          }
        }
      );
      
      console.log(`\n✅ Resultado do updateOne:`);
      console.log(`   Documentos encontrados: ${result.matchedCount}`);
      console.log(`   Documentos modificados: ${result.modifiedCount}`);
      
      if (result.modifiedCount > 0) {
        console.log(`\n🎯 Correção aplicada com sucesso!`);
        console.log(`   Nova resposta: R$ 25,50`);
        console.log(`   Nova explicação: Poupança: R$ 1.500 × 0,5% = R$ 7,50. Fundos: R$ 900 × 1% = R$ 9,00. Ações: R$ 600 × 1,5% = R$ 9,00. Total: R$ 7,50 + R$ 9,00 + R$ 9,00 = R$ 25,50.`);
      } else {
        console.log(`\n⚠️  Nenhum documento foi modificado. Verifique se o exemplo do Pedro existe.`);
      }
      
    } else {
      console.log('❌ Exemplos não encontrados na lição!');
    }
    
    console.log('\n✅ Correção concluída usando updateOne!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir cálculo:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

fixPedroCalculationWithUpdateOne();
