import React, { useState, useEffect } from 'react';
import { lessons } from '../utils/lessons';
import InteractiveTour from './InteractiveTour';
import { schoolTourSteps, shouldShowTour, markTourCompleted, handleMobileTourSkip, isMobileDevice } from '../utils/tourConfigs';
import { apiGet, apiPost } from '../utils/apiService';
import notificationService from '../utils/notificationService';
import TokenManager from './TokenManager';

const SchoolDashboard = ({ user, setActiveScreen }) => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [schoolStudents, setSchoolStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [gradeProgressionRequests, setGradeProgressionRequests] = useState([]);
  const [loadingProgressionRequests, setLoadingProgressionRequests] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, tokens, progression
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Verificar se deve mostrar o tour (desabilitado em mobile)
    if (shouldShowTour('school')) {
      setShowTour(true);
    } else {
      // Se for mobile, marcar como completado automaticamente
      handleMobileTourSkip('school');
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



  useEffect(() => {
    apiGet('/users')
      .then(users => {
        // Filtrar apenas alunos que pertencem a esta escola específica
        const schoolStudents = users.filter(u => 
          u.role === 'student' && u.schoolId === user.id
        );
        setSchoolStudents(schoolStudents);
        setLoadingStudents(false);
      })
      .catch(() => setLoadingStudents(false));
  }, [user.id]);

  useEffect(() => {
    apiGet(`/classes?schoolId=${user.id}`)
      .then(data => {
        setClasses(data);
        setLoadingClasses(false);
      })
      .catch(() => setLoadingClasses(false));
  }, [user.id]);

  // Carregar solicitações de progressão
  useEffect(() => {
    loadGradeProgressionRequests();
  }, [schoolStudents]);

  const loadGradeProgressionRequests = async () => {
    try {
      setLoadingProgressionRequests(true);
      const requests = [];
      
      // Verificar cada aluno para solicitações pendentes
      for (const student of schoolStudents) {
        if (student.gradeProgression?.nextGradeRequested && !student.gradeProgression?.nextGradeAuthorized) {
          const status = await apiGet(`/users/${student.id}/grade-progression-status`);
          
          if (status.progression.requested) {
            requests.push({
              student,
              status,
              requestDate: student.gradeProgression.nextGradeRequestDate
            });
          }
        }
      }
      
      setGradeProgressionRequests(requests);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      setLoadingProgressionRequests(false);
    }
  };

  const handleAuthorizeProgression = async (authorized, notes = '') => {
    try {
      const response = await apiPost(`/users/${selectedRequest.student.id}/authorize-grade-progression`, {
        authorized,
        notes
      });
      
      notificationService.success(response.message);
      setShowProgressionModal(false);
      setSelectedRequest(null);
      
      // Se a progressão foi negada, recarregar dados imediatamente
      if (!authorized && response.requestReset) {
        console.log(`🔄 Progressão negada para ${response.studentName} - recarregando dados...`);
        
        // Recarregar dados imediatamente
        await loadGradeProgressionRequests();
        
        const updatedUsers = await apiGet('/users');
        setSchoolStudents(updatedUsers.filter(u => u.role === 'student' && u.schoolId === user.id));
        
        const updatedClasses = await apiGet(`/classes?schoolId=${user.id}`);
        setClasses(updatedClasses);
      }
      // Se o aluno foi desvinculado, recarregar dados imediatamente
      else if (response.studentUnlinked) {
        console.log(`🔄 Aluno ${response.studentName} foi desvinculado da turma ${response.previousClass?.name || 'anterior'}`);
        
        // Recarregar dados imediatamente
        const updatedUsers = await apiGet('/users');
        setSchoolStudents(updatedUsers.filter(u => u.role === 'student' && u.schoolId === user.id));
        
        const updatedClasses = await apiGet(`/classes?schoolId=${user.id}`);
        setClasses(updatedClasses);
        
        // Recarregar solicitações de progressão
        await loadGradeProgressionRequests();
      }
      // Para autorizações, aguardar um pouco para o backend processar
      else {
        setTimeout(async () => {
          // Recarregar dados
          await loadGradeProgressionRequests();
          
          // Recarregar lista de alunos
          const updatedUsers = await apiGet('/users');
          setSchoolStudents(updatedUsers.filter(u => u.role === 'student' && u.schoolId === user.id));
          
          // Recarregar turmas para atualizar contadores
          const updatedClasses = await apiGet(`/classes?schoolId=${user.id}`);
          setClasses(updatedClasses);
        }, 1000);
      }
      
    } catch (error) {
      console.error('Erro ao autorizar progressão:', error);
      notificationService.error('Erro ao processar autorização');
    }
  };

  // Função para finalizar o tour
  const handleFinishTour = () => {
    setShowTour(false);
    markTourCompleted('school');
  };

  // Função para iniciar o tour manualmente
  const handleStartTour = () => {
    setShowTour(true);
  };

  // Calcular estatísticas da escola (apenas alunos vinculados às turmas)
  const calculateSchoolStats = () => {
    // Obter alunos que estão vinculados às turmas da escola
    const linkedStudentIds = new Set();
    classes.forEach(classData => {
      if (Array.isArray(classData.students)) {
        classData.students.forEach(studentId => {
          linkedStudentIds.add(studentId);
        });
      }
    });

    // Filtrar apenas alunos vinculados às turmas
    const linkedStudents = schoolStudents.filter(student => linkedStudentIds.has(student.id));
    
    // Usar TODOS os alunos da escola, não apenas os vinculados às turmas
    const totalStudents = schoolStudents.length;
    const totalXp = linkedStudents.reduce((sum, student) => sum + (student.progress?.xp || 0), 0);
    const totalLessons = linkedStudents.reduce((sum, student) => sum + (student.progress?.completedLessons?.length || 0), 0);
    const averageLevel = totalStudents > 0 ? linkedStudents.reduce((sum, student) => sum + (student.progress?.level || 1), 0) / totalStudents : 0;
    const activeStudents = linkedStudents.filter(student => (student.progress?.streak || 0) > 0).length;
    const totalSavings = linkedStudents.reduce((sum, student) => sum + (student.savings?.balance || 0), 0);

    return {
      totalStudents,
      totalXp,
      totalLessons,
      averageLevel: Math.round(averageLevel * 10) / 10,
      activeStudents,
      totalSavings,
      engagementRate: totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0
    };
  };

  const schoolStats = calculateSchoolStats();

  if (loadingStudents) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Carregando alunos...</div>;
  }

  if (loadingClasses) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Carregando turmas...</div>;
  }

  // Calcular estatísticas por turma
  const calculateClassStats = (classData) => {
    // Agora pega os alunos reais da turma
    const classStudents = schoolStudents.filter(student => Array.isArray(classData.students) && classData.students.includes(student.id.toString()));
    const totalXp = classStudents.reduce((sum, student) => sum + (student.progress?.xp || 0), 0);
    const totalLessons = classStudents.reduce((sum, student) => sum + (student.progress?.completedLessons?.length || 0), 0);
    const averageLevel = classStudents.length > 0 ? classStudents.reduce((sum, student) => sum + (student.progress?.level || 1), 0) / classStudents.length : 0;
    const activeStudents = classStudents.filter(student => (student.progress?.streak || 0) > 0).length;
    return {
      totalStudents: classStudents.length,
      totalXp,
      totalLessons,
      averageLevel: Math.round(averageLevel * 10) / 10,
      activeStudents,
      engagementRate: classStudents.length > 0 ? Math.round((activeStudents / classStudents.length) * 100) : 0,
      classStudents // retorna para uso na tela detalhada
    };
  };

  // Calcular progresso por matéria
  const calculateSubjectProgress = (students) => {
    const subjectProgress = {};

    students.forEach(student => {
      const completedLessons = student.progress?.completedLessons || [];
      completedLessons.forEach(lessonId => {
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson && lesson.subject) {
          if (!subjectProgress[lesson.subject]) {
            subjectProgress[lesson.subject] = { completed: 0, total: 0, students: new Set() };
          }
          subjectProgress[lesson.subject].completed++;
          subjectProgress[lesson.subject].students.add(student.id);
        }
      });
    });

    // Adicionar total de lições por matéria
    lessons.forEach(lesson => {
      if (lesson.subject) {
        if (!subjectProgress[lesson.subject]) {
          subjectProgress[lesson.subject] = { completed: 0, total: 0, students: new Set() };
        }
        subjectProgress[lesson.subject].total += students.length; // Cada aluno pode fazer cada lição
      }
    });

    return subjectProgress;
  };

  // Calcular ranking da escola
  const calculateSchoolRanking = () => {
    // Obter todos os alunos que estão vinculados às turmas da escola
    const schoolStudentsIds = new Set();
    classes.forEach(classData => {
      if (Array.isArray(classData.students)) {
        classData.students.forEach(studentId => {
          schoolStudentsIds.add(studentId);
        });
      }
    });

    // Filtrar apenas alunos que estão nas turmas da escola
    const schoolStudentsOnly = schoolStudents.filter(student => schoolStudentsIds.has(student.id));

    return schoolStudentsOnly
      .map(student => ({
        id: student.id,
        name: student.name,
        xp: student.progress?.xp || 0,
        level: student.progress?.level || 1,
        streak: student.progress?.streak || 0,
        lessonsCompleted: student.progress?.completedLessons?.length || 0
      }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10);
  };

  const handleClassSelect = (classData) => {
    setSelectedClass(classData);
    setShowDetailedView(true);
  };

  const handleBackToOverview = () => {
    setSelectedClass(null);
    setShowDetailedView(false);
  };

  // Visão detalhada de uma turma
  if (showDetailedView && selectedClass) {
    const classStats = calculateClassStats(selectedClass);
    const classStudents = classStats.classStudents;
    const subjectProgress = calculateSubjectProgress(classStudents);

    return (
      <div className="min-h-screen bg-interface p-4 pb-20">
        {showOnboarding && (
          <OnboardingModal profile="school" onFinish={handleFinishOnboarding} />
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <button
                  onClick={handleBackToOverview}
                  className="text-primary hover:text-primary-dark mb-2 flex items-center"
                >
                  ← Voltar ao Resumo
                </button>
                <h1 className="text-3xl font-yufin text-primary">📊 {selectedClass.name}</h1>
                <p 
                  style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                >
                  Professor: {selectedClass.teacher}
                </p>
              </div>
              <div className="text-right">
                <p 
                  className="text-sm"
                  style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                >
                  Taxa de Engajamento
                </p>
                <p className="text-2xl font-bold text-green-600">{classStats.engagementRate}%</p>
              </div>
            </div>

            {/* Cards de Estatísticas da Turma */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-white p-4 rounded-lg shadow-lg" style={{ background: 'linear-gradient(to right, #3b82f6, #2563eb)' }}>
                <h3 className="text-sm font-medium text-white">Alunos</h3>
                <p className="text-2xl font-bold text-white">{classStats.totalStudents}</p>
              </div>
              <div className="text-white p-4 rounded-lg shadow-lg" style={{ background: 'linear-gradient(to right, #10b981, #059669)' }}>
                <h3 className="text-sm font-medium text-white">XP Total</h3>
                <p className="text-2xl font-bold text-white">{classStats.totalXp}</p>
              </div>
              <div className="text-white p-4 rounded-lg shadow-lg" style={{ background: 'linear-gradient(to right, #8b5cf6, #7c3aed)' }}>
                <h3 className="text-sm font-medium text-white">Nível Médio</h3>
                <p className="text-2xl font-bold text-white">{classStats.averageLevel}</p>
              </div>
              <div className="text-white p-4 rounded-lg shadow-lg" style={{ background: 'linear-gradient(to right, #f97316, #ea580c)' }}>
                <h3 className="text-sm font-medium text-white">Lições</h3>
                <p className="text-2xl font-bold text-white">{classStats.totalLessons}</p>
              </div>
            </div>
          </div>

          {/* Progresso por Matéria */}
          <div 
            className="rounded-xl shadow-lg p-6 mb-6 border-2" 
            style={{ 
              backgroundColor: darkMode ? '#374151' : '#ffffff',
              borderColor: 'rgb(238, 145, 22)' 
            }}
          >
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
            >
              📚 Progresso por Matéria
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(subjectProgress).map(([subject, progress]) => (
                <div 
                  key={subject} 
                  className="rounded-lg p-4"
                  style={{ backgroundColor: darkMode ? '#4b5563' : '#f9fafb' }}
                >
                  <h3 
                    className="text-lg font-semibold mb-2"
                    style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                  >
                    {subject}
                  </h3>
                  <div 
                    className="flex justify-between text-sm mb-2"
                    style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                  >
                    <span>{progress.completed} lições concluídas</span>
                    <span>{progress.students.size} alunos ativos</span>
                  </div>
                  <div 
                    className="w-full rounded-full h-2"
                    style={{ backgroundColor: darkMode ? '#6b7280' : '#e5e7eb' }}
                  >
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((progress.completed / progress.total) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de Alunos da Turma */}
          <div 
            className="rounded-xl shadow-lg p-6 mb-6 border-2" 
            style={{ 
              backgroundColor: darkMode ? '#374151' : '#ffffff',
              borderColor: 'rgb(238, 145, 22)' 
            }}
          >
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
            >
              👥 Alunos da Turma
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classStudents.map((student, index) => (
                <div 
                  key={student.id} 
                  className="rounded-lg p-4"
                  style={{ backgroundColor: darkMode ? '#4b5563' : '#f9fafb' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 
                      className="font-semibold"
                      style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                    >
                      {student.name}
                    </h4>
                    <span 
                      className="text-sm"
                      style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                    >
                      #{index + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span 
                        style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                      >
                        Nível:
                      </span>
                      <span 
                        className="font-semibold ml-1"
                        style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                      >
                        {student.progress?.level || 1}
                      </span>
                    </div>
                    <div>
                      <span 
                        style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                      >
                        XP:
                      </span>
                      <span 
                        className="font-semibold ml-1"
                        style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                      >
                        {student.progress?.xp || 0}
                      </span>
                    </div>
                    <div>
                      <span 
                        style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                      >
                        Ofensiva:
                      </span>
                      <span 
                        className="font-semibold ml-1"
                        style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                      >
                        {student.progress?.streak || 0} 🔥
                      </span>
                    </div>
                    <div>
                      <span 
                        style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                      >
                        Lições:
                      </span>
                      <span 
                        className="font-semibold ml-1"
                        style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                      >
                        {student.progress?.completedLessons?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Visão geral da escola
  return (
    <div className="min-h-screen bg-interface p-4 pb-20">
      {/* Tour Interativo */}
      {showTour && (
        <InteractiveTour
          isActive={showTour}
          onFinish={handleFinishTour}
          steps={schoolTourSteps}
          profile="school"
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
            🏫 Dashboard da Escola {user.name ? user.name : ''}
          </h1>
          <p 
            style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
          >
            Acompanhe o progresso educacional de toda a escola
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
              <span 
                style={{ display: window.innerWidth < 640 ? 'inline' : 'none' }}
              >
                📊 Geral
              </span>
              <span 
                style={{ display: window.innerWidth >= 640 ? 'inline' : 'none' }}
              >
                📊 Visão Geral
              </span>
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
              <span 
                style={{ display: window.innerWidth < 640 ? 'inline' : 'none' }}
              >
                🔑 Tokens
              </span>
              <span 
                style={{ display: window.innerWidth >= 640 ? 'inline' : 'none' }}
              >
                🔑 Tokens de Registro
              </span>
            </button>
            <button
              onClick={() => setActiveTab('progression')}
              className={`px-3 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm tour-tab-progression ${
                activeTab === 'progression'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md transform scale-105'
                  : darkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600 border-2 border-gray-600 hover:border-orange-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-orange-300'
              }`}
            >
              <span 
                style={{ display: window.innerWidth < 640 ? 'inline' : 'none' }}
              >
                🎓 Progressão
              </span>
              <span 
                style={{ display: window.innerWidth >= 640 ? 'inline' : 'none' }}
              >
                🎓 Progressão Escolar
              </span>
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
            {/* Estatísticas Gerais da Escola */}
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
            📊 Resumo da Escola
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">{schoolStats.totalStudents}</div>
              <p style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Total de Alunos</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{schoolStats.activeStudents}</div>
              <p style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Alunos Ativos</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{schoolStats.totalLessons}</div>
              <p style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Lições Concluídas</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{schoolStats.totalXp}</div>
              <p style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>XP Total</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{schoolStats.averageLevel}</div>
              <p style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Nível Médio</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600 mb-2">{schoolStats.engagementRate}%</div>
              <p style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Engajamento</p>
            </div>
          </div>
        </div>



        {/* Turmas */}
        <div 
          className="rounded-xl shadow-lg p-6 mb-6 border-2 tour-section-classes" 
          style={{ 
            backgroundColor: darkMode ? '#374151' : '#ffffff',
            borderColor: 'rgb(238, 145, 22)' 
          }}
        >
          <h2 
            className="text-2xl font-bold mb-4"
            style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
          >
            🏫 Turmas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {classes.map((classData) => {
              const classStats = calculateClassStats(classData);
              return (
                <div 
                  key={classData.id} 
                  className="rounded-lg p-6 hover:shadow-lg transition-shadow"
                  style={{ backgroundColor: darkMode ? '#4b5563' : '#f9fafb' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 
                      className="text-lg font-semibold"
                      style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                    >
                      {classData.name}
                    </h3>
                    <span 
                      className="text-sm"
                      style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
                    >
                      {classData.grade}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Professor:</span>
                      <span className="font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>{classData.teacher}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Alunos:</span>
                      <span className="font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>{classStats.totalStudents}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Nível Médio:</span>
                      <span className="font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>{classStats.averageLevel}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Engajamento:</span>
                      <span className="font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>{classStats.engagementRate}%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleClassSelect(classData)}
                    className="w-full bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
                  >
                    Ver Detalhes
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ranking da Escola */}
        <div 
          className="rounded-xl shadow-lg p-6 mb-6 border-2" 
          style={{ 
            backgroundColor: darkMode ? '#374151' : '#ffffff',
            borderColor: 'rgb(238, 145, 22)' 
          }}
        >
          <h2 
            className="text-2xl font-bold mb-4"
            style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
          >
            🏆 Ranking da Escola
          </h2>
          <div className="space-y-3">
            {calculateSchoolRanking().map((student, index) => (
              <div 
                key={student.id} 
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ backgroundColor: darkMode ? '#4b5563' : '#f9fafb' }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 
                      className="font-semibold"
                      style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                    >
                      {student.name}
                    </h4>
                    <p 
                      className="text-sm"
                      style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
                    >
                      Nível {student.level} • {student.lessonsCompleted} lições
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">{student.xp} XP</div>
                  <div 
                    className="text-sm"
                    style={{ color: darkMode ? '#ffffff' : '#6b7280' }}
                  >
                    {student.streak} 🔥
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Relatórios Detalhados</h2>
            <p className="text-gray-600 mb-4">Acesse relatórios completos de progresso e engajamento</p>
        <button
          onClick={() => setActiveScreen('reports')}
              className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition"
        >
              Ver Relatórios
        </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">📈 Análise de Performance</h2>
            <p className="text-gray-600 mb-4">Analise tendências e performance dos alunos</p>
            <button
              onClick={() => alert('Funcionalidade de análise de performance em desenvolvimento!')}
              className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition"
            >
              Ver Análises
            </button>
          </div>
        </div>
      </>
        )}

        {/* Aba de Tokens */}
        {activeTab === 'tokens' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 tour-section-tokens" style={{ borderColor: 'rgb(238, 145, 22)' }}>
            <TokenManager user={user} />
          </div>
        )}

        {/* Aba de Progressão Escolar */}
        {activeTab === 'progression' && (
          <div 
            className="rounded-xl shadow-lg p-6 border-2 tour-section-progression" 
            style={{ 
              backgroundColor: darkMode ? '#374151' : '#ffffff',
              borderColor: 'rgb(238, 145, 22)' 
            }}
          >
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
            >
              🎓 Progressão Escolar
            </h2>
            
            {/* Autorizações de Progressão */}
            {gradeProgressionRequests.length > 0 ? (
              <div className="space-y-4">
                {gradeProgressionRequests.map((request, index) => (
                  <div 
                    key={request.student.id} 
                    className="rounded-lg p-4 border-l-4 border-primary shadow-md hover:shadow-lg transition-all duration-200"
                    style={{ backgroundColor: darkMode ? '#4b5563' : '#f9fafb' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 
                          className="font-bold text-lg"
                          style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                        >
                          {request.student.name}
                        </h4>
                        <p 
                          className="text-sm mt-1"
                          style={{ color: darkMode ? '#d1d5db' : '#374151' }}
                        >
                          Solicitou progressão de <strong className="text-primary">{request.status.currentGrade}</strong> para <strong className="text-green-600">{request.status.nextGrade}</strong>
                        </p>
                        <p 
                          className="text-xs mt-2"
                          style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                        >
                          📅 Solicitado em: {new Date(request.requestDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowProgressionModal(true);
                          }}
                          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          Revisar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className="text-center py-8 rounded-lg"
                style={{ backgroundColor: darkMode ? '#4b5563' : '#f9fafb' }}
              >
                <p style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>
                  Nenhuma solicitação de progressão pendente.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Autorização de Progressão */}
      {showProgressionModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4" style={{ paddingBottom: '80px', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-4 p-4 sm:p-6 border-2 overflow-y-auto" style={{ borderColor: 'rgb(238, 145, 22)', maxHeight: 'calc(100vh - 120px)' }}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">🎓 Revisar Progressão de Série</h3>
              <button
                onClick={() => {
                  setShowProgressionModal(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl font-bold transition-colors cursor-pointer p-0 m-0 border-0 bg-transparent focus:outline-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Informações do Aluno */}
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border-l-4 border-primary">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center text-sm sm:text-base">
                  👤 Informações do Aluno
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Nome:</span>
                    <span className="font-semibold ml-2 text-gray-800 truncate">{selectedRequest.student.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Série Atual:</span>
                    <span className="font-semibold ml-2 text-primary">{selectedRequest.status.currentGrade}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Nível:</span>
                    <span className="font-semibold ml-2 text-gray-800">{selectedRequest.student.progress?.level || 1}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">XP Total:</span>
                    <span className="font-semibold ml-2 text-gray-800">{selectedRequest.student.progress?.xp || 0}</span>
                  </div>
                </div>
              </div>

              {/* Progresso da Série Atual */}
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border-l-4 border-green-500">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center text-sm sm:text-base">
                  📊 Progresso da Série Atual
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600 font-medium">Lições Completadas:</span>
                    <span className="font-semibold text-gray-800">{selectedRequest.status.completedLessons}/{selectedRequest.status.totalLessons}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 shadow-inner">
                    <div
                      className="bg-green-500 h-2 sm:h-3 rounded-full shadow-sm transition-all duration-300"
                      style={{ width: `${(selectedRequest.status.completedLessons / selectedRequest.status.totalLessons) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center">
                    {selectedRequest.status.hasCompletedCurrentGrade ? (
                      <span className="text-green-600 text-xs sm:text-sm font-medium flex items-center">
                        ✅ Série atual completamente finalizada
                      </span>
                    ) : (
                      <span className="text-orange-600 text-xs sm:text-sm font-medium flex items-center">
                        ⚠️ Série atual não completamente finalizada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Solicitação */}
              <div className="bg-orange-50 rounded-lg p-2 sm:p-3 border-l-4 border-orange-500">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center text-sm sm:text-base">
                  📝 Solicitação de Progressão
                </h4>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-gray-700">
                    O aluno solicitou progressão de <strong className="text-primary">{selectedRequest.status.currentGrade}</strong> para <strong className="text-green-600">{selectedRequest.status.nextGrade}</strong>
                  </p>
                  <p className="text-xs text-gray-500 flex items-center">
                    📅 Solicitado em: {new Date(selectedRequest.requestDate).toLocaleDateString('pt-BR')} às {new Date(selectedRequest.requestDate).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Ações */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  onClick={() => {
                    handleAuthorizeProgression(false, '');
                  }}
                  className="w-full bg-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center text-xs sm:text-sm"
                >
                  ❌ Negar
                </button>
                <button
                  onClick={() => {
                    handleAuthorizeProgression(true, '');
                  }}
                  className="w-full bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center text-xs sm:text-sm"
                >
                  ✅ Autorizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolDashboard;