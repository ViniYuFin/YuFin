/**
 * 🔄 MODEL DE REFRESH TOKENS
 * 
 * Sistema de refresh tokens para sessões seguras e de longa duração
 */

const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deviceInfo: {
    userAgent: String,
    ip: String,
    device: String, // mobile, desktop, tablet
    browser: String
  },
  expiresAt: {
    type: Date,
    required: true
    // Índice será criado explicitamente abaixo
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedAt: Date,
  revokedReason: String
}, {
  timestamps: true
});

// Índice composto para queries eficientes
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Método para revogar token
refreshTokenSchema.methods.revoke = function(reason) {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  return this.save();
};

// Método estático para limpar tokens expirados
refreshTokenSchema.statics.cleanExpired = async function() {
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true, revokedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Revogados há mais de 7 dias
    ]
  });
  console.log(`🧹 Limpeza de tokens: ${result.deletedCount} removidos`);
  return result;
};

// Método estático para revogar todos os tokens de um usuário
refreshTokenSchema.statics.revokeAllUserTokens = async function(userId, reason = 'User logout') {
  const result = await this.updateMany(
    { userId, isRevoked: false },
    { 
      $set: { 
        isRevoked: true, 
        revokedAt: new Date(), 
        revokedReason: reason 
      } 
    }
  );
  console.log(`🔒 Revogados ${result.modifiedCount} tokens do usuário ${userId}`);
  return result;
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);



