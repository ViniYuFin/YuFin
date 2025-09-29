const mongoose = require('mongoose');
require('dotenv').config();

async function createShoppingSimulationTemplate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Lesson = mongoose.model('Lesson', new mongoose.Schema({}, { strict: false }));
    
    console.log('🛒 CRIANDO TEMPLATE SHOPPING SIMULATION PERSONALIZADO');
    console.log('============================================================');
    
    // Buscar a lição "Marketing e persuasão"
    const lesson = await Lesson.findOne({ 
      title: { $regex: /Marketing.*persuasão/i },
      gradeId: "8º Ano"
    });
    
    if (!lesson) {
      console.log('❌ Lição "Marketing e persuasão" não encontrada');
      return;
    }
    
    console.log('📋 Lição encontrada:', lesson.title);
    console.log('📊 Série:', lesson.gradeId);
    console.log('🎯 Tipo:', lesson.type);
    
    // ESTRUTURA PERSONALIZADA PARA SHOPPING SIMULATION
    const newShoppingStructure = {
      // Cenário principal
      scenario: {
        title: "Decisão de Compra Inteligente",
        description: "Você tem R$ 500 para gastar. Analise as estratégias de marketing e tome decisões conscientes!",
        budget: 500
      },
      
      // Objetivos da lição
      objectives: [
        "Identificar estratégias de marketing e persuasão",
        "Distinguir entre necessidades e desejos",
        "Tomar decisões de compra conscientes",
        "Resistir a técnicas de persuasão desnecessárias",
        "Priorizar gastos essenciais"
      ],
      
      // Produtos com estratégias de marketing
      products: [
        {
          id: 1,
          name: "Smartphone Básico (Usado)",
          price: 200,
          description: "Celular funcional para comunicação essencial. Modelo de 2 anos atrás, em bom estado.",
          type: "necessidade",
          category: "Essencial",
          persuasion: null,
          marketingStrategy: "Produto prático sem técnicas de persuasão",
          isCorrect: true
        },
        {
          id: 2,
          name: "Smartphone Premium (Novo)",
          price: 450,
          description: "O mais novo modelo com câmera de 108MP, tela 4K e processador ultra-rápido!",
          type: "desejo",
          category: "Desejo",
          persuasion: "🔥 OFERTA LIMITADA! Últimas unidades! Não perca esta oportunidade única!",
          marketingStrategy: "Urgência falsa + superlativos + escassez",
          isCorrect: false
        },
        {
          id: 3,
          name: "Tênis Esportivo Básico",
          price: 120,
          description: "Tênis confortável para atividades físicas e uso diário.",
          type: "necessidade",
          category: "Essencial",
          persuasion: null,
          marketingStrategy: "Produto funcional sem manipulação",
          isCorrect: true
        },
        {
          id: 4,
          name: "Tênis de Marca (Limitado)",
          price: 350,
          description: "Edição limitada! Apenas 100 pares no Brasil! Seja exclusivo!",
          type: "desejo",
          category: "Desejo",
          persuasion: "⭐ EDITION LIMITADA! Apenas 100 pares! Seja o primeiro da sua turma!",
          marketingStrategy: "Exclusividade + escassez + status social",
          isCorrect: false
        },
        {
          id: 5,
          name: "Livro Educativo",
          price: 40,
          description: "Livro sobre educação financeira para jovens.",
          type: "necessidade",
          category: "Essencial",
          persuasion: null,
          marketingStrategy: "Produto educativo sem manipulação",
          isCorrect: true
        },
        {
          id: 6,
          name: "Poupança para Emergência",
          price: 100,
          description: "Guardar dinheiro para imprevistos e emergências futuras.",
          type: "investimento",
          category: "Investimento",
          persuasion: null,
          marketingStrategy: "Decisão financeira responsável",
          isCorrect: true
        }
      ],
      
      // Sistema de feedback
      feedback: {
        success: "🎉 Excelente! Você resistiu às técnicas de marketing e fez escolhas inteligentes!",
        warning: "👍 Bom trabalho! Você identificou algumas estratégias de persuasão.",
        failure: "💡 Continue praticando! Analise melhor as técnicas de marketing usadas.",
        perfect: "🏆 Perfeito! Você dominou a arte de comprar conscientemente!"
      },
      
      // Dicas educativas
      tips: [
        "Analise se você realmente precisa do produto",
        "Desconfie de ofertas 'limitadas' e 'últimas unidades'",
        "Compare preços antes de comprar",
        "Resista à pressão social e ao FOMO",
        "Priorize necessidades sobre desejos"
      ],
      
      // Estratégias de marketing identificadas
      marketingStrategies: [
        {
          name: "Urgência Falsa",
          description: "Criar pressão temporal artificial",
          example: "Últimas unidades! Oferta por tempo limitado!"
        },
        {
          name: "Escassez",
          description: "Fazer parecer que o produto é raro",
          example: "Apenas 100 unidades disponíveis!"
        },
        {
          name: "Pressão Social",
          description: "Usar o medo de ficar de fora",
          example: "Todos os seus amigos já têm!"
        },
        {
          name: "Superlativos",
          description: "Usar palavras exageradas",
          example: "O melhor! O mais vendido! Revolucionário!"
        },
        {
          name: "Desconto Falso",
          description: "Mostrar preços inflacionados",
          example: "De R$ 1000 por apenas R$ 300!"
        }
      ],
      
      // Configurações visuais
      visual: {
        showMarketingStrategy: true,
        showPersuasion: true,
        highlightCorrectChoices: true,
        showBudget: true,
        showObjectives: true
      },
      
      // Sistema de pontuação
      scoring: {
        correctChoice: 25,
        withinBudget: 30,
        resistPersuasion: 20,
        chooseNecessity: 15,
        chooseInvestment: 10,
        maxPoints: 100
      }
    };
    
    // Forçar atualização completa da lição
    const updateResult = await Lesson.updateOne(
      { _id: lesson._id },
      { 
        $set: { 
          content: newShoppingStructure,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('🔄 Resultado da atualização:', updateResult);
    
    console.log('✅ Template shopping simulation criado com sucesso!');
    console.log('📊 Produtos criados:', newShoppingStructure.products.length);
    console.log('🎯 Estratégias de marketing:', newShoppingStructure.marketingStrategies.length);
    console.log('💰 Orçamento:', newShoppingStructure.scenario.budget);
    console.log('⏱️ Tempo estimado: 15-20 minutos');
    
  } catch (error) {
    console.error('❌ Erro ao criar template shopping simulation:', error);
  } finally {
    mongoose.connection.close();
  }
}

createShoppingSimulationTemplate();
