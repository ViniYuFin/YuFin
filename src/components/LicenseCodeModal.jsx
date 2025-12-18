import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/environment';

const LicenseCodeModal = ({ isOpen, onClose, onConfirm, initialLicenseCode }) => {
  const [licenseCode, setLicenseCode] = useState(initialLicenseCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Atualizar código quando initialLicenseCode mudar
  useEffect(() => {
    if (initialLicenseCode) {
      console.log('🔑 LicenseCodeModal: Código inicial detectado:', initialLicenseCode);
      setLicenseCode(initialLicenseCode);
      // ✅ Apenas preencher o campo, NÃO validar automaticamente
      console.log('📝 LicenseCodeModal: Código preenchido, aguardando validação manual');
    }
  }, [initialLicenseCode, isOpen]);

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
      console.log('🔍 VALIDANDO CÓDIGO:', licenseCode.trim());
      console.log('🌍 API URL:', getApiUrl());
      
      // Primeiro, tentar validar como licença universal
      const universalUrl = `${getApiUrl()}/auth/validate-universal-license/${licenseCode.trim()}`;
      console.log('🔗 URL Universal:', universalUrl);
      
      let response = await fetch(universalUrl);
      let result = await response.json();
      
      console.log('📋 Resposta Universal:', result);
      
      // Se não for licença universal, tentar licença familiar
      if (!result.success || !result.valid) {
        const familyUrl = `${getApiUrl()}/api/family-license/validate/${licenseCode.trim()}`;
        console.log('🔗 URL Family:', familyUrl);
        
        response = await fetch(familyUrl);
        result = await response.json();
        
        console.log('📋 Resposta Family:', result);
      }
      
      if (result.success && result.valid) {
        console.log('✅ Licença válida!');
        // Licença válida - confirmar
        await onConfirm(licenseCode.trim());
      } else {
        console.log('❌ Licença inválida:', result.error);
        setError(result.error || 'Código de licença inválido. Verifique e tente novamente.');
      }
    } catch (err) {
      console.error('❌ Erro ao validar licença:', err);
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
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: 'rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
        {/* Header */}
        <div className="text-white p-6 rounded-t-xl" style={{ background: 'linear-gradient(135deg, #ee9116 0%, #ffb300 100%)' }}>
          <div className="flex items-center justify-center relative">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Código de Licença</h2>
              <p className="text-orange-100 mt-1">Plano Família</p>
            </div>
            <button
              onClick={handleCancel}
              className="absolute right-0 text-white hover:text-orange-200 transition-colors"
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
                id="validate-license-btn"
                type="submit"
                disabled={loading || !licenseCode.trim()}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors font-semibold text-base ${
                  loading || !licenseCode.trim()
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'text-white'
                }`}
                style={{
                  background: loading || !licenseCode.trim() ? '#9ca3af' : 'linear-gradient(135deg, #ee9116 0%, #ffb300 100%)',
                  color: '#ffffff',
                  border: 'none',
                  outline: 'none',
                  minHeight: '48px'
                }}
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
