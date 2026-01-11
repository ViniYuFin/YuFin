const express = require('express');
const router = express.Router();
const FamilyLicense = require('../models/FamilyLicense');
const SchoolLicense = require('../models/SchoolLicense');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware para verificar se é administrador
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas administradores podem gerenciar licenças.',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

/**
 * POST /api/admin/licenses/family/create
 * Criar licença família manualmente (sem pagamento)
 */
router.post('/family/create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('👨‍👩‍👧‍👦 CRIANDO LICENÇA FAMÍLIA MANUAL');
    console.log('📋 Dados recebidos:', req.body);
    console.log('👤 Admin:', req.user.email);

    const { 
      numParents, 
      numStudents, 
      totalPrice, 
      purchaserEmail, 
      purchaserName,
      expiresInDays,
      maxUsages, // Quantas vezes a licença pode ser usada
      quantity // Quantidade de licenças a gerar (lote)
    } = req.body;

    // Validações
    if (!numParents || !numStudents) {
      return res.status(400).json({
        error: 'Número de responsáveis e alunos são obrigatórios',
        code: 'MISSING_DATA'
      });
    }

    if (numParents < 1 || numParents > 2) {
      return res.status(400).json({
        error: 'Número de responsáveis deve ser entre 1 e 2',
        code: 'INVALID_NUM_PARENTS'
      });
    }

    if (numStudents < 1 || numStudents > 4) {
      return res.status(400).json({
        error: 'Número de alunos deve ser entre 1 e 4',
        code: 'INVALID_NUM_STUDENTS'
      });
    }

    const qty = quantity || 1;
    if (qty < 1 || qty > 100) {
      return res.status(400).json({
        error: 'Quantidade deve ser entre 1 e 100',
        code: 'INVALID_QUANTITY'
      });
    }

    // Processar geração em lote
    const createdLicenses = [];
    const errors = [];

    for (let i = 0; i < qty; i++) {
      try {
        // Gerar código único da licença
        const licenseCode = FamilyLicense.generateLicenseCode();
        
        // Determinar maxUsages: usar o valor fornecido ou padrão (número de responsáveis)
        const licenseMaxUsages = maxUsages && maxUsages > 0 ? parseInt(maxUsages) : numParents;

        // Calcular data de expiração
        const expiresAt = expiresInDays 
          ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias padrão

        // Criar licença
        const familyLicense = new FamilyLicense({
          licenseCode,
          planData: {
            numParents,
            numStudents,
            totalPrice: totalPrice || 0
          },
          status: 'active', // Status ativo diretamente (sem passar por 'pending')
          maxUsages: licenseMaxUsages, // Quantas vezes a licença pode ser usada
          usageCount: 0, // Inicializar explicitamente como 0
          payment: {
            transactionId: `MANUAL-ADMIN-${Date.now()}-${i}`,
            paymentMethod: 'manual',
            paidAt: new Date(),
            amount: totalPrice || 0
          },
          purchaser: {
            email: purchaserEmail || req.user.email,
            name: purchaserName || 'Admin Manual',
            phone: null
          },
          expiresAt,
          // Não criar subscription para licenças manuais
          subscription: undefined
        });

        // Gerar licenças individuais para os responsáveis
        familyLicense.generateIndividualLicenses();
        
        // Nota: A permissão de gerar tokens será determinada automaticamente:
        // - Apenas o primeiro responsável que usar a licença poderá gerar tokens
        // - Isso é controlado no backend quando o responsável se registra

        await familyLicense.save();
        console.log(`✅ Licença família ${i + 1}/${qty} criada:`, licenseCode);

        createdLicenses.push({
          licenseCode: familyLicense.licenseCode,
          individualLicenses: familyLicense.generatedLicenses.map(l => l.licenseCode),
          availableTokens: familyLicense.availableTokens,
          maxUsages: familyLicense.maxUsages,
          expiresAt: familyLicense.expiresAt
        });

      } catch (error) {
        console.error(`❌ Erro ao criar licença ${i + 1}:`, error);
        errors.push({
          index: i + 1,
          error: error.message
        });
      }
    }

    // Log da ação administrativa
    console.log(`📝 Admin ${req.user.email} gerou ${createdLicenses.length} licença(s) família`);

    res.status(201).json({
      success: true,
      message: `${createdLicenses.length} licença(s) família criada(s) com sucesso`,
      licenses: createdLicenses,
      errors: errors.length > 0 ? errors : undefined,
      generatedBy: {
        adminEmail: req.user.email,
        adminName: req.user.name,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar licença família manual:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao criar licença',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/admin/licenses/school/create
 * Criar licença escola manualmente (sem pagamento)
 */
router.post('/school/create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🏫 CRIANDO LICENÇA ESCOLA MANUAL');
    console.log('📋 Dados recebidos:', req.body);
    console.log('👤 Admin:', req.user.email);

    const { 
      numStudents, 
      totalPrice, 
      schoolName,
      schoolEmail,
      schoolPhone,
      expiresInDays,
      quantity // Quantidade de licenças a gerar (lote)
    } = req.body;

    // Validações
    if (!numStudents) {
      return res.status(400).json({
        error: 'Número de alunos é obrigatório',
        code: 'MISSING_DATA'
      });
    }

    if (numStudents < 50) {
      return res.status(400).json({
        error: 'Mínimo de 50 alunos para o Plano Escola',
        code: 'INSUFFICIENT_STUDENTS'
      });
    }

    const qty = quantity || 1;
    if (qty < 1 || qty > 100) {
      return res.status(400).json({
        error: 'Quantidade deve ser entre 1 e 100',
        code: 'INVALID_QUANTITY'
      });
    }

    // Processar geração em lote
    const createdLicenses = [];
    const errors = [];

    for (let i = 0; i < qty; i++) {
      try {
        // Gerar código único da licença
        const licenseCode = SchoolLicense.generateLicenseCode();
        
        // Calcular data de expiração
        const expiresAt = expiresInDays 
          ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias padrão

        // Criar licença
        const schoolLicense = new SchoolLicense({
          licenseCode,
          planData: {
            numStudents,
            totalPrice: totalPrice || 0
          },
          status: 'paid', // Status pago diretamente (licenças manuais são consideradas pagas)
          payment: {
            transactionId: `MANUAL-ADMIN-${Date.now()}-${i}`,
            paymentMethod: 'manual',
            paidAt: new Date()
          },
          schoolData: {
            name: schoolName || 'Escola Manual',
            email: schoolEmail || req.user.email,
            phone: schoolPhone || null
          },
          expiresAt,
          // Não criar subscription para licenças manuais
          subscription: undefined
        });

        // Gerar licenças individuais para cada aluno
        const generatedLicenses = [];
        for (let j = 0; j < numStudents; j++) {
          const individualCode = SchoolLicense.generateLicenseCode();
          generatedLicenses.push({
            licenseCode: individualCode,
            status: 'available'
          });
        }
        schoolLicense.generatedLicenses = generatedLicenses;

        await schoolLicense.save();
        console.log(`✅ Licença escola ${i + 1}/${qty} criada:`, licenseCode);

        createdLicenses.push({
          licenseCode: schoolLicense.licenseCode,
          individualLicensesCount: generatedLicenses.length,
          expiresAt: schoolLicense.expiresAt
        });

      } catch (error) {
        console.error(`❌ Erro ao criar licença ${i + 1}:`, error);
        errors.push({
          index: i + 1,
          error: error.message
        });
      }
    }

    // Log da ação administrativa
    console.log(`📝 Admin ${req.user.email} gerou ${createdLicenses.length} licença(s) escola`);

    res.status(201).json({
      success: true,
      message: `${createdLicenses.length} licença(s) escola criada(s) com sucesso`,
      licenses: createdLicenses,
      errors: errors.length > 0 ? errors : undefined,
      generatedBy: {
        adminEmail: req.user.email,
        adminName: req.user.name,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar licença escola manual:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao criar licença',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * DELETE /api/admin/licenses/:code
 * Deletar uma licença (família ou escola)
 * IMPORTANTE: Esta rota deve vir ANTES da rota GET '/' para evitar conflitos
 */
router.delete('/:code', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Decodificar o código da URL (pode ter sido codificado)
    let { code } = req.params;
    code = decodeURIComponent(code).toUpperCase().trim();
    
    console.log('🗑️ DELETE - Tentando deletar licença:', code);
    
    if (!code) {
      return res.status(400).json({
        error: 'Código da licença é obrigatório',
        code: 'MISSING_CODE'
      });
    }

    // Tentar deletar licença família
    let deleted = await FamilyLicense.findOneAndDelete({ 
      licenseCode: code
    });

    if (deleted) {
      console.log(`✅ Licença família deletada: ${code} por ${req.user.email}`);
      return res.json({
        success: true,
        message: 'Licença família deletada com sucesso',
        type: 'family'
      });
    }

    // Tentar deletar licença escola
    deleted = await SchoolLicense.findOneAndDelete({ 
      licenseCode: code
    });

    if (deleted) {
      console.log(`✅ Licença escola deletada: ${code} por ${req.user.email}`);
      return res.json({
        success: true,
        message: 'Licença escola deletada com sucesso',
        type: 'school'
      });
    }

    return res.status(404).json({
      error: 'Licença não encontrada',
      code: 'LICENSE_NOT_FOUND'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar licença:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/admin/licenses
 * Listar todas as licenças (com filtros)
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type, status, limit = 50, skip = 0 } = req.query;

    let familyLicenses = [];
    let schoolLicenses = [];

    // Buscar licenças família
    if (!type || type === 'family') {
      const familyQuery = { 'payment.paymentMethod': 'manual' };
      if (status) familyQuery.status = status;

      familyLicenses = await FamilyLicense.find(familyQuery)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .select('licenseCode planData status expiresAt createdAt purchaser');
    }

    // Buscar licenças escola
    if (!type || type === 'school') {
      const schoolQuery = { 'payment.paymentMethod': 'manual' };
      if (status) schoolQuery.status = status;

      schoolLicenses = await SchoolLicense.find(schoolQuery)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .select('licenseCode planData status expiresAt createdAt schoolData');
    }

    res.json({
      success: true,
      familyLicenses,
      schoolLicenses,
      total: familyLicenses.length + schoolLicenses.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar licenças:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;

