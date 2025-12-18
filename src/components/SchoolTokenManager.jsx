import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../utils/apiService';

const SchoolTokenManager = ({ user }) => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [newToken, setNewToken] = useState({
    maxUses: 50, // Valor inicial, será atualizado
    expiresAt: '',
    metadata: {
      description: '',
      grade: '',
      studentName: ''
    }
  });

  // Calcular limite de tokens baseado na contratação do Plano Escola
  const getTokenLimit = () => {
    console.log('🔍 SchoolTokenManager: Verificando dados do usuário:', {
      user: user,
      schoolPlanData: user.schoolPlanData,
      numStudents: user.schoolPlanData?.numStudents,
      hasSchoolPlanData: !!user.schoolPlanData,
      hasNumStudents: !!user.schoolPlanData?.numStudents,
      schoolLicense: user.schoolLicense
    });
    
    // Verificar se é licença universal
    if (user.schoolLicense && user.schoolLicense.code && user.schoolLicense.code.startsWith('UNI-')) {
      console.log('🌐 Licença universal detectada - limite de tokens: 50');
      return 50;
    }
    
    // Se o usuário tem dados de contratação do plano escola
    if (user.schoolPlanData && user.schoolPlanData.numStudents) {
      console.log('✅ SchoolTokenManager: Usando dados do plano escola:', user.schoolPlanData.numStudents);
      console.log('📊 Dados completos do plano:', user.schoolPlanData);
      return user.schoolPlanData.numStudents;
    }
    // Fallback: se não tem dados específicos, permitir 50 tokens (mínimo do plano escola)
    console.log('⚠️ SchoolTokenManager: Usando limite padrão: 50 tokens');
    console.log('🔍 Motivo do fallback:', {
      hasSchoolPlanData: !!user.schoolPlanData,
      hasNumStudents: !!user.schoolPlanData?.numStudents,
      schoolPlanData: user.schoolPlanData
    });
    return 50;
  };

  const getRemainingTokens = () => {
    const limit = 1; // Apenas 1 token permitido
    const createdTokens = tokens.length; // Total de tokens criados
    console.log('🔍 Calculando tokens restantes para escola:', {
      limit: 1,
      createdTokens,
      remaining: Math.max(0, 1 - createdTokens)
    });
    return Math.max(0, 1 - createdTokens);
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

    // Listener para atualizar tokens quando um for usado
    const handleTokenUsed = () => {
      console.log('🔄 Token usado detectado, atualizando lista...');
      fetchTokens();
    };

    window.addEventListener('darkModeChanged', handleDarkModeChange);
    window.addEventListener('tokenUsed', handleTokenUsed);
    
    return () => {
      window.removeEventListener('darkModeChanged', handleDarkModeChange);
      window.removeEventListener('tokenUsed', handleTokenUsed);
    };
  }, []);

  // Atualizar maxUses quando o usuário mudar
  useEffect(() => {
    const limit = getTokenLimit();
    console.log('🔄 SchoolTokenManager: Atualizando maxUses para:', limit);
    setNewToken(prev => ({
      ...prev,
      maxUses: limit
    }));
  }, [user, user.schoolPlanData]);

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
        createdBy: user.id, // ID da escola que está criando o token
        type: 'school',
        maxUses: getTokenLimit(), // Baseado na quantidade contratada
        expiresAt: newToken.expiresAt || null,
        metadata: newToken.metadata
      };

      await apiPost('/registration-tokens', tokenData);
      setShowCreateForm(false);
      setNewToken({
        maxUses: getTokenLimit(),
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
            Tokens para Alunos
          </h3>
          <p 
            className="text-sm mt-1"
            style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
          >
            {user.schoolLicense && user.schoolLicense.code && user.schoolLicense.code.startsWith('UNI-')
              ? 'Licença Universal - 1 token (50 usos) | Restantes: ' + getRemainingTokens()
              : `1 token (${getTokenLimit()} usos) | Restantes: ${getRemainingTokens()}`
            }
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={getRemainingTokens() <= 0}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            getRemainingTokens() <= 0
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          {getRemainingTokens() <= 0 ? 'Limite Atingido' : 'Gerar Token para Aluno'}
        </button>
      </div>

      {/* Formulário de criação */}
      {showCreateForm && (
        <div className="bg-gray-50 rounded-lg p-6 border">
          <h4 className="text-lg font-semibold mb-4">Criar Token para Aluno</h4>
          
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">
              <strong>💡 Como funciona:</strong>
            </p>
            <ul className="text-xs text-green-600 mt-1 space-y-1">
              <li>• Gere um token para seu aluno se registrar</li>
              <li>• Seu aluno usará o token para criar a conta</li>
              <li>• Ele terá acesso independente da família</li>
              <li>• Você pode acompanhar o progresso dele</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Aluno
              </label>
              <input
                type="text"
                value={newToken.metadata.studentName}
                onChange={(e) => setNewToken({
                  ...newToken, 
                  metadata: {...newToken.metadata, studentName: e.target.value}
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nome do seu aluno"
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
                value={getTokenLimit()}
                disabled
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                title={`Para o Plano Escola, máximo de usos baseado na quantidade contratada (${getTokenLimit()} alunos)`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Fixo em {getTokenLimit()} para Plano Escola (baseado na quantidade contratada)
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
              Crie um token para seus alunos começarem a estudar!
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
                    🏫 Escola (B2B)
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
              
              {token.usedBy && token.usedBy.length > 0 && (
                <div 
                  className="mt-3 pt-3"
                  style={{ borderTopColor: darkMode ? '#6b7280' : '#e5e7eb' }}
                >
                  <h5 
                    className="text-sm font-medium mb-2"
                    style={{ color: darkMode ? '#ffffff' : '#374151' }}
                  >
                    Usado por:
                  </h5>
                  <div className="space-y-1">
                    {token.usedBy.map((usage, index) => (
                      <div 
                        key={index} 
                        className="text-sm"
                        style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                      >
                        {usage.studentName} - {formatDate(usage.usedAt)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SchoolTokenManager;
