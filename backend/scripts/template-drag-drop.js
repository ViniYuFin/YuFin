require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

mongoose.connect(process.env.MONGODB_URI);

async function createDragDropTemplate() {
  try {
    console.log('🎯 CRIANDO TEMPLATE DRAG & DROP PERSONALIZADO');
    console.log('='.repeat(60));
    
    // Buscar a lição "Economizando em Casa"
    const lesson = await Lesson.findOne({ title: 'Economizando em Casa' });
    
    if (!lesson) {
      console.log('❌ Lição "Economizando em Casa" não encontrada');
      return;
    }
    
    console.log('📋 Lição encontrada:', lesson.title);
    console.log('📊 Série:', lesson.gradeId);
    console.log('🎯 Tipo:', lesson.type);
    
    // ESTRUTURA PERSONALIZADA PARA DRAG & DROP
    const newDragDropStructure = {
      // Cenário principal
      scenario: "Você está organizando sua casa e precisa classificar diferentes itens e ações em categorias de economia. Arraste cada item para a zona correta!",
      
      // Itens que podem ser arrastados
      items: [
        {
          id: "item-1",
          text: "Desligar luzes ao sair",
          correctZone: "economia-energia",
          description: "Ação que economiza energia elétrica"
        },
        {
          id: "item-2", 
          text: "Tomar banhos mais curtos",
          correctZone: "economia-agua",
          description: "Ação que economiza água"
        },
        {
          id: "item-3",
          text: "Comprar produtos em promoção",
          correctZone: "economia-dinheiro",
          description: "Ação que economiza dinheiro"
        },
        {
          id: "item-4",
          text: "Reutilizar embalagens",
          correctZone: "economia-ambiente",
          description: "Ação que economiza recursos naturais"
        },
        {
          id: "item-5",
          text: "Fechar torneiras bem",
          correctZone: "economia-agua",
          description: "Ação que evita desperdício de água"
        },
        {
          id: "item-6",
          text: "Usar lâmpadas LED",
          correctZone: "economia-energia",
          description: "Ação que economiza energia elétrica"
        },
        {
          id: "item-7",
          text: "Fazer lista de compras",
          correctZone: "economia-dinheiro",
          description: "Ação que evita compras desnecessárias"
        },
        {
          id: "item-8",
          text: "Compostar restos de comida",
          correctZone: "economia-ambiente",
          description: "Ação que economiza recursos naturais"
        }
      ],
      
      // Zonas de destino (drop zones)
      dropZones: [
        {
          id: "economia-energia",
          name: "Economia de Energia",
          description: "Ações que ajudam a economizar energia elétrica",
          icon: "⚡",
          color: "#F59E0B",
          position: { x: 50, y: 100 }
        },
        {
          id: "economia-agua", 
          name: "Economia de Água",
          description: "Ações que ajudam a economizar água",
          icon: "💧",
          color: "#3B82F6",
          position: { x: 50, y: 200 }
        },
        {
          id: "economia-dinheiro",
          name: "Economia de Dinheiro", 
          description: "Ações que ajudam a economizar dinheiro",
          icon: "💰",
          color: "#10B981",
          position: { x: 50, y: 300 }
        },
        {
          id: "economia-ambiente",
          name: "Economia Ambiental",
          description: "Ações que ajudam a economizar recursos naturais",
          icon: "🌱",
          color: "#8B5CF6",
          position: { x: 50, y: 400 }
        }
      ],
      
      // Instruções do jogo
      instructions: [
        "Arraste cada item para a zona de economia correta",
        "Cada item pertence a uma categoria específica",
        "Complete todas as classificações para finalizar"
      ],
      
      // Sistema de pontuação
      scoring: {
        perfect: 100,
        good: 80,
        average: 60,
        pointsPerCorrect: 12.5
      },
      
      // Feedback educacional
      feedback: {
        correct: "Correto! Você classificou corretamente a ação de economia.",
        incorrect: "Tente novamente! Pense em qual tipo de economia esta ação representa.",
        complete: "Parabéns! Você entendeu como economizar em casa de diferentes formas!",
        tips: [
          "Energia: ações que reduzem consumo de eletricidade",
          "Água: ações que reduzem desperdício de água", 
          "Dinheiro: ações que reduzem gastos desnecessários",
          "Ambiente: ações que reduzem impacto ambiental"
        ]
      },
      
      // Configurações visuais
      visual: {
        itemStyle: {
          backgroundColor: "#F3F4F6",
          border: "2px dashed #9CA3AF",
          borderRadius: "8px",
          padding: "12px",
          margin: "8px",
          cursor: "grab"
        },
        dropZoneStyle: {
          backgroundColor: "#FEF3C7",
          border: "2px solid #F59E0B",
          borderRadius: "12px",
          padding: "16px",
          minHeight: "80px"
        },
        correctStyle: {
          backgroundColor: "#D1FAE5",
          border: "2px solid #10B981"
        },
        incorrectStyle: {
          backgroundColor: "#FEE2E2", 
          border: "2px solid #EF4444"
        }
      },
      
      // Metadados educacionais
      metadata: {
        difficulty: 2,
        estimatedTime: "10-15 minutos",
        learningObjectives: [
          "Identificar diferentes tipos de economia doméstica",
          "Classificar ações por categoria de economia",
          "Desenvolver consciência sobre consumo responsável"
        ],
        skills: [
          "classificação",
          "economia-doméstica", 
          "consciência-ambiental",
          "organização"
        ]
      }
    };
    
    // Atualizar a lição
    lesson.content = newDragDropStructure;
    lesson.updatedAt = new Date();
    
    await lesson.save();
    
    console.log('✅ Template Drag & Drop criado com sucesso!');
    console.log('📊 Itens criados:', newDragDropStructure.items.length);
    console.log('🎯 Zonas de destino:', newDragDropStructure.dropZones.length);
    console.log('⏱️ Tempo estimado: 10-15 minutos');
    console.log('\n🎮 Funcionalidades incluídas:');
    console.log('   ✅ Sistema de arrastar e soltar');
    console.log('   ✅ 4 categorias de economia');
    console.log('   ✅ 8 itens para classificar');
    console.log('   ✅ Feedback educacional');
    console.log('   ✅ Sistema de pontuação');
    console.log('   ✅ Dicas visuais');
    
  } catch (error) {
    console.error('❌ Erro ao criar template drag & drop:', error);
  } finally {
    mongoose.connection.close();
  }
}

createDragDropTemplate();
















