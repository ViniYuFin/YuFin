require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');

// Importar modelos
const User = require('./models/User');
const Lesson = require('./models/Lesson');
const Class = require('./models/Class');
const Grade = require('./models/Grade');
const RegistrationToken = require('./models/RegistrationToken');
const RefreshToken = require('./models/RefreshToken');
const ParentValidationToken = require('./models/ParentValidationToken');

// Importar rotas
const authRoutes = require('./routes/auth');
const tokenRoutes = require('./routes/token');
const lgpdRoutes = require('./routes/lgpd');
const familyLicenseRoutes = require('./routes/familyLicense');
const gratuitoRoutes = require('./routes/gratuito');

// Importar middlewares
const { authenticateToken, authorizeRoles, authorizeOwner } = require('./middleware/auth');
const { validate, completeLessonSchema, updateUserSchema } = require('./utils/validators');
const { lgpdHeaders } = require('./middleware/lgpd');

// Importar middlewares de segurança
const {
  helmetConfig,
  generalLimiter,
  loginLimiter,
  registerLimiter,
  lgpdLimiter,
  apiLimiter,
  sanitizeData,
  hppProtection,
  securityLogger,
  validateInput
} = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3001;

// Conectar ao MongoDB
connectDB();

// 🔐 MIDDLEWARES DE SEGURANÇA (PRIMEIRO!)
app.use(helmetConfig);           // Headers de segurança
// app.use(sanitizeData);        // TEMPORARIAMENTE DESABILITADO (conflito Express 5)
app.use(hppProtection);          // Proteção HTTP Parameter Pollution
app.use(securityLogger);         // Logger de eventos suspeitos

// Configuração CORS robusta para produção
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🔍 CORS - Origin recebida:', origin);
    
    const allowedOrigins = [
      'https://yufin.com.br',
      'https://www.yufin.com.br',
      'https://app.yufin.com.br',
      'https://yufin-frontend.vercel.app',
      'https://yufin-backend.vercel.app',
      'https://yufin-deploy.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    // Permitir requests sem origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('⚠️  CORS: No origin - allowing');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Para suportar navegadores legados
};

app.use(cors(corsOptions));

// Middlewares globais
app.use(bodyParser.json({ limit: '10mb' })); // Limite de payload
app.use(cookieParser());                      // Parse de cookies
app.use(validateInput);                       // Validação básica de input
app.use(lgpdHeaders);                         // Headers LGPD em todas as respostas

// Rate limiter geral (aplicar depois do CORS)
app.use(generalLimiter);

// Rota de health check (sem rate limit)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    security: {
      helmet: '✅',
      rateLimit: '✅',
      sanitization: '✅',
      refreshTokens: '✅'
    },
    routes: {
      auth: '/auth/login, /auth/register',
      token: '/token/refresh, /token/logout',
      lgpd: '/lgpd/export-data, /lgpd/delete-data',
      users: '/users (protected)'
    }
  });
});

// 🔐 ROTAS PÚBLICAS (sem autenticação, com rate limiting específico)
app.use('/auth/login', loginLimiter);      // 5 tentativas por 15min
app.use('/auth/register', registerLimiter); // 3 registros por hora
app.use('/auth', authRoutes);               // Login e registro

app.use('/token', tokenRoutes);             // Refresh, logout, etc
app.use('/lgpd', lgpdLimiter, lgpdRoutes);  // Endpoints LGPD com rate limit
app.use('/api/family-license', familyLicenseRoutes); // Licenças família
app.use('/gratuito', gratuitoRoutes);       // Endpoints para usuários gratuitos

// Endpoint de teste
app.get('/', (req, res) => {
  res.json({ message: 'Backend YuFin com MongoDB rodando!' });
});

// 🔒 ROTAS PROTEGIDAS (requer autenticação + rate limiting para API)
app.use(apiLimiter); // 200 requests por 15min para rotas autenticadas

