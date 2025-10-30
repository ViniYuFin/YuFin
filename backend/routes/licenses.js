const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const FamilyLicense = require('../models/FamilyLicense');
const SchoolLicense = require('../models/SchoolLicense');
const { cancelSubscriptionById } = require('../config/mercado-pago');

// Middleware simples para autenticar via token da landing/app
function requireToken(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token necessário', code: 'MISSING_TOKEN' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.auth = decoded; // { userId, email, role, type }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido', code: 'INVALID_TOKEN' });
  }
}

// GET /api/licenses/mine - Licenças do comprador logado (landing ou app)
router.get('/licenses/mine', requireToken, async (req, res) => {
  try {
    const email = req.auth.email?.toLowerCase();

    const [familyLicenses, schoolLicenses] = await Promise.all([
      FamilyLicense.find({ 'purchaser.email': email }).sort({ createdAt: -1 }),
      SchoolLicense.find({ 'schoolData.email': email }).sort({ createdAt: -1 })
    ]);

    const licenses = [
      ...familyLicenses.map(l => ({
        planType: 'family',
        code: l.licenseCode,
        status: l.status,
        expiresAt: l.expiresAt,
        createdAt: l.createdAt,
        amount: l.planData?.totalPrice,
        subscription: l.subscription || null
      })),
      ...schoolLicenses.map(l => ({
        planType: 'school',
        code: l.licenseCode,
        status: l.status,
        expiresAt: l.expiresAt,
        createdAt: l.createdAt,
        amount: l.planData?.totalPrice,
        subscription: l.subscription || null
      }))
    ];

    res.json({ success: true, licenses });
  } catch (error) {
    console.error('Erro em /licenses/mine:', error);
    res.status(500).json({ error: 'Erro ao listar licenças' });
  }
});

// GET /api/licenses/:code/history - Histórico de cobranças/renovações por licença
router.get('/licenses/:code/history', requireToken, async (req, res) => {
  try {
    const { code } = req.params;
    const email = req.auth.email?.toLowerCase();

    let license = await FamilyLicense.findOne({ licenseCode: code, 'purchaser.email': email });
    let planType = 'family';
    if (!license) {
      license = await SchoolLicense.findOne({ licenseCode: code, 'schoolData.email': email });
      planType = 'school';
    }
    if (!license) {
      return res.status(404).json({ error: 'Licença não encontrada' });
    }

    res.json({
      success: true,
      planType,
      licenseCode: license.licenseCode,
      renewalHistory: license.renewalHistory || [],
      payment: license.payment || null,
      subscription: license.subscription || null
    });
  } catch (error) {
    console.error('Erro em /licenses/:code/history:', error);
    res.status(500).json({ error: 'Erro ao obter histórico' });
  }
});

// POST /api/subscription/:licenseCode/cancel - Cancelar a recorrência
router.post('/subscription/:licenseCode/cancel', requireToken, async (req, res) => {
  try {
    const { licenseCode } = req.params;
    const email = req.auth.email?.toLowerCase();

    let license = await FamilyLicense.findOne({ licenseCode, 'purchaser.email': email });
    if (!license) {
      license = await SchoolLicense.findOne({ licenseCode, 'schoolData.email': email });
    }
    if (!license) {
      return res.status(404).json({ error: 'Licença não encontrada' });
    }

    // Cancelar na API do Mercado Pago (se tivermos o id da assinatura)
    if (license.subscription?.id) {
      try {
        await cancelSubscriptionById(license.subscription.id);
      } catch (mpErr) {
        console.warn('Aviso: falha ao cancelar no MP, continuando cancelamento local.', mpErr?.message);
      }
    }

    license.subscription = license.subscription || {};
    license.subscription.status = 'cancelled';
    await license.save();

    return res.json({ success: true, message: 'Assinatura cancelada', licenseCode });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: 'Erro ao cancelar assinatura' });
  }
});

module.exports = router;


