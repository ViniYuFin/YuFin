import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { apiGet, apiPost, apiPatch } from '../utils/apiService';
import notificationService from '../utils/notificationService';
import { storageService, STORAGE_KEYS } from '../utils/storageService';
import devModeService from '../utils/devModeService';

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

  useEffect(() => {
    loadGradeProgress();
    loadClasses();
    
    // Carregar preferência do modo escuro
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
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
    try {
      const classesData = await apiGet('/classes');
      setClasses(classesData);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  const getClassName = (classId) => {
    const classData = classes.find(c => c.id === classId);
    return classData ? classData.name : 'Turma não encontrada';
  };

  const loadGradeProgress = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando progresso da série...');
      
      // Verificar se modo dev está ativo
      const devMode = devModeService.isDevModeEnabled();
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
      notificationService.error('Erro ao carregar progresso da série');
    } finally {
      setLoading(false);
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
      const status = await apiGet(`/users/${user.id}/grade-progression-status`);
      setGradeProgression(status);
    } catch (error) {
      console.error('Erro ao carregar status da progressão:', error);
    }
  };

  const handleRequestGradeProgression = async () => {
    // Verificar se modo dev está ativo
    const devMode = devModeService.isDevModeEnabled();
    
    if (devMode) {
      // Em modo dev, usar rota real do backend
      console.log('🔧 [DEV MODE] Solicitando progressão real via backend');
      
      try {
        setRequestingProgression(true);
        const response = await apiPost(`/users/${user.id}/request-grade-progression`, {
          devMode: true
        });
        
        if (response.devMode) {
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
          
          notificationService.success(response.message);
        }
      } catch (error) {
        console.error('Erro na progressão em modo dev:', error);
        notificationService.error('Erro ao navegar para próxima série');
      } finally {
        setRequestingProgression(false);
      }
      return;
    }
    
    try {
      setRequestingProgression(true);
      const response = await apiPost(`/users/${user.id}/request-grade-progression`);
      
      notificationService.success(response.message);
      await loadGradeProgressionStatus(); // Recarregar status do backend
      
    } catch (error) {
      console.error('Erro ao solicitar progressão:', error);
      notificationService.error(error.message || 'Erro ao solicitar progressão');
    } finally {
      setRequestingProgression(false);
    }
  };

  const handleReturnToPreviousGrade = async () => {
    // Verificar se modo dev está ativo
    const devMode = devModeService.isDevModeEnabled();
    
    if (devMode) {
      // Em modo dev, usar rota real do backend
      console.log('🔧 [DEV MODE] Solicitando retorno real via backend');
      
      try {
        const response = await apiPost(`/users/${user.id}/return-to-previous-grade`, {
          devMode: true
        });
        
        if (response.devMode) {
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
          
          notificationService.success(response.message);
        }
      } catch (error) {
        console.error('Erro no retorno em modo dev:', error);
        notificationService.error('Erro ao retornar ao ano anterior');
      }
      return;
    }
    
    try {
      const response = await apiPost(`/users/${user.id}/return-to-previous-grade`);
      
      notificationService.success(response.message);
      
      // Atualizar usuário local
      const updatedUser = { ...user };
      updatedUser.gradeId = response.previousGrade;
      setUser(updatedUser);
      
      // Recarregar dados
      await loadGradeProgress();
      await loadGradeProgressionStatus();
      
    } catch (error) {
      console.error('Erro ao voltar ao ano anterior:', error);
      notificationService.error(error.message || 'Erro ao voltar ao ano anterior');
    }
  };

  const handleModuleChange = async (moduleNum) => {
    try {
      // Atualizar módulo no backend
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
    console.log('  - canAccess:', lesson.canAccess);
    console.log('  - isCompleted:', lesson.isCompleted);
    console.log('  - Módulo:', lesson.module, 'Ordem:', lesson.order);
    
    // Verificar se modo dev está ativo
    const devMode = devModeService.isDevModeEnabled();
    
    // Log da ação se em modo dev
    if (devMode) {
      devModeService.logAction('LESSON_ACCESS', {
        lessonId: lesson._id,
        lessonTitle: lesson.title,
        module: lesson.module,
        order: lesson.order,
        canAccess: lesson.canAccess,
        isCompleted: lesson.isCompleted,
        devModeBypass: true
      }, user);
    }
    
    // Em modo dev, sempre permitir acesso
    if (!devMode && !lesson.canAccess) {
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
  const isModuleCompleted = moduleProgress && moduleProgress.completed === moduleProgress.total && moduleProgress.total > 0;
  
  // Verificar se a conquista do módulo foi desbloqueada
  const moduleAchievementId = `module_${selectedModule}_complete`;
  const isAchievementUnlocked = user.progress?.achievements?.includes(moduleAchievementId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header Fixo - Informações do Aluno */}
      <div className="fixed top-0 left-0 right-0 w-full bg-white shadow-lg z-50 rounded-b-xl" style={{ borderBottom: '3px solid #EE9116' }}>
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
                    {window.innerWidth < 640 ? `N${user.progress?.level || 1}` : `Nível ${user.progress?.level || 1}`}
                  </span>
                  <span className="text-xs text-primary font-medium">• {user.progress?.totalXp || user.progress?.xp || 0}/{user.progress?.xpToNextLevel || 100} XP</span>
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
                  <div className="text-sm font-bold" style={{ color: '#EE9116' }}>{user.progress?.yuCoins || 0}</div>
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
                  <div className="text-sm font-bold" style={{ color: '#EE9116' }}>{user.progress?.streak || 0}</div>
                  <div 
                    className="text-xs"
                    style={darkMode ? { color: '#ffffff' } : { color: '#6b7280' }}
                  >
                    Dias
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal com Padding para Header Fixo */}
      <div className="pt-0">
        {/* Indicador de Modo Dev */}
        {devModeService.isDevModeEnabled() && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-red-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-pulse">
            🔧 MODO DEV ATIVO - Todas as séries e lições liberadas
          </div>
        )}
        {/* Espaçamento para evitar sobreposição com header superior fixo */}
        <div className="mt-12 h-64 pb-20"></div>
        {/* Card do 6º Ano */}
        <div className="w-full max-w-full px-4 sm:px-6 lg:max-w-6xl xl:max-w-7xl 2xl:max-w-9xl mx-auto lg:p-8 xl:p-12">
          <div className="bg-white rounded-lg p-8 shadow-lg border-2 border-orange-200 mb-8">
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
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🏫</span>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      {user.classId ? `Turma: ${getClassName(user.classId)}` : 'Sem turma atribuída'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.gradeId} • {user.classId ? 'Turma ativa' : 'Aguardando atribuição'}
                    </div>
                  </div>
                </div>
                {!user.classId && (
                  <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 lg:flex lg:space-x-3 lg:overflow-x-auto">
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
          
          {/* Botão Próximo Ano */}
          {(areAllModulesCompleted() || devModeService.isDevModeEnabled()) && (
            <div className="flex-shrink-0">
              {gradeProgression?.progression?.requested && !devModeService.isDevModeEnabled() ? (
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
                    devModeService.isDevModeEnabled() 
                      ? 'bg-gradient-to-b from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                      : 'bg-gradient-to-b from-primary to-secondary text-white hover:from-primary-dark hover:to-secondary-dark'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {devModeService.isDevModeEnabled() ? '🔧' : '🎓'}
                    </div>
                    <div className="text-sm">Próximo</div>
                    <div className="text-xs">Ano</div>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Botão Ano Anterior */}
          {(user.gradeId !== '6º Ano' || devModeService.isDevModeEnabled()) && (
            <div className="flex-shrink-0">
              <button
                onClick={handleReturnToPreviousGrade}
                className={`px-6 py-4 rounded-xl font-semibold transition-all shadow-lg transform hover:scale-105 ${
                  devModeService.isDevModeEnabled() 
                    ? 'bg-gradient-to-b from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                    : 'bg-gradient-to-b from-primary to-secondary text-white hover:from-primary-dark hover:to-secondary-dark'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {devModeService.isDevModeEnabled() ? '🔧' : '⬅️'}
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
            const devModeActive = devModeService.isDevModeEnabled();
            const canAccess = devModeActive || lesson.canAccess;
            
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
                        <span key={tag} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
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