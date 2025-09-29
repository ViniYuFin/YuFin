import React, { useState, useEffect } from 'react';
import LessonLayout from './LessonLayout';

const SimulationLesson = ({ lesson, onComplete, onExit }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseHistory, setPhaseHistory] = useState([]);
  const [shuffledOptions, setShuffledOptions] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Função para embaralhar array (Fisher-Yates)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };


  // Normalizar o conteúdo para suportar diferentes formatos
  const normalizedContent = React.useMemo(() => {
    if (!lesson.content) return { scenario: '', options: [], isProjectFormat: false };
    
    // NOVO: Formato personalizado com fases progressivas (Template Simulation)
    if (lesson.content.scenario && lesson.content.phases && Array.isArray(lesson.content.phases)) {
      const currentPhaseData = lesson.content.phases[currentPhase];
      if (currentPhaseData) {
        // Processar as choices para o formato esperado pelo componente
        const processedOptions = (currentPhaseData.choices || []).map((choice, index) => ({
          text: choice.text || choice.choice || `Opção ${String.fromCharCode(65 + index)}`,
          choice: choice.text || choice.choice || `Opção ${String.fromCharCode(65 + index)}`,
          value: choice.value || choice.text,
          correct: choice.correct !== undefined ? choice.correct : true, // Por padrão, todas as opções são válidas
          feedback: choice.feedback || choice.outcome || `Você escolheu: ${choice.text}`,
          outcome: choice.feedback || choice.outcome || `Você escolheu: ${choice.text}`
        }));
        
        return {
          scenario: lesson.content.scenario,
          currentPhase: currentPhaseData,
          totalPhases: lesson.content.phases.length,
          options: processedOptions,
          isProjectFormat: false,
          isProgressiveFormat: true,
          scoring: lesson.content.scoring || {},
          conclusion: lesson.content.conclusion || {}
        };
      }
    }
    
    // Formato de projeto (Feira de Troca): scenario + phases
    if (lesson.content.scenario && lesson.content.phases) {
      const projectOptions = lesson.content.phases.map((phase, phaseIndex) => ({
        text: `Fase ${phase.phase}: ${phase.title}`,
        outcome: `Você escolheu a ${phase.title.toLowerCase()}. ${phase.tasks.map(task => task.description).join(' ')}`,
        correct: true, // Todas as fases são válidas
        feedback: `Excelente! A ${phase.title.toLowerCase()} é fundamental para o sucesso da feira.`,
        phase: phase
      }));
      
      return {
        scenario: lesson.content.scenario,
        options: projectOptions,
        isProjectFormat: true,
        phases: lesson.content.phases,
        materials: lesson.content.materials || [],
        successCriteria: lesson.content.successCriteria || []
      };
    }
    
    // Formato novo (backend): scenario + options com choice/outcome
    if (lesson.content.scenario && lesson.content.options) {
      return {
        scenario: lesson.content.scenario,
        options: lesson.content.options.map((option, index) => ({
          text: option.choice || option.text || `Opção ${String.fromCharCode(65 + index)}`,
          outcome: option.outcome || option.feedback || '',
          correct: option.correct !== undefined ? option.correct : false, // Usar o valor correto do backend
          feedback: option.outcome || option.feedback || ''
        })),
        isProjectFormat: false
      };
    }
    
    // Formato antigo: text + correct
    if (lesson.content.options && lesson.content.options.length > 0) {
      return {
        scenario: lesson.content.text || lesson.content.scenario || 'Escolha a melhor ação para esta situação',
        options: lesson.content.options.map(option => ({
          text: option.text || option.choice || 'Opção',
          outcome: option.outcome || option.feedback || '',
          correct: option.correct || false,
          feedback: option.feedback || option.outcome || ''
        })),
        isProjectFormat: false
      };
    }
    
    // Fallback
    return {
      scenario: 'Escolha a melhor ação para esta situação',
      options: [],
      isProjectFormat: false
    };
  }, [lesson.content, currentPhase]);

  // Embaralhar opções quando a fase mudar
  useEffect(() => {
    if (normalizedContent.isProgressiveFormat && normalizedContent.options) {
      const shuffled = shuffleArray(normalizedContent.options);
      setShuffledOptions(shuffled);
    }
  }, [currentPhase, normalizedContent.isProgressiveFormat, normalizedContent.options]);

  const handleOptionSelect = (option) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    setIsCorrect(option.correct);
    
    // Salvar histórico da fase (sem pontuação personalizada)
    setPhaseHistory(prev => [...prev, {
      phase: currentPhase,
      option: option,
      correct: option.correct
    }]);
    
    setTimeout(() => {
      setShowFeedback(true);
    }, 500);
  };

  const handleContinue = () => {
    // Verificar se é formato progressivo com fases
    if (normalizedContent.isProgressiveFormat) {
      // Se ainda há fases restantes, avançar para a próxima
      if (currentPhase < normalizedContent.totalPhases - 1) {
        setCurrentPhase(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        setIsCorrect(false);
        setShowFeedback(false);
        return;
      } else {
        // Última fase - finalizar lição
        const isPerfect = phaseHistory.every(phase => phase.correct);
        const score = isPerfect ? 100 : 50; // Sistema padrão do YuFin
        
        onComplete({
          score: score,
          timeSpent,
          isPerfect,
          feedback: normalizedContent.conclusion?.message || 'Simulação concluída!',
          phaseHistory: phaseHistory,
          totalPhases: normalizedContent.totalPhases
        });
        return;
      }
    }
    
    // Lógica original para outros formatos
    let score = isCorrect ? 100 : 50;
    let isPerfect = isCorrect;
    
    // Lógica especial para lição "Empréstimos e Financiamentos"
    if (lesson.title && lesson.title.toLowerCase().includes('empréstimo')) {
      if (selectedOption.text && selectedOption.text.toLowerCase().includes('usado à vista')) {
        score = 100;
        isPerfect = true;
      } else if (selectedOption.text && selectedOption.text.toLowerCase().includes('guardar dinheiro')) {
        score = 80;
        isPerfect = false;
      } else {
        score = 50;
        isPerfect = false;
      }
    }
    
    onComplete({
      score,
      timeSpent,
      isPerfect,
      feedback: selectedOption.feedback || selectedOption.outcome
    });
  };

  const getOptionClass = (option) => {
    if (!isAnswered) {
      return "bg-white border-2 border-gray-300 hover:border-primary transition-colors";
    }
    
    // Apenas a opção selecionada deve ser destacada
    if (selectedOption === option) {
      if (option.correct) {
        return "bg-green-100 border-2 border-green-500 text-green-800";
      } else {
        return "bg-red-100 border-2 border-red-500 text-red-800";
      }
    }
    
    // Todas as outras opções ficam em cinza (não destacadas)
    return "bg-gray-100 border-2 border-gray-300 text-gray-500";
  };

  // Debug log para verificar o conteúdo (SEM DADOS SENSÍVEIS)
  console.log('🔍 SimulationLesson - lesson title:', lesson.title);
  console.log('🔍 SimulationLesson - options count:', normalizedContent.options?.length || 0);

  return (
    <LessonLayout
      title={lesson.title}
      timeSpent={timeSpent}
      onExit={onExit}
      icon="🎮"
    >
      <div className="text-center mb-8 font-sans">
        {/* Indicador de progresso para formato progressivo */}
        {normalizedContent.isProgressiveFormat && (
          <div className="mb-4">
            <div className="flex justify-center items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-gray-600">Fase {currentPhase + 1} de {normalizedContent.totalPhases}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentPhase + 1) / normalizedContent.totalPhases) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <h2 className="text-xl font-bold text-gray-800 mb-4 font-sans">
          {normalizedContent.isProgressiveFormat 
            ? normalizedContent.currentPhase?.title 
            : (typeof normalizedContent.scenario === 'object' ? normalizedContent.scenario.title : normalizedContent.scenario)}
        </h2>
        
        {normalizedContent.isProgressiveFormat && normalizedContent.currentPhase?.description && (
          <p className="text-gray-600 font-sans mb-4">
            {normalizedContent.currentPhase.description}
          </p>
        )}
        
        {typeof normalizedContent.scenario === 'object' && normalizedContent.scenario.description && !normalizedContent.isProgressiveFormat && (
          <p className="text-gray-600 font-sans">
            {normalizedContent.scenario.description}
          </p>
        )}
        
        <p className="text-gray-600 font-sans">
          {normalizedContent.isProjectFormat 
            ? 'Escolha uma fase para começar a organizar sua feira de trocas' 
            : normalizedContent.isProgressiveFormat
            ? 'Escolha a melhor resposta para esta situação histórica'
            : 'Escolha a melhor ação para esta situação'}
        </p>
        
        {normalizedContent.isProjectFormat && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Informações do Projeto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-blue-700 mb-1">Materiais necessários:</h4>
                <ul className="text-blue-600 space-y-1">
                  {normalizedContent.materials.slice(0, 3).map((material, index) => (
                    <li key={index}>• {material}</li>
                  ))}
                  {normalizedContent.materials.length > 3 && (
                    <li>• E mais {normalizedContent.materials.length - 3} itens...</li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-700 mb-1">Critérios de sucesso:</h4>
                <ul className="text-blue-600 space-y-1">
                  {normalizedContent.successCriteria.slice(0, 2).map((criteria, index) => (
                    <li key={index}>• {criteria}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-4 mb-6 font-sans">
        {(normalizedContent.isProgressiveFormat ? shuffledOptions : normalizedContent.options) && (normalizedContent.isProgressiveFormat ? shuffledOptions : normalizedContent.options).length > 0 ? (
          (normalizedContent.isProgressiveFormat ? shuffledOptions : normalizedContent.options).map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(option)}
              disabled={isAnswered}
              className={`w-full p-4 rounded-2xl text-left font-medium shadow-md border-2 transition-all duration-200 font-sans ${getOptionClass(option)} ${!isAnswered ? 'hover:scale-105 cursor-pointer' : 'cursor-default'} focus:outline-none focus:ring-2 focus:ring-primary`}
              tabIndex={0}
            >
              <div className="flex items-center font-sans">
                <span className="text-lg font-semibold mr-3 font-sans">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="text-lg font-sans">{option.choice || option.text || `Opção ${String.fromCharCode(65 + index)}`}</span>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Conteúdo não disponível</h3>
            <p className="text-gray-600">Esta lição está sendo preparada.</p>
          </div>
        )}
      </div>
      
      {showFeedback && selectedOption && (
        <div className={`p-4 rounded-2xl mb-6 text-center shadow-lg border-2 font-sans transition-all duration-200 ${isCorrect ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          <h4 className="font-bold mb-2 font-sans">
            {isCorrect ? '✅ Resposta Correta!' : '❌ Resposta Incorreta'}
          </h4>
          <p className="font-sans mb-3">
            {selectedOption.feedback || selectedOption.outcome || 'Obrigado por participar desta simulação!'}
          </p>
          
          {/* Nota histórica para formato progressivo */}
          {normalizedContent.isProgressiveFormat && selectedOption.historical_note && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-300">
              <h5 className="font-semibold text-blue-800 mb-2">📚 Nota Histórica:</h5>
              <p className="text-sm text-blue-700">{selectedOption.historical_note}</p>
            </div>
          )}
          
          
          {normalizedContent.isProjectFormat && selectedOption.phase && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-green-300">
              <h5 className="font-semibold text-green-800 mb-2">📝 Tarefas desta fase:</h5>
              <div className="space-y-2 text-sm text-green-700">
                {selectedOption.phase.tasks.slice(0, 3).map((task, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <div>
                      <p className="font-medium">{task.task}</p>
                      <p className="text-green-600">{task.description}</p>
                    </div>
                  </div>
                ))}
                {selectedOption.phase.tasks.length > 3 && (
                  <p className="text-green-600 text-xs">E mais {selectedOption.phase.tasks.length - 3} tarefas...</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {isAnswered && (
        <div className="text-center">
          <button
            onClick={handleContinue}
            className="bg-primary text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-primary-dark transition-colors transform hover:scale-105 shadow-lg font-sans"
          >
            {normalizedContent.isProgressiveFormat 
              ? (currentPhase < normalizedContent.totalPhases - 1 ? 'Próxima Fase' : 'Finalizar Simulação')
              : 'Continuar'
            }
          </button>
        </div>
      )}
    </LessonLayout>
  );
};

export default SimulationLesson; 