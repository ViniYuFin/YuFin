const mongoose = require('mongoose');

const challengeProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  moduleId: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'paused', 'completed', 'pending_validation', 'validated'],
    default: 'pending'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  validatedAt: {
    type: Date
  },
  parentValidation: {
    requested: {
      type: Boolean,
      default: false
    },
    validated: {
      type: Boolean,
      default: false
    },
    validatedAt: {
      type: Date
    },
    requestedAt: {
      type: Date
    },
    notes: {
      type: String
    }
  },
  schoolValidation: {
    requested: {
      type: Boolean,
      default: false
    },
    validated: {
      type: Boolean,
      default: false
    },
    validatedAt: {
      type: Date
    },
    requestedAt: {
      type: Date
    },
    notes: {
      type: String
    }
  },
  validationType: {
    type: String,
    enum: ['family', 'school', 'both'],
    default: 'family'
  }
}, {
  timestamps: true
});

// Índices para performance
challengeProgressSchema.index({ userId: 1, challengeId: 1 }, { unique: true });
challengeProgressSchema.index({ userId: 1, status: 1 });

// Virtual para ID
challengeProgressSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

challengeProgressSchema.set('toJSON', { virtuals: true });
challengeProgressSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ChallengeProgress', challengeProgressSchema);

