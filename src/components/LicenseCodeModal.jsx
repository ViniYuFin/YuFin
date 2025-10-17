import React, { useState } from 'react';
import { getApiUrl } from '../config/environment';

const LicenseCodeModal = ({ isOpen, onClose, onConfirm }) => {
  const [licenseCode, setLicenseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!licenseCode.trim()) {
      setError('Por favor, insira o código da licença.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Validar licença no backend
      const response = await fetch(`${getApiUrl()}/api/family-license/validate/${licenseCode.trim()}`);
      const result = await response.json();
      
      if (result.success && result.valid) {
        // Licença válida - confirmar
        await onConfirm(licenseCode.trim());
      } else {
        setError(result.error || 'Código de licença inválido. Verifique e tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao validar licença:', err);
      setError('Erro ao validar licença. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setLicenseCode('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🔑 Código de Licença</h2>
              <p className="text-orange-100 mt-1">Plano Família</p>
            </div>
            <button
              onClick={handleCancel}
              className="text-white hover:text-orange-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Instruções */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">📋 Instruções:</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Insira o código da licença recebido após o pagamento</li>
                <li>• O código foi enviado por email após a confirmação</li>
                <li>• Após a validação, você poderá se cadastrar normalmente</li>
              </ul>
            </div>

            {/* Campo do código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código da Licença
              </label>
              <input
                type="text"
                value={licenseCode}
                onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
                placeholder="Ex: FAM-2024-XXXX-XXXX"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center font-mono text-lg tracking-wider"
                disabled={loading}
              />
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Botões */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !licenseCode.trim()}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Validando...' : 'Validar Licença'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LicenseCodeModal;
