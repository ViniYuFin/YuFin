// Configuração centralizada da API
import { getApiUrl } from './environment';

const API_CONFIG = {
  // URL base do backend (automática baseada no ambiente)
  BASE_URL: getApiUrl(),
  
  // URLs das rotas de autenticação
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh'
  },
  
  // URLs das rotas LGPD
  LGPD: {
    EXPORT_DATA: '/lgpd/export-data',
    DELETE_DATA: '/lgpd/delete-data'
  },
  
  // URLs das rotas de usuários
  USERS: {
    BASE: '/users',
    BY_ID: (id) => `/users/${id}`,
    COMPLETE_LESSON: (id) => `/users/${id}/complete-lesson`
  }
};

// Função para fazer requisições autenticadas
export const authenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
    ...options,
    headers
  });
  
  // Se o token expirou, redirecionar para login
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  
  return response;
};

export default API_CONFIG;
