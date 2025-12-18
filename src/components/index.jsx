import React from 'react';
import DragAndDropLesson from './DragAndDropLesson';
import QuizLesson from './QuizLesson';
import ChoicesLesson from './ChoicesLesson';
import ClassifyLesson from './ClassifyLesson';
import MatchLesson from './MatchLesson';
import SimulationLesson from './SimulationLesson';
import InputLesson from './InputLesson';
import BudgetChoicesLesson from './BudgetChoicesLesson';
import ShoppingCartLesson from './ShoppingCartLesson';
import CategoriesSimulationLesson from './CategoriesSimulationLesson';
import MathProblemsLesson from './MathProblemsLesson';
import ShoppingSimulationLesson from './ShoppingSimulationLesson';
import PriceComparisonLesson from './PriceComparisonLesson';
import BudgetDistributionLesson from './BudgetDistributionLesson';
import ProgressGameLesson from './ProgressGameLesson';
import GoalsLesson from './GoalsLesson';

// Mapeamento de tipos de lição para componentes
export const lessonTypeComponents = {
  'drag-drop': DragAndDropLesson,
  'quiz': QuizLesson,
  'choices': ChoicesLesson,
  'classify': ClassifyLesson,
  'match': MatchLesson,
  'simulation': SimulationLesson,
  'input': InputLesson,
  // Novos componentes específicos
  'budget-choices': BudgetChoicesLesson,
  'shopping-cart': ShoppingCartLesson,
  'categories-simulation': CategoriesSimulationLesson,
  'math-problems': MathProblemsLesson,
  'shopping-simulation': ShoppingSimulationLesson,
  'price-comparison': PriceComparisonLesson,
  'price_comparison': PriceComparisonLesson,
  'budget-distribution': BudgetDistributionLesson,
  'budget_distribution': BudgetDistributionLesson,
  'progress-game': ProgressGameLesson,
  'progress_game': ProgressGameLesson,
  'goals': GoalsLesson
};

// Componente principal de lição
export const LessonRenderer = ({ lesson, onComplete, onExit, reviewMode }) => {
  const LessonComponent = lessonTypeComponents[lesson.type];
  
  if (!LessonComponent) {
    return (
      <div className="min-h-screen bg-interface flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Tipo de Lição Não Suportado</h2>
          <p className="text-gray-600 mb-4">Este tipo de lição ainda não foi implementado.</p>
          <button
            onClick={onExit}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <LessonComponent 
      lesson={lesson} 
      onComplete={onComplete} 
      onExit={onExit} 
      reviewMode={reviewMode}
    />
  );
}; 