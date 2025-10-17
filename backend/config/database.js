const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔍 DATABASE - Iniciando conexão com MongoDB');
    console.log('🔍 DATABASE - MONGODB_URI configurada:', !!process.env.MONGODB_URI);
    console.log('🔍 DATABASE - MONGODB_URI (primeiros 20 chars):', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'undefined');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Configurações para melhorar estabilidade da conexão
      maxPoolSize: 10, // Manter até 10 conexões no pool
      serverSelectionTimeoutMS: 30000, // Timeout de 30 segundos para seleção de servidor
      socketTimeoutMS: 45000, // Timeout de 45 segundos para operações
      bufferCommands: false, // Desabilitar buffering de comandos
    });

    console.log('✅ DATABASE - MongoDB conectado com sucesso:', conn.connection.host);
    console.log('✅ DATABASE - Database name:', conn.connection.name);
    console.log('✅ DATABASE - Connection state:', conn.connection.readyState);
  } catch (error) {
    console.error('❌ DATABASE - Erro ao conectar com MongoDB:', error);
    console.error('❌ DATABASE - Error name:', error.name);
    console.error('❌ DATABASE - Error message:', error.message);
    console.error('❌ DATABASE - Error stack:', error.stack);
    process.exit(1);
  }
};

module.exports = connectDB;

