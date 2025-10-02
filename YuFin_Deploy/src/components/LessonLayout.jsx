import React, { useState, useEffect } from 'react';

const LessonLayout = ({ title, timeSpent, onExit, children, icon, reviewMode }) => {
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

  return (
    <div className="h-screen lesson-background flex flex-col font-sans">
    {/* Header padronizado */}
    <div 
      className="backdrop-blur-md p-4 shadow-xl border-b-4 border-primary-dark rounded-b-3xl"
      style={{
        backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)'
      }}
    >
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="transition text-2xl font-bold px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          style={{
            color: darkMode ? '#ffffff' : '#6b7280'
          }}
          aria-label="Sair da lição"
        >
          ←
        </button>
        <div className="flex items-center gap-2">
          {icon && <span className="text-3xl">{icon}</span>}
          <h1 
            className="text-2xl lg:text-3xl xl:text-4xl font-yufin font-bold drop-shadow-sm tracking-tight"
            style={{
              color: darkMode ? '#ffffff' : '#EE9116'
            }}
          >
            {title}
          </h1>
        </div>
        <div 
          className="text-sm font-semibold min-w-[48px] text-right font-sans"
          style={{
            color: darkMode ? '#ffffff' : '#6b7280'
          }}
        >
          {timeSpent}s
        </div>
      </div>
    </div>

    {/* Área central de conteúdo */}
    <div className="flex-1 flex items-center justify-center p-6 lg:p-8 xl:p-12 pb-20 lesson-content-background">
      <div 
        className="rounded-2xl shadow-2xl border-2 border-primary/20 p-6 lg:p-8 xl:p-12 max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl w-full animate-fade-in font-sans transition-all duration-300 overflow-y-auto"
        style={{
          backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.95)' : 'rgba(255, 255, 255, 0.95)'
        }}
      >
        {reviewMode && (
          <div 
            className="mb-4 p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 animate-fadeIn"
            style={{
              backgroundColor: darkMode ? '#451a03' : '#fef3c7',
              borderColor: darkMode ? '#fbbf24' : '#f59e0b',
              color: darkMode ? '#fbbf24' : '#92400e'
            }}
          >
            <span className="text-xl">🔄</span> Modo Revisão Ativo — Nenhuma recompensa será computada
          </div>
        )}
        {children}
      </div>
    </div>
    </div>
  );
};

export default LessonLayout; 