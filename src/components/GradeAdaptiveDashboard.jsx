import React from 'react';

// Componente de exemplo para mostrar como o dashboard se adaptaria
const GradeAdaptiveDashboard = ({ user, gradeId }) => {
  // Configurações por série
  const gradeConfigs = {
    '6º Ano': {
      title: 'Fundamentos Financeiros',
      description: 'Aprenda os conceitos básicos sobre dinheiro e finanças',
      modules: [
        'Introdução ao Dinheiro',
        'Matemática Financeira Básica',
        'Consciência Financeira',
        'Projetos Práticos'
      ],
      color: 'from-orange-500 to-yellow-500',
      icon: '💰'
    },
    '7º Ano': {
      title: 'Matemática Financeira Intermediária',
      description: 'Desenvolva habilidades de cálculo e planejamento financeiro',
      modules: [
        'Porcentagens e Juros',
        'Orçamento Pessoal',
        'Investimentos Básicos',
        'Projetos de Economia'
      ],
      color: 'from-blue-500 to-cyan-500',
      icon: '📊'
    },
    '8º Ano': {
      title: 'Planejamento Financeiro',
      description: 'Aprenda a planejar e gerenciar suas finanças',
      modules: [
        'Planejamento de Metas',
        'Economia Doméstica',
        'Investimentos Intermediários',
        'Projetos de Sustentabilidade'
      ],
      color: 'from-green-500 to-emerald-500',
      icon: '🎯'
    },
    '9º Ano': {
      title: 'Finanças Avançadas',
      description: 'Domine conceitos avançados de finanças pessoais',
      modules: [
        'Investimentos Avançados',
        'Empreendedorismo',
        'Economia Global',
        'Projetos de Impacto'
      ],
      color: 'from-purple-500 to-pink-500',
      icon: '🚀'
    },
    '1º Ano EM': {
      title: 'Economia e Mercado',
      description: 'Entenda o funcionamento da economia e mercados',
      modules: [
        'Microeconomia',
        'Macroeconomia',
        'Mercado Financeiro',
        'Projetos Empresariais'
      ],
      color: 'from-red-500 to-orange-500',
      icon: '📈'
    },
    '2º Ano EM': {
      title: 'Finanças Corporativas',
      description: 'Aprenda sobre finanças empresariais e corporativas',
      modules: [
        'Análise Financeira',
        'Gestão de Riscos',
        'Financiamento',
        'Projetos Corporativos'
      ],
      color: 'from-indigo-500 to-blue-500',
      icon: '🏢'
    },
    '3º Ano EM': {
      title: 'Finanças Pessoais e Profissionais',
      description: 'Prepare-se para a vida financeira adulta',
      modules: [
        'Planejamento de Carreira',
        'Finanças Pessoais Avançadas',
        'Preparação para Universidade',
        'Projetos de Vida'
      ],
      color: 'from-teal-500 to-green-500',
      icon: '🎓'
    }
  };

  const config = gradeConfigs[gradeId] || gradeConfigs['6º Ano'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header da Série */}
      <div className={`bg-gradient-to-r ${config.color} text-white p-8`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-4xl">{config.icon}</span>
            <div>
              <h1 className="text-3xl font-bold">{gradeId}</h1>
              <h2 className="text-xl font-semibold">{config.title}</h2>
            </div>
          </div>
          <p className="text-lg opacity-90">{config.description}</p>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-6xl mx-auto p-8">
        {/* Módulos da Série */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {config.modules.map((module, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
              <div className="text-center">
                <div className="text-2xl mb-2">📚</div>
                <h3 className="font-semibold text-gray-800 mb-2">Módulo {index + 1}</h3>
                <p className="text-sm text-gray-600">{module}</p>
                <div className="mt-4">
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    Em desenvolvimento
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Informações do Aluno */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Informações do Aluno</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">👤</div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-sm text-gray-600">{gradeId}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold">Nível {user.progress?.level || 1}</div>
              <div className="text-sm text-gray-600">XP: {user.progress?.xp || 0}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">💰</div>
              <div className="font-semibold">{user.progress?.yuCoins || 0}</div>
              <div className="text-sm text-gray-600">YüCoins</div>
            </div>
          </div>
        </div>

        {/* Navegação entre Níveis */}
        <div className="mt-8 flex justify-center space-x-4">
          <button className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
            ⬅️ Nível Anterior
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary-dark hover:to-secondary transition-colors">
            Próximo Nível ➡️
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradeAdaptiveDashboard;



