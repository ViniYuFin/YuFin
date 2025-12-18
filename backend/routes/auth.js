const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RegistrationToken = require('../models/RegistrationToken');
const RefreshToken = require('../models/RefreshToken');
const ParentValidationToken = require('../models/ParentValidationToken');
const UniversalLicense = require('../models/UniversalLicense');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateTokenPair } = require('../utils/jwt');
const { validate, loginSchema, registerSchema } = require('../utils/validators');
const { checkParentConsent } = require('../middleware/lgpd');
const { sendParentValidationEmail, sendRegistrationConfirmationEmail } = require('../utils/emailService');
const crypto = require('crypto');

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
      const { name, email, password, role, token, gradeId, familyPlanData, schoolPlanData, familyLicense, schoolLicense } = req.body;
    
    console.log('🔍 DEBUG: Dados recebidos no req.body:', {
      familyPlanData: req.body.familyPlanData,
      schoolPlanData: req.body.schoolPlanData,
      familyLicense: req.body.familyLicense,
      schoolLicense: req.body.schoolLicense
    });
      
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
      
      // Adicionar dados do plano família se fornecido
      if (familyPlanData) {
        userData.familyPlanData = familyPlanData;
        console.log('📋 Dados do plano família adicionados:', familyPlanData);
      }
      
      // Adicionar dados do plano escola se fornecido
      if (schoolPlanData) {
        userData.schoolPlanData = schoolPlanData;
        console.log('📋 Dados do plano escola adicionados:', schoolPlanData);
      }
      
      // Adicionar informações de licença se fornecidas
      if (familyLicense) {
        userData.familyLicense = familyLicense;
        console.log('🔑 Licença família adicionada:', familyLicense);
      }
      
      if (schoolLicense) {
        userData.schoolLicense = schoolLicense;
        console.log('🔑 Licença escola adicionada:', schoolLicense);
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
        if (tokenInfo.type === 'parent') {
          const parent = await User.findById(tokenInfo.createdBy);
          if (parent && parent.role === 'parent') {
            if (!parent.linkedStudents) parent.linkedStudents = [];
            parent.linkedStudents.push(user._id.toString());
            await parent.save();
            
            // Atualizar o usuário com a informação de vínculo
            user.parentId = parent._id.toString();
            await user.save();
            
            console.log('👨‍👩‍👧‍👦 Estudante vinculado automaticamente ao responsável:', {
              studentId: user._id.toString(),
              studentName: user.name,
              parentId: parent._id.toString(),
              parentName: parent.name
            });
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
      
      // Marcar uso da licença se for um registro com licença família
      if (familyLicense && familyLicense.code) {
        try {
          const FamilyLicense = require('../models/FamilyLicense');
          const licenseDoc = await FamilyLicense.findOne({ 
            licenseCode: familyLicense.code 
          });
          
          if (licenseDoc) {
            // Adicionar usuário à lista de usuários que usaram a licença
            // (O contador já foi incrementado na rota /api/family-license/use)
            licenseDoc.usedBy.push({
              userId: user._id,
              usedAt: new Date(),
              canGenerateTokens: licenseDoc.usedBy.length === 0 // Apenas o primeiro usuário pode gerar tokens
            });
            
            await licenseDoc.save();
            console.log('✅ Usuário adicionado à lista de uso da licença:', {
              licenseCode: familyLicense.code,
              usageCount: licenseDoc.usageCount,
              maxUsages: licenseDoc.maxUsages,
              canGenerateTokens: licenseDoc.usedBy[licenseDoc.usedBy.length - 1].canGenerateTokens
            });
          }
        } catch (licenseError) {
          console.error('⚠️ Erro ao registrar uso da licença:', licenseError);
          // Não falhar o registro por causa disso
        }
      }
      
      console.log(`✅ Cadastro realizado: ${user.email} (${user.role})`);
      console.log('🔍 DEBUG: Verificando dados do usuário...');
      console.log('🔍 familyPlanData:', userResponse.familyPlanData);
      console.log('🔍 schoolPlanData:', userResponse.schoolPlanData);
      console.log('🔍 familyLicense:', userResponse.familyLicense);
      console.log('🔍 schoolLicense:', userResponse.schoolLicense);
      
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
 * POST /auth/register-gratuito
 * Registra um estudante no plano gratuito usando CPF + Senha + Termo
 */
router.post('/register-gratuito', async (req, res) => {
  try {
    console.log('🚀 ROTA REGISTER-GRATUITO CHAMADA!');
    console.log('📋 Body recebido:', req.body);
    
    // Limpar tokens expirados antes de processar
    const expiredTokensCount = await ParentValidationToken.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    console.log(`🧹 Tokens expirados removidos: ${expiredTokensCount.deletedCount}`);
    
    const { cpf, password, parentConsent, parentEmail, gradeId } = req.body;
    
    // Validações básicas
    if (!cpf || !password || !parentEmail || !gradeId) {
      return res.status(400).json({
        error: 'CPF, senha, email dos pais e série são obrigatórios',
        code: 'MISSING_DATA'
      });
    }
    
    if (!parentConsent) {
      return res.status(400).json({
        error: 'É necessário o consentimento dos pais/responsáveis',
        code: 'PARENT_CONSENT_REQUIRED'
      });
    }
    
    // Validar email dos pais
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      return res.status(400).json({
        error: 'Email dos pais/responsáveis inválido',
        code: 'INVALID_PARENT_EMAIL'
      });
    }
    
    // Limpar CPF (remover formatação)
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    
    // Validar CPF
    if (!validateCPF(cleanCPF)) {
      return res.status(400).json({
        error: 'CPF inválido',
        code: 'INVALID_CPF'
      });
    }
    
    // Validar série
    const validGrades = ['6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º Ano EM', '2º Ano EM', '3º Ano EM'];
    if (!validGrades.includes(gradeId)) {
      return res.status(400).json({
        error: 'Série inválida',
        code: 'INVALID_GRADE'
      });
    }
    
    // Hash da senha
    const passwordHash = await hashPassword(password);
    
    // Dados do usuário para validação
    const userData = {
      cpf: cleanCPF,
      passwordHash,
      role: 'student-gratuito',
      isGratuito: true,
      parentConsent: {
        given: false, // Será true após validação por email
        date: null,
        type: 'gratuito',
        parentEmail: parentEmail
      },
      progress: {
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
      },
      savings: { 
        balance: 0, 
        transactions: [],
        goals: [],
        rewardedLessons: []
      },
      gradeId: gradeId,
      currentModule: 1,
      createdAt: new Date()
    };
    
    // Verificar se usuário já existe
    const existingUser = await User.findOne({ cpf: cleanCPF });
    if (existingUser) {
      console.log('❌ CPF já cadastrado:', {
        cpf: existingUser.cpf,
        role: existingUser.role,
        isGratuito: existingUser.isGratuito,
        createdAt: existingUser.createdAt
      });
      return res.status(400).json({
        error: 'CPF já cadastrado',
        code: 'CPF_EXISTS'
      });
    }
    
    // NOVA ABORDAGEM: Sempre limpar tokens anteriores e criar um novo
    console.log('🔄 Nova abordagem: removendo todos os tokens anteriores para este CPF...');
    const deletedTokens = await ParentValidationToken.deleteMany({ 
      studentCPF: cleanCPF,
      isUsed: false
    });
    console.log(`🧹 Tokens anteriores removidos: ${deletedTokens.deletedCount}`);
    
    // Gerar token de validação
    const validationToken = crypto.randomBytes(32).toString('hex');
    console.log('🔑 Token gerado:', validationToken);
    
    // Salvar token de validação
    const validationTokenDoc = new ParentValidationToken({
      token: validationToken,
      studentCPF: cleanCPF,
      parentEmail: parentEmail,
      userData: userData,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
    });
    
    await validationTokenDoc.save();
    console.log('💾 Token salvo no banco com sucesso:', {
      token: validationToken,
      expiresAt: validationTokenDoc.expiresAt,
      isUsed: validationTokenDoc.isUsed
    });
    
    // Enviar email de validação
    let emailSent = false;
    try {
      const emailResult = await sendParentValidationEmail(parentEmail, cleanCPF, validationToken);
      
      if (emailResult.success) {
        emailSent = true;
        console.log(`✅ Email de validação enviado para: ${parentEmail} - CPF: ${cleanCPF}`);
      } else {
        console.log('⚠️ Falha ao enviar email, mas continuando...');
      }
    } catch (emailError) {
      console.error('❌ Erro no envio de email:', emailError.message);
      console.log('⚠️ Continuando sem email...');
    }
    
    // Sempre continuar, mesmo se o email falhar
    console.log('🔑 Token gerado:', validationToken);
    console.log('🔗 Link de validação:', `${process.env.FRONTEND_URL || 'https://app.yufin.com.br'}/validate-parent-consent?token=${validationToken}`);
    
    res.status(201).json({
      message: 'Email de validação enviado! Verifique sua caixa de entrada e clique no link para confirmar o cadastro.',
      requiresEmailValidation: true,
      parentEmail: parentEmail
    });
    
  } catch (error) {
    console.error('Erro no registro gratuito:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'CPF já cadastrado',
        code: 'DUPLICATE_CPF'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao realizar cadastro gratuito',
      code: 'REGISTER_GRATUITO_ERROR'
    });
  }
});

/**
 * POST /auth/login-gratuito
 * Login para usuários do plano gratuito usando CPF + Senha
 */
router.post('/login-gratuito', async (req, res) => {
  try {
    const { cpf, password } = req.body;
    
    if (!cpf || !password) {
      return res.status(400).json({ 
        error: 'CPF e senha são obrigatórios',
        code: 'MISSING_DATA'
      });
    }
    
    // Limpar CPF
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    
    // Buscar usuário por CPF
    const user = await User.findOne({ cpf: cleanCPF, role: 'student-gratuito' });
    if (!user) {
      return res.status(401).json({ 
        error: 'CPF ou senha inválidos',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Comparar senha
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'CPF ou senha inválidos',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Gerar par de tokens
    const tokens = generateTokenPair(user);
    
    // Salvar refresh token
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
    
    // Retornar usuário sem senha
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    
    console.log(`✅ Login gratuito bem-sucedido: CPF ${cleanCPF}`);
    
    res.json({
      message: 'Login realizado com sucesso',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Erro no login gratuito:', error);
    res.status(500).json({ 
      error: 'Erro ao realizar login',
      code: 'LOGIN_GRATUITO_ERROR'
    });
  }
});

/**
 * GET /auth/check-cpf/:cpf
 * Verifica se um CPF já está cadastrado
 */
router.get('/check-cpf/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params;
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    
    if (!validateCPF(cleanCPF)) {
      return res.status(400).json({
        error: 'CPF inválido',
        code: 'INVALID_CPF'
      });
    }
    
    const user = await User.findOne({ cpf: cleanCPF });
    
    res.json({
      exists: !!user,
      isGratuito: user?.role === 'student-gratuito'
    });
    
  } catch (error) {
    console.error('Erro ao verificar CPF:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar CPF',
      code: 'CHECK_CPF_ERROR'
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
    registrationToken.usedBy.push({
      studentId: newUser._id.toString(),
      studentName: newUser.name,
      usedAt: new Date()
    });
    
    // Desativar se atingiu o limite
    if (registrationToken.maxUses && registrationToken.usedCount >= registrationToken.maxUses) {
      registrationToken.isActive = false;
    }
    
    await registrationToken.save();
    
    // Se token é de responsável, vincular automaticamente
    if (registrationToken.type === 'parent') {
      const parent = await User.findById(registrationToken.createdBy);
      if (parent && parent.role === 'parent') {
        if (!parent.linkedStudents) parent.linkedStudents = [];
        parent.linkedStudents.push(newUser._id.toString());
        await parent.save();
        
        // Atualizar o usuário com a informação de vínculo
        newUser.parentId = parent._id.toString();
        await newUser.save();
        
        console.log('👨‍👩‍👧‍👦 Estudante vinculado automaticamente ao responsável:', {
          studentId: newUser._id.toString(),
          studentName: newUser.name,
          parentId: parent._id.toString(),
          parentName: parent.name
        });
      }
    }
    
    // Se token é de escola, associar o aluno à escola
    if (registrationToken.type === 'school') {
      console.log('🏫 Associando aluno à escola:', {
        studentId: newUser._id.toString(),
        studentName: newUser.name,
        schoolId: registrationToken.createdBy,
        tokenType: registrationToken.type
      });
      
      newUser.schoolId = registrationToken.createdBy;
      await newUser.save();
      
      console.log('✅ Aluno associado à escola com sucesso:', {
        studentId: newUser._id.toString(),
        schoolId: newUser.schoolId
      });
    }
    
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

// Função para validar CPF
function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

/**
 * POST /auth/validate-parent-consent
 * Valida o consentimento dos pais através do token enviado por email
 */
router.post('/validate-parent-consent', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        error: 'Token de validação é obrigatório',
        code: 'MISSING_TOKEN'
      });
    }
    
    // Buscar token de validação
    const validationToken = await ParentValidationToken.findOne({ token });
    
    if (!validationToken) {
      return res.status(400).json({
        error: 'Token de validação inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Verificar se o token é válido
    if (!validationToken.isValid()) {
      return res.status(400).json({
        error: 'Token de validação expirado ou já utilizado',
        code: 'TOKEN_EXPIRED_OR_USED'
      });
    }
    
    // Verificar se o CPF ainda não foi cadastrado
    const existingUser = await User.findOne({ cpf: validationToken.studentCPF });
    if (existingUser) {
      return res.status(400).json({
        error: 'Usuário já cadastrado',
        code: 'USER_ALREADY_EXISTS'
      });
    }
    
    // Atualizar dados do usuário com consentimento validado
    const userData = {
      ...validationToken.userData,
      parentConsent: {
        given: true,
        date: new Date().toISOString(),
        type: 'gratuito',
        parentEmail: validationToken.parentEmail,
        validatedByEmail: true
      }
    };
    
    // Criar usuário
    const user = new User(userData);
    await user.save();
    
    // Marcar token como usado
    await validationToken.markAsUsed();
    
    // Gerar tokens de autenticação
    const tokens = generateTokenPair(user);
    
    // Salvar refresh token
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
    
    // Enviar email de confirmação
    await sendRegistrationConfirmationEmail(validationToken.parentEmail, validationToken.studentCPF);
    
    // Retornar usuário sem senha
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    
    console.log(`✅ Cadastro gratuito validado e concluído: CPF ${validationToken.studentCPF}`);
    
    res.status(201).json({
      message: 'Cadastro validado com sucesso! Bem-vindo à YüFin!',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Erro na validação do consentimento:', error);
    res.status(500).json({
      error: 'Erro ao validar consentimento',
      code: 'VALIDATION_ERROR'
    });
  }
});

/**
 * GET /auth/check-cpf/:cpf
 * Verifica se um CPF já está cadastrado no sistema
 */
console.log('📝 Registrando rota: GET /auth/check-cpf/:cpf');
router.get('/check-cpf/:cpf', async (req, res) => {
  console.log('🔍 CHECK-CPF - Verificando CPF:', req.params.cpf);
  
  try {
    const { cpf } = req.params;
    
    if (!cpf || cpf.length !== 11) {
      console.log('❌ CPF inválido:', cpf);
      return res.status(400).json({
        error: 'CPF inválido',
        code: 'INVALID_CPF'
      });
    }
    
    // Buscar usuário pelo CPF
    const user = await User.findOne({ cpf });
    console.log('🔍 Usuário encontrado:', !!user);
    
    res.json({
      exists: !!user,
      cpf: cpf
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar CPF:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /auth/validate-universal-license/:code
 * Valida uma licença universal administrativa
 */
console.log('📝 Registrando rota: GET /auth/validate-universal-license/:code');
router.get('/validate-universal-license/:code', async (req, res) => {
  console.log('🔍 VALIDATE-UNIVERSAL-LICENSE - Verificando código:', req.params.code);
  
  try {
    const { code } = req.params;
    
    if (!code) {
      console.log('❌ Código não fornecido');
      return res.status(400).json({
        error: 'Código de licença é obrigatório',
        code: 'MISSING_LICENSE_CODE'
      });
    }
    
    // Buscar licença universal
    const license = await UniversalLicense.findOne({ code });
    console.log('🔍 Licença universal encontrada:', !!license);
    
    if (!license) {
      console.log('❌ Licença universal não encontrada');
      return res.status(404).json({
        error: 'Licença não encontrada',
        code: 'LICENSE_NOT_FOUND'
      });
    }
    
    if (!license.isValid()) {
      console.log('❌ Licença universal inválida ou expirada');
      return res.status(400).json({
        error: 'Licença inválida ou expirada',
        code: 'LICENSE_INVALID'
      });
    }
    
    console.log('✅ Licença universal válida:', license.code);
    
    res.json({
      success: true,
      valid: true,
      license: {
        code: license.code,
        name: license.name,
        planTypes: license.planTypes,
        isUniversal: license.isUniversal,
        neverExpires: license.neverExpires
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao validar licença universal:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /auth/validate-parent-consent/:token
 * Valida o consentimento dos pais através do token na URL (para links de email)
 */
console.log('📝 Registrando rota: GET /auth/validate-parent-consent/:token');
router.get('/validate-parent-consent/:token', async (req, res) => {
  console.log('🚀 ROTA VALIDATE-PARENT-CONSENT CHAMADA!');
  console.log('📋 Parâmetros recebidos:', req.params);
  console.log('📋 Query params:', req.query);
  console.log('📋 Headers:', req.headers);
  
  try {
    const { token } = req.params;
    console.log('🔍 Token extraído dos params:', token);
    console.log('🔍 Tipo do token:', typeof token);
    console.log('🔍 Tamanho do token:', token ? token.length : 'undefined');
    
    // Buscar token de validação
    const validationToken = await ParentValidationToken.findOne({ token });
    console.log('🔍 Token encontrado no banco:', !!validationToken);
    
    if (!validationToken) {
      console.log('❌ Token não encontrado no banco de dados');
      return res.status(400).json({
        error: 'Token de validação inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    console.log('🔍 Token details:', {
      isUsed: validationToken.isUsed,
      expiresAt: validationToken.expiresAt,
      currentDate: new Date(),
      isValid: validationToken.isValid()
    });
    
    // Verificar se o token é válido
    if (!validationToken.isValid()) {
      console.log('❌ Token inválido - isUsed:', validationToken.isUsed, 'expired:', validationToken.expiresAt <= new Date());
      return res.status(400).json({
        error: 'Token de validação expirado ou já utilizado',
        code: 'TOKEN_EXPIRED_OR_USED'
      });
    }
    
    // Verificar se o CPF ainda não foi cadastrado
    const existingUser = await User.findOne({ cpf: validationToken.studentCPF });
    if (existingUser) {
      return res.status(400).json({
        error: 'Usuário já cadastrado',
        code: 'USER_ALREADY_EXISTS'
      });
    }
    
    // Atualizar dados do usuário com consentimento validado
    const userData = {
      ...validationToken.userData,
      parentConsent: {
        given: true,
        date: new Date().toISOString(),
        type: 'gratuito',
        parentEmail: validationToken.parentEmail,
        validatedByEmail: true
      }
    };
    
    // Criar usuário
    const user = new User(userData);
    await user.save();
    
    // Marcar token como usado
    await validationToken.markAsUsed();
    
    // Gerar tokens de autenticação
    const tokens = generateTokenPair(user);
    
    // Salvar refresh token
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
    
    // Enviar email de confirmação
    await sendRegistrationConfirmationEmail(validationToken.parentEmail, validationToken.studentCPF);
    
    console.log(`✅ Cadastro gratuito validado via GET: CPF ${validationToken.studentCPF}`);
    
    // Retornar JSON com sucesso
    res.status(200).json({
      success: true,
      message: 'Cadastro validado com sucesso!',
      user: {
        id: user._id,
        cpf: user.cpf,
        gradeId: user.gradeId,
        role: user.role
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
    
  } catch (error) {
    console.error('Erro na validação do consentimento (GET):', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao validar cadastro',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /auth/validate-universal-license/:code
 * Valida licença universal (endpoint para compatibilidade com frontend)
 */
router.get('/validate-universal-license/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Redirecionar para o endpoint correto da licença universal
    const UniversalLicense = require('../models/UniversalLicense');
    
    // 🔧 MODO DESENVOLVIMENTO: Aceitar códigos simulados
    if (code.startsWith('FAM-')) {
      console.log('🔧 MODO DESENVOLVIMENTO: Aceitando código simulado universal via auth:', code);
      return res.json({
        success: true,
        valid: true,
        license: {
          code: code,
          name: 'Licença Simulada',
          planTypes: ['family', 'school'],
          isUniversal: true,
          neverExpires: true,
          isSimulated: true
        }
      });
    }
    
    const license = await UniversalLicense.findOne({ code });
    
    if (!license) {
      return res.status(404).json({
        success: false,
        error: 'Licença não encontrada',
        code: 'LICENSE_NOT_FOUND'
      });
    }
    
    if (!license.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Licença inválida ou expirada',
        code: 'LICENSE_INVALID'
      });
    }
    
    res.json({
      success: true,
      valid: true,
      license: {
        code: license.code,
        name: license.name,
        planTypes: license.planTypes,
        isUniversal: license.isUniversal,
        neverExpires: license.neverExpires
      }
    });
  } catch (error) {
    console.error('Erro ao validar licença universal via auth:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;

