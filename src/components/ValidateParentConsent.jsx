import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../utils/apiService';
import { loginUserGratuito } from '../utils/authService';
import API_CONFIG from '../config/api';

const ValidateParentConsent = ({ setActiveScreen }) => {
  const [status, setStatus] = useState('loading'); // loading, success, error, expired
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    // Extrair token da URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (!tokenFromUrl) {
      setStatus('error');
      setMessage('Token de validação não encontrado na URL.');
      return;
    }
    
    setToken(tokenFromUrl);
    validateToken(tokenFromUrl);
  }, []);

  const validateToken = async (validationToken) => {
    try {
      console.log('🔍 Validando token:', validationToken);
      
      // Fazer requisição para validar o token
      const apiUrl = API_CONFIG.BASE_URL;
      console.log('🌐 API URL:', apiUrl);
      console.log('🔗 URL completa:', `${apiUrl}/auth/validate-parent-consent/${validationToken}`);
      
      const response = await fetch(`${apiUrl}/auth/validate-parent-consent/${validationToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('📋 Resultado da validação:', result);

      if (response.ok) {
        // Token válido - usuário foi criado
        setStatus('success');
        setMessage('Conta validada com sucesso! Seu filho(a) já pode acessar a plataforma.');
        setUserData(result.user);
        
        // Opcional: fazer login automático
        if (result.user) {
          console.log('👤 Usuário criado:', result.user);
        }
      } else {
        // Token inválido ou expirado
        if (result.error === 'Token expirado') {
          setStatus('expired');
          setMessage('Este link de validação expirou. Solicite um novo link de validação.');
        } else if (result.error === 'Token já utilizado') {
          setStatus('success');
          setMessage('Esta conta já foi validada anteriormente. Seu filho(a) já pode acessar a plataforma.');
        } else {
          setStatus('error');
          setMessage(result.error || 'Erro ao validar o token. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('❌ Erro na validação:', error);
      setStatus('error');
      setMessage('Erro de conexão. Verifique sua internet e tente novamente.');
    }
  };

  const handleGoToLogin = () => {
    setActiveScreen('register-gratuito');
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Validando autorização...
            </h2>
            <p className="text-gray-600">
              Aguarde enquanto processamos a validação dos pais/responsáveis.
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              Validação Concluída!
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            {userData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm">
                  <strong>Conta criada para:</strong><br />
                  CPF: {userData.cpf}<br />
                  Série: {userData.gradeId || '6º Ano'}<br />
                  Plano: Gratuito (9 lições)
                </p>
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={handleGoToLogin}
                className="w-full py-3 px-4 rounded-lg font-semibold transition-colors"
                style={{ 
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#c2410c';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#ea580c';
                }}
              >
                Fazer Login Agora
              </button>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-4">
              Link Expirado
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>O que fazer:</strong><br />
                1. Solicite um novo cadastro<br />
                2. Um novo email será enviado<br />
                3. Valide dentro de 7 dias
              </p>
            </div>
            <button
              onClick={handleGoToHome}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-colors"
              style={{ 
                backgroundColor: '#ea580c',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#c2410c';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#ea580c';
              }}
            >
              Fazer Novo Cadastro
            </button>
          </div>
        );

      case 'error':
      default:
        return (
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Erro na Validação
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                <strong>Possíveis causas:</strong><br />
                • Link corrompido ou incompleto<br />
                • Token já foi utilizado<br />
                • Problema de conexão
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 px-4 rounded-lg font-semibold transition-colors"
                style={{ 
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#1d4ed8';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#2563eb';
                }}
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen auth-background-teal p-4 animate-fadeIn">
      <div className="bg-white p-8 lg:p-10 xl:p-12 rounded-xl shadow-lg w-full max-w-md text-center border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
        <h1 className="text-4xl font-yufin text-primary mb-6">
          YüFin
        </h1>
        <p className="text-gray-600 mb-6 text-sm">
          Validação de Autorização dos Pais/Responsáveis
        </p>
        
        {renderContent()}
      </div>
    </div>
  );
};

export default ValidateParentConsent;
