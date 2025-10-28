import React, { useState, useEffect } from 'react';
// import { users as mockUsersData } from '../utils/users';
import { lessons } from '../utils/lessons';
import InteractiveTour from './InteractiveTour';
import { parentTourSteps, shouldShowTour, markTourCompleted, handleMobileTourSkip, isMobileDevice } from '../utils/tourConfigs';
import { apiPatch, apiGet, apiPost } from '../utils/apiService';
import ParentTokenManager from './ParentTokenManager';
import notificationService from '../utils/notificationService';

const ParentDashboard = ({ user, setActiveScreen, setUser }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showLinkChildModal, setShowLinkChildModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allStudents, setAllStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, tokens
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Verificar se deve mostrar o tour (desabilitado em mobile)
    if (shouldShowTour('parent')) {
      setShowTour(true);
    } else {
      // Se for mobile, marcar como completado automaticamente
      handleMobileTourSkip('parent');
    }
    
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
  }, []);

  // Buscar todos os alunos do backend ao abrir o modal
  useEffect(() => {
    if (showLinkChildModal) {
      setLoadingStudents(true);
      apiGet('/users')
        .then(users => {
          setAllStudents(users.filter(u => u.role === 'student'));
          setLoadingStudents(false);
        })
        .catch(() => setLoadingStudents(false));
    }
  }, [showLinkChildModal]);

  useEffect(() => {
    apiGet('/users')
      .then(users => {
        setAllUsers(users);
        setLoadingUsers(false);
      })
      .catch(() => setLoadingUsers(false));
  }, []);



  // Filtrar alunos disponíveis para vincular
  // Permitir busca por ID de jogador para alunos desvinculados (com ou sem schoolId)
  const availableStudents = allStudents.filter(
    (u) => u.id && 
      !(user.linkedStudents || []).includes(u.id.toString()) &&
      !u.parentId && // Não mostrar alunos já vinculados a outros responsáveis
      u.playerId && // SÓ alunos que têm playerId
      u.playerId.toLowerCase().includes(searchTerm.toLowerCase()) // SÓ busca por playerId
  );
  
  // Debug: Log dos alunos disponíveis para vínculo
  console.log('Debug - Alunos disponíveis para vínculo:', {
    searchTerm,
    allStudentsCount: allStudents.length,
    availableStudentsCount: availableStudents.length,
    allStudents: allStudents.map(s => ({ 
      id: s.id, 
      name: s.name, 
      email: s.email, 
      playerId: s.playerId,
      schoolId: s.schoolId 
    })),
    availableStudents: availableStudents.map(s => ({ 
      id: s.id, 
      name: s.name, 
      email: s.email,
      playerId: s.playerId,
      schoolId: s.schoolId
    }))
  });
  const firstAvailableStudent = availableStudents[0] || null;

  // Função para finalizar o tour
  const handleFinishTour = () => {
    setShowTour(false);
    markTourCompleted('parent');
  };

  // Função para iniciar o tour manualmente
  const handleStartTour = () => {
    setShowTour(true);
  };

  // Filtra os alunos vinculados com base nos IDs em user.linkedStudents, usando apenas dados do backend
  const linkedStudents = user.linkedStudents
    ? allUsers.filter((u) => u.id && user.linkedStudents.includes(u.id.toString()) && u.role === 'student')
    : [];
    
  console.log('Debug - Alunos vinculados:', {
    userLinkedStudents: user.linkedStudents,
    allUsersCount: allUsers.length,
    linkedStudentsCount: linkedStudents.length,
    linkedStudents: linkedStudents.map(s => ({ id: s.id, name: s.name }))
  });
  if (loadingUsers) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Carregando filhos vinculados...</div>;
  }

  // Calcular estatísticas gerais dos filhos
  const calculateFamilyStats = () => {
    if (linkedStudents.length === 0) return null;

    const totalXp = linkedStudents.reduce((sum, student) => sum + (student.progress?.xp || 0), 0);
    const totalLessons = linkedStudents.reduce((sum, student) => sum + (student.progress?.completedLessons?.length || 0), 0);
    const totalSavings = linkedStudents.reduce((sum, student) => sum + (student.savings?.balance || 0), 0);
    const averageLevel = linkedStudents.reduce((sum, student) => sum + (student.progress?.level || 1), 0) / linkedStudents.length;
    const totalStreak = linkedStudents.reduce((sum, student) => sum + (student.progress?.streak || 0), 0);

    return {
      totalXp,
      totalLessons,
      totalSavings,
      averageLevel: Math.round(averageLevel * 10) / 10,
      totalStreak,
      activeStudents: linkedStudents.length
    };
  };

  const familyStats = calculateFamilyStats();



  // Calcular progresso por matéria (baseado nas lições)
  const calculateSubjectProgress = (student) => {
    const completedLessons = student.progress?.completedLessons || [];
    const subjectProgress = {};

    completedLessons.forEach(lessonId => {
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson && lesson.subject) {
        if (!subjectProgress[lesson.subject]) {
          subjectProgress[lesson.subject] = { completed: 0, total: 0 };
        }
        subjectProgress[lesson.subject].completed++;
      }
    });

    // Adicionar total de lições por matéria
    lessons.forEach(lesson => {
      if (lesson.subject) {
        if (!subjectProgress[lesson.subject]) {
          subjectProgress[lesson.subject] = { completed: 0, total: 0 };
        }
        subjectProgress[lesson.subject].total++;
      }
    });

    return subjectProgress;
  };

  // Calcular tendências de progresso
  const calculateTrends = (student) => {
    const streak = student.progress?.streak || 0;
    const level = student.progress?.level || 1;
    const completedLessons = student.progress?.completedLessons?.length || 0;

    let trend = 'estável';
    let trendColor = 'text-gray-600';

    if (streak >= 7) {
      trend = 'crescendo';
      trendColor = 'text-green-600';
    } else if (streak >= 3) {
      trend = 'melhorando';
      trendColor = 'text-blue-600';
    } else if (streak === 0) {
      trend = 'precisa atenção';
      trendColor = 'text-red-600';
    }

    return { trend, trendColor, streak, level, completedLessons };
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setShowDetailedView(true);
  };

  const handleBackToOverview = () => {
    setSelectedStudent(null);
    setShowDetailedView(false);
  };

  const handleLinkChild = async () => {
    if (!firstAvailableStudent) return;
    
    try {
      // Verificar se o aluno foi registrado com token da escola
      if (firstAvailableStudent.schoolId) {
        // Para alunos registrados com token da escola, sempre usar sistema de solicitações
        await apiPost(`/parents/${user.id}/request-link`, {
          studentId: firstAvailableStudent.id || firstAvailableStudent._id,
          message: 'Solicitação de vínculo como responsável'
        });
        
        setShowLinkChildModal(false);
        setSearchTerm('');
        notificationService.success('Solicitação de vínculo enviada! Aguarde a aprovação do aluno.');
      } else {
        // Para alunos registrados com token do responsável, tentar vínculo direto
        const updatedParent = await apiPatch(`/users/${user.id || user._id}/vincular-filho`, { 
          studentId: firstAvailableStudent.id || firstAvailableStudent._id 
        });
        setUser(updatedParent);
        setShowLinkChildModal(false);
        setSearchTerm('');
        
        // Recarregar lista de usuários para atualizar a interface
        try {
          const users = await apiGet('/users');
          setAllUsers(users);
        } catch (err) {
          console.error('Erro ao recarregar usuários:', err);
        }
        
        notificationService.success('Filho vinculado com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao processar vínculo:', err);
      notificationService.error('Erro ao processar vínculo: ' + err.message);
    }
  };

  // Visão detalhada de um aluno específico
  if (showDetailedView && selectedStudent) {
    const subjectProgress = calculateSubjectProgress(selectedStudent);
    const trends = calculateTrends(selectedStudent);

    return (
      <div className="min-h-screen bg-interface p-4 pb-20">
        {showOnboarding && (
          <OnboardingModal profile="parent" onFinish={handleFinishOnboarding} />
        )}
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <button
                  onClick={handleBackToOverview}
                  className="text-primary hover:text-primary-dark mb-2 flex items-center"
                >
                  ← Voltar ao Resumo
                </button>
                <h1 className="text-3xl font-yufin text-primary">
                  <span style={{ display: window.innerWidth >= 768 ? 'inline' : 'none' }}>📊 </span>
                  Progresso de {selectedStudent.name}
                </h1>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Tendência</p>
                <p className={`text-lg font-semibold ${trends.trendColor}`}>{trends.trend}</p>
              </div>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-white p-4 rounded-lg shadow-lg" style={{ background: 'linear-gradient(to right, #3b82f6, #2563eb)' }}>
                <h3 className="text-sm font-medium text-white">Nível Atual</h3>
                <p className="text-2xl font-bold text-white">{selectedStudent.progress?.level || 1}</p>
              </div>
              <div className="text-white p-4 rounded-lg shadow-lg" style={{ background: 'linear-gradient(to right, #10b981, #059669)' }}>
                <h3 className="text-sm font-medium text-white">XP Total</h3>
                <p className="text-2xl font-bold text-white">{selectedStudent.progress?.xp || 0}</p>
              </div>
              <div className="text-white p-4 rounded-lg shadow-lg" style={{ background: 'linear-gradient(to right, #8b5cf6, #7c3aed)' }}>
                <h3 className="text-sm font-medium text-white">Ofensiva</h3>
                <p className="text-2xl font-bold text-white">{trends.streak} 🔥</p>
              </div>
              <div className="text-white p-4 rounded-lg shadow-lg" style={{ background: 'linear-gradient(to right, #f97316, #ea580c)' }}>
                <h3 className="text-sm font-medium text-white">Poupança</h3>
                <p className="text-2xl font-bold text-white">R$ {(selectedStudent.savings?.balance || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Progresso Geral */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Progresso</h2>
            
            {/* Card de Progresso Geral (replicando o do aluno) */}
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-primary">{selectedStudent.gradeId || '6º Ano'}</h3>
                  <p className="text-sm text-gray-600">Sexto ano do ensino fundamental</p>
                </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {selectedStudent.progress?.completedLessons?.length || 0}/{lessons.length}
                </div>
                <p className="text-sm text-gray-600">lições concluídas</p>
              </div>
              </div>
              
              {/* Barra de Progresso */}
              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(((selectedStudent.progress?.completedLessons?.length || 0) / lessons.length) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Porcentagem */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progresso Geral</span>
                <span className="font-semibold text-primary">
                  {Math.round(((selectedStudent.progress?.completedLessons?.length || 0) / lessons.length) * 100)}% completo
                </span>
              </div>
            </div>
          </div>

          {/* Lições Concluídas */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ Lições Concluídas</h2>
            <div className="space-y-2">
              {selectedStudent.progress?.completedLessons?.map(lessonId => {
                const isPerfect = selectedStudent.progress?.perfectLessons?.includes(lessonId);
                
                // Mapear IDs do MongoDB para títulos das lições
                const lessonTitles = {
                  '68bf16663f2074bcdd61d1d2': 'A História do Dinheiro',
                  '68bf16663f2074bcdd61d1d4': 'Necessidades vs Desejos',
                  '68bf16663f2074bcdd61d1d6': 'O Orçamento da Família',
                  '68bf16663f2074bcdd61d1d8': 'Contando Moedas e Notas',
                  '68bf16683f2074bcdd61d1da': 'Porcentagens no dia a dia',
                  '68bf16683f2074bcdd61d1dc': 'Comparando Preços no Mercado',
                  '68bf16683f2074bcdd61d1de': 'O valor das escolhas',
                  '68bf16683f2074bcdd61d1e0': 'Poupança para pequenos objetivos',
                  '68bf16683f2074bcdd61d1e2': 'Economizando em Casa',
                  '68bf16683f2074bcdd61d1e4': 'Feira de Troca / Simulação de compras',
                  '68bf16683f2074bcdd61d1e6': 'Planejando uma pequena viagem',
                  '68bf16683f2074bcdd61d1e8': 'Revisão e Celebração'
                };
                
                const lessonTitle = lessonTitles[lessonId] || 'Lição Concluída';
                
                return (
                  <div key={lessonId} className={`flex items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex-1">
                      <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{lessonTitle}</span>
                      {isPerfect && <span className="text-green-500 font-medium ml-2">(Perfeita)</span>}
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>15min</span>
                  </div>
                );
              })}
              {(!selectedStudent.progress?.completedLessons || selectedStudent.progress.completedLessons.length === 0) && (
                <p className={`text-center py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Nenhuma lição concluída ainda.</p>
              )}
            </div>
          </div>

          {/* Recomendações */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">💡 Recomendações</h2>
            <div className="space-y-3">
              {trends.streak === 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-yellow-800">
                    <strong>Incentive a consistência:</strong> {selectedStudent.name} não tem feito lições regularmente. 
                    Que tal estabelecer uma rotina diária?
                  </p>
                </div>
              )}
              {trends.streak >= 7 && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <p className="text-green-800">
                    <strong>Excelente progresso!</strong> {selectedStudent.name} está muito consistente. 
                    Continue incentivando essa dedicação!
                  </p>
                </div>
              )}
              {selectedStudent.savings?.balance > 0 && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <p className="text-blue-800">
                    <strong>Poupança em crescimento:</strong> {selectedStudent.name} já tem R$ {(selectedStudent.savings.balance).toFixed(2)} na poupança educativa. Que tal conversar sobre objetivos financeiros?
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Visão geral da família
  return (
    <div className="min-h-screen bg-interface p-4 pb-20">
      {/* Tour Interativo */}
      {showTour && (
        <InteractiveTour
          isActive={showTour}
          onFinish={handleFinishTour}
          steps={parentTourSteps}
          profile="parent"
          darkMode={darkMode}
        />
      )}
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div 
          className="rounded-xl shadow-lg p-6 mb-6 border-2" 
          style={{ 
            backgroundColor: darkMode ? '#374151' : '#ffffff',
            borderColor: 'rgb(238, 145, 22)' 
          }}
        >
          <h1 
            className="text-4xl font-yufin mb-4 tour-header"
            style={{ color: darkMode ? '#ffffff' : 'rgb(238, 145, 22)' }}
          >
            👨‍👩‍👧‍👦 Dashboard da Família
          </h1>
          <p 
            style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
          >
            Acompanhe o progresso educacional e financeiro dos seus filhos
          </p>
          
          {/* Abas */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm tour-tab-overview ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md transform scale-105'
                  : darkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600 border-2 border-gray-600 hover:border-orange-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-orange-300'
              }`}
            >
              📊 Visão Geral
            </button>

            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-3 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm tour-tab-tokens ${
                activeTab === 'tokens'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md transform scale-105'
                  : darkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600 border-2 border-gray-600 hover:border-orange-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-orange-300'
              }`}
            >
              🔑 Tokens para Filhos
            </button>
            
            {/* Botão de Tour - Oculto em mobile */}
            {!isMobileDevice() && (
              <button
                onClick={handleStartTour}
                className={`px-3 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm ${
                  darkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600 border-2 border-gray-600 hover:border-orange-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-orange-300'
                }`}
              >
                <span 
                  style={{ display: window.innerWidth < 640 ? 'inline' : 'none' }}
                >
                  💡 Tutorial
                </span>
                <span 
                  style={{ display: window.innerWidth >= 640 ? 'inline' : 'none' }}
                >
                  💡 Ver Tutorial
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo baseado na aba ativa */}
        {activeTab === 'overview' && (
          <>
            {/* Estatísticas Gerais da Família */}
            {familyStats && (
          <div 
            className="rounded-xl shadow-lg p-6 mb-6 border-2 tour-section-summary" 
            style={{ 
              backgroundColor: darkMode ? '#374151' : '#ffffff',
              borderColor: 'rgb(238, 145, 22)' 
            }}
          >
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
            >
              📊 Resumo da Família
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{familyStats.activeStudents}</div>
                <p style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Filhos Ativos</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{familyStats.totalLessons}</div>
                <p style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Lições Concluídas</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{familyStats.totalXp}</div>
                <p style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>XP Total</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{familyStats.averageLevel}</div>
                <p style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Nível Médio</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">R$ {familyStats.totalSavings.toFixed(2)}</div>
                <p style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Poupança Total</p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Filhos */}
        <div 
          className="rounded-xl shadow-lg p-6 mb-6 border-2" 
          style={{ 
            backgroundColor: darkMode ? '#374151' : '#ffffff',
            borderColor: 'rgb(238, 145, 22)' 
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 
              className="text-2xl font-bold tour-section-children"
              style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
            >
              👶 Seus Filhos
            </h2>
            <button
              onClick={() => setShowLinkChildModal(true)}
              className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition tour-link-child-button"
            >
              Vincular Filho
            </button>
          </div>
          {linkedStudents.length === 0 ? (
            <div className="text-center py-8">
              <p 
                className="mb-4"
                style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
              >
                Nenhum filho vinculado ainda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {linkedStudents.map((student) => {
                const trends = calculateTrends(student);
                const subjectProgress = calculateSubjectProgress(student);
                const totalSubjects = Object.keys(subjectProgress).length;
                const completedSubjects = Object.values(subjectProgress).filter(p => p.completed > 0).length;

                return (
                  <div 
                    key={student.id} 
                    className="rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col h-full"
                    style={{ backgroundColor: darkMode ? '#4b5563' : '#f9fafb' }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="text-xl font-semibold break-words"
                          style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                        >
                          {student.name}
                        </h3>
                      </div>
                      <div className="flex items-end ml-2">
                        <button
                          onClick={async () => {
                            try {
                              const updatedParent = await apiPatch(`/users/${user.id}/desvincular-filho`, { studentId: student.id });
                              setUser(updatedParent);
                            } catch (err) {
                              alert('Erro ao remover filho: ' + err.message);
                            }
                          }}
                          className="text-xs text-red-600 underline hover:text-red-800"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between">
                          <span style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Nível:</span>
                          <span className="font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>{student.progress?.level || 1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>XP:</span>
                          <span className="font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>{student.progress?.xp || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Ofensiva:</span>
                          <span className="font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>🔥 {trends.streak}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Lições:</span>
                          <span className="font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>{student.progress?.completedLessons?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Poupança:</span>
                          <span className="font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>R$ {(student.savings?.balance || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Barra de Progresso Geral */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1" style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>
                          <span>Progresso Geral</span>
                          <span>{completedSubjects}/{totalSubjects} matérias</span>
                        </div>
                        <div className="w-full rounded-full h-2" style={{ backgroundColor: darkMode ? '#6b7280' : '#e5e7eb' }}>
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${totalSubjects > 0 ? (completedSubjects / totalSubjects) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStudentSelect(student)}
                      className="w-full bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition mt-auto"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {/* Modal de Vinculação de Filho */}
          {showLinkChildModal && (
            <div 
              className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50"
              style={{ 
                backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.3)' 
              }}
              onClick={() => setShowLinkChildModal(false)}
            >
              <div 
                className="rounded-xl shadow-lg p-8 max-w-md w-full border-2" 
                style={{ 
                  backgroundColor: darkMode ? '#374151' : '#ffffff',
                  borderColor: 'rgb(238, 145, 22)' 
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 
                  className="text-xl font-bold mb-4"
                  style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                >
                  Vincular Filho
                </h2>
                
                {/* Informação sobre tipos de busca */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>🔒 Segurança:</strong> Esta funcionalidade permite vincular alunos desvinculados via ID de jogador. 
                    Use o ID de jogador fornecido pelo aluno (ex: YUF123).
                  </p>
                </div>
                
                <input
                  type="text"
                  className="w-full p-3 border rounded-md mb-4"
                  style={{
                    backgroundColor: darkMode ? '#4b5563' : '#ffffff',
                    borderColor: darkMode ? '#6b7280' : '#d1d5db',
                    color: darkMode ? '#ffffff' : '#1f2937'
                  }}
                  placeholder="Digite o ID de jogador (ex: YUF123)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {loadingStudents && (
                  <p 
                    className="mb-4"
                    style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                  >
                    Carregando alunos...
                  </p>
                )}
                {!loadingStudents && searchTerm && firstAvailableStudent && (
                  <div 
                    className="mb-4 p-3 rounded"
                    style={{
                      backgroundColor: darkMode ? '#4b5563' : '#f3f4f6',
                      color: darkMode ? '#ffffff' : '#1f2937'
                    }}
                  >
                    <div className="text-center">
                      <span className="font-semibold">Aluno encontrado:</span>
                      <div className="mt-2">
                        <p className="font-bold text-lg">{firstAvailableStudent.name}</p>
                        <p 
                          className="text-sm"
                          style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                        >
                          🎮 ID: {firstAvailableStudent.playerId}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {!loadingStudents && searchTerm && availableStudents.length === 0 && (
                  <div 
                    className="mb-4 p-3 rounded-lg border"
                    style={{
                      backgroundColor: darkMode ? '#451a03' : '#fef3c7',
                      borderColor: darkMode ? '#92400e' : '#f59e0b',
                      color: darkMode ? '#fbbf24' : '#92400e'
                    }}
                  >
                    <p className="text-sm">
                      Nenhum aluno encontrado com esse ID de jogador. Verifique se o ID está correto e se o aluno está desvinculado.
                    </p>
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowLinkChildModal(false)}
                    className="px-4 py-2 rounded-lg font-semibold transition"
                    style={{
                      backgroundColor: darkMode ? '#6b7280' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#374151'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = darkMode ? '#4b5563' : '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = darkMode ? '#6b7280' : '#e5e7eb';
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleLinkChild}
                    className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition"
                    disabled={!firstAvailableStudent}
                  >
                    Vincular
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            className="rounded-xl shadow-lg p-6 border-2 tour-section-savings"
            style={{ 
              backgroundColor: darkMode ? '#374151' : '#ffffff',
              borderColor: 'rgb(238, 145, 22)' 
            }}
          >
            <h2 
              className="text-xl font-bold mb-4"
              style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
            >
              💰 Configurações Financeiras
            </h2>
            <p 
              className="mb-4"
              style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
            >
              Gerencie as regras de poupança educativa para seus filhos
            </p>
        <button
          onClick={() => setActiveScreen('savings-config')}
              className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition"
        >
          Configurar Poupança
        </button>
          </div>

          <div 
            className="rounded-xl shadow-lg p-6 border-2 tour-section-reports"
            style={{ 
              backgroundColor: darkMode ? '#374151' : '#ffffff',
              borderColor: 'rgb(238, 145, 22)' 
            }}
          >
            <h2 
              className="text-xl font-bold mb-4"
              style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
            >
              📊 Relatórios Detalhados
            </h2>
            <p 
              className="mb-4"
              style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
            >
              Acesse relatórios completos de progresso e engajamento
            </p>
            <button
              onClick={() => setActiveScreen('reports')}
              className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition"
            >
              Ver Relatórios
            </button>
          </div>
        </div>
      </>
        )}



        {/* Aba de Tokens */}
        {activeTab === 'tokens' && (
          <div 
            className="rounded-xl shadow-lg p-6 border-2" 
            style={{ 
              backgroundColor: darkMode ? '#374151' : '#ffffff',
              borderColor: 'rgb(238, 145, 22)' 
            }}
          >
            <ParentTokenManager user={user} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;