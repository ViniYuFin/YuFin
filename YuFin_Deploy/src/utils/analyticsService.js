// Serviço de Analytics para rastrear progresso e comportamento
import { storageService, STORAGE_KEYS } from './storageService';

class AnalyticsService {
  constructor() {
    this.events = [];
    this.sessionStart = Date.now();
    this.initializeAnalytics();
  }

  initializeAnalytics() {
    // Carregar eventos salvos
    const savedEvents = storageService.load(STORAGE_KEYS.ANALYTICS) || [];
    this.events = savedEvents;
    
    // Registrar início da sessão
    this.trackEvent('session_start', {
      timestamp: this.sessionStart,
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`
    });
  }

  // Rastrear evento
  trackEvent(eventName, properties = {}) {
    const event = {
      id: Date.now() + Math.random(),
      event: eventName,
      timestamp: Date.now(),
      sessionDuration: Date.now() - this.sessionStart,
      ...properties
    };

    this.events.push(event);
    this.saveEvents();
    
    // Log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event);
    }
  }

  // Eventos específicos do YuFin
  trackLessonStart(lessonId, lessonType) {
    this.trackEvent('lesson_start', {
      lessonId,
      lessonType,
      userProgress: this.getUserProgress()
    });
  }

  trackLessonComplete(lessonId, score, timeSpent, isPerfect) {
    this.trackEvent('lesson_complete', {
      lessonId,
      score,
      timeSpent,
      isPerfect,
      userProgress: this.getUserProgress()
    });
  }

  trackLevelUp(newLevel, totalXp) {
    this.trackEvent('level_up', {
      newLevel,
      totalXp,
      userProgress: this.getUserProgress()
    });
  }

  trackAchievementUnlock(achievementId, achievementName) {
    this.trackEvent('achievement_unlock', {
      achievementId,
      achievementName,
      userProgress: this.getUserProgress()
    });
  }

  trackStreakUpdate(streak) {
    this.trackEvent('streak_update', {
      streak,
      userProgress: this.getUserProgress()
    });
  }

  trackStorePurchase(itemId, itemName, cost) {
    this.trackEvent('store_purchase', {
      itemId,
      itemName,
      cost,
      userProgress: this.getUserProgress()
    });
  }

  trackNavigation(screenName) {
    this.trackEvent('navigation', {
      screenName,
      userProgress: this.getUserProgress()
    });
  }

  trackError(errorType, errorMessage) {
    this.trackEvent('error', {
      errorType,
      errorMessage,
      userProgress: this.getUserProgress()
    });
  }

  // Obter progresso atual do usuário
  getUserProgress() {
    const user = storageService.load(STORAGE_KEYS.USER);
    const progress = storageService.load(STORAGE_KEYS.PROGRESS);
    
    return {
      userId: user?.id,
      userRole: user?.role,
      level: progress?.currentLevel || user?.progress?.level || 1,
      totalXp: progress?.totalXp || user?.progress?.xp || 0,
      yuCoins: user?.progress?.yuCoins || 0,
      streak: progress?.streak || user?.progress?.streak || 0,
      completedLessons: user?.progress?.completedLessons?.length || 0,
      perfectLessons: progress?.perfectLessons || 0
    };
  }

  // Salvar eventos
  saveEvents() {
    // Manter apenas os últimos 1000 eventos para evitar sobrecarga
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    
    storageService.save(STORAGE_KEYS.ANALYTICS, this.events);
  }

  // Gerar relatórios
  generateReport(timeRange = '7d') {
    const now = Date.now();
    const timeRanges = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };

    const cutoffTime = now - (timeRanges[timeRange] || timeRanges['7d']);
    const filteredEvents = this.events.filter(event => event.timestamp >= cutoffTime);

    return {
      timeRange,
      totalEvents: filteredEvents.length,
      sessionDuration: now - this.sessionStart,
      eventsByType: this.groupEventsByType(filteredEvents),
      userEngagement: this.calculateEngagement(filteredEvents),
      performance: this.calculatePerformance(filteredEvents),
      errors: this.getErrors(filteredEvents)
    };
  }

  // Agrupar eventos por tipo
  groupEventsByType(events) {
    return events.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {});
  }

  // Calcular engajamento
  calculateEngagement(events) {
    const lessonEvents = events.filter(e => e.event === 'lesson_complete');
    const totalLessons = lessonEvents.length;
    const perfectLessons = lessonEvents.filter(e => e.isPerfect).length;
    const averageScore = lessonEvents.length > 0 
      ? lessonEvents.reduce((sum, e) => sum + e.score, 0) / lessonEvents.length 
      : 0;

    return {
      totalLessons,
      perfectLessons,
      perfectRate: totalLessons > 0 ? (perfectLessons / totalLessons) * 100 : 0,
      averageScore: Math.round(averageScore),
      averageTimePerLesson: lessonEvents.length > 0 
        ? lessonEvents.reduce((sum, e) => sum + e.timeSpent, 0) / lessonEvents.length 
        : 0
    };
  }

  // Calcular performance
  calculatePerformance(events) {
    const levelUps = events.filter(e => e.event === 'level_up').length;
    const achievements = events.filter(e => e.event === 'achievement_unlock').length;
    const storePurchases = events.filter(e => e.event === 'store_purchase').length;

    return {
      levelUps,
      achievements,
      storePurchases,
      totalSpent: storePurchases > 0 
        ? events.filter(e => e.event === 'store_purchase')
            .reduce((sum, e) => sum + e.cost, 0) 
        : 0
    };
  }

  // Obter erros
  getErrors(events) {
    return events.filter(e => e.event === 'error');
  }

  // Exportar dados para análise
  exportData() {
    return {
      events: this.events,
      sessionStart: this.sessionStart,
      userProgress: this.getUserProgress(),
      report: this.generateReport('all')
    };
  }

  // Limpar dados antigos (mais de 30 dias)
  cleanupOldData() {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(event => event.timestamp >= thirtyDaysAgo);
    this.saveEvents();
  }
}

// Criar instância global
const analyticsService = new AnalyticsService();

// Limpar dados antigos periodicamente
setInterval(() => {
  analyticsService.cleanupOldData();
}, 24 * 60 * 60 * 1000); // Uma vez por dia

export default analyticsService; 