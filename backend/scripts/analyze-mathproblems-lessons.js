const mongoose = require('mongoose');
require('dotenv').config();

// Schema simplificado para Lesson
const lessonSchema = new mongoose.Schema({
  title: String,
  type: String,
  grade: String,
  module: Number,
  order: Number,
  content: mongoose.Schema.Types.Mixed
}, { strict: false });

const Lesson = mongoose.model('Lesson', lessonSchema);

async function analyzeMathProblemsLessons() {
  try {
    console.log('🔍 ANÁLISE COMPLETA DAS LIÇÕES MATH-PROBLEMS');
    console.log('═'.repeat(80));
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // Buscar todas as lições do tipo "math-problems"
    const lessons = await Lesson.find({ type: "math-problems" }).sort({ grade: 1, module: 1, order: 1 });
    
    console.log(`📚 Total de lições "math-problems" encontradas: ${lessons.length}\n`);
    
    // Agrupar por série
    const lessonsByGrade = {};
    lessons.forEach(lesson => {
      if (!lessonsByGrade[lesson.grade]) {
        lessonsByGrade[lesson.grade] = [];
      }
      lessonsByGrade[lesson.grade].push(lesson);
    });
    
    const grades = ['6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º Ano EM', '2º Ano EM', '3º Ano EM'];
    
    let totalProblems = 0;
    let totalTips = 0;
    let lessonsWithIssues = [];
    let lessonsWithGoodContent = 0;
    
    grades.forEach(grade => {
      if (lessonsByGrade[grade]) {
        console.log('\n' + '═'.repeat(80));
        console.log(`🎓 ${grade.toUpperCase()}`);
        console.log('═'.repeat(80));
        
        lessonsByGrade[grade].forEach((lesson, index) => {
          console.log(`\n${index + 1}. 📖 ${lesson.title}`);
          console.log('─'.repeat(80));
          console.log(`   🆔 ID: ${lesson._id}`);
          console.log(`   📦 Módulo ${lesson.module} | Ordem ${lesson.order}`);
          
          const content = lesson.content;
          
          // Contar elementos
          const numProblems = content?.problems?.length || 0;
          const numTips = content?.tips?.length || 0;
          const numCategories = content?.categories?.length || 0;
          
          console.log(`   📊 Estatísticas:`);
          console.log(`      • Problemas: ${numProblems}`);
          console.log(`      • Dicas: ${numTips}`);
          console.log(`      • Categorias: ${numCategories}`);
          
          // Verificar qualidade do conteúdo
          const hasGoodContent = numProblems >= 3 && numTips >= 5;
          const qualityStatus = hasGoodContent ? '🟢 EXCELENTE' : '🟡 BOM';
          
          console.log(`   🎯 Qualidade: ${qualityStatus}`);
          
          if (hasGoodContent) {
            lessonsWithGoodContent++;
          }
          
          // Analisar problemas em detalhes
          if (content?.problems && content.problems.length > 0) {
            console.log(`\n   💡 Problemas encontrados:`);
            content.problems.forEach((problem, i) => {
              console.log(`      ${i + 1}. ${problem.title || 'Sem título'}`);
              console.log(`         Dificuldade: ${problem.difficulty || 'Não especificada'}`);
              console.log(`         Situação: ${problem.situation ? problem.situation.substring(0, 80) + '...' : 'Não especificada'}`);
              
              // Verificar se há dados fornecidos
              if (problem.providedData && problem.providedData.length > 0) {
                console.log(`         Dados: ${problem.providedData.length} itens`);
                problem.providedData.forEach((data, j) => {
                  console.log(`            ${j + 1}. ${data.label}: ${data.value}`);
                });
              }
              
              // Verificar se há dicas
              if (problem.tip) {
                console.log(`         Dica: ${problem.tip.substring(0, 60)}...`);
              }
              
              // Verificar se há resposta
              if (problem.answer !== undefined) {
                console.log(`         Resposta: ${problem.answer}`);
              }
              
              // Verificar se há explicação
              if (problem.explanation) {
                console.log(`         Explicação: ${problem.explanation.substring(0, 60)}...`);
              }
              
              // Identificar possíveis problemas
              const issues = [];
              if (!problem.situation) issues.push('Sem situação');
              if (!problem.answer && problem.answer !== 0) issues.push('Sem resposta');
              if (!problem.explanation) issues.push('Sem explicação');
              if (!problem.tip) issues.push('Sem dica');
              if (problem.providedData && problem.providedData.length === 0) issues.push('Sem dados fornecidos');
              
              if (issues.length > 0) {
                console.log(`         ⚠️  Problemas: ${issues.join(', ')}`);
                lessonsWithIssues.push({
                  lesson: lesson.title,
                  grade: lesson.grade,
                  problem: i + 1,
                  issues: issues
                });
              }
              
              console.log('         ────────────────────────────────────────────');
            });
          }
          
          // Verificar categorias
          if (content?.categories && content.categories.length > 0) {
            console.log(`\n   🏷️  Categorias:`);
            content.categories.forEach((cat, i) => {
              console.log(`      ${i + 1}. ${cat.icon || '📊'} ${cat.name || 'Sem nome'}`);
            });
          }
          
          // Verificar dicas gerais
          if (content?.tips && content.tips.length > 0) {
            console.log(`\n   💡 Dicas gerais (primeiras 3):`);
            content.tips.slice(0, 3).forEach((tip, i) => {
              console.log(`      ${i + 1}. ${tip.substring(0, 80)}...`);
            });
          }
          
          // Acumular totais
          totalProblems += numProblems;
          totalTips += numTips;
        });
      }
    });
    
    console.log('\n\n' + '═'.repeat(80));
    console.log('📊 RESUMO GERAL DA ANÁLISE');
    console.log('═'.repeat(80));
    
    console.log(`\n📚 Lições por série:`);
    grades.forEach(grade => {
      const count = lessonsByGrade[grade]?.length || 0;
      if (count > 0) {
        console.log(`   ${grade}: ${count} lição(ões)`);
      }
    });
    
    console.log(`\n📈 Estatísticas totais:`);
    console.log(`   • Total de lições: ${lessons.length}`);
    console.log(`   • Total de problemas: ${totalProblems}`);
    console.log(`   • Total de dicas: ${totalTips}`);
    console.log(`   • Lições com conteúdo excelente: ${lessonsWithGoodContent}/${lessons.length}`);
    
    console.log(`\n📊 Médias por lição:`);
    console.log(`   • Problemas por lição: ${(totalProblems / lessons.length).toFixed(1)}`);
    console.log(`   • Dicas por lição: ${(totalTips / lessons.length).toFixed(1)}`);
    
    console.log(`\n🎯 Qualidade geral:`);
    const qualityPercentage = (lessonsWithGoodContent / lessons.length) * 100;
    console.log(`   • ${qualityPercentage.toFixed(1)}% das lições têm conteúdo excelente`);
    
    if (lessonsWithIssues.length > 0) {
      console.log(`\n⚠️  PROBLEMAS IDENTIFICADOS (${lessonsWithIssues.length}):`);
      lessonsWithIssues.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.lesson} (${item.grade}) - Problema ${item.problem}`);
        console.log(`      Problemas: ${item.issues.join(', ')}`);
      });
    }
    
    console.log(`\n🔧 AÇÕES RECOMENDADAS:`);
    console.log(`   • Enriquecer lições com poucos problemas (mínimo 4-5)`);
    console.log(`   • Adicionar mais dicas pedagógicas (mínimo 8-10)`);
    console.log(`   • Corrigir problemas identificados`);
    console.log(`   • Verificar cálculos e respostas`);
    console.log(`   • Melhorar explicações dos problemas`);
    console.log(`   • Verificar dicas irrelevantes (como a do CDB)`);
    
    if (qualityPercentage >= 90) {
      console.log(`\n🏆 EXCELENTE! Quase todas as lições estão com conteúdo rico!`);
    } else if (qualityPercentage >= 70) {
      console.log(`\n👍 BOM! Maioria das lições está bem estruturada!`);
    } else {
      console.log(`\n⚠️  Várias lições precisam de melhorias significativas!`);
    }
    
    console.log('\n✅ Análise concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao analisar lições:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

analyzeMathProblemsLessons();
