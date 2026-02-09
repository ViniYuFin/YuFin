import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './src/styles/responsive-gradients.css';
import Welcome from './src/components/Welcome';
import Navigation from './src/components/Navigation';
import Login from './src/components/Login';
import Register from './src/components/Register';
import RegisterWithToken from './src/components/RegisterWithToken';
import RegisterGratuito from './src/components/RegisterGratuito';
import ValidateParentConsent from './src/components/ValidateParentConsent';
import ResetPassword from './src/components/ResetPassword';
import StudentDashboard from './src/components/StudentDashboard';
import Lesson from './src/components/Lesson';
import Profile from './src/components/Profile';
import Wallet from './src/components/Wallet';
import Store from './src/components/Store';
import ParentDashboard from './src/components/ParentDashboard';
import SavingsConfig from './src/components/SavingsConfig';
import Achievements from './src/components/Achievements';
import Ranking from './src/components/Ranking';
import gratuitoProgressService from './src/services/GratuitoProgressService';
import News from './src/components/News';
import SchoolDashboard from './src/components/SchoolDashboard';
import Reports from './src/components/Reports';
import Challenges from './src/components/Challenges';
import Settings from './src/components/Settings';
import Friends from './src/components/Friends';
import IntelligentDashboard from './src/components/IntelligentDashboard';
import Classes from './src/components/Classes';
import { loginUser, loginUserGratuito, registerUser, registerUserGratuito, logoutUser, getCurrentSession, loadUserFromStorage } from './src/utils/authService';
import { storageService, STORAGE_KEYS } from './src/utils/storageService';
import notificationService from './src/utils/notificationService';
import analyticsService from './src/utils/analyticsService';
import performanceService from './src/utils/performanceService';
import aiService from './src/utils/aiService';
import advancedGamificationService from './src/utils/advancedGamificationService';
import { apiPatch, apiPost, apiDelete } from './src/utils/apiService';
// 🔐 Importar interceptor Axios (v2.0) - DEVE SER O PRIMEIRO
import './src/utils/axiosInterceptor';

