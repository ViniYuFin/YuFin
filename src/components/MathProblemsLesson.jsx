import React, { useState, useEffect } from 'react';
import LessonLayout from './LessonLayout';

const MathProblemsLesson = ({ lesson, onComplete, onExit }) => {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Normalizar o conteúdo para suportar diferentes formatos
  const normalizedContent = React.useMemo(() => {
    if (!lesson.content) return { problems: [] };
    
    // Formato novo (template math-problems): problems com estrutura completa
    if (lesson.content.problems && lesson.content.problems.length > 0) {
      return {
        problems: lesson.content.problems.map(prob => ({
          id: prob.id,
          level: prob.level || 'intermediário',
          title: prob.title || `Problema ${prob.id}`,
          context: prob.context || '',
          question: prob.question || prob.description || prob.problem || 'Problema não encontrado',
          givenData: prob.givenData || {},
          formula: prob.formula || '',
          steps: prob.steps || [],
          hint: prob.hint || '',
          answer: prob.correctAnswer || prob.solution || prob.answer || 0,
          explanation: prob.explanation || prob.feedback || 'Explicação não disponível',
          tolerance: prob.tolerance || 0.01
        }))
      };
    }
    
    // Formato antigo: problems com question/answer/explanation
    if (lesson.content.problems && lesson.content.problems.length > 0) {
      return {
        problems: lesson.content.problems.map(prob => ({
          id: prob.id || 0,
          level: 'intermediário',
          title: `Problema ${prob.id || 0}`,
          context: '',
          question: prob.question || prob.problem || 'Problema não encontrado',
          givenData: {},
          formula: '',
          steps: [],
          hint: '',
          answer: prob.answer || prob.solution || 0,
          explanation: prob.explanation || prob.feedback || 'Explicação não disponível',
          tolerance: prob.tolerance || 0.01
        }))
      };
    }
    
    // Fallback
    return {
      problems: []
    };
  }, [lesson.content]);

  // Versão "limpa" dos problemas para o frontend (sem respostas)
  const cleanProblems = React.useMemo(() => {
    return normalizedContent.problems.map(prob => ({
      question: prob.question,
      // Não incluir answer nem explanation para evitar vazamento de dados
    }));
  }, [normalizedContent]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const currentProblem = normalizedContent.problems?.[currentProblemIndex];

  const handleSubmit = () => {
    if (!currentAnswer.trim()) return;

    // Converter vírgula para ponto e parsear como float
    const normalizedAnswer = currentAnswer.trim().replace(',', '.');
    const userAnswer = parseFloat(normalizedAnswer);
    const correctAnswer = currentProblem.answer;
    // Usar tolerância do problema ou padrão de 0.01
    const tolerance = normalizedContent.problems[currentProblemIndex]?.tolerance || 0.01;
    const difference = Math.abs(userAnswer - correctAnswer);
    const isAnswerCorrect = difference <= tolerance;
    
    // Debug logs
    console.log('🔍 Debug Math Problems:');
    console.log('  User Answer:', userAnswer);
    console.log('  Correct Answer:', correctAnswer);
    console.log('  Tolerance:', tolerance);
    console.log('  Difference:', difference);
    console.log('  Is Correct:', isAnswerCorrect);

    setIsCorrect(isAnswerCorrect);
    setShowFeedback(true);

    // Salvar resposta do usuário
    setUserAnswers(prev => [...prev, {
      problemIndex: currentProblemIndex,
      userAnswer: userAnswer,
      correctAnswer: correctAnswer,
      isCorrect: isAnswerCorrect
    }]);

    setTimeout(() => {
      setShowFeedback(false);
      if (currentProblemIndex < normalizedContent.problems.length - 1) {
        // Próximo problema
        setCurrentProblemIndex(prev => prev + 1);
        setCurrentAnswer('');
      } else {
        // Último problema - finalizar
        const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length + (isAnswerCorrect ? 1 : 0);
        const totalProblems = normalizedContent.problems.length;
        const score = Math.round((correctAnswers / totalProblems) * 100);
        
        onComplete({
          score,
          timeSpent,
          isPerfect: correctAnswers === totalProblems,
          correctAnswers,
          totalQuestions: totalProblems,
          userAnswers: [...userAnswers, {
            problemIndex: currentProblemIndex,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer,
            isCorrect: isAnswerCorrect
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

  // Debug log para verificar o conteúdo (SEM DADOS SENSÍVEIS)
  console.log('🔍 MathProblemsLesson - lesson title:', lesson.title);
  console.log('🔍 MathProblemsLesson - problems count:', normalizedContent.problems.length);
  console.log('🔍 MathProblemsLesson - current problem question:', currentProblem?.question);

  // Verificar se os dados necessários estão disponíveis
  if (!normalizedContent.problems || normalizedContent.problems.length === 0) {
    return (
      <LessonLayout
        title={lesson.title}
        timeSpent={timeSpent}
        onExit={onExit}
        icon="🧮"
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
      icon="🧮"
    >
      <div className="text-center mb-6 font-sans">
        <h2 className="text-xl font-bold text-gray-800 mb-4 font-sans">
          {lesson.content?.text || 'Problemas Matemáticos'}
        </h2>
        
        {/* Progress */}
        {normalizedContent.problems && normalizedContent.problems.length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-blue-700 font-medium">
              Problema {currentProblemIndex + 1} de {normalizedContent.problems.length}
            </p>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentProblemIndex + 1) / normalizedContent.problems.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {lesson.content?.instructions && lesson.content.instructions.length > 0 && (
          <div className="bg-yellow-50 p-3 rounded-lg mb-6">
            <h3 className="font-bold text-yellow-800 mb-2">Instruções:</h3>
            <ul className="text-sm text-yellow-700 text-left">
              {lesson.content.instructions.map((instruction, index) => (
                <li key={index} className="mb-1">• {instruction}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Current Problem */}
      {currentProblem ? (
        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-200 mb-6">
          {/* Header do Problema */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 font-sans">
              Problema {currentProblemIndex + 1}: {currentProblem.title}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentProblem.level === 'básico' ? 'bg-green-100 text-green-800' :
              currentProblem.level === 'intermediário' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentProblem.level}
            </span>
          </div>



          {/* Contexto do Problema */}
          {currentProblem.context && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-bold text-blue-800 mb-2">📋 Situação:</h4>
              <p className="text-sm text-blue-700">{currentProblem.context}</p>
            </div>
          )}

          {/* Dados Fornecidos */}
          {currentProblem.givenData && Object.keys(currentProblem.givenData).length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg mb-4 border border-green-200">
              <h4 className="font-bold text-green-800 mb-3 flex items-center">
                <span className="text-lg mr-2">📊</span>
                Dados Fornecidos:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(currentProblem.givenData).map(([key, value]) => (
                  <div key={key} className="bg-white p-3 rounded-lg border border-green-200 shadow-sm">
                    <div className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                    <div className="text-lg font-bold text-green-800">
                      {typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pergunta */}
          <p className="text-lg text-gray-700 mb-6 font-sans">
            {currentProblem.question}
          </p>

          {/* Dica */}
          {currentProblem.hint && (
            <div className="bg-yellow-50 p-3 rounded-lg mb-4">
              <h4 className="font-bold text-yellow-800 mb-1">💡 Dica:</h4>
              <p className="text-sm text-yellow-700">{currentProblem.hint}</p>
            </div>
          )}
          
          <div className="mb-4">
            <input
              type="number"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={showFeedback}
              placeholder="Digite sua resposta (ex: 2,30 ou 2.30)..."
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
              disabled={!currentAnswer.trim()}
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
        <div className={`p-6 rounded-lg mb-6 shadow-lg border-2 font-sans transition-all duration-200 ${
          isCorrect 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="text-center mb-4">
            <div className="text-4xl mb-3">{isCorrect ? '🎉' : '😔'}</div>
            <p className="text-xl font-bold mb-2 font-sans">
              {isCorrect ? 'Correto!' : 'Incorreto!'}
            </p>
            <p className="text-lg mb-3 font-sans">
              Sua resposta: <span className="font-bold">{currentAnswer}</span>
            </p>
          </div>

          {/* Próximo problema */}
          {currentProblemIndex < normalizedContent.problems.length - 1 && (
            <div className="text-center">
              <p className="text-sm mt-3 font-sans">
                Próximo problema em 2 segundos...
              </p>
            </div>
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
                <span className="font-sans">Problema {answer.problemIndex + 1}:</span>
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

export default MathProblemsLesson;

