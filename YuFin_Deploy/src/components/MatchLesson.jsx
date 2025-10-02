import React, { useState, useEffect } from 'react';
import LessonLayout from './LessonLayout';

const MatchLesson = ({ lesson, onComplete, onExit }) => {
  const [leftItems, setLeftItems] = useState([]);
  const [rightItems, setRightItems] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matches, setMatches] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Estados específicos para o jogo da memória
  const [memoryCards, setMemoryCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [isFlipping, setIsFlipping] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Carregar preferência do modo escuro
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);

    // Listener para mudanças no modo escuro
    const handleDarkModeChange = () => {
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      setDarkMode(savedDarkMode);
    };

    window.addEventListener('darkModeChanged', handleDarkModeChange);
    
    return () => {
      window.removeEventListener('darkModeChanged', handleDarkModeChange);
    };
  }, []);




  // Normalizar o conteúdo para suportar diferentes formatos
  const normalizedContent = React.useMemo(() => {
    if (!lesson.content) return { pairs: [], gameFormat: 'association' };
    
    // Formato novo otimizado (template 2.0): com gameConfig
    if (lesson.content.gameConfig) {
      return {
        pairs: lesson.content.pairs?.map(pair => ({
          left: pair.left || 'Item esquerdo',
          right: pair.right || 'Item direito',
          text: `${pair.left || ''} - ${pair.right || ''}`,
          explanation: pair.explanation || '',
          educationalTip: pair.educationalTip || '',
          category: pair.category || '',
          difficulty: pair.difficulty || 'médio'
        })) || [],
        gameFormat: lesson.content.gameConfig.format || 'association',
        gameConfig: lesson.content.gameConfig,
        instructions: lesson.content.instructions,
        visual: lesson.content.visual,
        feedback: lesson.content.feedback
      };
    }
    
    // Formato novo (backend): pairs com card1/card2
    if (lesson.content.pairs && lesson.content.pairs.length > 0) {
      return {
        pairs: lesson.content.pairs.map(pair => ({
          left: pair.card1?.text || pair.left || 'Item esquerdo',
          right: pair.card2?.text || pair.right || 'Item direito',
          text: `${pair.card1?.text || pair.left || ''} - ${pair.card2?.text || pair.right || ''}`,
          explanation: pair.explanation || '',
          educationalTip: pair.educationalTip || ''
        })),
        gameFormat: lesson.content.gameFormat || 'association',
        gameSettings: lesson.content.gameSettings || {}
      };
    }
    
    // Formato antigo: pairs com left/right
    if (lesson.content.pairs && lesson.content.pairs.length > 0) {
      return {
        pairs: lesson.content.pairs.map(pair => ({
          left: pair.left || pair.text?.split(' - ')[0] || 'Item esquerdo',
          right: pair.right || pair.text?.split(' - ')[1] || 'Item direito',
          text: `${pair.left || ''} - ${pair.right || ''}`,
          explanation: pair.explanation || '',
          educationalTip: pair.educationalTip || ''
        })),
        gameFormat: 'association',
        gameSettings: {}
      };
    }
    
    // Formato antigo: items com text
    if (lesson.content.items && lesson.content.items.length > 0) {
      return {
        pairs: lesson.content.items.map(item => ({
          left: item.text?.split(' - ')[0] || 'Item esquerdo',
          right: item.text?.split(' - ')[1] || 'Item direito',
          text: item.text || 'Item',
          explanation: item.explanation || '',
          educationalTip: item.educationalTip || ''
        })),
        gameFormat: 'association',
        gameSettings: {}
      };
    }
    
    // Fallback
    return {
      pairs: [],
      gameFormat: 'association',
      gameSettings: {}
    };
  }, [lesson.content]);

  useEffect(() => {
    const gameFormat = normalizedContent.gameFormat || lesson.content?.gameFormat || 'association';
    
    if (gameFormat === 'memory') {
      // Inicializar cards para o jogo da memória
      const cards = [];
      normalizedContent.pairs.forEach((pair, index) => {
        // Criar dois cards para cada par (um com o texto da esquerda, outro com o da direita)
        cards.push({
          id: `card-${index}-left`,
          text: pair.left,
          pairId: index,
          type: 'left',
          isFlipped: false,
          isMatched: false
        });
        cards.push({
          id: `card-${index}-right`,
          text: pair.right,
          pairId: index,
          type: 'right',
          isFlipped: false,
          isMatched: false
        });
      });
      
      // Embaralhar os cards
      setMemoryCards(cards.sort(() => Math.random() - 0.5));
      console.log('🎮 Memory cards initialized:', cards.length);
    } else {
      // Separar itens em duas colunas para associação
      const left = normalizedContent.pairs.map(pair => ({ ...pair, left: pair.left }));
      const right = normalizedContent.pairs.map(pair => ({ ...pair, right: pair.right }));
      
      // Embaralhar
      setLeftItems(left.sort(() => Math.random() - 0.5));
      setRightItems(right.sort(() => Math.random() - 0.5));
      console.log('🔗 Association items initialized');
    }
    
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [normalizedContent.pairs, normalizedContent.gameFormat, lesson.content?.gameFormat]);

  const handleItemClick = (item, side) => {
    if (side === 'left') {
      if (selectedLeft === item) {
        setSelectedLeft(null);
      } else {
        setSelectedLeft(item);
        setSelectedRight(null);
      }
    } else {
      if (selectedRight === item) {
        setSelectedRight(null);
      } else {
        setSelectedRight(item);
      }
    }
  };

  const handleMatch = () => {
    if (selectedLeft && selectedRight) {
      // Verificar se é uma combinação correta
      const leftText = selectedLeft.left;
      const rightText = selectedRight.right;
      const isCorrect = normalizedContent.pairs.find(pair => 
        pair.left === leftText && pair.right === rightText
      );
      
      if (isCorrect) {
        setMatches(prev => [...prev, { left: selectedLeft, right: selectedRight }]);
        // Remover itens das listas
        setLeftItems(prev => prev.filter(item => item !== selectedLeft));
        setRightItems(prev => prev.filter(item => item !== selectedRight));
        // Verificar se completou
        if (matches.length + 1 === normalizedContent.pairs.length) {
          checkCompletion();
        }
      }
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  const checkCompletion = () => {
    const score = 100; // Se chegou até aqui, completou corretamente
    setIsCompleted(true);
    
    setTimeout(() => {
      onComplete({
        score,
        timeSpent,
        isPerfect: true,
        totalMatches: matches.length + 1
      });
    }, 2000);
  };

  // Função específica para o jogo da memória

  const handleMemoryCardClick = (card) => {
    if (isFlipping || card.isFlipped || card.isMatched) return;
    
    const newFlippedCards = [...flippedCards, card];
    setFlippedCards(newFlippedCards);
    
    // Atualizar o estado do card para mostrar a animação de flip
    setMemoryCards(prev => prev.map(c => 
      c.id === card.id ? { ...c, isFlipped: true } : c
    ));
    
    // Se dois cards estão virados, verificar se formam um par
    if (newFlippedCards.length === 2) {
      setIsFlipping(true);
      
      const [card1, card2] = newFlippedCards;
      const isMatch = card1.pairId === card2.pairId;
      
      if (isMatch) {
        // Par correto - manter virados e marcar como matched
        setMatchedCards(prev => [...prev, card1, card2]);
        setMemoryCards(prev => prev.map(c => 
          c.id === card1.id || c.id === card2.id ? { ...c, isMatched: true, isFlipped: true } : c
        ));
        
        // Verificar se todos os pares foram encontrados
        if (matchedCards.length + 2 === memoryCards.length) {
          setTimeout(() => {
            const score = 100;
            setIsCompleted(true);
            onComplete({
              score,
              timeSpent,
              isPerfect: true,
              totalMatches: normalizedContent.pairs.length
            });
          }, 1000);
        }
        
        // Limpar cards virados e permitir nova tentativa
        setTimeout(() => {
          setFlippedCards([]);
          setIsFlipping(false);
        }, 500);
      } else {
        // Par incorreto - virar de volta após um delay para mostrar o conteúdo
        setTimeout(() => {
          setMemoryCards(prev => prev.map(c => 
            c.id === card1.id || c.id === card2.id ? { ...c, isFlipped: false } : c
          ));
          
          // Limpar cards virados e permitir nova tentativa
          setTimeout(() => {
            setFlippedCards([]);
            setIsFlipping(false);
          }, 500);
        }, 1500); // Delay maior para permitir que o usuário veja o conteúdo
      }
    }
  };

  const getItemClass = (item, side) => {
    const isSelected = side === 'left' ? selectedLeft === item : selectedRight === item;
    const isMatched = matches.some(match => 
      side === 'left' ? match.left === item : match.right === item
    );
    
    if (isMatched) {
      return "bg-green-100 border-green-500 text-green-800";
    }
    
    if (isSelected) {
      return "bg-primary text-white";
    }
    
    return "bg-white border-gray-300 hover:border-primary";
  };

  const getItemStyle = (item, side) => {
    const isSelected = side === 'left' ? selectedLeft === item : selectedRight === item;
    const isMatched = matches.some(match => 
      side === 'left' ? match.left === item : match.right === item
    );
    
    if (isMatched) {
      return {};
    }
    
    if (isSelected) {
      return {};
    }
    
    return {
      backgroundColor: darkMode ? '#374151' : '#ffffff',
      color: darkMode ? '#ffffff' : '#1f2937',
      borderColor: darkMode ? '#6b7280' : '#d1d5db'
    };
  };


  return (
    <LessonLayout
      title={lesson.title}
      timeSpent={timeSpent}
      onExit={onExit}
      icon="🔗"
    >
      {/* Estilos CSS para animação de flip */}
      <style>{`
        .backface-hidden {
          backface-visibility: hidden;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        [transform-style:preserve-3d] {
          transform-style: preserve-3d;
        }
        [perspective:1000px] {
          perspective: 1000px;
        }
        .card-120x80 {
          width: 120px;
          height: 80px;
        }
      `}</style>
      <div className="text-center mb-8 font-sans">
        {lesson.content?.scenario?.description && (
          <p 
            className="mb-4 font-sans"
            style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
          >
            {lesson.content.scenario.description}
          </p>
        )}
        
        {lesson.content?.scenario && typeof lesson.content.scenario === 'string' && (
          <p 
            className="mb-4 font-sans"
            style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
          >
            {lesson.content.scenario}
          </p>
        )}
        
        {/* Mostrar instruções específicas do formato */}
        {normalizedContent.instructions && normalizedContent.instructions[normalizedContent.gameFormat] && (
          <div 
            className="p-4 rounded-lg mb-4"
            style={{
              backgroundColor: darkMode ? '#1e3a8a' : '#dbeafe'
            }}
          >
            <h3 
              className="font-bold mb-2"
              style={{ color: darkMode ? '#93c5fd' : '#1e40af' }}
            >
              {normalizedContent.instructions[normalizedContent.gameFormat].title}
            </h3>
            <p 
              className="text-sm"
              style={{ color: darkMode ? '#bfdbfe' : '#1d4ed8' }}
            >
              {normalizedContent.instructions[normalizedContent.gameFormat].description}
            </p>
          </div>
        )}
        
        {/* Mostrar instruções simples (array) */}
        {lesson.content?.instructions && Array.isArray(lesson.content.instructions) && (
          <div 
            className="p-4 rounded-lg mb-4"
            style={{
              backgroundColor: darkMode ? '#1e3a8a' : '#dbeafe'
            }}
          >
            <h3 
              className="font-bold mb-2"
              style={{ color: darkMode ? '#93c5fd' : '#1e40af' }}
            >
              Instruções:
            </h3>
            <ul 
              className="text-sm space-y-1"
              style={{ color: darkMode ? '#bfdbfe' : '#1d4ed8' }}
            >
              {lesson.content.instructions.map((instruction, index) => (
                <li key={index}>• {instruction}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Fallback para formato antigo */}
        {normalizedContent.gameSettings && normalizedContent.gameSettings[normalizedContent.gameFormat] && (
          <div 
            className="p-4 rounded-lg mb-4"
            style={{
              backgroundColor: darkMode ? '#1e3a8a' : '#dbeafe'
            }}
          >
            <h3 
              className="font-bold mb-2"
              style={{ color: darkMode ? '#93c5fd' : '#1e40af' }}
            >
              {normalizedContent.gameSettings[normalizedContent.gameFormat].title}
            </h3>
            <p 
              className="text-sm"
              style={{ color: darkMode ? '#bfdbfe' : '#1d4ed8' }}
            >
              {normalizedContent.gameSettings[normalizedContent.gameFormat].instructions}
            </p>
          </div>
        )}
      </div>
      
      {normalizedContent.pairs && normalizedContent.pairs.length > 0 ? (
        (normalizedContent.gameFormat === 'memory' || lesson.content?.gameFormat === 'memory') ? (
          // Renderização do Jogo da Memória - 4 colunas x 3 linhas
          <div className="mb-8 font-sans">
            <div className="flex justify-center">
              <div 
                className="grid gap-8 max-w-5xl"
                style={{ 
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  display: 'grid'
                }}
              >
                {memoryCards.length > 0 ? memoryCards.map((card) => (
                  <div
                    key={card.id}
                    className="relative cursor-pointer mx-auto"
                    style={{ width: '120px', height: '80px' }}
                    onClick={() => handleMemoryCardClick(card)}
                  >
                    <div 
                      className={`w-full h-full rounded-lg shadow-lg flex items-center justify-center text-center text-sm font-medium transition-all duration-300 ${
                        card.isFlipped || card.isMatched
                          ? 'border-2 border-green-500' 
                          : 'border-2 border-orange-600 text-white'
                      }`}
                      style={{
                        background: card.isFlipped || card.isMatched
                          ? (darkMode ? '#374151' : 'white')
                          : 'linear-gradient(135deg, #f97316 0%, #eab308 100%)',
                        color: card.isFlipped || card.isMatched
                          ? (darkMode ? '#ffffff' : '#1f2937')
                          : 'white'
                      }}
                    >
                      {card.isFlipped || card.isMatched ? (
                        <span className="p-2 leading-tight">{card.text}</span>
                      ) : (
                        <span className="text-2xl font-bold">?</span>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="col-span-4 text-center p-8">
                    <div className="text-6xl mb-4">🎴</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Carregando cards...</h3>
                    <p className="text-gray-600">Preparando o jogo da memória</p>
                    <p className="text-sm text-gray-500 mt-2">Cards: {memoryCards.length}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Renderização da Associação (formato original)
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 font-sans">
            {/* Coluna da esquerda */}
            <div>
              <h3 
                className="text-lg font-semibold mb-4 text-center font-sans"
                style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
              >
                Coluna A
              </h3>
              <div className="space-y-4 font-sans">
                {leftItems.concat(matches?.map(m => m.left) || []).map((item, idx) => {
                  const isMatched = matches.some(match => match.left === item);
                  return (
                    <div
                      key={idx}
                      onClick={() => !isMatched && handleItemClick(item, 'left')}
                      className={`p-4 border-2 rounded-2xl text-center font-medium shadow-md cursor-pointer transition-all duration-200 font-sans h-20 flex items-center justify-center ${getItemClass(item, 'left')} ${selectedLeft === item ? 'ring-2 ring-primary' : ''} ${isMatched ? 'opacity-60 cursor-not-allowed bg-green-50 border-green-200 text-green-800' : ''}`}
                      style={getItemStyle(item, 'left')}
                    >
                      <span className="leading-tight">{item.left}</span>
                      {isMatched && <span className="ml-2 text-green-600 font-bold font-sans">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Coluna da direita */}
            <div>
              <h3 
                className="text-lg font-semibold mb-4 text-center font-sans"
                style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
              >
                Coluna B
              </h3>
              <div className="space-y-4 font-sans">
                {rightItems.concat(matches?.map(m => m.right) || []).map((item, idx) => {
                  const isMatched = matches.some(match => match.right === item);
                  return (
                    <div
                      key={idx}
                      onClick={() => !isMatched && handleItemClick(item, 'right')}
                      className={`p-4 border-2 rounded-2xl text-center font-medium shadow-md cursor-pointer transition-all duration-200 font-sans h-20 flex items-center justify-center ${getItemClass(item, 'right')} ${selectedRight === item ? 'ring-2 ring-primary' : ''} ${isMatched ? 'opacity-60 cursor-not-allowed bg-green-50 border-green-200 text-green-800' : ''}`}
                      style={getItemStyle(item, 'right')}
                    >
                      <span className="leading-tight">{item.right}</span>
                      {isMatched && <span className="ml-2 text-green-600 font-bold font-sans">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Conteúdo não disponível</h3>
          <p className="text-gray-600">Esta lição está sendo preparada.</p>
        </div>
      )}

      {/* Botão de Associação - apenas para formato de associação */}
      {normalizedContent.gameFormat === 'association' && selectedLeft && selectedRight && (
        <div className="flex justify-center mb-8 font-sans">
          <button
            onClick={handleMatch}
            className="bg-teal text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-teal-dark transition-colors focus:outline-none focus:ring-2 focus:ring-teal font-sans"
          >
            Fazer Associação
          </button>
        </div>
      )}
      
      {/* Feedback Visual */}
      {isCompleted && (
        <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-xl text-center shadow-lg border-2 border-green-400">
          <div className="text-2xl mb-2">🎉</div>
          <h3 className="font-bold text-lg mb-2">
            {normalizedContent.feedback?.success?.title || 'Parabéns! Jogo Concluído!'}
          </h3>
          <p className="font-semibold mb-3">
            {normalizedContent.feedback?.success?.message || 'Você completou a lição com sucesso!'}
          </p>
          {normalizedContent.feedback?.success?.tips && (
            <div className="text-left bg-green-50 p-3 rounded-lg">
              <h4 className="font-semibold mb-2">💡 Dicas importantes:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {normalizedContent.feedback.success.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </LessonLayout>
  );
};

export default MatchLesson; 