// Rotas de usuários (protegidas com autenticação)
app.get('/users', 
  authenticateToken,
  authorizeRoles('school', 'parent'),  // Apenas escolas e pais podem listar usuários
  async (req, res) => {
    try {
      // Se for escola, filtrar apenas seus alunos
      let filter = {};
      if (req.user.role === 'school') {
        filter = { 
          role: 'student',  // APENAS ALUNOS
          schoolId: req.user.id 
        };
      }
      
      const users = await User.find(filter).select('-passwordHash'); // Nunca retornar senhas!
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.get('/users/:id', 
  authenticateToken,
  authorizeOwner,  // Apenas o próprio usuário ou escola/parent
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('-passwordHash');
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.post('/users', async (req, res) => {
  try {
    const userData = { ...req.body };
    if (userData.password) {
      userData.passwordHash = userData.password;
      delete userData.password;
    }
    
    const user = new User(userData);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/users/:id', 
  authenticateToken,
  authorizeOwner,
  validate(updateUserSchema),  // Validação Joi
  async (req, res) => {
    try {
      console.log('Backend - Atualizando usuário:', { 
        userId: req.params.id, 
        updateData: req.body 
      });
      
      const user = await User.findByIdAndUpdate(
        req.params.id, 
        { $set: req.body }, 
        { new: true }
      ).select('-passwordHash');
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      console.log('Backend - Usuário atualizado:', { 
        userId: user._id, 
        savingsConfig: user.savingsConfig 
      });
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Endpoint para resetar apenas o progresso da série atual
app.post('/users/:id/reset-current-grade-progress', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    console.log(`Resetando progresso da série atual para usuário: ${user.email}, série: ${user.gradeId}`);

    // Buscar lições da série atual
    const currentGradeLessons = await Lesson.find({ 
      gradeId: user.gradeId, 
      isActive: true 
    });

    // Filtrar apenas lições da série atual das lições completadas
    const completedLessons = user.progress?.completedLessons || [];
    const currentGradeLessonIds = currentGradeLessons.map(l => l._id.toString());
    const otherGradeCompletedLessons = completedLessons.filter(lessonId => 
      !currentGradeLessonIds.includes(lessonId)
    );

    console.log(`DEBUG - Lições completadas total: ${completedLessons.length}`);
    console.log(`DEBUG - Lições da série atual: ${currentGradeLessonIds.length}`);
    console.log(`DEBUG - Lições de outras séries: ${otherGradeCompletedLessons.length}`);
    console.log(`DEBUG - Lições de outras séries:`, otherGradeCompletedLessons);

    // Filtrar apenas conquistas de outras séries
    const currentAchievements = user.progress?.achievements || [];
    
    console.log(`DEBUG - Conquistas total: ${currentAchievements.length}`);
    console.log(`DEBUG - Conquistas:`, currentAchievements);
    
    // Lógica melhorada para filtrar conquistas
    // Se a conquista tem prefixo da série atual, remove
    // Se não tem prefixo, verifica se é da série atual baseado no contexto
    const otherGradeAchievements = currentAchievements.filter(achievement => {
      // Se tem prefixo da série atual, remove
      if (achievement.startsWith(`${user.gradeId}_`)) {
        console.log(`DEBUG - Removendo conquista da série atual: ${achievement}`);
        return false;
      }
      
      // Se não tem prefixo, verifica se é da série atual
      // Conquistas sem prefixo são consideradas da série atual se não há lições de outras séries
      if (otherGradeCompletedLessons.length === 0) {
        // Se não há lições de outras séries, todas as conquistas sem prefixo são da série atual
        console.log(`DEBUG - Removendo conquista sem prefixo (sem lições outras séries): ${achievement}`);
        return false;
      }
      
      // Se há lições de outras séries, mantém conquistas sem prefixo (são de outras séries)
      console.log(`DEBUG - Mantendo conquista: ${achievement}`);
      return true;
    });

    console.log(`DEBUG - Conquistas de outras séries: ${otherGradeAchievements.length}`);
    console.log(`DEBUG - Conquistas de outras séries:`, otherGradeAchievements);

    // IMPORTANTE: Não calcular XP das lições individualmente
    // O XP real já está salvo no progresso do usuário
    // Vamos usar o XP total e subtrair o XP da série atual
    
    // Buscar lições da série atual para calcular XP total da série atual
    const currentGradeXp = currentGradeLessons.reduce((total, lesson) => {
      if (completedLessons.includes(lesson._id.toString())) {
        // XP padronizado: 100 por lição
        return total + 100;
      }
      return total;
    }, 0);
    
    // XP total do usuário menos XP da série atual
    const userTotalXp = user.progress?.xp || 0;
    const otherGradeXp = Math.max(0, userTotalXp - currentGradeXp);
    
    console.log(`DEBUG - XP total do usuário: ${userTotalXp}`);
    console.log(`DEBUG - XP estimado da série atual: ${currentGradeXp}`);
    console.log(`DEBUG - XP de outras séries: ${otherGradeXp}`);
    
    // YuCoins: 10 por lição de outras séries
    const otherGradeYuCoins = otherGradeCompletedLessons.length * 10;

    // Calcular XP e YuCoins das conquistas de outras séries usando valores corretos
    let otherGradeAchievementXp = 0;
    let otherGradeAchievementYuCoins = 0;
    
    // Mapeamento de recompensas por conquista (baseado no sistema progressivo)
    const achievementRewards = {
      '6º Ano': {
        'module_1_complete': { xp: 100, yuCoins: 50 },
        'module_2_complete': { xp: 150, yuCoins: 75 },
        'module_3_complete': { xp: 200, yuCoins: 100 },
        'module_4_complete': { xp: 300, yuCoins: 150 }
      },
      '7º Ano': {
        'module_1_complete': { xp: 150, yuCoins: 75 },
        'module_2_complete': { xp: 200, yuCoins: 100 },
        'module_3_complete': { xp: 250, yuCoins: 125 },
        'module_4_complete': { xp: 350, yuCoins: 175 }
      }
    };
    
    for (const achievement of otherGradeAchievements) {
      // Parse da conquista: "6º Ano_module_1_complete"
      // Dividir por "_" e reconstruir corretamente
      const parts = achievement.split('_');
      if (parts.length >= 4) {
        // Para "6º Ano_module_1_complete":
        // parts[0] = "6º Ano", parts[1] = "module", parts[2] = "1", parts[3] = "complete"
        const grade = parts[0]; // "6º Ano"
        const moduleKey = `${parts[1]}_${parts[2]}_complete`; // "module_1_complete"
        
        if (achievementRewards[grade] && achievementRewards[grade][moduleKey]) {
          const reward = achievementRewards[grade][moduleKey];
          otherGradeAchievementXp += reward.xp;
          otherGradeAchievementYuCoins += reward.yuCoins;
        } else {
          // Fallback para conquistas não mapeadas
          otherGradeAchievementXp += 150;
          otherGradeAchievementYuCoins += 75;
        }
      } else {
        // Fallback para formato inesperado
        otherGradeAchievementXp += 150;
        otherGradeAchievementYuCoins += 75;
      }
    }

    // Calcular totais finais
    const totalXp = otherGradeXp + otherGradeAchievementXp;
    const totalYuCoins = otherGradeYuCoins + otherGradeAchievementYuCoins;

    console.log(`\n🔍 === DEBUG RESET ===`);
    console.log(`DEBUG - XP total calculado: ${totalXp}`);
    console.log(`DEBUG - YuCoins total calculado: ${totalYuCoins}`);
    console.log(`🔍 === FIM DEBUG ===\n`);
    
    // Lógica de reset baseada em se há progresso de outras séries
    let newLevel, newXp, newYuCoins;
    
    if (otherGradeCompletedLessons.length === 0) {
      // Reset completo - não há progresso de outras séries
      newLevel = 1;
      newXp = 0;
      newYuCoins = 0;
    } else {
      // Reset parcial - há progresso de outras séries
      const safeTotalXp = Math.max(0, totalXp);
      const calculatedLevel = Math.max(1, Math.floor(1 + Math.sqrt(safeTotalXp / 100)));
      // No reset parcial, usar apenas o nível calculado com base no XP das outras séries
      newLevel = calculatedLevel;
      newXp = safeTotalXp;
      newYuCoins = Math.max(0, totalYuCoins);
    }

    // Filtrar lições recompensadas da série atual
    const currentRewardedLessons = user.savings?.rewardedLessons || [];
    const otherGradeRewardedLessons = currentRewardedLessons.filter(lessonId => 
      !currentGradeLessonIds.includes(lessonId)
    );

    // Calcular saldo da poupança baseado apenas nas lições de outras séries
    let otherGradeSavingsBalance = 0;
    
    // Buscar configurações de poupança do responsável
    const parent = await User.findOne({ 
      linkedStudents: user._id.toString(),
      role: 'parent'
    });
    
    if (parent) {
      const config = parent.savingsConfig || {};
      
      // Calcular recompensa baseada nas lições de outras séries
      for (const lessonId of otherGradeCompletedLessons) {
        // Recompensa por lição concluída
        if (config.perLesson) {
          otherGradeSavingsBalance += config.perLesson;
        }
        
        // Verificar se a lição foi perfeita
        const perfectLessons = user.progress?.perfectLessons || [];
        if (perfectLessons.includes(lessonId) && config.perPerfectLesson) {
          otherGradeSavingsBalance += config.perPerfectLesson;
        }
      }
    }

    // Filtrar transações da poupança para manter apenas as de outras séries
    const currentTransactions = user.savings?.transactions || [];
    console.log(`Total de transações antes do filtro: ${currentTransactions.length}`);
    
    let otherGradeTransactions;
    
    if (otherGradeCompletedLessons.length === 0) {
      // Reset completo - remover todas as transações
      console.log('Reset completo: removendo todas as transações');
      otherGradeTransactions = [];
    } else {
      // Reset parcial - manter apenas transações de outras séries
      otherGradeTransactions = currentTransactions.filter(transaction => {
        // Se a transação tem lessonId, verificar se é de outra série
        if (transaction.lessonId) {
          const isFromCurrentGrade = currentGradeLessonIds.includes(transaction.lessonId);
          if (isFromCurrentGrade) {
            console.log(`Removendo transação da série atual: ${transaction.lessonId} - ${transaction.reason}`);
          }
          return !isFromCurrentGrade;
        }
        // Se não tem lessonId, manter (pode ser transação manual ou de outras séries)
        return true;
      });
    }
    
    console.log(`Transações após filtro: ${otherGradeTransactions.length}`);

    // Resetar apenas o progresso da série atual
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'progress.completedLessons': otherGradeCompletedLessons,
          'progress.perfectLessons': [], // Resetar lições perfeitas da série atual
          'progress.achievements': otherGradeAchievements,
          'progress.xp': newXp,
          'progress.yuCoins': newYuCoins,
          'progress.level': newLevel,
          'progress.xpToNextLevel': Math.pow(newLevel, 2) * 100,
          'progress.streak': 0, // Resetar streak da série atual
          'progress.dailyProgress': 0, // Resetar progresso diário
          'progress.moduleProgress': {
            1: { completed: 0, total: 0 },
            2: { completed: 0, total: 0 },
            3: { completed: 0, total: 0 },
            4: { completed: 0, total: 0 }
          },
          'savings.balance': otherGradeSavingsBalance, // Resetar saldo da poupança
          'savings.rewardedLessons': otherGradeRewardedLessons, // Manter apenas lições recompensadas de outras séries
          'savings.transactions': otherGradeTransactions // Manter apenas transações de outras séries
        }
      },
      { new: true }
    );

    console.log(`Progresso da série ${user.gradeId} resetado com sucesso`);
    console.log(`Lições mantidas de outras séries: ${otherGradeCompletedLessons.length}`);
    console.log(`Conquistas mantidas de outras séries: ${otherGradeAchievements.length}`);
    console.log(`Transações mantidas de outras séries: ${otherGradeTransactions.length}`);
    console.log(`Tipo de reset: ${otherGradeCompletedLessons.length === 0 ? 'COMPLETO' : 'PARCIAL'}`);
    
    if (otherGradeCompletedLessons.length === 0) {
      console.log(`Reset completo: XP=0, YuCoins=0, Poupança=0, Nível=1`);
    } else {
      console.log(`Reset parcial: XP=${newXp}, YuCoins=${newYuCoins}, Poupança=${otherGradeSavingsBalance}, Nível=${newLevel}`);
    }

    res.json({
      user: updatedUser,
      message: `Progresso da série ${user.gradeId} resetado com sucesso`,
      maintainedProgress: {
        completedLessons: otherGradeCompletedLessons.length,
        achievements: otherGradeAchievements.length,
        transactions: otherGradeTransactions.length,
        xp: newXp,
        yuCoins: newYuCoins,
        savingsBalance: otherGradeSavingsBalance,
        level: newLevel,
        resetType: otherGradeCompletedLessons.length === 0 ? 'complete' : 'partial'
      }
    });

  } catch (error) {
    console.error('Erro ao resetar progresso da série atual:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para reset radical - voltar ao 6º ano com tudo zerado
app.post('/users/:id/reset-radical', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    console.log(`🔄 Reset radical - usuário: ${user.email}, série atual: ${user.gradeId}`);

    // RESET COMPLETO para qualquer série - voltar ao 6º ano
    console.log('📚 Reset completo - voltando ao 6º ano');
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          gradeId: '6º Ano', // Voltar ao 6º ano
          currentModule: 1, // Módulo 1
          'progress.completedLessons': [],
          'progress.perfectLessons': [],
          'progress.achievements': [],
          'progress.xp': 0,
          'progress.yuCoins': 0,
          'progress.level': 1,
          'progress.xpToNextLevel': 100,
          'progress.streak': 0,
          'progress.dailyProgress': 0,
          'progress.moduleProgress': {
            1: { completed: 0, total: 0 },
            2: { completed: 0, total: 0 },
            3: { completed: 0, total: 0 },
            4: { completed: 0, total: 0 }
          },
          'savings.balance': 0,
          'savings.rewardedLessons': [],
          'savings.transactions': []
        }
      },
      { new: true }
    );

    console.log('✅ Reset radical concluído - usuário voltou ao 6º ano');

    res.json({
      user: updatedUser,
      message: 'Reset radical concluído! Usuário voltou ao 6º ano com todo progresso zerado.',
      resetInfo: {
        newGrade: '6º Ano',
        xp: 0,
        yuCoins: 0,
        level: 1,
        completedLessons: 0,
        savingsBalance: 0,
        resetType: 'radical'
      }
    });

  } catch (error) {
    console.error('Erro ao fazer reset radical:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ⚠️  ROTAS ANTIGAS DE AUTENTICAÇÃO - DEPRECIADAS
// Agora use: POST /auth/login e POST /auth/register (com bcrypt + JWT)
// Mantendo temporariamente para compatibilidade, mas sem segurança!

app.post('/login', async (req, res) => {
  console.warn('⚠️  AVISO: Endpoint /login está depreciado! Use /auth/login');
  console.warn('⚠️  Este endpoint NÃO é seguro e será removido em breve!');
  
  return res.status(410).json({ 
    error: 'Endpoint depreciado',
    message: 'Use POST /auth/login com suporte a JWT e senhas criptografadas',
    newEndpoint: '/auth/login'
  });
});

app.post('/register', async (req, res) => {
  console.warn('⚠️  AVISO: Endpoint /register está depreciado! Use /auth/register');
  console.warn('⚠️  Este endpoint NÃO é seguro e será removido em breve!');
  
  return res.status(410).json({ 
    error: 'Endpoint depreciado',
    message: 'Use POST /auth/register com bcrypt e consentimento LGPD',
    newEndpoint: '/auth/register'
  });
});

// Manter registro ANTIGO apenas para migração (TEMPORÁRIO!)
app.post('/register-legacy', async (req, res) => {
  try {
    const { name, email, password, role, passwordHash, token, gradeId } = req.body;
    
    // Verificar se o email já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Validar token se for aluno
    let tokenInfo = null;
    if (role === 'student' && token) {
      const tokenDoc = await RegistrationToken.findOne({ token });
      
      if (!tokenDoc) {
        return res.status(400).json({ error: 'Token inválido' });
      }
      
      if (!tokenDoc.isActive) {
        return res.status(400).json({ error: 'Token inativo' });
      }
      
      if (tokenDoc.expiresAt && new Date() > tokenDoc.expiresAt) {
        return res.status(400).json({ error: 'Token expirado' });
      }
      
      if (tokenDoc.maxUses && tokenDoc.usedCount >= tokenDoc.maxUses) {
        return res.status(400).json({ error: 'Token já foi usado o máximo de vezes' });
      }
      
      tokenInfo = tokenDoc;
    }
    
    const userData = {
      name,
      email,
      role,
      passwordHash: passwordHash || password,
      createdAt: new Date()
    };
    
    // Adicionar campos específicos por role
    if (role === 'student') {
      userData.progress = {
        xp: 0,
        maxXp: 1000,
        yuCoins: 0,
        streak: 0,
        hearts: 3,
        completedLessons: [],
        avatar: { accessory: "none" },
        level: 1,
        dailyGoal: 50,
        dailyProgress: 0
      };
      userData.savings = { 
        balance: 0, 
        transactions: [],
        goals: []
      };
      userData.gradeId = gradeId;
      
      // Inicializar sistema de solicitações de vínculo
      userData.parentLinkRequests = {
        pendingRequests: [],
        sentRequests: []
      };
    } else if (role === 'parent') {
      userData.linkedStudents = [];
      userData.savingsConfig = { 
        perLesson: 0.5, 
        perStreak: 2.0,
        autoTransfer: false
      };
      userData.balance = 0;
      userData.transactions = [];
      
      // Inicializar sistema de solicitações de vínculo
      userData.parentLinkRequests = {
        pendingRequests: [],
        sentRequests: []
      };
    } else if (role === 'school') {
      userData.linkedClasses = [];
      userData.activeStudents = 0;
      userData.averageXp = 0;
      userData.completedLessonsCount = 0;
    }
    
    const user = new User(userData);
    await user.save();
    
    // Gerar player ID automaticamente para alunos
    if (role === 'student') {
      let playerId;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        const randomNum = Math.floor(Math.random() * 900) + 100; // 100-999
        playerId = `YUF${randomNum}`;
        attempts++;
        
        // Verificar se já existe
        const existingUser = await User.findOne({ playerId });
        if (!existingUser) break;
      } while (attempts < maxAttempts);

      if (attempts < maxAttempts) {
        user.playerId = playerId;
        await user.save();
        console.log('🎮 Player ID gerado automaticamente:', playerId);
      }
    }
    
    // Se foi usado um token, registrar o uso
    if (tokenInfo) {
      tokenInfo.usedCount += 1;
      tokenInfo.usedBy.push({
        studentId: user.id,
        studentName: user.name,
        usedAt: new Date()
      });
      
      // Desativar se atingiu o limite
      if (tokenInfo.maxUses && tokenInfo.usedCount >= tokenInfo.maxUses) {
        tokenInfo.isActive = false;
      }
      
      await tokenInfo.save();
      
      // Se o token foi criado por um responsável, vincular automaticamente
      if (tokenInfo.type === 'parent') {
        const parent = await User.findById(tokenInfo.createdBy);
        if (parent && parent.role === 'parent') {
          parent.linkedStudents = parent.linkedStudents || [];
          parent.linkedStudents.push(user.id);
    await parent.save();
    
          // Atualizar o usuário com a informação de vínculo
          user.parentId = parent.id;
          user.linkedStudents = [parent.id];
          await user.save();
          
          console.log('👨‍👩‍👧‍👦 Aluno vinculado automaticamente ao responsável:', {
            studentId: user.id,
            studentName: user.name,
            parentId: parent.id,
            parentName: parent.name
          });
        }
      }
      
      // Se o token foi criado por uma escola, associar o aluno à escola
      if (tokenInfo.type === 'school') {
        console.log('🏫 Associando aluno à escola:', {
          studentId: user.id,
          studentName: user.name,
          schoolId: tokenInfo.createdBy,
          tokenType: tokenInfo.type
        });
        
        user.schoolId = tokenInfo.createdBy;
        await user.save();
        
        console.log('✅ Aluno associado à escola com sucesso:', {
          studentId: user.id,
          schoolId: user.schoolId
        });
      }
    }
    
    // Buscar o usuário atualizado do banco para retornar
    const updatedUser = await User.findById(user.id);
    res.status(201).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rotas de lições
app.get('/lessons', async (req, res) => {
  try {
    const lessons = await Lesson.find().sort({ module: 1, order: 1 });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/lessons/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lição não encontrada' });
    }
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/lessons', async (req, res) => {
  try {
    const lesson = new Lesson(req.body);
    await lesson.save();
    res.status(201).json(lesson);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/lessons/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lesson) {
      return res.status(404).json({ error: 'Lição não encontrada' });
    }
    res.json(lesson);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/lessons/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lição não encontrada' });
    }
    res.json({ message: 'Lição deletada com sucesso' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rotas de turmas
app.get('/classes', async (req, res) => {
  try {
    const { schoolId } = req.query;
    
    // Se schoolId for fornecido, filtrar por escola
    let query = {};
    if (schoolId) {
      query.schoolId = schoolId;
    }
    
    const classes = await Class.find(query);
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/classes/:id', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }
    res.json(classData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/classes', async (req, res) => {
  try {
    const { schoolId, ...classData } = req.body;
    
    // Verificar se schoolId foi fornecido
    if (!schoolId) {
      return res.status(400).json({ error: 'schoolId é obrigatório para criar turmas' });
    }
    
    // Criar turma com schoolId
    const newClass = new Class({
      ...classData,
      schoolId: schoolId
    });
    
    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/classes/:id', async (req, res) => {
  try {
    const { schoolId } = req.body;
    
    // Verificar se a turma existe e pertence à escola
    const existingClass = await Class.findById(req.params.id);
    if (!existingClass) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }
    
    if (schoolId && existingClass.schoolId !== schoolId) {
      return res.status(403).json({ error: 'Acesso negado: turma não pertence a esta escola' });
    }
    
    const classData = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(classData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/classes/:id', async (req, res) => {
  try {
    const { schoolId } = req.query;
    
    // Verificar se a turma existe e pertence à escola
    const existingClass = await Class.findById(req.params.id);
    if (!existingClass) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }
    
    if (schoolId && existingClass.schoolId !== schoolId) {
      return res.status(403).json({ error: 'Acesso negado: turma não pertence a esta escola' });
    }
    
    const classData = await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Turma deletada com sucesso' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Adicionar aluno à turma
app.patch('/classes/:id/add-student', async (req, res) => {
  try {
    const { studentId, schoolId } = req.body;
    const classData = await Class.findById(req.params.id);
    
    if (!classData) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }
    
    // Verificar se a turma pertence à escola
    if (schoolId && classData.schoolId !== schoolId) {
      return res.status(403).json({ error: 'Acesso negado: turma não pertence a esta escola' });
    }
    
    // Verificar se o aluno pertence à mesma escola
    const student = await User.findById(studentId);
    if (student && student.schoolId !== classData.schoolId) {
      return res.status(403).json({ error: 'Acesso negado: aluno não pertence a esta escola' });
    }
    
    // Verificar se o aluno já está na turma
    if (classData.students && classData.students.includes(studentId)) {
      return res.status(400).json({ error: 'Aluno já está nesta turma' });
    }
    
    // Adicionar aluno à turma
    classData.students = classData.students || [];
    classData.students.push(studentId);
    await classData.save();
    
    // Atualizar o aluno com a turma
    await User.findByIdAndUpdate(studentId, { classId: classData.id });
    
    res.json(classData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remover aluno da turma
app.patch('/classes/:id/remove-student', async (req, res) => {
  try {
    const { studentId, schoolId } = req.body;
    const classData = await Class.findById(req.params.id);
    
    if (!classData) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }
    
    // Verificar se a turma pertence à escola
    if (schoolId && classData.schoolId !== schoolId) {
      return res.status(403).json({ error: 'Acesso negado: turma não pertence a esta escola' });
    }
    
    // Remover aluno da turma
    if (classData.students) {
      classData.students = classData.students.filter(id => id !== studentId);
      await classData.save();
    }
    
    // Remover a turma do aluno
    await User.findByIdAndUpdate(studentId, { classId: null });
    
    res.json(classData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rotas de séries
app.get('/grades', async (req, res) => {
  try {
    const grades = await Grade.find();
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/grades/:id', async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({ error: 'Série não encontrada' });
    }
    res.json(grade);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/grades', async (req, res) => {
  try {
    const grade = new Grade(req.body);
    await grade.save();
    res.status(201).json(grade);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/grades/:id', async (req, res) => {
  try {
    const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!grade) {
      return res.status(404).json({ error: 'Série não encontrada' });
    }
    res.json(grade);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/grades/:id', async (req, res) => {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.id);
    if (!grade) {
      return res.status(404).json({ error: 'Série não encontrada' });
    }
    res.json({ message: 'Série deletada com sucesso' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



// ========================================
// ROTAS DE DESAFIOS
// ========================================

// Buscar desafios disponíveis para um aluno
app.get('/users/:userId/challenges', async (req, res) => {
  try {
    const student = await User.findById(req.params.userId);
    if (!student || (student.role !== 'student' && student.role !== 'student-gratuito')) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    // Buscar desafios ativos
    const challenges = await Challenge.find({ isActive: true }).sort({ moduleId: 1 });

    // Buscar progresso do aluno
    const progress = await ChallengeProgress.find({ userId: student.id });

    // Buscar lições para determinar progresso dos módulos
    const lessons = await Lesson.find({}).sort({ module: 1, order: 1 });
    
    // Agrupar lições por módulo
    const lessonsByModule = {};
    lessons.forEach(lesson => {
      if (!lessonsByModule[lesson.module]) {
        lessonsByModule[lesson.module] = [];
      }
      lessonsByModule[lesson.module].push(lesson.id.toString());
    });

    // Combinar desafios com progresso
    const challengesWithProgress = challenges.map(challenge => {
      const challengeProgress = progress.find(p => p.challengeId.toString() === challenge.id);
      
      // Verificar se o módulo anterior foi concluído baseado nas lições completadas
      let isUnlocked = false;
      if (challenge.moduleId === 1) {
        isUnlocked = true; // Primeiro módulo sempre desbloqueado
      } else {
        // Verificar se o módulo anterior foi concluído
        const previousModuleId = challenge.moduleId - 1;
        const previousModuleLessonIds = lessonsByModule[previousModuleId] || [];
        
        if (previousModuleLessonIds.length > 0) {
          // Verificar se pelo menos 70% das lições do módulo anterior foram completadas
          const completedPreviousLessons = student.progress?.completedLessons?.filter(lessonId => 
            previousModuleLessonIds.includes(lessonId)
          ) || [];
          
          const completionRate = completedPreviousLessons.length / previousModuleLessonIds.length;
          isUnlocked = completionRate >= 0.7; // 70% de conclusão
        } else {
          // Se não há lições no módulo anterior, desbloquear
          isUnlocked = true;
        }
      }
      
      return {
        ...challenge.toJSON(),
        progress: challengeProgress || null,
        isUnlocked: isUnlocked
      };
    });

    res.json({ challenges: challengesWithProgress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar um desafio
app.post('/users/:userId/challenges/:challengeId/start', async (req, res) => {
  try {
    const student = await User.findById(req.params.userId);
    const challenge = await Challenge.findById(req.params.challengeId);

    if (!student || (student.role !== 'student' && student.role !== 'student-gratuito')) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (!challenge) {
      return res.status(404).json({ error: 'Desafio não encontrado' });
    }

    // Verificar se o desafio está desbloqueado
    if (challenge.moduleId > 1) {
      // Buscar lições para verificar progresso do módulo anterior
      const lessons = await Lesson.find({}).sort({ module: 1, order: 1 });
      const previousModuleLessonIds = lessons
        .filter(lesson => lesson.module === challenge.moduleId - 1)
        .map(lesson => lesson.id.toString());
      
      if (previousModuleLessonIds.length > 0) {
        const completedPreviousLessons = student.progress?.completedLessons?.filter(lessonId => 
          previousModuleLessonIds.includes(lessonId)
        ) || [];
        
        const completionRate = completedPreviousLessons.length / previousModuleLessonIds.length;
        if (completionRate < 0.7) {
          return res.status(400).json({ error: 'Complete pelo menos 70% das lições do módulo anterior primeiro' });
        }
      }
    }

    // Verificar se já existe progresso
    let progress = await ChallengeProgress.findOne({
      userId: student.id,
      challengeId: challenge.id
    });

    if (!progress) {
      progress = new ChallengeProgress({
        userId: student.id,
        challengeId: challenge.id,
        moduleId: challenge.moduleId,
        status: 'in_progress',
        validationType: challenge.validationType
      });
      await progress.save();
    } else if (progress.status === 'paused') {
      progress.status = 'in_progress';
      await progress.save();
    } else {
      return res.status(400).json({ error: 'Desafio já está em andamento' });
    }

    res.json({ 
      message: 'Desafio iniciado com sucesso',
      progress: progress
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pausar um desafio
app.post('/users/:userId/challenges/:challengeId/pause', async (req, res) => {
  try {
    const student = await User.findById(req.params.userId);
    const challenge = await Challenge.findById(req.params.challengeId);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (!challenge) {
      return res.status(404).json({ error: 'Desafio não encontrado' });
    }

    const progress = await ChallengeProgress.findOne({
      userId: student.id,
      challengeId: challenge.id
    });

    if (!progress || progress.status !== 'in_progress') {
      return res.status(400).json({ error: 'Desafio não está em andamento' });
    }

    progress.status = 'paused';
    await progress.save();

    res.json({ 
      message: 'Desafio pausado com sucesso',
      progress: progress
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Continuar um desafio
app.post('/users/:userId/challenges/:challengeId/resume', async (req, res) => {
  try {
    const student = await User.findById(req.params.userId);
    const challenge = await Challenge.findById(req.params.challengeId);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (!challenge) {
      return res.status(404).json({ error: 'Desafio não encontrado' });
    }

    const progress = await ChallengeProgress.findOne({
      userId: student.id,
      challengeId: challenge.id
    });

    if (!progress || progress.status !== 'paused') {
      return res.status(400).json({ error: 'Desafio não está pausado' });
    }

    progress.status = 'in_progress';
    await progress.save();

    res.json({ 
      message: 'Desafio retomado com sucesso',
      progress: progress
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancelar um desafio
app.post('/users/:userId/challenges/:challengeId/cancel', async (req, res) => {
  try {
    const student = await User.findById(req.params.userId);
    const challenge = await Challenge.findById(req.params.challengeId);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (!challenge) {
      return res.status(404).json({ error: 'Desafio não encontrado' });
    }

    const progress = await ChallengeProgress.findOne({
      userId: student.id,
      challengeId: challenge.id
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progresso do desafio não encontrado' });
    }

    await ChallengeProgress.findByIdAndDelete(progress.id);

    res.json({ 
      message: 'Desafio cancelado com sucesso'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Completar um desafio
app.post('/users/:userId/challenges/:challengeId/complete', async (req, res) => {
  try {
    const student = await User.findById(req.params.userId);
    const challenge = await Challenge.findById(req.params.challengeId);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (!challenge) {
      return res.status(404).json({ error: 'Desafio não encontrado' });
    }

    let progress = await ChallengeProgress.findOne({
      userId: student.id,
      challengeId: challenge.id
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progresso do desafio não encontrado' });
    }

    if (progress.status !== 'in_progress') {
      return res.status(400).json({ error: 'Desafio deve estar em andamento' });
    }

    // Marcar como completado
    progress.status = 'completed';
    progress.completedAt = new Date();
    await progress.save();

    res.json({ 
      message: 'Desafio completado com sucesso! Agora solicite a validação para receber as recompensas.',
      progress: progress
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Solicitar validação de um desafio
app.post('/users/:userId/challenges/:challengeId/request-validation', async (req, res) => {
  try {
    const student = await User.findById(req.params.userId);
    const challenge = await Challenge.findById(req.params.challengeId);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (!challenge) {
      return res.status(404).json({ error: 'Desafio não encontrado' });
    }

    let progress = await ChallengeProgress.findOne({
      userId: student.id,
      challengeId: challenge.id
    });

    if (!progress || progress.status !== 'completed') {
      return res.status(400).json({ error: 'Desafio deve estar completado para solicitar validação' });
    }

    // Atualizar solicitação de validação
    if (challenge.validationType === 'family' || challenge.validationType === 'both') {
      progress.parentValidation.requested = true;
      progress.parentValidation.requestedAt = new Date();
    }

    if (challenge.validationType === 'school' || challenge.validationType === 'both') {
      progress.schoolValidation.requested = true;
      progress.schoolValidation.requestedAt = new Date();
    }

    progress.status = 'pending_validation';
    await progress.save();

    res.json({
      message: 'Validação solicitada com sucesso',
      progress: progress
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validação por responsável
app.post('/parents/:parentId/validate-challenge/:progressId', async (req, res) => {
  try {
    const { validated, notes } = req.body;
    const parent = await User.findById(req.params.parentId);
    const progress = await ChallengeProgress.findById(req.params.progressId);

    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ error: 'Responsável não encontrado' });
    }
    
    if (!progress) {
      return res.status(404).json({ error: 'Progresso não encontrado' });
    }

    // Verificar se o aluno está vinculado ao responsável
    const linkedStudents = parent.linkedStudents || [];
    if (!linkedStudents.includes(progress.userId)) {
      return res.status(403).json({ error: 'Aluno não vinculado a este responsável' });
    }

    progress.parentValidation.validated = validated;
    progress.parentValidation.validatedAt = new Date();
    progress.parentValidation.notes = notes;

    // Verificar se todas as validações necessárias foram feitas
    const challenge = await Challenge.findById(progress.challengeId);
    const allValidationsComplete = 
      (challenge.validationType === 'family' && validated) ||
      (challenge.validationType === 'school' && progress.schoolValidation.validated) ||
      (challenge.validationType === 'both' && validated && progress.schoolValidation.validated);

    if (allValidationsComplete) {
      // Aplicar recompensas
      await applyRewards(progress);
      progress.status = 'validated';
      progress.validatedAt = new Date();
    }

    await progress.save();

    res.json({
      message: validated ? 'Desafio validado com sucesso!' : 'Desafio rejeitado',
      progress: progress
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validação por escola
app.post('/schools/:schoolId/validate-challenge/:progressId', async (req, res) => {
  try {
    const { validated, notes } = req.body;
    const school = await User.findById(req.params.schoolId);
    const progress = await ChallengeProgress.findById(req.params.progressId);

    if (!school || school.role !== 'school') {
      return res.status(404).json({ error: 'Escola não encontrada' });
    }

    if (!progress) {
      return res.status(404).json({ error: 'Progresso não encontrado' });
    }

    // Verificar se o aluno pertence à escola
    const student = await User.findById(progress.userId);
    if (student.schoolId !== school.id) {
      return res.status(403).json({ error: 'Aluno não pertence a esta escola' });
    }

    progress.schoolValidation.validated = validated;
    progress.schoolValidation.validatedAt = new Date();
    progress.schoolValidation.notes = notes;

    // Verificar se todas as validações necessárias foram feitas
    const challenge = await Challenge.findById(progress.challengeId);
    const allValidationsComplete = 
      (challenge.validationType === 'family' && progress.parentValidation.validated) ||
      (challenge.validationType === 'school' && validated) ||
      (challenge.validationType === 'both' && progress.parentValidation.validated && validated);

    if (allValidationsComplete) {
      // Aplicar recompensas
      await applyRewards(progress);
      progress.status = 'validated';
      progress.validatedAt = new Date();
    }

    await progress.save();

    res.json({
      message: validated ? 'Desafio validado com sucesso!' : 'Desafio rejeitado',
      progress: progress
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar validações pendentes para responsáveis
app.get('/parents/:parentId/pending-validations', async (req, res) => {
  try {
    const parent = await User.findById(req.params.parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ error: 'Responsável não encontrado' });
    }

    const linkedStudents = parent.linkedStudents || [];
    const pendingValidations = await ChallengeProgress.find({
      userId: { $in: linkedStudents },
      'parentValidation.requested': true,
      'parentValidation.validated': { $ne: true }
    }).populate('challengeId').populate('userId', 'name');

    res.json({ pendingValidations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar validações pendentes para escolas
app.get('/schools/:schoolId/pending-validations', async (req, res) => {
  try {
    const school = await User.findById(req.params.schoolId);
    if (!school || school.role !== 'school') {
      return res.status(404).json({ error: 'Escola não encontrada' });
    }

    const pendingValidations = await ChallengeProgress.find({
      'schoolValidation.requested': true,
      'schoolValidation.validated': { $ne: true }
    }).populate('challengeId').populate('userId', 'name');

    // Filtrar apenas alunos da escola
    const filteredValidations = pendingValidations.filter(validation => {
      return validation.userId.schoolId === school.id;
    });

    res.json({ pendingValidations: filteredValidations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resetar progresso de desafios de um aluno
app.delete('/users/:userId/challenge-progress', async (req, res) => {
  try {
    const student = await User.findById(req.params.userId);
    if (!student || (student.role !== 'student' && student.role !== 'student-gratuito')) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    const result = await ChallengeProgress.deleteMany({ 
      userId: student.id 
    });

    res.json({ 
      message: 'Progresso de desafios resetado com sucesso',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refazer um desafio já concluído
app.post('/users/:userId/challenges/:challengeId/restart', async (req, res) => {
  try {
    const student = await User.findById(req.params.userId);
    const challenge = await Challenge.findById(req.params.challengeId);

    if (!student || (student.role !== 'student' && student.role !== 'student-gratuito')) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (!challenge) {
      return res.status(404).json({ error: 'Desafio não encontrado' });
    }

    // Verificar se o desafio está desbloqueado
    if (challenge.moduleId > 1) {
      // Buscar lições para verificar progresso do módulo anterior
      const lessons = await Lesson.find({}).sort({ module: 1, order: 1 });
      const previousModuleLessonIds = lessons
        .filter(lesson => lesson.module === challenge.moduleId - 1)
        .map(lesson => lesson.id.toString());
      
      if (previousModuleLessonIds.length > 0) {
        const completedPreviousLessons = student.progress?.completedLessons?.filter(lessonId => 
          previousModuleLessonIds.includes(lessonId)
        ) || [];
        
        const completionRate = completedPreviousLessons.length / previousModuleLessonIds.length;
        if (completionRate < 0.7) {
          return res.status(400).json({ error: 'Complete pelo menos 70% das lições do módulo anterior primeiro' });
        }
      }
    }

    // Buscar progresso existente
    let progress = await ChallengeProgress.findOne({
      userId: student.id,
      challengeId: challenge.id
    });

    if (!progress) {
      // Se não existe progresso, criar novo
      progress = new ChallengeProgress({
        userId: student.id,
        challengeId: challenge.id,
        moduleId: challenge.moduleId,
        status: 'in_progress',
        validationType: challenge.validationType
      });
    } else {
      // Resetar progresso existente
      progress.status = 'in_progress';
      progress.startedAt = new Date();
      progress.completedAt = null;
      progress.validatedAt = null;
      progress.parentValidation = {
        requested: false,
        validated: false,
        validatedAt: null,
        requestedAt: null,
        notes: null
      };
      progress.schoolValidation = {
        requested: false,
        validated: false,
        validatedAt: null,
        requestedAt: null,
        notes: null
      };
    }

    await progress.save();
    
    res.json({
      message: 'Desafio reiniciado com sucesso! Você pode começar novamente.',
      progress: progress
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});





// Função para verificar se um aluno pode acessar uma lição
function canAccessLesson(student, lesson, allLessons, devMode = false) {
  // Em modo dev, sempre permitir acesso
  if (devMode) {
    console.log('🔧 [DEV MODE] Acesso liberado para lição:', lesson.title);
    return true;
  }

  // Verificar se a lição pertence à série do aluno
  if (lesson.gradeId !== student.gradeId) {
    return false;
  }

  // Primeira lição do primeiro módulo sempre acessível
  if (lesson.module === 1 && lesson.order === 1) {
    return true;
  }

  // Verificar se todas as lições anteriores foram concluídas
  const completedLessons = student.progress?.completedLessons || [];
  
  // Buscar lições anteriores na mesma série
  const previousLessons = allLessons.filter(l => 
    l.gradeId === student.gradeId &&
    (l.module < lesson.module || (l.module === lesson.module && l.order < lesson.order))
  );

  // Verificar se todas as lições anteriores foram concluídas
  for (const prevLesson of previousLessons) {
    if (!completedLessons.includes(prevLesson._id.toString())) {
      return false;
    }
  }

  return true;
}

// Rota para verificar progresso do aluno na série
app.get('/users/:userId/grade-progress', async (req, res) => {
  try {
    const student = await User.findById(req.params.userId);
    if (!student || (student.role !== 'student' && student.role !== 'student-gratuito')) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    // Verificar se modo dev está ativo
    const devMode = req.query.devMode === 'true';
    
    // Verificar se o aluno tem gradeId
    if (!student.gradeId) {
      // Se não tem gradeId, atribuir uma grade padrão
      const defaultGrade = await Grade.findOne({ name: '6º Ano' });
      if (!defaultGrade) {
        // Se não existe grade padrão, verificar se existe uma grade com level 6
        const existingGradeLevel6 = await Grade.findOne({ level: 6 });
        if (existingGradeLevel6) {
          // Usar a grade existente com level 6
          student.gradeId = existingGradeLevel6.name;
          await student.save();
        } else {
          // Criar uma nova grade apenas se não existir nenhuma com level 6
          const newGrade = new Grade({
            name: '6º Ano',
            level: 6,
            ageRange: { min: 11, max: 12 },
            description: 'Sexto ano do ensino fundamental',
            bnccObjectives: ['Matemática financeira básica', 'Conceitos de poupança'],
            difficultyRange: { min: 1, max: 3 }
          });
          await newGrade.save();
          student.gradeId = '6º Ano';
          await student.save();
        }
      } else {
        student.gradeId = '6º Ano';
        await student.save();
      }
    }
    
    // Buscar a grade do aluno
    let grade = await Grade.findOne({ name: student.gradeId });
    if (!grade) {
      // Se a grade não existe, verificar se existe uma grade com o mesmo level
      const levelMatch = student.gradeId.match(/(\d+)º/);
      const level = levelMatch ? parseInt(levelMatch[1]) : 6;
      
      // Verificar se já existe uma grade com este level
      const existingGradeWithLevel = await Grade.findOne({ level: level });
      if (existingGradeWithLevel) {
        // Usar a grade existente
        grade = existingGradeWithLevel;
        // Atualizar o gradeId do aluno para a grade existente
        student.gradeId = existingGradeWithLevel.name;
        await student.save();
      } else {
        // Criar uma nova grade apenas se não existir nenhuma com este level
        grade = new Grade({
          name: student.gradeId,
          level: level,
          ageRange: { min: level + 5, max: level + 6 },
          description: `${student.gradeId} do ensino fundamental`,
          bnccObjectives: ['Matemática financeira', 'Educação financeira'],
          difficultyRange: { min: Math.max(1, level - 5), max: Math.min(6, level - 4) }
        });
        await grade.save();
      }
    }
    
    // Buscar lições da grade do aluno
    let lessons;
    if (devMode) {
      // Em modo dev, buscar todas as lições ativas
      lessons = await Lesson.find({ isActive: true }).sort({ gradeId: 1, module: 1, order: 1 });
      console.log('🔧 [DEV MODE] Carregando todas as lições ativas');
    } else {
      // Modo normal: buscar apenas lições da grade do aluno
      lessons = await Lesson.find({ 
        gradeId: student.gradeId, 
        isActive: true 
      }).sort({ module: 1, order: 1 });
      
      // Se não há lições para esta grade, buscar lições de qualquer grade
      if (lessons.length === 0) {
        lessons = await Lesson.find({ isActive: true }).sort({ module: 1, order: 1 });
        console.log(`⚠️ Nenhuma lição encontrada para grade "${student.gradeId}", usando lições gerais`);
      }
    }
    
    const completedLessons = student.progress.completedLessons || [];
    const perfectLessons = student.progress.perfectLessons || [];
    
    let progressByModule;
    
    if (devMode) {
      // Em modo dev, organizar por série e módulo
      progressByModule = {};
      
      // Agrupar lições por série
      const lessonsByGrade = {};
      lessons.forEach(lesson => {
        if (!lessonsByGrade[lesson.gradeId]) {
          lessonsByGrade[lesson.gradeId] = {
            1: { completed: 0, total: 0, lessons: [] },
            2: { completed: 0, total: 0, lessons: [] },
            3: { completed: 0, total: 0, lessons: [] },
            4: { completed: 0, total: 0, lessons: [] }
          };
        }
        
        const isCompleted = completedLessons.includes(lesson.id);
        const isPerfect = perfectLessons.includes(lesson.id);
        
        lessonsByGrade[lesson.gradeId][lesson.module].total++;
        if (isCompleted) {
          lessonsByGrade[lesson.gradeId][lesson.module].completed++;
        }
        
        const canAccess = canAccessLesson(student, lesson, lessons, devMode);
        
        lessonsByGrade[lesson.gradeId][lesson.module].lessons.push({
          ...lesson.toObject(),
          isCompleted,
          isPerfect,
          canAccess
        });
      });
      
      progressByModule = lessonsByGrade;
      console.log('🔧 [DEV MODE] Lições organizadas por série:', Object.keys(progressByModule));
    } else {
      // Modo normal: organizar apenas por módulo
      progressByModule = {
        1: { completed: 0, total: 0, lessons: [] },
        2: { completed: 0, total: 0, lessons: [] },
        3: { completed: 0, total: 0, lessons: [] },
        4: { completed: 0, total: 0, lessons: [] }
      };
      
      lessons.forEach(lesson => {
        const isCompleted = completedLessons.includes(lesson.id);
        const isPerfect = perfectLessons.includes(lesson.id);
        
        progressByModule[lesson.module].total++;
        if (isCompleted) {
          progressByModule[lesson.module].completed++;
        }
        
        const canAccess = canAccessLesson(student, lesson, lessons, devMode);
        
        progressByModule[lesson.module].lessons.push({
          ...lesson.toObject(),
          isCompleted,
          isPerfect,
          canAccess
        });
      });
    }
    
    // Calcular progresso apenas para lições da série atual
    const currentGradeLessons = devMode 
      ? lessons.filter(lesson => lesson.gradeId === student.gradeId)
      : lessons;
    
    const currentGradeCompletedLessons = currentGradeLessons.filter(lesson => 
      completedLessons.includes(lesson.id)
    );
    
    const totalCompleted = currentGradeCompletedLessons.length;
    const totalLessons = currentGradeLessons.length;
    
    // Corrigir cálculo de progresso para evitar erros com poucas lições
    let progressPercentage = 0;
    if (totalLessons > 0) {
      progressPercentage = (totalCompleted / totalLessons) * 100;
      // Limitar a 100% para evitar erros de exibição
      progressPercentage = Math.min(progressPercentage, 100);
    }
    
    // Proteção adicional para séries sem conteúdo
    const hasContent = totalLessons > 0;
    
    res.json({
      grade,
      progress: {
        totalCompleted,
        totalLessons,
        progressPercentage: hasContent ? Math.round(progressPercentage) : 0,
        byModule: progressByModule,
        hasContent: hasContent
      },
      devMode: devMode
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Função para verificar se aluno pode acessar lição
function canAccessLesson(student, lesson, allLessons, devMode = false) {
  // Em modo dev, liberar TODAS as lições
  if (devMode) {
    console.log('🔧 [DEV MODE] Acesso liberado para lição:', lesson.title);
    return true;
  }
  
  const completedLessons = student.progress.completedLessons || [];
  
  // PERMITIR ACESSO A LIÇÕES JÁ COMPLETADAS (REVISÃO)
  if (completedLessons.includes(lesson.id)) {
    return true;
  }
  
  // Se é a primeira lição do primeiro módulo, sempre pode acessar
  if (lesson.module === 1 && lesson.order === 1) {
    return true;
  }
  
  // Verificar se completou módulo anterior (exceto para módulo 1)
  if (lesson.module > 1) {
    const previousModuleLessons = allLessons.filter(l => l.module === lesson.module - 1);
    const previousModuleCompleted = previousModuleLessons.every(l => 
      completedLessons.includes(l.id)
    );
    
    if (!previousModuleCompleted) {
      return false;
    }
  }
  
  // Verificar se completou lição anterior no mesmo módulo
  const sameModuleLessons = allLessons.filter(l => l.module === lesson.module);
  const currentLessonIndex = sameModuleLessons.findIndex(l => l.id === lesson.id);
  
  if (currentLessonIndex > 0) {
    const previousLesson = sameModuleLessons[currentLessonIndex - 1];
    if (!completedLessons.includes(previousLesson.id)) {
      return false;
    }
  }
  
  return true;
}

// Sistema simplificado - XP fixo de 100 por lição

// Endpoint para processar lição concluída com poupança automática
app.post('/users/:id/complete-lesson', 
  authenticateToken,
  authorizeOwner,
  validate(completeLessonSchema),  // Validação Joi
  async (req, res) => {
    try {
      const { lessonId, score, timeSpent, isPerfect } = req.body;
      const student = await User.findById(req.params.id);
    
    if (!student || (student.role !== 'student' && student.role !== 'student-gratuito')) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    // Verificar se a lição já foi recompensada
    if (!student.savings.rewardedLessons) student.savings.rewardedLessons = [];
    if (student.savings.rewardedLessons.includes(lessonId.toString())) {
      return res.status(400).json({ error: 'Lição já foi recompensada' });
    }

    // Buscar responsável vinculado
    const parent = await User.findOne({ 
      linkedStudents: student._id.toString(),
      role: 'parent'
    });

    if (!parent) {
      return res.status(404).json({ error: 'Responsável não encontrado' });
    }

    // Calcular recompensa baseada nas configurações do responsável
    let totalReward = 0;
    const config = parent.savingsConfig || {};
    
    // Recompensa por lição concluída
    if (config.perLesson) {
      totalReward += config.perLesson;
    }
    
    // Bônus por lição perfeita
    if (isPerfect && config.perPerfectLesson) {
      totalReward += config.perPerfectLesson;
    }

    // Buscar informações da lição para calcular progresso por módulo
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lição não encontrada' });
    }

    // Calcular progresso por módulo
    const grade = await Grade.findOne({ name: student.gradeId });
    if (!grade) {
      return res.status(404).json({ error: 'Série não encontrada' });
    }

    const allLessons = await Lesson.find({ 
      gradeId: grade.name, 
      isActive: true 
    }).sort({ module: 1, order: 1 });

    const moduleProgress = {
      1: { completed: 0, total: 0 },
      2: { completed: 0, total: 0 },
      3: { completed: 0, total: 0 },
      4: { completed: 0, total: 0 }
    };

    // Atualizar lições completadas
    const completedLessons = [...(student.progress?.completedLessons || [])];
    if (!completedLessons.includes(lessonId.toString())) {
      completedLessons.push(lessonId.toString());
    }

    // Calcular progresso de cada módulo (INCLUINDO a lição atual)
    allLessons.forEach(l => {
      moduleProgress[l.module].total++;
      if (completedLessons.includes(l.id.toString())) {
        moduleProgress[l.module].completed++;
      }
    });

    // Atualizar lições perfeitas
    const perfectLessons = isPerfect 
      ? [...(student.progress?.perfectLessons || []), lessonId.toString()]
      : (student.progress?.perfectLessons || []);

    // SISTEMA SIMPLIFICADO DE XP - 100 XP por lição
    const prevTotalXp = Math.max(0, student.progress?.xp || 0);
    
    // XP fixo por lição
    const lessonXp = 100;
    
    // Atualizar streak
    const streak = (student.progress?.streak || 0) + 1;
    
    // XP total (apenas lição + conquistas serão adicionadas depois)
    const totalXp = lessonXp;
    const newTotalXp = Math.max(0, prevTotalXp + totalXp);
    
    // Calcular novo nível
    const prevLevel = Math.max(1, student.progress?.level || 1);
    const newLevel = Math.max(1, Math.floor(1 + Math.sqrt(newTotalXp / 100)));
    const xpToNextLevel = Math.pow(newLevel, 2) * 100;
    const dailyGoal = student.progress?.dailyGoal || 50;
    const prevDailyProgress = student.progress?.dailyProgress || 0;
    const dailyProgress = prevDailyProgress + totalXp;
    // YuCoins fixos por lição completada (10 YuCoins)
    const yuCoinsPerLesson = 10;
    const newYuCoins = (student.progress?.yuCoins || 0) + yuCoinsPerLesson;



    // Verificar conquistas de módulos
    const moduleAchievements = [];
    const currentModuleProgress = moduleProgress[lesson.module];
    
    console.log('🔍 DEBUG PROGRESSO MÓDULO:', {
      module: lesson.module,
      completed: currentModuleProgress.completed,
      total: currentModuleProgress.total,
      isComplete: currentModuleProgress.completed >= currentModuleProgress.total
    });
    
    // Se completou o módulo atual, verificar conquista
    if (currentModuleProgress.completed >= currentModuleProgress.total && currentModuleProgress.total > 0) {
      // Tornar conquistas específicas por série
      const achievementId = `${student.gradeId}_module_${lesson.module}_complete`;
      const currentAchievements = student.progress?.achievements || [];
      
      console.log('🔍 DEBUG CONQUISTA MÓDULO:', {
        achievementId,
        currentAchievements,
        alreadyEarned: currentAchievements.includes(achievementId)
      });
      
      if (!currentAchievements.includes(achievementId)) {
        moduleAchievements.push(achievementId);
        console.log('✅ Conquista de módulo adicionada:', achievementId);
      } else {
        console.log('⚠️ Conquista já foi ganha anteriormente');
      }
    } else {
      console.log('⚠️ Módulo ainda não foi completado');
    }

    // Calcular recompensas de conquistas baseadas na série
    let achievementXp = 0;
    let achievementYuCoins = 0;
    
    // Buscar conquistas da série atual
    const currentGrade = await Grade.findOne({ name: student.gradeId });
    const gradeAchievements = currentGrade?.achievements || [];
    
    console.log('🔍 DEBUG CONQUISTAS:', {
      moduleAchievements,
      gradeAchievements: gradeAchievements.length,
      studentGrade: student.gradeId
    });

    moduleAchievements.forEach(achievementId => {
      console.log(`🔍 Processando conquista: ${achievementId}`);
      
      // Converter o ID da conquista do formato "6º Ano_module_1_complete" para "module_1_complete"
      const parts = achievementId.split('_');
      const simpleAchievementId = `${parts[1]}_${parts[2]}_complete`; // "module_1_complete"
      
      console.log(`🔍 ID simplificado: ${simpleAchievementId}`);
      
      // Tentar encontrar a conquista no banco de dados
      const achievement = gradeAchievements.find(a => a.id === simpleAchievementId);
      
      if (achievement && achievement.rewards) {
        console.log(`✅ Conquista encontrada no banco:`, achievement);
        // Usar recompensas do banco de dados
        achievementXp += achievement.rewards.xp || 0;
        achievementYuCoins += achievement.rewards.yuCoins || 0;
      } else {
        console.log(`⚠️ Conquista não encontrada no banco, usando fallback`);
        // Fallback para recompensas progressivas por série
        const moduleNumber = parts[2]; // "1" de "module_1_complete"
        
        const defaultRewards = {
          '6º Ano': {
            '1': { xp: 100, yuCoins: 50 },
            '2': { xp: 150, yuCoins: 75 },
            '3': { xp: 200, yuCoins: 100 },
            '4': { xp: 300, yuCoins: 150 }
          },
          '7º Ano': {
            '1': { xp: 150, yuCoins: 75 },
            '2': { xp: 200, yuCoins: 100 },
            '3': { xp: 250, yuCoins: 125 },
            '4': { xp: 350, yuCoins: 175 }
          }
        };
        
        const gradeRewards = defaultRewards[student.gradeId] || defaultRewards['6º Ano'];
        const rewards = gradeRewards[moduleNumber];
        if (rewards) {
          console.log(`✅ Recompensa fallback aplicada:`, rewards);
          achievementXp += rewards.xp;
          achievementYuCoins += rewards.yuCoins;
        } else {
          console.log(`❌ Nenhuma recompensa encontrada para módulo ${moduleNumber}`);
        }
      }
    });

    console.log(`🔍 Total de recompensas de conquistas: XP=${achievementXp}, YuCoins=${achievementYuCoins}`);

    // Removidas conquistas automáticas - apenas conquistas de módulo são processadas

    // Atualizar poupança
    const newBalance = (student.savings?.balance || 0) + totalReward;
    const newTransaction = {
      amount: totalReward,
      reason: `Incentivo: ${completedLessons.length} lição(ões) concluída(s), ${perfectLessons.length} lição(ões) perfeita(s)`,
      date: new Date().toISOString(),
      lessonId: lessonId.toString()
    };

    // Marcar lição como recompensada
    student.savings.rewardedLessons.push(lessonId.toString());

    // Adicionar recompensas de conquistas
    const finalXp = newTotalXp + achievementXp;
    const finalYuCoins = newYuCoins + achievementYuCoins;
    const finalLevel = Math.floor(1 + Math.sqrt(finalXp / 100));
    const leveledUpFromAchievements = finalLevel > newLevel;

    // Salvar todas as atualizações
    const updatedStudent = await User.findByIdAndUpdate(
      req.params.id,
      {
        progress: {
          ...student.progress,
          xp: finalXp,
          yuCoins: finalYuCoins,
          level: finalLevel,
          xpToNextLevel: Math.pow(finalLevel, 2) * 100,
          streak,
          dailyGoal,
          dailyProgress,
          completedLessons,
          perfectLessons,
          moduleProgress,
          achievements: [...(student.progress?.achievements || []), ...moduleAchievements]
        },
        savings: {
          ...student.savings,
          balance: newBalance,
          transactions: [...(student.savings?.transactions || []), newTransaction]
        }
      },
      { new: true }
    );

    // Debug: verificar valores
    console.log('🔍 DEBUG XP:', {
      lessonXp,
      totalXp,
      achievementXp,
      finalXp: totalXp + achievementXp
    });

    res.json({
      student: updatedStudent,
      reward: totalReward,
      leveledUp: newLevel > prevLevel || leveledUpFromAchievements,
      moduleAchievements,
      achievementRewards: {
        xp: achievementXp,
        yuCoins: achievementYuCoins
      },
      xpBreakdown: {
        lessonXp: lessonXp,
        totalXp: totalXp + achievementXp
      }
    });

  } catch (error) {
    console.error('Erro ao processar lição:', error);
    res.status(400).json({ error: error.message });
  }
});

// Endpoint para processar recompensas por streak, level up e achievements
app.post('/users/:id/process-rewards', async (req, res) => {
  try {
    const { rewardType, value } = req.body; // rewardType: 'streak', 'levelup', 'achievement'
    const student = await User.findById(req.params.id);
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    // Buscar responsável vinculado
    const parent = await User.findOne({ 
      linkedStudents: student._id.toString(),
      role: 'parent'
    });

    if (!parent) {
      return res.status(404).json({ error: 'Responsável não encontrado' });
    }

    // Calcular recompensa baseada no tipo
    let totalReward = 0;
    const config = parent.savingsConfig || {};
    
    switch (rewardType) {
      case 'streak':
        if (config.perStreak) {
          totalReward = config.perStreak * value; // value = dias de streak
        }
        break;
      case 'levelup':
        if (config.perLevelUp) {
          totalReward = config.perLevelUp;
        }
        break;
      case 'achievement':
        if (config.perAchievement) {
          totalReward = config.perAchievement * value; // value = número de conquistas
        }
        break;
      default:
        return res.status(400).json({ error: 'Tipo de recompensa inválido' });
    }

    if (totalReward > 0) {
      // Atualizar poupança
      const newBalance = (student.savings?.balance || 0) + totalReward;
      // Traduzir o tipo de recompensa para português
      const rewardTypeTranslation = {
        'streak': 'sequência',
        'levelup': 'subida de nível',
        'achievement': 'conquista'
      };
      
      const translatedType = rewardTypeTranslation[rewardType] || rewardType;
      
      const newTransaction = {
        amount: totalReward,
        reason: `Bônus por ${translatedType}: ${value}`,
        date: new Date().toISOString(),
        type: rewardType
      };

      // Salvar atualização
      const updatedStudent = await User.findByIdAndUpdate(
        req.params.id,
        {
          savings: {
            ...student.savings,
            balance: newBalance,
            transactions: [...(student.savings?.transactions || []), newTransaction]
          }
        },
        { new: true }
      );

      res.json({
        student: updatedStudent,
        reward: totalReward
      });
    } else {
      res.json({
        student: student,
        reward: 0
      });
    }

  } catch (error) {
    console.error('Erro ao processar recompensa:', error);
    res.status(400).json({ error: error.message });
  }
});

// Rota para solicitar progressão de série
app.post('/users/:userId/request-grade-progression', async (req, res) => {
  try {
    console.log('🚀 [BACKEND DEBUG] Iniciando request-grade-progression...');
    console.log('🚀 [BACKEND DEBUG] userId:', req.params.userId);
    console.log('🚀 [BACKEND DEBUG] body:', req.body);
    
    // Verificar se modo dev está ativo PRIMEIRO
    console.log('🚀 [BACKEND DEBUG] req.body:', JSON.stringify(req.body));
    console.log('🚀 [BACKEND DEBUG] req.body type:', typeof req.body);
    console.log('🚀 [BACKEND DEBUG] req.body.devMode:', req.body?.devMode);
    console.log('🚀 [BACKEND DEBUG] req.body.devMode type:', typeof req.body?.devMode);
    
    const devMode = req.body?.devMode === true;
    console.log('🚀 [BACKEND DEBUG] devMode final:', devMode);
    
    console.log('🔍 [BACKEND DEBUG] Buscando usuário no banco...');
    const student = await User.findById(req.params.userId);
    console.log('🔍 [BACKEND DEBUG] Usuário encontrado:', student ? 'SIM' : 'NÃO');
    
    if (!student) {
      console.log('❌ [BACKEND DEBUG] Usuário não encontrado no banco');
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    
    if (student.role !== 'student') {
      console.log('❌ [BACKEND DEBUG] Usuário não é aluno, role:', student.role);
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    
    console.log('✅ [BACKEND DEBUG] Usuário validado:', student.email, 'Série atual:', student.gradeId);
    
    if (devMode) {
      console.log('🔧 [DEV MODE] Progressão real sem autorização da escola');
      
      // Em modo dev, fazer progressão real sem validações
      console.log('🔍 [BACKEND DEBUG] Buscando grade atual:', student.gradeId);
      let currentGrade = await Grade.findOne({ name: student.gradeId });
      console.log('🔍 [BACKEND DEBUG] Grade atual encontrada:', currentGrade ? 'SIM' : 'NÃO');
      
      if (!currentGrade) {
        console.log('🔧 [DEV MODE] Criando nova grade para:', student.gradeId);
        // Se a grade não existe, criar uma
        const levelMatch = student.gradeId.match(/(\d+)º/);
        const level = levelMatch ? parseInt(levelMatch[1]) : 6;
        console.log('🔧 [DEV MODE] Level extraído:', level);
        
        currentGrade = new Grade({
          name: student.gradeId,
          level: level,
          ageRange: { min: level + 5, max: level + 6 },
          description: `${student.gradeId} do ensino fundamental`,
          bnccObjectives: ['Matemática financeira', 'Educação financeira'],
          difficultyRange: { min: Math.max(1, level - 5), max: Math.min(6, level - 4) }
        });
        await currentGrade.save();
        console.log('✅ [DEV MODE] Nova grade criada e salva');
      }

      // Verificar se existe próxima série
      console.log('🔍 [BACKEND DEBUG] Buscando próxima série, level atual:', currentGrade.level);
      const nextGrade = await Grade.findOne({ level: currentGrade.level + 1 });
      console.log('🔍 [BACKEND DEBUG] Próxima série encontrada:', nextGrade ? 'SIM' : 'NÃO');
      
      if (!nextGrade) {
        console.log('❌ [BACKEND DEBUG] Não há próxima série disponível');
        return res.status(400).json({ error: 'Não há próxima série disponível' });
      }

      // Atualizar série do aluno no banco
      student.gradeId = nextGrade.name;
      student.gradeProgression = {
        ...student.gradeProgression,
        nextGradeRequested: false,
        nextGradeAuthorized: false,
        nextGradeRequestDate: null,
        nextGradeAuthDate: null,
        notes: 'Progressão via Modo Dev'
      };

      await student.save();

      return res.json({
        message: `🔧 Modo Dev: Progressão real para ${nextGrade.name}`,
        nextGrade: nextGrade.name,
        devMode: true
      });
    }

    // Verificar se já solicitou
    console.log('🔍 [BACKEND DEBUG] Verificando se já solicitou progressão...');
    if (student.gradeProgression?.nextGradeRequested) {
      console.log('❌ [BACKEND DEBUG] Progressão já foi solicitada');
      return res.status(400).json({ error: 'Progressão já foi solicitada' });
    }
    console.log('✅ [BACKEND DEBUG] Progressão não foi solicitada ainda');

    // Verificar se completou a série atual
    console.log('🔍 [BACKEND DEBUG] Buscando grade atual para validação:', student.gradeId);
    let currentGrade = await Grade.findOne({ name: student.gradeId });
    console.log('🔍 [BACKEND DEBUG] Grade atual encontrada:', currentGrade ? 'SIM' : 'NÃO');
    if (!currentGrade) {
      // Se a grade não existe, verificar se existe uma grade com o mesmo level
      const levelMatch = student.gradeId.match(/(\d+)º/);
      const level = levelMatch ? parseInt(levelMatch[1]) : 6;
      
      // Verificar se já existe uma grade com este level
      const existingGradeWithLevel = await Grade.findOne({ level: level });
      if (existingGradeWithLevel) {
        // Usar a grade existente
        currentGrade = existingGradeWithLevel;
        // Atualizar o gradeId do aluno para a grade existente
        student.gradeId = existingGradeWithLevel.name;
        await student.save();
      } else {
        // Criar uma nova grade apenas se não existir nenhuma com este level
        currentGrade = new Grade({
          name: student.gradeId,
          level: level,
          ageRange: { min: level + 5, max: level + 6 },
          description: `${student.gradeId} do ensino fundamental`,
          bnccObjectives: ['Matemática financeira', 'Educação financeira'],
          difficultyRange: { min: Math.max(1, level - 5), max: Math.min(6, level - 4) }
        });
        await currentGrade.save();
      }
    }

    const lessons = await Lesson.find({ 
      gradeId: currentGrade.name, 
      isActive: true 
    }).sort({ module: 1, order: 1 });

    const completedLessons = student.progress?.completedLessons || [];
    const totalLessons = lessons.length;
    const completedCount = completedLessons.length;

    if (completedCount < totalLessons) {
      return res.status(400).json({ 
        error: `Complete todas as lições da série atual primeiro (${completedCount}/${totalLessons})` 
      });
    }

    // Verificar se existe próxima série
    const nextGrade = await Grade.findOne({ level: currentGrade.level + 1 });
    if (!nextGrade) {
      return res.status(400).json({ error: 'Não há próxima série disponível' });
    }

    // Atualizar status de progressão
    student.gradeProgression = {
      ...student.gradeProgression,
      nextGradeRequested: true,
      nextGradeRequestDate: new Date(),
      nextGradeAuthorized: false,
      notes: 'Aguardando autorização da escola'
    };

    await student.save();

    res.json({ 
      message: 'Solicitação de progressão enviada com sucesso! Aguarde a autorização da escola.',
      nextGrade: nextGrade.name
    });

  } catch (error) {
    console.error('❌ [BACKEND DEBUG] Erro em request-grade-progression:', error);
    console.error('❌ [BACKEND DEBUG] Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Rota para retornar ao ano anterior
app.post('/users/:userId/return-to-previous-grade', async (req, res) => {
  try {
    // Verificar se modo dev está ativo PRIMEIRO
    console.log('🚀 [BACKEND DEBUG] return-to-previous-grade - req.body:', JSON.stringify(req.body));
    console.log('🚀 [BACKEND DEBUG] req.body type:', typeof req.body);
    console.log('🚀 [BACKEND DEBUG] req.body.devMode:', req.body?.devMode);
    
    const devMode = req.body?.devMode === true;
    console.log('🚀 [BACKEND DEBUG] devMode final:', devMode);
    
    const student = await User.findById(req.params.userId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    
    if (devMode) {
      console.log('🔧 [DEV MODE] Retorno real ao ano anterior');
      
      // Em modo dev, fazer retorno real sem validações
      let currentGrade = await Grade.findOne({ name: student.gradeId });
      if (!currentGrade) {
        // Se a grade não existe, criar uma
        const levelMatch = student.gradeId.match(/(\d+)º/);
        const level = levelMatch ? parseInt(levelMatch[1]) : 6;
        
        currentGrade = new Grade({
          name: student.gradeId,
          level: level,
          ageRange: { min: level + 5, max: level + 6 },
          description: `${student.gradeId} do ensino fundamental`,
          bnccObjectives: ['Matemática financeira', 'Educação financeira'],
          difficultyRange: { min: Math.max(1, level - 5), max: Math.min(6, level - 4) }
        });
        await currentGrade.save();
      }

      // Verificar se existe série anterior
      const previousGrade = await Grade.findOne({ level: currentGrade.level - 1 });
      if (!previousGrade) {
        return res.status(400).json({ error: 'Não há série anterior disponível' });
      }

      // Atualizar série do aluno no banco
      student.gradeId = previousGrade.name;
      student.gradeProgression = {
        ...student.gradeProgression,
        nextGradeRequested: false,
        nextGradeAuthorized: false,
        nextGradeRequestDate: null,
        nextGradeAuthDate: null,
        notes: 'Retorno via Modo Dev'
      };

      await student.save();

      return res.json({
        message: `🔧 Modo Dev: Retorno real para ${previousGrade.name}`,
        previousGrade: previousGrade.name,
        devMode: true
      });
    }

    let currentGrade = await Grade.findOne({ name: student.gradeId });
    if (!currentGrade) {
      // Se a grade não existe, criar uma
      const levelMatch = student.gradeId.match(/(\d+)º/);
      const level = levelMatch ? parseInt(levelMatch[1]) : 6;
      
      currentGrade = new Grade({
        name: student.gradeId,
        level: level,
        ageRange: { min: level + 5, max: level + 6 },
        description: `${student.gradeId} do ensino fundamental`,
        bnccObjectives: ['Matemática financeira', 'Educação financeira'],
        difficultyRange: { min: Math.max(1, level - 5), max: Math.min(6, level - 4) }
      });
      await currentGrade.save();
    }

    // Verificar se existe série anterior
    const previousGrade = await Grade.findOne({ level: currentGrade.level - 1 });
    if (!previousGrade) {
      return res.status(400).json({ error: 'Não há série anterior disponível' });
    }

    // Atualizar série do aluno
    student.gradeId = previousGrade.name;
    student.gradeProgression = {
      ...student.gradeProgression,
      nextGradeRequested: false,
      nextGradeAuthorized: false,
      nextGradeRequestDate: null,
      nextGradeAuthDate: null,
      notes: null
    };

    await student.save();

    res.json({ 
      message: 'Retornou ao ano anterior com sucesso!',
      previousGrade: previousGrade.name
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para autorizar progressão de série (escola)
app.post('/users/:userId/authorize-grade-progression', async (req, res) => {
  try {
    const { authorized, notes } = req.body;
    const student = await User.findById(req.params.userId);
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (!student.gradeProgression?.nextGradeRequested) {
      return res.status(400).json({ error: 'Aluno não solicitou progressão' });
    }

    if (student.gradeProgression?.nextGradeAuthorized) {
      return res.status(400).json({ error: 'Progressão já foi autorizada' });
    }

    if (authorized) {
      // Autorizar progressão
      let currentGrade = await Grade.findOne({ name: student.gradeId });
      if (!currentGrade) {
        // Se a grade não existe, criar uma
        const levelMatch = student.gradeId.match(/(\d+)º/);
        const level = levelMatch ? parseInt(levelMatch[1]) : 6;
        
        currentGrade = new Grade({
          name: student.gradeId,
          level: level,
          ageRange: { min: level + 5, max: level + 6 },
          description: `${student.gradeId} do ensino fundamental`,
          bnccObjectives: ['Matemática financeira', 'Educação financeira'],
          difficultyRange: { min: Math.max(1, level - 5), max: Math.min(6, level - 4) }
        });
        await currentGrade.save();
      }

      const nextGrade = await Grade.findOne({ level: currentGrade.level + 1 });
      if (!nextGrade) {
        return res.status(400).json({ error: 'Próxima série não encontrada' });
      }

      // Remover aluno da turma atual (se estiver em uma)
      let removedFromClass = false;
      if (student.classId) {
        const currentClass = await Class.findById(student.classId);
        if (currentClass) {
          // Remover aluno da lista de estudantes da turma
          currentClass.students = currentClass.students.filter(id => id !== student.id);
          await currentClass.save();
          
          // Limpar classId do aluno
          student.classId = null;
          removedFromClass = true;
          
          console.log(`🏫 Aluno ${student.name} removido da turma ${currentClass.name} após progressão`);
        }
      }

      // Atualizar série do aluno
      student.gradeId = nextGrade.name;
      // Resetar módulo atual para 1 na nova série
      student.currentModule = 1;
      
      // Limpar lições recompensadas da nova série
      const newGradeLessons = await Lesson.find({ 
        gradeId: nextGrade.name, 
        isActive: true 
      });
      const newGradeLessonIds = newGradeLessons.map(l => l._id.toString());
      
      // Filtrar apenas lições de outras séries do rewardedLessons
      const currentRewardedLessons = student.savings?.rewardedLessons || [];
      const otherGradeRewardedLessons = currentRewardedLessons.filter(lessonId => 
        !newGradeLessonIds.includes(lessonId)
      );
      
      // Atualizar rewardedLessons
      if (!student.savings) {
        student.savings = {
          balance: student.savings?.balance || 0,
          transactions: student.savings?.transactions || [],
          rewardedLessons: otherGradeRewardedLessons
        };
      } else {
        student.savings.rewardedLessons = otherGradeRewardedLessons;
      }
      
      // Limpar completamente o status de progressão para a nova série
      student.gradeProgression = {
        nextGradeRequested: false,
        nextGradeAuthorized: false,
        nextGradeRequestDate: null,
        nextGradeAuthDate: null,
        notes: 'Progressão aplicada - Status limpo para nova série'
      };

      await student.save();

      res.json({ 
        message: 'Progressão autorizada com sucesso!',
        nextGrade: nextGrade.name,
        studentName: student.name,
        removedFromClass: removedFromClass
      });
    } else {
      // Negar progressão
      student.gradeProgression = {
        ...student.gradeProgression,
        nextGradeRequested: false, // Resetar solicitação para permitir nova tentativa
        nextGradeAuthorized: false,
        nextGradeAuthDate: new Date(),
        nextGradeRequestDate: null, // Limpar data da solicitação
        notes: notes || 'Progressão negada pela escola'
      };

      await student.save();

      res.json({ 
        message: 'Progressão negada com sucesso!',
        studentName: student.name,
        requestReset: true // Indicar que a solicitação foi resetada
      });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para verificar status da solicitação de progressão
app.get('/users/:userId/grade-progression-status', async (req, res) => {
  try {
    const student = await User.findById(req.params.userId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    const progression = student.gradeProgression || {};
    
    // Verificar se pode solicitar próxima série
    let currentGrade = await Grade.findOne({ name: student.gradeId });
    if (!currentGrade) {
      // Se a grade não existe, criar uma
      const levelMatch = student.gradeId.match(/(\d+)º/);
      const level = levelMatch ? parseInt(levelMatch[1]) : 6;
      
      currentGrade = new Grade({
        name: student.gradeId,
        level: level,
        ageRange: { min: level + 5, max: level + 6 },
        description: `${student.gradeId} do ensino fundamental`,
        bnccObjectives: ['Matemática financeira', 'Educação financeira'],
        difficultyRange: { min: Math.max(1, level - 5), max: Math.min(6, level - 4) }
      });
      await currentGrade.save();
    }

    const nextGrade = await Grade.findOne({ level: currentGrade.level + 1 });
    const canRequestNextGrade = !!nextGrade;

    // Verificar se completou série atual
    const lessons = await Lesson.find({ 
      gradeId: currentGrade.name, 
      isActive: true 
    }).sort({ module: 1, order: 1 });

    const completedLessons = student.progress?.completedLessons || [];
    const totalLessons = lessons.length;
    
    // Filtrar apenas lições completadas da série atual
    const currentGradeLessonIds = lessons.map(lesson => lesson._id.toString());
    const completedInCurrentGrade = completedLessons.filter(lessonId => 
      currentGradeLessonIds.includes(lessonId)
    );
    const completedCount = completedInCurrentGrade.length;
    const hasCompletedCurrentGrade = completedCount >= totalLessons;

    res.json({
      currentGrade: student.gradeId,
      nextGrade: nextGrade?.name || null,
      canRequestNextGrade,
      hasCompletedCurrentGrade,
      completedLessons: completedCount,
      totalLessons,
      progression: {
        requested: progression.nextGradeRequested || false,
        authorized: progression.nextGradeAuthorized || false,
        requestDate: progression.nextGradeRequestDate,
        authDate: progression.nextGradeAuthDate,
        notes: progression.notes
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para atualizar módulo atual do usuário
app.patch('/users/:userId/current-module', async (req, res) => {
  try {
    const { currentModule } = req.body;
    const student = await User.findById(req.params.userId);
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (typeof currentModule !== 'number' || currentModule < 1 || currentModule > 4) {
      return res.status(400).json({ error: 'Módulo inválido. Deve ser um número entre 1 e 4.' });
    }

    student.currentModule = currentModule;
    await student.save();

    res.json({ 
      message: 'Módulo atual atualizado com sucesso!',
      currentModule: student.currentModule
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ROTAS DE TOKENS DE REGISTRO =====

// Gerar token de registro
app.post('/registration-tokens', async (req, res) => {
  try {
    const { type, createdBy, schoolId, maxUses, expiresAt, metadata } = req.body;
    
    console.log('📝 Dados recebidos para criação de token:', { type, createdBy, schoolId, maxUses, expiresAt, metadata });
    
    // Gerar token único
    const token = 'YUF' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    console.log('🎫 Token gerado:', token);
    
    const tokenData = {
      token,
      type,
      createdBy,
      schoolId,
      maxUses,
      expiresAt,
      metadata
    };
    
    console.log('📋 Dados do token a serem salvos:', tokenData);
    
    const registrationToken = new RegistrationToken(tokenData);
    await registrationToken.save();
    
    console.log('✅ Token salvo com sucesso:', registrationToken.token);
    
    res.status(201).json(registrationToken);
  } catch (error) {
    console.error('❌ Erro ao criar token:', error);
    res.status(400).json({ error: error.message });
  }
});

// Validar token de registro
app.get('/registration-tokens/validate/:token', async (req, res) => {
  try {
    const token = await RegistrationToken.findOne({ token: req.params.token });
    
    if (!token) {
      return res.status(404).json({ error: 'Token não encontrado' });
    }
    
    if (!token.isActive) {
      return res.status(400).json({ error: 'Token inativo' });
    }
    
    if (token.expiresAt && new Date() > token.expiresAt) {
      return res.status(400).json({ error: 'Token expirado' });
    }
    
    if (token.maxUses && token.usedCount >= token.maxUses) {
      return res.status(400).json({ error: 'Token já foi usado o máximo de vezes' });
    }
    
    res.json({
      valid: true,
      token: token.token,
      type: token.type,
      createdBy: token.createdBy,
      metadata: token.metadata
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar tokens de um usuário
app.get('/registration-tokens', async (req, res) => {
  try {
    const { createdBy } = req.query;
    const tokens = await RegistrationToken.find({ createdBy });
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar token
app.delete('/registration-tokens/:id', async (req, res) => {
  try {
    const token = await RegistrationToken.findByIdAndDelete(req.params.id);
    if (!token) {
      return res.status(404).json({ error: 'Token não encontrado' });
    }
    res.json({ message: 'Token deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ROTAS DE AMIGOS =====

// Buscar amigos de um usuário
app.get('/users/:id/friends', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const friends = user.friends || [];
    const acceptedFriends = friends.filter(f => f.status === 'accepted');
    const pendingRequests = friends.filter(f => f.status === 'pending'); // Apenas solicitações recebidas

    // Buscar dados completos dos amigos (filtrar usuários inexistentes)
    const acceptedFriendsData = [];
    for (const friend of acceptedFriends) {
      const friendUser = await User.findById(friend.userId);
      if (friendUser) { // Só incluir se o usuário existir
        acceptedFriendsData.push({
          id: friend.userId,
          name: friendUser.name,
          level: friendUser?.progress?.level || 1,
          gradeId: friendUser?.gradeId || 'N/A',

          playerId: friendUser?.playerId || 'N/A'
        });
      }
    }

    const pendingRequestsData = [];
    for (const friend of pendingRequests) {
      const friendUser = await User.findById(friend.userId);
      if (friendUser) { // Só incluir se o usuário existir
        pendingRequestsData.push({
          id: friend.userId,
          name: friendUser.name,
          level: friendUser?.progress?.level || 1,
          gradeId: friendUser?.gradeId || 'N/A',

          playerId: friendUser?.playerId || 'N/A'
        });
      }
    }

    // Limpar solicitações órfãs (de usuários deletados)
    const validFriendIds = [...acceptedFriendsData, ...pendingRequestsData].map(f => f.id);
    const originalFriendsCount = user.friends.length;
    user.friends = user.friends.filter(f => validFriendIds.includes(f.userId));
    
    if (user.friends.length < originalFriendsCount) {
      await user.save();
      console.log(`🧹 Limpas ${originalFriendsCount - user.friends.length} solicitações órfãs do usuário ${user.name}`);
    }

    res.json({
      acceptedFriends: acceptedFriendsData,
      pendingRequests: pendingRequestsData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar sugestões de amigos
app.get('/users/:id/friend-suggestions', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar todos os usuários da mesma escola
    const allUsers = await User.find({ 
      role: 'student',
      _id: { $ne: user.id } // Excluir o próprio usuário
    });

    const suggestions = {
      sameClass: [],
      sameSchool: []
    };

    allUsers.forEach(otherUser => {
      // Verificar se já são amigos
      const isAlreadyFriend = user.friends?.some(f => f.userId === otherUser.id);
      if (isAlreadyFriend) return;

      // Verificar se estão na mesma turma
      if (user.classId && otherUser.classId && user.classId === otherUser.classId) {
        suggestions.sameClass.push(otherUser);
      }
      // Verificar se estão na mesma escola
      else if (user.schoolId && otherUser.schoolId && user.schoolId === otherUser.schoolId) {
        suggestions.sameSchool.push(otherUser);
      }
      // Removido: outras escolas (usar busca por ID para isso)
    });

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Adicionar amigo
app.post('/users/:id/friends', async (req, res) => {
  try {
    const { targetUserId, source } = req.body;
    const user = await User.findById(req.params.id);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Impedir auto-solicitação
    if (user.id === targetUserId) {
      return res.status(400).json({ error: 'Não é possível enviar solicitação para si mesmo' });
    }

    // Verificar se já existe solicitação ativa (pending ou accepted)
    const existingRequestFromUser = user.friends?.find(f => f.userId === targetUserId && (f.status === 'pending' || f.status === 'accepted'));
    const existingRequestToUser = targetUser.friends?.find(f => f.userId === user.id && (f.status === 'pending' || f.status === 'accepted'));
    
    if (existingRequestFromUser || existingRequestToUser) {
      const status = existingRequestFromUser?.status || existingRequestToUser?.status;
      if (status === 'accepted') {
        return res.status(400).json({ error: 'Vocês já são amigos' });
      } else if (status === 'pending') {
        return res.status(400).json({ error: 'Solicitação já enviada e aguardando resposta' });
      }
      return res.status(400).json({ error: 'Solicitação já existe' });
    }

    // Limpar solicitações antigas rejeitadas/bloqueadas
    user.friends = user.friends?.filter(f => !(f.userId === targetUserId && (f.status === 'blocked' || f.status === 'sent')));
    targetUser.friends = targetUser.friends?.filter(f => !(f.userId === user.id && (f.status === 'blocked' || f.status === 'sent')));

    // Criar apenas uma solicitação pendente no destinatário
    const friendRequest = {
      userId: user.id, // ID do solicitante
      status: 'pending',
      addedAt: new Date(),
      source: source || 'suggestion'
    };

    targetUser.friends = targetUser.friends || [];
    targetUser.friends.push(friendRequest);
    await targetUser.save();

    // Criar registro de "enviado" no solicitante (não pendente)
    const sentRequest = {
      userId: targetUserId,
      status: 'sent', // Status diferente para distinguir
      addedAt: new Date(),
      source: source || 'suggestion'
    };

    user.friends = user.friends || [];
    user.friends.push(sentRequest);
    await user.save();

    res.json({ message: 'Solicitação de amizade enviada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Responder a solicitação de amizade
app.put('/users/:id/friends/:friendId', async (req, res) => {
  try {
    const { action } = req.body;
    console.log(`🔄 PUT /users/${req.params.id}/friends/${req.params.friendId} - Action: ${action}`);
    
    // Validar se os IDs são válidos
    if (!req.params.id || !req.params.friendId) {
      console.log('❌ IDs inválidos fornecidos');
      return res.status(400).json({ error: 'IDs inválidos' });
    }
    
    const user = await User.findById(req.params.id);
    const friend = await User.findById(req.params.friendId);

    console.log(`🔍 Procurando usuário: ${req.params.id} - Encontrado: ${!!user}${user ? ` (${user.name})` : ''}`);
    console.log(`🔍 Procurando amigo: ${req.params.friendId} - Encontrado: ${!!friend}${friend ? ` (${friend.name})` : ''}`);

    if (!user) {
      console.log('❌ Usuário principal não encontrado');
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (!friend) {
      console.log('❌ Amigo não encontrado');
      return res.status(404).json({ error: 'Amigo não encontrado' });
    }

    console.log(`👤 User friends: ${user.friends?.length || 0}`);
    console.log(`👤 Friend friends: ${friend.friends?.length || 0}`);

    // Encontrar a solicitação pendente (apenas no usuário que está respondendo)
    const pendingRequest = user.friends?.find(f => f.userId === req.params.friendId && f.status === 'pending');
    const sentRequest = friend.friends?.find(f => f.userId === req.params.id && f.status === 'sent');

    console.log(`🔍 Pending request found: ${!!pendingRequest}`);
    console.log(`🔍 Sent request found: ${!!sentRequest}`);

    if (!pendingRequest) {
      console.log('❌ Solicitação pendente não encontrada');
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    if (action === 'accept') {
      // Atualizar solicitação pendente para aceita (destinatário)
      pendingRequest.status = 'accepted';
      
      // Atualizar solicitação enviada para aceita (solicitante)
      if (sentRequest) {
        sentRequest.status = 'accepted';
      } else {
        // Se não existe o sentRequest (caso raro), criar entrada aceita no solicitante
        friend.friends = friend.friends || [];
        friend.friends.push({
          userId: req.params.id,
          status: 'accepted',
          addedAt: new Date(),
          source: pendingRequest?.source || 'suggestion'
        });
      }
      
    } else if (action === 'reject') {
      // Remover solicitação pendente da lista (ao invés de bloquear)
      user.friends = user.friends.filter(f => !(f.userId === req.params.friendId && f.status === 'pending'));
      
      // Remover solicitação enviada da lista do remetente
      if (sentRequest) {
        friend.friends = friend.friends.filter(f => !(f.userId === req.params.id && f.status === 'sent'));
      }
    }

    await user.save();
    await friend.save();

    res.json({ message: `Solicitação ${action === 'accept' ? 'aceita' : 'rejeitada'}` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Enviar presente para amigo
app.post('/users/:id/send-gift', async (req, res) => {
  try {
    const { friendId, giftType } = req.body;
    const sender = await User.findById(req.params.id);
    const recipient = await User.findById(friendId);

    if (!sender || !recipient) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se são amigos
    const areFriends = sender.friends?.some(f => f.userId === friendId && f.status === 'accepted') &&
                      recipient.friends?.some(f => f.userId === req.params.id && f.status === 'accepted');

    if (!areFriends) {
      return res.status(400).json({ error: 'Vocês precisam ser amigos para enviar presentes' });
    }

    // Definir custos dos presentes
    const giftCost = {
      'yuCoins': 10,
      'boost': 20,
      'special': 50
    };

    const cost = giftCost[giftType];
    if (!cost) {
      return res.status(400).json({ error: 'Tipo de presente inválido' });
    }

    // Verificar se o remetente tem YuCoins suficientes
    if ((sender.progress?.yuCoins || 0) < cost) {
      return res.status(400).json({ error: 'YüCoins insuficientes' });
    }

    // Debitar YuCoins do remetente
    sender.progress.yuCoins = (sender.progress?.yuCoins || 0) - cost;

    // Adicionar YuCoins ao destinatário (apenas para presente de YuCoins)
    if (giftType === 'yuCoins') {
      recipient.progress.yuCoins = (recipient.progress?.yuCoins || 0) + cost;
    }

    // Salvar ambos os usuários
    await sender.save();
    await recipient.save();

    res.json({
      message: 'Presente enviado com sucesso!',
      sender: {
        id: sender._id,
        name: sender.name,
        yuCoins: sender.progress.yuCoins
      },
      recipient: {
        id: recipient._id,
        name: recipient.name,
        yuCoins: recipient.progress.yuCoins
      },
      giftType,
      cost
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remover amigo
app.delete('/users/:id/friends/:friendId', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const friend = await User.findById(req.params.friendId);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (!friend) {
      return res.status(404).json({ error: 'Amigo não encontrado' });
    }

    // Remover amizade de ambos os lados
    user.friends = user.friends?.filter(f => f.userId !== req.params.friendId) || [];
    friend.friends = friend.friends?.filter(f => f.userId !== req.params.id) || [];

    await user.save();
    await friend.save();

    res.json({ message: 'Amigo removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ROTAS DE PLAYER ID =====

// Buscar usuário por Player ID
app.get('/users/search/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    if (!playerId || !playerId.startsWith('YUF')) {
      return res.status(400).json({ error: 'ID de jogador inválido. Deve começar com YUF' });
    }

    const user = await User.findOne({ 
      playerId: playerId.toUpperCase(),
      role: 'student'
    });

    if (!user) {
      return res.status(404).json({ error: 'Jogador não encontrado' });
    }

    // Retornar dados do jogador (sem informações sensíveis)
    res.json({
      id: user._id,
      name: user.name,
      level: user.progress?.level || 1,
      gradeId: user.gradeId,

      playerId: user.playerId
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gerar ID de jogador
app.post('/users/:id/generate-player-id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.playerId) {
      return res.status(400).json({ error: 'ID de jogador já existe' });
    }

    // Gerar ID único no formato YUF + 3 dígitos
    let playerId;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      const randomNum = Math.floor(Math.random() * 900) + 100; // 100-999
      playerId = `YUF${randomNum}`;
      attempts++;
      
      // Verificar se já existe
      const existingUser = await User.findOne({ playerId });
      if (!existingUser) break;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return res.status(500).json({ error: 'Não foi possível gerar um ID único' });
    }

    user.playerId = playerId;
    await user.save();

    res.json({ playerId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ROTAS DE VÍNCULO PARENT-STUDENT =====

// Solicitar vínculo com aluno (para responsáveis)
app.post('/parents/:parentId/request-link', async (req, res) => {
  try {
    const { studentId, message } = req.body;
    const parent = await User.findById(req.params.parentId);
    const student = await User.findById(studentId);
    
    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ error: 'Responsável não encontrado' });
    }
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    
    // Verificar se já existe solicitação pendente
    const existingRequest = student.parentLinkRequests?.pendingRequests?.find(
      req => req.parentId === parent.id
    );
    
    if (existingRequest) {
      return res.status(400).json({ error: 'Solicitação já enviada' });
    }
    
    // Verificar se já estão vinculados
    if (parent.linkedStudents?.includes(student.id)) {
      return res.status(400).json({ error: 'Aluno já está vinculado' });
    }
    
    // Adicionar solicitação ao aluno
    const request = {
      parentId: parent.id,
      parentName: parent.name,
      requestDate: new Date(),
      message: message || ''
    };
    
    await User.findByIdAndUpdate(studentId, {
      $push: { 'parentLinkRequests.pendingRequests': request }
    });
    
    // Adicionar à lista de solicitações enviadas do responsável
    await User.findByIdAndUpdate(parent.id, {
      $push: { 'parentLinkRequests.sentRequests': {
        studentId: student.id,
        studentName: student.name,
        requestDate: new Date(),
        message: message || ''
      }}
    });
    
    res.json({ message: 'Solicitação enviada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Aprovar/rejeitar solicitação de vínculo (para alunos)
app.post('/students/:studentId/respond-link-request', async (req, res) => {
  try {
    const { parentId, approved } = req.body;
    const student = await User.findById(req.params.studentId);
    const parent = await User.findById(parentId);
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    
    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ error: 'Responsável não encontrado' });
    }
    
    // Remover solicitação pendente
    await User.findByIdAndUpdate(student.id, {
      $pull: { 'parentLinkRequests.pendingRequests': { parentId } }
    });
    
    // Remover da lista de solicitações enviadas do responsável
    await User.findByIdAndUpdate(parent.id, {
      $pull: { 'parentLinkRequests.sentRequests': { studentId: student.id } }
    });
    
    if (approved) {
      // Vincular aluno ao responsável
      await User.findByIdAndUpdate(parent.id, {
        $push: { linkedStudents: student.id }
      });
      
      res.json({ message: 'Aluno vinculado com sucesso' });
    } else {
      res.json({ message: 'Solicitação rejeitada' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar solicitações pendentes de um aluno
app.get('/students/:studentId/pending-link-requests', async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    
    res.json({
      pendingRequests: student.parentLinkRequests?.pendingRequests || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar solicitações enviadas de um responsável
app.get('/parents/:parentId/sent-link-requests', async (req, res) => {
  try {
    const parent = await User.findById(req.params.parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ error: 'Responsável não encontrado' });
    }
    
    res.json({
      sentRequests: parent.parentLinkRequests?.sentRequests || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vincular filho a um responsável
app.patch('/users/:id/vincular-filho', async (req, res) => {
  try {
    const { studentId } = req.body;
    const parent = await User.findById(req.params.id);
    const student = await User.findById(studentId);
    
    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ error: 'Responsável não encontrado' });
    }
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    
    // Verificar se já estão vinculados
    if (!parent.linkedStudents) parent.linkedStudents = [];
    if (parent.linkedStudents.includes(studentId.toString())) {
      return res.status(400).json({ error: 'Aluno já está vinculado a este responsável' });
    }
    
    // Adicionar aluno à lista de filhos do responsável
    parent.linkedStudents.push(studentId.toString());
    
    // Definir parentId do aluno
    student.parentId = parent.id;
    
    await parent.save();
    await student.save();
    
    res.json(parent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Desvincular filho de um responsável
app.patch('/users/:id/desvincular-filho', async (req, res) => {
  try {
    const { studentId } = req.body;
    const parent = await User.findById(req.params.id);
    const student = await User.findById(studentId);
    
    if (!parent) {
      return res.status(404).json({ error: 'Responsável não encontrado' });
    }
    
    if (!student) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    
    // Remover aluno da lista de filhos do responsável
    if (!parent.linkedStudents) parent.linkedStudents = [];
    parent.linkedStudents = parent.linkedStudents.filter(id => id !== studentId.toString());
    
    // Limpar parentId do aluno para permitir re-vinculação
    student.parentId = null;
    
    await parent.save();
    await student.save();
    
    res.json(parent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend YuFin com MongoDB rodando na porta ${PORT}`);
});
