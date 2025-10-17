const mongoose = require('mongoose');

const parentValidationTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  studentCPF: {
    type: String,
    required: true
  },
  parentEmail: {
    type: String,
    required: true
  },
  userData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para melhor performance
parentValidationTokenSchema.index({ studentCPF: 1 });
parentValidationTokenSchema.index({ parentEmail: 1 });
parentValidationTokenSchema.index({ expiresAt: 1 });

// Método para verificar se o token é válido
parentValidationTokenSchema.methods.isValid = function() {
  return !this.isUsed && this.expiresAt > new Date();
};

// Método para marcar como usado
parentValidationTokenSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  this.usedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('ParentValidationToken', parentValidationTokenSchema);