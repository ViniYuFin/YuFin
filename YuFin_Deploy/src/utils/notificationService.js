// src/utils/notificationService.js
class NotificationService {
  constructor() {
    this.notifications = [];
    this.nextId = 1;
    this.container = null;
    this.init();
  }

  init() {
    // Criar container de notificações se não existir
    if (!document.getElementById('notification-container')) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-sm';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('notification-container');
    }
  }

  show(message, type = 'info', duration = 4000) {
    const id = this.nextId++;
    const notification = {
      id,
      message,
      type,
      timestamp: Date.now()
    };

    this.notifications.push(notification);
    this.renderNotification(notification);

    // Auto-remover após duração
    setTimeout(() => {
      this.remove(id);
    }, duration);

    return id;
  }

  renderNotification(notification) {
    const element = document.createElement('div');
    element.id = `notification-${notification.id}`;
    element.className = `notification-item transform transition-all duration-300 ease-out opacity-0 translate-x-full`;
    
    const typeStyles = {
      success: 'bg-green-500 text-white border-2 border-green-600',
      error: 'bg-red-500 text-white border-2 border-red-600',
      warning: 'bg-yellow-500 text-black border-2 border-yellow-600',
      info: 'bg-blue-500 text-white border-2 border-blue-600',
      achievement: 'bg-purple-500 text-white border-2 border-purple-600 animate-pulse'
    };

    // Definir cores inline para garantir visibilidade
    const inlineStyles = {
      success: 'background-color: #10b981 !important; color: white !important; border: 2px solid #059669 !important;',
      error: 'background-color: #ef4444 !important; color: white !important; border: 2px solid #dc2626 !important;',
      warning: 'background-color: #eab308 !important; color: black !important; border: 2px solid #ca8a04 !important;',
      info: 'background-color: #3b82f6 !important; color: white !important; border: 2px solid #2563eb !important;',
      achievement: 'background-color: #8b5cf6 !important; color: white !important; border: 2px solid #7c3aed !important;'
    };

    element.innerHTML = `
      <div class="rounded-lg shadow-lg p-4 flex items-center justify-between" style="${inlineStyles[notification.type]}">
        <div class="flex items-center space-x-3">
          <span class="text-xl">${this.getIcon(notification.type)}</span>
          <p class="font-medium">${notification.message}</p>
        </div>
        <button onclick="window.notificationService.remove(${notification.id})" class="text-white hover:text-gray-200 ml-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    this.container.appendChild(element);
    
    // Animar entrada
    setTimeout(() => {
      element.classList.remove('opacity-0', 'translate-x-full');
    }, 10);
  }

  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      achievement: '🏆'
    };
    return icons[type] || icons.info;
  }

  remove(id) {
    const element = document.getElementById(`notification-${id}`);
    if (element) {
      element.classList.add('opacity-0', 'translate-x-full');
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }, 300);
    }
    
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  // Métodos de conveniência
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }

  achievement(message, duration) {
    return this.show(message, 'achievement', duration || 6000);
  }

  // Limpar todas as notificações
  clear() {
    this.notifications.forEach(notification => {
      this.remove(notification.id);
    });
  }

  // Notificação de conquista especial
  showAchievement(achievement) {
    const message = `🏆 ${achievement.title}: ${achievement.description}`;
    return this.achievement(message, 8000);
  }

  // Notificação de nível
  showLevelUp(newLevel) {
    const message = `🎉 Parabéns! Você chegou ao nível ${newLevel}!`;
    return this.achievement(message, 6000);
  }

  // Notificação de streak
  showStreak(streak) {
    const message = `🔥 Incrível! Streak de ${streak} dias!`;
    return this.success(message, 5000);
  }
}

// Criar instância global
const notificationService = new NotificationService();

// Tornar disponível globalmente para uso em outros arquivos
window.notificationService = notificationService;

export default notificationService; 