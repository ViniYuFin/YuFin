import { lessons } from './lessons';

class AIService {
  constructor() {
    this.userProfiles = new Map();
    this.learningPatterns = new Map();
    this.recommendationCache = new Map();
  }

  // Analisar perfil do usuário
  analyzeUserProfile(user, progress) {
    const profile = {
      learningStyle: this.determineLearningStyle(user, progress),
      difficultyPreference: this.calculateDifficultyPreference(user, progress),
      preferredLessonTypes: this.analyzePreferredLessonTypes(user, progress),
      optimalStudyTime: this.determineOptimalStudyTime(user, progress),
      motivationFactors: this.identifyMotivationFactors(user, progress),
      weakAreas: this.identifyWeakAreas(user, progress),
      strongAreas: this.identifyStrongAreas(user, progress)
    };

    this.userProfiles.set(user.id, profile);
    return profile;
  }

  // Determinar estilo de aprendizado
  determineLearningStyle(user, progress) {
    const lessonTypeStats = this.getLessonTypeStats(user, progress);
    
    // Análise baseada no desempenho por tipo de lição
    const scores = {
      visual: lessonTypeStats.dragAndDrop?.averageScore || 0,
      auditory: lessonTypeStats.quiz?.averageScore || 0,
      kinesthetic: lessonTypeStats.simulation?.averageScore || 0,
      reading: lessonTypeStats.input?.averageScore || 0
    };

    // Retornar o estilo com melhor desempenho
    return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  }

  // Calcular preferência de dificuldade
  calculateDifficultyPreference(user, progress) {
    const completedLessons = progress.completedLessons || [];
    const scores = completedLessons.map(lessonId => {
      const lesson = lessons.find(l => l.id === lessonId);
      return lesson?.userScore || 0;
    });

    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length || 0;
    
    if (averageScore >= 90) return 'challenging';
    if (averageScore >= 70) return 'moderate';
    return 'easy';
  }

  // Analisar tipos de lição preferidos
  analyzePreferredLessonTypes(user, progress) {
    const lessonTypeStats = this.getLessonTypeStats(user, progress);
    const preferences = [];

    Object.entries(lessonTypeStats).forEach(([type, stats]) => {
      if (stats.averageScore > 80 && stats.completionRate > 0.8) {
        preferences.push(type);
      }
    });

    return preferences;
  }

  // Determinar horário ideal de estudo
  determineOptimalStudyTime(user, progress) {
    // Análise baseada no histórico de atividade
    const activityHistory = progress.activityHistory || [];
    const timeSlots = activityHistory.map(activity => {
      const hour = new Date(activity.timestamp).getHours();
      return { hour, score: activity.score };
    });

    // Agrupar por hora do dia
    const hourlyPerformance = {};
    timeSlots.forEach(slot => {
      if (!hourlyPerformance[slot.hour]) {
        hourlyPerformance[slot.hour] = { totalScore: 0, count: 0 };
      }
      hourlyPerformance[slot.hour].totalScore += slot.score;
      hourlyPerformance[slot.hour].count += 1;
    });

    // Encontrar hora com melhor desempenho
    let bestHour = 9; // Padrão: manhã
    let bestAverage = 0;

    Object.entries(hourlyPerformance).forEach(([hour, data]) => {
      const average = data.totalScore / data.count;
      if (average > bestAverage) {
        bestAverage = average;
        bestHour = parseInt(hour);
      }
    });

    return bestHour;
  }

  // Identificar fatores de motivação
  identifyMotivationFactors(user, progress) {
    const factors = [];

    // Análise de streak
    if (progress.streak > 5) {
      factors.push('consistency');
    }

    // Análise de conquistas
    if (progress.achievements?.length > 3) {
      factors.push('achievements');
    }

    // Análise de progresso rápido
    if (progress.level > 3) {
      factors.push('progress');
    }

    // Análise de perfeição
    if (progress.perfectLessons > 5) {
      factors.push('perfection');
    }

    return factors;
  }

