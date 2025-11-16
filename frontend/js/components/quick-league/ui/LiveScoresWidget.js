// quick-league/ui/LiveScoresWidget.js
export class LiveScoresWidget {
    constructor(parent) {
        this.parent = parent;
        this.refreshInterval = null;
    }
    
    render() {
        return `
            <div class="live-scores" style="background: rgba(26, 26, 46, 0.95); border-radius: 15px; padding: 20px;">
                <h3 style="color: #00ff88; margin-bottom: 20px;">📊 Live Scoring</h3>
                
                <!-- League Selector -->
                <select id="leagueScoreSelector"
                        style="width: 100%; padding: 10px; background: rgba(0, 0, 0, 0.3); 
                               border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; 
                               color: white; margin-bottom: 20px;">
                    <option value="">Select a league...</option>
                    ${this.parent.userLeagues.map(l => `
                        <option value="${l.id || l._id}">${l.name}</option>
                    `).join('')}
                </select>
                
                <!-- Live Scoreboard -->
                <div id="liveScoreboard">
                    ${this.renderEmptyState()}
                </div>
            </div>
        `;
    }
    
    renderEmptyState() {
        return `
            <div style="text-align: center; color: #94a3b8; padding: 40px;">
                <i class="fas fa-football-ball" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>Select a league to view live scoring</p>
            </div>
        `;
    }
    
    async loadLeagueScores(leagueId) {
        if (!leagueId) {
            document.getElementById('liveScoreboard').innerHTML = this.renderEmptyState();
            return;
        }
        
        const league = this.parent.userLeagues.find(l => (l.id || l._id) === leagueId);
        if (!league) return;
        
        try {
            // Load games based on league settings
            const weekOrDate = league.sport === 'MLB' 
                ? new Date().toISOString().split('T')[0]
                : this.parent.currentWeek;
                
            const games = await this.parent.gamesLoader.loadGames(
                league.sport || 'NFL', 
                weekOrDate
            );
            
            // Load standings from API or localStorage
            const standings = await this.loadStandings(leagueId);
            
            // Load user picks for comparison
            const picksKey = `league_picks_${leagueId}_${weekOrDate}`;
            const userPicks = JSON.parse(localStorage.getItem(picksKey) || '{}');
            
            document.getElementById('liveScoreboard').innerHTML = this.renderScoreboard(
                league, 
                games, 
                standings,
                userPicks
            );
        } catch (error) {
            console.error('Error loading league scores:', error);
            document.getElementById('liveScoreboard').innerHTML = `
                <div style="color: #ff4444; text-align: center; padding: 20px;">
                    Error loading scores. Please try again.
                </div>
            `;
        }
    }
    
    async loadStandings(leagueId) {
        try {
            const response = await fetch(`/api/leagues/${leagueId}/standings`);
            if (response.ok) {
                const data = await response.json();
                return data.standings || [];
            }
        } catch (error) {
            console.error('Error loading standings:', error);
        }
        return [];
    }
    
    renderScoreboard(league, games, standings, userPicks) {
        const liveGames = games.filter(g => g.isLive || g.status === 'in');
        const completedGames = games.filter(g => g.isFinal || g.status === 'post');
        const upcomingGames = games.filter(g => 
            !g.isLive && !g.isFinal && g.status !== 'in' && g.status !== 'post'
        );
        
        // Check user picks performance
        const picksPerformance = this.calculatePicksPerformance(completedGames, userPicks);
        
        return `
            <div style="padding: 20px;">
                <h4 style="color: white; margin-bottom: 15px;">
                    ${league.name} - ${league.sport === 'MLB' ? 'Today' : `Week ${this.parent.currentWeek}`}
                </h4>
                
                ${this.renderPicksPerformance(picksPerformance)}
                ${liveGames.length > 0 ? this.renderLiveGames(liveGames, userPicks) : ''}
                ${this.renderLiveStandings(standings)}
                ${completedGames.length > 0 ? this.renderCompletedGames(completedGames, userPicks) : ''}
                ${upcomingGames.length > 0 ? this.renderUpcomingGames(upcomingGames, userPicks) : ''}
            </div>
        `;
    }
    
    calculatePicksPerformance(completedGames, userPicks) {
        let correct = 0;
        let total = 0;
        
        // Handle both old and new pick formats
        const picks = userPicks.picks || Object.values(userPicks).filter(p => p.gameId);
        
        picks.forEach(pick => {
            if (!pick.gameId) return;
            
            const game = completedGames.find(g => (g.gameId || g.id) === pick.gameId);
            if (!game) return;
            
            total++;
            
            // Calculate if pick was correct based on final score
            const homeWon = game.homeScore > game.awayScore;
            const pickWon = (pick.pick === 'home' && homeWon) || 
                           (pick.pick === 'away' && !homeWon);
            
            if (pickWon) correct++;
        });
        
        return { correct, total, percentage: total > 0 ? (correct / total * 100).toFixed(1) : 0 };
    }
    
