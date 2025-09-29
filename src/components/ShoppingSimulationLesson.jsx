import React, { useState, useEffect } from 'react';
import LessonLayout from './LessonLayout';

const ShoppingSimulationLesson = ({ lesson, onComplete, onExit }) => {
  // Debug logs
  console.log('🔍 ShoppingSimulationLesson - lesson title:', lesson?.title);
  console.log('🔍 ShoppingSimulationLesson - products count:', lesson?.content?.products?.length || 0);
  console.log('🔍 ShoppingSimulationLesson - budget:', lesson?.content?.budget);
  
  // Proteção contra lesson undefined
  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro ao carregar lição</h2>
          <p className="text-gray-600 mb-4">A lição não foi encontrada ou está corrompida.</p>
          <button
            onClick={onExit}
            className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Proteção contra content undefined
  if (!lesson.content) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Conteúdo não encontrado</h2>
          <p className="text-gray-600 mb-4">Esta lição não possui conteúdo válido.</p>
          <button
            onClick={onExit}
            className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }
  const [selectedItems, setSelectedItems] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());
  const [showResults, setShowResults] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const handleItemToggle = (item) => {
    if (selectedItems.find(selected => selected.name === item.name)) {
      // Remove item
      setSelectedItems(prev => prev.filter(selected => selected.name !== item.name));
      setTotalSpent(prev => prev - item.price);
    } else {
      // Add item
      const budget = lesson.content.scenario?.budget || lesson.content.budget || 0;
      if (totalSpent + item.price <= budget) {
        setSelectedItems(prev => [...prev, item]);
        setTotalSpent(prev => prev + item.price);
      }
    }
  };

  const handleFinish = () => {
    const budget = lesson.content.scenario?.budget || lesson.content.budget || 0;
    const needsCount = selectedItems.filter(item => item.type === 'necessidade').length;
    const wantsCount = selectedItems.filter(item => item.type === 'desejo').length;
    const savingsCount = selectedItems.filter(item => item.type === 'investimento').length;

    let score = 0;
    let feedbackMessage = '';

    // Score based on choices - Lógica otimizada para as opções corretas
    if (totalSpent <= budget) {
      score += 30; // Within budget
    } else {
      score -= 20; // Over budget
    }

    if (needsCount >= 1) {
      score += 25; // At least one necessity (Comprar usado à vista)
    }

    if (savingsCount >= 1) {
      score += 25; // At least one investment (Guardar dinheiro por 3 meses)
    }

    if (wantsCount === 0) {
      score += 20; // No wants selected (ideal)
    }

    // Determine feedback with fallbacks
    if (score >= 80) {
      feedbackMessage = lesson.content.feedback?.success || 'Excelente! Você fez escolhas muito inteligentes!';
    } else if (score >= 50) {
      feedbackMessage = lesson.content.feedback?.warning || 'Bom trabalho! Você pode melhorar ainda mais!';
    } else {
      feedbackMessage = lesson.content.feedback?.failure || 'Continue praticando! Você vai melhorar!';
    }

    setFeedback(feedbackMessage);
    setShowResults(true);
  };

  const getItemClass = (item) => {
    const isSelected = selectedItems.find(selected => selected.name === item.name);
    const budget = lesson.content.scenario?.budget || lesson.content.budget || 0;
    const canAfford = totalSpent + item.price <= budget;
    
    if (isSelected) {
      return "bg-green-100 border-green-500 text-green-800";
    }
    
    if (!canAfford) {
      return "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed";
    }
    
    return "bg-white border-gray-300 hover:border-primary hover:bg-blue-50 cursor-pointer";
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'necessidade': return 'text-blue-600';
      case 'desejo': return 'text-purple-600';
      case 'investimento': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'necessidade': return '🔵';
      case 'desejo': return '🟣';
      case 'investimento': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <LessonLayout
      title={lesson.title}
      timeSpent={timeSpent}
      onExit={onExit}
      icon="🛒"
    >
      <div className="text-center mb-6 font-sans">
        {lesson.content.scenario && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="font-bold text-blue-800 mb-2">{lesson.content.scenario.title || 'Cenário'}</h3>
            <p className="text-blue-700 text-sm">{lesson.content.scenario.description || 'Escolha os itens corretos'}</p>
          </div>
        )}
      </div>

      {/* Budget Display */}
      <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-center">
        <p className="text-lg font-bold text-yellow-800">
          Orçamento: R$ {lesson.content.scenario?.budget || lesson.content.budget || 0}
        </p>
        <p className="text-sm text-yellow-700">
          Gasto: R$ {totalSpent} | Restante: R$ {(lesson.content.scenario?.budget || lesson.content.budget || 0) - totalSpent}
        </p>
      </div>

      {/* Objectives */}
      {lesson.content.objectives && lesson.content.objectives.length > 0 && (
        <div className="mb-6">
          <h4 className="font-bold text-gray-800 mb-2">Objetivos:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {lesson.content.objectives.map((objective, index) => (
              <li key={index} className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                {objective}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {(lesson.content.scenario?.items || lesson.content.products || lesson.content.items || []).map((item, index) => {
          // Mapear category para type se necessário
          const mappedItem = {
            ...item,
            type: item.type || (item.category === 'Essencial' ? 'necessidade' : 
                               item.category === 'Desejo' ? 'desejo' : 
                               item.category === 'Investimento' ? 'investimento' : 'necessidade')
          };
          return (
          <div
            key={index}
            onClick={() => handleItemToggle(mappedItem)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${getItemClass(mappedItem)}`}
          >
            <div className="flex flex-col h-full">
              {/* Header com título e preço */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg text-gray-800 leading-tight flex-1 mr-3">{mappedItem.name}</h3>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">R$ {mappedItem.price}</div>
                </div>
              </div>
              
              {/* Descrição */}
              {mappedItem.description && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 leading-relaxed">{mappedItem.description}</p>
                </div>
              )}
              
              {/* Persuasão (se disponível) */}
              {mappedItem.persuasion && (
                <div className="mb-3">
                  <p className="text-sm text-orange-600 leading-relaxed font-medium">{mappedItem.persuasion}</p>
                </div>
              )}
              
              {/* Espaçador flexível para empurrar categoria para baixo */}
              <div className="flex-1"></div>
              
              {/* Categoria no rodapé */}
              <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                <span className="mr-1">{getTypeIcon(mappedItem.type)}</span>
                <span className={`text-xs font-medium capitalize ${getTypeColor(mappedItem.type)}`}>
                  {mappedItem.type}
                </span>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-bold text-gray-800 mb-2">Itens Selecionados:</h4>
          <div className="space-y-2">
            {selectedItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="font-medium">{item.name}</span>
                <span className="text-green-600 font-bold">R$ {item.price}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center font-bold">
              <span>Total:</span>
              <span className="text-green-600">R$ {totalSpent}</span>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {showResults && (
        <div className="bg-blue-50 p-6 rounded-lg mb-6 text-center">
          <h3 className="text-xl font-bold text-blue-800 mb-4">Resultado da Simulação</h3>
          <p className="text-blue-700 mb-4">{feedback}</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded">
              <p className="font-bold text-blue-600">Necessidades</p>
              <p className="text-2xl font-bold">{selectedItems.filter(item => item.type === 'necessidade').length}</p>
            </div>
            <div className="bg-white p-3 rounded">
              <p className="font-bold text-purple-600">Desejos</p>
              <p className="text-2xl font-bold">{selectedItems.filter(item => item.type === 'desejo').length}</p>
            </div>
            <div className="bg-white p-3 rounded">
              <p className="font-bold text-green-600">Poupança</p>
              <p className="text-2xl font-bold">{selectedItems.filter(item => item.type === 'investimento').length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {!showResults ? (
          <button
            onClick={handleFinish}
            disabled={selectedItems.length === 0}
            className="flex-1 bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Finalizar Compra
          </button>
                 ) : (
                       <button
              onClick={() => {
                const budget = lesson.content.scenario?.budget || lesson.content.budget || 0;
                const needsCount = selectedItems.filter(item => item.type === 'necessidade').length;
                const wantsCount = selectedItems.filter(item => item.type === 'desejo').length;
                const savingsCount = selectedItems.filter(item => item.type === 'investimento').length;
                
                let score = 0;
                
                // Score based on choices - Lógica otimizada para as opções corretas
                if (totalSpent <= budget) {
                  score += 30; // Within budget
                }
                
                if (needsCount >= 1) {
                  score += 25; // At least one necessity (Comprar usado à vista)
                }
                
                if (savingsCount >= 1) {
                  score += 25; // At least one investment (Guardar dinheiro por 3 meses)
                }
                
                if (wantsCount === 0) {
                  score += 20; // No wants selected (ideal)
                }
                
                onComplete({
                  score: Math.max(0, Math.min(100, score)),
                  timeSpent,
                  isPerfect: needsCount >= 1 && savingsCount >= 1 && totalSpent <= budget,
                  correctAnswers: needsCount + savingsCount,
                  totalQuestions: selectedItems.length,
                  feedback: feedback
                });
              }}
              className="flex-1 bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors"
            >
              Continuar
            </button>
         )}
      </div>
    </LessonLayout>
  );
};

export default ShoppingSimulationLesson;
