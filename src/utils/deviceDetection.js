// Utilitário para detectar dispositivos móveis
export const isMobileDevice = () => {
  // Verificar user agent
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Padrões comuns de dispositivos móveis
  const mobilePatterns = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
    /Mobile/i
  ];
  
  // Verificar se é um dispositivo móvel pelo user agent
  const isMobileByUserAgent = mobilePatterns.some(pattern => pattern.test(userAgent));
  
  // Verificar largura da tela (breakpoint mobile)
  const isMobileByScreen = window.innerWidth < 768; // Tailwind's md breakpoint
  
  // Verificar se é touch device
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Considerar mobile se:
  // 1. User agent indica mobile OU
  // 2. Tela pequena E dispositivo touch
  return isMobileByUserAgent || (isMobileByScreen && isTouchDevice);
};

// Hook para detectar mudanças de dispositivo
export const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile;
};

// Função para verificar se deve mostrar tutorial (desabilitado em mobile)
export const shouldShowTour = (profile) => {
  // Se for dispositivo móvel, não mostrar tutorial
  if (isMobileDevice()) {
    return false;
  }
  
  // Para desktop, usar a lógica original
  const { isTourCompleted } = require('./tourConfigs');
  return !isTourCompleted(profile);
};

// Função para marcar tour como completado automaticamente em mobile
export const handleMobileTourSkip = (profile) => {
  if (isMobileDevice()) {
    const { markTourCompleted } = require('./tourConfigs');
    markTourCompleted(profile);
    return true; // Indica que foi marcado como completado
  }
  return false;
};

