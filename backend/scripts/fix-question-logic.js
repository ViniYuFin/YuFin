#!/usr/bin/env node

/**
 * Script para corrigir a lógica das perguntas das lições
 * Identifica se a pergunta está pedindo troco simples ou contagem de moedas
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

// Função para analisar e corrigir problema
function analyzeProblem(problem) {
  const { question, title, givenData, formula, steps, answer } = problem;
  
  log('cyan', `\n📊 Analisando: ${title}`);
  log('blue', `   Pergunta: ${question}`);
  log('blue', `   Dados: ${JSON.stringify(givenData)}`);
  log('blue', `   Resposta atual: ${answer}`);
  
  // Verificar se é problema de troco simples
  if (givenData.precoProduto && givenData.valorPago) {
    const trocoSimples = givenData.valorPago - givenData.precoProduto;
    log('green', `   Troco simples: ${trocoSimples}`);
    
    // Verificar se a pergunta pede troco simples
    if (question.toLowerCase().includes('quanto de troco') && 
        question.toLowerCase().includes('deve dar ao cliente')) {
      
      // Se a resposta atual não é o troco simples, corrigir
      if (Math.abs(answer - trocoSimples) > 0.01) {
        log('red', `   ❌ PROBLEMA: Pergunta pede troco simples, mas resposta é ${answer}`);
        log('yellow', `   🔧 CORREÇÃO: Resposta deveria ser ${trocoSimples}`);
        
        return {
          shouldFix: true,
          correctAnswer: trocoSimples,
          reason: 'Pergunta pede troco simples, mas resposta é contagem de moedas'
        };
      }
    }
  }
  
  return { shouldFix: false };
}

// Função principal
async function main() {
  log('magenta', '🔍 ANALISADOR DE LÓGICA DAS PERGUNTAS');
  log('magenta', '=====================================\n');
  
  try {
    // Conectar ao banco
    await connectDB();
    
    // Buscar a lição "Contando Moedas e Notas"
    const lesson = await Lesson.findOne({ 
      type: 'math-problems',
      title: 'Contando Moedas e Notas'
    });
    
    if (!lesson) {
      log('red', '❌ Lição "Contando Moedas e Notas" não encontrada');
      return;
    }
    
    log('cyan', `📚 Lição: ${lesson.title}`);
    
    let totalCorrections = 0;
    
    // Analisar cada problema
    if (lesson.content && lesson.content.problems) {
      for (let i = 0; i < lesson.content.problems.length; i++) {
        const problem = lesson.content.problems[i];
        const analysis = analyzeProblem(problem);
        
        if (analysis.shouldFix) {
          log('yellow', `   🔧 Corrigindo problema ${i + 1}...`);
          lesson.content.problems[i].answer = analysis.correctAnswer;
          totalCorrections++;
        }
      }
      
      // Salvar correções
      if (totalCorrections > 0) {
        await lesson.save();
        log('green', `\n✅ ${totalCorrections} correção(ões) aplicada(s)`);
      } else {
        log('green', '\n✅ Nenhuma correção necessária');
      }
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

module.exports = { analyzeProblem };



