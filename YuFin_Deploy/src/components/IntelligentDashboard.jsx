import React, { useState, useEffect } from 'react';
import aiService from '../utils/aiService';
import advancedGamificationService from '../utils/advancedGamificationService';
import performanceService from '../utils/performanceService';
import progressService from '../utils/progressService';
import notificationService from '../utils/notificationService';

const IntelligentDashboard = ({ user, setUser, setActiveScreen }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [rankingPosition, setRankingPosition] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Carregar preferência do modo escuro
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  useEffect(() => {
    const initializeDashboard = async () => {
      const stopTimer = performanceService.startPageLoadTimer('IntelligentDashboard');
      
      try {
        // Carregar progresso atual
        const progress = progressService.getProgress();
        
        // Analisar perfil do usuário com IA
        const profile = aiService.analyzeUserProfile(user, progress);
        setUserProfile(profile);
        
        // Gerar recomendações personalizadas
        const aiRecommendations = aiService.generateRecommendations(user, progress);
        setRecommendations(aiRecommendations);
        
        // Atualizar ranking
        const position = advancedGamificationService.updateRanking(user.id, user, progress);
        setRankingPosition(position);
        
        // Carregar eventos ativos
        const events = Array.from(advancedGamificationService.seasonalEvents.values())
          .filter(event => event.isActive);
        setActiveEvents(events);
        
        // Carregar métricas de performance
        const metrics = performanceService.generatePerformanceReport();
        setPerformanceMetrics(metrics);
        
        // Verificar conquistas avançadas
        const newAchievements = advancedGamificationService.checkAdvancedAchievements(user, progress);
        if (newAchievements.length > 0) {
          newAchievements.forEach(achievement => {
            notificationService.success(
              `🏆 ${achievement.title}: ${achievement.description}`
            );
          });
        }
        
        stopTimer();
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao inicializar dashboard:', error);
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, [user]);

  const handleRecommendationAction = (recommendation) => {
    switch (recommendation.action) {
      case 'practice_quiz':
        setActiveScreen('lesson-4'); // Lição de quiz
        break;
      case 'practice_drag-and-drop':
        setActiveScreen('lesson-1'); // Lição drag-and-drop
        break;
      case 'increase_difficulty':
        notificationService.info('Lições mais difíceis serão sugeridas!');
        break;
      case 'schedule_study_time':
        notificationService.info(`Seu horário ideal é às ${userProfile?.optimalStudyTime}h`);
        break;
      default:
        notificationService.info('Recomendação processada!');
    }
  };

  const handleJoinCompetition = (competitionId) => {
    const success = advancedGamificationService.joinCompetition(competitionId, user.id, user);
    if (success) {
      notificationService.success('Você entrou na competição!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-interface flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando painel inteligente...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col min-h-screen bg-interface"
      style={darkMode ? { backgroundColor: '#111827' } : {}}
    >
      {/* Header Inteligente */}
      <div 
        className="bg-white rounded-b-xl shadow-md sticky top-0 z-20 w-full" 
        style={{ 
          borderBottom: '3px solid #EE9116',
          backgroundColor: darkMode ? '#374151' : 'white'
        }}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex-1">
            <h1 
              className="text-xl font-bold text-gray-800 mb-1"
              style={darkMode ? { color: '#ffffff' } : {}}
            >
              Olá, {user.name}! {userProfile?.learningStyle && `(${userProfile.learningStyle})`}
            </h1>
            <div 
              className="flex items-center space-x-4 text-sm text-gray-600"
              style={darkMode ? { color: '#e5e7eb' } : {}}
            >
              <span 
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium"
                style={darkMode ? { 
                  backgroundColor: '#1e3a8a', 
                  color: '#93c5fd' 
                } : {}}
              >
                Nível {user.progress?.level || 1}
              </span>
              {rankingPosition && (
                <span 
                  className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium"
                  style={darkMode ? { 
                    backgroundColor: '#581c87', 
                    color: '#c084fc' 
                  } : {}}
                >
                  #{rankingPosition} no ranking
                </span>
              )}
              <span 
                className="flex items-center space-x-1"
                style={darkMode ? { color: '#e5e7eb' } : {}}
              >
                <span>🔥</span>
                <span>{user.progress?.streak || 0} dias</span>
              </span>
            </div>
          </div>
          
          {/* Eventos Ativos */}
          {activeEvents.length > 0 && (
            <div className="text-right">
              <div className="text-xs text-gray-600">Evento Ativo</div>
              <div className="text-sm font-semibold text-primary animate-pulse">
                {activeEvents[0].name}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-grow overflow-y-auto p-3 pb-32 hide-scrollbar">
        
        {/* Seção de Recomendações IA */}
        <div 
          className="bg-white rounded-xl shadow-md p-4 border-2 mb-4 overflow-hidden" 
          style={{ 
            borderColor: 'rgb(238, 145, 22)',
            backgroundColor: darkMode ? '#374151' : 'white'
          }}
        >
          <h2 
            className="text-lg font-semibold text-gray-800 mb-3 flex items-center"
            style={darkMode ? { color: '#ffffff' } : {}}
          >
            🤖 Recomendações Inteligentes
            <span 
              className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
              style={darkMode ? { 
                backgroundColor: '#1e3a8a', 
                color: '#93c5fd' 
              } : {}}
            >
              IA
            </span>
          </h2>
          
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all duration-200 hover:scale-102 hover:shadow-lg ${
                  rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                  rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-green-500 bg-green-50'
                }`}
                style={darkMode ? {
                  backgroundColor: rec.priority === 'high' ? '#7f1d1d' : 
                                rec.priority === 'medium' ? '#451a03' : '#14532d',
                  borderLeftColor: rec.priority === 'high' ? '#dc2626' : 
                                 rec.priority === 'medium' ? '#fbbf24' : '#10b981'
                } : {}}
                onClick={() => handleRecommendationAction(rec)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 
                      className="font-semibold text-gray-800"
                      style={darkMode ? { color: '#ffffff' } : {}}
                    >
                      {rec.title}
                    </h3>
                    <p 
                      className="text-sm text-gray-600"
                      style={darkMode ? { color: '#e5e7eb' } : {}}
                    >
                      {rec.description}
                    </p>
                  </div>
                  <div 
                    className={`text-xs px-2 py-1 rounded-full ${
                      rec.priority === 'high' ? 'bg-red-200 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-green-200 text-green-800'
                    }`}
                    style={darkMode ? {
                      backgroundColor: rec.priority === 'high' ? '#dc2626' : 
                                    rec.priority === 'medium' ? '#fbbf24' : '#10b981',
                      color: rec.priority === 'high' ? '#ffffff' : 
                            rec.priority === 'medium' ? '#451a03' : '#ffffff'
                    } : {}}
                  >
                    {rec.priority}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seção de Perfil de Aprendizado */}
        {userProfile && (
          <div 
            className="bg-white rounded-xl shadow-md p-4 border-2 mb-4" 
            style={{ 
              borderColor: 'rgb(238, 145, 22)',
              backgroundColor: darkMode ? '#374151' : 'white'
            }}
          >
            <h2 
              className="text-lg font-semibold text-gray-800 mb-3"
              style={darkMode ? { color: '#ffffff' } : {}}
            >
              📊 Seu Perfil de Aprendizado
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="text-center p-3 bg-blue-50 rounded-lg"
                style={darkMode ? { backgroundColor: '#1e3a8a' } : {}}
              >
                <div className="text-2xl mb-1">🎯</div>
                <div 
                  className="text-sm font-semibold text-gray-800"
                  style={darkMode ? { color: '#ffffff' } : {}}
                >
                  Estilo
                </div>
                <div 
                  className="text-xs text-gray-600 capitalize"
                  style={darkMode ? { color: '#93c5fd' } : {}}
                >
                  {userProfile.learningStyle}
                </div>
              </div>
              
              <div 
                className="text-center p-3 bg-green-50 rounded-lg"
                style={darkMode ? { backgroundColor: '#14532d' } : {}}
              >
                <div className="text-2xl mb-1">⚡</div>
                <div 
                  className="text-sm font-semibold text-gray-800"
                  style={darkMode ? { color: '#ffffff' } : {}}
                >
                  Dificuldade
                </div>
                <div 
                  className="text-xs text-gray-600 capitalize"
                  style={darkMode ? { color: '#86efac' } : {}}
                >
                  {userProfile.difficultyPreference}
                </div>
              </div>
              
              <div 
                className="text-center p-3 bg-yellow-50 rounded-lg"
                style={darkMode ? { backgroundColor: '#451a03' } : {}}
              >
                <div className="text-2xl mb-1">🕐</div>
                <div 
                  className="text-sm font-semibold text-gray-800"
                  style={darkMode ? { color: '#ffffff' } : {}}
                >
                  Horário Ideal
                </div>
                <div 
                  className="text-xs text-gray-600"
                  style={darkMode ? { color: '#fbbf24' } : {}}
                >
                  {userProfile.optimalStudyTime}h
                </div>
              </div>
              
              <div 
                className="text-center p-3 bg-purple-50 rounded-lg"
                style={darkMode ? { backgroundColor: '#581c87' } : {}}
              >
                <div className="text-2xl mb-1">💪</div>
                <div 
                  className="text-sm font-semibold text-gray-800"
                  style={darkMode ? { color: '#ffffff' } : {}}
                >
                  Motivação
                </div>
                <div 
                  className="text-xs text-gray-600"
                  style={darkMode ? { color: '#c084fc' } : {}}
                >
                  {userProfile.motivationFactors.length} fatores
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seção de Áreas Fortes e Fracas */}
        {userProfile && (
          <div className="bg-white rounded-xl shadow-md p-4 border-2 mb-4" style={{ borderColor: 'rgb(238, 145, 22)' }}>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">📈 Suas Áreas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Áreas Fortes */}
              <div>
                <h3 className="text-md font-semibold text-green-700 mb-2 flex items-center">
                  ✅ Áreas Fortes
                </h3>
                <div className="space-y-2">
                  {userProfile.strongAreas.slice(0, 3).map((area, index) => (
                    <div key={index} className="p-2 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-800">{area.type}</div>
                      <div className="text-xs text-green-600">{area.recommendation}</div>
                    </div>
                  ))}
                  {userProfile.strongAreas.length === 0 && (
                    <p className="text-sm text-gray-500">Continue praticando para descobrir seus pontos fortes!</p>
                  )}
                </div>
              </div>
              
              {/* Áreas de Melhoria */}
              <div>
                <h3 className="text-md font-semibold text-orange-700 mb-2 flex items-center">
                  🔧 Áreas de Melhoria
                </h3>
                <div className="space-y-2">
                  {userProfile.weakAreas.slice(0, 3).map((area, index) => (
                    <div key={index} className="p-2 bg-orange-50 rounded-lg">
                      <div className="text-sm font-medium text-orange-800">{area.type}</div>
                      <div className="text-xs text-orange-600">{area.recommendation}</div>
                    </div>
                  ))}
                  {userProfile.weakAreas.length === 0 && (
                    <p className="text-sm text-gray-500">Parabéns! Você está equilibrado em todas as áreas!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seção de Competições Ativas */}
        <div className="bg-white rounded-xl shadow-md p-4 border-2 mb-4" style={{ borderColor: 'rgb(238, 145, 22)' }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">🏆 Competições</h2>
          
          <div className="space-y-3">
            {Array.from(advancedGamificationService.competitions.values())
              .filter(comp => comp.isActive)
              .slice(0, 2)
              .map(competition => (
                <div key={competition.id} className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{competition.title}</h3>
                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                      {competition.participants.length} participantes
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{competition.description}</p>
                  <button
                    onClick={() => handleJoinCompetition(competition.id)}
                    className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-dark transition"
                  >
                    Participar
                  </button>
                </div>
              ))}
            
            {Array.from(advancedGamificationService.competitions.values()).filter(comp => comp.isActive).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhuma competição ativa no momento. Fique atento às próximas!
              </p>
            )}
          </div>
        </div>

        {/* Seção de Performance */}
        {performanceMetrics && (
          <div className="bg-white rounded-xl shadow-md p-4 border-2 mb-4" style={{ borderColor: 'rgb(238, 145, 22)' }}>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">⚡ Performance</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-800">Tempo de Carregamento</div>
                <div className="text-lg font-bold text-blue-600">
                  {performanceMetrics.averagePageLoadTime?.toFixed(0) || 0}ms
                </div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-800">Renderização</div>
                <div className="text-lg font-bold text-green-600">
                  {performanceMetrics.averageComponentRenderTime?.toFixed(0) || 0}ms
                </div>
              </div>
            </div>
            
            {performanceMetrics.recommendations?.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                <div className="text-sm font-semibold text-yellow-800 mb-2">💡 Recomendações de Performance:</div>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {performanceMetrics.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligentDashboard; 