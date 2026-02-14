const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const Lesson = require('../models/Lesson');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware para verificar se é administrador
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas administradores podem gerenciar lições.',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

/**
 * GET /api/admin/lessons
 * Listar todas as lições (com filtros opcionais)
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📚 [ADMIN LESSONS] Requisição recebida para listar lições');
    const { type, gradeId, module, isActive } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (gradeId) filter.gradeId = gradeId;
    if (module) filter.module = parseInt(module);
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    console.log('📚 [ADMIN LESSONS] Filtros aplicados:', filter);
    
    const lessons = await Lesson.find(filter)
      .sort({ gradeId: 1, module: 1, order: 1 })
      .lean();
    
    console.log(`📚 [ADMIN LESSONS] ${lessons.length} lições encontradas`);
    
    res.json(lessons);
  } catch (error) {
    console.error('❌ [ADMIN LESSONS] Erro ao listar lições:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/lessons/types
 * Listar tipos de gamificação disponíveis
 */
router.get('/types', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const types = [
      { value: 'quiz', label: 'Quiz (Perguntas e Respostas)', icon: '❓' },
      { value: 'drag-drop', label: 'Arraste e Solte', icon: '🖱️' },
      { value: 'goals', label: 'Metas Financeiras', icon: '🎯' },
      { value: 'match', label: 'Associação (Match)', icon: '🔗' },
      { value: 'budget-distribution', label: 'Distribuição de Orçamento', icon: '💰' },
      { value: 'math-problems', label: 'Problemas Matemáticos', icon: '🔢' },
      { value: 'simulation', label: 'Simulação', icon: '🎮' },
      { value: 'choices', label: 'Escolha Múltipla', icon: '📝' },
      { value: 'classify', label: 'Classificação', icon: '🏷️' },
      { value: 'input', label: 'Resposta Aberta', icon: '✍️' },
      { value: 'shopping-simulation', label: 'Simulação de Compras', icon: '🛒' },
      { value: 'price-comparison', label: 'Comparação de Preços', icon: '💲' },
      { value: 'budget-choices', label: 'Escolhas Orçamentárias', icon: '💳' },
      { value: 'categories-simulation', label: 'Simulação por Categorias', icon: '📊' },
      { value: 'progress-game', label: 'Jogo de Progresso', icon: '🎲' },
      { value: 'shopping-cart', label: 'Carrinho de Compras', icon: '🛍️' }
    ];
    
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/lessons/grades
 * Listar séries disponíveis
 */
router.get('/grades', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const grades = [
      { value: '6º Ano', label: '6º Ano' },
      { value: '7º Ano', label: '7º Ano' },
      { value: '8º Ano', label: '8º Ano' },
      { value: '9º Ano', label: '9º Ano' },
      { value: '1º Ano EM', label: '1º Ano EM' },
      { value: '2º Ano EM', label: '2º Ano EM' },
      { value: '3º Ano EM', label: '3º Ano EM' }
    ];
    
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/lessons/export-pdf/quiz
 * Exportar lições do tipo Quiz em PDF
 */
router.get('/export-pdf/quiz', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📄 [PDF EXPORT] Iniciando exportação de lições Quiz');
    
    // Buscar todas as lições do tipo quiz
    const filter = { type: 'quiz' };
    const { gradeId, isActive } = req.query;
    
    if (gradeId) filter.gradeId = gradeId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const lessons = await Lesson.find(filter)
      .sort({ gradeId: 1, module: 1, order: 1 })
      .lean();
    
    console.log(`📄 [PDF EXPORT] ${lessons.length} lições Quiz encontradas`);
    
    if (lessons.length === 0) {
      return res.status(404).json({ error: 'Nenhuma lição Quiz encontrada' });
    }
    
    // Caminho da fonte Cherry Bomb One
    const fontPath = path.join(__dirname, '..', 'fonts', 'CherryBombOne-Regular.ttf');
    const hasCherryBombFont = fs.existsSync(fontPath);
    
    // Criar documento PDF
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: 'Relatório de Lições - Quiz',
        Author: 'YuFin',
        Subject: 'Lições do tipo Quiz (Perguntas e Respostas)',
        Creator: 'YuFin - Sistema de Educação Financeira'
      }
    });
    
    // Registrar fonte Cherry Bomb One se disponível
    if (hasCherryBombFont) {
      doc.registerFont('CherryBombOne', fontPath);
    }
    
    // Configurar headers para download
    const filename = `licoes-quiz-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe do PDF para a resposta ANTES de gerar conteúdo
    doc.pipe(res);
    
    // Gerar conteúdo do PDF (passar informação sobre a fonte)
    generateQuizPDF(doc, lessons, hasCherryBombFont);
    
    // Finalizar PDF (isso vai fechar o stream)
    doc.end();
    
    console.log('✅ [PDF EXPORT] PDF gerado com sucesso');
  } catch (error) {
    console.error('❌ [PDF EXPORT] Erro ao gerar PDF:', error);
    console.error('❌ [PDF EXPORT] Stack:', error.stack);
    
    // Se a resposta já foi iniciada, não podemos enviar JSON
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * Função para gerar PDF de lições Quiz
 */
function generateQuizPDF(doc, lessons, hasCherryBombFont = false) {
  // Cores (inspiradas no frontend de licenças)
  const colors = {
    primary: '#EE9116',      // Laranja principal YuFin
    secondary: '#FFB300',    // Amarelo de destaque
    text: '#333333',         // Texto escuro
    lightText: '#666666',    // Texto claro
    success: '#28a745',      // Verde (ativa)
    danger: '#dc3545',       // Vermelho (inativa)
    border: '#e5e5e5'        // Borda suave
  };

  // Converter hex para RGB (PDFKit não aceita string hex diretamente em todos os métodos)
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 };
  };

  const primaryRgb = hexToRgb(colors.primary);
  const textRgb = hexToRgb(colors.text);
  const lightTextRgb = hexToRgb(colors.lightText);
  const successRgb = hexToRgb(colors.success);
  const dangerRgb = hexToRgb(colors.danger);

  // Função auxiliar para adicionar nova página quando estiver muito próximo do fim
  const checkPageBreak = (requiredHeight = 100) => {
    if (doc.y + requiredHeight > doc.page.height - 60) {
      doc.addPage();
      return true;
    }
    return false;
  };

  // ===== CAPA REFINADA =====
  // Cabeçalho com marca YuFin usando Cherry Bomb One se disponível
  const yufinFont = hasCherryBombFont ? 'CherryBombOne' : 'Helvetica-Bold';
  doc
    .font(yufinFont)
    .fontSize(28)
    .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    .text('YüFin', { align: 'center' });

  // Linha de separação
  doc
    .moveDown(0.5)
    .moveTo(80, doc.y)
    .lineTo(doc.page.width - 80, doc.y)
    .strokeColor(colors.border)
    .lineWidth(1)
    .stroke();

  doc.moveDown(1.5);

  // Título principal
  doc
    .fontSize(22)
    .fillColor(textRgb.r, textRgb.g, textRgb.b)
    .font('Helvetica-Bold')
    .text('Relatório de Lições', { align: 'center' });

  doc.moveDown(0.7);

  // Tipo de gamificação
  doc
    .fontSize(16)
    .font('Helvetica')
    .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    .text('Tipo de Gamificação: Quiz (Perguntas e Respostas)', {
      align: 'center'
    });

  doc.moveDown(1.2);

  // Linha com total e data
  const exportDate = new Date().toLocaleDateString('pt-BR');
  const totalText = `Total de lições: ${lessons.length}`;
  const dateText = `Data de exportação: ${exportDate}`;

  doc
    .fontSize(12)
    .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
    .text(totalText, { align: 'center' });

  doc.moveDown(0.3);

  doc
    .fontSize(12)
    .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
    .text(dateText, { align: 'center' });

  // Espaço final antes de mudar de página
  doc.moveDown(2);
  doc.addPage();

  // ===== AGRUPAMENTO POR SÉRIE COM ORDEM FIXA =====
  const lessonsByGrade = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.gradeId]) {
      acc[lesson.gradeId] = [];
    }
    acc[lesson.gradeId].push(lesson);
    return acc;
  }, {});

  // Ordem fixa desejada das séries
  const orderedGrades = [
    '6º Ano',
    '7º Ano',
    '8º Ano',
    '9º Ano',
    '1º Ano EM',
    '2º Ano EM',
    '3º Ano EM'
  ];

  orderedGrades.forEach((gradeId) => {
    const gradeLessons = lessonsByGrade[gradeId];
    if (!gradeLessons || gradeLessons.length === 0) {
      return;
    }

    checkPageBreak(150);
    
    // Título da seção (série)
    doc.fontSize(18)
       .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
       .font('Helvetica-Bold')
       .text(gradeId, { underline: true });
    
    doc.moveDown(0.5);
    
    // Para cada lição
    gradeLessons.forEach((lesson, index) => {
      checkPageBreak(300);
      
      // Card da lição (simulando o card do frontend)
      // Linha separadora sutil antes do card
      doc.moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .strokeColor('#e5e5e5')
         .lineWidth(0.5)
         .stroke();
      
      doc.moveDown(0.5);
      
      // Header do card (apenas título da lição)
      doc.fontSize(14)
         .fillColor(textRgb.r, textRgb.g, textRgb.b)
         .font('Helvetica-Bold')
         .text(lesson.title);
      
      doc.moveDown(0.3);
      
      // Removidos subtítulo/descrição e metadados para manter PDF mais limpo
      doc.moveDown(0.5);
      
      // Conteúdo: Perguntas
      if (lesson.content && lesson.content.questions && lesson.content.questions.length > 0) {
        doc.fontSize(12)
           .fillColor(textRgb.r, textRgb.g, textRgb.b)
           .font('Helvetica-Bold')
           .text('PERGUNTAS:', { underline: true });
        
        doc.moveDown(0.3);
        
        lesson.content.questions.forEach((question, qIndex) => {
          checkPageBreak(150);
          
          // Número e texto da pergunta
          doc.fontSize(11)
             .fillColor(textRgb.r, textRgb.g, textRgb.b)
             .font('Helvetica-Bold')
             .text(`${qIndex + 1}. ${question.question || 'Sem pergunta'}`, { indent: 10 });
          
          doc.moveDown(0.2);
          
          // Alternativas
          const options = question.options || question.alternatives || [];
          options.forEach((option, optIndex) => {
            const letter = String.fromCharCode(65 + optIndex); // A, B, C, D
            
            // Verificar se é a resposta correta
            let isCorrect = false;
            if (question.correctAnswer !== undefined) {
              isCorrect = question.correctAnswer === optIndex || 
                         question.correctAnswer === letter ||
                         (typeof question.correctAnswer === 'string' && 
                          question.correctAnswer.toLowerCase() === letter.toLowerCase());
            } else if (option.correct !== undefined) {
              isCorrect = option.correct === true;
            }
            
            const optionText = typeof option === 'string' ? option : (option.text || option.label || option);
            // Marcar alternativa correta com texto
            const correctMark = isCorrect ? ' (Correta)' : '';
            
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica')
               .text(`   ${letter}) ${optionText}${correctMark}`, { indent: 20 });
          });
          
          // Explicação (se houver)
          if (question.explanation) {
            doc.moveDown(0.2);
            doc.fontSize(9)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica-Oblique')
               .text(`   Explicacao: ${question.explanation}`, { indent: 20 });
          }
          
          doc.moveDown(0.4);
        });
      } else {
        // Formato antigo: question e options diretos
        if (lesson.content && lesson.content.question) {
          doc.fontSize(12)
             .fillColor(textRgb.r, textRgb.g, textRgb.b)
             .font('Helvetica-Bold')
             .text('PERGUNTA:', { underline: true });
          
          doc.moveDown(0.3);
          
          doc.fontSize(11)
             .fillColor(textRgb.r, textRgb.g, textRgb.b)
             .font('Helvetica')
             .text(lesson.content.question, { indent: 10 });
          
          doc.moveDown(0.3);
          
          const options = lesson.content.options || [];
          options.forEach((option, optIndex) => {
            const letter = String.fromCharCode(65 + optIndex);
            const optionText = typeof option === 'string' ? option : (option.text || option.label || option);
            const isCorrect = option.correct === true || (typeof option === 'object' && option.correct);
            const correctMark = isCorrect ? ' (Correta)' : '';
            
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica')
               .text(`   ${letter}) ${optionText}${correctMark}`, { indent: 20 });
          });
        } else {
          doc.fontSize(10)
             .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
             .font('Helvetica-Oblique')
             .text('   AVISO: Conteudo nao disponivel ou formato nao reconhecido', { indent: 10 });
        }
      }
      
      doc.moveDown(1);
      
      // Linha separadora entre cards
      if (index < gradeLessons.length - 1) {
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y)
           .lineTo(doc.page.width - 50, doc.y)
           .strokeColor('#e5e5e5')
           .lineWidth(0.5)
           .stroke();
        
        doc.moveDown(0.5);
      }
    });
    
    doc.moveDown(1);
  });
  
  // Rodapé será adicionado depois (simplificado por enquanto)
}

/**
 * GET /api/admin/lessons/export-pdf/budget-distribution
 * Exportar lições do tipo Distribuição de Orçamento em PDF
 */
router.get('/export-pdf/budget-distribution', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📄 [PDF EXPORT] Iniciando exportação de lições Budget Distribution');
    
    // Buscar todas as lições do tipo budget-distribution
    const filter = { type: 'budget-distribution' };
    const { gradeId, isActive } = req.query;
    
    if (gradeId) filter.gradeId = gradeId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const lessons = await Lesson.find(filter)
      .sort({ gradeId: 1, module: 1, order: 1 })
      .lean();
    
    console.log(`📄 [PDF EXPORT] ${lessons.length} lições Budget Distribution encontradas`);
    
    if (lessons.length === 0) {
      return res.status(404).json({ error: 'Nenhuma lição Budget Distribution encontrada' });
    }
    
    // Caminho da fonte Cherry Bomb One
    const fontPath = path.join(__dirname, '..', 'fonts', 'CherryBombOne-Regular.ttf');
    const hasCherryBombFont = fs.existsSync(fontPath);
    
    // Criar documento PDF
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: 'Relatório de Lições - Distribuição de Orçamento',
        Author: 'YuFin',
        Subject: 'Lições do tipo Distribuição de Orçamento',
        Creator: 'YuFin - Sistema de Educação Financeira'
      }
    });
    
    // Registrar fonte Cherry Bomb One se disponível
    if (hasCherryBombFont) {
      doc.registerFont('CherryBombOne', fontPath);
    }
    
    // Configurar headers para download
    const filename = `licoes-distribuicao-orcamento-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe do PDF para a resposta ANTES de gerar conteúdo
    doc.pipe(res);
    
    // Gerar conteúdo do PDF
    generateBudgetDistributionPDF(doc, lessons, hasCherryBombFont);
    
    // Finalizar PDF (isso vai fechar o stream)
    doc.end();
    
    console.log('✅ [PDF EXPORT] PDF gerado com sucesso');
  } catch (error) {
    console.error('❌ [PDF EXPORT] Erro ao gerar PDF:', error);
    console.error('❌ [PDF EXPORT] Stack:', error.stack);
    
    // Se a resposta já foi iniciada, não podemos enviar JSON
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * GET /api/admin/lessons/export-pdf/simulation
 * Exportar lições do tipo Simulação em PDF
 */
router.get('/export-pdf/simulation', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📄 [PDF EXPORT] Iniciando exportação de lições Simulation');
    
    // Buscar todas as lições do tipo simulation
    const filter = { type: 'simulation' };
    const { gradeId, isActive } = req.query;
    
    if (gradeId) filter.gradeId = gradeId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const lessons = await Lesson.find(filter)
      .sort({ gradeId: 1, module: 1, order: 1 })
      .lean();
    
    console.log(`📄 [PDF EXPORT] ${lessons.length} lições Simulation encontradas`);
    
    if (lessons.length === 0) {
      return res.status(404).json({ error: 'Nenhuma lição Simulation encontrada' });
    }
    
    // Caminho da fonte Cherry Bomb One
    const fontPath = path.join(__dirname, '..', 'fonts', 'CherryBombOne-Regular.ttf');
    const hasCherryBombFont = fs.existsSync(fontPath);
    
    // Criar documento PDF
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: 'Relatório de Lições - Simulação',
        Author: 'YuFin',
        Subject: 'Lições do tipo Simulação',
        Creator: 'YuFin - Sistema de Educação Financeira'
      }
    });
    
    // Registrar fonte Cherry Bomb One se disponível
    if (hasCherryBombFont) {
      doc.registerFont('CherryBombOne', fontPath);
    }
    
    // Configurar headers para download
    const filename = `licoes-simulacao-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe do PDF para a resposta ANTES de gerar conteúdo
    doc.pipe(res);
    
    // Gerar conteúdo do PDF
    generateSimulationPDF(doc, lessons, hasCherryBombFont);
    
    // Finalizar PDF (isso vai fechar o stream)
    doc.end();
    
    console.log('✅ [PDF EXPORT] PDF gerado com sucesso');
  } catch (error) {
    console.error('❌ [PDF EXPORT] Erro ao gerar PDF:', error);
    console.error('❌ [PDF EXPORT] Stack:', error.stack);
    
    // Se a resposta já foi iniciada, não podemos enviar JSON
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * GET /api/admin/lessons/export-pdf/match
 * Exportar lições do tipo Associação (Match) em PDF
 */
router.get('/export-pdf/match', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📄 [PDF EXPORT] Iniciando exportação de lições Match');
    
    // Buscar todas as lições do tipo match
    const filter = { type: 'match' };
    const { gradeId, isActive } = req.query;
    
    if (gradeId) filter.gradeId = gradeId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const lessons = await Lesson.find(filter)
      .sort({ gradeId: 1, module: 1, order: 1 })
      .lean();
    
    console.log(`📄 [PDF EXPORT] ${lessons.length} lições Match encontradas`);
    
    if (lessons.length === 0) {
      return res.status(404).json({ error: 'Nenhuma lição Match encontrada' });
    }
    
    // Caminho da fonte Cherry Bomb One
    const fontPath = path.join(__dirname, '..', 'fonts', 'CherryBombOne-Regular.ttf');
    const hasCherryBombFont = fs.existsSync(fontPath);
    
    // Criar documento PDF
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: 'Relatório de Lições - Associação (Match)',
        Author: 'YuFin',
        Subject: 'Lições do tipo Associação (Match)',
        Creator: 'YuFin - Sistema de Educação Financeira'
      }
    });
    
    // Registrar fonte Cherry Bomb One se disponível
    if (hasCherryBombFont) {
      doc.registerFont('CherryBombOne', fontPath);
    }
    
    // Configurar headers para download
    const filename = `licoes-associacao-match-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe do PDF para a resposta ANTES de gerar conteúdo
    doc.pipe(res);
    
    // Gerar conteúdo do PDF
    generateMatchPDF(doc, lessons, hasCherryBombFont);
    
    // Finalizar PDF (isso vai fechar o stream)
    doc.end();
    
    console.log('✅ [PDF EXPORT] PDF gerado com sucesso');
  } catch (error) {
    console.error('❌ [PDF EXPORT] Erro ao gerar PDF:', error);
    console.error('❌ [PDF EXPORT] Stack:', error.stack);
    
    // Se a resposta já foi iniciada, não podemos enviar JSON
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * GET /api/admin/lessons/export-pdf/drag-drop
 * Exportar lições do tipo Arraste e Solte em PDF
 */
router.get('/export-pdf/drag-drop', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📄 [PDF EXPORT] Iniciando exportação de lições Drag-Drop');
    
    // Buscar todas as lições do tipo drag-drop
    const filter = { type: 'drag-drop' };
    const { gradeId, isActive } = req.query;
    
    if (gradeId) filter.gradeId = gradeId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const lessons = await Lesson.find(filter)
      .sort({ gradeId: 1, module: 1, order: 1 })
      .lean();
    
    console.log(`📄 [PDF EXPORT] ${lessons.length} lições Drag-Drop encontradas`);
    
    if (lessons.length === 0) {
      return res.status(404).json({ error: 'Nenhuma lição Drag-Drop encontrada' });
    }
    
    // Caminho da fonte Cherry Bomb One
    const fontPath = path.join(__dirname, '..', 'fonts', 'CherryBombOne-Regular.ttf');
    const hasCherryBombFont = fs.existsSync(fontPath);
    
    // Criar documento PDF
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: 'Relatório de Lições - Arraste e Solte',
        Author: 'YuFin',
        Subject: 'Lições do tipo Arraste e Solte',
        Creator: 'YuFin - Sistema de Educação Financeira'
      }
    });
    
    // Registrar fonte Cherry Bomb One se disponível
    if (hasCherryBombFont) {
      doc.registerFont('CherryBombOne', fontPath);
    }
    
    // Configurar headers para download
    const filename = `licoes-arraste-solte-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe do PDF para a resposta ANTES de gerar conteúdo
    doc.pipe(res);
    
    // Gerar conteúdo do PDF
    generateDragDropPDF(doc, lessons, hasCherryBombFont);
    
    // Finalizar PDF (isso vai fechar o stream)
    doc.end();
    
    console.log('✅ [PDF EXPORT] PDF gerado com sucesso');
  } catch (error) {
    console.error('❌ [PDF EXPORT] Erro ao gerar PDF:', error);
    console.error('❌ [PDF EXPORT] Stack:', error.stack);
    
    // Se a resposta já foi iniciada, não podemos enviar JSON
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * GET /api/admin/lessons/export-pdf/goals
 * Exportar lições do tipo Metas Financeiras em PDF
 */
router.get('/export-pdf/goals', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📄 [PDF EXPORT] Iniciando exportação de lições Goals');
    
    // Buscar todas as lições do tipo goals
    const filter = { type: 'goals' };
    const { gradeId, isActive } = req.query;
    
    if (gradeId) filter.gradeId = gradeId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const lessons = await Lesson.find(filter)
      .sort({ gradeId: 1, module: 1, order: 1 })
      .lean();
    
    console.log(`📄 [PDF EXPORT] ${lessons.length} lições Goals encontradas`);
    
    if (lessons.length === 0) {
      return res.status(404).json({ error: 'Nenhuma lição Goals encontrada' });
    }
    
    // Caminho da fonte Cherry Bomb One
    const fontPath = path.join(__dirname, '..', 'fonts', 'CherryBombOne-Regular.ttf');
    const hasCherryBombFont = fs.existsSync(fontPath);
    
    // Criar documento PDF
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: 'Relatório de Lições - Metas Financeiras',
        Author: 'YuFin',
        Subject: 'Lições do tipo Metas Financeiras',
        Creator: 'YuFin - Sistema de Educação Financeira'
      }
    });
    
    // Registrar fonte Cherry Bomb One se disponível
    if (hasCherryBombFont) {
      doc.registerFont('CherryBombOne', fontPath);
    }
    
    // Configurar headers para download
    const filename = `licoes-metas-financeiras-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe do PDF para a resposta ANTES de gerar conteúdo
    doc.pipe(res);
    
    // Gerar conteúdo do PDF
    generateGoalsPDF(doc, lessons, hasCherryBombFont);
    
    // Finalizar PDF (isso vai fechar o stream)
    doc.end();
    
    console.log('✅ [PDF EXPORT] PDF gerado com sucesso');
  } catch (error) {
    console.error('❌ [PDF EXPORT] Erro ao gerar PDF:', error);
    console.error('❌ [PDF EXPORT] Stack:', error.stack);
    
    // Se a resposta já foi iniciada, não podemos enviar JSON
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * GET /api/admin/lessons/export-pdf/math-problems
 * Exportar lições do tipo Problemas Matemáticos em PDF
 */
router.get('/export-pdf/math-problems', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📄 [PDF EXPORT] Iniciando exportação de lições Math Problems');
    
    // Buscar todas as lições do tipo math-problems
    const filter = { type: 'math-problems' };
    const { gradeId, isActive } = req.query;
    
    if (gradeId) filter.gradeId = gradeId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const lessons = await Lesson.find(filter)
      .sort({ gradeId: 1, module: 1, order: 1 })
      .lean();
    
    console.log(`📄 [PDF EXPORT] ${lessons.length} lições Math Problems encontradas`);
    
    if (lessons.length === 0) {
      return res.status(404).json({ error: 'Nenhuma lição Math Problems encontrada' });
    }
    
    // Caminho da fonte Cherry Bomb One
    const fontPath = path.join(__dirname, '..', 'fonts', 'CherryBombOne-Regular.ttf');
    const hasCherryBombFont = fs.existsSync(fontPath);
    
    // Criar documento PDF
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: 'Relatório de Lições - Problemas Matemáticos',
        Author: 'YuFin',
        Subject: 'Lições do tipo Problemas Matemáticos',
        Creator: 'YuFin - Sistema de Educação Financeira'
      }
    });
    
    // Registrar fonte Cherry Bomb One se disponível
    if (hasCherryBombFont) {
      doc.registerFont('CherryBombOne', fontPath);
    }
    
    // Configurar headers para download
    const filename = `licoes-problemas-matematicos-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe do PDF para a resposta ANTES de gerar conteúdo
    doc.pipe(res);
    
    // Gerar conteúdo do PDF
    generateMathProblemsPDF(doc, lessons, hasCherryBombFont);
    
    // Finalizar PDF (isso vai fechar o stream)
    doc.end();
    
    console.log('✅ [PDF EXPORT] PDF gerado com sucesso');
  } catch (error) {
    console.error('❌ [PDF EXPORT] Erro ao gerar PDF:', error);
    console.error('❌ [PDF EXPORT] Stack:', error.stack);
    
    // Se a resposta já foi iniciada, não podemos enviar JSON
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * Função para gerar PDF de lições Budget Distribution
 */
function generateBudgetDistributionPDF(doc, lessons, hasCherryBombFont = false) {
  // Cores (inspiradas no frontend de licenças)
  const colors = {
    primary: '#EE9116',      // Laranja principal YuFin
    secondary: '#FFB300',    // Amarelo de destaque
    text: '#333333',         // Texto escuro
    lightText: '#666666',    // Texto claro
    border: '#e5e5e5'        // Borda suave
  };

  // Converter hex para RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 };
  };

  const primaryRgb = hexToRgb(colors.primary);
  const textRgb = hexToRgb(colors.text);
  const lightTextRgb = hexToRgb(colors.lightText);

  // Função auxiliar para adicionar nova página quando estiver muito próximo do fim
  const checkPageBreak = (requiredHeight = 100) => {
    if (doc.y + requiredHeight > doc.page.height - 60) {
      doc.addPage();
      return true;
    }
    return false;
  };

  // ===== CAPA REFINADA =====
  // Cabeçalho com marca YuFin usando Cherry Bomb One se disponível
  const yufinFont = hasCherryBombFont ? 'CherryBombOne' : 'Helvetica-Bold';
  doc
    .font(yufinFont)
    .fontSize(28)
    .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    .text('YüFin', { align: 'center' });

  // Linha de separação
  doc
    .moveDown(0.5)
    .moveTo(80, doc.y)
    .lineTo(doc.page.width - 80, doc.y)
    .strokeColor(colors.border)
    .lineWidth(1)
    .stroke();

  doc.moveDown(1.5);

  // Título principal
  doc
    .fontSize(22)
    .fillColor(textRgb.r, textRgb.g, textRgb.b)
    .font('Helvetica-Bold')
    .text('Relatório de Lições', { align: 'center' });

  doc.moveDown(0.7);

  // Tipo de gamificação
  doc
    .fontSize(16)
    .font('Helvetica')
    .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    .text('Tipo de Gamificação: Distribuição de Orçamento', {
      align: 'center'
    });

  doc.moveDown(1.2);

  // Linha com total e data
  const exportDate = new Date().toLocaleDateString('pt-BR');
  const totalText = `Total de lições: ${lessons.length}`;
  const dateText = `Data de exportação: ${exportDate}`;

  doc
    .fontSize(12)
    .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
    .text(totalText, { align: 'center' });

  doc.moveDown(0.3);

  doc
    .fontSize(12)
    .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
    .text(dateText, { align: 'center' });

  // Espaço final antes de mudar de página
  doc.moveDown(2);
  doc.addPage();

  // ===== AGRUPAMENTO POR SÉRIE COM ORDEM FIXA =====
  const lessonsByGrade = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.gradeId]) {
      acc[lesson.gradeId] = [];
    }
    acc[lesson.gradeId].push(lesson);
    return acc;
  }, {});

  // Ordem fixa desejada das séries
  const orderedGrades = [
    '6º Ano',
    '7º Ano',
    '8º Ano',
    '9º Ano',
    '1º Ano EM',
    '2º Ano EM',
    '3º Ano EM'
  ];

  orderedGrades.forEach((gradeId) => {
    const gradeLessons = lessonsByGrade[gradeId];
    if (!gradeLessons || gradeLessons.length === 0) {
      return;
    }

    checkPageBreak(150);
    
    // Título da seção (série)
    doc.fontSize(18)
       .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
       .font('Helvetica-Bold')
       .text(gradeId, { underline: true });
    
    doc.moveDown(0.5);
    
    // Para cada lição
    gradeLessons.forEach((lesson, index) => {
      checkPageBreak(300);
      
      // Linha separadora sutil antes do card
      doc.moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .strokeColor('#e5e5e5')
         .lineWidth(0.5)
         .stroke();
      
      doc.moveDown(0.5);
      
      // Título da lição (sem status)
      doc.fontSize(14)
         .fillColor(textRgb.r, textRgb.g, textRgb.b)
         .font('Helvetica-Bold')
         .text(lesson.title);
      
      doc.moveDown(0.5);
      
      // Conteúdo: Orçamento, Categorias e Cenários
      const content = lesson.content || {};
      const gameConfig = content.gameConfig || {};
      
      // Buscar orçamento base (mesma lógica do frontend)
      let baseBudget = gameConfig.totalBudget || content.totalBudget || content.budget;
      if (!baseBudget && content.scenario) {
        const match = content.scenario.match(/R\$ (\d+),00/);
        baseBudget = match ? parseInt(match[1]) : null;
      }
      if (!baseBudget) baseBudget = 5000; // Fallback
      
      const categories = content.categories || [];
      const scenarios = content.scenarios || [];
      
      // Categorias
      if (categories.length > 0) {
        doc.fontSize(12)
           .fillColor(textRgb.r, textRgb.g, textRgb.b)
           .font('Helvetica-Bold')
           .text('CATEGORIAS:', { underline: true });
        
        doc.moveDown(0.3);
        
        categories.forEach((category, catIndex) => {
          checkPageBreak(80);
          
          const catName = category.name || category.id || `Categoria ${catIndex + 1}`;
          const catDesc = category.description || '';
          const suggestedPct = category.suggestedPercentage || 0;
          const suggestedAmount = category.suggestedAmount || 0;
          
          doc.fontSize(11)
             .fillColor(textRgb.r, textRgb.g, textRgb.b)
             .font('Helvetica-Bold')
             .text(`${catIndex + 1}. ${catName}`, { indent: 10 });
          
          if (catDesc) {
            doc.moveDown(0.2);
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica')
               .text(`   ${catDesc}`, { indent: 20 });
          }
          
          doc.moveDown(0.2);
          doc.fontSize(10)
             .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
             .font('Helvetica')
             .text(`   Sugerido: ${suggestedPct}% (R$ ${suggestedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`, { indent: 20 });
          
          doc.moveDown(0.3);
        });
      } else {
        doc.fontSize(10)
           .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
           .font('Helvetica-Oblique')
           .text('   AVISO: Categorias nao disponiveis', { indent: 10 });
      }
      
      doc.moveDown(0.5);
      
      // Cenários
      if (scenarios.length > 0) {
        doc.fontSize(12)
           .fillColor(textRgb.r, textRgb.g, textRgb.b)
           .font('Helvetica-Bold')
           .text('CENARIOS:', { underline: true });
        
        doc.moveDown(0.3);
        
        scenarios.forEach((scenario, scenIndex) => {
          checkPageBreak(150);
          
          const scenTitle = scenario.title || `Cenario ${scenIndex + 1}`;
          const scenDesc = scenario.description || '';
          const scenBudget = scenario.totalBudget || baseBudget;
          
          doc.fontSize(11)
             .fillColor(textRgb.r, textRgb.g, textRgb.b)
             .font('Helvetica-Bold')
             .text(`Cenario ${scenIndex + 1}: ${scenTitle}`, { indent: 10 });
          
          if (scenDesc) {
            doc.moveDown(0.2);
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica')
               .text(`   ${scenDesc}`, { indent: 20 });
          }
          
          doc.moveDown(0.2);
          doc.fontSize(10)
             .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
             .font('Helvetica')
             .text(`   Orcamento: R$ ${scenBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, { indent: 20 });
          
          // Ajustes do cenário
          if (scenario.adjustments && Object.keys(scenario.adjustments).length > 0) {
            doc.moveDown(0.2);
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica-Bold')
               .text(`   Ajustes:`, { indent: 20 });
            
            Object.entries(scenario.adjustments).forEach(([key, adjustment]) => {
              const adj = typeof adjustment === 'object' ? adjustment : {};
              const multiplier = adj.multiplier !== undefined ? adj.multiplier : adjustment;
              const reason = adj.reason || '';
              const maxPct = adj.maxPercentage !== undefined ? adj.maxPercentage : null;
              
              let adjText = `     - ${key}:`;
              if (multiplier !== undefined && multiplier !== null) {
                adjText += ` Multiplicador ${multiplier}`;
              }
              if (maxPct !== undefined && maxPct !== null) {
                adjText += ` (Max: ${maxPct}%)`;
              }
              if (reason) {
                adjText += ` - ${reason}`;
              }
              
              doc.moveDown(0.15);
              doc.fontSize(9)
                 .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
                 .font('Helvetica')
                 .text(adjText, { indent: 20 });
            });
          }
          
          // Oportunidades do cenário
          if (scenario.opportunities && scenario.opportunities.length > 0) {
            doc.moveDown(0.2);
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica-Bold')
               .text(`   Oportunidades:`, { indent: 20 });
            
            scenario.opportunities.forEach((opp) => {
              doc.moveDown(0.15);
              doc.fontSize(9)
                 .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
                 .font('Helvetica')
                 .text(`     • ${opp}`, { indent: 20 });
            });
          }
          
          doc.moveDown(0.4);
        });
      }
      
      doc.moveDown(1);
      
      // Linha separadora entre cards
      if (index < gradeLessons.length - 1) {
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y)
           .lineTo(doc.page.width - 50, doc.y)
           .strokeColor('#e5e5e5')
           .lineWidth(0.5)
           .stroke();
        
        doc.moveDown(0.5);
      }
    });
    
    doc.moveDown(1);
  });
}

