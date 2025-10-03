#!/usr/bin/env node

/**
 * Script para verificar cálculos em lições de Math Problems e Goals
 * Acessa o banco de dados MongoDB e identifica problemas com validação de respostas
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para conectar ao banco
async function connectDB() {
  try {
    // String de conexão com fallback
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    if (!process.env.MONGODB_URI) {
      log('yellow', '⚠️  MONGODB_URI não encontrada no .env, usando fallback: mongodb://localhost:27017/yufin');
    }
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    log('green', '✅ Conectado ao MongoDB com sucesso!');
  } catch (error) {
    log('red', `❌ Erro ao conectar com MongoDB: ${error.message}`);
    log('yellow', '💡 Verifique se o MongoDB está rodando ou se a string de conexão está correta');
    process.exit(1);
  }
}

// Função para verificar cálculos em Math Problems
function checkMathProblems(lesson) {
  const issues = [];
  
  if (lesson.type === 'math-problems' && lesson.content && lesson.content.problems) {
    lesson.content.problems.forEach((problem, index) => {
      log('cyan', `\n📊 Verificando problema ${index + 1}: ${problem.title || 'Sem título'}`);
      
      // Verificar se tem pergunta
      if (!problem.question) {
        issues.push({
          type: 'missing_question',
          problem: index + 1,
          message: 'Pergunta não encontrada'
        });
      }
      
      // Verificar se tem resposta esperada (pode ser 'answer' ou 'expectedAnswer')
      if (!problem.answer && !problem.expectedAnswer) {
        issues.push({
          type: 'missing_expected_answer',
          problem: index + 1,
          message: 'Resposta esperada não encontrada (answer ou expectedAnswer)'
        });
      }
      
      // Verificar se tem dados fornecidos (pode ser objeto ou array)
      if (!problem.givenData) {
        issues.push({
          type: 'missing_given_data',
          problem: index + 1,
          message: 'Dados fornecidos não encontrados'
        });
      } else {
        // Se for objeto, mostrar as chaves
        if (typeof problem.givenData === 'object' && !Array.isArray(problem.givenData)) {
          const dataKeys = Object.keys(problem.givenData);
          log('blue', `   Dados fornecidos: ${dataKeys.join(', ')}`);
        } else if (Array.isArray(problem.givenData)) {
          const dataKeys = problem.givenData.map(item => item.label || item.name || 'Sem label');
          log('blue', `   Dados fornecidos: ${dataKeys.join(', ')}`);
        }
      }
      
      // Verificar se a resposta esperada é numérica
      const answer = problem.answer || problem.expectedAnswer;
      if (answer) {
        const expectedNum = parseFloat(answer);
        if (isNaN(expectedNum)) {
          issues.push({
            type: 'non_numeric_answer',
            problem: index + 1,
            message: `Resposta esperada não é numérica: ${answer}`
          });
        } else {
          log('green', `   Resposta esperada: ${answer}`);
        }
      }
      
      // Verificar se tem função de validação (opcional para Math Problems)
      if (!problem.validateAnswer) {
        log('yellow', `   ⚠️  Função de validação não encontrada (opcional para Math Problems)`);
      }
      
      // Verificar se tem função de cálculo (opcional para Math Problems)
      if (!problem.calculateAnswer) {
        log('yellow', `   ⚠️  Função de cálculo não encontrada (opcional para Math Problems)`);
      }
    });
  }
  
  return issues;
}

// Função para verificar cálculos em Goals
function checkGoals(lesson) {
  const issues = [];
  
  if (lesson.type === 'goals' && lesson.content && lesson.content.goals) {
    lesson.content.goals.forEach((goal, index) => {
      log('cyan', `\n🎯 Verificando meta ${index + 1}: ${goal.title || 'Sem título'}`);
      
      // Verificar se tem pergunta
      if (!goal.question) {
        issues.push({
          type: 'missing_question',
          goal: index + 1,
          message: 'Pergunta não encontrada'
        });
      }
      
      // Verificar se tem resposta esperada
      if (!goal.expectedAnswer) {
        issues.push({
          type: 'missing_expected_answer',
          goal: index + 1,
          message: 'Resposta esperada não encontrada'
        });
      }
      
      // Verificar se tem dados de entrada
      if (!goal.inputData) {
        issues.push({
          type: 'missing_input_data',
          goal: index + 1,
          message: 'Dados de entrada não encontrados'
        });
      }
      
      // Verificar se a resposta esperada é numérica
      if (goal.expectedAnswer) {
        const expectedNum = parseFloat(goal.expectedAnswer);
        if (isNaN(expectedNum)) {
          issues.push({
            type: 'non_numeric_answer',
            goal: index + 1,
            message: `Resposta esperada não é numérica: ${goal.expectedAnswer}`
          });
        } else {
          log('green', `   Resposta esperada: ${goal.expectedAnswer}`);
        }
      }
      
      // Verificar se tem função de validação
      if (!goal.validateAnswer) {
        issues.push({
          type: 'missing_validation_function',
          goal: index + 1,
          message: 'Função de validação não encontrada'
        });
      }
      
      // Verificar se tem função de cálculo
      if (!goal.calculateAnswer) {
        issues.push({
          type: 'missing_calculation_function',
          goal: index + 1,
          message: 'Função de cálculo não encontrada'
        });
      }
    });
  }
  
  return issues;
}

// Função para testar validação de respostas
async function testAnswerValidation(lesson) {
  const issues = [];
  
  if (lesson.type === 'math-problems' && lesson.content && lesson.content.problems) {
    for (let i = 0; i < lesson.content.problems.length; i++) {
      const problem = lesson.content.problems[i];
      
      if (problem.validateAnswer && problem.expectedAnswer) {
        try {
          // Testar com a resposta esperada
          const isValid = problem.validateAnswer(problem.expectedAnswer);
          if (!isValid) {
            issues.push({
              type: 'validation_fails_expected_answer',
              problem: i + 1,
              message: `Validação falha para resposta esperada: ${problem.expectedAnswer}`
            });
          }
          
          // Testar com resposta incorreta
          const wrongAnswer = parseFloat(problem.expectedAnswer) + 1;
          const isInvalid = problem.validateAnswer(wrongAnswer);
          if (isInvalid) {
            issues.push({
              type: 'validation_accepts_wrong_answer',
              problem: i + 1,
              message: `Validação aceita resposta incorreta: ${wrongAnswer}`
            });
          }
        } catch (error) {
          issues.push({
            type: 'validation_error',
            problem: i + 1,
            message: `Erro na validação: ${error.message}`
          });
        }
      }
    }
  }
  
  if (lesson.type === 'goals' && lesson.content && lesson.content.goals) {
    for (let i = 0; i < lesson.content.goals.length; i++) {
      const goal = lesson.content.goals[i];
      
      if (goal.validateAnswer && goal.expectedAnswer) {
        try {
          // Testar com a resposta esperada
          const isValid = goal.validateAnswer(goal.expectedAnswer);
          if (!isValid) {
            issues.push({
              type: 'validation_fails_expected_answer',
              goal: i + 1,
              message: `Validação falha para resposta esperada: ${goal.expectedAnswer}`
            });
          }
          
          // Testar com resposta incorreta
          const wrongAnswer = parseFloat(goal.expectedAnswer) + 1;
          const isInvalid = goal.validateAnswer(wrongAnswer);
          if (isInvalid) {
            issues.push({
              type: 'validation_accepts_wrong_answer',
              goal: i + 1,
              message: `Validação aceita resposta incorreta: ${wrongAnswer}`
            });
          }
        } catch (error) {
          issues.push({
            type: 'validation_error',
            goal: i + 1,
            message: `Erro na validação: ${error.message}`
          });
        }
      }
    }
  }
  
  return issues;
}

// Função principal
async function main() {
  log('magenta', '🔍 VERIFICADOR DE CÁLCULOS EM LIÇÕES (MongoDB)');
  log('magenta', '================================================\n');
  
  try {
    // Conectar ao banco
    await connectDB();
    
    // Buscar lições de Math Problems e Goals
    const mathProblemsLessons = await Lesson.find({ type: 'math-problems' });
    const goalsLessons = await Lesson.find({ type: 'goals' });
    
    log('blue', `📊 Lições de Math Problems encontradas: ${mathProblemsLessons.length}`);
    log('blue', `🎯 Lições de Goals encontradas: ${goalsLessons.length}\n`);
    
    let totalIssues = 0;
    let lessonsWithIssues = 0;
    
    // Verificar lições de Math Problems
    for (const lesson of mathProblemsLessons) {
      log('yellow', `\n📚 Verificando: ${lesson.title}`);
      log('yellow', `   ID: ${lesson._id}`);
      log('yellow', `   Módulo: ${lesson.module} | Ordem: ${lesson.order}`);
      
      const issues = checkMathProblems(lesson);
      const validationIssues = await testAnswerValidation(lesson);
      const allIssues = [...issues, ...validationIssues];
      
      if (allIssues.length > 0) {
        lessonsWithIssues++;
        log('red', `\n❌ ${allIssues.length} problema(s) encontrado(s):`);
        allIssues.forEach(issue => {
          log('red', `   • ${issue.message}`);
          if (issue.problem) log('red', `     Problema: ${issue.problem}`);
          if (issue.goal) log('red', `     Meta: ${issue.goal}`);
        });
        totalIssues += allIssues.length;
      } else {
        log('green', '✅ Nenhum problema encontrado');
      }
    }
    
    // Verificar lições de Goals
    for (const lesson of goalsLessons) {
      log('yellow', `\n📚 Verificando: ${lesson.title}`);
      log('yellow', `   ID: ${lesson._id}`);
      log('yellow', `   Módulo: ${lesson.module} | Ordem: ${lesson.order}`);
      
      const issues = checkGoals(lesson);
      const validationIssues = await testAnswerValidation(lesson);
      const allIssues = [...issues, ...validationIssues];
      
      if (allIssues.length > 0) {
        lessonsWithIssues++;
        log('red', `\n❌ ${allIssues.length} problema(s) encontrado(s):`);
        allIssues.forEach(issue => {
          log('red', `   • ${issue.message}`);
          if (issue.problem) log('red', `     Problema: ${issue.problem}`);
          if (issue.goal) log('red', `     Meta: ${issue.goal}`);
        });
        totalIssues += allIssues.length;
      } else {
        log('green', '✅ Nenhum problema encontrado');
      }
    }
    
    // Resumo final
    log('magenta', '\n📊 RESUMO FINAL');
    log('magenta', '================');
    log('blue', `🧮 Lições de Math Problems: ${mathProblemsLessons.length}`);
    log('blue', `🎯 Lições de Goals: ${goalsLessons.length}`);
    log('blue', `📚 Total de lições verificadas: ${mathProblemsLessons.length + goalsLessons.length}`);
    log('red', `❌ Lições com problemas: ${lessonsWithIssues}`);
    log('red', `❌ Total de problemas encontrados: ${totalIssues}`);
    
    if (totalIssues > 0) {
      log('yellow', '\n💡 RECOMENDAÇÕES:');
      log('yellow', '• Verifique as respostas esperadas no banco');
      log('yellow', '• Confirme se os cálculos estão corretos');
      log('yellow', '• Teste as funções de validação');
      log('yellow', '• Verifique se os dados fornecidos são suficientes');
      log('yellow', '• Considere recriar lições com problemas críticos');
    } else {
      log('green', '\n🎉 Todas as lições estão corretas!');
    }
    
  } catch (error) {
    log('red', `❌ Erro durante a verificação: ${error.message}`);
  } finally {
    // Fechar conexão
    await mongoose.connection.close();
    log('blue', '🔌 Conexão com MongoDB fechada');
  }
}

// Executar script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkMathProblems, checkGoals, testAnswerValidation };
