const express = require('express');
const router = express.Router();
const MarketValidation = require('../models/MarketValidation');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');

// ===========================
// POST /api/market-validation/submit
// ===========================
router.post('/submit', async (req, res) => {
  try {
    console.log('📝 Recebendo resposta de validação de mercado');
    
    const {
      name,
      email,
      phone,
      city,
      relationship,
      childrenCount,
      childrenAges,
      likesGames,
      teachesFinance,
      teachingMethods,
      challenges,
      biggestProblem,
      importance,
      wouldPay,
      priceRange,
      mainFeature,
      whenStart,
      knowsSimilar,
      additionalInfo
    } = req.body;
    
    // Validar campos obrigatórios
    if (!name || !email || !city || !relationship || !childrenCount || !childrenAges || !likesGames || 
        !teachesFinance || !biggestProblem || !importance || !wouldPay || !priceRange || !mainFeature || 
        !whenStart || !knowsSimilar) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando',
        required: ['name', 'email', 'city', 'relationship', 'childrenCount', 'childrenAges', 
                   'likesGames', 'teachesFinance', 'biggestProblem', 'importance', 'wouldPay', 
                   'priceRange', 'mainFeature', 'whenStart', 'knowsSimilar']
      });
    }
    
    // Verificar se já existe resposta com este email
    const existing = await MarketValidation.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log('⚠️ Email já cadastrado:', email);
      return res.status(409).json({
        error: 'Email já cadastrado',
        message: 'Você já preencheu este questionário. Obrigado pela participação!'
      });
    }
    
    // Criar resposta de validação
    const validation = new MarketValidation({
      name,
      email: email.toLowerCase(),
      phone,
      city,
      relationship,
      childrenCount,
      childrenAges,
      likesGames,
      teachesFinance,
      teachingMethods: teachingMethods || [],
      challenges: challenges || [],
      biggestProblem,
      importance,
      wouldPay,
      priceRange,
      mainFeature,
      whenStart,
      knowsSimilar,
      additionalInfo
    });
    
    // Calcular lead score
    validation.leadScore = validation.calculateLeadScore();
    validation.priority = validation.determinePriority();
    
    await validation.save();
    
    // Gerar cupom de acesso gratuito
    const couponCode = generateCouponCode(email);
    validation.couponCode = couponCode;
    validation.couponGenerated = true;
    await validation.save();
    
    console.log('✅ Resposta de validação salva:', {
      email,
      leadScore: validation.leadScore,
      priority: validation.priority
    });
    
    res.json({
      success: true,
      message: 'Obrigado pela sua participação!',
      couponCode: couponCode,
      leadScore: validation.leadScore,
      priority: validation.priority
    });
    
  } catch (error) {
    console.error('❌ Erro ao salvar validação de mercado:', error);
    res.status(500).json({
      error: 'Erro ao processar resposta',
      message: error.message
    });
  }
});

// ===========================
// GET /api/market-validation/dashboard
// ===========================
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    console.log('📊 Gerando dashboard de validação de mercado');
    
    // Estatísticas gerais
    const total = await MarketValidation.countDocuments();
    
    // Por disposição de pagar
    const wouldPayStats = await MarketValidation.aggregate([
      {
        $group: {
          _id: '$wouldPay',
          count: { $sum: 1 },
          avgScore: { $avg: '$leadScore' }
        }
      }
    ]);
    
    // Por urgência
    const urgencyStats = await MarketValidation.aggregate([
      {
        $group: {
          _id: '$whenStart',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Por prioridade
    const priorityStats = await MarketValidation.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Por cidade
    const cityStats = await MarketValidation.aggregate([
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Por faixa de preço
    const priceStats = await MarketValidation.aggregate([
      {
        $group: {
          _id: '$priceRange',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Leads com maior score
    const topLeads = await MarketValidation.find()
      .sort({ leadScore: -1 })
      .limit(20)
      .select('name email phone leadScore priority wouldPay whenStart importance');
    
    // Distribuição de lead score
    const scoreDistribution = await MarketValidation.aggregate([
      {
        $bucket: {
          groupBy: '$leadScore',
          boundaries: [0, 30, 50, 70, 90, 100],
          default: 'outro',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: {
          total: total,
          avgLeadScore: await MarketValidation.aggregate([
            { $group: { _id: null, avg: { $avg: '$leadScore' } } }
          ]).then(r => r[0]?.avg || 0)
        },
        wouldPay: wouldPayStats,
        urgency: urgencyStats,
        priority: priorityStats,
        cities: cityStats,
        prices: priceStats,
        topLeads: topLeads,
        scoreDistribution: scoreDistribution
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao gerar dashboard:', error);
    res.status(500).json({ error: 'Erro ao gerar dashboard' });
  }
});

// ===========================
// GET /api/market-validation/leads
// ===========================
router.get('/leads', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { status, priority, minScore, limit = 50 } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (minScore) query.leadScore = { $gte: parseInt(minScore) };
    
    const leads = await MarketValidation.find(query)
      .sort({ leadScore: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .select('-__v');
    
    res.json({
      success: true,
      count: leads.length,
      leads: leads
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar leads:', error);
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
});

// ===========================
// GET /api/market-validation/:id
// ===========================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const lead = await MarketValidation.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    res.json({
      success: true,
      lead: lead
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar lead:', error);
    res.status(500).json({ error: 'Erro ao buscar lead' });
  }
});

// ===========================
// PUT /api/market-validation/:id/status
// ===========================
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { status, notes } = req.body;
    
    const lead = await MarketValidation.findByIdAndUpdate(
      req.params.id,
      {
        status,
        notes,
        contactedAt: status === 'contactado' ? new Date() : undefined,
        lastFollowUp: new Date()
      },
      { new: true }
    );
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    res.json({
      success: true,
      lead: lead
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// ===========================
// DELETE /api/market-validation/:id
// ===========================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const lead = await MarketValidation.findByIdAndDelete(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    console.log('✅ Lead excluído:', lead.email);
    
    res.json({
      success: true,
      message: 'Lead excluído com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao excluir lead:', error);
    res.status(500).json({ error: 'Erro ao excluir lead' });
  }
});

// ===========================
// PUT /api/market-validation/:id/followup
// ===========================
router.put('/:id/followup', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { needFollowUp } = req.body;
    
    const lead = await MarketValidation.findByIdAndUpdate(
      req.params.id,
      { needFollowUp },
      { new: true }
    );
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    console.log('✅ Follow-up atualizado:', lead.email, '- needFollowUp:', needFollowUp);
    
    res.json({
      success: true,
      lead: lead
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar follow-up:', error);
    res.status(500).json({ error: 'Erro ao atualizar follow-up' });
  }
});

// ===========================
// Função auxiliar: Gerar código de cupom
// ===========================
function generateCouponCode(email) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const hash = crypto.createHash('md5').update(email).digest('hex').substring(0, 6).toUpperCase();
  return `YUFIN-BETA-${timestamp}-${hash}`;
}

module.exports = router;
