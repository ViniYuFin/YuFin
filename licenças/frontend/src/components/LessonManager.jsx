import React, { useState, useEffect } from 'react';
import { apiRequest } from '../config/api';
import toast from 'react-hot-toast';
import LessonListComponent from './LessonList';
import LessonEditor from './LessonEditor';

const LessonManager = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLessonId, setEditingLessonId] = useState(null);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/admin/lessons');
      setLessons(response);
    } catch (error) {
      // Não exibir toast se o erro for de token expirado (App.jsx já cuida disso)
      if (error.isTokenExpired) return;
      toast.error(error.message || 'Erro ao carregar lições');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lessonId) => {
    if (!window.confirm('Tem certeza que deseja desativar esta lição? Ela não aparecerá mais para os alunos.')) {
      return;
    }

    try {
      await apiRequest(`/api/admin/lessons/${lessonId}`, {
        method: 'DELETE'
      });
      toast.success('Lição desativada com sucesso!');
      loadLessons();
    } catch (error) {
      // Não exibir toast se o erro for de token expirado (App.jsx já cuida disso)
      if (error.isTokenExpired) return;
      toast.error(error.message || 'Erro ao desativar lição');
    }
  };

  const handleToggleActive = async (lessonId, currentStatus) => {
    try {
      await apiRequest(`/api/admin/lessons/${lessonId}/toggle-active`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentStatus })
      });
      toast.success(`Lição ${!currentStatus ? 'ativada' : 'desativada'} com sucesso!`);
      loadLessons();
    } catch (error) {
      // Não exibir toast se o erro for de token expirado (App.jsx já cuida disso)
      if (error.isTokenExpired) return;
      toast.error(error.message || 'Erro ao alterar status da lição');
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.loading('Gerando PDF...', { id: 'pdf-export' });
      
      // Importar API_BASE_URL
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('adminToken');
      
      // Construir URL com filtros baseado no tipo
      const params = new URLSearchParams();
      if (filterGrade !== 'all') {
        params.append('gradeId', filterGrade);
      }
      
      // Tipo usado na API (slug interno)
      let apiExportType = 'quiz';
      if (filterType === 'budget-distribution') {
        apiExportType = 'budget-distribution';
      } else if (filterType === 'simulation') {
        apiExportType = 'simulation';
      } else if (filterType === 'match') {
        apiExportType = 'match';
      } else if (filterType === 'drag-drop') {
        apiExportType = 'drag-drop';
      } else if (filterType === 'goals') {
        apiExportType = 'goals';
      } else if (filterType === 'math-problems') {
        apiExportType = 'math-problems';
      }
      const url = `${API_BASE_URL}/api/admin/lessons/export-pdf/${apiExportType}${params.toString() ? '?' + params.toString() : ''}`;
      
      // Fazer requisição para download do PDF
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      // Tratar token expirado
      if (response.status === 401) {
        toast.dismiss('pdf-export');
        return; // App.jsx já cuida da mensagem
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao gerar PDF' }));
        throw new Error(errorData.error || 'Erro ao gerar PDF');
      }
      
      // Criar blob e fazer download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      // Tipo usado apenas no nome do arquivo (mais amigável)
      let fileExportType = 'quiz';
      if (filterType === 'budget-distribution') {
        fileExportType = 'distribuicao-orcamento';
      } else if (filterType === 'simulation') {
        fileExportType = 'simulacao';
      } else if (filterType === 'match') {
        fileExportType = 'associacao-match';
      } else if (filterType === 'drag-drop') {
        fileExportType = 'arraste-solte';
      } else if (filterType === 'goals') {
        fileExportType = 'metas-financeiras';
      } else if (filterType === 'math-problems') {
        fileExportType = 'problemas-matematicos';
      }
      link.download = `licoes-${fileExportType}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('PDF gerado e baixado com sucesso!', { id: 'pdf-export' });
    } catch (error) {
      toast.error(error.message || 'Erro ao exportar PDF', { id: 'pdf-export' });
    }
  };

  // Filtrar lições
  const filteredLessons = lessons.filter(lesson => {
    const matchesType = filterType === 'all' || lesson.type === filterType;
    const matchesGrade = filterGrade === 'all' || lesson.gradeId === filterGrade;
    const matchesSearch = searchTerm === '' || 
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesGrade && matchesSearch;
  });

  // Agrupar por tipo
  const lessonsByType = filteredLessons.reduce((acc, lesson) => {
    if (!acc[lesson.type]) {
      acc[lesson.type] = [];
    }
    acc[lesson.type].push(lesson);
    return acc;
  }, {});

  const gamificationTypes = [
    { value: 'all', label: 'Todos os Tipos', icon: '📚' },
    { value: 'quiz', label: 'Quiz', icon: '❓' },
    { value: 'drag-drop', label: 'Arraste e Solte', icon: '🖱️' },
    { value: 'goals', label: 'Metas Financeiras', icon: '🎯' },
    { value: 'match', label: 'Associação (Match)', icon: '🔗' },
    { value: 'budget-distribution', label: 'Distribuição de Orçamento', icon: '💰' },
    { value: 'math-problems', label: 'Problemas Matemáticos', icon: '🔢' },
    { value: 'simulation', label: 'Simulação', icon: '🎮' }
  ];

  const grades = [
    { value: 'all', label: 'Todas as Séries' },
    { value: '6º Ano', label: '6º Ano' },
    { value: '7º Ano', label: '7º Ano' },
    { value: '8º Ano', label: '8º Ano' },
    { value: '9º Ano', label: '9º Ano' },
    { value: '1º Ano EM', label: '1º Ano EM' },
    { value: '2º Ano EM', label: '2º Ano EM' },
    { value: '3º Ano EM', label: '3º Ano EM' }
  ];

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Carregando lições...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📚 Gerenciar Lições</h2>
        <p style={styles.subtitle}>
          Total: {lessons.length} lições | Exibindo: {filteredLessons.length}
        </p>
      </div>

      {/* Filtros */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Tipo de Gamificação:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={styles.select}
          >
            {gamificationTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Série:</label>
          <select 
            value={filterGrade} 
            onChange={(e) => setFilterGrade(e.target.value)}
            style={styles.select}
          >
            {grades.map(grade => (
              <option key={grade.value} value={grade.value}>
                {grade.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Buscar:</label>
          <input
            type="text"
            placeholder="Título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.input}
          />
        </div>

        <button onClick={loadLessons} style={styles.refreshButton}>
          🔄 Atualizar
        </button>
        
        {(filterType === 'quiz' || filterType === 'budget-distribution' || filterType === 'simulation' || filterType === 'match' || filterType === 'drag-drop' || filterType === 'goals' || filterType === 'math-problems') && (
          <button onClick={handleExportPDF} style={styles.exportButton}>
            📄 Exportar PDF
          </button>
        )}
      </div>

      {/* Editor de Lição */}
      {editingLessonId ? (
        <LessonEditor
          lessonId={editingLessonId}
          onSave={() => {
            setEditingLessonId(null);
            loadLessons();
          }}
          onCancel={() => setEditingLessonId(null)}
        />
      ) : (
        /* Lista de lições agrupadas por tipo */
        <LessonListComponent 
          lessonsByType={lessonsByType}
          onEdit={(lesson) => {
            setEditingLessonId(lesson._id || lesson.id);
          }}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '100%'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
    fontFamily: "'Nunito', sans-serif"
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    fontFamily: "'Nunito', sans-serif"
  },
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
    padding: '16px',
    background: '#f5f5f5',
    borderRadius: '8px',
    alignItems: 'flex-end'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: '1 1 200px',
    minWidth: '150px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    fontFamily: "'Nunito', sans-serif"
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    background: 'white'
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif"
  },
  refreshButton: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #EE9116 0%, #FFB300 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: "'Nunito', sans-serif",
    whiteSpace: 'nowrap'
  },
  exportButton: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: "'Nunito', sans-serif",
    whiteSpace: 'nowrap'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    gap: '16px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #EE9116',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

export default LessonManager;
