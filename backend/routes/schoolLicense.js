const express = require('express');
const router = express.Router();
const SchoolLicense = require('../models/SchoolLicense');
const { hashPassword } = require('../utils/password');

// POST /api/school-license/create - Criar licença após pagamento
router.post('/create', async (req, res) => {
  try {
    console.log('🏫 CRIANDO LICENÇA ESCOLA');
    console.log('📋 Dados recebidos:', req.body);

    const { planData, paymentData, schoolData } = req.body;

    // Validar dados obrigatórios
    if (!planData || !planData.numStudents) {
      return res.status(400).json({
        error: 'Dados do plano são obrigatórios',
        code: 'MISSING_PLAN_DATA'
      });
    }

    // Validar mínimo de alunos (50 para plano escola)
    if (planData.numStudents < 50) {
      return res.status(400).json({
        error: 'Mínimo de 50 alunos para o Plano Escola',
        code: 'INSUFFICIENT_STUDENTS'
      });
    }

    if (!paymentData || !paymentData.transactionId) {
      return res.status(400).json({
        error: 'Dados de pagamento são obrigatórios',
        code: 'MISSING_PAYMENT_DATA'
      });
    }

    // Gerar código único da licença
    const licenseCode = SchoolLicense.generateLicenseCode();
    console.log('🔑 Código da licença gerado:', licenseCode);

    // Criar licença
    const schoolLicense = new SchoolLicense({
      licenseCode,
      planData: {
        numStudents: planData.numStudents,
        totalPrice: planData.totalPrice
      },
      status: 'paid',
      payment: {
        transactionId: paymentData.transactionId,
        paymentMethod: paymentData.paymentMethod || 'credit_card',
        paidAt: new Date()
      },
      schoolData: schoolData || {}
    });

    // Gerar licenças individuais para cada aluno
    const generatedLicenses = [];
    for (let i = 0; i < planData.numStudents; i++) {
      const individualCode = SchoolLicense.generateLicenseCode();
      generatedLicenses.push({
        licenseCode: individualCode,
        status: 'available'
      });
    }

    schoolLicense.generatedLicenses = generatedLicenses;

    await schoolLicense.save();
    console.log('✅ Licença escola criada com sucesso');

    res.json({
      success: true,
      licenseCode: schoolLicense.licenseCode,
      individualLicenses: generatedLicenses.length,
      message: 'Licença escola criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar licença escola:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao criar licença',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/school-license/validate/:licenseCode - Validar licença escola
router.get('/validate/:licenseCode', async (req, res) => {
  try {
    const { licenseCode } = req.params;
    const cleanCode = licenseCode.toUpperCase().trim();
    
    // 🔧 MODO DESENVOLVIMENTO: Buscar dados reais do MongoDB mesmo para códigos simulados
    if (cleanCode.startsWith('SCH-')) {
      console.log('🔧 MODO DESENVOLVIMENTO: Buscando dados reais para:', cleanCode);
      
      // Buscar licença real no MongoDB
      const schoolLicense = await SchoolLicense.findOne({ 
        licenseCode: cleanCode 
      });
      
      if (schoolLicense) {
        console.log('✅ Licença real encontrada no MongoDB');
        console.log('📋 PlanData:', schoolLicense.planData);
        return res.json({
          success: true,
          valid: true,
          license: {
            code: cleanCode,
            planData: schoolLicense.planData, // ✅ DADOS REAIS DA LICENÇA
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
            planData: { numStudents: 50, totalPrice: 495.00 },
            status: 'paid',
            isSimulated: true
          },
          message: 'Código simulado aceito em desenvolvimento (fallback)'
        });
      }
    }

    const schoolLicense = await SchoolLicense.findOne({ 
      licenseCode: cleanCode 
    });

    if (!schoolLicense) {
      return res.status(404).json({
        error: 'Licença não encontrada',
        code: 'LICENSE_NOT_FOUND'
      });
    }

    if (!schoolLicense.isValid()) {
      return res.status(400).json({
        error: 'Licença inválida ou expirada',
        code: 'LICENSE_INVALID'
      });
    }

    // Verificar se há licenças disponíveis
    const availableLicenses = schoolLicense.availableLicenses;
    
    if (availableLicenses.length === 0) {
      return res.status(400).json({
        error: 'Todas as licenças já foram utilizadas',
        code: 'ALL_LICENSES_USED'
      });
    }

    console.log('✅ Licença escola válida encontrada');
    res.json({
      success: true,
      valid: true,
      availableLicenses: availableLicenses.length,
      planData: schoolLicense.planData,
      message: 'Licença escola válida'
    });

  } catch (error) {
    console.error('❌ Erro ao validar licença escola:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao validar licença',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/school-license/use - Usar licença individual para registro
router.post('/use', async (req, res) => {
  try {
    console.log('🎯 USANDO LICENÇA ESCOLA INDIVIDUAL');
    console.log('📋 Dados recebidos:', req.body);

    const { licenseCode, userData } = req.body;

    if (!licenseCode || !userData) {
      return res.status(400).json({
        error: 'Código de licença e dados do usuário são obrigatórios',
        code: 'MISSING_DATA'
      });
    }

    // 🔧 MODO DESENVOLVIMENTO: Buscar dados reais do MongoDB mesmo para códigos simulados
    if (licenseCode.startsWith('SCH-')) {
      console.log('🔧 MODO DESENVOLVIMENTO: Buscando dados reais para uso:', licenseCode);
      
      // Buscar licença real no MongoDB
      const schoolLicense = await SchoolLicense.findOne({ 
        licenseCode: licenseCode.toUpperCase().trim() 
      });
      
      if (schoolLicense) {
        console.log('✅ Licença real encontrada no MongoDB para uso');
        console.log('📋 PlanData:', schoolLicense.planData);
        
        // Encontrar licença individual disponível
        const availableLicense = schoolLicense.generatedLicenses.find(
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
        availableLicense.usedBy = {
          userId: userData.id || 'temp',
          userName: userData.name,
          userEmail: userData.email
        };

        await schoolLicense.save();
        console.log('✅ Licença individual marcada como usada');
        
        return res.json({
          success: true,
          individualLicenseCode: availableLicense.licenseCode,
          planData: schoolLicense.planData, // ✅ DADOS REAIS DA LICENÇA
          message: 'Licença real aceita em desenvolvimento'
        });
      } else {
        console.log('⚠️ Licença não encontrada no MongoDB, usando fallback');
        return res.json({
          success: true,
          individualLicenseCode: licenseCode,
          planData: { numStudents: 50, totalPrice: 495.00 }, // Fallback apenas se não encontrar
          message: 'Licença simulada aceita em desenvolvimento (fallback)'
        });
      }
    }

    // Buscar licença escola
    const schoolLicense = await SchoolLicense.findOne({ 
      licenseCode: licenseCode.toUpperCase().trim() 
    });

    if (!schoolLicense || !schoolLicense.isValid()) {
      return res.status(400).json({
        error: 'Licença inválida',
        code: 'LICENSE_INVALID'
      });
    }

    // Encontrar licença individual disponível
    const availableLicense = schoolLicense.generatedLicenses.find(
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
    availableLicense.usedBy = {
      userId: userData.id || 'temp',
      userName: userData.name,
      userEmail: userData.email
    };

    await schoolLicense.save();
    console.log('✅ Licença individual marcada como usada');

    res.json({
      success: true,
      individualLicenseCode: availableLicense.licenseCode,
      planData: schoolLicense.planData, // Incluir dados do plano
      message: 'Licença validada com sucesso. Você pode prosseguir com o registro.'
    });

  } catch (error) {
    console.error('❌ Erro ao usar licença escola:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao usar licença',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/school-license/:licenseCode/tokens - Obter tokens disponíveis
router.get('/:licenseCode/tokens', async (req, res) => {
  try {
    const { licenseCode } = req.params;
    
    const schoolLicense = await SchoolLicense.findOne({ 
      licenseCode: licenseCode.toUpperCase().trim() 
    });

    if (!schoolLicense) {
      return res.status(404).json({
        error: 'Licença não encontrada',
        code: 'LICENSE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      availableTokens: schoolLicense.availableLicenses.length,
      usedTokens: schoolLicense.usedLicenses.length,
      totalTokens: schoolLicense.planData.numStudents
    });

  } catch (error) {
    console.error('❌ Erro ao obter tokens escola:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;

