import React, { useState, useEffect } from 'react';
import LessonLayout from './LessonLayout';

const CategoriesSimulationLesson = ({ lesson, onComplete, onExit }) => {
  const [selectedCategories, setSelectedCategories] = useState({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
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

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCategoryChange = (categoryName, value) => {
    setSelectedCategories(prev => ({
      ...prev,
      [categoryName]: parseInt(value) || 0
    }));
  };

  const handleSubmit = () => {
    const totalAllocated = Object.values(selectedCategories).reduce((sum, value) => sum + value, 0);
    // Extrair orçamento do texto da lição
    const budgetMatch = lesson.content?.text?.match(/R\$ (\d+),00/);
    const budget = budgetMatch ? parseInt(budgetMatch[1]) : 150; // Padrão R$ 150,00
    
    const correct = totalAllocated === budget;
    const score = correct ? 100 : Math.max(0, 100 - Math.abs(totalAllocated - budget) * 2);
    
    setIsCompleted(true);
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      setFeedbackMessage("Parabéns! Você distribuiu sua mesada perfeitamente! Isso mostra que você sabe planejar seus gastos.");
    } else {
      setFeedbackMessage(`Você distribuiu R$ ${totalAllocated},00 de R$ ${budget},00. Tente novamente para distribuir exatamente R$ ${budget},00.`);
    }
  };

  const handleContinue = () => {
    const totalAllocated = Object.values(selectedCategories).reduce((sum, value) => sum + value, 0);
    const budgetMatch = lesson.content?.text?.match(/R\$ (\d+),00/);
    const budget = budgetMatch ? parseInt(budgetMatch[1]) : 150;
    const correct = totalAllocated === budget;
    
    onComplete({
      score: correct ? 100 : Math.max(0, 100 - Math.abs(totalAllocated - budget) * 2),
      timeSpent,
      isPerfect: correct,
      feedback: feedbackMessage
    });
  };

  const totalAllocated = Object.values(selectedCategories).reduce((sum, value) => sum + value, 0);
  const budgetMatch = lesson.content?.text?.match(/R\$ (\d+),00/);
  const budget = budgetMatch ? parseInt(budgetMatch[1]) : 150;
  const remaining = budget - totalAllocated;

  return (
    <LessonLayout
      title={lesson.title}
      timeSpent={timeSpent}
      onExit={onExit}
      icon="💰"
    >
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {lesson.content.text}
        </h2>
        <p className="text-gray-600 mb-6">
          Distribua seu orçamento entre as categorias abaixo:
        </p>
        
        {/* Orçamento Total */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="font-bold text-blue-800">Orçamento Total:</span>
            <span className="font-bold text-blue-800">R$ {budget},00</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-blue-600">Distribuído:</span>
            <span className={`font-bold ${totalAllocated > budget ? 'text-red-600' : 'text-green-600'}`}>
              R$ {totalAllocated},00
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-blue-600">Restante:</span>
            <span className={`font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              R$ {remaining},00
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {lesson.content?.categories && lesson.content.categories.length > 0 ? (
          lesson.content.categories.map((category, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <label className="font-bold text-gray-800">{category.name}</label>
              <span className="text-sm text-gray-600">Sugestão: R$ {category.budget},00</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">R$</span>
              <input
                type="number"
                min="0"
                max={budget}
                value={selectedCategories[category.name] || ''}
                onChange={(e) => handleCategoryChange(category.name, e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0"
              />
              <span className="text-gray-600">,00</span>
            </div>
          </div>
        ))
        ) : (
          <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
            <p className="text-yellow-800 text-center">
              ⚠️ Categorias não disponíveis. Esta lição está sendo preparada.
            </p>
          </div>
        )}
      </div>

      {!showFeedback ? (
        <div className="text-center">
          <button
            onClick={handleSubmit}
            className="px-8 py-3 rounded-lg font-bold text-white bg-primary hover:bg-primary-dark transition-colors"
          >
            Verificar Distribuição
          </button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          {/* Feedback Card */}
          <div className={`p-4 rounded-lg border-2 ${
            isCorrect 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl mr-2">
                {isCorrect ? '🎉' : '📝'}
              </span>
              <h3 className="font-bold text-lg">
                {isCorrect ? 'Parabéns!' : 'Quase lá!'}
              </h3>
            </div>
            <p className="text-sm">
              {feedbackMessage}
            </p>
          </div>
          
          {/* Action Button */}
          <button
            onClick={handleContinue}
            className="px-8 py-3 rounded-lg font-bold text-white bg-primary hover:bg-primary-dark transition-colors"
          >
            {isCorrect ? 'Continuar' : 'Tentar Novamente'}
          </button>
        </div>
      )}


    </LessonLayout>
  );
};

export default CategoriesSimulationLesson;
