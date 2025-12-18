const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Middleware para verificar se o usuário é gratuito
const requireGratuitoUser = async (req, res, next) => {
  try {
    console.log('🔍 MIDDLEWARE GRATUITO - Verificando usuário');
    console.log('📋 req.user.id:', req.user?.id);
    console.log('📋 req.user:', req.user);
    
    const user = await User.findById(req.user.id);
    console.log('📋 User encontrado no banco:', {
      id: user?._id,
      role: user?.role,
      isGratuito: user?.isGratuito,
      exists: !!user
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado no banco');
      return res.status(403).json({
        error: 'Usuário não encontrado.',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (!user.isGratuito || user.role !== 'student-gratuito') {
      console.log('❌ Usuário não é gratuito:', {
        isGratuito: user.isGratuito,
        role: user.role
      });
      return res.status(403).json({
        error: 'Acesso negado. Esta funcionalidade é apenas para usuários gratuitos.',
        code: 'ACCESS_DENIED'
      });
    }
    
    console.log('✅ Usuário gratuito validado com sucesso');
    req.gratuitoUser = user;
    next();
  } catch (error) {
    console.error('❌ Erro ao verificar usuário gratuito:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// GET /gratuito/users/:userId/grade-progression-status
// Obter status de progressão para usuário gratuito
router.get('/users/:userId/grade-progression-status', authenticateToken, requireGratuitoUser, async (req, res) => {
  try {
    console.log('🎯 PROGRESSÃO GRATUITA - GET');
    console.log('📋 User ID:', req.params.userId);
    console.log('📋 Usuário gratuito:', req.gratuitoUser._id);

    const user = req.gratuitoUser;

    // Verificar se o usuário solicitado é o mesmo logado
    if (user._id.toString() !== req.params.userId) {
      return res.status(403).json({
        error: 'Acesso negado',
        code: 'ACCESS_DENIED'
      });
    }

    // Retornar dados de progressão específicos para usuário gratuito
    const progressionData = {
      grade: {
        id: user.gradeId,
        name: user.gradeId,
        modules: [
          {
            id: 1,
            name: 'Módulo 1',
            lessons: 3,
            completed: user.progress?.completedLessons?.filter(lesson => lesson.module === 1).length || 0
          },
          {
            id: 2,
            name: 'Módulo 2',
            lessons: 3,
            completed: user.progress?.completedLessons?.filter(lesson => lesson.module === 2).length || 0
          },
          {
            id: 3,
            name: 'Módulo 3',
            lessons: 3,
            completed: user.progress?.completedLessons?.filter(lesson => lesson.module === 3).length || 0
          }
        ]
      },
      progress: {
        xp: user.progress?.xp || 0,
        level: user.progress?.level || 1,
        yuCoins: user.progress?.yuCoins || 0,
        streak: user.progress?.streak || 0,
        hearts: user.progress?.hearts || 3,
        completedLessons: user.progress?.completedLessons || [],
        currentModule: user.currentModule || 1
      },
      devMode: false,
      isGratuito: true,
      maxModules: 3 // Usuários gratuitos têm acesso apenas aos 3 primeiros módulos
    };

    console.log('✅ Progressão gratuita retornada:', progressionData);

    res.json(progressionData);

  } catch (error) {
    console.error('❌ Erro ao obter progressão gratuita:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /gratuito/users/:userId/complete-lesson
// Completar lição para usuário gratuito
router.post('/users/:userId/complete-lesson', authenticateToken, requireGratuitoUser, async (req, res) => {
  try {
    console.log('🎯 COMPLETAR LIÇÃO GRATUITA - POST');
    console.log('📋 User ID:', req.params.userId);
    console.log('📋 Body:', req.body);
    console.log('📋 Headers:', req.headers);
    console.log('📋 User from token:', req.user);
    console.log('📋 Gratuito User:', req.gratuitoUser);

    const user = req.gratuitoUser;
    const { lessonId, score, timeSpent, answers } = req.body;

    console.log('📋 Dados extraídos:', { lessonId, score, timeSpent, answers });
    console.log('📋 User object:', {
      id: user._id,
      role: user.role,
      isGratuito: user.isGratuito,
      progress: user.progress
    });

    // Verificar se o usuário solicitado é o mesmo logado
    if (user._id.toString() !== req.params.userId) {
      return res.status(403).json({
        error: 'Acesso negado',
        code: 'ACCESS_DENIED'
      });
    }

    // Verificar se a lição já foi completada
    const alreadyCompleted = user.progress?.completedLessons?.some(
      lesson => lesson.lessonId === lessonId
    );

    if (alreadyCompleted) {
      console.log('⚠️ Lição já completada anteriormente');
      return res.json({
        success: true,
        message: 'Lição já completada anteriormente',
        alreadyCompleted: true,
        progress: user.progress
      });
    }

    // Calcular XP e YuCoins baseado na pontuação
    const baseXP = Math.floor(score * 10); // 10 XP por ponto
    const bonusXP = timeSpent < 300 ? 50 : 0; // Bônus por completar rápido
    const totalXP = baseXP + bonusXP;
    const yuCoinsEarned = Math.floor(totalXP / 5); // 1 YuCoin a cada 5 XP

    // Atualizar progresso do usuário
    const updatedProgress = {
      ...user.progress,
      xp: (user.progress?.xp || 0) + totalXP,
      yuCoins: (user.progress?.yuCoins || 0) + yuCoinsEarned,
      streak: (user.progress?.streak || 0) + 1,
      completedLessons: [
        ...(user.progress?.completedLessons || []),
        {
          lessonId,
          score,
          timeSpent,
          completedAt: new Date(),
          xpEarned: totalXP,
          yuCoinsEarned
        }
      ]
    };

    // Verificar se subiu de nível
    const newLevel = Math.floor(updatedProgress.xp / 1000) + 1;
    if (newLevel > (user.progress?.level || 1)) {
      updatedProgress.level = newLevel;
      updatedProgress.hearts = 3; // Restaurar corações ao subir de nível
    }

    // Atualizar usuário no banco
    await User.findByIdAndUpdate(user._id, {
      progress: updatedProgress
    });

    console.log('✅ Lição gratuita completada com sucesso');
    console.log('📊 XP ganho:', totalXP);
    console.log('💰 YuCoins ganhos:', yuCoinsEarned);
    console.log('📈 Novo nível:', updatedProgress.level);

    res.json({
      success: true,
      message: 'Lição completada com sucesso!',
      progress: updatedProgress,
      rewards: {
        xp: totalXP,
        yuCoins: yuCoinsEarned,
        levelUp: newLevel > (user.progress?.level || 1)
      }
    });

  } catch (error) {
    console.error('❌ Erro ao completar lição gratuita:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /gratuito/users/:userId/profile
// Obter perfil do usuário gratuito
router.get('/users/:userId/profile', authenticateToken, requireGratuitoUser, async (req, res) => {
  try {
    const user = req.gratuitoUser;

    // Verificar se o usuário solicitado é o mesmo logado
    if (user._id.toString() !== req.params.userId) {
      return res.status(403).json({
        error: 'Acesso negado',
        code: 'ACCESS_DENIED'
      });
    }

    const userProfile = {
      id: user._id,
      cpf: user.cpf,
      gradeId: user.gradeId,
      role: user.role,
      isGratuito: user.isGratuito,
      progress: user.progress,
      currentModule: user.currentModule,
      createdAt: user.createdAt
    };

    res.json(userProfile);

  } catch (error) {
    console.error('❌ Erro ao obter perfil gratuito:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
