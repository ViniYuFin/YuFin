import React, { useState, useEffect, useMemo } from 'react';
import LessonLayout from './LessonLayout';

const BudgetDistributionLesson = ({ lesson, onComplete, onExit }) => {
  const [allocatedBudgets, setAllocatedBudgets] = useState({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [completedScenarios, setCompletedScenarios] = useState(new Set());
  const [scenarioResults, setScenarioResults] = useState({});
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

  // Extrair orçamento total da estrutura da lição
  const getTotalBudget = () => {
    // Se tiver cenário selecionado, usar o orçamento do cenário
    if (selectedScenario?.totalBudget) {
      return selectedScenario.totalBudget;
    }
    
    // Se tiver gameConfig.totalBudget, usar
    if (lesson.content?.gameConfig?.totalBudget) {
      return lesson.content.gameConfig.totalBudget;
    }
    
    // Se tiver totalBudget direto, usar
    if (lesson.content?.totalBudget) {
      return lesson.content.totalBudget;
    }
    
    // Se tiver budget direto, usar
    if (lesson.content?.budget) {
      return lesson.content.budget;
    }
    
    // Fallback: tentar extrair do scenario
    if (lesson.content?.scenario) {
      const match = lesson.content.scenario.match(/R\$ (\d+),00/);
      return match ? parseInt(match[1]) : 5000;
    }
    
    return 5000; // Valor padrão
  };

  const totalBudget = getTotalBudget();

  // Aplicar ajustes do cenário selecionado
  const getAdjustedCategory = (category) => {
    if (!selectedScenario || !selectedScenario.adjustments) {
      return category;
    }

    const adjustment = selectedScenario.adjustments[category.id];
    if (!adjustment) {
      return category;
    }

    return {
      ...category,
      suggestedAmount: Math.round(category.suggestedAmount * adjustment.multiplier),
      suggestedPercentage: Math.round(category.suggestedPercentage * adjustment.multiplier)
    };
  };

  // Agrupar categorias por tipo baseado no cenário selecionado (memoizado)
  const categoryGroups = useMemo(() => {
    if (!selectedScenario || !lesson.content?.categories) return {};

    // Lições que devem usar card único (mais avançadas, sem divisão Necessidades/Desejos)
    const singleCardLessons = [
      "Orçamento de Viagem",           // 6º Ano - Foco em planejamento de viagem
      "Meu Primeiro Orçamento",        // 7º Ano - Orçamento pessoal simples
      "Análise de fluxo de caixa",     // 9º Ano - Análise empresarial
      "Gestão de risco de portfólio"   // 2º Ano EM - Investimentos
    ];
    
    if (singleCardLessons.includes(lesson.title)) {
      const cardConfig = {
        "Orçamento de Viagem": { label: 'Planejamento', icon: '✈️' },
        "Meu Primeiro Orçamento": { label: 'Meu Orçamento', icon: '💰' },
        "Análise de fluxo de caixa": { label: 'Fluxo de Caixa', icon: '📊' },
        "Gestão de risco de portfólio": { label: 'Portfólio', icon: '📈' }
      };
      
      const config = cardConfig[lesson.title];
      const groups = {
        single: { categories: [], total: 0, maxTotal: 0, label: config.label, icon: config.icon }
      };
      
      // Adicionar todas as categorias ao grupo único
      lesson.content.categories.forEach(category => {
        const allocated = allocatedBudgets[category.name] || 0;
        groups.single.categories.push({ ...category, allocated });
        groups.single.total += allocated;
      });
      
      // Definir limite total do orçamento
      groups.single.maxTotal = totalBudget;
      
      return groups;
    }

    const groups = {
      necessidades: { categories: [], total: 0, maxTotal: 0, label: 'Necessidades', icon: '🏠' },
      desejos: { categories: [], total: 0, maxTotal: 0, label: 'Desejos/Lazer', icon: '🎯' },
      poupanca: { categories: [], total: 0, maxTotal: 0, label: 'Poupança/Investimentos', icon: '💰' },
      doacoes: { categories: [], total: 0, maxTotal: 0, label: 'Doações/Legado', icon: '🤝' }
    };

    // Definir grupos baseado nos adjustments do cenário selecionado
    if (selectedScenario.adjustments) {
      // Usar os adjustments do cenário selecionado
      Object.keys(selectedScenario.adjustments).forEach(grupoKey => {
        const ajuste = selectedScenario.adjustments[grupoKey];
        const porcentagem = ajuste.maxPercentage / 100;
        
        if (grupoKey === 'Necessidades') {
          groups.necessidades.maxTotal = Math.round(totalBudget * porcentagem);
        } else if (grupoKey === 'Desejos/Lazer') {
          groups.desejos.maxTotal = Math.round(totalBudget * porcentagem);
        } else if (grupoKey === 'Poupança/Investimentos') {
          groups.poupanca.maxTotal = Math.round(totalBudget * porcentagem);
        } else if (grupoKey === 'Doações/Legado') {
          groups.doacoes.maxTotal = Math.round(totalBudget * porcentagem);
        }
      });
    } else {
      // Fallback para lições sem adjustments (usar método padrão 50/30/20)
      groups.necessidades.maxTotal = Math.round(totalBudget * 0.5); // 50%
      groups.desejos.maxTotal = Math.round(totalBudget * 0.3); // 30%
      groups.poupanca.maxTotal = Math.round(totalBudget * 0.2); // 20%
    }

    // Classificar categorias nos grupos
    lesson.content.categories.forEach(category => {
      const allocated = allocatedBudgets[category.name] || 0;
      
      // Para "O Orçamento da Família", sempre classificar baseado no nome da categoria
      if (lesson.title === "O Orçamento da Família") {
        if (['alimentacao', 'moradia', 'transporte', 'saude'].includes(category.id)) {
          groups.necessidades.categories.push({ ...category, allocated });
          groups.necessidades.total += allocated;
        } else if (['educacao', 'lazer'].includes(category.id)) {
          groups.desejos.categories.push({ ...category, allocated });
          groups.desejos.total += allocated;
        } else {
          // Qualquer outra categoria vai para poupança/investimentos
          groups.poupanca.categories.push({ ...category, allocated });
          groups.poupanca.total += allocated;
        }
      } else if (selectedScenario.adjustments && category.group) {
        // Para outras lições com adjustments, usar o grupo da categoria
        if (category.group === 'Necessidades') {
          groups.necessidades.categories.push({ ...category, allocated });
          groups.necessidades.total += allocated;
        } else if (category.group === 'Desejos/Lazer') {
          groups.desejos.categories.push({ ...category, allocated });
          groups.desejos.total += allocated;
        } else if (category.group === 'Poupança/Investimentos') {
          groups.poupanca.categories.push({ ...category, allocated });
          groups.poupanca.total += allocated;
        } else if (category.group === 'Doações/Legado') {
          groups.doacoes.categories.push({ ...category, allocated });
          groups.doacoes.total += allocated;
        }
      } else if (!selectedScenario.adjustments) {
        // Para outras lições sem adjustments, classificar por prioridade ou nome
        if (category.priority === 'high' || ['alimentacao', 'moradia', 'transporte', 'saude', 'educacao', 'hospedagem', 'necessidades', 'essenciais', 'operacional'].includes(category.id)) {
          groups.necessidades.categories.push({ ...category, allocated });
          groups.necessidades.total += allocated;
        } else if (category.priority === 'medium' || ['lazer', 'atracoes', 'brinquedos', 'presentes', 'marketing', 'pesquisa'].includes(category.id)) {
          groups.desejos.categories.push({ ...category, allocated });
          groups.desejos.total += allocated;
        } else if (category.priority === 'low' || ['poupanca', 'investimentos', 'reserva', 'emergencia', 'renda-fixa', 'acoes', 'fundos', 'alternativos'].includes(category.id)) {
          groups.poupanca.categories.push({ ...category, allocated });
          groups.poupanca.total += allocated;
        } else {
          // Fallback: adicionar ao grupo de necessidades
          groups.necessidades.categories.push({ ...category, allocated });
          groups.necessidades.total += allocated;
        }
      }
    });

    // Para "O Orçamento da Família", garantir que sempre tenha uma categoria de poupança/investimentos
    if (lesson.title === "O Orçamento da Família" && groups.poupanca.categories.length === 0) {
      const poupancaCategory = {
        id: 'poupanca',
        name: 'Poupança/Investimentos',
        description: 'Reserva de emergência, investimentos e poupança',
        icon: '💰',
        priority: 'low',
        group: 'Poupança/Investimentos',
        allocated: allocatedBudgets['Poupança/Investimentos'] || 0
      };
      groups.poupanca.categories.push(poupancaCategory);
      groups.poupanca.total += poupancaCategory.allocated;
    }

    // Para "O Orçamento da Família", substituir todas as categorias de poupança por "Investimentos"
    if (lesson.title === "O Orçamento da Família") {
      // Limpar categorias existentes de poupança
      groups.poupanca.categories = [];
      groups.poupanca.total = 0;
      
      // Adicionar apenas a categoria "Investimentos"
      const investimentosCategory = {
        id: 'investimentos',
        name: 'Investimentos',
        description: 'Poupança, investimentos, reserva',
        icon: '📈',
        priority: 'low',
        group: 'Poupança/Investimentos',
        allocated: allocatedBudgets['Investimentos'] || 0
      };
      groups.poupanca.categories.push(investimentosCategory);
      groups.poupanca.total += investimentosCategory.allocated;
    }
    
    // Para "Previdência e Aposentadoria", garantir que as categorias apareçam
    if (lesson.title === "Previdência e Aposentadoria") {
      // Se não há categorias em nenhum grupo, adicionar categorias padrão
      const totalCategories = Object.values(groups).reduce((sum, group) => sum + group.categories.length, 0);
      
      if (totalCategories === 0) {
        // Adicionar categorias padrão para Previdência e Aposentadoria
        const previdenciaCategories = [
          {
            id: 'previdencia',
            name: 'Previdência',
            description: 'Contribuições para aposentadoria',
            icon: '🏦',
            priority: 'high',
            group: 'Necessidades',
            allocated: allocatedBudgets['Previdência'] || 0
          },
          {
            id: 'aposentadoria',
            name: 'Aposentadoria',
            description: 'Reserva para aposentadoria',
            icon: '👴',
            priority: 'high',
            group: 'Necessidades',
            allocated: allocatedBudgets['Aposentadoria'] || 0
          }
        ];
        
        previdenciaCategories.forEach(category => {
          groups.necessidades.categories.push(category);
          groups.necessidades.total += category.allocated;
        });
      }
    }

    return groups;
  }, [selectedScenario, allocatedBudgets, totalBudget, lesson.content?.categories]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleBudgetChange = (categoryName, value) => {
    // Permitir campo vazio durante digitação
    if (value === '' || value === null || value === undefined) {
      setAllocatedBudgets(prev => ({
        ...prev,
        [categoryName]: 0
      }));
      return;
    }
    
    // Converter para número, mas manter o valor exato digitado
    const numValue = parseInt(value, 10);
    
    // Só atualizar se for um número válido
    if (!isNaN(numValue) && numValue >= 0) {
      setAllocatedBudgets(prev => ({
        ...prev,
        [categoryName]: numValue
      }));
    }
  };

  const handleSubmit = () => {
    const totalAllocated = Object.values(allocatedBudgets).reduce((sum, value) => sum + value, 0);
    const isWithinBudget = totalAllocated <= totalBudget && totalAllocated > 0;
    
    // Verificar critérios de sucesso baseados nos grupos
    const groups = categoryGroups;
    let isPerfect = true;
    let groupViolations = [];
    let emptyCategories = [];
    
    // Verificar se cada categoria tem pelo menos R$ 1,00
    Object.entries(groups).forEach(([groupKey, group]) => {
      group.categories.forEach(category => {
        if (!category.allocated || category.allocated < 1) {
          isPerfect = false;
          emptyCategories.push(category.name);
        }
      });
    });
    
    // Verificar se cada grupo está dentro dos limites
    const multipleGroupLessons = [
      "Orçamento familiar avançado", 
      "Planejamento financeiro pessoal",
      "Planejamento financeiro familiar avançado",
      "Planejamento financeiro corporativo",
      "Planejamento financeiro estratégico"
    ];
    
    if (selectedScenario?.adjustments || multipleGroupLessons.includes(lesson.title)) {
      Object.entries(groups).forEach(([groupKey, group]) => {
        if (group.maxTotal > 0 && group.total > group.maxTotal) {
          isPerfect = false;
          groupViolations.push(`${group.label} (R$ ${group.total} > R$ ${group.maxTotal})`);
        }
      });
    }
    
    // Para lições de card único, verificar se não excedeu o orçamento total
    const singleCardLessons = [
      "Orçamento de Viagem",
      "Meu Primeiro Orçamento", 
      "Análise de fluxo de caixa",
      "Gestão de risco de portfólio",
      "Planejamento financeiro corporativo",
      "Planejamento financeiro estratégico"
    ];
    
    if (singleCardLessons.includes(lesson.title) && totalAllocated > totalBudget) {
      isPerfect = false;
      const cardLabels = {
        "Orçamento de Viagem": "Planejamento",
        "Meu Primeiro Orçamento": "Meu Orçamento",
        "Análise de fluxo de caixa": "Fluxo de Caixa",
        "Gestão de risco de portfólio": "Portfólio",
        "Planejamento financeiro corporativo": "Orçamento Corporativo",
        "Planejamento financeiro estratégico": "Estratégia Financeira"
      };
      groupViolations.push(`${cardLabels[lesson.title]} (R$ ${totalAllocated} > R$ ${totalBudget})`);
    }
    
    // Verificar se usou pelo menos 90% do orçamento
    if (totalAllocated < totalBudget * 0.9) {
      isPerfect = false;
    }
    
    const correct = isWithinBudget && isPerfect;
    const score = correct ? 100 : Math.max(0, 100 - Math.abs(totalAllocated - totalBudget) * 2);
    
    setIsCorrect(correct);
    setShowFeedback(true);
    
    // Se o cenário foi completado com sucesso, marcar como concluído
    if (correct && selectedScenario) {
      setCompletedScenarios(prev => new Set([...prev, selectedScenario.id]));
      setScenarioResults(prev => ({
        ...prev,
        [selectedScenario.id]: {
          scenario: selectedScenario,
          score,
          totalAllocated,
          groups
        }
      }));
    }
    
    // Feedback baseado na distribuição por grupos
    if (correct) {
      if (lesson.content.scenarios && lesson.content.scenarios.length > 1) {
        const remainingScenarios = lesson.content.scenarios.filter(s => !completedScenarios.has(s.id) && s.id !== selectedScenario.id);
        if (remainingScenarios.length > 0) {
          setFeedbackMessage(`Excelente! Cenário "${selectedScenario.title}" concluído! Ainda faltam ${remainingScenarios.length} cenário(s) para completar a lição.`);
        } else {
          setFeedbackMessage(`Parabéns! Você completou todos os cenários! A lição está concluída.`);
        }
      } else {
        setFeedbackMessage(`Excelente! Cenário "${selectedScenario.title}" concluído! A lição está concluída.`);
      }
    } else if (emptyCategories.length > 0) {
      setFeedbackMessage(`Você precisa alocar pelo menos R$ 1,00 em cada categoria! Categorias vazias: ${emptyCategories.join(', ')}`);
    } else if (totalAllocated > totalBudget) {
      setFeedbackMessage(`Você ultrapassou o orçamento! Distribuiu R$ ${totalAllocated.toLocaleString('pt-BR')},00 de R$ ${totalBudget.toLocaleString('pt-BR')},00. Tente reduzir alguns gastos.`);
    } else if (totalAllocated === 0) {
      setFeedbackMessage(`Você precisa distribuir o orçamento! Planeje como gastar os R$ ${totalBudget.toLocaleString('pt-BR')},00 entre as categorias.`);
    } else if (groupViolations.length > 0) {
      setFeedbackMessage(`Ajuste necessário! Grupos que excederam o limite: ${groupViolations.join(', ')}`);
    } else if (selectedScenario?.adjustments) {
      setFeedbackMessage(`Você distribuiu R$ ${totalAllocated.toLocaleString('pt-BR')},00 de R$ ${totalBudget.toLocaleString('pt-BR')},00. Tente usar mais do orçamento disponível!`);
    } else {
      setFeedbackMessage(`Excelente! Você distribuiu R$ ${totalAllocated.toLocaleString('pt-BR')},00 de R$ ${totalBudget.toLocaleString('pt-BR')},00. Distribuição equilibrada!`);
    }
  };

  const handleContinue = () => {
    // Verificar se todos os cenários foram completados
    const allScenariosCompleted = lesson.content.scenarios && lesson.content.scenarios.every(scenario => completedScenarios.has(scenario.id));
    
    if (allScenariosCompleted) {
      // Calcular score médio de todos os cenários
      const totalScore = Object.values(scenarioResults).reduce((sum, result) => sum + result.score, 0);
      const averageScore = totalScore / Object.keys(scenarioResults).length;
      
      onComplete({
        score: Math.round(averageScore),
        timeSpent,
        isPerfect: averageScore >= 90,
        feedback: `Lição concluída! Você completou todos os ${lesson.content.scenarios.length} cenário(s) com uma pontuação média de ${Math.round(averageScore)} pontos.`,
        scenarioResults: scenarioResults
      });
    } else {
      // Limpar estado para próximo cenário
      setAllocatedBudgets({});
      setShowFeedback(false);
      setFeedbackMessage('');
      setIsCorrect(false);
      setSelectedScenario(null);
    }
  };

  const totalAllocated = Object.values(allocatedBudgets).reduce((sum, value) => sum + value, 0);
  const remaining = totalBudget - totalAllocated;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
      <LessonLayout
        title={lesson.title}
        timeSpent={timeSpent}
        onExit={onExit}
        icon="💰"
      >
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {lesson.content.scenario || 'Distribua o orçamento mensal da família'}
          </h2>
          <div className="text-gray-600 mb-6">
            {lesson.content.instructions && Array.isArray(lesson.content.instructions) ? (
              <ul className="text-left max-w-2xl mx-auto space-y-2">
                {lesson.content.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{lesson.content.instructions || 'Distribua o dinheiro entre as diferentes categorias respeitando os limites:'}</p>
            )}
          </div>
          
          {/* Seletor de Cenários */}
          {lesson.content?.scenarios && lesson.content.scenarios.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-800">Escolha um cenário:</h3>
                <div className="text-sm text-gray-600">
                  Progresso: {completedScenarios.size}/{lesson.content.scenarios?.length || 0} cenários
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {lesson.content.scenarios.map((scenario, index) => {
                  const getScenarioColors = (classLevel) => {
                    // Usar cores uniformes para todos os cenários
                    return {
                      selected: 'border-primary bg-primary/10 text-primary',
                      unselected: 'border-gray-200 bg-white hover:border-gray-300',
                      completed: 'border-green-500 bg-green-50 text-green-700'
                    };
                  };
                  
                  const colors = getScenarioColors(scenario.classLevel);
                  const isCompleted = completedScenarios.has(scenario.id);
                  const isSelected = selectedScenario?.id === scenario.id;
                  
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => {
                        if (selectedScenario?.id === scenario.id) {
                          // Se clicou no mesmo cenário, limpar seleção
                          setSelectedScenario(null);
                          setAllocatedBudgets({});
                        } else {
                          // Se clicou em um cenário diferente, selecionar
                          setSelectedScenario(scenario);
                        }
                      }}
                      className={`p-4 rounded-lg border-2 text-left transition-all h-full flex flex-col ${
                        isCompleted
                          ? colors.completed
                          : isSelected
                          ? colors.selected
                          : colors.unselected
                      }`}
                    >
                      <h4 className="font-bold text-sm mb-3 h-8 flex items-center">{scenario.title}</h4>
                      <div className="text-xs text-gray-600 space-y-2 flex-1">
                        <p className="font-medium leading-tight">{scenario.description.split(' - ')[0]}</p>
                        <p className="text-gray-500 leading-tight">{scenario.description.split(' - ')[1]}</p>
                      </div>
                      {isCompleted && (
                        <div className="mt-3 text-xs text-green-600 font-medium h-4 flex items-center">
                          Concluído
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Oportunidades Disponíveis - só aparece quando cenário está selecionado */}
          {selectedScenario && selectedScenario.opportunities && (
            <div 
              className="p-4 rounded-lg mb-6 border"
              style={{
                backgroundColor: darkMode ? '#374151' : '#f9fafb',
                borderColor: darkMode ? '#4b5563' : '#e5e7eb'
              }}
            >
              <h3 
                className="font-bold text-lg mb-3"
                style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
              >
                🎯 Oportunidades Disponíveis para {selectedScenario.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedScenario.opportunities.map((opportunity, index) => (
                  <div 
                    key={index} 
                    className="flex items-center text-sm"
                    style={{ color: darkMode ? '#e5e7eb' : '#374151' }}
                  >
                    <span className="mr-2">✓</span>
                    <span>{opportunity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      <div className="space-y-6 mb-6">
        {selectedScenario && lesson.content?.categories && lesson.content.categories.length > 0 && (
          <div className="animate-fadeIn">
            {(() => {
              const groups = categoryGroups;
              return Object.entries(groups).map(([groupKey, group]) => {
                // Para "O Orçamento da Família", não renderizar doações
                if (lesson.title === "O Orçamento da Família" && groupKey === 'doacoes') {
                  return null;
                }
                // Para "O Orçamento da Família", sempre renderizar os outros grupos
                if (lesson.title === "O Orçamento da Família") {
                  // Renderizar mesmo se estiver vazio
                } else if (group.categories.length === 0) {
                  return null;
                }
                
                const singleCardLessons = [
                  "Orçamento de Viagem",
                  "Meu Primeiro Orçamento", 
                  "Análise de fluxo de caixa",
                  "Gestão de risco de portfólio"
                ];
                
                const multipleGroupLessons = [
                  "O Orçamento da Família",
                  "Orçamento familiar avançado", 
                  "Planejamento financeiro pessoal",
                  "Planejamento financeiro familiar avançado",
                  "Planejamento financeiro corporativo",
                  "Planejamento financeiro estratégico"
                ];
                
                const groupColor = (lesson.title === "O Orçamento da Família") ? 'border-gray-200 bg-white' :
                                 (selectedScenario?.adjustments && group.total > group.maxTotal) ? 'border-red-300 bg-red-50' : 
                                 (selectedScenario?.adjustments && group.total === group.maxTotal) ? 'border-green-300 bg-green-50' : 
                                 (multipleGroupLessons.includes(lesson.title) && group.total > group.maxTotal) ? 'border-red-300 bg-red-50' :
                                 (multipleGroupLessons.includes(lesson.title) && group.total === group.maxTotal) ? 'border-green-300 bg-green-50' :
                                 (singleCardLessons.includes(lesson.title) && group.total > group.maxTotal) ? 'border-red-300 bg-red-50' :
                                 'border-gray-200 bg-white';
                
                return (
                  <div 
                    key={groupKey} 
                    className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg`}
                    style={{
                      backgroundColor: darkMode ? '#374151' : '#ffffff',
                      borderColor: darkMode ? '#4b5563' : '#e5e7eb'
                    }}
                  >
                    {/* Header do Grupo */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <span className="text-3xl mr-4">{group.icon}</span>
                        <div>
                          <h3 
                            className="text-xl font-bold"
                            style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                          >
                            {group.label}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span 
                              className="text-sm"
                              style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                            >
                              R$ {group.total.toLocaleString('pt-BR')},00
                            </span>
                            {(() => {
                              const singleCardLessons = [
                                "Orçamento de Viagem",
                                "Meu Primeiro Orçamento", 
                                "Análise de fluxo de caixa",
                                "Gestão de risco de portfólio",
                                "Planejamento financeiro corporativo",
                                "Planejamento financeiro estratégico"
                              ];
                              
                              const multipleGroupLessons = [
                                "O Orçamento da Família",
                                "Orçamento familiar avançado", 
                                "Planejamento financeiro pessoal",
                                "Planejamento financeiro familiar avançado",
                                "Planejamento financeiro corporativo",
                                "Planejamento financeiro estratégico"
                              ];
                              
                              if (lesson.title === "O Orçamento da Família" ||
                                  singleCardLessons.includes(lesson.title) || 
                                  multipleGroupLessons.includes(lesson.title) || 
                                  selectedScenario?.adjustments) {
                                return (
                                  <>
                                    <span className="text-gray-400">/</span>
                                    <span 
                                      className="text-sm font-semibold"
                                      style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                                    >
                                      R$ {group.maxTotal.toLocaleString('pt-BR')},00
                                    </span>
                                  </>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                          (lesson.title === "O Orçamento da Família") ? 'bg-gray-100 text-gray-700' :
                          (selectedScenario?.adjustments && group.total > group.maxTotal) ? 'bg-red-100 text-red-700' : 
                          (selectedScenario?.adjustments && group.total === group.maxTotal) ? 'bg-green-100 text-green-700' : 
                          (multipleGroupLessons.includes(lesson.title) && group.total > group.maxTotal) ? 'bg-red-100 text-red-700' :
                          (multipleGroupLessons.includes(lesson.title) && group.total === group.maxTotal) ? 'bg-green-100 text-green-700' :
                          (singleCardLessons.includes(lesson.title) && group.total > group.maxTotal) ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {(lesson.title === "O Orçamento da Família") ? 'Disponível' :
                           (selectedScenario?.adjustments && group.total > group.maxTotal) ? 'Excedeu' : 
                           (selectedScenario?.adjustments && group.total === group.maxTotal) ? 'Perfeito' : 
                           (multipleGroupLessons.includes(lesson.title) && group.total > group.maxTotal) ? 'Excedeu' :
                           (multipleGroupLessons.includes(lesson.title) && group.total === group.maxTotal) ? 'Perfeito' :
                           (singleCardLessons.includes(lesson.title) && group.total > group.maxTotal) ? 'Excedeu' :
                           'Disponível'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Categorias do Grupo */}
                    <div className="space-y-4">
                      {group.categories.map((category, index) => (
                        <div 
                          key={index} 
                          className={`p-4 rounded-lg border transition-colors ${
                            (!category.allocated || category.allocated < 1) 
                              ? 'border-red-300' 
                              : 'hover:border-gray-300'
                          }`}
                          style={{
                            backgroundColor: (!category.allocated || category.allocated < 1) 
                              ? (darkMode ? '#7f1d1d' : '#fef2f2')
                              : (darkMode ? '#4b5563' : '#ffffff'),
                            borderColor: (!category.allocated || category.allocated < 1) 
                              ? '#dc2626'
                              : (darkMode ? '#6b7280' : '#e5e7eb')
                          }}
                        >
                          <div className="flex items-center space-x-4 mb-3">
                            <span className="text-2xl">{category.icon}</span>
                            <div className="flex-1">
                              <h4 
                                className="font-semibold"
                                style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                              >
                                {category.name}
                              </h4>
                              <p 
                                className="text-sm mt-1"
                                style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                              >
                                {category.description}
                              </p>
                              {(!category.allocated || category.allocated < 1) && (
                                <p 
                                  className="text-xs mt-1 font-medium"
                                  style={{ color: '#dc2626' }}
                                >
                                  Mínimo: R$ 1,00
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span 
                              className="font-medium"
                              style={{ color: darkMode ? '#ffffff' : '#374151' }}
                            >
                              R$
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={category.allocated || ''}
                              onChange={(e) => handleBudgetChange(category.name, e.target.value)}
                              className={`w-32 px-3 py-2 border-2 rounded-lg focus:outline-none text-right font-medium ${
                                (!category.allocated || category.allocated < 1)
                                  ? 'border-red-300 focus:border-red-500'
                                  : 'border-gray-300 focus:border-primary'
                              }`}
                              style={{
                                backgroundColor: darkMode ? '#374151' : '#ffffff',
                                color: darkMode ? '#ffffff' : '#1f2937'
                              }}
                              placeholder="1"
                            />
                            <span 
                              className="font-medium"
                              style={{ color: darkMode ? '#ffffff' : '#374151' }}
                            >
                              ,00
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Resumo do Orçamento - só aparece quando cenário está selecionado */}
      {selectedScenario && (
        <div 
          className="mb-6 p-4 rounded-lg border"
          style={{
            backgroundColor: darkMode ? '#374151' : '#f9fafb',
            borderColor: darkMode ? '#4b5563' : '#e5e7eb'
          }}
        >
          <div className="flex justify-between items-center">
            <span 
              className="text-sm font-medium"
              style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
            >
              Total Distribuído:
            </span>
            <span className={`font-bold text-lg ${totalAllocated > totalBudget ? 'text-red-600' : 'text-green-600'}`}>
              R$ {totalAllocated.toLocaleString('pt-BR')},00
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span 
              className="text-sm font-medium"
              style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
            >
              Orçamento Total:
            </span>
            <span 
              className="font-bold text-lg"
              style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
            >
              R$ {totalBudget.toLocaleString('pt-BR')},00
            </span>
          </div>
          {remaining !== 0 && (
            <div className="flex justify-between items-center mt-1">
              <span 
                className="text-sm font-medium"
                style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
              >
                Restante:
              </span>
              <span className={`font-bold text-lg ${remaining < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                R$ {remaining.toLocaleString('pt-BR')},00
              </span>
            </div>
          )}
        </div>
      )}

      {showFeedback && (
        <div className={`p-4 rounded-lg mb-6 text-center ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <div className="text-2xl mb-2">{isCorrect ? '🎉' : '💡'}</div>
          <p className="font-semibold">{feedbackMessage}</p>
        </div>
      )}

      {selectedScenario && (
        !showFeedback ? (
          <button
            onClick={handleSubmit}
            disabled={totalAllocated === 0}
            className={`w-full py-3 rounded-lg font-bold text-lg transition-colors ${
              totalAllocated === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            Verificar Planejamento
          </button>
        ) : (
          <button
            onClick={handleContinue}
            className="w-full bg-primary text-white py-3 rounded-lg font-bold text-lg hover:bg-primary-dark transition-colors"
          >
            {lesson.content.scenarios && lesson.content.scenarios.every(scenario => completedScenarios.has(scenario.id)) 
              ? 'Concluir Lição' 
              : 'Próximo Cenário'
            }
          </button>
        )
      )}
      </LessonLayout>
    </>
  );
};

export default BudgetDistributionLesson;



