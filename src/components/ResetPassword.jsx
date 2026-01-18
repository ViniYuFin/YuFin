import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/environment';

const ResetPassword = ({ setActiveScreen }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Extrair token da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!token) {
      setError('Token inválido. Por favor, use o link enviado por email.');
      setLoading(false);
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha');
      }

      setSuccess(true);
      
      // Limpar token da URL
      const url = new URL(window.location);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url);
      
      setTimeout(() => {
        setActiveScreen('welcome');
      }, 3000);
    } catch (error) {
      setError(error.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen auth-background p-4 animate-fadeIn">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(238, 145, 22)', fontFamily: "'Nunito', sans-serif" }}>
              Senha Redefinida!
            </h2>
            <p className="text-gray-600 mb-6" style={{ fontFamily: "'Nunito', sans-serif" }}>
              Sua senha foi redefinida com sucesso. Você será redirecionado para a tela de login em instantes.
            </p>
            <button
              onClick={() => setActiveScreen('welcome')}
              className="px-6 py-3 rounded-xl text-white font-semibold"
              style={{ backgroundColor: 'rgb(238, 145, 22)', fontFamily: "'Nunito', sans-serif" }}
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen auth-background p-4 animate-fadeIn">
      <h2 className="text-4xl font-bold text-white mb-6 text-center" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <span style={{ fontFamily: "'Nunito', sans-serif" }}>Redefinir </span>
        <span style={{ fontFamily: "'Cherry Bomb One', cursive" }}>Senha</span>
      </h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 lg:p-10 xl:p-12 rounded-xl shadow-lg w-full max-w-sm lg:max-w-md xl:max-w-lg flex flex-col space-y-4 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
        {!token && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>
              ⚠️ Token não encontrado. Por favor, use o link enviado por email.
            </p>
          </div>
        )}
        
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nova Senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="p-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            style={{ fontFamily: "'Nunito', sans-serif" }}
            required
            disabled={loading || !token}
            autoComplete="new-password"
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              zIndex: 10
            }}
            disabled={loading || !token}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirmar Nova Senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="p-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            style={{ fontFamily: "'Nunito', sans-serif" }}
            required
            disabled={loading || !token}
            autoComplete="new-password"
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              zIndex: 10
            }}
            disabled={loading || !token}
          >
            {showConfirmPassword ? '🙈' : '👁️'}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>{error}</p>}
        
        <button
          type="submit"
          className="text-white font-bold py-3 px-6 rounded-xl shadow-md hover:opacity-90 transition-all duration-300 text-lg flex items-center justify-center relative"
          style={{ backgroundColor: 'rgb(238, 145, 22)', fontFamily: "'Nunito', sans-serif" }}
          disabled={loading || !token}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
          <span className={`${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`} style={{ fontFamily: "'Nunito', sans-serif" }}>
            Redefinir Senha
          </span>
        </button>
      </form>
      
      <button
        onClick={() => setActiveScreen('welcome')}
        className="mt-6 text-white text-md hover:underline transition-colors duration-300"
        style={{ fontFamily: "'Nunito', sans-serif" }}
        disabled={loading}
      >
        Voltar
      </button>
    </div>
  );
};

export default ResetPassword;

