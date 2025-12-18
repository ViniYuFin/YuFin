// Serviço para gerenciar conquistas e badges
class AchievementService {
  constructor() {
    this.achievements = [
      {
        id: 'first_lesson',
        title: 'Primeira Lição',
        description: 'Complete sua primeira lição',
        icon: '🎯',
        xpReward: 50,
        condition: (user) => user.progress?.completedLessons?.length >= 1
      },
      {
        id: 'streak_3',
        title: 'Consistente',
        description: 'Mantenha uma ofensiva de 3 dias',
        icon: '🔥',
        xpReward: 100,
        condition: (user) => user.progress?.streak >= 3
      },
      {
        id: 'streak_7',
        title: 'Dedicado',
        description: 'Mantenha uma ofensiva de 7 dias',
        icon: '🔥🔥',
        xpReward: 250,
        condition: (user) => user.progress?.streak >= 7
      },
      {
        id: 'streak_30',
        title: 'Viciado',
        description: 'Mantenha uma ofensiva de 30 dias',
        icon: '🔥🔥🔥',
        xpReward: 1000,
        condition: (user) => user.progress?.streak >= 30
      },
      {
        id: 'perfect_lesson',
        title: 'Perfeição',
        description: 'Complete uma lição com pontuação perfeita',
        icon: '⭐',
        xpReward: 100,
        condition: (user) => user.progress?.perfectLessons >= 1
      },
      {
        id: 'level_5',
        title: 'Aprendiz',
        description: 'Alcance o nível 5',
        icon: '📚',
        xpReward: 200,
        condition: (user) => user.progress?.level >= 5
      },
      {
        id: 'level_10',
        title: 'Estudioso',
        description: 'Alcance o nível 10',
        icon: '🎓',
        xpReward: 500,
        condition: (user) => user.progress?.level >= 10
      },
      {
        id: 'coins_100',
        title: 'Economista Júnior',
        description: 'Acumule 100 YüCoins',
        icon: '💰',
        xpReward: 150,
        condition: (user) => user.progress?.yuCoins >= 100
      },
      {
        id: 'coins_500',
        title: 'Economista Sênior',
        description: 'Acumule 500 YüCoins',
        icon: '🏦',
        xpReward: 300,
        condition: (user) => user.progress?.yuCoins >= 500
      },
      {
        id: 'lessons_10',
        title: 'Persistente',
        description: 'Complete 10 lições',
        icon: '📖',
        xpReward: 200,
        condition: (user) => user.progress?.completedLessons?.length >= 10
      },
      {
        id: 'lessons_25',
        title: 'Determinado',
        description: 'Complete 25 lições',
        icon: '📚',
        xpReward: 400,
        condition: (user) => user.progress?.completedLessons?.length >= 25
      },
      {
        id: 'daily_goal_week',
        title: 'Meta Semanal',
        description: 'Atinga sua meta diária por 7 dias seguidos',
        icon: '🎯',
        xpReward: 300,
        condition: (user) => user.progress?.dailyGoalStreak >= 7
      },
      // Conquistas de módulos
      {
        id: 'module_1_complete',
        title: '🏆 Mestre do Dinheiro',
        description: 'Complete todas as lições do módulo de introdução',
        icon: '💰',
        xpReward: 100,
        yuCoinsReward: 50,
        condition: (user) => {
          const module1Lessons = user.progress?.moduleProgress?.[1]?.completed || 0;
          const module1Total = user.progress?.moduleProgress?.[1]?.total || 3;
          return module1Lessons >= module1Total && module1Total > 0;
        }
      },
      {
        id: 'module_2_complete',
        title: '🧮 Calculadora Humana',
        description: 'Domine a matemática financeira básica',
        icon: '📊',
        xpReward: 150,
        yuCoinsReward: 75,
        condition: (user) => {
          const module2Lessons = user.progress?.moduleProgress?.[2]?.completed || 0;
          const module2Total = user.progress?.moduleProgress?.[2]?.total || 3;
          return module2Lessons >= module2Total && module2Total > 0;
        }
      },
      {
        id: 'module_3_complete',
        title: '💡 Consciência Total',
        description: 'Desenvolva consciência financeira completa',
        icon: '🎯',
        xpReward: 200,
        yuCoinsReward: 100,
        condition: (user) => {
          const module3Lessons = user.progress?.moduleProgress?.[3]?.completed || 0;
          const module3Total = user.progress?.moduleProgress?.[3]?.total || 3;
          return module3Lessons >= module3Total && module3Total > 0;
        }
      },
      {
        id: 'module_4_complete',
        title: '🚀 Projetista Financeiro',
        description: 'Execute projetos práticos com sucesso',
        icon: '🏆',
        xpReward: 300,
        yuCoinsReward: 150,
        condition: (user) => {
          const module4Lessons = user.progress?.moduleProgress?.[4]?.completed || 0;
          const module4Total = user.progress?.moduleProgress?.[4]?.total || 3;
          return module4Lessons >= module4Total && module4Total > 0;
        }
      }
    ];
  }

  // Verificar conquistas do usuário
  checkAchievements(user) {
    const unlockedAchievements = this.getUnlockedAchievements(user);
    const newAchievements = [];

    this.achievements.forEach(achievement => {
      if (achievement.condition(user) && !unlockedAchievements.includes(achievement.id)) {
        newAchievements.push(achievement);
      }
    });

    return newAchievements;
  }

  // Obter conquistas desbloqueadas
  getUnlockedAchievements(user) {
    return user.progress?.achievements || [];
  }

  // Desbloquear conquista
  unlockAchievement(user, achievementId) {
    const currentAchievements = user.progress?.achievements || [];
    if (!currentAchievements.includes(achievementId)) {
      const achievement = this.getAchievementById(achievementId);
      const updatedUser = {
        ...user,
        progress: {
          ...user.progress,
          achievements: [...currentAchievements, achievementId],
          // Adicionar XP da conquista
          xp: (user.progress?.xp || 0) + (achievement?.xpReward || 0),
          // Adicionar YuCoins da conquista (se houver)
          yuCoins: (user.progress?.yuCoins || 0) + (achievement?.yuCoinsReward || 0)
        }
      };
      return updatedUser;
    }
    return user;
  }

  // Processar recompensas de conquista
  processAchievementRewards(user, achievementId) {
    const achievement = this.getAchievementById(achievementId);
    if (!achievement) return { xp: 0, yuCoins: 0 };

    return {
      xp: achievement.xpReward || 0,
      yuCoins: achievement.yuCoinsReward || 0
    };
  }

  // Obter todas as conquistas
  getAllAchievements() {
    return this.achievements;
  }

  // Obter conquista por ID
  getAchievementById(id) {
    return this.achievements.find(achievement => achievement.id === id);
  }

  // Calcular progresso de conquistas
  getAchievementProgress(user) {
    const unlockedCount = this.getUnlockedAchievements(user).length;
    const totalCount = this.achievements.length;
    return {
      unlocked: unlockedCount,
      total: totalCount,
      percentage: Math.round((unlockedCount / totalCount) * 100)
    };
  }

  // Obter próximas conquistas disponíveis
  getNextAchievements(user) {
    const unlockedAchievements = this.getUnlockedAchievements(user);
    return this.achievements
      .filter(achievement => !unlockedAchievements.includes(achievement.id))
      .filter(achievement => achievement.condition(user))
      .slice(0, 3); // Retorna as 3 próximas conquistas
  }
}

const achievementService = new AchievementService();
export default achievementService; 