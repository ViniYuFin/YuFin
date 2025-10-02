import React, { useState } from 'react';

const Login = ({ handleLogin, setActiveScreen, role }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen auth-background p-4 animate-fadeIn">
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
        <input
          type="password"
          id="password-login"
          name="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
          autoComplete="current-password"
        />
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
  );
};

export default Login;
