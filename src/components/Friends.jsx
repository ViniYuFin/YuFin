import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiService';
import analyticsService from '../utils/analyticsService';
import notificationService from '../utils/notificationService';

const Friends = ({ user, setUser, setActiveScreen }) => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState({
    sameClass: [],
    sameSchool: []
  });
  const [playerIdSearch, setPlayerIdSearch] = useState('');
  const [searchedPlayer, setSearchedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(false);
  
  // Estados para solicitações de vínculo parent-student
  const [parentLinkRequests, setParentLinkRequests] = useState([]);
  const [loadingParentRequests, setLoadingParentRequests] = useState(false);

  useEffect(() => {
    loadFriends();
    loadSuggestions();
    if (user?.role === 'student') {
      loadParentLinkRequests();
    }
  }, [user?.id]);

  const loadFriends = async () => {
    if (!user?.id) {
      console.error('ID do usuário não disponível');
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiGet(`/users/${user.id}/friends`);
      setFriends(response.acceptedFriends || []);
      setPendingRequests(response.pendingRequests || []);
    } catch (error) {
      console.error('Erro ao carregar amigos:', error);
      notificationService.error('Erro ao carregar lista de amigos');
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    if (!user?.id) {
      console.error('ID do usuário não disponível');
      return;
    }
    
    try {
      const response = await apiGet(`/users/${user.id}/friend-suggestions`);
      setSuggestions(response.suggestions || {
        sameClass: [],
        sameSchool: []
      });
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
    }
  };

  // Carregar solicitações de vínculo parent-student
  const loadParentLinkRequests = async () => {
    if (!user?.id) {
      console.error('ID do usuário não disponível');
      return;
    }
    
    try {
      setLoadingParentRequests(true);
      const response = await apiGet(`/students/${user.id}/pending-link-requests`);
      setParentLinkRequests(response.pendingRequests || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações de vínculo:', error);
    } finally {
      setLoadingParentRequests(false);
    }
  };

  // Responder a solicitação de vínculo
  const respondToParentLinkRequest = async (parentId, approved) => {
    if (!user?.id) {
      notificationService.error('ID do usuário não disponível');
      return;
    }
    
    if (!parentId) {
      notificationService.error('ID do responsável não disponível');
      return;
    }
    
    try {
      await apiPost(`/students/${user.id}/respond-link-request`, {
        parentId,
        approved
      });
      
      notificationService.success(
        approved ? 'Responsável vinculado com sucesso!' : 'Solicitação rejeitada.'
      );
      
      // Recarregar solicitações
      loadParentLinkRequests();
    } catch (error) {
      console.error('Erro ao responder solicitação:', error);
      notificationService.error('Erro ao processar solicitação');
    }
  };

  const addFriend = async (friendId, source = 'suggestion') => {
    if (!user?.id) {
      notificationService.error('ID do usuário não disponível');
      return;
    }
    
    if (!friendId) {
      notificationService.error('ID do amigo não disponível');
      return;
    }
    
    try {
      await apiPost(`/users/${user.id}/friends`, {
        targetUserId: friendId,
        source: source
      });
      
    analyticsService.trackEvent('friend_added', {
      friendId,
        userId: user.id,
        source: source
      });
      
      notificationService.success('Solicitação de amizade enviada!');
      
      loadFriends();
      loadSuggestions();
    } catch (error) {
      console.error('Erro ao adicionar amigo:', error);
      
      // Mensagens de erro mais específicas
      const errorMessage = error.response?.data?.error;
      if (errorMessage) {
        notificationService.error(errorMessage);
      } else if (error.response?.status === 400) {
        notificationService.error('Erro na solicitação. Verifique os dados.');
      } else {
        notificationService.error('Erro ao adicionar amigo');
      }
    }
  };

  const handleFriendRequest = async (friendId, action) => {
    if (!user?.id) {
      notificationService.error('ID do usuário não disponível');
      return;
    }
    
    if (!friendId) {
      notificationService.error('ID do amigo não disponível');
      return;
    }
    
    console.log(`🔄 Frontend: Enviando solicitação - User ID: ${user.id}, Friend ID: ${friendId}, Action: ${action}`);
    
    try {
      await apiPut(`/users/${user.id}/friends/${friendId}`, {
        action: action
      });
      
      notificationService.success(
        action === 'accept' ? 'Solicitação aceita!' : 'Solicitação rejeitada!'
      );
      
      // Recarregar dados para atualizar a interface
      await loadFriends();
      await loadSuggestions();
    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
      notificationService.error('Erro ao processar solicitação');
    }
  };

  const searchPlayerById = async () => {
    if (!playerIdSearch.trim()) {
      notificationService.warning('Digite um ID de jogador');
      return;
    }

    // Validar formato do ID
    if (!playerIdSearch.trim().toUpperCase().startsWith('YUF')) {
      notificationService.error('ID de jogador inválido. Deve começar com YUF');
      return;
    }

    try {
      setLoading(true);
      const response = await apiGet(`/users/search/${playerIdSearch.trim().toUpperCase()}`);
      
      // Verificar se não está tentando adicionar a si mesmo
      if (response.id === user.id) {
        setSearchedPlayer(null);
        notificationService.error('Você não pode adicionar a si mesmo como amigo');
        return;
      }
      
      setSearchedPlayer(response);
      notificationService.success('Jogador encontrado!');
    } catch (error) {
      console.error('Erro ao buscar jogador:', error);
      setSearchedPlayer(null);
      
      // Mensagem de erro mais específica
      if (error.response?.status === 404) {
        notificationService.error('Jogador não encontrado. Verifique o ID.');
      } else if (error.response?.status === 400) {
        notificationService.error('ID de jogador inválido. Deve começar com YUF');
      } else {
        notificationService.error('Erro ao buscar jogador');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendId) => {
    if (!user?.id) {
      notificationService.error('ID do usuário não disponível');
      return;
    }
    
    if (!friendId) {
      notificationService.error('ID do amigo não disponível');
      return;
    }
    
    if (!window.confirm('Tem certeza que deseja remover este amigo?')) {
      return;
    }

    try {
      await apiDelete(`/users/${user.id}/friends/${friendId}`);
      notificationService.success('Amigo removido com sucesso!');
    loadFriends();
    } catch (error) {
      console.error('Erro ao remover amigo:', error);
      notificationService.error('Erro ao remover amigo');
    }
  };

  const sendGift = async (friendId, giftType) => {
    if (!user?.id) {
      notificationService.error('ID do usuário não disponível');
      return;
    }
    
    if (!friendId) {
      notificationService.error('ID do amigo não disponível');
      return;
    }
    
    try {
      const response = await apiPost(`/users/${user.id}/send-gift`, {
        friendId,
        giftType
      });
      
      // Atualizar usuário local com novos YuCoins
      const updatedUser = {
        ...user,
        progress: {
          ...user.progress,
          yuCoins: response.sender.yuCoins
        }
      };
      
      // Atualizar estado global e localStorage
      setUser(updatedUser);
      localStorage.setItem('yufinUser', JSON.stringify(updatedUser));
      
      // Rastrear evento
      analyticsService.trackEvent('gift_sent', {
        friendId,
        giftType,
        cost: response.cost
      });
      
      notificationService.success(`Presente enviado para ${response.recipient.name}!`);
      
    } catch (error) {
      console.error('Erro ao enviar presente:', error);
      
      // Mensagens de erro específicas
      if (error.message.includes('YüCoins insuficientes')) {
        notificationService.error('YüCoins insuficientes para enviar este presente!');
      } else if (error.message.includes('amigos')) {
        notificationService.error('Vocês precisam ser amigos para enviar presentes');
      } else {
        notificationService.error('Erro ao enviar presente');
      }
    }
  };

  return (
    <div className="min-h-screen bg-interface p-3 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-yufin text-primary">👥 Amigos</h1>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-100 text-blue-800 p-3 rounded-lg text-center border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
              <div className="text-xs font-medium mb-1">Amigos</div>
              <div className="text-lg font-bold">{friends?.length || 0}</div>
            </div>
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg text-center border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
              <div className="text-xs font-medium mb-1">Pendentes</div>
              <div className="text-lg font-bold">{(pendingRequests?.length || 0) + (user?.role === 'student' ? (parentLinkRequests?.length || 0) : 0)}</div>
            </div>
          </div>

          <div className="mb-4 p-3 bg-yellow-50 rounded-lg border-2" style={{ borderColor: 'rgb(238, 145, 22)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Seu ID de Jogador:</p>
                <p className="text-lg font-bold text-gray-800">{user?.playerId || 'Não gerado'}</p>
              </div>
              {user?.playerId && (
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(user.playerId);
                      notificationService.success('ID de jogador copiado para a área de transferência!');
                    } catch (error) {
                      // Fallback para navegadores que não suportam clipboard API
                      const textArea = document.createElement('textarea');
                      textArea.value = user.playerId;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      notificationService.success('ID de jogador copiado para a área de transferência!');
                    }
                  }}
                  className="text-gray-500 hover:text-primary transition-colors p-2 rounded-lg hover:bg-yellow-100"
                  title="Copiar ID de jogador"
                >
                  📋
                </button>
              )}
            </div>
          </div>

          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'friends' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              👥 Amigos ({friends?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'requests' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📨 Solicitações ({(pendingRequests?.length || 0) + (user?.role === 'student' ? (parentLinkRequests?.length || 0) : 0)})
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'suggestions' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🔍 Sugestões
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'search' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🎮 Buscar por ID
            </button>
          </div>
        </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {activeTab === 'friends' && (
                    <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Meus Amigos</h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando amigos...</p>
                    </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">👥</div>
                  <p className="text-gray-600 mb-4">Você ainda não tem amigos adicionados.</p>
                  <button
                    onClick={() => setActiveTab('suggestions')}
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition"
                  >
                    Encontrar Amigos
                  </button>
            </div>
          ) : (
            <div className="space-y-4">
                  {friends?.map((friend) => (
                <div key={friend.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {friend.name ? friend.name.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-lg">{friend.name || 'Nome não disponível'}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Nível {friend.level || 1}</span>
                              <span>🏫 {friend.gradeId || 'N/A'}</span>

                              <span>🎮 {friend.playerId || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => sendGift(friend.id, 'yuCoins')}
                        disabled={(user.progress?.yuCoins || 0) < 10}
                        className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Enviar 10 YüCoins (Custo: 10 YüCoins)"
                      >
                        💰 Presente
                      </button>
                      <button
                            onClick={() => removeFriend(friend.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition"
                            title="Remover amigo"
                          >
                            ❌ Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Solicitações Pendentes</h2>
              
              {/* Solicitações de Vínculo Parent-Student */}
              {user?.role === 'student' && parentLinkRequests.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">👨‍👩‍👧‍👦 Solicitações de Vínculo</h3>
                  <div className="space-y-3">
                    {parentLinkRequests?.map((request) => (
                      <div key={request.parentId} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              👨‍👩‍👧‍👦
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-lg">{request.parentName || 'Nome não disponível'}</p>
                              <p className="text-sm text-gray-600">Deseja se vincular como responsável</p>
                              {request.message && (
                                <p className="text-xs text-blue-600 mt-1">"{request.message}"</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {request.requestDate ? new Date(request.requestDate).toLocaleDateString('pt-BR') : 'Data não disponível'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => respondToParentLinkRequest(request.parentId, true)}
                              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition"
                            >
                              ✅ Aceitar
                            </button>
                            <button
                              onClick={() => respondToParentLinkRequest(request.parentId, false)}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition"
                            >
                              ❌ Rejeitar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Solicitações de Amizade */}
              {pendingRequests.length === 0 && (!user?.role === 'student' || parentLinkRequests.length === 0) ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📨</div>
                  <p className="text-gray-600">Nenhuma solicitação pendente.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {request.name ? request.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-lg">{request.name || 'Nome não disponível'}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Nível {request.level || 1}</span>
                              <span>🏫 {request.gradeId || 'N/A'}</span>

                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleFriendRequest(request.id, 'accept')}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition"
                          >
                            ✅ Aceitar
                          </button>
                          <button
                            onClick={() => handleFriendRequest(request.id, 'reject')}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition"
                          >
                            ❌ Rejeitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Sugestões de Amigos</h2>
              
              {suggestions?.sameClass?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">👥 Mesma Turma</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions?.sameClass?.map((friend) => (
                      <div key={friend.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                            {friend.name ? friend.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{friend.name || 'Nome não disponível'}</p>
                            <p className="text-sm text-gray-600">Nível {friend.level || 1} • {friend.gradeId || 'N/A'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => addFriend(friend.id, 'class')}
                          className="bg-primary text-white px-3 py-1 rounded-lg text-sm hover:bg-primary-dark transition"
                        >
                          Adicionar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {suggestions?.sameSchool?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">🏫 Mesma Escola</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions?.sameSchool?.map((friend) => (
                      <div key={friend.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                            {friend.name ? friend.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{friend.name || 'Nome não disponível'}</p>
                            <p className="text-sm text-gray-600">Nível {friend.level || 1} • {friend.gradeId || 'N/A'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => addFriend(friend.id, 'school')}
                          className="bg-primary text-white px-3 py-1 rounded-lg text-sm hover:bg-primary-dark transition"
                        >
                          Adicionar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}



              {(!suggestions?.sameClass?.length || suggestions.sameClass.length === 0) && (!suggestions?.sameSchool?.length || suggestions.sameSchool.length === 0) && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-600">Nenhuma sugestão disponível no momento.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Buscar por ID de Jogador</h2>
              
              <div className="mb-6">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Digite o ID (ex: YUF123)"
                    value={playerIdSearch}
                    onChange={(e) => setPlayerIdSearch(e.target.value.toUpperCase())}
                    className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={searchPlayerById}
                    disabled={loading}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark transition disabled:opacity-50"
                  >
                    {loading ? '🔍' : 'Buscar'}
                  </button>
                </div>
              </div>

              {searchedPlayer && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {searchedPlayer.name ? searchedPlayer.name.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-lg">{searchedPlayer.name || 'Nome não disponível'}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {searchedPlayer.level && <span>Nível {searchedPlayer.level}</span>}
                          {searchedPlayer.gradeId && <span>🏫 {searchedPlayer.gradeId}</span>}

                          <span>🎮 {searchedPlayer.playerId || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => addFriend(searchedPlayer.id, 'playerId')}
                      className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark transition"
                    >
                      Adicionar Amigo
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">💡 Como usar:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Peça o ID de jogador para seu amigo</li>
                  <li>• Digite o ID no campo acima (ex: YUF123)</li>
                  <li>• Clique em "Buscar" para encontrar o jogador</li>
                  <li>• Clique em "Adicionar Amigo" para enviar solicitação</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends; 