/**
 * Função para gerar PDF de lições Simulation
 */
function generateSimulationPDF(doc, lessons, hasCherryBombFont = false) {
  // Cores (inspiradas no frontend de licenças)
  const colors = {
    primary: '#EE9116',      // Laranja principal YuFin
    secondary: '#FFB300',    // Amarelo de destaque
    text: '#333333',         // Texto escuro
    lightText: '#666666',    // Texto claro
    border: '#e5e5e5'        // Borda suave
  };

  // Converter hex para RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 };
  };

  const primaryRgb = hexToRgb(colors.primary);
  const textRgb = hexToRgb(colors.text);
  const lightTextRgb = hexToRgb(colors.lightText);

  // Função auxiliar para adicionar nova página quando estiver muito próximo do fim
  const checkPageBreak = (requiredHeight = 100) => {
    if (doc.y + requiredHeight > doc.page.height - 60) {
      doc.addPage();
      return true;
    }
    return false;
  };

  // ===== CAPA REFINADA =====
  // Cabeçalho com marca YuFin usando Cherry Bomb One se disponível
  const yufinFont = hasCherryBombFont ? 'CherryBombOne' : 'Helvetica-Bold';
  doc
    .font(yufinFont)
    .fontSize(28)
    .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    .text('YüFin', { align: 'center' });

  // Linha de separação
  doc
    .moveDown(0.5)
    .moveTo(80, doc.y)
    .lineTo(doc.page.width - 80, doc.y)
    .strokeColor(colors.border)
    .lineWidth(1)
    .stroke();

  doc.moveDown(1.5);

  // Título principal
  doc
    .fontSize(22)
    .fillColor(textRgb.r, textRgb.g, textRgb.b)
    .font('Helvetica-Bold')
    .text('Relatório de Lições', { align: 'center' });

  doc.moveDown(0.7);

  // Tipo de gamificação
  doc
    .fontSize(16)
    .font('Helvetica')
    .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    .text('Tipo de Gamificação: Simulação', {
      align: 'center'
    });

  doc.moveDown(1.2);

  // Linha com total e data
  const exportDate = new Date().toLocaleDateString('pt-BR');
  const totalText = `Total de lições: ${lessons.length}`;
  const dateText = `Data de exportação: ${exportDate}`;

  doc
    .fontSize(12)
    .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
    .text(totalText, { align: 'center' });

  doc.moveDown(0.3);

  doc
    .fontSize(12)
    .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
    .text(dateText, { align: 'center' });

  // Espaço final antes de mudar de página
  doc.moveDown(2);
  doc.addPage();

  // ===== AGRUPAMENTO POR SÉRIE COM ORDEM FIXA =====
  const lessonsByGrade = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.gradeId]) {
      acc[lesson.gradeId] = [];
    }
    acc[lesson.gradeId].push(lesson);
    return acc;
  }, {});

  // Ordem fixa desejada das séries
  const orderedGrades = [
    '6º Ano',
    '7º Ano',
    '8º Ano',
    '9º Ano',
    '1º Ano EM',
    '2º Ano EM',
    '3º Ano EM'
  ];

  orderedGrades.forEach((gradeId) => {
    const gradeLessons = lessonsByGrade[gradeId];
    if (!gradeLessons || gradeLessons.length === 0) {
      return;
    }

    checkPageBreak(150);
    
    // Título da seção (série)
    doc.fontSize(18)
       .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
       .font('Helvetica-Bold')
       .text(gradeId, { underline: true });
    
    doc.moveDown(0.5);
    
    // Para cada lição
    gradeLessons.forEach((lesson, index) => {
      checkPageBreak(300);
      
      // Linha separadora sutil antes do card
      doc.moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .strokeColor('#e5e5e5')
         .lineWidth(0.5)
         .stroke();
      
      doc.moveDown(0.5);
      
      // Título da lição (sem status)
      doc.fontSize(14)
         .fillColor(textRgb.r, textRgb.g, textRgb.b)
         .font('Helvetica-Bold')
         .text(lesson.title);
      
      doc.moveDown(0.5);
      
      // Conteúdo: Cenário e Fases
      const content = lesson.content || {};
      
      // Cenário Principal
      let scenarioText = '';
      if (content.scenario) {
        if (typeof content.scenario === 'object') {
          scenarioText = content.scenario.description || content.scenario.title || '';
        } else {
          scenarioText = content.scenario;
        }
      }
      
      if (scenarioText) {
        doc.fontSize(12)
           .fillColor(textRgb.r, textRgb.g, textRgb.b)
           .font('Helvetica-Bold')
           .text('CENARIO:', { underline: true });
        
        doc.moveDown(0.3);
        
        doc.fontSize(11)
           .fillColor(textRgb.r, textRgb.g, textRgb.b)
           .font('Helvetica')
           .text(scenarioText, { indent: 10 });
        
        doc.moveDown(0.5);
      }
      
      // Fases
      const phases = content.phases || [];
      
      if (phases.length > 0) {
        doc.fontSize(12)
           .fillColor(textRgb.r, textRgb.g, textRgb.b)
           .font('Helvetica-Bold')
           .text('FASES:', { underline: true });
        
        doc.moveDown(0.3);
        
        phases.forEach((phase, phaseIndex) => {
          checkPageBreak(150);
          
          const phaseTitle = phase.title || `Fase ${phaseIndex + 1}`;
          const phaseDesc = phase.description || '';
          const choices = phase.choices || [];
          
          doc.fontSize(11)
             .fillColor(textRgb.r, textRgb.g, textRgb.b)
             .font('Helvetica-Bold')
             .text(`Fase ${phaseIndex + 1}: ${phaseTitle}`, { indent: 10 });
          
          if (phaseDesc) {
            doc.moveDown(0.2);
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica')
               .text(`   ${phaseDesc}`, { indent: 20 });
          }
          
          if (choices.length > 0) {
            doc.moveDown(0.3);
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica-Bold')
               .text(`   Opcoes:`, { indent: 20 });
            
            choices.forEach((choice, choiceIndex) => {
              checkPageBreak(60);
              
              const letter = String.fromCharCode(65 + choiceIndex); // A, B, C, D
              const choiceText = choice.text || choice.choice || `Opcao ${choiceIndex + 1}`;
              const isCorrect = choice.correct !== undefined ? choice.correct : false;
              const correctMark = isCorrect ? ' (Correta)' : '';
              const feedback = choice.feedback || choice.outcome || '';
              
              doc.moveDown(0.2);
              doc.fontSize(10)
                 .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
                 .font('Helvetica')
                 .text(`     ${letter}) ${choiceText}${correctMark}`, { indent: 20 });
              
              if (feedback) {
                doc.moveDown(0.15);
                doc.fontSize(9)
                   .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
                   .font('Helvetica-Oblique')
                   .text(`       Feedback: ${feedback}`, { indent: 20 });
              }
            });
          }
          
          doc.moveDown(0.4);
        });
      } else {
        // Formato antigo: options diretas (sem fases)
        const options = content.options || [];
        
        if (options.length > 0) {
          doc.fontSize(12)
             .fillColor(textRgb.r, textRgb.g, textRgb.b)
             .font('Helvetica-Bold')
             .text('OPCOES:', { underline: true });
          
          doc.moveDown(0.3);
          
          options.forEach((option, optIndex) => {
            checkPageBreak(60);
            
            const letter = String.fromCharCode(65 + optIndex);
            const optionText = option.text || option.choice || `Opcao ${optIndex + 1}`;
            const isCorrect = option.correct !== undefined ? option.correct : false;
            const correctMark = isCorrect ? ' (Correta)' : '';
            const feedback = option.feedback || option.outcome || '';
            
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica')
               .text(`   ${letter}) ${optionText}${correctMark}`, { indent: 10 });
            
            if (feedback) {
              doc.moveDown(0.15);
              doc.fontSize(9)
                 .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
                 .font('Helvetica-Oblique')
                 .text(`     Feedback: ${feedback}`, { indent: 20 });
            }
            
            doc.moveDown(0.3);
          });
        } else {
          doc.fontSize(10)
             .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
             .font('Helvetica-Oblique')
             .text('   AVISO: Conteudo nao disponivel ou formato nao reconhecido', { indent: 10 });
        }
      }
      
      doc.moveDown(1);
      
      // Linha separadora entre cards
      if (index < gradeLessons.length - 1) {
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y)
           .lineTo(doc.page.width - 50, doc.y)
           .strokeColor('#e5e5e5')
           .lineWidth(0.5)
           .stroke();
        
        doc.moveDown(0.5);
      }
    });
    
    doc.moveDown(1);
  });
}

