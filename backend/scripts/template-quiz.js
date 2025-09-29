require('dotenv').config();
const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createQuizTemplate() {
  try {
    console.log('❓ CRIANDO TEMPLATE QUIZ PERSONALIZADO');
    console.log('='.repeat(60));
    
    // Buscar a lição "Revisão e Celebração" (6º Ano)
    const lesson = await Lesson.findOne({ title: 'Revisão e Celebração' });
    
    if (!lesson) {
      console.log('❌ Lição "Revisão e Celebração" (6º Ano) não encontrada');
      return;
    }
    
    console.log('📋 Lição encontrada:', lesson.title);
    console.log('📊 Série:', lesson.gradeId);
    console.log('🎯 Tipo:', lesson.type);
    
    // NOVA ESTRUTURA PERSONALIZADA PARA QUIZ
    const newQuizStructure = {
      // Configuração do formato do jogo
      format: 'quiz',
      gameConfig: {
        type: 'quiz',
        difficulty: 'mixed',
        timeLimit: null, // Sem limite de tempo para permitir reflexão
        allowMultipleAttempts: true,
        showCorrectAnswers: true,
        randomizeQuestions: false,
        randomizeAnswers: true
      },
      
      // Instruções claras e motivadoras
      instructions: [
        "Teste seus conhecimentos sobre educação financeira!",
        "Leia cada pergunta com atenção",
        "Escolha a resposta que considera mais correta",
        "Não se preocupe com erros - o importante é aprender!"
      ],
      
      // Perguntas progressivas cobrindo diferentes tópicos
      questions: [
        {
          id: 1,
          category: 'conceitos-basicos',
          difficulty: 'facil',
          question: 'O que é um orçamento familiar?',
          options: [
            'Uma conta bancária especial para a família',
            'Um plano que organiza receitas e despesas da família',
            'Um documento que lista todos os gastos da família',
            'Um cartão de crédito familiar'
          ],
          correctAnswer: 1,
          explanation: 'Um orçamento familiar é um plano que organiza as receitas (dinheiro que entra) e despesas (dinheiro que sai) da família, ajudando a controlar os gastos.',
          points: 10
        },
        
        {
          id: 2,
          category: 'poupanca',
          difficulty: 'facil',
          question: 'Qual é o principal objetivo da poupança?',
          options: [
            'Gastar mais dinheiro',
            'Comprar coisas caras',
            'Guardar dinheiro para o futuro',
            'Pagar dívidas'
          ],
          correctAnswer: 2,
          explanation: 'A poupança tem como principal objetivo guardar dinheiro para o futuro, criando uma reserva para emergências ou objetivos específicos.',
          points: 10
        },
        
        {
          id: 3,
          category: 'necessidades-vs-desejos',
          difficulty: 'medio',
          question: 'Qual das opções abaixo é uma NECESSIDADE?',
          options: [
            'Comprar um videogame novo',
            'Pagar a conta de luz',
            'Ir ao cinema',
            'Comprar roupas de marca'
          ],
          correctAnswer: 1,
          explanation: 'Pagar a conta de luz é uma necessidade básica, pois é essencial para o funcionamento da casa. Os outros itens são desejos.',
          points: 15
        },
        
        {
          id: 4,
          category: 'juros',
          difficulty: 'medio',
          question: 'O que são juros?',
          options: [
            'Dinheiro que você ganha trabalhando',
            'Desconto em compras',
            'Taxa cobrada por usar dinheiro emprestado',
            'Dinheiro guardado na poupança'
          ],
          correctAnswer: 2,
          explanation: 'Juros são a taxa cobrada por usar dinheiro emprestado. Quando você pega dinheiro emprestado, precisa devolver mais do que pegou.',
          points: 15
        },
        
        {
          id: 5,
          category: 'planejamento-financeiro',
          difficulty: 'medio',
          question: 'Qual é a regra 50-30-20?',
          options: [
            '50% para poupança, 30% para necessidades, 20% para desejos',
            '50% para necessidades, 30% para desejos, 20% para poupança',
            '50% para desejos, 30% para necessidades, 20% para poupança',
            '50% para investimentos, 30% para poupança, 20% para gastos'
          ],
          correctAnswer: 1,
          explanation: 'A regra 50-30-20 sugere usar 50% da renda para necessidades, 30% para desejos e 20% para poupança e investimentos.',
          points: 20
        },
        
        {
          id: 6,
          category: 'consumo-consciente',
          difficulty: 'medio',
          question: 'O que é consumo consciente?',
          options: [
            'Comprar sempre o mais barato',
            'Comprar sempre o mais caro',
            'Comprar apenas produtos importados',
            'Pensar antes de comprar, considerando necessidade e qualidade'
          ],
          correctAnswer: 3,
          explanation: 'Consumo consciente é pensar antes de comprar, considerando se realmente precisa do produto e se a qualidade vale o preço.',
          points: 15
        },
        
        {
          id: 7,
          category: 'emergencia-financeira',
          difficulty: 'dificil',
          question: 'Para que serve um fundo de emergência?',
          options: [
            'Para comprar coisas que você quer',
            'Para pagar gastos inesperados e emergências',
            'Para investir em ações',
            'Para pagar as contas mensais'
          ],
          correctAnswer: 1,
          explanation: 'Um fundo de emergência serve para cobrir gastos inesperados como despesas médicas, reparos urgentes ou perda de emprego.',
          points: 20
        },
        
        {
          id: 8,
          category: 'meta-financeira',
          difficulty: 'dificil',
          question: 'Qual é a melhor forma de alcançar uma meta financeira?',
          options: [
            'Gastar todo o dinheiro que ganha',
            'Pegar dinheiro emprestado',
            'Comprar tudo a prazo',
            'Definir a meta, fazer um plano e poupar regularmente'
          ],
          correctAnswer: 3,
          explanation: 'Para alcançar uma meta financeira, é importante defini-la claramente, fazer um plano de como conseguir o dinheiro e poupar regularmente.',
          points: 25
        },
        
        {
          id: 9,
          category: 'diferenca-renda-despesa',
          difficulty: 'medio',
          question: 'O que acontece quando os gastos são maiores que a renda?',
          options: [
            'Você fica rico',
            'Você economiza dinheiro',
            'Nada acontece',
            'Você cria dívidas'
          ],
          correctAnswer: 3,
          explanation: 'Quando os gastos são maiores que a renda, você gasta mais do que ganha, o que leva ao endividamento e problemas financeiros.',
          points: 15
        },
        
        {
          id: 10,
          category: 'celebracao-aprendizado',
          difficulty: 'facil',
          question: 'Por que é importante aprender sobre educação financeira?',
          options: [
            'Para gastar mais dinheiro',
            'Para tomar decisões financeiras melhores e ter mais controle sobre o dinheiro',
            'Para ficar rico rapidamente',
            'Para impressionar os amigos'
          ],
          correctAnswer: 1,
          explanation: 'A educação financeira é importante para tomar decisões melhores com o dinheiro, ter mais controle sobre as finanças e alcançar objetivos pessoais.',
          points: 10
        }
      ],
      
      // Sistema de feedback baseado na pontuação
      feedback: {
        excellent: {
          minScore: 90,
          message: "🎉 Excelente! Você demonstrou um conhecimento sólido sobre educação financeira!",
          tips: [
            "Continue praticando o que aprendeu",
            "Compartilhe seus conhecimentos com a família",
            "Mantenha-se sempre aprendendo sobre finanças"
          ]
        },
        good: {
          minScore: 70,
          message: "👏 Muito bem! Você tem uma boa base de conhecimentos financeiros!",
          tips: [
            "Revise os conceitos que ainda não domina",
            "Pratique mais com situações do dia a dia",
            "Continue estudando sobre educação financeira"
          ]
        },
        needsImprovement: {
          minScore: 0,
          message: "📚 Continue estudando! A educação financeira é uma jornada de aprendizado contínuo.",
          tips: [
            "Revise as lições anteriores",
            "Pratique com exemplos reais",
            "Não desista - cada erro é uma oportunidade de aprender"
          ]
        }
      },
      
      // Configurações visuais
      visual: {
        showProgress: true,
        showScore: true,
        showCategory: true,
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
        difficulty: 2,
        estimatedTime: '10-15 minutos',
        totalQuestions: 10,
        totalPoints: 150,
        learningObjectives: [
          'Revisar conceitos básicos de educação financeira',
          'Aplicar conhecimentos em situações práticas',
          'Identificar necessidades vs desejos',
          'Compreender a importância do planejamento financeiro',
          'Celebrar o aprendizado adquirido'
        ],
        skills: [
          'conceitos-financeiros-basicos',
          'planejamento-financeiro',
          'consumo-consciente',
          'poupanca-e-investimentos',
          'tomada-de-decisoes-financeiras'
        ],
        categories: [
          'conceitos-basicos',
          'poupanca',
          'necessidades-vs-desejos',
          'juros',
          'planejamento-financeiro',
          'consumo-consciente',
          'emergencia-financeira',
          'meta-financeira',
          'diferenca-renda-despesa',
          'celebracao-aprendizado'
        ]
      }
    };
    
    // Atualizar a lição com a nova estrutura
    lesson.content = newQuizStructure;
    lesson.updatedAt = new Date();
    
    await lesson.save();
    
    console.log('✅ Template quiz criado com sucesso!');
    console.log('📊 Perguntas criadas:', newQuizStructure.questions.length);
    console.log('🎯 Categorias:', newQuizStructure.metadata.categories.length);
    console.log('⭐ Pontuação total:', newQuizStructure.metadata.totalPoints);
    console.log('⏱️ Tempo estimado:', newQuizStructure.metadata.estimatedTime);
    
  } catch (error) {
    console.error('❌ Erro ao criar template:', error);
  } finally {
    mongoose.disconnect();
  }
}

createQuizTemplate();
