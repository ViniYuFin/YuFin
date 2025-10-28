const mongoose = require('mongoose');
const crypto = require('crypto');

const UniversalLicenseSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    default: function() {
      return 'UNI-' + crypto.randomBytes(8).toString('hex').toUpperCase();
    }
  },
  name: { 
    type: String, 
    required: true,
    default: 'Licença Universal Administrativa'
  },
  description: { 
    type: String,
    default: 'Licença universal que não expira e funciona para todos os planos'
  },
  planTypes: {
    type: [String],
    default: ['family', 'school'],
    enum: ['family', 'school', 'enterprise']
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isUniversal: { 
    type: Boolean, 
    default: true 
  },
  neverExpires: { 
    type: Boolean, 
    default: true 
  },
  maxUses: { 
    type: Number, 
    default: -1 // -1 = ilimitado
  },
  currentUses: { 
    type: Number, 
    default: 0 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastUsedAt: { 
    type: Date 
  },
  usageHistory: [{
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: Date.now },
    planType: { type: String, enum: ['family', 'school', 'enterprise'] },
    userEmail: String,
    userCPF: String
  }]
});

// Método para verificar se a licença é válida
UniversalLicenseSchema.methods.isValid = function() {
  if (!this.isActive) return false;
  if (this.neverExpires) return true;
  if (this.maxUses === -1) return true; // Ilimitado
  return this.currentUses < this.maxUses;
};

// Método para usar a licença
UniversalLicenseSchema.methods.useLicense = function(userData, planType) {
  if (!this.isValid()) {
    throw new Error('Licença inválida ou expirada');
  }
  
  // Incrementar contador de uso
  this.currentUses += 1;
  this.lastUsedAt = new Date();
  
  // Adicionar ao histórico
  this.usageHistory.push({
    usedBy: userData.userId,
    usedAt: new Date(),
    planType: planType,
    userEmail: userData.email,
    userCPF: userData.cpf
  });
  
  return this.save();
};

// Método para obter estatísticas de uso
UniversalLicenseSchema.methods.getUsageStats = function() {
  return {
    totalUses: this.currentUses,
    maxUses: this.maxUses,
    isUnlimited: this.maxUses === -1,
    lastUsed: this.lastUsedAt,
    usageHistory: this.usageHistory.slice(-10) // Últimos 10 usos
  };
};

const UniversalLicense = mongoose.model('UniversalLicense', UniversalLicenseSchema);

module.exports = UniversalLicense;






