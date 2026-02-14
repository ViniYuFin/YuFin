import React, { useState, useEffect } from 'react';
import analyticsService from '../utils/analyticsService';
import { storageService, STORAGE_KEYS } from '../utils/storageService';
import { apiGet } from '../utils/apiService';
import { lessons } from '../utils/lessons';

const Reports = ({ user, setActiveScreen }) => {
  const [report, setReport] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [reportType, setReportType] = useState('general'); // general, family, school
  const [allUsers, setAllUsers] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Buscar todos os usuários do backend ao montar
    apiGet('/users').then(users => setAllUsers(users));
    
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
    generateReport();
  }, [timeRange, reportType, allUsers]);

  const generateReport = () => {
    setIsLoading(true);
    
    let analyticsReport;
    
    if (user.role === 'parent') {
      analyticsReport = generateFamilyReport();
    } else if (user.role === 'school') {
      analyticsReport = generateSchoolReport();
    } else {
      analyticsReport = analyticsService.generateReport(timeRange);
    }
    
    const progress = storageService.load(STORAGE_KEYS.PROGRESS);
    
    // Combinar dados de analytics com progresso
    const combinedReport = {
      ...analyticsReport,
      progress: progress || {},
      user: user
    };
    

    
    setReport(combinedReport);
    setIsLoading(false);
  };

  // Gerar relatório específico para responsáveis
  const generateFamilyReport = () => {
    const linkedStudents = user.linkedStudents
      ? allUsers.filter((u) => user.linkedStudents.includes(u.id) && u.role === 'student')
      : [];

    const familyStats = {
      totalStudents: linkedStudents.length,
      totalXp: linkedStudents.reduce((sum, student) => sum + (student.progress?.xp || 0), 0),
      totalLessons: linkedStudents.reduce((sum, student) => sum + (student.progress?.completedLessons?.length || 0), 0),
      totalSavings: linkedStudents.reduce((sum, student) => {
        const baseBalance = student.savings?.balance || 0;
        const incentiveRate = 0.10; // 10% de incentivo
        const incentiveAmount = baseBalance * incentiveRate;
        const totalWithIncentive = baseBalance + incentiveAmount;
        return sum + totalWithIncentive;
      }, 0),
      averageLevel: linkedStudents.length > 0 
        ? linkedStudents.reduce((sum, student) => sum + (student.progress?.level || 1), 0) / linkedStudents.length 
        : 0,
      totalStreak: linkedStudents.reduce((sum, student) => sum + (student.progress?.streak || 0), 0),
      activeStudents: linkedStudents.filter(student => (student.progress?.streak || 0) > 0).length
    };

    // Calcular progresso por matéria da família
    const familySubjectProgress = {};
    linkedStudents.forEach(student => {
      const completedLessons = student.progress?.completedLessons || [];
      completedLessons.forEach(lessonId => {
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson && lesson.subject) {
          if (!familySubjectProgress[lesson.subject]) {
            familySubjectProgress[lesson.subject] = { completed: 0, total: 0, students: new Set() };
          }
          familySubjectProgress[lesson.subject].completed++;
          familySubjectProgress[lesson.subject].students.add(student.id);
        }
      });
    });

    // Adicionar total de lições por matéria
    lessons.forEach(lesson => {
      if (lesson.subject) {
        if (!familySubjectProgress[lesson.subject]) {
          familySubjectProgress[lesson.subject] = { completed: 0, total: 0, students: new Set() };
        }
        familySubjectProgress[lesson.subject].total += linkedStudents.length;
      }
    });

    return {
      familyStats,
      familySubjectProgress,
      linkedStudents,
      sessionDuration: linkedStudents.reduce((sum, student) => sum + (student.progress?.timeSpent || 0), 0),
      userEngagement: {
        totalLessons: familyStats.totalLessons,
        perfectLessons: linkedStudents.reduce((sum, student) => sum + (student.progress?.perfectLessons?.length || 0), 0),
        perfectRate: familyStats.totalLessons > 0 
          ? (linkedStudents.reduce((sum, student) => sum + (student.progress?.perfectLessons?.length || 0), 0) / familyStats.totalLessons) * 100 
          : 0,
        averageScore: familyStats.totalLessons > 0 
          ? (linkedStudents.reduce((sum, student) => sum + (student.progress?.perfectLessons?.length || 0), 0) / familyStats.totalLessons) * 100 
          : 0,
        averageTimePerLesson: familyStats.totalLessons > 0 
          ? Math.round(linkedStudents.reduce((sum, student) => sum + (student.progress?.timeSpent || 0), 0) / familyStats.totalLessons)
          : 0
      },
      performance: {
        achievements: linkedStudents.reduce((sum, student) => sum + (student.progress?.achievements?.length || 0), 0),
        levelUps: linkedStudents.reduce((sum, student) => sum + (student.progress?.level || 1), 0) - linkedStudents.length
      },
      eventsByType: {
        lesson_complete: familyStats.totalLessons,
        level_up: linkedStudents.reduce((sum, student) => sum + (student.progress?.level || 1), 0) - linkedStudents.length,
        achievement_unlock: linkedStudents.reduce((sum, student) => sum + (student.progress?.achievements?.length || 0), 0)
      }
    };
  };

  // Gerar relatório específico para escolas
  const generateSchoolReport = () => {
    // Filtrar apenas alunos que pertencem a esta escola específica
    const schoolStudents = allUsers.filter(u => 
      u.role === 'student' && u.schoolId === user.id
    );

    const schoolStats = {
      totalStudents: schoolStudents.length,
      totalXp: schoolStudents.reduce((sum, student) => sum + (student.progress?.xp || 0), 0),
      totalLessons: schoolStudents.reduce((sum, student) => sum + (student.progress?.completedLessons?.length || 0), 0),
      totalSavings: schoolStudents.reduce((sum, student) => sum + (student.savings?.balance || 0), 0),
      averageLevel: schoolStudents.length > 0 
        ? schoolStudents.reduce((sum, student) => sum + (student.progress?.level || 1), 0) / schoolStudents.length 
        : 0,
      activeStudents: schoolStudents.filter(student => (student.progress?.streak || 0) > 0).length,
      engagementRate: schoolStudents.length > 0 
        ? (schoolStudents.filter(student => (student.progress?.streak || 0) > 0).length / schoolStudents.length) * 100 
        : 0
    };

    // Calcular progresso por matéria da escola
    const schoolSubjectProgress = {};
    schoolStudents.forEach(student => {
      const completedLessons = student.progress?.completedLessons || [];
      completedLessons.forEach(lessonId => {
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson && lesson.subject) {
          if (!schoolSubjectProgress[lesson.subject]) {
            schoolSubjectProgress[lesson.subject] = { completed: 0, total: 0, students: new Set() };
          }
          schoolSubjectProgress[lesson.subject].completed++;
          schoolSubjectProgress[lesson.subject].students.add(student.id);
        }
      });
    });

    // Adicionar total de lições por matéria
    lessons.forEach(lesson => {
      if (lesson.subject) {
        if (!schoolSubjectProgress[lesson.subject]) {
          schoolSubjectProgress[lesson.subject] = { completed: 0, total: 0, students: new Set() };
        }
        schoolSubjectProgress[lesson.subject].total += schoolStudents.length;
      }
    });

    // Ranking da escola
    const schoolRanking = schoolStudents
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

    return {
      schoolStats,
      schoolSubjectProgress,
      schoolRanking,
      schoolStudents,
      sessionDuration: schoolStudents.reduce((sum, student) => sum + (student.progress?.timeSpent || 0), 0),
      userEngagement: {
        totalLessons: schoolStats.totalLessons,
        perfectLessons: schoolStudents.reduce((sum, student) => sum + (student.progress?.perfectLessons?.length || 0), 0),
        perfectRate: schoolStats.totalLessons > 0 
          ? (schoolStudents.reduce((sum, student) => sum + (student.progress?.perfectLessons?.length || 0), 0) / schoolStats.totalLessons) * 100 
          : 0,
        averageScore: schoolStats.totalLessons > 0 
          ? (schoolStudents.reduce((sum, student) => sum + (student.progress?.perfectLessons?.length || 0), 0) / schoolStats.totalLessons) * 100 
          : 0,
        averageTimePerLesson: schoolStats.totalLessons > 0 
          ? Math.round(schoolStudents.reduce((sum, student) => sum + (student.progress?.timeSpent || 0), 0) / schoolStats.totalLessons)
          : 0
      },
      performance: {
        achievements: schoolStudents.reduce((sum, student) => sum + (student.progress?.achievements?.length || 0), 0),
        levelUps: schoolStudents.reduce((sum, student) => sum + (student.progress?.level || 1), 0) - schoolStudents.length
      },
      eventsByType: {
        lesson_complete: schoolStats.totalLessons,
        level_up: schoolStudents.reduce((sum, student) => sum + (student.progress?.level || 1), 0) - schoolStudents.length,
        achievement_unlock: schoolStudents.reduce((sum, student) => sum + (student.progress?.achievements?.length || 0), 0)
      }
    };
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDuration = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-interface flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Gerando relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-interface p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-yufin text-primary">📊 Relatórios Detalhados</h1>
            </div>
            {/* Botões apenas para desktop - ocultar no mobile */}
            <div 
              className="items-center space-x-4"
              style={{ 
                display: window.innerWidth >= 768 ? 'flex' : 'none' 
              }}
            >
              {user.role === 'parent' && (
                <select 
                  value={reportType} 
                  onChange={(e) => setReportType(e.target.value)}
                  className="bg-white border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors hover:border-orange-300"
                >
                  <option value="general">Visão Geral</option>
                  <option value="family">Relatório Familiar</option>
                  <option value="individual">Individual por Filho</option>
                </select>
              )}
              {user.role === 'school' && (
                <select 
                  value={reportType} 
                  onChange={(e) => setReportType(e.target.value)}
                  className="bg-white border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors hover:border-orange-300"
                >
                  <option value="general">Visão Geral</option>
                  <option value="school">Relatório da Escola</option>
                  <option value="classes">Por Turmas</option>
                </select>
              )}
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors hover:border-orange-300"
              >
                <option value="1d">Último dia</option>
                <option value="7d">Última semana</option>
                <option value="30d">Último mês</option>
                <option value="all">Todo período</option>
              </select>
              <button
                onClick={generateReport}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-sm hover:shadow-md font-semibold"
              >
                🔄 Atualizar
              </button>
            </div>
          </div>
          
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Card 1 - Filhos/Alunos Ativos */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg" style={{ background: 'linear-gradient(to right, #3b82f6, #2563eb)' }}>
              <h3 className="text-sm font-medium text-white mb-1">
                {user.role === 'parent' ? '👶 Filhos Ativos' : '👥 Alunos Ativos'}
              </h3>
              <p className="text-2xl font-bold text-white">
                {user.role === 'parent' && report?.familyStats 
                  ? `${report.familyStats.activeStudents}/${report.familyStats.totalStudents}`
                  : user.role === 'school' && report?.schoolStats
                  ? `${report.schoolStats.activeStudents}/${report.schoolStats.totalStudents}`
                  : '0/0'
                }
              </p>
            </div>
            
            {/* Card 2 - Lições Concluídas */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow-lg" style={{ background: 'linear-gradient(to right, #10b981, #059669)' }}>
              <h3 className="text-sm font-medium text-white mb-1">📚 Lições Concluídas</h3>
              <p className="text-2xl font-bold text-white">
                {user.role === 'parent' && report?.familyStats 
                  ? report.familyStats.totalLessons
                  : user.role === 'school' && report?.schoolStats
                  ? report.schoolStats.totalLessons
                  : 0
                }
              </p>
            </div>
            
            {/* Card 3 - XP Total/Engajamento */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow-lg" style={{ background: 'linear-gradient(to right, #8b5cf6, #7c3aed)' }}>
              <h3 className="text-sm font-medium text-white mb-1">
                {user.role === 'parent' ? '⭐ XP Total' : '📊 Engajamento'}
              </h3>
              <p className="text-2xl font-bold text-white">
                {user.role === 'parent' && report?.familyStats 
                  ? report.familyStats.totalXp
                  : user.role === 'school' && report?.schoolStats
                  ? `${Math.round(report.schoolStats.engagementRate)}%`
                  : user.role === 'parent' ? 0 : '0%'
                }
              </p>
            </div>
            
            {/* Card 4 - Poupança Total/Nível Médio */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg shadow-lg" style={{ background: 'linear-gradient(to right, #f97316, #ea580c)' }}>
              <h3 className="text-sm font-medium text-white mb-1">
                {user.role === 'parent' ? '💰 Poupança Total' : '📈 Nível Médio'}
              </h3>
              <p className="text-2xl font-bold text-white">
                {user.role === 'parent' && report?.familyStats 
                  ? `R$ ${report.familyStats.totalSavings.toFixed(2)}`
                  : user.role === 'school' && report?.schoolStats
                  ? Math.round(report.schoolStats.averageLevel * 10) / 10
                  : user.role === 'parent' ? 'R$ 0,00' : 0
                }
              </p>
            </div>
          </div>

          {/* Cards específicos para estudantes */}
          {user.role === 'student' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg">
                <h3 className="text-sm font-medium text-white">Tempo Total</h3>
                <p className="text-2xl font-bold">{formatDuration(report.sessionDuration)}</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow-lg">
                <h3 className="text-sm font-medium text-white">Lições Completadas</h3>
                <p className="text-2xl font-bold">{report.userEngagement.totalLessons}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
                <h3 className="text-sm font-medium text-white">Conquistas</h3>
                <p className="text-2xl font-bold">{report.performance.achievements}</p>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg shadow-lg">
                <h3 className="text-sm font-medium text-white">Níveis Subidos</h3>
                <p className="text-2xl font-bold">{report.performance.levelUps}</p>
              </div>
            </div>
          )}
        </div>

        {/* Relatório Familiar */}
        {user.role === 'parent' && reportType === 'family' && report?.familySubjectProgress && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📚 Progresso Familiar por Matéria</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(report.familySubjectProgress).map(([subject, progress]) => (
                <div key={subject} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{subject}</h3>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{progress.completed} lições concluídas</span>
                    <span>{progress.students.size} filhos ativos</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((progress.completed / progress.total) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relatório da Escola */}
        {user.role === 'school' && reportType === 'school' && report?.schoolSubjectProgress && (
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
              📚 Progresso Escolar por Matéria
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(report.schoolSubjectProgress).map(([subject, progress]) => (
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
        )}

        {/* Ranking da Escola */}
        {user.role === 'school' && report?.schoolRanking && (
          <div 
            className="rounded-xl shadow-lg p-6 mb-6 border-2" 
            style={{ 
              backgroundColor: darkMode ? '#374151' : '#ffffff',
              borderColor: 'rgb(238, 145, 22)' 
            }}
          >
            <h2 
              className="text-2xl font-bold mb-4 text-center"
              style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
            >
              🏆 Top 10 Alunos da Escola
            </h2>
            <div className="space-y-3">
              {report.schoolRanking.map((student, index) => (
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
                        style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                      >
                        Nível {student.level} • {student.lessonsCompleted} lições
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{student.xp} XP</div>
                    <div 
                      className="text-sm"
                      style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                    >
                      {student.streak} 🔥
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção de Engajamento */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">📈 Engajamento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {Math.round(report.userEngagement.averageScore)}%
              </div>
              <p className="text-gray-600">Pontuação Média</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {report.userEngagement.perfectRate.toFixed(1)}%
              </div>
              <p className="text-gray-600">Taxa de Perfeição</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {formatTime(report.userEngagement.averageTimePerLesson)}
              </div>
              <p className="text-gray-600">Tempo Médio/Lição</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">
                {report.userEngagement.perfectLessons}
              </div>
              <p className="text-gray-600">Lições Perfeitas</p>
            </div>
          </div>
        </div>

        {/* Seção de Atividades */}
        <div 
          className="rounded-xl shadow-lg p-6 mb-6 border-2" 
          style={{ 
            backgroundColor: darkMode ? '#374151' : '#ffffff',
            borderColor: 'rgb(238, 145, 22)' 
          }}
        >
          <h2 
            className="text-2xl font-bold mb-4 text-center"
            style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
          >
            🎯 Atividades Recentes
          </h2>
          <div className="space-y-4">
            {report.eventsByType && Object.entries(report.eventsByType).map(([eventType, count]) => (
              <div 
                key={eventType} 
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: darkMode ? '#4b5563' : '#f9fafb' }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {eventType === 'lesson_complete' && '✅'}
                    {eventType === 'level_up' && '🎉'}
                    {eventType === 'achievement_unlock' && '🏆'}
                    {eventType === 'store_purchase' && '🛒'}
                    {eventType === 'navigation' && '🧭'}
                    {eventType === 'error' && '❌'}
                    {!['lesson_complete', 'level_up', 'achievement_unlock', 'store_purchase', 'navigation', 'error'].includes(eventType) && '📊'}
                  </span>
                  <span 
                    className="font-medium"
                    style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                  >
                    {eventType === 'lesson_complete' && 'Lições Completadas'}
                    {eventType === 'level_up' && 'Subidas de Nível'}
                    {eventType === 'achievement_unlock' && 'Conquistas Desbloqueadas'}
                    {eventType === 'store_purchase' && 'Compras na Loja'}
                    {eventType === 'navigation' && 'Navegações'}
                    {eventType === 'error' && 'Erros'}
                    {!['lesson_complete', 'level_up', 'achievement_unlock', 'store_purchase', 'navigation', 'error'].includes(eventType) && eventType}
                  </span>
                </div>
                <span className="text-lg font-bold text-primary">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Seção de Progresso (apenas para estudantes) */}
        {user.role === 'student' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Progresso Geral</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Nível e XP</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Nível Atual</span>
                      <span>{report.progress.currentLevel || user.progress?.level || 1}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(
                            ((report.progress.totalXp || user.progress?.xp || 0) / 
                             (report.progress.xpToNextLevel || 100)) * 100, 100
                          )}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {report.progress.totalXp || user.progress?.xp || 0} / {report.progress.xpToNextLevel || 100} XP
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Estatísticas</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">YüCoins:</span>
                    <span className="font-semibold">{user.progress?.yuCoins || 0} 💰</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ofensiva:</span>
                    <span className="font-semibold">{report.progress.streak || user.progress?.streak || 0} 🔥</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lições Concluídas:</span>
                    <span className="font-semibold">{user.progress?.completedLessons?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;