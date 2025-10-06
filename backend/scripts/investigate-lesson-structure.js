#!/usr/bin/env node

/**
 * Script para investigar a estrutura das lições de Math Problems
 * Identifica como os dados estão organizados no banco
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

// Função para investigar estrutura de uma lição
function investigateLessonStructure(lesson) {
  log('cyan', `\n📚 INVESTIGANDO: ${lesson.title}`);
  log('cyan', `   ID: ${lesson._id}`);
  log('cyan', `   Tipo: ${lesson.type}`);
  log('cyan', `   Módulo: ${lesson.module} | Ordem: ${lesson.order}`);
  
  // Verificar se tem content
  if (!lesson.content) {
    log('red', '❌ Campo content não existe');
    return;
  }
  
  log('green', '✅ Campo content existe');
  
  // Verificar tipo do content
  log('blue', `   Tipo do content: ${typeof lesson.content}`);
  
  // Se for objeto, mostrar chaves
  if (typeof lesson.content === 'object' && lesson.content !== null) {
    const keys = Object.keys(lesson.content);
    log('blue', `   Chaves do content: ${keys.join(', ')}`);
    
    // Verificar se tem problems
    if (lesson.content.problems) {
      log('green', `   ✅ Campo problems existe (${lesson.content.problems.length} problemas)`);
      
      // Investigar primeiro problema
      if (lesson.content.problems.length > 0) {
        const firstProblem = lesson.content.problems[0];
        log('yellow', `   📊 Estrutura do primeiro problema:`);
        log('yellow', `      Chaves: ${Object.keys(firstProblem).join(', ')}`);
        
        // Mostrar conteúdo do primeiro problema
        console.log('      Conteúdo completo:');
        console.log(JSON.stringify(firstProblem, null, 6));
      }
    } else {
      log('red', '❌ Campo problems não existe no content');
    }
    
    // Verificar outras chaves importantes
    if (lesson.content.givenData) {
      log('green', `   ✅ Campo givenData existe`);
    }
    if (lesson.content.expectedAnswer) {
      log('green', `   ✅ Campo expectedAnswer existe`);
    }
    if (lesson.content.validateAnswer) {
      log('green', `   ✅ Campo validateAnswer existe`);
    }
    if (lesson.content.calculateAnswer) {
      log('green', `   ✅ Campo calculateAnswer existe`);
    }
  }
  
  // Mostrar estrutura completa do content
  log('magenta', '\n   📋 ESTRUTURA COMPLETA DO CONTENT:');
  console.log(JSON.stringify(lesson.content, null, 2));
}

// Função principal
async function main() {
  log('magenta', '🔍 INVESTIGADOR DE ESTRUTURA DE LIÇÕES');
  log('magenta', '=======================================\n');
  
  try {
    // Conectar ao banco
    await connectDB();
    
    // Buscar uma lição de Math Problems problemática
    const problematicLesson = await Lesson.findOne({ 
      type: 'math-problems',
      title: 'Juros Compostos'
    });
    
    if (!problematicLesson) {
      log('red', '❌ Lição "Juros Compostos" não encontrada');
      return;
    }
    
    // Investigar estrutura
    investigateLessonStructure(problematicLesson);
    
    // Buscar uma lição de Goals que funciona
    log('magenta', '\n\n🎯 COMPARANDO COM LIÇÃO DE GOALS QUE FUNCIONA:');
    const workingLesson = await Lesson.findOne({ 
      type: 'goals',
      title: 'Planejando uma pequena viagem'
    });
    
    if (workingLesson) {
      investigateLessonStructure(workingLesson);
    }
    
  } catch (error) {
    log('red', `❌ Erro durante a investigação: ${error.message}`);
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

module.exports = { investigateLessonStructure };