/**
 * Função para gerar PDF de lições Match
 */
function generateMatchPDF(doc, lessons, hasCherryBombFont = false) {
  // Cores (inspiradas no frontend de licenças)
  const colors = {
    primary: '#EE9116',      // Laranja principal YuFin
    secondary: '#FFB300',    // Amarelo de destaque
    text: '#333333',         // Texto escuro
    lightText: '#666666',    // Texto claro
    border: '#e5e5e5'        // Borda suave
  };

  // Converter hex para RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 };
  };

  const primaryRgb = hexToRgb(colors.primary);
  const textRgb = hexToRgb(colors.text);
  const lightTextRgb = hexToRgb(colors.lightText);

  // Função auxiliar para adicionar nova página quando estiver muito próximo do fim
  const checkPageBreak = (requiredHeight = 100) => {
    if (doc.y + requiredHeight > doc.page.height - 60) {
      doc.addPage();
      return true;
    }
    return false;
  };

  // ===== CAPA REFINADA =====
  // Cabeçalho com marca YuFin usando Cherry Bomb One se disponível
  const yufinFont = hasCherryBombFont ? 'CherryBombOne' : 'Helvetica-Bold';
  doc
    .font(yufinFont)
    .fontSize(28)
    .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    .text('YüFin', { align: 'center' });

  // Linha de separação
  doc
    .moveDown(0.5)
    .moveTo(80, doc.y)
    .lineTo(doc.page.width - 80, doc.y)
    .strokeColor(colors.border)
    .lineWidth(1)
    .stroke();

  doc.moveDown(1.5);

  // Título principal
  doc
    .fontSize(22)
    .fillColor(textRgb.r, textRgb.g, textRgb.b)
    .font('Helvetica-Bold')
    .text('Relatório de Lições', { align: 'center' });

  doc.moveDown(0.7);

  // Tipo de gamificação
  doc
    .fontSize(16)
    .font('Helvetica')
    .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    .text('Tipo de Gamificação: Associação (Match)', {
      align: 'center'
    });

  doc.moveDown(1.2);

  // Linha com total e data
  const exportDate = new Date().toLocaleDateString('pt-BR');
  const totalText = `Total de lições: ${lessons.length}`;
  const dateText = `Data de exportação: ${exportDate}`;

  doc
    .fontSize(12)
    .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
    .text(totalText, { align: 'center' });

  doc.moveDown(0.3);

  doc
    .fontSize(12)
    .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
    .text(dateText, { align: 'center' });

  // Espaço final antes de mudar de página
  doc.moveDown(2);
  doc.addPage();

  // ===== AGRUPAMENTO POR SÉRIE COM ORDEM FIXA =====
  const lessonsByGrade = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.gradeId]) {
      acc[lesson.gradeId] = [];
    }
    acc[lesson.gradeId].push(lesson);
    return acc;
  }, {});

  // Ordem fixa desejada das séries
  const orderedGrades = [
    '6º Ano',
    '7º Ano',
    '8º Ano',
    '9º Ano',
    '1º Ano EM',
    '2º Ano EM',
    '3º Ano EM'
  ];

  orderedGrades.forEach((gradeId) => {
    const gradeLessons = lessonsByGrade[gradeId];
    if (!gradeLessons || gradeLessons.length === 0) {
      return;
    }

    checkPageBreak(150);
    
    // Título da seção (série)
    doc.fontSize(18)
       .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
       .font('Helvetica-Bold')
       .text(gradeId, { underline: true });
    
    doc.moveDown(0.5);
    
    // Para cada lição
    gradeLessons.forEach((lesson, index) => {
      checkPageBreak(300);
      
      // Linha separadora sutil antes do card
      doc.moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .strokeColor('#e5e5e5')
         .lineWidth(0.5)
         .stroke();
      
      doc.moveDown(0.5);
      
      // Título da lição (sem status)
      doc.fontSize(14)
         .fillColor(textRgb.r, textRgb.g, textRgb.b)
         .font('Helvetica-Bold')
         .text(lesson.title);
      
      doc.moveDown(0.5);
      
      // Conteúdo: Pares de Associação
      const content = lesson.content || {};
      const pairs = content.pairs || [];
      
      if (pairs.length > 0) {
        doc.fontSize(12)
           .fillColor(textRgb.r, textRgb.g, textRgb.b)
           .font('Helvetica-Bold')
           .text('PARES DE ASSOCIACAO:', { underline: true });
        
        doc.moveDown(0.3);
        
        pairs.forEach((pair, pairIndex) => {
          checkPageBreak(60);
          
          // Extrair left e right de diferentes formatos
          let leftText = '';
          let rightText = '';
          
          if (pair.left && pair.right) {
            leftText = pair.left;
            rightText = pair.right;
          } else if (pair.card1 && pair.card2) {
            leftText = typeof pair.card1 === 'string' ? pair.card1 : (pair.card1.text || pair.card1);
            rightText = typeof pair.card2 === 'string' ? pair.card2 : (pair.card2.text || pair.card2);
          } else if (pair.text) {
            const parts = pair.text.split(' - ');
            leftText = parts[0] || '';
            rightText = parts[1] || '';
          }
          
          doc.fontSize(11)
             .fillColor(textRgb.r, textRgb.g, textRgb.b)
             .font('Helvetica-Bold')
             .text(`${pairIndex + 1}. ${leftText}`, { indent: 10 });
          
          doc.moveDown(0.2);
          doc.fontSize(10)
             .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
             .font('Helvetica')
             .text(`   → ${rightText}`, { indent: 20 });
          
          // Explicação se houver
          if (pair.explanation) {
            doc.moveDown(0.15);
            doc.fontSize(9)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica-Oblique')
               .text(`   Explicacao: ${pair.explanation}`, { indent: 20 });
          }
          
          doc.moveDown(0.3);
        });
      } else {
        doc.fontSize(10)
           .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
           .font('Helvetica-Oblique')
           .text('   AVISO: Pares de associacao nao disponiveis', { indent: 10 });
      }
      
      doc.moveDown(1);
      
      // Linha separadora entre cards
      if (index < gradeLessons.length - 1) {
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y)
           .lineTo(doc.page.width - 50, doc.y)
           .strokeColor('#e5e5e5')
           .lineWidth(0.5)
           .stroke();
        
        doc.moveDown(0.5);
      }
    });
    
    doc.moveDown(1);
  });
}

