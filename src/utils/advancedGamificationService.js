import { storageService, STORAGE_KEYS } from './storageService';
import notificationService from './notificationService';

class AdvancedGamificationService {
  constructor() {
    this.rankings = new Map();
    this.competitions = new Map();
    this.seasonalEvents = new Map();
    this.initializeSeasonalEvents();
  }

  // Sistema de Rankings
  updateRanking(userId, userData, progress) {
    const rankingData = {
      userId,
      name: userData.name,
      level: progress.level || 1,
      totalXp: progress.totalXp || 0,
      streak: progress.streak || 0,
      perfectLessons: progress.perfectLessons || 0,
      lastUpdated: new Date().toISOString()
    };

    this.rankings.set(userId, rankingData);
    this.saveRankings();
    
    // Verificar mudanças de posição
    const newPosition = this.getUserRankingPosition(userId);
    const oldPosition = userData.previousRanking || 999;
    
    if (newPosition < oldPosition) {
      const improvement = oldPosition - newPosition;
      notificationService.success(`🎉 Você subiu ${improvement} posição(ões) no ranking! Agora está em #${newPosition}`);
    }
    
    return newPosition;
  }

  // Obter posição do usuário no ranking
  getUserRankingPosition(userId) {
    const sortedRankings = Array.from(this.rankings.values())
      .sort((a, b) => {
        // Priorizar por nível, depois XP, depois streak
        if (a.level !== b.level) return b.level - a.level;
        if (a.totalXp !== b.totalXp) return b.totalXp - a.totalXp;
        return b.streak - a.streak;
      });
    
    return sortedRankings.findIndex(ranking => ranking.userId === userId) + 1;
  }

  // Obter top 10 do ranking
  getTopRankings(limit = 10) {
    return Array.from(this.rankings.values())
      .sort((a, b) => {
        if (a.level !== b.level) return b.level - a.level;
        if (a.totalXp !== b.totalXp) return b.totalXp - a.totalXp;
        return b.streak - a.streak;
      })
      .slice(0, limit);
  }

  // Sistema de Competições
  createCompetition(competitionData) {
    const competition = {
      id: `comp-${Date.now()}`,
      title: competitionData.title,
      description: competitionData.description,
      type: competitionData.type, // 'xp_race', 'streak_challenge', 'perfect_lessons'
      startDate: competitionData.startDate,
      endDate: competitionData.endDate,
      participants: [],
      rewards: competitionData.rewards,
      leaderboard: [],
      isActive: false
    };

    this.competitions.set(competition.id, competition);
    this.saveCompetitions();
    return competition;
  }

  // Participar de uma competição
  joinCompetition(competitionId, userId, userData) {
    const competition = this.competitions.get(competitionId);
    if (!competition) return false;

    const participant = {
      userId,
      name: userData.name,
      joinedAt: new Date().toISOString(),
      score: 0,
      progress: {
        xp: 0,
        streak: 0,
        perfectLessons: 0
      }
    };

    competition.participants.push(participant);
    this.updateCompetitionLeaderboard(competitionId);
    this.saveCompetitions();
    
    notificationService.success(`🎯 Você entrou na competição "${competition.title}"!`);
    return true;
  }

  // Atualizar progresso na competição
  updateCompetitionProgress(competitionId, userId, progress) {
    const competition = this.competitions.get(competitionId);
    if (!competition || !competition.isActive) return;

    const participant = competition.participants.find(p => p.userId === userId);
    if (!participant) return;

    // Calcular pontuação baseada no tipo de competição
    let score = 0;
    switch (competition.type) {
      case 'xp_race':
        score = progress.totalXp - participant.progress.xp;
        participant.progress.xp = progress.totalXp;
        break;
      case 'streak_challenge':
        score = progress.streak - participant.progress.streak;
        participant.progress.streak = progress.streak;
        break;
      case 'perfect_lessons':
        score = progress.perfectLessons - participant.progress.perfectLessons;
        participant.progress.perfectLessons = progress.perfectLessons;
        break;
    }

    participant.score += score;
    this.updateCompetitionLeaderboard(competitionId);
    this.saveCompetitions();
  }

  // Atualizar leaderboard da competição
  updateCompetitionLeaderboard(competitionId) {
    const competition = this.competitions.get(competitionId);
    if (!competition) return;

    competition.leaderboard = competition.participants
      .sort((a, b) => b.score - a.score)
      .map((participant, index) => ({
        ...participant,
        position: index + 1
      }));
  }

