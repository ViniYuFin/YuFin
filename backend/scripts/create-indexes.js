/**
 * 📊 SCRIPT DE CRIAÇÃO DE ÍNDICES OTIMIZADOS
 * 
 * Cria índices para melhorar performance de queries
 * Rode este script uma vez após deploy: node scripts/create-indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const RefreshToken = require('../models/RefreshToken');
const Class = require('../models/Class');
const Grade = require('../models/Grade');
const RegistrationToken = require('../models/RegistrationToken');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yufin';

async function createIndexes() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');

    // ===========================
    // ÍNDICES DE USERS
    // ===========================
    console.log('📊 Criando índices de Users...');
    
    // Índice único para email (já existe no schema, mas garantir)
    await User.collection.createIndex({ email: 1 }, { unique: true });
    console.log('  ✅ email (unique)');
    
    // Índice único para playerId
    await User.collection.createIndex({ playerId: 1 }, { unique: true, sparse: true });
    console.log('  ✅ playerId (unique, sparse)');
    
    // Índice composto para role + schoolId (queries de escolas)
    await User.collection.createIndex({ role: 1, schoolId: 1 });
    console.log('  ✅ role + schoolId');
    
    // Índice para gradeId (filtrar por série)
    await User.collection.createIndex({ gradeId: 1 });
    console.log('  ✅ gradeId');
    
    // Índice para classId (filtrar por turma)
    await User.collection.createIndex({ classId: 1 });
    console.log('  ✅ classId');
    
    // Índice para buscar por XP (rankings)
    await User.collection.createIndex({ 'progress.totalXp': -1 });
    console.log('  ✅ progress.totalXp (desc)');
    
    // Índice para buscar por nível
    await User.collection.createIndex({ 'progress.level': -1 });
    console.log('  ✅ progress.level (desc)');
    
    // Índice para buscar por streak
    await User.collection.createIndex({ 'progress.currentStreak': -1 });
    console.log('  ✅ progress.currentStreak (desc)');
    
    // Índice para última atividade (limpar usuários inativos)
    await User.collection.createIndex({ 'progress.lastActivityDate': 1 });
    console.log('  ✅ progress.lastActivityDate');
    
    // Índice para progressão de série
    await User.collection.createIndex({ 
      'gradeProgression.nextGradeRequested': 1,
      'gradeProgression.nextGradeAuthorized': 1 
    });
    console.log('  ✅ gradeProgression (requests)');

    // ===========================
    // ÍNDICES DE LESSONS
    // ===========================
    console.log('\n📚 Criando índices de Lessons...');
    
    // Índice composto para gradeId + module
    await Lesson.collection.createIndex({ gradeId: 1, module: 1 });
    console.log('  ✅ gradeId + module');
    
    // Índice para ordem dentro do módulo
    await Lesson.collection.createIndex({ gradeId: 1, module: 1, order: 1 });
    console.log('  ✅ gradeId + module + order');
    
    // Índice para tipo de lição
    await Lesson.collection.createIndex({ type: 1 });
    console.log('  ✅ type');
    
    // Índice para lições ativas
    await Lesson.collection.createIndex({ isActive: 1 });
    console.log('  ✅ isActive');
    
    // Índice para dificuldade
    await Lesson.collection.createIndex({ difficulty: 1 });
    console.log('  ✅ difficulty');

    // ===========================
    // ÍNDICES DE REFRESH TOKENS
    // ===========================
    console.log('\n🔑 Criando índices de RefreshTokens...');
    
    // Índice único para token
    await RefreshToken.collection.createIndex({ token: 1 }, { unique: true });
    console.log('  ✅ token (unique)');
    
    // Índice para userId
    await RefreshToken.collection.createIndex({ userId: 1 });
    console.log('  ✅ userId');
    
    // Índice composto para buscar tokens válidos
    await RefreshToken.collection.createIndex({ 
      userId: 1, 
      isRevoked: 1,
      expiresAt: 1
    });
    console.log('  ✅ userId + isRevoked + expiresAt');
    
    // TTL index para expiração automática (expira em 0 segundos após expiresAt)
    try {
      await RefreshToken.collection.createIndex(
        { expiresAt: 1 }, 
        { expireAfterSeconds: 0 }
      );
      console.log('  ✅ expiresAt (TTL)');
    } catch (error) {
      if (error.code === 85) {
        console.log('  ⚠️  expiresAt (TTL) - já existe (OK)');
      } else {
        throw error;
      }
    }
    
    // Índice para IP (análise de segurança)
    await RefreshToken.collection.createIndex({ 'deviceInfo.ip': 1 });
    console.log('  ✅ deviceInfo.ip');

    // ===========================
    // ÍNDICES DE CLASSES
    // ===========================
    console.log('\n🏫 Criando índices de Classes...');
    
    // Índice para schoolId
    await Class.collection.createIndex({ schoolId: 1 });
    console.log('  ✅ schoolId');
    
    // Índice composto para school + grade
    await Class.collection.createIndex({ schoolId: 1, grade: 1 });
    console.log('  ✅ schoolId + grade');
    
    // Índice para turmas ativas
    await Class.collection.createIndex({ 'settings.isActive': 1 });
    console.log('  ✅ settings.isActive');

    // ===========================
    // ÍNDICES DE GRADES
    // ===========================
    console.log('\n🎓 Criando índices de Grades...');
    
    // Índice para name (busca por nome de série)
    await Grade.collection.createIndex({ name: 1 });
    console.log('  ✅ name');
    
    // Índice para level (ordem das séries)
    await Grade.collection.createIndex({ level: 1 });
    console.log('  ✅ level');
    
    // Índice para séries ativas
    await Grade.collection.createIndex({ isActive: 1 });
    console.log('  ✅ isActive');

    // ===========================
    // ÍNDICES DE REGISTRATION TOKENS
    // ===========================
    console.log('\n🎟️ Criando índices de RegistrationTokens...');
    
    // Índice único para token
    await RegistrationToken.collection.createIndex({ token: 1 }, { unique: true });
    console.log('  ✅ token (unique)');
    
    // Índice para createdBy
    await RegistrationToken.collection.createIndex({ createdBy: 1 });
    console.log('  ✅ createdBy');
    
    // Índice composto para buscar tokens válidos
    await RegistrationToken.collection.createIndex({ 
      isActive: 1,
      expiresAt: 1
    });
    console.log('  ✅ isActive + expiresAt');
    
    // Índice para schoolId
    await RegistrationToken.collection.createIndex({ schoolId: 1 });
    console.log('  ✅ schoolId');

    // ===========================
    // VERIFICAR ÍNDICES CRIADOS
    // ===========================
    console.log('\n📊 Verificando índices criados...\n');
    
    const collections = {
      'Users': User.collection,
      'Lessons': Lesson.collection,
      'RefreshTokens': RefreshToken.collection,
      'Classes': Class.collection,
      'Grades': Grade.collection,
      'RegistrationTokens': RegistrationToken.collection
    };
    
    for (const [name, collection] of Object.entries(collections)) {
      const indexes = await collection.indexes();
      console.log(`📚 ${name}:`);
      indexes.forEach(idx => {
        const keys = Object.keys(idx.key).join(', ');
        const options = [];
        if (idx.unique) options.push('unique');
        if (idx.sparse) options.push('sparse');
        if (idx.expireAfterSeconds !== undefined) options.push(`TTL:${idx.expireAfterSeconds}s`);
        console.log(`  • ${keys}${options.length ? ` (${options.join(', ')})` : ''}`);
      });
      console.log('');
    }

    console.log('✅ Todos os índices foram criados com sucesso!\n');
    console.log('💡 Dicas de performance:');
    console.log('   - Índices melhoram SELECT mas podem desacelerar INSERT/UPDATE');
    console.log('   - MongoDB usa no máximo 1 índice por query');
    console.log('   - Monitore uso com: db.collection.explain()');
    console.log('   - Remova índices não usados periodicamente\n');

  } catch (error) {
    console.error('❌ Erro ao criar índices:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado do MongoDB');
    process.exit(0);
  }
}

// Executar
createIndexes();

