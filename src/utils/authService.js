// src/utils/authService.js
import { users as mockUsersData } from './users';
import { storageService, STORAGE_KEYS } from './storageService';
import notificationService from './notificationService';

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
  // Chamada ao backend
  const response = await fetch('http://localhost:3001/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Erro ao fazer login.');
  }
  const user = await response.json();
  if (user.role !== role) {
    throw new Error('Credenciais inválidas ou papel incorreto.');
  }
  // Salvar sessão
  const session = {
    userId: user.id,
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };
  storageService.save(STORAGE_KEYS.SESSION, session);
  storageService.save(STORAGE_KEYS.USER, user);
  notificationService.success(`Bem-vindo de volta, ${user.name}!`);
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
  // Chamada ao backend
  const response = await fetch('http://localhost:3001/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...userData,
      passwordHash: userData.password // Para MVP, senha simples
    })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Erro ao registrar.');
  }
  const user = await response.json();
  storageService.save(STORAGE_KEYS.USER, user);
  notificationService.success(`Conta criada com sucesso! Bem-vindo ao YuFin, ${user.name}!`);
  return user;
};

export const logoutUser = () => {
  storageService.remove(STORAGE_KEYS.SESSION);
  notificationService.info("Você saiu da sua conta.");
};

export const getCurrentSession = () => {
  return storageService.load(STORAGE_KEYS.SESSION);
};

export const updateLastActivity = () => {
  const session = getCurrentSession();
  if (session) {
    session.lastActivity = new Date().toISOString();
    storageService.save(STORAGE_KEYS.SESSION, session);
  }
};