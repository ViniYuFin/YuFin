import React, { useState, useEffect } from 'react';
import { apiRequest } from '../config/api';
import toast from 'react-hot-toast';

const LessonEditor = ({ lessonId, onSave, onCancel }) => {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedLesson, setEditedLesson] = useState(null);
  const [editMode, setEditMode] = useState(true); // Sempre em modo edição
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/api/admin/lessons/${lessonId}`);
      setLesson(data);
      setEditedLesson(JSON.parse(JSON.stringify(data))); // Deep copy
    } catch (error) {
      // Não exibir toast se o erro for de token expirado (App.jsx já cuida disso)
      if (error.isTokenExpired) return;
      toast.error(error.message || 'Erro ao carregar lição');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiRequest(`/api/admin/lessons/${lessonId}`, {
        method: 'PUT',
        body: JSON.stringify(editedLesson)
      });
      toast.success('Lição salva com sucesso!');
      if (onSave) onSave();
    } catch (error) {
      // Não exibir toast se o erro for de token expirado (App.jsx já cuida disso)
      if (error.isTokenExpired) return;
      toast.error(error.message || 'Erro ao salvar lição');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path, value) => {
    setEditedLesson(prev => {
      const newLesson = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newLesson;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newLesson;
    });
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Carregando lição...</p>
      </div>
    );
  }

  if (!editedLesson) {
    return <div>Erro ao carregar lição</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header de Edição */}
      <div style={{
        ...styles.editorHeader,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '12px' : '0',
        padding: isMobile ? '12px 16px' : '16px 24px'
      }}>
        <div style={{
          ...styles.headerLeft,
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'flex-start' : 'center'
        }}>
          <h2 style={{
            ...styles.title,
            fontSize: isMobile ? '16px' : '18px'
          }}>✏️ Editando: {editedLesson.title}</h2>
        </div>
        <div style={{
          ...styles.headerActions,
          width: isMobile ? '100%' : 'auto',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '8px' : '12px'
        }}>
          <button onClick={onCancel} style={{
            ...styles.cancelButton,
            width: isMobile ? '100%' : 'auto',
            padding: isMobile ? '12px 16px' : '10px 20px'
          }}>
            {isMobile ? 'Cancelar' : '❌ Cancelar'}
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            ...styles.saveButton,
            width: isMobile ? '100%' : 'auto',
            padding: isMobile ? '12px 16px' : '10px 20px'
          }}>
            {saving 
              ? (isMobile ? 'Salvando...' : '💾 Salvando...')
              : (isMobile ? 'Salvar' : '💾 Salvar Alterações')
            }
          </button>
        </div>
      </div>

      {/* Renderizar Lição com Edição Inline */}
      <div style={styles.lessonContainer}>
        <EditableLessonRenderer 
          lesson={editedLesson}
          updateField={updateField}
        />
      </div>
    </div>
  );
};

// Componente que renderiza a lição editável baseado no tipo
const EditableLessonRenderer = ({ lesson, updateField }) => {
  const type = lesson.type;

  switch (type) {
    case 'goals':
      return <EditableGoalsLesson lesson={lesson} updateField={updateField} />;
    case 'quiz':
      return <EditableQuizLesson lesson={lesson} updateField={updateField} />;
    case 'match':
      return <EditableMatchLesson lesson={lesson} updateField={updateField} />;
    case 'simulation':
      return <EditableSimulationLesson lesson={lesson} updateField={updateField} />;
    case 'budget-distribution':
      return <EditableBudgetDistributionLesson lesson={lesson} updateField={updateField} />;
    case 'drag-drop':
      return <EditableDragDropLesson lesson={lesson} updateField={updateField} />;
    case 'math-problems':
      return <EditableMathProblemsLesson lesson={lesson} updateField={updateField} />;
    default:
      return <EditableGenericLesson lesson={lesson} updateField={updateField} />;
  }
};

// Editor para Goals Lesson (Metas Financeiras)
const EditableGoalsLesson = ({ lesson, updateField }) => {
  const content = lesson.content || {};
  const examples = content.examples || [];
  const goalCategories = content.goalCategories || [];
  const inputFields = content.inputFields || [];
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const currentExample = examples[currentExampleIndex] || {};

  const updateExample = (exampleIndex, field, value) => {
    const newExamples = [...examples];
    if (!newExamples[exampleIndex]) {
      newExamples[exampleIndex] = {};
    }
    newExamples[exampleIndex] = { ...newExamples[exampleIndex], [field]: value };
    updateField('content.examples', newExamples);
  };

  const addExample = () => {
    const newExample = {
      character: 'Personagem',
      scenario: 'Descreva a situação...',
      calculation: 'Instrução de cálculo...',
      answer: 0,
      explanation: 'Explicação da resposta...',
      category: ''
    };
    updateField('content.examples', [...examples, newExample]);
  };

  const updateCategory = (categoryIndex, field, value) => {
    const newCategories = [...goalCategories];
    if (!newCategories[categoryIndex]) {
      newCategories[categoryIndex] = { id: `cat-${Date.now()}`, name: '', icon: '🎯', description: '', examples: [] };
    }
    newCategories[categoryIndex] = { ...newCategories[categoryIndex], [field]: value };
    updateField('content.goalCategories', newCategories);
  };

  const addCategory = () => {
    const newCategory = {
      id: `cat-${Date.now()}`,
      name: 'Nova Categoria',
      icon: '🎯',
      description: 'Descrição da categoria',
      examples: []
    };
    updateField('content.goalCategories', [...goalCategories, newCategory]);
  };

  const updateInputField = (fieldIndex, field, value) => {
    const newFields = [...inputFields];
    if (!newFields[fieldIndex]) {
      newFields[fieldIndex] = { label: '', type: 'text', placeholder: '' };
    }
    newFields[fieldIndex] = { ...newFields[fieldIndex], [field]: value };
    updateField('content.inputFields', newFields);
  };

  const addInputField = () => {
    const newField = {
      label: 'Novo Campo',
      type: 'text',
      placeholder: 'Placeholder...'
    };
    updateField('content.inputFields', [...inputFields, newField]);
  };

  return (
    <div style={styles.lessonWrapper}>
      <h2 style={styles.mainTitle}>Editor: Metas Financeiras</h2>

      {/* Configurações Gerais */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>⚙️ Configurações Gerais</h3>
        <div style={styles.formGrid}>
          <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
            <label style={styles.label}>Cenário Principal:</label>
            <textarea
              value={content.scenario || ''}
              onChange={(e) => updateField('content.scenario', e.target.value)}
              style={styles.textarea}
              rows={2}
              placeholder="Descreva o cenário principal da lição"
              onFocus={(e) => {
                e.target.style.borderColor = '#EE9116';
                e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
            <label style={styles.label}>Instrução:</label>
            <input
              type="text"
              value={content.instruction || ''}
              onChange={(e) => updateField('content.instruction', e.target.value)}
              style={styles.input}
              placeholder="ex: Resolva os exemplos e depois crie sua própria meta!"
              onFocus={(e) => {
                e.target.style.borderColor = '#EE9116';
                e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
      </div>

      {/* Exemplos (Cenários 1 e 2) */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📚 Exemplos (Cenários 1 e 2)</h3>
          <button onClick={addExample} style={styles.addButton}>
            + Adicionar Exemplo
          </button>
        </div>

        {/* Aviso quando há mais de 2 exemplos */}
        {examples.length > 2 && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: '8px',
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ 
                color: '#92400e', 
                display: 'block', 
                marginBottom: '4px',
                fontFamily: "'Nunito', sans-serif"
              }}>
                Atenção: Apenas os 2 primeiros exemplos são utilizados na lição
              </strong>
              <p style={{ 
                color: '#78350f', 
                margin: 0, 
                fontSize: '14px',
                fontFamily: "'Nunito', sans-serif"
              }}>
                A lição exibe apenas os exemplos nos índices 0 e 1. Os exemplos adicionais (índices 2+) não aparecerão para os alunos. 
                O cenário 3 é sempre o formulário "Sua Meta" e não utiliza exemplos do array.
              </p>
            </div>
          </div>
        )}

        {/* Navegação de Exemplos */}
        {examples.length > 0 && (
          <div style={styles.scenarioNav}>
            <button
              onClick={() => setCurrentExampleIndex(Math.max(0, currentExampleIndex - 1))}
              disabled={currentExampleIndex === 0}
              style={styles.navButton}
            >
              ← Anterior
            </button>
            <span style={styles.scenarioCounter}>
              Exemplo {currentExampleIndex + 1} de {examples.length}
            </span>
            <button
              onClick={() => setCurrentExampleIndex(Math.min(examples.length - 1, currentExampleIndex + 1))}
              disabled={currentExampleIndex >= examples.length - 1}
              style={styles.navButton}
            >
              Próximo →
            </button>
          </div>
        )}

        {examples.map((example, eIndex) => (
          <div key={eIndex} style={styles.scenarioCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNumber}>Exemplo {eIndex + 1}</span>
              <button
                onClick={() => {
                  const newExamples = examples.filter((_, i) => i !== eIndex);
                  updateField('content.examples', newExamples);
                  if (currentExampleIndex >= newExamples.length) {
                    setCurrentExampleIndex(Math.max(0, newExamples.length - 1));
                  }
                }}
                style={styles.removeButton}
              >
                🗑️
              </button>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Personagem:</label>
                <input
                  type="text"
                  value={example.character || ''}
                  onChange={(e) => updateExample(eIndex, 'character', e.target.value)}
                  style={styles.input}
                  placeholder="ex: João"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Categoria (Opcional):</label>
                <select
                  value={example.category || ''}
                  onChange={(e) => updateExample(eIndex, 'category', e.target.value)}
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Nenhuma</option>
                  {goalCategories.map((cat, cIdx) => (
                    <option key={cIdx} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Situação:</label>
                <textarea
                  value={example.scenario || ''}
                  onChange={(e) => updateExample(eIndex, 'scenario', e.target.value)}
                  style={styles.textarea}
                  rows={3}
                  placeholder="Descreva a situação do exemplo"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Instrução de Cálculo:</label>
                <input
                  type="text"
                  value={example.calculation || ''}
                  onChange={(e) => updateExample(eIndex, 'calculation', e.target.value)}
                  style={styles.input}
                  placeholder="ex: Quanto estará excedendo seu orçamento em 4 meses?"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Resposta Correta:</label>
                <input
                  type="number"
                  value={example.answer || ''}
                  onChange={(e) => updateExample(eIndex, 'answer', parseFloat(e.target.value) || 0)}
                  style={styles.input}
                  placeholder="0"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Explicação:</label>
                <textarea
                  value={example.explanation || ''}
                  onChange={(e) => updateExample(eIndex, 'explanation', e.target.value)}
                  style={styles.textarea}
                  rows={2}
                  placeholder="Explicação da resposta correta"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Categorias de Meta */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🎯 Categorias de Meta</h3>
          <button onClick={addCategory} style={styles.addButton}>
            + Adicionar Categoria
          </button>
        </div>

        {goalCategories.map((category, cIndex) => (
          <div key={cIndex} style={styles.categoryCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNumber}>Categoria {cIndex + 1}</span>
              <button
                onClick={() => {
                  const newCategories = goalCategories.filter((_, i) => i !== cIndex);
                  updateField('content.goalCategories', newCategories);
                }}
                style={styles.removeButton}
              >
                🗑️
              </button>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>ID:</label>
                <input
                  type="text"
                  value={category.id || ''}
                  onChange={(e) => updateCategory(cIndex, 'id', e.target.value)}
                  style={styles.input}
                  placeholder="ex: compras"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nome:</label>
                <input
                  type="text"
                  value={category.name || ''}
                  onChange={(e) => updateCategory(cIndex, 'name', e.target.value)}
                  style={styles.input}
                  placeholder="ex: Compras"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ícone (emoji):</label>
                <input
                  type="text"
                  value={category.icon || ''}
                  onChange={(e) => updateCategory(cIndex, 'icon', e.target.value)}
                  style={styles.input}
                  placeholder="ex: 🛒"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Descrição:</label>
                <textarea
                  value={category.description || ''}
                  onChange={(e) => updateCategory(cIndex, 'description', e.target.value)}
                  style={styles.textarea}
                  rows={2}
                  placeholder="Descrição da categoria"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Campos de Input (Cenário 3) */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📝 Campos de Input (Cenário 3)</h3>
          <button onClick={addInputField} style={styles.addButton}>
            + Adicionar Campo
          </button>
        </div>

        {inputFields.map((field, fIndex) => (
          <div key={fIndex} style={styles.categoryCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNumber}>Campo {fIndex + 1}</span>
              <button
                onClick={() => {
                  const newFields = inputFields.filter((_, i) => i !== fIndex);
                  updateField('content.inputFields', newFields);
                }}
                style={styles.removeButton}
              >
                🗑️
              </button>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Label:</label>
                <input
                  type="text"
                  value={field.label || ''}
                  onChange={(e) => updateInputField(fIndex, 'label', e.target.value)}
                  style={styles.input}
                  placeholder="ex: Quanto você quer comprar?"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tipo:</label>
                <select
                  value={field.type || 'text'}
                  onChange={(e) => updateInputField(fIndex, 'type', e.target.value)}
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="text">Texto</option>
                  <option value="number">Número</option>
                  <option value="select">Seleção</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Placeholder:</label>
                <input
                  type="text"
                  value={field.placeholder || ''}
                  onChange={(e) => updateInputField(fIndex, 'placeholder', e.target.value)}
                  style={styles.input}
                  placeholder="Placeholder do campo"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componentes auxiliares para edição inline
const EditableText = ({ value, onChange, style, placeholder }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  if (isEditing) {
    return (
      <input
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={() => {
          onChange(tempValue);
          setIsEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onChange(tempValue);
            setIsEditing(false);
          }
        }}
        style={{ ...style, ...styles.editableInput }}
        autoFocus
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        ...style, 
        ...styles.editableText,
        border: isHovered ? '2px dashed #EE9116' : '2px dashed transparent',
        background: isHovered ? '#fef3c7' : 'transparent',
        transition: 'all 0.2s'
      }}
      title="Clique para editar"
    >
      {value || <span style={{ color: '#999', fontStyle: 'italic' }}>{placeholder}</span>}
      {isHovered && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#EE9116' }}>✏️</span>}
    </div>
  );
};

const EditableTextarea = ({ value, onChange, style, placeholder }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  if (isEditing) {
    return (
      <textarea
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={() => {
          onChange(tempValue);
          setIsEditing(false);
        }}
        style={{ ...style, ...styles.editableTextarea }}
        autoFocus
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        ...style, 
        ...styles.editableText,
        border: isHovered ? '2px dashed #EE9116' : '2px dashed transparent',
        background: isHovered ? '#fef3c7' : 'transparent',
        transition: 'all 0.2s',
        minHeight: '60px',
        padding: '8px'
      }}
      title="Clique para editar"
    >
      {value || <span style={{ color: '#999', fontStyle: 'italic' }}>{placeholder}</span>}
      {isHovered && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#EE9116' }}>✏️</span>}
    </div>
  );
};

// Editor para Quiz Lesson
const EditableQuizLesson = ({ lesson, updateField }) => {
  const content = lesson.content || {};
  const questions = content.questions || [];

  const updateQuestion = (questionIndex, field, value) => {
    const newQuestions = [...questions];
    if (!newQuestions[questionIndex]) {
      newQuestions[questionIndex] = {
        id: questionIndex + 1,
        question: '',
        options: [],
        correctAnswer: 0,
        explanation: '',
        points: 10
      };
    }
    newQuestions[questionIndex] = { ...newQuestions[questionIndex], [field]: value };
    updateField('content.questions', newQuestions);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    if (!newQuestions[questionIndex]) {
      newQuestions[questionIndex] = { options: [] };
    }
    const options = newQuestions[questionIndex].options || [];
    const newOptions = [...options];
    newOptions[optionIndex] = value;
    newQuestions[questionIndex] = { ...newQuestions[questionIndex], options: newOptions };
    updateField('content.questions', newQuestions);
  };

  const addOption = (questionIndex) => {
    const newQuestions = [...questions];
    if (!newQuestions[questionIndex]) {
      newQuestions[questionIndex] = { options: [] };
    }
    const options = newQuestions[questionIndex].options || [];
    const newOption = `Nova opção ${options.length + 1}`;
    newQuestions[questionIndex] = { 
      ...newQuestions[questionIndex], 
      options: [...options, newOption] 
    };
    updateField('content.questions', newQuestions);
  };

  const addQuestion = () => {
    const newQuestion = {
      id: questions.length + 1,
      category: 'geral',
      difficulty: 'medio',
      question: 'Nova pergunta...',
      options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
      correctAnswer: 0,
      explanation: 'Explicação da resposta...',
      points: 10
    };
    updateField('content.questions', [...questions, newQuestion]);
  };

  return (
    <div style={styles.lessonWrapper}>
      <h2 style={styles.mainTitle}>Editor: Quiz (Perguntas e Respostas)</h2>

      {/* Perguntas */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>❓ Perguntas</h3>
          <button onClick={addQuestion} style={styles.addButton}>
            + Adicionar Pergunta
          </button>
        </div>

        {questions.map((question, qIndex) => (
          <div key={qIndex} style={styles.scenarioCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNumber}>Pergunta {qIndex + 1}</span>
              <button
                onClick={() => {
                  const newQuestions = questions.filter((_, i) => i !== qIndex);
                  updateField('content.questions', newQuestions);
                }}
                style={styles.removeButton}
              >
                🗑️
              </button>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>ID:</label>
                <input
                  type="number"
                  value={question.id || qIndex + 1}
                  onChange={(e) => updateQuestion(qIndex, 'id', parseInt(e.target.value) || qIndex + 1)}
                  style={styles.input}
                  placeholder="1"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Categoria (Opcional):</label>
                <input
                  type="text"
                  value={question.category || ''}
                  onChange={(e) => updateQuestion(qIndex, 'category', e.target.value)}
                  style={styles.input}
                  placeholder="ex: geral"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Dificuldade:</label>
                <select
                  value={question.difficulty || 'medio'}
                  onChange={(e) => updateQuestion(qIndex, 'difficulty', e.target.value)}
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Pontos:</label>
                <input
                  type="number"
                  value={question.points || 10}
                  onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 10)}
                  style={styles.input}
                  placeholder="10"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Pergunta:</label>
                <textarea
                  value={question.question || ''}
                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                  style={styles.textarea}
                  rows={3}
                  placeholder="Digite a pergunta..."
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Opções/Alternativas */}
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <div style={styles.sectionHeader}>
                  <label style={styles.label}>Opções/Alternativas:</label>
                  <button
                    onClick={() => addOption(qIndex)}
                    style={styles.addButton}
                    type="button"
                  >
                    + Adicionar Opção
                  </button>
                </div>
                <div style={styles.adjustmentsSection}>
                  {(question.options || []).map((option, oIndex) => (
                    <div key={oIndex} style={styles.adjustmentRow}>
                      <span style={styles.adjustmentLabel}>
                        {String.fromCharCode(65 + oIndex)}:
                      </span>
                      <div style={styles.adjustmentInputs}>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          style={styles.adjustmentInput}
                          placeholder="Texto da opção"
                          onFocus={(e) => {
                            e.target.style.borderColor = '#EE9116';
                            e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                          <input
                            type="radio"
                            name={`correctAnswer_${qIndex}`}
                            checked={question.correctAnswer === oIndex}
                            onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '14px', color: '#374151', fontFamily: "'Nunito', sans-serif" }}>Correta</span>
                        </label>
                        <button
                          onClick={() => {
                            const newQuestions = [...questions];
                            const options = newQuestions[qIndex].options || [];
                            const newOptions = options.filter((_, i) => i !== oIndex);
                            newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
                            // Ajustar correctAnswer se necessário
                            if (question.correctAnswer >= oIndex && question.correctAnswer > 0) {
                              newQuestions[qIndex].correctAnswer = question.correctAnswer - 1;
                            } else if (question.correctAnswer === oIndex && newOptions.length > 0) {
                              newQuestions[qIndex].correctAnswer = 0;
                            }
                            updateField('content.questions', newQuestions);
                          }}
                          style={styles.removeButton}
                          type="button"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Explicação:</label>
                <textarea
                  value={question.explanation || ''}
                  onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                  style={styles.textarea}
                  rows={2}
                  placeholder="Explicação da resposta correta"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Editor para Match Lesson
const EditableMatchLesson = ({ lesson, updateField }) => {
  const content = lesson.content || {};
  const pairs = content.pairs || [];
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const currentPair = pairs[currentPairIndex] || {};

  const updatePair = (pairIndex, field, value) => {
    const newPairs = [...pairs];
    if (!newPairs[pairIndex]) {
      newPairs[pairIndex] = { left: '', right: '' };
    }
    newPairs[pairIndex] = { ...newPairs[pairIndex], [field]: value };
    updateField('content.pairs', newPairs);
  };

  const addPair = () => {
    const newPair = {
      left: 'Item esquerdo',
      right: 'Item direito',
      explanation: '',
      educationalTip: ''
    };
    updateField('content.pairs', [...pairs, newPair]);
  };

  const updateGameConfig = (field, value) => {
    const gameConfig = content.gameConfig || {};
    updateField('content.gameConfig', { ...gameConfig, [field]: value });
  };

  const updateFeedback = (field, value) => {
    const feedback = content.feedback || {};
    const success = feedback.success || {};
    updateField('content.feedback', {
      ...feedback,
      success: { ...success, [field]: value }
    });
  };

  return (
    <div style={styles.lessonWrapper}>
      <h2 style={styles.mainTitle}>Editor: Associação (Match)</h2>

      {/* Configurações Gerais */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>⚙️ Configurações Gerais</h3>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Formato do Jogo:</label>
            <select
              value={content.gameConfig?.format || content.gameFormat || 'association'}
              onChange={(e) => {
                if (content.gameConfig) {
                  updateGameConfig('format', e.target.value);
                } else {
                  updateField('content.gameFormat', e.target.value);
                }
              }}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#EE9116';
                e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="association">Associação (Duas Colunas)</option>
              <option value="memory">Jogo da Memória</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Cenário/Descrição:</label>
            <textarea
              value={typeof content.scenario === 'object' ? content.scenario.description || '' : (content.scenario || '')}
              onChange={(e) => {
                if (typeof content.scenario === 'object') {
                  updateField('content.scenario', { ...content.scenario, description: e.target.value });
                } else {
                  updateField('content.scenario', e.target.value);
                }
              }}
              style={styles.textarea}
              rows={2}
              placeholder="Descreva o cenário ou contexto da lição"
              onFocus={(e) => {
                e.target.style.borderColor = '#EE9116';
                e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
      </div>

      {/* Pares de Associação */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🔗 Pares de Associação</h3>
          <button onClick={addPair} style={styles.addButton}>
            + Adicionar Par
          </button>
        </div>

        {/* Navegação de Pares */}
        {pairs.length > 0 && (
          <div style={styles.scenarioNav}>
            <button
              onClick={() => setCurrentPairIndex(Math.max(0, currentPairIndex - 1))}
              disabled={currentPairIndex === 0}
              style={styles.navButton}
            >
              ← Anterior
            </button>
            <span style={styles.scenarioCounter}>
              Par {currentPairIndex + 1} de {pairs.length}
            </span>
            <button
              onClick={() => setCurrentPairIndex(Math.min(pairs.length - 1, currentPairIndex + 1))}
              disabled={currentPairIndex >= pairs.length - 1}
              style={styles.navButton}
            >
              Próximo →
            </button>
          </div>
        )}

        {pairs.map((pair, pIndex) => (
          <div key={pIndex} style={styles.scenarioCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNumber}>Par {pIndex + 1}</span>
              <button
                onClick={() => {
                  const newPairs = pairs.filter((_, i) => i !== pIndex);
                  updateField('content.pairs', newPairs);
                  if (currentPairIndex >= newPairs.length) {
                    setCurrentPairIndex(Math.max(0, newPairs.length - 1));
                  }
                }}
                style={styles.removeButton}
              >
                🗑️
              </button>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Item Esquerdo (Coluna A):</label>
                <input
                  type="text"
                  value={pair.left || pair.card1?.text || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Atualizar tanto left quanto card1.text se existir
                    if (pair.card1) {
                      updatePair(pIndex, 'card1', { ...pair.card1, text: value });
                    }
                    updatePair(pIndex, 'left', value);
                  }}
                  style={styles.input}
                  placeholder="ex: Poupança"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Item Direito (Coluna B):</label>
                <input
                  type="text"
                  value={pair.right || pair.card2?.text || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Atualizar tanto right quanto card2.text se existir
                    if (pair.card2) {
                      updatePair(pIndex, 'card2', { ...pair.card2, text: value });
                    }
                    updatePair(pIndex, 'right', value);
                  }}
                  style={styles.input}
                  placeholder="ex: Guardar dinheiro para o futuro"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Explicação (Opcional):</label>
                <textarea
                  value={pair.explanation || ''}
                  onChange={(e) => updatePair(pIndex, 'explanation', e.target.value)}
                  style={styles.textarea}
                  rows={2}
                  placeholder="Explicação sobre por que esses itens se relacionam"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Dica Educacional (Opcional):</label>
                <textarea
                  value={pair.educationalTip || ''}
                  onChange={(e) => updatePair(pIndex, 'educationalTip', e.target.value)}
                  style={styles.textarea}
                  rows={2}
                  placeholder="Dica adicional para reforçar o aprendizado"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback de Sucesso */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>✅ Feedback de Sucesso</h3>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Título do Feedback:</label>
            <input
              type="text"
              value={content.feedback?.success?.title || ''}
              onChange={(e) => updateFeedback('title', e.target.value)}
              style={styles.input}
              placeholder="ex: Parabéns! Jogo Concluído!"
              onFocus={(e) => {
                e.target.style.borderColor = '#EE9116';
                e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
            <label style={styles.label}>Mensagem de Sucesso:</label>
            <textarea
              value={content.feedback?.success?.message || ''}
              onChange={(e) => updateFeedback('message', e.target.value)}
              style={styles.textarea}
              rows={2}
              placeholder="Mensagem exibida ao completar a lição"
              onFocus={(e) => {
                e.target.style.borderColor = '#EE9116';
                e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Editor para Simulation Lesson
const EditableSimulationLesson = ({ lesson, updateField }) => {
  const content = lesson.content || {};
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  
  // Detectar formato da lição
  const isProgressiveFormat = content.scenario && content.phases && Array.isArray(content.phases);
  const isProjectFormat = content.scenario && content.phases && !isProgressiveFormat;
  const phases = content.phases || [];
  const currentPhase = phases[currentPhaseIndex] || {};

  const updatePhase = (phaseIndex, field, value) => {
    // Usar o estado atualizado do lesson para garantir que temos os dados mais recentes
    const currentContent = lesson.content || {};
    const currentPhases = currentContent.phases || [];
    const newPhases = currentPhases.map((phase, idx) => {
      if (idx !== phaseIndex) return phase;
      return { ...phase, [field]: value };
    });
    updateField('content.phases', newPhases);
  };

  const updateChoice = (phaseIndex, choiceIndex, field, value, additionalFields = {}) => {
    // Usar o estado atualizado do lesson para garantir que temos os dados mais recentes
    const currentContent = lesson.content || {};
    const currentPhases = currentContent.phases || [];
    const newPhases = currentPhases.map((phase, idx) => {
      if (idx !== phaseIndex) return phase;
      
      const phaseCopy = { ...phase };
      if (!phaseCopy.choices) {
        phaseCopy.choices = [];
      }
      const newChoices = phaseCopy.choices.map((choice, cIdx) => {
        if (cIdx !== choiceIndex) return choice;
        return { ...choice, [field]: value, ...additionalFields };
      });
      phaseCopy.choices = newChoices;
      return phaseCopy;
    });
    updateField('content.phases', newPhases);
  };

  const addPhase = () => {
    // Usar o estado atualizado do lesson para garantir que temos os dados mais recentes
    const currentContent = lesson.content || {};
    const currentPhases = currentContent.phases || [];
    const newPhase = {
      title: 'Nova Fase',
      description: '',
      choices: []
    };
    updateField('content.phases', [...currentPhases, newPhase]);
  };

  const addChoice = (phaseIndex) => {
    // Usar o estado atualizado do lesson para garantir que temos os dados mais recentes
    const currentContent = lesson.content || {};
    const currentPhases = currentContent.phases || [];
    const newPhases = currentPhases.map((phase, idx) => {
      if (idx !== phaseIndex) return phase;
      const phaseCopy = { ...phase };
      if (!phaseCopy.choices) {
        phaseCopy.choices = [];
      }
      const newChoice = {
        text: 'Nova Opção',
        choice: 'Nova Opção',
        correct: true,
        feedback: 'Feedback da opção',
        outcome: 'Feedback da opção'
      };
      phaseCopy.choices = [...phaseCopy.choices, newChoice];
      return phaseCopy;
    });
    updateField('content.phases', newPhases);
  };

  const updateOption = (optionIndex, field, value, additionalFields = {}) => {
    // Usar o estado atualizado do lesson para garantir que temos os dados mais recentes
    const currentContent = lesson.content || {};
    const currentOptions = currentContent.options || [];
    const newOptions = currentOptions.map((option, idx) => {
      if (idx !== optionIndex) return option;
      return { ...option, [field]: value, ...additionalFields };
    });
    updateField('content.options', newOptions);
  };

  const addOption = () => {
    // Usar o estado atualizado do lesson para garantir que temos os dados mais recentes
    const currentContent = lesson.content || {};
    const currentOptions = currentContent.options || [];
    const newOption = {
      choice: 'Nova Opção',
      text: 'Nova Opção',
      correct: false,
      feedback: '',
      outcome: ''
    };
    updateField('content.options', [...currentOptions, newOption]);
  };

  return (
    <div style={styles.lessonWrapper}>
      <h2 style={styles.mainTitle}>Editor: Simulação</h2>

      {/* Fases (Formato Progressivo) */}
      {isProgressiveFormat && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>🎯 Fases da Simulação</h3>
            <button onClick={addPhase} style={styles.addButton}>
              + Adicionar Fase
            </button>
          </div>

          {/* Navegação de Fases */}
          {phases.length > 0 && (
            <div style={styles.scenarioNav}>
              <button
                onClick={() => setCurrentPhaseIndex(Math.max(0, currentPhaseIndex - 1))}
                disabled={currentPhaseIndex === 0}
                style={styles.navButton}
              >
                ← Anterior
              </button>
              <span style={styles.scenarioCounter}>
                Fase {currentPhaseIndex + 1} de {phases.length}
              </span>
              <button
                onClick={() => setCurrentPhaseIndex(Math.min(phases.length - 1, currentPhaseIndex + 1))}
                disabled={currentPhaseIndex >= phases.length - 1}
                style={styles.navButton}
              >
                Próximo →
              </button>
            </div>
          )}

          {phases.map((phase, pIndex) => (
            <div key={pIndex} style={styles.scenarioCard}>
              <div style={styles.cardHeader}>
                <span style={styles.cardNumber}>Fase {pIndex + 1}</span>
                <button
                  onClick={() => {
                    const newPhases = phases.filter((_, i) => i !== pIndex);
                    updateField('content.phases', newPhases);
                    if (currentPhaseIndex >= newPhases.length) {
                      setCurrentPhaseIndex(Math.max(0, newPhases.length - 1));
                    }
                  }}
                  style={styles.removeButton}
                >
                  🗑️
                </button>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Título da Fase:</label>
                  <input
                    type="text"
                    value={phase.title || ''}
                    onChange={(e) => updatePhase(pIndex, 'title', e.target.value)}
                    style={styles.input}
                    placeholder="ex: Origem do Dinheiro"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#EE9116';
                      e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                  <label style={styles.label}>Descrição da Fase:</label>
                  <textarea
                    value={phase.description || ''}
                    onChange={(e) => updatePhase(pIndex, 'description', e.target.value)}
                    style={styles.textarea}
                    rows={2}
                    placeholder="Descrição da fase"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#EE9116';
                      e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Opções/Escolhas da Fase */}
              <div style={styles.adjustmentsSection}>
                <div style={styles.sectionHeader}>
                  <h4 style={styles.subsectionTitle}>Opções de Escolha:</h4>
                  <button onClick={() => addChoice(pIndex)} style={styles.addButton}>
                    + Adicionar Opção
                  </button>
                </div>

                {(phase.choices || []).map((choice, cIndex) => (
                  <div key={cIndex} style={styles.adjustmentRow}>
                    <span style={styles.adjustmentLabel}>Opção {String.fromCharCode(65 + cIndex)}:</span>
                    <div style={styles.adjustmentInputs}>
                      <input
                        type="text"
                        value={choice.text || choice.choice || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateChoice(pIndex, cIndex, 'text', value, { choice: value });
                        }}
                        style={styles.adjustmentInput}
                        placeholder="Texto da opção"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#EE9116';
                          e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <input
                        type="text"
                        value={choice.feedback || choice.outcome || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateChoice(pIndex, cIndex, 'feedback', value, { outcome: value });
                        }}
                        style={styles.adjustmentInput}
                        placeholder="Feedback da opção"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#EE9116';
                          e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                        <input
                          type="checkbox"
                          checked={choice.correct !== undefined ? choice.correct : true}
                          onChange={(e) => updateChoice(pIndex, cIndex, 'correct', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', color: '#374151', fontFamily: "'Nunito', sans-serif" }}>Correta</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Opções Simples (Formato não progressivo) */}
      {!isProgressiveFormat && !isProjectFormat && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>🎯 Opções de Escolha</h3>
            <button onClick={addOption} style={styles.addButton}>
              + Adicionar Opção
            </button>
          </div>

          {(content.options || []).map((option, oIndex) => (
            <div key={oIndex} style={styles.categoryCard}>
              <div style={styles.cardHeader}>
                <span style={styles.cardNumber}>Opção {String.fromCharCode(65 + oIndex)}</span>
                <button
                  onClick={() => {
                    const newOptions = (content.options || []).filter((_, i) => i !== oIndex);
                    updateField('content.options', newOptions);
                  }}
                  style={styles.removeButton}
                >
                  🗑️
                </button>
              </div>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Texto da Opção:</label>
                  <input
                    type="text"
                    value={option.choice || option.text || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateOption(oIndex, 'choice', value, { text: value });
                    }}
                    style={styles.input}
                    placeholder="Texto da opção"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#EE9116';
                      e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Feedback:</label>
                  <textarea
                    value={option.feedback || option.outcome || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateOption(oIndex, 'feedback', value, { outcome: value });
                    }}
                    style={styles.textarea}
                    rows={2}
                    placeholder="Feedback ao selecionar esta opção"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#EE9116';
                      e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <input
                      type="checkbox"
                      checked={option.correct !== undefined ? option.correct : false}
                      onChange={(e) => updateOption(oIndex, 'correct', e.target.checked)}
                      style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151', fontFamily: "'Nunito', sans-serif" }}>Resposta Correta</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conclusão (se existir) */}
      {content.conclusion && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>✅ Conclusão</h3>
          <div style={styles.formGroup}>
            <label style={styles.label}>Mensagem de Conclusão:</label>
            <textarea
              value={content.conclusion.message || ''}
              onChange={(e) => updateField('content.conclusion.message', e.target.value)}
              style={styles.textarea}
              rows={3}
              placeholder="Mensagem exibida ao concluir a simulação"
              onFocus={(e) => {
                e.target.style.borderColor = '#EE9116';
                e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Editor para Drag and Drop Lesson
const EditableDragDropLesson = ({ lesson, updateField }) => {
  const content = lesson.content || {};
  const items = content.items || [];
  const zones = content.zones || content.dropZones || [];
  const categories = content.categories || [];
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentZoneIndex, setCurrentZoneIndex] = useState(0);

  // Detectar formato
  const hasZones = zones.length > 0 || content.dropZones?.length > 0;
  const hasCategories = categories.length > 0;
  const useZones = hasZones || (!hasCategories && !hasZones);
  const targetZones = useZones ? zones : categories;

  const updateItem = (itemIndex, field, value) => {
    const newItems = [...items];
    if (!newItems[itemIndex]) {
      newItems[itemIndex] = typeof items[0] === 'string' ? '' : { text: '', correctZone: '' };
    }
    if (typeof newItems[itemIndex] === 'string') {
      newItems[itemIndex] = value;
    } else {
      newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
    }
    updateField('content.items', newItems);
  };

  const addItem = () => {
    if (items.length > 0 && typeof items[0] === 'string') {
      updateField('content.items', [...items, 'Novo Item']);
    } else {
      const newItem = {
        text: 'Novo Item',
        correctZone: useZones && zones.length > 0 ? zones[0].id : (categories.length > 0 ? categories[0].id : '')
      };
      updateField('content.items', [...items, newItem]);
    }
  };

  const updateZone = (zoneIndex, field, value) => {
    const newZones = [...targetZones];
    newZones[zoneIndex] = { ...newZones[zoneIndex], [field]: value };
    updateField(useZones ? 'content.zones' : 'content.categories', newZones);
  };

  const addZone = () => {
    const newZone = {
      id: `zone-${Date.now()}`,
      name: 'Nova Zona',
      icon: '📦',
      color: '#3b82f6'
    };
    updateField(useZones ? 'content.zones' : 'content.categories', [...targetZones, newZone]);
  };

  return (
    <div style={styles.lessonWrapper}>
      <h2 style={styles.mainTitle}>Editor: Arraste e Solte</h2>

      {/* Zonas/Categorias */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📦 {useZones ? 'Zonas de Destino' : 'Categorias'}</h3>
          <button onClick={addZone} style={styles.addButton}>
            + Adicionar {useZones ? 'Zona' : 'Categoria'}
          </button>
        </div>

        {/* Navegação de Zonas */}
        {targetZones.length > 0 && (
          <div style={styles.scenarioNav}>
            <button
              onClick={() => setCurrentZoneIndex(Math.max(0, currentZoneIndex - 1))}
              disabled={currentZoneIndex === 0}
              style={styles.navButton}
            >
              ← Anterior
            </button>
            <span style={styles.scenarioCounter}>
              {useZones ? 'Zona' : 'Categoria'} {currentZoneIndex + 1} de {targetZones.length}
            </span>
            <button
              onClick={() => setCurrentZoneIndex(Math.min(targetZones.length - 1, currentZoneIndex + 1))}
              disabled={currentZoneIndex >= targetZones.length - 1}
              style={styles.navButton}
            >
              Próximo →
            </button>
          </div>
        )}

        {targetZones.map((zone, zIndex) => (
          <div key={zIndex} style={styles.scenarioCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNumber}>{useZones ? 'Zona' : 'Categoria'} {zIndex + 1}</span>
              <button
                onClick={() => {
                  const newZones = targetZones.filter((_, i) => i !== zIndex);
                  updateField(useZones ? 'content.zones' : 'content.categories', newZones);
                  if (currentZoneIndex >= newZones.length) {
                    setCurrentZoneIndex(Math.max(0, newZones.length - 1));
                  }
                }}
                style={styles.removeButton}
              >
                🗑️
              </button>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>ID (identificador único):</label>
                <input
                  type="text"
                  value={zone.id || ''}
                  onChange={(e) => updateZone(zIndex, 'id', e.target.value)}
                  style={styles.input}
                  placeholder="ex: necessidades"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nome:</label>
                <input
                  type="text"
                  value={zone.name || ''}
                  onChange={(e) => updateZone(zIndex, 'name', e.target.value)}
                  style={styles.input}
                  placeholder="ex: Necessidades"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ícone (emoji):</label>
                <input
                  type="text"
                  value={zone.icon || ''}
                  onChange={(e) => updateZone(zIndex, 'icon', e.target.value)}
                  style={styles.input}
                  placeholder="ex: 🏠"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cor (hex):</label>
                <input
                  type="text"
                  value={zone.color || '#3b82f6'}
                  onChange={(e) => updateZone(zIndex, 'color', e.target.value)}
                  style={styles.input}
                  placeholder="#3b82f6"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Itens */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📝 Itens para Arrastar</h3>
          <button onClick={addItem} style={styles.addButton}>
            + Adicionar Item
          </button>
        </div>

        {/* Navegação de Itens */}
        {items.length > 0 && (
          <div style={styles.scenarioNav}>
            <button
              onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}
              disabled={currentItemIndex === 0}
              style={styles.navButton}
            >
              ← Anterior
            </button>
            <span style={styles.scenarioCounter}>
              Item {currentItemIndex + 1} de {items.length}
            </span>
            <button
              onClick={() => setCurrentItemIndex(Math.min(items.length - 1, currentItemIndex + 1))}
              disabled={currentItemIndex >= items.length - 1}
              style={styles.navButton}
            >
              Próximo →
            </button>
          </div>
        )}

        {items.map((item, iIndex) => (
          <div key={iIndex} style={styles.scenarioCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNumber}>Item {iIndex + 1}</span>
              <button
                onClick={() => {
                  const newItems = items.filter((_, i) => i !== iIndex);
                  updateField('content.items', newItems);
                  if (currentItemIndex >= newItems.length) {
                    setCurrentItemIndex(Math.max(0, newItems.length - 1));
                  }
                }}
                style={styles.removeButton}
              >
                🗑️
              </button>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Texto do Item:</label>
                <input
                  type="text"
                  value={typeof item === 'string' ? item : (item.text || '')}
                  onChange={(e) => updateItem(iIndex, 'text', e.target.value)}
                  style={styles.input}
                  placeholder="ex: Comida"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              {typeof item !== 'string' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Zona Correta:</label>
                  <select
                    value={item.correctZone || item.correctCategory || ''}
                    onChange={(e) => {
                      const field = useZones ? 'correctZone' : 'correctCategory';
                      updateItem(iIndex, field, e.target.value);
                    }}
                    style={styles.input}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#EE9116';
                      e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="">Selecione a zona correta</option>
                    {targetZones.map((zone, zIdx) => (
                      <option key={zIdx} value={zone.id}>
                        {zone.name || zone.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Editor para Math Problems Lesson
const EditableMathProblemsLesson = ({ lesson, updateField }) => {
  const content = lesson.content || {};
  const problems = content.problems || [];
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const currentProblem = problems[currentProblemIndex] || {};

  const updateProblem = (problemIndex, field, value) => {
    const newProblems = [...problems];
    if (!newProblems[problemIndex]) {
      newProblems[problemIndex] = {
        id: problemIndex + 1,
        level: 'intermediário',
        title: `Problema ${problemIndex + 1}`,
        question: '',
        answer: 0,
        explanation: ''
      };
    }
    newProblems[problemIndex] = { ...newProblems[problemIndex], [field]: value };
    updateField('content.problems', newProblems);
  };

  const updateGivenData = (problemIndex, key, value) => {
    const newProblems = [...problems];
    if (!newProblems[problemIndex]) {
      newProblems[problemIndex] = { givenData: {} };
    }
    const givenData = newProblems[problemIndex].givenData || {};
    if (value === '' || value === null) {
      delete givenData[key];
    } else {
      givenData[key] = isNaN(value) ? value : parseFloat(value);
    }
    newProblems[problemIndex] = { ...newProblems[problemIndex], givenData };
    updateField('content.problems', newProblems);
  };

  const addGivenDataKey = (problemIndex) => {
    const newProblems = [...problems];
    if (!newProblems[problemIndex]) {
      newProblems[problemIndex] = { givenData: {} };
    }
    const givenData = newProblems[problemIndex].givenData || {};
    const newKey = `novoDado_${Date.now()}`;
    givenData[newKey] = 0;
    newProblems[problemIndex] = { ...newProblems[problemIndex], givenData };
    updateField('content.problems', newProblems);
  };

  const addProblem = () => {
    const newProblem = {
      id: problems.length + 1,
      level: 'intermediário',
      title: `Problema ${problems.length + 1}`,
      question: 'Descreva o problema...',
      answer: 0,
      explanation: 'Explicação da solução...',
      tolerance: 0.01
    };
    updateField('content.problems', [...problems, newProblem]);
  };

  const updateInstructions = (index, value) => {
    const instructions = content.instructions || [];
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    updateField('content.instructions', newInstructions);
  };

  const addInstruction = () => {
    const instructions = content.instructions || [];
    updateField('content.instructions', [...instructions, 'Nova instrução']);
  };

  return (
    <div style={styles.lessonWrapper}>
      <h2 style={styles.mainTitle}>Editor: Problemas Matemáticos</h2>

      {/* Configurações Gerais */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>⚙️ Configurações Gerais</h3>
        <div style={styles.formGrid}>
          <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
            <label style={styles.label}>Título da Lição:</label>
            <input
              type="text"
              value={content.text || ''}
              onChange={(e) => updateField('content.text', e.target.value)}
              style={styles.input}
              placeholder="ex: Problemas Matemáticos"
              onFocus={(e) => {
                e.target.style.borderColor = '#EE9116';
                e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📋 Instruções</h3>
          <button onClick={addInstruction} style={styles.addButton}>
            + Adicionar Instrução
          </button>
        </div>

        {(content.instructions || []).map((instruction, iIndex) => (
          <div key={iIndex} style={styles.categoryCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNumber}>Instrução {iIndex + 1}</span>
              <button
                onClick={() => {
                  const newInstructions = (content.instructions || []).filter((_, i) => i !== iIndex);
                  updateField('content.instructions', newInstructions);
                }}
                style={styles.removeButton}
              >
                🗑️
              </button>
            </div>
            <div style={styles.formGroup}>
              <input
                type="text"
                value={instruction || ''}
                onChange={(e) => updateInstructions(iIndex, e.target.value)}
                style={styles.input}
                placeholder="ex: Resolva os problemas passo a passo"
                onFocus={(e) => {
                  e.target.style.borderColor = '#EE9116';
                  e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Problemas */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🧮 Problemas</h3>
          <button onClick={addProblem} style={styles.addButton}>
            + Adicionar Problema
          </button>
        </div>

        {/* Navegação de Problemas */}
        {problems.length > 0 && (
          <div style={styles.scenarioNav}>
            <button
              onClick={() => setCurrentProblemIndex(Math.max(0, currentProblemIndex - 1))}
              disabled={currentProblemIndex === 0}
              style={styles.navButton}
            >
              ← Anterior
            </button>
            <span style={styles.scenarioCounter}>
              Problema {currentProblemIndex + 1} de {problems.length}
            </span>
            <button
              onClick={() => setCurrentProblemIndex(Math.min(problems.length - 1, currentProblemIndex + 1))}
              disabled={currentProblemIndex >= problems.length - 1}
              style={styles.navButton}
            >
              Próximo →
            </button>
          </div>
        )}

        {problems.map((problem, pIndex) => (
          <div key={pIndex} style={styles.scenarioCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNumber}>Problema {pIndex + 1}</span>
              <button
                onClick={() => {
                  const newProblems = problems.filter((_, i) => i !== pIndex);
                  updateField('content.problems', newProblems);
                  if (currentProblemIndex >= newProblems.length) {
                    setCurrentProblemIndex(Math.max(0, newProblems.length - 1));
                  }
                }}
                style={styles.removeButton}
              >
                🗑️
              </button>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>ID:</label>
                <input
                  type="number"
                  value={problem.id || pIndex + 1}
                  onChange={(e) => updateProblem(pIndex, 'id', parseInt(e.target.value) || pIndex + 1)}
                  style={styles.input}
                  placeholder="1"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nível:</label>
                <select
                  value={problem.level || 'intermediário'}
                  onChange={(e) => updateProblem(pIndex, 'level', e.target.value)}
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="básico">Básico</option>
                  <option value="intermediário">Intermediário</option>
                  <option value="avançado">Avançado</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Título:</label>
                <input
                  type="text"
                  value={problem.title || ''}
                  onChange={(e) => updateProblem(pIndex, 'title', e.target.value)}
                  style={styles.input}
                  placeholder="ex: Cálculo de Juros"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Contexto/Situação (Opcional):</label>
                <textarea
                  value={problem.context || ''}
                  onChange={(e) => updateProblem(pIndex, 'context', e.target.value)}
                  style={styles.textarea}
                  rows={2}
                  placeholder="Descreva o contexto ou situação do problema"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Pergunta/Problema:</label>
                <textarea
                  value={problem.question || problem.problem || problem.description || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateProblem(pIndex, 'question', value);
                    updateProblem(pIndex, 'problem', value);
                    updateProblem(pIndex, 'description', value);
                  }}
                  style={styles.textarea}
                  rows={3}
                  placeholder="Descreva o problema matemático..."
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Dados Fornecidos */}
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <div style={styles.sectionHeader}>
                  <label style={styles.label}>Dados Fornecidos (Opcional):</label>
                  <button
                    onClick={() => addGivenDataKey(pIndex)}
                    style={styles.addButton}
                    type="button"
                  >
                    + Adicionar Dado
                  </button>
                </div>
                <div style={styles.adjustmentsSection}>
                  {Object.entries(problem.givenData || {}).map(([key, value], dIndex) => (
                    <div key={dIndex} style={styles.adjustmentRow}>
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const oldKey = key;
                          const newKey = e.target.value;
                          const givenData = { ...(problem.givenData || {}) };
                          givenData[newKey] = givenData[oldKey];
                          delete givenData[oldKey];
                          updateProblem(pIndex, 'givenData', givenData);
                        }}
                        style={styles.adjustmentInput}
                        placeholder="Nome do dado (ex: preco)"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#EE9116';
                          e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => updateGivenData(pIndex, key, e.target.value)}
                        style={styles.adjustmentInput}
                        placeholder="Valor"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#EE9116';
                          e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        onClick={() => updateGivenData(pIndex, key, null)}
                        style={styles.removeButton}
                        type="button"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Fórmula (Opcional):</label>
                <input
                  type="text"
                  value={problem.formula || ''}
                  onChange={(e) => updateProblem(pIndex, 'formula', e.target.value)}
                  style={styles.input}
                  placeholder="ex: J = C * i * t"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Dica (Opcional):</label>
                <input
                  type="text"
                  value={problem.hint || ''}
                  onChange={(e) => updateProblem(pIndex, 'hint', e.target.value)}
                  style={styles.input}
                  placeholder="Dica para ajudar o aluno"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Resposta Correta:</label>
                <input
                  type="number"
                  step="0.01"
                  value={problem.answer || problem.correctAnswer || problem.solution || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    updateProblem(pIndex, 'answer', value);
                    updateProblem(pIndex, 'correctAnswer', value);
                    updateProblem(pIndex, 'solution', value);
                  }}
                  style={styles.input}
                  placeholder="0"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tolerância:</label>
                <input
                  type="number"
                  step="0.01"
                  value={problem.tolerance || 0.01}
                  onChange={(e) => updateProblem(pIndex, 'tolerance', parseFloat(e.target.value) || 0.01)}
                  style={styles.input}
                  placeholder="0.01"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Explicação:</label>
                <textarea
                  value={problem.explanation || problem.feedback || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateProblem(pIndex, 'explanation', value);
                    updateProblem(pIndex, 'feedback', value);
                  }}
                  style={styles.textarea}
                  rows={3}
                  placeholder="Explicação da solução do problema"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Editor para Budget Distribution
const EditableBudgetDistributionLesson = ({ lesson, updateField }) => {
  const content = lesson.content || {};
  const categories = content.categories || [];
  const scenarios = content.scenarios || [];

  const updateCategory = (index, field, value) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    updateField('content.categories', newCategories);
    
    // Se mudou o ID, atualizar adjustments em todos os cenários
    if (field === 'id') {
      const oldId = categories[index].id;
      const newId = value;
      const newScenarios = scenarios.map(scenario => {
        if (scenario.adjustments && scenario.adjustments[oldId]) {
          const newAdjustments = { ...scenario.adjustments };
          newAdjustments[newId] = newAdjustments[oldId];
          delete newAdjustments[oldId];
          return { ...scenario, adjustments: newAdjustments };
        }
        return scenario;
      });
      updateField('content.scenarios', newScenarios);
    }
  };

  const updateScenario = (scenarioIndex, field, value) => {
    const newScenarios = [...scenarios];
    newScenarios[scenarioIndex] = { ...newScenarios[scenarioIndex], [field]: value };
    updateField('content.scenarios', newScenarios);
  };

  const updateAdjustment = (scenarioIndex, categoryId, field, value) => {
    const newScenarios = [...scenarios];
    if (!newScenarios[scenarioIndex].adjustments) {
      newScenarios[scenarioIndex].adjustments = {};
    }
    if (!newScenarios[scenarioIndex].adjustments[categoryId]) {
      newScenarios[scenarioIndex].adjustments[categoryId] = {};
    }
    newScenarios[scenarioIndex].adjustments[categoryId] = {
      ...newScenarios[scenarioIndex].adjustments[categoryId],
      [field]: field === 'multiplier' ? parseFloat(value) || 0 : value
    };
    updateField('content.scenarios', newScenarios);
  };

  const addCategory = () => {
    const newCategory = {
      id: `categoria-${Date.now()}`,
      name: 'Nova Categoria',
      description: '',
      icon: '📦',
      priority: 'medium',
      group: 'Necessidades'
    };
    updateField('content.categories', [...categories, newCategory]);
  };

  const addScenario = () => {
    const newScenario = {
      id: `scenario-${Date.now()}`,
      title: 'Novo Cenário',
      description: '',
      totalBudget: 5000,
      classLevel: 'media',
      adjustments: {}
    };
    updateField('content.scenarios', [...scenarios, newScenario]);
  };

  return (
    <div style={styles.lessonWrapper}>
      <h2 style={styles.mainTitle}>Editor: Distribuição de Orçamento</h2>
      
      {/* Categorias */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📋 Categorias</h3>
          <button onClick={addCategory} style={styles.addButton}>
            + Adicionar Categoria
          </button>
        </div>
        
        {categories.map((category, index) => (
          <div key={index} style={styles.categoryCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNumber}>Categoria {index + 1}</span>
              <button
                onClick={() => {
                  const newCategories = categories.filter((_, i) => i !== index);
                  updateField('content.categories', newCategories);
                }}
                style={styles.removeButton}
              >
                🗑️
              </button>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>ID (chave):</label>
                <input
                  type="text"
                  value={category.id || ''}
                  onChange={(e) => updateCategory(index, 'id', e.target.value)}
                  style={styles.input}
                  placeholder="ex: alimentacao"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nome (título):</label>
                <input
                  type="text"
                  value={category.name || ''}
                  onChange={(e) => updateCategory(index, 'name', e.target.value)}
                  style={styles.input}
                  placeholder="ex: Alimentação"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Descrição:</label>
                <textarea
                  value={category.description || ''}
                  onChange={(e) => updateCategory(index, 'description', e.target.value)}
                  style={styles.textarea}
                  rows={2}
                  placeholder="Descrição da categoria"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ícone:</label>
                <input
                  type="text"
                  value={category.icon || ''}
                  onChange={(e) => updateCategory(index, 'icon', e.target.value)}
                  style={styles.input}
                  placeholder="ex: 🍎"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cenários */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🎯 Cenários</h3>
          <button onClick={addScenario} style={styles.addButton}>
            + Adicionar Cenário
          </button>
        </div>

        {scenarios.map((scenario, sIndex) => (
          <div key={sIndex} style={styles.scenarioCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNumber}>Cenário {sIndex + 1}</span>
              <button
                onClick={() => {
                  const newScenarios = scenarios.filter((_, i) => i !== sIndex);
                  updateField('content.scenarios', newScenarios);
                }}
                style={styles.removeButton}
              >
                🗑️
              </button>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Título:</label>
                <input
                  type="text"
                  value={scenario.title || ''}
                  onChange={(e) => updateScenario(sIndex, 'title', e.target.value)}
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Descrição:</label>
                <input
                  type="text"
                  value={scenario.description || ''}
                  onChange={(e) => updateScenario(sIndex, 'description', e.target.value)}
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Orçamento Total (R$):</label>
                <input
                  type="number"
                  value={scenario.totalBudget || 0}
                  onChange={(e) => updateScenario(sIndex, 'totalBudget', parseInt(e.target.value) || 0)}
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EE9116';
                    e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Adjustments do Cenário */}
            <div style={styles.adjustmentsSection}>
              <h4 style={styles.subsectionTitle}>Ajustes por Categoria:</h4>
              {categories.map((category, cIndex) => {
                const adjustment = scenario.adjustments?.[category.id] || {};
                return (
                  <div key={cIndex} style={styles.adjustmentRow}>
                    <span style={styles.adjustmentLabel}>{category.name || category.id}:</span>
                    <div style={styles.adjustmentInputs}>
                      <input
                        type="number"
                        step="0.1"
                        value={adjustment.multiplier || ''}
                        onChange={(e) => updateAdjustment(sIndex, category.id, 'multiplier', e.target.value)}
                        style={styles.adjustmentInput}
                        placeholder="Multiplicador (ex: 0.6)"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#EE9116';
                          e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <input
                        type="text"
                        value={adjustment.reason || ''}
                        onChange={(e) => updateAdjustment(sIndex, category.id, 'reason', e.target.value)}
                        style={styles.adjustmentInput}
                        placeholder="Motivo (ex: Alimentação básica)"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#EE9116';
                          e.target.style.boxShadow = '0 0 0 3px rgba(238, 145, 22, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EditableGenericLesson = ({ lesson, updateField }) => {
  return (
    <div style={styles.lessonWrapper}>
      <h2 style={styles.mainTitle}>Editor Genérico</h2>
      <p style={styles.helpText}>Edite o conteúdo completo em JSON:</p>
      <textarea
        value={JSON.stringify(lesson.content || {}, null, 2)}
        onChange={(e) => {
          try {
            updateField('content', JSON.parse(e.target.value));
          } catch (err) {}
        }}
        style={styles.jsonEditor}
        rows={20}
      />
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: '#f0f4f8'
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
  },
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #EE9116 0%, #FFB300 100%)',
    color: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    fontFamily: "'Nunito', sans-serif",
    margin: 0
  },
  badge: {
    background: 'rgba(255,255,255,0.2)',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  headerActions: {
    display: 'flex',
    gap: '12px'
  },
  cancelButton: {
    padding: '10px 20px',
    background: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600'
  },
  saveButton: {
    padding: '10px 20px',
    background: 'white',
    color: '#EE9116',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600'
  },
  lessonContainer: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    boxSizing: 'border-box'
  },
  lessonWrapper: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px 40px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    maxWidth: '100%',
    boxSizing: 'border-box'
  },
  lessonHeader: {
    marginBottom: '24px',
    textAlign: 'center'
  },
  mainTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '12px',
    fontFamily: "'Nunito', sans-serif"
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '12px',
    fontFamily: "'Nunito', sans-serif",
    lineHeight: '1.6'
  },
  instruction: {
    fontSize: '14px',
    color: '#9ca3af',
    fontFamily: "'Nunito', sans-serif"
  },
  scenarioNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px'
  },
  navButton: {
    padding: '8px 16px',
    background: '#EE9116',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600'
  },
  scenarioCounter: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: "'Nunito', sans-serif"
  },
  scenarioSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  scenarioHeader: {
    marginBottom: '12px'
  },
  scenarioTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: "'Nunito', sans-serif"
  },
  situationBox: {
    background: '#dbeafe',
    border: '2px solid #93c5fd',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px'
  },
  situationLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: '8px',
    fontFamily: "'Nunito', sans-serif"
  },
  situationText: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
    fontFamily: "'Nunito', sans-serif",
    width: '100%',
    minHeight: '60px'
  },
  calculationBox: {
    background: '#faf5ff',
    border: '2px solid #d8b4fe',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px'
  },
  calculationLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: '8px',
    fontFamily: "'Nunito', sans-serif"
  },
  calculationText: {
    fontSize: '14px',
    color: '#374151',
    fontFamily: "'Nunito', sans-serif",
    width: '100%'
  },
  answerBox: {
    marginBottom: '16px'
  },
  answerLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '8px',
    display: 'block',
    fontFamily: "'Nunito', sans-serif"
  },
  answerInput: {
    width: '100%',
    padding: '12px',
    border: '2px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: "'Nunito', sans-serif"
  },
  explanationBox: {
    marginBottom: '16px'
  },
  explanationLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '8px',
    display: 'block',
    fontFamily: "'Nunito', sans-serif"
  },
  explanationText: {
    width: '100%',
    padding: '12px',
    border: '2px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    minHeight: '80px',
    resize: 'vertical'
  },
  userInputSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  userInputTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: "'Nunito', sans-serif"
  },
  categoriesSection: {
    background: '#f9fafb',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e5e5e5'
  },
  inputFieldsSection: {
    background: '#f9fafb',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e5e5e5'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
    fontFamily: "'Nunito', sans-serif",
    letterSpacing: '0.2px'
  },
  section: {
    background: '#f9fafb',
    padding: '28px 32px',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    marginBottom: '24px'
  },
  categoryCard: {
    background: 'white',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '12px',
    border: '1px solid #e5e5e5',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start'
  },
  categoryInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif"
  },
  iconInput: {
    width: '60px',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif"
  },
  categoryDescription: {
    flex: 2,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    minHeight: '60px',
    resize: 'vertical'
  },
  inputFieldCard: {
    background: 'white',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '12px',
    border: '1px solid #e5e5e5',
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  fieldLabel: {
    flex: 2,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif"
  },
  fieldType: {
    width: '120px',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif"
  },
  fieldPlaceholder: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif"
  },
  addButton: {
    padding: '10px 20px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: "'Nunito', sans-serif",
    marginTop: '8px'
  },
  removeButton: {
    padding: '8px 12px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  progressIndicator: {
    textAlign: 'center',
    marginTop: '24px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#6b7280',
    fontFamily: "'Nunito', sans-serif"
  },
  editableText: {
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background 0.2s',
    border: '2px dashed transparent',
    position: 'relative'
  },
  editableInput: {
    padding: '8px 12px',
    border: '2px solid #EE9116',
    borderRadius: '6px',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    width: '100%'
  },
  editableTextarea: {
    padding: '8px 12px',
    border: '2px solid #EE9116',
    borderRadius: '6px',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    width: '100%',
    minHeight: '60px',
    resize: 'vertical'
  },
  jsonEditor: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: "'Courier New', monospace",
    resize: 'vertical',
    background: '#f9fafb',
    width: '100%'
  },
  helpText: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
    fontFamily: "'Nunito', sans-serif"
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '2px solid #e5e5e5'
  },
  categoryCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  scenarioCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    marginBottom: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '2px solid #f3f4f6'
  },
  cardNumber: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#374151',
    fontFamily: "'Nunito', sans-serif",
    letterSpacing: '0.3px'
  },
  adjustmentsSection: {
    marginTop: '24px',
    padding: '20px',
    background: '#f9fafb',
    borderRadius: '10px',
    border: '1px solid #e5e5e5'
  },
  subsectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '16px',
    fontFamily: "'Nunito', sans-serif",
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e5e5'
  },
  adjustmentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '14px',
    padding: '14px 16px',
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
    transition: 'all 0.2s',
    flexWrap: 'wrap',
    boxSizing: 'border-box'
  },
  adjustmentLabel: {
    minWidth: '180px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    fontFamily: "'Nunito', sans-serif",
    textAlign: 'left',
    flexShrink: 0
  },
  adjustmentInputs: {
    display: 'flex',
    gap: '12px',
    flex: 1,
    alignItems: 'center',
    flexWrap: 'wrap',
    minWidth: 0
  },
  adjustmentInput: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    transition: 'all 0.2s',
    minWidth: '0',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    maxWidth: '100%'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    width: '100%',
    marginTop: '8px',
    boxSizing: 'border-box'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    fontFamily: "'Nunito', sans-serif",
    marginBottom: '4px',
    display: 'block',
    lineHeight: '1.5'
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    outline: 'none',
    backgroundColor: '#ffffff',
    lineHeight: '1.5',
    color: '#1f2937',
    maxWidth: '100%'
  },
  textarea: {
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    resize: 'vertical',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '80px',
    transition: 'all 0.2s ease',
    outline: 'none',
    lineHeight: '1.5',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    maxWidth: '100%'
  }
};

export default LessonEditor;
