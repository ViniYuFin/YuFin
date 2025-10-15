/**
 * 🔄 ROTAS DE GERENCIAMENTO DE TOKENS
 * 
 * - Refresh de access token
 * - Logout (revogar tokens)
 * - Logout de todos os dispositivos
 */

const express = require('express');
const router = express.Router();
const RefreshToken = require('../models/RefreshToken');
const User = require('../models/User');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');

/**
 * POST /token/refresh
 * Gera um novo access token usando refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token não fornecido',
        code: 'NO_REFRESH_TOKEN'
      });
    }
    
    // Verificar token JWT
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        error: error.message,
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
    
    // Buscar refresh token no banco
    const tokenDoc = await RefreshToken.findOne({
      token: refreshToken,
      userId: decoded.userId,
      isRevoked: false
    });
    
    if (!tokenDoc) {
      return res.status(401).json({
        error: 'Refresh token inválido ou revogado',
        code: 'TOKEN_NOT_FOUND'
      });
    }
    
    // Verificar se não expirou
    if (new Date() > tokenDoc.expiresAt) {
      await tokenDoc.revoke('Token expirado');
      return res.status(401).json({
        error: 'Refresh token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    // Buscar usuário
    const user = await User.findById(decoded.userId);
    if (!user) {
      await tokenDoc.revoke('Usuário não encontrado');
      return res.status(401).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Gerar novo par de tokens
    const tokens = generateTokenPair(user);
    
    // Salvar novo refresh token
    const newTokenDoc = new RefreshToken({
      token: tokens.refreshToken,
      userId: user._id,
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        device: getDeviceType(req.headers['user-agent']),
        browser: getBrowser(req.headers['user-agent'])
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    });
    
    await newTokenDoc.save();
    
    // Atualizar lastUsedAt do token antigo
    tokenDoc.lastUsedAt = new Date();
    await tokenDoc.save();
    
    // Opcional: Revogar token antigo (rotação de tokens)
    await tokenDoc.revoke('Token rotacionado');
    
    console.log(`🔄 Token renovado para usuário ${user.email}`);
    
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      message: 'Token renovado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({
      error: 'Erro ao renovar token',
      code: 'REFRESH_ERROR'
    });
  }
});

/**
 * POST /token/logout
 * Revoga o refresh token atual (logout de um dispositivo)
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.json({
        message: 'Logout realizado (sem refresh token)'
      });
    }
    
    // Buscar e revogar token
    const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
    
    if (tokenDoc && !tokenDoc.isRevoked) {
      await tokenDoc.revoke('Logout do usuário');
      console.log(`👋 Logout: Token revogado`);
    }
    
    res.json({
      message: 'Logout realizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro no logout:', error);
    // Mesmo com erro, retornar sucesso (não revelar informações)
    res.json({
      message: 'Logout realizado'
    });
  }
});

/**
 * POST /token/logout-all
 * Revoga todos os refresh tokens do usuário (logout de todos os dispositivos)
 * Requer autenticação
 */
router.post('/logout-all', async (req, res) => {
  try {
    // Extrair userId do token de acesso (se enviado no header)
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token de acesso não fornecido',
        code: 'NO_ACCESS_TOKEN'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { verifyToken } = require('../utils/jwt');
    
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      // Mesmo com token expirado, permitir logout
      const { decodeToken } = require('../utils/jwt');
      decoded = decodeToken(token);
      if (!decoded || !decoded.userId) {
        return res.status(401).json({
          error: 'Token inválido',
          code: 'INVALID_TOKEN'
        });
      }
    }
    
    // Revogar todos os tokens do usuário
    const result = await RefreshToken.revokeAllUserTokens(
      decoded.userId,
      'Logout de todos os dispositivos'
    );
    
    res.json({
      message: `Logout realizado em ${result.modifiedCount} dispositivo(s)`,
      devicesLoggedOut: result.modifiedCount
    });
    
  } catch (error) {
    console.error('Erro no logout-all:', error);
    res.status(500).json({
      error: 'Erro ao fazer logout',
      code: 'LOGOUT_ERROR'
    });
  }
});

/**
 * GET /token/active-sessions
 * Lista todas as sessões ativas do usuário
 * Requer autenticação
 */
router.get('/active-sessions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token não fornecido',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { verifyToken } = require('../utils/jwt');
    
    const decoded = verifyToken(token);
    
    // Buscar tokens ativos do usuário
    const tokens = await RefreshToken.find({
      userId: decoded.userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    })
    .select('-token') // Não retornar o token em si
    .sort({ lastUsedAt: -1 });
    
    const sessions = tokens.map(t => ({
      id: t._id,
      device: t.deviceInfo.device,
      browser: t.deviceInfo.browser,
      ip: t.deviceInfo.ip,
      createdAt: t.createdAt,
      lastUsedAt: t.lastUsedAt,
      expiresAt: t.expiresAt
    }));
    
    res.json({
      activeSessions: sessions.length,
      sessions
    });
    
  } catch (error) {
    console.error('Erro ao listar sessões:', error);
    res.status(500).json({
      error: 'Erro ao listar sessões',
      code: 'SESSIONS_ERROR'
    });
  }
});

/**
 * DELETE /token/revoke-session/:sessionId
 * Revoga uma sessão específica
 * Requer autenticação
 */
router.delete('/revoke-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token não fornecido',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(token);
    
    // Buscar sessão
    const tokenDoc = await RefreshToken.findOne({
      _id: sessionId,
      userId: decoded.userId,
      isRevoked: false
    });
    
    if (!tokenDoc) {
      return res.status(404).json({
        error: 'Sessão não encontrada',
        code: 'SESSION_NOT_FOUND'
      });
    }
    
    await tokenDoc.revoke('Revogado pelo usuário');
    
    res.json({
      message: 'Sessão revogada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao revogar sessão:', error);
    res.status(500).json({
      error: 'Erro ao revogar sessão',
      code: 'REVOKE_ERROR'
    });
  }
});

// Helpers
function getDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function getBrowser(userAgent) {
  if (!userAgent) return 'unknown';
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  return 'Other';
}

module.exports = router;


