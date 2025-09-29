require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

mongoose.connect(process.env.MONGODB_URI);

async function createMatchTemplate() {
  try {
    console.log('🎯 CRIANDO TEMPLATE MATCH PERSONALIZADO');
    console.log('='.repeat(60));
    
    // Lista das lições de Match para atualizar
    const matchLessons = [
      { 
        title: 'Tipos de Poupança', 
        gradeId: '7º Ano', 
        type: 'association',
      scenario: {
        title: "Tipos de Poupança",
          description: "Você está aprendendo sobre diferentes tipos de poupança e suas características. Conecte cada tipo com suas principais características!"
        },
        items: [
          { text: "Poupança Tradicional", correctCategory: "Rendimento Baixo" },
          { text: "Poupança Digital", correctCategory: "Rendimento Baixo" },
          { text: "CDB", correctCategory: "Rendimento Médio" },
          { text: "LCI/LCA", correctCategory: "Rendimento Médio" },
          { text: "Tesouro Selic", correctCategory: "Rendimento Médio" },
          { text: "Ações", correctCategory: "Rendimento Alto" }
        ],
        categories: [
          { name: "Rendimento Baixo", description: "Rendimento menor, mas mais seguro" },
          { name: "Rendimento Médio", description: "Rendimento equilibrado com segurança" },
          { name: "Rendimento Alto", description: "Maior potencial de rendimento, mas com risco" }
        ]
      },
      { 
        title: 'Tipos de Investimentos (poupança, CDB, tesouro)', 
        gradeId: '8º Ano', 
        type: 'memory',
        scenario: {
          title: "Jogo da Memória - Investimentos",
          description: "Encontre os pares corretos entre tipos de investimentos e suas características principais!"
        },
        pairs: [
          {
            card1: { text: "Poupança", type: "investimento" },
            card2: { text: "Rendimento baixo e seguro", type: "caracteristica" }
          },
          {
            card1: { text: "CDB", type: "investimento" },
            card2: { text: "Certificado de Depósito Bancário", type: "caracteristica" }
          },
          {
            card1: { text: "Tesouro Selic", type: "investimento" },
            card2: { text: "Título do governo federal", type: "caracteristica" }
          },
          {
            card1: { text: "LCI", type: "investimento" },
            card2: { text: "Letra de Crédito Imobiliário", type: "caracteristica" }
          },
          {
            card1: { text: "LCA", type: "investimento" },
            card2: { text: "Letra de Crédito do Agronegócio", type: "caracteristica" }
          },
          {
            card1: { text: "Ações", type: "investimento" },
            card2: { text: "Participação em empresas", type: "caracteristica" }
          }
        ]
      }
    ];
    
    for (const lessonData of matchLessons) {
      console.log(`\n🔍 Processando: ${lessonData.title}`);
      
      // Buscar a lição
      const lesson = await Lesson.findOne({ 
        title: lessonData.title,
        gradeId: lessonData.gradeId 
      });
      
      if (!lesson) {
        console.log(`❌ Lição "${lessonData.title}" não encontrada`);
        continue;
      }
      
      console.log('📋 Lição encontrada:', lesson.title);
      console.log('📊 Série:', lesson.gradeId);
      console.log('🎯 Tipo:', lesson.type);
      
      // Criar estrutura baseada no tipo de match
      let newMatchStructure;
      
      if (lessonData.type === 'association') {
        // ESTRUTURA PARA ASSOCIAÇÃO
        newMatchStructure = {
          scenario: lessonData.scenario.description,
          items: lessonData.items,
          categories: lessonData.categories,
          gameType: 'association',
          instructions: [
            "Conecte cada tipo de poupança com sua categoria de rendimento",
            "Clique em um item e depois na categoria correspondente",
            "Complete todas as associações para finalizar"
          ],
          feedback: {
            correct: "Correto! Você associou corretamente o tipo de poupança com sua característica.",
            incorrect: "Tente novamente! Pense nas características de cada tipo de poupança.",
            complete: "Parabéns! Você entendeu os diferentes tipos de poupança e suas características!"
          }
        };
      } else {
        // ESTRUTURA PARA JOGO DA MEMÓRIA
        newMatchStructure = {
          scenario: lessonData.scenario.description,
          gameFormat: 'memory',
          gameConfig: {
            format: 'memory',
            type: 'memory-game',
            difficulty: 'medium'
          },
          title: lessonData.scenario.title,
          description: lessonData.scenario.description,
          instructions: [
            "Clique nas cartas para virá-las e encontrar os pares corretos",
            "Você tem 12 pares para encontrar",
            "Tente lembrar onde você viu cada termo ou definição"
          ],
          pairs: lessonData.pairs.map(pair => ({
            left: pair.card1.text,
            right: pair.card2.text,
            explanation: `Correto! ${pair.card1.text} é ${pair.card2.text}`,
            educationalTip: `Dica: ${pair.card1.text} é um tipo de investimento que ${pair.card2.text.toLowerCase()}`
          })),
          maxAttempts: 18,
          timeLimit: 240,
          scoring: {
            perfect: 120,
            good: 96,
            average: 72
          },
          feedback: {
            success: "Parabéns! Você encontrou todos os pares!",
            partial: "Bom trabalho! Continue tentando encontrar os pares restantes.",
            hint: "Dica: Tente lembrar onde você viu cada termo ou definição."
          }
        };
      }
      
      // Atualizar a lição
      lesson.content = newMatchStructure;
      lesson.updatedAt = new Date();
      
      await lesson.save();
      
      console.log(`✅ Template ${lessonData.type} criado com sucesso para: ${lesson.title}`);
      console.log(`🎮 Tipo de jogo: ${lessonData.type}`);
      console.log(`⏱️ Tempo estimado: 10-15 minutos`);
    }
    
    console.log('\n🎯 RESUMO DOS TEMPLATES CRIADOS:');
    console.log('================================');
    console.log('✅ Tipos de Poupança - Associação');
    console.log('✅ Tipos de Investimentos - Jogo da Memória');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Testar as lições no frontend');
    console.log('   2. Validar componente MatchLesson.jsx');
    console.log('   3. Ajustar se necessário');
    
  } catch (error) {
    console.error('❌ Erro ao criar templates match:', error);
  } finally {
    mongoose.connection.close();
  }
}

createMatchTemplate();