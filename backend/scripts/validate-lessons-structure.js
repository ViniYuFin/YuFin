/**
 * 🧪 SCRIPT DE VALIDAÇÃO - ESTRUTURA DE LIÇÕES
 * 
 * Consulta todas as lições no MongoDB e valida a estrutura
 * comparando com a estrutura esperada por série
 * 
 * Mostra para cada lição:
 * - Série (gradeId)
 * - Tipo de gamificação
 * - Perguntas e respostas
 * - Dificuldade e tempo estimado
 * 
 * Uso:
 *   cd backend
 *   node scripts/validate-lessons-structure.js          # Modo resumido
 *   node scripts/validate-lessons-structure.js --detailed  # Modo detalhado (mostra conteúdo)
 *   node scripts/validate-lessons-structure.js -d          # Modo detalhado (abreviado)
 *   node scripts/validate-lessons-structure.js --export   # Exporta tudo para JSON
 *   node scripts/validate-lessons-structure.js -e         # Exporta tudo para JSON (abreviado)
 * 
 * IMPORTANTE: Este script NÃO modifica o banco de dados, apenas lê e extrai conteúdo
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

// Estrutura esperada fornecida pelo usuário
const EXPECTED_STRUCTURE = {
  '6º Ano': {
    'Módulo 1 – O que é dinheiro?': [
      'A História do Dinheiro',
      'Necessidades vs Desejos',
      'O Orçamento da Família'
    ],
    'Módulo 2 – Contas Simples': [
      'Contando Moedas e Notas',
      'Porcentagens no dia a dia',
      'Comparando Preços no Mercado'
    ],
    'Módulo 3 – Consumo Consciente': [
      'O valor das escolhas',
      'Poupança para pequenos objetivos',
      'Economizando em Casa'
    ],
    'Módulo 4 – Projeto Prático': [
      'Feira de Troca / Simulação de compras',
      'Planejando uma pequena viagem',
      'Revisão e Celebração'
    ]
  },
  '7º Ano': {
    'Módulo 1 – Orçamento e Controle': [
      'Meu Primeiro Orçamento',
      'Categorizando Gastos',
      'Definindo Metas Financeiras'
    ],
    'Módulo 2 – Consumo e Publicidade': [
      'Pesquisa de Preços',
      'Qualidade vs Preço',
      'Compras por Impulso e Marketing'
    ],
    'Módulo 3 – Introdução a Investimentos': [
      'Tipos de Poupança',
      'Juros Simples',
      'Risco vs Retorno (básico)'
    ],
    'Módulo 4 – Segurança Financeira': [
      'Golpes Comuns e Prevenção',
      'Proteção de Dados Online',
      'Revisão e Celebração'
    ]
  },
  '8º Ano': {
    'Módulo 1 – Orçamento Familiar Avançado': [
      'Analisando Gastos',
      'Planejamento de Longo Prazo',
      'Compartilhando Finanças em Família'
    ],
    'Módulo 2 – Crédito e Consumo': [
      'Como funciona o Crédito',
      'Financiamentos e Parcelamentos',
      'Comparação de Preços Avançada'
    ],
    'Módulo 3 – Investimentos Básicos': [
      'Juros Compostos',
      'Tipos de Investimentos (poupança, CDB, tesouro)',
      'Diversificação Inicial'
    ],
    'Módulo 4 – Impacto e Segurança': [
      'Impacto Ambiental e Consumo',
      'Fraudes Digitais e Cuidado Online',
      'Revisão e Celebração'
    ]
  },
  '9º Ano': {
    'Módulo 1 – Finanças Pessoais': [
      'Planejamento Financeiro Pessoal',
      'Análise de Fluxo de Caixa',
      'Decisões Financeiras do Dia a Dia'
    ],
    'Módulo 2 – Empreendedorismo Básico': [
      'Psicologia do Consumo',
      'Análise de Custo-Benefício',
      'Finanças Sustentáveis'
    ],
    'Módulo 3 – Introdução à Economia': [
      'Inflação e Preços',
      'Estratégias de Investimento (iniciante)',
      'Gestão de Riscos Básica'
    ],
    'Módulo 4 – Ética e Segurança': [
      'Fraudes no Mundo do Trabalho',
      'Ética e Responsabilidade Financeira',
      'Revisão e Celebração'
    ]
  },
  '1º Ano EM': {
    'Módulo 1 – Renda e Orçamento': [
      'Orçamento do Jovem Adulto',
      'Primeiro Salário e Estágio',
      'Dívidas e Cartão de Crédito'
    ],
    'Módulo 2 – Investimentos e Poupança': [
      'Renda Fixa vs Variável',
      'Investindo no Longo Prazo',
      'Finanças Comportamentais'
    ],
    'Módulo 3 – Tributação Básica': [
      'Impostos no Cotidiano (ICMS, ISS, IRPF simplificado)',
      'Taxas Bancárias e Tarifas',
      'Economia Digital (Pix, bancos digitais, apps)'
    ],
    'Módulo 4 – Segurança e Consciência': [
      'Golpes Financeiros Modernos',
      'Regulamentação Básica (direitos do consumidor)',
      'Revisão e Celebração'
    ]
  },
  '2º Ano EM': {
    'Módulo 1 – Economia do Dia a Dia': [
      'Planejamento Financeiro Empresarial Básico',
      'Introdução a Demonstrativos Financeiros',
      'Decisões de Investimento em Negócios'
    ],
    'Módulo 2 – Mercado Financeiro': [
      'Psicologia de Mercado',
      'Análise Técnica e Fundamentalista (básico)',
      'Finanças Internacionais'
    ],
    'Módulo 3 – Proteção e Risco': [
      'Derivativos (introdução)',
      'Estratégias de Hedge',
      'Gestão de Portfólio'
    ],
    'Módulo 4 – Tecnologia e Inovação': [
      'Fintechs e Blockchain',
      'Governança Corporativa',
      'Revisão e Celebração'
    ]
  },
  '3º Ano EM': {
    'Módulo 1 – Projeto de Vida Financeiro': [
      'Planejamento Financeiro Estratégico',
      'Escolhas Profissionais e Financeiras',
      'Decisões de Investimento para o Futuro'
    ],
    'Módulo 2 – Economia Global': [
      'Investimentos Internacionais',
      'Globalização e Finanças',
      'Economia Sustentável'
    ],
    'Módulo 3 – Inovação e Futuro': [
      'Criptomoedas e Blockchain',
      'Novos Modelos de Negócio (startups, economia colaborativa)',
      'Riscos Sistêmicos'
    ],
    'Módulo 4 – Legado e Cidadania Financeira': [
      'Previdência e Aposentadoria',
      'Ética e Responsabilidade Social',
      'Revisão e Celebração'
    ]
  }
};

// Mapeamento de séries para gradeId no banco
const GRADE_MAPPING = {
  '6º Ano': '6º Ano',
  '7º Ano': '7º Ano',
  '8º Ano': '8º Ano',
  '9º Ano': '9º Ano',
  '1º Ano EM': '1º Ano EM',
  '2º Ano EM': '2º Ano EM',
  '3º Ano EM': '3º Ano EM'
};

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
};

const log = {
  title: (msg) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  debug: (msg) => console.log(`${colors.gray}🔍 ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.magenta}${colors.bright}${msg}${colors.reset}`),
};

/**
 * Normaliza título de lição para comparação
 */
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim();
}

