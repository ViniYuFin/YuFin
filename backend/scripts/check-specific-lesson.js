#!/usr/bin/env node

/**
 * Script para verificar uma lição específica no banco
 * Verifica se as correções foram aplicadas corretamente
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

// Função principal
async function main() {
  log('magenta', '🔍 VERIFICADOR DE LIÇÃO ESPECÍFICA');
  log('magenta', '==================================\n');
  
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
    
    log('cyan', `📚 Lição encontrada: ${lesson.title}`);
    log('cyan', `   ID: ${lesson._id}`);
    log('cyan', `   Módulo: ${lesson.module} | Ordem: ${lesson.order}`);
    
    // Verificar problema 2 especificamente
    if (lesson.content && lesson.content.problems) {
      const problem2 = lesson.content.problems.find(p => p.id === 2);
      
      if (problem2) {
        log('yellow', '\n📊 PROBLEMA 2: Contando Moedas');
        log('blue', `   Título: ${problem2.title}`);
        log('blue', `   Pergunta: ${problem2.question}`);
        log('blue', `   Dados: ${JSON.stringify(problem2.givenData)}`);
        log('green', `   Resposta no banco: ${problem2.answer}`);
        log('blue', `   Tolerância: ${problem2.tolerance || 'não definida'}`);
        
        // Calcular resposta esperada
        const { givenData } = problem2;
        if (givenData.precoProduto && givenData.valorPago) {
          const expectedAnswer = givenData.valorPago - givenData.precoProduto;
          log('green', `   Resposta esperada: ${expectedAnswer}`);
          
          // Verificar se está correto
          const tolerance = problem2.tolerance || 0.01;
          const difference = Math.abs(expectedAnswer - problem2.answer);
          
          if (difference <= tolerance) {
            log('green', '   ✅ Resposta está correta no banco!');
          } else {
            log('red', `   ❌ Resposta incorreta! Diferença: ${difference}`);
          }
        }
        
        // Mostrar estrutura completa do problema
        log('magenta', '\n📋 ESTRUTURA COMPLETA DO PROBLEMA 2:');
        console.log(JSON.stringify(problem2, null, 2));
      } else {
        log('red', '❌ Problema 2 não encontrado');
      }
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

module.exports = { };

