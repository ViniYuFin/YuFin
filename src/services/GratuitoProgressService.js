/**
 * Serviço para gerenciar progresso de usuários gratuitos
 * Mantém progresso localmente no localStorage
 */
class GratuitoProgressService {
  constructor() {
    this.STORAGE_KEY = 'gratuito_progress';
    this.MAX_MODULES = 3; // Usuários gratuitos têm acesso apenas aos 3 primeiros módulos
  }

  /**
   * Inicializa progresso para um usuário gratuito
   */
  initializeProgress(userId, gradeId) {
    const defaultProgress = {
      userId,
      gradeId,
      xp: 0,
      level: 1,
      maxXp: this.getMaxXpForLevel(1), // XP máximo para nível 1 (100)
      yuCoins: 0,
      streak: 0,
      hearts: 3,
      maxHearts: 3,
      completedLessons: [],
      currentModule: 1,
      byModule: {
        1: { completed: 0, total: 0 }, // Será calculado dinamicamente
        2: { completed: 0, total: 0 }, // Será calculado dinamicamente
        3: { completed: 0, total: 0 }  // Será calculado dinamicamente
      },
      achievements: [],
      avatar: { accessory: "none" },
      dailyGoal: 50,
      dailyProgress: 0,
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.saveProgress(defaultProgress);
    return defaultProgress;
  }

  /**
   * Obtém progresso do usuário
   */
  getProgress(userId) {
    try {
      const allProgress = this.getAllProgress();
      const progress = allProgress[userId] || null;
      
      // Corrigir maxXp se estiver incorreto (para progressos existentes)
      if (progress && progress.maxXp !== this.getMaxXpForLevel(progress.level)) {
        console.log('🔧 Corrigindo maxXp incorreto:', progress.maxXp, '->', this.getMaxXpForLevel(progress.level));
        progress.maxXp = this.getMaxXpForLevel(progress.level);
        this.saveProgress(progress);
      }
      
      return progress;
    } catch (error) {
      console.error('Erro ao obter progresso gratuito:', error);
      return null;
    }
  }

  /**
   * Salva progresso do usuário
   */
  saveProgress(progress) {
    try {
      const allProgress = this.getAllProgress();
      allProgress[progress.userId] = {
        ...progress,
        lastActivity: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allProgress));
    } catch (error) {
      console.error('Erro ao salvar progresso gratuito:', error);
    }
  }

