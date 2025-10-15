/**
 * 🔐 SISTEMA DE JWT APRIMORADO
 * 
 * - Access tokens (curta duração - 15min)
 * - Refresh tokens (longa duração - 30 dias)
 * - Tokens seguros com rotação
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'yufin-secret-key-change-in-production';
const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET + '-refresh';

// Access token: curta duração (15 minutos)
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '15m';

// Refresh token: longa duração (30 dias)
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || '30d';

/**
 * Gera um token JWT de acesso (curta duração)
 * @param {Object} user - Objeto do usuário
 * @returns {string} Token JWT
 */
const generateToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    type: 'access'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
    issuer: 'yufin-backend',
    audience: 'yufin-frontend'
  });
};

/**
 * Verifica e decodifica um token JWT de acesso
 * @param {string} token - Token JWT
 * @returns {Object} Payload decodificado
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'yufin-backend',
      audience: 'yufin-frontend'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    }
    throw new Error('Erro ao verificar token');
  }
};

/**
 * Gera um refresh token (longa duração)
 * @param {Object} user - Objeto do usuário
 * @returns {Object} { token, tokenId }
 */
const generateRefreshToken = (user) => {
  // ID único para o token (para rastreamento e revogação)
  const tokenId = crypto.randomBytes(16).toString('hex');
  
  const payload = {
    userId: user._id.toString(),
    tokenId,
    type: 'refresh'
  };

  const token = jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
    issuer: 'yufin-backend',
    audience: 'yufin-frontend'
  });

  return { token, tokenId };
};

/**
 * Verifica e decodifica um refresh token
 * @param {string} token - Refresh token
 * @returns {Object} Payload decodificado
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET, {
      issuer: 'yufin-backend',
      audience: 'yufin-frontend'
    });
    
    if (decoded.type !== 'refresh') {
      throw new Error('Token não é um refresh token');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Refresh token inválido');
    }
    throw new Error('Erro ao verificar refresh token');
  }
};

/**
 * Gera um par de tokens (access + refresh)
 * @param {Object} user - Objeto do usuário
 * @returns {Object} { accessToken, refreshToken, tokenId }
 */
const generateTokenPair = (user) => {
  const accessToken = generateToken(user);
  const { token: refreshToken, tokenId } = generateRefreshToken(user);
  
  return {
    accessToken,
    refreshToken,
    tokenId,
    expiresIn: 900 // 15 minutos em segundos
  };
};

/**
 * Decodifica token sem verificar assinatura (para debug)
 * @param {string} token - Token JWT
 * @returns {Object} Payload decodificado
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Verifica se o token está perto de expirar (< 5 minutos)
 * @param {string} token - Token JWT
 * @returns {boolean}
 */
const isTokenExpiringSoon = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    
    const expirationTime = decoded.exp * 1000; // Converter para ms
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    
    return timeUntilExpiration < 5 * 60 * 1000; // < 5 minutos
  } catch (error) {
    return true;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTokenPair,
  decodeToken,
  isTokenExpiringSoon,
  JWT_SECRET,
  REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES
};

