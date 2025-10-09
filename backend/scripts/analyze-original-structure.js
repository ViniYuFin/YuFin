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

async function analyzeOriginalStructure() {
  try {
    console.log('🔍 ANALISANDO ESTRUTURA ORIGINAL DAS LIÇÕES 8º E 9º ANO');
    console.log('═'.repeat(80));
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // Buscar lições do 8º e 9º Ano que não foram alteradas
    const lessons = await Lesson.find({ 
      type: "math-problems",
      grade: { $in: ["8º Ano", "9º Ano"] }
    });
    
    console.log(`📚 Encontradas ${lessons.length} lições para analisar\n`);
    
    lessons.forEach((lesson, index) => {
      console.log(`\n${index + 1}. 📖 ${lesson.title} (${lesson.grade})`);
      console.log('─'.repeat(80));
      console.log(`   🆔 ID: ${lesson._id}`);
      
      const content = lesson.content;
      
      // Analisar estrutura dos problemas
      if (content.problems && content.problems.length > 0) {
        console.log(`\n   📊 Estrutura dos problemas:`);
        const firstProblem = content.problems[0];
        
        console.log(`   Propriedades do problema:`);
        Object.keys(firstProblem).forEach(key => {
          const value = firstProblem[key];
          if (typeof value === 'string') {
            console.log(`      • ${key}: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);
          } else if (typeof value === 'number') {
            console.log(`      • ${key}: ${value}`);
          } else if (Array.isArray(value)) {
            console.log(`      • ${key}: [array com ${value.length} itens]`);
            if (value.length > 0 && typeof value[0] === 'object') {
              console.log(`        Estrutura dos itens: ${Object.keys(value[0]).join(', ')}`);
            }
          } else if (typeof value === 'object' && value !== null) {
            console.log(`      • ${key}: {objeto com ${Object.keys(value).length} propriedades}`);
          } else {
            console.log(`      • ${key}: ${value}`);
          }
        });
        
        console.log(`\n   📝 Exemplo completo do primeiro problema:`);
        console.log(JSON.stringify(firstProblem, null, 2));
      }
      
      // Analisar outras propriedades do content
      console.log(`\n   📋 Outras propriedades do content:`);
      Object.keys(content).forEach(key => {
        if (key !== 'problems') {
          const value = content[key];
          if (Array.isArray(value)) {
            console.log(`      • ${key}: [array com ${value.length} itens]`);
          } else if (typeof value === 'string') {
            console.log(`      • ${key}: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);
          } else {
            console.log(`      • ${key}: ${typeof value}`);
          }
        }
      });
    });
    
    console.log('\n═'.repeat(80));
    console.log('✅ Análise da estrutura original concluída!');
    console.log('🔌 Desconectado do MongoDB');
    
  } catch (error) {
    console.error('❌ Erro ao analisar estrutura:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

analyzeOriginalStructure();
