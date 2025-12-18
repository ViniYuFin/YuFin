import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

const ConfettiEffect = ({ onEnd }) => {
  useEffect(() => {
    console.log('ConfettiEffect: MONTADO');
    // Cria confetes simples usando divs e animação CSS
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);

    const colors = ['#FFD700', '#FF69B4', '#00CFFF', '#FF6347', '#7CFC00', '#EE9116'];
    const confettiCount = 40;
    const confettiElements = [];

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDelay = (Math.random() * 0.5) + 's';
      confettiContainer.appendChild(confetti);
      confettiElements.push(confetti);
    }

    // Remove confetes após 2.5s
    const timeout = setTimeout(() => {
      confettiElements.forEach(el => confettiContainer.removeChild(el));
      document.body.removeChild(confettiContainer);
      if (onEnd) onEnd();
      console.log('ConfettiEffect: DESMONTADO');
    }, 2500);

    return () => {
      clearTimeout(timeout);
      if (document.body.contains(confettiContainer)) {
        document.body.removeChild(confettiContainer);
        console.log('ConfettiEffect: DESMONTADO (cleanup)');
      }
    };
  }, [onEnd]);

  // Renderiza um portal vazio (apenas para manter o componente vivo)
  return ReactDOM.createPortal(null, document.body);
};

export default ConfettiEffect; 