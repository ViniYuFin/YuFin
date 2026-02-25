// Configuração de ambiente
const ENV = {
  API_URLS: {
    development: 'http://localhost:3001',
    production: 'https://yufin-backend.vercel.app'
  }
};

// Sempre reavalia na hora da chamada (Capacitor pode não estar injetado na carga do módulo)
const isCapacitor = () =>
  typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

// Em build de produção (NODE_ENV=production), mesmo com hostname localhost = app empacotado → usar API de produção
const looksLikePackagedApp = () =>
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const isDevelopment = () =>
  !isCapacitor() &&
  !looksLikePackagedApp() &&
  (process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

// Export para compatibilidade (valor atual no momento do acesso)
Object.defineProperty(ENV, 'isDevelopment', {
  get() {
    return isDevelopment();
  },
  enumerable: true
});

// Função para obter a URL da API (app nativo ou empacotado sempre usa produção)
export const getApiUrl = () => {
  if (isCapacitor() || looksLikePackagedApp()) return ENV.API_URLS.production;
  return isDevelopment()
    ? ENV.API_URLS.development
    : ENV.API_URLS.production;
};

// Log da configuração atual (avaliado na carga; no app nativo as requisições usam getApiUrl() na hora)
console.log(`🌍 Ambiente: ${ENV.isDevelopment ? 'DESENVOLVIMENTO' : 'PRODUÇÃO'}`);
console.log(`🔗 API URL: ${getApiUrl()}`);

export default ENV;
