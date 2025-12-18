const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Rota para testar conexão MongoDB
router.get('/test-db', async (req, res) => {
  try {
    console.log('🔍 Testando conexão MongoDB...');
    
    // Verificar se MONGODB_URI existe
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({
        error: 'MONGODB_URI não definida',
        env: process.env.NODE_ENV
      });
    }
    
    console.log('🔗 URI (mascarada):', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
    
    // Tentar conectar
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ MongoDB conectado com sucesso');
    
    // Testar ping
    const admin = conn.connection.db.admin();
    const pingResult = await admin.ping();
    
    res.json({
      success: true,
      message: 'MongoDB conectado com sucesso',
      host: conn.connection.host,
      database: conn.connection.name,
      ping: pingResult,
      env: process.env.NODE_ENV
    });
    
  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      codeName: error.codeName,
      env: process.env.NODE_ENV,
      hasUri: !!process.env.MONGODB_URI
    });
  }
});

module.exports = router;

