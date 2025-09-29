import React, { useEffect, useState } from 'react';
import devModeService from '../utils/devModeService';
import notificationService from '../utils/notificationService';

// Agora recebe 'handleLogout' e 'onResetProgress' como props
const Settings = ({ user, handleLogout, onResetProgress }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [devMode, setDevMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Solicita permissão para notificações quando o componente é montado
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    // Carregar preferências salvas
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedNotifications = localStorage.getItem('notifications') !== 'false';
    const savedSound = localStorage.getItem('sound') !== 'false';
    
    setDarkMode(savedDarkMode);
    setNotifications(savedNotifications);
    setSound(savedSound);

    // Verificar status de admin e modo dev
    const adminStatus = devModeService.checkAdminStatus(user);
    const devModeStatus = devModeService.isDevModeEnabled();
    
    setIsAdmin(adminStatus);
    setDevMode(devModeStatus);
  }, [user]);

  // Aplicar modo escuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const sendNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Poupí te chama!', { body: 'Complete um desafio diário hoje!' });
    } else {
      alert('Permissão de notificações não concedida. Habilite nas configurações do seu navegador.');
    }
  };

  const handleNotificationToggle = () => {
    setNotifications(!notifications);
    localStorage.setItem('notifications', !notifications);
    if (!notifications) {
      sendNotification();
    }
  };

  const handleSoundToggle = () => {
    setSound(!sound);
    localStorage.setItem('sound', !sound);
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  const handleDevModeToggle = () => {
    const success = devModeService.toggleDevMode(user);
    
    if (success) {
      const newDevMode = devModeService.isDevModeEnabled();
      setDevMode(newDevMode);
      
      // Disparar evento customizado para notificar outros componentes
      window.dispatchEvent(new CustomEvent('devModeChanged', { 
        detail: { enabled: newDevMode } 
      }));
      
      // Mostrar notificação
      if (newDevMode) {
        notificationService.success('🔧 Modo Dev ativado! Todas as lições e séries liberadas.');
      } else {
        notificationService.success('🔧 Modo Dev desativado. Voltando ao fluxo normal.');
      }
    } else {
      notificationService.error('Acesso negado ao Modo Dev. Apenas administradores podem usar esta funcionalidade.');
    }
  };

  return (
    <div className="min-h-screen bg-interface flex flex-col items-center p-4 pb-20" role="main" aria-label="Tela de Configurações">
      <h1 className="text-4xl font-yufin text-primary mb-8 animate-fadeIn" aria-label="Título das Configurações">Configurações ⚙️</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
        <h2 className="text-2xl font-bold mb-6" aria-label="Subtítulo das Configurações">Ajustes</h2>
        
        <div className="space-y-6">
          {/* Modo Escuro/Claro */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🌙</span>
              <div>
                <label className="block font-semibold text-gray-800" aria-label="Modo Escuro">Modo Escuro</label>
                <span className="text-sm text-gray-600">Alternar entre tema claro e escuro</span>
              </div>
            </div>
            <button
              onClick={handleDarkModeToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? 'bg-primary' : 'bg-gray-300'
              }`}
              aria-label={`${darkMode ? 'Desativar' : 'Ativar'} modo escuro`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Notificações */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🔔</span>
          <div>
                <label className="block font-semibold text-gray-800" aria-label="Notificações">Notificações</label>
                <span className="text-sm text-gray-600">Lembretes diários e conquistas</span>
              </div>
            </div>
            <button
              onClick={handleNotificationToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications ? 'bg-primary' : 'bg-gray-300'
              }`}
              aria-label={`${notifications ? 'Desativar' : 'Ativar'} notificações`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Som */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🔊</span>
          <div>
                <label className="block font-semibold text-gray-800" aria-label="Som">Som</label>
                <span className="text-sm text-gray-600">Sons de feedback e conquistas</span>
              </div>
            </div>
            <button
              onClick={handleSoundToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                sound ? 'bg-primary' : 'bg-gray-300'
              }`}
              aria-label={`${sound ? 'Desativar' : 'Ativar'} som`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  sound ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Modo Dev - Apenas para Administradores */}
          {isAdmin && (
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-2 border-red-200">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🔧</span>
                <div>
                  <label className="block font-semibold text-red-800" aria-label="Modo Dev">Modo Dev</label>
                  <span className="text-sm text-red-600">
                    {devMode ? 'Todas as lições e séries liberadas' : 'Liberar todas as lições e séries'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleDevModeToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  devMode ? 'bg-red-500' : 'bg-gray-300'
                }`}
                aria-label={`${devMode ? 'Desativar' : 'Ativar'} modo dev`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    devMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Informações da Conta */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">Informações da Conta</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Nome:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Tipo:</strong> {user.role === 'student' ? 'Estudante' : user.role === 'parent' ? 'Responsável' : 'Escola'}</p>
            </div>
          </div>

          {/* Botão de Sair da Conta */}
          <button
            onClick={handleLogout}
            className="mt-6 w-full text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 hover:opacity-90"
            style={{ backgroundColor: 'rgb(238, 145, 22)' }}
            aria-label="Sair da Conta"
          >
            Sair da Conta
          </button>

          {/* Botão de Zerar Progresso - Apenas para Estudantes */}
          {user.role === 'student' && (
            <button
              onClick={() => {
                if (window.confirm('Tem certeza que deseja zerar o progresso da série atual? O progresso de outras séries será mantido. Esta ação não pode ser desfeita!')) {
                  if (typeof onResetProgress === 'function') onResetProgress();
                }
              }}
              className="mt-4 w-full text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 hover:opacity-90"
              style={{ backgroundColor: 'rgb(238, 145, 22)' }}
              aria-label="Zerar Progresso"
            >
              Zerar Progresso
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;