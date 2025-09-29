require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

mongoose.connect(process.env.MONGODB_URI);

async function createMathProblemsTemplate() {
  try {
    console.log('🧮 CRIANDO TEMPLATE MATH PROBLEMS PERSONALIZADO');
    console.log('='.repeat(60));
    
    // Buscar a lição "Juros Compostos" (8º Ano)
    const lesson = await Lesson.findOne({ title: 'Juros Compostos' });
    
    if (!lesson) {
      console.log('❌ Lição "Juros Compostos" (8º Ano) não encontrada');
      return;
    }
    
    console.log('📋 Lição encontrada:', lesson.title);
    console.log('📊 Série:', lesson.gradeId);
    console.log('🎯 Tipo:', lesson.type);
    
    // NOVA ESTRUTURA PERSONALIZADA PARA MATH PROBLEMS
    const newMathStructure = {
      // Configuração do formato do jogo
      format: 'math-problems',
      gameConfig: {
        type: 'math-problems',
        difficulty: 'intermediate',
        timeLimit: null, // Sem limite de tempo para permitir reflexão
        allowMultipleAttempts: true,
        showHints: true,
        showStepByStep: true
      },
      
      // Instruções claras e motivadoras
      instructions: [
        "Resolva os problemas de juros compostos passo a passo",
        "Use a fórmula: M = C × (1 + i)^t",
        "Leia cada problema com atenção e identifique os dados",
        "Calcule com precisão e verifique sua resposta"
      ],
      
      // Problemas progressivos com diferentes níveis de dificuldade
      problems: [
        {
          id: 1,
          level: 'básico',
          title: 'Poupança Simples',
          context: '💰 Poupança pessoal',
          question: 'João aplicou R$ 1.000,00 em uma poupança que rende 0,5% ao mês. Quanto ele terá após 12 meses?',
          givenData: {
            capital: 1000,
            taxa: 0.5, // 0,5% ao mês
            tempo: 12, // 12 meses
            taxaUnidade: 'mensal'
          },
          formula: 'M = C × (1 + i)^t',
          steps: [
            '1. Identificar os dados: C = R$ 1.000,00, i = 0,5% = 0,005, t = 12 meses',
            '2. Aplicar a fórmula: M = 1000 × (1 + 0,005)^12',
            '3. Calcular: M = 1000 × (1,005)^12',
            '4. Resolver: M = 1000 × 1,061677812 = R$ 1.061,68'
          ],
          correctAnswer: 1061.68,
          tolerance: 0.01,
          explanation: 'O montante final é R$ 1.061,68. João ganhou R$ 61,68 de juros em 12 meses.',
          hint: 'Lembre-se: taxa de 0,5% = 0,005 na fórmula'
        },
        
        {
          id: 2,
          level: 'intermediário',
          title: 'Investimento em CDB',
          context: '🏦 Investimento bancário',
          question: 'Maria investiu R$ 5.000,00 em um CDB que rende 1,2% ao mês. Qual será o montante após 18 meses?',
          givenData: {
            capital: 5000,
            taxa: 1.2, // 1,2% ao mês
            tempo: 18, // 18 meses
            taxaUnidade: 'mensal'
          },
          formula: 'M = C × (1 + i)^t',
          steps: [
            '1. Dados: C = R$ 5.000,00, i = 1,2% = 0,012, t = 18 meses',
            '2. Fórmula: M = 5000 × (1 + 0,012)^18',
            '3. Cálculo: M = 5000 × (1,012)^18',
            '4. Resultado: M = 5000 × 1,239506 = R$ 6.197,53'
          ],
          correctAnswer: 6197.53,
          tolerance: 0.01,
          explanation: 'Maria terá R$ 6.197,53 após 18 meses, ganhando R$ 1.197,53 de juros.',
          hint: 'Taxa de 1,2% = 0,012. Use calculadora para (1,012)^18'
        },
        
        {
          id: 3,
          level: 'avançado',
          title: 'Financiamento de Carro',
          context: '🚗 Financiamento automotivo',
          question: 'Carlos financiou um carro por R$ 30.000,00 a uma taxa de 2,5% ao mês. Se ele pagar em 24 meses, qual será o valor total pago?',
          givenData: {
            capital: 30000,
            taxa: 2.5, // 2,5% ao mês
            tempo: 24, // 24 meses
            taxaUnidade: 'mensal'
          },
          formula: 'M = C × (1 + i)^t',
          steps: [
            '1. Dados: C = R$ 30.000,00, i = 2,5% = 0,025, t = 24 meses',
            '2. Fórmula: M = 30000 × (1 + 0,025)^24',
            '3. Cálculo: M = 30000 × (1,025)^24',
            '4. Resultado: M = 30000 × 1,808725 = R$ 54.261,75'
          ],
          correctAnswer: 54261.75,
          tolerance: 0.01,
          explanation: 'Carlos pagará R$ 54.261,75 no total, sendo R$ 24.261,75 de juros.',
          hint: 'Taxa de 2,5% = 0,025. O valor dos juros é significativo!'
        },
        
        {
          id: 4,
          level: 'intermediário',
          title: 'Aplicação com Taxa Anual',
          context: '📈 Investimento de longo prazo',
          question: 'Ana aplicou R$ 2.000,00 em um fundo que rende 12% ao ano. Quanto ela terá após 3 anos?',
          givenData: {
            capital: 2000,
            taxa: 12, // 12% ao ano
            tempo: 3, // 3 anos
            taxaUnidade: 'anual'
          },
          formula: 'M = C × (1 + i)^t',
          steps: [
            '1. Dados: C = R$ 2.000,00, i = 12% = 0,12, t = 3 anos',
            '2. Fórmula: M = 2000 × (1 + 0,12)^3',
            '3. Cálculo: M = 2000 × (1,12)^3',
            '4. Resultado: M = 2000 × 1,404928 = R$ 2.809,86'
          ],
          correctAnswer: 2809.856,
          tolerance: 0.02,
          explanation: 'Ana terá R$ 2.809,86 após 3 anos, ganhando R$ 809,86 de juros.',
          hint: 'Taxa anual de 12% = 0,12. Tempo em anos.'
        },
        
        {
          id: 5,
          level: 'avançado',
          title: 'Comparação de Investimentos',
          context: '⚖️ Análise de opções',
          question: 'Pedro tem R$ 10.000,00 para investir. Opção A: 1% ao mês por 2 anos. Opção B: 15% ao ano por 2 anos. Qual é mais vantajosa?',
          givenData: {
            capital: 10000,
            opcaoA: { taxa: 1, tempo: 24, unidade: 'mensal' }, // 1% ao mês por 24 meses
            opcaoB: { taxa: 15, tempo: 2, unidade: 'anual' }   // 15% ao ano por 2 anos
          },
          formula: 'M = C × (1 + i)^t',
          steps: [
            '1. Opção A: M = 10000 × (1 + 0,01)^24 = 10000 × 1,269735 = R$ 12.697,35',
            '2. Opção B: M = 10000 × (1 + 0,15)^2 = 10000 × 1,3225 = R$ 13.225,00',
            '3. Comparação: Opção B rende R$ 527,65 a mais',
            '4. Resposta: Opção B é mais vantajosa'
          ],
          correctAnswer: 13225.00, // Resposta da opção B
          tolerance: 0.01,
          explanation: 'A Opção B é mais vantajosa, rendendo R$ 13.225,00 contra R$ 12.697,35 da Opção A.',
          hint: 'Calcule ambas as opções e compare os resultados finais.'
        }
      ],
      
      // Sistema de feedback progressivo
      feedback: {
        perfect: {
          message: "Excelente! Você dominou o cálculo de juros compostos!",
          tips: [
            "Continue praticando com diferentes cenários",
            "Experimente calcular juros em situações reais",
            "Compare diferentes opções de investimento"
          ]
        },
        good: {
          message: "Muito bem! Pequenos ajustes podem melhorar ainda mais sua precisão.",
          tips: [
            "Verifique se converteu corretamente a taxa percentual",
            "Confirme se o tempo está na unidade correta",
            "Use calculadora para potências maiores"
          ]
        },
        needsImprovement: {
          message: "Continue praticando! A fórmula dos juros compostos requer atenção aos detalhes.",
          tips: [
            "Revisite a fórmula: M = C × (1 + i)^t",
            "Lembre-se: taxa percentual deve ser dividida por 100",
            "Verifique se identificou corretamente todos os dados"
          ]
        }
      },
      
      // Configurações visuais
      visual: {
        showFormula: true,
        showSteps: true,
        showProgress: true,
        highlightCorrect: true,
        animation: true,
        colors: {
          primary: '#3B82F6',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          background: '#F8FAFC'
        }
      },
      
      // Metadados educacionais
      metadata: {
        difficulty: 4,
        estimatedTime: '15-20 minutos',
        learningObjectives: [
          'Aplicar a fórmula dos juros compostos corretamente',
          'Identificar dados em problemas de juros compostos',
          'Calcular montantes com diferentes taxas e prazos',
          'Comparar diferentes opções de investimento',
          'Compreender o impacto do tempo nos juros compostos'
        ],
        skills: [
          'matemática-financeira',
          'juros-compostos',
          'cálculo-financeiro',
          'análise-de-investimentos',
          'resolução-de-problemas'
        ],
        prerequisites: [
          'Conhecimento básico de porcentagem',
          'Operações com potências',
          'Uso de calculadora'
        ]
      }
    };
    
    // Atualizar a lição com a nova estrutura
    lesson.content = newMathStructure;
    lesson.updatedAt = new Date();
    
    await lesson.save();
    
    console.log('✅ Template math-problems criado com sucesso!');
    console.log('📊 Problemas criados:', newMathStructure.problems.length);
    console.log('🎯 Níveis de dificuldade:', [...new Set(newMathStructure.problems.map(p => p.level))]);
    console.log('⏱️ Tempo estimado:', newMathStructure.metadata.estimatedTime);
    
  } catch (error) {
    console.error('❌ Erro ao criar template:', error);
  } finally {
    mongoose.disconnect();
  }
}

createMathProblemsTemplate();
