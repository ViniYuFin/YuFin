import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { apiGet, apiPost, apiPatch } from '../utils/apiService';
import notificationService from '../utils/notificationService';
import { storageService, STORAGE_KEYS } from '../utils/storageService';
import devModeService from '../utils/devModeService';
import gratuitoProgressService from '../services/GratuitoProgressService';
import InteractiveTour from './InteractiveTour';
import { studentTourSteps, shouldShowTour, markTourCompleted, handleMobileTourSkip, isMobileDevice } from '../utils/tourConfigs';

const StudentDashboard = ({ user, setUser, onNavigate, currentModule = 1 }) => {
  const [gradeProgress, setGradeProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(currentModule);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [gradeProgression, setGradeProgression] = useState(null);
  const [requestingProgression, setRequestingProgression] = useState(false);
  const progressBarRef = useRef(null);
  const [classes, setClasses] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showTour, setShowTour] = useState(false);
  
  // Cache e controle de chamadas para evitar rate limiting
  const lastLoadTimeRef = useRef({ gradeProgress: 0, classes: 0 });
  const loadingRef = useRef({ gradeProgress: false, classes: false });
  const CACHE_DURATION = 2000; // 2 segundos de cache entre chamadas

  // Função para finalizar o tour
  const handleFinishTour = () => {
    setShowTour(false);
    markTourCompleted('student');
  };

  // Função para iniciar o tour manualmente
  const handleStartTour = () => {
    setShowTour(true);
  };

  useEffect(() => {
    const now = Date.now();
    
    // Evitar chamadas duplicadas muito próximas
    if (now - lastLoadTimeRef.current.gradeProgress > CACHE_DURATION && !loadingRef.current.gradeProgress) {
      loadGradeProgress();
    }
    
    if (now - lastLoadTimeRef.current.classes > CACHE_DURATION && !loadingRef.current.classes) {
      loadClasses();
    }
    
    // Carregar preferência do modo escuro
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    // Verificar se deve mostrar o tour (desabilitado em mobile)
    if (shouldShowTour('student')) {
      setShowTour(true);
    } else {
      // Se for mobile, marcar como completado automaticamente
      handleMobileTourSkip('student');
    }
  }, [user]);

  // Listener para mudanças no Modo Dev
  useEffect(() => {
    const handleDevModeChange = () => {
      console.log('🔧 Modo Dev alterado, recarregando progresso...');
      loadGradeProgress();
    };

    window.addEventListener('devModeChanged', handleDevModeChange);
    
    return () => {
      window.removeEventListener('devModeChanged', handleDevModeChange);
    };
  }, []);

  // Carregar status da progressão após o progresso ser carregado
  useEffect(() => {
    if (gradeProgress && !loading) {
      loadGradeProgressionStatus();
    }
  }, [gradeProgress, loading]);

  useEffect(() => {
    // Atualizar o módulo selecionado quando currentModule mudar
    setSelectedModule(currentModule);
  }, [currentModule]);

  // Animar o progresso quando os dados forem carregados
  useEffect(() => {
    if (gradeProgress && progressBarRef.current) {
      const targetProgress = gradeProgress.progress.progressPercentage;
      console.log('🎬 Iniciando animação da barra:', { targetProgress });
      
      // Animar de 0 até o valor atual em 2 segundos
      const animationDuration = 2000; // 2 segundos
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        // Usar easing cubic-bezier para suavidade
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(targetProgress * easeOutCubic);
        
        setAnimatedProgress(currentValue);
        
        // Atualizar CSS custom property para a animação
        if (progressBarRef.current) {
          progressBarRef.current.style.setProperty('--target-width', `${currentValue}%`);
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          console.log('✅ Animação concluída:', { finalValue: currentValue });
        }
      };
      
      // Pequeno delay para começar a animação
      setTimeout(() => {
        animate();
      }, 300);
    }
  }, [gradeProgress]);

  const loadClasses = async () => {
    // Evitar chamadas duplicadas
    if (loadingRef.current.classes) {
      return;
    }
    
    const now = Date.now();
    if (now - lastLoadTimeRef.current.classes < CACHE_DURATION) {
      return;
    }
    
    try {
      loadingRef.current.classes = true;
      lastLoadTimeRef.current.classes = now;
      
      const classesData = await apiGet('/classes');
      setClasses(classesData);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      // Em caso de erro 429, aguardar antes de tentar novamente
      if (error.message && error.message.includes('429')) {
        lastLoadTimeRef.current.classes = now + 5000; // Aguardar 5 segundos
        notificationService.warning('Muitas requisições. Aguarde alguns segundos...');
      }
    } finally {
      loadingRef.current.classes = false;
    }
  };

  const getClassName = (classId) => {
    const classData = classes.find(c => c.id === classId);
    return classData ? classData.name : 'Turma não encontrada';
  };

  const loadGradeProgress = async () => {
    // Evitar chamadas duplicadas
    if (loadingRef.current.gradeProgress) {
      return;
    }
    
    const now = Date.now();
    if (now - lastLoadTimeRef.current.gradeProgress < CACHE_DURATION) {
      return;
    }
    
    try {
      loadingRef.current.gradeProgress = true;
      lastLoadTimeRef.current.gradeProgress = now;
      setLoading(true);
      console.log('🔄 Carregando progresso da série...');
      
      // Para usuários gratuitos, carregar TUDO do backend, apenas progresso será local
      if (user.isGratuito || user.role === 'student-gratuito') {
        // Carregar lições e estrutura do backend (igual usuários normais)
        const devMode = devModeService.isDevModeEnabled(user);
        const url = devMode 
          ? `/users/${user.id}/grade-progress?devMode=true`
          : `/users/${user.id}/grade-progress`;
        
        const backendProgress = await apiGet(url);
        console.log('📊 Dados carregados do backend para usuário gratuito:', backendProgress);
        
        // Inicializar progresso local se não existir
        if (!gratuitoProgressService.getProgress(user.id)) {
          gratuitoProgressService.initializeProgress(user.id, user.gradeId);
        }
        
        // Combinar dados do backend (lições) com progresso local
        const localProgress = gratuitoProgressService.getFormattedProgress(user.id);
        console.log('📊 Progresso local formatado:', localProgress);
        
        if (localProgress) {
          // Marcar lições como completadas baseado no progresso local
          const completedLessonIds = localProgress.progress.completedLessons.map(lesson => lesson.lessonId);
          console.log('🔍 DEBUG - completedLessonIds:', completedLessonIds);
          
          // Atualizar lições para marcar como completadas
          const updatedModules = { ...backendProgress.progress.byModule };
          Object.keys(updatedModules).forEach(moduleKey => {
            if (updatedModules[moduleKey] && updatedModules[moduleKey].lessons) {
              updatedModules[moduleKey].lessons = updatedModules[moduleKey].lessons.map(lesson => {
                const isCompleted = completedLessonIds.includes(lesson.id);
                console.log(`🔍 DEBUG - Lição ${lesson.title}: id=${lesson.id}, isCompleted=${isCompleted}`);
                return {
                  ...lesson,
                  isCompleted: isCompleted
                };
              });
              
              // Atualizar contadores do módulo com dados locais
              if (localProgress.progress.byModule[moduleKey]) {
                updatedModules[moduleKey].completed = localProgress.progress.byModule[moduleKey].completed;
                console.log(`🔍 DEBUG - Módulo ${moduleKey}: total=${updatedModules[moduleKey].total}, completed=${updatedModules[moduleKey].completed}`);
              }
            }
          });
          
          // Sincronizar total de lições por módulo do backend com progresso local
          Object.keys(updatedModules).forEach(moduleKey => {
            if (updatedModules[moduleKey] && localProgress.progress.byModule[moduleKey]) {
              // Atualizar total do backend para o progresso local
              localProgress.progress.byModule[moduleKey].total = updatedModules[moduleKey].total;
            }
          });

          // Salvar progresso local atualizado
          gratuitoProgressService.saveProgress(localProgress.progress);

          // Usar dados locais para progresso, mas manter estrutura do backend para lições
          const progressWithLocalData = {
            ...backendProgress,
            progress: {
              ...backendProgress.progress,
              // Sobrescrever com dados locais
              xp: localProgress.progress.xp,
              level: localProgress.progress.level,
              maxXp: localProgress.progress.maxXp,
              yuCoins: localProgress.progress.yuCoins,
              streak: localProgress.progress.streak,
              hearts: localProgress.progress.hearts,
              maxHearts: localProgress.progress.maxHearts,
              completedLessons: localProgress.progress.completedLessons,
              currentModule: localProgress.progress.currentModule,
              byModule: updatedModules, // Usar módulos atualizados com lições marcadas
              hasContent: true,
              // Calcular totalCompleted e totalLessons baseado no progresso local
              totalCompleted: localProgress.progress.completedLessons.length,
              totalLessons: 12, // Total de lições disponíveis
              progressPercentage: Math.round((localProgress.progress.completedLessons.length / 12) * 100)
            },
            isGratuito: true,
            maxModules: 3
          };
          
          setGradeProgress(progressWithLocalData);
        } else {
          // Fallback se não houver progresso local
          const progressWithGratuitoFlag = {
            ...backendProgress,
            isGratuito: true,
            maxModules: 3
          };
          setGradeProgress(progressWithGratuitoFlag);
        }
        return;
      }
      
      // Para usuários normais, usar API
      const devMode = devModeService.isDevModeEnabled(user);
      const url = devMode 
        ? `/users/${user.id}/grade-progress?devMode=true`
        : `/users/${user.id}/grade-progress`;
      
      const progress = await apiGet(url);
      console.log('📊 Progresso recebido:', progress);
      
      // Em modo dev, usar estrutura organizada por série
      if (devMode && progress.progress?.byModule) {
        // Se byModule é um objeto com séries, extrair apenas a série atual
        if (typeof progress.progress.byModule === 'object' && !Array.isArray(progress.progress.byModule)) {
          const currentGradeData = progress.progress.byModule[user.gradeId];
          if (currentGradeData) {
            // Converter para formato esperado pelo frontend
            progress.progress.byModule = currentGradeData;
            console.log('🔧 [DEV MODE] Usando dados da série:', user.gradeId);
          }
        }
      }
      
      setGradeProgress(progress);
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
      
      // Em caso de erro 429, aguardar antes de tentar novamente
      if (error.message && error.message.includes('429')) {
        lastLoadTimeRef.current.gradeProgress = Date.now() + 5000; // Aguardar 5 segundos
        notificationService.warning('Muitas requisições. Aguarde alguns segundos...');
      } else {
        // Para usuários gratuitos, não mostrar erro
        if (!(user.isGratuito || user.role === 'student-gratuito')) {
          notificationService.error('Erro ao carregar progresso da série');
        }
      }
    } finally {
      setLoading(false);
      loadingRef.current.gradeProgress = false;
    }
  };

  // Verificar se todos os módulos estão completos
  const areAllModulesCompleted = () => {
    if (!gradeProgress || !gradeProgress.progress) {
      return false;
    }
    
    // Se a série não tem conteúdo, não pode estar completa
    if (!gradeProgress.progress.hasContent) {
      return false;
    }
    
    const { byModule } = gradeProgress.progress;
    return Object.values(byModule).every(module => 
      module && module.completed === module.total && module.total > 0
    );
  };

  const loadGradeProgressionStatus = async () => {
    try {
      // Para usuários gratuitos, usar dados locais
      if (user.isGratuito || user.role === 'student-gratuito') {
        const localStatus = gratuitoProgressService.getProgressionStatus(user.id);
        setGradeProgression(localStatus);
        return;
      }
      
      // Para usuários normais, usar API
      const status = await apiGet(`/users/${user.id}/grade-progression-status`);
      setGradeProgression(status);
    } catch (error) {
      console.error('Erro ao carregar status da progressão:', error);
      // Para usuários gratuitos, definir status padrão
      if (user.isGratuito || user.role === 'student-gratuito') {
        setGradeProgression({
          canProgress: false,
          isGratuito: true,
          maxModules: 3
        });
      }
    }
  };

  const handleRequestGradeProgression = async () => {
    // Verificar se modo dev está ativo (com verificação de segurança)
    let devMode = false;
    try {
      // Verificar se modo dev está ativo
      devMode = devModeService && devModeService.isDevModeEnabled ? devModeService.isDevModeEnabled(user) : false;
    } catch (error) {
      console.warn('Erro ao verificar devMode:', error);
      devMode = false;
    }
    
    if (devMode) {
      // Em modo dev, usar rota real do backend
      console.log('🔧 [DEV MODE] Solicitando progressão real via backend');
      
      try {
        setRequestingProgression(true);
        const response = await apiPost(`/users/${user.id}/request-grade-progression`, {
          devMode: true
        });
        
        console.log('🔧 [DEV MODE] Resposta recebida:', response);
        console.log('🔧 [DEV MODE] Tipo da resposta:', typeof response);
        
        // Verificar se a resposta existe e tem a propriedade devMode
        if (response && typeof response === 'object' && response.hasOwnProperty('devMode') && response.devMode === true) {
          // Atualizar usuário local com nova série
          const updatedUser = { ...user, gradeId: response.nextGrade };
          setUser(updatedUser);
          
          // Recarregar progresso
          await loadGradeProgress();
          
          devModeService.logAction('GRADE_PROGRESSION_DEV', {
            userId: user.id,
            fromGrade: user.gradeId,
            toGrade: response.nextGrade,
            devModeBypass: true
          }, user);
          
          notificationService.success(response.message || 'Progressão realizada com sucesso');
        } else {
          console.warn('🔧 [DEV MODE] Resposta inesperada:', response);
          notificationService.error('Resposta inesperada do servidor');
        }
      } catch (error) {
        console.error('Erro na progressão em modo dev:', error);
        console.error('Detalhes do erro:', error.message, error.response);
        
        // Se o erro é do backend, mostrar mensagem específica
        if (error.message && error.message.includes('devMode')) {
          notificationService.error('Erro de configuração do servidor. Tente novamente.');
        } else {
          notificationService.error('Erro ao navegar para próxima série');
        }
      } finally {
        setRequestingProgression(false);
      }
      return;
    }
    
    try {
      setRequestingProgression(true);
      console.log('🚀 [DEBUG] Fazendo POST para request-grade-progression...');
      console.log('🚀 [DEBUG] URL:', `/users/${user.id}/request-grade-progression`);
      console.log('🚀 [DEBUG] User ID:', user.id);
      console.log('🚀 [DEBUG] User email:', user.email);
      console.log('🚀 [DEBUG] TESTE - Código atualizado em:', new Date().toISOString());
      
      const response = await apiPost(`/users/${user.id}/request-grade-progression`);
      console.log('✅ [DEBUG] Resposta recebida:', response);
      console.log('✅ [DEBUG] Tipo da resposta:', typeof response);
      console.log('✅ [DEBUG] Response é objeto?', response && typeof response === 'object');
      
      // Verificar se a resposta existe antes de acessar propriedades
      if (response && typeof response === 'object' && response.message) {
        notificationService.success(response.message);
        await loadGradeProgressionStatus(); // Recarregar status do backend
      } else {
        console.warn('❌ [DEBUG] Resposta inválida:', response);
        notificationService.error('Resposta inválida do servidor');
      }
      
    } catch (error) {
      console.error('❌ [DEBUG] Erro completo:', error);
      console.error('❌ [DEBUG] Error response:', error.response);
      console.error('❌ [DEBUG] Error message:', error.message);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      
      // Tratar diferentes tipos de erro
      let errorMessage = 'Erro ao solicitar progressão';
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
      }
      
      notificationService.error(errorMessage);
    } finally {
      setRequestingProgression(false);
    }
  };

  const handleReturnToPreviousGrade = async () => {
    // Verificar se modo dev está ativo para este usuário específico (com verificação de segurança)
    let devMode = false;
    try {
      // Verificar se modo dev está ativo
      devMode = devModeService && devModeService.isDevModeEnabled ? devModeService.isDevModeEnabled(user) : false;
    } catch (error) {
      console.warn('Erro ao verificar devMode:', error);
      devMode = false;
    }
    
    if (devMode) {
      // Em modo dev, usar rota real do backend
      console.log('🔧 [DEV MODE] Solicitando retorno real via backend');
      
      try {
        const response = await apiPost(`/users/${user.id}/return-to-previous-grade`, {
          devMode: true
        });
        
        console.log('🔧 [DEV MODE] Resposta recebida:', response);
        console.log('🔧 [DEV MODE] Tipo da resposta:', typeof response);
        
        // Verificar se a resposta existe e tem a propriedade devMode
        if (response && typeof response === 'object' && response.hasOwnProperty('devMode') && response.devMode === true) {
          // Atualizar usuário local com série anterior
          const updatedUser = { ...user, gradeId: response.previousGrade };
          setUser(updatedUser);
          
          // Recarregar progresso
          await loadGradeProgress();
          
          devModeService.logAction('GRADE_RETURN_DEV', {
            userId: user.id,
            fromGrade: user.gradeId,
            toGrade: response.previousGrade,
            devModeBypass: true
          }, user);
          
          notificationService.success(response.message || 'Retorno realizado com sucesso');
        } else {
          console.warn('🔧 [DEV MODE] Resposta inesperada:', response);
          notificationService.error('Resposta inesperada do servidor');
        }
      } catch (error) {
        console.error('Erro no retorno em modo dev:', error);
        console.error('Detalhes do erro:', error.message, error.response);
        
        // Se o erro é do backend, mostrar mensagem específica
        if (error.message && error.message.includes('devMode')) {
          notificationService.error('Erro de configuração do servidor. Tente novamente.');
        } else {
          notificationService.error('Erro ao retornar ao ano anterior');
        }
      }
      return;
    }
    
    try {
      const response = await apiPost(`/users/${user.id}/return-to-previous-grade`);
      
      // Verificar se a resposta existe antes de acessar propriedades
      if (response && typeof response === 'object' && response.message) {
        notificationService.success(response.message);
        
        // Atualizar usuário local
        const updatedUser = { ...user };
        updatedUser.gradeId = response.previousGrade;
        setUser(updatedUser);
        
        // Recarregar dados
        await loadGradeProgress();
        await loadGradeProgressionStatus();
      } else {
        console.warn('❌ [DEBUG] Resposta inválida:', response);
        notificationService.error('Resposta inválida do servidor');
      }
      
    } catch (error) {
      console.error('❌ [DEBUG] Erro completo:', error);
      console.error('❌ [DEBUG] Error response:', error.response);
      console.error('❌ [DEBUG] Error message:', error.message);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      
      // Tratar diferentes tipos de erro
      let errorMessage = 'Erro ao voltar ao ano anterior';
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
      }
      
      notificationService.error(errorMessage);
    }
  };

  const handleModuleChange = async (moduleNum) => {
    try {
      // Para usuários gratuitos, usar serviço local
      if (user.isGratuito || user.role === 'student-gratuito') {
        const updatedProgress = gratuitoProgressService.updateCurrentModule(user.id, moduleNum);
        
        if (updatedProgress) {
          setSelectedModule(moduleNum);
          storageService.save(STORAGE_KEYS.CURRENT_MODULE, moduleNum);
          const updatedUser = { ...user, currentModule: moduleNum };
          setUser(updatedUser);
        }
        return;
      }
      
      // Atualizar módulo no backend para usuários normais
      await apiPatch(`/users/${user.id}/current-module`, { currentModule: moduleNum });
      
      // Atualizar estado local
      setSelectedModule(moduleNum);
      
      // Atualizar localStorage
      storageService.save(STORAGE_KEYS.CURRENT_MODULE, moduleNum);
      
      // Atualizar usuário local
      const updatedUser = { ...user, currentModule: moduleNum };
      setUser(updatedUser);
      
    } catch (error) {
      console.error('Erro ao atualizar módulo:', error);
      notificationService.error('Erro ao atualizar módulo');
    }
  };

  const handleLessonClick = (lesson) => {
    console.log('🎯 Clique na lição:', lesson.title);
    console.log('  - canAccess (backend):', lesson.canAccess);
    console.log('  - isCompleted:', lesson.isCompleted);
    console.log('  - Módulo:', lesson.module, 'Ordem:', lesson.order);
    
    // Verificar se modo dev está ativo
    const devMode = devModeService.isDevModeEnabled(user);
    
    // Para usuários gratuitos, calcular canAccess localmente
    let canAccess = devMode || lesson.canAccess;
    
    if ((user.isGratuito || user.role === 'student-gratuito') && !devMode) {
      console.log(`🔍 DEBUG CLICK GRATUITO - Analisando clique na lição: ${lesson.title}`, {
        module: lesson.module,
        order: lesson.order,
        isGratuito: user.isGratuito,
        role: user.role,
        devMode: devMode
      });
      
      // Usuários gratuitos: liberar lições sequencialmente dentro dos módulos 1-3
      if (lesson.module <= 3) {
        // Verificar se é a primeira lição do módulo baseado na ordem global
        const isFirstLessonOfModule = (lesson.module === 1 && lesson.order === 1) || 
                                    (lesson.module === 2 && lesson.order === 4) || 
                                    (lesson.module === 3 && lesson.order === 7);
        
        if (isFirstLessonOfModule) {
          // Primeira lição de cada módulo: verificar se módulo anterior foi completado
          if (lesson.module === 1) {
            // Módulo 1: primeira lição sempre acessível
            canAccess = true;
            console.log(`✅ DEBUG CLICK GRATUITO - Módulo 1, primeira lição sempre acessível: ${lesson.title}`);
          } else {
            // Módulos 2 e 3: verificar se módulo anterior foi completado
            const previousModule = lesson.module - 1;
            const previousModuleProgress = gradeProgress?.progress?.byModule?.[previousModule];
            const isPreviousModuleComplete = previousModuleProgress && previousModuleProgress.completed >= 3;
            
            console.log(`🔍 DEBUG CLICK GRATUITO - Verificando módulo anterior para ${lesson.title}:`, {
              currentModule: lesson.module,
              previousModule: previousModule,
              previousModuleProgress: previousModuleProgress,
              previousModuleCompleted: previousModuleProgress?.completed,
              isPreviousModuleComplete: isPreviousModuleComplete,
              gradeProgress: gradeProgress,
              progressByModule: gradeProgress?.progress?.byModule
            });
            
            canAccess = isPreviousModuleComplete;
            console.log(`🔍 DEBUG CLICK GRATUITO - Resultado para ${lesson.title}: canAccess = ${canAccess}`);
          }
        } else {
          // Lições subsequentes: verificar se a lição anterior foi completada
          const moduleProgress = gradeProgress?.progress?.byModule?.[selectedModule];
          if (moduleProgress && moduleProgress.lessons) {
            const previousLesson = moduleProgress.lessons.find(l => l.order === lesson.order - 1);
            console.log(`🔍 DEBUG CLICK GRATUITO - Verificando lição anterior para ${lesson.title}:`, {
              previousLesson: previousLesson ? previousLesson.title : 'não encontrada',
              isCompleted: previousLesson ? previousLesson.isCompleted : false,
              order: lesson.order,
              moduleProgress: moduleProgress
            });
            
            if (previousLesson && previousLesson.isCompleted) {
              canAccess = true;
            } else {
              canAccess = false;
            }
            console.log(`🔍 DEBUG CLICK GRATUITO - Resultado para ${lesson.title}: canAccess = ${canAccess}`);
          } else {
            canAccess = false;
            console.log(`❌ DEBUG CLICK GRATUITO - moduleProgress não encontrado para ${lesson.title}`);
          }
        }
      } else {
        // Módulos 4+ bloqueados para usuários gratuitos
        canAccess = false;
        console.log(`❌ DEBUG CLICK GRATUITO - Módulo ${lesson.module} bloqueado para usuários gratuitos: ${lesson.title}`);
      }
    }
    
    console.log('  - canAccess (calculado):', canAccess);
    
    // Log da ação se em modo dev
    if (devMode) {
      devModeService.logAction('LESSON_ACCESS', {
        lessonId: lesson._id,
        lessonTitle: lesson.title,
        module: lesson.module,
        order: lesson.order,
        canAccess: canAccess,
        isCompleted: lesson.isCompleted,
        devModeBypass: true
      }, user);
    }
    
    // Verificar acesso baseado no canAccess calculado
    if (!devMode && !canAccess) {
      console.log('❌ Lição bloqueada!');
      notificationService.warning('Complete as lições anteriores primeiro!');
      return;
    }
    
    console.log('✅ Lição liberada, navegando...');
    // Passar informações sobre o módulo atual
    onNavigate('lesson', { 
      lessonId: lesson._id,
      currentModule: selectedModule,
      lessonModule: lesson.module
    });
  };

  const getModuleTitle = (moduleNumber) => {
    // Dados hardcoded para todas as séries - NOVA GRADE CURRICULAR
    const moduleTitlesByGrade = {
      '6º Ano': {
        1: "O que é dinheiro?",
        2: "Contas Simples",
        3: "Consumo Consciente",
        4: "Projeto Prático"
      },
      '7º Ano': {
        1: "Orçamento e Controle",
        2: "Consumo e Publicidade",
        3: "Introdução a Investimentos",
        4: "Segurança Financeira"
      },
      '8º Ano': {
        1: "Orçamento Familiar Avançado",
        2: "Crédito e Consumo",
        3: "Investimentos Básicos",
        4: "Impacto e Segurança"
      },
      '9º Ano': {
        1: "Finanças Pessoais",
        2: "Empreendedorismo Básico",
        3: "Introdução à Economia",
        4: "Ética e Segurança"
      },
      '1º Ano EM': {
        1: "Renda e Orçamento",
        2: "Investimentos e Poupança",
        3: "Tributação Básica",
        4: "Segurança e Consciência"
      },
      '2º Ano EM': {
        1: "Economia do Dia a Dia",
        2: "Mercado Financeiro",
        3: "Proteção e Risco",
        4: "Tecnologia e Inovação"
      },
      '3º Ano EM': {
        1: "Projeto de Vida Financeiro",
        2: "Economia Global",
        3: "Inovação e Futuro",
        4: "Legado e Cidadania Financeira"
      }
    };
    
    const gradeTitles = moduleTitlesByGrade[user.gradeId] || moduleTitlesByGrade['6º Ano'];
    return gradeTitles[moduleNumber] || `Módulo ${moduleNumber}`;
  };

  const getLessonDescription = (lesson) => {
    // Descrição especial para lições de "Revisão e Celebração"
    if (lesson.title && lesson.title.toLowerCase().includes('revisão e celebração')) {
      return "Revise tudo que aprendeu, celebre suas conquistas e prepare-se para novos desafios";
    }

    // Descrições baseadas na nova grade curricular
    const descriptionsByGrade = {
      '6º Ano': {
        1: {
          1: "Descubra o que é dinheiro e como ele funciona no nosso dia a dia",
          2: "Aprenda a contar e calcular com moedas e notas",
          3: "Entenda como o dinheiro é usado para comprar coisas"
        },
        2: {
          1: "Aprenda a fazer contas simples de adição e subtração com dinheiro",
          2: "Pratique cálculos básicos com preços e troco",
          3: "Desenvolva habilidades matemáticas fundamentais"
        },
        3: {
          1: "Entenda a diferença entre necessidades e desejos",
          2: "Aprenda a fazer escolhas inteligentes de consumo",
          3: "Desenvolva consciência sobre gastos e economia"
        },
        4: {
          1: "Aplique tudo que aprendeu em um projeto prático",
          2: "Crie seu primeiro orçamento pessoal",
          3: "Celebre suas conquistas e planeje o futuro"
        }
      },
      '7º Ano': {
        1: {
          1: "Aprenda a criar e gerenciar orçamentos pessoais",
          2: "Controle seus gastos e receitas de forma organizada",
          3: "Desenvolva disciplina financeira básica"
        },
        2: {
          1: "Entenda como a publicidade influencia suas compras",
          2: "Aprenda a resistir a impulsos de consumo",
          3: "Torne-se um consumidor mais consciente"
        },
        3: {
          1: "Descubra o que são investimentos e como funcionam",
          2: "Aprenda sobre poupança e rendimento",
          3: "Planeje seu futuro financeiro"
        },
        4: {
          1: "Proteja-se contra fraudes e golpes financeiros",
          2: "Aprenda sobre seguros e proteção",
          3: "Mantenha sua segurança financeira"
        }
      },
      '8º Ano': {
        1: {
          1: "Crie e gerencie orçamentos familiares completos",
          2: "Planeje finanças pessoais avançadas",
          3: "Desenvolva estratégias de planejamento financeiro"
        },
        2: {
          1: "Entenda como funciona o crédito e financiamento",
          2: "Aprenda sobre juros e parcelamentos",
          3: "Tome decisões conscientes sobre empréstimos"
        },
        3: {
          1: "Explore diferentes tipos de investimentos",
          2: "Aprenda sobre renda fixa e variável",
          3: "Construa uma carteira de investimentos"
        },
        4: {
          1: "Entenda o impacto social e ambiental do dinheiro",
          2: "Aprenda sobre investimento responsável",
          3: "Proteja-se contra riscos financeiros"
        }
      },
      '9º Ano': {
        1: {
          1: "Domine conceitos avançados de finanças pessoais",
          2: "Planeje objetivos financeiros de longo prazo",
          3: "Desenvolva estratégias de crescimento patrimonial"
        },
        2: {
          1: "Descubra o mundo do empreendedorismo",
          2: "Aprenda a criar e gerenciar um negócio",
          3: "Desenvolva habilidades de liderança financeira"
        },
        3: {
          1: "Entenda como a economia afeta suas finanças",
          2: "Aprenda sobre inflação e políticas econômicas",
          3: "Compreenda o contexto macroeconômico"
        },
        4: {
          1: "Desenvolva ética e responsabilidade financeira",
          2: "Aprenda sobre investimento sustentável",
          3: "Proteja-se contra riscos e fraudes avançadas"
        }
      },
      '1º Ano EM': {
        1: {
          1: "Gerencie renda e despesas de forma profissional",
          2: "Planeje orçamentos complexos e detalhados",
          3: "Desenvolva controle financeiro avançado"
        },
        2: {
          1: "Explore estratégias avançadas de investimento",
          2: "Aprenda sobre diversificação de carteira",
          3: "Maximize retornos com gestão de risco"
        },
        3: {
          1: "Entenda o sistema tributário brasileiro",
          2: "Aprenda sobre impostos e declarações",
          3: "Otimize sua situação fiscal"
        },
        4: {
          1: "Mantenha segurança em transações digitais",
          2: "Desenvolva consciência sobre privacidade financeira",
          3: "Proteja-se contra cibercrimes financeiros"
        }
      },
      '2º Ano EM': {
        1: {
          1: "Analise indicadores econômicos do dia a dia",
          2: "Entenda como a economia impacta suas decisões",
          3: "Desenvolva visão macroeconômica"
        },
        2: {
          1: "Explore o funcionamento do mercado financeiro",
          2: "Aprenda sobre bolsa de valores e derivativos",
          3: "Desenvolva estratégias de trading"
        },
        3: {
          1: "Proteja-se contra riscos financeiros complexos",
          2: "Aprenda sobre hedge e proteção de carteira",
          3: "Desenvolva gestão avançada de risco"
        },
        4: {
          1: "Explore fintechs e inovações financeiras",
          2: "Aprenda sobre blockchain e criptomoedas",
          3: "Prepare-se para o futuro das finanças"
        }
      },
      '3º Ano EM': {
        1: {
          1: "Planeje seu projeto de vida financeiro completo",
          2: "Defina metas de longo prazo e estratégias",
          3: "Prepare-se para a vida adulta financeira"
        },
        2: {
          1: "Entenda a economia global e seus impactos",
          2: "Aprenda sobre investimentos internacionais",
          3: "Desenvolva visão global das finanças"
        },
        3: {
          1: "Explore inovações e tendências futuras",
          2: "Prepare-se para mudanças no mercado financeiro",
          3: "Desenvolva adaptabilidade financeira"
        },
        4: {
          1: "Construa um legado financeiro responsável",
          2: "Desenvolva cidadania financeira ativa",
          3: "Contribua para uma sociedade financeiramente saudável"
        }
      }
    };

    const gradeDescriptions = descriptionsByGrade[lesson.gradeId] || descriptionsByGrade['6º Ano'];
    const moduleDescriptions = gradeDescriptions[lesson.module] || {};
    return moduleDescriptions[lesson.order] || lesson.description || "Aprenda conceitos importantes de educação financeira";
  };

  const getLessonTags = (lesson) => {
    // Tags especiais para lições de "Revisão e Celebração"
    if (lesson.title && lesson.title.toLowerCase().includes('revisão e celebração')) {
      return ["🎉 celebração", "📚 revisão", "🏆 conquistas", "🚀 futuro"];
    }

    // Tags baseadas na nova grade curricular
    const tagsByGrade = {
      '6º Ano': {
        1: ["dinheiro", "básico", "introdução"],
        2: ["matemática", "cálculos", "prática"],
        3: ["consumo", "consciência", "escolhas"],
        4: ["projeto", "aplicação", "celebração"]
      },
      '7º Ano': {
        1: ["orçamento", "controle", "organização"],
        2: ["publicidade", "consumo", "consciência"],
        3: ["investimentos", "poupança", "futuro"],
        4: ["segurança", "proteção", "prevenção"]
      },
      '8º Ano': {
        1: ["orçamento", "família", "planejamento"],
        2: ["crédito", "juros", "financiamento"],
        3: ["investimentos", "carteira", "risco"],
        4: ["impacto", "sustentabilidade", "responsabilidade"]
      },
      '9º Ano': {
        1: ["finanças", "pessoais", "avançado"],
        2: ["empreendedorismo", "negócios", "liderança"],
        3: ["economia", "inflação", "políticas"],
        4: ["ética", "sustentabilidade", "responsabilidade"]
      },
      '1º Ano EM': {
        1: ["renda", "orçamento", "profissional"],
        2: ["investimentos", "diversificação", "retorno"],
        3: ["tributação", "impostos", "otimização"],
        4: ["segurança", "digital", "privacidade"]
      },
      '2º Ano EM': {
        1: ["economia", "indicadores", "macro"],
        2: ["mercado", "financeiro", "trading"],
        3: ["risco", "proteção", "hedge"],
        4: ["tecnologia", "fintech", "inovação"]
      },
      '3º Ano EM': {
        1: ["projeto", "vida", "planejamento"],
        2: ["global", "internacional", "economia"],
        3: ["futuro", "inovação", "adaptabilidade"],
        4: ["legado", "cidadania", "responsabilidade"]
      }
    };

    const gradeTags = tagsByGrade[lesson.gradeId] || tagsByGrade['6º Ano'];
    const moduleTags = gradeTags[lesson.module] || ["educação financeira"];
    
    // Adicionar tags baseadas no tipo de lição
    const typeTags = {
      'budget-distribution': ['orçamento', 'distribuição'],
      'comparison': ['comparação', 'análise'],
      'calculation': ['cálculo', 'matemática'],
      'simulation': ['simulação', 'prática'],
      'project': ['projeto', 'aplicação']
    };

    const lessonTypeTags = typeTags[lesson.type] || [];
    
    return [...moduleTags, ...lessonTypeTags];
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty <= 3) return 'bg-green-500';
    if (difficulty <= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getAchievementCard = (moduleNum) => {
    // Usar dados do backend se disponíveis
    if (gradeProgress && gradeProgress.grade && gradeProgress.grade.achievements) {
      const achievement = gradeProgress.grade.achievements.find(a => a.id === `module_${moduleNum}_complete`);
      if (achievement) {
        return {
          title: `${achievement.icon} ${achievement.title}`,
          description: achievement.description,
          reward: `${achievement.rewards.yuCoins} YüCoins + ${achievement.rewards.xp} XP`,
          icon: achievement.icon
        };
      }
    }
    
    // Fallback para dados hardcoded apenas para séries antigas
    const achievementsByGrade = {
      '6º Ano': {
        1: {
          title: "🏆 Mestre do Dinheiro",
          description: "Complete todas as lições do módulo de introdução",
          reward: "50 YüCoins + 100 XP",
          icon: "💰"
        },
        2: {
          title: "🧮 Calculadora Humana", 
          description: "Domine a matemática financeira básica",
          reward: "75 YüCoins + 150 XP",
          icon: "📊"
        },
        3: {
          title: "💡 Consciência Total",
          description: "Desenvolva consciência financeira completa",
          reward: "100 YüCoins + 200 XP",
          icon: "🎯"
        },
        4: {
          title: "🚀 Projetista Financeiro",
          description: "Execute projetos práticos com sucesso",
          reward: "150 YüCoins + 300 XP",
          icon: "🏆"
        }
      },
      '7º Ano': {
        1: {
          title: "📊 Gestor de Orçamento",
          description: "Complete todas as lições do módulo de orçamento",
          reward: "75 YüCoins + 150 XP",
          icon: "📊"
        },
        2: {
          title: "🛒 Consumidor Inteligente", 
          description: "Domine o consumo consciente e inteligente",
          reward: "100 YüCoins + 200 XP",
          icon: "🛒"
        },
        3: {
          title: "💹 Investidor Iniciante",
          description: "Desenvolva conhecimentos sobre poupança e investimentos",
          reward: "125 YüCoins + 250 XP",
          icon: "💹"
        },
        4: {
          title: "🛡️ Protetor Financeiro",
          description: "Execute projetos de segurança financeira com sucesso",
          reward: "175 YüCoins + 350 XP",
          icon: "🛡️"
        }
      }
    };
    
    const gradeAchievements = achievementsByGrade[user.gradeId] || achievementsByGrade['6º Ano'];
    return gradeAchievements[moduleNum];
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 z-50">
        <div className="relative">
          {/* Spinner original */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          
          {/* Nome YuFin no centro */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="text-lg font-yufin"
              style={{
                background: 'linear-gradient(to bottom, #EE9116, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              YuFin
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gradeProgress) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Nenhuma série atribuída. Entre em contato com sua escola.</p>
      </div>
    );
  }

  const { grade, progress } = gradeProgress;
  const achievementCard = getAchievementCard(selectedModule);
  const moduleProgress = progress.byModule[selectedModule];
  
  // Debug para usuários gratuitos
  if (user.isGratuito || user.role === 'student-gratuito') {
    console.log('🔍 DEBUG GRATUITO - gradeProgress:', gradeProgress);
    console.log('🔍 DEBUG GRATUITO - progress:', progress);
    console.log('🔍 DEBUG GRATUITO - progress.byModule:', progress.byModule);
    console.log('🔍 DEBUG GRATUITO - selectedModule:', selectedModule);
    console.log('🔍 DEBUG GRATUITO - moduleProgress:', moduleProgress);
  }
  const isModuleCompleted = moduleProgress && moduleProgress.completed === moduleProgress.total && moduleProgress.total > 0;
  
  // Verificar se a conquista do módulo foi desbloqueada
  const moduleAchievementId = `module_${selectedModule}_complete`;
  const isAchievementUnlocked = user.progress?.achievements?.includes(moduleAchievementId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      {/* Tour Interativo */}
      {showTour && (
        <InteractiveTour
          isActive={showTour}
          onFinish={handleFinishTour}
          steps={studentTourSteps}
          profile="student"
          darkMode={darkMode}
        />
      )}
      {/* Header Fixo - Informações do Aluno */}
      <div className="fixed top-0 left-0 right-0 w-full bg-white shadow-lg z-50 rounded-b-xl tour-header" style={{ borderBottom: '3px solid #EE9116' }}>
        <div className="flex justify-between items-center h-16 lg:h-18 xl:h-20 px-6 lg:px-8 xl:px-12 w-full">
          {/* Lado Esquerdo - Informações do Usuário */}
          <div className="flex items-center space-x-4">
            {window.innerWidth >= 640 && (
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
            )}
            <div className="flex flex-col">
                <span className="text-base font-semibold text-gray-800">
                  {window.innerWidth < 640 ? (user.name?.split(' ')[0] || user.name) : user.name}
                </span>
                <div className="flex items-center space-x-2">
                  <span 
                    className="text-xs"
                    style={darkMode ? { color: '#ffffff' } : { color: '#6b7280' }}
                  >
                    {window.innerWidth < 640 ? `N${progress?.level || 1}` : `Nível ${progress?.level || 1}`}
                  </span>
                  <span className="text-xs text-primary font-medium">• {progress?.xp || 0}/{progress?.maxXp || 100} XP</span>
                </div>
              </div>
          </div>
          
          {/* Lado Direito - Métricas */}
          <div className="flex items-center space-x-4">
            {/* Card YüCoins */}
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg px-4 py-2 border-2 border-yellow-300 shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="text-lg">💰</span>
                <div className="text-center">
                  <div className="text-sm font-bold" style={{ color: '#EE9116' }}>{progress?.yuCoins || 0}</div>
                  <div 
                    className="text-xs"
                    style={darkMode ? { color: '#ffffff' } : { color: '#6b7280' }}
                  >
                    YüCoins
                  </div>
                </div>
              </div>
            </div>
            
            {/* Card Dias */}
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg px-4 py-2 border-2 border-yellow-300 shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🔥</span>
                <div className="text-center">
                  <div className="text-sm font-bold" style={{ color: '#EE9116' }}>{progress?.streak || 0}</div>
                  <div 
                    className="text-xs"
                    style={darkMode ? { color: '#ffffff' } : { color: '#6b7280' }}
                  >
                    Dias
                  </div>
                </div>
              </div>
            </div>
            
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
      </div>

      {/* Conteúdo Principal com Padding para Header Fixo */}
      <div className="pt-0">
        {/* Indicador de Modo Dev */}
        {devModeService.isDevModeEnabled(user) && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-red-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-pulse">
            🔧 MODO DEV ATIVO - Todas as séries e lições liberadas
          </div>
        )}
        {/* Espaçamento para evitar sobreposição com header superior fixo */}
        <div className="mt-12 h-64 pb-20"></div>
        {/* Card do 6º Ano */}
        <div className="w-full max-w-full px-4 sm:px-6 lg:max-w-6xl xl:max-w-7xl 2xl:max-w-9xl mx-auto lg:p-8 xl:p-12">
          <div className="bg-white rounded-lg p-8 shadow-lg border-2 border-orange-200 mb-8 tour-section-summary">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-orange-600">{grade.name}</h2>
                <p className="text-gray-600">{grade.description}</p>
              </div>
                          <div className="text-right">
              {progress.hasContent ? (
                <>
                  <div className="text-2xl font-bold text-orange-600">
                    {progress.totalCompleted}/{progress.totalLessons}
                  </div>
                  <div className="text-gray-600">lições concluídas</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-600">
                    Em breve
                  </div>
                </>
              )}
            </div>
            </div>
            
            {/* Informações da Turma */}
            <div 
              className="mb-4 p-3 rounded-lg border"
              style={darkMode 
                ? { backgroundColor: 'rgba(31, 41, 55, 0.5)', borderColor: 'rgba(75, 85, 99, 0.5)' }
                : { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🏫</span>
                  <div>
                    <div 
                      className="text-sm font-medium"
                      style={darkMode ? { color: '#e5e7eb' } : { color: '#374151' }}
                    >
                      {user.classId ? `Turma: ${getClassName(user.classId)}` : 'Sem turma atribuída'}
                    </div>
                    <div 
                      className="text-xs"
                      style={darkMode ? { color: '#9ca3af' } : { color: '#6b7280' }}
                    >
                      {user.gradeId} • {user.classId ? 'Turma ativa' : 'Aguardando atribuição'}
                    </div>
                  </div>
                </div>
                {!user.classId && (
                  <div 
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={darkMode 
                      ? { backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }
                      : { backgroundColor: '#fef3c7', color: '#92400e' }
                    }
                  >
                    {window.innerWidth >= 640 ? '⏳ Aguardando' : 'Aguardando'}
                  </div>
                )}
              </div>
            </div>

            {/* Barra de Progresso Animada */}
            {progress.hasContent ? (
              <>
                <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                  <div 
                    ref={progressBarRef}
                    className="progress-fill-animated rounded-full h-4 shadow-lg"
                    style={{ 
                      width: `${animatedProgress}%`,
                      '--target-width': `${animatedProgress}%`,
                      background: 'linear-gradient(90deg, #EE9116, #FFB300, #FF8F00, #EE9116)',
                      backgroundSize: '200% 100%'
                    }}
                  ></div>
                </div>
                <div className="text-center mt-3">
                  <span className="text-xl font-bold text-orange-600">
                    {animatedProgress}%
                  </span>
                  <span className="text-gray-600 ml-1"> completo</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                  <div className="w-full bg-gray-300 rounded-full h-4"></div>
                </div>
                <div className="text-center mt-3">
                  <span className="text-xl font-bold text-orange-600">
                    Conteúdo em desenvolvimento
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navegação de Módulos e Botão Próximo Ano */}
        <div className="w-full max-w-full px-4 sm:px-6 lg:max-w-6xl xl:max-w-7xl 2xl:max-w-9xl mx-auto lg:p-8 xl:p-12 mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 lg:flex lg:space-x-3 lg:overflow-x-auto tour-section-classes">
          {[1, 2, 3, 4].map(moduleNum => {
            const moduleData = progress.byModule[moduleNum];
            const isCompleted = moduleData && moduleData.completed === moduleData.total && moduleData.total > 0;
            
            return (
              <button
                key={moduleNum}
                onClick={() => handleModuleChange(moduleNum)}
                className={`px-4 py-3 sm:px-6 sm:py-4 rounded-xl font-semibold transition-all shadow-lg lg:flex-shrink-0 ${
                  selectedModule === moduleNum
                    ? 'bg-white text-orange-600 border-2 border-orange-500 transform scale-105'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-yellow-50 border-2 border-yellow-200'
                }`}
                style={darkMode ? {
                  backgroundColor: selectedModule === moduleNum ? '#374151' : isCompleted ? '#10b981' : '#374151',
                  color: selectedModule === moduleNum ? '#fb923c' : isCompleted ? '#ffffff' : '#ffffff',
                  borderColor: selectedModule === moduleNum ? '#fb923c' : isCompleted ? '#10b981' : '#6b7280'
                } : {}}
              >
                <div className="text-center">
                  <div 
                    className="text-lg font-bold"
                    style={darkMode ? { color: selectedModule === moduleNum ? '#fb923c' : '#ffffff' } : {}}
                  >
                    Módulo {moduleNum}
                  </div>
                  <div 
                    className="text-sm opacity-90"
                    style={darkMode ? { color: selectedModule === moduleNum ? '#fb923c' : '#e5e7eb' } : {}}
                  >
                    {moduleData ? `${moduleData.completed}/${moduleData.total}` : '0/0'}
                  </div>
                </div>
              </button>
            );
          })}
          
          {/* Botão Próximo Ano - Visível quando todos os módulos estão completos OU em devMode */}
          {(areAllModulesCompleted() || devModeService.isDevModeEnabled(user)) && (
            <div className="flex-shrink-0">
              {gradeProgression?.progression?.requested && !devModeService.isDevModeEnabled(user) ? (
                <div className="px-6 py-4 rounded-xl bg-blue-100 border-2 border-blue-300 shadow-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-700">⏳</div>
                    <div className="text-sm text-blue-600">Aguardando</div>
                    <div className="text-xs text-blue-500">Autorização</div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleRequestGradeProgression}
                  disabled={requestingProgression}
                  className={`px-6 py-4 rounded-xl font-semibold transition-all shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    devModeService.isDevModeEnabled(user) 
                      ? 'bg-gradient-to-b from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                      : 'bg-gradient-to-b from-primary to-secondary text-white hover:from-primary-dark hover:to-secondary-dark'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {devModeService.isDevModeEnabled(user) ? '🔧' : '🎓'}
                    </div>
                    <div className="text-sm">Próximo</div>
                    <div className="text-xs">Ano</div>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Botão Ano Anterior - Visível para todos que não estão no 6º Ano OU em devMode */}
          {(user.gradeId !== '6º Ano' || devModeService.isDevModeEnabled(user)) && (
            <div className="flex-shrink-0">
              <button
                onClick={handleReturnToPreviousGrade}
                disabled={user.isGratuito && !devModeService.isDevModeEnabled(user)}
                className={`px-6 py-4 rounded-xl font-semibold transition-all shadow-lg transform ${
                  user.isGratuito && !devModeService.isDevModeEnabled(user)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60' // Desabilitado para usuários gratuitos
                    : devModeService.isDevModeEnabled(user) 
                      ? 'bg-gradient-to-b from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 hover:scale-105'
                      : 'bg-gradient-to-b from-primary to-secondary text-white hover:from-primary-dark hover:to-secondary-dark hover:scale-105'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {user.isGratuito && !devModeService.isDevModeEnabled(user) 
                      ? '🔒' // Ícone de bloqueado para usuários gratuitos
                      : devModeService.isDevModeEnabled(user) 
                        ? '🔧' 
                        : '⬅️'
                    }
                  </div>
                  <div className="text-sm">Ano</div>
                  <div className="text-xs">Anterior</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Título do Módulo */}
        <motion.div
          key={selectedModule}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h3 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <span className="mr-3 text-4xl">📚</span>
            {getModuleTitle(selectedModule)}
          </h3>
          <div className="w-20 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded"></div>
        </motion.div>

        {/* Grid de Lições e Conquista */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 lg:gap-6">
          {/* Lições do Módulo */}
          {moduleProgress && moduleProgress.lessons ? moduleProgress.lessons.map((lesson, index) => {
            // Verificar se modo dev está ativo
            const devModeActive = devModeService.isDevModeEnabled(user);
            
            // Para usuários gratuitos, implementar lógica de liberação baseada no progresso local
            let canAccess = devModeActive || lesson.canAccess;
            
            if ((user.isGratuito || user.role === 'student-gratuito') && !devModeActive) {
              console.log(`🔍 DEBUG GRATUITO - Analisando lição: ${lesson.title}`, {
                module: lesson.module,
                order: lesson.order,
                isGratuito: user.isGratuito,
                role: user.role,
                devModeActive: devModeActive
              });
              
              // Usuários gratuitos: liberar lições sequencialmente dentro dos módulos 1-3
              if (lesson.module <= 3) {
                // Verificar se é a primeira lição do módulo baseado na ordem global
                const isFirstLessonOfModule = (lesson.module === 1 && lesson.order === 1) || 
                                            (lesson.module === 2 && lesson.order === 4) || 
                                            (lesson.module === 3 && lesson.order === 7);
                
                if (isFirstLessonOfModule) {
                  // Primeira lição de cada módulo: verificar se módulo anterior foi completado
                  if (lesson.module === 1) {
                    // Módulo 1: primeira lição sempre acessível
                    canAccess = true;
                    console.log(`✅ DEBUG GRATUITO - Módulo 1, primeira lição sempre acessível: ${lesson.title}`);
                  } else {
                    // Módulos 2 e 3: verificar se módulo anterior foi completado
                    const previousModule = lesson.module - 1;
                    const previousModuleProgress = gradeProgress?.progress?.byModule?.[previousModule];
                    const isPreviousModuleComplete = previousModuleProgress && previousModuleProgress.completed >= 3;
                    
                    console.log(`🔍 DEBUG GRATUITO - Verificando módulo anterior para ${lesson.title}:`, {
                      currentModule: lesson.module,
                      previousModule: previousModule,
                      previousModuleProgress: previousModuleProgress,
                      previousModuleCompleted: previousModuleProgress?.completed,
                      isPreviousModuleComplete: isPreviousModuleComplete,
                      gradeProgress: gradeProgress,
                      progressByModule: gradeProgress?.progress?.byModule
                    });
                    
                    canAccess = isPreviousModuleComplete;
                    console.log(`🔍 DEBUG GRATUITO - Resultado para ${lesson.title}: canAccess = ${canAccess}`);
                  }
                } else {
                  // Lições subsequentes: verificar se a lição anterior foi completada
                  const previousLesson = moduleProgress.lessons.find(l => l.order === lesson.order - 1);
                  console.log(`🔍 DEBUG GRATUITO - Verificando lição anterior para ${lesson.title}:`, {
                    previousLesson: previousLesson ? previousLesson.title : 'não encontrada',
                    isCompleted: previousLesson ? previousLesson.isCompleted : false,
                    order: lesson.order,
                    moduleProgress: moduleProgress
                  });
                  
                  if (previousLesson && previousLesson.isCompleted) {
                    canAccess = true;
                  } else {
                    canAccess = false;
                  }
                  console.log(`🔍 DEBUG GRATUITO - Resultado para ${lesson.title}: canAccess = ${canAccess}`);
                }
              } else {
                // Módulos 4+ bloqueados para usuários gratuitos
                canAccess = false;
                console.log(`❌ DEBUG GRATUITO - Módulo ${lesson.module} bloqueado para usuários gratuitos: ${lesson.title}`);
              }
            }
            
            console.log(`📋 Renderizando lição ${index + 1}:`, {
              title: lesson.title,
              canAccess: lesson.canAccess,
              devModeAccess: canAccess,
              isCompleted: lesson.isCompleted,
              module: lesson.module,
              order: lesson.order,
              id: lesson.id
            });
            
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-xl shadow-lg border-2 transition-all cursor-pointer transform hover:scale-105 min-h-64 flex flex-col lg:h-80 hover:shadow-2xl ${
                  lesson.isCompleted
                    ? 'border-green-500 shadow-green-200'
                    : canAccess
                    ? devModeActive && !lesson.canAccess
                      ? 'border-purple-300 hover:border-purple-400 shadow-purple-200'
                      : 'border-yellow-300 hover:border-orange-400 shadow-yellow-200'
                    : 'border-gray-300 opacity-60'
                }`}
                onClick={() => handleLessonClick(lesson)}
              >
              {/* Conteúdo da Lição */}
              <div className="p-6 flex flex-col h-full">
                {/* SEÇÃO 1: Título e Indicador de Dificuldade - Altura fixa */}
                <div className="flex items-start justify-between mb-4" style={{ height: '3rem' }}>
                  <h4 className="font-bold text-gray-800 text-lg flex-1 pr-2 leading-tight" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>{lesson.title}</h4>
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getDifficultyColor(lesson.difficulty)}`} style={{ marginTop: '0.5rem' }}></div>
                </div>
                
                {/* SEÇÃO 2: Descrição - Altura fixa para 2 linhas */}
                <div className="mb-4" style={{ height: '3rem', display: 'flex', alignItems: 'flex-start' }}>
                  <p className="text-gray-600 text-sm leading-tight" style={{ lineHeight: '1.4rem' }}>{getLessonDescription(lesson)}</p>
                </div>
                
                {/* SEÇÃO 3: Tags - Altura fixa */}
                <div className="mb-4" style={{ height: '2.5rem', display: 'flex', alignItems: 'center' }}>
                  <div className="flex flex-wrap gap-1">
                    {getLessonTags(lesson).length > 0 ? (
                      getLessonTags(lesson).slice(0, 2).map(tag => (
                        <span 
                          key={tag} 
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={darkMode 
                            ? { backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }
                            : { backgroundColor: '#fef3c7', color: '#92400e' }
                          }
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={darkMode 
                          ? { backgroundColor: 'rgba(156, 163, 175, 0.2)', color: '#d1d5db' }
                          : { backgroundColor: '#f3f4f6', color: '#4b5563' }
                        }
                      >
                        Sem tags
                      </span>
                    )}
                  </div>
                </div>

                {/* SEÇÃO 4: Tempo e Progresso - Altura fixa */}
                <div className="mb-4" style={{ height: '2rem', display: 'flex', alignItems: 'center' }}>
                  <div className="flex items-center justify-between text-sm w-full">
                    <span 
                      style={darkMode ? { color: '#ffffff' } : { color: '#6b7280' }}
                    >
                      ⏱️ {lesson.estimatedTime} min
                    </span>
                    <span 
                      style={darkMode ? { color: '#ffffff' } : { color: '#6b7280' }}
                    >
                      📊 {lesson.order}/12
                    </span>
                  </div>
                </div>

                {/* Espaçador flexível */}
                <div className="flex-grow"></div>

                {/* SEÇÃO 5: Botão de Ação - Altura fixa */}
                <button 
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    canAccess
                      ? lesson.isCompleted
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : devModeActive && !lesson.canAccess
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-orange-400 text-white cursor-not-allowed'
                  }`}
                  style={{
                    backgroundColor: canAccess 
                      ? lesson.isCompleted 
                        ? '#10b981' 
                        : devModeActive && !lesson.canAccess
                        ? '#7c3aed'
                        : '#ea580c'
                      : '#fb923c',
                    color: 'white',
                    height: '3rem'
                  }}
                >
                  {canAccess ? (
                    lesson.isCompleted ? 'Revisar' : 
                    devModeActive && !lesson.canAccess ? '🔧 Dev' : 'Começar'
                  ) : 'Bloqueado'}
                </button>
              </div>
            </motion.div>
          );
        }) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">Nenhuma lição disponível para este módulo.</p>
          </div>
        )}

          {/* Card de Conquista */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`relative bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg border-2 transition-all hover:shadow-2xl ${
              isModuleCompleted ? 'border-yellow-400 shadow-yellow-200' : 'border-gray-300'
            }`}
            style={darkMode ? {
              background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
              borderColor: isModuleCompleted ? '#fbbf24' : '#6b7280'
            } : {}}
          >
            <div className="p-6 text-white">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{achievementCard.icon}</div>
                <h4 
                  className="font-bold text-lg mb-2"
                  style={darkMode ? { color: '#ffffff' } : {}}
                >
                  {achievementCard.title}
                </h4>
                <p 
                  className="text-purple-100 text-sm mb-4"
                  style={darkMode ? { color: '#e5e7eb' } : {}}
                >
                  {achievementCard.description}
                </p>
              </div>
              
              <div 
                className="bg-white bg-opacity-20 rounded-lg p-3 mb-4"
                style={darkMode ? { backgroundColor: 'rgba(255, 255, 255, 0.1)' } : {}}
              >
                <div className="text-center">
                  <div 
                    className="text-sm text-purple-600 font-semibold"
                    style={darkMode ? { color: '#ffffff' } : {}}
                  >
                    Recompensa
                  </div>
                  <div 
                    className="font-bold text-purple-900 !important" 
                    style={darkMode ? { color: '#ffffff' } : { color: '#581c87' }}
                  >
                    {achievementCard.reward}
                  </div>
                </div>
              </div>

              <div className="text-center">
                {isModuleCompleted ? (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">🎉</span>
                    <span 
                      className="font-bold text-white"
                      style={darkMode ? { color: '#ffffff' } : {}}
                    >
                      {isAchievementUnlocked ? 'Conquistado!' : 'Módulo Completo!'}
                    </span>
                  </div>
                ) : (
                  <div className="text-center">
                    <div 
                      className="text-sm text-purple-100 mb-2"
                      style={darkMode ? { color: '#e5e7eb' } : {}}
                    >
                      Progresso
                    </div>
                    <div 
                      className="font-bold text-white"
                      style={darkMode ? { color: '#ffffff' } : {}}
                    >
                      {moduleProgress ? `${moduleProgress.completed}/${moduleProgress.total}` : '0/0'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Espaçamento para evitar sobreposição com menu inferior fixo */}
        <div className="mt-12 h-64 pb-20"></div>
        </div>
      </div>
    </div>
  );
  };
  
export default StudentDashboard;