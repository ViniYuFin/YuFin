const mongoose = require('mongoose');

const schoolLicenseSchema = new mongoose.Schema({
  licenseCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  planData: {
    numStudents: {
      type: Number,
      required: true,
      min: 50 // Mínimo de 50 alunos para plano escola
    },
    totalPrice: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'used', 'expired', 'cancelled'],
    default: 'pending'
  },
  payment: {
    transactionId: String,
    paymentMethod: String,
    paidAt: Date
  },
  schoolData: {
    name: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    }
  },
  generatedLicenses: [{
    licenseCode: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['available', 'used'],
      default: 'available'
    },
    usedAt: Date,
    usedBy: {
      userId: String,
      userName: String,
      userEmail: String
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Licença expira em 1 mês (recorrência mensal)
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
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
});

// Método para gerar código único da licença
schoolLicenseSchema.statics.generateLicenseCode = function() {
  const prefix = 'SCH-';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}-${random}`;
};

// Método para verificar se a licença é válida
schoolLicenseSchema.methods.isValid = function() {
  // Verificar se status da licença está pago
  if (this.status !== 'paid') return false;
  
  // Verificar se assinatura está ativa
  if (this.subscription && this.subscription.status !== 'active') return false;
  
  // Verificar se está em período de graça
  if (this.gracePeriod?.isActive && this.gracePeriod?.expiresAt > new Date()) {
    return true; // Acesso permitido durante período de graça
  }
  
  // Verificar se licença não expirou
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  
  return true;
};

// Método para obter licenças disponíveis
schoolLicenseSchema.virtual('availableLicenses').get(function() {
  return this.generatedLicenses.filter(license => license.status === 'available');
});

// Método para obter licenças usadas
schoolLicenseSchema.virtual('usedLicenses').get(function() {
  return this.generatedLicenses.filter(license => license.status === 'used');
});

// Índices para performance
// licenseCode já tem unique: true, não precisa duplicar
schoolLicenseSchema.index({ status: 1 });
schoolLicenseSchema.index({ createdAt: -1 });
schoolLicenseSchema.index({ expiresAt: 1 });

const SchoolLicense = mongoose.model('SchoolLicense', schoolLicenseSchema);

module.exports = SchoolLicense;





