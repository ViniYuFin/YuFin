import React, { useState, useEffect } from 'react';
import { apiPost, apiGet } from '../utils/apiService';
import notificationService from '../utils/notificationService';

const Wallet = ({ user }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [redemptionStatus, setRedemptionStatus] = useState(null);
  const [canRequestRedemption, setCanRequestRedemption] = useState(false);
  const [requestingRedemption, setRequestingRedemption] = useState(false);
  const [gradeProgression, setGradeProgression] = useState(null);

  useEffect(() => {
    // Carregar preferência do modo escuro
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    // Carregar status de resgate e progressão
    loadRedemptionStatus();
  }, [user]);

  useEffect(() => {
    // Carregar status de progressão após carregar status de resgate
    if (redemptionStatus !== null) {
      loadGradeProgressionStatus();
    }
  }, [redemptionStatus]);

  const loadRedemptionStatus = async () => {
    try {
      const status = await apiGet(`/students/${user.id}/wallet-redemption-status`);
      setRedemptionStatus(status);
    } catch (error) {
      console.error('Erro ao carregar status de resgate:', error);
    }
  };

  const loadGradeProgressionStatus = async () => {
    try {
      const status = await apiGet(`/users/${user.id}/grade-progression-status`);
      setGradeProgression(status);
      
      // Atualizar canRequestRedemption considerando trilha completa
      // hasCompletedCurrentGrade está no objeto raiz, não em progression
      const hasCompletedGrade = status?.hasCompletedCurrentGrade || false;
      const hasBalance = (user.savings?.balance ?? 0) > 0;
      
      // Verificar status de resgate atual
      const currentRedemptionStatus = redemptionStatus || { hasPendingRequest: false };
      const hasPendingRequest = currentRedemptionStatus.hasPendingRequest || false;
      
      setCanRequestRedemption(hasCompletedGrade && !hasPendingRequest && hasBalance);
      
      // Debug: Log para verificar condições
      console.log('🔍 [Wallet] Verificação de resgate:', {
        hasCompletedGrade,
        hasBalance,
        hasPendingRequest,
        canRequest: hasCompletedGrade && !hasPendingRequest && hasBalance,
        status: status,
        balance: user.savings?.balance
      });
    } catch (error) {
      console.error('Erro ao carregar status de progressão:', error);
    }
  };

  const handleRequestRedemption = async () => {
    if (requestingRedemption) return;
    
    try {
      setRequestingRedemption(true);
      const response = await apiPost(`/students/${user.id}/request-wallet-redemption`);
      notificationService.success(response.message || 'Solicitação de resgate enviada com sucesso!');
      await loadRedemptionStatus();
    } catch (error) {
      console.error('Erro ao solicitar resgate:', error);
      notificationService.error(error.message || 'Erro ao solicitar resgate');
    } finally {
      setRequestingRedemption(false);
    }
  };
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
        <h2 className="text-2xl font-bold mb-4 text-white text-center">Saldo Total</h2>
        <p className="text-4xl font-bold text-white mb-2 text-center">R$ {totalWithIncentive.toFixed(2)}</p>
        <p className="text-green-100 text-sm mb-3 text-center">Incluindo incentivo educacional</p>
        
        {/* Botão de Resgate */}
        {(() => {
          const hasCompletedGrade = gradeProgression?.hasCompletedCurrentGrade || false;
          const hasBalance = (user.savings?.balance ?? 0) > 0;
          const hasPendingRequest = redemptionStatus?.hasPendingRequest || false;
          const shouldShowButton = canRequestRedemption && hasCompletedGrade && !hasPendingRequest && hasBalance;
          
          // Debug: Log para verificar condições de exibição
          console.log('🔍 [Wallet] Condições do botão:', {
            canRequestRedemption,
            hasCompletedGrade,
            hasBalance,
            hasPendingRequest,
            shouldShowButton,
            gradeProgression: gradeProgression
          });
          
          return shouldShowButton ? (
            <button
              onClick={handleRequestRedemption}
              disabled={requestingRedemption}
              className="bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:from-green-500 hover:to-green-700 transition-all duration-200 w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ border: '1px solid rgba(255, 255, 255, 0.3)' }}
            >
              {requestingRedemption ? 'Solicitando...' : 'Solicitar Resgate'}
            </button>
          ) : null;
        })()}
        
        {redemptionStatus?.hasPendingRequest && (
          <div 
            className="mt-3 p-2 rounded-lg"
            style={{ 
              backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.3)'
            }}
          >
            <p 
              className="text-sm text-center font-semibold text-white"
            >
              ⏳ Solicitação de resgate pendente
            </p>
          </div>
        )}
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
          className="text-xl font-bold mb-3 text-gray-800 text-center"
          style={darkMode ? { color: '#ffffff' } : {}}
        >
          Poupança Base
        </h3>
        <p 
          className="text-2xl font-semibold text-teal mb-2 text-center"
          style={darkMode ? { color: '#14b8a6' } : {}}
        >
          R$ {(user.savings?.balance ?? 0).toFixed(2)}
        </p>
        <p 
          className="text-gray-600 text-sm mb-3 text-center"
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
          <div className="flex justify-center items-center gap-2">
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
            className="text-lg font-bold text-yellow-700 mt-1 text-center"
            style={darkMode ? { color: '#fbbf24' } : {}}
          >
            R$ {incentiveAmount.toFixed(2)}
          </p>
          <p 
            className="text-xs text-yellow-600 mt-1 text-center"
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
          className="text-xl font-bold mb-4 text-gray-800 text-center"
          style={darkMode ? { color: '#ffffff' } : {}}
        >
          Histórico de Conquistas
        </h3>
        <div 
          className={`space-y-3 max-h-40 overflow-y-auto ${darkMode ? 'wallet-scrollbar-dark' : 'wallet-scrollbar-light'}`}
        >
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
                className="text-gray-500 text-sm text-center"
                style={darkMode ? { color: '#e5e7eb' } : {}}
              >
                Nenhuma transação registrada ainda.
              </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;