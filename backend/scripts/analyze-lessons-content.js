/**
 * 🔍 ANÁLISE DETALHADA DO CONTEÚDO DAS LIÇÕES
 * 
 * Analisa o JSON exportado e identifica:
 * - Lições sem perguntas quando deveriam ter
 * - Problemas de coerência
 * - Problemas matemáticos
 * - Conteúdo incompleto ou inconsistente
 * 
 * Uso:
 *   node analyze-lessons-content.js
 */

const fs = require('fs');
const path = require('path');

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
 * Verifica se uma lição deveria ter perguntas baseado no tipo
 */
function shouldHaveQuestions(type, title) {
  // Tipos que SEMPRE deveriam ter perguntas
  const typesWithQuestions = ['quiz', 'choices', 'math-problems', 'input'];
  
  // Tipos que podem ter perguntas mas não obrigatório
  const typesWithOptionalQuestions = ['simulation', 'shopping-simulation'];
  
  // Tipos que NÃO têm perguntas tradicionais (são interativos)
  const typesWithoutQuestions = [
    'budget-distribution', 
    'goals', 
    'drag-drop', 
    'classify', 
    'match',
    'price-comparison',
    'shopping-cart',
    'progress-game',
    'budget-choices',
    'categories-simulation'
  ];
  
  if (typesWithQuestions.includes(type)) {
    return true;
  }
  
  if (typesWithoutQuestions.includes(type)) {
    return false;
  }
  
  // Para simulações, verificar se tem conteúdo estruturado
  if (typesWithOptionalQuestions.includes(type)) {
    return null; // Pode ter ou não
  }
  
  return null; // Tipo desconhecido
}

/**
 * Verifica coerência entre título, descrição e conteúdo
 */
function checkCoherence(lesson) {
  const issues = [];
  
  // Verificar se título corresponde ao conteúdo
  const titleLower = lesson.title.toLowerCase();
  const descriptionLower = (lesson.description || '').toLowerCase();
  const fullContentStr = JSON.stringify(lesson.fullContent || {}).toLowerCase();
  
  // Verificar se há palavras-chave do título no conteúdo
  const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3);
  const foundInContent = titleWords.filter(word => 
    fullContentStr.includes(word) || descriptionLower.includes(word)
  );
  
  if (foundInContent.length < titleWords.length * 0.5) {
    issues.push({
      type: 'coherence',
      message: `Título "${lesson.title}" não corresponde ao conteúdo`,
      severity: 'medium'
    });
  }
  
  // Verificar se descrição está vazia
  if (!lesson.description || lesson.description.trim().length < 10) {
    issues.push({
      type: 'missing_description',
      message: 'Descrição muito curta ou ausente',
      severity: 'low'
    });
  }
  
  return issues;
}

/**
 * Verifica problemas matemáticos
 */
function checkMathProblems(lesson) {
  const issues = [];
  
  if (lesson.type !== 'math-problems') {
    return issues;
  }
  
  if (!lesson.questions || lesson.questions.length === 0) {
    issues.push({
      type: 'missing_questions',
      message: 'Lição de problemas matemáticos sem perguntas',
      severity: 'high'
    });
    return issues;
  }
  
  // Verificar cada problema matemático
  lesson.questions.forEach((q, index) => {
    // Verificar se tem pergunta
    if (!q.question || q.question.trim().length < 10) {
      issues.push({
        type: 'invalid_question',
        message: `Problema ${index + 1} sem pergunta válida`,
        severity: 'high'
      });
    }
    
    // Verificar se tem resposta
    if (q.correctAnswer === undefined || q.correctAnswer === null || q.correctAnswer === 'N/A') {
      issues.push({
        type: 'missing_answer',
        message: `Problema ${index + 1} sem resposta correta`,
        severity: 'high'
      });
    }
    
    // Verificar se tem explicação
    if (!q.explanation || q.explanation.trim().length < 10) {
      issues.push({
        type: 'missing_explanation',
        message: `Problema ${index + 1} sem explicação`,
        severity: 'medium'
      });
    }
  });
  
  return issues;
}

/**
 * Verifica conteúdo de simulações
 */
