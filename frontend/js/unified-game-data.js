// unified-game-data.js - Centralized Game Data Manager
// This manages all game data fetching and standardization across components

class UnifiedGameDataManager {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 60000; // 1 minute cache for regular data
        this.liveCacheTimeout = 30000; // 30 seconds for live data
        console.log('✅ Unified Game Data Manager initialized');
    }

    // Main method for NFL games by week
    async getNFLGames(week, seasonType = 'regular') {
        const cacheKey = `nfl-${seasonType}-${week}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log(`📦 Using cached data for ${cacheKey}`);
            return cached;
        }

        try {
            // Primary: Use your backend API that combines ESPN + odds
            console.log(`🔍 Fetching NFL games: Week ${week}, Type: ${seasonType}`);
            const response = await fetch(`/api/nfl/schedule/${week}?seasonType=${seasonType}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.games && data.games.length > 0) {
                    console.log(`✅ Fetched ${data.games.length} games from primary API`);
                    const standardizedGames = this.standardizeGames(data.games, 'NFL');
                    this.setCache(cacheKey, standardizedGames);
                    return standardizedGames;
                }
            }
        } catch (error) {
            console.error('Primary API failed:', error);
        }

        // Fallback: Try lines endpoint
        try {
            console.log('📡 Trying fallback: /api/lines/games');
            const response = await fetch('/api/lines/games');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.games) {
                    console.log(`✅ Fetched ${data.games.length} games from lines API`);
                    const standardizedGames = this.standardizeGames(data.games, 'NFL');
                    this.setCache(cacheKey, standardizedGames);
                    return standardizedGames;
                }
            }
        } catch (error) {
            console.error('Fallback API failed:', error);
        }

        console.warn('⚠️ All APIs failed, returning empty array');
        return [];
    }

    // Get games for a specific date
    async getGamesForDate(sport, date) {
        const dateStr = date.toISOString().split('T')[0];
        const cacheKey = `${sport}-${dateStr}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log(`📦 Using cached data for ${cacheKey}`);
            return cached;
        }

        try {
            console.log(`🔍 Fetching ${sport} games for ${dateStr}`);
            // Try sport-specific endpoint first, then fall back to general games endpoint
            let response = await fetch(`/api/games/${sport.toLowerCase()}/${dateStr}`);
            if (!response.ok) {
                // Fallback to lines endpoint for today's games
                response = await fetch('/api/lines/games');
            }
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.games) {
                    console.log(`✅ Fetched ${data.games.length} games for ${dateStr}`);
                    const standardizedGames = this.standardizeGames(data.games, sport);
                    this.setCache(cacheKey, standardizedGames);
                    return standardizedGames;
                }
            }
        } catch (error) {
            console.error('Date API failed:', error);
        }

        return [];
    }

    // Get current live games
    async getCurrentLiveGames() {
        const cacheKey = 'live-games-all';
        const cached = this.getFromCache(cacheKey, this.liveCacheTimeout);
        if (cached) {
            console.log(`📦 Using cached live games (${cached.length} games)`);
            return cached;
        }

        try {
            console.log('🔴 Fetching live games');
            const response = await fetch('/api/lines/games');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.games) {
                    // Filter for live games
                    const liveGames = data.games.filter(g => 
                        g.isLive || g.status === 'live' || g.status?.type?.state === 'in'
                    );
                    console.log(`✅ Found ${liveGames.length} live games`);
                    const standardizedGames = this.standardizeGames(liveGames, 'ALL');
                    this.setCache(cacheKey, standardizedGames);
                    return standardizedGames;
                }
            }
        } catch (error) {
            console.error('Live games API failed:', error);
        }

        return [];
    }

    // Get all games (live + upcoming) for today
    async getTodaysGames(sport = 'ALL') {
        const today = new Date();
        const cacheKey = `today-${sport}-${today.toDateString()}`;
        const cached = this.getFromCache(cacheKey, this.liveCacheTimeout);
        if (cached) return cached;

        try {
            console.log(`🔍 Fetching today's ${sport} games`);
            const response = await fetch('/api/lines/games');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.games) {
                    let games = data.games;
                    
                    // Filter by sport if specified
                    if (sport !== 'ALL') {
                        games = games.filter(g => 
                            g.sport === sport || 
                            g.league === sport || 
                            g.sport?.toUpperCase() === sport.toUpperCase()
                        );
                    }
                    
                    console.log(`✅ Found ${games.length} ${sport} games for today`);
                    const standardizedGames = this.standardizeGames(games, sport);
                    this.setCache(cacheKey, standardizedGames);
                    return standardizedGames;
                }
            }
        } catch (error) {
            console.error('Today games API failed:', error);
        }

        return [];
    }

    // Standardize game data format across all components
    standardizeGames(games, sport) {
        if (!Array.isArray(games)) {
            console.warn('⚠️ Games is not an array:', games);
            return [];
        }

        return games.map(game => {
            try {
                const standardized = {
                    // Core identifiers
                    id: game.id || game.gameId || game._id || `game-${Date.now()}-${Math.random()}`,
                    gameId: game.id || game.gameId || game._id || `game-${Date.now()}-${Math.random()}`,
                    sport: sport || game.sport || game.league || 'NFL',
                    
                    // Teams
                    homeTeam: this.extractTeamInfo(game, 'home'),
                    awayTeam: this.extractTeamInfo(game, 'away'),
                    
                    // For simplified access
                    home: this.extractTeamName(game, 'home'),
                    away: this.extractTeamName(game, 'away'),
                    
                    // Scores
                    homeScore: this.extractScore(game, 'home'),
                    awayScore: this.extractScore(game, 'away'),
                    
                    // Status
                    status: this.extractStatus(game),
                    isLive: this.isGameLive(game),
                    isFinal: this.isGameFinal(game),
                    
                    // Time info
                    period: game.period || game.status?.period,
                    clock: game.clock || game.status?.displayClock,
                    
                    // Time
                    gameTime: this.extractGameTime(game),
                    startTime: this.extractGameTime(game),
                    
                    // Betting lines
                    spread: this.extractSpread(game, sport),
                    total: this.extractTotal(game, sport),
                    homeML: this.extractMoneyline(game, 'home'),
                    awayML: this.extractMoneyline(game, 'away'),
                    
                    // Additional info
                    venue: game.venue || game.competitions?.[0]?.venue?.fullName,
                    weather: game.weather,
                    broadcasts: game.broadcasts,
                    
                    // Keep original data for reference
                    _original: game
                };

                return standardized;
            } catch (error) {
                console.error('Error standardizing game:', error, game);
                return null;
            }
        }).filter(game => game !== null); // Remove any failed standardizations
    }

    extractTeamName(game, side) {
        // Simple string extraction for team name
        if (game[side]) return game[side];
        if (game[`${side}Team`]) return game[`${side}Team`];
        
        // ESPN format
        if (game.competitions) {
            const competitor = game.competitions[0]?.competitors?.find(
                c => c.homeAway === side
            );
            return competitor?.team?.displayName || competitor?.team?.abbreviation || 'TBD';
        }
        
        return 'TBD';
    }

    extractTeamInfo(game, side) {
        // Handle ESPN format
        if (game.competitions && game.competitions[0]) {
            const competitor = game.competitions[0].competitors?.find(
                c => c.homeAway === side
            );
            if (competitor && competitor.team) {
                return {
                    name: competitor.team.displayName || competitor.team.name,
                    abbreviation: competitor.team.abbreviation,
                    logo: competitor.team.logo,
                    record: competitor.records?.[0]?.summary,
                    score: parseInt(competitor.score) || 0
                };
            }
        }

        // Handle simplified format
        const teamKey = side === 'home' ? 'homeTeam' : 'awayTeam';
        const teamData = game[teamKey] || game[side];
        
        // Handle if teamData is an object or string
        const teamName = typeof teamData === 'object' ? teamData.name || teamData.displayName : teamData;
        const teamAbbr = typeof teamData === 'object' ? teamData.abbreviation : null;
        
        return {
            name: teamName || 'Unknown',
            abbreviation: teamAbbr || game[`${side}Abbr`] || (typeof teamName === 'string' ? teamName.substring(0, 3).toUpperCase() : 'UNK'),
            logo: game[`${side}Logo`] || (typeof teamData === 'object' ? teamData.logo : null),
            record: game[`${side}Record`] || (typeof teamData === 'object' ? teamData.record : null),
            score: game[`${side}Score`] || 0
        };
    }

    extractScore(game, side) {
        // ESPN format
        if (game.competitions && game.competitions[0]) {
            const competitor = game.competitions[0].competitors?.find(
                c => c.homeAway === side
            );
            return parseInt(competitor?.score) || 0;
        }
        
        // Simple format
        const score = game[`${side}Score`] || game[`${side}TeamScore`] || 0;
        return parseInt(score) || 0;
    }

    extractStatus(game) {
        if (game.status?.type) {
            return {
                state: game.status.type.state,
                completed: game.status.type.completed,
                detail: game.status.type.detail || game.status.type.description,
                shortDetail: game.status.type.shortDetail,
                period: game.status.period,
                clock: game.status.displayClock
            };
        }
        
        return {
            state: game.isLive ? 'in' : game.isFinal ? 'post' : 'pre',
            completed: game.isFinal || false,
            detail: game.status || 'Scheduled',
            shortDetail: game.status || 'Scheduled',
            period: game.period,
            clock: game.clock
        };
    }

    extractSpread(game, sport) {
        // Try multiple locations
        if (game.competitions?.[0]?.odds?.[0]?.details) {
            const details = game.competitions[0].odds[0].details;
            const spread = parseFloat(details.replace(/[^0-9.-]/g, ''));
            if (!isNaN(spread)) return spread;
        }
        
        if (game.spread !== undefined && game.spread !== null) return parseFloat(game.spread);
        if (game.line !== undefined && game.line !== null) return parseFloat(game.line);
        
        // Sport-specific defaults
        const defaults = {
            'NFL': -3.5,
            'NBA': -5.5,
            'MLB': -1.5,
            'NHL': -1.5
        };
        return defaults[game.sport] || -3.5;
    }

    extractTotal(game, sport) {
        if (game.competitions?.[0]?.odds?.[0]?.overUnder) {
            return parseFloat(game.competitions[0].odds[0].overUnder);
        }
        
        if (game.total !== undefined && game.total !== null) return parseFloat(game.total);
        if (game.overUnder !== undefined && game.overUnder !== null) return parseFloat(game.overUnder);
        if (game.totalLine !== undefined && game.totalLine !== null) return parseFloat(game.totalLine);
        
        // Sport-specific defaults
        const defaults = {
            'NFL': 45.5,
            'NBA': 220.5,
            'MLB': 8.5,
            'NHL': 5.5
        };
        return defaults[game.sport] || 45.5;
    }

    extractMoneyline(game, side) {
        const defaultML = side === 'home' ? -110 : -110;
        
        if (game.competitions?.[0]?.odds?.[0]) {
            const odds = game.competitions[0].odds[0];
            if (side === 'home' && odds.homeTeamOdds?.moneyLine) {
                return parseInt(odds.homeTeamOdds.moneyLine);
            }
            if (side === 'away' && odds.awayTeamOdds?.moneyLine) {
                return parseInt(odds.awayTeamOdds.moneyLine);
            }
        }
        
        const ml = game[`${side}ML`] || game[`${side}Moneyline`] || game[`${side}MoneyLine`];
        if (ml !== undefined && ml !== null) return parseInt(ml);
        
        return defaultML;
    }

    extractGameTime(game) {
        // Try multiple date fields
        const dateFields = ['date', 'gameTime', 'startTime', 'kickoff', 'start'];
        
        for (const field of dateFields) {
            if (game[field]) {
                const date = new Date(game[field]);
                if (!isNaN(date.getTime())) return date;
            }
        }
        
        // ESPN format
        if (game.competitions?.[0]?.date) {
            const date = new Date(game.competitions[0].date);
            if (!isNaN(date.getTime())) return date;
        }
        
        // Default to current time
        return new Date();
    }

    isGameLive(game) {
        if (game.isLive !== undefined) return game.isLive;
        if (game.status?.type?.state === 'in') return true;
        if (game.status === 'live' || game.status === 'in-progress') return true;
        return false;
    }

    isGameFinal(game) {
        if (game.isFinal !== undefined) return game.isFinal;
        if (game.status?.type?.state === 'post') return true;
        if (game.status?.type?.completed === true) return true;
        if (game.status === 'final' || game.status === 'completed') return true;
        return false;
    }

    // Cache management
    getFromCache(key, maxAge = null) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const age = Date.now() - cached.timestamp;
        const timeout = maxAge || this.cacheTimeout;
        
        if (age > timeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        console.log('🗑️ Clearing all cached game data');
        this.cache.clear();
    }

    // Helper method to get current NFL week
    getCurrentNFLWeek() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        // 2025 NFL Season
        if (year === 2025) {
            // Preseason
            if (month === 7) { // August
                const day = now.getDate();
                if (day < 7) return { week: 1, type: 'preseason' };
                if (day < 14) return { week: 1, type: 'preseason' };
                if (day < 21) return { week: 2, type: 'preseason' };
                if (day < 28) return { week: 3, type: 'preseason' };
                return { week: 3, type: 'preseason' };
            }
            
            // Regular season starts Sept 4, 2025
            const seasonStart = new Date(2025, 8, 4);
            if (now >= seasonStart) {
                const daysSinceStart = Math.floor((now - seasonStart) / (24 * 60 * 60 * 1000));
                const week = Math.min(Math.floor(daysSinceStart / 7) + 1, 18);
                return { week: week, type: 'regular' };
            }
        }
        
        return { week: 1, type: 'regular' };
    }
}

// Create global instance
window.unifiedGameData = new UnifiedGameDataManager();

// Log that it's ready
console.log('🏈 Unified Game Data Manager loaded and ready');