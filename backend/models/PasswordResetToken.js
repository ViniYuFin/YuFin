const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['student', 'parent', 'school', 'student-gratuito', 'admin'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 60 * 60 * 1000) // 1 hora
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice para busca rápida
passwordResetTokenSchema.index({ token: 1 });
passwordResetTokenSchema.index({ email: 1, role: 1 });
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Método para verificar se o token é válido
passwordResetTokenSchema.methods.isValid = function() {
  return !this.isUsed && this.expiresAt > new Date();
};

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

