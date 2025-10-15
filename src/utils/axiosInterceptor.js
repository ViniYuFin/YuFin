/**
 * 🔄 AXIOS INTERCEPTOR - RENOVAÇÃO AUTOMÁTICA DE TOKENS
 * 
 * Intercepta todas as requests/responses do Axios para:
 * - Adicionar access token automaticamente
 * - Renovar token expirado automaticamente
 * - Fazer logout se refresh falhar
 */

import axios from 'axios';
import API_CONFIG from '../config/api';
import notificationService from './notificationService';

// Flag para evitar múltiplas renovações simultâneas
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Obter access token do localStorage
 */
const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

/**
 * Obter refresh token do localStorage
 */
const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

/**
 * Salvar novos tokens
 */
const saveTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

/**
 * Limpar tokens (logout)
 */
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('authToken'); // Limpar token antigo também
};

/**
 * Renovar access token usando refresh token
 */
const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}/token/refresh`,
      { refreshToken },
      {
        skipAuth: true // Flag especial para não adicionar token
      }
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    // Salvar novos tokens
    saveTokens(accessToken, newRefreshToken);

    return accessToken;
  } catch (error) {
    console.error('❌ Erro ao renovar token:', error);
    throw error;
  }
};

/**
 * 📤 REQUEST INTERCEPTOR
 * Adiciona access token em todas as requests
 */
axios.interceptors.request.use(
  (config) => {
    // Não adicionar token em requests específicas
    if (config.skipAuth) {
      return config;
    }

    // Adicionar access token se existir
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 📥 RESPONSE INTERCEPTOR
 * Renova token automaticamente se expirado
 */
axios.interceptors.response.use(
  // Success: retorna response normalmente
  (response) => {
    return response;
  },
  
  // Error: trata erros 401 (token expirado)
  async (error) => {
    const originalRequest = error.config;

    // Se não é erro 401 ou já tentou renovar, rejeita
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Se é request de login/registro, não tentar renovar
    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/token/refresh')
    ) {
      return Promise.reject(error);
    }

    // Se já está renovando, adicionar à fila
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }

    // Marcar request como já tentada e iniciar renovação
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Tentar renovar o token
      const newAccessToken = await refreshAccessToken();

      // Processar fila de requests que esperavam
      processQueue(null, newAccessToken);

      // Atualizar header da request original e tentar novamente
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axios(originalRequest);
    } catch (refreshError) {
    // Falhou ao renovar: fazer logout
    processQueue(refreshError, null);
    
    // Limpar tokens
    clearTokens();
    
    // Limpar storage
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    
    // Notificar usuário
    notificationService.error('Sessão expirada. Faça login novamente.');
    
    // Redirecionar para login
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
      
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * Verificar se token está próximo de expirar (< 5 minutos)
 * e renovar preventivamente
 */
export const checkTokenExpiration = async () => {
  const token = getAccessToken();
  
  if (!token) return;

  try {
    // Decodificar token (payload é a parte do meio)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Converter para ms
    const now = Date.now();
    const timeUntilExpiry = exp - now;

    // Se falta menos de 5 minutos, renovar
    if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
      await refreshAccessToken();
    }
  } catch (error) {
    console.error('Erro ao verificar expiração do token:', error);
  }
};

// Verificar expiração a cada 4 minutos
setInterval(checkTokenExpiration, 4 * 60 * 1000);

export default axios;
export { saveTokens, clearTokens, getAccessToken, getRefreshToken };