/**
 * Compara títulos (flexível)
 */
function titlesMatch(expected, actual) {
  const normalizedExpected = normalizeTitle(expected);
  const normalizedActual = normalizeTitle(actual);
  
  // Comparação exata
  if (normalizedExpected === normalizedActual) return true;
  
  // Comparação parcial (se um contém o outro)
  if (normalizedExpected.includes(normalizedActual) || normalizedActual.includes(normalizedExpected)) {
    return true;
  }
  
  // Comparação por palavras-chave principais
  const expectedWords = normalizedExpected.split(/\s+/).filter(w => w.length > 3);
  const actualWords = normalizedActual.split(/\s+/).filter(w => w.length > 3);
  
  const commonWords = expectedWords.filter(w => actualWords.includes(w));
  return commonWords.length >= Math.min(expectedWords.length, actualWords.length) * 0.5;
}

/**
 * Extrai TODO o conteúdo da lição (perguntas, respostas, cenários, etc)
 */
function extractFullContent(content, type) {
  const extracted = {
    questions: [],
    fullContent: null,
    hasQuestions: false,
    hasInteractiveContent: false
  };
  
  if (!content) {
    extracted.fullContent = 'Conteúdo não disponível';
    return extracted;
  }
  
  // Salvar conteúdo completo
  extracted.fullContent = content;
  
  // Tipo: quiz
  if (type === 'quiz' && content.questions) {
    extracted.hasQuestions = true;
    content.questions.forEach((q, index) => {
      extracted.questions.push({
        number: index + 1,
        question: q.question || q.text || 'Sem pergunta',
        alternatives: q.alternatives || q.options || [],
        correctAnswer: q.correctAnswer || q.correct || 'N/A',
        explanation: q.explanation || q.feedback || ''
      });
    });
  }
  
  // Tipo: choices
  if (type === 'choices' && content.questions) {
    extracted.hasQuestions = true;
    content.questions.forEach((q, index) => {
      extracted.questions.push({
        number: index + 1,
        question: q.question || q.text || 'Sem pergunta',
        alternatives: q.alternatives || q.options || [],
        correctAnswer: q.correctAnswer || q.correct || 'N/A',
        explanation: q.explanation || q.feedback || ''
      });
    });
  }
  
  // Tipo: math-problems
  if (type === 'math-problems' && content.problems) {
    extracted.hasQuestions = true;
    content.problems.forEach((p, index) => {
      extracted.questions.push({
        number: index + 1,
        question: p.problem || p.scenario || p.question || 'Sem problema',
        alternatives: p.options || [],
        correctAnswer: p.answer || p.correctAnswer || 'N/A',
        explanation: p.explanation || p.solution || ''
      });
    });
  }
  
  // Tipo: match
  if (type === 'match' && content.pairs) {
    extracted.hasInteractiveContent = true;
    extracted.questions.push({
      number: 1,
      question: 'Associação de conceitos',
      pairs: content.pairs.map(p => ({ left: p.left, right: p.right })),
      totalPairs: content.pairs.length
    });
  }
  
  // Tipo: simulation, shopping-simulation, etc
  if (type === 'simulation' || type === 'shopping-simulation' || type === 'categories-simulation') {
    extracted.hasInteractiveContent = true;
    const scenario = content.scenario || content.description || 'Simulação prática';
    const options = content.options || content.choices || [];
    const finalReflection = content.finalReflection || content.conclusion || '';
    
    extracted.questions.push({
      number: 1,
      question: typeof scenario === 'string' ? scenario : JSON.stringify(scenario),
      scenario: scenario,
      options: options.map(o => ({
        choice: o.choice || o.option || o.text || '',
        outcome: o.outcome || o.result || '',
        feedback: o.feedback || o.explanation || ''
      })),
      finalReflection: finalReflection
    });
  }
  
  // Tipo: drag-drop
  if (type === 'drag-drop' && content.items) {
    extracted.hasInteractiveContent = true;
    extracted.questions.push({
      number: 1,
      question: 'Arraste e solte os itens',
      items: content.items.map(i => ({
        text: i.text || i.label || i.name || '',
        category: i.category || i.target || ''
      })),
      categories: content.categories || []
    });
  }
  
  // Tipo: classify
  if (type === 'classify' && content.items) {
    extracted.hasInteractiveContent = true;
    extracted.questions.push({
      number: 1,
      question: 'Classifique os itens',
      items: content.items.map(i => ({
        text: i.text || i.label || i.name || '',
        category: i.category || ''
      })),
      categories: content.categories || []
    });
  }
  
  // Tipo: input
  if (type === 'input' && content.questions) {
    extracted.hasQuestions = true;
    content.questions.forEach((q, index) => {
      extracted.questions.push({
        number: index + 1,
        question: q.question || q.prompt || 'Sem pergunta',
        correctAnswer: q.answer || q.expectedAnswer || 'N/A',
        explanation: q.explanation || q.feedback || ''
      });
    });
  }
  
  // Tipo: price-comparison
  if (type === 'price-comparison' && content.products) {
    extracted.hasInteractiveContent = true;
    extracted.questions.push({
      number: 1,
      question: 'Compare os preços dos produtos',
      products: content.products.map(p => ({
        name: p.name || '',
        price: p.price || 0,
        description: p.description || ''
      }))
    });
  }
  
  // Tipo: budget-distribution
  if (type === 'budget-distribution' && content.budget) {
    extracted.hasInteractiveContent = true;
    extracted.questions.push({
      number: 1,
      question: `Distribua o orçamento de R$ ${content.budget}`,
      budget: content.budget,
      categories: content.categories?.map(c => ({
        name: c.name || '',
        maxAmount: c.maxAmount || c.limit || 0,
        description: c.description || ''
      })) || []
    });
  }
  
  // Tipo: goals
  if (type === 'goals' && content.goals) {
    extracted.hasInteractiveContent = true;
    extracted.questions.push({
      number: 1,
      question: 'Defina suas metas financeiras',
      goals: content.goals.map(g => ({
        name: g.name || g.title || '',
        description: g.description || '',
        targetAmount: g.targetAmount || g.amount || 0,
        deadline: g.deadline || g.date || ''
      }))
    });
  }
  
  // Tipo: shopping-cart
  if (type === 'shopping-cart' && content.products) {
    extracted.hasInteractiveContent = true;
    extracted.questions.push({
      number: 1,
      question: 'Simulação de carrinho de compras',
      products: content.products || [],
      budget: content.budget || 0
    });
  }
  
  // Tipo: progress-game
  if (type === 'progress-game') {
    extracted.hasInteractiveContent = true;
    extracted.questions.push({
      number: 1,
      question: 'Jogo de progresso financeiro',
      content: content
    });
  }
  
  // Tipo: budget-choices
  if (type === 'budget-choices' && content.scenarios) {
    extracted.hasInteractiveContent = true;
    extracted.questions.push({
      number: 1,
      question: 'Escolhas orçamentárias',
      scenarios: content.scenarios || []
    });
  }
  
  return extracted;
}

