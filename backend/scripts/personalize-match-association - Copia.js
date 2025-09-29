const mongoose = require('mongoose');
const path = require('path');

// Carregar .env do diretório backend
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Conectar ao MongoDB usando variável do .env
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI não encontrada no arquivo .env');
  process.exit(1);
}

console.log('🔗 Conectando ao MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => console.error('❌ Erro ao conectar:', err));

const Lesson = require('../models/Lesson');

async function personalizeAssociationContent() {
  try {
    console.log('🎯 Personalizando conteúdo educativo das lições de ASSOCIAÇÃO...\n');

    // Conteúdo personalizado para cada lição de associação
    const associationLessons = {
      "Fraudes no Mundo do Trabalho": {
        gradeId: "9º Ano",
        content: {
          format: "ASSOCIATION",
          description: "Associe os tipos de fraudes trabalhistas com suas características e formas de prevenção.",
          instructions: undefined,
          categories: [
            {
              name: "Tipos de Fraudes",
              items: [
                "Pirâmide financeira",
                "Venda casada de produtos",
                "Cobrança de taxas para emprego",
                "Promessa de renda fácil",
                "Trabalho escravo"
              ]
            },
            {
              name: "Características",
              items: [
                "Promete ganhos sem esforço",
                "Exige investimento inicial",
                "Não tem carteira assinada",
                "Cobra taxas de cadastro",
                "Condições degradantes de trabalho"
              ]
            }
          ]
        }
      },

      "Dívidas e Cartão de Crédito": {
        gradeId: "1º Ano EM",
        content: {
          format: "ASSOCIATION",
          description: "Relacione os conceitos de dívidas e cartão de crédito com suas definições e impactos.",
          instructions: undefined,
          categories: [
            {
              name: "Conceitos Financeiros",
              items: [
                "Juros compostos",
                "Limite de crédito",
                "Fatura do cartão",
                "Rotativo do cartão",
                "Anuidade"
              ]
            },
            {
              name: "Definições",
              items: [
                "Juros sobre juros acumulados",
                "Valor máximo que pode gastar",
                "Resumo mensal de gastos",
                "Parcelamento automático com juros",
                "Taxa anual do cartão"
              ]
            }
          ]
        }
      },

      "Psicologia de Mercado": {
        gradeId: "2º Ano EM",
        content: {
          format: "ASSOCIATION",
          description: "Conecte os conceitos de psicologia de mercado com seus efeitos no comportamento do consumidor.",
          instructions: undefined,
          categories: [
            {
              name: "Técnicas Psicológicas",
              items: [
                "Urgência artificial",
                "Ancoragem de preços",
                "Efeito manada",
                "Escassez percebida",
                "Gatilho emocional"
              ]
            },
            {
              name: "Efeitos no Consumidor",
              items: [
                "Compra por impulso",
                "Comparação com preço alto",
                "Seguir comportamento da maioria",
                "Medo de perder oportunidade",
                "Decisão baseada em emoção"
              ]
            }
          ]
        }
      },

      "Gestão de Portfólio": {
        gradeId: "2º Ano EM",
        content: {
          format: "ASSOCIATION",
          description: "Associe os conceitos de gestão de portfólio com suas estratégias e objetivos.",
          instructions: undefined,
          categories: [
            {
              name: "Estratégias de Investimento",
              items: [
                "Diversificação",
                "Alocação de ativos",
                "Rebalanceamento",
                "Análise de risco",
                "Horizonte temporal"
              ]
            },
            {
              name: "Objetivos",
              items: [
                "Reduzir riscos totais",
                "Distribuir investimentos",
                "Ajustar proporções",
                "Avaliar perdas possíveis",
                "Definir prazo de investimento"
              ]
            }
          ]
        }
      },

      "Investimentos Internacionais": {
        gradeId: "3º Ano EM",
        content: {
          format: "ASSOCIATION",
          description: "Relacione os tipos de investimentos internacionais com suas características e riscos.",
          instructions: undefined,
          categories: [
            {
              name: "Tipos de Investimentos",
              items: [
                "ETFs internacionais",
                "Fundos de ações globais",
                "BDRs",
                "Moedas estrangeiras",
                "Commodities"
              ]
            },
            {
              name: "Características e Riscos",
              items: [
                "Fundos que seguem índices mundiais",
                "Carteira diversificada globalmente",
                "Certificados de ações estrangeiras",
                "Exposição a variação cambial",
                "Mercadorias como ouro e petróleo"
              ]
            }
          ]
        }
      },

      "Ética e Responsabilidade Social": {
        gradeId: "3º Ano EM",
        content: {
          format: "ASSOCIATION",
          description: "Conecte os conceitos de ética financeira com práticas responsáveis e sustentáveis.",
          instructions: undefined,
          categories: [
            {
              name: "Conceitos Éticos",
              items: [
                "Investimento sustentável",
                "Transparência financeira",
                "Responsabilidade social",
                "Governança corporativa",
                "Impacto ambiental"
              ]
            },
            {
              name: "Práticas Responsáveis",
              items: [
                "ESG (Environmental, Social, Governance)",
                "Divulgação clara de informações",
                "Contribuição para sociedade",
                "Boas práticas empresariais",
                "Consideração do meio ambiente"
              ]
            }
          ]
        }
      }
    };

    console.log('🔗 Personalizando lições de ASSOCIAÇÃO...');
    
    for (const [lessonTitle, lessonData] of Object.entries(associationLessons)) {
      const lesson = await Lesson.findOne({ 
        title: lessonTitle,
        type: "match"
      });

      if (lesson) {
        // Atualizar o conteúdo da lição
        lesson.content = lessonData.content;
        lesson.gradeId = lessonData.gradeId;
        
        await lesson.save();
        console.log(`   ✅ ${lessonTitle} - Conteúdo personalizado aplicado`);
        console.log(`      📋 Categorias: ${lessonData.content.categories.length}`);
        console.log(`      📝 Itens por categoria: ${lessonData.content.categories[0].items.length}`);
      } else {
        console.log(`   ⚠️  ${lessonTitle} - Lição não encontrada`);
      }
    }

    console.log('\n🎉 Personalização das lições de ASSOCIAÇÃO concluída!');
    console.log(`   📊 Total processado: ${Object.keys(associationLessons).length} lições`);
    console.log(`   🎯 Foco: Conteúdo educativo contextual e didático`);

  } catch (error) {
    console.error('❌ Erro durante a personalização:', error);
  } finally {
    mongoose.connection.close();
  }
}

personalizeAssociationContent();
