require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

mongoose.connect(process.env.MONGODB_URI);

async function createClassifyTemplate() {
  try {
    console.log('🏷️ CRIANDO TEMPLATE CLASSIFY PERSONALIZADO');
    console.log('='.repeat(60));
    
    // Buscar a lição "Necessidades vs Desejos"
    const lesson = await Lesson.findOne({ title: 'Necessidades vs Desejos' });
    
    if (!lesson) {
      console.log('❌ Lição "Necessidades vs Desejos" não encontrada');
      return;
    }
    
    console.log('📋 Lição encontrada:', lesson.title);
    console.log('📊 Série:', lesson.gradeId);
    console.log('🎯 Tipo:', lesson.type);
    
    // ESTRUTURA PERSONALIZADA PARA CLASSIFY
    const newClassifyStructure = {
      // Cenário principal
      scenario: "Você está organizando sua lista de compras e precisa classificar cada item como NECESSIDADE ou DESEJO. Isso vai ajudar você a priorizar seus gastos e fazer escolhas financeiras mais inteligentes!",
      
      // Itens para classificar
      items: [
        {
          text: "Comida para o almoço",
          correctCategory: "Necessidades",
          explanation: "Alimentação é uma necessidade básica para sobrevivência."
        },
        {
          text: "Videogame novo",
          correctCategory: "Desejos",
          explanation: "Entretenimento é um desejo, não uma necessidade básica."
        },
        {
          text: "Remédio para dor de cabeça",
          correctCategory: "Necessidades",
          explanation: "Medicamentos são necessários para a saúde."
        },
        {
          text: "Tênis de marca famosa",
          correctCategory: "Desejos",
          explanation: "Roupas de marca são desejos, não necessidades básicas."
        },
        {
          text: "Material escolar",
          correctCategory: "Necessidades",
          explanation: "Educação é uma necessidade para o desenvolvimento."
        },
        {
          text: "Smartphone de última geração",
          correctCategory: "Desejos",
          explanation: "Tecnologia de ponta é um desejo, não uma necessidade básica."
        },
        {
          text: "Água potável",
          correctCategory: "Necessidades",
          explanation: "Água é uma necessidade básica para sobrevivência."
        },
        {
          text: "Viagem de férias",
          correctCategory: "Desejos",
          explanation: "Lazer e viagens são desejos, não necessidades básicas."
        },
        {
          text: "Roupas básicas para o trabalho",
          correctCategory: "Necessidades",
          explanation: "Roupas adequadas para trabalho são necessárias."
        },
        {
          text: "Acessórios de moda",
          correctCategory: "Desejos",
          explanation: "Acessórios são desejos, não necessidades básicas."
        }
      ],
      
      // Categorias disponíveis
      categories: [
        {
          name: "Necessidades",
          description: "Itens essenciais para sobrevivência e bem-estar básico",
          icon: "🏠",
          color: "#10B981",
          examples: [
            "Alimentação básica",
            "Moradia",
            "Saúde",
            "Educação",
            "Transporte essencial"
          ]
        },
        {
          name: "Desejos",
          description: "Itens que melhoram a qualidade de vida, mas não são essenciais",
          icon: "🎯",
          color: "#F59E0B",
          examples: [
            "Entretenimento",
            "Luxos",
            "Tecnologia avançada",
            "Viagens",
            "Acessórios"
          ]
        }
      ],
      
      // Sistema de pontuação
      scoring: {
        perfect: 100,
        good: 80,
        average: 60,
        pointsPerCorrect: 10
      },
      
      // Feedback educacional
      feedback: {
        correct: "Correto! Você classificou adequadamente este item.",
        incorrect: "Tente novamente! Pense se este item é essencial para sua sobrevivência ou apenas um desejo.",
        complete: "Parabéns! Você entendeu a diferença entre necessidades e desejos!",
        tips: [
          "Necessidades são essenciais para sobrevivência e bem-estar básico",
          "Desejos melhoram a qualidade de vida, mas não são essenciais",
          "Priorize necessidades antes de satisfazer desejos",
          "Alguns itens podem ser necessidades em certas situações e desejos em outras"
        ]
      },
      
      // Configurações do jogo
      settings: {
        allowMultipleCategories: false,
        showExplanations: true,
        timeLimit: 480, // 8 minutos
        shuffleItems: true
      },
      
      // Metadados educacionais
      metadata: {
        difficulty: 1,
        estimatedTime: "8-12 minutos",
        learningObjectives: [
          "Distinguir entre necessidades e desejos",
          "Desenvolver consciência sobre prioridades financeiras",
          "Aprender a fazer escolhas conscientes de consumo",
          "Entender a importância de priorizar gastos"
        ],
        skills: [
          "classificação",
          "priorização",
          "consciência-financeira",
          "tomada-de-decisão"
        ]
      }
    };
    
    // Atualizar a lição
    lesson.content = newClassifyStructure;
    lesson.updatedAt = new Date();
    
    await lesson.save();
    
    console.log('✅ Template Classify criado com sucesso!');
    console.log('📊 Itens criados:', newClassifyStructure.items.length);
    console.log('🏷️ Categorias:', newClassifyStructure.categories.length);
    console.log('⏱️ Tempo estimado: 8-12 minutos');
    console.log('\n🎮 Funcionalidades incluídas:');
    console.log('   ✅ Sistema de classificação por categorias');
    console.log('   ✅ 10 itens para classificar');
    console.log('   ✅ Explicações educacionais');
    console.log('   ✅ Sistema de pontuação');
    console.log('   ✅ Dicas sobre necessidades vs desejos');
    
  } catch (error) {
    console.error('❌ Erro ao criar template classify:', error);
  } finally {
    mongoose.connection.close();
  }
}

createClassifyTemplate();


