  /**
   * Completa uma lição
   */
  completeLesson(userId, lessonData) {
    console.log('🎯 GratuitoProgressService: Completando lição:', { userId, lessonData });
    
    const progress = this.getProgress(userId);
    if (!progress) {
      console.error('❌ Progresso não encontrado para usuário:', userId);
      return null;
    }

    console.log('✅ Progresso encontrado:', progress);

    // Verificar se a lição já foi completada
    const alreadyCompleted = progress.completedLessons.find(
      lesson => lesson.lessonId === lessonData.lessonId
    );

    if (alreadyCompleted) {
      console.log('⚠️ Lição já completada:', lessonData.lessonId);
      return progress;
    }

    // Calcular recompensas (mesma lógica do fluxo normal)
    const xpEarned = 100; // XP fixo de 100 por lição (igual ao fluxo normal)
    const yuCoinsEarned = 10; // YuCoins fixos de 10 por lição (igual ao fluxo normal)
    const streakBonus = 0; // Sem bônus de streak para manter consistência

    // Atualizar progresso
    const updatedProgress = {
      ...progress,
      xp: progress.xp + xpEarned + streakBonus,
      yuCoins: progress.yuCoins + yuCoinsEarned,
      streak: progress.streak + 1,
      completedLessons: [
        ...progress.completedLessons,
        {
          lessonId: lessonData.lessonId,
          score: lessonData.score,
          timeSpent: lessonData.timeSpent,
          completedAt: new Date().toISOString(),
          xpEarned: xpEarned + streakBonus,
          yuCoinsEarned,
          module: lessonData.module || this.getModuleFromLessonId(lessonData.lessonId)
        }
      ],
      dailyProgress: progress.dailyProgress + xpEarned + streakBonus
    };

    // Atualizar contadores por módulo
    const module = lessonData.module || this.getModuleFromLessonId(lessonData.lessonId);
    console.log('🔍 DEBUG - Módulo determinado:', {
      lessonDataModule: lessonData.module,
      calculatedModule: module,
      lessonId: lessonData.lessonId
    });
    
    if (module && updatedProgress.byModule[module]) {
      updatedProgress.byModule[module].completed++;
      console.log('🔍 DEBUG - Módulo atualizado:', {
        module,
        completed: updatedProgress.byModule[module].completed,
        total: updatedProgress.byModule[module].total
      });
    } else {
      console.log('🔍 DEBUG - Módulo não encontrado ou inválido:', {
        module,
        availableModules: Object.keys(updatedProgress.byModule)
      });
    }

    // Recalcular progresso por módulo baseado nas lições completadas
    this.updateModuleProgress(updatedProgress);

    // Verificar conquistas e aplicar recompensas apenas das novas conquistas
    const newAchievements = this.checkAchievements(updatedProgress);
    const achievementRewards = this.calculateNewAchievementRewards(newAchievements);
    
    // Aplicar recompensas apenas se houver novas conquistas
    if (newAchievements.length > 0) {
      updatedProgress.xp += achievementRewards.xp;
      updatedProgress.yuCoins += achievementRewards.yuCoins;
      console.log(`🏆 Recompensas de conquistas aplicadas: +${achievementRewards.xp} XP, +${achievementRewards.yuCoins} YuCoins`);
    }

    // Recalcular nível após aplicar recompensas
    const newLevel = this.calculateLevel(updatedProgress.xp);
    if (newLevel > progress.level) {
      updatedProgress.level = newLevel;
      updatedProgress.maxXp = this.getMaxXpForLevel(newLevel);
    }

    this.saveProgress(updatedProgress);
    console.log('✅ GratuitoProgressService: Lição completada e salva:', updatedProgress);
    console.log('✅ GratuitoProgressService: Recompensas de conquistas aplicadas:', achievementRewards);
    return updatedProgress;
  }

  /**
   * Obtém estatísticas formatadas para o dashboard
   */
  getFormattedProgress(userId) {
    const progress = this.getProgress(userId);
    if (!progress) return null;

    return {
      grade: {
        id: progress.gradeId,
        name: progress.gradeId,
        modules: [
          { id: 1, name: 'Módulo 1', lessons: 3, completed: progress.byModule[1]?.completed || 0 },
          { id: 2, name: 'Módulo 2', lessons: 3, completed: progress.byModule[2]?.completed || 0 },
          { id: 3, name: 'Módulo 3', lessons: 3, completed: progress.byModule[3]?.completed || 0 }
        ]
      },
      progress: {
        xp: progress.xp,
        level: progress.level,
        maxXp: progress.maxXp,
        yuCoins: progress.yuCoins,
        streak: progress.streak,
        hearts: progress.hearts,
        maxHearts: progress.maxHearts,
        completedLessons: progress.completedLessons,
        currentModule: progress.currentModule,
        byModule: progress.byModule,
        hasContent: true
      },
      devMode: false,
      isGratuito: true,
      maxModules: this.MAX_MODULES
    };
  }

  /**
   * Obtém status de progressão (para usuários gratuitos sempre false)
   */
  getProgressionStatus(userId) {
    return {
      canProgress: false,
      isGratuito: true,
      maxModules: this.MAX_MODULES,
      message: 'Complete todas as lições para desbloquear mais conteúdo'
    };
  }

  /**
   * Atualiza módulo atual
   */
  updateCurrentModule(userId, moduleNum) {
    const progress = this.getProgress(userId);
    if (!progress) return null;

    // Usuários gratuitos só podem acessar módulos 1-3
    if (moduleNum > this.MAX_MODULES) {
      console.warn('Usuário gratuito tentou acessar módulo bloqueado:', moduleNum);
      return progress;
    }

    const updatedProgress = {
      ...progress,
      currentModule: moduleNum
    };

    this.saveProgress(updatedProgress);
    return updatedProgress;
  }

