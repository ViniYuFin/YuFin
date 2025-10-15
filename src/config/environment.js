// Configuração de ambiente
const ENV = {
  // Detectar se está em desenvolvimento
  isDevelopment: process.env.NODE_ENV === 'development' || 
                 window.location.hostname === 'localhost' ||
                 window.location.hostname === '127.0.0.1',
  
  // URLs base por ambiente
  API_URLS: {
    development: 'http://localhost:3001',
    production: 'https://yufin-backend.vercel.app'
  }
};

// Função para obter a URL da API baseada no ambiente
export const getApiUrl = () => {
  return ENV.isDevelopment 
    ? ENV.API_URLS.development 
    : ENV.API_URLS.production;
};

// Log da configuração atual
console.log(`🌍 Ambiente: ${ENV.isDevelopment ? 'DESENVOLVIMENTO' : 'PRODUÇÃO'}`);
console.log(`🔗 API URL: ${getApiUrl()}`);

export default ENV;
