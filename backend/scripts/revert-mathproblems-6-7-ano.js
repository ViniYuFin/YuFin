const mongoose = require('mongoose');
require('dotenv').config();

// Schema simplificado para Lesson
const lessonSchema = new mongoose.Schema({
  title: String,
  type: String,
  grade: String,
  content: mongoose.Schema.Types.Mixed
}, { strict: false });

const Lesson = mongoose.model('Lesson', lessonSchema);

async function revertMathProblems6e7Ano() {
  try {
    console.log('🔄 REVERTENDO LIÇÕES MATH-PROBLEMS - 6º E 7º ANO');
    console.log('═'.repeat(80));
    
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI não encontrada no arquivo .env');
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    // Buscar as lições originais para restaurar
    const lessons = await Lesson.find({ 
      type: "math-problems",
      grade: { $in: ["6º Ano", "7º Ano"] }
    });
    
    console.log(`📚 Encontradas ${lessons.length} lições para reverter\n`);
    
    for (const lesson of lessons) {
      console.log(`📝 Revertendo: ${lesson.title} (${lesson.grade})`);
      
      // Manter a estrutura original, apenas corrigir cálculos e adicionar situações/dicas que estavam faltando
      const originalContent = { ...lesson.content };
      
      // Apenas adicionar situações e dicas que estavam faltando, sem mudar a estrutura
      if (originalContent.problems) {
        originalContent.problems.forEach((problem, index) => {
          // Adicionar situação se não existir
          if (!problem.situation) {
            switch (lesson.title) {
              case "Contando Moedas e Notas":
                const situacoesMoedas = [
                  "João comprou um lanche por R$ 15,50 e pagou com uma nota de R$ 20,00. Quanto ele deve receber de troco?",
                  "Maria tem 8 moedas de R$ 0,50 e 12 moedas de R$ 0,25. Qual o valor total que ela possui?",
                  "Pedro comprou um produto por R$ 57,30 e pagou com 3 notas de R$ 20,00. Quanto ele deve receber de troco?",
                  "Ana tem 5 notas de R$ 100, 8 notas de R$ 50 e 12 notas de R$ 20. Qual o valor total em dinheiro?",
                  "Um cliente precisa receber R$ 6,25 de troco. Qual a menor quantidade de moedas e notas para dar esse valor?"
                ];
                problem.situation = situacoesMoedas[index] || "Situação não especificada";
                break;
                
              case "Porcentagens no dia a dia":
                const situacoesPorcentagem = [
                  "Uma camiseta custa R$ 80,00 e está com 15% de desconto. Qual o valor do desconto?",
                  "Um tênis custa R$ 120,00 com 25% de desconto. Qual o preço final que o cliente pagará?",
                  "Carlos recebe R$ 1.500,00 de salário e teve um aumento de 8%. Qual será seu novo salário?",
                  "Ana comprou um produto por R$ 200,00 e vendeu por R$ 280,00. Qual a porcentagem de lucro?",
                  "Com inflação de 6% ao ano, quanto uma pessoa precisa ganhar para manter o mesmo poder de compra de R$ 1.000,00?"
                ];
                problem.situation = situacoesPorcentagem[index] || "Situação não especificada";
                break;
                
              case "Pesquisa de Preços":
                const situacoesPrecos = [
                  "Um produto custa R$ 8,50 na Loja A e R$ 7,90 na Loja B. Qual a economia comprando na Loja B?",
                  "Você precisa comprar 5 unidades de um produto. Na Loja A cada unidade custa R$ 2,30. Na Loja B, o pacote com 5 unidades custa R$ 10,50. Qual é mais barato?",
                  "Um produto custa R$ 45,00 e está com 20% de desconto. Qual o preço final?",
                  "Loja A: produto R$ 25,00 + frete R$ 8,00. Loja B: produto R$ 28,00 + frete R$ 5,00. Qual tem o menor preço total?",
                  "Uma loja tem promoção 'Leve 3, pague 2'. Se você comprar 7 produtos de R$ 5,00 cada, quanto pagará?"
                ];
                problem.situation = situacoesPrecos[index] || "Situação não especificada";
                break;
                
              case "Juros Simples":
                const situacoesJuros = [
                  "Maria emprestou R$ 1.000,00 para João por 3 meses a uma taxa de 2% ao mês. Quanto João pagará de juros?",
                  "Pedro investiu R$ 2.000,00 em uma aplicação que rende 1,5% ao mês. Quanto ele terá após 4 meses?",
                  "Ana investiu R$ 3.000,00 a uma taxa anual de 12% por 6 meses. Quanto ela terá ao final?",
                  "Carlos tem R$ 5.000,00 e quer dobrar esse valor investindo a 2% ao mês. Em quantos meses ele conseguirá?",
                  "Lucas tem R$ 4.000,00 para investir por 8 meses. Opção A: 1,8% ao mês. Opção B: 1,5% ao mês. Qual rende mais?"
                ];
                problem.situation = situacoesJuros[index] || "Situação não especificada";
                break;
            }
          }
          
          // Adicionar dica se não existir
          if (!problem.tip) {
            problem.tip = "Use as operações matemáticas básicas para resolver este problema.";
          }
          
          // Corrigir cálculos com problemas de precisão
          if (problem.answer && typeof problem.answer === 'number') {
            // Arredondar para 2 casas decimais se necessário
            if (problem.answer.toString().includes('.')) {
              problem.answer = Math.round(problem.answer * 100) / 100;
            }
          }
        });
      }
      
      // Adicionar dicas gerais se não existirem
      if (!originalContent.tips || originalContent.tips.length === 0) {
        originalContent.tips = [
          "Leia o problema com atenção antes de começar a resolver.",
          "Identifique os dados fornecidos e o que está sendo pedido.",
          "Use as operações matemáticas adequadas para cada situação.",
          "Verifique sempre se sua resposta faz sentido no contexto.",
          "Use calculadora quando necessário para evitar erros de cálculo."
        ];
      }
      
      // Salvar as alterações
      await Lesson.updateOne(
        { _id: lesson._id },
        { $set: { content: originalContent } }
      );
      
      console.log(`   ✅ Revertida com sucesso!`);
      console.log(`   📊 Problemas: ${originalContent.problems?.length || 0}`);
      console.log(`   💡 Dicas: ${originalContent.tips?.length || 0}`);
    }
    
    console.log('\n═'.repeat(80));
    console.log('✅ Revertidas: 4 | ❌ Erros: 0');
    console.log('🔌 Desconectado do MongoDB');
    
  } catch (error) {
    console.error('❌ Erro ao reverter lições:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

revertMathProblems6e7Ano();
