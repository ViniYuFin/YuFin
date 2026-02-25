import { getApiUrl } from '../config/environment';

// ============================================
// 🔄 SISTEMA DE RENOVAÇÃO DE TOKEN CENTRALIZADO
// ============================================

// Flag para evitar múltiplas renovações simultâneas
let isRefreshing = false;
let refreshQueue = [];

/**
 * Processa a fila de requisições que aguardavam renovação
 */
const processRefreshQueue = (error, newToken = null) => {
  refreshQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(newToken);
    }
  });
  refreshQueue = [];
};

/**
 * Renova o token usando refresh token
 * Retorna o novo access token ou null se falhar
 */
const refreshToken = async () => {
  const refreshTokenValue = localStorage.getItem('refreshToken');
  
  if (!refreshTokenValue) {
    return null;
  }

  try {
    const refreshRes = await fetch(`${getApiUrl()}/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshTokenValue })
    });

    if (!refreshRes.ok) {
      const errorData = await refreshRes.json().catch(() => ({}));
      console.error('❌ Erro ao renovar token:', errorData);
      return null;
    }

    const data = await refreshRes.json();
    const newAccessToken = data.accessToken || data.token;
    const newRefreshToken = data.refreshToken;

    if (newAccessToken && newRefreshToken) {
      // Sincronizar ambos os sistemas de token
      localStorage.setItem('authToken', newAccessToken);
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      console.log('✅ Token renovado com sucesso');
      return newAccessToken;
    }

    return null;
  } catch (error) {
    console.error('❌ Erro ao renovar token:', error);
    return null;
  }
};

/**
 * Trata erro 401 (token expirado) com renovação automática
 * Retorna o novo token se renovação for bem-sucedida, null caso contrário
 */
const handleTokenExpiration = async () => {
  // Se já está renovando, adicionar à fila
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  // Iniciar renovação
  isRefreshing = true;

  try {
    const newToken = await refreshToken();

    if (newToken) {
      // Processar fila de requisições que aguardavam
      processRefreshQueue(null, newToken);
      return newToken;
    } else {
      // Falhou ao renovar: limpar tokens e redirecionar
      processRefreshQueue(new Error('Não foi possível renovar token'), null);
      
      console.log('❌ Não foi possível renovar token, redirecionando para login...');
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('session');
      
      // Redirecionar para login após um pequeno delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      
      return null;
    }
  } finally {
    isRefreshing = false;
  }
};

/**
 * Executa uma requisição com retry automático em caso de token expirado
 */
const executeRequestWithRetry = async (url, options, retryCount = 0) => {
  const res = await fetch(url, options);

  // Se não é erro 401, retornar resposta normalmente
  if (res.ok || res.status !== 401) {
    return res;
  }

  // Verificar se é erro de token expirado
  const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
  
  if (res.status === 401 && (errorData.code === 'EXPIRED_TOKEN' || errorData.code === 'INVALID_TOKEN' || errorData.code === 'NO_TOKEN')) {
    // Evitar loop infinito
    if (retryCount > 0) {
      throw new Error(errorData.error || 'Token expirado');
    }

    console.log('🔄 Token expirado, tentando renovar...');
    
    const newToken = await handleTokenExpiration();
    
    if (newToken) {
      // Atualizar header com novo token e tentar novamente
      options.headers.Authorization = `Bearer ${newToken}`;
      return executeRequestWithRetry(url, options, retryCount + 1);
    } else {
      // Não conseguiu renovar, lançar erro
      throw new Error(errorData.error || 'Token expirado');
    }
  }

  // Outro tipo de erro 401 ou erro diferente
  return res;
};

// ============================================
// 📡 FUNÇÕES DE API
// ============================================

export async function apiGet(path) {
  const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await executeRequestWithRetry(`${getApiUrl()}${path}`, { headers });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    
    // Tratamento especial para erro 429 (Rate Limit)
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') || '15';
      throw new Error(`Limite de requisições da API atingido. Tente novamente em ${retryAfter} segundos.`);
    }
    
    throw new Error(errorData.error || `Erro ${res.status}: ${res.statusText}`);
  }
  
  return res.json();
}

export async function apiPost(path, body) {
  console.log('🌐 [API DEBUG] Fazendo POST para:', `${getApiUrl()}${path}`);
  console.log('🌐 [API DEBUG] Body:', body);
  
  const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await executeRequestWithRetry(`${getApiUrl()}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  
  console.log('🌐 [API DEBUG] Status da resposta:', res.status);
  console.log('🌐 [API DEBUG] Resposta OK?', res.ok);
  
  if (!res.ok) {
    console.log('❌ [API DEBUG] Erro na resposta, tentando parsear JSON...');
    const errorData = await res.json().catch((parseError) => {
      console.log('❌ [API DEBUG] Erro ao parsear JSON do erro:', parseError);
      return { error: 'Erro desconhecido', status: res.status, statusText: res.statusText };
    });
    console.log('❌ [API DEBUG] Dados do erro:', errorData);
    
    // Tratamento especial para erro 429 (Rate Limit)
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') || '15';
      const error = new Error(`Limite de requisições da API atingido. Tente novamente em ${retryAfter} segundos.`);
      error.status = 429;
      error.statusText = 'Too Many Requests';
      error.data = errorData;
      throw error;
    }
    
    const error = new Error(errorData.error || `Erro ${res.status}: ${res.statusText}`);
    error.status = res.status;
    error.statusText = res.statusText;
    error.data = errorData;
    throw error;
  }
  
  console.log('✅ [API DEBUG] Resposta OK, parseando JSON...');
  const result = await res.json();
  console.log('✅ [API DEBUG] Resultado parseado:', result);
  return result;
}

export async function apiPatch(path, body) {
  const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await executeRequestWithRetry(`${getApiUrl()}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    
    // Tratamento especial para erro 429 (Rate Limit)
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') || '15';
      throw new Error(`Limite de requisições da API atingido. Tente novamente em ${retryAfter} segundos.`);
    }
    
    throw new Error(errorData.error || `Erro ${res.status}: ${res.statusText}`);
  }
  
  return res.json();
}

export async function apiPut(path, body) {
  const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await executeRequestWithRetry(`${getApiUrl()}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    
    // Tratamento especial para erro 429 (Rate Limit)
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') || '15';
      throw new Error(`Limite de requisições da API atingido. Tente novamente em ${retryAfter} segundos.`);
    }
    
    throw new Error(errorData.error || `Erro ${res.status}: ${res.statusText}`);
  }
  
  return res.json();
}

export async function apiDelete(path) {
  const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await executeRequestWithRetry(`${getApiUrl()}${path}`, {
    method: 'DELETE',
    headers
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    
    // Tratamento especial para erro 429 (Rate Limit)
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') || '15';
      throw new Error(`Limite de requisições da API atingido. Tente novamente em ${retryAfter} segundos.`);
    }
    
    throw new Error(errorData.error || `Erro ${res.status}: ${res.statusText}`);
  }
  
  return res.json();
} 