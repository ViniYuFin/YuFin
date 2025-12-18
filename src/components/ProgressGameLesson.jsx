import React, { useState, useEffect } from 'react';
import LessonLayout from './LessonLayout';

const ProgressGameLesson = ({ lesson, onComplete, onExit }) => {
  const [currentMonth, setCurrentMonth] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  
  // Usar dados do banco de dados
  const months = lesson.content?.months || [];
  const goal = lesson.content?.goal?.price || 200;
  const goalItem = lesson.content?.goal?.item || "Videogame";
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChoice = (choice) => {
    // Calcular nova poupança baseada na escolha
    const newSavings = totalSavings + choice.savings;
    
    // Atualizar o estado de poupança
    setTotalSavings(newSavings);
    
    // Mostrar feedback
    setFeedbackMessage(choice.feedback);
    setShowFeedback(true);
    setIsCorrect(choice.isCorrect);
    
    // Avançar para próximo mês ou finalizar
    if (currentMonth < months.length - 1) {
      setTimeout(() => {
        setCurrentMonth(prev => prev + 1);
        setShowFeedback(false);
      }, 2000);
    } else {
      // Jogo finalizado
      setTimeout(() => {
        setGameCompleted(true);
        setShowFeedback(false);
      }, 2000);
    }
  };

  const handleContinue = () => {
    const finalScore = gameCompleted ? 100 : Math.round((totalSavings / goal) * 100);
    const isPerfect = totalSavings >= goal;
    
    onComplete({
      score: finalScore,
      timeSpent,
      isPerfect,
      feedback: gameCompleted ? `Parabéns! Você conseguiu economizar R$ ${totalSavings.toFixed(2).replace('.', ',')} para seu ${goalItem}!` : feedbackMessage
    });
  };

  const currentMonthData = months[currentMonth];

  if (gameCompleted) {
    return (
      <LessonLayout
        title={lesson.title}
        timeSpent={timeSpent}
        onExit={onExit}
        icon="🎯"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Jogo Concluído!
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            {lesson.content?.finalGoal || 'Parabéns por completar o desafio!'}
          </p>
          
          <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200 mb-6">
            <h3 className="text-xl font-bold text-green-800 mb-2">Resultado Final:</h3>
            <p className="text-2xl font-bold text-green-600">
              R$ {totalSavings.toFixed(2).replace('.', ',')} poupados
            </p>
            <p className="text-green-700">
              Meta: R$ {goal.toFixed(2).replace('.', ',')} para {goalItem}
            </p>
            <p className="text-green-700 mt-2">
              {totalSavings >= goal ? '🎯 Meta alcançada!' : `Faltaram R$ ${(goal - totalSavings).toFixed(2).replace('.', ',')}`}
            </p>
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="w-full bg-primary text-white py-3 rounded-lg font-bold text-lg hover:bg-primary-dark transition-colors"
        >
          Continuar
        </button>
      </LessonLayout>
    );
  }

  if (!currentMonthData) {
    return (
      <LessonLayout
        title={lesson.title}
        timeSpent={timeSpent}
        onExit={onExit}
        icon="🎯"
      >
        <div className="text-center">
          <p className="text-gray-600">Carregando desafio...</p>
        </div>
      </LessonLayout>
    );
  }

  return (
    <LessonLayout
      title={lesson.title}
      timeSpent={timeSpent}
      onExit={onExit}
      icon="🎯"
    >
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {lesson.content?.scenario || 'Desafio de Poupança'}
        </h2>
        
        {/* Progresso */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-blue-600">Mês {currentMonth + 1} de {months.length}</span>
            <span className="text-sm text-blue-600">Meta: R$ {goal.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((totalSavings / goal) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-blue-600">Poupado: R$ {totalSavings.toFixed(2).replace('.', ',')}</span>
            <span className="text-sm text-blue-600">Faltam: R$ {Math.max(0, goal - totalSavings).toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </div>

      {/* Desafio atual */}
      <div className="bg-white p-6 rounded-lg border-2 border-gray-200 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
          Mês {currentMonth + 1}: Você recebeu R$ {currentMonthData.income.toFixed(2).replace('.', ',')}
        </h3>
        
        {/* Cenário do mês */}
        {currentMonthData.scenario && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 className="text-md font-semibold text-blue-800 mb-2">Situação:</h4>
            <p className="text-blue-700">{currentMonthData.scenario}</p>
          </div>
        )}
        
        {/* Escolhas disponíveis */}
        <div className="space-y-3">
          {currentMonthData.choices?.map((choice, index) => (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice)}
              disabled={showFeedback}
              className={`w-full p-4 rounded-lg text-left font-medium transition-all duration-200 ${
                showFeedback 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : choice.isCorrect
                    ? 'bg-green-50 hover:bg-green-100 cursor-pointer hover:scale-105 border-2 border-green-200'
                    : 'bg-orange-50 hover:bg-orange-100 cursor-pointer hover:scale-105 border-2 border-orange-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-bold text-gray-800 mb-1">{choice.title}</h5>
                  <p className="text-sm text-gray-600 mb-2">{choice.description}</p>
                  
                  {/* Gastos da escolha */}
                  {choice.expenses && (
                    <div className="text-xs text-gray-500">
                      <p className="font-semibold mb-1">Gastos:</p>
                      {choice.expenses.map((expense, expIndex) => (
                        <div key={expIndex} className="flex justify-between">
                          <span>{expense.item}</span>
                          <span>R$ {expense.amount.toFixed(2).replace('.', ',')}</span>
                        </div>
                      ))}
                      <div className="border-t pt-1 mt-1 flex justify-between font-semibold">
                        <span>Poupança:</span>
                        <span className="text-green-600">R$ {choice.savings.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <span className={`text-2xl ${choice.isCorrect ? 'text-green-600' : 'text-orange-600'}`}>
                    {choice.isCorrect ? '💾' : '💸'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className={`p-4 rounded-lg mb-6 text-center ${
          isCorrect ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
        }`}>
          <div className="text-2xl mb-2">{isCorrect ? '🎉' : '💡'}</div>
          <p className="font-semibold">{feedbackMessage}</p>
        </div>
      )}
    </LessonLayout>
  );
};

export default ProgressGameLesson;