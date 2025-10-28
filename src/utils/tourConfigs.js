// Configurações de tour personalizadas para cada dashboard
import { isMobileDevice } from './deviceDetection';

// Re-exportar isMobileDevice para uso nos componentes
export { isMobileDevice };

export const studentTourSteps = [
  {
    target: '.tour-header',
    title: 'Este é seu dashboard principal!',
    content: 'Aqui você pode ver seu nível, XP, YüCoins, Ofensiva e como anda seu progresso. Vamos explorar juntos!',
    position: 'bottom',
    highlight: true
  },
  {
    target: '.tour-section-classes',
    title: 'Módulos de Aprendizado',
    content: 'Cada módulo contém lições que darão XP, YüCoins e dependendo até incentivos reais que serão acumulados em sua carteira virtual!',
    position: 'bottom',
    highlight: true
  },
  {
    target: '.tour-section-summary',
    title: 'Seu Progresso',
    content: 'Acompanhe quantas lições você finalizou e quantas faltam para concluir sua trilha de aprendizado. Aqui você também visualiza em qual turma você foi ou será alocado!',
    position: 'bottom',
    highlight: true
  },
  {
    target: '.tour-nav-intelligent-dashboard',
    title: 'IA',
    content: 'Acesse recursos de inteligência artificial para auxiliar em suas lições e tirar dúvidas sobre educação financeira. (Tutor em Desenvolvimento)',
    position: 'top',
    highlight: true
  },
  {
    target: '.tour-nav-friends',
    title: 'Amigos',
    content: 'Conecte-se com seus amigos, veja quem está aprendendo e incentive uns aos outros no caminho da educação financeira!',
    position: 'top',
    highlight: true
  },
  {
    target: '.tour-nav-challenges',
    title: 'Desafios',
    content: 'Participe de desafios especiais para ganhar recompensas extras e testar seus conhecimentos de forma divertida! (Em Desenvolvimento)',
    position: 'top',
    highlight: true
  },
  {
    target: '.tour-nav-store',
    title: 'Loja',
    content: 'Use seus YüCoins para personalizar seu avatar e comprar itens exclusivos na loja virtual! (Avatar em Desenvolvimento)',
    position: 'top',
    highlight: true
  },
  {
    target: '.tour-nav-wallet',
    title: 'Carteira',
    content: 'Acompanhe o saldo da poupança educativa e no momento certo resgate suas conquistas financeiras virtuais aplicando na prática tudo o que aprendeu!',
    position: 'top',
    highlight: true
  },
  {
    target: '.tour-nav-settings',
    title: 'Configurações',
    content: 'Configure suas preferências, notificações e outras opções personalizadas do seu perfil.',
    position: 'top',
    highlight: true
  }
];

export const parentTourSteps = [
  {
    target: '.tour-header',
    title: 'Bem-vindo ao Painel do Responsável!',
    content: 'Aqui você acompanha o progresso dos seus filhos e configura incentivos educacionais. Vamos conhecer todas as funcionalidades!',
    position: 'bottom',
    highlight: true
  },
  {
    target: '.tour-tab-overview',
    title: 'Visão Geral',
    content: 'Acesse uma visão completa do desempenho da sua família. Veja estatísticas gerais e acompanhe o progresso de todos os filhos.',
    position: 'bottom',
    highlight: true
  },
  {
    target: '.tour-section-children',
    title: 'Visão dos Seus Filhos',
    content: 'Veja o progresso de cada filho, suas conquistas, XP e desempenho em tempo real. Clique em um filho para ver detalhes.',
    position: 'bottom',
    highlight: true
  },
  {
    target: '.tour-tab-tokens',
    title: 'Gerenciamento de Tokens',
    content: 'Gere tokens para cadastrar novos filhos e gerencie quem tem acesso à plataforma. Cada token permite um novo cadastro.',
    position: 'bottom',
    highlight: true
  },
  {
    target: '.tour-nav-savings-config',
    title: 'Configuração de Poupança',
    content: 'Defina quanto cada lição, conquista ou ofensiva vale em dinheiro real. Isso incentiva o aprendizado dos seus filhos!',
    position: 'top',
    highlight: true
  },
  {
    target: '.tour-link-child-button',
    title: 'Vincular Filhos',
    content: 'Use este botão para vincular filhos existentes à sua conta.',
    position: 'left',
    highlight: true
  },
  {
    target: '.tour-nav-reports',
    title: 'Resumo da Família',
    content: 'Acesse relatórios completos sobre o desempenho dos seus filhos. Veja métricas importantes: total de filhos ativos, lições concluídas, XP total, nível médio e poupança acumulada.',
    position: 'top',
    highlight: true
  },
  {
    target: '.tour-nav-settings',
    title: 'Configurações',
    content: 'Configure suas preferências, notificações e outras opções personalizadas do seu perfil.',
    position: 'top',
    highlight: true
  }
];

