const mongoose = require('mongoose');

const familyLicenseSchema = new mongoose.Schema({
  licenseCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  // Dados do plano família
  planData: {
    numParents: {
      type: Number,
      required: true,
      min: 1,
      max: 2
    },
    numStudents: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    totalPrice: {
      type: Number,
      required: true
    }
  },
  
  // Status da licença
  status: {
    type: String,
    enum: ['pending', 'paid', 'active', 'used', 'expired'],
    default: 'pending'
  },
  
  // Informações de pagamento
  payment: {
    transactionId: String,
    paymentMethod: String,
    paidAt: Date,
    amount: Number
  },
  
  // Responsável que comprou a licença
  purchaser: {
    email: String,
    name: String,
    phone: String
  },
  
  // Licenças geradas para os responsáveis
  generatedLicenses: [{
    licenseCode: String,
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: Date,
    status: {
      type: String,
      enum: ['available', 'used'],
      default: 'available'
    }
  }],
  
  // Tokens disponíveis para os alunos
  availableTokens: {
    type: Number,
    default: 0
  },
  
  // Tokens gerados
  generatedTokens: [{
    token: String,
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: Date,
    status: {
      type: String,
      enum: ['available', 'used'],
      default: 'available'
    }
  }],
  
  // Controle de uso da licença
  usageCount: {
    type: Number,
    default: 0
  },
  
  // Limite de usos baseado no número de responsáveis
  maxUsages: {
    type: Number,
    default: 1
  },
  
  // Usuários que já usaram esta licença
  usedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    canGenerateTokens: {
      type: Boolean,
      default: false
    }
  }],
  
  // Datas importantes
  expiresAt: {
    type: Date,
    default: function() {
      // Licença válida por 1 mês (recorrência mensal)
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Sistema de assinatura recorrente
  subscription: {
    id: String, // ID da assinatura no Mercado Pago
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled', 'expired'],
      default: 'active'
    },
    nextBillingDate: Date, // Próxima data de cobrança
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    autoRenew: {
      type: Boolean,
      default: true
    }
  },
  
  // Histórico de renovações
  renewalHistory: [{
    renewedAt: Date,
    amount: Number,
    transactionId: String,
    status: {
      type: String,
      enum: ['success', 'failed', 'refunded']
    }
  }],
  
  // Período de graça para falhas de pagamento
  gracePeriod: {
    isActive: {
      type: Boolean,
      default: false
    },
    expiresAt: Date,
    reason: String // 'payment_failed', 'subscription_paused'
  }
}, {
  timestamps: true
});

// Índices para performance
// licenseCode já tem unique: true no schema, não precisa duplicar
familyLicenseSchema.index({ status: 1 });
familyLicenseSchema.index({ 'purchaser.email': 1 });
// expiresAt já tem index implícito, não precisa duplicar

// Método para verificar se a licença é válida
familyLicenseSchema.methods.isValid = function() {
  // Verificar se status da licença está ativo
  if (this.status !== 'paid' && this.status !== 'active') return false;
  
  // Verificar se assinatura está ativa
  if (this.subscription && this.subscription.status !== 'active') return false;
  
  // Verificar se está em período de graça
  if (this.gracePeriod?.isActive && this.gracePeriod?.expiresAt > new Date()) {
    return true; // Acesso permitido durante período de graça
  }
  
  // Verificar se licença não expirou
  return this.expiresAt > new Date();
};

// Método para verificar se a licença pode ser usada
familyLicenseSchema.methods.canBeUsed = function() {
  return this.usageCount < this.maxUsages;
};

// Método para verificar se um usuário pode gerar tokens
familyLicenseSchema.methods.canUserGenerateTokens = function(userId) {
  const userUsage = this.usedBy.find(usage => usage.userId.toString() === userId.toString());
  return userUsage ? userUsage.canGenerateTokens : false;
};

// Método para gerar código único da licença
familyLicenseSchema.statics.generateLicenseCode = function() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FAM-${timestamp}-${random}`;
};

// Método para gerar licenças individuais para os responsáveis
familyLicenseSchema.methods.generateIndividualLicenses = function() {
  const individualLicenses = [];
  
  for (let i = 0; i < this.planData.numParents; i++) {
    const individualCode = `${this.licenseCode}-${String(i + 1).padStart(2, '0')}`;
    individualLicenses.push({
      licenseCode: individualCode,
      status: 'available'
    });
  }
  
  this.generatedLicenses = individualLicenses;
  this.availableTokens = this.planData.numStudents;
  
  return individualLicenses;
};

module.exports = mongoose.model('FamilyLicense', familyLicenseSchema);