/**
 * Mapeia tipo de lição para nome amigável
 */
function getGamificationTypeName(type) {
  const typeNames = {
    'quiz': 'Quiz (Perguntas e Respostas)',
    'choices': 'Escolha Múltipla',
    'math-problems': 'Problemas Matemáticos',
    'match': 'Associação (Match)',
    'simulation': 'Simulação',
    'shopping-simulation': 'Simulação de Compras',
    'drag-drop': 'Arraste e Solte',
    'classify': 'Classificação',
    'input': 'Resposta Aberta',
    'price-comparison': 'Comparação de Preços',
    'budget-distribution': 'Distribuição de Orçamento',
    'budget-choices': 'Escolhas Orçamentárias',
    'categories-simulation': 'Simulação por Categorias',
    'progress-game': 'Jogo de Progresso',
    'shopping-cart': 'Carrinho de Compras',
    'goals': 'Metas Financeiras'
  };
  
  return typeNames[type] || type;
}

/**
 * Consulta e organiza lições do banco
 */
async function getLessonsFromDB() {
  try {
    const lessons = await Lesson.find({ isActive: true })
      .sort({ gradeId: 1, module: 1, order: 1 })
      .lean();
    
    // Organizar por série e módulo (apenas para validação visual)
    const organized = {};
    
    // Array com TODAS as lições exatamente como estão no banco (para exportação)
    const allLessonsRaw = [];
    
    lessons.forEach(lesson => {
      const gradeId = lesson.gradeId;
      if (!organized[gradeId]) {
        organized[gradeId] = {};
      }
      
      const moduleKey = `Módulo ${lesson.module}`;
      if (!organized[gradeId][moduleKey]) {
        organized[gradeId][moduleKey] = [];
      }
      
      // Converter _id para string para JSON
      const lessonCopy = {
        ...lesson,
        _id: lesson._id ? lesson._id.toString() : null,
        id: lesson._id ? lesson._id.toString() : null
      };
      
      // Para validação (mostrar no terminal - versão simplificada)
      organized[gradeId][moduleKey].push({
        title: lesson.title,
        order: lesson.order,
        module: lesson.module,
        moduleTitle: lesson.moduleTitle || '',
        id: lesson._id ? lesson._id.toString() : null,
        type: lesson.type,
        typeName: getGamificationTypeName(lesson.type),
        gradeId: lesson.gradeId,
        difficulty: lesson.difficulty || 'N/A',
        estimatedTime: lesson.estimatedTime || 'N/A',
        // Conteúdo completo (para mostrar estrutura)
        content: lesson.content
      });
      
      // Para exportação (dados COMPLETOS exatamente como estão no banco)
      allLessonsRaw.push(lessonCopy);
    });
    
    return { organized, allLessonsRaw };
  } catch (error) {
    log.error(`Erro ao consultar lições: ${error.message}`);
    throw error;
  }
}

