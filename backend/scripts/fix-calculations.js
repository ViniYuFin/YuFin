#!/usr/bin/env node

/**
 * Script para corrigir os cálculos incorretos nas lições
 * Atualiza as respostas no banco de dados com os valores corretos
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
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://Vinicius:081023%40Jeova@cluster0.ow4ruvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    log('green', '✅ Conectado ao MongoDB com sucesso!');
  } catch (error) {
    log('red', `❌ Erro ao conectar com MongoDB: ${error.message}`);
    process.exit(1);
  }
}

// Função para calcular resposta correta
function calculateCorrectAnswer(problem) {
  const { givenData, question, title } = problem;
  
  if (!givenData || !question) {
    return null;
  }
  
  // Converter dados para números
  const data = {};
  for (const [key, value] of Object.entries(givenData)) {
    data[key] = parseFloat(value);
  }
  
  // Cálculos específicos por tipo de problema
  const questionLower = question.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // Juros Compostos
  if (titleLower.includes('juros compostos')) {
    if (data.capital && data.taxa && data.tempo) {
      const taxaDecimal = data.taxa / 100; // Converter % para decimal
      return data.capital * Math.pow(1 + taxaDecimal, data.tempo);
    }
  }
  
  // Juros Simples
  if (titleLower.includes('juros simples')) {
    if (data.capital && data.taxa && data.tempo) {
      const taxaDecimal = data.taxa / 100; // Converter % para decimal
      if (questionLower.includes('juros')) {
        return data.capital * taxaDecimal * data.tempo; // Apenas os juros
      } else {
        return data.capital * (1 + taxaDecimal * data.tempo); // Montante total
      }
    }
  }
  
  // Troco/Contando Moedas
  if (titleLower.includes('troco') || titleLower.includes('contando')) {
    if (data.precoProduto && data.valorPago) {
      // Se tem fórmula específica para contar moedas, usar ela
      if (problem.formula && problem.formula.includes('moedas')) {
        // Calcular baseado nos steps fornecidos
        if (problem.steps && problem.steps.length > 0) {
          // Extrair números dos steps
          const lastStep = problem.steps[problem.steps.length - 1];
          const match = lastStep.match(/(\d+[.,]\d+)/);
          if (match) {
            return parseFloat(match[1].replace(',', '.'));
          }
        }
      }
      // Caso contrário, calcular troco simples
      return data.valorPago - data.precoProduto;
    }
  }
  
  // Porcentagens - Desconto
  if (titleLower.includes('desconto')) {
    if (data.precoOriginal && data.percentualDesconto) {
      return data.precoOriginal * (data.percentualDesconto / 100);
    }
  }
  
  // Porcentagens - Aumento
  if (titleLower.includes('aumento') || titleLower.includes('preço com')) {
    if (data.precoOriginal && data.percentualAumento) {
      return data.precoOriginal * (data.percentualAumento / 100);
    }
  }
  
  // Impostos
  if (titleLower.includes('icms')) {
    if (data.precoProduto && data.percentualICMS) {
      return data.precoProduto * (data.percentualICMS / 100);
    }
  }
  
  if (titleLower.includes('iss')) {
    if (data.precoServico && data.percentualISS) {
      return data.precoServico * (data.percentualISS / 100);
    }
  }
  
  // Opções
  if (titleLower.includes('opção put')) {
    if (data.precoAtual && data.precoExercicio) {
      return Math.max(0, data.precoExercicio - data.precoAtual);
    }
  }
  
  if (titleLower.includes('opção call')) {
    if (data.precoAtual && data.precoExercicio) {
      return Math.max(0, data.precoAtual - data.precoExercicio);
    }
  }
  
  // Pesquisa de Preços
  if (titleLower.includes('economiza') || titleLower.includes('comparação')) {
    if (data.precoLojaA && data.precoLojaB) {
      return Math.abs(data.precoLojaA - data.precoLojaB);
    }
  }
  
  return null;
}

// Função para corrigir uma lição
async function fixLesson(lesson) {
  let corrections = 0;
  
  if (lesson.type === 'math-problems' && lesson.content && lesson.content.problems) {
    for (let i = 0; i < lesson.content.problems.length; i++) {
      const problem = lesson.content.problems[i];
      const correctAnswer = calculateCorrectAnswer(problem);
      const currentAnswer = problem.answer;
      
      if (correctAnswer !== null && currentAnswer !== undefined) {
        const tolerance = problem.tolerance || 0.01;
        const difference = Math.abs(correctAnswer - currentAnswer);
        
        if (difference > tolerance) {
          log('yellow', `   🔧 Corrigindo problema ${i + 1}: ${problem.title}`);
          log('red', `      Resposta atual: ${currentAnswer}`);
          log('green', `      Resposta correta: ${correctAnswer.toFixed(2)}`);
          
          // Atualizar a resposta
          lesson.content.problems[i].answer = correctAnswer;
          corrections++;
        }
      }
    }
    
    // Salvar no banco se houve correções
    if (corrections > 0) {
      await lesson.save();
      log('green', `   ✅ ${corrections} correção(ões) aplicada(s)`);
    }
  }
  
  return corrections;
}

// Função principal
async function main() {
  log('magenta', '🔧 CORRETOR DE CÁLCULOS DAS LIÇÕES');
  log('magenta', '==================================\n');
  
  try {
    // Conectar ao banco
    await connectDB();
    
    // Buscar todas as lições de Math Problems
    const mathLessons = await Lesson.find({ type: 'math-problems' });
    
    log('blue', `📊 Corrigindo ${mathLessons.length} lições de Math Problems\n`);
    
    let totalCorrections = 0;
    let lessonsFixed = 0;
    
    for (const lesson of mathLessons) {
      log('cyan', `📚 Corrigindo: ${lesson.title}`);
      log('cyan', `   Módulo: ${lesson.module} | Ordem: ${lesson.order}`);
      
      const corrections = await fixLesson(lesson);
      
      if (corrections > 0) {
        lessonsFixed++;
        totalCorrections += corrections;
      } else {
        log('green', '   ✅ Nenhuma correção necessária');
      }
    }
    
    // Resumo final
    log('magenta', '\n📊 RESUMO FINAL');
    log('magenta', '================');
    log('blue', `📚 Total de lições verificadas: ${mathLessons.length}`);
    log('green', `✅ Lições corrigidas: ${lessonsFixed}`);
    log('green', `🔧 Total de correções aplicadas: ${totalCorrections}`);
    
    if (totalCorrections > 0) {
      log('yellow', '\n💡 CORREÇÕES APLICADAS:');
      log('yellow', '• Todas as respostas incorretas foram corrigidas');
      log('yellow', '• Os cálculos agora estão matematicamente corretos');
      log('yellow', '• Execute o script de verificação novamente para confirmar');
    } else {
      log('green', '\n🎉 Todas as lições já estavam corretas!');
    }
    
  } catch (error) {
    log('red', `❌ Erro durante a correção: ${error.message}`);
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

module.exports = { calculateCorrectAnswer, fixLesson };
