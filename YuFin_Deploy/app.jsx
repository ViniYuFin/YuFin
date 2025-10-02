import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Welcome from './src/components/Welcome';
import Navigation from './src/components/Navigation';
import Login from './src/components/Login';
import Register from './src/components/Register';
import RegisterWithToken from './src/components/RegisterWithToken';
import StudentDashboard from './src/components/StudentDashboard';
import Lesson from './src/components/Lesson';
import Profile from './src/components/Profile';
import Wallet from './src/components/Wallet';
import Store from './src/components/Store';
import ParentDashboard from './src/components/ParentDashboard';
import SavingsConfig from './src/components/SavingsConfig';
import Achievements from './src/components/Achievements';
import Ranking from './src/components/Ranking';
import News from './src/components/News';
import SchoolDashboard from './src/components/SchoolDashboard';
import Reports from './src/components/Reports';
import Challenges from './src/components/Challenges';
import Settings from './src/components/Settings';
import Friends from './src/components/Friends';
import IntelligentDashboard from './src/components/IntelligentDashboard';
import Classes from './src/components/Classes';
import { loginUser, registerUser, logoutUser, getCurrentSession } from './src/utils/authService';
import { storageService, STORAGE_KEYS } from './src/utils/storageService';
import notificationService from './src/utils/notificationService';
import analyticsService from './src/utils/analyticsService';
import performanceService from './src/utils/performanceService';
import aiService from './src/utils/aiService';
import advancedGamificationService from './src/utils/advancedGamificationService';
import { apiPatch, apiPost, apiDelete } from './src/utils/apiService';