/**
 * Valida estrutura de uma série
 */
function validateGrade(gradeName, expectedModules, actualLessons, showDetails = true) {
  const issues = [];
  const gradeId = GRADE_MAPPING[gradeName];
  const actual = actualLessons[gradeId] || {};
  
  log.section(`\n📚 ${gradeName}`);
  
  // Verificar cada módulo esperado
  Object.entries(expectedModules).forEach(([moduleTitle, expectedLessons]) => {
    const moduleNum = parseInt(moduleTitle.match(/\d+/)?.[0] || '0');
    const moduleKey = `Módulo ${moduleNum}`;
    const actualModule = actual[moduleKey] || [];
    
    log.info(`\n  ${moduleTitle}:`);
    
    // Verificar cada lição esperada
    expectedLessons.forEach((expectedTitle, index) => {
      const expectedOrder = index + 1;
      const found = actualModule.find(lesson => 
        titlesMatch(expectedTitle, lesson.title)
      );
      
      if (found) {
        log.success(`    ✓ Lição ${expectedOrder}: "${found.title}"`);
        
        // Mostrar detalhes da lição
        if (showDetails) {
          log.debug(`      📍 Série: ${found.gradeId}`);
          log.debug(`      🎮 Tipo: ${found.typeName}`);
          log.debug(`      📊 Dificuldade: ${found.difficulty}/9`);
          log.debug(`      ⏱️  Tempo estimado: ${found.estimatedTime} min`);
          log.debug(`      ❓ Perguntas: ${found.questionCount}`);
          
      // Mostrar informações básicas (não processar conteúdo)
      log.debug(`      📄 Tipo: ${found.typeName}`);
      log.debug(`      📊 Dificuldade: ${found.difficulty}/9`);
      log.debug(`      ⏱️  Tempo: ${found.estimatedTime} min`);
      
      // Mostrar estrutura do conteúdo sem processar
      if (found.content && typeof found.content === 'object') {
        const contentKeys = Object.keys(found.content);
        log.debug(`      📋 Estrutura: ${contentKeys.length} campos principais (${contentKeys.slice(0, 5).join(', ')}${contentKeys.length > 5 ? '...' : ''})`);
      } else {
        log.warn(`      ⚠️  Conteúdo não é objeto válido`);
      }
        }
        
        // Verificar se ordem está correta
        if (found.order !== expectedOrder) {
          issues.push({
            grade: gradeName,
            module: moduleTitle,
            lesson: expectedTitle,
            type: 'order',
            expected: expectedOrder,
            actual: found.order
          });
          log.warn(`      ⚠️  Ordem incorreta: esperado ${expectedOrder}, encontrado ${found.order}`);
        }
      } else {
        issues.push({
          grade: gradeName,
          module: moduleTitle,
          lesson: expectedTitle,
          type: 'missing',
          expected: expectedOrder
        });
        log.error(`    ✗ Lição ${expectedOrder}: "${expectedTitle}" - NÃO ENCONTRADA`);
      }
    });
    
    // Verificar lições extras
    actualModule.forEach(actualLesson => {
      const found = expectedLessons.find(expectedTitle => 
        titlesMatch(expectedTitle, actualLesson.title)
      );
      
      if (!found) {
        issues.push({
          grade: gradeName,
          module: moduleTitle,
          lesson: actualLesson.title,
          type: 'extra',
          actual: actualLesson.order
        });
        log.warn(`    ⚠️  Lição extra encontrada: "${actualLesson.title}" (ordem ${actualLesson.order})`);
        if (showDetails) {
          log.debug(`      📍 Série: ${actualLesson.gradeId}`);
          log.debug(`      🎮 Tipo: ${actualLesson.typeName}`);
          log.debug(`      ❓ Perguntas: ${actualLesson.questionCount}`);
        }
      }
    });
    
    // Verificar quantidade
    if (actualModule.length !== expectedLessons.length) {
      log.warn(`    ⚠️  Quantidade: esperado ${expectedLessons.length}, encontrado ${actualModule.length}`);
    }
  });
  
  return issues;
}

