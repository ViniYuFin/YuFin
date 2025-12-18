import React, { useState, useEffect } from 'react';

const Challenges = ({ user }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Carregar preferência do modo escuro
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4"
      style={darkMode ? { 
        background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' 
      } : {}}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div 
          className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border-2" 
          style={{ 
            borderColor: 'rgb(238, 145, 22)',
            backgroundColor: darkMode ? '#374151' : 'white'
          }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
            <div className="flex-1">
              <h1 
                className="text-xl sm:text-2xl font-yufin text-primary mb-2"
                style={darkMode ? { color: '#fb923c' } : {}}
              >
                🏆 Desafios
              </h1>
              <p 
                className="text-gray-600 text-sm sm:text-base"
                style={darkMode ? { color: '#e5e7eb' } : {}}
              >
                Desafios especiais para aplicar o conhecimento em situações reais!
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo "Em Breve" */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-6 animate-pulse">🚧</div>
            <h2 
              className="text-3xl font-bold text-gray-800 mb-4"
              style={darkMode ? { color: '#ffffff' } : {}}
            >
              Em Breve
            </h2>
            <p 
              className="text-lg text-gray-600 mb-6 max-w-md"
              style={darkMode ? { color: '#e5e7eb' } : {}}
            >
              Estamos preparando desafios incríveis para você aplicar todo o conhecimento aprendido!
            </p>
            <div 
              className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 border border-yellow-200"
              style={darkMode ? { 
                background: 'linear-gradient(90deg, #451a03 0%, #7c2d12 100%)',
                borderColor: '#fbbf24'
              } : {}}
            >
              <p 
                className="text-yellow-800 font-medium"
                style={darkMode ? { color: '#fbbf24' } : {}}
              >
                💡 Desafios práticos que conectam teoria e realidade
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Challenges;