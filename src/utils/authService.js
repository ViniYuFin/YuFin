// src/utils/authService.js
import { users as mockUsersData } from './users';
import { storageService, STORAGE_KEYS } from './storageService';
import notificationService from './notificationService';
import API_CONFIG, { authenticatedRequest } from '../config/api';
import { saveTokens, clearTokens } from './axiosInterceptor';

// Função simples de hash para simulação (em produção, usar bcrypt)
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

// Validar email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar senha
const validatePassword = (password) => {
  return password.length >= 6;
};

// Validar nome
const validateName = (name) => {
  return name.trim().length >= 2;
};

export const loginUser = async (email, password, role) => {
  // Validações
  if (!validateEmail(email)) {
    throw new Error("E-mail inválido.");
  }
  if (!validatePassword(password)) {
    throw new Error("Senha deve ter pelo menos 6 caracteres.");
  }
  
  // 🔐 NOVA ROTA SEGURA COM JWT (LOCAL)
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.AUTH.LOGIN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Erro ao fazer login.');
  }
  
  const result = await response.json();
  const { accessToken, refreshToken, user } = result;
  
  if (user.role !== role) {
    throw new Error('Credenciais inválidas ou papel incorreto.');
  }
  
  // 🔐 SALVAR TOKENS JWT (NOVO SISTEMA v2.0)
  if (accessToken && refreshToken) {
    saveTokens(accessToken, refreshToken);
  }
  
  // Compatibilidade: salvar também no formato antigo (temporário)
  if (accessToken) {
    localStorage.setItem('authToken', accessToken);
  }
  
  // Salvar sessão
  const session = {
    userId: user.id,
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    accessToken: accessToken,
    refreshToken: refreshToken
  };
  storageService.save(STORAGE_KEYS.SESSION, session);
  storageService.save(STORAGE_KEYS.USER, user);
  notificationService.success(`Bem-vindo de volta, ${user.name || 'Usuário'}!`);
  return user;
};

export const loginUserGratuito = async (cpf, password) => {
  // Validações
  if (!cpf) {
    throw new Error("CPF é obrigatório.");
  }
  if (!validatePassword(password)) {
    throw new Error("Senha deve ter pelo menos 6 caracteres.");
  }
  
  // 🔐 ROTA ESPECÍFICA PARA LOGIN GRATUITO
  const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login-gratuito`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf, password })
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Erro ao fazer login.');
  }
  
  const result = await response.json();
  const { accessToken, refreshToken, user } = result;
  
  // 🔐 SALVAR TOKENS JWT (NOVO SISTEMA v2.0)
  if (accessToken && refreshToken) {
    saveTokens(accessToken, refreshToken);
  }
  
  // Compatibilidade: salvar também no formato antigo (temporário)
  if (accessToken) {
    localStorage.setItem('authToken', accessToken);
  }
  
  // Salvar sessão
  const session = {
    userId: user.id,
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    accessToken: accessToken,
    refreshToken: refreshToken
  };
  storageService.save(STORAGE_KEYS.SESSION, session);
  storageService.save(STORAGE_KEYS.USER, user);
  notificationService.success(`Bem-vindo de volta!`);
  return user;
};

export const registerUser = async (userData) => {
  // Validações
  if (!validateName(userData.name)) {
    throw new Error("Nome deve ter pelo menos 2 caracteres.");
  }
  if (!validateEmail(userData.email)) {
    throw new Error("E-mail inválido.");
  }
  if (!validatePassword(userData.password)) {
    throw new Error("Senha deve ter pelo menos 6 caracteres.");
  }
  
  // 🔐 NOVA ROTA SEGURA COM HASH DE SENHA (LOCAL)
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.AUTH.REGISTER}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: userData.name,
      email: userData.email,
      password: userData.password, // Backend fará o hash automaticamente
      role: userData.role,
      gradeId: userData.gradeId, // Obrigatório para estudantes
      schoolId: userData.schoolId,
      classId: userData.classId,
      token: userData.token, // Token do responsável
      parentConsent: userData.role === 'student' ? true : undefined, // Obrigatório para estudantes
      birthDate: userData.birthDate,
      parentEmail: userData.parentEmail
    })
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Erro ao registrar.');
  }
  
  const result = await response.json();
  const { accessToken, refreshToken, user } = result;
  
  // 🔐 SALVAR TOKENS JWT (NOVO SISTEMA v2.0)
  if (accessToken && refreshToken) {
    saveTokens(accessToken, refreshToken);
  }
  
  // Compatibilidade: salvar também no formato antigo (temporário)
  if (accessToken) {
    localStorage.setItem('authToken', accessToken);
  }
  
  // Salvar sessão
  const session = {
    userId: user.id,
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    accessToken: accessToken,
    refreshToken: refreshToken
  };
  storageService.save(STORAGE_KEYS.SESSION, session);
  storageService.save(STORAGE_KEYS.USER, user);
  notificationService.success(`Conta criada com sucesso! Bem-vindo ao YuFin, ${user.name}!`);
  return user;
};

export const registerUserGratuito = async (userData) => {
  // Validações específicas para registro gratuito
  if (!userData.cpf) {
    throw new Error("CPF é obrigatório.");
  }
  if (!userData.parentEmail) {
    throw new Error("Email dos pais/responsáveis é obrigatório.");
  }
  if (!validateEmail(userData.parentEmail)) {
    throw new Error("Email dos pais/responsáveis inválido.");
  }
  if (!validatePassword(userData.password)) {
    throw new Error("Senha deve ter pelo menos 6 caracteres.");
  }
  if (userData.confirmPassword && userData.password !== userData.confirmPassword) {
    throw new Error("As senhas não coincidem.");
  }
  if (userData.parentConsent === false) {
    throw new Error("É necessário o consentimento dos pais/responsáveis.");
  }
  
  // 🔐 ROTA ESPECÍFICA PARA REGISTRO GRATUITO
  const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register-gratuito`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cpf: userData.cpf,
      password: userData.password,
      parentEmail: userData.parentEmail,
      parentConsent: userData.parentConsent || true,
      gradeId: userData.gradeId,
      role: 'student-gratuito'
    })
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Erro ao registrar conta gratuita.');
  }
  
  const result = await response.json();
  console.log('🔍 Resultado do registro gratuito:', result);
  
  // Para registro gratuito, o usuário não é criado imediatamente
  // Ele só é criado após a validação por email dos pais
  if (result.requiresEmailValidation) {
    console.log('📧 Registro requer validação por email');
    return {
      success: true,
      requiresEmailValidation: true,
      message: result.message,
      parentEmail: result.parentEmail
    };
  }
  
  // Se chegou aqui, o usuário foi criado (caso de validação imediata)
  const { accessToken, refreshToken, user } = result;
  
  if (!user) {
    throw new Error('Usuário não foi retornado pelo servidor.');
  }
  
  console.log('👤 Usuário retornado:', user);
  
  // 🔐 SALVAR TOKENS JWT (NOVO SISTEMA v2.0)
  if (accessToken && refreshToken) {
    saveTokens(accessToken, refreshToken);
  }
  
  // Compatibilidade: salvar também no formato antigo (temporário)
  if (accessToken) {
    localStorage.setItem('authToken', accessToken);
  }
  
  // Salvar sessão
  const session = {
    userId: user.id || user._id, // Usar _id se id não existir
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    accessToken: accessToken,
    refreshToken: refreshToken
  };
  storageService.save(STORAGE_KEYS.SESSION, session);
  storageService.save(STORAGE_KEYS.USER, user);
  notificationService.success(`Conta gratuita criada com sucesso! Bem-vindo ao YuFin!`);
  return user;
};

