const express = require('express');
const router = express.Router();
const UniversalLicense = require('../models/UniversalLicense');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware para verificar se é administrador
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas administradores podem gerenciar licenças universais.',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

// GET /api/universal-license - Listar todas as licenças universais
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const licenses = await UniversalLicense.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      licenses: licenses
    });
  } catch (error) {
    console.error('Erro ao listar licenças universais:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/universal-license/create - Criar nova licença universal
router.post('/create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, planTypes, maxUses } = req.body;
    
    const newLicense = new UniversalLicense({
      name: name || 'Licença Universal Administrativa',
      description: description || 'Licença universal que não expira e funciona para todos os planos',
      planTypes: planTypes || ['family', 'school'],
      maxUses: maxUses || -1, // -1 = ilimitado
      createdBy: req.user.id
    });
    
    await newLicense.save();
    
    console.log(`✅ Licença universal criada: ${newLicense.code} por ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Licença universal criada com sucesso!',
      license: {
        code: newLicense.code,
        name: newLicense.name,
        description: newLicense.description,
        planTypes: newLicense.planTypes,
        maxUses: newLicense.maxUses,
        createdAt: newLicense.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao criar licença universal:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/universal-license/:code - Validar licença universal
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    // 🔧 MODO DESENVOLVIMENTO: Aceitar códigos simulados
    if (code.startsWith('FAM-')) {
      console.log('🔧 MODO DESENVOLVIMENTO: Aceitando código simulado universal:', code);
      console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
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
    console.error('Erro ao validar licença universal:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/universal-license/use - Usar licença universal
router.post('/use', async (req, res) => {
  try {
    const { code, userData, planType } = req.body;
    
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
    
    // Verificar se o tipo de plano é suportado
    if (!license.planTypes.includes(planType)) {
      return res.status(400).json({
        success: false,
        error: `Licença não suporta o tipo de plano: ${planType}`,
        code: 'PLAN_TYPE_NOT_SUPPORTED'
      });
    }
    
    // Usar a licença
    await license.useLicense(userData, planType);
    
    console.log(`✅ Licença universal ${code} usada por ${userData.email} para plano ${planType}`);
    
    res.json({
      success: true,
      message: 'Licença universal utilizada com sucesso!',
      license: {
        code: license.code,
        name: license.name,
        planType: planType
      }
    });
  } catch (error) {
    console.error('Erro ao usar licença universal:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

// GET /api/universal-license/:code/stats - Obter estatísticas da licença
router.get('/:code/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { code } = req.params;
    
    const license = await UniversalLicense.findOne({ code });
    
    if (!license) {
      return res.status(404).json({
        success: false,
        error: 'Licença não encontrada'
      });
    }
    
    const stats = license.getUsageStats();
    
    res.json({
      success: true,
      license: {
        code: license.code,
        name: license.name,
        isActive: license.isActive,
        isUniversal: license.isUniversal,
        neverExpires: license.neverExpires,
        planTypes: license.planTypes,
        createdAt: license.createdAt,
        lastUsedAt: license.lastUsedAt
      },
      stats: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas da licença:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/universal-license/:code/toggle - Ativar/desativar licença
router.put('/:code/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { code } = req.params;
    
    const license = await UniversalLicense.findOne({ code });
    
    if (!license) {
      return res.status(404).json({
        success: false,
        error: 'Licença não encontrada'
      });
    }
    
    license.isActive = !license.isActive;
    await license.save();
    
    res.json({
      success: true,
      message: `Licença ${license.isActive ? 'ativada' : 'desativada'} com sucesso!`,
      license: {
        code: license.code,
        isActive: license.isActive
      }
    });
  } catch (error) {
    console.error('Erro ao alterar status da licença:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
