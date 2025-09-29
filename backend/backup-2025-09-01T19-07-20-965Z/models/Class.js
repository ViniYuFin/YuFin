const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  grade: { type: String },
  teacher: { type: String, required: true },
  schoolId: { type: String, required: true }, // ID da escola (para isolamento)
  students: [{ type: String }],
  lessons: [{ type: String }],
  settings: {
    isActive: { type: Boolean, default: true },
    maxStudents: { type: Number, default: 30 },
    allowSelfEnrollment: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Configurar para retornar id em vez de _id
classSchema.virtual('id').get(function() {
  return this._id.toString();
});

classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Class', classSchema);

