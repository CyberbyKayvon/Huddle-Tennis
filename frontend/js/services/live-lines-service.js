// Live Lines Service - Handles fetching and managing sports betting lines

// Import core services
import { apiService } from '/js/core/services/api-service.js';
import { API_ENDPOINTS } from '/js/core/config/api-endpoints.js';
import { storageService } from '/js/core/services/storage-service.js';
import { gameDataService } from '/js/core/services/game-data-service.js';

class LiveLinesService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds cache
        this.updateInterval = null;
        this.isUpdating = false;
    }

    // Get all available games with lines
    async getGames(sport = 'all') {
        // Use centralized game data service
        return gameDataService.getAllGamesWithLines();
    }

    // Get today's games (for betting-hub)
    async getTodaysGames() {
        // Use centralized game data service
        return gameDataService.getTodaysGames();
    }

    // Get lines for a specific game
    async getGameLines(gameId) {
        // Use centralized game data service
        return gameDataService.getGameLines(gameId);
    }

    // Get line movement history
    async getLineMovement(gameId) {
        const cacheKey = `movement_${gameId}`;
        
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        try {
            const data = await apiService.get(API_ENDPOINTS.LINES.MOVEMENT(gameId));
            
            if (data.success && data.movement) {
                this.setCache(cacheKey, data.movement);
                return data.movement;
            }
            
            throw new Error('Invalid response format');
        } catch (error) {
            console.warn('Failed to fetch line movement:', error);
            return this.getDemoLineMovement();
        }
    }

    // Get best lines across all books
    async getBestLines(gameId) {
        const cacheKey = `best_${gameId}`;
        
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        try {
            const data = await apiService.get(API_ENDPOINTS.LINES.BEST(gameId));
            
            if (data.success && data.best) {
                this.setCache(cacheKey, data.best);
                return data.best;
            }
            
            throw new Error('Invalid response format');
        } catch (error) {
            console.warn('Failed to fetch best lines:', error);
            return this.calculateBestLines(await this.getGameLines(gameId));
        }
    }

    // Get live scores
    async getLiveScores(sport = 'all') {
        // Use centralized game data service
        return gameDataService.getLiveScores(sport);
    }

    // Start auto-updating lines
    startAutoUpdate(interval = 30000) {
        if (this.updateInterval) return;
        
        this.updateInterval = setInterval(async () => {
            if (this.isUpdating) return;
            
            this.isUpdating = true;
            try {
                // Clear cache to force fresh data
                this.clearCache();
                
                // Emit update event for components to listen to
                window.dispatchEvent(new CustomEvent('linesUpdated', {
                    detail: { timestamp: Date.now() }
                }));
            } catch (error) {
                console.error('Auto-update failed:', error);
            } finally {
                this.isUpdating = false;
            }
        }, interval);
    }

    // Stop auto-updating
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // Calculate best line from multiple sportsbooks
    calculateBestLines(lines) {
        if (!lines || !lines.sportsbooks) {
            return {
                spread: { home: null, away: null },
                total: { over: null, under: null },
                moneyline: { home: null, away: null }
            };
        }
        
        const best = {
            spread: { home: { line: null, book: null }, away: { line: null, book: null } },
            total: { over: { line: null, book: null }, under: { line: null, book: null } },
            moneyline: { home: { line: null, book: null }, away: { line: null, book: null } }
        };
        
        Object.entries(lines.sportsbooks).forEach(([bookName, bookLines]) => {
            // Best spread (highest for each side)
            if (bookLines.spread) {
                if (!best.spread.home.line || bookLines.spread.home > best.spread.home.line) {
                    best.spread.home = { line: bookLines.spread.home, book: bookName };
                }
                if (!best.spread.away.line || bookLines.spread.away > best.spread.away.line) {
                    best.spread.away = { line: bookLines.spread.away, book: bookName };
                }
            }
            
            // Best total (lowest over, highest under)
            if (bookLines.total) {
                if (!best.total.over.line || bookLines.total.over < best.total.over.line) {
                    best.total.over = { line: bookLines.total.over, book: bookName };
                }
                if (!best.total.under.line || bookLines.total.under > best.total.under.line) {
                    best.total.under = { line: bookLines.total.under, book: bookName };
                }
            }
            
            // Best moneyline (highest for each side)
            if (bookLines.moneyline) {
                if (!best.moneyline.home.line || bookLines.moneyline.home > best.moneyline.home.line) {
                    best.moneyline.home = { line: bookLines.moneyline.home, book: bookName };
                }
                if (!best.moneyline.away.line || bookLines.moneyline.away > best.moneyline.away.line) {
                    best.moneyline.away = { line: bookLines.moneyline.away, book: bookName };
                }
            }
        });
        
        return best;
    }

    // Format spread for display
    formatSpread(spread) {
        if (spread === null || spread === undefined) return 'N/A';
        if (spread > 0) return `+${spread}`;
        return spread.toString();
    }

    // Format moneyline for display
    formatMoneyline(ml) {
        if (ml === null || ml === undefined) return 'N/A';
        if (ml > 0) return `+${ml}`;
        return ml.toString();
    }

    // Format total for display
    formatTotal(total, type = 'over') {
        if (total === null || total === undefined) return 'N/A';
        return `${type.charAt(0).toUpperCase()}${total}`;
    }

    // Calculate potential payout
    calculatePayout(amount, odds) {
        if (odds > 0) {
            // Positive odds (underdog)
            return amount * (odds / 100);
        } else {
            // Negative odds (favorite)
            return amount * (100 / Math.abs(odds));
        }
    }

    // Parse odds from different formats
    parseOdds(odds) {
        if (typeof odds === 'string') {
            // Handle different formats like "+150", "-110", "1.5"
            if (odds.startsWith('+') || odds.startsWith('-')) {
                return parseInt(odds);
            } else if (odds.includes('.')) {
                // Convert decimal odds to American
                const decimal = parseFloat(odds);
                if (decimal >= 2.0) {
                    return Math.round((decimal - 1) * 100);
                } else {
                    return Math.round(-100 / (decimal - 1));
                }
            }
        }
        return odds;
    }

    // Get sport emoji
    getSportEmoji(sport) {
        const emojis = {
            'NFL': '🏈',
            'NBA': '🏀',
            'MLB': '⚾',
            'NHL': '🏒',
            'NCAAF': '🎓',
            'NCAAB': '🎓',
            'Soccer': '⚽',
            'MMA': '🥊',
            'Tennis': '🎾',
            'Golf': '⛳'
        };
        
        return emojis[sport] || '🏆';
    }

    // Cache management
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    getFromCache(key, customTimeout = null) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const timeout = customTimeout || this.cacheTimeout;
        
        // Check if cache is expired
        if (Date.now() - cached.timestamp > timeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    clearCache() {
        this.cache.clear();
    }

    // Demo data fallbacks
    getDemoGames(sport = 'all') {
        const allGames = [
            {
                gameId: 'MIN-CHI-001',
                sport: 'NFL',
                homeTeam: 'Vikings',
                awayTeam: 'Bears',
                gameTime: new Date(Date.now() + 86400000).toISOString(),
                time: '4:25 PM',
                spread: 'MIN -7',
                total: '42.5',
                status: 'scheduled'
            },
            {
                gameId: 'GB-DET-002',
                sport: 'NFL',
                homeTeam: 'Packers',
                awayTeam: 'Lions',
                gameTime: new Date(Date.now() + 172800000).toISOString(),
                time: '8:20 PM',
                spread: 'GB -3',
                total: '48.5',
                status: 'scheduled'
            },
            {
                gameId: 'LAL-BOS-003',
                sport: 'NBA',
                homeTeam: 'Lakers',
                awayTeam: 'Celtics',
                gameTime: new Date(Date.now() + 7200000).toISOString(),
                time: '7:30 PM',
                spread: 'LAL -5.5',
                total: '215.5',
                status: 'scheduled'
            },
            {
                gameId: 'NYY-BOS-004',
                sport: 'MLB',
                homeTeam: 'Yankees',
                awayTeam: 'Red Sox',
                gameTime: new Date(Date.now() + 3600000).toISOString(),
                time: '7:05 PM',
                spread: 'NYY -1.5',
                total: '9.5',
                status: 'scheduled'
            }
        ];
        
        if (sport === 'all') {
            return allGames;
        }
        
        return allGames.filter(game => game.sport === sport);
    }

    getDemoLines(gameId) {
        return {
            gameId: gameId,
            homeTeam: 'Home Team',
            awayTeam: 'Away Team',
            gameTime: new Date(Date.now() + 86400000).toISOString(),
            sportsbooks: {
                draftkings: {
                    spread: { home: -7, away: 7 },
                    total: { over: 42.5, under: 42.5 },
                    moneyline: { home: -280, away: 240 }
                },
                fanduel: {
                    spread: { home: -7.5, away: 7.5 },
                    total: { over: 42, under: 42 },
                    moneyline: { home: -275, away: 235 }
                },
                betmgm: {
                    spread: { home: -7, away: 7 },
                    total: { over: 43, under: 43 },
                    moneyline: { home: -285, away: 245 }
                }
            }
        };
    }

    getDemoScores() {
        return [
            {
                gameId: 'LIVE-001',
                sport: 'NFL',
                homeTeam: 'Vikings',
                awayTeam: 'Bears',
                homeScore: 17,
                awayScore: 14,
                period: '3rd Quarter',
                timeRemaining: '8:42',
                status: 'live'
            },
            {
                gameId: 'LIVE-002',
                sport: 'NBA',
                homeTeam: 'Lakers',
                awayTeam: 'Celtics',
                homeScore: 84,
                awayScore: 89,
                period: '4th Quarter',
                timeRemaining: '2:15',
                status: 'live'
            }
        ];
    }

    getDemoLineMovement() {
        const now = Date.now();
        return [
            { timestamp: now - 3600000, spread: -6.5, total: 41.5 },
            { timestamp: now - 2400000, spread: -7, total: 42 },
            { timestamp: now - 1200000, spread: -7, total: 42.5 },
            { timestamp: now, spread: -7.5, total: 42.5 }
        ];
    }
}

// Create and export instance
const liveLinesService = new LiveLinesService();

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.liveLinesService = liveLinesService;
}

// Export for module usage
export { liveLinesService, LiveLinesService };