/**
 * GET /api/admin/lessons/:id
 * Buscar lição específica
 */
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lição não encontrada' });
    }
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/lessons
 * Criar nova lição
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const lessonData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const lesson = new Lesson(lessonData);
    await lesson.save();
    
    res.status(201).json(lesson);
  } catch (error) {
    console.error('Erro ao criar lição:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Função para gerar PDF de lições Drag-Drop
 */
function generateDragDropPDF(doc, lessons, hasCherryBombFont = false) {
  // Cores (inspiradas no frontend de licenças)
  const colors = {
    primary: '#EE9116',      // Laranja principal YuFin
    secondary: '#FFB300',    // Amarelo de destaque
    text: '#333333',         // Texto escuro
    lightText: '#666666',    // Texto claro
    border: '#e5e5e5'        // Borda suave
  };

  // Converter hex para RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 };
  };

  const primaryRgb = hexToRgb(colors.primary);
  const textRgb = hexToRgb(colors.text);
  const lightTextRgb = hexToRgb(colors.lightText);

  // Função auxiliar para adicionar nova página quando estiver muito próximo do fim
  const checkPageBreak = (requiredHeight = 100) => {
    if (doc.y + requiredHeight > doc.page.height - 60) {
      doc.addPage();
      return true;
    }
    return false;
  };

  // ===== CAPA REFINADA =====
  // Cabeçalho com marca YuFin usando Cherry Bomb One se disponível
  const yufinFont = hasCherryBombFont ? 'CherryBombOne' : 'Helvetica-Bold';
  doc
    .font(yufinFont)
    .fontSize(28)
    .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    .text('YüFin', { align: 'center' });

  // Linha de separação
  doc
    .moveDown(0.5)
    .moveTo(80, doc.y)
    .lineTo(doc.page.width - 80, doc.y)
    .strokeColor(colors.border)
    .lineWidth(1)
    .stroke();

  doc.moveDown(1.5);

  // Título principal
  doc
    .fontSize(22)
    .fillColor(textRgb.r, textRgb.g, textRgb.b)
    .font('Helvetica-Bold')
    .text('Relatório de Lições', { align: 'center' });

  doc.moveDown(0.7);

  // Tipo de gamificação
  doc
    .fontSize(16)
    .font('Helvetica')
    .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    .text('Tipo de Gamificação: Arraste e Solte', {
      align: 'center'
    });

  doc.moveDown(1.2);

  // Linha com total e data
  const exportDate = new Date().toLocaleDateString('pt-BR');
  const totalText = `Total de lições: ${lessons.length}`;
  const dateText = `Data de exportação: ${exportDate}`;

  doc
    .fontSize(12)
    .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
    .text(totalText, { align: 'center' });

  doc.moveDown(0.3);

  doc
    .fontSize(12)
    .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
    .text(dateText, { align: 'center' });

  // Espaço final antes de mudar de página
  doc.moveDown(2);
  doc.addPage();

  // ===== AGRUPAMENTO POR SÉRIE COM ORDEM FIXA =====
  const lessonsByGrade = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.gradeId]) {
      acc[lesson.gradeId] = [];
    }
    acc[lesson.gradeId].push(lesson);
    return acc;
  }, {});

  // Ordem fixa desejada das séries
  const orderedGrades = [
    '6º Ano',
    '7º Ano',
    '8º Ano',
    '9º Ano',
    '1º Ano EM',
    '2º Ano EM',
    '3º Ano EM'
  ];

  orderedGrades.forEach((gradeId) => {
    const gradeLessons = lessonsByGrade[gradeId];
    if (!gradeLessons || gradeLessons.length === 0) {
      return;
    }

    checkPageBreak(150);
    
    // Título da seção (série)
    doc.fontSize(18)
       .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
       .font('Helvetica-Bold')
       .text(gradeId, { underline: true });
    
    doc.moveDown(0.5);
    
    // Para cada lição
    gradeLessons.forEach((lesson, index) => {
      checkPageBreak(300);
      
      // Linha separadora sutil antes do card
      doc.moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .strokeColor('#e5e5e5')
         .lineWidth(0.5)
         .stroke();
      
      doc.moveDown(0.5);
      
      // Título da lição (sem status)
      doc.fontSize(14)
         .fillColor(textRgb.r, textRgb.g, textRgb.b)
         .font('Helvetica-Bold')
         .text(lesson.title);
      
      doc.moveDown(0.5);
      
      // Conteúdo: Zonas de Destino e Itens
      const content = lesson.content || {};
      const zones = content.zones || content.dropZones || [];
      const categories = content.categories || [];
      const items = content.items || [];
      
      // Usar zones ou categories como zonas de destino
      const targetZones = zones.length > 0 ? zones : categories;
      
      if (targetZones.length > 0) {
        doc.fontSize(12)
           .fillColor(textRgb.r, textRgb.g, textRgb.b)
           .font('Helvetica-Bold')
           .text('ZONAS DE DESTINO:', { underline: true });
        
        doc.moveDown(0.3);
        
        targetZones.forEach((zone, zoneIndex) => {
          checkPageBreak(100);
          
          const zoneName = zone.name || zone.id || `Zona ${zoneIndex + 1}`;
          const zoneDesc = zone.description || '';
          const zoneId = zone.id || zone.name || `zone-${zoneIndex}`;
          
          doc.fontSize(11)
             .fillColor(textRgb.r, textRgb.g, textRgb.b)
             .font('Helvetica-Bold')
             .text(`${zoneIndex + 1}. ${zoneName}`, { indent: 10 });
          
          if (zoneDesc) {
            doc.moveDown(0.2);
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica')
               .text(`   ${zoneDesc}`, { indent: 20 });
          }
          
          // Buscar itens que pertencem a esta zona
          const zoneItems = items.filter(item => {
            if (typeof item === 'string') return false;
            const correctZone = item.correctZone || item.correctCategory || '';
            return correctZone === zoneId;
          });
          
          if (zoneItems.length > 0) {
            doc.moveDown(0.2);
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica-Bold')
               .text(`   Itens:`, { indent: 20 });
            
            zoneItems.forEach((item, itemIndex) => {
              checkPageBreak(40);
              
              const itemText = typeof item === 'string' ? item : (item.text || item.name || 'Item');
              
              doc.moveDown(0.15);
              doc.fontSize(9)
                 .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
                 .font('Helvetica')
                 .text(`     • ${itemText}`, { indent: 20 });
            });
          } else {
            doc.moveDown(0.2);
            doc.fontSize(9)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica-Oblique')
               .text(`   Nenhum item associado`, { indent: 20 });
          }
          
          doc.moveDown(0.3);
        });
      } else {
        doc.fontSize(10)
           .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
           .font('Helvetica-Oblique')
           .text('   AVISO: Zonas de destino nao disponiveis', { indent: 10 });
      }
      
      doc.moveDown(1);
      
      // Linha separadora entre cards
      if (index < gradeLessons.length - 1) {
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y)
           .lineTo(doc.page.width - 50, doc.y)
           .strokeColor('#e5e5e5')
           .lineWidth(0.5)
           .stroke();
        
        doc.moveDown(0.5);
      }
    });
    
    doc.moveDown(1);
  });
}

