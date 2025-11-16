// NFL Data Service - Fetches real schedule from ESPN and your backend

// Import core services
import { apiService } from '/js/core/services/api-service.js';
import { API_ENDPOINTS } from '/js/core/config/api-endpoints.js';
import { storageService } from '/js/core/services/storage-service.js';
import { gameDataService } from '/js/core/services/game-data-service.js';

class NFLDataService {
    constructor() {
        this.baseURL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async fetchCurrentWeekGames() {
        // Use centralized game data service
        const currentWeek = this.getCurrentNFLWeek();
        return gameDataService.getNFLSchedule(currentWeek);
    }
    
    getCurrentNFLWeek() {
        const now = new Date();
        const seasonStart = new Date('2025-09-04'); // 2025 season start
        const daysSinceStart = Math.floor((now - seasonStart) / (24 * 60 * 60 * 1000));
        const week = Math.floor(daysSinceStart / 7) + 1;
        return Math.min(Math.max(1, week), 18);
    }

    async fetchWeekGames(week, seasonType = 'regular') {
        // Use centralized game data service
        const games = await gameDataService.getNFLSchedule(week, seasonType);
        
        // Convert to the grouped format this service expects
        const gamesByDay = {};
        games.forEach(game => {
            const gameDate = new Date(game.gameTime);
            const dayKey = gameDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
            });
            
            if (!gamesByDay[dayKey]) {
                gamesByDay[dayKey] = [];
            }
            gamesByDay[dayKey].push(game);
        });
        
        return gamesByDay;
    }

    async fetchFullSchedule(seasonYear = 2025, seasonType = 2) {
        const cacheKey = `schedule_${seasonYear}_${seasonType}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(`${this.baseURL}/scoreboard?dates=${seasonYear}&seasontype=${seasonType}`);
            const data = await response.json();
            const formatted = this.formatESPNData(data);
            this.setCache(cacheKey, formatted);
            return formatted;
        } catch (error) {
            console.error('Error fetching schedule:', error);
            return this.getFallbackData();
        }
    }

    formatBackendData(games) {
        // Format games from your backend (already has betting lines)
        if (!Array.isArray(games)) return {};
        
        const gamesByDay = {};
        
        games.forEach(game => {
            const gameDate = new Date(game.date || game.gameTime);
            const dayKey = gameDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
            });
            
            const formattedGame = {
                gameId: game._id || game.gameId || game.id,
                name: game.name || `${game.awayTeam} @ ${game.homeTeam}`,
                date: game.date || game.gameTime,
                time: gameDate.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    timeZoneName: 'short'
                }),
                status: game.status || 'scheduled',
                venue: game.venue,
                isLive: game.isLive || false,
                period: game.period,
                clock: game.clock,
                
                home: {
                    team: game.homeTeam || game.home?.team,
                    name: game.homeTeamFull || game.home?.name || game.homeTeam,
                    logo: game.homeTeam || game.home?.logo,
                    score: game.homeScore || game.home?.score || null,
                    record: game.homeRecord || game.home?.record || ''
                },
                
                away: {
                    team: game.awayTeam || game.away?.team,
                    name: game.awayTeamFull || game.away?.name || game.awayTeam,
                    logo: game.awayTeam || game.away?.logo,
                    score: game.awayScore || game.away?.score || null,
                    record: game.awayRecord || game.away?.record || ''
                },
                
                // Betting lines from your backend
                spread: game.spread || game.currentSpread || 'Line N/A',
                total: game.total || game.currentTotal || 'N/A',
                moneyline: game.moneyline,
                
                // Additional betting data
                betting: game.betting || {},
                broadcast: game.broadcast || []
            };
            
            if (!gamesByDay[dayKey]) {
                gamesByDay[dayKey] = [];
            }
            gamesByDay[dayKey].push(formattedGame);
        });
        
        return gamesByDay;
    }

    formatESPNData(data) {
        if (!data.events) return {};
        
        const gamesByDay = {};
        
        data.events.forEach(event => {
            const competition = event.competitions[0];
            const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');
            const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');
            
            const game = {
                gameId: event.id,
                name: event.name,
                date: event.date,
                time: new Date(event.date).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    timeZoneName: 'short'
                }),
                status: event.status.type.description,
                venue: competition.venue?.fullName,
                isLive: event.status.type.state === 'in',
                period: event.status.period,
                clock: event.status.displayClock,
                
                home: {
                    team: homeCompetitor.team.abbreviation,
                    name: homeCompetitor.team.displayName,
                    logo: homeCompetitor.team.abbreviation,
                    score: homeCompetitor.score || null,
                    record: homeCompetitor.records?.[0]?.summary || ''
                },
                
                away: {
                    team: awayCompetitor.team.abbreviation,
                    name: awayCompetitor.team.displayName,
                    logo: awayCompetitor.team.abbreviation,
                    score: awayCompetitor.score || null,
                    record: awayCompetitor.records?.[0]?.summary || ''
                },
                
                // Betting lines from ESPN
                spread: competition.odds?.[0]?.details || 'Line N/A',
                total: competition.odds?.[0]?.overUnder || 'N/A',
                
                betting: event.competitions[0].odds || {},
                broadcast: competition.broadcasts?.[0]?.names || []
            };
            
            // Group by day
            const gameDay = new Date(game.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
            });
            
            if (!gamesByDay[gameDay]) {
                gamesByDay[gameDay] = [];
            }
            gamesByDay[gameDay].push(game);
        });
        
        return gamesByDay;
    }

    // Cache management
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        // Check if cache is expired
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    clearCache() {
        this.cache.clear();
    }

    // Fallback data when all else fails
    getFallbackData() {
        const today = new Date();
        const dayKey = today.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        });
        
        return {
            [dayKey]: [
                {
                    gameId: 'demo-1',
                    name: 'Chiefs @ Bills',
                    date: today.toISOString(),
                    time: '4:25 PM EST',
                    status: 'Scheduled',
                    home: {
                        team: 'BUF',
                        name: 'Buffalo Bills',
                        logo: 'BUF',
                        score: null,
                        record: '10-3'
                    },
                    away: {
                        team: 'KC',
                        name: 'Kansas City Chiefs',
                        logo: 'KC',
                        score: null,
                        record: '11-2'
                    },
                    spread: 'BUF -2.5',
                    total: '47.5'
                }
            ]
        };
    }
}

// Create and export instance
const nflDataService = new NFLDataService();

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.nflDataService = nflDataService;
}

// Export for module usage
export { nflDataService, NFLDataService };