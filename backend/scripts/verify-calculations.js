#!/usr/bin/env node

/**
 * Script para verificar se os cálculos das lições estão corretos
 * Compara as respostas no banco com os cálculos esperados
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

// Função para calcular resposta esperada baseada no problema
function calculateExpectedAnswer(problem) {
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
  if (titleLower.includes('juros compostos') && 
      data.capital && data.taxa && data.tempo) {
    const taxaDecimal = data.taxa / 100;
    return data.capital * Math.pow(1 + taxaDecimal, data.tempo);
  }
  
  // Juros Simples
  if (titleLower.includes('juros simples')) {
    if (data.capital && data.taxa && data.tempo) {
      const taxaDecimal = data.taxa / 100;
      if (questionLower.includes('valor dos juros') && !questionLower.includes('montante')) {
        return data.capital * taxaDecimal * data.tempo; // Apenas juros
      } else if (questionLower.includes('montante')) {
        return data.capital * (1 + taxaDecimal * data.tempo); // Montante
      } else {
        // Se pergunta sobre "juros" mas não especifica, assumir montante total
        return data.capital * (1 + taxaDecimal * data.tempo);
      }
    }
  }
  
  // Troco/Contando Moedas
  if (titleLower.includes('troco') || titleLower.includes('contando')) {
    if (data.precoProduto && data.valorPago) {
      return data.valorPago - data.precoProduto;
    }
  }
  
  // Desconto em reais
  if (questionLower.includes('valor do desconto em reais') && 
      data.precoOriginal && data.percentualDesconto) {
    return data.precoOriginal * (data.percentualDesconto / 100);
  }
  
  // Aumento em reais
  if (questionLower.includes('aumento') && 
      questionLower.includes('reais') &&
      data.precoOriginal && data.percentualAumento) {
    return data.precoOriginal * (data.percentualAumento / 100);
  }
  
  // Novo preço com aumento
  if (questionLower.includes('novo preço') && 
      data.precoOriginal && data.percentualAumento) {
    // Se pergunta sobre "novo preço", calcular preço final
    // Se pergunta sobre "aumento em reais", calcular apenas o aumento
    if (questionLower.includes('aumento em reais') || questionLower.includes('valor do aumento')) {
      return data.precoOriginal * (data.percentualAumento / 100);
    } else {
      return data.precoOriginal * (1 + data.percentualAumento / 100);
    }
  }
  
  // Impostos
  if (titleLower.includes('imposto') || titleLower.includes('icms') || titleLower.includes('iss')) {
    if (data.precoProduto && data.percentualICMS) {
      return data.precoProduto * (data.percentualICMS / 100);
    }
    if (data.precoServico && data.percentualISS) {
      return data.precoServico * (data.percentualISS / 100);
    }
  }
  
  // Fluxo de Caixa
  if (titleLower.includes('fluxo') || titleLower.includes('poupança') || titleLower.includes('investimento')) {
    if (data.entradaInicial && data.rendimentoMensal && data.meses) {
      return data.entradaInicial + (data.rendimentoMensal * data.meses);
    }
    if (data.custoInicial && data.receitaMensal && data.meses) {
      return (data.receitaMensal * data.meses) - data.custoInicial;
    }
  }
  
  // Pesquisa de Preços
  if (titleLower.includes('preço') || titleLower.includes('comparação')) {
    if (data.precoLojaA && data.precoLojaB) {
      return Math.abs(data.precoLojaA - data.precoLojaB);
    }
  }
  
  // Derivativos
  if (questionLower.includes('valor intrínseco') && 
      titleLower.includes('opção put') &&
      data.precoAtual && data.precoExercicio) {
    return Math.max(0, data.precoExercicio - data.precoAtual);
  }
  
  if (questionLower.includes('valor intrínseco') && 
      titleLower.includes('opção call') &&
      data.precoAtual && data.precoExercicio) {
    return Math.max(0, data.precoAtual - data.precoExercicio);
  }
  
  return null;
}

// Função para verificar uma lição
function verifyLesson(lesson) {
  const issues = [];
  
  if (lesson.type === 'math-problems' && lesson.content && lesson.content.problems) {
    lesson.content.problems.forEach((problem, index) => {
      const expectedAnswer = calculateExpectedAnswer(problem);
      const actualAnswer = problem.answer;
      
      if (expectedAnswer !== null && actualAnswer !== undefined) {
        const tolerance = problem.tolerance || 0.01;
        const difference = Math.abs(expectedAnswer - actualAnswer);
        
        if (difference > tolerance) {
          issues.push({
            problem: index + 1,
            title: problem.title,
            question: problem.question,
            givenData: problem.givenData,
            expectedAnswer: expectedAnswer,
            actualAnswer: actualAnswer,
            difference: difference,
            tolerance: tolerance
          });
        }
      }
    });
  }
  
  return issues;
}

// Função principal
async function main() {
  log('magenta', '🧮 VERIFICADOR DE CÁLCULOS DAS LIÇÕES');
  log('magenta', '=====================================\n');
  
  try {
    // Conectar ao banco
    await connectDB();
    
    // Buscar todas as lições de Math Problems
    const mathLessons = await Lesson.find({ type: 'math-problems' });
    
    log('blue', `📊 Verificando ${mathLessons.length} lições de Math Problems\n`);
    
    let totalIssues = 0;
    let lessonsWithIssues = 0;
    
    for (const lesson of mathLessons) {
      log('cyan', `📚 Verificando: ${lesson.title}`);
      log('cyan', `   Módulo: ${lesson.module} | Ordem: ${lesson.order}`);
      
      const issues = verifyLesson(lesson);
      
      if (issues.length > 0) {
        lessonsWithIssues++;
        log('red', `\n❌ ${issues.length} cálculo(s) incorreto(s) encontrado(s):`);
        
        issues.forEach(issue => {
          log('red', `\n   📊 Problema ${issue.problem}: ${issue.title}`);
          log('yellow', `      Pergunta: ${issue.question}`);
          log('blue', `      Dados: ${JSON.stringify(issue.givenData)}`);
          log('green', `      Resposta esperada: ${issue.expectedAnswer.toFixed(2)}`);
          log('red', `      Resposta no banco: ${issue.actualAnswer}`);
          log('red', `      Diferença: ${issue.difference.toFixed(2)} (tolerância: ${issue.tolerance})`);
        });
        
        totalIssues += issues.length;
      } else {
        log('green', '✅ Todos os cálculos estão corretos');
      }
    }
    
    // Resumo final
    log('magenta', '\n📊 RESUMO FINAL');
    log('magenta', '================');
    log('blue', `📚 Total de lições verificadas: ${mathLessons.length}`);
    log('red', `❌ Lições com cálculos incorretos: ${lessonsWithIssues}`);
    log('red', `❌ Total de cálculos incorretos: ${totalIssues}`);
    
    if (totalIssues > 0) {
      log('yellow', '\n💡 RECOMENDAÇÕES:');
      log('yellow', '• Corrija as respostas incorretas no banco de dados');
      log('yellow', '• Verifique se os dados fornecidos estão corretos');
      log('yellow', '• Confirme se as fórmulas de cálculo estão aplicadas corretamente');
    } else {
      log('green', '\n🎉 Todos os cálculos estão corretos!');
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

module.exports = { calculateExpectedAnswer, verifyLesson };
