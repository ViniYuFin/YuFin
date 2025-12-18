import React, { useState, useEffect } from 'react';
import analyticsService from '../utils/analyticsService';
import notificationService from '../utils/notificationService';

const Store = ({ user, setUser, setActiveScreen }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Carregar preferência do modo escuro
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  const categories = [
    { id: 'all', name: 'Todos', icon: '🛒' },
    { id: 'clothes', name: 'Roupas', icon: '👕' },
    { id: 'accessories', name: 'Acessórios', icon: '🎩' },
    { id: 'effects', name: 'Efeitos', icon: '✨' },
    { id: 'powerups', name: 'Poderes', icon: '⚡' },
    { id: 'collectibles', name: 'Colecionáveis', icon: '🏆' }
  ];

  const items = [
    // Roupas
    { id: 'hat', name: 'Chapéu de Estudante', cost: 50, category: 'clothes', rarity: 'common', icon: '🎓', description: 'Um chapéu elegante para estudantes dedicados' },
    { id: 'glasses', name: 'Óculos Inteligentes', cost: 30, category: 'accessories', rarity: 'common', icon: '👓', description: 'Óculos que te fazem parecer mais inteligente' },
    { id: 'backpack', name: 'Mochila Financeira', cost: 70, category: 'clothes', rarity: 'rare', icon: '🎒', description: 'Mochila especial para guardar seus conhecimentos' },
    { id: 'tie', name: 'Gravata Executiva', cost: 40, category: 'clothes', rarity: 'common', icon: '👔', description: 'Gravata para ocasiões especiais' },
    { id: 'watch', name: 'Relógio de Ouro', cost: 100, category: 'accessories', rarity: 'epic', icon: '⌚', description: 'Relógio de ouro para mostrar que você é valioso' },
    
    // Acessórios
    { id: 'crown', name: 'Coroa de Rei', cost: 200, category: 'accessories', rarity: 'legendary', icon: '👑', description: 'Coroa para os verdadeiros reis do dinheiro' },
    { id: 'necklace', name: 'Colar de Diamantes', cost: 150, category: 'accessories', rarity: 'epic', icon: '💎', description: 'Colar brilhante para impressionar' },
    { id: 'ring', name: 'Anel Mágico', cost: 80, category: 'accessories', rarity: 'rare', icon: '💍', description: 'Anel que traz sorte financeira' },
    
    // Efeitos
    { id: 'sparkles', name: 'Efeito Brilhante', cost: 60, category: 'effects', rarity: 'rare', icon: '✨', description: 'Faz você brilhar como uma estrela' },
    { id: 'rainbow', name: 'Arco-íris', cost: 90, category: 'effects', rarity: 'epic', icon: '🌈', description: 'Arco-íris mágico que te segue' },
    { id: 'fire', name: 'Chamas de Sucesso', cost: 120, category: 'effects', rarity: 'epic', icon: '🔥', description: 'Chamas que mostram seu sucesso' },
    
    // Power-ups
    { id: 'xp_boost', name: 'Boost de XP', cost: 25, category: 'powerups', rarity: 'common', icon: '⚡', description: 'Ganha 50% mais XP por 1 hora' },
    { id: 'coin_multiplier', name: 'Multiplicador de YüCoins', cost: 35, category: 'powerups', rarity: 'rare', icon: '💰', description: 'Ganha 2x YüCoins por 30 minutos' },
    { id: 'streak_protector', name: 'Protetor de Ofensiva', cost: 45, category: 'powerups', rarity: 'rare', icon: '🛡️', description: 'Protege sua ofensiva por 1 dia' },
    { id: 'perfect_boost', name: 'Boost Perfeito', cost: 55, category: 'powerups', rarity: 'epic', icon: '⭐', description: 'Aumenta chance de lição perfeita' },
    
    // Colecionáveis
    { id: 'golden_pig', name: 'Porquinho Dourado', cost: 300, category: 'collectibles', rarity: 'legendary', icon: '🐷', description: 'Porquinho dourado raro e valioso' },
    { id: 'crystal_coin', name: 'Moeda de Cristal', cost: 250, category: 'collectibles', rarity: 'legendary', icon: '💎', description: 'Moeda de cristal colecionável' },
    { id: 'trophy', name: 'Troféu de Campeão', cost: 400, category: 'collectibles', rarity: 'legendary', icon: '🏆', description: 'Troféu para verdadeiros campeões' },
    { id: 'medal', name: 'Medalha de Honra', cost: 180, category: 'collectibles', rarity: 'epic', icon: '🥇', description: 'Medalha de honra por excelência' }
  ];

  const getRarityColor = (rarity) => {
    if (darkMode) {
      const colors = {
        common: 'text-gray-300',
        rare: 'text-blue-300',
        epic: 'text-purple-300',
        legendary: 'text-yellow-300'
      };
      return colors[rarity] || colors.common;
    } else {
      const colors = {
        common: 'text-gray-600',
        rare: 'text-blue-600',
        epic: 'text-purple-600',
        legendary: 'text-yellow-600'
      };
      return colors[rarity] || colors.common;
    }
  };

  const getRarityBackground = (rarity) => {
    if (darkMode) {
      const backgrounds = {
        common: 'bg-gray-700',
        rare: 'bg-blue-800',
        epic: 'bg-purple-800',
        legendary: 'bg-yellow-800'
      };
      return backgrounds[rarity] || backgrounds.common;
    } else {
      const backgrounds = {
        common: 'bg-gray-100',
        rare: 'bg-blue-100',
        epic: 'bg-purple-100',
        legendary: 'bg-yellow-100'
      };
      return backgrounds[rarity] || backgrounds.common;
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const buyItem = (item) => {
    if ((user?.progress?.yuCoins ?? 0) >= item.cost) {
      const updatedUser = {
        ...user,
        progress: { 
          ...user?.progress, 
          yuCoins: (user?.progress?.yuCoins ?? 0) - item.cost,
          inventory: [...(user?.progress?.inventory ?? []), item.id]
        }
      };
      
      setUser(updatedUser);
      localStorage.setItem('yufinUser', JSON.stringify(updatedUser));
      
      // Rastrear compra
      analyticsService.trackStorePurchase(item.id, item.name, item.cost);
      
      notificationService.success(`Parabéns! Você comprou ${item.name}!`);
      
      // Se for um poder, aplicar efeito
      if (item.category === 'powerups') {
        applyPowerUp(item);
      }
    } else {
      notificationService.error('YüCoins insuficientes! Complete mais lições para ganhar YüCoins.');
    }
  };

  const applyPowerUp = (powerUp) => {
    const powerUpEffects = {
      xp_boost: { type: 'xp_multiplier', value: 1.5, duration: 3600000 }, // 1 hora
      coin_multiplier: { type: 'coin_multiplier', value: 2, duration: 1800000 }, // 30 min
      streak_protector: { type: 'streak_protector', value: 1, duration: 86400000 }, // 1 dia
      perfect_boost: { type: 'perfect_chance', value: 1.3, duration: 7200000 } // 2 horas
    };

    const effect = powerUpEffects[powerUp.id];
    if (effect) {
      const activeEffects = user?.progress?.activeEffects ?? [];
      activeEffects.push({
        ...effect,
        id: powerUp.id,
        name: powerUp.name,
        appliedAt: Date.now()
      });

      const updatedUser = {
        ...user,
        progress: {
          ...user?.progress,
          activeEffects
        }
      };

      setUser(updatedUser);
      localStorage.setItem('yufinUser', JSON.stringify(updatedUser));
      
      notificationService.success(`Poder ${powerUp.name} ativado!`);
    }
  };

  const userInventory = user?.progress?.inventory ?? [];
  const ownedItems = userInventory.length;
  const totalItems = items.length;

  return (
    <div 
      className="min-h-screen bg-interface p-3 pb-20"
      style={darkMode ? { backgroundColor: '#111827' } : {}}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header compacto */}
        <div 
          className="bg-white rounded-xl shadow-lg p-4 mb-4 border-2" 
          style={{ 
            borderColor: 'rgb(238, 145, 22)',
            backgroundColor: darkMode ? '#374151' : 'white'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-between">
              <h1 
                className="text-2xl font-yufin text-primary"
                style={darkMode ? { color: '#fb923c' } : {}}
              >
                🛍️ Loja YüFin - {(user?.progress?.yuCoins ?? 0)} 💰
              </h1>
            </div>
            <div className="text-right text-sm">
              <div 
                className="text-gray-600"
                style={darkMode ? { color: '#e5e7eb' } : {}}
              >
                Coleção: {Math.round((ownedItems / totalItems) * 100)}%
              </div>
              <div 
                className="text-gray-600"
                style={darkMode ? { color: '#e5e7eb' } : {}}
              >
                Poderes: {(user?.progress?.activeEffects?.length ?? 0)}
              </div>
            </div>
          </div>
          
          {/* Estatísticas compactas */}
          <div className="grid grid-cols-3 gap-4">
            <div 
              className="p-3 rounded-lg text-center border-2" 
              style={{ 
                borderColor: 'rgb(238, 145, 22)',
                backgroundColor: darkMode ? '#1e40af' : '#dbeafe',
                color: darkMode ? '#ffffff' : '#1e3a8a'
              }}
            >
              <div className="text-xs font-medium mb-1">Possuídos</div>
              <div className="text-lg font-bold">{ownedItems}/{totalItems}</div>
            </div>
            <div 
              className="p-3 rounded-lg text-center border-2" 
              style={{ 
                borderColor: 'rgb(238, 145, 22)',
                backgroundColor: darkMode ? '#166534' : '#dcfce7',
                color: darkMode ? '#ffffff' : '#166534'
              }}
            >
              <div className="text-xs font-medium mb-1">Ativos</div>
              <div className="text-lg font-bold">{(user?.progress?.activeEffects?.length ?? 0)}</div>
            </div>
            <div 
              className="p-3 rounded-lg text-center border-2" 
              style={{ 
                borderColor: 'rgb(238, 145, 22)',
                backgroundColor: darkMode ? '#7c2d12' : '#fce7f3',
                color: darkMode ? '#ffffff' : '#be185d'
              }}
            >
              <div className="text-xs font-medium mb-1">Raros</div>
              <div className="text-lg font-bold">{items.filter(item => item.rarity === 'legendary').length}</div>
            </div>
          </div>
        </div>

        {/* Filtros compactos */}
        <div 
          className="bg-white rounded-xl shadow-lg p-3 mb-6 border-2" 
          style={{ 
            borderColor: 'rgb(238, 145, 22)',
            backgroundColor: darkMode ? '#374151' : 'white'
          }}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Categorias */}
            <div className="flex flex-wrap gap-4">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    selectedCategory === category.id
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ 
                    backgroundColor: selectedCategory === category.id ? 'rgb(238, 145, 22)' : (darkMode ? '#4b5563' : 'transparent'),
                    color: selectedCategory === category.id ? 'white' : (darkMode ? '#ffffff' : 'inherit')
                  }}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>
            
            {/* Busca */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                style={darkMode ? {
                  backgroundColor: '#4b5563',
                  borderColor: '#6b7280',
                  color: '#ffffff'
                } : {}}
              />
            </div>
          </div>
        </div>

        {/* Grid de Itens Otimizado */}
        <div 
          className="bg-white rounded-xl shadow-lg p-4 border-2" 
          style={{ 
            borderColor: 'rgb(238, 145, 22)',
            backgroundColor: darkMode ? '#374151' : 'white'
          }}
        >
          <h2 
            className="text-lg font-bold text-gray-800 mb-3 text-center"
            style={darkMode ? { color: '#ffffff' } : {}}
          >
            {selectedCategory === 'all' ? 'Todos os Itens' : categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          
          {filteredItems.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🔍</div>
              <p 
                className="text-gray-600 text-sm"
                style={darkMode ? { color: '#e5e7eb' } : {}}
              >
                Nenhum item encontrado com esses filtros.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredItems.map((item) => {
                const isOwned = userInventory.includes(item.id);
                const canAfford = (user?.progress?.yuCoins ?? 0) >= item.cost;
                
                return (
                  <div 
                    key={item.id} 
                    className={`${getRarityBackground(item.rarity)} rounded-lg p-3 border-2 transition-all hover:scale-105 flex flex-col ${
                      isOwned ? 'border-green-500' : (darkMode ? 'border-gray-600' : 'border-gray-200')
                    }`}
                  >
                    <div className="text-center mb-2 flex-1">
                      <div className="text-3xl mb-1">{item.icon}</div>
                      <h3 
                        className="font-bold text-sm mb-1"
                        style={darkMode ? { color: '#ffffff' } : { color: '#1f2937' }}
                      >
                        {item.name}
                      </h3>
                      <p className={`text-xs font-medium ${getRarityColor(item.rarity)} mb-1`}>
                        {item.rarity === 'common' ? 'Comum' : 
                         item.rarity === 'rare' ? 'Raro' : 
                         item.rarity === 'epic' ? 'Épico' : 
                         item.rarity === 'legendary' ? 'Lendário' : 
                         item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
                      </p>
                      <p 
                        className="text-xs mb-2"
                        style={darkMode ? { color: '#d1d5db' } : { color: '#6b7280' }}
                      >
                        {item.description}
                      </p>
                      <div 
                        className="text-lg font-bold mb-2 flex items-center justify-center space-x-1"
                        style={darkMode ? { color: '#fb923c' } : { color: 'rgb(238, 145, 22)' }}
                      >
                        <span>{item.cost}</span>
                        <span className="text-base">💰</span>
                      </div>
                    </div>
                    <button
                      onClick={() => buyItem(item)}
                      disabled={isOwned || !canAfford}
                      className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition mt-auto ${
                        isOwned
                          ? 'text-white cursor-not-allowed'
                          : canAfford
                          ? 'text-white hover:opacity-90'
                          : 'text-white cursor-not-allowed opacity-50'
                      }`}
                      style={{ 
                        backgroundColor: isOwned ? '#10B981' : canAfford ? 'rgb(238, 145, 22)' : '#9CA3AF'
                      }}
                    >
                      {isOwned ? '✅ Possuído' : canAfford ? 'Comprar' : 'YüCoins Insuficientes'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Store;