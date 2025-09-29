import React from 'react';

const LessonLayout = ({ title, timeSpent, onExit, children, icon, reviewMode }) => (
  <div className="h-screen lesson-background flex flex-col font-sans">
    {/* Header padronizado */}
    <div className="bg-white/90 backdrop-blur-md p-4 shadow-xl border-b-4 border-primary-dark rounded-b-3xl">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-gray-600 hover:text-primary transition text-2xl font-bold px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Sair da lição"
        >
          ←
        </button>
        <div className="flex items-center gap-2">
          {icon && <span className="text-3xl">{icon}</span>}
          <h1 className="text-2xl lg:text-3xl xl:text-4xl font-yufin font-bold text-primary drop-shadow-sm tracking-tight">{title}</h1>
        </div>
        <div className="text-sm text-gray-500 font-semibold min-w-[48px] text-right font-sans">{timeSpent}s</div>
      </div>
    </div>

    {/* Área central de conteúdo */}
    <div className="flex-1 flex items-center justify-center p-6 lg:p-8 xl:p-12 pb-20 lesson-content-background">
      <div className="bg-white/95 rounded-2xl shadow-2xl border-2 border-primary/20 p-6 lg:p-8 xl:p-12 max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl w-full animate-fade-in font-sans transition-all duration-300 overflow-y-auto">
        {reviewMode && (
          <div className="mb-4 p-3 rounded-xl bg-yellow-50 border border-yellow-300 text-yellow-800 text-center font-bold flex items-center justify-center gap-2 animate-fadeIn">
            <span className="text-xl">🔄</span> Modo Revisão Ativo — Nenhuma recompensa será computada
          </div>
        )}
        {children}
      </div>
    </div>
  </div>
);

export default LessonLayout; 