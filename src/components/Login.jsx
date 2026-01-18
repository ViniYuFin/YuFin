import React, { useState } from 'react';
import { getApiUrl } from '../config/environment';

const Login = ({ handleLogin, setActiveScreen, role }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  const onSubmitLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    try {
      const result = await handleLogin(email, password, role);
      if (result.success) {
        // Redirecionar para a tela apropriada baseada na role
        if (role === 'student') {
          setActiveScreen('home');
        } else if (role === 'parent') {
          setActiveScreen('parent-dashboard');
        } else if (role === 'school') {
          setActiveScreen('school-dashboard');
        } else if (role === 'admin') {
          setActiveScreen('school-dashboard'); // Admin usa dashboard da escola
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Ocorreu um erro inesperado. Tente novamente.");
      console.error("Erro no login:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'student': return 'Aluno';
      case 'parent': return 'Pai/Responsável';
      case 'school': return 'Escola';
      default: return '';
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setError('');

    try {
      const response = await fetch(`${getApiUrl()}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: forgotPasswordEmail.toLowerCase().trim(),
          role: role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao solicitar redefinição de senha');
      }

      setForgotPasswordSuccess(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
        setForgotPasswordSuccess(false);
      }, 3000);
    } catch (error) {
      setError(error.message || 'Erro ao solicitar redefinição de senha');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen auth-background p-4 animate-fadeIn" style={{ opacity: showForgotPassword ? 0.3 : 1, transition: 'opacity 0.3s ease', pointerEvents: showForgotPassword ? 'none' : 'auto' }}>
        <h2 className="text-4xl font-bold text-white mb-6 text-center">
          Entrar como <span className="font-yufin">{getRoleDisplayName(role)}</span>
        </h2>
        <form onSubmit={onSubmitLogin} className="bg-white p-8 lg:p-10 xl:p-12 rounded-xl shadow-lg w-full max-w-sm lg:max-w-md xl:max-w-lg flex flex-col space-y-4 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
        <input
          type="email"
          id="email-login"
          name="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
          autoComplete="email"
        />
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? "text" : "password"}
            id="password-login"
            name="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            required
            disabled={loading}
            autoComplete="current-password"
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
              zIndex: 10,
              outline: 'none',
              boxShadow: 'none'
            }}
            disabled={loading}
          >
            {showPassword ? (
              <span style={{ fontSize: '18px' }}>🙈</span>
            ) : (
              <span style={{ fontSize: '18px' }}>👁️</span>
            )}
          </button>
        </div>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setShowForgotPassword(true);
          }}
          className="text-sm text-right text-blue-600 hover:underline"
          style={{ textAlign: 'left', color: 'rgb(238, 145, 22)' }}
        >
          Esqueci minha senha
        </a>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="text-white font-bold py-3 px-6 rounded-xl shadow-md hover:opacity-90 transition-all duration-300 text-lg flex items-center justify-center relative"
          style={{ backgroundColor: 'rgb(238, 145, 22)' }}
          disabled={loading}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
          <span className={`${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>Entrar</span>
        </button>
      </form>
      <button
        onClick={() => setActiveScreen('welcome')}
        className="mt-6 text-white text-md hover:underline transition-colors duration-300"
        disabled={loading}
      >
        Voltar
      </button>
      <button
        onClick={() => setActiveScreen(`register-${role}`)}
        className="mt-2 text-white text-md hover:underline transition-colors duration-300"
        disabled={loading}
      >
        Não tem conta? Registre-se aqui!
      </button>
      </div>

      {/* Modal de Esqueci minha senha */}
      {showForgotPassword && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => {
            if (!forgotPasswordLoading) {
              setShowForgotPassword(false);
              setForgotPasswordEmail('');
              setForgotPasswordSuccess(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              border: '2px solid rgb(238, 145, 22)',
              position: 'relative',
              zIndex: 1001,
              opacity: 1
            }}
          >
            <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: 'rgb(238, 145, 22)' }}>
              Esqueci minha senha
            </h3>
            
            {forgotPasswordSuccess ? (
              <div className="text-center py-4">
                <p className="text-green-600 mb-4">
                  ✅ Email enviado com sucesso! Verifique sua caixa de entrada.
                </p>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                    setForgotPasswordSuccess(false);
                  }}
                  className="px-4 py-2 rounded-lg text-white font-semibold"
                  style={{ backgroundColor: 'rgb(238, 145, 22)' }}
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Digite seu email e enviaremos um link para redefinir sua senha.
                </p>
                <form onSubmit={handleForgotPassword}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="seu@email.com"
                      disabled={forgotPasswordLoading}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordEmail('');
                        setError('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      disabled={forgotPasswordLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={forgotPasswordLoading}
                      className="flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-opacity"
                      style={{ 
                        backgroundColor: 'rgb(238, 145, 22)',
                        opacity: forgotPasswordLoading ? 0.6 : 1,
                        cursor: forgotPasswordLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {forgotPasswordLoading ? 'Enviando...' : 'Enviar'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
