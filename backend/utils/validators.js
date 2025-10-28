const Joi = require('joi');

/**
 * Schema de validação para registro de usuário
 */
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Nome é obrigatório',
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres'
  }),
  
  email: Joi.string().email().required().messages({
    'string.empty': 'Email é obrigatório',
    'string.email': 'Email inválido'
  }),
  
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Senha é obrigatória',
    'string.min': 'Senha deve ter pelo menos 6 caracteres'
  }),
  
  role: Joi.string().valid('student', 'parent', 'school').required().messages({
    'any.only': 'Role deve ser student, parent ou school',
    'string.empty': 'Role é obrigatório'
  }),
  
  gradeId: Joi.string().when('role', {
    is: 'student',
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'any.required': 'Série é obrigatória para estudantes'
  }),
  
  schoolId: Joi.string().optional(),
  classId: Joi.string().optional(),
  token: Joi.string().optional(),
  parentConsent: Joi.boolean().when('role', {
    is: 'student',
    then: Joi.valid(true).required(),
    otherwise: Joi.optional()
  }).messages({
    'any.only': 'Consentimento dos pais é obrigatório para estudantes',
    'any.required': 'Consentimento dos pais é obrigatório'
  }),
  
  // Dados do plano família
  familyPlanData: Joi.object({
    numParents: Joi.number().optional(),
    numStudents: Joi.number().optional(),
    totalPrice: Joi.number().optional()
  }).optional(),
  
  // Dados do plano escola
  schoolPlanData: Joi.object({
    numStudents: Joi.number().optional(),
    userType: Joi.string().optional(),
    pricePerStudent: Joi.number().optional(),
    totalPrice: Joi.number().optional()
  }).optional(),
  
  // Licença família
  familyLicense: Joi.object({
    code: Joi.string().optional(),
    individualCode: Joi.string().optional()
  }).optional(),
  
  // Licença escola
  schoolLicense: Joi.object({
    code: Joi.string().optional(),
    individualCode: Joi.string().optional()
  }).optional(),
  
  // Campos adicionais opcionais
  birthDate: Joi.date().optional(),
  parentEmail: Joi.string().email().optional()
});

/**
 * Schema de validação para login
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email é obrigatório',
    'string.email': 'Email inválido'
  }),
  
  password: Joi.string().required().messages({
    'string.empty': 'Senha é obrigatória'
  }),
  
  role: Joi.string().valid('student', 'parent', 'school').required().messages({
    'any.only': 'Role deve ser student, parent ou school',
    'string.empty': 'Role é obrigatório'
  })
});

/**
 * Schema de validação para conclusão de lição
 */
const completeLessonSchema = Joi.object({
  lessonId: Joi.string().required().messages({
    'string.empty': 'ID da lição é obrigatório'
  }),
  
  score: Joi.number().min(0).max(100).required().messages({
    'number.base': 'Score deve ser um número',
    'number.min': 'Score não pode ser negativo',
    'number.max': 'Score não pode ser maior que 100',
    'any.required': 'Score é obrigatório'
  }),
  
  timeSpent: Joi.number().min(0).required().messages({
    'number.base': 'Tempo gasto deve ser um número',
    'number.min': 'Tempo gasto não pode ser negativo',
    'any.required': 'Tempo gasto é obrigatório'
  }),
  
  isPerfect: Joi.boolean().required().messages({
    'boolean.base': 'isPerfect deve ser booleano',
    'any.required': 'isPerfect é obrigatório'
  })
});

/**
 * Schema de validação para criação de turma
 */
const createClassSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Nome da turma é obrigatório',
    'string.min': 'Nome deve ter pelo menos 2 caracteres'
  }),
  
  description: Joi.string().max(500).optional(),
  
  grade: Joi.string().required().messages({
    'string.empty': 'Série é obrigatória'
  }),
  
  teacher: Joi.string().max(100).optional(),
  
  schoolId: Joi.string().required().messages({
    'string.empty': 'ID da escola é obrigatório'
  }),
  
  settings: Joi.object({
    isActive: Joi.boolean().optional(),
    maxStudents: Joi.number().min(1).max(100).optional(),
    allowSelfEnrollment: Joi.boolean().optional()
  }).optional()
});

/**
 * Schema de validação para atualização de usuário
 */
const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  gradeId: Joi.string().optional(),
  classId: Joi.string().optional(),
  currentModule: Joi.number().min(1).max(4).optional(),
  progress: Joi.object().optional(),
  savings: Joi.object().optional(),
  savingsConfig: Joi.object({
    perLesson: Joi.number().min(0).optional(),
    perStreak: Joi.number().min(0).optional(),
    perPerfectLesson: Joi.number().min(0).optional(),
    perLevelUp: Joi.number().min(0).optional(),
    perAchievement: Joi.number().min(0).optional(),
    autoTransfer: Joi.boolean().optional(),
    monthlyLimit: Joi.number().min(0).optional(),
    weeklyGoal: Joi.number().min(0).optional()
  }).optional(),
  settings: Joi.object().optional()
}).min(1).messages({
  'object.min': 'Pelo menos um campo deve ser fornecido para atualização'
});

/**
 * Schema de validação para MongoDB ObjectId
 */
const objectIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'ID inválido'
});

/**
 * Middleware de validação genérico
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Retorna todos os erros, não apenas o primeiro
      stripUnknown: true // Remove campos não definidos no schema
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        details: errors
      });
    }

    // Substituir req[property] pelos dados validados e sanitizados
    req[property] = value;
    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  completeLessonSchema,
  createClassSchema,
  updateUserSchema,
  objectIdSchema,
  validate
};

