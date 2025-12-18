// Serviço de Notificações Push Simuladas
import analyticsService from './analyticsService';
import notificationService from './notificationService';

class PushNotificationService {
  constructor() {
    this.notifications = [];
    this.isEnabled = this.checkPermission();
    this.scheduleNotifications();
  }

  // Verificar permissão (simulado)
  checkPermission() {
    return localStorage.getItem('yufinPushEnabled') !== 'false';
  }

  // Solicitar permissão
  requestPermission() {
    return new Promise((resolve) => {
      // Simular solicitação de permissão
      const userResponse = window.confirm(
        'O YuFin gostaria de enviar notificações para te lembrar de estudar e não perder seu streak!'
      );
      
      if (userResponse) {
        this.isEnabled = true;
        localStorage.setItem('yufinPushEnabled', 'true');
        notificationService.success('Notificações ativadas! 🎉');
        resolve(true);
      } else {
        this.isEnabled = false;
        localStorage.setItem('yufinPushEnabled', 'false');
        notificationService.info('Você pode ativar as notificações nas configurações.');
        resolve(false);
      }
    });
  }

  // Agendar notificações
  scheduleNotifications() {
    if (!this.isEnabled) return;

    // Notificação diária de streak
    this.scheduleDailyStreakReminder();
    
    // Notificação de meta diária
    this.scheduleDailyGoalReminder();
    
    // Notificação de novos desafios
    this.scheduleWeeklyChallenges();
    
    // Notificação de amigos
    this.scheduleFriendActivity();
  }

  // Lembrete de streak diário
  scheduleDailyStreakReminder() {
    const now = new Date();
    const lastStreakCheck = localStorage.getItem('yufinLastStreakCheck');
    
    if (!lastStreakCheck || this.isNewDay(lastStreakCheck)) {
      // Verificar se o usuário não fez lições hoje
      setTimeout(() => {
        this.showStreakReminder();
      }, 1000); // 1 segundo para demonstração
    }
  }

  // Lembrete de meta diária
  scheduleDailyGoalReminder() {
    const now = new Date();
    const lastGoalCheck = localStorage.getItem('yufinLastGoalCheck');
    
    if (!lastGoalCheck || this.isNewDay(lastGoalCheck)) {
      setTimeout(() => {
        this.showGoalReminder();
      }, 2000); // 2 segundos para demonstração
    }
  }

  // Desafios semanais
  scheduleWeeklyChallenges() {
    const lastChallengeCheck = localStorage.getItem('yufinLastChallengeCheck');
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    if (!lastChallengeCheck || new Date(lastChallengeCheck) < weekAgo) {
      setTimeout(() => {
        this.showWeeklyChallenge();
      }, 5000); // 5 segundos para demonstração
    }
  }

  // Atividade de amigos
  scheduleFriendActivity() {
    const lastFriendCheck = localStorage.getItem('yufinLastFriendCheck');
    
    if (!lastFriendCheck || this.isNewDay(lastFriendCheck)) {
      setTimeout(() => {
        this.showFriendActivity();
      }, 8000); // 8 segundos para demonstração
    }
  }

  // Verificar se é um novo dia
  isNewDay(lastCheck) {
    const last = new Date(lastCheck);
    const now = new Date();
    return last.getDate() !== now.getDate() || 
           last.getMonth() !== now.getMonth() || 
           last.getFullYear() !== now.getFullYear();
  }

  // Mostrar notificação de streak
  showStreakReminder() {
    if (!this.isEnabled) return;
    
    const user = JSON.parse(localStorage.getItem('yufinUser') || '{}');
    const streak = user.progress?.streak || 0;
    
    if (streak > 0) {
      const message = streak >= 7 
        ? `🔥 Incrível! Mantenha seu streak de ${streak} dias! Complete uma lição hoje!`
        : `🔥 Não quebre seu streak de ${streak} dias! Complete uma lição hoje!`;
      
      this.showNotification('Streak em Risco!', message, 'streak');
    } else {
      this.showNotification('Comece seu Streak!', 'Complete uma lição hoje para começar seu streak! 🔥', 'streak');
    }
  }

