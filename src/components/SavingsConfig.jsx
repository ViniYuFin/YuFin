import React, { useState, useEffect } from 'react';
import { apiGet, apiPatch } from '../utils/apiService';
import notificationService from '../utils/notificationService';

const SavingsConfig = ({ user, setUser, setActiveScreen }) => {
  console.log('SavingsConfig - Carregando configurações:', {
    userSavingsConfig: user.savingsConfig,
    userSavingsConfigString: JSON.stringify(user.savingsConfig)
  });
  
  const [config, setConfig] = useState({
    perLesson: user.savingsConfig?.perLesson || 0.5,
    perStreak: user.savingsConfig?.perStreak || 2.0,
    perPerfectLesson: user.savingsConfig?.perPerfectLesson || 1.0,
    perLevelUp: user.savingsConfig?.perLevelUp || 5.0,
    perAchievement: user.savingsConfig?.perAchievement || 3.0,
    autoTransfer: user.savingsConfig?.autoTransfer || false,
    monthlyLimit: user.savingsConfig?.monthlyLimit || 100,
    weeklyGoal: user.savingsConfig?.weeklyGoal || 20
  });

  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Carregar alunos vinculados do backend
    apiGet('/users')
      .then(users => {
        const students = user.linkedStudents
          ? users.filter((u) => user.linkedStudents.includes(u.id) && u.role === 'student')
          : [];
        setLinkedStudents(students);
      });
    
    // Carregar preferência do modo escuro
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);

    // Listener para mudanças no modo escuro
    const handleDarkModeChange = () => {
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      setDarkMode(savedDarkMode);
    };

    window.addEventListener('darkModeChanged', handleDarkModeChange);
    
    return () => {
      window.removeEventListener('darkModeChanged', handleDarkModeChange);
    };
  }, [user.linkedStudents]);

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      console.log('Frontend - Salvando configurações:', { 
        userId: user.id, 
        config: config,
        configString: JSON.stringify(config, null, 2)
      });
      
      const updatedUser = await apiPatch(`/users/${user.id}`, { savingsConfig: config });
      
      console.log('Frontend - Configurações salvas:', { 
        updatedUser: updatedUser,
        savingsConfig: updatedUser.savingsConfig,
        savingsConfigString: JSON.stringify(updatedUser.savingsConfig)
      });
      
      setUser(updatedUser);
      notificationService.success('Configurações de poupança salvas com sucesso!');
    } catch (err) {
      console.error('Frontend - Erro ao salvar:', err);
      notificationService.error('Erro ao salvar configurações: ' + err.message);
    }
  };

  const calculateMonthlyProjection = (student) => {
    if (!student) return 0;
    
    const lessonsPerWeek = 5; // Estimativa
    const weeksPerMonth = 4;
    const perfectRate = 0.3; // 30% de lições perfeitas
    const levelUpsPerMonth = 2; // Estimativa
    const achievementsPerMonth = 1; // Estimativa
    
    const monthlyLessons = lessonsPerWeek * weeksPerMonth;
    const monthlyPerfectLessons = monthlyLessons * perfectRate;
    const monthlyStreak = 7; // Streak médio
    
    const projection = 
      (monthlyLessons * config.perLesson) +
      (monthlyStreak * config.perStreak) +
      (monthlyPerfectLessons * config.perPerfectLesson) +
      (levelUpsPerMonth * config.perLevelUp) +
      (achievementsPerMonth * config.perAchievement);
    
    return Math.min(projection, config.monthlyLimit);
  };

  const getStudentStats = (student) => {
    const currentSavings = student.savings?.balance || 0;
    const completedLessons = student.progress?.completedLessons?.length || 0;
    const streak = student.progress?.streak || 0;
    const level = student.progress?.level || 1;
    const perfectLessons = student.progress?.perfectLessons?.length || 0;
    
    return {
      currentSavings,
      completedLessons,
      streak,
      level,
      perfectLessons,
      monthlyProjection: calculateMonthlyProjection(student)
    };
  };

  return (
    <div className="min-h-screen bg-interface p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div 
          className="rounded-xl shadow-lg p-6 mb-6 border-2" 
          style={{ 
            backgroundColor: darkMode ? '#374151' : '#ffffff',
            borderColor: 'rgb(238, 145, 22)' 
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <button
                onClick={() => setActiveScreen('parent-dashboard')}
                className="text-primary hover:text-primary-dark mb-2 flex items-center"
              >
                ← Voltar ao Dashboard
              </button>
              <h1 
                className="text-3xl font-yufin"
                style={{ color: darkMode ? '#ffffff' : 'rgb(238, 145, 22)' }}
              >
                💰 Configurar Poupança Educativa
              </h1>
            </div>
          </div>
          <p 
            style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
          >
            Configure as regras de poupança para incentivar o aprendizado dos seus filhos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configurações */}
          <div className="space-y-6">
            {/* Recompensas por Atividade */}
            <div 
              className="rounded-xl shadow-lg p-6 border-2" 
              style={{ 
                backgroundColor: darkMode ? '#374151' : '#ffffff',
                borderColor: 'rgb(238, 145, 22)' 
              }}
            >
              <h2 
                className="text-xl font-bold mb-4"
                style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
              >
                🎯 Recompensas por Atividade
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label 
                    className="block font-semibold mb-2"
                    style={{ color: darkMode ? '#ffffff' : '#374151' }}
                  >
                    Por Lição Concluída (R$)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={config.perLesson}
                    onChange={(e) => handleConfigChange('perLesson', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    style={{
                      backgroundColor: darkMode ? '#4b5563' : '#ffffff',
                      borderColor: darkMode ? '#6b7280' : '#d1d5db',
                      color: darkMode ? '#ffffff' : '#1f2937'
                    }}
                    placeholder="0.50"
                  />
                  <p 
                    className="text-sm mt-1"
                    style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
                  >
                    Valor depositado automaticamente quando seu filho completa uma lição
                  </p>
                </div>

                <div>
                  <label 
                    className="block font-semibold mb-2"
                    style={{ color: darkMode ? '#ffffff' : '#374151' }}
                  >
                    Por Ofensiva Diária (R$)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={config.perStreak}
                    onChange={(e) => handleConfigChange('perStreak', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    style={{
                      backgroundColor: darkMode ? '#4b5563' : '#ffffff',
                      borderColor: darkMode ? '#6b7280' : '#d1d5db',
                      color: darkMode ? '#ffffff' : '#1f2937'
                    }}
                    placeholder="2.00"
                  />
                  <p 
                    className="text-sm mt-1"
                    style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
                  >Bônus por manter consistência diária</p>
                </div>

                <div>
                  <label 
                    className="block font-semibold mb-2"
                    style={{ color: darkMode ? '#ffffff' : '#374151' }}
                  >
                    Por Lição Perfeita (R$)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={config.perPerfectLesson}
                    onChange={(e) => handleConfigChange('perPerfectLesson', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    style={{
                      backgroundColor: darkMode ? '#4b5563' : '#ffffff',
                      borderColor: darkMode ? '#6b7280' : '#d1d5db',
                      color: darkMode ? '#ffffff' : '#1f2937'
                    }}
                    placeholder="1.00"
                  />
                  <p 
                    className="text-sm mt-1"
                    style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
                  >Bônus extra por pontuação perfeita (100%)</p>
                </div>

                <div>
                  <label 
                    className="block font-semibold mb-2"
                    style={{ color: darkMode ? '#ffffff' : '#374151' }}
                  >
                    Por Subida de Nível (R$)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={config.perLevelUp}
                    onChange={(e) => handleConfigChange('perLevelUp', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    style={{
                      backgroundColor: darkMode ? '#4b5563' : '#ffffff',
                      borderColor: darkMode ? '#6b7280' : '#d1d5db',
                      color: darkMode ? '#ffffff' : '#1f2937'
                    }}
                    placeholder="5.00"
                  />
                  <p 
                    className="text-sm mt-1"
                    style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
                  >Recompensa especial por evolução no aprendizado</p>
                </div>

                <div>
                  <label 
                    className="block font-semibold mb-2"
                    style={{ color: darkMode ? '#ffffff' : '#374151' }}
                  >
                    Por Conquista (R$)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={config.perAchievement}
                    onChange={(e) => handleConfigChange('perAchievement', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    style={{
                      backgroundColor: darkMode ? '#4b5563' : '#ffffff',
                      borderColor: darkMode ? '#6b7280' : '#d1d5db',
                      color: darkMode ? '#ffffff' : '#1f2937'
                    }}
                    placeholder="3.00"
                  />
                  <p 
                    className="text-sm mt-1"
                    style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
                  >Bônus por desbloquear conquistas especiais</p>
                </div>
              </div>
            </div>
            {/* Botão Salvar */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
              <button
                onClick={handleSave}
                className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition"
              >
                💾 Salvar Configurações
              </button>
            </div>
          </div>

          {/* Preview e Estatísticas */}
          <div className="space-y-6">
            {/* Seleção de Filho */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
              <h2 className="text-xl font-bold text-gray-800 mb-4">👶 Selecione um Filho</h2>
              {linkedStudents.length === 0 ? (
                <p className="text-gray-600 text-center py-4">Nenhum filho vinculado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {linkedStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`w-full p-3 rounded-lg border-2 transition ${
                        selectedStudent?.id === student.id
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-300 hover:border-primary'
                      }`}
                    >
                      <div className="text-left">
                        <div className="font-semibold">{student.name}</div>
                        <div className="text-sm opacity-80">
                          Nível {student.progress?.level || 1} • R$ {(student.savings?.balance || 0).toFixed(2)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Estatísticas do Filho Selecionado */}
            {selectedStudent && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
                <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Estatísticas de {selectedStudent.name}</h2>
                {(() => {
                  const stats = getStudentStats(selectedStudent);
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">R$ {stats.currentSavings.toFixed(2)}</div>
                          <div className="text-sm text-gray-600">Poupança Atual</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{stats.completedLessons}</div>
                          <div className="text-sm text-gray-600">Lições Concluídas</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{stats.streak} 🔥</div>
                          <div className="text-sm text-gray-600">Ofensiva Atual</div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{stats.perfectLessons}</div>
                          <div className="text-sm text-gray-600">Lições Perfeitas</div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4 rounded-lg">
                        <div className="text-2xl font-bold">R$ {stats.monthlyProjection.toFixed(2)}</div>
                        <div className="text-sm opacity-90">Projeção Mensal com Configuração Atual</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Dicas e Recomendações */}
            <div 
              className="rounded-xl shadow-lg p-6 border-2" 
              style={{ 
                borderColor: 'rgb(238, 145, 22)',
                backgroundColor: darkMode ? '#374151' : '#ffffff'
              }}
            >
              <h2 
                className="text-xl font-bold mb-4"
                style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
              >
                💡 Dicas e Recomendações
              </h2>
              <div className="space-y-3">
                <div 
                  className="border-l-4 p-3"
                  style={darkMode 
                    ? { backgroundColor: '#451a03', borderLeftColor: '#fbbf24' }
                    : { backgroundColor: '#fefce8', borderLeftColor: '#facc15' }
                  }
                >
                  <p 
                    className="text-sm"
                    style={darkMode ? { color: '#fbbf24' } : { color: '#854d0e' }}
                  >
                    <strong>Comece pequeno:</strong> R$ 0,50 por lição é um bom ponto de partida
                  </p>
                </div>
                <div 
                  className="border-l-4 p-3"
                  style={darkMode 
                    ? { backgroundColor: '#1e3a8a', borderLeftColor: '#60a5fa' }
                    : { backgroundColor: '#eff6ff', borderLeftColor: '#60a5fa' }
                  }
                >
                  <p 
                    className="text-sm"
                    style={darkMode ? { color: '#93c5fd' } : { color: '#1e40af' }}
                  >
                    <strong>Incentive consistência:</strong> Bônus por ofensiva motiva hábitos diários
                  </p>
                </div>
                <div 
                  className="border-l-4 p-3"
                  style={darkMode 
                    ? { backgroundColor: '#14532d', borderLeftColor: '#4ade80' }
                    : { backgroundColor: '#f0fdf4', borderLeftColor: '#4ade80' }
                  }
                >
                  <p 
                    className="text-sm"
                    style={darkMode ? { color: '#86efac' } : { color: '#166534' }}
                  >
                    <strong>Recompense qualidade:</strong> Bônus por lições perfeitas incentiva esforço
                  </p>
                </div>
                <div 
                  className="border-l-4 p-3"
                  style={darkMode 
                    ? { backgroundColor: '#581c87', borderLeftColor: '#a78bfa' }
                    : { backgroundColor: '#faf5ff', borderLeftColor: '#a78bfa' }
                  }
                >
                  <p 
                    className="text-sm"
                    style={darkMode ? { color: '#c084fc' } : { color: '#6b21a8' }}
                  >
                    <strong>Defina limites:</strong> Evite gastos excessivos com limite mensal
                  </p>
                </div>
              </div>
            </div>

            {/* Configurações Avançadas - MOVIDO PARA BAIXO */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
              <h2 className="text-xl font-bold text-gray-800 mb-4">⚙️ Configurações Avançadas</h2>
              
              <div className="space-y-4">
                <div>
                  <label 
                    className="block font-semibold mb-2"
                    style={{ color: darkMode ? '#ffffff' : '#374151' }}
                  >
                    Limite Mensal (R$)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={config.monthlyLimit}
                    onChange={(e) => handleConfigChange('monthlyLimit', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    style={{
                      backgroundColor: darkMode ? '#4b5563' : '#ffffff',
                      borderColor: darkMode ? '#6b7280' : '#d1d5db',
                      color: darkMode ? '#ffffff' : '#1f2937'
                    }}
                    placeholder="100"
                  />
                  <p 
                    className="text-sm mt-1"
                    style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
                  >Limite máximo de depósitos por mês</p>
                </div>

                <div>
                  <label 
                    className="block font-semibold mb-2"
                    style={{ color: darkMode ? '#ffffff' : '#374151' }}
                  >
                    Meta Semanal (R$)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={config.weeklyGoal}
                    onChange={(e) => handleConfigChange('weeklyGoal', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    style={{
                      backgroundColor: darkMode ? '#4b5563' : '#ffffff',
                      borderColor: darkMode ? '#6b7280' : '#d1d5db',
                      color: darkMode ? '#ffffff' : '#1f2937'
                    }}
                    placeholder="20"
                  />
                  <p 
                    className="text-sm mt-1"
                    style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
                  >Meta de poupança semanal para incentivar consistência</p>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="autoTransfer"
                    checked={config.autoTransfer}
                    onChange={(e) => handleConfigChange('autoTransfer', e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="autoTransfer" className="font-semibold text-gray-700">
                    Transferência Automática
                  </label>
                </div>
                <p className="text-sm text-gray-600 ml-7">Transferir automaticamente para conta bancária quando atingir meta</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsConfig;