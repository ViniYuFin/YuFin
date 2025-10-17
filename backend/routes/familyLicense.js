const express = require('express');
const router = express.Router();
const FamilyLicense = require('../models/FamilyLicense');
const { hashPassword } = require('../utils/password');

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
      payment: {
        transactionId: paymentData.transactionId,
        paymentMethod: paymentData.paymentMethod || 'credit_card',
        paidAt: new Date(),
        amount: planData.totalPrice
      },
      purchaser: {
        email: purchaserData?.email,
        name: purchaserData?.name,
        phone: purchaserData?.phone
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

module.exports = router;