/**
 * Função para gerar PDF de lições Goals
 */
function generateGoalsPDF(doc, lessons, hasCherryBombFont = false) {
  // Cores (inspiradas no frontend de licenças)
  const colors = {
    primary: '#EE9116',      // Laranja principal YuFin
    secondary: '#FFB300',    // Amarelo de destaque
    text: '#333333',         // Texto escuro
    lightText: '#666666',    // Texto claro
    border: '#e5e5e5'        // Borda suave
  };

  // Converter hex para RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 };
  };

  const primaryRgb = hexToRgb(colors.primary);
  const textRgb = hexToRgb(colors.text);
  const lightTextRgb = hexToRgb(colors.lightText);

  // Função auxiliar para adicionar nova página quando estiver muito próximo do fim
  const checkPageBreak = (requiredHeight = 100) => {
    if (doc.y + requiredHeight > doc.page.height - 60) {
      doc.addPage();
      return true;
    }
    return false;
  };

  // ===== CAPA REFINADA =====
  // Cabeçalho com marca YuFin usando Cherry Bomb One se disponível
  const yufinFont = hasCherryBombFont ? 'CherryBombOne' : 'Helvetica-Bold';
  doc
    .font(yufinFont)
    .fontSize(28)
    .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    .text('YüFin', { align: 'center' });

  // Linha de separação
  doc
    .moveDown(0.5)
    .moveTo(80, doc.y)
    .lineTo(doc.page.width - 80, doc.y)
    .strokeColor(colors.border)
    .lineWidth(1)
    .stroke();

  doc.moveDown(1.5);

  // Título principal
  doc
    .fontSize(22)
    .fillColor(textRgb.r, textRgb.g, textRgb.b)
    .font('Helvetica-Bold')
    .text('Relatório de Lições', { align: 'center' });

  doc.moveDown(0.7);

  // Tipo de gamificação
  doc
    .fontSize(16)
    .font('Helvetica')
    .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    .text('Tipo de Gamificação: Metas Financeiras', {
      align: 'center'
    });

  doc.moveDown(1.2);

  // Linha com total e data
  const exportDate = new Date().toLocaleDateString('pt-BR');
  const totalText = `Total de lições: ${lessons.length}`;
  const dateText = `Data de exportação: ${exportDate}`;

  doc
    .fontSize(12)
    .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
    .text(totalText, { align: 'center' });

  doc.moveDown(0.3);

  doc
    .fontSize(12)
    .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
    .text(dateText, { align: 'center' });

  // Espaço final antes de mudar de página
  doc.moveDown(2);
  doc.addPage();

  // ===== AGRUPAMENTO POR SÉRIE COM ORDEM FIXA =====
  const lessonsByGrade = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.gradeId]) {
      acc[lesson.gradeId] = [];
    }
    acc[lesson.gradeId].push(lesson);
    return acc;
  }, {});

  // Ordem fixa desejada das séries
  const orderedGrades = [
    '6º Ano',
    '7º Ano',
    '8º Ano',
    '9º Ano',
    '1º Ano EM',
    '2º Ano EM',
    '3º Ano EM'
  ];

  orderedGrades.forEach((gradeId) => {
    const gradeLessons = lessonsByGrade[gradeId];
    if (!gradeLessons || gradeLessons.length === 0) {
      return;
    }

    checkPageBreak(150);
    
    // Título da seção (série)
    doc.fontSize(18)
       .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
       .font('Helvetica-Bold')
       .text(gradeId, { underline: true });
    
    doc.moveDown(0.5);
    
    // Para cada lição
    gradeLessons.forEach((lesson, index) => {
      checkPageBreak(300);
      
      // Linha separadora sutil antes do card
      doc.moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .strokeColor('#e5e5e5')
         .lineWidth(0.5)
         .stroke();
      
      doc.moveDown(0.5);
      
      // Título da lição (sem status)
      doc.fontSize(14)
         .fillColor(textRgb.r, textRgb.g, textRgb.b)
         .font('Helvetica-Bold')
         .text(lesson.title);
      
      doc.moveDown(0.5);
      
      // Conteúdo: Exemplos, Categorias e Inputs
      const content = lesson.content || {};
      const examples = content.examples || [];
      const goalCategories = content.goalCategories || [];
      const inputFields = content.inputFields || [];
      
      // Exemplos (Cenários 1 e 2)
      if (examples.length > 0) {
        doc.fontSize(12)
           .fillColor(textRgb.r, textRgb.g, textRgb.b)
           .font('Helvetica-Bold')
           .text('EXEMPLOS (CENARIOS):', { underline: true });
        
        doc.moveDown(0.3);
        
        // Mostrar apenas os 2 primeiros exemplos
        const examplesToShow = examples.slice(0, 2);
        
        examplesToShow.forEach((example, exIndex) => {
          checkPageBreak(120);
          
          const character = example.character || '';
          const scenario = example.scenario || example.text || '';
          const price = example.price || 0;
          const months = example.months || 0;
          const answer = example.answer || 0;
          const explanation = example.explanation || '';
          
          doc.fontSize(11)
             .fillColor(textRgb.r, textRgb.g, textRgb.b)
             .font('Helvetica-Bold')
             .text(`Cenario ${exIndex + 1}: ${character ? character + ' - ' : ''}${scenario}`, { indent: 10 });
          
          if (price > 0 || months > 0 || answer > 0) {
            doc.moveDown(0.2);
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica')
               .text(`   Preco: R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, { indent: 20 });
            
            if (months > 0) {
              doc.moveDown(0.15);
              doc.fontSize(10)
                 .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
                 .font('Helvetica')
                 .text(`   Prazo: ${months} meses`, { indent: 20 });
            }
            
            if (answer > 0) {
              doc.moveDown(0.15);
              doc.fontSize(10)
                 .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
                 .font('Helvetica')
                 .text(`   Valor mensal necessario: R$ ${answer.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, { indent: 20 });
            }
          }
          
          if (explanation) {
            doc.moveDown(0.15);
            doc.fontSize(9)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica-Oblique')
               .text(`   Explicacao: ${explanation}`, { indent: 20 });
          }
          
          doc.moveDown(0.3);
        });
        
        doc.moveDown(0.3);
      }
      
      // Categorias de Metas
      if (goalCategories.length > 0) {
        doc.fontSize(12)
           .fillColor(textRgb.r, textRgb.g, textRgb.b)
           .font('Helvetica-Bold')
           .text('CATEGORIAS DE METAS:', { underline: true });
        
        doc.moveDown(0.3);
        
        goalCategories.forEach((category, catIndex) => {
          checkPageBreak(100);
          
          const catName = category.name || category.id || `Categoria ${catIndex + 1}`;
          const catDesc = category.description || '';
          const catExamples = category.examples || [];
          
          doc.fontSize(11)
             .fillColor(textRgb.r, textRgb.g, textRgb.b)
             .font('Helvetica-Bold')
             .text(`${catIndex + 1}. ${catName}`, { indent: 10 });
          
          if (catDesc) {
            doc.moveDown(0.2);
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica')
               .text(`   ${catDesc}`, { indent: 20 });
          }
          
          if (catExamples.length > 0) {
            doc.moveDown(0.2);
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica-Bold')
               .text(`   Exemplos:`, { indent: 20 });
            
            catExamples.forEach((ex) => {
              checkPageBreak(30);
              doc.moveDown(0.15);
              doc.fontSize(9)
                 .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
                 .font('Helvetica')
                 .text(`     • ${ex}`, { indent: 20 });
            });
          }
          
          doc.moveDown(0.3);
        });
        
        doc.moveDown(0.3);
      }
      
      // Inputs
      if (inputFields.length > 0) {
        doc.fontSize(12)
           .fillColor(textRgb.r, textRgb.g, textRgb.b)
           .font('Helvetica-Bold')
           .text('CAMPOS DE ENTRADA (INPUTS):', { underline: true });
        
        doc.moveDown(0.3);
        
        inputFields.forEach((input, inputIndex) => {
          checkPageBreak(50);
          
          const label = input.label || `Campo ${inputIndex + 1}`;
          const type = input.type || 'text';
          const placeholder = input.placeholder || '';
          const options = input.options || [];
          
          doc.fontSize(11)
             .fillColor(textRgb.r, textRgb.g, textRgb.b)
             .font('Helvetica-Bold')
             .text(`${inputIndex + 1}. ${label}`, { indent: 10 });
          
          doc.moveDown(0.15);
          doc.fontSize(10)
             .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
             .font('Helvetica')
             .text(`   Tipo: ${type}`, { indent: 20 });
          
          if (placeholder) {
            doc.moveDown(0.15);
            doc.fontSize(9)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica-Oblique')
               .text(`   Placeholder: ${placeholder}`, { indent: 20 });
          }
          
          if (options.length > 0) {
            doc.moveDown(0.15);
            doc.fontSize(9)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica')
               .text(`   Opcoes:`, { indent: 20 });
            
            options.forEach((opt) => {
              const optLabel = opt.label || opt.value || '';
              doc.moveDown(0.1);
              doc.fontSize(9)
                 .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
                 .font('Helvetica')
                 .text(`     - ${optLabel}`, { indent: 20 });
            });
          }
          
          doc.moveDown(0.3);
        });
      }
      
      doc.moveDown(1);
      
      // Linha separadora entre cards
      if (index < gradeLessons.length - 1) {
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y)
           .lineTo(doc.page.width - 50, doc.y)
           .strokeColor('#e5e5e5')
           .lineWidth(0.5)
           .stroke();
        
        doc.moveDown(0.5);
      }
    });
    
    doc.moveDown(1);
  });
}

