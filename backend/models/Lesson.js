const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['drag-drop', 'quiz', 'choices', 'classify', 'match', 'simulation', 'input', 'budget-choices', 'categories-simulation', 'math-problems', 'shopping-simulation', 'price-comparison', 'budget-distribution', 'progress-game', 'shopping-cart', 'goals'] 
  },
  content: { type: mongoose.Schema.Types.Mixed, required: true },
  gradeId: { type: String, required: true }, // referência à série
  module: { type: Number, required: true, min: 1, max: 4 }, // 1-4 (módulo dentro da série)
  moduleTitle: { type: String }, // título do módulo (ex: "O que é dinheiro?")
  order: { type: Number, required: true, min: 1, max: 12 }, // 1-12 (ordem no módulo)
  difficulty: { type: Number, required: true, min: 1, max: 9 }, // 1-9
  estimatedTime: { type: Number, default: 15 }, // em minutos
  bnccSkills: [{ type: String }], // habilidades BNCC
  prerequisites: [{ type: String }], // lições anteriores necessárias
  tags: [{ type: String }], // categorias: "matemática", "poupança", "investimento", etc.
  projectBased: { type: Boolean, default: false }, // se é projeto prático
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Virtual para id
lessonSchema.virtual('id').get(function() {
  return this._id.toString();
});

lessonSchema.set('toJSON', { virtuals: true });
lessonSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Lesson', lessonSchema);