  // Identificar áreas fracas
  identifyWeakAreas(user, progress) {
    const weakAreas = [];
    const lessonTypeStats = this.getLessonTypeStats(user, progress);

    Object.entries(lessonTypeStats).forEach(([type, stats]) => {
      if (stats.averageScore < 70) {
        weakAreas.push({
          type,
          averageScore: stats.averageScore,
          recommendation: this.generateWeakAreaRecommendation(type)
        });
      }
    });

    return weakAreas;
  }

  // Identificar áreas fortes
  identifyStrongAreas(user, progress) {
    const strongAreas = [];
    const lessonTypeStats = this.getLessonTypeStats(user, progress);

    Object.entries(lessonTypeStats).forEach(([type, stats]) => {
      if (stats.averageScore > 90) {
        strongAreas.push({
          type,
          averageScore: stats.averageScore,
          recommendation: this.generateStrongAreaRecommendation(type)
        });
      }
    });

    return strongAreas;
  }

  // Gerar recomendações personalizadas
  generateRecommendations(user, progress) {
    const profile = this.analyzeUserProfile(user, progress);
    const recommendations = [];

    // Recomendação baseada em áreas fracas
    profile.weakAreas.forEach(weakArea => {
      recommendations.push({
        type: 'improvement',
        priority: 'high',
        title: `Melhorar em ${weakArea.type}`,
        description: weakArea.recommendation,
        action: `practice_${weakArea.type}`
      });
    });

    // Recomendação baseada no estilo de aprendizado
    recommendations.push({
      type: 'learning_style',
      priority: 'medium',
      title: `Aproveite seu estilo ${profile.learningStyle}`,
      description: this.getLearningStyleTip(profile.learningStyle),
      action: 'focus_learning_style'
    });

    // Recomendação baseada na dificuldade
    if (profile.difficultyPreference === 'challenging') {
      recommendations.push({
        type: 'challenge',
        priority: 'medium',
        title: 'Tente lições mais difíceis',
        description: 'Você está pronto para desafios maiores!',
        action: 'increase_difficulty'
      });
    }

    // Recomendação baseada no horário
    recommendations.push({
      type: 'timing',
      priority: 'low',
      title: 'Horário ideal de estudo',
      description: `Seu melhor horário é às ${profile.optimalStudyTime}h`,
      action: 'schedule_study_time'
    });

    return recommendations;
  }

  // Adaptar dificuldade dinamicamente
  adaptDifficulty(user, progress, lessonType) {
    const profile = this.userProfiles.get(user.id);
    if (!profile) return 'moderate';

    const recentPerformance = this.getRecentPerformance(user, progress, lessonType);
    
    if (recentPerformance.averageScore > 90) {
      return 'challenging';
    } else if (recentPerformance.averageScore < 60) {
      return 'easy';
    }
    
    return 'moderate';
  }

  // Gerar conteúdo personalizado
  generatePersonalizedContent(user, progress, lessonType) {
    const profile = this.userProfiles.get(user.id);
    if (!profile) return null;

    const personalization = {
      difficulty: this.adaptDifficulty(user, progress, lessonType),
      hints: this.generatePersonalizedHints(user, progress),
      encouragement: this.generateEncouragement(user, progress),
      nextSteps: this.suggestNextSteps(user, progress)
    };

    return personalization;
  }

  // Gerar dicas personalizadas
  generatePersonalizedHints(user, progress) {
    const weakAreas = this.identifyWeakAreas(user, progress);
    const hints = [];

    weakAreas.forEach(weakArea => {
      hints.push({
        type: weakArea.type,
        hint: this.getHintForWeakArea(weakArea.type),
        priority: 'high'
      });
    });

    return hints;
  }