function checkSimulation(lesson) {
  const issues = [];
  
  if (lesson.type !== 'simulation' && lesson.type !== 'shopping-simulation') {
    return issues;
  }
  
  const content = lesson.fullContent || {};
  
  // Verificar se tem scenario
  if (!content.scenario && !content.phases) {
    issues.push({
      type: 'missing_scenario',
      message: 'Simulação sem cenário ou fases',
      severity: 'high'
    });
  }
  
  // Verificar se tem opções/choices
  if (content.phases) {
    const hasChoices = content.phases.some(phase => 
      phase.choices && phase.choices.length > 0
    );
    
    if (!hasChoices) {
      issues.push({
        type: 'missing_choices',
        message: 'Simulação com fases mas sem opções/choices',
        severity: 'high'
      });
    }
  }
  
  // Verificar se questions está mostrando [object Object]
  if (lesson.questions && lesson.questions.length > 0) {
    const hasObjectObject = lesson.questions.some(q => 
      String(q.question).includes('[object Object]')
    );
    
    if (hasObjectObject) {
      issues.push({
        type: 'object_object_issue',
        message: 'Pergunta mostrando [object Object] - conteúdo não extraído corretamente',
        severity: 'medium'
      });
    }
  }
  
  return issues;
}

/**
 * Verifica lições interativas sem conteúdo
 */
function checkInteractiveContent(lesson) {
  const issues = [];
  
  const interactiveTypes = [
    'budget-distribution',
    'goals',
    'drag-drop',
    'classify',
    'match',
    'price-comparison'
  ];
  
  if (!interactiveTypes.includes(lesson.type)) {
    return issues;
  }
  
  const content = lesson.fullContent || {};
  
  // Verificar se tem conteúdo mínimo
  if (Object.keys(content).length === 0) {
    issues.push({
      type: 'empty_content',
      message: 'Lição interativa sem conteúdo',
      severity: 'high'
    });
    return issues;
  }
  
  // Verificações específicas por tipo
  if (lesson.type === 'budget-distribution') {
    if (!content.categories || content.categories.length === 0) {
      issues.push({
        type: 'missing_categories',
        message: 'Distribuição de orçamento sem categorias',
        severity: 'high'
      });
    }
    
    if (!content.gameConfig || !content.gameConfig.totalBudget) {
      issues.push({
        type: 'missing_budget',
        message: 'Distribuição de orçamento sem orçamento total',
        severity: 'high'
      });
    }
  }
  
  if (lesson.type === 'match') {
    if (!content.pairs || content.pairs.length === 0) {
      issues.push({
        type: 'missing_pairs',
        message: 'Lição de associação sem pares',
        severity: 'high'
      });
    }
  }
  
  if (lesson.type === 'drag-drop') {
    if (!content.items || content.items.length === 0) {
      issues.push({
        type: 'missing_items',
        message: 'Arraste e solte sem itens',
        severity: 'high'
      });
    }
    
    if (!content.categories || content.categories.length === 0) {
      issues.push({
        type: 'missing_categories',
        message: 'Arraste e solte sem categorias',
        severity: 'high'
      });
    }
  }
  
  if (lesson.type === 'goals') {
    if (!content.goals || content.goals.length === 0) {
      issues.push({
        type: 'missing_goals',
        message: 'Lição de metas sem metas',
        severity: 'high'
      });
    }
  }
  
  return issues;
}

/**
 * Verifica problemas gerais
 */
function checkGeneralIssues(lesson) {
  const issues = [];
  
  // Verificar se fullContent existe
  if (!lesson.fullContent || Object.keys(lesson.fullContent).length === 0) {
    issues.push({
      type: 'no_full_content',
      message: 'Lição sem conteúdo completo (fullContent vazio)',
      severity: 'critical'
    });
  }
  
  // Verificar se deveria ter perguntas mas não tem
  const shouldHave = shouldHaveQuestions(lesson.type, lesson.title);
  if (shouldHave === true && (!lesson.questions || lesson.questions.length === 0)) {
    issues.push({
      type: 'missing_required_questions',
      message: `Tipo "${lesson.type}" deveria ter perguntas mas não tem`,
      severity: 'high'
    });
  }
  
  // Verificar se tem perguntas mas não deveria
  if (shouldHave === false && lesson.questions && lesson.questions.length > 0) {
    // Isso não é necessariamente um problema, pode ser conteúdo extraído
  }
  
  // Verificar se difficulty está no range válido
  if (lesson.difficulty < 1 || lesson.difficulty > 9) {
    issues.push({
      type: 'invalid_difficulty',
      message: `Dificuldade ${lesson.difficulty} fora do range válido (1-9)`,
      severity: 'medium'
    });
  }
  
  // Verificar se estimatedTime é razoável
  if (lesson.estimatedTime < 5 || lesson.estimatedTime > 60) {
    issues.push({
      type: 'unusual_time',
      message: `Tempo estimado ${lesson.estimatedTime} min parece incomum`,
      severity: 'low'
    });
  }
  
  return issues;
}

