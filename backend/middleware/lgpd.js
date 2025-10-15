/**
 * Middleware para verificar consentimento LGPD
 * Garante que menores de idade tenham consentimento dos pais
 */

const checkParentConsent = (req, res, next) => {
  const { role, parentConsent, age } = req.body;

  // Se for estudante, verificar consentimento
  if (role === 'student') {
    // Se não forneceu consentimento, bloquear
    if (!parentConsent) {
      return res.status(400).json({
        error: 'Consentimento dos pais/responsáveis é obrigatório',
        code: 'PARENT_CONSENT_REQUIRED',
        message: 'Para estudantes menores de 18 anos, é necessário o consentimento dos pais ou responsáveis legais, conforme Lei Geral de Proteção de Dados (LGPD).'
      });
    }

    // Log de consentimento para auditoria
    console.log(`[LGPD] Consentimento registrado para novo estudante: ${req.body.email}`);
  }

  next();
};

/**
 * Sanitiza dados pessoais em logs
 * Remove informações sensíveis antes de logar
 */
const sanitizeLog = (data) => {
  const sanitized = { ...data };
  
  // Remove campos sensíveis
  if (sanitized.passwordHash) sanitized.passwordHash = '[REDACTED]';
  if (sanitized.password) sanitized.password = '[REDACTED]';
  if (sanitized.email) {
    // Ofusca parte do email
    const [user, domain] = sanitized.email.split('@');
    sanitized.email = `${user.substring(0, 2)}***@${domain}`;
  }
  
  return sanitized;
};

/**
 * Middleware para adicionar headers LGPD nas respostas
 */
const lgpdHeaders = (req, res, next) => {
  // Adicionar headers informativos sobre privacidade
  res.setHeader('X-Data-Protection', 'LGPD-Compliant');
  res.setHeader('X-Privacy-Policy', 'https://yufin.com.br/privacidade');
  
  next();
};

module.exports = {
  checkParentConsent,
  sanitizeLog,
  lgpdHeaders
};

