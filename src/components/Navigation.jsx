import React from 'react';

const Navigation = ({ role, activeScreen, setActiveScreen }) => {
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
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white shadow-lg z-50 rounded-t-xl" style={{ borderTop: '3px solid #EE9116' }}>
      <div className="flex justify-around items-center h-16 px-2 w-full">
        {navItems.map((item) => {
          const isActive = activeScreen === item.screen;
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.screen)}
              style={{
                color: isActive ? '#EE9116' : '#9CA3AF',
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full rounded-lg transition-all duration-200 mx-1 hover:bg-gray-50 focus:outline-none focus:ring-0`}
            >
              <span 
                style={{
                  color: isActive ? '#EE9116' : '#9CA3AF',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)'
                }}
                className="text-2xl mb-2 transition-transform duration-200"
              >
                {item.icon}
              </span>
              <span 
                style={{
                  color: isActive ? '#EE9116' : '#9CA3AF'
                }}
                className="text-sm font-medium transition-all duration-200"
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;