function App() {
  const [activeScreen, setActiveScreen] = useState('welcome');
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [familyPlanData, setFamilyPlanData] = useState(null);
  const [currentModule, setCurrentModule] = useState(() => {
    // Carregar módulo atual do localStorage ou usar 1 como padrão
    const savedModule = storageService.load(STORAGE_KEYS.CURRENT_MODULE);
    return savedModule || 1;
  });
  const [loading, setLoading] = useState(true);
  const [registrationToken, setRegistrationToken] = useState(null);

  // Efeito para carregar o usuário do localStorage ao iniciar o app
  useEffect(() => {
    const initializeApp = () => {
      try {
        // Verificar PRIMEIRO se há token de reset na URL (PRIORITÁRIO)
        const urlParams = new URLSearchParams(window.location.search);
        const resetToken = urlParams.get('token');
        const path = window.location.pathname;
        
        console.log('🔍 Inicializando app - Path:', path, 'Token:', resetToken ? 'SIM' : 'NÃO');
        
        if (resetToken || path === '/reset-password' || path.endsWith('/reset-password')) {
          console.log('🔐 Token de reset detectado - DEFININDO reset-password como tela ativa');
          setActiveScreen('reset-password');
          setIsInitializing(false);
          return; // IMPORTANTE: Não continuar com o resto da inicialização
        }
        
        // Usar a nova função de carregamento com validação
        const savedUser = loadUserFromStorage();
        console.log('🔍 Usuário carregado do storage:', savedUser);
        
        if (savedUser) {
          setUser(savedUser);
          console.log('✅ Usuário definido no estado:', savedUser);
          advancedGamificationService.loadData();
          
          // Só definir tela se não houver token de reset (verificação dupla)
          const currentToken = new URLSearchParams(window.location.search).get('token');
          if (!currentToken && path !== '/reset-password' && !path.endsWith('/reset-password')) {
          if (savedUser.role === 'student' || savedUser.role === 'student-gratuito') {
            setActiveScreen('home');
          } else if (savedUser.role === 'parent') {
            setActiveScreen('parent-dashboard');
          } else if (savedUser.role === 'school') {
            setActiveScreen('school-dashboard');
          } else if (savedUser.role === 'admin') {
            setActiveScreen('school-dashboard'); // Admin usa dashboard da escola
            }
          }
        } else {
          // Limpar dados inválidos
          console.log('❌ Nenhum usuário válido encontrado, limpando dados');
          storageService.remove(STORAGE_KEYS.USER);
          storageService.remove(STORAGE_KEYS.SESSION);
          localStorage.removeItem('darkMode');
          document.documentElement.classList.remove('dark');
          setUser(null);
          
          // Verificar se é rota de registro gratuito ou validação
          console.log('🔍 Path detectado:', path);
          if (path === '/register-gratuito' || path.endsWith('/register-gratuito')) {
            console.log('✅ Redirecionando para register-gratuito');
            setActiveScreen('register-gratuito');
          } else if (path === '/validate-parent-consent' || path.endsWith('/validate-parent-consent')) {
            console.log('✅ Redirecionando para validate-parent-consent');
            setActiveScreen('validate-parent-consent');
          } else {
            console.log('✅ Redirecionando para welcome');
            setActiveScreen('welcome');
          }
        }
      } catch (error) {
        // Em caso de erro, limpar tudo e ir para welcome
        storageService.remove(STORAGE_KEYS.USER);
        storageService.remove(STORAGE_KEYS.SESSION);
        setUser(null);
        setActiveScreen('welcome');
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeApp();
  }, []);

  // 🎯 Interceptor global para usuários gratuitos - SOLUÇÃO HÍBRIDA DEFINITIVA
  useEffect(() => {
    if (!user) {
      console.log('🎯 Interceptor: Nenhum usuário logado, interceptor não ativo');
      return;
    }

    console.log('🎯 Interceptor: Usuário logado, configurando interceptor:', {
      id: user.id,
      role: user.role,
      isGratuito: user.isGratuito
    });

    // Inicializar progresso para usuários gratuitos se não existir
    if ((user.isGratuito || user.role === 'student-gratuito') && !gratuitoProgressService.getProgress(user.id)) {
      console.log('🎯 Interceptor: Inicializando progresso para usuário gratuito:', user.id);
      gratuitoProgressService.initializeProgress(user.id, user.gradeId);
    }

    const originalFetch = window.fetch;
    
    window.fetch = async (url, options = {}) => {
      console.log('🌐 Interceptor: Chamada detectada:', { url, method: options.method, user: user?.role });
      
      // Verificar se é uma chamada de progresso para usuários gratuitos
      // NOTA: /grade-progress NÃO é interceptado pois precisamos das lições do backend
      const isGratuitoUser = user.isGratuito || user.role === 'student-gratuito';
      const isProgressCall = url.includes('/complete-lesson') || 
                            url.includes('/grade-progression-status') ||
                            url.includes('/current-module');
      
      console.log('🔍 Interceptor: Verificando interceptação:', {
        url,
        isGratuitoUser,
        userRole: user.role,
        userIsGratuito: user.isGratuito,
        isProgressCall
      });
      
      if (typeof url === 'string' && isGratuitoUser && isProgressCall) {
        console.log('🎯 Interceptor: Interceptando chamada para usuário gratuito:', url);
        
        // COMPLETAR LIÇÃO - Salvar localmente
        if (url.includes('/complete-lesson')) {
          try {
            const lessonData = JSON.parse(options.body || '{}');
            console.log('🎯 Interceptor: Completando lição para usuário gratuito:', lessonData);
            
            const updatedProgress = gratuitoProgressService.completeLesson(user.id, lessonData);
            
            if (updatedProgress) {
              // Atualizar usuário no localStorage
              const updatedUser = { ...user, progress: updatedProgress };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              
              // Atualizar o estado do usuário no React de forma síncrona
              setUser(updatedUser);
              console.log('✅ Interceptor: Usuário atualizado síncronamente:', updatedUser);
              
              console.log('✅ Interceptor: Lição completada e usuário salvo no localStorage:', updatedUser);
              
              // Retornar resposta que simula uma resposta do Axios com estrutura esperada pelo Lesson.jsx
              const responseData = {
                student: updatedUser, // Estrutura esperada pelo Lesson.jsx
                reward: 0, // Sem recompensa de poupança para usuários gratuitos
                leveledUp: false,
                moduleAchievements: [],
                achievementRewards: [],
                xpBreakdown: {
                  baseXp: lessonData.score * 10,
                  bonusXp: 0,
                  totalXp: lessonData.score * 10
                }
              };
              
              const response = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: {},
                data: responseData,
                json: async () => responseData
              };
              
              console.log('✅ Interceptor: Retornando resposta simulada:', response);
              return Promise.resolve(response);
            } else {
              console.error('❌ Interceptor: Falha ao completar lição - updatedProgress é null');
              return Promise.reject({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                data: { error: 'Falha ao completar lição localmente' }
              });
            }
          } catch (error) {
            console.error('❌ Erro ao completar lição localmente:', error);
            // Retornar erro simulado
            return Promise.reject({
              ok: false,
              status: 500,
              statusText: 'Internal Server Error',
              data: { error: 'Erro ao completar lição localmente' }
            });
          }
        }
        
        // STATUS DE PROGRESSÃO - Retornar dados locais
        else if (url.includes('/grade-progression-status')) {
          const status = gratuitoProgressService.getProgressionStatus(user.id);
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => status
          });
        }
        
        
        // ATUALIZAR MÓDULO ATUAL - Salvar localmente
        else if (url.includes('/current-module')) {
          try {
            const moduleData = JSON.parse(options.body || '{}');
            const updatedProgress = gratuitoProgressService.updateCurrentModule(user.id, moduleData.currentModule);
            
            if (updatedProgress) {
              // Atualizar usuário no localStorage
              const updatedUser = { ...user, currentModule: moduleData.currentModule };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              
              return Promise.resolve({
                ok: true,
                status: 200,
                json: async () => ({ success: true })
              });
            }
          } catch (error) {
            console.error('Erro ao atualizar módulo localmente:', error);
          }
        }
      }
      
      // Para todas as outras chamadas, usar fetch original
      return originalFetch(url, options);
    };

    // Cleanup: restaurar fetch original quando usuário mudar ou componente for desmontado
        return () => {
          console.log('🎯 Interceptor: Restaurando fetch original');
          window.fetch = originalFetch;
        };
      }, [user]);

  // Efeito para detectar token de registro na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const path = window.location.pathname;
    
    console.log('🔍 useEffect token - Path:', path, 'Token:', token);
    
    // NÃO processar se for rota de reset de senha
    if (path === '/reset-password' || path.endsWith('/reset-password')) {
      console.log('🔐 Token de reset detectado, ignorando token de registro');
      return;
    }
    
    // Só processar token se NÃO for a rota de validação de pais
    if (token && path !== '/validate-parent-consent' && !path.endsWith('/validate-parent-consent')) {
      console.log('✅ Token de registro detectado, definindo register-with-token');
      setRegistrationToken(token);
      setActiveScreen('register-with-token');
    } else if (token && (path === '/validate-parent-consent' || path.endsWith('/validate-parent-consent'))) {
      console.log('✅ Token de validação de pais detectado, mantendo validate-parent-consent');
      // Não alterar o activeScreen, já foi definido corretamente
    }
  }, []);

  // Efeito para monitorar mudanças na URL (especialmente token de reset)
  useEffect(() => {
    const checkUrlForResetToken = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const resetToken = urlParams.get('token');
      const path = window.location.pathname;
      
      if (resetToken || path === '/reset-password' || path.endsWith('/reset-password')) {
        console.log('🔐 Token de reset detectado na URL (monitoramento), garantindo reset-password');
        if (activeScreen !== 'reset-password') {
          setActiveScreen('reset-password');
        }
      }
    };
    
    // Verificar imediatamente
    checkUrlForResetToken();
    
    // Verificar quando a URL mudar (popstate para navegação do browser)
    window.addEventListener('popstate', checkUrlForResetToken);
    
    return () => {
      window.removeEventListener('popstate', checkUrlForResetToken);
    };
  }, [activeScreen]);

  // Efeito para salvar/remover usuário no localStorage sempre que o estado 'user' muda
  useEffect(() => {
    // NÃO executar durante a inicialização para evitar race condition
    if (isInitializing) return;
    
    // Verificar se há token de reset na URL antes de alterar activeScreen
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    const path = window.location.pathname;
    
    if (resetToken || path === '/reset-password' || path.endsWith('/reset-password')) {
      console.log('🔐 Token de reset detectado, não alterando activeScreen');
      return; // Não alterar activeScreen se houver token de reset
    }
    
    if (user) {
      storageService.save(STORAGE_KEYS.USER, user);
      
      // Sincronizar módulo atual com o backend se o usuário for um estudante
      if ((user.role === 'student' || user.role === 'student-gratuito') && user.currentModule) {
        setCurrentModule(user.currentModule);
        storageService.save(STORAGE_KEYS.CURRENT_MODULE, user.currentModule);
      }
    } else {
      storageService.remove(STORAGE_KEYS.USER);
      storageService.remove(STORAGE_KEYS.SESSION);
      // Limpar modo escuro do localStorage
      localStorage.removeItem('darkMode');
      // Remover classe dark do DOM
      document.documentElement.classList.remove('dark');
      
      // Só definir welcome se não estiver em uma rota específica
      const path = window.location.pathname;
      console.log('🔍 Verificando rota no useEffect user:', path);
      if (path !== '/register-gratuito' && !path.endsWith('/register-gratuito') && 
          path !== '/validate-parent-consent' && !path.endsWith('/validate-parent-consent') &&
          path !== '/reset-password' && !path.endsWith('/reset-password')) {
        console.log('✅ Definindo welcome (não é rota específica)');
        setActiveScreen('welcome');
      } else {
        console.log('✅ Mantendo rota específica');
      }
    }
  }, [user, isInitializing]);

  // Função para lidar com registro com token
  const handleRegisterWithToken = async (userData) => {
    try {
      setUser(userData);
      setRegistrationToken(null);
      // Limpar token da URL
      const url = new URL(window.location);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url);
      
      notificationService.success('Registro realizado com sucesso!');
      if (userData.role === 'student' || userData.role === 'student-gratuito') {
        setActiveScreen('home');
      } else if (userData.role === 'parent') {
        setActiveScreen('parent-dashboard');
      } else if (userData.role === 'school') {
        setActiveScreen('school-dashboard');
      }
    } catch (error) {
      notificationService.error('Erro no registro: ' + error.message);
    }
  };

  // Função para cancelar registro com token
  const handleCancelTokenRegistration = () => {
    setRegistrationToken(null);
    setActiveScreen('welcome');
    // Limpar token da URL
    const url = new URL(window.location);
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url);
  };

  // Função centralizada para lidar com o login
  const handleLogin = async (email, password, role) => {
    try {
      const loggedInUser = await loginUser(email, password, role); // Usa o authService
      setUser(loggedInUser); // Atualiza o estado do usuário
      
      // Redirecionar para a tela apropriada
      if (loggedInUser.role === 'student' || loggedInUser.role === 'student-gratuito') {
        setActiveScreen('home');
      } else if (loggedInUser.role === 'parent') {
        setActiveScreen('parent-dashboard');
      } else if (loggedInUser.role === 'school') {
        setActiveScreen('school-dashboard');
      }
      
      // Notificação de evento especial (após login)
      const events = Array.from(advancedGamificationService.seasonalEvents?.values?.() || []).filter(e => e.isActive);
      if (events.length > 0) {
        const event = events[0];
        notificationService.success(
          `🎉 Evento especial ativo: ${event.name}! Bônus de ${event.bonus}x XP em todas as lições!`
        );
      }
      
      // Rastrear login
      analyticsService.trackEvent('user_login', {
        userRole: role,
        userId: loggedInUser.id
      });
      
      return { success: true }; // Retorna sucesso
    } catch (error) {
      // Rastrear erro de login
      analyticsService.trackError('login_error', error.message);
      return { success: false, message: error.message }; // Retorna erro
    }
  };

  // Função centralizada para lidar com o registro
  const handleRegister = async (userData) => {
    console.log('🔍 App: Dados recebidos no handleRegister:', {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      familyPlanData: userData.familyPlanData,
      schoolPlanData: userData.schoolPlanData,
      familyLicense: userData.familyLicense,
      schoolLicense: userData.schoolLicense
    });
    
    try {
      let result;
      
      // Se for registro gratuito, usar endpoint específico
      if (userData.role === 'student-gratuito') {
        result = await registerUserGratuito(userData);
        
        // Se requer validação por email, retornar sem criar usuário
        if (result.requiresEmailValidation) {
          return {
            success: true,
            requiresEmailValidation: true,
            message: result.message,
            parentEmail: result.parentEmail
          };
        }
        
        // Se chegou aqui, o usuário foi criado
        setUser(result); // Atualiza o estado do usuário
        
        // Redirecionar para a tela apropriada baseada na role
        if (result.role === 'student' || result.role === 'student-gratuito') {
          setActiveScreen('home');
        } else if (result.role === 'parent') {
          setActiveScreen('parent-dashboard');
        } else if (result.role === 'school') {
          setActiveScreen('school-dashboard');
        }
        
        return { success: true };
      } else {
        // Usar o endpoint de registro unificado que já existe
        result = await registerUser(userData);
        setUser(result); // Atualiza o estado do usuário
        
        // Redirecionar para a tela apropriada baseada na role
        if (result.role === 'student' || result.role === 'student-gratuito') {
          setActiveScreen('home');
        } else if (result.role === 'parent') {
          setActiveScreen('parent-dashboard');
        } else if (result.role === 'school') {
          setActiveScreen('school-dashboard');
        }
        
        return { success: true }; // Retorna sucesso
      }
    } catch (error) {
      return { success: false, message: error.message }; // Retorna erro
    }
  };

  // Função centralizada para lidar com o login gratuito
  const handleLoginGratuito = async (cpf, password) => {
    try {
      const loggedInUser = await loginUserGratuito(cpf, password);
      setUser(loggedInUser);
      
      // Redirecionar para a tela apropriada
      if (loggedInUser.role === 'student' || loggedInUser.role === 'student-gratuito') {
        setActiveScreen('home');
      } else if (loggedInUser.role === 'parent') {
        setActiveScreen('parent-dashboard');
      } else if (loggedInUser.role === 'school') {
        setActiveScreen('school-dashboard');
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Função centralizada para lidar com o logout
  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      // Rastrear logout
      analyticsService.trackEvent('user_logout', {
        userRole: user?.role,
        userId: user?.id
      });
      
      // Limpar modo escuro do localStorage
      localStorage.removeItem('darkMode');
      // Remover classe dark do DOM
      document.documentElement.classList.remove('dark');
      
      // Salvar o tipo de usuário antes de fazer logout
      const userRole = user?.role;
      
      logoutUser();
      setUser(null);
      
      // Limpar parâmetros de licença da URL para evitar redirecionamento incorreto
      const url = new URL(window.location);
      url.searchParams.delete('license');
      url.searchParams.delete('type');
      window.history.replaceState({}, '', url.toString());
      
      // Redirecionar baseado no tipo de usuário
      if (userRole === 'student-gratuito') {
        setActiveScreen('register-gratuito');
      } else {
        setActiveScreen('welcome');
      }
    }
  };

  // Função para zerar o progresso da série atual
  const handleResetProgress = async () => {
    if (!user) return;
    
    try {
      // Para usuários gratuitos, usar serviço local
      if (user.isGratuito || user.role === 'student-gratuito') {
        console.log('🔄 Resetando progresso para usuário gratuito:', user.id);
        
        // Resetar progresso local usando GratuitoProgressService
        const resetProgress = gratuitoProgressService.resetProgress(user.id, user.gradeId);
        
        if (resetProgress) {
          // Atualizar usuário com progresso resetado
          const updatedUser = { ...user, progress: resetProgress };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          notificationService.success(`Progresso da série ${user.gradeId} resetado com sucesso!`);
          setTimeout(() => {
            setActiveScreen('home');
          }, 1000);
        } else {
          notificationService.error('Erro ao resetar progresso local');
        }
        return;
      }
      
      // Para usuários normais, usar endpoint do backend
      const response = await apiPost(`/users/${user.id}/reset-radical`);
      const { user: updatedUser, resetInfo } = response;
      
      console.log('Usuário atualizado após reset radical:', updatedUser);
      setUser(updatedUser);
      storageService.save(STORAGE_KEYS.USER, updatedUser);
      
      // Atualizar o progresso no localStorage
      storageService.save(STORAGE_KEYS.PROGRESS, {
        totalXp: resetInfo.xp,
        currentLevel: resetInfo.level,
        xpToNextLevel: 100,
        streak: 0,
        lastActivityDate: new Date().toISOString(),
        dailyGoal: 50,
        dailyProgress: 0,
        achievements: [],
        completedLessons: [],
        totalLessonsCompleted: resetInfo.completedLessons,
        perfectLessons: 0,
        timeSpent: 0
      });
      
      notificationService.success(`Progresso completamente resetado! Voltando ao ${resetInfo.newGrade}.`);
      setTimeout(() => {
        if (user.role === 'student' || user.role === 'student-gratuito') {
          setActiveScreen('home');
        }
      }, 1000);
    } catch (err) {
      notificationService.error('Erro ao zerar progresso: ' + err.message);
    }
  };

  const handleNavigate = (screen, params = {}) => {
    if (screen === 'lesson') {
      setCurrentLesson(params.lessonId);
      // Armazenar o módulo atual se fornecido
      if (params.currentModule) {
        setCurrentModule(params.currentModule);
        // Persistir o módulo atual no localStorage
        storageService.save(STORAGE_KEYS.CURRENT_MODULE, params.currentModule);
      }
      setActiveScreen('lesson');
    } else {
      setActiveScreen(screen);
    }
  };

  const handleLessonComplete = async (results) => {
    try {
      const response = await apiPatch(`/users/${user.id}/complete-lesson`, {
        lessonId: currentLesson,
        score: results.score,
        timeSpent: results.timeSpent,
        isPerfect: results.isPerfect
      });
      
      const { student: updatedUser, reward, leveledUp } = response;
      setUser(updatedUser);
      storageService.save(STORAGE_KEYS.USER, updatedUser);
      
      if (reward > 0) {
        notificationService.success(`🎉 +R$ ${reward.toFixed(2)} adicionados à sua poupança!`);
      }
      
      if (leveledUp) {
        notificationService.success('🎊 Parabéns! Você subiu de nível!');
      }
      
      // Voltar para o dashboard no módulo correto
      setActiveScreen('home');
      setCurrentLesson(null);
      // O módulo atual será usado pelo StudentDashboard para mostrar o módulo correto
      
    } catch (error) {
      console.error('Erro ao completar lição:', error);
      notificationService.error('Erro ao salvar progresso: ' + error.message);
    }
  };

  // Função para renderizar a tela atual com base no activeScreen e no usuário logado
  const getScreenName = (activeScreen) => typeof activeScreen === 'string' ? activeScreen : activeScreen?.screen;
  const renderScreen = () => {
    const screenName = getScreenName(activeScreen);
    console.log('🖥️ Renderizando tela:', screenName, 'Usuário logado:', !!user);
    console.log('🔍 activeScreen completo:', activeScreen);
    console.log('🔍 screenName extraído:', screenName);
    
    // Telas que não requerem autenticação (usuário não logado)
    if (!user) {
      console.log('👤 Usuário não logado, verificando switch case...');
      switch (screenName) {
        case 'welcome':
          console.log('📱 Caso: welcome');
          return <Welcome setActiveScreen={setActiveScreen} />;
        case 'login-student':
          console.log('📱 Caso: login-student');
          return <Login handleLogin={handleLogin} setActiveScreen={setActiveScreen} role="student" />;
        case 'login-parent':
          console.log('📱 Caso: login-parent');
          return <Login handleLogin={handleLogin} setActiveScreen={setActiveScreen} role="parent" />;
        case 'login-school':
          console.log('📱 Caso: login-school');
          return <Login handleLogin={handleLogin} setActiveScreen={setActiveScreen} role="school" />;
        case 'register-student':
          console.log('📱 Caso: register-student');
          return <Register handleRegister={handleRegister} setActiveScreen={setActiveScreen} role="student" />;
        case 'register-parent':
          console.log('📱 Caso: register-parent');
          return <Register handleRegister={handleRegister} setActiveScreen={setActiveScreen} role="parent" familyPlanData={familyPlanData} />;
        case 'register-school':
          console.log('📱 Caso: register-school');
          return <Register handleRegister={handleRegister} setActiveScreen={setActiveScreen} role="school" />;
        case 'register-with-token':
          console.log('📱 Caso: register-with-token');
          return <RegisterWithToken 
            token={registrationToken} 
            onSuccess={handleRegisterWithToken} 
            onCancel={handleCancelTokenRegistration} 
          />;
        case 'register-gratuito':
          console.log('🎯 Caso: register-gratuito - Renderizando RegisterGratuito!');
          const registerGratuitoComponent = <RegisterGratuito handleRegister={handleRegister} handleLoginGratuito={handleLoginGratuito} setActiveScreen={setActiveScreen} />;
          console.log('🎯 Componente RegisterGratuito criado:', registerGratuitoComponent);
          return registerGratuitoComponent;
        case 'validate-parent-consent':
          console.log('✅ Caso: validate-parent-consent - Renderizando ValidateParentConsent!');
          return <ValidateParentConsent setActiveScreen={setActiveScreen} />;
        case 'reset-password':
          console.log('🔐 Caso: reset-password - Renderizando ResetPassword!');
          return <ResetPassword setActiveScreen={setActiveScreen} />;
        default:
          console.log('📱 Caso: default - Renderizando Welcome');
          return <Welcome setActiveScreen={setActiveScreen} />;
      }
    }
    
    // Tela de reset de senha tem prioridade mesmo se usuário estiver logado
    if (screenName === 'reset-password') {
      console.log('🔐 Reset-password detectado (usuário logado), renderizando ResetPassword!');
      return <ResetPassword setActiveScreen={setActiveScreen} />;
    }
    
    // Se activeScreen for uma tela de login mas usuário já está logado, redirecionar para dashboard
    if (screenName === 'login-student' || screenName === 'login-parent' || screenName === 'login-school' || 
        screenName === 'welcome' || screenName === 'register-student' || screenName === 'register-parent' || 
        screenName === 'register-school' || screenName === 'register-gratuito') {
      console.log('🔄 Usuário logado tentando acessar tela de login/registro, redirecionando para dashboard');
      // Redirecionar para dashboard apropriado baseado na role
      if (user.role === 'student' || user.role === 'student-gratuito') {
        return <StudentDashboard user={user} setUser={setUser} onNavigate={handleNavigate} currentModule={currentModule} />;
      } else if (user.role === 'parent') {
        return <ParentDashboard user={user} setUser={setUser} setActiveScreen={setActiveScreen} />;
      } else if (user.role === 'school' || user.role === 'admin') {
        return <SchoolDashboard user={user} setActiveScreen={setActiveScreen} />;
      }
    }
    
    // Telas que requerem autenticação (usuário logado)
    switch (true) {
      case screenName === 'home':
        if (user.role === 'student' || user.role === 'student-gratuito') {
          return <StudentDashboard user={user} setUser={setUser} onNavigate={handleNavigate} currentModule={currentModule} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta tela.</p>;
      case screenName === 'intelligent-dashboard':
        if (user.role === 'student') {
          return <IntelligentDashboard user={user} setUser={setUser} setActiveScreen={setActiveScreen} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta tela.</p>;
      case screenName === 'lesson':
        if (user.role === 'student' || user.role === 'student-gratuito') {
          return <Lesson lessonId={currentLesson} user={user} setUser={setUser} setActiveScreen={setActiveScreen} onComplete={handleLessonComplete} onNavigate={handleNavigate} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta lição.</p>;
      case screenName && screenName.startsWith('lesson-'):
        const lessonId = screenName.split('-')[1];
        if (user.role === 'student' || user.role === 'student-gratuito') {
          return <Lesson lessonId={lessonId} user={user} setUser={setUser} setActiveScreen={setActiveScreen} reviewMode={activeScreen.reviewMode} activeScreen={activeScreen} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta lição.</p>;
      case screenName === 'profile':
        return <Profile user={user} setUser={setUser} setActiveScreen={setActiveScreen} />;
      case screenName === 'wallet':
        if (user.role === 'student' || user.role === 'student-gratuito') {
          return <Wallet user={user} setUser={setUser} setActiveScreen={setActiveScreen} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta tela.</p>;
      case screenName === 'store':
        if (user.role === 'student' || user.role === 'student-gratuito') {
          return <Store user={user} setUser={setUser} setActiveScreen={setActiveScreen} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta tela.</p>;
      case screenName === 'challenges':
        return <Challenges user={user} setUser={setUser} setActiveScreen={setActiveScreen} />;
      case screenName === 'friends':
        if (user.role === 'student' || user.role === 'student-gratuito') {
          return <Friends user={user} setUser={setUser} setActiveScreen={setActiveScreen} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta tela.</p>;
      case screenName === 'achievements':
        return <Achievements user={user} setActiveScreen={setActiveScreen} />;
      case screenName === 'ranking':
        return <Ranking user={user} setActiveScreen={setActiveScreen} />;
      case screenName === 'news':
        return <News user={user} setActiveScreen={setActiveScreen} />;
      case screenName === 'parent-dashboard':
        if (user.role === 'parent') {
          return <ParentDashboard user={user} setUser={setUser} setActiveScreen={setActiveScreen} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta tela.</p>;
      case screenName === 'savings-config':
        if (user.role === 'parent') {
          return <SavingsConfig user={user} setUser={setUser} setActiveScreen={setActiveScreen} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta tela.</p>;
      case screenName === 'school-dashboard':
        if (user.role === 'school') {
          return <SchoolDashboard user={user} setActiveScreen={setActiveScreen} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta tela.</p>;
      case screenName === 'reports':
        if (user.role === 'school' || user.role === 'parent') {
          return <Reports user={user} setActiveScreen={setActiveScreen} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta tela.</p>;
      case screenName === 'settings':
        console.log('🔍 App.jsx - Renderizando Settings com user:', user);
        return <Settings user={user} handleLogout={handleLogout} setActiveScreen={setActiveScreen} onResetProgress={handleResetProgress} />;
      case screenName === 'classes':
        if (user.role === 'school') {
          return <Classes user={user} setActiveScreen={setActiveScreen} onChange={() => setActiveScreen('school-dashboard')} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta tela.</p>;
      default:
        if (user.role === 'student' || user.role === 'student-gratuito') {
          return <StudentDashboard user={user} setUser={setUser} onNavigate={handleNavigate} currentModule={currentModule} />;
        }
        if (user.role === 'parent') {
          return <ParentDashboard user={user} setUser={setUser} setActiveScreen={setActiveScreen} />;
        }
        if (user.role === 'school') {
          return <SchoolDashboard user={user} setActiveScreen={setActiveScreen} />;
        }
        return <Welcome setActiveScreen={setActiveScreen} />;
    }
  };

  // Lógica simplificada para mostrar navegação
  const screenName = getScreenName(activeScreen);
    const shouldShowNavigation = user && 
    !isInitializing &&
    screenName && 
    !screenName.startsWith('lesson-') && 
    !['welcome', 'login-student', 'login-parent', 'login-school', 'register-student', 'register-parent', 'register-school', 'register-gratuito', 'reset-password'].includes(screenName);

  if (isInitializing) return null;

  return (
    <div className="relative min-h-screen">
      {renderScreen()}
      {shouldShowNavigation && <Navigation role={user.role} activeScreen={activeScreen} setActiveScreen={setActiveScreen} />}
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);

// Export default para compatibilidade com Fast Refresh
export default App;