require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Conectar ao MongoDB usando a mesma configuração do servidor
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB conectado com sucesso: ${conn.connection.host}`);
  } catch (error) {
    console.error('Erro ao conectar com MongoDB:', error.message);
    process.exit(1);
  }
};

async function testGratuitoUser() {
  try {
    // Conectar ao banco primeiro
    await connectDB();
    
    console.log('🔍 Testando usuário gratuito...');
    
    // Buscar usuário gratuito
    const gratuitoUser = await User.findOne({ 
      role: 'student-gratuito',
      isGratuito: true 
    });
    
    if (!gratuitoUser) {
      console.log('❌ Nenhum usuário gratuito encontrado');
      return;
    }
    
    console.log('✅ Usuário gratuito encontrado:', {
      id: gratuitoUser._id,
      role: gratuitoUser.role,
      isGratuito: gratuitoUser.isGratuito,
      gradeId: gratuitoUser.gradeId,
      progress: gratuitoUser.progress
    });
    
    // Testar se o progresso existe
    if (!gratuitoUser.progress) {
      console.log('⚠️ Usuário não tem progresso, criando...');
      gratuitoUser.progress = {
        xp: 0,
        maxXp: 1000,
        yuCoins: 0,
        streak: 0,
        hearts: 3,
        completedLessons: [],
        achievements: [],
        avatar: { accessory: "none" },
        level: 1,
        dailyGoal: 50,
        dailyProgress: 0
      };
      await gratuitoUser.save();
      console.log('✅ Progresso criado com sucesso');
    }
    
    console.log('✅ Teste concluído com sucesso');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    mongoose.connection.close();
  }
}

testGratuitoUser();