  // Gerar encorajamento personalizado
  generateEncouragement(user, progress) {
    const factors = this.identifyMotivationFactors(user, progress);
    
    if (factors.includes('consistency')) {
      return "Você está mantendo uma rotina incrível! Continue assim! 🔥";
    } else if (factors.includes('achievements')) {
      return "Parabéns pelas suas conquistas! Você está se superando! 🏆";
    } else if (factors.includes('progress')) {
      return "Seu progresso é impressionante! Você está aprendendo muito! 📈";
    }
    
    return "Você está no caminho certo! Continue aprendendo! 💪";
  }

  // Sugerir próximos passos
  suggestNextSteps(user, progress) {
    const completedLessons = progress.completedLessons || [];
    const availableLessons = lessons.filter(lesson => 
      !completedLessons.includes(lesson.id)
    );

    // Priorizar lições que complementam áreas fracas
    const weakAreas = this.identifyWeakAreas(user, progress);
    const recommendedLessons = availableLessons.filter(lesson => 
      weakAreas.some(weakArea => lesson.type === weakArea.type)
    );

    return recommendedLessons.slice(0, 3);
  }

  // Métodos auxiliares
  getLessonTypeStats(user, progress) {
    const completedLessons = progress.completedLessons || [];
    const stats = {};

    completedLessons.forEach(lessonId => {
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson) {
        if (!stats[lesson.type]) {
          stats[lesson.type] = { scores: [], completed: 0 };
        }
        stats[lesson.type].scores.push(lesson.userScore || 0);
        stats[lesson.type].completed += 1;
      }
    });

    // Calcular médias
    Object.keys(stats).forEach(type => {
      const scores = stats[type].scores;
      stats[type].averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      stats[type].completionRate = stats[type].completed / completedLessons.length;
    });

    return stats;
  }

  getRecentPerformance(user, progress, lessonType) {
    const completedLessons = progress.completedLessons || [];
    const recentLessons = completedLessons.slice(-5); // Últimas 5 lições
    
    const typeScores = recentLessons
      .map(lessonId => lessons.find(l => l.id === lessonId))
      .filter(lesson => lesson && lesson.type === lessonType)
      .map(lesson => lesson.userScore || 0);

    return {
      averageScore: typeScores.reduce((a, b) => a + b, 0) / typeScores.length || 0,
      count: typeScores.length
    };
  }

  generateWeakAreaRecommendation(type) {
    const recommendations = {
      quiz: 'Pratique mais questões de múltipla escolha',
      'drag-and-drop': 'Tente organizar itens em ordem',
      classify: 'Exercite a categorização de conceitos',
      match: 'Pratique associações entre elementos',
      simulation: 'Experimente cenários práticos',
      input: 'Pratique respostas escritas'
    };
    return recommendations[type] || 'Continue praticando!';
  }

  generateStrongAreaRecommendation(type) {
    const recommendations = {
      quiz: 'Você é excelente em testes!',
      'drag-and-drop': 'Sua organização é perfeita!',
      classify: 'Você tem ótima capacidade de categorização!',
      match: 'Suas associações são precisas!',
      simulation: 'Você toma ótimas decisões!',
      input: 'Suas respostas são muito criativas!'
    };
    return recommendations[type] || 'Continue assim!';
  }

  getLearningStyleTip(style) {
    const tips = {
      visual: 'Tente visualizar os conceitos com imagens e diagramas',
      auditory: 'Leia em voz alta e discuta os conceitos',
      kinesthetic: 'Pratique com simulações e atividades práticas',
      reading: 'Foque em textos e explicações detalhadas'
    };
    return tips[style] || 'Continue explorando diferentes formas de aprender!';
  }

  getHintForWeakArea(type) {
    const hints = {
      quiz: 'Leia todas as opções antes de escolher',
      'drag-and-drop': 'Pense na ordem lógica dos itens',
      classify: 'Identifique as características principais de cada categoria',
      match: 'Procure por palavras-chave que se relacionam',
      simulation: 'Considere as consequências de cada escolha',
      input: 'Escreva suas ideias antes de responder'
    };
    return hints[type] || 'Tome seu tempo para pensar!';
  }
}

export default new AIService(); 