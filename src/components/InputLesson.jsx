import React, { useState, useEffect } from 'react';
import LessonLayout from './LessonLayout';

const InputLesson = ({ lesson, onComplete, onExit }) => {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Normalizar o conteúdo para suportar diferentes formatos
  const normalizedContent = React.useMemo(() => {
    if (!lesson.content) return { examples: [], problems: [] };
    
    // Formato novo (backend): examples com scenario/calculation/answer/explanation
    if (lesson.content.examples && lesson.content.examples.length > 0) {
      return {
        examples: lesson.content.examples.map(example => ({
          question: example.scenario || example.question || 'Pergunta não encontrada',
          calculation: example.calculation || example.hint || '',
          answer: example.answer || example.expectedAnswer || '',
          explanation: example.explanation || example.feedback || 'Explicação não disponível'
        })),
        problems: []
      };
    }
    
    // Formato antigo: problems com question/answer/explanation
    if (lesson.content.problems && lesson.content.problems.length > 0) {
      return {
        examples: [],
        problems: lesson.content.problems.map(problem => ({
          question: problem.question || problem.problem || 'Pergunta não encontrada',
          calculation: problem.calculation || problem.hint || '',
          answer: problem.correctAnswer || problem.answer || problem.expectedAnswer || '',
          explanation: problem.explanation || problem.feedback || 'Explicação não disponível',
          tolerance: problem.tolerance || 0.01,
          context: problem.context || '',
          stepByStep: problem.stepByStep || [],
          formula: problem.formula || ''
        }))
      };
    }
    
    // Fallback
    return {
      examples: [],
      problems: []
    };
  }, [lesson.content]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const currentProblem = normalizedContent.examples?.[currentProblemIndex] || 
                        normalizedContent.problems?.[currentProblemIndex] || 
                        lesson.content;

  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    // Normalizar formatos de número (aceitar vírgula e ponto como separador decimal)
    const normalizeNumber = (input) => {
      // Remove espaços e converte vírgula para ponto
      let normalized = input.trim().replace(/\s/g, '').replace(',', '.');
      
      // Se termina com vírgula ou ponto, remove
      normalized = normalized.replace(/[,.]$/, '');
      
      // Se tem múltiplos pontos, mantém apenas o primeiro
      const parts = normalized.split('.');
      if (parts.length > 2) {
        normalized = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Remove zeros à direita após o ponto decimal
      if (normalized.includes('.')) {
        normalized = normalized.replace(/\.?0+$/, '');
        // Se ficou apenas o ponto, remove
        if (normalized.endsWith('.')) {
          normalized = normalized.slice(0, -1);
        }
      }
      
      return normalized;
    };

    // Verificar se a resposta está correta
    const userAnswer = normalizeNumber(inputValue);
    const expectedAnswer = normalizeNumber(currentProblem.answer?.toString() || '');
    
    // Comparar como números para evitar problemas de precisão
    const userNum = parseFloat(userAnswer);
    const expectedNum = parseFloat(expectedAnswer);
    const tolerance = currentProblem.tolerance || 0.01;
    const correct = !isNaN(userNum) && !isNaN(expectedNum) && Math.abs(userNum - expectedNum) <= tolerance;

    setIsCorrect(correct);
    setShowFeedback(true);

    // Salvar resposta do usuário
    setUserAnswers(prev => [...prev, {
      problemIndex: currentProblemIndex,
      userAnswer: inputValue.trim(),
      expectedAnswer: currentProblem.answer,
      isCorrect: correct
    }]);

    setTimeout(() => {
      setShowFeedback(false);
      const totalProblems = (normalizedContent.examples?.length || 0) + (normalizedContent.problems?.length || 0);
      if (totalProblems > 0 && currentProblemIndex < totalProblems - 1) {
        // Próximo problema
        setCurrentProblemIndex(prev => prev + 1);
        setInputValue('');
      } else {
        // Último problema - finalizar
        const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length + (correct ? 1 : 0);
        const score = Math.round((correctAnswers / totalProblems) * 100);
        
        onComplete({
          score,
          timeSpent,
          isPerfect: correctAnswers === totalProblems,
          correctAnswers,
          totalQuestions: totalProblems,
          userAnswers: [...userAnswers, {
            problemIndex: currentProblemIndex,
            userAnswer: inputValue.trim(),
            expectedAnswer: currentProblem.answer,
            isCorrect: correct
          }]
        });
      }
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !showFeedback) {
      handleSubmit();
    }
  };

  // Verificar se os dados necessários estão disponíveis
  if (!normalizedContent.examples?.length && !normalizedContent.problems?.length) {
    return (
      <LessonLayout
        title={lesson.title}
        timeSpent={timeSpent}
        onExit={onExit}
        icon="✏️"
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

  const totalProblems = (normalizedContent.examples?.length || 0) + (normalizedContent.problems?.length || 0);

  return (
    <LessonLayout
      title={lesson.title}
      timeSpent={timeSpent}
      onExit={onExit}
      icon="✏️"
    >
      <div className="text-center mb-6 font-sans">
        {lesson.content?.scenario?.description && (
          <p className="text-gray-600 mb-4 font-sans">
            {lesson.content.scenario.description}
          </p>
        )}
        
        {/* Progress */}
        {totalProblems > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-blue-700 font-medium">
              Problema {currentProblemIndex + 1} de {totalProblems}
            </p>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentProblemIndex + 1) / totalProblems) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Current Problem */}
      {currentProblem ? (
        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 font-sans">
            {totalProblems > 0 ? `Problema ${currentProblemIndex + 1}:` : 'Pergunta:'}
          </h3>
          
          {currentProblem.context && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-700 font-sans">
                {currentProblem.context}
              </p>
            </div>
          )}
          
          <p className="text-lg text-gray-700 mb-6 font-sans">
            {currentProblem.question}
          </p>
          
          {currentProblem.hint && (
            <div className="bg-yellow-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-yellow-700 font-sans">
                💡 Dica: {currentProblem.hint}
              </p>
            </div>
          )}
          
          {currentProblem.formula && (
            <div className="bg-green-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-green-700 font-sans">
                📐 Fórmula: {currentProblem.formula}
              </p>
            </div>
          )}
          
          <div className="mb-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={showFeedback}
              placeholder="Digite sua resposta..."
              className={`w-full p-4 border-2 rounded-lg text-lg focus:outline-none transition-colors font-sans ${
                showFeedback
                  ? isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-primary'
              }`}
            />
          </div>

          {!showFeedback && (
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="w-full bg-primary text-white py-3 rounded-lg font-bold text-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verificar Resposta
            </button>
          )}
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Problema não encontrado</h3>
          <p className="text-gray-600">Este problema está sendo preparado.</p>
        </div>
      )}

      {/* Feedback */}
      {showFeedback && currentProblem && (
        <div className={`p-6 rounded-lg mb-6 text-center shadow-lg border-2 font-sans transition-all duration-200 ${
          isCorrect 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="text-4xl mb-3">{isCorrect ? '🎉' : '😔'}</div>
          <p className="text-xl font-bold mb-2 font-sans">
            {isCorrect ? 'Correto!' : 'Incorreto!'}
          </p>
          <p className="text-lg mb-3 font-sans">
            Sua resposta: <span className="font-bold">"{inputValue}"</span>
          </p>
          {!isCorrect && currentProblem.answer && (
            <p className="text-lg mb-3 font-sans">
              Resposta correta: <span className="font-bold">"{currentProblem.answer}"</span>
            </p>
          )}
          {currentProblem.explanation && (
            <p className="text-sm font-sans">
              {currentProblem.explanation}
            </p>
          )}
          {totalProblems > 0 && currentProblemIndex < totalProblems - 1 && (
            <p className="text-sm mt-3 font-sans">
              Próximo problema em 2 segundos...
            </p>
          )}
        </div>
      )}

      {/* Previous Answers */}
      {userAnswers.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-bold text-gray-800 mb-3 font-sans">Respostas anteriores:</h4>
          <div className="space-y-2">
            {userAnswers.map((answer, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="font-sans">
                  {totalProblems > 0 ? `Problema ${answer.problemIndex + 1}:` : 'Resposta:'}
                </span>
                <span className={`font-bold font-sans ${
                  answer.isCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {answer.userAnswer} {answer.isCorrect ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </LessonLayout>
  );
};

export default InputLesson; 