    renderPicksPerformance(performance) {
        if (performance.total === 0) return '';
        
        return `
            <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); 
                        border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #8b5cf6; font-weight: 600;">Your Performance Today</span>
                    <div style="text-align: right;">
                        <div style="color: white; font-size: 1.2rem; font-weight: bold;">
                            ${performance.correct}/${performance.total}
                        </div>
                        <div style="color: ${performance.percentage >= 60 ? '#00ff88' : '#ff4444'}; font-size: 0.85rem;">
                            ${performance.percentage}% correct
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderLiveGames(games, userPicks) {
        return `
            <div style="margin-bottom: 20px;">
                <h5 style="color: #ff4444; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                    <div style="width: 8px; height: 8px; background: #ff4444; border-radius: 50%; animation: pulse 2s infinite;"></div>
                    LIVE GAMES
                </h5>
                <div style="display: grid; gap: 10px;">
                    ${games.map(game => this.renderLiveGameCard(game, userPicks)).join('')}
                </div>
            </div>
        `;
    }
    
    renderLiveGameCard(game, userPicks) {
        const gameId = game.gameId || game.id;
        const userPick = this.getUserPick(gameId, userPicks);
        
        return `
            <div style="background: rgba(255, 68, 68, 0.1); border: 1px solid rgba(255, 68, 68, 0.3); 
                        border-radius: 8px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: white; font-weight: 600;">
                            ${game.awayTeam} @ ${game.homeTeam}
                        </div>
                        <div style="color: #94a3b8; font-size: 0.85rem; margin-top: 5px;">
                            ${game.period || 'Q1'} ${game.clock || ''}
                        </div>
                        ${userPick ? `
                            <div style="color: #8b5cf6; font-size: 0.75rem; margin-top: 3px;">
                                Your pick: ${userPick.pick === 'home' ? game.homeTeam : game.awayTeam}
                            </div>
                        ` : ''}
                    </div>
                    <div style="text-align: right;">
                        <div style="color: white; font-size: 1.2rem; font-weight: bold;">
                            ${game.awayScore || 0} - ${game.homeScore || 0}
                        </div>
                        <div style="color: #94a3b8; font-size: 0.75rem;">
                            O/U: ${game.total}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderLiveStandings(standings) {
        const topStandings = standings.slice(0, 5);
        
        if (topStandings.length === 0) return '';
        
        return `
            <div style="margin-bottom: 20px;">
                <h5 style="color: #ffd700; margin-bottom: 10px;">Live Standings</h5>
                <div style="display: grid; gap: 8px;">
                    ${topStandings.map((standing, index) => `
                        <div style="display: flex; justify-content: space-between; padding: 10px; 
                                    background: rgba(255, 255, 255, 0.03); border-radius: 8px;">
                            <span style="color: ${index === 0 ? '#ffd700' : 'white'};">
                                ${index + 1}. ${standing.username || standing.user || 'Player'}
                            </span>
                            <span style="color: ${index === 0 ? '#00ff88' : 'white'};">
                                ${standing.wins || 0}-${standing.losses || 0} (${standing.winPercentage || '0.0'}%)
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    renderCompletedGames(games, userPicks) {
        return `
            <div style="margin-bottom: 20px;">
                <h5 style="color: #10b981; margin-bottom: 10px;">Completed Games</h5>
                <div style="display: grid; gap: 8px;">
                    ${games.slice(0, 5).map(game => {
                        const gameId = game.gameId || game.id;
                        const userPick = this.getUserPick(gameId, userPicks);
                        const homeWon = game.homeScore > game.awayScore;
                        const pickCorrect = userPick && 
                            ((userPick.pick === 'home' && homeWon) || 
                             (userPick.pick === 'away' && !homeWon));
                        
                        return `
                            <div style="display: flex; justify-content: space-between; padding: 10px; 
                                        background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); 
                                        border-radius: 8px;">
                                <div>
                                    <span style="color: white;">
                                        ${game.awayTeam} @ ${game.homeTeam}
                                    </span>
                                    ${userPick ? `
                                        <span style="color: ${pickCorrect ? '#00ff88' : '#ff4444'}; 
                                                     font-size: 0.75rem; margin-left: 10px;">
                                            ${pickCorrect ? '✓' : '✗'}
                                        </span>
                                    ` : ''}
                                </div>
                                <span style="color: #10b981; font-weight: 600;">
                                    ${game.awayScore} - ${game.homeScore}
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    renderUpcomingGames(games, userPicks) {
        return `
            <div>
                <h5 style="color: #94a3b8; margin-bottom: 10px;">Upcoming Games</h5>
                <div style="display: grid; gap: 8px;">
                    ${games.slice(0, 5).map(game => {
                        const gameTime = new Date(game.gameTime).toLocaleTimeString([], { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                        });
                        const gameId = game.gameId || game.id;
                        const userPick = this.getUserPick(gameId, userPicks);
                        
                        return `
                            <div style="display: flex; justify-content: space-between; padding: 10px; 
                                        background: rgba(255, 255, 255, 0.03); border-radius: 8px;">
                                <div>
                                    <span style="color: white;">
                                        ${game.awayTeam} @ ${game.homeTeam}
                                    </span>
                                    ${userPick ? `
                                        <span style="color: #8b5cf6; font-size: 0.75rem; margin-left: 10px;">
                                            (${userPick.pick === 'home' ? game.homeTeam : game.awayTeam})
                                        </span>
                                    ` : ''}
                                </div>
                                <span style="color: #94a3b8;">
                                    ${gameTime}
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    getUserPick(gameId, userPicks) {
        // Handle both formats
        if (userPicks.picks) {
            return userPicks.picks.find(p => p.gameId === gameId);
        }
        return userPicks[gameId];
    }
    
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            const selector = document.getElementById('leagueScoreSelector');
            if (selector && selector.value) {
                this.loadLeagueScores(selector.value);
            }
        }, 30000); // Refresh every 30 seconds
    }
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}