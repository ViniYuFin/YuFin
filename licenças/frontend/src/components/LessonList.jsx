import React, { useState } from 'react';
import toast from 'react-hot-toast';

const LessonListComponent = ({ lessonsByType, onEdit, onDelete, onToggleActive }) => {
  const [expandedTypes, setExpandedTypes] = useState({});

  const toggleType = (type) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getTypeName = (type) => {
    const typeNames = {
      'quiz': 'Quiz (Perguntas e Respostas)',
      'choices': 'Escolha Múltipla',
      'math-problems': 'Problemas Matemáticos',
      'match': 'Associação (Match)',
      'simulation': 'Simulação',
      'shopping-simulation': 'Simulação de Compras',
      'drag-drop': 'Arraste e Solte',
      'classify': 'Classificação',
      'input': 'Resposta Aberta',
      'price-comparison': 'Comparação de Preços',
      'budget-distribution': 'Distribuição de Orçamento',
      'budget-choices': 'Escolhas Orçamentárias',
      'categories-simulation': 'Simulação por Categorias',
      'progress-game': 'Jogo de Progresso',
      'shopping-cart': 'Carrinho de Compras',
      'goals': 'Metas Financeiras'
    };
    return typeNames[type] || type;
  };

  const getTypeIcon = (type) => {
    const typeIcons = {
      'quiz': '❓',
      'drag-drop': '🖱️',
      'goals': '🎯',
      'match': '🔗',
      'budget-distribution': '💰',
      'math-problems': '🔢',
      'simulation': '🎮'
    };
    return typeIcons[type] || '📝';
  };

  if (Object.keys(lessonsByType).length === 0) {
    return (
      <div style={styles.empty}>
        <p>Nenhuma lição encontrada com os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {Object.entries(lessonsByType).map(([type, lessons]) => (
        <div key={type} style={styles.typeSection}>
          <div 
            style={styles.typeHeader}
            onClick={() => toggleType(type)}
          >
            <span style={styles.typeIcon}>{getTypeIcon(type)}</span>
            <span style={styles.typeTitle}>
              {getTypeName(type)} ({lessons.length} {lessons.length === 1 ? 'lição' : 'lições'})
            </span>
            <span style={styles.expandIcon}>
              {expandedTypes[type] ? '▼' : '▶'}
            </span>
          </div>

          {expandedTypes[type] && (
            <div style={styles.lessonsGrid}>
              {lessons.map(lesson => (
                <div key={lesson._id || lesson.id} style={styles.lessonCard}>
                  <div style={styles.cardHeader}>
                    <h4 style={styles.lessonTitle}>{lesson.title}</h4>
                    <span style={{
                      ...styles.statusBadge,
                      ...(lesson.isActive ? styles.activeBadge : styles.inactiveBadge)
                    }}>
                      {lesson.isActive ? '✓ Ativa' : '✗ Inativa'}
                    </span>
                  </div>
                  
                  <p style={styles.lessonDescription}>{lesson.description}</p>
                  
                  <div style={styles.lessonMeta}>
                    <span style={styles.metaItem}>📚 {lesson.gradeId}</span>
                    <span style={styles.metaItem}>📖 Módulo {lesson.module}</span>
                    <span style={styles.metaItem}>🔢 Ordem {lesson.order}</span>
                    <span style={styles.metaItem}>⭐ Dificuldade {lesson.difficulty}/9</span>
                    <span style={styles.metaItem}>⏱️ {lesson.estimatedTime}min</span>
                  </div>

                  <div style={styles.cardActions}>
                    <button
                      onClick={() => onEdit(lesson)}
                      style={styles.editButton}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => onToggleActive(lesson._id || lesson.id, lesson.isActive)}
                      style={{
                        ...styles.toggleButton,
                        ...(lesson.isActive ? styles.deactivateButton : styles.activateButton)
                      }}
                    >
                      {lesson.isActive ? '👁️ Desativar' : '👁️‍🗨️ Ativar'}
                    </button>
                    <button
                      onClick={() => onDelete(lesson._id || lesson.id)}
                      style={styles.deleteButton}
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  typeSection: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    overflow: 'hidden'
  },
  typeHeader: {
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    fontSize: '16px',
    color: '#333',
    transition: 'background 0.2s'
  },
  typeIcon: {
    fontSize: '20px'
  },
  typeTitle: {
    flex: 1
  },
  expandIcon: {
    fontSize: '12px',
    color: '#666'
  },
  lessonsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '16px',
    padding: '20px'
  },
  lessonCard: {
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    padding: '16px',
    background: 'white',
    transition: 'box-shadow 0.2s',
    fontFamily: "'Nunito', sans-serif"
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
    gap: '8px'
  },
  lessonTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
    flex: 1
  },
  statusBadge: {
    fontSize: '11px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  activeBadge: {
    background: '#d4edda',
    color: '#155724'
  },
  inactiveBadge: {
    background: '#f8d7da',
    color: '#721c24'
  },
  lessonDescription: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '12px',
    lineHeight: '1.5'
  },
  lessonMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '12px',
    fontSize: '12px',
    color: '#888'
  },
  metaItem: {
    padding: '4px 8px',
    background: '#f5f5f5',
    borderRadius: '4px'
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  editButton: {
    padding: '6px 12px',
    background: 'linear-gradient(135deg, #EE9116 0%, #FFB300 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: "'Nunito', sans-serif"
  },
  toggleButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: "'Nunito', sans-serif"
  },
  activateButton: {
    background: '#28a745',
    color: 'white'
  },
  deactivateButton: {
    background: '#ffc107',
    color: '#333'
  },
  deleteButton: {
    padding: '6px 12px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: "'Nunito', sans-serif"
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontFamily: "'Nunito', sans-serif"
  }
};

export default LessonListComponent;
