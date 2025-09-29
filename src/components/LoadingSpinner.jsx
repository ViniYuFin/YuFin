import React from 'react';

const LoadingSpinner = ({ message = "Carregando...", size = "medium" }) => {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-12 w-12",
    large: "h-16 w-16"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]} mb-4`}></div>
      <p className="text-gray-600 text-center">{message}</p>
    </div>
  );
};

export default LoadingSpinner; 