export const schoolTourSteps = [
  {
    target: '.tour-header',
    title: 'Bem-vindo ao Painel da Escola!',
    content: 'Gerencie todas as turmas, alunos e acompanhe o desempenho educacional da sua escola. Vamos explorar as funcionalidades!',
    position: 'bottom',
    highlight: true
  },
  {
    target: '.tour-tab-overview',
    title: 'Visão Geral',
    content: 'Aqui você encontra uma visão completa da escola: estatísticas gerais, turmas e ranking dos alunos. Use para acompanhar o desempenho geral.',
    position: 'bottom',
    highlight: true
  },
  {
    target: '.tour-section-summary',
    title: 'Resumo da Escola',
    content: 'Veja métricas importantes: total de alunos, engajamento, XP total e nível médio da escola em um só lugar.',
    position: 'bottom',
    highlight: true
  },
  {
    target: '.tour-section-classes',
    title: 'Gestão de Turmas',
    content: 'Visualize e gerencie todas as turmas da escola. Veja estatísticas de engajamento, progresso e desempenho por turma.',
    position: 'bottom',
    highlight: true
  },
  {
    target: '.tour-tab-tokens',
    title: 'Tokens de Registro',
    content: 'Clique aqui para gerar tokens de cadastro para seus alunos. Cada token permite que um aluno se registre na plataforma.',
    position: 'bottom',
    highlight: true
  },
  {
    target: '.tour-tab-progression',
    title: 'Controle de Progressão',
    content: 'Gerencie solicitações de progressão de série dos alunos e mantenha o controle sobre o avanço educacional.',
    position: 'bottom',
    highlight: true
  },
  {
    target: '.tour-nav-classes',
    title: 'Navegação - Turmas',
    content: 'Use este botão na barra inferior para acessar a tela de gestão completa de turmas, onde você pode criar e editar turmas.',
    position: 'top',
    highlight: true
  },
  {
    target: '.tour-nav-reports',
    title: 'Navegação - Relatórios',
    content: 'Acesse relatórios detalhados sobre o desempenho da escola e use os dados para melhorar o ensino.',
    position: 'top',
    highlight: true
  },
  {
    target: '.tour-nav-news',
    title: 'Navegação - Notícias',
    content: 'Publicar notícias e avisos importantes para toda a escola. Mantenha a comunicação com alunos e responsáveis. (Em Desenvolvimento)',
    position: 'top',
    highlight: true
  },
  {
    target: '.tour-nav-settings',
    title: 'Configurações',
    content: 'Configure preferências da conta, notificações e outras opções personalizadas do seu painel.',
    position: 'top',
    highlight: true
  }
];

// Configurações gerais do tour
export const tourSettings = {
  // Chaves de localStorage para controle de persistência
  storageKeys: {
    student: 'tour_student_completed',
    parent: 'tour_parent_completed', 
    school: 'tour_school_completed'
  },
  
  // Configurações de comportamento
  behavior: {
    autoStart: true, // Inicia automaticamente no primeiro acesso
    allowSkip: true, // Permite pular o tour
    allowRestart: true, // Permite reiniciar o tour
    showProgress: true, // Mostra indicadores de progresso
    smoothScroll: true, // Scroll suave para elementos
    highlightElements: true // Destaca elementos com spotlight
  },
  
  // Configurações visuais
  visual: {
    spotlightPadding: 8, // Padding ao redor do elemento destacado
    tooltipMaxWidth: 320, // Largura máxima do tooltip
    tooltipMargin: 20, // Margem do tooltip em relação ao elemento
    animationDuration: 300, // Duração das animações em ms
    zIndex: 9999 // Z-index do overlay
  }
};

// Função para verificar se o tour já foi completado
export const isTourCompleted = (profile) => {
  const key = tourSettings.storageKeys[profile];
  return localStorage.getItem(key) === 'true';
};

// Função para verificar se deve mostrar o tour (desabilitado em mobile)
export const shouldShowTour = (profile) => {
  // Se for dispositivo móvel, não mostrar tutorial
  if (isMobileDevice()) {
    return false;
  }
  
  // Para desktop, usar a lógica original
  return !isTourCompleted(profile);
};

// Função para marcar o tour como completado
export const markTourCompleted = (profile) => {
  const key = tourSettings.storageKeys[profile];
  localStorage.setItem(key, 'true');
};

// Função para marcar tour como completado automaticamente em mobile
export const handleMobileTourSkip = (profile) => {
  if (isMobileDevice()) {
    markTourCompleted(profile);
    return true; // Indica que foi marcado como completado
  }
  return false;
};

// Função para resetar o tour (para administradores)
export const resetTour = (profile) => {
  const key = tourSettings.storageKeys[profile];
  localStorage.removeItem(key);
};

// Função para resetar todos os tours
export const resetAllTours = () => {
  Object.values(tourSettings.storageKeys).forEach(key => {
    localStorage.removeItem(key);
  });
};

