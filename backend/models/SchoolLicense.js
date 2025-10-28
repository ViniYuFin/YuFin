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
      // Licença expira em 1 ano
      return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }
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
  if (this.status !== 'paid') return false;
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





