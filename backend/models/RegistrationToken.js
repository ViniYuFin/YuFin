const mongoose = require('mongoose');

const registrationTokenSchema = new mongoose.Schema({
  token: { 
    type: String, 
    required: true, 
    unique: true 
  },
  type: { 
    type: String, 
    required: true, 
    enum: ['parent', 'school'] 
  },
  createdBy: { 
    type: String, 
    required: true 
  }, // ID do responsável ou escola que criou
  schoolId: { 
    type: String 
  }, // ID da escola (para tokens de escola)
  maxUses: { 
    type: Number, 
    default: null 
  }, // null = ilimitado
  usedCount: { 
    type: Number, 
    default: 0 
  },
  expiresAt: { 
    type: Date, 
    default: null 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  metadata: {
    description: { type: String, default: '' },
    grade: { type: String, default: '' },
    studentName: { type: String, default: '' }
  },
  usedBy: [{
    studentId: { type: String },
    studentName: { type: String },
    usedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Configurar para retornar id em vez de _id
registrationTokenSchema.virtual('id').get(function() {
  return this._id.toString();
});

registrationTokenSchema.set('toJSON', { virtuals: true });
registrationTokenSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('RegistrationToken', registrationTokenSchema);