/**
 * Gera relatório completo
 */
async function generateReport() {
  log.title('═══════════════════════════════════════════════════════════');
  log.title('📊 RELATÓRIO DE VALIDAÇÃO - ESTRUTURA DE LIÇÕES');
  log.title('═══════════════════════════════════════════════════════════');
  
  try {
    // Conectar ao MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      log.error('MONGODB_URI não encontrada no arquivo .env');
      log.info('Certifique-se de que o arquivo .env está na pasta backend/');
      process.exit(1);
    }
    
    log.info('Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    log.success('Conectado ao MongoDB!');
    log.info(`Database: ${mongoose.connection.name}`);
    log.info(`Collection: lessons`);
    
    // Consultar lições
    log.info('\nConsultando lições do banco de dados...');
    const { organized: actualLessons, allLessonsRaw } = await getLessonsFromDB();
    
    // Estatísticas gerais
    const totalLessons = allLessonsRaw.length;
    
    log.info(`\nTotal de lições encontradas: ${totalLessons}`);
    log.info(`Séries encontradas: ${Object.keys(actualLessons).length}`);
    
    // Validar cada série
    const allIssues = [];
    const showDetails = process.argv.includes('--detailed') || process.argv.includes('-d');
    
    if (showDetails) {
      log.info('\n📋 Modo detalhado ativado - mostrando perguntas e respostas\n');
    }
    
    Object.entries(EXPECTED_STRUCTURE).forEach(([gradeName, expectedModules]) => {
      const issues = validateGrade(gradeName, expectedModules, actualLessons, showDetails);
      allIssues.push(...issues);
    });
    
    // Resumo final
    log.title('\n═══════════════════════════════════════════════════════════');
    log.title('📋 RESUMO DA VALIDAÇÃO');
    log.title('═══════════════════════════════════════════════════════════');
    
    const missing = allIssues.filter(i => i.type === 'missing').length;
    const extra = allIssues.filter(i => i.type === 'extra').length;
    const order = allIssues.filter(i => i.type === 'order').length;
    
    log.info(`Total de problemas encontrados: ${allIssues.length}`);
    log.error(`Lições faltantes: ${missing}`);
    log.warn(`Lições extras: ${extra}`);
    log.warn(`Problemas de ordem: ${order}`);
    
    if (allIssues.length === 0) {
      log.success('\n✅ Estrutura está 100% conforme esperado!');
    } else {
      log.warn('\n⚠️  Estrutura precisa de ajustes');
      
      // Detalhar problemas
      if (missing > 0) {
        log.section('\n📝 Lições Faltantes:');
        allIssues
          .filter(i => i.type === 'missing')
          .forEach(issue => {
            log.error(`  • ${issue.grade} - ${issue.module} - "${issue.lesson}"`);
          });
      }
      
      if (extra > 0) {
        log.section('\n📝 Lições Extras:');
        allIssues
          .filter(i => i.type === 'extra')
          .forEach(issue => {
            log.warn(`  • ${issue.grade} - ${issue.module} - "${issue.lesson}"`);
          });
      }
    }
    
    // Exportar conteúdo completo para JSON (se solicitado)
    const exportJson = process.argv.includes('--export') || process.argv.includes('-e');
    if (exportJson) {
      log.title('\n═══════════════════════════════════════════════════════════');
      log.title('💾 EXPORTANDO CONTEÚDO COMPLETO PARA JSON');
      log.title('═══════════════════════════════════════════════════════════');
      
      const exportData = {
        exportDate: new Date().toISOString(),
        totalLessons: totalLessons,
        grades: Object.keys(actualLessons),
        // Exportar TUDO exatamente como está no banco (usar allLessonsRaw)
        // Isso garante que TODOS os campos sejam preservados, incluindo:
        // - content (com todas as perguntas, alternativas, cenários, etc)
        // - todos os metadados
        // - todos os campos adicionais
        lessons: allLessonsRaw.map(lesson => {
          // Retornar exatamente como está, apenas garantindo que _id seja string
          return {
            ...lesson,
            _id: lesson._id ? lesson._id.toString() : null,
            id: lesson._id ? lesson._id.toString() : null
          };
        })
      };
      
      const exportPath = path.join(__dirname, 'lessons-content-export.json');
      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf8');
      log.success(`\n✅ Conteúdo exportado para: ${exportPath}`);
      log.info(`📊 Total de lições exportadas: ${exportData.lessons.length}`);
    }
    
    // Fechar conexão
    await mongoose.connection.close();
    log.success('\n✅ Conexão fechada');
    
  } catch (error) {
    log.error(`\n❌ Erro: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  generateReport();
}

module.exports = { generateReport, getLessonsFromDB, validateGrade };
