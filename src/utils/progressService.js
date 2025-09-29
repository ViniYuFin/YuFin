import { storageService, STORAGE_KEYS } from './storageService';
import notificationService from './notificationService';

class ProgressService {
  constructor() {
    this.initializeProgress();
  }

  // Inicializar progresso do usuário
  initializeProgress() {
    const savedProgress = storageService.load(STORAGE_KEYS.PROGRESS);
    if (!savedProgress) {
      const defaultProgress = {
        totalXp: 0,
        currentLevel: 1,
        xpToNextLevel: 100,
        streak: 0,
        lastActivityDate: null,
        dailyGoal: 50,
        dailyProgress: 0,
        achievements: [],
        completedLessons: [],
        totalLessonsCompleted: 0,
        perfectLessons: 0,
        timeSpent: 0
      };
      storageService.save(STORAGE_KEYS.PROGRESS, defaultProgress);
    }
  }

  // Atualizar progresso após completar uma lição
  updateProgress(userId, lessonId, score, timeSpent, isPerfect = false) {
    const progress = storageService.load(STORAGE_KEYS.PROGRESS) || {};
    
    // Calcular XP baseado na pontuação
    const baseXp = 50;
    const bonusXp = Math.floor(score * 0.5);
    const totalXp = baseXp + bonusXp;
    
    // Atualizar XP total
    progress.totalXp = (progress.totalXp || 0) + totalXp;
    
    // Verificar se subiu de nível
    const newLevel = this.calculateLevel(progress.totalXp);
    const leveledUp = newLevel > (progress.currentLevel || 1);
    
    if (leveledUp) {
      progress.currentLevel = newLevel;
      progress.xpToNextLevel = this.calculateXpToNextLevel(newLevel);
      notificationService.success(`🎉 Parabéns! Você chegou ao nível ${newLevel}!`);
    } else {
      // Garantir que xpToNextLevel esteja correto mesmo sem subir de nível
      progress.xpToNextLevel = this.calculateXpToNextLevel(progress.currentLevel || 1);
    }
    
    // Atualizar streak
    progress.streak = this.updateStreak(progress.streak, progress.lastActivityDate);
    progress.lastActivityDate = new Date().toISOString();
    
    // Atualizar progresso diário
    progress.dailyProgress = (progress.dailyProgress || 0) + totalXp;
    
    // Verificar se atingiu meta diária
    if (progress.dailyProgress >= (progress.dailyGoal || 50)) {
      notificationService.success('🎯 Meta diária atingida! +10 YüCoins!');
    }
    
    // Atualizar lições completadas
    if (!progress.completedLessons) progress.completedLessons = [];
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
      progress.totalLessonsCompleted = (progress.totalLessonsCompleted || 0) + 1;
    }
    
    // Atualizar lições perfeitas
    if (isPerfect) {
      progress.perfectLessons = (progress.perfectLessons || 0) + 1;
    }
    
    // Atualizar tempo gasto
    progress.timeSpent = (progress.timeSpent || 0) + timeSpent;
    
    // Salvar progresso
    storageService.save(STORAGE_KEYS.PROGRESS, progress);
    
