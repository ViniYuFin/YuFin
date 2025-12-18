const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Verificar se MONGODB_URI existe
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não definida nas variáveis de ambiente');
    }

    console.log('🔗 Tentando conectar ao MongoDB...');
    console.log('📍 URI:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Mascarar credenciais

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Configurações para melhorar estabilidade da conexão
      maxPoolSize: 10, // Manter até 10 conexões no pool
      serverSelectionTimeoutMS: 10000, // Aumentar timeout para 10 segundos
      socketTimeoutMS: 45000, // Timeout de 45 segundos para operações
      bufferCommands: false, // Desabilitar buffering de comandos
      // Configurações adicionais para Vercel
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    });

    console.log(`✅ MongoDB conectado com sucesso: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Verificar se a conexão está realmente funcionando
    const admin = conn.connection.db.admin();
    const result = await admin.ping();
    console.log('🏓 Ping MongoDB:', result);
    
  } catch (error) {
    console.error('❌ Erro ao conectar com MongoDB:', error.message);
    console.error('🔍 Detalhes do erro:', {
      name: error.name,
      code: error.code,
      codeName: error.codeName
    });
    
    // Não sair do processo em produção, apenas logar o erro
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Continuando sem conexão MongoDB (modo produção)');
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;