import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../utils/apiService';

const ParentTokenManager = ({ user }) => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [newToken, setNewToken] = useState({
    maxUses: 1, // Fixo em 1 para Plano Família
    expiresAt: '',
    metadata: {
      description: '',
      grade: '',
      studentName: ''
    }
  });

  // Estado para controlar se o usuário pode gerar tokens
  const [canGenerateTokensState, setCanGenerateTokensState] = useState(true);

  // Verificar se o usuário pode gerar tokens
  const canGenerateTokens = () => {
    // Se não tem licença família, não pode gerar tokens
    if (!user.familyLicense || !user.familyLicense.code) {
      console.log('❌ Usuário não tem licença família');
      return false;
    }
    
    // Para licenças com 1 responsável, sempre pode gerar tokens
    if (!user.familyPlanData || user.familyPlanData.numParents === 1) {
      console.log('✅ Usuário tem licença família (1 responsável), pode gerar tokens');
      return true;
    }
    
    // Para licenças com 2 responsáveis, verificar no backend
    console.log('🔍 Verificando permissão para gerar tokens (2 responsáveis):', {
      numParents: user.familyPlanData.numParents,
      userId: user._id,
      licenseCode: user.familyLicense.code
    });
    
    return canGenerateTokensState;
  };

  // Verificar permissão no backend quando o componente carrega
  useEffect(() => {
    const checkTokenPermission = async () => {
      if (user.familyLicense && user.familyLicense.code && user.familyPlanData && user.familyPlanData.numParents === 2) {
        try {
          // Fazer uma chamada para o backend para verificar se o usuário pode gerar tokens
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://yufin-backend.vercel.app'}/api/family-license/check-token-permission/${user.familyLicense.code}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setCanGenerateTokensState(data.canGenerateTokens);
            console.log('🔍 Resposta do backend sobre permissão de tokens:', data);
            console.log('🔍 Estado atualizado para canGenerateTokens:', data.canGenerateTokens);
          } else {
            console.error('❌ Erro na resposta do backend:', response.status, response.statusText);
            const errorData = await response.text();
            console.error('❌ Detalhes do erro:', errorData);
          }
        } catch (error) {
          console.error('❌ Erro ao verificar permissão de tokens:', error);
          // Em caso de erro, permitir por padrão
          setCanGenerateTokensState(true);
        }
      }
    };

    checkTokenPermission();
  }, [user.familyLicense, user.familyPlanData]);

  // Calcular limite de tokens baseado na contratação
  const getTokenLimit = () => {
    console.log('🔍 ParentTokenManager: Verificando dados do usuário:', {
      user: user,
      familyPlanData: user.familyPlanData,
      numStudents: user.familyPlanData?.numStudents,
      familyLicense: user.familyLicense
    });
    
    // Verificar se é licença universal
    if (user.familyLicense && user.familyLicense.code && user.familyLicense.code.startsWith('UNI-')) {
      console.log('🔒 Licença universal detectada - limite de tokens: 0');
      return 0;
    }
    
    // Se o usuário tem dados de contratação do plano família
    if (user.familyPlanData && user.familyPlanData.numStudents) {
      // O limite é baseado no número de filhos escolhido no modal
      // Exemplos:
      // - 1 responsável + 2 filhos = 2 tokens
      // - 2 responsáveis + 1 filho = 1 token
      console.log('📊 Limite de tokens baseado no modal:', user.familyPlanData.numStudents);
      return user.familyPlanData.numStudents;
    }
    // Fallback: se não tem dados específicos, permitir 2 tokens (máximo padrão: 1 responsável + 2 filhos)
    console.log('⚠️ Usando limite padrão: 2 tokens');
    return 2;
  };

  const getRemainingTokens = () => {
    const limit = getTokenLimit();
    const createdTokens = tokens.length; // Total de tokens criados (independente de uso)
    console.log('🔍 Calculando tokens restantes:', {
      limit,
      createdTokens,
      remaining: Math.max(0, limit - createdTokens)
    });
    return Math.max(0, limit - createdTokens);
  };

  useEffect(() => {
    fetchTokens();
    
    // Carregar preferência do modo escuro
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);

    // Listener para mudanças no modo escuro
    const handleDarkModeChange = () => {
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      setDarkMode(savedDarkMode);
    };

    window.addEventListener('darkModeChanged', handleDarkModeChange);
    
    return () => {
      window.removeEventListener('darkModeChanged', handleDarkModeChange);
    };
  }, []);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const data = await apiGet(`/registration-tokens?createdBy=${user.id}`);
      setTokens(data);
    } catch (error) {
      console.error('Erro ao carregar tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async () => {
    try {
      // Verificar se ainda pode criar tokens
      const remainingTokens = getRemainingTokens();
      if (remainingTokens <= 0) {
        alert(`Você já atingiu o limite de tokens permitidos (${getTokenLimit()}). Não é possível criar mais tokens.`);
        return;
      }

      const tokenData = {
        createdBy: user.id, // ID do responsável que está criando o token
        type: 'parent',
        maxUses: 1, // Sempre 1 para Plano Família
        expiresAt: newToken.expiresAt || null,
        metadata: newToken.metadata
      };

      await apiPost('/registration-tokens', tokenData);
      setShowCreateForm(false);
      setNewToken({
        maxUses: 1,
        expiresAt: '',
        metadata: { description: '', grade: '', studentName: '' }
      });
      fetchTokens();
    } catch (error) {
      console.error('Erro ao criar token:', error);
      alert('Erro ao criar token: ' + error.message);
    }
  };

  const handleDeleteToken = async (tokenId) => {
    // Encontrar o token para verificar se foi usado
    const token = tokens.find(t => t.id === tokenId);
    if (token && token.usedCount > 0) {
      alert('Este token já foi utilizado e não pode ser excluído.');
      return;
    }
    
    if (!window.confirm('Tem certeza que deseja excluir este token?')) return;
    
    try {
      await apiDelete(`/registration-tokens/${tokenId}`);
      fetchTokens();
    } catch (error) {
      console.error('Erro ao excluir token:', error);
    }
  };

  const copyToClipboard = (token) => {
    navigator.clipboard.writeText(token);
    alert('Token copiado para a área de transferência!');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (token) => {
    // Verificar se o token está inativo
    if (!token.isActive) return 'text-red-600';
    
    // Verificar se expirou
    if (token.expiresAt && new Date() > new Date(token.expiresAt)) return 'text-orange-600';
    
    // Verificar se foi usado completamente
    if (token.maxUses && token.usedCount >= token.maxUses) return 'text-orange-600';
    
    return 'text-green-600';
  };

  const getStatusText = (token) => {
    // Verificar se o token está inativo
    if (!token.isActive) return 'Inativo';
    
    // Verificar se expirou
    if (token.expiresAt && new Date() > new Date(token.expiresAt)) return 'Expirado';
    
    // Verificar se foi usado completamente
    if (token.maxUses && token.usedCount >= token.maxUses) return 'Usado';
    
    return 'Ativo';
  };

  if (loading) {
    return <div className="text-center py-8">Carregando tokens...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 
            className="text-xl font-semibold"
            style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
          >
            Tokens para Filhos
          </h3>
          <p 
            className="text-sm mt-1"
            style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
          >
            {user.familyLicense && user.familyLicense.code && user.familyLicense.code.startsWith('UNI-')
              ? 'Licença Universal - Acesso administrativo sem geração de tokens'
              : `Limite: ${getTokenLimit()} tokens | Restantes: ${getRemainingTokens()}`
            }
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={getRemainingTokens() <= 0 || !canGenerateTokens()}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            getRemainingTokens() <= 0 || !canGenerateTokens()
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          {!canGenerateTokens() 
            ? (user.familyPlanData && user.familyPlanData.numParents === 2 
                ? 'Apenas o 1º Responsável' 
                : 'Sem Permissão')
            : getRemainingTokens() <= 0 
              ? (user.familyLicense && user.familyLicense.code && user.familyLicense.code.startsWith('UNI-')
                  ? 'Licença Universal - Sem Tokens'
                  : 'Limite Atingido')
              : 'Gerar Token para Filho'
          }
        </button>
      </div>

      {/* Formulário de criação */}
      {showCreateForm && (
        <div className="bg-gray-50 rounded-lg p-6 border">
          <h4 className="text-lg font-semibold mb-4">Criar Token para Filho</h4>
          
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">
              <strong>💡 Como funciona:</strong>
            </p>
            <ul className="text-xs text-green-600 mt-1 space-y-1">
              <li>• Gere um token para seu filho se registrar</li>
              <li>• Seu filho usará o token para criar a conta</li>
              <li>• Ele terá acesso independente da escola</li>
              <li>• Você pode acompanhar o progresso dele</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Filho
              </label>
              <input
                type="text"
                value={newToken.metadata.studentName}
                onChange={(e) => setNewToken({
                  ...newToken, 
                  metadata: {...newToken.metadata, studentName: e.target.value}
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nome do seu filho"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Série/Ano
              </label>
              <input
                type="text"
                value={newToken.metadata.grade}
                onChange={(e) => setNewToken({
                  ...newToken, 
                  metadata: {...newToken.metadata, grade: e.target.value}
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: 6º Ano"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de Usos
              </label>
              <input
                type="number"
                value={1}
                disabled
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                title="Para o Plano Família, cada token pode ser usado apenas 1 vez"
              />
              <p className="text-xs text-gray-500 mt-1">
                Fixo em 1 para Plano Família (cada token = 1 filho)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Expiração
              </label>
              <input
                type="datetime-local"
                value={newToken.expiresAt}
                onChange={(e) => setNewToken({...newToken, expiresAt: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição (Opcional)
            </label>
            <textarea
              value={newToken.metadata.description}
              onChange={(e) => setNewToken({
                ...newToken, 
                metadata: {...newToken.metadata, description: e.target.value}
              })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows="3"
              placeholder="Ex: Token para João estudar educação financeira"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleCreateToken}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
            >
              Criar Token
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de tokens */}
      <div className="space-y-4">
        {tokens.length === 0 ? (
          <div 
            className="text-center py-8 rounded-lg"
            style={{ backgroundColor: darkMode ? '#4b5563' : '#f9fafb' }}
          >
            <p 
              style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
            >
              Nenhum token criado ainda.
            </p>
            <p 
              className="text-sm mt-1"
              style={{ color: darkMode ? '#d1d5db' : '#9ca3af' }}
            >
              Crie um token para seu filho começar a estudar!
            </p>
          </div>
        ) : (
          tokens.map((token) => (
            <div 
              key={token.id} 
              className="rounded-lg p-4 border shadow-sm"
              style={{ 
                backgroundColor: darkMode ? '#4b5563' : '#ffffff',
                borderColor: darkMode ? '#6b7280' : '#e5e7eb'
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(token)}`}>
                    {getStatusText(token)}
                  </span>
                  <span 
                    className="text-sm"
                    style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                  >
                    👨‍👩‍👧‍👦 Responsável (B2C)
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteToken(token.id)}
                  disabled={token.usedCount > 0}
                  className={`text-sm ${
                    token.usedCount > 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-red-600 hover:text-red-800'
                  }`}
                  title={token.usedCount > 0 ? 'Token já foi utilizado e não pode ser excluído' : 'Excluir token'}
                >
                  Excluir
                </button>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center space-x-2 mb-2">
                  <code 
                    className="px-2 py-1 rounded text-sm font-mono"
                    style={{
                      backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                      color: darkMode ? '#ffffff' : '#1f2937'
                    }}
                  >
                    {token.token}
                  </code>
                  <button
                    onClick={() => copyToClipboard(token.token)}
                    className="text-primary hover:text-primary-dark text-sm"
                  >
                    📋 Copiar
                  </button>
                </div>
              </div>
              
              <div 
                className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"
                style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
              >
                <div>
                  <span className="font-medium">Usos:</span> {token.usedCount}
                  {token.maxUses && `/${token.maxUses}`}
                </div>
                <div>
                  <span className="font-medium">Criado:</span> {formatDate(token.createdAt)}
                </div>
                {token.expiresAt && (
                  <div>
                    <span className="font-medium">Expira:</span> {formatDate(token.expiresAt)}
                  </div>
                )}
                {token.metadata.studentName && (
                  <div>
                    <span className="font-medium">Para:</span> {token.metadata.studentName}
                  </div>
                )}
              </div>
              
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ParentTokenManager;
