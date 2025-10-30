const User = require('../models/User');
const FamilyLicense = require('../models/FamilyLicense');
const SchoolLicense = require('../models/SchoolLicense');
const { sendEmail } = require('./emailService');

/**
 * Suspender acesso de uma família em cascata
 * @param {String} familyLicenseCode - Código da licença família
 */
const suspendFamilyAccess = async (familyLicenseCode) => {
  try {
    console.log('🔒 Suspender acesso família:', familyLicenseCode);
    
    const license = await FamilyLicense.findOne({ licenseCode: familyLicenseCode });
    
    if (!license) {
      console.log('⚠️ Licença não encontrada:', familyLicenseCode);
      return;
    }

    if (license.isValid()) {
      console.log('✅ Licença ainda válida, sem necessidade de suspensão');
      return;
    }

    // 1. SUSPENDER TODOS OS PAIS
    const parentIds = license.generatedLicenses
      .filter(lic => lic.usedBy)
      .map(lic => lic.usedBy);
    
    if (parentIds.length > 0) {
      await User.updateMany(
        { _id: { $in: parentIds } },
        { 
          accessStatus: 'suspended',
          'licenseStatus.isValid': false,
          'licenseStatus.reason': 'family_license_expired',
          'licenseStatus.lastChecked': new Date()
        }
      );
      console.log(`✅ Suspenso ${parentIds.length} pais`);
    }
    
    // 2. SUSPENDER TODOS OS FILHOS VINCULADOS VIA TOKENS
    const studentIds = license.generatedTokens
      .filter(token => token.usedBy)
      .map(token => token.usedBy);
    
    if (studentIds.length > 0) {
      await User.updateMany(
        { _id: { $in: studentIds } },
        { 
          accessStatus: 'suspended',
          'licenseStatus.isValid': false,
          'licenseStatus.reason': 'parent_license_expired',
          'licenseStatus.lastChecked': new Date()
        }
      );
      console.log(`✅ Suspenso ${studentIds.length} alunos (via tokens)`);
    }
    
    // 3. SUSPENDER FILHOS VINCULADOS VIA parentId
    const suspendedCount = await User.updateMany(
      { parentId: { $in: parentIds } },
      { 
        accessStatus: 'suspended',
        'licenseStatus.isValid': false,
        'licenseStatus.reason': 'parent_license_expired',
        'licenseStatus.lastChecked': new Date()
      }
    );
    
    if (suspendedCount.modifiedCount > 0) {
      console.log(`✅ Suspenso ${suspendedCount.modifiedCount} alunos adicionais (via parentId)`);
    }
    
    // 4. NOTIFICAR USUÁRIOS
    if (license.purchaser?.email) {
      await sendEmail(
        license.purchaser.email,
        'Acesso YüFin Suspenso - Licença Expirada',
        `Sua licença YüFin expirou e o acesso foi suspenso. Renove para continuar usando o app.`
      );
    }
    
    console.log('✅ Suspensão de família concluída');
  } catch (error) {
    console.error('❌ Erro ao suspender acesso família:', error);
    throw error;
  }
};

/**
 * Restaurar acesso de uma família em cascata
 * @param {String} familyLicenseCode - Código da licença família
 */
