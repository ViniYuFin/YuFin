import React, { useState, useEffect } from 'react';
import LessonLayout from './LessonLayout';

const DragAndDropLesson = ({ lesson, onComplete, onExit }) => {
  const [items, setItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [score, setScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    // Normalizar a estrutura da lição para diferentes formatos
    let lessonItems = [];
    let isZonesFormat = false;
    let isCategoriesFormat = false;
    
    if (lesson.content?.items && lesson.content?.zones) {
      // Formato zones: content.items com objetos {text, correctZone}
      lessonItems = lesson.content.items.map(item => item.text || item);
      isZonesFormat = true;
    } else if (lesson.content?.items && lesson.content?.dropZones) {
      // Formato dropZones: content.items com objetos {text, correctZone}
      lessonItems = lesson.content.items.map(item => item.text || item);
      isZonesFormat = true;
    } else if (lesson.content?.items && lesson.content?.categories) {
      // Formato categories: content.items com objetos {text, correctCategory}
      lessonItems = lesson.content.items.map(item => item.text || item);
      isCategoriesFormat = true;
    } else if (lesson.content?.items) {
      // Formato direto: content.items (strings simples)
      lessonItems = lesson.content.items;
    } else if (lesson.content?.zones) {
      // Formato zones: content.zones[].items
      lessonItems = lesson.content.zones.flatMap(zone => zone.items);
      isZonesFormat = true;
    } else if (lesson.content?.pairs) {
      // Formato pairs: content.pairs[].left ou content.pairs[].right
      lessonItems = lesson.content.pairs.flatMap(pair => [pair.left, pair.right]);
    }
    
    // Embaralhar os itens
    const shuffledItems = [...lessonItems].sort(() => Math.random() - 0.5);
    const normalizedItems = shuffledItems.map((item, index) => ({ 
      text: typeof item === 'string' ? item : (item.text || item.name || 'Item'),
      id: typeof item === 'object' && item.id ? item.id : index, 
      isPlaced: false,
      order: index + 1,
      isZonesFormat: isZonesFormat,
      isCategoriesFormat: isCategoriesFormat,
      originalItem: item // Manter referência ao item original
    }));
    
    
    setItems(normalizedItems);
  }, [lesson]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  // Detectar quando todos os itens estão colocados
  useEffect(() => {
    if (items.length > 0) {
      const allPlaced = items.every(item => item.isPlaced);
      if (allPlaced) {
        setTimeout(() => {
          handleFinish();
        }, 500);
      }
    }
  }, [items]);

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetZone) => {
    e.preventDefault();
    
    if (draggedItem) {
      // Verificar se o item pertence à zona correta
      let isCorrectZone = false;
      
      if (lesson.content.zones || lesson.content.dropZones) {
        // Formato zones ou dropZones
        const itemData = lesson.content.items.find(item => 
          (typeof item === 'object' ? item.text : item) === draggedItem.text
        );
        isCorrectZone = itemData && itemData.correctZone === targetZone;
      } else if (lesson.content.categories) {
        // Formato categories
        const itemData = lesson.content.items.find(item => 
          (typeof item === 'object' ? item.text : item) === draggedItem.text
        );
        isCorrectZone = itemData && itemData.correctCategory === targetZone;
      }
      
      if (isCorrectZone) {
        // Item correto
        setItems(prev => prev.map(item => 
          item.id === draggedItem.id ? { ...item, isPlaced: true, zone: targetZone } : item
        ));
        setScore(prev => prev + 25); // 25 pontos por item correto
      }
      
      setDraggedItem(null);
    }
  };

  const handleFinish = () => {
    // Aguardar um pouco para garantir que o estado foi atualizado
    setTimeout(() => {
      // Contar apenas itens que foram colocados corretamente
      let correctPlaced = 0;
      const totalItems = items.length;
      
      items.forEach(item => {
        if (item.isPlaced && item.zone) {
          // Verificar se o item foi colocado na zona correta
          const itemData = lesson.content.items.find(data => 
            (typeof data === 'object' ? data.text : data) === item.text
          );
          if (itemData) {
            const correctZone = (lesson.content.zones || lesson.content.dropZones) ? itemData.correctZone : itemData.correctCategory;
            if (item.zone === correctZone) {
              correctPlaced++;
            }
          }
        }
      });
      
      const isPerfect = correctPlaced === totalItems;
      const finalScore = isPerfect ? 100 : Math.round((correctPlaced / totalItems) * 100);
      
      onComplete({
        score: finalScore,
        timeSpent,
        isPerfect,
        correctAnswers: correctPlaced,
        totalQuestions: totalItems
      });
    }, 100);
  };


  return (
    <LessonLayout
      title={lesson.title}
      timeSpent={timeSpent}
      onExit={onExit}
      icon="🎯"
    >
      <div className="text-center mb-6 font-sans">
        {lesson.content?.scenario && typeof lesson.content.scenario === 'string' && (
          <p className="text-gray-600 mb-4 font-sans">
            {lesson.content.scenario}
          </p>
        )}
        
        {lesson.content?.scenario?.description && (
          <p className="text-gray-600 mb-4 font-sans">
            {lesson.content.scenario.description}
          </p>
        )}
        
        {lesson.content?.instructions && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="font-bold text-blue-800 mb-2">
              {lesson.content.instructions.title}
            </h3>
            <p className="text-blue-700 text-sm">
              {lesson.content.instructions.description}
            </p>
          </div>
        )}
      </div>

      {/* Layout Duolingo-style: Zonas no topo, Itens embaixo */}
      <div className="space-y-8">
        {/* ZONAS DE DESTINO (Cards no topo - horizontal) */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Categorias:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {(lesson.content?.zones || lesson.content?.dropZones) ? (
              // Formato zones ou dropZones (novo)
              (lesson.content.zones || lesson.content.dropZones).map((zone, zoneIndex) => (
                <div
                  key={zoneIndex}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, zone.id)}
                  className={`p-6 border-2 border-dashed rounded-2xl transition-all duration-200 text-center font-medium shadow-lg font-sans min-h-[120px] flex flex-col justify-center ${
                    items.find(item => item.isPlaced && item.zone === zone.id) 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-400'
                  }`}
                  style={{ borderColor: zone.color + '40' }}
                >
                  {(() => {
                    const placedItems = items.filter(item => item.isPlaced && item.zone === zone.id);
                    if (placedItems.length > 0) {
                      return (
                        <div className="space-y-2 font-sans">
                          <div className="flex items-center justify-center mb-2">
                            <span className="text-2xl mr-2">{zone.icon}</span>
                            <p className="text-gray-800 font-bold font-sans">{zone.name}</p>
                          </div>
                          {placedItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between bg-green-100 p-2 rounded-lg border border-green-300">
                              <p className="text-gray-800 font-medium font-sans text-sm">{item.text}</p>
                              <span className="text-green-600 text-lg font-sans">✓</span>
                            </div>
                          ))}
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-center font-sans">
                          <div className="flex items-center justify-center mb-2">
                            <span className="text-2xl mr-2">{zone.icon}</span>
                            <p className="text-gray-800 font-bold font-sans">{zone.name}</p>
                          </div>
                          <p className="text-gray-500 text-sm font-sans">Arraste um item aqui</p>
                        </div>
                      );
                    }
                  })()}
                </div>
              ))
            ) : lesson.content?.categories ? (
              // Formato categories (antigo)
              lesson.content.categories.map((category, categoryIndex) => (
                <div
                  key={categoryIndex}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, category.id)}
                  className={`p-6 border-2 border-dashed rounded-2xl transition-all duration-200 text-center font-medium shadow-lg font-sans min-h-[120px] flex flex-col justify-center ${
                    items.find(item => item.isPlaced && item.zone === category.id) 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-400'
                  }`}
                  style={{ borderColor: category.color + '40' }}
                >
                  {(() => {
                    const placedItems = items.filter(item => item.isPlaced && item.zone === category.id);
                    if (placedItems.length > 0) {
                      return (
                        <div className="space-y-2 font-sans">
                          <p className="text-gray-800 font-bold font-sans text-center mb-2">{category.name}</p>
                          {placedItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between bg-green-100 p-2 rounded-lg border border-green-300">
                              <p className="text-gray-800 font-medium font-sans text-sm">{item.text}</p>
                              <span className="text-green-600 text-lg font-sans">✓</span>
                            </div>
                          ))}
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-center font-sans">
                          <p className="text-gray-800 font-bold font-sans mb-2">{category.name}</p>
                          <p className="text-gray-500 text-sm font-sans">Arraste um item aqui</p>
                        </div>
                      );
                    }
                  })()}
                </div>
              ))
            ) : null}
          </div>
        </div>

        {/* ITENS ARRASTÁVEIS (Embaixo - em ordem aleatória) */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Itens:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-6xl mx-auto">
            {items.filter(item => !item.isPlaced).map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                className="p-4 bg-white border-2 border-gray-300 rounded-xl shadow-md cursor-move hover:shadow-lg hover:border-blue-400 transition-all duration-200 font-sans h-20 flex items-center justify-center"
              >
                <p className="text-gray-800 font-medium text-center font-sans text-sm leading-tight">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>


    </LessonLayout>
  );
};

export default DragAndDropLesson;