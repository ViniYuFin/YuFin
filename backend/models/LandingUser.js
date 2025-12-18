const mongoose = require('mongoose');

const landingUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 100,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    language: {
      type: String,
      default: 'pt-BR'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para atualizar updatedAt
landingUserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Índices para performance
// email já tem unique: true, não precisa duplicar
landingUserSchema.index({ createdAt: -1 });
landingUserSchema.index({ isActive: 1 });

// Método para verificar se conta está bloqueada
landingUserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Método para incrementar tentativas de login
landingUserSchema.methods.incLoginAttempts = function() {
  // Se já está bloqueado e o tempo de bloqueio expirou
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Bloquear conta após 5 tentativas por 2 horas
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 horas
  }
  
  return this.updateOne(updates);
};

// Método para resetar tentativas de login
landingUserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Método para atualizar último login
landingUserSchema.methods.updateLastLogin = function() {
  return this.updateOne({
    $set: { lastLogin: new Date() },
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Método para obter dados públicos (sem senha)
landingUserSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  return userObject;
};

// Método para verificar senha
landingUserSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para alterar senha
landingUserSchema.methods.changePassword = async function(newPassword) {
  const bcrypt = require('bcryptjs');
  const saltRounds = 12;
  this.password = await bcrypt.hash(newPassword, saltRounds);
  return this.save();
};

// Método para desativar conta
landingUserSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Método para reativar conta
landingUserSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

// Método para obter estatísticas do usuário
landingUserSchema.methods.getStats = async function() {
  const FamilyLicense = require('./FamilyLicense');
  const SchoolLicense = require('./SchoolLicense');
  
  const familyLicenses = await FamilyLicense.countDocuments({
    'payment.purchaserEmail': this.email
  });
  
  const schoolLicenses = await SchoolLicense.countDocuments({
    'schoolData.email': this.email
  });
  
  const totalSpent = await this.getTotalSpent();
  
  return {
    totalLicenses: familyLicenses + schoolLicenses,
    familyLicenses,
    schoolLicenses,
    totalSpent,
    memberSince: this.createdAt,
    lastLogin: this.lastLogin
  };
};

// Método para obter total gasto
landingUserSchema.methods.getTotalSpent = async function() {
  const FamilyLicense = require('./FamilyLicense');
  const SchoolLicense = require('./SchoolLicense');
  
  const familyTotal = await FamilyLicense.aggregate([
    { $match: { 'payment.purchaserEmail': this.email, status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$planData.totalPrice' } } }
  ]);
  
  const schoolTotal = await SchoolLicense.aggregate([
    { $match: { 'schoolData.email': this.email, status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$planData.totalPrice' } } }
  ]);
  
  const familyAmount = familyTotal.length > 0 ? familyTotal[0].total : 0;
  const schoolAmount = schoolTotal.length > 0 ? schoolTotal[0].total : 0;
  
  return familyAmount + schoolAmount;
};

const LandingUser = mongoose.model('LandingUser', landingUserSchema);

module.exports = LandingUser;