function App() {
  const [activeScreen, setActiveScreen] = useState('welcome');
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentModule, setCurrentModule] = useState(() => {
    // Carregar módulo atual do localStorage ou usar 1 como padrão
    const savedModule = storageService.load(STORAGE_KEYS.CURRENT_MODULE);
    return savedModule || 1;
  });
  const [loading, setLoading] = useState(true);
  const [registrationToken, setRegistrationToken] = useState(null);

  // Efeito para detectar token de registro na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setRegistrationToken(token);
      setActiveScreen('register-with-token');
    }
  }, []);

  // Efeito para carregar o usuário do localStorage ao iniciar o app
  useEffect(() => {
    const savedUser = storageService.load(STORAGE_KEYS.USER);
    const session = getCurrentSession();
    if (savedUser && session) {
      try {
        setUser(savedUser);
        advancedGamificationService.loadData();
        if (savedUser.role === 'student') {
          setActiveScreen('home');
        } else if (savedUser.role === 'parent') {
          setActiveScreen('parent-dashboard');
        } else if (savedUser.role === 'school') {
          setActiveScreen('school-dashboard');
        } else if (savedUser.role === 'admin') {
          setActiveScreen('school-dashboard'); // Admin usa dashboard da escola
        }
      } catch (e) {
        storageService.remove(STORAGE_KEYS.USER);
        storageService.remove(STORAGE_KEYS.SESSION);
        setUser(null);
        setActiveScreen('welcome');
      }
    } else {
      // Limpa tudo e força welcome imediatamente
      storageService.remove(STORAGE_KEYS.USER);
      storageService.remove(STORAGE_KEYS.SESSION);
      // Limpar modo escuro do localStorage
      localStorage.removeItem('darkMode');
      // Remover classe dark do DOM
      document.documentElement.classList.remove('dark');
      setUser(null);
      setActiveScreen('welcome');
    }
    setIsInitializing(false);
  }, []);

  // Efeito para salvar/remover usuário no localStorage sempre que o estado 'user' muda
  useEffect(() => {
    if (user) {
      storageService.save(STORAGE_KEYS.USER, user);
      
      // Sincronizar módulo atual com o backend se o usuário for um estudante
      if (user.role === 'student' && user.currentModule) {
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
      setActiveScreen('welcome');
    }
  }, [user]);

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
      setActiveScreen('home');
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
    try {
      let newUser;
      
      // Usar o endpoint de registro unificado que já existe
      newUser = await registerUser(userData);
      
      setUser(newUser); // Atualiza o estado do usuário
      return { success: true }; // Retorna sucesso
    } catch (error) {
      return { success: false, message: error.message }; // Retorna erro
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
      
      logoutUser();
      setUser(null);
    }
  };

  // Função para zerar o progresso da série atual
  const handleResetProgress = async () => {
    if (!user) return;
    
    try {
      // Usar o endpoint de reset radical que volta ao 6º ano
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
        if (user.role === 'student') {
          setActiveScreen('home');
        }
      }, 1000);
    } catch (err) {
      notificationService.error('Erro ao zerar progresso no backend: ' + err.message);
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
      setActiveScreen('dashboard');
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
    // Telas que não requerem autenticação (usuário não logado)
    if (!user) {
      switch (screenName) {
        case 'welcome':
          return <Welcome setActiveScreen={setActiveScreen} />;
        case 'login-student':
          return <Login handleLogin={handleLogin} setActiveScreen={setActiveScreen} role="student" />;
        case 'login-parent':
          return <Login handleLogin={handleLogin} setActiveScreen={setActiveScreen} role="parent" />;
        case 'login-school':
          return <Login handleLogin={handleLogin} setActiveScreen={setActiveScreen} role="school" />;
        case 'register-student':
          return <Register handleRegister={handleRegister} setActiveScreen={setActiveScreen} role="student" />;
        case 'register-parent':
          return <Register handleRegister={handleRegister} setActiveScreen={setActiveScreen} role="parent" />;
        case 'register-school':
          return <Register handleRegister={handleRegister} setActiveScreen={setActiveScreen} role="school" />;
        case 'register-with-token':
          return <RegisterWithToken 
            token={registrationToken} 
            onSuccess={handleRegisterWithToken} 
            onCancel={handleCancelTokenRegistration} 
          />;
        default:
          return <Welcome setActiveScreen={setActiveScreen} />;
      }
    }
    // Telas que requerem autenticação (usuário logado)
    switch (true) {
      case screenName === 'home':
        if (user.role === 'student') {
          return <StudentDashboard user={user} setUser={setUser} onNavigate={handleNavigate} currentModule={currentModule} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta tela.</p>;
      case screenName === 'intelligent-dashboard':
        if (user.role === 'student') {
          return <IntelligentDashboard user={user} setUser={setUser} setActiveScreen={setActiveScreen} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta tela.</p>;
      case screenName === 'lesson':
        if (user.role === 'student') {
          return <Lesson lessonId={currentLesson} user={user} setUser={setUser} setActiveScreen={setActiveScreen} onComplete={handleLessonComplete} onNavigate={handleNavigate} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta lição.</p>;
      case screenName && screenName.startsWith('lesson-'):
        const lessonId = screenName.split('-')[1];
        if (user.role === 'student') {
          return <Lesson lessonId={lessonId} user={user} setUser={setUser} setActiveScreen={setActiveScreen} reviewMode={activeScreen.reviewMode} activeScreen={activeScreen} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta lição.</p>;
      case screenName === 'profile':
        return <Profile user={user} setUser={setUser} setActiveScreen={setActiveScreen} />;
      case screenName === 'wallet':
        if (user.role === 'student') {
          return <Wallet user={user} setUser={setUser} setActiveScreen={setActiveScreen} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta tela.</p>;
      case screenName === 'store':
        if (user.role === 'student') {
          return <Store user={user} setUser={setUser} setActiveScreen={setActiveScreen} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta tela.</p>;
      case screenName === 'challenges':
        return <Challenges user={user} setUser={setUser} setActiveScreen={setActiveScreen} />;
      case screenName === 'friends':
        if (user.role === 'student') {
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
        return <Settings user={user} handleLogout={handleLogout} setActiveScreen={setActiveScreen} onResetProgress={handleResetProgress} />;
      case screenName === 'classes':
        if (user.role === 'school') {
          return <Classes user={user} setActiveScreen={setActiveScreen} onChange={() => setActiveScreen('school-dashboard')} />;
        }
        return <p className="text-center text-red-500 mt-20">Acesso negado para esta tela.</p>;
      default:
        if (user.role === 'student') {
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
  const shouldShowNavigation = user && screenName && !screenName.startsWith('lesson-') && 
    !['welcome', 'login-student', 'login-parent', 'login-school', 'register-student', 'register-parent', 'register-school'].includes(screenName);

  // Debug logs
  console.log('Debug Navigation:', {
    user: !!user,
    userRole: user?.role,
    activeScreen,
    shouldShowNavigation
  });

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