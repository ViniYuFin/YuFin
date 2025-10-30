const mongoose = require('mongoose');

const marketValidationSchema = new mongoose.Schema({
  // Dados básicos
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: false
  },
  city: {
    type: String,
    required: true
  },
  relationship: {
    type: String,
    required: true,
    enum: ['pai', 'mae', 'pai_mae', 'avo', 'tutor', 'professor', 'diretor', 'outro']
  },
  
  // Sobre as crianças
  childrenCount: {
    type: String,
    required: true
  },
  childrenAges: {
    type: String,
    required: true
  },
  likesGames: {
    type: String,
    required: true,
    enum: ['muito', 'moderado', 'não']
  },
  teachesFinance: {
    type: String,
    required: true,
    enum: ['sim', 'parcial', 'nao']
  },
  teachingMethods: [{
    type: String,
    enum: ['mesada', 'cofrinho', 'conversas', 'jogos', 'livros', 'outros']
  }],
  
  // Desafios e necessidades
  challenges: [{
    type: String,
    enum: ['falta_tempo', 'falta_conhecimento', 'dificuldade_engajamento', 'falta_recursos', 'idade_apropriada', 'linguagem']
  }],
  biggestProblem: {
    type: String,
    required: true
  },
  importance: {
    type: String,
    required: true,
    enum: ['10', '7-9', '4-6', '1-3']
  },
  
  // Sobre o YüFin
  wouldPay: {
    type: String,
    required: true,
    enum: ['sim_definitivamente', 'provavelmente', 'talvez', 'provavelmente_nao', 'nao']
  },
  priceRange: {
    type: String,
    required: true,
    enum: ['gratis', '5-10', '10-20', '20-30', '30-50', '50+']
  },
  mainFeature: {
    type: String,
    required: true,
    enum: ['gamificacao', 'lições', 'relatorios', 'desafios', 'personalizacao', 'todas']
  },
  whenStart: {
    type: String,
    required: true,
    enum: ['imediato', 'um_mes', 'tres_meses', 'depois']
  },
  knowsSimilar: {
    type: String,
    required: true,
    enum: ['sim_uso', 'sim_nao_uso', 'nao']
  },
  additionalInfo: {
    type: String,
    required: false
  },
  
  // Metadados de análise
  leadScore: {
    type: Number,
    default: 0
  },
  priority: {
    type: String,
    enum: ['quente', 'morno', 'frio'],
    default: 'morno'
  },
  status: {
    type: String,
    enum: ['novo', 'contactado', 'interessado', 'convertido', 'não_interessado'],
    default: 'novo'
  },
  notes: {
    type: String,
    required: false
  },
  
  // Comunicação
  contactedAt: {
    type: Date,
    required: false
  },
  lastFollowUp: {
    type: Date,
    required: false
  },
  followUpCount: {
    type: Number,
    default: 0
  },
  
  // Cupom de acesso gratuito
  couponGenerated: {
    type: Boolean,
    default: false
  },
  couponCode: {
    type: String,
    required: false
  },
  couponSent: {
    type: Boolean,
    default: false
  },
  couponSentAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Método para calcular lead score
marketValidationSchema.methods.calculateLeadScore = function() {
  let score = 0;
  
  // Disposição de pagar (0-40 pontos)
  switch(this.wouldPay) {
    case 'sim_definitivamente': score += 40; break;
    case 'provavelmente': score += 30; break;
    case 'talvez': score += 15; break;
    case 'provavelmente_nao': score += 5; break;
    case 'nao': score += 0; break;
  }
  
  // Urgência (0-25 pontos)
  switch(this.whenStart) {
    case 'imediato': score += 25; break;
    case 'um_mes': score += 20; break;
    case 'tres_meses': score += 10; break;
    case 'depois': score += 5; break;
  }
  
  // Importância (0-20 pontos)
  switch(this.importance) {
    case '10': score += 20; break;
    case '7-9': score += 15; break;
    case '4-6': score += 8; break;
    case '1-3': score += 3; break;
  }
  
  // Pré-disposição para gamificação (0-10 pontos)
  switch(this.likesGames) {
    case 'muito': score += 10; break;
    case 'moderado': score += 5; break;
    case 'não': score += 2; break;
  }
  
  // Preço adequado (0-5 pontos)
  if (this.priceRange !== 'gratis') {
    score += 5;
  }
  
  return score;
};

// Método para determinar prioridade
marketValidationSchema.methods.determinePriority = function() {
  const score = this.leadScore;
  if (score >= 70) return 'quente';
  if (score >= 40) return 'morno';
  return 'frio';
};

// Índices para performance
marketValidationSchema.index({ email: 1 });
marketValidationSchema.index({ status: 1, priority: 1 });
marketValidationSchema.index({ leadScore: -1 });
marketValidationSchema.index({ createdAt: -1 });

const MarketValidation = mongoose.model('MarketValidation', marketValidationSchema);

module.exports = MarketValidation;
