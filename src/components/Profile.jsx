import React from 'react';

const Profile = ({ user }) => {
  const medals = user.progress.completedLessons.length;

  return (
    <div className="min-h-screen bg-interface flex flex-col items-center p-4 pb-20" role="main" aria-label="Tela de Perfil">
      <h1 className="text-4xl font-yufin text-primary mb-8 animate-fadeIn" aria-label="Título do Perfil">Perfil do Usuário 🐷</h1>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-20 h-20 bg-teal rounded-full flex items-center justify-center">
            <span className="text-2xl">😊 {user.progress.avatar.accessory || 'Sem acessório'}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold" aria-label="Nome do Usuário">{user.name}</h2>
            <p className="text-gray-600" aria-label="Nível do Usuário">6º Ano - Nível {Math.floor(user.progress.xp / user.progress.maxXp) + 1}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p><strong>XP:</strong> {user.progress.xp}/{user.progress.maxXp}</p>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div className="bg-teal h-4 rounded-full" style={{ width: `${(user.progress.xp / user.progress.maxXp) * 100}%` }}></div>
          </div>
          <p><strong>YüCoins:</strong> {user.progress.yuCoins}</p>
          <p><strong>Streak:</strong> {user.progress.streak} dias 🔥</p>
          <p><strong>Medalhas:</strong> {medals} 🏅</p>
          <p><strong>Corações:</strong> {user.progress.hearts} ❤️</p>
        </div>
        <button
          onClick={() => alert('Poupí: Edite seu avatar na loja!')}
          className="mt-4 w-full text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition transform hover:scale-105"
          style={{ backgroundColor: 'rgb(238, 145, 22)' }}
          aria-label="Editar Perfil"
        >
          Editar Perfil
        </button>
      </div>
    </div>
  );
};

export default Profile;