export const logoutUser = async () => {
  // 🔐 Revogar refresh token no backend (opcional mas recomendado)
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await fetch(`${API_CONFIG.BASE_URL}/token/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
    }
  } catch (error) {
    console.error('Erro ao revogar token:', error);
    // Continuar com logout local mesmo se falhar
  }
  
  // Limpar storage
  storageService.remove(STORAGE_KEYS.SESSION);
  storageService.remove(STORAGE_KEYS.USER);
  localStorage.removeItem('darkMode');
  
  // 🔐 LIMPAR TODOS OS TOKENS (v2.0)
  clearTokens();
  localStorage.removeItem('authToken'); // Limpar token antigo também
  
  // Remover classe dark do DOM
  document.documentElement.classList.remove('dark');
  
  // Limpar todas as notificações
  notificationService.clear();
  notificationService.info("Você saiu da sua conta.");
};

export const getCurrentSession = () => {
  return storageService.load(STORAGE_KEYS.SESSION);
};

// 🔐 FUNÇÃO: Obter access token JWT (v2.0)
export const getAuthToken = () => {
  return localStorage.getItem('accessToken') || localStorage.getItem('authToken'); // Fallback para token antigo
};

// 🔐 FUNÇÃO: Obter refresh token
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

// 🔐 FUNÇÃO: Verificar se usuário está autenticado
export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

export const updateLastActivity = () => {
  const session = getCurrentSession();
  if (session) {
    session.lastActivity = new Date().toISOString();
    storageService.save(STORAGE_KEYS.SESSION, session);
  }
};

// Validar se a sessão ainda é válida
export const validateSession = (session) => {
  if (!session) return false;
  
  try {
    // Verificar se a sessão não expirou (24 horas)
    const sessionTime = new Date(session.loginTime);
    const now = new Date();
    const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return false;
    }
    
    // Verificar se tem dados essenciais
    return session.userId && session.loginTime;
  } catch (error) {
    return false;
  }
};

// Carregar usuário com validação
export const loadUserFromStorage = () => {
  try {
    const user = storageService.load(STORAGE_KEYS.USER);
    
    if (!user) return null;
    
    // Para usuários gratuitos, não validar sessão (são locais)
    if (user.isGratuito || user.role === 'student-gratuito') {
      console.log('🎯 Carregando usuário gratuito do localStorage:', user);
      return user;
    }
    
    // Para usuários normais, validar sessão
    const session = getCurrentSession();
    if (!session) return null;
    
    // Validar sessão
    if (!validateSession(session)) {
      storageService.remove(STORAGE_KEYS.USER);
      storageService.remove(STORAGE_KEYS.SESSION);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Erro ao carregar usuário do storage:', error);
    return null;
  }
};