/**
 * Analisa uma lição completa
 */
function analyzeLesson(lesson, index) {
  const allIssues = [];
  
  // Verificações gerais
  allIssues.push(...checkGeneralIssues(lesson));
  
  // Verificações de coerência
  allIssues.push(...checkCoherence(lesson));
  
  // Verificações específicas por tipo
  if (lesson.type === 'math-problems') {
    allIssues.push(...checkMathProblems(lesson));
  }
  
  if (lesson.type === 'simulation' || lesson.type === 'shopping-simulation') {
    allIssues.push(...checkSimulation(lesson));
  }
  
  if (['budget-distribution', 'goals', 'drag-drop', 'classify', 'match'].includes(lesson.type)) {
    allIssues.push(...checkInteractiveContent(lesson));
  }
  
  return {
    lesson: {
      id: lesson.id,
      title: lesson.title,
      gradeId: lesson.gradeId,
      module: lesson.module,
      type: lesson.type,
      typeName: lesson.typeName
    },
    issues: allIssues,
    hasIssues: allIssues.length > 0
  };
}

/**
 * Função principal
 */
function analyzeAllLessons() {
  log.title('═══════════════════════════════════════════════════════════');
  log.title('🔍 ANÁLISE DETALHADA DO CONTEÚDO DAS LIÇÕES');
  log.title('═══════════════════════════════════════════════════════════');
  
  try {
    // Ler o JSON
    const jsonPath = path.join(__dirname, 'lessons-content-export.json');
    
    if (!fs.existsSync(jsonPath)) {
      log.error(`Arquivo não encontrado: ${jsonPath}`);
      log.info('Execute primeiro: node validate-lessons-structure.js -e');
      process.exit(1);
    }
    
    log.info(`Lendo arquivo: ${jsonPath}`);
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    log.success(`Arquivo lido com sucesso!`);
    log.info(`Total de lições: ${jsonData.lessons.length}`);
    
    // Analisar cada lição
    log.section('\n📊 Analisando lições...');
    
    const results = jsonData.lessons.map((lesson, index) => 
      analyzeLesson(lesson, index)
    );
    
    // Separar lições com e sem problemas
    const lessonsWithIssues = results.filter(r => r.hasIssues);
    const lessonsWithoutIssues = results.filter(r => !r.hasIssues);
    
    // Estatísticas
    log.title('\n═══════════════════════════════════════════════════════════');
    log.title('📈 ESTATÍSTICAS GERAIS');
    log.title('═══════════════════════════════════════════════════════════');
    
    log.info(`Total de lições analisadas: ${results.length}`);
    log.success(`Lições sem problemas: ${lessonsWithoutIssues.length}`);
    log.error(`Lições com problemas: ${lessonsWithIssues.length}`);
    
    // Agrupar problemas por tipo
    const problemsByType = {};
    const problemsBySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    lessonsWithIssues.forEach(result => {
      result.issues.forEach(issue => {
        if (!problemsByType[issue.type]) {
          problemsByType[issue.type] = 0;
        }
        problemsByType[issue.type]++;
        problemsBySeverity[issue.severity]++;
      });
    });
    
    log.section('\n📋 PROBLEMAS POR TIPO:');
    Object.entries(problemsByType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        log.warn(`  ${type}: ${count} ocorrências`);
      });
    
    log.section('\n⚠️  PROBLEMAS POR SEVERIDADE:');
    log.error(`  Crítico: ${problemsBySeverity.critical}`);
    log.error(`  Alto: ${problemsBySeverity.high}`);
    log.warn(`  Médio: ${problemsBySeverity.medium}`);
    log.info(`  Baixo: ${problemsBySeverity.low}`);
    
    // Detalhar lições com problemas
    if (lessonsWithIssues.length > 0) {
      log.title('\n═══════════════════════════════════════════════════════════');
      log.title('❌ LIÇÕES COM PROBLEMAS');
      log.title('═══════════════════════════════════════════════════════════');
      
      // Agrupar por severidade
      const criticalIssues = lessonsWithIssues.filter(r => 
        r.issues.some(i => i.severity === 'critical')
      );
      
      const highIssues = lessonsWithIssues.filter(r => 
        r.issues.some(i => i.severity === 'high') && 
        !r.issues.some(i => i.severity === 'critical')
      );
      
      if (criticalIssues.length > 0) {
        log.section('\n🔴 PROBLEMAS CRÍTICOS:');
        criticalIssues.forEach(result => {
          log.error(`\n  ${result.lesson.gradeId} - Módulo ${result.lesson.module} - "${result.lesson.title}"`);
          log.error(`  Tipo: ${result.lesson.typeName}`);
          result.issues
            .filter(i => i.severity === 'critical')
            .forEach(issue => {
              log.error(`    ❌ ${issue.message}`);
            });
        });
      }
      
      if (highIssues.length > 0) {
        log.section('\n🟠 PROBLEMAS ALTOS:');
        highIssues.slice(0, 20).forEach(result => {
          log.warn(`\n  ${result.lesson.gradeId} - Módulo ${result.lesson.module} - "${result.lesson.title}"`);
          log.warn(`  Tipo: ${result.lesson.typeName}`);
          result.issues
            .filter(i => i.severity === 'high')
            .forEach(issue => {
              log.warn(`    ⚠️  ${issue.message}`);
            });
        });
        
        if (highIssues.length > 20) {
          log.info(`\n  ... e mais ${highIssues.length - 20} lições com problemas altos`);
        }
      }
      
      // Mostrar todas as lições com problemas (resumo)
      log.section('\n📝 RESUMO COMPLETO DE PROBLEMAS:');
      lessonsWithIssues.forEach(result => {
        const severityCounts = {
          critical: result.issues.filter(i => i.severity === 'critical').length,
          high: result.issues.filter(i => i.severity === 'high').length,
          medium: result.issues.filter(i => i.severity === 'medium').length,
          low: result.issues.filter(i => i.severity === 'low').length
        };
        
        const severityIcon = severityCounts.critical > 0 ? '🔴' : 
                           severityCounts.high > 0 ? '🟠' : 
                           severityCounts.medium > 0 ? '🟡' : '🟢';
        
        log.debug(`${severityIcon} ${result.lesson.gradeId} - "${result.lesson.title}" (${result.issues.length} problemas)`);
      });
    }
    
    // Lições sem problemas
    if (lessonsWithoutIssues.length > 0) {
      log.title('\n═══════════════════════════════════════════════════════════');
      log.title('✅ LIÇÕES SEM PROBLEMAS');
      log.title('═══════════════════════════════════════════════════════════');
      log.success(`${lessonsWithoutIssues.length} lições estão corretas!`);
    }
    
    // Resumo final
    log.title('\n═══════════════════════════════════════════════════════════');
    log.title('📊 RESUMO FINAL');
    log.title('═══════════════════════════════════════════════════════════');
    
    const totalProblems = Object.values(problemsBySeverity).reduce((a, b) => a + b, 0);
    const problemRate = ((lessonsWithIssues.length / results.length) * 100).toFixed(1);
    
    log.info(`Taxa de lições com problemas: ${problemRate}%`);
    log.info(`Total de problemas encontrados: ${totalProblems}`);
    
    if (problemsBySeverity.critical > 0) {
      log.error(`\n⚠️  ATENÇÃO: ${problemsBySeverity.critical} problema(s) CRÍTICO(S) encontrado(s)!`);
      log.error('Estes problemas devem ser corrigidos imediatamente.');
    }
    
    if (problemsBySeverity.high > 0) {
      log.warn(`\n⚠️  ${problemsBySeverity.high} problema(s) de ALTA prioridade encontrado(s).`);
      log.warn('Recomenda-se corrigir antes de validar o conteúdo.');
    }
    
  } catch (error) {
    log.error(`\n❌ Erro: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  analyzeAllLessons();
}

module.exports = { analyzeAllLessons, analyzeLesson };
