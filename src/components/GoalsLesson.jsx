import React, { useState, useEffect } from 'react';
import LessonLayout from './LessonLayout';

const GoalsLesson = ({ lesson, onComplete, onExit }) => {
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [userGoal, setUserGoal] = useState({
    item: '',
    cost: '',
    available: '',
    currentSpending: '',
    months: '',
    category: ''
  });
  const [dynamicInputs, setDynamicInputs] = useState({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [exampleResults, setExampleResults] = useState({});
  const [currentExampleInput, setCurrentExampleInput] = useState('');
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

  const handleNextExample = () => {
    if (currentExampleIndex < 2) { // 3 cenários (0, 1, 2)
      setCurrentExampleIndex(prev => prev + 1);
      setCurrentExampleInput('');
      // Limpar categoria selecionada ao mudar para o cenário 3
      if (currentExampleIndex === 1) {
        setSelectedCategory(null);
        setUserGoal({
          item: '',
          cost: '',
          available: '',
          currentSpending: '',
          months: '',
          category: ''
        });
      }
    }
  };

  const handlePreviousExample = () => {
    if (currentExampleIndex > 0) {
      setCurrentExampleIndex(prev => prev - 1);
      setCurrentExampleInput('');
    }
  };

  const handleExampleInputChange = (value) => {
    setCurrentExampleInput(value);
  };

  const handleCheckExample = () => {
    const currentExample = lesson.content.examples[currentExampleIndex];
    const userAnswer = parseFloat(currentExampleInput);
    const correctAnswer = parseFloat(currentExample.answer);
    
    const isCorrect = Math.abs(userAnswer - correctAnswer) <= 1; // Tolerância de R$ 1
    
    setExampleResults(prev => ({
      ...prev,
      [currentExampleIndex]: {
        userAnswer,
        isCorrect,
        correctAnswer,
        monthlySavings: correctAnswer
      }
    }));
  };

  const handleInputChange = (field, value) => {
    setUserGoal(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setUserGoal(prev => ({
      ...prev,
      category: category.id
    }));
  };

  const handleSubmitGoal = () => {
    if (!userGoal.category) return;
    
    const hasAnyField = 
      userGoal.item || 
      userGoal.cost || 
      userGoal.available ||
      userGoal.currentSpending ||
      userGoal.months || 
      (Object.keys(dynamicInputs).length > 0 && Object.values(dynamicInputs).some(v => v && v.toString().trim() !== ''));
    
    if (hasAnyField) {
      // Calcular poupança mensal: se tem custo e meses, usar custo; senão, calcular diferença entre custo e disponível
      let monthlySavings = 0;
      if (userGoal.cost && userGoal.months) {
        monthlySavings = Math.round(parseFloat(userGoal.cost) / parseInt(userGoal.months));
      } else if (userGoal.cost && userGoal.available && userGoal.months) {
        const remaining = parseFloat(userGoal.cost) - parseFloat(userGoal.available);
        if (remaining > 0) {
          monthlySavings = Math.round(remaining / parseInt(userGoal.months));
        }
      }
      
      setIsCompleted(true);
      
      setTimeout(() => {
        onComplete({
          score: 100,
          timeSpent,
          isPerfect: true,
          userGoal: {
            ...userGoal,
            ...dynamicInputs,
            monthlySavings
          }
        });
      }, 2000);
    }
  };

  const currentExample = lesson.content.examples[currentExampleIndex];
  const currentExampleResult = exampleResults[currentExampleIndex];

  return (
    <LessonLayout
      title={lesson.title}
      timeSpent={timeSpent}
      onExit={onExit}
      icon="🎯"
    >
      <div className="text-center mb-8 font-sans">
        <h2 
          className="text-2xl font-bold mb-4 font-sans"
          style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
        >
          {lesson.content.scenario}
        </h2>
        <p 
          className="font-sans"
          style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
        >
          Resolva os exemplos e depois crie sua própria meta!
        </p>
      </div>


      <div className="space-y-6">
        <div 
          className="border-2 rounded-xl p-6"
          style={{
            backgroundColor: darkMode ? '#1e3a8a' : '#dbeafe',
            borderColor: darkMode ? '#3b82f6' : '#93c5fd'
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 
              className="text-lg font-semibold"
              style={{ color: darkMode ? '#93c5fd' : '#1e40af' }}
            >
              {currentExampleIndex < 2 ? `Cenário ${currentExampleIndex + 1} (${currentExample.character})` : 'Cenário 3 (Sua Meta)'}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handlePreviousExample}
                disabled={currentExampleIndex === 0}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  currentExampleIndex === 0
                    ? 'cursor-not-allowed'
                    : ''
                }`}
                style={{
                  backgroundColor: currentExampleIndex === 0
                    ? (darkMode ? '#4b5563' : '#e5e7eb')
                    : (darkMode ? '#1e40af' : '#dbeafe'),
                  color: currentExampleIndex === 0
                    ? (darkMode ? '#9ca3af' : '#9ca3af')
                    : (darkMode ? '#93c5fd' : '#1e40af')
                }}
              >
                ← Anterior
              </button>
              <button
                onClick={handleNextExample}
                disabled={currentExampleIndex === 2}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  currentExampleIndex === 2
                    ? 'cursor-not-allowed'
                    : ''
                }`}
                style={{
                  backgroundColor: currentExampleIndex === 2
                    ? (darkMode ? '#4b5563' : '#e5e7eb')
                    : (darkMode ? '#1e40af' : '#dbeafe'),
                  color: currentExampleIndex === 2
                    ? (darkMode ? '#9ca3af' : '#9ca3af')
                    : (darkMode ? '#93c5fd' : '#1e40af')
                }}
              >
                Próximo →
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {currentExampleIndex < 2 ? (
              // Cenários 1 e 2 - cálculos para resolver
              <>
                <div 
                  className="rounded-lg p-4 border"
                  style={{
                    backgroundColor: darkMode ? '#374151' : '#ffffff',
                    borderColor: darkMode ? '#4b5563' : '#93c5fd'
                  }}
                >
                  <h4 
                    className="font-semibold mb-2"
                    style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                  >
                    Situação:
                  </h4>
                  <p 
                    style={{ color: darkMode ? '#e5e7eb' : '#374151' }}
                  >
                    {currentExample.scenario}
                  </p>
                  {currentExample.category && (
                    <div className="mt-2">
                      <span 
                        className="inline-block text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: darkMode ? '#1e40af' : '#dbeafe',
                          color: darkMode ? '#93c5fd' : '#1e40af'
                        }}
                      >
                        {lesson.content.goalCategories.find(cat => cat.id === currentExample.category)?.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Área interativa para o aluno resolver */}
                <div 
                  className="rounded-lg p-4 border"
                  style={{
                    backgroundColor: darkMode ? '#581c87' : '#faf5ff',
                    borderColor: darkMode ? '#7c3aed' : '#d8b4fe'
                  }}
                >
                  <h4 
                    className="font-semibold mb-3"
                    style={{ color: darkMode ? '#e9d5ff' : '#581c87' }}
                  >
                    🎯 Sua vez! Calcule:
                  </h4>
                  <div className="mb-3">
                    <input
                      type="number"
                      placeholder="Digite sua resposta..."
                      value={currentExampleInput}
                      onChange={(e) => handleExampleInputChange(e.target.value)}
                      className="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-3"
                      disabled={currentExampleResult}
                      style={{
                        backgroundColor: darkMode ? '#374151' : '#ffffff',
                        color: darkMode ? '#ffffff' : '#1f2937'
                      }}
                    />
                    <button
                       onClick={handleCheckExample}
                       disabled={!currentExampleInput || currentExampleResult}
                       className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                         !currentExampleInput || currentExampleResult
                           ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                           : 'bg-primary text-white shadow-lg transform hover:scale-105'
                       }`}
                     >
                       Verificar
                     </button>
                  </div>

                  {currentExampleResult && (
                    <div className={`p-3 rounded-lg ${
                      currentExampleResult.isCorrect 
                        ? 'bg-green-100 border border-green-300' 
                        : 'bg-red-100 border border-red-300'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">
                          {currentExampleResult.isCorrect ? '✅' : '❌'}
                        </span>
                        <span className={`font-semibold ${
                          currentExampleResult.isCorrect ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {currentExampleResult.isCorrect ? 'Correto!' : 'Tente novamente!'}
                        </span>
                      </div>
                      {currentExampleResult.isCorrect ? (
                        <p className="text-green-700 text-sm">
                          {currentExample.explanation}
                        </p>
                      ) : (
                        <p className="text-red-700 text-sm">
                          Resposta correta: R$ {currentExampleResult.correctAnswer.toFixed(2).replace('.', ',')} por mês
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Cenário 3 - formulário para criar meta pessoal
              <>
                {/* Seleção de Categoria - só aparece no cenário 3 */}
                {!selectedCategory ? (
                  <div 
                    className="rounded-lg p-4 border"
                    style={{
                      backgroundColor: darkMode ? '#581c87' : '#faf5ff',
                      borderColor: darkMode ? '#7c3aed' : '#d8b4fe'
                    }}
                  >
                    <h4 
                      className="font-semibold mb-4"
                      style={{ color: darkMode ? '#e9d5ff' : '#581c87' }}
                    >
                      🎯 Primeiro, escolha uma categoria para sua meta:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {lesson.content.goalCategories.map((category) => (
                        <div
                          key={category.id}
                          onClick={() => handleCategorySelect(category)}
                          className="rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                          style={{
                            backgroundColor: darkMode ? '#374151' : '#ffffff',
                            borderColor: darkMode ? '#4b5563' : '#e5e7eb'
                          }}
                        >
                          <div className="text-center">
                            <div className="text-3xl mb-2">{category.icon}</div>
                            <h5 
                              className="font-bold mb-1"
                              style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                            >
                              {category.name}
                            </h5>
                            <p 
                              className="text-sm mb-3"
                              style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                            >
                              {category.description}
                            </p>
                            <div 
                              className="rounded p-2"
                              style={{ backgroundColor: darkMode ? '#4b5563' : '#f9fafb' }}
                            >
                              <h6 
                                className="font-semibold text-xs mb-1"
                                style={{ color: darkMode ? '#ffffff' : '#374151' }}
                              >
                                Exemplos:
                              </h6>
                              <ul 
                                className="text-xs space-y-1"
                                style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                              >
                                {category.examples.slice(0, 2).map((example, index) => (
                                  <li key={index}>• {example}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Formulário de Meta - só aparece após selecionar categoria
                  <div 
                    className="rounded-lg p-4 border"
                    style={{
                      backgroundColor: darkMode ? '#581c87' : '#faf5ff',
                      borderColor: darkMode ? '#7c3aed' : '#d8b4fe'
                    }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 
                        className="font-semibold"
                        style={{ color: darkMode ? '#e9d5ff' : '#581c87' }}
                      >
                        🎯 Defina sua meta:
                      </h4>
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-sm"
                          style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                        >
                          Categoria:
                        </span>
                        <span 
                          className="font-semibold text-sm"
                          style={{ color: darkMode ? '#e9d5ff' : '#581c87' }}
                        >
                          {selectedCategory.name}
                        </span>
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className="text-xs underline"
                          style={{ color: darkMode ? '#a78bfa' : '#7c3aed' }}
                        >
                          Trocar
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {lesson.content.inputFields.filter(field => field.type !== 'select').map((field, index) => {
                        const labelLower = field.label.toLowerCase();
                        let fieldKey = null;
                        let currentValue = '';
                        
                        // Verificar primeiro campos de valor disponível (mais específico, antes de "quanto custa")
                        if (labelLower.includes('quanto você tem disponível') || labelLower.includes('quanto você tem para') || labelLower.includes('quanto você já economizou') || labelLower.includes('quanto você já tem')) {
                          fieldKey = 'available';
                          currentValue = userGoal.available || '';
                        }
                        // Verificar primeiro campos de gasto atual (mais específico, antes de "reduzir")
                        if (labelLower.includes('quanto você gasta atualmente') || labelLower.includes('quanto você gasta por mês')) {
                          fieldKey = 'currentSpending';
                          currentValue = userGoal.currentSpending || '';
                        }
                        // Verificar campos de redução/economia (mais específicos)
                        else if (labelLower.includes('quanto você consegue reduzir') || labelLower.includes('quanto consegue economizar') || labelLower.includes('quanto quer economizar')) {
                          fieldKey = 'cost';
                          currentValue = userGoal.cost || '';
                        }
                        // Verificar outros campos de custo/preço
                        else if (labelLower.includes('quanto custa') || labelLower.includes('qual seu orçamento') || labelLower.includes('quanto quer gastar') || labelLower.includes('quanto você quer gastar') || labelLower.includes('quanto quer investir') || labelLower.includes('quanto quer doar') || labelLower.includes('qual foi o valor') || labelLower.includes('quanto custa sua meta')) {
                          fieldKey = 'cost';
                          currentValue = userGoal.cost || '';
                        } 
                        // Depois verificar campos de item/produto (verificar se NÃO contém "quanto custa" para evitar conflito)
                        else if ((labelLower.includes('o que você quer') && !labelLower.includes('quanto custa')) || labelLower.includes('qual produto') || labelLower.includes('para onde') || labelLower.includes('qual investimento') || labelLower.includes('qual empresa') || labelLower.includes('qual estratégia') || labelLower.includes('qual gasto') || labelLower.includes('qual hábito') || labelLower.includes('qual causa') || labelLower.includes('qual problema')) {
                          fieldKey = 'item';
                          currentValue = userGoal.item || '';
                        } 
                        // Verificar outros campos de valor disponível (genéricos)
                        else if (labelLower.includes('quanto você tem') || labelLower.includes('quanto você pode')) {
                          fieldKey = 'available';
                          currentValue = userGoal.available || '';
                        } 
                        // Verificar campos de tempo
                        else if (labelLower.includes('em quantos meses') || labelLower.includes('em quanto tempo') || labelLower.includes('por quantos meses') || labelLower.includes('por quantos anos') || labelLower.includes('há quanto tempo')) {
                          fieldKey = 'months';
                          currentValue = userGoal.months || '';
                        } 
                        // Campos dinâmicos
                        else {
                          fieldKey = `field_${index}`;
                          currentValue = dynamicInputs[fieldKey] || '';
                        }
                        
                        return (
                          <div key={index}>
                            <label 
                              className="block text-sm font-medium mb-2"
                              style={{ color: darkMode ? '#ffffff' : '#374151' }}
                            >
                              {field.label}
                            </label>
                            <input
                              type={field.type || 'text'}
                              placeholder={field.placeholder}
                              value={currentValue}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (fieldKey === 'item' || fieldKey === 'cost' || fieldKey === 'available' || fieldKey === 'currentSpending' || fieldKey === 'months') {
                                  handleInputChange(fieldKey, value);
                                } else {
                                  setDynamicInputs(prev => ({
                                    ...prev,
                                    [fieldKey]: value
                                  }));
                                }
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = darkMode ? '#a78bfa' : '#9333ea';
                                e.target.style.boxShadow = `0 0 0 3px ${darkMode ? 'rgba(167, 139, 250, 0.3)' : 'rgba(147, 51, 234, 0.3)'}`;
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = darkMode ? '#6b7280' : '#d8b4fe';
                                e.target.style.boxShadow = 'none';
                              }}
                              className="w-full p-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              style={{
                                backgroundColor: darkMode ? '#374151' : '#ffffff',
                                color: darkMode ? '#ffffff' : '#1f2937',
                                borderColor: darkMode ? '#6b7280' : '#d8b4fe',
                                cursor: isCompleted ? 'not-allowed' : 'text',
                                pointerEvents: isCompleted ? 'none' : 'auto',
                                WebkitAppearance: 'none',
                                MozAppearance: 'textfield'
                              }}
                              disabled={isCompleted}
                              readOnly={isCompleted}
                              autoComplete="off"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Cálculo automático em tempo real */}
                    {userGoal.cost && userGoal.months && (
                      <div 
                        className="mt-4 p-3 rounded-lg border"
                        style={{
                          backgroundColor: darkMode ? '#1e3a8a' : '#dbeafe',
                          borderColor: darkMode ? '#3b82f6' : '#93c5fd'
                        }}
                      >
                        <h4 
                          className="font-semibold mb-2"
                          style={{ color: darkMode ? '#93c5fd' : '#1e40af' }}
                        >
                          📊 Seu plano de poupança:
                        </h4>
                        <p 
                          style={{ color: darkMode ? '#bfdbfe' : '#1d4ed8' }}
                        >
                          {(() => {
                            const cost = parseFloat(userGoal.cost);
                            const available = userGoal.available ? parseFloat(userGoal.available) : 0;
                            const currentSpending = userGoal.currentSpending ? parseFloat(userGoal.currentSpending) : 0;
                            const months = parseInt(userGoal.months);
                            
                            // Verificar se é uma lição de redução de gastos
                            const isReductionGoal = currentSpending > 0 || 
                                                   lesson.content.scenario?.toLowerCase().includes('reduzir') || 
                                                   lesson.content.scenario?.toLowerCase().includes('economia') ||
                                                   lesson.title?.toLowerCase().includes('decisões financeiras');
                            
                            if (isReductionGoal && currentSpending > 0 && cost > 0 && months > 0) {
                              // Lição de redução de gastos
                              const totalSavings = cost * months;
                              return (
                                <>
                                  Reduzindo <strong>{userGoal.item || 'seus gastos'}</strong> em R$ {cost.toFixed(2)} por mês durante {months} meses, você economizará um total de <strong>R$ {totalSavings.toFixed(2)}</strong>!
                                </>
                              );
                            } else {
                              // Lição de compra/poupança tradicional
                              const remaining = cost - available;
                              const monthlySavings = remaining > 0 ? Math.round(remaining / months) : Math.round(cost / months);
                              
                              if (available > 0 && remaining > 0) {
                                return (
                                  <>
                                    Para comprar <strong>{userGoal.item || 'seu objetivo'}</strong> por R$ {cost.toFixed(2)} em {months} meses, você já tem R$ {available.toFixed(2)} disponível. Você precisará guardar <strong>R$ {monthlySavings},00 por mês</strong>.
                                  </>
                                );
                              } else {
                                return (
                                  <>
                                    Para comprar <strong>{userGoal.item || 'seu objetivo'}</strong> por R$ {cost.toFixed(2)} em {months} meses, você precisará guardar <strong>R$ {monthlySavings},00 por mês</strong>.
                                  </>
                                );
                              }
                            }
                          })()}
                        </p>
                        <p 
                          className="text-sm mt-2"
                          style={{ color: darkMode ? '#93c5fd' : '#2563eb' }}
                        >
                          Categoria: <strong>{selectedCategory.name}</strong>
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleSubmitGoal}
                      disabled={
                        !userGoal.category || 
                        (!userGoal.item && !userGoal.cost && !userGoal.available && !userGoal.currentSpending && !userGoal.months && 
                         !(Object.keys(dynamicInputs).length > 0 && Object.values(dynamicInputs).some(v => v && v.toString().trim() !== '')))
                      }
                      className={`w-full mt-4 py-3 px-6 rounded-lg font-bold text-lg transition-all duration-300 ${
                        userGoal.category && (
                          userGoal.item || 
                          userGoal.cost || 
                          userGoal.available ||
                          userGoal.currentSpending ||
                          userGoal.months || 
                          (Object.keys(dynamicInputs).length > 0 && Object.values(dynamicInputs).some(v => v && v.toString().trim() !== ''))
                        )
                          ? 'bg-primary text-white shadow-lg transform hover:scale-105 cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Criar Meta Financeira
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            {currentExampleIndex + 1} de 3 cenários
          </p>
        </div>

      </div>

      {isCompleted && (() => {
        // Calcular monthlySavings de forma segura
        let monthlySavings = 0;
        const cost = userGoal.cost ? parseFloat(userGoal.cost) : 0;
        const available = userGoal.available ? parseFloat(userGoal.available) : 0;
        const months = userGoal.months ? parseInt(userGoal.months) : 0;
        
        if (cost > 0 && months > 0) {
          if (available > 0) {
            const remaining = cost - available;
            if (remaining > 0) {
              monthlySavings = Math.round(remaining / months);
            } else {
              monthlySavings = 0;
            }
          } else {
            monthlySavings = Math.round(cost / months);
          }
        }
        
        return (
          <div className="mt-6 p-6 bg-green-50 text-green-800 rounded-2xl text-center shadow-lg border-2 border-green-200">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold mb-2">{lesson.content.successMessage}</h3>
            <p className="text-sm">
              Sua meta: {userGoal.item || 'seu objetivo'}{cost > 0 ? ` - R$ ${cost.toFixed(2)}` : ''}{months > 0 ? ` em ${months} meses` : ''}
            </p>
            {(() => {
              // Verificar se é uma lição de redução de gastos (tem "reduzir" no contexto)
              const isReductionGoal = lesson.content.scenario?.toLowerCase().includes('reduzir') || 
                                      lesson.content.scenario?.toLowerCase().includes('economia') ||
                                      lesson.title?.toLowerCase().includes('decisões financeiras');
              
              if (cost > 0 && months > 0) {
                if (isReductionGoal) {
                  // Para metas de redução: mostrar economia mensal e total
                  const totalSavings = cost * months;
                  return (
                    <>
                      <p className="text-sm font-semibold mt-2">
                        Você economizará R$ {cost.toFixed(2)} por mês!
                      </p>
                      <p className="text-sm font-semibold mt-1">
                        Economia total em {months} meses: R$ {totalSavings.toFixed(2)}!
                      </p>
                    </>
                  );
                } else {
                  // Para outras metas: mostrar quanto precisa guardar por mês
                  const calculated = monthlySavings > 0 ? monthlySavings : Math.round(cost / months);
                  return (
                    <p className="text-sm font-semibold mt-2">
                      Você precisará guardar R$ {calculated},00 por mês!
                    </p>
                  );
                }
              }
              return null;
            })()}
            {selectedCategory && (
              <p className="text-sm mt-1">
                Categoria: {selectedCategory.name}
              </p>
            )}
          </div>
        );
      })()}
    </LessonLayout>
  );
};

export default GoalsLesson;
