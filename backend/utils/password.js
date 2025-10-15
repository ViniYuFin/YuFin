const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10; // Número de rounds para o salt (10 é um bom equilíbrio entre segurança e performance)

/**
 * Gera hash seguro da senha usando bcrypt
 * @param {string} password - Senha em texto plano
 * @returns {Promise<string>} Hash da senha
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error('Erro ao gerar hash da senha:', error);
    throw new Error('Erro ao processar senha');
  }
};

/**
 * Compara senha em texto plano com hash armazenado
 * @param {string} password - Senha em texto plano
 * @param {string} hash - Hash armazenado no banco
 * @returns {Promise<boolean>} True se a senha está correta
 */
const comparePassword = async (password, hash) => {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    console.error('Erro ao comparar senha:', error);
    throw new Error('Erro ao validar senha');
  }
};

/**
 * Valida força da senha
 * @param {string} password - Senha a ser validada
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Senha deve ter pelo menos 6 caracteres');
  }
  
  if (password.length < 8) {
    errors.push('Recomendado: Senha com pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Recomendado: Incluir pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Recomendado: Incluir pelo menos uma letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Recomendado: Incluir pelo menos um número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Recomendado: Incluir pelo menos um caractere especial');
  }
  
  // Senha muito fraca (crítico)
  const isValid = password.length >= 6;
  
  return {
    isValid,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Calcula força da senha (0-4)
 * @param {string} password 
 * @returns {number} 0 = muito fraca, 4 = muito forte
 */
const calculatePasswordStrength = (password) => {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  
  return Math.min(strength, 4);
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  calculatePasswordStrength
};

