#!/usr/bin/env node

/**
 * Script para analisar TODAS as lições de Math Problems
 * Identifica inconsistências entre pergunta, dados e resposta
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

// Função para calcular resposta esperada baseada na pergunta
function calculateExpectedAnswer(problem) {
  const { question, title, givenData, formula, steps } = problem;
  
  if (!givenData || !question) {
    return null;
  }
  
  // Converter dados para números
  const data = {};
  for (const [key, value] of Object.entries(givenData)) {
    data[key] = parseFloat(value);
  }
  
  const questionLower = question.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // 1. TROCO SIMPLES
  if (questionLower.includes('quanto de troco') && 
      questionLower.includes('deve dar ao cliente') &&
      data.precoProduto && data.valorPago) {
    return data.valorPago - data.precoProduto;
  }
  
  // 2. JUROS COMPOSTOS
  if (titleLower.includes('juros compostos') && 
      data.capital && data.taxa && data.tempo) {
    const taxaDecimal = data.taxa / 100;
    return data.capital * Math.pow(1 + taxaDecimal, data.tempo);
  }
  
  // 3. JUROS SIMPLES
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
  
  // 4. DESCONTO EM REAIS
  if (questionLower.includes('valor do desconto em reais') && 
      data.precoOriginal && data.percentualDesconto) {
    return data.precoOriginal * (data.percentualDesconto / 100);
  }
  
  // 5. NOVO PREÇO COM DESCONTO
  if (questionLower.includes('novo preço') && 
      data.precoOriginal && data.percentualDesconto) {
    return data.precoOriginal * (1 - data.percentualDesconto / 100);
  }
  
  // 6. AUMENTO EM REAIS
  if (questionLower.includes('aumento') && 
      questionLower.includes('reais') &&
      data.precoOriginal && data.percentualAumento) {
    return data.precoOriginal * (data.percentualAumento / 100);
  }
  
  // 7. NOVO PREÇO COM AUMENTO
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
  
  // 8. IMPOSTOS
  if (questionLower.includes('valor do icms') && 
      data.precoProduto && data.percentualICMS) {
    return data.precoProduto * (data.percentualICMS / 100);
  }
  
  if (questionLower.includes('valor do iss') && 
      data.precoServico && data.percentualISS) {
    return data.precoServico * (data.percentualISS / 100);
  }
  
  // 9. ECONOMIA/COMPARAÇÃO
  if (questionLower.includes('economiza') && 
      data.precoLojaA && data.precoLojaB) {
    return Math.abs(data.precoLojaA - data.precoLojaB);
  }
  
  // 10. OPÇÕES
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
  
  // 11. FLUXO DE CAIXA
  if (titleLower.includes('fluxo') || titleLower.includes('poupança')) {
    if (data.entradaInicial && data.rendimentoMensal && data.meses) {
      return data.entradaInicial + (data.rendimentoMensal * data.meses);
    }
    if (data.custoInicial && data.receitaMensal && data.meses) {
      return (data.receitaMensal * data.meses) - data.custoInicial;
    }
  }
  
  return null;
}

// Função para analisar um problema
function analyzeProblem(problem, lessonTitle) {
  const { question, title, givenData, answer, tolerance } = problem;
  
  const expectedAnswer = calculateExpectedAnswer(problem);
  const currentAnswer = answer;
  const toleranceValue = tolerance || 0.01;
  
  if (expectedAnswer !== null && currentAnswer !== undefined) {
    const difference = Math.abs(expectedAnswer - currentAnswer);
    
    if (difference > toleranceValue) {
      return {
        hasIssue: true,
        expectedAnswer: expectedAnswer,
        currentAnswer: currentAnswer,
        difference: difference,
        tolerance: toleranceValue,
        issue: 'Resposta não corresponde à pergunta'
      };
    }
  }
  
  // Verificar outras inconsistências
  const issues = [];
  
  // Verificar se dados fazem sentido com a pergunta
  if (givenData.precoProduto && givenData.valorPago) {
    if (givenData.valorPago < givenData.precoProduto) {
      issues.push('Cliente pagou menos que o preço do produto');
    }
  }
  
  // Verificar se porcentagens estão em formato correto
  if (givenData.percentualDesconto && givenData.percentualDesconto > 100) {
    issues.push('Percentual de desconto maior que 100%');
  }
  
  if (givenData.percentualAumento && givenData.percentualAumento > 100) {
    issues.push('Percentual de aumento maior que 100%');
  }
  
  // Verificar se taxas de juros estão em formato correto
  if (givenData.taxa && givenData.taxa > 50) {
    issues.push('Taxa de juros muito alta (mais de 50%)');
  }
  
  return {
    hasIssue: issues.length > 0,
    issues: issues,
    expectedAnswer: expectedAnswer,
    currentAnswer: currentAnswer
  };
}

// Função principal
async function main() {
  log('magenta', '🔍 ANALISADOR COMPLETO DE LIÇÕES DE CÁLCULO');
  log('magenta', '============================================\n');
  
  try {
    // Conectar ao banco
    await connectDB();
    
    // Buscar todas as lições de Math Problems
    const mathLessons = await Lesson.find({ type: 'math-problems' });
    
    log('blue', `📊 Analisando ${mathLessons.length} lições de Math Problems\n`);
    
    let totalIssues = 0;
    let lessonsWithIssues = 0;
    let totalCorrections = 0;
    
    for (const lesson of mathLessons) {
      log('cyan', `📚 Analisando: ${lesson.title}`);
      log('cyan', `   Módulo: ${lesson.module} | Ordem: ${lesson.order}`);
      
      let lessonIssues = 0;
      let lessonCorrections = 0;
      
      if (lesson.content && lesson.content.problems) {
        for (let i = 0; i < lesson.content.problems.length; i++) {
          const problem = lesson.content.problems[i];
          const analysis = analyzeProblem(problem, lesson.title);
          
          if (analysis.hasIssue) {
            lessonIssues++;
            log('red', `\n   ❌ Problema ${i + 1}: ${problem.title}`);
            log('yellow', `      Pergunta: ${problem.question}`);
            log('blue', `      Dados: ${JSON.stringify(problem.givenData)}`);
            
            if (analysis.expectedAnswer !== null) {
              log('green', `      Resposta esperada: ${analysis.expectedAnswer.toFixed(2)}`);
              log('red', `      Resposta atual: ${analysis.currentAnswer}`);
              log('red', `      Diferença: ${analysis.difference?.toFixed(2) || 'N/A'}`);
              
              // Corrigir automaticamente
              if (analysis.expectedAnswer !== null && analysis.currentAnswer !== undefined) {
                lesson.content.problems[i].answer = analysis.expectedAnswer;
                lessonCorrections++;
                log('green', `      ✅ Corrigido para: ${analysis.expectedAnswer.toFixed(2)}`);
              }
            }
            
            if (analysis.issues && analysis.issues.length > 0) {
              analysis.issues.forEach(issue => {
                log('yellow', `      ⚠️  ${issue}`);
              });
            }
          }
        }
      }
      
      if (lessonIssues > 0) {
        lessonsWithIssues++;
        totalIssues += lessonIssues;
        totalCorrections += lessonCorrections;
        
        if (lessonCorrections > 0) {
          // Usar updateOne para garantir que as mudanças sejam salvas
          await Lesson.updateOne(
            { _id: lesson._id },
            { $set: { content: lesson.content } }
          );
          log('green', `   ✅ ${lessonCorrections} correção(ões) aplicada(s) com updateOne`);
        }
      } else {
        log('green', '   ✅ Nenhum problema encontrado');
      }
    }
    
    // Resumo final
    log('magenta', '\n📊 RESUMO FINAL');
    log('magenta', '================');
    log('blue', `📚 Total de lições analisadas: ${mathLessons.length}`);
    log('red', `❌ Lições com problemas: ${lessonsWithIssues}`);
    log('red', `❌ Total de problemas encontrados: ${totalIssues}`);
    log('green', `🔧 Total de correções aplicadas: ${totalCorrections}`);
    
    if (totalIssues > 0) {
      log('yellow', '\n💡 CORREÇÕES APLICADAS:');
      log('yellow', '• Respostas incorretas foram corrigidas');
      log('yellow', '• Inconsistências entre pergunta e resposta foram resolvidas');
      log('yellow', '• Execute o script de verificação novamente para confirmar');
    } else {
      log('green', '\n🎉 Todas as lições estão corretas!');
    }
    
  } catch (error) {
    log('red', `❌ Erro durante a análise: ${error.message}`);
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

module.exports = { calculateExpectedAnswer, analyzeProblem };
