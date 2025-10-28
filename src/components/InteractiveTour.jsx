import React, { useState, useEffect, useRef } from 'react';

const InteractiveTour = ({ 
  isActive, 
  onFinish, 
  steps = [], 
  profile = 'student',
  darkMode = false 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [spotlightPosition, setSpotlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const overlayRef = useRef(null);
  const tooltipRef = useRef(null);

  // Usar configuração específica do perfil ou steps customizados
  const tourSteps = steps.length > 0 ? steps : [];

  // Detectar mudanças de viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isActive && tourSteps.length > 0) {
      // Desabilitar scroll do body durante o tutorial
      document.body.style.overflow = 'hidden';
      
      // Adicionar delay para garantir que o DOM esteja renderizado
      const timer = setTimeout(() => {
        highlightElement(tourSteps[currentStep]);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        // Reabilitar scroll quando o tutorial finalizar
        document.body.style.overflow = '';
      };
    }
  }, [isActive, currentStep, tourSteps, isMobile]);

  const highlightElement = (step) => {
    const element = document.querySelector(step.target);
    if (!element) {
      console.warn(`Tour: Elemento não encontrado: ${step.target}`);
      return;
    }

    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Padding responsivo
    const padding = isMobile ? 8 : 10;

    // Posição do spotlight com padding
    setSpotlightPosition({
      top: rect.top + scrollTop - padding,
      left: rect.left + scrollLeft - padding,
      width: rect.width + (padding * 2),
      height: rect.height + (padding * 2)
    });

    // Tamanhos responsivos do tooltip
    const tooltipWidth = isMobile ? 300 : 384; // 320px mobile, 384px (max-w-md) desktop
    const tooltipHeight = isMobile ? 220 : 200; // Mais altura no mobile para acomodar botões
    const margin = isMobile ? 16 : 20; // p-4 mobile, margens maiores desktop
    const minMargin = isMobile ? 16 : 20; // Margem mínima responsiva
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Barra de navegação inferior tem 64px (h-16) + margem de segurança
    const bottomNavBarHeight = isMobile ? 64 + 16 : 64 + 20;
    
    // Altura efetiva disponível (viewport menos a barra de navegação)
    const effectiveViewportHeight = viewportHeight - bottomNavBarHeight;
    
    let finalPosition = step.position;

    // Tentar posição inicial baseada na configuração
    let initialTop, initialLeft;
    
    switch (step.position) {
      case 'top':
        initialTop = rect.top + scrollTop - tooltipHeight - margin;
        initialLeft = rect.left + scrollLeft + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        initialTop = rect.bottom + scrollTop + margin;
        initialLeft = rect.left + scrollLeft + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        initialTop = rect.top + scrollTop + (rect.height / 2) - (tooltipHeight / 2);
        initialLeft = rect.left + scrollLeft - tooltipWidth - margin;
        break;
      case 'right':
        initialTop = rect.top + scrollTop + (rect.height / 2) - (tooltipHeight / 2);
        initialLeft = rect.right + scrollLeft + margin;
        break;
      default:
        initialTop = rect.bottom + scrollTop + margin;
        initialLeft = rect.left + scrollLeft + (rect.width / 2) - (tooltipWidth / 2);
    }

    // Ajustar horizontalmente se sair dos limites
    let tooltipLeft = initialLeft;
    if (tooltipLeft < minMargin) tooltipLeft = minMargin;
    if (tooltipLeft + tooltipWidth > viewportWidth - minMargin) {
      tooltipLeft = viewportWidth - tooltipWidth - minMargin;
    }

    // Ajustar verticalmente usando effectiveViewportHeight
    let tooltipTop = initialTop;
    
    // Verificar se tooltip está fora da tela verticalmente
    if (tooltipTop < minMargin) {
      // Se tentou posicionar no topo mas não cabe, tentar embaixo
      if (step.position === 'top') {
        tooltipTop = rect.bottom + scrollTop + margin;
        finalPosition = 'bottom';
      } else {
        tooltipTop = minMargin;
      }
    }
    
    // CRÍTICO: Usar effectiveViewportHeight ao verificar se cabe embaixo
    if (tooltipTop + tooltipHeight > effectiveViewportHeight - minMargin) {
      // Se tentou posicionar embaixo mas não cabe devido à barra de navegação, tentar em cima
      if (step.position === 'bottom') {
        tooltipTop = rect.top + scrollTop - tooltipHeight - margin;
        finalPosition = 'top';
      } else if (step.position === 'left' || step.position === 'right') {
        // Para tooltips na lateral, centralizar verticalmente com o elemento
        tooltipTop = rect.top + scrollTop + (rect.height / 2) - (tooltipHeight / 2);
        // Mas garantir que não ultrapasse a effectiveViewportHeight
        if (tooltipTop + tooltipHeight > effectiveViewportHeight - minMargin) {
          tooltipTop = effectiveViewportHeight - tooltipHeight - minMargin;
        }
      } else {
        // Se já está no topo e não cabe, ajustar para dentro do espaço disponível
        tooltipTop = effectiveViewportHeight - tooltipHeight - minMargin;
      }
    }

    // Garantir que o tooltip está dentro da viewport após ajustes
    if (tooltipTop < minMargin) tooltipTop = minMargin;
    
    // CRÍTICO: Usar effectiveViewportHeight novamente aqui
    if (tooltipTop + tooltipHeight > effectiveViewportHeight - minMargin) {
      tooltipTop = effectiveViewportHeight - tooltipHeight - minMargin;
    }

    setTooltipPosition({ top: tooltipTop, left: tooltipLeft, finalPosition, width: tooltipWidth });
    setHighlightedElement(element);
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    setCurrentStep(0);
    setHighlightedElement(null);
    // Reabilitar scroll ao finalizar o tutorial
    document.body.style.overflow = '';
    onFinish();
  };

  if (!isActive || tourSteps.length === 0) {
    return null;
  }

  const currentStepData = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay com blur aplicado via máscara */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          maskImage: highlightedElement ? 
            `radial-gradient(ellipse ${spotlightPosition.width + (isMobile ? 16 : 20)}px ${spotlightPosition.height + (isMobile ? 16 : 20)}px at ${spotlightPosition.left + spotlightPosition.width / 2}px ${spotlightPosition.top + spotlightPosition.height / 2}px, transparent 50%, black 70%)` :
            'none',
          WebkitMaskImage: highlightedElement ? 
            `radial-gradient(ellipse ${spotlightPosition.width + (isMobile ? 16 : 20)}px ${spotlightPosition.height + (isMobile ? 16 : 20)}px at ${spotlightPosition.left + spotlightPosition.width / 2}px ${spotlightPosition.top + spotlightPosition.height / 2}px, transparent 50%, black 70%)` :
            'none'
        }}
      />
      


      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`absolute z-50 bg-white rounded-xl shadow-2xl border-2 ${isMobile ? 'p-4' : 'p-6'} ${isMobile ? 'max-w-xs' : 'max-w-md'}`}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: tooltipPosition.width || (isMobile ? 300 : 384),
          borderColor: 'rgb(238, 145, 22)',
          backgroundColor: darkMode ? '#374151' : '#ffffff'
        }}
      >
        {/* Seta do tooltip */}
        <div 
          className={`absolute ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`}
          style={{
            backgroundColor: darkMode ? '#374151' : '#ffffff',
            ...((tooltipPosition.finalPosition || currentStepData.position) === 'top' ? {
              bottom: isMobile ? '-6px' : '-8px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              borderTop: '2px solid rgb(238, 145, 22)',
              borderRight: '2px solid rgb(238, 145, 22)',
              borderBottom: 'none',
              borderLeft: 'none'
            } : (tooltipPosition.finalPosition || currentStepData.position) === 'bottom' ? {
              top: isMobile ? '-6px' : '-8px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              borderBottom: '2px solid rgb(238, 145, 22)',
              borderLeft: '2px solid rgb(238, 145, 22)',
              borderTop: 'none',
              borderRight: 'none'
            } : (tooltipPosition.finalPosition || currentStepData.position) === 'left' ? {
              right: isMobile ? '-6px' : '-8px',
              top: '50%',
              transform: 'translateY(-50%) rotate(45deg)',
              borderTop: '2px solid rgb(238, 145, 22)',
              borderLeft: '2px solid rgb(238, 145, 22)',
              borderBottom: 'none',
              borderRight: 'none'
            } : {
              left: isMobile ? '-6px' : '-8px',
              top: '50%',
              transform: 'translateY(-50%) rotate(45deg)',
              borderBottom: '2px solid rgb(238, 145, 22)',
              borderRight: '2px solid rgb(238, 145, 22)',
              borderTop: 'none',
              borderLeft: 'none'
            })
          }}
        />

        {/* Conteúdo do tooltip */}
        <div className="relative z-10">
          <h3 
            className={`font-bold mb-3 text-center ${isMobile ? 'text-lg' : 'text-xl'}`}
            style={{ color: darkMode ? '#ffffff' : 'rgb(238, 145, 22)' }}
          >
            {currentStepData.title}
          </h3>
          <p 
            className={`mb-4 leading-relaxed text-center ${isMobile ? 'text-xs' : 'text-sm'}`}
            style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
          >
            {currentStepData.content}
          </p>

          {/* Controles */}
          <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-center'}`}>
            <div className={`flex ${isMobile ? 'space-x-2 justify-center' : 'space-x-2'}`}>
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className={`rounded-lg border-2 transition-colors ${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
                  style={{
                    borderColor: 'rgb(238, 145, 22)',
                    color: 'rgb(238, 145, 22)',
                    backgroundColor: 'transparent'
                  }}
                >
                  Anterior
                </button>
              )}
              <button
                onClick={handleSkip}
                className={`hover:text-gray-700 transition-colors ${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
                style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
              >
                Pular
              </button>
            </div>

            <div className={`flex items-center ${isMobile ? 'justify-center space-x-2' : 'space-x-3'}`}>
              {/* Indicadores de progresso */}
              <div className="flex space-x-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`rounded-full transition-colors ${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${
                      index === currentStep ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className={`font-semibold text-white rounded-lg transition-colors ${isMobile ? 'px-4 py-1.5 text-xs' : 'px-6 py-2 text-sm'}`}
                style={{
                  backgroundColor: 'rgb(238, 145, 22)',
                  color: '#ffffff'
                }}
              >
                {currentStep === tourSteps.length - 1 ? 'Finalizar' : 'Próximo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTour;
