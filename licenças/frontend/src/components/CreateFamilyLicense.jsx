import React, { useState } from 'react';
import { apiRequest } from '../config/api';
import toast from 'react-hot-toast';

const CreateFamilyLicense = () => {
  const [formData, setFormData] = useState({
    numParents: 1,
    numStudents: 1,
    totalPrice: '',
    purchaserEmail: '',
    purchaserName: '',
    expiresInDays: 30,
    maxUsages: 1, // Quantas vezes a licença pode ser usada (padrão: número de responsáveis)
    quantity: 1 // Quantidade de licenças a gerar em lote
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : value
      };
      
      // Quando mudar o número de responsáveis, atualizar maxUsages automaticamente
      if (name === 'numParents') {
        newData.maxUsages = parseInt(value) || 1;
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await apiRequest('/api/admin/licenses/family/create', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      setResult(response);
      toast.success(`${response.licenses.length} licença(s) criada(s) com sucesso!`);
      
      // Resetar formulário
      setFormData({
        numParents: 1,
        numStudents: 1,
        totalPrice: '',
        purchaserEmail: '',
        purchaserName: '',
        expiresInDays: 30,
        maxUsages: 1,
        quantity: 1
      });
    } catch (error) {
      toast.error(error.message || 'Erro ao criar licença');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Código copiado!');
  };

  const exportCodes = () => {
    if (!result) return;
    
    const codes = result.licenses.map(l => l.licenseCode).join('\n');
    const blob = new Blob([codes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `licencas-familia-${Date.now()}.txt`;
    a.click();
    toast.success('Códigos exportados!');
  };

  return (
    <div>
      <h2 style={styles.title}>Criar Licença Família</h2>
      <p style={styles.description}>
        Gere licenças para planos família. Cada licença permite cadastrar responsáveis e gerar tokens para alunos.
      </p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.grid}>
          <div style={styles.field}>
            <label style={styles.label}>
              Número de Responsáveis <span style={styles.required}>*</span>
            </label>
            <select
              name="numParents"
              value={formData.numParents}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value={1}>1 Responsável</option>
              <option value={2}>2 Responsáveis</option>
            </select>
            <small style={styles.helpText}>
              Define quantas licenças individuais serão geradas para os responsáveis
            </small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Número de Alunos <span style={styles.required}>*</span>
            </label>
            <select
              name="numStudents"
              value={formData.numStudents}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value={1}>1 Aluno</option>
              <option value={2}>2 Alunos</option>
              <option value={3}>3 Alunos</option>
              <option value={4}>4 Alunos</option>
            </select>
            <small style={styles.helpText}>
              Define quantos tokens podem ser gerados para alunos
            </small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Valor Total (R$)</label>
            <input
              type="number"
              name="totalPrice"
              value={formData.totalPrice}
              onChange={handleChange}
              step="0.01"
              min="0"
              style={styles.input}
              placeholder="0.00"
            />
            <small style={styles.helpText}>Opcional - para registro interno</small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Quantas vezes pode ser usada <span style={styles.required}>*</span>
            </label>
            <input
              type="number"
              name="maxUsages"
              value={formData.maxUsages}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                setFormData(prev => ({ ...prev, maxUsages: value }));
              }}
              min="1"
              max="10"
              required
              style={styles.input}
            />
            <small style={styles.helpText}>
              Define quantas vezes a mesma licença pode ser utilizada (padrão: {formData.numParents} - número de responsáveis)
            </small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Quantidade de Licenças</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              max="100"
              required
              style={styles.input}
            />
            <small style={styles.helpText}>Quantas licenças gerar de uma vez (lote)</small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Dias até Expiração</label>
            <input
              type="number"
              name="expiresInDays"
              value={formData.expiresInDays}
              onChange={handleChange}
              min="1"
              required
              style={styles.input}
            />
            <small style={styles.helpText}>Padrão: 30 dias</small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email do Comprador</label>
            <input
              type="email"
              name="purchaserEmail"
              value={formData.purchaserEmail}
              onChange={handleChange}
              style={styles.input}
              placeholder="comprador@email.com"
            />
            <small style={styles.helpText}>Opcional - para histórico</small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Nome do Comprador</label>
            <input
              type="text"
              name="purchaserName"
              value={formData.purchaserName}
              onChange={handleChange}
              style={styles.input}
              placeholder="Nome do comprador"
            />
            <small style={styles.helpText}>Opcional - para histórico</small>
          </div>
        </div>

        {formData.numParents === 2 && (
          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              ℹ️ <strong>Importante:</strong> Apenas o primeiro responsável que se cadastrar usando esta licença poderá gerar tokens para os alunos. O segundo responsável não terá permissão para gerar tokens.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Gerando...' : `Gerar ${formData.quantity} Licença(s)`}
        </button>
      </form>

      {result && (
        <div style={styles.result}>
          <h3 style={styles.resultTitle}>✅ Licenças Criadas com Sucesso!</h3>
          <p style={styles.resultText}>
            {result.message} - Gerado por: {result.generatedBy.adminEmail}
          </p>
          
          <div style={styles.actions}>
            <button onClick={exportCodes} style={styles.exportButton}>
              📥 Exportar Códigos
            </button>
          </div>

          <div style={styles.codesList}>
            {result.licenses.map((license, index) => (
              <div key={index} style={styles.codeItem}>
                <div style={styles.codeHeader}>
                  <strong style={styles.codeLabel}>Licença {index + 1}:</strong>
                  <button
                    onClick={() => copyToClipboard(license.licenseCode)}
                    style={styles.copyButton}
                  >
                    📋 Copiar
                  </button>
                </div>
                <code style={styles.code}>{license.licenseCode}</code>
                <div style={styles.codeDetails}>
                  <span>Tokens disponíveis: {license.availableTokens}</span>
                  <span>Expira em: {new Date(license.expiresAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  title: {
    fontSize: '24px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px'
  },
  description: {
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    color: '#666',
    marginBottom: '24px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    color: '#333'
  },
  required: {
    color: '#ef4444'
  },
  input: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: "'Nunito', sans-serif",
    transition: 'border-color 0.2s'
  },
  helpText: {
    fontSize: '12px',
    fontFamily: "'Nunito', sans-serif",
    color: '#999'
  },
  infoBox: {
    padding: '16px',
    background: '#eff6ff',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    marginTop: '8px'
  },
  infoText: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '14px',
    color: '#1e40af',
    lineHeight: '1.6',
    margin: 0
  },
  button: {
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #EE9116 0%, #FFB84D 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-start'
  },
  result: {
    marginTop: '32px',
    padding: '24px',
    background: '#f0f9ff',
    borderRadius: '12px',
    border: '2px solid #0ea5e9'
  },
  resultTitle: {
    fontSize: '20px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: '8px'
  },
  resultText: {
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    color: '#666',
    marginBottom: '16px'
  },
  actions: {
    marginBottom: '20px'
  },
  exportButton: {
    padding: '10px 20px',
    background: '#0ea5e9',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600'
  },
  codesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  codeItem: {
    padding: '16px',
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  },
  codeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  codeLabel: {
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    color: '#333'
  },
  copyButton: {
    padding: '6px 12px',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: "'Nunito', sans-serif"
  },
  code: {
    display: 'block',
    padding: '8px',
    background: '#f9fafb',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#EE9116',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  codeDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    fontFamily: "'Nunito', sans-serif",
    color: '#666'
  }
};

export default CreateFamilyLicense;

