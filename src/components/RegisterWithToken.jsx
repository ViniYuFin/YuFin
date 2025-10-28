import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../utils/apiService';

const RegisterWithToken = ({ token, onSuccess, onCancel }) => {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/registration-tokens/${token}`);
      setTokenInfo(response);
    } catch (error) {
      setError('Token inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiPost('/register-with-token', {
        token,
        userData: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'student',
          gradeId: tokenInfo?.metadata?.grade || ''
        }
      });

      // Disparar evento para atualizar tokens
      window.dispatchEvent(new CustomEvent('tokenUsed'));
      
      onSuccess(response.user);
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao registrar usuário');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !tokenInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-teal to-blue p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Validando token...</p>
        </div>
      </div>
    );
  }

  if (error && !tokenInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-teal to-blue p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm text-center">
          <div className="text-red-600 mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Token Inválido</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onCancel}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-teal to-blue p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Registro de Aluno
          </h2>
                     <p className="text-sm text-gray-600">
             Token válido para: {tokenInfo?.metadata?.description || 'Registro de aluno'}
           </p>
           <p className="text-xs text-gray-500 mt-1">
             {tokenInfo?.type === 'school' ? '🏫 Escola (B2B)' : '👨‍👩‍👧‍👦 Responsável (B2C)'}
           </p>
          {tokenInfo?.metadata?.grade && (
            <p className="text-sm text-primary font-medium mt-1">
              Série sugerida: {tokenInfo.metadata.grade}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Digite seu nome completo"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Digite seu email"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Digite sua senha"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Confirme sua senha"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Informações do token:</strong>
          </p>
          <ul className="text-xs text-blue-600 mt-1 space-y-1">
            <li>• Tipo: {tokenInfo?.type === 'school' ? 'Escola' : 'Responsável'}</li>
            <li>• Usos: {tokenInfo?.usedCount}/{tokenInfo?.maxUses || '∞'}</li>
            {tokenInfo?.expiresAt && (
              <li>• Expira em: {new Date(tokenInfo.expiresAt).toLocaleDateString('pt-BR')}</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RegisterWithToken;
