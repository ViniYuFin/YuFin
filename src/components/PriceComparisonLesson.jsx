import React, { useState, useEffect } from 'react';
import LessonLayout from './LessonLayout';

const PriceComparisonLesson = ({ lesson, onComplete, onExit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentStep, setCurrentStep] = useState('search'); // search, compare, final
  const [timeSpent, setTimeSpent] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Normalizar o conteúdo para suportar diferentes formatos
  const normalizedContent = React.useMemo(() => {
    if (!lesson.content) return { productDatabase: [], searchTerms: [], scenario: '' };
    
    // Formato novo: productDatabase
    if (lesson.content.productDatabase && lesson.content.productDatabase.length > 0) {
      return {
        productDatabase: lesson.content.productDatabase,
        searchTerms: lesson.content.searchTerms || [],
        scenario: lesson.content.scenario || { title: 'Pesquisa de Preços', description: 'Use a barra de pesquisa para encontrar produtos' }
      };
    }
    
    // Formato antigo: products
    if (lesson.content.products && lesson.content.products.length > 0) {
      return {
        productDatabase: lesson.content.products,
        searchTerms: [],
        scenario: lesson.content.scenario || { title: 'Comparação de Preços', description: 'Compare as opções disponíveis' }
      };
    }
    
    return { productDatabase: [], searchTerms: [], scenario: '' };
  }, [lesson.content]);

  // Função para realizar pesquisa
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    const results = normalizedContent.productDatabase.filter(product => 
      product.searchKeywords.some(keyword => 
        keyword.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    
    setSearchResults(results);
    setCurrentStep('results');
  };

  // Verificar se a pesquisa é relacionada a smartphones
  const isSmartphoneRelated = (searchTerm) => {
    const smartphoneKeywords = [
      'smartphone', 'celular', 'telefone', 'mobile', 'android', 'iphone',
      'samsung', 'xiaomi', 'motorola', 'lg', 'nokia', 'huawei'
    ];
    
    return smartphoneKeywords.some(keyword => 
      searchTerm.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  // Função para adicionar produto à comparação
  const handleAddToComparison = (product) => {
    if (selectedProducts.length < 3 && !selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  // Função para remover produto da comparação
  const handleRemoveFromComparison = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  // Função para finalizar comparação
  const handleFinalizeComparison = () => {
    if (selectedProducts.length === 0) return;
    
    // Encontrar o melhor custo-benefício
    const bestValue = selectedProducts.reduce((best, current) => {
      const currentScore = (current.rating * 20) - (current.price / 10) + (current.warranty === "Grátis" ? 10 : 0);
      const bestScore = (best.rating * 20) - (best.price / 10) + (best.warranty === "Grátis" ? 10 : 0);
      return currentScore > bestScore ? current : best;
    });
    
    setIsCorrect(selectedProducts.some(p => p.isBestValue));
    setCurrentStep('final');
    setShowFeedback(true);
  };

  // Verificar se há produtos disponíveis
  if (!normalizedContent.productDatabase || normalizedContent.productDatabase.length === 0) {
    return (
      <LessonLayout
        title={lesson.title}
        timeSpent={timeSpent}
        onExit={onExit}
        icon="💰"
      >
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Dados da lição não disponíveis</h2>
            <p className="text-gray-600 mb-4">Esta lição está sendo preparada.</p>
            <button
              onClick={onExit}
              className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </LessonLayout>
    );
  }


  return (
    <LessonLayout
      title={lesson.title}
      timeSpent={timeSpent}
      onExit={onExit}
      icon="💰"
    >
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {normalizedContent.scenario.title}
        </h2>
        <p className="text-gray-600 mb-4">
          {normalizedContent.scenario.description}
        </p>
      </div>

      {/* Barra de Pesquisa */}
      {currentStep === 'search' && (
        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🔍 Pesquisar Produtos</h3>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Digite o que você está procurando..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={!searchTerm.trim()}
              className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Pesquisar
            </button>
          </div>

          {/* Sugestões de pesquisa */}
          {normalizedContent.searchTerms.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Sugestões:</p>
              <div className="flex flex-wrap gap-2">
                {normalizedContent.searchTerms.map((term, index) => (
          <button
            key={index}
                    onClick={() => setSearchTerm(term)}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resultados da Pesquisa */}
      {currentStep === 'results' && (
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">
              📋 Resultados para "{searchTerm}" ({searchResults.length} produtos encontrados)
            </h3>
            <button
              onClick={() => setCurrentStep('search')}
              className="text-primary hover:text-primary-dark font-medium"
            >
              Nova Pesquisa
            </button>
          </div>

          {/* Mensagem para pesquisas não relacionadas a smartphones */}
          {searchResults.length === 0 && !isSmartphoneRelated(searchTerm) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">📱</div>
              <h4 className="text-lg font-bold text-yellow-800 mb-2">
                Produto não encontrado
              </h4>
              <p className="text-yellow-700 mb-4">
                Esta loja especializa-se em smartphones. Tente pesquisar por termos como:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {normalizedContent.searchTerms.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchTerm(term);
                      handleSearch();
                    }}
                    className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm hover:bg-yellow-200 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mensagem para pesquisas relacionadas a smartphones mas sem resultados */}
          {searchResults.length === 0 && isSmartphoneRelated(searchTerm) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h4 className="text-lg font-bold text-blue-800 mb-2">
                Nenhum produto encontrado
              </h4>
              <p className="text-blue-700 mb-4">
                Não encontramos produtos para "{searchTerm}". Tente termos mais específicos:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {normalizedContent.searchTerms.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchTerm(term);
                      handleSearch();
                    }}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lista de produtos encontrados */}
          {searchResults.map((product, index) => (
            <div key={product.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 mb-1">{product.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>🏪 {product.store}</span>
                    <span>⭐ {product.rating}/5</span>
                    <span>🛡️ {product.warranty}</span>
                    <span>🚚 {product.delivery}</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-bold text-lg text-green-600">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </div>
                  <button
                    onClick={() => handleAddToComparison(product)}
                    disabled={selectedProducts.length >= 3 || selectedProducts.find(p => p.id === product.id)}
                    className="mt-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {selectedProducts.find(p => p.id === product.id) ? 'Adicionado' : 'Comparar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Produtos Selecionados para Comparação */}
      {selectedProducts.length > 0 && currentStep !== 'final' && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
          <h3 className="text-lg font-bold text-blue-800 mb-3">
            📊 Produtos Selecionados para Comparação ({selectedProducts.length}/3)
          </h3>
          <div className="space-y-2">
            {selectedProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <span className="font-medium">{product.name} - R$ {product.price.toFixed(2).replace('.', ',')} - {product.store}</span>
                <button
                  onClick={() => handleRemoveFromComparison(product.id)}
                  className="text-red-500 hover:text-red-700 font-medium"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
          {selectedProducts.length >= 2 && (
            <button
              onClick={handleFinalizeComparison}
              className="mt-4 w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors"
            >
              Finalizar Comparação
            </button>
          )}
        </div>
      )}

      {/* Tabela Comparativa de Diferenciais */}
      {currentStep === 'final' && lesson.content?.comparisonTable && selectedProducts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📊 {lesson.content.comparisonTable.title}</h3>
          <p className="text-gray-600 mb-6">{lesson.content.comparisonTable.description}</p>
          
          <div className="overflow-x-auto max-w-full">
            <table className="w-full border-collapse bg-gray-100 min-w-max">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-3 text-left font-semibold text-gray-800 min-w-[150px]">Diferenciais</th>
                  {selectedProducts.map((product) => {
                    // Encontrar o produto com melhor custo-benefício
                    const bestValueProduct = selectedProducts.find(p => p.isBestValue);
                    const isBestValue = bestValueProduct && product.id === bestValueProduct.id;
                    
                    return (
                      <th 
                        key={product.id} 
                        className={`border border-gray-300 p-3 text-center font-semibold min-w-[120px] ${
                          isBestValue 
                            ? 'bg-green-100 text-green-800 border-green-300' 
                            : 'text-gray-800'
                        }`}
                      >
                        {product.store}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {lesson.content.comparisonTable.differentials.map((differential, diffIndex) => (
                  <tr key={differential.id} className="bg-white">
                    <td className="border border-gray-300 p-3 font-medium text-gray-800">
                      {differential.name}
                    </td>
                    {selectedProducts.map((product) => {
                      // Verificar se é a loja com melhor custo-benefício
                      const bestValueProduct = selectedProducts.find(p => p.isBestValue);
                      const isBestValue = bestValueProduct && product.id === bestValueProduct.id;
                      
                      // Determinar disponibilidade baseada nos dados reais do produto
                      let isAvailable = false;
                      
                      if (differential.id === "frete-gratis") {
                        isAvailable = product.delivery.toLowerCase().includes("grátis") || 
                                     product.delivery.toLowerCase().includes("gratis");
                      } else if (differential.id === "garantia-estendida") {
                        isAvailable = product.warranty.includes("18") || 
                                     product.warranty.includes("24") || 
                                     product.warranty.includes("36");
                      } else if (differential.id === "avaliacao-alta") {
                        isAvailable = product.rating >= 4.5;
                      } else if (differential.id === "preco-competitivo") {
                        // Encontrar o produto mais barato entre os selecionados
                        const cheapestProduct = selectedProducts.reduce((min, p) => 
                          p.price < min.price ? p : min
                        );
                        isAvailable = product.id === cheapestProduct.id;
                      }
                      
                      return (
                        <td 
                          key={product.id} 
                          className={`border border-gray-300 p-3 text-center ${
                            isBestValue ? 'bg-green-50 border-green-200' : ''
                          }`}
                        >
                          {isAvailable ? (
                            <span className="text-green-600 text-2xl">✓</span>
                          ) : (
                            <span className="text-red-500 text-2xl">✗</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feedback Final */}
      {showFeedback && (
        <div className={`p-6 rounded-lg mb-6 text-center shadow-lg border-2 ${
          isCorrect ? 'bg-green-50 text-green-800 border-green-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'
        }`}>
          <div className="text-4xl mb-3">{isCorrect ? '🎉' : '💡'}</div>
          <h3 className="text-xl font-bold mb-2">
            {isCorrect ? 'Excelente Pesquisa!' : 'Boa Pesquisa!'}
          </h3>
          <p className="mb-4">
            {isCorrect 
              ? 'Você encontrou o melhor custo-benefício! Parabéns pela pesquisa detalhada!'
              : 'Você fez uma boa pesquisa! Continue praticando para encontrar sempre as melhores ofertas!'
            }
          </p>
        </div>
      )}

      {/* Botão Finalizar Lição */}
      {showFeedback && (
        <div className="text-center mb-6">
          <button
            onClick={() => {
              const score = isCorrect ? 100 : 75;
              onComplete({
                score,
                timeSpent,
                isPerfect: isCorrect,
                selectedProducts: selectedProducts.map(p => p.name),
                totalProducts: selectedProducts.length
              });
            }}
            className="bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors"
          >
            Finalizar Lição
          </button>
        </div>
      )}
    </LessonLayout>
  );
};

export default PriceComparisonLesson;



