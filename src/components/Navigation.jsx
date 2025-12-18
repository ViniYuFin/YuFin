import React, { useState, useEffect } from 'react';

const Navigation = ({ role, activeScreen, setActiveScreen }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Carregar preferência do modo escuro
    const loadDarkMode = () => {
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      setDarkMode(savedDarkMode);
    };

    // Carregar inicialmente
    loadDarkMode();

    // Listener customizado para mudanças dentro da mesma aba
    const handleCustomStorageChange = () => {
      loadDarkMode();
    };

    window.addEventListener('darkModeChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('darkModeChanged', handleCustomStorageChange);
    };
  }, []);
  const getNavItems = () => {
    switch (role) {
      case 'student':
        return [
          { id: 'home', label: 'Início', icon: '🏠', screen: 'home' },
          { id: 'intelligent-dashboard', label: 'IA', icon: '🤖', screen: 'intelligent-dashboard' },
          { id: 'friends', label: 'Amigos', icon: '👥', screen: 'friends' },
          { id: 'challenges', label: 'Desafios', icon: '🏆', screen: 'challenges' },
          { id: 'store', label: 'Loja', icon: '🛍️', screen: 'store' },
          { id: 'wallet', label: 'Carteira', icon: '💰', screen: 'wallet' },
          { id: 'settings', label: 'Config', icon: '⚙️', screen: 'settings' }
        ];
      case 'student-gratuito':
        return [
          { id: 'home', label: 'Início', icon: '🏠', screen: 'home', enabled: true },
          { id: 'intelligent-dashboard', label: 'IA', icon: '🤖', screen: 'intelligent-dashboard', enabled: false },
          { id: 'friends', label: 'Amigos', icon: '👥', screen: 'friends', enabled: false },
          { id: 'challenges', label: 'Desafios', icon: '🏆', screen: 'challenges', enabled: false },
          { id: 'store', label: 'Loja', icon: '🛍️', screen: 'store', enabled: false },
          { id: 'wallet', label: 'Carteira', icon: '💰', screen: 'wallet', enabled: false },
          { id: 'settings', label: 'Config', icon: '⚙️', screen: 'settings', enabled: true }
        ];
      case 'parent':
        return [
          { id: 'parent-dashboard', label: 'Dashboard', icon: '📊', screen: 'parent-dashboard' },
          { id: 'savings-config', label: 'Poupança', icon: '🏦', screen: 'savings-config' },
          { id: 'reports', label: 'Relatórios', icon: '📈', screen: 'reports' },
          { id: 'settings', label: 'Config', icon: '⚙️', screen: 'settings' }
        ];
      case 'school':
        return [
          { id: 'school-dashboard', label: 'Dashboard', icon: '🏫', screen: 'school-dashboard' },
          { id: 'classes', label: 'Turmas', icon: '📚', screen: 'classes' },
          { id: 'reports', label: 'Relatórios', icon: '📈', screen: 'reports' },
          { id: 'news', label: 'Notícias', icon: '📰', screen: 'news' },
          { id: 'settings', label: 'Config', icon: '⚙️', screen: 'settings' }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 w-full shadow-lg z-50 rounded-t-xl" 
      style={{ 
        borderTop: '3px solid #EE9116',
        backgroundColor: darkMode ? '#374151' : 'white',
        color: darkMode ? '#ffffff' : '#000000'
      }}
    >
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:justify-around lg:px-2 w-full">
        {navItems.map((item) => {
          const isActive = activeScreen === item.screen;
          const isEnabled = item.enabled !== false; // Default true se não especificado
          
          const handleClick = () => {
            if (isEnabled) {
              setActiveScreen(item.screen);
            } else {
              // Mostrar modal de upgrade para usuários gratuitos
              alert('🔒 Esta funcionalidade está disponível no plano completo!\n\nUpgrade seu plano para acessar IA, Amigos, Desafios, Loja e Carteira!');
            }
          };

          return (
            <button
              key={item.id}
              onClick={handleClick}
              className={`flex flex-col items-center justify-center p-1 sm:p-2 tour-nav-${item.id}`}
              style={{
                color: isActive ? '#EE9116' : (isEnabled ? (darkMode ? '#ffffff' : '#9CA3AF') : (darkMode ? '#6B7280' : '#D1D5DB')),
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
                backgroundColor: darkMode ? 'transparent' : 'transparent',
                cursor: isEnabled ? 'pointer' : 'not-allowed',
                opacity: isEnabled ? 1 : 0.4
              }}
            >
              <div className="flex flex-col items-center space-y-1">
                <span 
                  style={{
                    color: isActive ? '#EE9116' : (isEnabled ? (darkMode ? '#ffffff' : '#9CA3AF') : (darkMode ? '#6B7280' : '#D1D5DB')),
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    filter: isEnabled ? (darkMode && !isActive ? 'brightness(1.2) contrast(1.1)' : 'none') : 'grayscale(0.3)'
                  }}
                  className="text-2xl transition-transform duration-200"
                >
                  {item.icon}
                </span>
                <span 
                  style={{
                    color: isActive ? '#EE9116' : (isEnabled ? (darkMode ? '#ffffff' : '#9CA3AF') : (darkMode ? '#6B7280' : '#D1D5DB'))
                  }}
                  className="text-sm font-medium transition-all duration-200"
                >
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;