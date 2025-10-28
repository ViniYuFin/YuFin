const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: false }, // Opcional para plano gratuito
  email: { type: String, required: false, unique: true, sparse: true }, // Opcional para plano gratuito - sparse permite null
  cpf: { type: String, required: false, unique: true, sparse: true }, // Para plano gratuito
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ["student", "parent", "school", "student-gratuito"]
  },
  isGratuito: { type: Boolean, default: false }, // Flag para identificar usuários do plano gratuito
  schoolId: { type: String }, // ID da escola (para isolamento)
  gradeId: { type: String }, // série do aluno (apenas para estudantes)
  classId: { type: String }, // ID da turma atual do aluno
  currentModule: { type: Number, default: 1 }, // módulo atual do aluno
  gradeProgression: {
    currentGrade: { type: String }, // série atual
    nextGradeRequested: { type: Boolean, default: false }, // se solicitou próxima série
    nextGradeAuthorized: { type: Boolean, default: false }, // se foi autorizado pela escola
    nextGradeRequestDate: { type: Date }, // data da solicitação
    nextGradeAuthDate: { type: Date }, // data da autorização
    authorizedBy: { type: String }, // ID do usuário da escola que autorizou
    notes: { type: String }, // observações da escola
    classAssignmentStatus: { type: String, enum: ['pending', 'assigned'], default: 'pending' } // status da atribuição de turma
  },
  progress: {
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    totalXp: { type: Number, default: 0 },
    maxXp: { type: Number, default: 1000 },
    xpToNextLevel: { type: Number, default: 100 },
    streak: { type: Number, default: 0 },
    dailyGoal: { type: Number, default: 50 },
    dailyProgress: { type: Number, default: 0 },
    yuCoins: { type: Number, default: 0 },
    hearts: { type: Number, default: 3 },
    completedLessons: [{ type: String }],
    perfectLessons: [{ type: String }],
    achievements: [{ type: mongoose.Schema.Types.Mixed }],
    activeEffects: [{ type: mongoose.Schema.Types.Mixed }],
    inventory: [{ type: mongoose.Schema.Types.Mixed }],
    avatar: { 
      accessory: { type: String, default: "none" }
    },
    timeSpent: { type: Number, default: 0 },
    totalLessonsCompleted: { type: Number, default: 0 },
    lastActivityDate: { type: Date },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    weeklyProgress: { type: Number, default: 0 },
    monthlyProgress: { type: Number, default: 0 }
  },
  savings: {
    balance: { type: Number, default: 0 },
    transactions: [{ type: mongoose.Schema.Types.Mixed }],
    goals: [{ type: mongoose.Schema.Types.Mixed }],
    rewardedLessons: [{ type: String }] // Controla lições já recompensadas
  },
  friends: [{
    userId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'blocked', 'sent'], default: 'pending' },
    addedAt: { type: Date, default: Date.now },
    source: { type: String, enum: ['school', 'class', 'playerId', 'suggestion'], required: true },
    mutual: { type: Boolean, default: false }
  }],
  playerId: { type: String, unique: true, sparse: true }, // ID único para adicionar amigos (YUF123)
  privacySettings: {
    showProfile: { type: Boolean, default: true },
    allowFriendRequests: { type: Boolean, default: true },
    showSchool: { type: Boolean, default: true },
    showClass: { type: Boolean, default: true },
    showLevel: { type: Boolean, default: true }
  },
  linkedStudents: [{ type: String }],
  // Sistema de solicitações de vínculo parent-student
  parentLinkRequests: {
    pendingRequests: [{
      parentId: { type: String },
      parentName: { type: String },
      requestDate: { type: Date, default: Date.now },
      message: { type: String, default: '' }
    }],
    sentRequests: [{
      studentId: { type: String },
      studentName: { type: String },
      requestDate: { type: Date, default: Date.now },
      message: { type: String, default: '' }
    }]
  },
  savingsConfig: {
    perLesson: { type: Number, default: 0.5 },
    perStreak: { type: Number, default: 2.0 },
    perPerfectLesson: { type: Number, default: 1.0 },
    perLevelUp: { type: Number, default: 5.0 },
    perAchievement: { type: Number, default: 3.0 },
    autoTransfer: { type: Boolean, default: false },
    monthlyLimit: { type: Number, default: 100 },
    weeklyGoal: { type: Number, default: 20 }
  },
  settings: {
    notifications: { type: Boolean, default: true },
    sound: { type: Boolean, default: true },
    language: { type: String, default: 'pt-BR' },
    theme: { type: String, default: 'light' }
  },
  parentConsent: {
    given: { type: Boolean, default: false },
    date: { type: Date },
    type: { type: String, enum: ['normal', 'gratuito'], default: 'normal' },
    parentEmail: { type: String }
  },
  // Dados do plano família
  familyPlanData: {
    numParents: { type: Number },
    numStudents: { type: Number },
    totalPrice: { type: Number }
  },
  // Dados do plano escola
  schoolPlanData: {
    numStudents: { type: Number },
    userType: { type: String },
    pricePerStudent: { type: Number },
    totalPrice: { type: Number }
  },
  // Licença família
  familyLicense: {
    code: { type: String },
    individualCode: { type: String }
  },
  // Licença escola
  schoolLicense: {
    code: { type: String },
    individualCode: { type: String }
  }
}, {
  timestamps: true
});

// Configurar para retornar id em vez de _id
userSchema.virtual('id').get(function() {
  return this._id.toString();
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);