/**
 * Função para gerar PDF de lições Math Problems
 */
function generateMathProblemsPDF(doc, lessons, hasCherryBombFont = false) {
  // Cores (inspiradas no frontend de licenças)
  const colors = {
    primary: '#EE9116',      // Laranja principal YuFin
    secondary: '#FFB300',    // Amarelo de destaque
    text: '#333333',         // Texto escuro
    lightText: '#666666',    // Texto claro
    border: '#e5e5e5'        // Borda suave
  };

  // Converter hex para RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 };
  };

  const primaryRgb = hexToRgb(colors.primary);
  const textRgb = hexToRgb(colors.text);
  const lightTextRgb = hexToRgb(colors.lightText);

  // Função auxiliar para adicionar nova página quando estiver muito próximo do fim
  const checkPageBreak = (requiredHeight = 100) => {
    if (doc.y + requiredHeight > doc.page.height - 60) {
      doc.addPage();
      return true;
    }
    return false;
  };

  // ===== CAPA REFINADA =====
  // Cabeçalho com marca YuFin usando Cherry Bomb One se disponível
  const yufinFont = hasCherryBombFont ? 'CherryBombOne' : 'Helvetica-Bold';
  doc
    .font(yufinFont)
    .fontSize(28)
    .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    .text('YüFin', { align: 'center' });

  // Linha de separação
  doc
    .moveDown(0.5)
    .moveTo(80, doc.y)
    .lineTo(doc.page.width - 80, doc.y)
    .strokeColor(colors.border)
    .lineWidth(1)
    .stroke();

  doc.moveDown(1.5);

  // Título principal
  doc
    .fontSize(22)
    .fillColor(textRgb.r, textRgb.g, textRgb.b)
    .font('Helvetica-Bold')
    .text('Relatório de Lições', { align: 'center' });

  doc.moveDown(0.7);

  // Tipo de gamificação
  doc
    .fontSize(16)
    .font('Helvetica')
    .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    .text('Tipo de Gamificação: Problemas Matemáticos', {
      align: 'center'
    });

  doc.moveDown(1.2);

  // Linha com total e data
  const exportDate = new Date().toLocaleDateString('pt-BR');
  const totalText = `Total de lições: ${lessons.length}`;
  const dateText = `Data de exportação: ${exportDate}`;

  doc
    .fontSize(12)
    .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
    .text(totalText, { align: 'center' });

  doc.moveDown(0.3);

  doc
    .fontSize(12)
    .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
    .text(dateText, { align: 'center' });

  // Espaço final antes de mudar de página
  doc.moveDown(2);
  doc.addPage();

  // ===== AGRUPAMENTO POR SÉRIE COM ORDEM FIXA =====
  const lessonsByGrade = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.gradeId]) {
      acc[lesson.gradeId] = [];
    }
    acc[lesson.gradeId].push(lesson);
    return acc;
  }, {});

  // Ordem fixa desejada das séries
  const orderedGrades = [
    '6º Ano',
    '7º Ano',
    '8º Ano',
    '9º Ano',
    '1º Ano EM',
    '2º Ano EM',
    '3º Ano EM'
  ];

  orderedGrades.forEach((gradeId) => {
    const gradeLessons = lessonsByGrade[gradeId];
    if (!gradeLessons || gradeLessons.length === 0) {
      return;
    }

    checkPageBreak(150);
    
    // Título da seção (série)
    doc.fontSize(18)
       .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
       .font('Helvetica-Bold')
       .text(gradeId, { underline: true });
    
    doc.moveDown(0.5);
    
    // Para cada lição
    gradeLessons.forEach((lesson, index) => {
      checkPageBreak(300);
      
      // Linha separadora sutil antes do card
      doc.moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .strokeColor('#e5e5e5')
         .lineWidth(0.5)
         .stroke();
      
      doc.moveDown(0.5);
      
      // Título da lição (sem status)
      doc.fontSize(14)
         .fillColor(textRgb.r, textRgb.g, textRgb.b)
         .font('Helvetica-Bold')
         .text(lesson.title);
      
      doc.moveDown(0.5);
      
      // Conteúdo: Problemas
      const content = lesson.content || {};
      const problems = content.problems || [];
      
      if (problems.length > 0) {
        doc.fontSize(12)
           .fillColor(textRgb.r, textRgb.g, textRgb.b)
           .font('Helvetica-Bold')
           .text('PROBLEMAS:', { underline: true });
        
        doc.moveDown(0.3);
        
        problems.forEach((problem, probIndex) => {
          checkPageBreak(150);
          
          const probTitle = problem.title || `Problema ${problem.id || probIndex + 1}`;
          const probLevel = problem.level || '';
          const context = problem.context || '';
          const question = problem.question || '';
          const formula = problem.formula || '';
          const answer = problem.answer || problem.correctAnswer || 0;
          const explanation = problem.explanation || '';
          const steps = problem.steps || [];
          
          doc.fontSize(11)
             .fillColor(textRgb.r, textRgb.g, textRgb.b)
             .font('Helvetica-Bold')
             .text(`Problema ${probIndex + 1}: ${probTitle}${probLevel ? ' (' + probLevel + ')' : ''}`, { indent: 10 });
          
          if (context) {
            doc.moveDown(0.2);
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica')
               .text(`   Contexto: ${context}`, { indent: 20 });
          }
          
          if (question) {
            doc.moveDown(0.2);
            doc.fontSize(10)
               .fillColor(textRgb.r, textRgb.g, textRgb.b)
               .font('Helvetica-Bold')
               .text(`   Pergunta: ${question}`, { indent: 20 });
          }
          
          if (formula) {
            doc.moveDown(0.2);
            doc.fontSize(10)
               .fillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
               .font('Helvetica-Bold')
               .text(`   Formula: ${formula}`, { indent: 20 });
          }
          
          if (steps.length > 0) {
            doc.moveDown(0.2);
            doc.fontSize(10)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica-Bold')
               .text(`   Passos:`, { indent: 20 });
            
            steps.forEach((step) => {
              checkPageBreak(30);
              doc.moveDown(0.15);
              doc.fontSize(9)
                 .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
                 .font('Helvetica')
                 .text(`     • ${step}`, { indent: 20 });
            });
          }
          
          if (answer !== undefined && answer !== null) {
            doc.moveDown(0.2);
            doc.fontSize(10)
               .fillColor(textRgb.r, textRgb.g, textRgb.b)
               .font('Helvetica-Bold')
               .text(`   Resposta: ${typeof answer === 'number' ? answer.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : answer}`, { indent: 20 });
          }
          
          if (explanation) {
            doc.moveDown(0.15);
            doc.fontSize(9)
               .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
               .font('Helvetica-Oblique')
               .text(`   Explicacao: ${explanation}`, { indent: 20 });
          }
          
          doc.moveDown(0.3);
        });
      } else {
        doc.fontSize(10)
           .fillColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b)
           .font('Helvetica-Oblique')
           .text('   AVISO: Problemas nao disponiveis', { indent: 10 });
      }
      
      doc.moveDown(1);
      
      // Linha separadora entre cards
      if (index < gradeLessons.length - 1) {
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y)
           .lineTo(doc.page.width - 50, doc.y)
           .strokeColor('#e5e5e5')
           .lineWidth(0.5)
           .stroke();
        
        doc.moveDown(0.5);
      }
    });
    
    doc.moveDown(1);
  });
}

/**
 * PUT /api/admin/lessons/:id
 * Atualizar lição existente
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lição não encontrada' });
    }
    
    res.json(lesson);
  } catch (error) {
    console.error('Erro ao atualizar lição:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PATCH /api/admin/lessons/:id/toggle-active
 * Ativar/desativar lição
 */
router.patch('/:id/toggle-active', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { isActive, updatedAt: new Date() },
      { new: true }
    );
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lição não encontrada' });
    }
    
    res.json(lesson);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/lessons/:id
 * Deletar lição (soft delete - apenas desativa)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Soft delete - apenas desativa a lição
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lição não encontrada' });
    }
    
    res.json({ message: 'Lição desativada com sucesso', lesson });
  } catch (error) {
    console.error('Erro ao deletar lição:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
