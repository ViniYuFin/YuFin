import React from 'react';

const News = ({ user }) => {
  return (
    <div className="min-h-screen bg-interface flex flex-col items-center p-4 pb-20">
      <h1 className="text-4xl font-yufin text-primary mb-8">Notícias 🐷</h1>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
        <h2 className="text-2xl font-bold mb-4">Últimas Novidades</h2>
        <p className="text-gray-600">Nenhuma notícia disponível no momento.</p>
      </div>
    </div>
  );
};

export default News;