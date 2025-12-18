const jwt = require('jsonwebtoken');
const User = require('../models/User');
const FamilyLicense = require('../models/FamilyLicense');
const SchoolLicense = require('../models/SchoolLicense');

const JWT_SECRET = process.env.JWT_SECRET || 'yufin-secret-key-change-in-production';

/**
 * Middleware de autenticação - Verifica se o token JWT é válido
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Buscar token do header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de autenticação não fornecido',
        code: 'NO_TOKEN'
      });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Buscar usuário no banco
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Adicionar usuário ao request para uso nas rotas
    req.user = user;
    req.userId = user._id.toString();
    
    // NOVA VERIFICAÇÃO: Checar se licença está ativa (apenas para roles pagos)
    if (user.role === 'parent' && user.familyLicense?.code) {
      const license = await FamilyLicense.findOne({ 
        licenseCode: user.familyLicense.code 
      });
      
      if (!license || !license.isValid()) {
        // Atualizar status do usuário
        await User.updateOne(
          { _id: user._id },
          { 
            accessStatus: 'suspended',
            'licenseStatus.isValid': false,
            'licenseStatus.reason': 'family_license_expired',
            'licenseStatus.lastChecked': new Date()
          }
        );
        
        return res.status(403).json({
          error: 'Licença expirada ou inativa',
          code: 'LICENSE_EXPIRED',
          requiresRenewal: true,
          gracePeriod: license?.gracePeriod
        });
      }
    }
    
    if (user.role === 'school' && user.schoolLicense?.code) {
      const license = await SchoolLicense.findOne({ 
        licenseCode: user.schoolLicense.code 
      });
      
      if (!license || !license.isValid()) {
        // Atualizar status do usuário
        await User.updateOne(
          { _id: user._id },
          { 
            accessStatus: 'suspended',
            'licenseStatus.isValid': false,
            'licenseStatus.reason': 'school_license_expired',
            'licenseStatus.lastChecked': new Date()
          }
        );
        
        return res.status(403).json({
          error: 'Licença expirada ou inativa',
          code: 'LICENSE_EXPIRED',
          requiresRenewal: true,
          gracePeriod: license?.gracePeriod
        });
      }
    }
    
    // Verificar se usuário está suspenso
    if (user.accessStatus === 'suspended') {
      return res.status(403).json({
        error: 'Acesso suspenso. Renove sua assinatura para continuar.',
        code: 'ACCESS_SUSPENDED',
        reason: user.licenseStatus?.reason || 'unknown'
      });
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'EXPIRED_TOKEN'
      });
    }
    
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ 
      error: 'Erro ao validar autenticação',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware de autorização por role - Verifica se o usuário tem permissão
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Você não tem permissão para acessar este recurso',
        code: 'FORBIDDEN',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se o usuário está acessando seus próprios dados
 */
const authorizeOwner = (req, res, next) => {
  const requestedUserId = req.params.id || req.params.userId;
  
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  // Permitir se for o próprio usuário OU se for escola/parent com permissões
  const isOwner = req.userId === requestedUserId;
  const isSchool = req.user.role === 'school';
  const isParent = req.user.role === 'parent';
  
  if (!isOwner && !isSchool && !isParent) {
    return res.status(403).json({ 
      error: 'Você não tem permissão para acessar dados de outro usuário',
      code: 'FORBIDDEN'
    });
  }

  next();
};

/**
 * Middleware opcional - continua se não houver token (para rotas públicas/semipúblicas)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = user;
        req.userId = user._id.toString();
      }
    }
    
    next();
  } catch (error) {
    // Em caso de erro, apenas continua sem autenticação
    next();
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeOwner,
  optionalAuth,
  JWT_SECRET
};

