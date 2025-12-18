// src/data/users.js

// Função de hash simples para compatibilidade com os dados mockados
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

export const users = [
  {
    id: 1,
    name: "Aluno Exemplo",
    email: "aluno@exemplo.com",
    passwordHash: simpleHash("senha123"),
    role: "student",
    createdAt: "2024-01-01T00:00:00.000Z",
    progress: {
      xp: 450,
      maxXp: 1000,
      yuCoins: 120,
      streak: 5,
      hearts: 3,
      completedLessons: [1],
      avatar: { accessory: "none" },
      level: 3,
      dailyGoal: 50,
      dailyProgress: 25
    },
    savings: { 
      balance: 15.0, 
      transactions: [{ amount: 5, reason: "Concluiu Mesada Inteligente" }],
      goals: []
    },
    settings: {
      notifications: true,
      sound: true,
      language: 'pt-BR',
      theme: 'light'
    }
  },
  {
    id: 2,
    name: "Responsável Exemplo",
    email: "responsavel@exemplo.com",
    passwordHash: simpleHash("senha123"),
    role: "parent",
    createdAt: "2024-01-01T00:00:00.000Z",
    linkedStudents: [1],
    savingsConfig: { 
      perLesson: 0.5, 
      perStreak: 2.0,
      autoTransfer: false
    },
    balance: 500.00,
    transactions: [],
    settings: {
      notifications: true,
      sound: true,
      language: 'pt-BR',
      theme: 'light'
    }
  },
  {
    id: 3,
    name: "Escola Exemplo",
    email: "escola@exemplo.com",
    passwordHash: simpleHash("senha123"),
    role: "school",
    createdAt: "2024-01-01T00:00:00.000Z",
    linkedClasses: [],
    activeStudents: 10,
    averageXp: 450,
    completedLessonsCount: 50,
    settings: {
      notifications: true,
      sound: true,
      language: 'pt-BR',
      theme: 'light'
    }
  },
];

// Funções de login e registro são apenas para simulação e não um backend real.
// Elas já estão sendo chamadas por authService.js
// Você pode remover estas funções daqui se quiser, pois são usadas apenas internamente por authService.js
// Para manter a consistência, podemos deixá-las aqui por enquanto como parte dos dados mockados.

// export const loginUser = (email, password) =>
//   users.find((u) => u.email === email && u.password === password);

// export const registerUser = (name, email, password, role) => {
//   const newUser = { id: users.length + 1, name, email, password, role };
//   if (role === "student") {
//     newUser.progress = { xp: 0, maxXp: 1000, yuCoins: 0, streak: 0, hearts: 3, completedLessons: [], avatar: { accessory: "none" } };
//     newUser.savings = { balance: 0, transactions: [] };
//   } else if (role === "parent") {
//     newUser.linkedStudents = [];
//     newUser.savingsConfig = { perLesson: 0.5, perStreak: 2.0 };
//   } else if (role === "school") {
//     newUser.linkedClasses = [];
//   }
//   users.push(newUser); // ATENÇÃO: Isso modifica o array global de usuários em tempo de execução para o mock.
//   return newUser;
// };