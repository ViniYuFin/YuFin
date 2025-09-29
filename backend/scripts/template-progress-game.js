const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function createProgressGameTemplate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Lesson = mongoose.model('Lesson', new mongoose.Schema({}, { strict: false }));
    
    console.log('🎮 CRIANDO TEMPLATE PROGRESS GAME PERSONALIZADO');
    console.log('============================================================');
    
    // Buscar a lição "Poupança para pequenos objetivos"
    const lesson = await Lesson.findOne({ 
      title: { $regex: /Poupança.*pequenos.*objetivos/i },
      gradeId: "6º Ano"
    });
    
    if (!lesson) {
      console.log('❌ Lição "Poupança para pequenos objetivos" não encontrada');
      return;
    }
    
    console.log('📋 Lição encontrada:', lesson.title);
    console.log('📊 Série:', lesson.gradeId);
    console.log('🎯 Tipo:', lesson.type);
    
    // ESTRUTURA PERSONALIZADA PARA PROGRESS GAME
    const newProgressGameStructure = {
      // Cenário principal
      scenario: "Desafio de Poupança: Você tem 6 meses para juntar dinheiro para seu objetivo!",
      
      // Objetivo da poupança
      goal: {
        item: "Videogame",
        price: 300,
        description: "Um videogame que você sempre quis ter"
      },
      
      // Meses do jogo (6 meses) com escolhas mais interessantes
      months: [
        {
          month: 1,
          income: 100,
          scenario: "Você recebeu sua mesada! O que você vai fazer?",
          choices: [
            {
              id: "save_plan",
              title: "Fazer um plano de poupança",
              description: "Separar R$ 60 para poupança e R$ 40 para gastos essenciais",
              savings: 60,
              expenses: [
                { item: "Lanche na escola", amount: 20 },
                { item: "Material escolar", amount: 15 },
                { item: "Transporte", amount: 5 }
              ],
              feedback: "🎯 Excelente! Você fez um plano inteligente e poupou R$ 60,00!",
              isCorrect: true
            },
            {
              id: "spend_all",
              title: "Gastar tudo com diversão",
              description: "Ir ao shopping e comprar coisas legais",
              savings: 0,
              expenses: [
                { item: "Cinema", amount: 30 },
                { item: "Lanche no shopping", amount: 25 },
                { item: "Jogos", amount: 25 },
                { item: "Transporte", amount: 20 }
              ],
              feedback: "💸 Você gastou tudo! Lembre-se: diversão é importante, mas poupar também!",
              isCorrect: false
            }
          ]
        },
        {
          month: 2,
          income: 100,
          scenario: "Seus amigos convidaram você para uma festa!",
          choices: [
            {
              id: "budget_party",
              title: "Ir à festa com orçamento controlado",
              description: "Poupar R$ 50 e gastar R$ 50 na festa",
              savings: 50,
              expenses: [
                { item: "Presente para aniversariante", amount: 20 },
                { item: "Lanche na festa", amount: 15 },
                { item: "Transporte", amount: 15 }
              ],
              feedback: "🎉 Ótima escolha! Você se divertiu e ainda poupou R$ 50,00!",
              isCorrect: true
            },
            {
              id: "expensive_party",
              title: "Fazer a festa valer a pena",
              description: "Comprar presente caro e gastar muito",
              savings: 10,
              expenses: [
                { item: "Presente caro", amount: 50 },
                { item: "Lanche premium", amount: 25 },
                { item: "Transporte", amount: 15 }
              ],
              feedback: "🎁 Você foi muito generoso, mas poupou pouco. Equilíbrio é a chave!",
              isCorrect: false
            }
          ]
        },
        {
          month: 3,
          income: 100,
          scenario: "Apareceu uma promoção incrível no seu jogo favorito!",
          choices: [
            {
              id: "resist_temptation",
              title: "Resistir à tentação",
              description: "Manter o foco na meta e poupar R$ 65",
              savings: 65,
              expenses: [
                { item: "Lanche na escola", amount: 15 },
                { item: "Material escolar", amount: 10 },
                { item: "Transporte", amount: 10 }
              ],
              feedback: "💪 Incrível! Você resistiu à tentação e poupou R$ 65,00!",
              isCorrect: true
            },
            {
              id: "buy_game",
              title: "Comprar o jogo em promoção",
              description: "Aproveitar a oferta e gastar R$ 40 no jogo",
              savings: 30,
              expenses: [
                { item: "Jogo em promoção", amount: 40 },
                { item: "Lanche na escola", amount: 20 },
                { item: "Material escolar", amount: 10 }
              ],
              feedback: "🎮 Você comprou o jogo, mas poupou menos. Tente equilibrar melhor!",
              isCorrect: false
            }
          ]
        },
        {
          month: 4,
          income: 100,
          scenario: "Você precisa de roupas novas para a escola!",
          choices: [
            {
              id: "smart_shopping",
              title: "Comprar com inteligência",
              description: "Procurar promoções e comprar apenas o necessário",
              savings: 55,
              expenses: [
                { item: "Roupas em promoção", amount: 30 },
                { item: "Lanche na escola", amount: 10 },
                { item: "Transporte", amount: 5 }
              ],
              feedback: "🛍️ Perfeito! Você comprou o que precisava e ainda poupou R$ 55,00!",
              isCorrect: true
            },
            {
              id: "brand_shopping",
              title: "Comprar roupas de marca",
              description: "Investir em roupas caras e de qualidade",
              savings: 20,
              expenses: [
                { item: "Roupas de marca", amount: 60 },
                { item: "Lanche na escola", amount: 15 },
                { item: "Transporte", amount: 5 }
              ],
              feedback: "👕 Você comprou roupas bonitas, mas poupou pouco. Qualidade tem preço!",
              isCorrect: false
            }
          ]
        },
        {
          month: 5,
          income: 100,
          scenario: "Falta apenas 1 mês para sua meta! Você está quase lá!",
          choices: [
            {
              id: "final_push",
              title: "Fazer o esforço final",
              description: "Poupar o máximo possível para alcançar a meta",
              savings: 70,
              expenses: [
                { item: "Lanche na escola", amount: 15 },
                { item: "Material escolar", amount: 10 },
                { item: "Transporte", amount: 5 }
              ],
              feedback: "🚀 Fantástico! R$ 70,00 poupados! Você está muito perto da meta!",
              isCorrect: true
            },
            {
              id: "relax_effort",
              title: "Relaxar um pouco",
              description: "Gastar mais este mês, já que está quase lá",
              savings: 40,
              expenses: [
                { item: "Cinema com amigos", amount: 25 },
                { item: "Lanche na escola", amount: 20 },
                { item: "Material escolar", amount: 15 }
              ],
              feedback: "😌 Você relaxou um pouco, mas ainda poupou R$ 40,00. Cuidado com a ansiedade!",
              isCorrect: false
            }
          ]
        },
        {
          month: 6,
          income: 100,
          scenario: "Último mês! Você conseguiu alcançar sua meta?",
          choices: [
            {
              id: "victory_lap",
              title: "Completar com sucesso",
              description: "Poupar mais um pouco e comemorar a conquista",
              savings: 60,
              expenses: [
                { item: "Lanche na escola", amount: 20 },
                { item: "Material escolar", amount: 15 },
                { item: "Transporte", amount: 5 }
              ],
              feedback: "🏆 PARABÉNS! Você alcançou sua meta e ainda poupou R$ 60,00 extra!",
              isCorrect: true
            },
            {
              id: "celebration_spending",
              title: "Comemorar a conquista",
              description: "Gastar um pouco mais para celebrar",
              savings: 35,
              expenses: [
                { item: "Festa de comemoração", amount: 35 },
                { item: "Lanche na escola", amount: 20 },
                { item: "Transporte", amount: 10 }
              ],
              feedback: "🎊 Você comemorou, mas poupou menos. Ainda assim, parabéns pela jornada!",
              isCorrect: false
            }
          ]
        }
      ],
      
      // Mensagem final
      finalGoal: "Parabéns! Você conseguiu juntar dinheiro suficiente para comprar seu videogame! Aprendeu que com disciplina e planejamento, é possível alcançar seus objetivos financeiros!",
      
      // Sistema de feedback
      feedback: {
        success: "🎉 Excelente! Você fez escolhas inteligentes e alcançou sua meta!",
        warning: "👍 Bom trabalho! Você está no caminho certo, mas pode melhorar!",
        failure: "💡 Continue tentando! A disciplina financeira é uma habilidade que se desenvolve com prática!",
        perfect: "🏆 Perfeito! Você dominou a arte de poupar dinheiro!"
      },
      
      // Dicas educativas
      tips: [
        "Sempre separe uma parte da sua mesada para poupança",
        "Evite gastos desnecessários",
        "Planeje seus gastos antes de receber o dinheiro",
        "Lembre-se: pequenas economias fazem grande diferença",
        "Tenha paciência - objetivos financeiros levam tempo"
      ],
      
      // Configurações do jogo
      gameConfig: {
        totalMonths: 6,
        targetAmount: 300,
        difficulty: "facil",
        timeLimit: null,
        allowRetry: true,
        showProgress: true
      },
      
      // Sistema de pontuação
      scoring: {
        pointsPerMonth: 15,
        bonusForPerfectMonth: 5,
        bonusForReachingGoal: 20,
        maxPoints: 100
      },
      
      // Metadados
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        totalSavings: 320, // Soma de todos os meses
        averageMonthlySavings: 53.33,
        goalAchieved: true
      }
    };
    
    // Forçar atualização completa da lição
    const updateResult = await Lesson.updateOne(
      { _id: lesson._id },
      { 
        $set: { 
          content: newProgressGameStructure,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('🔄 Resultado da atualização:', updateResult);
    
    console.log('✅ Template progress game criado com sucesso!');
    console.log('📊 Meses criados:', newProgressGameStructure.months.length);
    console.log('🎯 Meta:', newProgressGameStructure.goal.item + ' - R$ ' + newProgressGameStructure.goal.price);
    console.log('💰 Poupança total possível:', newProgressGameStructure.metadata.totalSavings);
    console.log('⏱️ Tempo estimado: 10-15 minutos');
    
  } catch (error) {
    console.error('❌ Erro ao criar template progress game:', error);
  } finally {
    mongoose.connection.close();
  }
}

createProgressGameTemplate();
