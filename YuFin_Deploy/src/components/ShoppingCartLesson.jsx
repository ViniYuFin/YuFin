import React, { useState, useEffect } from 'react';
import LessonLayout from './LessonLayout';

const ShoppingCartLesson = ({ lesson, onComplete, onExit, reviewMode }) => {
  const [cart, setCart] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [showProductSelection, setShowProductSelection] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Extrair orçamento da lição
  const getBudget = () => {
    return lesson.content?.budget || 100;
  };

  const budget = getBudget();
  const products = lesson.content?.products || [];
  const totalProducts = products.length;

  // Navegar para o próximo produto
  const nextProduct = () => {
    if (currentProductIndex < totalProducts - 1) {
      setCurrentProductIndex(prev => prev + 1);
    } else {
      // Todos os produtos foram mostrados
      setShowProductSelection(false);
    }
  };

  // Navegar para o produto anterior
  const previousProduct = () => {
    if (currentProductIndex > 0) {
      setCurrentProductIndex(prev => prev - 1);
    }
  };

  // Adicionar item ao carrinho
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      setCart(prev => prev.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart(prev => [...prev, { ...item, quantity: 1 }]);
    }
    
    // Ir para o próximo produto
    nextProduct();
  };



  // Voltar para seleção de produtos
  const backToProducts = () => {
    setShowProductSelection(true);
    setCurrentProductIndex(0);
  };

  // Remover item do carrinho
  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  // Alterar quantidade
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  // Calcular total do carrinho
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const finalPrice = item.promotion ? item.promotionPrice : item.price;
      return total + (finalPrice * item.quantity);
    }, 0);
  };

  // Calcular economia total
  const getTotalSavings = () => {
    return cart.reduce((total, item) => {
      if (item.promotion) {
        return total + ((item.price - item.promotionPrice) * item.quantity);
      }
      return total;
    }, 0);
  };

  // Verificar se está dentro do orçamento
  const isWithinBudget = () => {
    return getCartTotal() <= budget;
  };

  // Finalizar compra
  const handleCheckout = () => {
    const cartTotal = getCartTotal();
    const totalSavings = getTotalSavings();
    const remainingBudget = budget - cartTotal;
    
    let score = 0;
    let feedback = '';
    
    if (cartTotal > budget) {
      score = 0;
      feedback = `Você ultrapassou o orçamento! Total: R$ ${cartTotal.toFixed(2).replace('.', ',')}, Orçamento: R$ ${budget.toFixed(2).replace('.', ',')}. Remova alguns itens.`;
      setIsCorrect(false);
    } else if (cartTotal === 0) {
      score = 100;
      feedback = `Excelente! Você não gastou nada e economizou R$ ${budget.toFixed(2).replace('.', ',')}. Disciplina financeira exemplar!`;
      setIsCorrect(true);
    } else if (remainingBudget >= budget * 0.3) {
      score = 90;
      feedback = `Muito bom! Você gastou R$ ${cartTotal.toFixed(2).replace('.', ',')} e ainda tem R$ ${remainingBudget.toFixed(2).replace('.', ',')}. Economia: R$ ${totalSavings.toFixed(2).replace('.', ',')}`;
      setIsCorrect(true);
    } else if (remainingBudget >= budget * 0.1) {
      score = 75;
      feedback = `Boa escolha! Você gastou R$ ${cartTotal.toFixed(2).replace('.', ',')} e ainda tem R$ ${remainingBudget.toFixed(2).replace('.', ',')}. Economia: R$ ${totalSavings.toFixed(2).replace('.', ',')}`;
      setIsCorrect(true);
    } else {
      score = 50;
      feedback = `Você gastou quase todo o orçamento (R$ ${cartTotal.toFixed(2).replace('.', ',')}). Tente ser mais seletivo nas próximas compras.`;
      setIsCorrect(false);
    }
    
    setFeedbackMessage(feedback);
    setShowFeedback(true);
  };

  const handleContinue = () => {
    const cartTotal = getCartTotal();
    const totalSavings = getTotalSavings();
    const remainingBudget = budget - cartTotal;
    
    let score = 0;
    
    if (cartTotal > budget) {
      score = 0;
    } else if (cartTotal === 0) {
      score = 100;
    } else if (remainingBudget >= budget * 0.3) {
      score = 90;
    } else if (remainingBudget >= budget * 0.1) {
      score = 75;
    } else {
      score = 50;
    }
    
    onComplete({
      score,
      timeSpent,
      isPerfect: score >= 90,
      feedback: feedbackMessage
    });
  };

  const cartTotal = getCartTotal();
  const totalSavings = getTotalSavings();
  const remainingBudget = budget - cartTotal;
  const currentProduct = products[currentProductIndex];

  return (
    <LessonLayout
      title={lesson.title}
      timeSpent={timeSpent}
      onExit={onExit}
      icon="🛒"
      reviewMode={reviewMode}
    >
      {/* Cenário da lição */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          🛒 Compras Coletivas no Supermercado
        </h2>
                 <div className="bg-blue-50 p-4 rounded-lg mb-4">
           <p className="text-blue-800 font-semibold">
             {lesson.content.scenario || 'Você e seus amigos têm R$ ' + budget.toFixed(2).replace('.', ',') + ' para fazer compras coletivas. Decida entre necessidades básicas e desejos, considerando o orçamento limitado!'}
           </p>
         </div>
      </div>

      {/* Layout em grid - Produtos e Carrinho lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Seleção de produtos sequencial */}
        {showProductSelection && currentProduct && (
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
          <div className="text-center mb-4">
            <div className="text-sm text-gray-600 mb-2">
              Produto {currentProductIndex + 1} de {totalProducts}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentProductIndex + 1) / totalProducts) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{currentProduct.name}</h3>
            
            {/* Categoria do produto */}
            <div className="mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentProduct.category === 'necessidade' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {currentProduct.category === 'necessidade' ? '🥗 Necessidade' : '🎉 Desejo'}
              </span>
            </div>
            
            <div className="mb-4">
              {currentProduct.promotion ? (
                <div>
                  <span className="text-lg text-gray-500 line-through">R$ {currentProduct.price.toFixed(2).replace('.', ',')}</span>
                  <div className="text-3xl font-bold text-green-600">R$ {currentProduct.promotionPrice.toFixed(2).replace('.', ',')}</div>
                  <span className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full">
                    -{Math.round(((currentProduct.price - currentProduct.promotionPrice) / currentProduct.price) * 100)}% OFF
                  </span>
                </div>
              ) : (
                <div className="text-3xl font-bold text-gray-800">
                  R$ {currentProduct.price.toFixed(2).replace('.', ',')}
                </div>
              )}
            </div>

            

             <div className="text-center">
               <button
                 onClick={cart.some(item => item.id === currentProduct.id) 
                   ? () => removeFromCart(currentProduct.id)
                   : () => addToCart(currentProduct)
                 }
                 className={`py-3 px-8 rounded-lg transition-colors font-bold text-lg ${
                   cart.some(item => item.id === currentProduct.id)
                     ? '!bg-red-500 !text-white hover:!bg-red-600'
                     : 'bg-green-500 text-white hover:bg-green-600'
                 }`}
                 style={cart.some(item => item.id === currentProduct.id) ? { backgroundColor: '#ef4444', color: 'white' } : {}}
               >
                 {cart.some(item => item.id === currentProduct.id) ? 'Remover' : 'Adicionar'}
               </button>
             </div>

            {/* Navegação */}
            <div className="flex justify-between mt-6">
              <button
                onClick={previousProduct}
                disabled={currentProductIndex === 0}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentProductIndex === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                ← Anterior
              </button>
              <button
                onClick={nextProduct}
                disabled={currentProductIndex === totalProducts - 1}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentProductIndex === totalProducts - 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Próximo →
              </button>
            </div>
          </div>
        </div>
      )}

         {/* Carrinho de compras simplificado */}
         <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-gray-800">🛒 Seu Carrinho</h3>
             {!showProductSelection && (
               <button
                 onClick={backToProducts}
                 className="!bg-blue-600 !text-white px-4 py-2 rounded-lg hover:!bg-blue-700 transition-colors text-sm font-medium shadow-sm border border-blue-600"
                 style={{ backgroundColor: '#2563eb', color: 'white' }}
               >
                 🔄 Ver Mais Produtos
               </button>
             )}
           </div>
           
           {cart.length === 0 ? (
             <div className="text-center text-gray-500 py-8">
               <div className="text-4xl mb-2">🛒</div>
               <p>Seu carrinho está vazio</p>
               <p className="text-sm">Adicione produtos para começar!</p>
             </div>
           ) : (
             <div className="text-center py-8">
               <div className="text-6xl mb-4">🛒</div>
               <div className="text-4xl font-bold text-blue-600 mb-2">{cart.length}</div>
               <p className="text-lg text-gray-700">itens no carrinho</p>
             </div>
           )}

           {/* Resumo financeiro simplificado */}
           <div className="border-t pt-4 space-y-2">
             <div className="flex justify-between font-bold text-lg">
               <span>Total:</span>
               <span className={cartTotal > budget ? 'text-red-600' : 'text-green-600'}>
                 R$ {cartTotal.toFixed(2).replace('.', ',')}
               </span>
             </div>
             <div className="flex justify-between text-sm">
               <span>Orçamento:</span>
               <span>R$ {budget.toFixed(2).replace('.', ',')}</span>
             </div>
             <div className="flex justify-between text-sm">
               <span>Restante:</span>
               <span className={remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}>
                 R$ {remainingBudget.toFixed(2).replace('.', ',')}
               </span>
             </div>
           </div>
         </div>
       </div>

      {/* Feedback */}
      {showFeedback && (
        <div className={`p-4 rounded-lg mb-6 text-center ${isCorrect ? 'bg-green-50 text-green-800 border-2 border-green-200' : 'bg-red-50 text-red-800 border-2 border-red-200'}`}>
          <div className="text-2xl mb-2">{isCorrect ? '🎉' : '💡'}</div>
          <p className="font-semibold">{feedbackMessage}</p>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex space-x-4">
        {!showFeedback ? (
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`flex-1 py-3 rounded-lg font-bold text-lg transition-colors ${
              cart.length === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            🛒 Finalizar Compra
          </button>
        ) : (
          <button
            onClick={handleContinue}
            className="flex-1 bg-primary text-white py-3 rounded-lg font-bold text-lg hover:bg-primary-dark transition-colors"
          >
            Continuar
          </button>
        )}
      </div>
    </LessonLayout>
  );
};

export default ShoppingCartLesson;
