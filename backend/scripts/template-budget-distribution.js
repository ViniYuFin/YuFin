const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const Lesson = require('../models/Lesson');
    
    // Buscar a lição "O Orçamento da Família"
    const lesson = await Lesson.findOne({ title: 'O Orçamento da Família' });
    
    if (!lesson) {
      console.log('❌ Lição "O Orçamento da Família" (6º Ano) não encontrada');
      process.exit(1);
    }
    
    console.log('✅ Lição encontrada:', lesson.title);
    console.log('📊 Formato atual:', lesson.content?.format);
    
    // Criar template otimizado para budget-distribution
    const optimizedContent = {
      format: 'budget-distribution',
      gameConfig: {
        type: 'budget-distribution',
        totalBudget: 5000,
        currency: 'R$',
        timeLimit: null, // Sem limite de tempo
        allowOverBudget: false,
        showRemaining: true
      },
      instructions: [
        'Distribua o orçamento mensal da família entre as diferentes categorias',
        'Considere as necessidades da família ao fazer a distribuição',
        'Descubra como a renda afeta as oportunidades disponíveis'
      ],
      categories: [
        {
          id: 'alimentacao',
          name: 'Alimentação',
          description: 'Compras de supermercado, feira e alimentação básica',
          suggestedPercentage: 30,
          suggestedAmount: 1500, // Valor base para R$ 5.000
          icon: '🍎',
          color: '#10B981',
          priority: 'high'
        },
        {
          id: 'moradia',
          name: 'Moradia',
          description: 'Aluguel, financiamento, condomínio, IPTU',
          suggestedPercentage: 35,
          suggestedAmount: 1750, // Valor base para R$ 5.000
          icon: '🏠',
          color: '#3B82F6',
          priority: 'high'
        },
        {
          id: 'transporte',
          name: 'Transporte',
          description: 'Combustível, transporte público, manutenção do veículo',
          suggestedPercentage: 15,
          suggestedAmount: 750, // Valor base para R$ 5.000
          icon: '🚗',
          color: '#F59E0B',
          priority: 'medium'
        },
        {
          id: 'saude',
          name: 'Saúde',
          description: 'Plano de saúde, medicamentos, consultas médicas',
          suggestedPercentage: 10,
          suggestedAmount: 500, // Valor base para R$ 5.000
          icon: '⚕️',
          color: '#EF4444',
          priority: 'high'
        },
        {
          id: 'educacao',
          name: 'Educação',
          description: 'Escola, cursos, material escolar, livros',
          suggestedPercentage: 8,
          suggestedAmount: 400, // Valor base para R$ 5.000
          icon: '📚',
          color: '#8B5CF6',
          priority: 'high'
        },
        {
          id: 'lazer',
          name: 'Lazer',
          description: 'Cinema, restaurantes, viagens, entretenimento',
          suggestedPercentage: 2,
          suggestedAmount: 100, // Valor base para R$ 5.000
          icon: '🎬',
          color: '#EC4899',
          priority: 'low'
        }
      ],
      scenarios: [
        {
          id: 'scenario-1',
          title: 'Família de Baixa Renda',
          description: 'Priorize necessidades básicas - Escolas públicas, SUS, moradia simples',
          totalBudget: 2500,
          classLevel: 'baixa',
          opportunities: [
            'Escola pública gratuita',
            'Atendimento pelo SUS',
            'Moradia em bairros populares',
            'Transporte público',
            'Lazer em espaços públicos'
          ],
          adjustments: {
            alimentacao: { multiplier: 0.6, reason: 'Alimentação básica (R$ 900)' },
            moradia: { multiplier: 0.514, reason: 'Moradia simples (R$ 900)' },
            transporte: { multiplier: 0.4, reason: 'Transporte público (R$ 300)' },
            saude: { multiplier: 0.2, reason: 'Dependência do SUS (R$ 100)' },
            educacao: { multiplier: 0.3, reason: 'Escola pública (R$ 120)' },
            lazer: { multiplier: 0.3, reason: 'Lazer limitado (R$ 30)' }
          }
        },
        {
          id: 'scenario-2',
          title: 'Família de Média Renda',
          description: 'Equilibre necessidades e qualidade de vida - Escola particular básica, plano de saúde',
          totalBudget: 5000,
          classLevel: 'media',
          opportunities: [
            'Escola particular básica',
            'Plano de saúde básico',
            'Moradia confortável',
            'Carro popular',
            'Lazer moderado'
          ],
          adjustments: {
            alimentacao: { multiplier: 1.0, reason: 'Alimentação balanceada (R$ 1.500)' },
            moradia: { multiplier: 1.0, reason: 'Moradia confortável (R$ 1.750)' },
            saude: { multiplier: 1.0, reason: 'Plano de saúde básico (R$ 500)' },
            educacao: { multiplier: 1.0, reason: 'Escola particular básica (R$ 400)' },
            lazer: { multiplier: 1.0, reason: 'Lazer moderado (R$ 100)' }
          }
        },
        {
          id: 'scenario-3',
          title: 'Família de Alta Renda',
          description: 'Invista em qualidade e conforto - Escola de elite, plano premium, viagens',
          totalBudget: 10000,
          classLevel: 'alta',
          opportunities: [
            'Escola particular de elite',
            'Plano de saúde premium',
            'Moradia de luxo',
            'Carro de luxo',
            'Viagens internacionais',
            'Cursos e atividades extras'
          ],
          adjustments: {
            alimentacao: { multiplier: 1.2, reason: 'Alimentação de qualidade (R$ 1.800)' },
            moradia: { multiplier: 2.0, reason: 'Moradia de luxo (R$ 3.500)' },
            saude: { multiplier: 2.0, reason: 'Plano de saúde premium (R$ 1.000)' },
            educacao: { multiplier: 2.5, reason: 'Escola particular de elite (R$ 1.000)' },
            lazer: { multiplier: 2.0, reason: 'Lazer e viagens (R$ 200)' }
          }
        }
      ],
      feedback: {
        perfect: {
          message: 'Excelente! Você distribuiu o orçamento de forma equilibrada e realista para a classe social escolhida.',
          tips: [
            'Priorizou as necessidades básicas (alimentação, moradia, saúde)',
            'Manteve uma reserva para emergências',
            'Equilibrou gastos essenciais com qualidade de vida',
            'Aproveitou as oportunidades disponíveis para sua classe social'
          ]
        },
        good: {
          message: 'Boa distribuição! Pequenos ajustes podem otimizar ainda mais o orçamento.',
          tips: [
            'Verifique se não está gastando demais em uma categoria',
            'Considere reduzir gastos não essenciais se necessário',
            'Lembre-se de manter uma reserva para imprevistos',
            'Aproveite melhor as oportunidades da sua classe social'
          ]
        },
        needsImprovement: {
          message: 'A distribuição pode ser melhorada. Revise as prioridades da família.',
          tips: [
            'Priorize gastos essenciais como alimentação, moradia e saúde',
            'Reduza gastos com lazer se o orçamento estiver apertado',
            'Considere a realidade financeira da família',
            'Foque nas oportunidades disponíveis para sua classe social'
          ]
        }
      },
      visual: {
        chartType: 'pie',
        showPercentages: true,
        showAmounts: true,
        animation: true,
        colors: {
          alimentacao: '#10B981',
          moradia: '#3B82F6',
          transporte: '#F59E0B',
          saude: '#EF4444',
          educacao: '#8B5CF6',
          lazer: '#EC4899'
        }
      },
      metadata: {
        difficulty: 3,
        estimatedTime: '10-15 minutos',
        learningObjectives: [
          'Compreender a importância do planejamento financeiro familiar',
          'Aprender a distribuir recursos entre diferentes necessidades',
          'Desenvolver consciência sobre prioridades financeiras',
          'Praticar tomada de decisões financeiras responsáveis'
        ],
        skills: ['planejamento-financeiro', 'orçamento-familiar', 'priorização-gastos', 'educação-financeira']
      }
    };
    
    // Atualizar a lição com o novo conteúdo
    lesson.content = optimizedContent;
    lesson.updatedAt = new Date();
    
    await lesson.save();
    
    console.log('✅ Template budget-distribution criado com sucesso!');
    console.log('📊 Categorias criadas:', optimizedContent.categories.length);
    console.log('💰 Orçamento total:', optimizedContent.gameConfig.totalBudget);
    console.log('🎯 Cenários disponíveis:', optimizedContent.scenarios.length);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
  });
