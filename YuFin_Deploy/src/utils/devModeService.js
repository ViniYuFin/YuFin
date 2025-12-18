/**
 * Serviço para gerenciar o Modo Dev
 * Permite acesso livre a todas as lições e séries para desenvolvimento/teste
 */

const DEV_MODE_KEY = 'yufin_dev_mode_enabled';

class DevModeService {
  constructor() {
    this.isEnabled = this.isDevModeEnabled();
  }

  /**
   * Verifica se o usuário é um administrador/desenvolvedor
   */
  checkAdminStatus(user) {
    if (!user) return false;
    
    // Lista de emails autorizados para Modo Dev
    const adminEmails = [
      'admin@yufin.com',
      'dev@yufin.com',
      'test@yufin.com'
    ];
    
    return adminEmails.includes(user.email?.toLowerCase());
  }

  /**
   * Ativa o Modo Dev
   */
  enableDevMode(user) {
    if (!this.checkAdminStatus(user)) {
      console.warn('🔒 Acesso negado ao Modo Dev - usuário não autorizado');
      return false;
    }

    localStorage.setItem(DEV_MODE_KEY, 'true');
    this.isEnabled = true;
    
    console.log('🔧 Modo Dev ATIVADO para:', user.email);
    this.logAction('DEV_MODE_ENABLED', { userId: user.id, email: user.email }, user);
    
    return true;
  }

  /**
   * Desativa o Modo Dev
   */
  disableDevMode(user) {
    localStorage.setItem(DEV_MODE_KEY, 'false');
    this.isEnabled = false;
    
    console.log('🔧 Modo Dev DESATIVADO para:', user.email);
    this.logAction('DEV_MODE_DISABLED', { userId: user.id, email: user.email }, user);
    
    return true;
  }

  /**
   * Alterna o estado do Modo Dev
   */
  toggleDevMode(user) {
    if (!this.checkAdminStatus(user)) {
      console.warn('🔒 Acesso negado ao Modo Dev - usuário não autorizado');
      return false;
    }

    if (this.isEnabled) {
      return this.disableDevMode(user);
    } else {
      return this.enableDevMode(user);
    }
  }

  /**
   * Verifica se o Modo Dev está ativo
   */
  isDevModeEnabled() {
    const stored = localStorage.getItem(DEV_MODE_KEY);
    const enabled = stored === 'true';
    this.isEnabled = enabled;
    return enabled;
  }

  /**
   * Registra ações do Modo Dev para auditoria
   */
  logAction(action, data, user) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId: user?.id,
      userEmail: user?.email,
      data,
      devMode: true
    };

    console.log('🔧 [DEV MODE LOG]', logEntry);
    
    // Armazenar logs localmente para debug
    const logs = JSON.parse(localStorage.getItem('yufin_dev_logs') || '[]');
    logs.push(logEntry);
    
    // Manter apenas os últimos 50 logs
    if (logs.length > 50) {
      logs.splice(0, logs.length - 50);
    }
    
    localStorage.setItem('yufin_dev_logs', JSON.stringify(logs));
  }

  /**
   * Limpa todos os logs do Modo Dev
   */
  clearLogs() {
    localStorage.removeItem('yufin_dev_logs');
    console.log('🔧 Logs do Modo Dev limpos');
  }

  /**
   * Obtém os logs do Modo Dev
   */
  getLogs() {
    return JSON.parse(localStorage.getItem('yufin_dev_logs') || '[]');
  }

  /**
   * Reseta completamente o Modo Dev
   */
  reset() {
    localStorage.removeItem(DEV_MODE_KEY);
    this.clearLogs();
    this.isEnabled = false;
    console.log('🔧 Modo Dev resetado completamente');
  }
}

// Exportar instância singleton
const devModeService = new DevModeService();
export default devModeService;

