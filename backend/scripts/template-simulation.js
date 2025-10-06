require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

mongoose.connect(process.env.MONGODB_URI);

async function createSimulationTemplate() {
  try {
    console.log('🎮 CRIANDO TEMPLATE SIMULATION PERSONALIZADO');
    console.log('='.repeat(60));
    
    // Buscar a lição "A História do Dinheiro"
    const lesson = await Lesson.findOne({ title: 'A História do Dinheiro' });
    
    if (!lesson) {
      console.log('❌ Lição "A História do Dinheiro" não encontrada');
      return;
    }
    
    console.log('📋 Lição encontrada:', lesson.title);
    console.log('📊 Série:', lesson.gradeId);
    console.log('🎯 Tipo:', lesson.type);
    
    // ESTRUTURA PERSONALIZADA PARA SIMULATION
    const newSimulationStructure = {
      // Cenário principal
      scenario: {
        title: "A História do Dinheiro",
        description: "Você é um arqueólogo descobrindo como o dinheiro evoluiu ao longo da história. Sua missão é entender cada etapa da evolução monetária."
      },
      
      // Fases progressivas da simulação
      phases: [
        {
          title: "Fase 1: Origem do Dinheiro",
          description: "Como começou o sistema de trocas?",
          choices: [
            {
              text: "Com o escambo (troca direta de mercadorias)",
              choice: "Com o escambo (troca direta de mercadorias)",
              value: "escambo",
              correct: true,
              feedback: "Correto! O escambo foi a primeira forma de troca, onde as pessoas trocavam mercadorias diretamente.",
              outcome: "Correto! O escambo foi a primeira forma de troca, onde as pessoas trocavam mercadorias diretamente."
            },
            {
              text: "Com as moedas de metal",
              choice: "Com as moedas de metal",
              value: "moedas_metal",
              correct: false,
              feedback: "Incorreto! As moedas de metal vieram depois do escambo, quando as pessoas precisavam de um meio de troca mais prático.",
              outcome: "Incorreto! As moedas de metal vieram depois do escambo, quando as pessoas precisavam de um meio de troca mais prático."
            },
            {
              text: "Com o sistema bancário moderno",
              choice: "Com o sistema bancário moderno",
              value: "sistema_bancario",
              correct: false,
              feedback: "Incorreto! O sistema bancário é muito recente. Precisamos entender a evolução desde o início.",
              outcome: "Incorreto! O sistema bancário é muito recente. Precisamos entender a evolução desde o início."
            }
          ]
        },
        {
          title: "Fase 2: Evolução das Moedas",
          description: "Como as moedas se desenvolveram ao longo do tempo?",
          choices: [
            {
              text: "Primeiro com ouro e prata, depois papel e por último digitais",
              choice: "Primeiro com ouro e prata, depois papel e por último digitais",
              value: "evolucao_completa",
              correct: true,
              feedback: "Excelente! As moedas evoluíram: primeiro ouro e prata (valor intrínseco), depois papel (confiança), e por último digitais (tecnologia).",
              outcome: "Excelente! As moedas evoluíram: primeiro ouro e prata (valor intrínseco), depois papel (confiança), e por último digitais (tecnologia)."
            },
            {
              text: "Primeiro com papel, depois ouro e prata, e por último digitais",
              choice: "Primeiro com papel, depois ouro e prata, e por último digitais",
              value: "papel_primeiro",
              correct: false,
              feedback: "Incorreto! As moedas de papel (cédulas) vieram muito depois das de metal, quando as pessoas já confiavam no valor representado.",
              outcome: "Incorreto! As moedas de papel (cédulas) vieram muito depois das de metal, quando as pessoas já confiavam no valor representado."
            },
            {
              text: "Primeiro digitais, depois ouro e prata, e por último papel",
              choice: "Primeiro digitais, depois ouro e prata, e por último papel",
              value: "digitais_primeiro",
              correct: false,
              feedback: "Incorreto! As moedas digitais são muito recentes, surgiram apenas com a tecnologia da internet, muito depois das moedas físicas.",
              outcome: "Incorreto! As moedas digitais são muito recentes, surgiram apenas com a tecnologia da internet, muito depois das moedas físicas."
            }
          ]
        },
        {
          title: "Fase 3: Dinheiro Moderno",
          description: "Como funciona o dinheiro nos dias de hoje?",
          choices: [
            {
              text: "Através de múltiplas formas: físico, digital, cartões e transferências",
              choice: "Através de múltiplas formas: físico, digital, cartões e transferências",
              value: "multiplas_formas",
              correct: true,
              feedback: "Perfeito! Hoje o dinheiro funciona de várias formas: físico (cédulas e moedas), digital (PIX, transferências), cartões e até criptomoedas.",
              outcome: "Perfeito! Hoje o dinheiro funciona de várias formas: físico (cédulas e moedas), digital (PIX, transferências), cartões e até criptomoedas."
            },
            {
              text: "Apenas através de dinheiro físico (cédulas e moedas)",
              choice: "Apenas através de dinheiro físico (cédulas e moedas)",
              value: "só_fisico",
              correct: false,
              feedback: "Incorreto! Embora o dinheiro físico ainda exista, hoje temos muitas outras formas como PIX, cartões e transferências digitais.",
              outcome: "Incorreto! Embora o dinheiro físico ainda exista, hoje temos muitas outras formas como PIX, cartões e transferências digitais."
            },
            {
              text: "Apenas através de cartões de crédito e débito",
              choice: "Apenas através de cartões de crédito e débito",
              value: "só_cartoes",
              correct: false,
              feedback: "Incorreto! Cartões são uma forma importante, mas o dinheiro funciona também através de PIX, transferências, dinheiro físico e outras formas.",
              outcome: "Incorreto! Cartões são uma forma importante, mas o dinheiro funciona também através de PIX, transferências, dinheiro físico e outras formas."
            }
          ]
        }
      ],
      
      // Conclusão da simulação
      conclusion: {
        message: "Parabéns! Você entendeu toda a evolução do dinheiro: desde o escambo até as formas modernas de pagamento. O dinheiro evoluiu para facilitar as trocas e hoje temos muitas opções!"
      },
      
      // Sistema de pontuação
      scoring: {
        perfect: 100,
        good: 80,
        average: 60,
        pointsPerPhase: 33.33
      },
      
      // Configurações da simulação
      settings: {
        allowRetry: true,
        showProgress: true,
        timeLimit: 600, // 10 minutos
        phases: 3
      }
    };
    
    // Atualizar a lição
    lesson.content = newSimulationStructure;
    lesson.updatedAt = new Date();
    
    await lesson.save();
    
    console.log('✅ Template Simulation criado com sucesso!');
    console.log('📊 Fases criadas:', newSimulationStructure.phases.length);
    console.log('🎯 Escolhas por fase:', newSimulationStructure.phases[0].choices.length);
    console.log('⏱️ Tempo estimado: 10-15 minutos');
    console.log('\n🎮 Funcionalidades incluídas:');
    console.log('   ✅ 3 fases progressivas');
    console.log('   ✅ Sistema de escolhas múltiplas');
    console.log('   ✅ Feedback educacional detalhado');
    console.log('   ✅ Sistema de pontuação por fase');
    console.log('   ✅ Conclusão personalizada');
    
  } catch (error) {
    console.error('❌ Erro ao criar template simulation:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSimulationTemplate();













