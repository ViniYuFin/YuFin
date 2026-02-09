/**
 * 📊 SCRIPT DE LISTAGEM - TIPOS DE GAMIFICAÇÃO POR SÉRIE
 * 
 * Lista todos os tipos de gamificação e em quais séries eles estão divididos
 * 
 * Uso:
 *   cd backend
 *   node scripts/list-gamification-types.js
 * 
 * IMPORTANTE: Este script NÃO modifica o banco de dados, apenas lê e lista informações
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');
const Grade = require('../models/Grade');

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
 * Função principal
 */
async function listGamificationTypes() {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RELATÓRIO - TIPOS DE GAMIFICAÇÃO POR SÉRIE');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Conectar ao MongoDB
    console.log('ℹ️  Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB!\n');

    // Buscar todas as lições ativas
    console.log('ℹ️  Consultando lições do banco de dados...');
    const lessons = await Lesson.find({ isActive: true }).lean();
    console.log(`ℹ️  Total de lições encontradas: ${lessons.length}\n`);

    // Buscar todas as séries para mapear gradeId -> nome
    const grades = await Grade.find({ isActive: true }).lean();
    const gradeMap = {};
    grades.forEach(grade => {
      gradeMap[grade._id.toString()] = grade.name;
    });

    // Agrupar por tipo de gamificação
    const gamificationMap = {};

    lessons.forEach(lesson => {
      const type = lesson.type;
      const gradeId = lesson.gradeId;
      const gradeName = gradeMap[gradeId] || gradeId;

      if (!gamificationMap[type]) {
        gamificationMap[type] = {
          name: getGamificationTypeName(type),
          code: type,
          grades: {},
          total: 0
        };
      }

      if (!gamificationMap[type].grades[gradeName]) {
        gamificationMap[type].grades[gradeName] = [];
      }

      gamificationMap[type].grades[gradeName].push({
        title: lesson.title,
        module: lesson.module,
        order: lesson.order
      });

      gamificationMap[type].total++;
    });

    // Ordenar tipos por total de lições (decrescente)
    const sortedTypes = Object.entries(gamificationMap)
      .sort((a, b) => b[1].total - a[1].total);

    // Exibir relatório
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 TIPOS DE GAMIFICAÇÃO E SUAS SÉRIES');
    console.log('═══════════════════════════════════════════════════════════\n');

    sortedTypes.forEach(([typeCode, typeData]) => {
      console.log(`🎮 ${typeData.name}`);
      console.log(`   Código: ${typeCode}`);
      console.log(`   Total de lições: ${typeData.total}`);
      console.log(`   Séries: ${Object.keys(typeData.grades).length}`);
      console.log('');

      // Ordenar séries alfabeticamente
      const sortedGrades = Object.entries(typeData.grades)
        .sort((a, b) => a[0].localeCompare(b[0]));

      sortedGrades.forEach(([gradeName, lessons]) => {
        console.log(`   📚 ${gradeName} (${lessons.length} lição${lessons.length > 1 ? 'ões' : ''})`);
        
        // Agrupar por módulo
        const byModule = {};
        lessons.forEach(lesson => {
          if (!byModule[lesson.module]) {
            byModule[lesson.module] = [];
          }
          byModule[lesson.module].push(lesson);
        });

        // Ordenar módulos
        const sortedModules = Object.entries(byModule)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

        sortedModules.forEach(([module, moduleLessons]) => {
          const sortedLessons = moduleLessons.sort((a, b) => a.order - b.order);
          sortedLessons.forEach(lesson => {
            console.log(`      • Módulo ${module}, Ordem ${lesson.order}: ${lesson.title}`);
          });
        });
      });

      console.log('');
    });

    // Resumo estatístico
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMO ESTATÍSTICO');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`📈 Total de tipos de gamificação: ${sortedTypes.length}`);
    console.log(`📚 Total de lições analisadas: ${lessons.length}`);
    console.log('');

    // Top 5 tipos mais usados
    console.log('🏆 Top 5 tipos mais utilizados:');
    sortedTypes.slice(0, 5).forEach(([typeCode, typeData], index) => {
      const percentage = ((typeData.total / lessons.length) * 100).toFixed(1);
      console.log(`   ${index + 1}. ${typeData.name}: ${typeData.total} lições (${percentage}%)`);
    });
    console.log('');

    // Distribuição por série
    const gradeStats = {};
    lessons.forEach(lesson => {
      const gradeName = gradeMap[lesson.gradeId] || lesson.gradeId;
      if (!gradeStats[gradeName]) {
        gradeStats[gradeName] = {};
      }
      if (!gradeStats[gradeName][lesson.type]) {
        gradeStats[gradeName][lesson.type] = 0;
      }
      gradeStats[gradeName][lesson.type]++;
    });

    console.log('📚 Distribuição por série:');
    const sortedGradeNames = Object.keys(gradeStats).sort();
    sortedGradeNames.forEach(gradeName => {
      const total = Object.values(gradeStats[gradeName]).reduce((a, b) => a + b, 0);
      console.log(`   ${gradeName}: ${total} lições`);
      const sortedTypesInGrade = Object.entries(gradeStats[gradeName])
        .sort((a, b) => b[1] - a[1]);
      sortedTypesInGrade.forEach(([type, count]) => {
        const typeName = getGamificationTypeName(type);
        console.log(`      • ${typeName}: ${count}`);
      });
    });

    console.log('\n✅ Relatório concluído!');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Conexão fechada');
  }
}

// Executar
listGamificationTypes();
