import React, { useState, useEffect } from 'react';
import LessonLayout from './LessonLayout';

const BudgetChoicesLesson = ({ lesson, onComplete, onExit, reviewMode }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
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

  // Extrair orçamento do campo budget
  const getBudget = () => {
    // Usar o campo budget diretamente se disponível
    if (lesson.content?.budget) {
      return lesson.content.budget;
    }
    
    // Fallback: tentar extrair do scenario se não houver budget
    if (lesson.content?.scenario) {
      const budgetMatch = lesson.content.scenario.match(/R\$ (\d+),00/);
      return budgetMatch ? parseInt(budgetMatch[1]) : 0;
    }
    
    return 0;
  };

  // Verificar se há opções dentro do orçamento
  const getValidOptions = () => {
    const budget = getBudget();
    return lesson.content.options.filter(option => option.price <= budget);
  };

  const handleAnswerSelect = (answer) => {
    if (isAnswered) return;
    
    const budget = getBudget();
    
    // Verificar se a resposta está dentro do orçamento
    const withinBudget = (answer.cost || answer.price) <= budget;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    setIsCorrect(withinBudget);
    
    setTimeout(() => {
      setShowFeedback(true);
    }, 500);
  };

  const handleContinue = () => {
    const budget = getBudget();
    const cost = selectedAnswer.cost || selectedAnswer.price || 0;
    
    let score = 0;
    let feedback = '';
    
    // Lógica de pontuação baseada na qualidade da decisão financeira
    if (cost > budget) {
      score = 0;
      feedback = `Você escolheu uma opção que custa R$ ${cost},00, mas seu orçamento é de R$ ${budget},00. Tente escolher algo dentro do seu orçamento!`;
    } else if (cost === 0) {
      score = 100;
      feedback = `Excelente! Poupar tudo mostra disciplina financeira. Você está construindo um futuro melhor!`;
    } else if (cost <= budget * 0.2) {
      score = 90;
      feedback = `Muito bom! Você gastou pouco e ainda pode poupar R$ ${budget - cost},00. Boa decisão financeira!`;
    } else if (cost <= budget * 0.5) {
      score = 75;
      feedback = `Boa escolha! Você gastou moderadamente e ainda pode poupar R$ ${budget - cost},00.`;
    } else {
      score = 50;
      feedback = `Você gastou a maior parte da sua mesada. Tente pensar em opções mais econômicas na próxima vez!`;
    }
    
    onComplete({
      score,
      timeSpent,
      isPerfect: score >= 90,
      feedback
    });
  };

  const getAnswerClass = (answer) => {
    if (!isAnswered) {
      return "bg-white border-2 border-gray-300 hover:border-primary transition-colors";
    }
    
    const budget = getBudget();
    const withinBudget = (answer.cost || answer.price) <= budget;
    
    if (selectedAnswer === answer) {
      if (withinBudget) {
        return "bg-green-100 border-2 border-green-500 text-green-800";
      } else {
        return "bg-red-100 border-2 border-red-500 text-red-800";
      }
    }
    
    return "bg-gray-100 border-2 border-gray-300 text-gray-500";
  };

  const budget = getBudget();

  return (
    <LessonLayout
      title={lesson.title}
      timeSpent={timeSpent}
      onExit={onExit}
      icon="🎁"
      reviewMode={reviewMode}
    >
      <div className="text-center mb-8 font-sans">
        <h2 className="text-xl font-bold text-gray-800 mb-4 font-sans">
          {lesson.content.text ? lesson.content.text.replace(/^Poupí: ?/i, '🐷 ') : lesson.content.text}
        </h2>
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-blue-800 font-semibold">{lesson.content.scenario}</p>
        </div>
      </div>
      
      <div className="space-y-4 mb-6 font-sans">
        {lesson.content.options && lesson.content.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(option)}
            disabled={isAnswered}
            className={`w-full p-4 rounded-2xl text-left font-medium shadow-md border-2 transition-all duration-200 font-sans ${getAnswerClass(option)} ${!isAnswered ? 'hover:scale-105 cursor-pointer' : 'cursor-default'} focus:outline-none focus:ring-2 focus:ring-primary`}
            style={{
              backgroundColor: !isAnswered 
                ? (darkMode ? '#374151' : '#ffffff')
                : undefined,
              color: !isAnswered 
                ? (darkMode ? '#ffffff' : '#1f2937')
                : undefined,
              borderColor: !isAnswered 
                ? (darkMode ? '#6b7280' : '#d1d5db')
                : undefined
            }}
            tabIndex={0}
          >
            <div className="flex items-center justify-between font-sans">
              <div className="flex items-center font-sans">
                <span 
                  className="text-lg font-semibold mr-3 font-sans"
                  style={{ color: !isAnswered ? (darkMode ? '#ffffff' : '#1f2937') : undefined }}
                >
                  {String.fromCharCode(65 + index)}.
                </span>
                <span 
                  className="text-lg font-sans"
                  style={{ color: !isAnswered ? (darkMode ? '#ffffff' : '#1f2937') : undefined }}
                >
                  {option.item || option.text || 'Opção não encontrada'}
                </span>
              </div>
              <div className="text-right">
                <div 
                  className="text-sm font-bold"
                  style={{ color: !isAnswered ? (darkMode ? '#60a5fa' : '#2563eb') : undefined }}
                >
                  R$ {option.cost || option.price || 0},00
                </div>
              </div>
            </div>
            {option.benefit && (
              <div 
                className="mt-2 text-sm text-left"
                style={{ color: !isAnswered ? (darkMode ? '#d1d5db' : '#6b7280') : undefined }}
              >
                💡 {option.benefit}
              </div>
            )}
          </button>
        ))}
      </div>
      
      {showFeedback && (
        <div className={`p-4 rounded-2xl mb-6 text-center shadow-lg border-2 font-sans transition-all duration-200 ${isCorrect ? 'bg-green-50 text-green-800 border-green-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>
          <div className="text-2xl mb-2">{isCorrect ? '🎉' : '📝'}</div>
          <p className="font-semibold font-sans">{isCorrect ? 'Excelente escolha!' : 'Ajuste sua escolha!'}</p>
          <p className="text-sm font-sans mt-2">
            {selectedAnswer.price > budget 
              ? `Você escolheu um item que custa R$ ${selectedAnswer.price},00, mas seu orçamento é de R$ ${budget},00.`
              : `Você escolheu algo dentro do seu orçamento. Boa decisão!`
            }
          </p>
        </div>
      )}
      
      {isAnswered && (
        <div className="mt-6">
          <button
            onClick={handleContinue}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-primary-dark transition-colors transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary font-sans"
          >
            Continuar
          </button>
        </div>
      )}
    </LessonLayout>
  );
};

export default BudgetChoicesLesson;
