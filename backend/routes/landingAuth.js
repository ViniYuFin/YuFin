const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const FamilyLicense = require('../models/FamilyLicense');
const SchoolLicense = require('../models/SchoolLicense');

// Modelo para usuários da landing page
const LandingUser = require('../models/LandingUser');

// POST /api/landing/auth/register - Registro na landing
router.post('/auth/register', async (req, res) => {
  try {
    console.log('📝 REGISTRO LANDING');
    console.log('📋 Dados recebidos:', req.body);

    const { name, email, phone, password, confirmPassword } = req.body;

    // Validações
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Nome, email e senha são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'As senhas não coincidem',
        code: 'PASSWORD_MISMATCH'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'A senha deve ter pelo menos 6 caracteres',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Verificar se email já existe
    const existingUser = await LandingUser.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        error: 'Este email já está cadastrado',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const newUser = new LandingUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : null,
      password: hashedPassword,
      createdAt: new Date()
    });

    await newUser.save();
    console.log('✅ Usuário landing criado:', newUser.email);

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: newUser._id, 
        email: newUser.email,
        type: 'landing'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        createdAt: newUser.createdAt,
        token: token
      },
      message: 'Conta criada com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro no registro landing:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/landing/auth/login - Login na landing
router.post('/auth/login', async (req, res) => {
  try {
    console.log('🔐 LOGIN LANDING');
    console.log('📋 Dados recebidos:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }

    // Buscar usuário (primeiro em User, depois em LandingUser)
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    let userType = 'app';
    
    if (!user) {
      user = await LandingUser.findOne({ email: email.toLowerCase().trim() });
      userType = 'landing';
    }
    
    if (!user) {
      return res.status(401).json({
        error: 'Email ou senha incorretos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar senha (User usa passwordHash, LandingUser usa password)
    const passwordToCheck = user.passwordHash || user.password;
    const isPasswordValid = await bcrypt.compare(password, passwordToCheck);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Email ou senha incorretos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Gerar token JWT com role para admins
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      type: userType,
      role: user.role || 'landing'
    };
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '30d' }
    );

    console.log('✅ Login realizado:', user.email, '- Role:', user.role || 'landing');

    // Preparar resposta
    const responseData = {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        token: token,
        role: user.role || 'landing'
      },
      message: 'Login realizado com sucesso!'
    };
    
    // Adicionar campos específicos
    if (user.phone) responseData.user.phone = user.phone;
    if (user.role) responseData.user.role = user.role;
    
    // Para compatibilidade com o frontend, também retornar accessToken
    responseData.accessToken = token;

    res.json(responseData);

  } catch (error) {
    console.error('❌ Erro no login landing:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/landing/licenses - Obter licenças do usuário
router.get('/licenses', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        error: 'Token de autenticação necessário',
        code: 'MISSING_TOKEN'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const userId = decoded.userId;

    console.log('🔑 OBTENDO LICENÇAS DO USUÁRIO:', userId);

    // Buscar licenças familiares
    const familyLicenses = await FamilyLicense.find({ 
      'purchaser.email': decoded.email 
    }).sort({ createdAt: -1 });

    // Buscar licenças escolares
    const schoolLicenses = await SchoolLicense.find({ 
      'schoolData.email': decoded.email 
    }).sort({ createdAt: -1 });

    // Formatar licenças
    const licenses = [
      ...familyLicenses.map(license => ({
        id: license._id,
        code: license.licenseCode,
        planType: 'family',
        status: license.status,
        amount: license.planData.totalPrice,
        createdAt: license.createdAt,
        expiresAt: license.expiresAt,
        planData: license.planData
      })),
      ...schoolLicenses.map(license => ({
        id: license._id,
        code: license.licenseCode,
        planType: 'school',
        status: license.status,
        amount: license.planData.totalPrice,
        createdAt: license.createdAt,
        expiresAt: license.expiresAt,
        planData: license.planData
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log('✅ Licenças encontradas:', licenses.length);

    res.json({
      success: true,
      licenses: licenses,
      total: licenses.length
    });

  } catch (error) {
    console.error('❌ Erro ao obter licenças:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/landing/payments - Obter histórico de pagamentos
router.get('/payments', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        error: 'Token de autenticação necessário',
        code: 'MISSING_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const userEmail = decoded.email;

    console.log('💳 OBTENDO PAGAMENTOS DO USUÁRIO:', userEmail);

    // Buscar pagamentos de licenças familiares
    const familyPayments = await FamilyLicense.find({ 
      'payment.purchaserEmail': userEmail 
    }).sort({ createdAt: -1 });

    // Buscar pagamentos de licenças escolares
    const schoolPayments = await SchoolLicense.find({ 
      'schoolData.email': userEmail 
    }).sort({ createdAt: -1 });

    // Formatar pagamentos
    const payments = [
      ...familyPayments.map(license => ({
        id: license._id,
        description: `Plano Família - ${license.planData.numStudents} alunos`,
        amount: license.planData.totalPrice,
        status: license.status === 'paid' ? 'completed' : 'pending',
        method: license.payment.paymentMethod || 'credit_card',
        date: license.payment.paidAt || license.createdAt,
        transactionId: license.payment.transactionId,
        type: 'family'
      })),
      ...schoolPayments.map(license => ({
        id: license._id,
        description: `Plano Escola - ${license.planData.numStudents} alunos`,
        amount: license.planData.totalPrice,
        status: license.status === 'paid' ? 'completed' : 'pending',
        method: license.payment.paymentMethod || 'credit_card',
        date: license.payment.paidAt || license.createdAt,
        transactionId: license.payment.transactionId,
        type: 'school'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log('✅ Pagamentos encontrados:', payments.length);

    res.json({
      success: true,
      payments: payments,
      total: payments.length
    });

  } catch (error) {
    console.error('❌ Erro ao obter pagamentos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/landing/licenses/resend - Reenviar licença por email
router.post('/licenses/resend', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        error: 'Token de autenticação necessário',
        code: 'MISSING_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const { licenseId } = req.body;

    console.log('📧 REENVIANDO LICENÇA:', licenseId);

    // Buscar licença
    let license = await FamilyLicense.findById(licenseId);
    let licenseType = 'family';

    if (!license) {
      license = await SchoolLicense.findById(licenseId);
      licenseType = 'school';
    }

    if (!license) {
      return res.status(404).json({
        error: 'Licença não encontrada',
        code: 'LICENSE_NOT_FOUND'
      });
    }

    // Aqui seria implementado o envio de email
    // Por enquanto, apenas simular
    console.log('📧 Email enviado para:', decoded.email);
    console.log('🔑 Código da licença:', license.licenseCode);

    res.json({
      success: true,
      message: 'Licença reenviada por email com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro ao reenviar licença:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
