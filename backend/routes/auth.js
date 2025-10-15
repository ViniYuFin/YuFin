const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RegistrationToken = require('../models/RegistrationToken');
const RefreshToken = require('../models/RefreshToken');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateTokenPair } = require('../utils/jwt');
const { validate, loginSchema, registerSchema } = require('../utils/validators');
const { checkParentConsent } = require('../middleware/lgpd');

/**
 * POST /auth/login
 * Autentica usuário e retorna token JWT
 */
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Buscar usuário
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Comparar senha com hash
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Gerar par de tokens (access + refresh)
    const tokens = generateTokenPair(user);
    
    // Salvar refresh token no banco
    const refreshTokenDoc = new RefreshToken({
      token: tokens.refreshToken,
      userId: user._id,
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        device: getDeviceType(req.headers['user-agent']),
        browser: getBrowser(req.headers['user-agent'])
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    });
    
    await refreshTokenDoc.save();
    
    // Retornar dados do usuário SEM a senha
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    
    console.log(`✅ Login bem-sucedido: ${user.email} (${user.role})`);
    
    res.json({
      message: 'Login realizado com sucesso',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      error: 'Erro ao realizar login',
      code: 'LOGIN_ERROR'
    });
  }
});

/**
 * POST /auth/register
 * Registra novo usuário com senha criptografada
 */
router.post('/register', 
  validate(registerSchema),
  checkParentConsent,
  async (req, res) => {
    try {
      const { name, email, password, role, token, gradeId } = req.body;
      
      // Verificar se o email já existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          error: 'Email já cadastrado',
          code: 'EMAIL_EXISTS'
        });
      }
      
      // Validar token se fornecido
      let tokenInfo = null;
      if (role === 'student' && token) {
        const tokenDoc = await RegistrationToken.findOne({ token });
        
        if (!tokenDoc) {
          return res.status(400).json({ 
            error: 'Token inválido',
            code: 'INVALID_TOKEN'
          });
        }
        
        if (!tokenDoc.isActive) {
          return res.status(400).json({ 
            error: 'Token inativo',
            code: 'INACTIVE_TOKEN'
          });
        }
        
        if (tokenDoc.expiresAt && new Date() > tokenDoc.expiresAt) {
          return res.status(400).json({ 
            error: 'Token expirado',
            code: 'EXPIRED_TOKEN'
          });
        }
        
        if (tokenDoc.maxUses && tokenDoc.usedCount >= tokenDoc.maxUses) {
          return res.status(400).json({ 
            error: 'Token já foi usado o máximo de vezes',
            code: 'TOKEN_LIMIT_REACHED'
          });
        }
        
        tokenInfo = tokenDoc;
      }
      
      // Hash da senha ANTES de salvar
      const passwordHash = await hashPassword(password);
      
      // Preparar dados do usuário
      const userData = {
        name,
        email,
        role,
        passwordHash, // Senha já criptografada!
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
          achievements: [],
          avatar: { accessory: "none" },
          level: 1,
          dailyGoal: 50,
          dailyProgress: 0
        };
        userData.savings = { 
          balance: 0, 
          transactions: [],
          goals: [],
          rewardedLessons: []
        };
        userData.gradeId = gradeId;
        userData.currentModule = 1;
        
        // Se token veio de escola, vincular automaticamente
        if (tokenInfo && tokenInfo.type === 'school') {
          userData.schoolId = tokenInfo.schoolId || tokenInfo.createdBy;
          userData.gradeId = tokenInfo.gradeId || gradeId;
        }
        
        userData.parentLinkRequests = {
          pendingRequests: [],
          sentRequests: []
        };
      } else if (role === 'parent') {
        userData.linkedStudents = [];
        userData.savingsConfig = { 
          perLesson: 0.5, 
          perStreak: 2.0,
          perPerfectLesson: 1.0,
          perLevelUp: 5.0,
          perAchievement: 3.0,
          autoTransfer: false,
          monthlyLimit: 100,
          weeklyGoal: 20
        };
        
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
      
      // Criar usuário
      const user = new User(userData);
      await user.save();
      
      // Gerar player ID para estudantes
      if (role === 'student') {
        let playerId;
        let attempts = 0;
        const maxAttempts = 10;

        do {
          const randomNum = Math.floor(Math.random() * 900000) + 100000; // 6 dígitos
          playerId = `YUF${randomNum}`;
          attempts++;
          
          const existingUser = await User.findOne({ playerId });
          if (!existingUser) break;
        } while (attempts < maxAttempts);

        if (attempts < maxAttempts) {
          user.playerId = playerId;
          await user.save();
          console.log('🎮 Player ID gerado:', playerId);
        }
      }
      
      // Registrar uso do token
      if (tokenInfo) {
        tokenInfo.usedCount += 1;
        tokenInfo.usedBy.push(user._id.toString());
        
        if (tokenInfo.maxUses && tokenInfo.usedCount >= tokenInfo.maxUses) {
          tokenInfo.isActive = false;
        }
        
        await tokenInfo.save();
        
        // Se token é de responsável, vincular automaticamente
        if (tokenInfo.creatorRole === 'parent') {
          const parent = await User.findById(tokenInfo.createdBy);
          if (parent) {
            if (!parent.linkedStudents) parent.linkedStudents = [];
            parent.linkedStudents.push(user._id.toString());
            await parent.save();
            console.log('👨‍👩‍👧 Estudante vinculado automaticamente ao responsável');
          }
        }
      }
      
      // Gerar par de tokens para login automático
      const tokens = generateTokenPair(user);
      
      // Salvar refresh token no banco
      const refreshTokenDoc = new RefreshToken({
        token: tokens.refreshToken,
        userId: user._id,
        deviceInfo: {
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          device: getDeviceType(req.headers['user-agent']),
          browser: getBrowser(req.headers['user-agent'])
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      
      await refreshTokenDoc.save();
      
      // Retornar usuário SEM senha
      const userResponse = user.toObject();
      delete userResponse.passwordHash;
      
      console.log(`✅ Cadastro realizado: ${user.email} (${user.role})`);
      
      res.status(201).json({
        message: 'Cadastro realizado com sucesso',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: userResponse
      });
      
    } catch (error) {
      console.error('Erro no registro:', error);
      
      // Erros específicos do MongoDB
      if (error.code === 11000) {
        return res.status(400).json({ 
          error: 'Email já cadastrado',
          code: 'DUPLICATE_EMAIL'
        });
      }
      
      res.status(500).json({ 
        error: 'Erro ao realizar cadastro',
        code: 'REGISTER_ERROR'
      });
    }
  }
);

/**
 * POST /auth/verify
 * Verifica se o token JWT é válido (opcional, para refresh)
 */
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        error: 'Token não fornecido',
        code: 'NO_TOKEN'
      });
    }
    
    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(token);
    
    // Buscar usuário
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    
    res.json({
      valid: true,
      user: userResponse
    });
    
  } catch (error) {
    res.status(401).json({ 
      valid: false,
      error: 'Token inválido ou expirado',
      code: 'INVALID_TOKEN'
    });
  }
});