  // Finalizar competição
  endCompetition(competitionId) {
    const competition = this.competitions.get(competitionId);
    if (!competition) return;

    competition.isActive = false;
    competition.endDate = new Date().toISOString();

    // Distribuir recompensas
    const winners = competition.leaderboard.slice(0, 3);
    winners.forEach((winner, index) => {
      const reward = competition.rewards[index] || competition.rewards[0];
      this.distributeCompetitionReward(winner.userId, reward, competition.title);
    });

    this.saveCompetitions();
    
    // Notificar vencedores
    winners.forEach((winner, index) => {
      const position = index + 1;
      const reward = competition.rewards[index] || competition.rewards[0];
      notificationService.success(
        `🏆 Parabéns! Você ficou em ${position}º lugar na competição "${competition.title}"! ` +
        `Recompensa: ${reward.xp} XP + ${reward.yuCoins} YüCoins`
      );
    });
  }

  // Sistema de Eventos Sazonais
  initializeSeasonalEvents() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;

    // Eventos mensais
    const monthlyEvents = {
      1: { name: 'Ano Novo Financeiro', theme: 'planning', bonus: 1.5 },
      2: { name: 'Carnaval de Economia', theme: 'celebration', bonus: 1.3 },
      3: { name: 'Março das Metas', theme: 'goals', bonus: 1.4 },
      4: { name: 'Abril dos Investimentos', theme: 'investment', bonus: 1.6 },
      5: { name: 'Maio das Mães', theme: 'family', bonus: 1.2 },
      6: { name: 'Junho Junino', theme: 'festival', bonus: 1.3 },
      7: { name: 'Julho das Férias', theme: 'vacation', bonus: 1.1 },
      8: { name: 'Agosto dos Pais', theme: 'family', bonus: 1.2 },
      9: { name: 'Setembro da Independência', theme: 'freedom', bonus: 1.4 },
      10: { name: 'Outubro das Crianças', theme: 'kids', bonus: 1.5 },
      11: { name: 'Novembro da Consciência', theme: 'awareness', bonus: 1.3 },
      12: { name: 'Dezembro de Natal', theme: 'christmas', bonus: 1.7 }
    };

