import React, { useState, useEffect } from 'react';
import notificationService from '../utils/notificationService';
import LessonLayout from './LessonLayout';

const QuizLesson = ({ lesson, onComplete, onExit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
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


  // Normalizar o conteúdo da lição para suportar diferentes formatos
  const normalizedContent = React.useMemo(() => {
    // Formato novo (template quiz): questions array com múltiplas perguntas
    if (lesson.content.questions && lesson.content.questions.length > 0) {
      return {
        questions: lesson.content.questions.map(q => ({
          id: q.id,
          category: q.category || 'geral',
          difficulty: q.difficulty || 'medio',
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          points: q.points || 10
        }))
      };
    }
    
    // Formato antigo: lesson.content.question e lesson.content.options
    if (lesson.content.question && lesson.content.options) {
      return {
        questions: [{
          id: 1,
          category: 'geral',
          difficulty: 'medio',
          question: lesson.content.question,
          options: lesson.content.options,
          correctAnswer: 0, // Assumir primeira opção como correta
          explanation: 'Explicação não disponível',
          points: 10
        }]
      };
    }
    
    // Fallback
    return {
      questions: []
    };
  }, [lesson.content]);

  // Timer para medir tempo gasto
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentQuestion = normalizedContent.questions?.[currentQuestionIndex];

  const handleAnswerSelect = (answerIndex) => {
    if (isAnswered) return;
    
    setCurrentAnswer(answerIndex);
    setIsAnswered(true);
    const isCorrectAnswer = answerIndex === currentQuestion.correctAnswer;
    setIsCorrect(isCorrectAnswer);
    
    // Calcular pontuação
    const points = isCorrectAnswer ? currentQuestion.points : 0;
    setTotalScore(prev => prev + points);
    
    // Salvar resposta
    setSelectedAnswers(prev => [...prev, {
      questionIndex: currentQuestionIndex,
      answer: answerIndex,
      isCorrect: isCorrectAnswer,
      points: points
    }]);
    
    // Mostrar feedback após um breve delay
    setTimeout(() => {
      setShowFeedback(true);
    }, 500);
  };

  const handleContinue = () => {
    if (currentQuestionIndex < normalizedContent.questions.length - 1) {
      // Próxima pergunta
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer(null);
      setIsAnswered(false);
      setIsCorrect(false);
      setShowFeedback(false);
    } else {
      // Última pergunta - finalizar
      const totalPossiblePoints = normalizedContent.questions.reduce((sum, q) => sum + q.points, 0);
      const percentage = Math.round((totalScore / totalPossiblePoints) * 100);
      const isPerfect = totalScore === totalPossiblePoints;
      
      onComplete({
        score: percentage,
        timeSpent,
        isPerfect,
        totalScore,
        totalPossiblePoints,
        correctAnswers: selectedAnswers.filter(a => a.isCorrect).length,
        totalQuestions: normalizedContent.questions.length,
        selectedAnswers: [...selectedAnswers, {
          questionIndex: currentQuestionIndex,
          answer: currentAnswer,
          isCorrect: isCorrect,
          points: isCorrect ? currentQuestion.points : 0
        }]
      });
    }
  };

  const getAnswerClass = (answerIndex) => {
    if (!isAnswered) {
      return darkMode 
        ? "bg-gray-700 border-2 border-gray-500 hover:border-primary transition-colors" 
        : "bg-white border-2 border-gray-300 hover:border-primary transition-colors";
    }
    
    const isCorrectAnswer = answerIndex === currentQuestion.correctAnswer;
    
    if (isCorrectAnswer) {
      return darkMode 
        ? "bg-green-900 border-2 border-green-500 text-green-200" 
        : "bg-green-100 border-2 border-green-500 text-green-800";
    }
    
    if (currentAnswer === answerIndex && !isCorrectAnswer) {
      return darkMode 
        ? "bg-red-900 border-2 border-red-500 text-red-200" 
        : "bg-red-100 border-2 border-red-500 text-red-800";
    }
    
    return darkMode 
      ? "bg-gray-600 border-2 border-gray-400 text-gray-300" 
      : "bg-gray-100 border-2 border-gray-300 text-gray-500";
  };

  // Verificar se os dados necessários estão disponíveis
  if (!normalizedContent.questions || normalizedContent.questions.length === 0) {
    return (
      <LessonLayout
        title={lesson.title}
        timeSpent={timeSpent}
        onExit={onExit}
        icon="❓"
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
    >
      {/* Progress */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600">
          Pergunta {currentQuestionIndex + 1} de {normalizedContent.questions.length}
        </p>
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Question Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span 
                  className="text-sm font-bold"
                  style={{
                    background: 'linear-gradient(to right, #EE9116, #FFB300)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {currentQuestionIndex + 1}
                </span>
              </div>
              <div>
                <span className="text-lg font-semibold">Pergunta</span>
                <div className="text-sm opacity-90">Escolha a resposta correta</div>
              </div>
            </div>
            <p 
              className="text-xl leading-relaxed"
              style={{ color: darkMode ? '#ffffff' : '#ffffff' }}
            >
              {currentQuestion.question}
            </p>
          </div>

          {/* Answer Options */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                  className={`group relative p-4 rounded-lg text-left transition-all duration-200 border-2 ${
                    !isAnswered 
                      ? 'hover:shadow-md' 
                      : getAnswerClass(index)
                  } ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{
                    backgroundColor: !isAnswered 
                      ? (darkMode ? '#374151' : '#f9fafb')
                      : undefined,
                    borderColor: !isAnswered 
                      ? (darkMode ? '#6b7280' : '#e5e7eb')
                      : undefined,
                    color: !isAnswered 
                      ? (darkMode ? '#ffffff' : '#1f2937')
                      : undefined
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      !isAnswered 
                        ? 'bg-gradient-to-r from-primary to-secondary text-white' 
                        : index === currentQuestion.correctAnswer 
                          ? 'bg-green-500 text-white' 
                          : currentAnswer === index 
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span 
                      className="text-sm font-medium flex-1"
                      style={{ color: !isAnswered ? (darkMode ? '#ffffff' : '#1f2937') : undefined }}
                    >
                      {option}
                    </span>
                    {isAnswered && index === currentQuestion.correctAnswer && (
                      <div className="text-xl">✅</div>
                    )}
                    {isAnswered && currentAnswer === index && index !== currentQuestion.correctAnswer && (
                      <div className="text-xl">❌</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {showFeedback && currentQuestion && (
        <div 
          className="rounded-xl shadow-lg p-6 mb-6"
          style={{
            backgroundColor: darkMode ? '#374151' : '#ffffff',
            borderColor: darkMode ? '#4b5563' : '#e5e7eb'
          }}
        >
          <div className="flex items-center mb-4">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
              style={{ backgroundColor: darkMode ? '#451a03' : '#fef3c7' }}
            >
              <span 
                className="text-lg"
                style={{ color: darkMode ? '#fbbf24' : '#d97706' }}
              >
                💡
              </span>
            </div>
            <h4 
              className="font-bold text-lg"
              style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
            >
              Explicação
            </h4>
          </div>
          <p 
            className="leading-relaxed"
            style={{ color: darkMode ? '#e5e7eb' : '#374151' }}
          >
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* Continue Button */}
      {isAnswered && (
        <div className="flex justify-center mb-4">
          <button
            onClick={handleContinue}
            className="gradient-primary text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {currentQuestionIndex < normalizedContent.questions.length - 1 ? 'Próxima Pergunta →' : 'Finalizar Quiz 🏆'}
          </button>
        </div>
      )}
    </LessonLayout>
  );
};

export default QuizLesson; 