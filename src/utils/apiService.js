import { getApiUrl } from '../config/environment';

const API_URL = getApiUrl();

export async function apiGet(path) {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(errorData.error || `Erro ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export async function apiPost(path, body) {
  console.log('🌐 [API DEBUG] Fazendo POST para:', `${API_URL}${path}`);
  console.log('🌐 [API DEBUG] Body:', body);
  
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}${path}`, {
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
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(errorData.error || `Erro ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export async function apiPut(path, body) {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(errorData.error || `Erro ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export async function apiDelete(path) {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(errorData.error || `Erro ${res.status}: ${res.statusText}`);
  }
  return res.json();
} 