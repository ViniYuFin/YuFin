import React, { useState, useEffect } from 'react';
import { apiGet } from '../utils/apiService';
import { getApiUrl } from '../config/environment';
import FamilyPlanModal from './FamilyPlanModal';

const Register = ({ handleRegister, setActiveScreen, role, familyPlanData: initialFamilyPlanData }) => {
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
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [familyPlanData, setFamilyPlanData] = useState(null);

  // Verificar se há uma licença pendente no localStorage
  useEffect(() => {
    const pendingFamilyLicense = localStorage.getItem('pendingFamilyLicense');
    const pendingSchoolLicense = localStorage.getItem('pendingSchoolLicense');
    console.log('🔍 Register: Verificando licenças pendentes:', { 
      pendingFamilyLicense, 
      pendingSchoolLicense, 
      role, 
      initialFamilyPlanData 
    });
    
    if (pendingFamilyLicense && role === 'parent') {
      console.log('✅ Register: Licença família pendente encontrada, definindo familyPlanData:', pendingFamilyLicense);
      setFamilyPlanData(pendingFamilyLicense);
      // Limpar a licença pendente do localStorage
      localStorage.removeItem('pendingFamilyLicense');
    } else if (pendingSchoolLicense && role === 'school') {
      console.log('✅ Register: Licença escola pendente encontrada, definindo familyPlanData:', pendingSchoolLicense);
      setFamilyPlanData(pendingSchoolLicense);
      // Limpar a licença pendente do localStorage
      localStorage.removeItem('pendingSchoolLicense');
    } else if (initialFamilyPlanData && (role === 'parent' || role === 'school')) {
      console.log('✅ Register: Licença inicial fornecida:', initialFamilyPlanData);
      setFamilyPlanData(initialFamilyPlanData);
    }
  }, [role, initialFamilyPlanData]);

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
    
    console.log('🔍 Register: onSubmitRegister iniciado');
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

    // Para pais/responsáveis, verificar se tem licença validada
    if (role === 'parent') {
      console.log('🔍 Register: Verificando licença para parent:', { initialFamilyPlanData, familyPlanData });
      if (initialFamilyPlanData || familyPlanData) {
        // Tem licença validada, processar registro
        setLoading(true);
        try {
          // Usar licença individual
          const licenseCode = initialFamilyPlanData || familyPlanData;
          
          let licenseResponse;
          
          // Verificar se é licença universal
          if (licenseCode.startsWith('UNI-')) {
            console.log('🔍 Register: Usando licença universal para parent:', {
              licenseCode,
              userData: { name, email }
            });
            
            licenseResponse = await fetch(`${getApiUrl()}/api/universal-license/use`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                code: licenseCode,
                userData: {
                  name,
                  email
                },
                planType: 'family'
              })
            });
          } else {
            console.log('🔍 Register: Enviando dados para /api/family-license/use:', {
              licenseCode,
              userData: { name, email }
            });
            
            licenseResponse = await fetch(`${getApiUrl()}/api/family-license/use`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                licenseCode,
                userData: {
                  name,
                  email
                }
              })
            });
          }
          
          const licenseResult = await licenseResponse.json();
          console.log('📋 Register: Resposta da licença:', licenseResult);
          
          if (!licenseResult.success) {
            console.log('❌ Register: Erro na licença:', licenseResult.error);
            setError(licenseResult.error || 'Erro ao validar licença.');
            setLoading(false);
            return;
          }
          
          console.log('✅ Register: Licença aceita, prosseguindo com registro');
          
          // Usar dados reais do plano retornados pelo backend
          const familyPlanDataFromBackend = licenseResult.planData || {
            numParents: 1, // Fallback
            numStudents: 2, // Fallback
            totalPrice: 19.90
          };
          
          console.log('📊 Dados do plano família obtidos do backend:', familyPlanDataFromBackend);
          
          // Registrar usuário normalmente
          console.log('🔍 Register: Dados sendo enviados para handleRegister:', {
            name,
            email,
            role: 'parent',
            familyPlanData: familyPlanDataFromBackend,
            familyLicense: {
              code: initialFamilyPlanData || familyPlanData,
              individualCode: licenseResult.individualLicenseCode
            }
          });
          
          console.log('🔍 Register: familyPlanDataFromBackend detalhado:', familyPlanDataFromBackend);
          console.log('🔍 Register: licenseResult.individualLicenseCode:', licenseResult.individualLicenseCode);
          
          const result = await handleRegister({
            name,
            email,
            password,
            confirmPassword,
            role: 'parent',
            familyPlanData: familyPlanDataFromBackend,
            familyLicense: {
              code: initialFamilyPlanData || familyPlanData,
              individualCode: licenseResult.individualLicenseCode
            }
          });
          
          if (!result.success) {
            setError(result.message);
          } else {
            // Disparar evento para atualizar tokens se foi usado um token
            if (token && token.trim()) {
              window.dispatchEvent(new CustomEvent('tokenUsed'));
            }
            
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
        return;
      } else {
        // Não tem licença, redirecionar para Welcome
        setLoading(false);
        setError('Você precisa de uma licença válida para se registrar como pai/responsável.');
        setTimeout(() => {
          setActiveScreen('welcome');
        }, 2000);
        return;
      }
    }

    // Para escolas, verificar se tem licença validada
    if (role === 'school') {
      console.log('🔍 Register: Verificando licença para school:', { initialFamilyPlanData, familyPlanData });
      if (initialFamilyPlanData || familyPlanData) {
        // Tem licença validada, processar registro
        setLoading(true);
        try {
          // Usar licença escola
          const licenseCode = initialFamilyPlanData || familyPlanData;
          
          let licenseResponse;
          
          // Verificar se é licença universal
          if (licenseCode.startsWith('UNI-')) {
            console.log('🔍 Register: Usando licença universal para school:', {
              licenseCode,
              userData: { name, email }
            });
            
            licenseResponse = await fetch(`${getApiUrl()}/api/universal-license/use`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                code: licenseCode,
                userData: {
                  name,
                  email
                },
                planType: 'school'
              })
            });
          } else {
            console.log('🔍 Register: Enviando dados para /api/school-license/use:', {
              licenseCode,
              userData: { name, email }
            });
            
            licenseResponse = await fetch(`${getApiUrl()}/api/school-license/use`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                licenseCode,
                userData: {
                  name,
                  email
                }
              })
            });
          }
          
          const licenseResult = await licenseResponse.json();
          console.log('📋 Register: Resposta da licença escola:', licenseResult);
          
          if (!licenseResult.success) {
            console.log('❌ Register: Erro na licença escola:', licenseResult.error);
            setError(licenseResult.error || 'Erro ao validar licença.');
            setLoading(false);
            return;
          }
          
          console.log('✅ Register: Licença escola aceita, prosseguindo com registro');
          
          // Usar dados reais do plano retornados pelo backend
          const schoolPlanData = licenseResult.planData || licenseResult.license?.planData || {
            numStudents: 50, // Fallback apenas se não houver dados
            userType: 'Diretor',
            pricePerStudent: 9.90,
            totalPrice: 50 * 9.90
          };
          
          console.log('📊 Dados do plano escola obtidos do backend:', schoolPlanData);
          console.log('🔍 Verificando se dados são reais:', {
            numStudents: schoolPlanData.numStudents,
            isRealData: schoolPlanData.numStudents !== 50 || licenseResult.license?.isSimulated === false
          });
          
          // Registrar usuário normalmente
          const result = await handleRegister({
            name,
            email,
            password,
            confirmPassword,
            role: 'school',
            schoolPlanData: schoolPlanData,
            schoolLicense: {
              code: initialFamilyPlanData || familyPlanData,
              individualCode: licenseResult.individualLicenseCode
            }
          });
          
          if (!result.success) {
            setError(result.message);
          } else {
            // Disparar evento para atualizar tokens se foi usado um token
            if (token && token.trim()) {
              window.dispatchEvent(new CustomEvent('tokenUsed'));
            }
            
            setActiveScreen('school-dashboard');
          }
        } catch (err) {
          setError("Ocorreu um erro inesperado. Tente novamente.");
          console.error("Erro no registro:", err);
        } finally {
          setLoading(false);
        }
        return;
      } else {
        // Não tem licença, redirecionar para Welcome
        setLoading(false);
        setError('Você precisa de uma licença válida para se registrar como escola.');
        setTimeout(() => {
          setActiveScreen('welcome');
        }, 2000);
        return;
      }
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
        // Disparar evento para atualizar tokens se foi usado um token
        if (token && token.trim()) {
          window.dispatchEvent(new CustomEvent('tokenUsed'));
        }
        
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

  const handleFamilyPlanConfirm = async (planData) => {
    setFamilyPlanData(planData);
    setShowFamilyModal(false);
    
    // Agora processar o registro com os dados do plano família
    setLoading(true);
    try {
      const result = await handleRegister({
        name,
        email,
        password,
        confirmPassword,
        role: 'parent',
        familyPlan: planData
      });
      
      if (!result.success) {
        setError(result.message);
      } else {
        setActiveScreen('parent-dashboard');
      }
    } catch (err) {
      setError("Ocorreu um erro inesperado. Tente novamente.");
      console.error("Erro no registro:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFamilyPlanCancel = () => {
    setShowFamilyModal(false);
    setFamilyPlanData(null);
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
      
      {/* Modal do Plano Família */}
      <FamilyPlanModal
        isOpen={showFamilyModal}
        onClose={handleFamilyPlanCancel}
        onConfirm={handleFamilyPlanConfirm}
      />
    </div>
  );
};

export default Register;