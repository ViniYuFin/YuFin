import React, { useState } from 'react';
import { resetTour } from '../utils/tourConfigs';

const TourButton = ({ profile, onStartTour, darkMode = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleStartTour = () => {
    // Resetar o tour para permitir que seja visto novamente
    resetTour(profile);
    // Chamar a função para iniciar o tour
    onStartTour();
  };

  return (
    <button
      onClick={handleStartTour}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 border-2"
      style={{
        borderColor: 'rgb(238, 145, 22)',
        backgroundColor: isHovered ? 'rgb(238, 145, 22)' : 'transparent',
        color: isHovered ? '#ffffff' : 'rgb(238, 145, 22)'
      }}
    >
      <span className="text-lg">🎯</span>
      <span className="text-sm font-medium">Ver Tutorial</span>
    </button>
  );
};

export default TourButton;

