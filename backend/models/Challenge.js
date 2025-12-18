const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  moduleId: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  theme: {
    type: String,
    required: true,
    trim: true
  },
  activity: {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    instructions: [{
      type: String,
      required: true
    }],
    duration: {
      type: String,
      required: true
    },
    familyParticipation: {
      type: String,
      required: false
    }
  },
  rewards: {
    xp: {
      type: Number,
      required: true,
      min: 0
    },
    yuCoins: {
      type: Number,
      required: true,
      min: 0
    },
    savings: {
      type: Number,
      required: true,
      min: 0
    },
    achievement: {
      type: String,
      required: true,
      trim: true
    }
  },
  validationType: {
    type: String,
    enum: ['family', 'school', 'both'],
    required: true,
    default: 'family'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Virtual para ID
challengeSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

challengeSchema.set('toJSON', { virtuals: true });
challengeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Challenge', challengeSchema);

