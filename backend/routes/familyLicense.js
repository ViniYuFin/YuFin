const express = require('express');
const router = express.Router();
const FamilyLicense = require('../models/FamilyLicense');
const { hashPassword } = require('../utils/password');
const { authenticateToken } = require('../middleware/auth');

// POST /api/family-license/create - Criar licença após pagamento
router.post('/create', async (req, res) => {
  try {
    console.log('🚀 CRIANDO LICENÇA FAMÍLIA');
    console.log('📋 Dados recebidos:', req.body);

    const { planData, paymentData, purchaserData } = req.body;

    // Validar dados obrigatórios
    if (!planData || !planData.numParents || !planData.numStudents) {
      return res.status(400).json({
        error: 'Dados do plano são obrigatórios',
        code: 'MISSING_PLAN_DATA'
      });
    }

    // Validar limite de alunos (máximo 3)
    if (planData.numStudents > 3) {
      return res.status(400).json({
        error: 'Máximo de 3 alunos permitidos no Plano Família',
        code: 'TOO_MANY_STUDENTS'
      });
    }

    if (!paymentData || !paymentData.transactionId) {
      return res.status(400).json({
        error: 'Dados de pagamento são obrigatórios',
        code: 'MISSING_PAYMENT_DATA'
      });
    }

    // Gerar código único da licença
    const licenseCode = FamilyLicense.generateLicenseCode();
    console.log('🔑 Código da licença gerado:', licenseCode);

    // Criar licença
    const familyLicense = new FamilyLicense({
      licenseCode,
      planData: {
        numParents: planData.numParents,
        numStudents: planData.numStudents,
        totalPrice: planData.totalPrice
      },
      status: 'paid',
      maxUsages: planData.numParents, // Limite baseado no número de responsáveis
      payment: {
        transactionId: paymentData.transactionId,
        paymentMethod: paymentData.paymentMethod || 'credit_card',
        paidAt: new Date(),
        amount: planData.totalPrice
      },
      purchaser: {
        email: purchaserData?.email,
        name: purchaserData?.name,
        phone: typeof purchaserData?.phone === 'object' ? (purchaserData.phone?.number || null) : (purchaserData?.phone || null)
      }
    });

    // Gerar licenças individuais para os responsáveis
    familyLicense.generateIndividualLicenses();
    console.log('📋 Licenças individuais geradas:', familyLicense.generatedLicenses.length);

    await familyLicense.save();
    console.log('✅ Licença família salva com sucesso:', familyLicense._id);

    res.status(201).json({
      success: true,
      licenseCode: familyLicense.licenseCode,
      individualLicenses: familyLicense.generatedLicenses,
      availableTokens: familyLicense.availableTokens,
      message: 'Licença família criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar licença família:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao criar licença',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/family-license/validate/:licenseCode - Validar código de licença
router.get('/validate/:licenseCode', async (req, res) => {
  try {
    console.log('🔍 VALIDANDO LICENÇA FAMÍLIA');
    console.log('📋 Código:', req.params.licenseCode);

    const { licenseCode } = req.params;
    const cleanCode = licenseCode.toUpperCase().trim();

    // 🔧 MODO DESENVOLVIMENTO: Buscar dados reais do MongoDB mesmo para códigos simulados
    if (cleanCode.startsWith('FAM-')) {
      console.log('🔧 MODO DESENVOLVIMENTO: Buscando dados reais para:', cleanCode);
      
      // Buscar licença real no MongoDB
      const familyLicense = await FamilyLicense.findOne({ 
        licenseCode: cleanCode 
      });
      
      if (familyLicense) {
        console.log('✅ Licença real encontrada no MongoDB');
        console.log('📋 PlanData:', familyLicense.planData);
        return res.json({
          success: true,
          valid: true,
          license: {
            code: cleanCode,
            planData: familyLicense.planData,
            status: 'paid',
            isSimulated: false
          },
          message: 'Código real aceito em desenvolvimento'
        });
      } else {
        console.log('⚠️ Licença não encontrada no MongoDB, usando fallback');
        return res.json({
          success: true,
          valid: true,
          license: {
            code: cleanCode,
            planData: {
              numParents: 1,
              numStudents: 1,
              totalPrice: 19.90
            },
            status: 'paid',
            isSimulated: true
          },
          message: 'Código simulado aceito em desenvolvimento (fallback)'
        });
      }
    }

    // Buscar licença
    const familyLicense = await FamilyLicense.findOne({ 
      licenseCode: cleanCode 
    });

    if (!familyLicense) {
      console.log('❌ Licença não encontrada');
      return res.status(404).json({
        error: 'Código de licença inválido',
        code: 'LICENSE_NOT_FOUND'
      });
    }

    // Verificar se a licença é válida
    if (!familyLicense.isValid()) {
      console.log('❌ Licença inválida ou expirada');
      return res.status(400).json({
        error: 'Licença inválida ou expirada',
        code: 'LICENSE_INVALID'
      });
    }

    // Verificar se ainda há licenças individuais disponíveis
    const availableLicenses = familyLicense.generatedLicenses.filter(
      license => license.status === 'available'
    );

    if (availableLicenses.length === 0) {
      console.log('❌ Todas as licenças já foram utilizadas');
      return res.status(400).json({
        error: 'Todas as licenças já foram utilizadas',
        code: 'ALL_LICENSES_USED'
      });
    }

    console.log('✅ Licença válida encontrada');
    res.json({
      success: true,
      valid: true,
      availableLicenses: availableLicenses.length,
      planData: familyLicense.planData,
      message: 'Licença válida'
    });

  } catch (error) {
    console.error('❌ Erro ao validar licença:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao validar licença',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/family-license/use - Usar licença individual para registro
router.post('/use', async (req, res) => {
  try {
    console.log('🎯 USANDO LICENÇA INDIVIDUAL');
    console.log('📋 Dados recebidos:', req.body);

    const { licenseCode, userData } = req.body;

    if (!licenseCode || !userData) {
      return res.status(400).json({
        error: 'Código de licença e dados do usuário são obrigatórios',
        code: 'MISSING_DATA'
      });
    }

    // 🔧 MODO DESENVOLVIMENTO: Buscar dados reais do MongoDB
    if (licenseCode.startsWith('FAM-')) {
      console.log('🔧 MODO DESENVOLVIMENTO: Buscando dados reais para uso:', licenseCode);
      
      // Buscar licença real no MongoDB
      const familyLicense = await FamilyLicense.findOne({ 
        licenseCode: licenseCode.toUpperCase().trim() 
      });
      
      if (familyLicense) {
        console.log('✅ Licença real encontrada para uso');
        console.log('📋 PlanData:', familyLicense.planData);
        
        // Garantir que usageCount está definido (pode ser undefined/null em licenças antigas)
        if (familyLicense.usageCount === undefined || familyLicense.usageCount === null) {
          familyLicense.usageCount = 0;
        }
        
        // Garantir que maxUsages está definido
        if (familyLicense.maxUsages === undefined || familyLicense.maxUsages === null) {
          familyLicense.maxUsages = familyLicense.planData?.numParents || 1;
        }
        
        console.log('🔍 Verificando uso da licença:', {
          usageCount: familyLicense.usageCount,
          maxUsages: familyLicense.maxUsages,
          canBeUsed: familyLicense.canBeUsed(),
          typeOfUsageCount: typeof familyLicense.usageCount,
          typeOfMaxUsages: typeof familyLicense.maxUsages
        });
        
        // Verificar se a licença pode ser usada
        if (!familyLicense.canBeUsed()) {
          console.log('❌ Licença já foi utilizada o número máximo de vezes:', {
            usageCount: familyLicense.usageCount,
            maxUsages: familyLicense.maxUsages,
            comparison: `${familyLicense.usageCount} < ${familyLicense.maxUsages} = ${familyLicense.usageCount < familyLicense.maxUsages}`
          });
          return res.status(400).json({
            error: 'Licença já foi utilizada o número máximo de vezes',
            code: 'LICENSE_MAX_USAGE_REACHED'
          });
        }
        
        // Incrementar contador de uso ANTES de retornar
        familyLicense.usageCount += 1;
        await familyLicense.save();
        console.log('✅ Licença pode ser usada, contador incrementado:', {
          usageCount: familyLicense.usageCount,
          maxUsages: familyLicense.maxUsages
        });
        
        return res.json({
          success: true,
          individualLicenseCode: licenseCode,
          planData: familyLicense.planData, // ✅ DADOS REAIS
          message: 'Licença real aceita em desenvolvimento'
        });
      } else {
        console.log('⚠️ Licença não encontrada no MongoDB, usando fallback');
        return res.json({
          success: true,
          individualLicenseCode: licenseCode,
          planData: {
            numParents: 1,
            numStudents: 1,
            totalPrice: 19.90
          },
          message: 'Licença simulada aceita em desenvolvimento (fallback)'
        });
      }
    }

    // Buscar licença família
    const familyLicense = await FamilyLicense.findOne({ 
      licenseCode: licenseCode.toUpperCase().trim() 
    });

    if (!familyLicense || !familyLicense.isValid()) {
      return res.status(400).json({
        error: 'Licença inválida',
        code: 'LICENSE_INVALID'
      });
    }

    // Encontrar licença individual disponível
    const availableLicense = familyLicense.generatedLicenses.find(
      license => license.status === 'available'
    );

    if (!availableLicense) {
      return res.status(400).json({
        error: 'Todas as licenças já foram utilizadas',
        code: 'ALL_LICENSES_USED'
      });
    }

    // Marcar licença individual como usada
    availableLicense.status = 'used';
    availableLicense.usedAt = new Date();

    await familyLicense.save();
    console.log('✅ Licença individual marcada como usada');

    res.json({
      success: true,
      individualLicenseCode: availableLicense.licenseCode,
      planData: familyLicense.planData, // Incluir dados do plano
      message: 'Licença validada com sucesso. Você pode prosseguir com o registro.'
    });

  } catch (error) {
    console.error('❌ Erro ao usar licença:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao usar licença',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/family-license/:licenseCode/tokens - Obter tokens disponíveis
router.get('/:licenseCode/tokens', async (req, res) => {
  try {
    const { licenseCode } = req.params;
    
    const familyLicense = await FamilyLicense.findOne({ 
      licenseCode: licenseCode.toUpperCase().trim() 
    });

    if (!familyLicense) {
      return res.status(404).json({
        error: 'Licença não encontrada',
        code: 'LICENSE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      availableTokens: familyLicense.availableTokens,
      usedTokens: familyLicense.generatedTokens.filter(t => t.status === 'used').length,
      totalTokens: familyLicense.planData.numStudents
    });

  } catch (error) {
    console.error('❌ Erro ao obter tokens:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/family-license/check-token-permission/:licenseCode - Verificar se usuário pode gerar tokens
router.get('/check-token-permission/:licenseCode', authenticateToken, async (req, res) => {
  try {
    const { licenseCode } = req.params;
    const userId = req.user?.id; // Assumindo que o middleware de auth já foi aplicado

    console.log('🔍 Verificando permissão de tokens:', { licenseCode, userId });

    if (!userId) {
      return res.status(401).json({
        error: 'Usuário não autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    // Buscar a licença
    const familyLicense = await FamilyLicense.findOne({
      licenseCode: licenseCode.toUpperCase().trim()
    });

    if (!familyLicense) {
      return res.status(404).json({
        error: 'Licença não encontrada',
        code: 'LICENSE_NOT_FOUND'
      });
    }

    // Verificar se o usuário está associado a esta licença
    const userAssociated = familyLicense.usedBy.some(user => user.userId.toString() === userId);
    
    if (!userAssociated) {
      return res.status(403).json({
        error: 'Usuário não associado a esta licença',
        code: 'USER_NOT_ASSOCIATED'
      });
    }

    // Para licenças com 1 responsável, sempre pode gerar tokens
    if (familyLicense.planData.numParents === 1) {
      return res.json({
        canGenerateTokens: true,
        reason: 'Licença com 1 responsável'
      });
    }

    // Para licenças com 2 responsáveis, apenas o primeiro pode gerar tokens
    if (familyLicense.planData.numParents === 2) {
      // Verificar se o usuário é o primeiro a usar a licença
      // O primeiro usuário é aquele que foi associado primeiro (menor índice no array)
      const userIndex = familyLicense.usedBy.findIndex(user => user.userId.toString() === userId);
      const isFirstUser = userIndex === 0;

      console.log('🔍 Verificação de permissão:', {
        numParents: familyLicense.planData.numParents,
        userIndex,
        isFirstUser,
        usedBy: familyLicense.usedBy.length
      });

      return res.json({
        canGenerateTokens: isFirstUser,
        reason: isFirstUser ? 'Primeiro responsável' : 'Segundo responsável - apenas o primeiro pode gerar tokens'
      });
    }

    // Fallback: permitir por padrão
    return res.json({
      canGenerateTokens: true,
      reason: 'Licença padrão'
    });

  } catch (error) {
    console.error('❌ Erro ao verificar permissão de tokens:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;