    const currentEvent = monthlyEvents[currentMonth];
    if (currentEvent) {
      this.activateSeasonalEvent(currentEvent);
    }
  }

  // Ativar evento sazonal
  activateSeasonalEvent(eventData) {
    const event = {
      id: `event-${Date.now()}`,
      name: eventData.name,
      theme: eventData.theme,
      bonus: eventData.bonus,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
      isActive: true,
      participants: [],
      specialRewards: this.generateSpecialRewards(eventData.theme)
    };

    this.seasonalEvents.set(event.id, event);
    this.saveSeasonalEvents();
  }

  // Gerar recompensas especiais para eventos
  generateSpecialRewards(theme) {
    const rewards = {
      planning: [
        { name: 'Planejador Mestre', xp: 500, yuCoins: 100, icon: '📋' },
        { name: 'Estrategista Financeiro', xp: 300, yuCoins: 75, icon: '🎯' }
      ],
      celebration: [
        { name: 'Celebrador', xp: 400, yuCoins: 80, icon: '🎉' },
        { name: 'Festivo', xp: 250, yuCoins: 60, icon: '🎊' }
      ],
      goals: [
        { name: 'Conquistador de Metas', xp: 600, yuCoins: 120, icon: '🎯' },
        { name: 'Focado', xp: 350, yuCoins: 85, icon: '🎯' }
      ],
      investment: [
        { name: 'Investidor Iniciante', xp: 700, yuCoins: 150, icon: '📈' },
        { name: 'Poupador Inteligente', xp: 450, yuCoins: 100, icon: '💰' }
      ],
      family: [
        { name: 'Familiar', xp: 300, yuCoins: 70, icon: '👨‍👩‍👧‍👦' },
        { name: 'Protetor', xp: 200, yuCoins: 50, icon: '🛡️' }
      ],
      festival: [
        { name: 'Festivo', xp: 350, yuCoins: 80, icon: '🎪' },
        { name: 'Celebrador', xp: 250, yuCoins: 60, icon: '🎊' }
      ],
      vacation: [
        { name: 'Viajante', xp: 400, yuCoins: 90, icon: '✈️' },
        { name: 'Aventureiro', xp: 300, yuCoins: 70, icon: '🏖️' }
      ],
      freedom: [
        { name: 'Livre', xp: 500, yuCoins: 110, icon: '🕊️' },
        { name: 'Independente', xp: 350, yuCoins: 85, icon: '🏛️' }
      ],
      kids: [
        { name: 'Criança Brilhante', xp: 600, yuCoins: 130, icon: '🌟' },
        { name: 'Aprendiz Feliz', xp: 400, yuCoins: 95, icon: '😊' }
      ],
      awareness: [
        { name: 'Consciente', xp: 450, yuCoins: 100, icon: '🧠' },
        { name: 'Informado', xp: 300, yuCoins: 75, icon: '📚' }
      ],
      christmas: [
        { name: 'Natalino', xp: 800, yuCoins: 200, icon: '🎄' },
        { name: 'Generoso', xp: 500, yuCoins: 120, icon: '🎁' }
      ]
    };

    return rewards[theme] || rewards.celebration;
  }

  // Aplicar bônus de evento sazonal
  applySeasonalBonus(userId, baseXp) {
    const activeEvents = Array.from(this.seasonalEvents.values())
      .filter(event => event.isActive);

    if (activeEvents.length === 0) return baseXp;

    const totalBonus = activeEvents.reduce((total, event) => total + event.bonus, 0);
    const bonusXp = Math.floor(baseXp * (totalBonus - 1));

    // Registrar participação no evento
    activeEvents.forEach(event => {
      if (!event.participants.includes(userId)) {
        event.participants.push(userId);
      }
    });

    this.saveSeasonalEvents();
    return baseXp + bonusXp;
  }

  // Sistema de Conquistas Avançadas
  checkAdvancedAchievements(user, progress) {
    const achievements = [];

    // Conquistas de ranking
    const rankingPosition = this.getUserRankingPosition(user.id);
    if (rankingPosition <= 10 && !progress.achievements?.includes('top_10')) {
      achievements.push({
        id: 'top_10',
        title: 'Top 10',
        description: 'Chegou ao top 10 do ranking',
        icon: '🏆',
        reward: { xp: 500, yuCoins: 100 }
      });
    }

    if (rankingPosition <= 3 && !progress.achievements?.includes('top_3')) {
      achievements.push({
        id: 'top_3',
        title: 'Top 3',
        description: 'Chegou ao top 3 do ranking',
        icon: '🥇',
        reward: { xp: 1000, yuCoins: 200 }
      });
    }

    // Conquistas de competição
    const competitionWins = this.getCompetitionWins(user.id);
    if (competitionWins >= 1 && !progress.achievements?.includes('first_win')) {
      achievements.push({
        id: 'first_win',
        title: 'Primeira Vitória',
        description: 'Venceu sua primeira competição',
        icon: '🏅',
        reward: { xp: 300, yuCoins: 75 }
      });
    }

    if (competitionWins >= 5 && !progress.achievements?.includes('champion')) {
      achievements.push({
        id: 'champion',
        title: 'Campeão',
        description: 'Venceu 5 competições',
        icon: '👑',
        reward: { xp: 800, yuCoins: 150 }
      });
    }

    // Conquistas de eventos
    const eventParticipations = this.getEventParticipations(user.id);
    if (eventParticipations >= 3 && !progress.achievements?.includes('event_master')) {
      achievements.push({
        id: 'event_master',
        title: 'Mestre dos Eventos',
        description: 'Participou de 3 eventos sazonais',
        icon: '🎪',
        reward: { xp: 400, yuCoins: 90 }
      });
    }

    return achievements;
  }

  // Obter vitórias em competições
  getCompetitionWins(userId) {
    return Array.from(this.competitions.values())
      .filter(comp => !comp.isActive)
      .filter(comp => comp.leaderboard[0]?.userId === userId).length;
  }

  // Obter participações em eventos
  getEventParticipations(userId) {
    return Array.from(this.seasonalEvents.values())
      .filter(event => event.participants.includes(userId)).length;
  }

  // Distribuir recompensa de competição
  distributeCompetitionReward(userId, reward, competitionTitle) {
    // Em uma implementação real, isso seria integrado com o sistema de progresso
    console.log(`🏆 Recompensa distribuída para ${userId}: ${reward.xp} XP + ${reward.yuCoins} YüCoins`);
  }

  // Persistência de dados
  saveRankings() {
    storageService.save('rankings', Array.from(this.rankings.entries()));
  }

  saveCompetitions() {
    storageService.save('competitions', Array.from(this.competitions.entries()));
  }

  saveSeasonalEvents() {
    storageService.save('seasonalEvents', Array.from(this.seasonalEvents.entries()));
  }

  loadData() {
    try {
      const rankingsData = storageService.load('rankings') || [];
      this.rankings = new Map(rankingsData);

      const competitionsData = storageService.load('competitions') || [];
      this.competitions = new Map(competitionsData);

      const eventsData = storageService.load('seasonalEvents') || [];
      this.seasonalEvents = new Map(eventsData);
    } catch (error) {
      console.error('Erro ao carregar dados de gamificação:', error);
    }
  }
}

export default new AdvancedGamificationService(); 