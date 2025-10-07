require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

mongoose.connect(process.env.MONGODB_URI);

async function createChoicesTemplate() {
  try {
    console.log('🎯 CRIANDO TEMPLATE CHOICES PERSONALIZADO');
    console.log('='.repeat(60));
    
    // Buscar a lição "Qualidade vs Preço"
    const lesson = await Lesson.findOne({ title: 'Qualidade vs Preço' });
    
    if (!lesson) {
      console.log('❌ Lição "Qualidade vs Preço" não encontrada');
      return;
    }
    
    console.log('📋 Lição encontrada:', lesson.title);
    console.log('📊 Série:', lesson.gradeId);
    console.log('🎯 Tipo:', lesson.type);
    
    // ESTRUTURA PERSONALIZADA PARA CHOICES
    const newChoicesStructure = {
      // Cenário principal
      scenario: "Você está em uma loja e precisa decidir entre diferentes produtos. Cada escolha tem consequências para seu orçamento e satisfação. Analise as opções e tome a melhor decisão!",
      
      // Escolhas com consequências
      choices: [
        {
          text: "Comprar o produto mais barato, mesmo que a qualidade seja duvidosa",
          correct: false,
          feedback: "Cuidado! Produtos muito baratos podem ter qualidade ruim e precisar ser substituídos rapidamente, custando mais no final.",
          consequence: "Você economizou no curto prazo, mas o produto quebrou em 2 meses e você teve que comprar outro. No final, gastou mais do que se tivesse comprado um produto de qualidade.",
          points: 20
        },
        {
          text: "Pesquisar preços e qualidade, escolhendo o melhor custo-benefício",
          correct: true,
          feedback: "Excelente escolha! Pesquisar antes de comprar é fundamental para tomar decisões financeiras inteligentes.",
          consequence: "Você encontrou um produto de boa qualidade com preço justo. Ele durou muito tempo e você ficou satisfeito com a compra.",
          points: 100
        },
        {
          text: "Comprar sempre o produto mais caro, pensando que é o melhor",
          correct: false,
          feedback: "Nem sempre o mais caro é o melhor! É importante avaliar se o preço alto se justifica pela qualidade e necessidade.",
          consequence: "Você gastou muito dinheiro em um produto que talvez não precisasse de tanta qualidade. Isso pode ter afetado seu orçamento para outras necessidades.",
          points: 30
        },
        {
          text: "Aguardar promoções e ofertas especiais",
          correct: true,
          feedback: "Boa estratégia! Aguardar promoções pode ser uma forma inteligente de economizar, desde que você realmente precise do produto.",
          consequence: "Você esperou e conseguiu uma boa promoção. O produto tem qualidade adequada e você economizou dinheiro.",
          points: 90
        }
      ],
      
      // Sistema de pontuação
      scoring: {
        perfect: 100,
        good: 80,
        average: 60,
        poor: 40
      },
      
      // Feedback educacional
      feedback: {
        excellent: "Parabéns! Você demonstrou excelente capacidade de análise para tomar decisões financeiras inteligentes!",
        good: "Boa escolha! Continue desenvolvendo sua capacidade de avaliar custo-benefício.",
        needsImprovement: "Tente pensar mais sobre as consequências de longo prazo das suas escolhas financeiras.",
        tips: [
          "Sempre pesquise preços antes de comprar",
          "Considere a durabilidade do produto",
          "Avalie se você realmente precisa do item",
          "Compare qualidade e preço para encontrar o melhor custo-benefício"
        ]
      },
      
      // Configurações do jogo
      settings: {
        allowMultipleChoices: false,
        showConsequences: true,
        timeLimit: 300, // 5 minutos
        maxAttempts: 3
      },
      
      // Metadados educacionais
      metadata: {
        difficulty: 2,
        estimatedTime: "5-10 minutos",
        learningObjectives: [
          "Desenvolver capacidade de análise de custo-benefício",
          "Entender a importância de pesquisar antes de comprar",
          "Aprender a tomar decisões financeiras conscientes",
          "Reconhecer a diferença entre necessidade e desejo"
        ],
        skills: [
          "análise-crítica",
          "tomada-de-decisão",
          "pesquisa-de-preços",
          "planejamento-financeiro"
        ]
      }
    };
    
    // Atualizar a lição
    lesson.content = newChoicesStructure;
    lesson.updatedAt = new Date();
    
    await lesson.save();
    
    console.log('✅ Template Choices criado com sucesso!');
    console.log('📊 Escolhas criadas:', newChoicesStructure.choices.length);
    console.log('🎯 Escolhas corretas:', newChoicesStructure.choices.filter(c => c.correct).length);
    console.log('⏱️ Tempo estimado: 5-10 minutos');
    console.log('\n🎮 Funcionalidades incluídas:');
    console.log('   ✅ Sistema de escolhas múltiplas');
    console.log('   ✅ Consequências detalhadas');
    console.log('   ✅ Feedback educacional personalizado');
    console.log('   ✅ Sistema de pontuação');
    console.log('   ✅ Dicas para melhoria');
    
  } catch (error) {
    console.error('❌ Erro ao criar template choices:', error);
  } finally {
    mongoose.connection.close();
  }
}

createChoicesTemplate();
