    return {
      totalXp: progress.totalXp,
      level: progress.currentLevel,
      xpToNextLevel: progress.xpToNextLevel,
      streak: progress.streak,
      dailyProgress: progress.dailyProgress,
      leveledUp,
      lessonXp: totalXp
    };
  }

  // Calcular nível baseado no XP total
  calculateLevel(totalXp) {
    // Garantir que o XP nunca seja negativo
    const safeXp = Math.max(0, totalXp || 0);
    // Fórmula: nível = 1 + raiz quadrada do XP total / 100
    return Math.floor(1 + Math.sqrt(safeXp / 100));
  }

  // Calcular XP necessário para o próximo nível
  calculateXpToNextLevel(level) {
    // Garantir que o nível seja pelo menos 1
    const safeLevel = Math.max(1, level || 1);
    const xpRequired = Math.pow(safeLevel, 2) * 100;
    console.log(`ProgressService - XP para nível ${safeLevel}: ${xpRequired}`);
    return xpRequired;
  }

  // Atualizar streak
  updateStreak(currentStreak, lastActivityDate) {
    if (!lastActivityDate) return 1;
    
    const lastDate = new Date(lastActivityDate);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Atividade consecutiva
      return (currentStreak || 0) + 1;
    } else if (diffDays === 0) {
      // Mesmo dia
      return currentStreak || 0;
    } else {
      // Quebrou o streak
      return 1;
    }
  }

  // Obter progresso atual
  getProgress() {
    const progress = storageService.load(STORAGE_KEYS.PROGRESS) || {};
    
    // Garantir que xpToNextLevel esteja correto
    if (progress.totalXp !== undefined && progress.currentLevel !== undefined) {
      const expectedXpToNextLevel = this.calculateXpToNextLevel(progress.currentLevel);
      if (progress.xpToNextLevel !== expectedXpToNextLevel) {
        progress.xpToNextLevel = expectedXpToNextLevel;
        storageService.save(STORAGE_KEYS.PROGRESS, progress);
      }
    }
    
    return progress;
  }

  // Definir meta diária
  setDailyGoal(goal) {
    const progress = this.getProgress();
    progress.dailyGoal = goal;
    storageService.save(STORAGE_KEYS.PROGRESS, progress);
  }

  // Resetar progresso diário (chamado à meia-noite)
  resetDailyProgress() {
    const progress = this.getProgress();
    progress.dailyProgress = 0;
    storageService.save(STORAGE_KEYS.PROGRESS, progress);
  }

  // Verificar conquistas
  checkAchievements() {
    const progress = this.getProgress();
    const achievements = progress.achievements || [];
    const newAchievements = [];

    // Conquista: Primeira lição
    if (progress.totalLessonsCompleted === 1 && !achievements.includes('first_lesson')) {
      newAchievements.push('first_lesson');
    }

    // Conquista: Streak de 7 dias
    if (progress.streak >= 7 && !achievements.includes('week_streak')) {
      newAchievements.push('week_streak');
    }

    // Conquista: Nível 5
    if (progress.currentLevel >= 5 && !achievements.includes('level_5')) {
      newAchievements.push('level_5');
    }

    // Conquista: 10 lições perfeitas
    if (progress.perfectLessons >= 10 && !achievements.includes('perfect_10')) {
      newAchievements.push('perfect_10');
    }

    // Adicionar novas conquistas
    if (newAchievements.length > 0) {
      progress.achievements = [...achievements, ...newAchievements];
      storageService.save(STORAGE_KEYS.PROGRESS, progress);
      
      newAchievements.forEach(achievement => {
        const achievementData = this.getAchievementData(achievement);
        notificationService.success(`🏆 ${achievementData.title}: ${achievementData.description}`);
      });
    }

    return newAchievements;
  }

  // Dados das conquistas
  getAchievementData(achievementId) {
    const achievements = {
      first_lesson: {
        title: 'Primeira Lição',
        description: 'Complete sua primeira lição',
        icon: '🎯',
        reward: { xp: 50, yuCoins: 10 }
      },
      week_streak: {
        title: 'Semana Consistente',
        description: 'Complete lições por 7 dias seguidos',
        icon: '🔥',
        reward: { xp: 200, yuCoins: 50 }
      },
      level_5: {
        title: 'Nível 5',
        description: 'Alcance o nível 5',
        icon: '⭐',
        reward: { xp: 100, yuCoins: 25 }
      },
      perfect_10: {
        title: 'Perfeição',
        description: 'Complete 10 lições com pontuação perfeita',
        icon: '💎',
        reward: { xp: 300, yuCoins: 75 }
      }
    };
    
    return achievements[achievementId] || {
      title: 'Conquista Desconhecida',
      description: 'Conquista não encontrada',
      icon: '❓',
      reward: { xp: 0, yuCoins: 0 }
    };
  }

  // Gerar relatório de progresso
  generateReport() {
    const progress = this.getProgress();
    return {
      level: progress.currentLevel,
      totalXp: progress.totalXp,
      xpToNextLevel: progress.xpToNextLevel,
      streak: progress.streak,
      totalLessonsCompleted: progress.totalLessonsCompleted,
      perfectLessons: progress.perfectLessons,
      achievements: progress.achievements || [],
      timeSpent: progress.timeSpent,
      dailyGoal: progress.dailyGoal,
      dailyProgress: progress.dailyProgress
    };
  }
}

export default new ProgressService(); 