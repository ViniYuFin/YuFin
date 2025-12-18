require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

mongoose.connect(process.env.MONGODB_URI);

async function createInputTemplate() {
  try {
    console.log('✏️ CRIANDO TEMPLATE INPUT PERSONALIZADO');
    console.log('='.repeat(60));
    
    // Buscar a lição "Porcentagens no dia a dia"
    const lesson = await Lesson.findOne({ title: 'Porcentagens no dia a dia' });
    
    if (!lesson) {
      console.log('❌ Lição "Porcentagens no dia a dia" não encontrada');
      return;
    }
    
    console.log('📋 Lição encontrada:', lesson.title);
    console.log('📊 Série:', lesson.gradeId);
    console.log('🎯 Tipo:', lesson.type);
    
    // NOVA ESTRUTURA PERSONALIZADA PARA INPUT
    const newInputStructure = {
      // Cenário principal com contexto prático
      scenario: {
        title: "Porcentagens Simples",
        description: "Você está ajudando seus pais a calcular descontos e aumentos em compras do dia a dia. Vamos praticar com situações reais!",
        context: "Situações práticas de cálculo",
        objective: "Dominar o cálculo de porcentagens em situações cotidianas"
      },
      
      // Problemas práticos com cálculos otimizados
      problems: [
        {
          id: 1,
          question: "Uma camiseta custa R$ 80,00. Com 15% de desconto, quanto você pagará?",
          context: "🛍️ Compra com desconto",
          hint: "Desconto = valor original × (porcentagem ÷ 100)",
          correctAnswer: 68,
          tolerance: 0.01, // Margem de erro de 1 centavo
          explanation: "Cálculo: R$ 80,00 × 0,15 = R$ 12,00 de desconto. R$ 80,00 - R$ 12,00 = R$ 68,00",
          stepByStep: [
            "1. Calcule o desconto: R$ 80,00 × 15% = R$ 80,00 × 0,15 = R$ 12,00",
            "2. Subtraia do valor original: R$ 80,00 - R$ 12,00 = R$ 68,00",
            "3. Resposta: R$ 68,00"
          ],
          formula: "Valor Final = Valor Original × (1 - Desconto%)"
        },
        {
          id: 2,
          question: "Seu salário de R$ 1.200,00 teve um aumento de 8%. Qual o novo salário?",
          context: "💰 Aumento salarial",
          hint: "Aumento = valor original × (porcentagem ÷ 100)",
          correctAnswer: 1296,
          tolerance: 0.01,
          explanation: "Cálculo: R$ 1.200,00 × 0,08 = R$ 96,00 de aumento. R$ 1.200,00 + R$ 96,00 = R$ 1.296,00",
          stepByStep: [
            "1. Calcule o aumento: R$ 1.200,00 × 8% = R$ 1.200,00 × 0,08 = R$ 96,00",
            "2. Some ao valor original: R$ 1.200,00 + R$ 96,00 = R$ 1.296,00",
            "3. Resposta: R$ 1.296,00"
          ],
          formula: "Valor Final = Valor Original × (1 + Aumento%)"
        },
        {
          id: 3,
          question: "Uma conta de luz de R$ 150,00 teve um reajuste de 12%. Qual o novo valor?",
          context: "⚡ Reajuste de conta",
          hint: "Reajuste = valor original × (porcentagem ÷ 100)",
          correctAnswer: 168,
          tolerance: 0.01,
          explanation: "Cálculo: R$ 150,00 × 0,12 = R$ 18,00 de reajuste. R$ 150,00 + R$ 18,00 = R$ 168,00",
          stepByStep: [
            "1. Calcule o reajuste: R$ 150,00 × 12% = R$ 150,00 × 0,12 = R$ 18,00",
            "2. Some ao valor original: R$ 150,00 + R$ 18,00 = R$ 168,00",
            "3. Resposta: R$ 168,00"
          ],
          formula: "Valor Final = Valor Original × (1 + Reajuste%)"
        },
        {
          id: 4,
          question: "Um produto de R$ 200,00 está com 25% de desconto. Qual o valor final?",
          context: "🏷️ Promoção especial",
          hint: "Desconto = valor original × (porcentagem ÷ 100)",
          correctAnswer: 150,
          tolerance: 0.01,
          explanation: "Cálculo: R$ 200,00 × 0,25 = R$ 50,00 de desconto. R$ 200,00 - R$ 50,00 = R$ 150,00",
          stepByStep: [
            "1. Calcule o desconto: R$ 200,00 × 25% = R$ 200,00 × 0,25 = R$ 50,00",
            "2. Subtraia do valor original: R$ 200,00 - R$ 50,00 = R$ 150,00",
            "3. Resposta: R$ 150,00"
          ],
          formula: "Valor Final = Valor Original × (1 - Desconto%)"
        },
        {
          id: 5,
          question: "Uma poupança de R$ 500,00 rendeu 6% em um mês. Qual o valor total?",
          context: "🏦 Rendimento de poupança",
          hint: "Rendimento = valor original × (porcentagem ÷ 100)",
          correctAnswer: 530,
          tolerance: 0.01,
          explanation: "Cálculo: R$ 500,00 × 0,06 = R$ 30,00 de rendimento. R$ 500,00 + R$ 30,00 = R$ 530,00",
          stepByStep: [
            "1. Calcule o rendimento: R$ 500,00 × 6% = R$ 500,00 × 0,06 = R$ 30,00",
            "2. Some ao valor original: R$ 500,00 + R$ 30,00 = R$ 530,00",
            "3. Resposta: R$ 530,00"
          ],
          formula: "Valor Final = Valor Original × (1 + Rendimento%)"
        }
      ],
      
      // Sistema de validação otimizado
      validation: {
        tolerance: 0.01, // Margem de erro padrão
        maxAttempts: 3,
        showHintAfterAttempt: 2,
        showFormulaAfterAttempt: 3
      },
      
      // Conclusão educativa
      conclusion: {
        title: "🎓 Parabéns! Você dominou as porcentagens!",
        message: "Agora você sabe calcular descontos, aumentos e reajustes em situações reais. Essas habilidades são essenciais para tomar decisões financeiras inteligentes!",
        keyPoints: [
          "Desconto: Valor Original × (1 - %)",
          "Aumento: Valor Original × (1 + %)",
          "Sempre verifique se o resultado faz sentido",
          "Pratique com situações reais do dia a dia"
        ],
        nextSteps: "No próximo módulo, você aprenderá sobre juros simples e compostos!"
      }
    };
    
    // Atualizar a lição com a nova estrutura
    await Lesson.updateOne(
      { _id: lesson._id },
      { 
        $set: { 
          'content': newInputStructure,
          'subtitle': 'Cálculos práticos de porcentagens em situações cotidianas',
          'difficulty': 3
        } 
      }
    );
    
    console.log('✅ Template Input criado com sucesso!');
    console.log('📊 Nova estrutura:');
    console.log('   - Cenário prático de cálculos');
    console.log('   - 5 problemas com situações reais');
    console.log('   - Sistema de validação otimizado');
    console.log('   - Feedback educativo com passo a passo');
    console.log('   - Fórmulas e dicas contextuais');
    
    console.log('\n🎯 Características do Template:');
    console.log('   ✅ Situações práticas do dia a dia');
    console.log('   ✅ Cálculos otimizados com tolerância');
    console.log('   ✅ Feedback educativo detalhado');
    console.log('   ✅ Fórmulas e dicas contextuais');
    console.log('   ✅ Passo a passo para cada problema');
    
    console.log('\n🎯 Próximos passos:');
    console.log('   1. Testar a lição no frontend');
    console.log('   2. Ajustar componente InputLesson.jsx se necessário');
    console.log('   3. Validar sistema de validação');
    console.log('   4. Documentar template para replicação');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

createInputTemplate();




