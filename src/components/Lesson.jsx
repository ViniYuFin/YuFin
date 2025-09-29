import React, { useState, useEffect } from 'react';
import { LessonRenderer } from './index.jsx';
import progressService from '../utils/progressService';
import notificationService from '../utils/notificationService';
import achievementService from '../utils/achievementService';
import { storageService, STORAGE_KEYS } from '../utils/storageService';
import ConfettiEffect from './ConfettiEffect';
import { apiPatch, apiPost, apiGet } from '../utils/apiService';

const Lesson = (props) => {
  const { lessonId, user, setUser, setActiveScreen } = props;
  // Suporte para reviewMode vindo de navegação por objeto
  const reviewMode = props.reviewMode || (typeof props.activeScreen === 'object' && props.activeScreen.reviewMode) || false;
  const [currentLesson, setCurrentLesson] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [lessonResults, setLessonResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [leveledUp, setLeveledUp] = useState(false);
  const [savingsReward, setSavingsReward] = useState(0);
  const [xpBreakdown, setXpBreakdown] = useState(null);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      setIsLoading(true);
      // Limpar dados de lição anterior
      setXpBreakdown(null);
      setShowResults(false);
      setLessonResults(null);
      
      const lesson = await apiGet(`/lessons/${lessonId}`);
      setCurrentLesson(lesson);
    } catch (error) {
      console.error('Erro ao carregar lição:', error);
      notificationService.error('Erro ao carregar lição');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonComplete = async (results) => {
    setLessonResults(results);
    setShowResults(true);
    // Se estiver em modo revisão, não computa XP, progresso ou recompensas
    if (reviewMode) return;
    
    try {
      // Usar o novo endpoint que processa tudo automaticamente
      const response = await apiPost(`/users/${user.id}/complete-lesson`, {
        lessonId: lessonId,
        score: results.score,
        timeSpent: results.timeSpent,
        isPerfect: results.isPerfect
      });
      
      const { student: updatedUser, reward, leveledUp, moduleAchievements, achievementRewards, xpBreakdown } = response;
      
      setSavingsReward(reward || 0);
      setXpBreakdown(xpBreakdown || null);
      setUser(updatedUser);
      storageService.save(STORAGE_KEYS.USER, updatedUser);
      
      // Processar conquistas de módulos
      if (moduleAchievements && moduleAchievements.length > 0) {
        console.log('Conquistas de módulo desbloqueadas:', moduleAchievements);
        
        // Mostrar apenas a conquista principal
        moduleAchievements.forEach(achievementId => {
          // Extrair o ID da conquista do formato "6º Ano_module_1_complete"
          const parts = achievementId.split('_');
          const moduleNumber = parts[parts.length - 2]; // "1" de "6º Ano_module_1_complete"
          const simpleAchievementId = `module_${moduleNumber}_complete`;
          
          const achievement = achievementService.getAchievementById(simpleAchievementId);
          console.log('Conquista encontrada:', achievement);
          if (achievement) {
            notificationService.success(
              `🏆 ${achievement.title}: ${achievement.description}`
            );
          } else {
            console.log('Conquista não encontrada para ID:', simpleAchievementId);
          }
        });
        
        // Processar recompensas de poupança para conquistas
        try {
          const achievementRewardResponse = await apiPost(`/users/${updatedUser.id}/process-rewards`, {
            rewardType: 'achievement',
            value: moduleAchievements.length
          });
          
          if (achievementRewardResponse.reward > 0) {
            notificationService.success(`💰 +R$ ${achievementRewardResponse.reward.toFixed(2)} adicionados à poupança por conquistas!`);
            
            // Atualizar usuário com nova poupança
            setUser(achievementRewardResponse.student);
            storageService.save(STORAGE_KEYS.USER, achievementRewardResponse.student);
          }
        } catch (error) {
          console.error('Erro ao processar recompensa de conquista:', error);
        }
      }
      
      // O backend agora processa todas as conquistas automaticamente
      // Não precisamos mais processar aqui no frontend
      
      // Mostrar confetti se subiu de nível
      if (leveledUp) {
        setLeveledUp(true);
        setShowConfetti(true);
        console.log('Confetti: Subiu de nível!');
      } else {
        setLeveledUp(false);
        setShowConfetti(false);
      }
      
      // Mostrar notificação da recompensa apenas se não houver conquistas
      if (reward > 0 && (!moduleAchievements || moduleAchievements.length === 0)) {
        notificationService.success(`🎉 +R$ ${reward.toFixed(2)} adicionados à sua poupança!`);
      }
      
    } catch (err) {
      console.error('Erro ao processar lição:', err);
      if (err.message.includes('já foi recompensada')) {
        notificationService.warning('Esta lição já foi recompensada anteriormente.');
        // Mesmo com erro, permitir continuar
        setSavingsReward(0);
      } else {
        notificationService.error('Erro ao atualizar progresso: ' + err.message);
      }
    }
  };

  const handleExit = () => {
    if (setActiveScreen && typeof setActiveScreen === 'function') {
      if (showResults) {
        setActiveScreen('home');
      } else {
        if (window.confirm('Tem certeza que deseja sair? Seu progresso será perdido.')) {
          setActiveScreen('home');
        }
      }
    } else {
      console.error('setActiveScreen não está disponível');
      // Fallback: tentar usar onNavigate se disponível
      if (props.onNavigate) {
        props.onNavigate('home');
      } else {
        // Último recurso: recarregar a página
        window.location.reload();
      }
    }
  };

  const handleContinue = () => {
    if (setActiveScreen && typeof setActiveScreen === 'function') {
      setActiveScreen('home');
    } else {
      console.error('setActiveScreen não está disponível');
      // Fallback: tentar usar onNavigate se disponível
      if (props.onNavigate) {
        props.onNavigate('home');
      } else {
        // Último recurso: recarregar a página
        window.location.reload();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-interface flex items-center justify-center p-4 pb-20">
        <div className="bg-white p-6 rounded-xl shadow-lg text-center animate-fadeIn max-h-[70vh] overflow-y-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando lição...</p>
        </div>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className="h-screen bg-interface flex items-center justify-center p-4 pb-20">
        <div className="bg-white p-6 rounded-xl shadow-lg text-center max-h-[70vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-red-500 mb-3">Lição Não Encontrada</h2>
          <p className="text-gray-600 mb-4">A lição solicitada não existe.</p>
          <button
            onClick={() => {
              if (setActiveScreen && typeof setActiveScreen === 'function') {
                setActiveScreen('home');
              } else if (props.onNavigate) {
                props.onNavigate('home');
              } else {
                window.location.reload();
              }
            }}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Tela de resultados melhorada
  if (showResults && lessonResults) {
    const isPerfect = lessonResults.isPerfect;
    const yuCoinsEarned = 10; // YuCoins fixos por lição
    const totalCoins = yuCoinsEarned;
    
    return (
      <div className="h-screen bg-gradient-to-b from-primary to-secondary flex items-center justify-center p-4 pb-20">
        {showConfetti && <ConfettiEffect onEnd={() => setShowConfetti(false)} />}
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full text-center animate-bounce-in max-h-[70vh] overflow-y-auto">
          <div className="text-6xl mb-3 animate-bounce">
            {isPerfect ? '🎉' : '👍'}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            {isPerfect ? 'Perfeito!' : 'Lição Concluída!'}
          </h1>
          
          <div className="space-y-3 mb-4">
            <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Pontuação</p>
              <p className="text-3xl font-bold text-white">{lessonResults.score}/100</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Tempo</p>
              <p className="text-xl font-semibold">{lessonResults.timeSpent}s</p>
            </div>
            

            
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">YüCoins Ganhos</p>
              <p className="text-xl font-semibold text-yellow-600">
                +{totalCoins} 💰
              </p>
            </div>
            
            {savingsReward > 0 && (
              <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg p-4 animate-pulse">
                <p className="text-sm text-gray-600">💰 Poupança Automática</p>
                <p className="text-xl font-semibold text-green-600">
                  +R$ {savingsReward.toFixed(2)}
                </p>
                <p className="text-xs text-green-600 mt-1">Adicionado à sua carteira!</p>
              </div>
            )}
            
            {isPerfect && (
              <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg p-4 animate-pulse">
                <p className="text-sm text-gray-600">🏆 Lição Perfeita!</p>
                <p className="text-lg font-bold text-purple-600">Parabéns!</p>
              </div>
            )}
            

          </div>
          
          <div className="mt-4">
            <button
              onClick={handleContinue}
              className="w-full bg-primary text-white py-3 rounded-lg font-bold text-lg hover:bg-primary-dark transition-colors transform hover:scale-105 shadow-lg"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar lição
  return (
    <LessonRenderer
      lesson={currentLesson}
      onComplete={handleLessonComplete}
      onExit={handleExit}
      reviewMode={reviewMode}
    />
  );
};

export default Lesson;