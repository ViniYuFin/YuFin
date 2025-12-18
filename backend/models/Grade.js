const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // "6º Ano", "7º Ano", etc.
  title: { type: String }, // Título da série (ex: "Investidor Júnior")
  modules: [{ type: String }], // Array com nomes dos módulos
  level: { type: Number, required: true, unique: true }, // 6, 7, 8, 9, 10, 11, 12
  ageRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  description: { type: String, required: true },
  bnccObjectives: [{ type: String }],
  estimatedDuration: { type: Number, default: 12 }, // em semanas
  difficultyRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  achievements: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    requirement: { type: Number, required: true },
    rewards: {
      xp: { type: Number, required: true },
      yuCoins: { type: Number, required: true }
    },
    type: { type: String, required: true }
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Virtual para id
gradeSchema.virtual('id').get(function() {
  return this._id.toString();
});

gradeSchema.set('toJSON', { virtuals: true });
gradeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Grade', gradeSchema);
