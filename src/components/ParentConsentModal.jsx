import React, { useState } from 'react';
import { X, Shield, CheckCircle } from 'lucide-react';

const ParentConsentModal = ({ isOpen, onClose, onConfirm, studentName, parentEmail }) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [dataProcessingAccepted, setDataProcessingAccepted] = useState(false);

  const allAccepted = termsAccepted && privacyAccepted && dataProcessingAccepted;

  const handleConfirm = () => {
    if (allAccepted) {
      onConfirm({
        termsAccepted,
        privacyAccepted,
        dataProcessingAccepted,
        consentDate: new Date().toISOString(),
        parentEmail
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Consentimento Parental
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Consentimento Obrigatório
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Para menores de 18 anos, é necessário o consentimento dos pais ou responsáveis legais 
                  para o processamento de dados pessoais, conforme a LGPD.
                </p>
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Dados do Estudante
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Nome:</strong> {studentName}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>E-mail dos pais/responsáveis:</strong> {parentEmail}
            </p>
          </div>

          {/* Consent Options */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Termos de Consentimento
            </h3>

            {/* Terms of Service */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Aceito os Termos de Uso do YuFin
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Concordo com as regras e condições de uso da plataforma YuFin.
                </p>
              </div>
            </label>

            {/* Privacy Policy */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Aceito a Política de Privacidade
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Concordo com como meus dados pessoais são coletados, armazenados e utilizados.
                </p>
              </div>
            </label>

            {/* Data Processing */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={dataProcessingAccepted}
                onChange={(e) => setDataProcessingAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Autorizo o processamento de dados do meu filho(a)
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Autorizo a coleta e processamento dos dados pessoais e educacionais de {studentName} 
                  para fins de educação financeira e gamificação, conforme a LGPD.
                </p>
              </div>
            </label>
          </div>

          {/* LGPD Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Seus Direitos (LGPD)
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Acesso aos dados coletados</li>
              <li>• Correção de dados incorretos</li>
              <li>• Exclusão dos dados (direito ao esquecimento)</li>
              <li>• Portabilidade dos dados</li>
              <li>• Revogação do consentimento a qualquer momento</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!allAccepted}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              allAccepted
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {allAccepted && <CheckCircle className="w-4 h-4" />}
            Confirmar Consentimento
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentConsentModal;