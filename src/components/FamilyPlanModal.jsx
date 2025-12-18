import React, { useState } from 'react';

const FamilyPlanModal = ({ isOpen, onClose, onConfirm }) => {
  const [numParents, setNumParents] = useState(1);
  const [numStudents, setNumStudents] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onConfirm({
        numParents,
        numStudents,
        totalLicenses: numParents // Apenas responsáveis precisam de licença
      });
    } catch (error) {
      console.error('Erro ao processar plano família:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = numParents * 9.90; // R$ 9,90 por responsável

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">👨‍👩‍👧‍👦 Plano Família</h2>
              <p className="text-orange-100 mt-1">Configure sua família</p>
            </div>
            <button
              onClick={onClose}
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
            {/* Informações do Plano */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">📋 O que está incluído:</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Tudo do plano Iniciante</li>
                <li>• Acesso completo (6º ao 3º EM)</li>
                <li>• Até 3 perfis por conta (pais + filhos)</li>
                <li>• Dashboard parental de acompanhamento</li>
                <li>• Suporte prioritário (24h)</li>
              </ul>
            </div>

            {/* Configuração da Família */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👨‍👩‍👧‍👦 Quantos responsáveis?
                </label>
                <select
                  value={numParents}
                  onChange={(e) => setNumParents(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value={1}>1 responsável</option>
                  <option value={2}>2 responsáveis</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎓 Quantos alunos?
                </label>
                <select
                  value={numStudents}
                  onChange={(e) => setNumStudents(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value={1}>1 aluno</option>
                  <option value={2}>2 alunos</option>
                  <option value={3}>3 alunos</option>
                  <option value={4}>4 alunos</option>
                </select>
              </div>
            </div>

            {/* Resumo do Plano */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">💰 Resumo do Plano:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Responsáveis:</span>
                  <span>{numParents} × R$ 9,90</span>
                </div>
                <div className="flex justify-between">
                  <span>Alunos:</span>
                  <span>{numStudents} (gratuitos)</span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between font-semibold">
                  <span>Total mensal:</span>
                  <span className="text-orange-600">R$ {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Informação sobre Licenças */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">🔑 Como funciona:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• {numParents} licença(s) será(ão) gerada(s) para os responsáveis</li>
                <li>• Os alunos receberão tokens de acesso gratuitos</li>
                <li>• Após o pagamento, você poderá gerar tokens para os alunos</li>
                <li>• Cada token permite o cadastro de 1 aluno</li>
              </ul>
            </div>

            {/* Botões */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processando...' : 'Continuar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FamilyPlanModal;

