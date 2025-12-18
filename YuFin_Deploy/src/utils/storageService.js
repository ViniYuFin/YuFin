// src/utils/storageService.js
export const storageService = {
  // Salvar dados com tratamento de erro
  save: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Carregar dados com tratamento de erro
  load: (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      return null;
    }
  },
  
  // Remover dados
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      console.error('Erro ao remover dados:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Limpar todos os dados
  clear: () => {
    try {
      localStorage.clear();
      return { success: true };
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Verificar se há dados salvos
  hasData: (key) => {
    return localStorage.getItem(key) !== null;
  }
};

// Chaves específicas para o YuFin
export const STORAGE_KEYS = {
  USER: 'yufinUser',
  SESSION: 'yufinSession',
  PROGRESS: 'yufinProgress',
  SETTINGS: 'yufinSettings',
  ACHIEVEMENTS: 'yufinAchievements',
  STREAK: 'yufinStreak',
  DAILY_GOALS: 'yufinDailyGoals',
  ANALYTICS: 'yufinAnalytics',
  CACHE: 'yufinCache',
  PREFERENCES: 'yufinPreferences',
  CURRENT_MODULE: 'yufinCurrentModule'
}; 