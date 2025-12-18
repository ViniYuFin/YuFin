import React, { useState } from 'react';
import { apiGet } from '../utils/apiService';

const Register = ({ handleRegister, setActiveScreen, role }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gradeId, setGradeId] = useState(''); // Campo vazio inicialmente
  const [token, setToken] = useState(''); // Campo para token
  const [tokenInfo, setTokenInfo] = useState(null); // Informações do token
  const [validatingToken, setValidatingToken] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Lista de séries disponíveis
  const availableGrades = [
    '6º Ano',
    '7º Ano', 
    '8º Ano',
    '9º Ano',
    '1º Ano EM',
    '2º Ano EM',
    '3º Ano EM'
  ];

  const onSubmitRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    if (role === 'student' && !gradeId) {
      setError('Por favor, selecione sua série.');
      setLoading(false);
      return;
    }

    // Validação de token apenas para alunos
    if (role === 'student') {
      if (!token) {
        setError('Por favor, insira o token de registro.');
        setLoading(false);
        return;
      }
      
      if (!tokenInfo) {
        setError('Por favor, insira um token válido.');
        setLoading(false);
        return;
      }
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      const result = await handleRegister({ 
        name, 
        email, 
        password, 
        role,
        gradeId: role === 'student' ? gradeId : undefined, // Incluir série apenas para alunos
        token: token.trim() || undefined // Incluir token se fornecido
      });
      if (!result.success) {
        setError(result.message);
      } else {
        // Redirecionar para a tela apropriada baseada na role
        if (role === 'student') {
          setActiveScreen('home');
        } else if (role === 'parent') {
          setActiveScreen('parent-dashboard');
        } else if (role === 'school') {
          setActiveScreen('school-dashboard');
        }
      }
    } catch (err) {
      setError("Ocorreu um erro inesperado. Tente novamente.");
      console.error("Erro no registro:", err);
    } finally {
      setLoading(false);
    }
  };

  // Função para validar token
  const validateToken = async (tokenValue) => {
    if (!tokenValue.trim()) {
      setTokenInfo(null);
      return;
    }

    try {
      setValidatingToken(true);
      setError('');
      const response = await apiGet(`/registration-tokens/validate/${tokenValue}`);
      setTokenInfo(response);
    } catch (error) {
      setTokenInfo(null);
      setError('Token inválido ou expirado');
    } finally {
      setValidatingToken(false);
    }
  };

  // Função para lidar com mudança no token
  const handleTokenChange = (e) => {
    const tokenValue = e.target.value;
    setToken(tokenValue);
    
    // Validar token quando o usuário parar de digitar
    if (tokenValue.trim()) {
      const timeoutId = setTimeout(() => validateToken(tokenValue), 1000);
      return () => clearTimeout(timeoutId);
    } else {
      setTokenInfo(null);
      setError('');
    }
  };

  // Função para validar token ao perder o foco
  const handleTokenBlur = () => {
    if (token.trim()) {
      validateToken(token);
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
    <div className="flex flex-col items-center justify-center min-h-screen auth-background-teal p-4 animate-fadeIn">
      <h2 className="text-4xl font-bold text-white mb-6 text-center">
        Registrar como <span className="font-yufin">{getRoleDisplayName(role)}</span>
      </h2>
      
      {/* Explicação sobre tokens - apenas para alunos */}
      {role === 'student' && (
        <div className="bg-white bg-opacity-90 rounded-lg p-4 mb-6 max-w-sm text-center border border-white border-opacity-50 shadow-lg">
          <p className="text-gray-800 text-sm font-medium">
            <strong>🔑 Token Obrigatório:</strong> Para se registrar como aluno, você precisa de um token gerado pela sua escola ou responsável.
          </p>
        </div>
      )}
      <form onSubmit={onSubmitRegister} className="bg-white p-8 lg:p-10 xl:p-12 rounded-xl shadow-lg w-full max-w-sm lg:max-w-md xl:max-w-lg flex flex-col space-y-4 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
        <input
          type="text"
          id="name-register"
          name="name"
          placeholder="Nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
          autoComplete="name"
        />
        <input
          type="email"
          id="email-register"
          name="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
          autoComplete="email"
        />
        
        {/* Campo de Token - Obrigatório apenas para alunos */}
        {role === 'student' && (
          <>
            <input
              type="text"
              id="token-register"
              name="token"
              placeholder="Token de registro"
              value={token}
              onChange={handleTokenChange}
              onBlur={handleTokenBlur}
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
            
            {/* Indicador de validação do token */}
            {validatingToken && (
              <div className="flex items-center text-blue-600 text-sm -mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Validando token...
              </div>
            )}
            
            {/* Informações do token válido */}
            {tokenInfo && !validatingToken && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md -mt-2">
                <div className="flex items-center text-green-700 text-sm">
                  <span className="mr-2">✅</span>
                  <span className="font-medium">Token válido!</span>
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {tokenInfo.type === 'school' ? '🏫 Escola' : '👨‍👩‍👧‍👦 Responsável'}: {tokenInfo.metadata?.description || 'Registro autorizado'}
                  {tokenInfo.metadata?.grade && (
                    <div>Série sugerida: {tokenInfo.metadata.grade}</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        {role === 'student' && (
          <select
            id="grade-register"
            name="gradeId"
            value={gradeId}
            onChange={(e) => setGradeId(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-500 placeholder-gray-400"
            required
            disabled={loading}
            style={{ color: gradeId ? '#6B7280' : '#9CA3AF' }}
          >
            <option value="" disabled className="text-gray-400">Selecione sua série</option>
            {availableGrades.map((grade) => (
              <option key={grade} value={grade} className="text-gray-700">
                {grade}
              </option>
            ))}
          </select>
        )}
        <input
          type="password"
          id="password-register"
          name="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
          autoComplete="new-password"
        />
        <input
          type="password"
          id="confirm-password-register"
          name="confirmPassword"
          placeholder="Confirmar senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
          autoComplete="new-password"
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
          <span className={`${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>Registrar</span>
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
        onClick={() => setActiveScreen(`login-${role}`)}
        className="mt-2 text-white text-md hover:underline transition-colors duration-300"
        disabled={loading}
      >
        Já tem conta? Faça login aqui!
      </button>
    </div>
  );
};

export default Register;