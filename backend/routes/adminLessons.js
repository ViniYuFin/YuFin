const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware para verificar se é administrador
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas administradores podem gerenciar lições.',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

/**
 * GET /api/admin/lessons
 * Listar todas as lições (com filtros opcionais)
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📚 [ADMIN LESSONS] Requisição recebida para listar lições');
    const { type, gradeId, module, isActive } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (gradeId) filter.gradeId = gradeId;
    if (module) filter.module = parseInt(module);
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    console.log('📚 [ADMIN LESSONS] Filtros aplicados:', filter);
    
    const lessons = await Lesson.find(filter)
      .sort({ gradeId: 1, module: 1, order: 1 })
      .lean();
    
    console.log(`📚 [ADMIN LESSONS] ${lessons.length} lições encontradas`);
    
    res.json(lessons);
  } catch (error) {
    console.error('❌ [ADMIN LESSONS] Erro ao listar lições:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/lessons/types
 * Listar tipos de gamificação disponíveis
 */
router.get('/types', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const types = [
      { value: 'quiz', label: 'Quiz (Perguntas e Respostas)', icon: '❓' },
      { value: 'drag-drop', label: 'Arraste e Solte', icon: '🖱️' },
      { value: 'goals', label: 'Metas Financeiras', icon: '🎯' },
      { value: 'match', label: 'Associação (Match)', icon: '🔗' },
      { value: 'budget-distribution', label: 'Distribuição de Orçamento', icon: '💰' },
      { value: 'math-problems', label: 'Problemas Matemáticos', icon: '🔢' },
      { value: 'simulation', label: 'Simulação', icon: '🎮' },
      { value: 'choices', label: 'Escolha Múltipla', icon: '📝' },
      { value: 'classify', label: 'Classificação', icon: '🏷️' },
      { value: 'input', label: 'Resposta Aberta', icon: '✍️' },
      { value: 'shopping-simulation', label: 'Simulação de Compras', icon: '🛒' },
      { value: 'price-comparison', label: 'Comparação de Preços', icon: '💲' },
      { value: 'budget-choices', label: 'Escolhas Orçamentárias', icon: '💳' },
      { value: 'categories-simulation', label: 'Simulação por Categorias', icon: '📊' },
      { value: 'progress-game', label: 'Jogo de Progresso', icon: '🎲' },
      { value: 'shopping-cart', label: 'Carrinho de Compras', icon: '🛍️' }
    ];
    
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/lessons/grades
 * Listar séries disponíveis
 */
router.get('/grades', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const grades = [
      { value: '6º Ano', label: '6º Ano' },
      { value: '7º Ano', label: '7º Ano' },
      { value: '8º Ano', label: '8º Ano' },
      { value: '9º Ano', label: '9º Ano' },
      { value: '1º Ano EM', label: '1º Ano EM' },
      { value: '2º Ano EM', label: '2º Ano EM' },
      { value: '3º Ano EM', label: '3º Ano EM' }
    ];
    
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/lessons/:id
 * Buscar lição específica
 */
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lição não encontrada' });
    }
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/lessons
 * Criar nova lição
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const lessonData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const lesson = new Lesson(lessonData);
    await lesson.save();
    
    res.status(201).json(lesson);
  } catch (error) {
    console.error('Erro ao criar lição:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/lessons/:id
 * Atualizar lição existente
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lição não encontrada' });
    }
    
    res.json(lesson);
  } catch (error) {
    console.error('Erro ao atualizar lição:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PATCH /api/admin/lessons/:id/toggle-active
 * Ativar/desativar lição
 */
router.patch('/:id/toggle-active', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { isActive, updatedAt: new Date() },
      { new: true }
    );
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lição não encontrada' });
    }
    
    res.json(lesson);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/lessons/:id
 * Deletar lição (soft delete - apenas desativa)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Soft delete - apenas desativa a lição
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lição não encontrada' });
    }
    
    res.json({ message: 'Lição desativada com sucesso', lesson });
  } catch (error) {
    console.error('Erro ao deletar lição:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
