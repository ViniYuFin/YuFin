import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../utils/apiService';
import { loginUserGratuito } from '../utils/authService';

const RegisterGratuito = ({ handleRegister, handleLoginGratuito, setActiveScreen }) => {
  console.log('🎯 RegisterGratuito component renderizado!');
  console.log('🔍 Props recebidas:', { 
    handleRegister: !!handleRegister, 
    handleLoginGratuito: !!handleLoginGratuito, 
    setActiveScreen: !!setActiveScreen 
  });
  
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentConsent, setParentConsent] = useState(false);
  const [gradeId, setGradeId] = useState(''); // Campo para seleção de série
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Debug: Log de mudanças de estado
  useEffect(() => {
    console.log('🔍 RegisterGratuito - Estado atualizado:', {
      cpf: cpf ? '***' + cpf.slice(-4) : 'vazio',
      isFirstAccess,
      emailSent,
      loading,
      error: error ? 'tem erro' : 'sem erro'
    });
  }, [cpf, isFirstAccess, emailSent, loading, error]);

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


  // Função para validar CPF
  const validateCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  };

  // Função para validar email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Função para formatar CPF
  const formatCPF = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Função para verificar se CPF já existe
  const checkCPFExists = async (cpfValue) => {
    console.log('🔍 CHECK-CPF - Verificando CPF:', cpfValue);
    try {
      const response = await apiGet(`/auth/check-cpf/${cpfValue}`);
      console.log('🔍 CHECK-CPF - Resposta recebida:', response);
      return response.exists;
    } catch (error) {
      console.error('❌ Erro ao verificar CPF:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      return false;
    }
  };

  // Função para lidar com mudança no CPF
  const handleCPFChange = async (e) => {
    console.log('🔍 HANDLE-CPF-CHANGE - Iniciando');
    const value = e.target.value;
    const formattedValue = formatCPF(value);
    console.log('🔍 HANDLE-CPF-CHANGE - Valor formatado:', formattedValue);
    setCpf(formattedValue);
    
    // Validar CPF em tempo real
    const cleanCPF = value.replace(/[^\d]/g, '');
    console.log('🔍 HANDLE-CPF-CHANGE - CPF limpo:', cleanCPF);
    
    if (cleanCPF.length === 11) {
      console.log('🔍 HANDLE-CPF-CHANGE - CPF com 11 dígitos, validando...');
      if (!validateCPF(cleanCPF)) {
        console.log('❌ HANDLE-CPF-CHANGE - CPF inválido');
        setError('CPF inválido');
        return;
      }
      
      console.log('✅ HANDLE-CPF-CHANGE - CPF válido, verificando se existe...');
      // Verificar se CPF já existe - apenas mostrar mensagem se estiver tentando cadastrar
      const exists = await checkCPFExists(cleanCPF);
      console.log('🔍 HANDLE-CPF-CHANGE - CPF existe?', exists);
      
      if (exists) {
        console.log('🔍 HANDLE-CPF-CHANGE - CPF existe');
        // Se CPF já existe, mostrar mensagem apenas na tela de cadastro
        if (isFirstAccess) {
          console.log('🔍 HANDLE-CPF-CHANGE - Mostrando mensagem de CPF já cadastrado');
          setError('CPF já cadastrado');
        } else {
          console.log('🔍 HANDLE-CPF-CHANGE - Limpando erro (tela de login)');
          setError(''); // Limpar erro se estiver na tela de login
        }
      } else {
        console.log('🔍 HANDLE-CPF-CHANGE - CPF não existe');
        // Se CPF não existe, mostrar mensagem informativa sem redirecionar
        if (!isFirstAccess) {
          console.log('🔍 HANDLE-CPF-CHANGE - Mostrando mensagem de CPF não cadastrado');
          setError('CPF não cadastrado');
        } else {
          console.log('🔍 HANDLE-CPF-CHANGE - Limpando erro (tela de cadastro)');
          setError(''); // Limpar erro se estiver na tela de cadastro
        }
      }
    } else {
      console.log('🔍 HANDLE-CPF-CHANGE - CPF com menos de 11 dígitos, limpando erro');
      setError('');
    }
  };

  // Função para lidar com o login (CPF + Senha)
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!cpf || !password) {
      setError('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    const cleanCPF = cpf.replace(/[^\d]/g, '');
    if (!validateCPF(cleanCPF)) {
      setError('CPF inválido.');
      setLoading(false);
      return;
    }

    try {
      const result = await handleLoginGratuito(cleanCPF, password);
      if (!result.success) {
        setError(result.message);
      } else {
        setActiveScreen('home');
      }
    } catch (err) {
      setError("Ocorreu um erro inesperado. Tente novamente.");
      console.error("Erro no login:", err);
    } finally {
      setLoading(false);
    }
  };

  // Função para lidar com o registro (CPF + Senha + Termo)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!cpf || !password || !confirmPassword || !parentEmail || !gradeId) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    const cleanCPF = cpf.replace(/[^\d]/g, '');
    if (!validateCPF(cleanCPF)) {
      setError('CPF inválido.');
      setLoading(false);
      return;
    }

    if (!validateEmail(parentEmail)) {
      setError('Email dos pais/responsáveis inválido.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (!parentConsent) {
      setError('É necessário o consentimento dos pais/responsáveis.');
      setLoading(false);
      return;
    }

    try {
      const result = await handleRegister({ 
        cpf: cleanCPF,
        password,
        confirmPassword,
        parentEmail,
        parentConsent: true,
        gradeId,
        role: 'student-gratuito'
      });
      
      if (!result.success) {
        setError(result.message);
      } else {
        // Verificar se requer validação por email
        if (result.requiresEmailValidation) {
          setEmailSent(true);
          setError(''); // Limpar erros
        } else {
          setActiveScreen('home');
        }
      }
    } catch (err) {
      setError("Ocorreu um erro inesperado. Tente novamente.");
      console.error("Erro no registro:", err);
    } finally {
      setLoading(false);
    }
  };

  console.log('🎯 RegisterGratuito: Iniciando renderização do JSX');
  
  // Tela de confirmação de email enviado
  if (emailSent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen auth-background-teal p-4 animate-fadeIn">
        <div className="bg-white p-8 lg:p-10 xl:p-12 rounded-xl shadow-lg w-full max-w-md text-center border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Email Enviado!
          </h2>
          <p className="text-gray-600 mb-6">
            Enviamos um email de validação para <strong>{parentEmail}</strong>
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>Próximos passos:</strong><br />
              1. Verifique sua caixa de entrada<br />
              2. Clique no link de validação<br />
              3. Aguarde a confirmação dos pais/responsáveis
            </p>
          </div>
                 <button
                   onClick={() => {
                     setEmailSent(false);
                     setCpf('');
                     setPassword('');
                     setConfirmPassword('');
                     setParentEmail('');
                     setParentConsent(false);
                     setGradeId('');
                     setError('');
                   }}
                   className="w-full bg-orange-600 text-gray-900 py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                 >
                   Fazer Novo Cadastro
                 </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen auth-background-teal p-4 animate-fadeIn">
      <h2 className="text-4xl font-bold text-white mb-6 text-center">
        {isFirstAccess ? 'Plano Gratuito' : 'Acesso Gratuito'}
      </h2>
      
      {/* Explicação sobre o plano gratuito */}
      <div className="bg-white bg-opacity-90 rounded-lg p-4 mb-6 max-w-sm text-center border border-white border-opacity-50 shadow-lg">
        <p className="text-gray-800 text-sm font-medium">
          <strong>🎓 Acesso Gratuito:</strong> {isFirstAccess 
            ? 'Comece sua jornada na educação financeira com acesso limitado ao conteúdo básico.'
            : 'Entre com seu CPF e senha para acessar o conteúdo gratuito.'
          }
        </p>
      </div>

      <form onSubmit={isFirstAccess ? handleRegisterSubmit : handleLogin} className="bg-white p-8 lg:p-10 xl:p-12 rounded-xl shadow-lg w-full max-w-sm lg:max-w-md xl:max-w-lg flex flex-col space-y-4 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
        
        {/* Campo CPF */}
        <input
          type="text"
          id="cpf-gratuito"
          name="cpf"
          placeholder="CPF (apenas números)"
          value={cpf}
          onChange={handleCPFChange}
          className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
          maxLength="14"
        />
        
        {/* Campo de Email dos Pais - apenas no primeiro acesso */}
        {isFirstAccess && (
          <input
            type="email"
            id="parent-email-gratuito"
            name="parentEmail"
            placeholder="Email dos pais/responsáveis"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
            autoComplete="email"
          />
        )}
        
        {/* Campo de Seleção de Série - apenas no primeiro acesso */}
        {isFirstAccess && (
          <select
            id="grade-gratuito"
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
        
        {/* Campo de Senha */}
        <input
          type="password"
          id="password-gratuito"
          name="password"
          placeholder={isFirstAccess ? "Criar senha" : "Senha"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
          autoComplete={isFirstAccess ? "new-password" : "current-password"}
        />
        
        {/* Campo de Confirmação de Senha - apenas no primeiro acesso */}
        {isFirstAccess && (
          <input
            type="password"
            id="confirm-password-gratuito"
            name="confirmPassword"
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
            autoComplete="new-password"
          />
        )}
        
        {/* Termo de Consentimento - apenas no primeiro acesso */}
        {isFirstAccess && (
          <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <input
              type="checkbox"
              id="parent-consent"
              name="parentConsent"
              checked={parentConsent}
              onChange={(e) => setParentConsent(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="parent-consent" className="text-sm text-gray-700">
              <strong>Consentimento dos Pais/Responsáveis:</strong><br />
              Declaro que sou maior de 18 anos <strong>OU</strong> tenho autorização expressa dos meus pais/responsáveis para utilizar esta plataforma de educação financeira. 
              Entendo que este é um plano gratuito com acesso limitado (apenas 9 lições dos primeiros 3 módulos). 
              Os pais/responsáveis serão notificados por email sobre este cadastro.
            </label>
          </div>
        )}
        
        {/* Mensagem de erro */}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        {/* Botão de ação */}
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
          <span className={`${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
            {isFirstAccess ? 'Criar Conta Gratuita' : 'Entrar'}
          </span>
        </button>
      </form>
      
      {/* Botões de navegação */}
      <button
        onClick={() => {
          // Limpar campos ao voltar
          setCpf('');
          setPassword('');
          setConfirmPassword('');
          setParentEmail('');
          setParentConsent(false);
          setGradeId('');
          setError('');
          // Manter na mesma tela, apenas limpar os campos
        }}
        className="mt-6 text-white text-md hover:underline transition-colors duration-300"
        disabled={loading}
      >
        Limpar Campos
      </button>
      
      {isFirstAccess && (
        <button
          onClick={() => {
            setIsFirstAccess(false);
            setError(''); // Limpar erro ao mudar para login
          }}
          className="mt-2 text-white text-md hover:underline transition-colors duration-300"
          disabled={loading}
        >
          Já tem conta? Fazer login aqui!
        </button>
      )}
      
      {!isFirstAccess && (
        <button
          onClick={() => {
            setIsFirstAccess(true);
            setError(''); // Limpar erro ao mudar para cadastro
          }}
          className="mt-2 text-white text-md hover:underline transition-colors duration-300"
          disabled={loading}
        >
          Primeiro acesso? Criar conta aqui!
        </button>
      )}
    </div>
  );
};

console.log('🎯 RegisterGratuito: Componente exportado');

export default RegisterGratuito;
