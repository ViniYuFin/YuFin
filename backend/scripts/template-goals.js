require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

mongoose.connect(process.env.MONGODB_URI);

async function createGoalsTemplate() {
  try {
    console.log('🎯 CRIANDO TEMPLATE GOALS PERSONALIZADO');
    console.log('='.repeat(60));
    
    // Buscar a lição "Definindo Metas Financeiras" (7º Ano)
    const lesson = await Lesson.findOne({ title: 'Definindo Metas Financeiras' });
    
    if (!lesson) {
      console.log('❌ Lição "Definindo Metas Financeiras" (7º Ano) não encontrada');
      return;
    }
    
    console.log('📋 Lição encontrada:', lesson.title);
    console.log('📊 Série:', lesson.gradeId);
    console.log('🎯 Tipo:', lesson.type);
    
    // ESTRUTURA HÍBRIDA PARA GOALS
    const newGoalsStructure = {
      // Cenário principal
      scenario: "Aprenda a calcular metas financeiras através de exemplos práticos e crie sua própria meta!",
      
      // Categorias de metas (nova funcionalidade)
      goalCategories: [
        {
          id: 'curto-prazo',
          name: 'Curto Prazo',
          description: 'Metas para alcançar em até 1 ano',
          icon: '🎯',
          color: 'green',
          examples: [
            'Comprar um videogame',
            'Fazer uma viagem',
            'Comprar roupas novas',
            'Adquirir um instrumento musical'
          ]
        },
        {
          id: 'medio-prazo',
          name: 'Médio Prazo',
          description: 'Metas para alcançar em 1 a 3 anos',
          icon: '🚀',
          color: 'blue',
          examples: [
            'Comprar uma bicicleta',
            'Fazer um curso',
            'Comprar um computador',
            'Fazer uma viagem internacional'
          ]
        },
        {
          id: 'longo-prazo',
          name: 'Longo Prazo',
          description: 'Metas para alcançar em mais de 3 anos',
          icon: '🌟',
          color: 'purple',
          examples: [
            'Comprar um carro',
            'Fazer faculdade',
            'Comprar uma casa',
            'Fazer uma viagem ao exterior'
          ]
        }
      ],
      
      // Exemplos práticos (mantendo formato original)
      examples: [
        {
          id: 1,
          character: "Mateus",
          category: "curto-prazo",
          scenario: "Mateus deseja comprar um celular novo de R$ 1.200,00. Quanto ele precisa poupar para comprá-lo em 12 meses?",
          price: 1200,
          months: 12,
          answer: 100,
          explanation: "Para comprar o celular em 12 meses, Mateus precisa poupar R$ 100,00 por mês (R$ 1.200 ÷ 12 = R$ 100,00)."
        },
        {
          id: 2,
          character: "Ana",
          category: "medio-prazo",
          scenario: "Ana quer comprar uma bicicleta de R$ 800,00. Ela tem 6 meses para juntar o dinheiro. Quanto ela deve poupar por mês?",
          price: 800,
          months: 6,
          answer: 133.33,
          explanation: "Para comprar a bicicleta em 6 meses, Ana precisa poupar R$ 133,33 por mês (R$ 800 ÷ 6 = R$ 133,33)."
        }
      ],
      
      // Campos de input (mantendo formato original)
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
        },
        {
          label: "Categoria da meta",
          type: "select",
          options: [
            { value: "curto-prazo", label: "Curto Prazo (até 1 ano)" },
            { value: "medio-prazo", label: "Médio Prazo (1 a 3 anos)" },
            { value: "longo-prazo", label: "Longo Prazo (mais de 3 anos)" }
          ]
        }
      ],
      
      // Dicas (mantendo formato original)
      tips: [
        "Divida o valor total pelo número de meses para saber quanto poupar por mês",
        "Considere sua renda mensal antes de definir metas muito altas",
        "Metas realistas são mais fáceis de alcançar",
        "Sempre reserve um pouco para emergências",
        "Categorize suas metas por prazo para melhor organização"
      ],
      
      // Mensagem de sucesso (mantendo formato original)
      successMessage: "Parabéns! Você aprendeu a calcular metas financeiras e criou sua própria meta!"
    };
    
    // Atualizar a lição com a nova estrutura
    lesson.content = newGoalsStructure;
    lesson.updatedAt = new Date();
    
    await lesson.save();
    
    console.log('✅ Template goals criado com sucesso!');
    console.log('📊 Categorias criadas:', newGoalsStructure.goalCategories.length);
    console.log('🎯 Exemplos criados:', newGoalsStructure.examples.length);
    console.log('⏱️ Tempo estimado: 15-20 minutos');
    
  } catch (error) {
    console.error('❌ Erro ao criar template goals:', error);
  } finally {
    mongoose.connection.close();
  }
}

createGoalsTemplate();
