/**
 * 🔐 MIDDLEWARE DE SEGURANÇA AVANÇADO
 * 
 * Proteções implementadas:
 * - Rate limiting (proteção contra brute force)
 * - Helmet (headers de segurança)
 * - Sanitização de dados (NoSQL injection)
 * - XSS protection
 * - HPP (HTTP Parameter Pollution)
 */

const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

/**
 * 🛡️ HELMET - Headers de Segurança
 * Protege contra ataques comuns
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://yufin-backend.vercel.app", "https://yufin.com.br"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny' // Previne clickjacking
  },
  noSniff: true, // Previne MIME type sniffing
  xssFilter: true, // XSS protection
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

/**
 * 🚦 RATE LIMITERS
 */

// Rate limiter geral (100 requests por 15 minutos por IP)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de requests
  message: {
    error: 'Muitas requisições deste IP, tente novamente em 15 minutos',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Retorna info no headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  // Configuração para Vercel com suporte IPv6
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip;
    
    // Usar função auxiliar para IPv6
    return ipKeyGenerator(req, ip);
  },
  handler: (req, res) => {
    console.log(`⚠️ Rate limit atingido: ${req.ip}`);
    res.status(429).json({
      error: 'Muitas requisições. Tente novamente mais tarde.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Rate limiter para LOGIN (5 tentativas por 15 minutos)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // apenas 5 tentativas
  skipSuccessfulRequests: true, // Não conta requests bem-sucedidos
  // Configuração para Vercel com suporte IPv6
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip;
    
    // Usar função auxiliar para IPv6
    return ipKeyGenerator(req, ip);
  },
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    console.log(`🚨 Possível ataque de brute force: ${req.ip} - ${req.body?.email}`);
    res.status(429).json({
      error: 'Muitas tentativas de login. Aguarde 15 minutos.',
      code: 'LOGIN_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

// Rate limiter para REGISTRO (20 contas por hora por IP - adequado para escolas)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // Aumentado para suportar escolas com muitos alunos
  message: {
    error: 'Limite de cadastros atingido. Tente novamente em 1 hora',
    code: 'REGISTER_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    console.log(`⚠️ Limite de registro atingido: ${req.ip}`);
    res.status(429).json({
      error: 'Limite de cadastros excedido. Aguarde 1 hora.',
      code: 'REGISTER_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Rate limiter para LGPD (2 exportações por hora)
const lgpdLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 2,
  message: {
    error: 'Limite de exportações atingido. Tente novamente em 1 hora',
    code: 'LGPD_RATE_LIMIT_EXCEEDED'
  }
});

// Rate limiter para API geral (requests autenticados - 500 por 15 min)
// Aumentado para suportar uso intenso durante navegação entre lições
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    error: 'Limite de requisições da API atingido',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 🧼 SANITIZAÇÃO DE DADOS
 * Remove caracteres maliciosos de queries MongoDB
 */
const sanitizeData = mongoSanitize({
  replaceWith: '_', // Substitui caracteres proibidos por _
  onSanitize: ({ req, key }) => {
    console.log(`⚠️ Tentativa de NoSQL injection detectada: ${key} em ${req.path}`);
  }
});

/**
 * 🛡️ HPP - HTTP Parameter Pollution Protection
 * Previne ataques de poluição de parâmetros
 */
const hppProtection = hpp({
  whitelist: [
    'gradeId', 'module', 'role', 'status', // Parâmetros que podem ser duplicados
    'sort', 'limit', 'page'
  ]
});

/**
 * 🔍 LOGGER DE SEGURANÇA + PROTEÇÃO NoSQL
 * Loga eventos de segurança suspeitos e bloqueia NoSQL injection
 */
const securityLogger = (req, res, next) => {
  // Função para limpar objetos de operadores MongoDB perigosos
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const cleaned = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      // Bloquear operadores MongoDB
      if (key.startsWith('$')) {
        console.log('🚨 NoSQL Injection bloqueada:', {
          ip: req.ip,
          path: req.path,
          key: key,
          timestamp: new Date().toISOString()
        });
        continue; // Pular este campo
      }
      
      // Recursivamente limpar objetos aninhados
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        cleaned[key] = sanitizeObject(obj[key]);
      } else {
        cleaned[key] = obj[key];
      }
    }
    
    return cleaned;
  };
  
  // Limpar body, query e params
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  
  // Detectar possíveis ataques XSS e outros
  const suspiciousPatterns = [
    /<script>/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /\.\.\//, // Path traversal
    /etc\/passwd/i,
    /cmd\.exe/i
  ];

  const requestBody = JSON.stringify(req.body);
  const requestQuery = JSON.stringify(req.query);
  const requestParams = JSON.stringify(req.params);

  for (const pattern of suspiciousPatterns) {
    if (
      pattern.test(requestBody) ||
      pattern.test(requestQuery) ||
      pattern.test(requestParams)
    ) {
      console.log('🚨 ALERTA DE SEGURANÇA:', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        pattern: pattern.toString(),
        timestamp: new Date().toISOString()
      });
      
      // Opcional: Bloquear requisição suspeita
      // return res.status(403).json({ error: 'Requisição bloqueada por motivos de segurança' });
    }
  }

  next();
};

/**
 * 📝 VALIDAÇÃO DE INPUT BÁSICA
 * Valida tamanhos e tipos de dados
 */
const validateInput = (req, res, next) => {
  // Limite de tamanho do body (já configurado no express, mas double-check)
  if (req.body && typeof req.body === 'object') {
    const bodySize = JSON.stringify(req.body).length;
    if (bodySize > 1024 * 1024) { // 1MB
      return res.status(413).json({
        error: 'Payload muito grande',
        code: 'PAYLOAD_TOO_LARGE'
      });
    }

    // Validar email format se presente
    if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
      return res.status(400).json({
        error: 'Formato de email inválido',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }
  }

  next();
};

/**
 * 🚫 PROTEÇÃO CONTRA ENUMERAÇÃO DE USUÁRIOS
 * Não revelar se email existe ou não
 */
const preventUserEnumeration = (message = 'Se o email existir, você receberá instruções') => {
  return (req, res, next) => {
    // Wrapper para respostas genéricas
    res.sendGenericResponse = () => {
      res.json({ message });
    };
    next();
  };
};

module.exports = {
  helmetConfig,
  generalLimiter,
  loginLimiter,
  registerLimiter,
  lgpdLimiter,
  apiLimiter,
  sanitizeData,
  hppProtection,
  securityLogger,
  validateInput,
  preventUserEnumeration
};

