import React, { useState, useEffect } from 'react';

const Wallet = ({ user }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Carregar preferência do modo escuro
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);
  // Calcular incentivo real (exemplo: 10% do valor poupado)
  const incentiveRate = 0.10; // 10% de incentivo
  const incentiveAmount = (user.savings?.balance ?? 0) * incentiveRate;
  const totalWithIncentive = (user.savings?.balance ?? 0) + incentiveAmount;

  return (
    <div 
      className="min-h-screen bg-interface flex flex-col items-center p-4 pb-20"
      style={darkMode ? { backgroundColor: '#111827' } : {}}
    >
      <h1 
        className="text-4xl font-yufin text-primary mb-8"
        style={darkMode ? { color: '#fb923c' } : {}}
      >
        Carteira Virtual 🐷
      </h1>
      
      {/* Card Principal - Saldo Total */}
      <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg shadow-lg p-6 max-w-md w-full border-2 mb-4" style={{ borderColor: 'rgb(238, 145, 22)' }}>
        <h2 className="text-2xl font-bold mb-4 text-white">Saldo Total</h2>
        <p className="text-4xl font-bold text-white mb-2">R$ {totalWithIncentive.toFixed(2)}</p>
        <p className="text-green-100 text-sm">Incluindo incentivo educacional</p>
      </div>

      {/* Card - Poupança Base */}
      <div 
        className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border-2 mb-4" 
        style={{ 
          borderColor: 'rgb(238, 145, 22)',
          backgroundColor: darkMode ? '#374151' : 'white'
        }}
      >
        <h3 
          className="text-xl font-bold mb-3 text-gray-800"
          style={darkMode ? { color: '#ffffff' } : {}}
        >
          Poupança Base
        </h3>
        <p 
          className="text-2xl font-semibold text-teal mb-2"
          style={darkMode ? { color: '#14b8a6' } : {}}
        >
          R$ {(user.savings?.balance ?? 0).toFixed(2)}
        </p>
        <p 
          className="text-gray-600 text-sm mb-3"
          style={darkMode ? { color: '#e5e7eb' } : {}}
        >
          Valor acumulado pelas suas conquistas
        </p>
        
        {/* Incentivo Educacional */}
        <div 
          className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-400"
          style={darkMode ? { 
            backgroundColor: '#451a03', 
            borderLeftColor: '#fbbf24' 
          } : {}}
        >
          <div className="flex justify-between items-center">
            <span 
              className="text-sm font-medium text-yellow-800"
              style={darkMode ? { color: '#fbbf24' } : {}}
            >
              Incentivo Educacional
            </span>
            <span 
              className="text-lg font-bold text-yellow-600"
              style={darkMode ? { color: '#fbbf24' } : {}}
            >
              +{incentiveRate * 100}%
            </span>
          </div>
          <p 
            className="text-lg font-bold text-yellow-700 mt-1"
            style={darkMode ? { color: '#fbbf24' } : {}}
          >
            R$ {incentiveAmount.toFixed(2)}
          </p>
          <p 
            className="text-xs text-yellow-600 mt-1"
            style={darkMode ? { color: '#fbbf24' } : {}}
          >
            Bônus por manter foco nos estudos
          </p>
        </div>
      </div>

      {/* Card - Histórico */}
      <div 
        className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border-2" 
        style={{ 
          borderColor: 'rgb(238, 145, 22)',
          backgroundColor: darkMode ? '#374151' : 'white'
        }}
      >
        <h3 
          className="text-xl font-bold mb-4 text-gray-800"
          style={darkMode ? { color: '#ffffff' } : {}}
        >
          Histórico de Conquistas
        </h3>
        <div className="space-y-3 max-h-40 overflow-y-auto">
            {user.savings?.transactions?.length > 0 ? (
              user.savings.transactions.map((t, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
                  style={darkMode ? { backgroundColor: '#4b5563' } : {}}
                >
                  <div>
                    <p 
                      className="font-medium text-gray-800"
                      style={darkMode ? { color: '#ffffff' } : {}}
                    >
                      {t.reason}
                    </p>
                    <p 
                      className="text-xs text-gray-500"
                      style={darkMode ? { color: '#e5e7eb' } : {}}
                    >
                      Conquista recente
                    </p>
                  </div>
                  <span 
                    className="text-green-600 font-bold"
                    style={darkMode ? { color: '#10b981' } : {}}
                  >
                    + R$ {t.amount.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p 
                className="text-gray-500 text-sm"
                style={darkMode ? { color: '#e5e7eb' } : {}}
              >
                Nenhuma transação registrada ainda.
              </p>
            )}
        </div>
        <p 
          className="text-center text-gray-500 text-sm mt-3"
          style={darkMode ? { color: '#e5e7eb' } : {}}
        >
          Financiado por: Responsável
        </p>
      </div>
    </div>
  );
};

export default Wallet;