import React, { useState, useEffect } from 'react';
import LessonLayout from './LessonLayout';

const ClassifyLesson = ({ lesson, onComplete, onExit }) => {
  const [items, setItems] = useState([]);
  const [classifications, setClassifications] = useState({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Normalizar o conteúdo para suportar diferentes formatos
  const normalizedContent = React.useMemo(() => {
    if (!lesson.content) return { categories: [], items: [] };
    
    // Formato novo (backend): categories e items separados
    if (lesson.content.categories && lesson.content.categories.length > 0 && lesson.content.items && lesson.content.items.length > 0) {
      return {
        categories: lesson.content.categories.map(cat => cat.name),
        items: lesson.content.items.map(item => ({
          text: item.text || item,
          category: item.correctCategory || item.category,
          correctCategory: item.correctCategory || item.category
        }))
      };
    }
    
    // Formato antigo: categories com items dentro
    if (lesson.content.categories && lesson.content.categories.length > 0) {
      const allItems = [];
      lesson.content.categories.forEach(category => {
        if (category.items && Array.isArray(category.items)) {
          category.items.forEach(item => {
            allItems.push({
              text: item,
              category: category.name,
              correctCategory: category.name
            });
          });
        }
      });
      
      return {
        categories: lesson.content.categories.map(cat => cat.name),
        items: allItems
      };
    }
    
    // Formato antigo: items com category
    if (lesson.content.items && lesson.content.items.length > 0) {
      const categories = [...new Set(lesson.content.items.map(item => item.category))];
      return {
        categories,
        items: lesson.content.items
      };
    }
    
    // Fallback
    return {
      categories: [],
      items: []
    };
  }, [lesson.content]);

  useEffect(() => {
    // Embaralhar itens
    const shuffledItems = [...normalizedContent.items].sort(() => Math.random() - 0.5);
    setItems(shuffledItems);
    
    // Debug: verificar dados da lição
    console.log('🔍 Dados da lição recebidos:', {
      title: lesson.title,
      type: lesson.type,
      text: lesson.content.text,
      categories: normalizedContent.categories,
      items: normalizedContent.items
    });
    
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [normalizedContent.items, lesson.title, lesson.type, lesson.content.text]);

  const handleItemDrop = (item, category) => {
    setClassifications(prev => ({
      ...prev,
      [item.text]: category
    }));
    
    // Remover item da lista
    setItems(prev => prev.filter(i => i.text !== item.text));
    
    // Verificar se completou
    const newClassifications = { ...classifications, [item.text]: category };
    if (Object.keys(newClassifications).length === normalizedContent.items.length) {
      checkCompletion(newClassifications);
    }
  };

  const checkCompletion = (finalClassifications) => {
    const correct = normalizedContent.items.filter(item => 
      finalClassifications[item.text] === item.correctCategory || 
      finalClassifications[item.text] === item.category
    ).length;
    
    const score = Math.round((correct / normalizedContent.items.length) * 100);
    const isPerfect = correct === normalizedContent.items.length;
    
    setIsCompleted(true);
    
    setTimeout(() => {
      onComplete({
        score,
        timeSpent,
        isPerfect,
        correctAnswers: correct,
        totalItems: normalizedContent.items.length
      });
    }, 2000);
  };

  const getCategories = () => {
    return normalizedContent.categories;
  };

  const getItemsInCategory = (category) => {
    return Object.entries(classifications)
      .filter(([_, cat]) => cat === category)
      .map(([item]) => item);
  };

  // Função para remover um item de uma categoria
  const handleRemoveFromCategory = (itemText) => {
    setClassifications(prev => {
      const newClassifications = { ...prev };
      delete newClassifications[itemText];
      return newClassifications;
    });
    setItems(prev => [...prev, normalizedContent.items.find(i => i.text === itemText)]);
  };

  // Debug log para verificar o conteúdo (SEM DADOS SENSÍVEIS)
  console.log('🔍 ClassifyLesson - lesson title:', lesson.title);
  console.log('🔍 ClassifyLesson - categories count:', normalizedContent.categories?.length || 0);
  console.log('🔍 ClassifyLesson - items count:', normalizedContent.items?.length || 0);

  return (
    <LessonLayout
      title={lesson.title}
      timeSpent={timeSpent}
      onExit={onExit}
      icon="📂"
    >
      <div className="text-center mb-8 font-sans">
        <h2 className="text-xl font-bold text-gray-800 mb-4 font-sans">
          {lesson.content.scenario ? lesson.content.scenario.split('.')[0] + '.' : (lesson.content.text || 'Classifique os itens nas categorias corretas')}
        </h2>
        <p className="text-gray-600 font-sans">
          {lesson.content.scenario ? lesson.content.scenario.split('.').slice(1).join('.').trim() : 'Classifique os itens nas categorias corretas'}
        </p>
      </div>
      
      {normalizedContent.items && normalizedContent.items.length > 0 && normalizedContent.categories && normalizedContent.categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 font-sans">
          {/* Itens para classificar */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-4 text-center font-sans">Itens:</h3>
            <div className="space-y-4 font-sans w-full max-w-md">
              {items && items.map((item, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={e => e.dataTransfer.setData('item', JSON.stringify(item))}
                  className="p-4 border-2 border-dashed rounded-2xl bg-white shadow-md cursor-move text-center font-medium hover:bg-interface hover:border-primary transition-all duration-200 font-sans"
                >
                  {item.text}
                </div>
              ))}
            </div>
          </div>
          
          {/* Categorias */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-4 text-center font-sans">Categorias:</h3>
            <div className="space-y-4 font-sans w-full max-w-md">
              {getCategories() && getCategories().map((category) => (
                <div
                  key={category}
                  onDrop={e => { e.preventDefault(); const item = JSON.parse(e.dataTransfer.getData('item')); handleItemDrop(item, category); }}
                  onDragOver={e => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-4 min-h-[100px] bg-gray-50 shadow-inner hover:border-primary transition-all duration-200 font-sans"
                >
                  <h4 className="font-semibold text-lg mb-2 text-center font-sans">{category}</h4>
                  <div className="space-y-1 font-sans">
                    {getItemsInCategory(category) && getItemsInCategory(category).map((item, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded p-2 text-sm shadow-sm font-sans flex items-center justify-between">
                        <span>{item}</span>
                        <button
                          onClick={() => handleRemoveFromCategory(item)}
                          className="ml-2 text-red-400 hover:text-red-600 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-red-300"
                          title="Remover da categoria"
                          aria-label="Remover da categoria"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Conteúdo não disponível</h3>
          <p className="text-gray-600">Esta lição está sendo preparada.</p>
        </div>
      )}
      
      {isCompleted && (
        <div className="mt-6 p-4 bg-green-50 text-green-800 rounded-2xl text-center shadow-lg border-2 border-green-200 font-sans transition-all duration-200">
          <div className="text-2xl mb-2">🎉</div>
          <p className="font-semibold font-sans">Classificação concluída!</p>
        </div>
      )}
    </LessonLayout>
  );
};

export default ClassifyLesson; 