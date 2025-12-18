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

async function fixPedroCalculation() {
  try {
    console.log('🔧 CORRIGINDO CÁLCULO DO PEDRO - DIVERSIFICAÇÃO INICIAL');
    console.log('═'.repeat(60));
    
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI não encontrada no arquivo .env');
      process.exit(1);
    }
    
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
    
    // Encontrar o exemplo do Pedro (primeiro exemplo)
    if (lesson.content.examples && lesson.content.examples.length > 0) {
      const pedroExample = lesson.content.examples[0];
      
      console.log(`\n🔍 Exemplo atual do Pedro:`);
      console.log(`   Resposta: R$ ${pedroExample.answer}`);
      console.log(`   Cenário: ${pedroExample.scenario.substring(0, 100)}...`);
      
      // Corrigir a resposta
      pedroExample.answer = 25.5; // R$ 25,50
      pedroExample.explanation = "Poupança: R$ 1.500 × 0,5% = R$ 7,50. Fundos: R$ 900 × 1% = R$ 9,00. Ações: R$ 600 × 1,5% = R$ 9,00. Total: R$ 7,50 + R$ 9,00 + R$ 9,00 = R$ 25,50.";
      
      console.log(`\n✅ Correção aplicada:`);
      console.log(`   Nova resposta: R$ ${pedroExample.answer}`);
      console.log(`   Nova explicação: ${pedroExample.explanation}`);
      
      // Salvar no banco
      await lesson.save();
      console.log(`\n💾 Lição salva com sucesso!`);
      
    } else {
      console.log('❌ Exemplos não encontrados na lição!');
    }
    
    console.log('\n✅ Correção concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir cálculo:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

fixPedroCalculation();
