import React, { useState, useEffect } from 'react';
import LessonLayout from './LessonLayout';

const GoalsLesson = ({ lesson, onComplete, onExit }) => {
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [userGoal, setUserGoal] = useState({
    item: '',
    cost: '',
    months: '',
    category: ''
  });
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [exampleResults, setExampleResults] = useState({});
  const [currentExampleInput, setCurrentExampleInput] = useState('');

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
    if (userGoal.item && userGoal.cost && userGoal.months && userGoal.category) {
      const monthlySavings = Math.round(parseFloat(userGoal.cost) / parseInt(userGoal.months));
      
      setIsCompleted(true);
      
      setTimeout(() => {
        onComplete({
          score: 100,
          timeSpent,
          isPerfect: true,
          userGoal: {
            ...userGoal,
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4 font-sans">
          {lesson.content.scenario}
        </h2>
        <p className="text-gray-600 font-sans">
          Resolva os exemplos e depois crie sua própria meta!
        </p>
      </div>


      <div className="space-y-6">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-blue-800">
              {currentExampleIndex < 2 ? `Cenário ${currentExampleIndex + 1} (${currentExample.character})` : 'Cenário 3 (Sua Meta)'}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handlePreviousExample}
                disabled={currentExampleIndex === 0}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  currentExampleIndex === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                ← Anterior
              </button>
              <button
                onClick={handleNextExample}
                disabled={currentExampleIndex === 2}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  currentExampleIndex === 2
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Próximo →
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {currentExampleIndex < 2 ? (
              // Cenários 1 e 2 - cálculos para resolver
              <>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Situação:</h4>
                  <p className="text-gray-700">{currentExample.scenario}</p>
                  {currentExample.category && (
                    <div className="mt-2">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {lesson.content.goalCategories.find(cat => cat.id === currentExample.category)?.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Área interativa para o aluno resolver */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-3">🎯 Sua vez! Calcule:</h4>
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="number"
                      placeholder="Digite sua resposta..."
                      value={currentExampleInput}
                      onChange={(e) => handleExampleInputChange(e.target.value)}
                      className="flex-1 p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      disabled={currentExampleResult}
                    />
                    <button
                       onClick={handleCheckExample}
                       disabled={!currentExampleInput || currentExampleResult}
                       className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
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
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-4">🎯 Primeiro, escolha uma categoria para sua meta:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {lesson.content.goalCategories.map((category) => (
                        <div
                          key={category.id}
                          onClick={() => handleCategorySelect(category)}
                          className="bg-white rounded-lg shadow-md border border-gray-200 p-4 cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                          <div className="text-center">
                            <div className="text-3xl mb-2">{category.icon}</div>
                            <h5 className="font-bold text-gray-800 mb-1">{category.name}</h5>
                            <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                            <div className="bg-gray-50 rounded p-2">
                              <h6 className="font-semibold text-gray-700 text-xs mb-1">Exemplos:</h6>
                              <ul className="text-xs text-gray-600 space-y-1">
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
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-purple-800">🎯 Defina sua meta:</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Categoria:</span>
                        <span className="text-purple-800 font-semibold text-sm">
                          {selectedCategory.name}
                        </span>
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          Trocar
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {lesson.content.inputFields.filter(field => field.type !== 'select').map((field, index) => (
                        <div key={index}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label}
                          </label>
                          <input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={
                              field.label.includes('O que você quer comprar') || field.label.includes('Qual produto') || field.label.includes('Para onde') || field.label.includes('Qual investimento') || field.label.includes('Qual empresa') || field.label.includes('Qual estratégia') || field.label.includes('Qual gasto') || field.label.includes('Qual hábito') || field.label.includes('Qual causa') ? (userGoal.item || '') :
                              field.label.includes('Quanto custa') || field.label.includes('Qual seu orçamento') || field.label.includes('Quanto quer gastar') || field.label.includes('Quanto quer investir') || field.label.includes('Quanto quer economizar') || field.label.includes('Quanto quer doar') ? (userGoal.cost || '') :
                              field.label.includes('Em quantos meses') || field.label.includes('Em quanto tempo') || field.label.includes('Por quantos meses') || field.label.includes('Por quantos anos') ? (userGoal.months || '') : ''
                            }
                            onChange={(e) => handleInputChange(
                              field.label.includes('O que você quer comprar') || field.label.includes('Qual produto') || field.label.includes('Para onde') || field.label.includes('Qual investimento') || field.label.includes('Qual empresa') || field.label.includes('Qual estratégia') || field.label.includes('Qual gasto') || field.label.includes('Qual hábito') || field.label.includes('Qual causa') ? 'item' :
                              field.label.includes('Quanto custa') || field.label.includes('Qual seu orçamento') || field.label.includes('Quanto quer gastar') || field.label.includes('Quanto quer investir') || field.label.includes('Quanto quer economizar') || field.label.includes('Quanto quer doar') ? 'cost' : 'months', 
                              e.target.value
                            )}
                            className="w-full p-3 border border-purple-300 rounded-lg focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Cálculo automático em tempo real */}
                    {userGoal.cost && userGoal.months && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-2">📊 Seu plano de poupança:</h4>
                        <p className="text-blue-700">
                          Para comprar <strong>{userGoal.item || 'seu objetivo'}</strong> por R$ {userGoal.cost} em {userGoal.months} meses,
                          você precisará guardar <strong>R$ {Math.round(parseFloat(userGoal.cost) / parseInt(userGoal.months))},00 por mês</strong>.
                        </p>
                        <p className="text-blue-600 text-sm mt-2">
                          Categoria: <strong>{selectedCategory.name}</strong>
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleSubmitGoal}
                      disabled={!userGoal.item || !userGoal.cost || !userGoal.months}
                      className={`w-full mt-4 py-3 px-6 rounded-lg font-bold text-lg transition-all duration-300 ${
                        userGoal.item && userGoal.cost && userGoal.months
                          ? 'bg-primary text-white shadow-lg transform hover:scale-105'
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

      {isCompleted && (
        <div className="mt-6 p-6 bg-green-50 text-green-800 rounded-2xl text-center shadow-lg border-2 border-green-200">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-xl font-bold mb-2">{lesson.content.successMessage}</h3>
          <p className="text-sm">
            Sua meta: {userGoal.item} - R$ {userGoal.cost} em {userGoal.months} meses
          </p>
          <p className="text-sm font-semibold mt-2">
            Você precisará guardar R$ {Math.round(parseFloat(userGoal.cost) / parseInt(userGoal.months))} por mês!
          </p>
          {selectedCategory && (
            <p className="text-sm mt-1">
              Categoria: {selectedCategory.name}
            </p>
          )}
        </div>
      )}
    </LessonLayout>
  );
};

export default GoalsLesson;
