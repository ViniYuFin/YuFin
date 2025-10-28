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

async function checkAllMathProblems() {
  try {
    console.log('🔍 VERIFICAÇÃO COMPLETA DAS LIÇÕES MATH-PROBLEMS');
    console.log('═'.repeat(80));
    
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI não encontrada no arquivo .env');
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // Buscar todas as lições math-problems
    const lessons = await Lesson.find({ type: "math-problems" }).sort({ grade: 1, module: 1, order: 1 });
    
    console.log(`📚 Total de lições math-problems: ${lessons.length}\n`);
    
    let totalProblems = 0;
    let problemsWithIssues = [];
    
    for (const lesson of lessons) {
      console.log(`🎓 ${lesson.grade} - ${lesson.title}`);
      console.log('─'.repeat(60));
      
      if (!lesson.content || !lesson.content.problems) {
        console.log('   ❌ SEM PROBLEMAS ENCONTRADOS');
        continue;
      }
      
      const problems = lesson.content.problems;
      totalProblems += problems.length;
      
      problems.forEach((problem, index) => {
        const problemNum = index + 1;
        let issues = [];
        
        // Verificar se tem situação
        if (!problem.situation) {
          issues.push('Sem situação');
        }
        
        // Verificar se tem dica
        if (!problem.hint) {
          issues.push('Sem dica');
        }
        
        // Verificar se tem pergunta clara
        if (!problem.question) {
          issues.push('Sem pergunta');
        }
        
        // Verificar se tem resposta
        if (problem.answer === undefined || problem.answer === null) {
          issues.push('Sem resposta');
        }
        
        // Verificar se tem explicação
        if (!problem.explanation) {
          issues.push('Sem explicação');
        }
        
        // Verificar problemas específicos conhecidos
        if (lesson.title === "Pesquisa de Preços" && problemNum === 2) {
          if (problem.answer === 10.5 && problem.question !== "Qual o preço da opção mais barata?") {
            issues.push('Pergunta confusa - deveria perguntar sobre o preço da opção mais barata');
          }
        }
        
        if (lesson.title === "Pesquisa de Preços" && problemNum === 4) {
          if (problem.answer === 33) {
            issues.push('Ambas as lojas têm o mesmo preço - sem desafio real');
          }
        }
        
        if (lesson.title === "Juros Simples" && problemNum === 5) {
          if (problem.answer === 96 && problem.question !== "Qual é a diferença entre as duas opções?") {
            issues.push('Pergunta confusa - deveria perguntar sobre a diferença');
          }
        }
        
        if (lesson.title === "Contando Moedas e Notas" && problemNum === 4) {
          if (problem.answer !== 1140) {
            issues.push(`Resposta incorreta - deveria ser 1140, mas está ${problem.answer}`);
          }
        }
        
        // Verificar respostas que parecem incorretas
        if (problem.answer && typeof problem.answer === 'number') {
          // Verificar se a resposta faz sentido baseada na pergunta
          if (lesson.title === "Contando Moedas e Notas" && problemNum === 2) {
            if (problem.answer === 1.25) {
              issues.push('Resposta incorreta - deveria ser 7.00');
            }
          }
          
          if (lesson.title === "Contando Moedas e Notas" && problemNum === 3) {
            if (Math.abs(problem.answer - 2.70) > 0.01) {
              issues.push(`Resposta incorreta - deveria ser 2.70, mas está ${problem.answer}`);
            }
          }
          
          if (lesson.title === "Contando Moedas e Notas" && problemNum === 5) {
            if (problem.answer !== 3) {
              issues.push(`Resposta incorreta - deveria ser 3, mas está ${problem.answer}`);
            }
          }
          
          if (lesson.title === "Porcentagens no dia a dia" && problemNum === 1) {
            if (problem.answer !== 12) {
              issues.push(`Resposta incorreta - deveria ser 12, mas está ${problem.answer}`);
            }
          }
          
          if (lesson.title === "Porcentagens no dia a dia" && problemNum === 2) {
            if (problem.answer !== 90) {
              issues.push(`Resposta incorreta - deveria ser 90, mas está ${problem.answer}`);
            }
          }
          
          if (lesson.title === "Pesquisa de Preços" && problemNum === 1) {
            if (Math.abs(problem.answer - 0.60) > 0.01) {
              issues.push(`Resposta incorreta - deveria ser 0.60, mas está ${problem.answer}`);
            }
          }
          
          if (lesson.title === "Pesquisa de Preços" && problemNum === 3) {
            if (problem.answer !== 36) {
              issues.push(`Resposta incorreta - deveria ser 36, mas está ${problem.answer}`);
            }
          }
          
          if (lesson.title === "Pesquisa de Preços" && problemNum === 5) {
            if (problem.answer !== 50) {
              issues.push(`Resposta incorreta - deveria ser 50, mas está ${problem.answer}`);
            }
          }
        }
        
        if (issues.length > 0) {
          problemsWithIssues.push({
            lesson: lesson.title,
            grade: lesson.grade,
            problem: problemNum,
            title: problem.title,
            issues: issues,
            currentAnswer: problem.answer,
            question: problem.question
          });
          
          console.log(`   ⚠️  Problema ${problemNum}: ${problem.title}`);
          console.log(`      Pergunta: ${problem.question || 'Não especificada'}`);
          console.log(`      Resposta: ${problem.answer}`);
          console.log(`      Problemas: ${issues.join(', ')}`);
        } else {
          console.log(`   ✅ Problema ${problemNum}: ${problem.title} - OK`);
        }
      });
      
      console.log('');
    }
    
    console.log('═'.repeat(80));
    console.log('📊 RESUMO DA VERIFICAÇÃO');
    console.log('═'.repeat(80));
    
    console.log(`📚 Total de lições verificadas: ${lessons.length}`);
    console.log(`🔢 Total de problemas verificados: ${totalProblems}`);
    console.log(`⚠️  Problemas com questões: ${problemsWithIssues.length}`);
    
    if (problemsWithIssues.length > 0) {
      console.log('\n🚨 PROBLEMAS ENCONTRADOS:');
      problemsWithIssues.forEach((p, index) => {
        console.log(`\n${index + 1}. ${p.lesson} (${p.grade}) - Problema ${p.problem}`);
        console.log(`   Pergunta: ${p.question}`);
        console.log(`   Resposta atual: ${p.currentAnswer}`);
        console.log(`   Problemas: ${p.issues.join(', ')}`);
      });
      
      console.log('\n🔧 AÇÕES NECESSÁRIAS:');
      console.log('   • Corrigir respostas incorretas');
      console.log('   • Melhorar perguntas confusas');
      console.log('   • Adicionar situações e dicas faltantes');
      console.log('   • Verificar cálculos matemáticos');
    } else {
      console.log('\n🎉 TODAS AS LIÇÕES ESTÃO CORRETAS!');
    }
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar lições:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

checkAllMathProblems();
