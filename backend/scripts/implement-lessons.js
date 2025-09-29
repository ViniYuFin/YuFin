#!/usr/bin/env node

/**
 * 🎓 Script para Implementar Lições no Banco de Dados
 * 
 * Este script implementa todas as 24 lições criadas para o 6º e 7º ano
 * no banco de dados MongoDB, seguindo o schema existente.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

// String de conexão MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yufin';

// Lições do 6º Ano
const lessons6thGrade = [
  // MÓDULO 1: INTRODUÇÃO AO DINHEIRO
  {
    title: "A História do Dinheiro",
    description: "Descubra como o dinheiro evoluiu ao longo da história, desde o escambo até as criptomoedas",
    type: "simulation",
    content: {
      scenario: "Você é um comerciante na antiguidade que precisa resolver problemas de troca",
      options: [
        {
          choice: "Procurar alguém que queira pão e tenha ferramentas",
          outcome: "Funciona, mas é muito complicado! Você precisa encontrar a pessoa certa.",
          feedback: "Isso se chama 'dupla coincidência de necessidades' - muito difícil de acontecer!"
        },
        {
          choice: "Criar um sistema de moedas metálicas",
          outcome: "Excelente ideia! Moedas facilitam as trocas e são aceitas por todos.",
          feedback: "O dinheiro resolve o problema da dupla coincidência de necessidades!"
        },
        {
          choice: "Usar cartões de crédito",
          outcome: "Impossível na antiguidade! A tecnologia ainda não existia.",
          feedback: "Cartões são uma invenção moderna. Na antiguidade, as moedas eram a solução!"
        }
      ],
      finalReflection: "O dinheiro evoluiu para resolver problemas reais do comércio. Hoje, mesmo sem valor próprio, o dinheiro funciona porque todos confiam nele!"
    },
    gradeId: "6º Ano",
    module: 1,
    order: 1,
    difficulty: 1,
    estimatedTime: 15,
    bnccSkills: ["EF06HI01", "EF06MA01", "EF06GE01"],
    tags: ["história", "dinheiro", "evolução"],
    isActive: true
  },
  {
    title: "Necessidades vs Desejos",
    description: "Aprenda a diferenciar o que é realmente necessário do que é apenas um desejo",
    type: "classify",
    content: {
      scenario: "Você está organizando uma festa de aniversário com orçamento limitado. Classifique os itens entre necessidades básicas (essenciais para a festa) e desejos (coisas que gostaria de ter, mas não são essenciais).",
      categories: [
        {
          name: "Necessidades Básicas",
          items: [
            "Comida para os convidados",
            "Bebidas",
            "Decoração simples",
            "Convites",
            "Música simples"
          ]
        },
        {
          name: "Desejos",
          items: [
            "Decoração cara",
            "Presente caro para você",
            "Música profissional"
          ]
        }
      ],
      items: [
        {
          text: "Comida para os convidados",
          category: "Necessidades Básicas",
          correctCategory: "Necessidades Básicas"
        },
        {
          text: "Bebidas",
          category: "Necessidades Básicas",
          correctCategory: "Necessidades Básicas"
        },
        {
          text: "Decoração cara",
          category: "Desejos",
          correctCategory: "Desejos"
        },
        {
          text: "Decoração simples",
          category: "Necessidades Básicas",
          correctCategory: "Necessidades Básicas"
        },
        {
          text: "Presente caro para você",
          category: "Desejos",
          correctCategory: "Desejos"
        },
        {
          text: "Convites",
          category: "Necessidades Básicas",
          correctCategory: "Necessidades Básicas"
        },
        {
          text: "Música profissional",
          category: "Desejos",
          correctCategory: "Desejos"
        },
        {
          text: "Música simples",
          category: "Necessidades Básicas",
          correctCategory: "Necessidades Básicas"
        }
      ]
    },
    gradeId: "6º Ano",
    module: 1,
    order: 2,
    difficulty: 1,
    estimatedTime: 20,
    bnccSkills: ["EF06CI01", "EF06MA01", "EF06CH01"],
    tags: ["necessidades", "desejos", "priorização"],
    isActive: true
  },
  {
    title: "O Orçamento da Família",
    description: "Entenda como funciona um orçamento familiar e como distribuir os gastos",
    type: "budget-distribution",
    content: {
      scenario: "Distribua R$ 3.000 entre as categorias de gastos da família",
      totalBudget: 3000.00,
      categories: [
        {
          name: "Moradia (aluguel/condomínio)",
          suggestedPercentage: 30,
          suggestedAmount: 900.00,
          description: "Onde a família mora",
          consequences: {
            insufficient: "Família pode ficar sem casa!",
            excessive: "Sobra pouco para outras necessidades"
          }
        },
        {
          name: "Alimentação",
          suggestedPercentage: 25,
          suggestedAmount: 750.00,
          description: "Comida para toda a família",
          consequences: {
            insufficient: "Família pode passar fome!",
            excessive: "Dinheiro desperdiçado em comida"
          }
        },
        {
          name: "Transporte",
          suggestedPercentage: 15,
          suggestedAmount: 450.00,
          description: "Gasolina, ônibus, metrô",
          consequences: {
            insufficient: "Família não consegue se locomover!",
            excessive: "Muito gasto com transporte"
          }
        },
        {
          name: "Saúde",
          suggestedPercentage: 10,
          suggestedAmount: 300.00,
          description: "Médicos, remédios, plano de saúde",
          consequences: {
            insufficient: "Família sem proteção médica!",
            excessive: "Gasto alto, mas necessário"
          }
        },
        {
          name: "Educação",
          suggestedPercentage: 10,
          suggestedAmount: 300.00,
          description: "Escola, material escolar, cursos",
          consequences: {
            insufficient: "Crianças sem educação adequada!",
            excessive: "Investimento no futuro"
          }
        },
        {
          name: "Lazer e Diversão",
          suggestedPercentage: 5,
          suggestedAmount: 150.00,
          description: "Cinema, parques, brinquedos",
          consequences: {
            insufficient: "Família sem diversão",
            excessive: "Muito gasto com lazer"
          }
        },
        {
          name: "Poupança",
          suggestedPercentage: 5,
          suggestedAmount: 150.00,
          description: "Guardar para emergências",
          consequences: {
            insufficient: "Sem proteção para emergências!",
            excessive: "Excelente hábito financeiro!"
          }
        }
      ],
      challenge: "Distribua o orçamento de forma equilibrada!",
      feedback: {
        balanced: "Excelente! Você criou um orçamento equilibrado!",
        unbalanced: "Algumas categorias estão muito altas ou baixas. Tente equilibrar!",
        noSavings: "Importante: sempre reserve algo para poupança!"
      }
    },
    gradeId: "6º Ano",
    module: 1,
    order: 3,
    difficulty: 2,
    estimatedTime: 25,
    bnccSkills: ["EF06MA01", "EF06CI01", "EF06GE01"],
    tags: ["orçamento", "família", "planejamento"],
    isActive: true
  },
  // MÓDULO 2: MATEMÁTICA FINANCEIRA BÁSICA
  {
    title: "Contando Moedas",
    description: "Aprenda a calcular trocos e resolver problemas com dinheiro",
    type: "math-problems",
    content: {
      scenario: "Resolva as contas e calcule o troco correto",
      problems: [
        {
          id: 1,
          description: "Cliente comprou pão (R$ 4,50) e leite (R$ 3,20). Pagou com R$ 10,00. Quanto de troco ele deve receber?",
          items: [
            {"name": "Pão", "price": 4.50},
            {"name": "Leite", "price": 3.20}
          ],
          total: 7.70,
          paid: 10.00,
          correctAnswer: 2.30,
          explanation: "Total: R$ 4,50 + R$ 3,20 = R$ 7,70. Troco: R$ 10,00 - R$ 7,70 = R$ 2,30"
        },
        {
          id: 2,
          description: "Cliente comprou 3 maçãs (R$ 2,00 cada) e 2 bananas (R$ 1,50 cada). Pagou com R$ 20,00. Quanto de troco ele deve receber?",
          items: [
            {"name": "Maçãs (3x)", "price": 6.00},
            {"name": "Bananas (2x)", "price": 3.00}
          ],
          total: 9.00,
          paid: 20.00,
          correctAnswer: 11.00,
          explanation: "Maçãs: 3 × R$ 2,00 = R$ 6,00. Bananas: 2 × R$ 1,50 = R$ 3,00. Total: R$ 9,00. Troco: R$ 20,00 - R$ 9,00 = R$ 11,00"
        },
        {
          id: 3,
          description: "Cliente comprou arroz (R$ 8,90), feijão (R$ 5,40) e óleo (R$ 4,20). Pagou com R$ 20,00. Quanto de troco ele deve receber?",
          items: [
            {"name": "Arroz", "price": 8.90},
            {"name": "Feijão", "price": 5.40},
            {"name": "Óleo", "price": 4.20}
          ],
          total: 18.50,
          paid: 20.00,
          correctAnswer: 1.50,
          explanation: "Total: R$ 8,90 + R$ 5,40 + R$ 4,20 = R$ 18,50. Troco: R$ 20,00 - R$ 18,50 = R$ 1,50"
        }
      ],
      bonusChallenge: {
        description: "Cliente quer trocar R$ 50,00 em moedas de R$ 0,25. Quantas moedas ele receberá?",
        correctAnswer: 200,
        explanation: "R$ 50,00 ÷ R$ 0,25 = 200 moedas"
      }
    },
    gradeId: "6º Ano",
    module: 2,
    order: 1,
    difficulty: 2,
    estimatedTime: 20,
    bnccSkills: ["EF06MA01", "EF06MA02", "EF06MA03"],
    tags: ["matemática", "cálculos", "troco"],
    isActive: true
  },
  {
    title: "Porcentagens Simples",
    description: "Aprenda a calcular porcentagens e descontos",
    type: "input",
    content: {
      scenario: "Calcule os preços com desconto na loja",
      problems: [
        {
          id: 1,
          item: "Tênis",
          originalPrice: 120.00,
          discount: 20,
          question: "Um tênis custa R$ 120,00. Qual o preço com 20% de desconto?",
          correctAnswer: 96.00,
          explanation: "20% de R$ 120,00 = R$ 24,00. Preço final: R$ 120,00 - R$ 24,00 = R$ 96,00"
        },
        {
          id: 2,
          item: "Camiseta",
          originalPrice: 45.00,
          discount: 15,
          question: "Uma camiseta custa R$ 45,00. Qual o preço com 15% de desconto?",
          correctAnswer: 38.25,
          explanation: "15% de R$ 45,00 = R$ 6,75. Preço final: R$ 45,00 - R$ 6,75 = R$ 38,25"
        },
        {
          id: 3,
          item: "Livro",
          originalPrice: 35.00,
          discount: 30,
          question: "Um livro custa R$ 35,00. Qual o preço com 30% de desconto?",
          correctAnswer: 24.50,
          explanation: "30% de R$ 35,00 = R$ 10,50. Preço final: R$ 35,00 - R$ 10,50 = R$ 24,50"
        }
      ],
      bonusChallenge: {
        description: "Um produto custava R$ 80,00 e agora custa R$ 64,00. Qual foi o desconto em porcentagem?",
        correctAnswer: 20,
        explanation: "Desconto: R$ 80,00 - R$ 64,00 = R$ 16,00. Porcentagem: R$ 16,00 ÷ R$ 80,00 = 0,20 = 20%"
      }
    },
    gradeId: "6º Ano",
    module: 2,
    order: 2,
    difficulty: 3,
    estimatedTime: 20,
    bnccSkills: ["EF06MA01", "EF06MA02", "EF06MA03"],
    tags: ["porcentagem", "desconto", "cálculos"],
    isActive: true
  },
  {
    title: "Comparando Preços",
    description: "Aprenda a comparar preços e tomar decisões de consumo informadas",
    type: "choices",
    content: {
      scenario: "Escolha o melhor material escolar considerando preço e qualidade",
      situations: [
        {
          id: 1,
          item: "Caderno",
          options: [
            {
              brand: "Marca A",
              price: 8.50,
              quality: "Boa",
              pages: 200,
              description: "Caderno com capa dura, boa qualidade"
            },
            {
              brand: "Marca B", 
              price: 12.00,
              quality: "Excelente",
              pages: 200,
              description: "Caderno premium, capa especial"
            },
            {
              brand: "Marca C",
              price: 6.00,
              quality: "Regular",
              pages: 200,
              description: "Caderno básico, capa simples"
            }
          ],
          question: "Qual caderno oferece melhor custo-benefício?",
          correctAnswer: "Marca A",
          explanation: "Marca A oferece boa qualidade por um preço justo. Marca B é muito cara, Marca C pode não durar o ano todo."
        },
        {
          id: 2,
          item: "Canetas",
          options: [
            {
              brand: "Pacote A",
              price: 15.00,
              quantity: 10,
              quality: "Boa",
              description: "10 canetas azuis, boa qualidade"
            },
            {
              brand: "Pacote B",
              price: 20.00,
              quantity: 12,
              quality: "Excelente",
              description: "12 canetas coloridas, qualidade premium"
            },
            {
              brand: "Pacote C",
              price: 8.00,
              quantity: 8,
              quality: "Regular",
              description: "8 canetas básicas, qualidade simples"
            }
          ],
          question: "Qual pacote de canetas oferece melhor custo-benefício?",
          correctAnswer: "Pacote A",
          explanation: "Pacote A: R$ 1,50 por caneta. Pacote B: R$ 1,67 por caneta. Pacote C: R$ 1,00 por caneta, mas qualidade inferior."
        }
      ],
      reflection: "Sempre compare preços e qualidade antes de comprar!"
    },
    gradeId: "6º Ano",
    module: 2,
    order: 3,
    difficulty: 2,
    estimatedTime: 20,
    bnccSkills: ["EF06MA01", "EF06CI01", "EF06GE01"],
    tags: ["comparação", "preços", "qualidade"],
    isActive: true
  },
  // MÓDULO 3: CONSCIÊNCIA FINANCEIRA
  {
    title: "Consumo Consciente",
    description: "Aprenda a desenvolver hábitos de consumo consciente",
    type: "choices",
    content: {
      scenario: "Faça escolhas conscientes com sua mesada de R$ 50",
      budget: 50.00,
      situations: [
        {
          id: 1,
          situation: "Você vê um brinquedo que custa R$ 45. O que você faz?",
          options: [
            {
              choice: "Comprar o brinquedo",
              consequence: "Fica com apenas R$ 5 para o resto do mês",
              impact: "Pode não conseguir comprar outras coisas importantes",
              feedback: "Pense se você realmente precisa desse brinquedo agora!",
              quality: "ruim"
            },
            {
              choice: "Pesquisar preços em outras lojas",
              consequence: "Encontra o mesmo brinquedo por R$ 35",
              impact: "Economiza R$ 10 e ainda tem dinheiro para outras coisas",
              feedback: "Excelente! Sempre pesquise preços antes de comprar!",
              quality: "boa"
            },
            {
              choice: "Esperar uma promoção",
              consequence: "O brinquedo fica em promoção por R$ 30",
              impact: "Economiza R$ 15 e aprende a ter paciência",
              feedback: "Perfeito! Paciência pode gerar grandes economias!",
              quality: "excelente"
            }
          ]
        },
        {
          id: 2,
          situation: "Você vê um lanche que custa R$ 15. O que você faz?",
          options: [
            {
              choice: "Comprar o lanche",
              consequence: "Gasta R$ 15 em algo que pode fazer em casa",
              impact: "Dinheiro que poderia ser usado melhor",
              feedback: "Lembra que você pode fazer lanches em casa por muito menos!",
              quality: "ruim"
            },
            {
              choice: "Comprar ingredientes para fazer em casa",
              consequence: "Gasta R$ 5 e faz lanche para toda a família",
              impact: "Economiza dinheiro e aprende a cozinhar",
              feedback: "Fantástico! Você economizou e ainda ajudou a família!",
              quality: "excelente"
            },
            {
              choice: "Pesquisar lanches mais baratos",
              consequence: "Encontra um lanche similar por R$ 8",
              impact: "Economiza R$ 7 e ainda satisfaz a vontade",
              feedback: "Boa estratégia! Sempre pesquise antes de comprar!",
              quality: "boa"
            }
          ]
        }
      ],
      finalReflection: "Consumo consciente significa pensar antes de comprar e considerar todas as opções!"
    },
    gradeId: "6º Ano",
    module: 3,
    order: 1,
    difficulty: 3,
    estimatedTime: 20,
    bnccSkills: ["EF06CI01", "EF06GE01", "EF06CH01"],
    tags: ["consumo", "consciente", "decisões"],
    isActive: true
  },
  {
    title: "Poupança para Objetivos",
    description: "Aprenda a economizar para alcançar seus objetivos",
    type: "progress-game",
    content: {
      scenario: "Economize para comprar seu videogame dos sonhos!",
      goal: {
        item: "Videogame",
        price: 200.00,
        description: "O videogame que você sempre quis"
      },
      monthlyIncome: 50.00,
      months: [
        {
          month: 1,
          income: 50.00,
          expenses: [
            {"item": "Lanche na escola", "amount": 10.00},
            {"item": "Material escolar", "amount": 15.00},
            {"item": "Presente para amigo", "amount": 5.00}
          ],
          savings: 20.00,
          totalSaved: 20.00,
          remaining: 180.00,
          message: "Ótimo começo! Você economizou R$ 20 no primeiro mês!"
        },
        {
          month: 2,
          income: 50.00,
          expenses: [
            {"item": "Lanche na escola", "amount": 10.00},
            {"item": "Cinema", "amount": 15.00},
            {"item": "Doces", "amount": 5.00}
          ],
          savings: 20.00,
          totalSaved: 40.00,
          remaining: 160.00,
          message: "Continue assim! Você já tem 20% do valor!"
        },
        {
          month: 3,
          income: 50.00,
          expenses: [
            {"item": "Lanche na escola", "amount": 10.00},
            {"item": "Revista em quadrinhos", "amount": 8.00},
            {"item": "Brinquedo pequeno", "amount": 12.00}
          ],
          savings: 20.00,
          totalSaved: 60.00,
          remaining: 140.00,
          message: "Excelente! Você está no caminho certo!"
        },
        {
          month: 4,
          income: 50.00,
          expenses: [
            {"item": "Lanche na escola", "amount": 10.00},
            {"item": "Presente para mãe", "amount": 20.00}
          ],
          savings: 20.00,
          totalSaved: 80.00,
          remaining: 120.00,
          message: "Quase na metade! Você está indo muito bem!"
        },
        {
          month: 5,
          income: 50.00,
          expenses: [
            {"item": "Lanche na escola", "amount": 10.00},
            {"item": "Material de arte", "amount": 15.00}
          ],
          savings: 25.00,
          totalSaved: 105.00,
          remaining: 95.00,
          message: "Mais da metade! Você está quase lá!"
        },
        {
          month: 6,
          income: 50.00,
          expenses: [
            {"item": "Lanche na escola", "amount": 10.00},
            {"item": "Revista", "amount": 5.00}
          ],
          savings: 35.00,
          totalSaved: 140.00,
          remaining: 60.00,
          message: "Quase lá! Só faltam R$ 60!"
        },
        {
          month: 7,
          income: 50.00,
          expenses: [
            {"item": "Lanche na escola", "amount": 10.00}
          ],
          savings: 40.00,
          totalSaved: 180.00,
          remaining: 20.00,
          message: "Só faltam R$ 20! Você está quase conseguindo!"
        },
        {
          month: 8,
          income: 50.00,
          expenses: [
            {"item": "Lanche na escola", "amount": 10.00}
          ],
          savings: 40.00,
          totalSaved: 220.00,
          remaining: 0.00,
          message: "🎉 PARABÉNS! Você conseguiu! Agora pode comprar seu videogame!"
        }
      ],
      strategies: [
        "Reduzir gastos desnecessários",
        "Procurar formas de ganhar dinheiro extra",
        "Ser paciente e persistente",
        "Celebrar pequenas conquistas"
      ]
    },
    gradeId: "6º Ano",
    module: 3,
    order: 2,
    difficulty: 3,
    estimatedTime: 25,
    bnccSkills: ["EF06MA01", "EF06CI01", "EF06GE01"],
    tags: ["poupança", "objetivos", "planejamento"],
    isActive: true
  },
  {
    title: "Economizando em Casa",
    description: "Aprenda a identificar formas de economizar em casa",
    type: "drag-drop",
    content: {
      scenario: "Sua família quer economizar dinheiro. Você pode ajudar identificando onde há desperdícios e como economizar!",
      categories: [
        {
          name: "Água",
          items: [
            "Fechar torneira ao escovar os dentes",
            "Tomar banhos mais curtos",
            "Reutilizar água da chuva",
            "Consertar vazamentos"
          ]
        },
        {
          name: "Energia Elétrica",
          items: [
            "Apagar luzes ao sair do quarto",
            "Desligar aparelhos da tomada",
            "Usar lâmpadas LED",
            "Secar roupas no varal"
          ]
        },
        {
          name: "Alimentação",
          items: [
            "Não desperdiçar comida",
            "Fazer lista de compras",
            "Comprar frutas da estação",
            "Cozinhar em casa"
          ]
        },
        {
          name: "Transporte",
          items: [
            "Andar a pé para lugares próximos",
            "Usar bicicleta",
            "Compartilhar carro",
            "Usar transporte público"
          ]
        }
      ],
      items: [
        {
          text: "Fechar torneira ao escovar os dentes",
          category: "Água",
          correctCategory: "Água"
        },
        {
          text: "Apagar luzes ao sair do quarto",
          category: "Energia Elétrica",
          correctCategory: "Energia Elétrica"
        },
        {
          text: "Não desperdiçar comida",
          category: "Alimentação",
          correctCategory: "Alimentação"
        },
        {
          text: "Andar a pé para lugares próximos",
          category: "Transporte",
          correctCategory: "Transporte"
        },
        {
          text: "Tomar banhos mais curtos",
          category: "Água",
          correctCategory: "Água"
        },
        {
          text: "Desligar aparelhos da tomada",
          category: "Energia Elétrica",
          correctCategory: "Energia Elétrica"
        },
        {
          text: "Fazer lista de compras",
          category: "Alimentação",
          correctCategory: "Alimentação"
        },
        {
          text: "Usar bicicleta",
          category: "Transporte",
          correctCategory: "Transporte"
        }
      ]
    },
    gradeId: "6º Ano",
    module: 3,
    order: 3,
    difficulty: 2,
    estimatedTime: 20,
    bnccSkills: ["EF06CI01", "EF06GE01", "EF06CH01"],
    tags: ["economia", "sustentabilidade", "casa"],
    isActive: true
  },
  // MÓDULO 4: PROJETOS PRÁTICOS
  {
    title: "Feira de Troca",
    description: "Organize uma feira de trocas na sua escola",
    type: "simulation",
    content: {
      scenario: "Organize uma feira de trocas na sua escola",
      phases: [
        {
          phase: 1,
          title: "Planejamento",
          tasks: [
            {
              task: "Definir regras da feira",
              description: "Criar regras para trocas justas",
              examples: [
                "Todos os itens devem estar em bom estado",
                "Não é permitido dinheiro, apenas trocas",
                "Cada pessoa pode trazer até 5 itens"
              ]
            },
            {
              task: "Divulgar o evento",
              description: "Convidenar alunos e professores",
              examples: [
                "Criar cartazes",
                "Falar nas salas de aula",
                "Enviar convites para os pais"
              ]
            },
            {
              task: "Organizar o espaço",
              description: "Preparar local para a feira",
              examples: [
                "Definir mesas para cada participante",
                "Criar sistema de identificação",
                "Preparar material de apoio"
              ]
            }
          ]
        },
        {
          phase: 2,
          title: "Execução",
          tasks: [
            {
              task: "Receber participantes",
              description: "Organizar chegada dos participantes",
              examples: [
                "Verificar itens trazidos",
                "Explicar regras",
                "Distribuir espaços"
              ]
            },
            {
              task: "Mediar trocas",
              description: "Ajudar nas negociações",
              examples: [
                "Explicar valor dos itens",
                "Sugerir trocas justas",
                "Resolver conflitos"
              ]
            },
            {
              task: "Documentar resultados",
              description: "Registrar trocas realizadas",
              examples: [
                "Anotar itens trocados",
                "Registrar satisfação dos participantes",
                "Documentar aprendizados"
              ]
            }
          ]
        },
        {
          phase: 3,
          title: "Avaliação",
          tasks: [
            {
              task: "Analisar resultados",
              description: "Refletir sobre o evento",
              questions: [
                "Quantas trocas foram realizadas?",
                "Os participantes ficaram satisfeitos?",
                "O que funcionou bem?",
                "O que pode ser melhorado?"
              ]
            },
            {
              task: "Compartilhar aprendizados",
              description: "Apresentar resultados",
              examples: [
                "Criar relatório",
                "Apresentar para a escola",
                "Compartilhar com outras turmas"
              ]
            }
          ]
        }
      ],
      materials: [
        "Cartazes para divulgação",
        "Mesas e cadeiras",
        "Sistema de identificação",
        "Formulários de registro",
        "Material de apoio"
      ],
      successCriteria: [
        "Pelo menos 20 participantes",
        "Pelo menos 50% das trocas realizadas",
        "Participantes satisfeitos",
        "Aprendizados documentados"
      ]
    },
    gradeId: "6º Ano",
    module: 4,
    order: 1,
    difficulty: 4,
    estimatedTime: 30,
    bnccSkills: ["EF06CI01", "EF06GE01", "EF06CH01"],
    tags: ["projeto", "feira", "trocas"],
    projectBased: true,
    isActive: true
  },
  {
    title: "Orçamento de Viagem",
    description: "Planeje o orçamento de uma viagem em família",
    type: "budget-distribution",
    content: {
      scenario: "Planeje o orçamento da viagem de R$ 1.500",
      totalBudget: 1500.00,
      categories: [
        {
          name: "Hospedagem",
          suggestedPercentage: 40,
          suggestedAmount: 600.00,
          description: "Hotel ou pousada para 3 dias",
          options: [
            {"option": "Hotel 3 estrelas", "price": 800.00, "quality": "Confortável"},
            {"option": "Pousada simples", "price": 450.00, "quality": "Básica"},
            {"option": "Casa de praia", "price": 600.00, "quality": "Boa"}
          ],
          consequences: {
            insufficient: "Pode não ter onde ficar!",
            excessive: "Sobra pouco para outras atividades"
          }
        },
        {
          name: "Alimentação",
          suggestedPercentage: 25,
          suggestedAmount: 375.00,
          description: "Comida para 3 dias (4 pessoas)",
          options: [
            {"option": "Restaurantes", "price": 500.00, "quality": "Conveniente"},
            {"option": "Cozinhar", "price": 200.00, "quality": "Econômico"},
            {"option": "Misto", "price": 350.00, "quality": "Equilibrado"}
          ],
          consequences: {
            insufficient: "Pode passar fome!",
            excessive: "Muito gasto com comida"
          }
        },
        {
          name: "Transporte",
          suggestedPercentage: 20,
          suggestedAmount: 300.00,
          description: "Gasolina e pedágios",
          options: [
            {"option": "Carro próprio", "price": 250.00, "quality": "Conveniente"},
            {"option": "Ônibus", "price": 400.00, "quality": "Sem estresse"},
            {"option": "Carro alugado", "price": 350.00, "quality": "Confortável"}
          ],
          consequences: {
            insufficient: "Pode não conseguir chegar!",
            excessive: "Muito gasto com transporte"
          }
        },
        {
          name: "Atividades",
          suggestedPercentage: 10,
          suggestedAmount: 150.00,
          description: "Passeios e diversão",
          options: [
            {"option": "Passeios pagos", "price": 200.00, "quality": "Diversão garantida"},
            {"option": "Praia gratuita", "price": 50.00, "quality": "Econômico"},
            {"option": "Misto", "price": 150.00, "quality": "Equilibrado"}
          ],
          consequences: {
            insufficient: "Pode ficar entediado",
            excessive: "Muito gasto com diversão"
          }
        },
        {
          name: "Emergência",
          suggestedPercentage: 5,
          suggestedAmount: 75.00,
          description: "Dinheiro para imprevistos",
          consequences: {
            insufficient: "Sem proteção para emergências!",
            excessive: "Excelente planejamento!"
          }
        }
      ],
      challenge: "Crie um orçamento equilibrado que permita uma viagem agradável!",
      feedback: {
        balanced: "Excelente! Você criou um orçamento equilibrado!",
        unbalanced: "Algumas categorias estão muito altas ou baixas. Tente equilibrar!",
        noEmergency: "Importante: sempre reserve algo para emergências!"
      }
    },
    gradeId: "6º Ano",
    module: 4,
    order: 2,
    difficulty: 4,
    estimatedTime: 25,
    bnccSkills: ["EF06MA01", "EF06CI01", "EF06GE01"],
    tags: ["viagem", "orçamento", "planejamento"],
    isActive: true
  },
  {
    title: "Revisão e Celebração",
    description: "Revise seus conhecimentos e celebre suas conquistas",
    type: "quiz",
    content: {
      scenario: "Revise seus conhecimentos sobre educação financeira",
      questions: [
        {
          id: 1,
          question: "Qual é a principal função do dinheiro?",
          options: [
            "Ser bonito",
            "Facilitar trocas e comércio",
            "Ser guardado em casa",
            "Ser gasto rapidamente"
          ],
          correct: 1,
          explanation: "O dinheiro facilita as trocas e o comércio, resolvendo o problema da dupla coincidência de necessidades!"
        },
        {
          id: 2,
          question: "Qual é a diferença entre necessidade e desejo?",
          options: [
            "Não há diferença",
            "Necessidade é o que precisamos, desejo é o que queremos",
            "Desejo é mais importante que necessidade",
            "Necessidade custa mais caro"
          ],
          correct: 1,
          explanation: "Necessidade é o que realmente precisamos para viver, desejo é o que queremos mas não é essencial!"
        },
        {
          id: 3,
          question: "Por que é importante fazer um orçamento?",
          options: [
            "Para gastar mais dinheiro",
            "Para controlar gastos e planejar",
            "Para impressionar os amigos",
            "Para guardar dinheiro sem usar"
          ],
          correct: 1,
          explanation: "O orçamento ajuda a controlar gastos e planejar melhor o uso do dinheiro!"
        },
        {
          id: 4,
          question: "Qual é a melhor forma de economizar?",
          options: [
            "Gastar tudo rapidamente",
            "Ter objetivos claros e ser paciente",
            "Não comprar nada nunca",
            "Pedir dinheiro emprestado"
          ],
          correct: 1,
          explanation: "Ter objetivos claros e ser paciente são fundamentais para economizar com sucesso!"
        },
        {
          id: 5,
          question: "O que é consumo consciente?",
          options: [
            "Comprar tudo que vemos",
            "Pensar antes de comprar e considerar opções",
            "Sempre escolher o mais barato",
            "Nunca comprar nada"
          ],
          correct: 1,
          explanation: "Consumo consciente é pensar antes de comprar e considerar todas as opções disponíveis!"
        }
      ],
      celebration: {
        message: "🎉 Parabéns! Você completou o 6º ano!",
        achievements: [
          "Aprendeu sobre a história do dinheiro",
          "Diferenciou necessidades de desejos",
          "Criou orçamentos familiares",
          "Resolveu problemas matemáticos",
          "Desenvolveu consumo consciente",
          "Aprendeu sobre poupança",
          "Organizou projetos práticos"
        ],
        nextSteps: "No 7º ano, você aprenderá sobre planejamento pessoal e controle financeiro!"
      }
    },
    gradeId: "6º Ano",
    module: 4,
    order: 3,
    difficulty: 2,
    estimatedTime: 20,
    bnccSkills: ["EF06MA01", "EF06CI01", "EF06GE01", "EF06HI01"],
    tags: ["revisão", "celebração", "conhecimentos"],
    isActive: true
  }
];

// Lições do 7º Ano
const lessons7thGrade = [
  // MÓDULO 1: ORÇAMENTO PESSOAL
  {
    title: "Meu Primeiro Orçamento",
    description: "Aprenda a criar e gerenciar seu próprio orçamento pessoal",
    type: "budget-distribution",
    content: {
      scenario: "Distribua sua mesada de R$ 80 entre suas necessidades e desejos",
      totalBudget: 80.00,
      categories: [
        {
          name: "Alimentação",
          suggestedPercentage: 25,
          suggestedAmount: 20.00,
          description: "Lanche na escola, doces, guloseimas",
          consequences: {
            insufficient: "Pode passar fome na escola!",
            excessive: "Muito gasto com comida"
          }
        },
        {
          name: "Material Escolar",
          suggestedPercentage: 20,
          suggestedAmount: 16.00,
          description: "Canetas, cadernos, material de arte",
          consequences: {
            insufficient: "Pode não ter material para estudar!",
            excessive: "Muito gasto com material"
          }
        },
        {
          name: "Transporte",
          suggestedPercentage: 15,
          suggestedAmount: 12.00,
          description: "Ônibus, metrô, gasolina (se for de carro)",
          consequences: {
            insufficient: "Pode não conseguir ir à escola!",
            excessive: "Muito gasto com transporte"
          }
        },
        {
          name: "Lazer",
          suggestedPercentage: 20,
          suggestedAmount: 16.00,
          description: "Cinema, jogos, brinquedos",
          consequences: {
            insufficient: "Pode ficar entediado",
            excessive: "Muito gasto com diversão"
          }
        },
        {
          name: "Presentes",
          suggestedPercentage: 10,
          suggestedAmount: 8.00,
          description: "Presentes para amigos e família",
          consequences: {
            insufficient: "Pode não conseguir dar presentes",
            excessive: "Muito gasto com presentes"
          }
        },
        {
          name: "Poupança",
          suggestedPercentage: 10,
          suggestedAmount: 8.00,
          description: "Guardar para objetivos futuros",
          consequences: {
            insufficient: "Sem proteção para emergências!",
            excessive: "Excelente hábito financeiro!"
          }
        }
      ],
      challenge: "Crie um orçamento equilibrado que atenda suas necessidades!",
      feedback: {
        balanced: "Excelente! Você criou um orçamento equilibrado!",
        unbalanced: "Algumas categorias estão muito altas ou baixas. Tente equilibrar!",
        noSavings: "Importante: sempre reserve algo para poupança!"
      }
    },
    gradeId: "7º Ano",
    module: 1,
    order: 1,
    difficulty: 3,
    estimatedTime: 20,
    bnccSkills: ["EF07MA01", "EF07CI01", "EF07GE01"],
    tags: ["orçamento", "pessoal", "planejamento"],
    isActive: true
  },
  {
    title: "Categorizando Gastos",
    description: "Organize seus gastos pessoais em categorias",
    type: "drag-drop",
    content: {
      scenario: "Organize seus gastos pessoais em categorias para entender melhor onde seu dinheiro é gasto!",
      categories: [
        {
          name: "Alimentação",
          items: [
            "Lanche na cantina da escola",
            "Lanche na escola"
          ]
        },
        {
          name: "Material Escolar",
          items: [
            "Canetas e lápis",
            "Caderno novo"
          ]
        },
        {
          name: "Transporte",
          items: [
            "Ônibus para escola"
          ]
        },
        {
          name: "Lazer",
          items: [
            "Cinema com amigos",
            "Revista em quadrinhos"
          ]
        },
        {
          name: "Presentes",
          items: [
            "Presente para amigo"
          ]
        }
      ],
      items: [
        {
          text: "Lanche na cantina da escola",
          category: "Alimentação",
          correctCategory: "Alimentação"
        },
        {
          text: "Cinema com amigos",
          category: "Lazer",
          correctCategory: "Lazer"
        },
        {
          text: "Canetas e lápis",
          category: "Material Escolar",
          correctCategory: "Material Escolar"
        },
        {
          text: "Ônibus para escola",
          category: "Transporte",
          correctCategory: "Transporte"
        },
        {
          text: "Presente para amigo",
          category: "Presentes",
          correctCategory: "Presentes"
        },
        {
          text: "Revista em quadrinhos",
          category: "Lazer",
          correctCategory: "Lazer"
        },
        {
          text: "Lanche na escola",
          category: "Alimentação",
          correctCategory: "Alimentação"
        },
        {
          text: "Caderno novo",
          category: "Material Escolar",
          correctCategory: "Material Escolar"
        }
      ]
    },
    gradeId: "7º Ano",
    module: 1,
    order: 2,
    difficulty: 3,
    estimatedTime: 20,
    bnccSkills: ["EF07MA01", "EF07CI01", "EF07GE01"],
    tags: ["categorização", "gastos", "análise"],
    isActive: true
  },
  {
    title: "Metas Financeiras",
    description: "Aprenda a calcular e planejar metas financeiras",
    type: "goals",
    content: {
      scenario: "Aprenda a calcular metas financeiras através de exemplos práticos e crie sua própria meta!",
      examples: [
        {
          id: 1,
          character: "Mateus",
          scenario: "Mateus deseja comprar um celular novo de R$ 1.200,00. Quanto ele precisa poupar para comprá-lo em 12 meses?",
          price: 1200.00,
          months: 12,
          answer: 100.00,
          explanation: "Para comprar o celular em 12 meses, Mateus precisa poupar R$ 100,00 por mês (R$ 1.200 ÷ 12 = R$ 100,00)."
        },
        {
          id: 2,
          character: "Ana",
          scenario: "Ana quer comprar uma bicicleta de R$ 800,00. Ela tem 6 meses para juntar o dinheiro. Quanto ela deve poupar por mês?",
          price: 800.00,
          months: 6,
          answer: 133.33,
          explanation: "Para comprar a bicicleta em 6 meses, Ana precisa poupar R$ 133,33 por mês (R$ 800 ÷ 6 = R$ 133,33)."
        }
      ],
      inputFields: [
        {
          label: "O que você quer comprar?",
          type: "text",
          placeholder: "Ex: Videogame, tênis, livro..."
        },
        {
          label: "Quanto custa?",
          type: "number",
          placeholder: "Ex: 500"
        },
        {
          label: "Em quanto tempo quer poupar?",
          type: "number",
          placeholder: "Ex: 8 (meses)"
        }
      ],
      tips: [
        "Divida o valor total pelo número de meses para saber quanto poupar por mês",
        "Considere sua renda mensal antes de definir metas muito altas",
        "Metas realistas são mais fáceis de alcançar",
        "Sempre reserve um pouco para emergências"
      ],
      successMessage: "Parabéns! Você aprendeu a calcular metas financeiras e criou sua própria meta!"
    },
    gradeId: "7º Ano",
    module: 1,
    order: 3,
    difficulty: 4,
    estimatedTime: 25,
    bnccSkills: ["EF07MA01", "EF07CI01", "EF07GE01"],
    tags: ["metas", "planejamento", "objetivos"],
    isActive: true
  },
  // MÓDULO 2: CONSUMO INTELIGENTE
  {
    title: "Pesquisa de Preços",
    description: "Aprenda a pesquisar preços e tomar decisões informadas",
    type: "price-comparison",
    content: {
      scenario: "Pesquise preços para encontrar a melhor oferta do fone de ouvido",
      product: {
        name: "Fone de Ouvido Bluetooth",
        description: "Fone sem fio com boa qualidade de som",
        features: ["Bluetooth", "Bateria 8h", "Cancelamento de ruído"]
      },
      stores: [
        {
          name: "TechStore",
          price: 150.00,
          rating: 4.5,
          delivery: "Grátis",
          warranty: "1 ano",
          pros: ["Loja confiável", "Garantia estendida"],
          cons: ["Preço mais alto"]
        },
        {
          name: "MegaShop",
          price: 120.00,
          rating: 4.2,
          delivery: "R$ 10",
          warranty: "6 meses",
          pros: ["Preço bom", "Entrega rápida"],
          cons: ["Garantia menor"]
        },
        {
          name: "OnlineStore",
          price: 100.00,
          rating: 4.0,
          delivery: "R$ 15",
          warranty: "1 ano",
          pros: ["Preço excelente", "Garantia completa"],
          cons: ["Entrega mais lenta"]
        },
        {
          name: "LocalShop",
          price: 140.00,
          rating: 4.3,
          delivery: "Retirada grátis",
          warranty: "1 ano",
          pros: ["Pode testar antes", "Suporte local"],
          cons: ["Preço médio"]
        }
      ],
      comparison: {
        cheapest: "OnlineStore - R$ 100,00",
        bestValue: "OnlineStore - Melhor custo-benefício",
        mostConvenient: "LocalShop - Pode testar antes",
        mostReliable: "TechStore - Maior confiabilidade"
      },
      challenge: "Qual loja você escolheria e por quê?",
      feedback: {
        priceFocused: "Você priorizou o preço - boa estratégia!",
        qualityFocused: "Você priorizou a qualidade - também é importante!",
        balanced: "Você considerou vários fatores - excelente análise!"
      }
    },
    gradeId: "7º Ano",
    module: 2,
    order: 1,
    difficulty: 4,
    estimatedTime: 20,
    bnccSkills: ["EF07MA01", "EF07CI01", "EF07GE01"],
    tags: ["pesquisa", "preços", "comparação"],
    isActive: true
  },
  {
    title: "Qualidade vs Preço",
    description: "Aprenda a avaliar relação custo-benefício",
    type: "choices",
    content: {
      scenario: "Escolha o melhor tênis considerando qualidade e preço",
      situation: "Você precisa de um tênis para usar na escola todos os dias",
      options: [
        {
          brand: "Marca Premium",
          price: 200.00,
          quality: "Excelente",
          durability: "2 anos",
          comfort: "Muito confortável",
          style: "Moderno",
          description: "Tênis de alta qualidade, muito confortável e durável"
        },
        {
          brand: "Marca Popular",
          price: 120.00,
          quality: "Boa",
          durability: "1 ano",
          comfort: "Confortável",
          style: "Básico",
          description: "Tênis de qualidade boa, preço justo"
        },
        {
          brand: "Marca Econômica",
          price: 60.00,
          quality: "Regular",
          durability: "6 meses",
          comfort: "Aceitável",
          style: "Simples",
          description: "Tênis básico, preço baixo"
        }
      ],
      considerations: [
        "Você usa tênis todos os dias",
        "Precisa durar pelo menos 1 ano",
        "Deve ser confortável para caminhar",
        "Orçamento limitado"
      ],
      analysis: {
        costPerMonth: {
          premium: "R$ 8,33 por mês (2 anos)",
          popular: "R$ 10,00 por mês (1 ano)",
          economica: "R$ 10,00 por mês (6 meses)"
        },
        recommendation: "Marca Popular oferece melhor custo-benefício"
      },
      challenge: "Qual tênis você escolheria e por quê?",
      feedback: {
        premium: "Você priorizou qualidade - pode ser uma boa escolha a longo prazo!",
        popular: "Excelente escolha! Boa relação custo-benefício!",
        economica: "Preço baixo, mas pode precisar trocar mais cedo!"
      }
    },
    gradeId: "7º Ano",
    module: 2,
    order: 2,
    difficulty: 4,
    estimatedTime: 20,
    bnccSkills: ["EF07MA01", "EF07CI01", "EF07GE01"],
    tags: ["qualidade", "preço", "custo-benefício"],
    isActive: true
  },
  {
    title: "Compras por Impulso",
    description: "Aprenda a controlar impulsos de consumo",
    type: "simulation",
    content: {
      scenario: "Resista às compras por impulso no shopping",
      situations: [
        {
          id: 1,
          situation: "Você vê uma camiseta que gosta muito, mas custa R$ 80 (seu orçamento é R$ 50)",
          options: [
            {
              choice: "Comprar mesmo assim",
              consequence: "Fica sem dinheiro para outras coisas",
              impact: "Pode não conseguir comprar coisas necessárias",
              feedback: "Compras por impulso podem quebrar seu orçamento!"
            },
            {
              choice: "Esperar uma promoção",
              consequence: "A camiseta fica em promoção por R$ 40",
              impact: "Economiza R$ 40 e ainda tem dinheiro para outras coisas",
              feedback: "Excelente! Paciência pode gerar grandes economias!"
            },
            {
              choice: "Procurar em outra loja",
              consequence: "Encontra camiseta similar por R$ 45",
              impact: "Economiza R$ 35 e fica dentro do orçamento",
              feedback: "Ótima estratégia! Sempre pesquise antes de comprar!"
            }
          ]
        },
        {
          id: 2,
          situation: "Seus amigos estão comprando lanches caros, mas você já gastou seu dinheiro com lanche",
          options: [
            {
              choice: "Comprar mesmo assim",
              consequence: "Fica sem dinheiro para o ônibus de volta",
              impact: "Pode precisar pedir dinheiro emprestado",
              feedback: "Compras por impulso podem causar problemas!"
            },
            {
              choice: "Explicar que já gastou seu dinheiro",
              consequence: "Seus amigos entendem e respeitam sua decisão",
              impact: "Mantém seu orçamento e ganha respeito",
              feedback: "Perfeito! Ser responsável financeiramente é importante!"
            },
            {
              choice: "Sugerir alternativa mais barata",
              consequence: "Todos vão para um lugar mais barato",
              impact: "Todos economizam e se divertem",
              feedback: "Excelente liderança! Você ajudou todos a economizar!"
            }
          ]
        }
      ],
      strategies: [
        "Sempre pensar antes de comprar",
        "Fazer uma lista de compras",
        "Esperar 24 horas antes de compras grandes",
        "Comparar preços antes de decidir",
        "Estabelecer limites de gastos"
      ],
      finalReflection: "Compras por impulso podem quebrar seu orçamento. Sempre pense antes de comprar!"
    },
    gradeId: "7º Ano",
    module: 2,
    order: 3,
    difficulty: 4,
    estimatedTime: 20,
    bnccSkills: ["EF07CI01", "EF07GE01", "EF07CH01"],
    tags: ["impulso", "controle", "decisões"],
    isActive: true
  },
  // MÓDULO 3: POUPANÇA E INVESTIMENTOS BÁSICOS
  {
    title: "Tipos de Poupança",
    description: "Aprenda sobre diferentes formas de poupar dinheiro",
    type: "match",
    content: {
      scenario: "Combine cada tipo de poupança com suas características",
      pairs: [
        {
          left: "Poupança no Banco",
          right: "Segura, rende pouco, fácil acesso",
          description: "Dinheiro guardado no banco com rendimento baixo mas seguro"
        },
        {
          left: "Poupança em Casa",
          right: "Sem rendimento, risco de roubo, acesso imediato",
          description: "Dinheiro guardado em casa, sem rendimento"
        },
        {
          left: "CDB (Certificado de Depósito Bancário)",
          right: "Rende mais que poupança, seguro, prazo fixo",
          description: "Investimento seguro com rendimento melhor que poupança"
        },
        {
          left: "Tesouro Selic",
          right: "Rende bem, muito seguro, investimento do governo",
          description: "Investimento do governo brasileiro, muito seguro"
        },
        {
          left: "Fundos de Renda Fixa",
          right: "Rende bem, seguro, gerido por especialistas",
          description: "Investimento gerenciado por profissionais"
        },
        {
          left: "Conta Corrente",
          right: "Sem rendimento, fácil acesso, para gastos",
          description: "Conta para movimentação diária, sem rendimento"
        }
      ],
      scenarios: [
        {
          situation: "Você quer guardar dinheiro para emergências",
          bestOption: "Poupança no Banco",
          reason: "Segura e com fácil acesso"
        },
        {
          situation: "Você quer investir por 1 ano",
          bestOption: "CDB ou Tesouro Selic",
          reason: "Rendimento melhor que poupança"
        },
        {
          situation: "Você quer guardar dinheiro por 1 mês",
          bestOption: "Poupança no Banco",
          reason: "Fácil acesso e seguro"
        }
      ],
      tips: [
        "Sempre considere o prazo do investimento",
        "Avalie o risco que está disposto a correr",
        "Compare as taxas de rendimento",
        "Considere a facilidade de acesso ao dinheiro"
      ]
    },
    gradeId: "7º Ano",
    module: 3,
    order: 1,
    difficulty: 5,
    estimatedTime: 20,
    bnccSkills: ["EF07MA01", "EF07CI01", "EF07GE01"],
    tags: ["poupança", "investimentos", "tipos"],
    isActive: true
  },
  {
    title: "Juros Simples",
    description: "Aprenda a calcular juros simples",
    type: "math-problems",
    content: {
      scenario: "Calcule os juros simples de diferentes investimentos",
      problems: [
        {
          id: 1,
          description: "Você depositou R$ 1.000 na poupança por 1 ano. A taxa de juros é 6% ao ano.",
          principal: 1000.00,
          rate: 6,
          time: 1,
          question: "Quanto você receberá de juros?",
          correctAnswer: 60.00,
          explanation: "Juros = Principal × Taxa × Tempo = R$ 1.000 × 0,06 × 1 = R$ 60,00"
        },
        {
          id: 2,
          description: "Você investiu R$ 500 em um CDB por 6 meses. A taxa de juros é 8% ao ano.",
          principal: 500.00,
          rate: 8,
          time: 0.5,
          question: "Quanto você receberá de juros?",
          correctAnswer: 20.00,
          explanation: "Juros = Principal × Taxa × Tempo = R$ 500 × 0,08 × 0,5 = R$ 20,00"
        },
        {
          id: 3,
          description: "Você aplicou R$ 2.000 no Tesouro Selic por 2 anos. A taxa de juros é 10% ao ano.",
          principal: 2000.00,
          rate: 10,
          time: 2,
          question: "Quanto você receberá de juros?",
          correctAnswer: 400.00,
          explanation: "Juros = Principal × Taxa × Tempo = R$ 2.000 × 0,10 × 2 = R$ 400,00"
        }
      ],
      formula: {
        text: "Juros = Principal × Taxa × Tempo",
        example: "R$ 1.000 × 0,06 × 1 = R$ 60,00"
      },
      bonusChallenge: {
        description: "Você quer receber R$ 100 de juros em 1 ano. Se a taxa é 5% ao ano, quanto você precisa investir?",
        correctAnswer: 2000.00,
        explanation: "Principal = Juros ÷ (Taxa × Tempo) = R$ 100 ÷ (0,05 × 1) = R$ 2.000,00"
      }
    },
    gradeId: "7º Ano",
    module: 3,
    order: 2,
    difficulty: 5,
    estimatedTime: 20,
    bnccSkills: ["EF07MA01", "EF07MA02", "EF07MA03"],
    tags: ["juros", "cálculos", "investimentos"],
    isActive: true
  },
  {
    title: "Risco vs Retorno",
    description: "Aprenda sobre a relação entre risco e retorno",
    type: "choices",
    content: {
      scenario: "Escolha investimentos baseado no seu perfil de risco",
      profile: {
        age: "13 anos",
        experience: "Iniciante",
        riskTolerance: "Baixo a Médio",
        timeHorizon: "Curto a Médio prazo"
      },
      options: [
        {
          name: "Poupança",
          risk: "Muito Baixo",
          return: "Baixo (6% ao ano)",
          liquidity: "Alta",
          description: "Segura, rende pouco, fácil acesso",
          pros: ["Muito segura", "Fácil acesso", "Sem risco"],
          cons: ["Rendimento baixo", "Perde para inflação"]
        },
        {
          name: "CDB",
          risk: "Baixo",
          return: "Médio (8% ao ano)",
          liquidity: "Média",
          description: "Segura, rende mais que poupança, prazo fixo",
          pros: ["Segura", "Rende mais que poupança", "Protegida pelo FGC"],
          cons: ["Prazo fixo", "Rendimento ainda baixo"]
        },
        {
          name: "Tesouro Selic",
          risk: "Muito Baixo",
          return: "Médio (9% ao ano)",
          liquidity: "Alta",
          description: "Investimento do governo, muito seguro",
          pros: ["Muito segura", "Rende bem", "Fácil acesso"],
          cons: ["Rendimento pode variar", "Imposto sobre ganhos"]
        },
        {
          name: "Fundos de Renda Fixa",
          risk: "Baixo a Médio",
          return: "Médio (10% ao ano)",
          liquidity: "Média",
          description: "Investimento gerenciado por profissionais",
          pros: ["Gerenciado por especialistas", "Rende bem", "Diversificado"],
          cons: ["Taxa de administração", "Risco um pouco maior"]
        },
        {
          name: "Ações",
          risk: "Alto",
          return: "Alto (15% ao ano em média)",
          liquidity: "Alta",
          description: "Investimento em empresas, risco alto",
          pros: ["Rendimento alto", "Liquidez alta", "Participação em empresas"],
          cons: ["Risco alto", "Pode perder dinheiro", "Volatilidade"]
        }
      ],
      recommendations: [
        "Para iniciantes: Poupança, CDB ou Tesouro Selic",
        "Para médio prazo: Fundos de Renda Fixa",
        "Para longo prazo: Considerar ações",
        "Sempre diversificar investimentos"
      ],
      challenge: "Qual investimento você escolheria e por quê?",
      feedback: {
        conservative: "Boa escolha para iniciantes! Segurança é importante!",
        moderate: "Excelente equilíbrio entre risco e retorno!",
        aggressive: "Risco alto, mas pode render bem. Cuidado!"
      }
    },
    gradeId: "7º Ano",
    module: 3,
    order: 3,
    difficulty: 5,
    estimatedTime: 25,
    bnccSkills: ["EF07MA01", "EF07CI01", "EF07GE01"],
    tags: ["risco", "retorno", "investimentos"],
    isActive: true
  },
  // MÓDULO 4: SEGURANÇA FINANCEIRA
  {
    title: "Golpes Financeiros",
    description: "Aprenda a identificar e evitar golpes financeiros",
    type: "simulation",
    content: {
      scenario: "Identifique golpes financeiros em diferentes situações",
      situations: [
        {
          id: 1,
          situation: "Você recebe um e-mail dizendo que ganhou R$ 10.000 em um sorteio que não participou",
          options: [
            {
              choice: "Clicar no link e preencher os dados",
              consequence: "Seus dados são roubados e você pode ter problemas",
              impact: "Pode ter identidade roubada e perder dinheiro",
              feedback: "Golpe! Ninguém ganha prêmios sem participar!"
            },
            {
              choice: "Ignorar o e-mail",
              consequence: "Nada acontece, você está seguro",
              impact: "Protege seus dados e dinheiro",
              feedback: "Excelente! Sempre desconfie de ofertas boas demais!"
            },
            {
              choice: "Verificar se o sorteio existe",
              consequence: "Descobre que é golpe e se protege",
              impact: "Aprende a verificar informações",
              feedback: "Ótima estratégia! Sempre verifique antes de acreditar!"
            }
          ]
        },
        {
          id: 2,
          situation: "Alguém liga dizendo que você tem uma dívida e precisa pagar imediatamente",
          options: [
            {
              choice: "Pagar imediatamente",
              consequence: "Você paga uma dívida que não existe",
              impact: "Perde dinheiro para golpistas",
              feedback: "Golpe! Nunca pague dívidas por telefone!"
            },
            {
              choice: "Pedir comprovante da dívida",
              consequence: "O golpista desiste e você se protege",
              impact: "Protege seu dinheiro e aprende a se defender",
              feedback: "Perfeito! Sempre peça comprovantes!"
            },
            {
              choice: "Desligar e verificar com o banco",
              consequence: "Descobre que é golpe e se protege",
              impact: "Aprende a verificar informações oficiais",
              feedback: "Excelente! Sempre verifique com fontes oficiais!"
            }
          ]
        }
      ],
      redFlags: [
        "Ofertas boas demais para ser verdade",
        "Pressão para decidir rapidamente",
        "Pedido de dados pessoais por e-mail/telefone",
        "Promessas de ganhos fáceis",
        "Falta de informações sobre a empresa"
      ],
      protectionTips: [
        "Nunca compartilhe dados pessoais por e-mail/telefone",
        "Sempre verifique informações com fontes oficiais",
        "Desconfie de ofertas boas demais",
        "Nunca pague antecipadamente por serviços",
        "Mantenha seus dados seguros"
      ]
    },
    gradeId: "7º Ano",
    module: 4,
    order: 1,
    difficulty: 4,
    estimatedTime: 20,
    bnccSkills: ["EF07CI01", "EF07GE01", "EF07CH01"],
    tags: ["golpes", "segurança", "proteção"],
    isActive: true
  },
  {
    title: "Proteção de Dados",
    description: "Aprenda a proteger seus dados pessoais e financeiros",
    type: "quiz",
    content: {
      scenario: "Teste seus conhecimentos sobre proteção de dados",
      questions: [
        {
          id: 1,
          question: "Qual é a melhor senha para sua conta bancária?",
          options: [
            "123456",
            "seunome123",
            "MinhaSenh@2024!",
            "password"
          ],
          correct: 2,
          explanation: "Senhas fortes devem ter letras, números, símbolos e ser únicas"
        },
        {
          id: 2,
          question: "Você deve compartilhar sua senha bancária com:",
          options: [
            "Seus pais",
            "Seus amigos",
            "Ninguém",
            "Sua namorada/namorado"
          ],
          correct: 2,
          explanation: "Nunca compartilhe senhas bancárias com ninguém!"
        },
        {
          id: 3,
          question: "É seguro fazer compras online em:",
          options: [
            "Qualquer site",
            "Sites sem certificado de segurança",
            "Sites com certificado SSL (https)",
            "Redes Wi-Fi públicas"
          ],
          correct: 2,
          explanation: "Sempre verifique se o site tem certificado SSL (https)"
        },
        {
          id: 4,
          question: "Você deve clicar em links de e-mails:",
          options: [
            "Sempre",
            "Nunca",
            "Apenas de pessoas conhecidas",
            "Apenas se parecerem seguros"
          ],
          correct: 1,
          explanation: "Nunca clique em links de e-mails suspeitos!"
        },
        {
          id: 5,
          question: "É seguro usar Wi-Fi público para:",
          options: [
            "Acessar conta bancária",
            "Fazer compras online",
            "Navegar em sites seguros",
            "Todas as opções acima"
          ],
          correct: 2,
          explanation: "Wi-Fi público não é seguro para transações financeiras"
        }
      ],
      tips: [
        "Use senhas fortes e únicas",
        "Nunca compartilhe dados pessoais",
        "Verifique certificados de segurança",
        "Cuidado com Wi-Fi público",
        "Mantenha antivírus atualizado"
      ],
      scoring: {
        5: "Excelente! Você sabe se proteger!",
        4: "Muito bom! Continue se protegendo!",
        3: "Bom, mas pode melhorar!",
        2: "Cuidado! Aprenda mais sobre segurança!",
        1: "Perigoso! Estude mais sobre proteção!"
      }
    },
    gradeId: "7º Ano",
    module: 4,
    order: 2,
    difficulty: 4,
    estimatedTime: 20,
    bnccSkills: ["EF07CI01", "EF07GE01", "EF07CH01"],
    tags: ["proteção", "dados", "segurança"],
    isActive: true
  },
  {
    title: "Revisão e Celebração",
    description: "Revise seus conhecimentos e celebre suas conquistas",
    type: "quiz",
    content: {
      scenario: "Revise seus conhecimentos sobre planejamento e controle financeiro",
      questions: [
        {
          id: 1,
          question: "Qual é a importância de ter um orçamento pessoal?",
          options: [
            "Para gastar mais dinheiro",
            "Para controlar gastos e planejar",
            "Para impressionar os amigos",
            "Para guardar dinheiro sem usar"
          ],
          correct: 1,
          explanation: "O orçamento pessoal ajuda a controlar gastos e planejar melhor o uso do dinheiro!"
        },
        {
          id: 2,
          question: "O que é consumo inteligente?",
          options: [
            "Comprar tudo que vemos",
            "Pesquisar preços e avaliar qualidade",
            "Sempre escolher o mais barato",
            "Nunca comprar nada"
          ],
          correct: 1,
          explanation: "Consumo inteligente é pesquisar preços, avaliar qualidade e tomar decisões informadas!"
        },
        {
          id: 3,
          question: "Qual é a diferença entre poupança e investimento?",
          options: [
            "Não há diferença",
            "Poupança é segura, investimento tem risco",
            "Investimento é sempre melhor",
            "Poupança rende mais"
          ],
          correct: 1,
          explanation: "Poupança é mais segura e acessível, investimento tem mais risco mas pode render mais!"
        },
        {
          id: 4,
          question: "Como se proteger de golpes financeiros?",
          options: [
            "Confiar em todas as ofertas",
            "Verificar informações e desconfiar de ofertas boas demais",
            "Sempre pagar antecipadamente",
            "Compartilhar dados pessoais"
          ],
          correct: 1,
          explanation: "Sempre verifique informações com fontes oficiais e desconfie de ofertas boas demais!"
        },
        {
          id: 5,
          question: "Por que é importante proteger dados pessoais?",
          options: [
            "Para impressionar os amigos",
            "Para evitar fraudes e roubo de identidade",
            "Para gastar mais dinheiro",
            "Para ser mais popular"
          ],
          correct: 1,
          explanation: "Proteger dados pessoais é fundamental para evitar fraudes e roubo de identidade!"
        }
      ],
      celebration: {
        message: "🎉 Parabéns! Você completou o 7º ano!",
        achievements: [
          "Aprendeu sobre orçamento pessoal",
          "Desenvolveu consumo inteligente",
          "Entendeu sobre poupança e investimentos",
          "Aprendeu sobre segurança financeira",
          "Criou metas financeiras",
          "Categorizou gastos pessoais"
        ],
        nextSteps: "No 8º ano, você aprenderá sobre investimentos e crédito!"
      }
    },
    gradeId: "7º Ano",
    module: 4,
    order: 3,
    difficulty: 3,
    estimatedTime: 20,
    bnccSkills: ["EF07MA01", "EF07CI01", "EF07GE01", "EF07CH01"],
    tags: ["revisão", "celebração", "conhecimentos"],
    isActive: true
  }
];

// Função para conectar ao MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB conectado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao conectar com MongoDB:', error.message);
    process.exit(1);
  }
}

// Função para implementar lições
async function implementLessons() {
  try {
    console.log('🚀 Iniciando implementação das lições...');
    
    // Limpar lições existentes do 6º e 7º ano
    await Lesson.deleteMany({ 
      gradeId: { $in: ["6º Ano", "7º Ano"] } 
    });
    console.log('🧹 Lições antigas removidas');
    
    // Implementar lições do 6º ano
    console.log('📚 Implementando lições do 6º ano...');
    for (const lesson of lessons6thGrade) {
      const newLesson = new Lesson(lesson);
      await newLesson.save();
      console.log(`✅ Lição criada: ${lesson.title} (Módulo ${lesson.module})`);
    }
    
    // Implementar lições do 7º ano
    console.log('📚 Implementando lições do 7º ano...');
    for (const lesson of lessons7thGrade) {
      const newLesson = new Lesson(lesson);
      await newLesson.save();
      console.log(`✅ Lição criada: ${lesson.title} (Módulo ${lesson.module})`);
    }
    
    console.log('🎉 Implementação concluída com sucesso!');
    console.log(`📊 Total de lições implementadas: ${lessons6thGrade.length + lessons7thGrade.length}`);
    
  } catch (error) {
    console.error('❌ Erro durante implementação:', error.message);
  }
}

// Função principal
async function main() {
  await connectDB();
  await implementLessons();
  await mongoose.connection.close();
  console.log('👋 Conexão fechada');
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { implementLessons };
