const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function createPriceComparisonTemplate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Lesson = mongoose.model('Lesson', new mongoose.Schema({}, { strict: false }));
    
    console.log('💰 CRIANDO TEMPLATE PRICE COMPARISON PERSONALIZADO');
    console.log('============================================================');
    
    // Buscar a lição "Pesquisa de Preços"
    const lesson = await Lesson.findOne({ 
      title: { $regex: /Pesquisa.*Preços/i },
      gradeId: "7º Ano"
    });
    
    if (!lesson) {
      console.log('❌ Lição "Pesquisa de Preços" não encontrada');
      return;
    }
    
    console.log('📋 Lição encontrada:', lesson.title);
    console.log('📊 Série:', lesson.gradeId);
    console.log('🎯 Tipo:', lesson.type);
    
    // ESTRUTURA PERSONALIZADA PARA PRICE COMPARISON
    const newPriceComparisonStructure = {
      // Cenário principal
      scenario: {
        title: "Pesquisa de Preços Online",
        description: "Você precisa comprar um smartphone. Use a barra de pesquisa para encontrar as melhores ofertas e compare os resultados!"
      },
      
      // Objetivos da lição
      objectives: [
        "Aprender a fazer pesquisa de preços online",
        "Identificar a melhor relação custo-benefício",
        "Considerar fatores além do preço (qualidade, garantia, entrega)",
        "Tomar decisões de compra conscientes",
        "Desenvolver habilidades de pesquisa de mercado"
      ],
      
      // Termos de pesquisa disponíveis
      searchTerms: [
        "smartphone básico",
        "celular barato",
        "samsung galaxy",
        "iphone",
        "celular com garantia"
      ],
      
      // Base de dados de produtos (simula resultados de pesquisa)
      productDatabase: [
        {
          id: 1,
          name: "Moto E13",
          description: "4 GB RAM | 64 GB armazenamento, bateria 5.000 mAh",
          price: 699,
          store: "TechStore",
          delivery: "Rápida (até 3 dias em grandes capitais)",
          warranty: "12 meses",
          rating: 4.2,
          searchKeywords: ["smartphone básico", "celular barato", "moto e13", "celular com garantia"],
          features: [
            "4 GB RAM",
            "64 GB armazenamento",
            "Bateria 5.000 mAh",
            "Android"
          ],
          isBestValue: true
        },
        {
          id: 2,
          name: "Samsung Galaxy A15",
          description: "6 GB RAM | 128 GB armazenamento, bateria 5.000 mAh",
          price: 1299,
          store: "MegaTech",
          delivery: "Padrão (5 a 7 dias úteis)",
          warranty: "12 meses",
          rating: 4.5,
          searchKeywords: ["smartphone intermediário", "samsung galaxy a15", "celular 128gb"],
          features: [
            "6 GB RAM",
            "128 GB armazenamento",
            "Bateria 5.000 mAh",
            "Android"
          ],
          isBestValue: false
        },
        {
          id: 3,
          name: "Redmi Note 13",
          description: "8 GB RAM | 256 GB armazenamento, bateria 5.000 mAh com carregamento rápido",
          price: 1799,
          store: "PremiumStore",
          delivery: "Rápida (até 4 dias úteis)",
          warranty: "12 meses",
          rating: 4.8,
          searchKeywords: ["smartphone premium", "redmi note 13", "celular 256gb"],
          features: [
            "8 GB RAM",
            "256 GB armazenamento",
            "Bateria 5.000 mAh",
            "Carregamento rápido"
          ],
          isBestValue: false
        },
        {
          id: 4,
          name: "Samsung Galaxy A54 5G",
          description: "8 GB RAM | 256 GB armazenamento, bateria 5.000 mAh",
          price: 2299,
          store: "EconomiaTech",
          delivery: "Grátis em algumas lojas",
          warranty: "12 meses",
          rating: 4.6,
          searchKeywords: ["smartphone premium", "samsung galaxy a54", "celular 5g", "celular 256gb"],
          features: [
            "8 GB RAM",
            "256 GB armazenamento",
            "Bateria 5.000 mAh",
            "5G"
          ],
          isBestValue: false
        },
        {
          id: 5,
          name: "iPhone 14 (128 GB)",
          description: "6 GB RAM | 128 GB armazenamento, bateria 3.279 mAh (otimização iOS)",
          price: 5299,
          store: "CompactStore",
          delivery: "Expressa disponível em cidades grandes",
          warranty: "12 meses (AppleCare+ opcional)",
          rating: 4.7,
          searchKeywords: ["iphone 14", "smartphone premium", "celular 128gb", "apple"],
          features: [
            "6 GB RAM",
            "128 GB armazenamento",
            "Bateria 3.279 mAh",
            "iOS"
          ],
          isBestValue: false
        },
        {
          id: 6,
          name: "Samsung Galaxy S24 Ultra",
          description: "12 GB RAM | 512 GB armazenamento, bateria 5.000 mAh",
          price: 8999,
          store: "GarantiaStore",
          delivery: "Premium (1 a 3 dias, dependendo da loja)",
          warranty: "12 meses",
          rating: 4.9,
          searchKeywords: ["samsung galaxy s24 ultra", "smartphone premium", "celular 512gb", "celular com garantia"],
          features: [
            "12 GB RAM",
            "512 GB armazenamento",
            "Bateria 5.000 mAh",
            "Android"
          ],
          isBestValue: false
        },
        {
          id: 7,
          name: "Moto G04",
          description: "4 GB RAM | 128 GB armazenamento, bateria 5.000 mAh",
          price: 849,
          store: "MegaTech",
          delivery: "Normal (5 a 7 dias úteis)",
          warranty: "12 meses",
          rating: 4.1,
          searchKeywords: ["smartphone básico", "celular barato", "moto g04", "celular com garantia"],
          features: [
            "4 GB RAM",
            "128 GB armazenamento",
            "Bateria 5.000 mAh",
            "Android"
          ],
          isBestValue: true
        },
        {
          id: 8,
          name: "iPhone 11 (64 GB)",
          description: "4 GB RAM | 64 GB armazenamento, bateria 3.110 mAh",
          price: 3199,
          store: "PremiumStore",
          delivery: "Expressa disponível em grandes cidades",
          warranty: "12 meses (Apple Brasil)",
          rating: 4.6,
          searchKeywords: ["iphone 11", "iphone", "smartphone premium", "celular 64gb", "apple"],
          features: [
            "4 GB RAM",
            "64 GB armazenamento",
            "Bateria 3.110 mAh",
            "iOS"
          ],
          isBestValue: true
        }
      ],

      // Tabela comparativa de diferenciais das lojas reais
      comparisonTable: {
        title: "Comparativo de Diferenciais",
        description: "Compare os serviços oferecidos por cada loja:",
        stores: [
          {
            id: "techstore",
            name: "TechStore",
            color: "#3B82F6" // Azul
          },
          {
            id: "megatech", 
            name: "MegaTech",
            color: "#10B981" // Verde
          },
          {
            id: "premiumstore",
            name: "PremiumStore", 
            color: "#F59E0B" // Amarelo
          },
          {
            id: "economiatech",
            name: "EconomiaTech",
            color: "#EF4444" // Vermelho
          },
          {
            id: "compactstore",
            name: "CompactStore",
            color: "#8B5CF6" // Roxo
          },
          {
            id: "garantiastore",
            name: "GarantiaStore",
            color: "#F97316" // Laranja
          }
        ],
        differentials: [
          {
            id: "frete-gratis",
            name: "Frete grátis",
            description: "Entrega gratuita para todo o Brasil"
          },
          {
            id: "garantia-estendida",
            name: "Garantia estendida",
            description: "Garantia superior a 12 meses"
          },
          {
            id: "avaliacao-alta",
            name: "Avaliação alta",
            description: "Nota superior a 4.0 estrelas"
          },
          {
            id: "preco-competitivo",
            name: "Preço competitivo",
            description: "Valor abaixo de R$ 500"
          }
        ],
        // Matriz de disponibilidade: [diferencial][loja] = true/false
        // TechStore, MegaTech, PremiumStore, EconomiaTech, CompactStore, GarantiaStore
        availability: [
          [true, false, true, false, false, true],   // Frete grátis
          [false, true, true, false, false, true],   // Garantia estendida
          [true, true, true, false, true, true],     // Avaliação alta
          [true, false, false, true, true, false]    // Preço competitivo
        ]
      },
      
      // Critérios de avaliação
      evaluationCriteria: [
        {
          name: "Preço",
          weight: 30,
          description: "Custo total incluindo entrega"
        },
        {
          name: "Qualidade",
          weight: 25,
          description: "Avaliação dos usuários e especificações"
        },
        {
          name: "Garantia",
          weight: 20,
          description: "Período de garantia oferecido"
        },
        {
          name: "Entrega",
          weight: 15,
          description: "Custo e prazo de entrega"
        },
        {
          name: "Funcionalidades",
          weight: 10,
          description: "Recursos e especificações técnicas"
        }
      ],
      
      // Sistema de feedback
      feedback: {
        success: "🎉 Excelente! Você escolheu a melhor relação custo-benefício!",
        warning: "👍 Boa escolha! Você considerou fatores importantes na decisão.",
        failure: "💡 Que tal analisar melhor os critérios? Considere preço, qualidade e garantia!",
        perfect: "🏆 Perfeito! Você dominou a arte de comparar preços!"
      },
      
      // Dicas educativas
      tips: [
        "Sempre compare o preço total (produto + entrega)",
        "Considere a garantia oferecida",
        "Leia as avaliações de outros compradores",
        "Pense nas suas necessidades reais",
        "Não escolha apenas pelo preço mais baixo"
      ],
      
      // Configurações da lição
      lessonConfig: {
        timeLimit: null,
        allowRetry: true,
        showRatings: true,
        showWarranty: true,
        showDelivery: true,
        showFeatures: true
      },
      
      // Sistema de pontuação
      scoring: {
        correctChoice: 100,
        partialCredit: 50,
        maxPoints: 100,
        bonusForAnalysis: 10
      },
      
      // Metadados
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        totalProducts: 4,
        priceRange: "R$ 450 - R$ 950",
        bestValueProduct: "Smartphone Básico - Loja A"
      }
    };
    
    // Forçar atualização completa da lição
    const updateResult = await Lesson.updateOne(
      { _id: lesson._id },
      { 
        $set: { 
          content: newPriceComparisonStructure,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('🔄 Resultado da atualização:', updateResult);
    
    console.log('✅ Template price comparison criado com sucesso!');
    console.log('📊 Produtos na base de dados:', newPriceComparisonStructure.productDatabase.length);
    console.log('🔍 Termos de pesquisa:', newPriceComparisonStructure.searchTerms.length);
    console.log('🎯 Cenário:', newPriceComparisonStructure.scenario.title);
    console.log('⏱️ Tempo estimado: 15-20 minutos');
    
  } catch (error) {
    console.error('❌ Erro ao criar template price comparison:', error);
  } finally {
    mongoose.connection.close();
  }
}

createPriceComparisonTemplate();