const restoreFamilyAccess = async (familyLicenseCode) => {
  try {
    console.log('🔓 Restaurar acesso família:', familyLicenseCode);
    
    const license = await FamilyLicense.findOne({ licenseCode: familyLicenseCode });
    
    if (!license) {
      console.log('⚠️ Licença não encontrada:', familyLicenseCode);
      return;
    }

    if (!license.isValid()) {
      console.log('⚠️ Licença ainda inválida, não restaurar');
      return;
    }

    // 1. RESTAURAR ACESSO DOS PAIS
    const parentIds = license.generatedLicenses
      .filter(lic => lic.usedBy)
      .map(lic => lic.usedBy);
    
    if (parentIds.length > 0) {
      await User.updateMany(
        { _id: { $in: parentIds } },
        { 
          accessStatus: 'active',
          'licenseStatus.isValid': true,
          'licenseStatus.lastChecked': new Date()
        }
      );
      console.log(`✅ Restaurado ${parentIds.length} pais`);
    }
    
    // 2. RESTAURAR ACESSO DOS FILHOS VIA TOKENS
    const studentIds = license.generatedTokens
      .filter(token => token.usedBy)
      .map(token => token.usedBy);
    
    if (studentIds.length > 0) {
      await User.updateMany(
        { _id: { $in: studentIds } },
        { 
          accessStatus: 'active',
          'licenseStatus.isValid': true,
          'licenseStatus.lastChecked': new Date()
        }
      );
      console.log(`✅ Restaurado ${studentIds.length} alunos (via tokens)`);
    }
    
    // 3. RESTAURAR FILHOS VINCULADOS VIA parentId
    const restoredCount = await User.updateMany(
      { parentId: { $in: parentIds } },
      { 
        accessStatus: 'active',
        'licenseStatus.isValid': true,
        'licenseStatus.lastChecked': new Date()
      }
    );
    
    if (restoredCount.modifiedCount > 0) {
      console.log(`✅ Restaurado ${restoredCount.modifiedCount} alunos adicionais (via parentId)`);
    }
    
    // 4. NOTIFICAR RENOVAÇÃO
    if (license.purchaser?.email) {
      await sendEmail(
        license.purchaser.email,
        'Acesso YüFin Restaurado - Assinatura Renovada',
        `Sua assinatura YüFin foi renovada com sucesso! Seu acesso está ativo novamente.`
      );
    }
    
    console.log('✅ Restauração de família concluída');
  } catch (error) {
    console.error('❌ Erro ao restaurar acesso família:', error);
    throw error;
  }
};

/**
 * Suspender acesso de uma escola em cascata
 * @param {String} schoolLicenseCode - Código da licença escola
 */
const suspendSchoolAccess = async (schoolLicenseCode) => {
  try {
    console.log('🔒 Suspender acesso escola:', schoolLicenseCode);
    
    const license = await SchoolLicense.findOne({ licenseCode: schoolLicenseCode });
    
    if (!license) {
      console.log('⚠️ Licença não encontrada:', schoolLicenseCode);
      return;
    }

    if (license.isValid()) {
      console.log('✅ Licença ainda válida, sem necessidade de suspensão');
      return;
    }

    // 1. SUSPENDER ESCOLA
    await User.updateMany(
      { 'schoolLicense.code': schoolLicenseCode, role: 'school' },
      { 
        accessStatus: 'suspended',
        'licenseStatus.isValid': false,
        'licenseStatus.reason': 'school_license_expired',
        'licenseStatus.lastChecked': new Date()
      }
    );
    
    // 2. SUSPENDER TODOS OS ALUNOS DA ESCOLA
    const studentIds = license.generatedLicenses
      .filter(lic => lic.usedBy)
      .map(lic => lic.usedBy.userId);
    
    if (studentIds.length > 0) {
      await User.updateMany(
        { _id: { $in: studentIds } },
        { 
          accessStatus: 'suspended',
          'licenseStatus.isValid': false,
          'licenseStatus.reason': 'school_license_expired',
          'licenseStatus.lastChecked': new Date()
        }
      );
      console.log(`✅ Suspenso ${studentIds.length} alunos`);
    }
    
    // 3. NOTIFICAR ESCOLA
    if (license.schoolData?.email) {
      await sendEmail(
        license.schoolData.email,
        'Acesso YüFin Suspenso - Licença Expirada',
        `A licença YüFin da escola expirou e o acesso foi suspenso. Renove para continuar usando o app.`
      );
    }
    
    console.log('✅ Suspensão de escola concluída');
  } catch (error) {
    console.error('❌ Erro ao suspender acesso escola:', error);
    throw error;
  }
};

