import React, { useState, useEffect } from 'react';
import LessonLayout from './LessonLayout';

const ChoicesLesson = ({ lesson, onComplete, onExit, reviewMode }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentSituationIndex, setCurrentSituationIndex] = useState(0);
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

  // Normalizar o conteúdo para suportar diferentes formatos
  const normalizedContent = React.useMemo(() => {
    if (!lesson.content) return { options: [], question: '', currentSituation: null };
    
    // NOVO: Formato personalizado com análise detalhada (Template Choices)
    if (lesson.content.scenario && lesson.content.options && lesson.content.comparison) {
      return {
        scenario: lesson.content.scenario,
        options: lesson.content.options.map(option => ({
          text: option.choice,
          correct: option.correct,
          feedback: option.feedback,
          details: option.details,
          analysis: option.analysis
        })),
        comparison: lesson.content.comparison,
        conclusion: lesson.content.conclusion,
        isDetailedFormat: true
      };
    }
    
    // Formato com situations (múltiplas situações)
    if (lesson.content.situations && lesson.content.situations.length > 0) {
      const currentSituation = lesson.content.situations[currentSituationIndex];
      
      // Verificar se é formato de comparação de preços (tem brand, price, quality)
      if (currentSituation.options && currentSituation.options[0] && currentSituation.options[0].brand) {
        return {
          options: currentSituation.options.map(option => ({
            text: `${option.brand} - R$ ${option.price.toFixed(2).replace('.', ',')}${option.quantity ? ` (${option.quantity} unidades)` : ''} - ${option.quality}`,
            correct: option.brand === currentSituation.correctAnswer,
            explanation: currentSituation.explanation,
            details: option
          })),
          question: currentSituation.question,
          currentSituation,
          totalSituations: lesson.content.situations.length,
          scenario: lesson.content.scenario
        };
      }
      
      // Formato de consumo consciente (tem choice, consequence, impact, feedback)
      if (currentSituation.options && currentSituation.options[0] && currentSituation.options[0].choice) {
        return {
          options: currentSituation.options.map(option => ({
            text: option.choice,
            correct: option.quality === "excelente" || option.quality === "boa", // Só excelente e boa são consideradas corretas
            explanation: option.feedback,
            consequence: option.consequence,
            impact: option.impact,
            quality: option.quality,
            details: option
          })),
          question: currentSituation.situation,
          currentSituation,
          totalSituations: lesson.content.situations.length,
          scenario: lesson.content.scenario
        };
      }
    }
    
    // Formato tradicional com options diretas
    if (lesson.content.options && lesson.content.options.length > 0) {
      return {
        options: lesson.content.options,
        question: lesson.content.question || lesson.content.text,
        currentSituation: null,
        totalSituations: 1,
        scenario: lesson.content.scenario
      };
    }
    
    // Formato com choices (novo formato)
    if (lesson.content.choices && lesson.content.choices.length > 0) {
      return {
        options: lesson.content.choices.map(choice => ({
          text: choice.text,
          correct: choice.correct,
          feedback: choice.feedback,
          explanation: choice.feedback,
          points: choice.points || (choice.correct ? 100 : 50)
        })),
        question: lesson.content.question || "Escolha a melhor opção",
        currentSituation: null,
        totalSituations: 1,
        scenario: lesson.content.scenario
      };
    }
    
    return { options: [], question: '', currentSituation: null };
  }, [lesson.content, currentSituationIndex]);

  const handleAnswerSelect = (answer) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    // Para lições de consumo consciente, verificar qualidade da escolha
    // Para lições de comparação de preços, verificar se está correto
    const isCorrectAnswer = normalizedContent.currentSituation && normalizedContent.currentSituation.options && normalizedContent.currentSituation.options[0] && normalizedContent.currentSituation.options[0].choice 
      ? answer.correct // Formato consumo consciente - verificar qualidade
      : answer.correct; // Formato comparação de preços - verificar correção
    
    setIsCorrect(isCorrectAnswer);
    
    setTimeout(() => {
      setShowFeedback(true);
    }, 500);
  };

  const handleContinue = () => {
    // Se há múltiplas situações e não é a última
    if (normalizedContent.totalSituations > 1 && currentSituationIndex < normalizedContent.totalSituations - 1) {
      // Avançar para próxima situação
      setCurrentSituationIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setIsCorrect(false);
      setShowFeedback(false);
      return;
    }
    
    // Completar a lição
    const score = isCorrect ? 100 : 50;
    const isPerfect = isCorrect;
    
    onComplete({
      score,
      timeSpent,
      isPerfect,
      feedback: selectedAnswer.explanation || selectedAnswer.feedback
    });
  };

  const getAnswerClass = (answer) => {
    if (!isAnswered) {
      return "bg-white border-2 border-gray-300 hover:border-primary transition-colors";
    }
    
    if (answer.correct) {
      return "bg-green-100 border-2 border-green-500 text-green-800";
    }
    
    if (selectedAnswer === answer && !answer.correct) {
      return "bg-red-100 border-2 border-red-500 text-red-800";
    }
    
    return "bg-gray-100 border-2 border-gray-300 text-gray-500";
  };

  // Debug: verificar o conteúdo da lição
  console.log('🔍 ChoicesLesson - lesson title:', lesson.title);
  console.log('🔍 ChoicesLesson - options count:', lesson.content?.options?.length || 0);

  return (
    <LessonLayout
      title={lesson.title}
      timeSpent={timeSpent}
      onExit={onExit}
      icon="💭"
      reviewMode={reviewMode}
    >
      <div className="text-center mb-8 font-sans">
        {/* Formato detalhado personalizado */}
        {normalizedContent.isDetailedFormat && normalizedContent.scenario && (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-4 font-sans">
              {normalizedContent.scenario.title}
            </h2>
            <p className="text-gray-600 font-sans mb-4">
              {normalizedContent.scenario.description}
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
              <p className="text-sm text-blue-800 font-medium">
                💡 {normalizedContent.scenario.objective}
              </p>
            </div>
          </>
        )}
        
        {/* Formato original */}
        {!normalizedContent.isDetailedFormat && normalizedContent.scenario && (
          <p className="text-sm text-gray-500 mb-2 font-sans">{normalizedContent.scenario}</p>
        )}
        
        {!normalizedContent.isDetailedFormat && (
          <h2 className="text-xl font-bold text-gray-800 mb-4 font-sans">{normalizedContent.question}</h2>
        )}
        
        {normalizedContent.totalSituations > 1 && (
          <p className="text-sm text-gray-600 font-sans">
            Situação {currentSituationIndex + 1} de {normalizedContent.totalSituations}
          </p>
        )}
        
        <p className="text-gray-600 font-sans">
          {normalizedContent.isDetailedFormat ? 'Analise as opções e escolha a melhor decisão' : 'Escolha a melhor opção'}
        </p>
      </div>
      <div className="space-y-4 mb-6 font-sans">
        {normalizedContent.options && normalizedContent.options.length > 0 ? (
          normalizedContent.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={isAnswered}
              className={`w-full p-4 rounded-2xl text-left font-medium shadow-md border-2 transition-all duration-200 font-sans ${getAnswerClass(option)} ${!isAnswered ? 'hover:scale-105 cursor-pointer' : 'cursor-default'} focus:outline-none focus:ring-2 focus:ring-primary`}
              tabIndex={0}
            >
              <div className="flex items-start font-sans">
                <span className="text-lg font-semibold mr-3 font-sans mt-1">{String.fromCharCode(65 + index)}.</span>
                <div className="flex-1">
                  <span className="text-lg font-sans block mb-2">{option.text}</span>
                  
                  {/* Mostrar detalhes se disponível */}
                  {normalizedContent.isDetailedFormat && option.details && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="grid grid-cols-2 gap-2">
                        <span><strong>Marca:</strong> {option.details.brand}</span>
                        <span><strong>Preço:</strong> R$ {option.details.price}</span>
                        <span><strong>Qualidade:</strong> {option.details.quality}</span>
                        <span><strong>Durabilidade:</strong> {option.details.durability}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Opções não disponíveis</h3>
            <p className="text-gray-600">Esta lição está sendo preparada ou há um problema de carregamento.</p>
            <div className="mt-4 text-sm text-gray-500">
              <p>Conteúdo recebido: {JSON.stringify(lesson.content, null, 2)}</p>
            </div>
          </div>
        )}
      </div>
      {showFeedback && (
        <div className={`p-4 rounded-2xl mb-6 text-center shadow-lg border-2 font-sans transition-all duration-200 ${
          selectedAnswer?.quality === 'excelente' ? 'bg-green-50 text-green-800 border-green-200' :
          selectedAnswer?.quality === 'boa' ? 'bg-blue-50 text-blue-800 border-blue-200' :
          selectedAnswer?.quality === 'ruim' ? 'bg-red-50 text-red-800 border-red-200' :
          isCorrect ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="text-2xl mb-2">
            {selectedAnswer?.quality === 'excelente' ? '🎉' :
             selectedAnswer?.quality === 'boa' ? '👍' :
             selectedAnswer?.quality === 'ruim' ? '😔' :
             isCorrect ? '🎉' : '😔'}
          </div>
          <p className="font-semibold font-sans">
            {selectedAnswer?.quality === 'excelente' ? 'Excelente escolha!' :
             selectedAnswer?.quality === 'boa' ? 'Boa escolha!' :
             selectedAnswer?.quality === 'ruim' ? 'Pode melhorar!' :
             isCorrect ? 'Excelente escolha!' : 'Tente novamente!'}
          </p>
          <p className="text-sm font-sans mb-2">{selectedAnswer?.explanation || selectedAnswer?.feedback}</p>
          
          {/* Análise detalhada para formato personalizado */}
          {normalizedContent.isDetailedFormat && selectedAnswer?.analysis && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-800 mb-2">✅ Pontos Positivos:</p>
                  <ul className="text-sm text-green-700 space-y-1">
                    {selectedAnswer.analysis.pros.map((pro, index) => (
                      <li key={index}>• {pro}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-800 mb-2">⚠️ Pontos de Atenção:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {selectedAnswer.analysis.cons.map((con, index) => (
                      <li key={index}>• {con}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-1">💡 Lição Aprendida:</p>
                <p className="text-sm text-blue-700">{selectedAnswer.analysis.lesson}</p>
              </div>
            </div>
          )}
          
          {/* Formato original */}
          {!normalizedContent.isDetailedFormat && selectedAnswer?.consequence && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-1">Consequência:</p>
              <p className="text-sm text-blue-700">{selectedAnswer.consequence}</p>
              {selectedAnswer?.impact && (
                <>
                  <p className="text-sm font-medium text-blue-800 mb-1 mt-2">Impacto:</p>
                  <p className="text-sm text-blue-700">{selectedAnswer.impact}</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
      {isAnswered && (
        <div className="mt-6">
          <button
            onClick={handleContinue}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-primary-dark transition-colors transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary font-sans"
          >
            {normalizedContent.totalSituations > 1 && currentSituationIndex < normalizedContent.totalSituations - 1 
              ? 'Próxima Situação' 
              : 'Continuar'}
          </button>
        </div>
      )}
    </LessonLayout>
  );
};

export default ChoicesLesson; 