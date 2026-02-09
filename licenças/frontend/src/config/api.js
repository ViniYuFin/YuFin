// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Flag para evitar múltiplas notificações de token expirado
let tokenExpiredHandled = false;

// Função para fazer logout quando token expira
const handleTokenExpired = () => {
  // Evitar múltiplas execuções simultâneas
  if (tokenExpiredHandled) return;
  tokenExpiredHandled = true;
  
  localStorage.removeItem('adminToken');
  // Disparar evento customizado para o App.jsx detectar
  window.dispatchEvent(new CustomEvent('tokenExpired'));
  
  // Resetar flag após um tempo para permitir nova verificação após login
  setTimeout(() => {
    tokenExpiredHandled = false;
  }, 1000);
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('adminToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  // Tratar token expirado (401 Unauthorized)
  if (response.status === 401) {
    handleTokenExpired();
    // Não lançar erro para evitar toast duplicado - o App.jsx já cuida da mensagem
    // Criar um erro especial que os componentes podem ignorar
    const error = new Error('TOKEN_EXPIRED');
    error.isTokenExpired = true;
    throw error;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro na requisição' }));
    throw new Error(error.error || 'Erro na requisição');
  }

  return response.json();
};

export default API_BASE_URL;

