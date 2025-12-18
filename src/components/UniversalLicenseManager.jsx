import React, { useState, useEffect } from 'react';

const UniversalLicenseManager = ({ user, onClose }) => {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLicense, setNewLicense] = useState({
    name: '',
    description: '',
    planTypes: ['family', 'school'],
    maxUses: -1
  });

  // Verificar se o usuário é administrador
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchLicenses();
    }
  }, [isAdmin]);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/universal-license', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLicenses(data.licenses || []);
      } else {
        setError('Erro ao carregar licenças');
      }
    } catch (error) {
      console.error('Erro ao buscar licenças:', error);
      setError('Erro ao carregar licenças');
    } finally {
      setLoading(false);
    }
  };

  const createLicense = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/universal-license/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(newLicense)
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuccess(`Licença criada: ${data.license.code}`);
        setShowCreateForm(false);
        setNewLicense({ name: '', description: '', planTypes: ['family', 'school'], maxUses: -1 });
        fetchLicenses();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao criar licença');
      }
    } catch (error) {
      console.error('Erro ao criar licença:', error);
      setError('Erro ao criar licença');
    } finally {
      setLoading(false);
    }
  };

  const toggleLicense = async (code) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/universal-license/${code}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        setSuccess('Status da licença alterado');
        fetchLicenses();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao alterar status');
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      setError('Erro ao alterar status');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Código copiado para a área de transferência!');
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-xl">
            <h2 className="text-2xl font-bold text-center">🚫 Acesso Negado</h2>
          </div>
          <div className="p-6 text-center">
            <p className="text-gray-600 mb-4">
              Apenas administradores podem gerenciar licenças universais.
            </p>
            <button
              onClick={onClose}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🔑 Gerenciador de Licenças Universais</h2>
              <p className="text-purple-100 mt-1">Acesso exclusivo para administradores</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {/* Create License Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
            >
              {showCreateForm ? 'Cancelar' : '+ Criar Nova Licença'}
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-4">Criar Nova Licença Universal</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Licença
                  </label>
                  <input
                    type="text"
                    value={newLicense.name}
                    onChange={(e) => setNewLicense({...newLicense, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: Licença Universal Administrativa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={newLicense.description}
                    onChange={(e) => setNewLicense({...newLicense, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                    placeholder="Descrição da licença..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipos de Plano
                  </label>
                  <div className="space-y-2">
                    {['family', 'school', 'enterprise'].map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newLicense.planTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewLicense({...newLicense, planTypes: [...newLicense.planTypes, type]});
                            } else {
                              setNewLicense({...newLicense, planTypes: newLicense.planTypes.filter(t => t !== type)});
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo de Usos (-1 = Ilimitado)
                  </label>
                  <input
                    type="number"
                    value={newLicense.maxUses}
                    onChange={(e) => setNewLicense({...newLicense, maxUses: parseInt(e.target.value) || -1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="-1"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={createLicense}
                    disabled={loading}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Criando...' : 'Criar Licença'}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Licenses List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Licenças Universais ({licenses.length})</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando licenças...</p>
              </div>
            ) : licenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma licença universal encontrada.
              </div>
            ) : (
              licenses.map((license) => (
                <div key={license._id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-lg">{license.code}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        license.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {license.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(license.code)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        📋 Copiar
                      </button>
                      <button
                        onClick={() => toggleLicense(license.code)}
                        className={`px-3 py-1 rounded text-sm ${
                          license.isActive 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {license.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Nome:</strong> {license.name}</p>
                    <p><strong>Descrição:</strong> {license.description}</p>
                    <p><strong>Tipos de Plano:</strong> {license.planTypes.join(', ')}</p>
                    <p><strong>Usos:</strong> {license.currentUses} / {license.maxUses === -1 ? '∞' : license.maxUses}</p>
                    <p><strong>Criada em:</strong> {new Date(license.createdAt).toLocaleDateString('pt-BR')}</p>
                    {license.lastUsedAt && (
                      <p><strong>Último uso:</strong> {new Date(license.lastUsedAt).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalLicenseManager;