/**
 * POST /register-with-token
 * Registra um estudante usando um token de registro válido
 */
router.post('/register-with-token', async (req, res) => {
  try {
    const { token, userData } = req.body;
    
    if (!token || !userData) {
      return res.status(400).json({
        error: 'Token e dados do usuário são obrigatórios',
        code: 'MISSING_DATA'
      });
    }
    
    // Validar token de registro
    const registrationToken = await RegistrationToken.findOne({ 
      token: token.trim(),
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!registrationToken) {
      return res.status(400).json({
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Verificar se ainda pode ser usado
    if (registrationToken.usedCount >= registrationToken.maxUses) {
      return res.status(400).json({
        error: 'Token já foi usado o máximo de vezes permitido',
        code: 'TOKEN_EXHAUSTED'
      });
    }
    
    // Validar dados do usuário
    const { error, value } = registerSchema.validate({
      ...userData,
      role: 'student',
      parentConsent: true
    });
    
    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
        code: 'VALIDATION_ERROR',
        details: error.details
      });
    }
    
    // Verificar se email já existe
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return res.status(400).json({
        error: 'Email já está em uso',
        code: 'EMAIL_EXISTS'
      });
    }
    
    // Criar usuário
    const hashedPassword = await hashPassword(value.password);
    
    const newUser = new User({
      name: value.name,
      email: value.email,
      passwordHash: hashedPassword,
      role: 'student',
      gradeId: value.gradeId,
      schoolId: registrationToken.createdBy, // Usar o criador do token como escola
      parentEmail: registrationToken.metadata?.parentEmail,
      parentConsent: {
        given: true,
        date: new Date().toISOString(),
        parentEmail: registrationToken.metadata?.parentEmail
      }
    });
    
    await newUser.save();
    
    // Marcar token como usado
    registrationToken.usedCount += 1;
    await registrationToken.save();
    
    // Gerar token JWT
    const jwtToken = generateToken(newUser);
    
    const userResponse = newUser.toObject();
    delete userResponse.passwordHash;
    
    res.status(201).json({
      success: true,
      token: jwtToken,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Erro no registro com token:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Helper functions
function getDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function getBrowser(userAgent) {
  if (!userAgent) return 'unknown';
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  return 'Other';
}

module.exports = router;

