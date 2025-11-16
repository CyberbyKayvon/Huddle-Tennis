// quick-league/core/StandingsManager.js
export class StandingsManager {
    constructor(parent) {
        this.parent = parent;
        this.standings = [];
        this.weeklyResults = new Map();
    }
    
    async loadStandings(leagueId = null) {
        // Use provided leagueId or get from active league
        const id = leagueId || this.parent.activeLeague?.id || this.parent.activeLeague?._id;
        
        if (!id) {
            console.log('No league ID available for standings');
            return [];
        }
        
        // First check localStorage for standings
        const standingsKey = `league_standings_${id}`;
        const savedStandings = localStorage.getItem(standingsKey);
        if (savedStandings) {
            try {
                this.standings = JSON.parse(savedStandings);
                return this.standings;
            } catch (e) {
                console.error('Error parsing saved standings:', e);
            }
        }
        
        // Then check if league already has standings in memory
        if (this.parent.activeLeague?.standings && !leagueId) {
            this.standings = this.parent.activeLeague.standings;
            return this.standings;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/leagues/${id}/standings`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.standings = data.standings || [];
                
                // Sort standings by rank if not already sorted
                if (this.standings.length > 0 && !this.standings[0].rank) {
                    this.standings = this.sortStandings(this.standings);
                }
                
                return this.standings;
            }
        } catch (error) {
            console.error('Error loading standings:', error);
        }
        
        // Fallback to mock data for demo
        return this.getMockStandings();
    }
    
    sortStandings(standings) {
        return standings.sort((a, b) => {
            // Sort by points first
            if (b.points !== a.points) return b.points - a.points;
            
            // Then by win percentage
            const aTotal = (a.wins || 0) + (a.losses || 0);
            const bTotal = (b.wins || 0) + (b.losses || 0);
            const aWinPct = aTotal > 0 ? (a.wins / aTotal) : 0;
            const bWinPct = bTotal > 0 ? (b.wins / bTotal) : 0;
            
            if (bWinPct !== aWinPct) return bWinPct - aWinPct;
            
            // Finally by total wins
            return (b.wins || 0) - (a.wins || 0);
        }).map((standing, index) => ({
            ...standing,
            rank: index + 1
        }));
    }
    
    async loadResults(weekOrDate) {
        const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
        
        if (!leagueId) {
            return this.getMockResults(weekOrDate);
        }
        
        try {
            const token = localStorage.getItem('token');
            
            // Try to process results first (this updates standings)
            try {
                await fetch(`/api/leagues/${leagueId}/process-results/${weekOrDate}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Content-Type': 'application/json'
                    }
                });
            } catch (processError) {
                console.log('Could not process results:', processError);
            }
            
            // Then fetch the results
            const response = await fetch(`/api/leagues/${leagueId}/results/${weekOrDate}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.weeklyResults.set(weekOrDate, data.results || []);
                return data.results || [];
            }
        } catch (error) {
            console.error('Error loading results:', error);
        }
        
        return this.getMockResults(weekOrDate);
    }
    
    calculateStandings(results) {
        const standings = new Map();
        
        // Initialize standings for all league members
        if (this.parent.activeLeague?.members) {
            this.parent.activeLeague.members.forEach(member => {
                const userId = member._id || member.id || member;
                standings.set(userId, {
                    userId: userId,
                    username: member.username || member.displayName || 'Player',
                    wins: 0,
                    losses: 0,
                    pushes: 0,
                    points: 0,
                    streak: 0,
                    streakType: null,
                    weeklyRecords: []
                });
            });
        }
        
        results.forEach(weekResults => {
            weekResults.forEach(result => {
                const userId = result.userId?._id || result.userId?.id || result.userId;
                if (!standings.has(userId)) {
                    standings.set(userId, {
                        userId: userId,
                        username: result.username || 'Player',
                        wins: 0,
                        losses: 0,
                        pushes: 0,
                        points: 0,
                        streak: 0,
                        streakType: null,
                        weeklyRecords: []
                    });
                }
                
                const standing = standings.get(result.userId);
                if (result.result === 'push') {
                    standing.pushes++;
                } else if (result.correct || result.result === 'win') {
                    standing.wins++;
                    standing.points += result.points || 1;
                    if (standing.streakType === 'W') {
                        standing.streak++;
                    } else {
                        standing.streak = 1;
                        standing.streakType = 'W';
                    }
                } else {
                    standing.losses++;
                    if (standing.streakType === 'L') {
                        standing.streak++;
                    } else {
                        standing.streak = 1;
                        standing.streakType = 'L';
                    }
                }
            });
        });
        
        // Convert to array and sort
        this.standings = this.sortStandings(Array.from(standings.values()));
        return this.standings;
    }
    
    getUserStanding(userId) {
        return this.standings.find(s => 
            s.userId === userId || 
            s.userId?._id === userId ||
            s.userId?.id === userId
        );
    }
    
    getUserRank(userId) {
        const index = this.standings.findIndex(s => 
            s.userId === userId || 
            s.userId?._id === userId ||
            s.userId?.id === userId
        );
        return index >= 0 ? index + 1 : null;
    }
    
    getTopPerformers(limit = 5) {
        return this.standings.slice(0, limit);
    }
    
    getWeeklyLeaders(weekOrDate) {
        const results = this.weeklyResults.get(weekOrDate) || [];
        const leaderboard = new Map();
        
        results.forEach(result => {
            const userId = result.userId?._id || result.userId?.id || result.userId;
            if (!leaderboard.has(userId)) {
                leaderboard.set(userId, {
                    userId: userId,
                    username: result.username || 'Player',
                    correct: 0,
                    total: 0
                });
            }
            
            const entry = leaderboard.get(userId);
            entry.total++;
            if (result.correct || result.result === 'win') entry.correct++;
        });
        
        return Array.from(leaderboard.values())
            .sort((a, b) => {
                const aPct = a.total > 0 ? (a.correct / a.total) : 0;
                const bPct = b.total > 0 ? (b.correct / b.total) : 0;
                return bPct - aPct;
            })
            .slice(0, 10);
    }
    
    calculatePrizeDistribution(pot) {
        if (!pot || pot === 0) return null;
        
        const prizes = {
            first: (pot * 0.6).toFixed(2),
            second: (pot * 0.3).toFixed(2),
            third: (pot * 0.1).toFixed(2)
        };
        
        // Ensure total equals pot (handle rounding)
        const total = parseFloat(prizes.first) + parseFloat(prizes.second) + parseFloat(prizes.third);
        if (total !== pot) {
            const diff = pot - total;
            prizes.first = (parseFloat(prizes.first) + diff).toFixed(2);
        }
        
        return prizes;
    }
    
    getStreakLeaders() {
        return this.standings
            .filter(s => s.streak > 0)
            .sort((a, b) => {
                // Prioritize win streaks over loss streaks
                if (a.streakType !== b.streakType) {
                    return a.streakType === 'W' ? -1 : 1;
                }
                return b.streak - a.streak;
            })
            .slice(0, 5);
    }
    
    getWeeklyStats(weekOrDate) {
        const results = this.weeklyResults.get(weekOrDate) || [];
        
        const stats = {
            totalGames: 0,
            totalPicks: 0,
            correctPicks: 0,
            averageAccuracy: 0,
            mostPickedTeam: null,
            leastPickedTeam: null,
            biggestUpset: null
        };
        
        if (results.length === 0) return stats;
        
        const gamePicks = new Map();
        const teamPicks = new Map();
        
        results.forEach(result => {
            stats.totalPicks++;
            if (result.correct || result.result === 'win') stats.correctPicks++;
            
            // Track by game
            if (!gamePicks.has(result.gameId)) {
                gamePicks.set(result.gameId, {
                    gameId: result.gameId,
                    picks: [],
                    correct: 0,
                    total: 0
                });
            }
            
            const game = gamePicks.get(result.gameId);
            game.total++;
            if (result.correct || result.result === 'win') game.correct++;
            game.picks.push(result);
            
            // Track by team
            const team = result.pick || result.team;
            if (team) {
                teamPicks.set(team, (teamPicks.get(team) || 0) + 1);
            }
        });
        
        stats.totalGames = gamePicks.size;
        stats.averageAccuracy = stats.totalPicks > 0 
            ? ((stats.correctPicks / stats.totalPicks) * 100).toFixed(1)
            : 0;
        
        // Find most/least picked teams
        if (teamPicks.size > 0) {
            const sortedTeams = Array.from(teamPicks.entries())
                .sort((a, b) => b[1] - a[1]);
            stats.mostPickedTeam = sortedTeams[0];
            stats.leastPickedTeam = sortedTeams[sortedTeams.length - 1];
        }
        
        return stats;
    }
    
    getMockStandings() {
        // Return mock standings for demo
        return [
            {
                rank: 1,
                userId: 'user1',
                username: 'TopPicker',
                wins: 12,
                losses: 5,
                pushes: 0,
                points: 24,
                winPercentage: '70.6',
                streak: 3,
                streakType: 'W'
            },
            {
                rank: 2,
                userId: 'user2',
                username: 'SharpShooter',
                wins: 11,
                losses: 6,
                pushes: 0,
                points: 22,
                winPercentage: '64.7',
                streak: 1,
                streakType: 'W'
            },
            {
                rank: 3,
                userId: 'user3',
                username: 'Underdog',
                wins: 10,
                losses: 7,
                pushes: 0,
                points: 20,
                winPercentage: '58.8',
                streak: 2,
                streakType: 'L'
            }
        ];
    }
    
    getMockResults(weekOrDate) {
        // Return mock results for testing
        return [
            {
                gameId: 'game1',
                userId: 'user1',
                username: 'Player1',
                pick: 'home',
                correct: true,
                points: 1,
                result: 'win'
            },
            {
                gameId: 'game2',
                userId: 'user1',
                username: 'Player1',
                pick: 'away',
                correct: false,
                points: 0,
                result: 'loss'
            }
        ];
    }
    
    exportStandings() {
        return {
            league: this.parent.activeLeague?.name,
            standings: this.standings,
            weeklyResults: Array.from(this.weeklyResults.entries()),
            exportDate: new Date().toISOString()
        };
    }
    
    formatRecord(wins, losses, pushes = 0) {
        const total = wins + losses + pushes;
        if (total === 0) return '0-0';
        
        const record = pushes > 0 ? `${wins}-${losses}-${pushes}` : `${wins}-${losses}`;
        const winPct = ((wins / (wins + losses)) * 100).toFixed(1);
        
        return `${winPct}%`;
    }
    
    formatStreak(streak, type) {
        if (!streak || streak === 0) return '-';
        return `${type}${streak}`;
    }
}