  // Mostrar notificação de meta
  showGoalReminder() {
    if (!this.isEnabled) return;
    
    const user = JSON.parse(localStorage.getItem('yufinUser') || '{}');
    const dailyProgress = user.progress?.dailyProgress || 0;
    const dailyGoal = user.progress?.dailyGoal || 50;
    
    if (dailyProgress < dailyGoal) {
      const remaining = dailyGoal - dailyProgress;
      this.showNotification(
        'Meta Diária', 
        `Faltam ${remaining} XP para atingir sua meta diária! 🎯`, 
        'goal'
      );
    }
  }

  // Mostrar desafio semanal
  showWeeklyChallenge() {
    if (!this.isEnabled) return;
    
    const challenges = [
      'Complete 5 lições esta semana e ganhe 50 YüCoins! 🏆',
      'Mantenha um streak de 7 dias e desbloqueie uma conquista especial! 🔥',
      'Alcance 80% de pontuação média e ganhe um power-up! ⭐',
      'Complete 3 lições perfeitas e ganhe um item raro! 💎'
    ];
    
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    this.showNotification('Desafio Semanal!', randomChallenge, 'challenge');
    
    localStorage.setItem('yufinLastChallengeCheck', new Date().toISOString());
  }

  // Mostrar atividade de amigos
  showFriendActivity() {
    if (!this.isEnabled) return;
    
    const activities = [
      'João completou uma lição! Que tal competir? 👥',
      'Maria subiu de nível! Parabéns para ela! 🎉',
      'Pedro desbloqueou uma conquista! Você consegue também? 🏆',
      'Ana enviou um presente para você! 💝'
    ];
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    this.showNotification('Atividade de Amigos', randomActivity, 'friends');
    
    localStorage.setItem('yufinLastFriendCheck', new Date().toISOString());
  }

  // Mostrar notificação
  showNotification(title, message, type) {
    // Verificar se o navegador suporta notificações
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: type,
        requireInteraction: false
      });
    } else {
      // Fallback para notificação in-app
      notificationService.info(message);
    }
    
    // Rastrear evento
    analyticsService.trackEvent('push_notification_shown', {
      title,
      message,
      type
    });
  }

  // Notificação personalizada baseada no comportamento
  showPersonalizedNotification(user) {
    if (!this.isEnabled) return;
    
    const lastLogin = user.lastLogin || new Date(0);
    const daysSinceLogin = Math.floor((Date.now() - new Date(lastLogin)) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLogin >= 3) {
      this.showNotification(
        'Sentimos sua falta!', 
        'Você não está perdendo seu streak? Complete uma lição hoje! 🐷', 
        'comeback'
      );
    } else if (daysSinceLogin >= 1) {
      this.showNotification(
        'Bom dia!', 
        'Que tal começar o dia com uma lição de educação financeira? 📚', 
        'daily'
      );
    }
  }

  // Notificação de conquista
  showAchievementNotification(achievement) {
    if (!this.isEnabled) return;
    
    this.showNotification(
      'Nova Conquista! 🏆',
      `${achievement.title}: ${achievement.description}`,
      'achievement'
    );
  }

  // Notificação de nível
  showLevelUpNotification(newLevel) {
    if (!this.isEnabled) return;
    
    this.showNotification(
      'Subiu de Nível! 🎉',
      `Parabéns! Você chegou ao nível ${newLevel}! Continue assim!`,
      'levelup'
    );
  }

  // Notificação de presente recebido
  showGiftNotification(friendName, giftType) {
    if (!this.isEnabled) return;
    
    const giftMessages = {
      'yuCoins': 'enviou 10 YüCoins para você! 💰',
      'boost': 'enviou um boost de XP! ⚡',
      'special': 'enviou um presente especial! 🎁'
    };
    
    this.showNotification(
      'Presente Recebido! 🎁',
      `${friendName} ${giftMessages[giftType] || 'enviou um presente!'}`,
      'gift'
    );
  }

  // Desativar notificações
  disable() {
    this.isEnabled = false;
    localStorage.setItem('yufinPushEnabled', 'false');
    notificationService.info('Notificações desativadas.');
  }

  // Ativar notificações
  enable() {
    this.isEnabled = true;
    localStorage.setItem('yufinPushEnabled', 'true');
    notificationService.success('Notificações ativadas! 🎉');
  }

  // Verificar status
  getStatus() {
    return {
      enabled: this.isEnabled,
      permission: this.checkPermission()
    };
  }
}

// Criar instância global
const pushNotificationService = new PushNotificationService();

export default pushNotificationService; 