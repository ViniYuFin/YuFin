import React, { useState, useEffect } from 'react';
import { apiRequest } from '../config/api';
import toast from 'react-hot-toast';

const LicenseList = () => {
  const [licenses, setLicenses] = useState({ familyLicenses: [], schoolLicenses: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'family', 'school'

  useEffect(() => {
    loadLicenses();
  }, [filter]);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(`/api/admin/licenses?type=${filter === 'all' ? '' : filter}`);
      setLicenses(response);
    } catch (error) {
      // Não exibir toast se o erro for de token expirado (App.jsx já cuida disso)
      if (error.isTokenExpired) return;
      toast.error(error.message || 'Erro ao carregar licenças');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Código copiado!');
  };

  const handleDelete = async (licenseCode, type) => {
    if (!window.confirm(`Tem certeza que deseja excluir a licença ${licenseCode}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      // Codificar o código da licença para URL (importante para códigos com hífens)
      const encodedCode = encodeURIComponent(licenseCode);
      console.log('🗑️ Deletando licença:', licenseCode, 'Encoded:', encodedCode);
      
      await apiRequest(`/api/admin/licenses/${encodedCode}`, {
        method: 'DELETE'
      });
      toast.success('Licença excluída com sucesso!');
      loadLicenses(); // Recarregar lista
    } catch (error) {
      // Não exibir toast se o erro for de token expirado (App.jsx já cuida disso)
      if (error.isTokenExpired) return;
      console.error('❌ Erro ao deletar:', error);
      toast.error(error.message || 'Erro ao excluir licença');
    }
  };

  const exportAll = () => {
    const allCodes = [
      ...licenses.familyLicenses.map(l => l.licenseCode),
      ...licenses.schoolLicenses.map(l => l.licenseCode)
    ].join('\n');
    
    const blob = new Blob([allCodes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todas-licencas-${Date.now()}.txt`;
    a.click();
    toast.success('Códigos exportados!');
  };

  if (loading) {
    return <div style={styles.loading}>Carregando...</div>;
  }

  const total = licenses.familyLicenses.length + licenses.schoolLicenses.length;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Lista de Licenças Geradas</h2>
          <p style={styles.subtitle}>Total: {total} licença(s)</p>
        </div>
        <div style={styles.actions}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={styles.filter}
          >
            <option value="all">Todas</option>
            <option value="family">Família</option>
            <option value="school">Escola</option>
          </select>
          <button onClick={exportAll} style={styles.exportButton}>
            📥 Exportar Todas
          </button>
          <button onClick={loadLicenses} style={styles.refreshButton}>
            🔄 Atualizar
          </button>
        </div>
      </div>

      {total === 0 ? (
        <div style={styles.empty}>
          <p>Nenhuma licença encontrada.</p>
        </div>
      ) : (
        <>
          {filter !== 'school' && licenses.familyLicenses.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                👨‍👩‍👧‍👦 Licenças Família ({licenses.familyLicenses.length})
              </h3>
              <div style={styles.cardsGrid}>
                {licenses.familyLicenses.map((license) => (
                  <div key={license._id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <code style={styles.code}>{license.licenseCode}</code>
                      <div style={styles.cardActions}>
                        <button
                          onClick={() => copyToClipboard(license.licenseCode)}
                          style={styles.iconButton}
                          title="Copiar código"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => handleDelete(license.licenseCode, 'family')}
                          style={styles.deleteButton}
                          title="Excluir licença"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div style={styles.cardBody}>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Responsáveis:</span>
                        <span style={styles.infoValue}>{license.planData?.numParents || '-'}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Alunos:</span>
                        <span style={styles.infoValue}>{license.planData?.numStudents || '-'}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Status:</span>
                        <span style={{
                          ...styles.badge,
                          background: license.status === 'active' ? '#10b981' : '#ef4444'
                        }}>
                          {license.status}
                        </span>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Expira em:</span>
                        <span style={styles.infoValue}>{new Date(license.expiresAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Criada em:</span>
                        <span style={styles.infoValue}>{new Date(license.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filter !== 'family' && licenses.schoolLicenses.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                🏫 Licenças Escola ({licenses.schoolLicenses.length})
              </h3>
              <div style={styles.cardsGrid}>
                {licenses.schoolLicenses.map((license) => (
                  <div key={license._id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <code style={styles.code}>{license.licenseCode}</code>
                      <div style={styles.cardActions}>
                        <button
                          onClick={() => copyToClipboard(license.licenseCode)}
                          style={styles.iconButton}
                          title="Copiar código"
                          onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
                          onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
                        >
                          📋
                        </button>
                        <button
                          onClick={() => handleDelete(license.licenseCode, 'school')}
                          style={styles.deleteButton}
                          title="Excluir licença"
                          onMouseEnter={(e) => e.target.style.background = '#fecaca'}
                          onMouseLeave={(e) => e.target.style.background = '#fee2e2'}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div style={styles.cardBody}>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Alunos:</span>
                        <span style={styles.infoValue}>{license.planData?.numStudents || '-'}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Status:</span>
                        <span style={{
                          ...styles.badge,
                          background: license.status === 'paid' ? '#10b981' : '#ef4444'
                        }}>
                          {license.status}
                        </span>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Expira em:</span>
                        <span style={styles.infoValue}>{new Date(license.expiresAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Criada em:</span>
                        <span style={styles.infoValue}>{new Date(license.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '24px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px'
  },
  subtitle: {
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    color: '#666'
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center',
    width: '100%'
  },
  filter: {
    padding: '8px 12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif"
  },
  exportButton: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #EE9116 0%, #FFB300 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    fontSize: '14px'
  },
  refreshButton: {
    padding: '8px 16px',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    fontSize: '14px'
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    fontFamily: "'Nunito', sans-serif",
    color: '#999'
  },
  section: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '16px'
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    width: '100%',
    boxSizing: 'border-box'
  },
  card: {
    background: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    minWidth: 0,
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '2px solid #f3f4f6',
    gap: '8px',
    minWidth: 0
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  infoLabel: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    textAlign: 'left'
  },
  infoValue: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '14px',
    fontWeight: '700',
    color: '#333',
    textAlign: 'right'
  },
  code: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#EE9116',
    fontWeight: 'bold',
    padding: '6px 10px',
    background: '#fff7ed',
    borderRadius: '6px',
    border: '1px solid #fed7aa',
    wordBreak: 'break-all',
    overflowWrap: 'break-word',
    minWidth: 0,
    flex: '1 1 auto'
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '6px',
    color: 'white',
    fontSize: '12px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  iconButton: {
    padding: '6px 10px',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: "'Nunito', sans-serif",
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteButton: {
    padding: '6px 10px',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: "'Nunito', sans-serif",
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    fontFamily: "'Nunito', sans-serif",
    color: '#666'
  }
};

export default LicenseList;