  /**
   * Obtém todos os progressos salvos
   */
  getAllProgress() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Erro ao obter progressos:', error);
      return {};
    }
  }

  /**
   * Limpa progresso de um usuário
   */
  clearProgress(userId) {
    try {
      const allProgress = this.getAllProgress();
      delete allProgress[userId];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allProgress));
      console.log('Progresso limpo para usuário:', userId);
    } catch (error) {
      console.error('Erro ao limpar progresso:', error);
    }
  }

  /**
   * Calcula nível baseado no XP (mesma fórmula do fluxo normal)
   */
  calculateLevel(xp) {
    return Math.floor(1 + Math.sqrt(xp / 100)); // Mesma fórmula do backend
  }

  /**
   * Obtém XP máximo para um nível (mesma fórmula do fluxo normal)
   */
  getMaxXpForLevel(level) {
    return Math.pow(level, 2) * 100; // Mesma fórmula do backend
  }

  /**
   * Obtém módulo baseado no ID da lição
   */
  getModuleFromLessonId(lessonId) {
    console.log('🔍 DEBUG - getModuleFromLessonId chamado com:', lessonId);
    
    // Converter lessonId para string para análise
    const lessonIdStr = lessonId.toString();
    
    // Se o ID contém informações de módulo, extrair
    if (lessonIdStr.includes('module') || lessonIdStr.includes('modulo')) {
      const match = lessonIdStr.match(/(?:module|modulo)[_-]?(\d+)/i);
      if (match) {
        const moduleNum = parseInt(match[1]);
        console.log('🔍 DEBUG - Módulo extraído do ID:', moduleNum);
        return Math.min(moduleNum, 3); // Limitar a 3 módulos para usuários gratuitos
      }
    }
    
    // Se o ID é um ObjectId do MongoDB, usar lógica baseada no hash
    if (lessonIdStr.length === 24) {
      // Usar o último caractere para determinar módulo (1-3 para usuários gratuitos)
      const lastChar = lessonIdStr.slice(-1);
      const moduleNum = (parseInt(lastChar, 16) % 3) + 1; // Módulos 1-3
      console.log('🔍 DEBUG - Módulo calculado do ObjectId:', moduleNum);
      return moduleNum;
    }
    
    // Fallback: usar posição no array (assumindo que lições vêm em ordem)
    // Para usuários gratuitos, limitar a módulos 1-3
    const lessonNum = parseInt(lessonIdStr.slice(-1)) || 1;
    const moduleNum = Math.ceil(lessonNum / 3);
    const finalModule = Math.min(moduleNum, 3); // Limitar a 3 módulos para usuários gratuitos
    console.log('🔍 DEBUG - Módulo calculado do fallback:', finalModule);
    return finalModule;
  }

  /**
   * Reseta o progresso da série atual para usuários gratuitos
   */
  resetProgress(userId, gradeId) {
    console.log('🔄 GratuitoProgressService: Resetando progresso para usuário:', userId, 'série:', gradeId);
    
    try {
      // Criar progresso resetado
      const resetProgress = {
        userId,
        gradeId,
        xp: 0,
        level: 1,
        maxXp: this.getMaxXpForLevel(1), // XP máximo para nível 1 (100)
        yuCoins: 0,
        streak: 0,
        hearts: 3,
        maxHearts: 3,
        completedLessons: [],
        currentModule: 1,
        byModule: {
          1: { completed: 0, total: 0 }, // Será calculado dinamicamente
          2: { completed: 0, total: 0 }, // Será calculado dinamicamente
          3: { completed: 0, total: 0 }  // Será calculado dinamicamente
        },
        achievements: [],
        avatar: { accessory: "none" },
        dailyGoal: 50,
        dailyProgress: 0,
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Salvar progresso resetado
      this.saveProgress(resetProgress);
      
      console.log('✅ GratuitoProgressService: Progresso resetado com sucesso:', resetProgress);
      return resetProgress;
    } catch (error) {
      console.error('❌ Erro ao resetar progresso gratuito:', error);
      return null;
    }
  }

  /**
   * Atualiza progresso por módulo baseado nas lições completadas
   */
  updateModuleProgress(progress) {
    // Resetar contadores
    Object.keys(progress.byModule).forEach(moduleKey => {
      progress.byModule[moduleKey].completed = 0;
    });

    // Contar lições completadas por módulo
    progress.completedLessons.forEach(lesson => {
      const module = lesson.module || this.getModuleFromLessonId(lesson.lessonId);
      if (module && progress.byModule[module]) {
        progress.byModule[module].completed++;
      }
    });

    console.log('🔍 DEBUG - Progresso por módulo atualizado:', progress.byModule);
  }

  /**
   * Calcula recompensas das conquistas
   */
  calculateAchievementRewards(progress) {
    let totalXp = 0;
    let totalYuCoins = 0;

    // Recompensas baseadas nas conquistas desbloqueadas
    progress.achievements.forEach(achievement => {
      if (achievement.id === 'first_lesson') {
        totalXp += 50;
        totalYuCoins += 25;
      } else if (achievement.id === 'streak_3') {
        totalXp += 100;
        totalYuCoins += 50;
      } else if (achievement.id.startsWith('module_') && achievement.id.endsWith('_complete')) {
        // Recompensas padronizadas para todas as conquistas de módulo
        totalXp += 250;
        totalYuCoins += 125;
        console.log(`🏆 Conquista de módulo: +250 XP, +125 YuCoins`);
      }
    });

    return { xp: totalXp, yuCoins: totalYuCoins };
  }

  /**
   * Calcula recompensas apenas das novas conquistas desbloqueadas
   */
  calculateNewAchievementRewards(newAchievements) {
    let totalXp = 0;
    let totalYuCoins = 0;

    newAchievements.forEach(achievement => {
      if (achievement.id.startsWith('module_') && achievement.id.endsWith('_complete')) {
        // Recompensas padronizadas para todas as conquistas de módulo
        totalXp += 250;
        totalYuCoins += 125;
      }
    });

    return { xp: totalXp, yuCoins: totalYuCoins };
  }

  /**
   * Verifica conquistas e retorna apenas as novas conquistas desbloqueadas
   */
  checkAchievements(progress) {
    const achievements = [...progress.achievements];
    const newAchievements = [];

    // Conquista: Primeira lição - REMOVIDA conforme solicitado
    // Apenas recompensas de lições (100 XP + 10 YuCoins) devem ser aplicadas

    // Conquista: Streak de 3 dias - REMOVIDA conforme solicitado
    // Apenas recompensas de lições (100 XP + 10 YuCoins) devem ser aplicadas

    // Conquista: Módulo completo
    Object.entries(progress.byModule).forEach(([moduleNum, moduleData]) => {
      // Verificar se módulo está completo (3 lições para usuários gratuitos)
      const isModuleComplete = moduleData.completed >= 3;
      const alreadyHasAchievement = achievements.find(a => a.id === `module_${moduleNum}_complete`);
      
      if (isModuleComplete && !alreadyHasAchievement) {
        const newAchievement = {
          id: `module_${moduleNum}_complete`,
          name: `Módulo ${moduleNum} Completo`,
          description: `Complete todas as lições do módulo ${moduleNum}!`,
          icon: '🏆',
          earnedAt: new Date().toISOString()
        };
        achievements.push(newAchievement);
        newAchievements.push(newAchievement);
        console.log(`🏆 Nova conquista desbloqueada: Módulo ${moduleNum} Completo`);
      }
    });

    progress.achievements = achievements;
    return newAchievements;
  }

  /**
   * Obtém estatísticas gerais
   */
  getStats(userId) {
    const progress = this.getProgress(userId);
    if (!progress) return null;

    const totalLessons = Object.values(progress.byModule).reduce((sum, module) => sum + module.total, 0);
    const completedLessons = Object.values(progress.byModule).reduce((sum, module) => sum + module.completed, 0);
    const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      totalLessons,
      completedLessons,
      completionPercentage,
      totalXp: progress.xp,
      totalYuCoins: progress.yuCoins,
      currentStreak: progress.streak,
      level: progress.level,
      achievements: progress.achievements.length
    };
  }
}

// Instância singleton
const gratuitoProgressService = new GratuitoProgressService();

export default gratuitoProgressService;