/**
 * Restaurar acesso de uma escola em cascata
 * @param {String} schoolLicenseCode - Código da licença escola
 */
const restoreSchoolAccess = async (schoolLicenseCode) => {
  try {
    console.log('🔓 Restaurar acesso escola:', schoolLicenseCode);
    
    const license = await SchoolLicense.findOne({ licenseCode: schoolLicenseCode });
    
    if (!license) {
      console.log('⚠️ Licença não encontrada:', schoolLicenseCode);
      return;
    }

    if (!license.isValid()) {
      console.log('⚠️ Licença ainda inválida, não restaurar');
      return;
    }

    // 1. RESTAURAR ACESSO DA ESCOLA
    await User.updateMany(
      { 'schoolLicense.code': schoolLicenseCode, role: 'school' },
      { 
        accessStatus: 'active',
        'licenseStatus.isValid': true,
        'licenseStatus.lastChecked': new Date()
      }
    );
    
    // 2. RESTAURAR ACESSO DOS ALUNOS
    const studentIds = license.generatedLicenses
      .filter(lic => lic.usedBy)
      .map(lic => lic.usedBy.userId);
    
    if (studentIds.length > 0) {
      await User.updateMany(
        { _id: { $in: studentIds } },
        { 
          accessStatus: 'active',
          'licenseStatus.isValid': true,
          'licenseStatus.lastChecked': new Date()
        }
      );
      console.log(`✅ Restaurado ${studentIds.length} alunos`);
    }
    
    // 3. NOTIFICAR ESCOLA
    if (license.schoolData?.email) {
      await sendEmail(
        license.schoolData.email,
        'Acesso YüFin Restaurado - Assinatura Renovada',
        `A assinatura YüFin da escola foi renovada com sucesso! O acesso está ativo novamente.`
      );
    }
    
    console.log('✅ Restauração de escola concluída');
  } catch (error) {
    console.error('❌ Erro ao restaurar acesso escola:', error);
    throw error;
  }
};

/**
 * Ativar período de graça para uma licença
 * @param {String} licenseCode - Código da licença
 * @param {String} planType - Tipo de plano ('family' ou 'school')
 * @param {String} reason - Razão do período de graça
 */
const activateGracePeriod = async (licenseCode, planType, reason) => {
  try {
    console.log(`⏰ Ativando período de graça para ${planType}:`, licenseCode);
    
    const gracePeriodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
    
    if (planType === 'family') {
      const license = await FamilyLicense.findOneAndUpdate(
        { licenseCode },
        {
          'gracePeriod.isActive': true,
          'gracePeriod.expiresAt': gracePeriodEnd,
          'gracePeriod.reason': reason
        },
        { new: true }
      );
      
      if (license?.purchaser?.email) {
        await sendEmail(
          license.purchaser.email,
          'Período de Graça Ativado - YüFin',
          `Seu pagamento falhou, mas você tem 7 dias para regularizar antes do acesso ser suspenso.`
        );
      }
    } else if (planType === 'school') {
      const license = await SchoolLicense.findOneAndUpdate(
        { licenseCode },
        {
          'gracePeriod.isActive': true,
          'gracePeriod.expiresAt': gracePeriodEnd,
          'gracePeriod.reason': reason
        },
        { new: true }
      );
      
      if (license?.schoolData?.email) {
        await sendEmail(
          license.schoolData.email,
          'Período de Graça Ativado - YüFin',
          `O pagamento falhou, mas vocês têm 7 dias para regularizar antes do acesso ser suspenso.`
        );
      }
    }
    
    console.log('✅ Período de graça ativado');
  } catch (error) {
    console.error('❌ Erro ao ativar período de graça:', error);
    throw error;
  }
};

module.exports = {
  suspendFamilyAccess,
  restoreFamilyAccess,
  suspendSchoolAccess,
  restoreSchoolAccess,
  activateGracePeriod
};

