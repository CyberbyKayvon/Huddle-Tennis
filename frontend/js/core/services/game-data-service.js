// /frontend/public/js/core/services/game-data-service.js
// SINGLE SOURCE for all game/schedule data
// Every component will use this instead of making their own calls

import { apiService } from './api-service.js';
import { API_ENDPOINTS } from '../config/api-endpoints.js';
import { storageService } from './storage-service.js';

class GameDataService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }
    
    // ==========================================
    // NFL SCHEDULE - Used by ALL components
    // ==========================================
    async getNFLSchedule(week, seasonType = 'regular') {
        const cacheKey = `nfl_schedule_${week}_${seasonType}`;
        
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log(`📦 Using cached NFL schedule for week ${week}`);
            return cached;
        }
        
        try {
            // Try your backend first
            const data = await apiService.get(
                API_ENDPOINTS.NFL.GET_SCHEDULE(week, seasonType)
            );
            
            // Standardize the response
            const standardized = this.standardizeNFLGames(data);
            
            // Cache it
            this.setCache(cacheKey, standardized);
            
            // Also save to localStorage for offline
            storageService.setWithExpiry(
                `nfl_schedule_${week}_${seasonType}`,
                standardized,
                this.cacheTimeout
            );
            
            return standardized;
            
        } catch (error) {
            console.warn('Backend failed, trying ESPN directly:', error);
            
            // Try ESPN as fallback
            try {
                const espnData = await this.fetchFromESPN(week, seasonType);
                const standardized = this.standardizeESPNData(espnData);
                this.setCache(cacheKey, standardized);
                return standardized;
            } catch (espnError) {
                console.warn('ESPN also failed, using cached or demo data');
                
                // Try localStorage
                const stored = storageService.getWithExpiry(`nfl_schedule_${week}_${seasonType}`);
                if (stored) return stored;
                
                // Last resort: demo data
                return this.getDemoSchedule(week);
            }
        }
    }
    
    // ==========================================
    // TODAY'S GAMES - For betting-hub
    // ==========================================
    async getTodaysGames(sport = 'all') {
        const cacheKey = `today_games_${sport}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        try {
            const data = await apiService.get(API_ENDPOINTS.GAMES.GET_TODAY);
            const standardized = this.standardizeGames(data);
            this.setCache(cacheKey, standardized);
            return standardized;
        } catch (error) {
            console.warn('Failed to get today games:', error);
            return this.getDemoTodayGames();
        }
    }
    
    // ==========================================
    // BETTING LINES - Used by multiple components
    // ==========================================
    async getGameLines(gameId) {
        const cacheKey = `lines_${gameId}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        try {
            const data = await apiService.get(API_ENDPOINTS.LINES.BY_GAME(gameId));
            const standardized = this.standardizeLines(data);
            this.setCache(cacheKey, standardized);
            return standardized;
        } catch (error) {
            console.warn('Failed to get lines:', error);
            return this.getDemoLines(gameId);
        }
    }
    
    async getAllGamesWithLines() {
        const cacheKey = 'all_games_lines';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        try {
            const data = await apiService.get(API_ENDPOINTS.LINES.ALL_GAMES);
            const standardized = this.standardizeGamesWithLines(data);
            this.setCache(cacheKey, standardized);
            return standardized;
        } catch (error) {
            console.warn('Failed to get games with lines:', error);
            return this.getDemoGamesWithLines();
        }
    }
    
    // ==========================================
    // LIVE SCORES - For live updates
    // ==========================================
    async getLiveScores(sport = 'nfl') {
        const cacheKey = `live_scores_${sport}`;
        // Shorter cache for live data
        const cached = this.getFromCache(cacheKey, 30000); // 30 seconds
        if (cached) return cached;
        
        try {
            // Skip the non-existent endpoint and go straight to ESPN
            return this.fetchLiveFromESPN(sport);
        } catch (error) {
            // Try ESPN for live scores
            return this.fetchLiveFromESPN(sport);
        }
    }
    
    // ==========================================
    // ESPN FALLBACK METHODS
    // ==========================================
    async fetchFromESPN(week, seasonType = 'regular') {
        const typeMap = { 'preseason': 1, 'regular': 2, 'playoffs': 3 };
        const type = typeMap[seasonType] || 2;
        
        const url = `${API_ENDPOINTS.EXTERNAL.ESPN_NFL}?week=${week}&seasontype=${type}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('ESPN fetch failed');
        return response.json();
    }
    
    async fetchLiveFromESPN(sport = 'nfl') {
        const endpoints = {
            'nfl': API_ENDPOINTS.EXTERNAL.ESPN_NFL,
            'nba': API_ENDPOINTS.EXTERNAL.ESPN_NBA,
            'mlb': API_ENDPOINTS.EXTERNAL.ESPN_MLB
        };
        
        const url = endpoints[sport.toLowerCase()] || endpoints.nfl;
        const response = await fetch(url);
        if (!response.ok) throw new Error('ESPN live fetch failed');
        const data = await response.json();
        return this.standardizeESPNLiveData(data);
    }
    
    // ==========================================
    // STANDARDIZATION METHODS
    // ==========================================
    
    // Standardize NFL games to consistent format
    standardizeNFLGames(data) {
        if (!data) return [];
        
        // Handle different response formats from your backend
        const games = data.games || data.events || data || [];
        
        return games.map(game => this.standardizeGame(game));
    }
    
    // Standardize single game
    standardizeGame(game) {
        // Handle ESPN format
        if (game.competitions) {
            const competition = game.competitions[0];
            const home = competition.competitors.find(c => c.homeAway === 'home');
            const away = competition.competitors.find(c => c.homeAway === 'away');
            const odds = competition.odds?.[0];
            
            return {
                id: game.id,
                gameId: game.id,
                homeTeam: home?.team?.displayName || home?.team?.name,
                homeTeamAbbr: home?.team?.abbreviation,
                awayTeam: away?.team?.displayName || away?.team?.name,
                awayTeamAbbr: away?.team?.abbreviation,
                homeScore: home?.score || 0,
                awayScore: away?.score || 0,
                spread: this.parseSpread(odds?.details),
                total: odds?.overUnder || null,
                gameTime: game.date,
                status: game.status?.type?.state || 'pre',
                isLive: game.status?.type?.state === 'in',
                isFinal: game.status?.type?.state === 'post',
                period: game.status?.period,
                clock: game.status?.displayClock,
                venue: competition.venue?.fullName,
                broadcast: competition.broadcasts?.[0]?.names || []
            };
        }
        
        // Handle your backend format
        return {
            id: game._id || game.gameId || game.id,
            gameId: game._id || game.gameId || game.id,
            homeTeam: game.homeTeam || game.home_team || game.home?.name,
            homeTeamAbbr: game.homeAbbr || game.home?.abbreviation,
            awayTeam: game.awayTeam || game.away_team || game.away?.name,
            awayTeamAbbr: game.awayAbbr || game.away?.abbreviation,
            homeScore: game.homeScore || game.home_score || 0,
            awayScore: game.awayScore || game.away_score || 0,
            spread: game.spread || game.line || null,
            total: game.total || game.over_under || null,
            gameTime: game.gameTime || game.startTime || game.date,
            status: game.status || 'scheduled',
            isLive: game.isLive || false,
            isFinal: game.isFinal || false,
            period: game.period,
            clock: game.clock,
            venue: game.venue,
            broadcast: game.broadcast || []
        };
    }
    
    // Standardize ESPN data
    standardizeESPNData(data) {
        if (!data?.events) return [];
        return data.events.map(event => this.standardizeGame(event));
    }
    
    // Standardize lines data
    standardizeLines(data) {
        if (!data) return null;
        
        const lines = data.lines || data;
        
        return {
            gameId: lines.gameId || lines.id,
            spread: {
                home: lines.homeSpread || lines.spread?.home || null,
                away: lines.awaySpread || lines.spread?.away || null
            },
            total: {
                over: lines.overTotal || lines.total?.over || null,
                under: lines.underTotal || lines.total?.under || null
            },
            moneyline: {
                home: lines.homeML || lines.moneyline?.home || null,
                away: lines.awayML || lines.moneyline?.away || null
            },
            sportsbooks: lines.sportsbooks || {}
        };
    }
    
    // Standardize games with lines
    standardizeGamesWithLines(data) {
        const games = data.games || data || [];
        return games.map(game => ({
            ...this.standardizeGame(game),
            lines: game.lines ? this.standardizeLines(game.lines) : null
        }));
    }
    
    // Standardize live scores
    standardizeLiveScores(data) {
        const scores = data.scores || data || [];
        return scores.map(score => ({
            ...this.standardizeGame(score),
            isLive: true
        }));
    }
    
    // Standardize ESPN live data
    standardizeESPNLiveData(data) {
        if (!data?.events) return [];
        
        return data.events
            .filter(event => event.status?.type?.state === 'in')
            .map(event => this.standardizeGame(event));
    }
    
    // ==========================================
    // UTILITIES
    // ==========================================
    
    parseSpread(spreadString) {
        if (!spreadString) return null;
        
        // Parse strings like "MIN -7" or "GB -3.5"
        const match = spreadString.match(/([A-Z]+)\\s*([-+]?\\d+\\.?\\d*)/);
        if (match) {
            return parseFloat(match[2]);
        }
        
        // Try to parse as number
        const num = parseFloat(spreadString);
        return isNaN(num) ? null : num;
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
        const age = Date.now() - cached.timestamp;
        
        if (age > timeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    // ==========================================
    // DEMO DATA FALLBACKS
    // ==========================================
    
    getDemoSchedule(week) {
        return [
            {
                id: 'demo-1',
                gameId: 'demo-1',
                homeTeam: 'Chicago Bears',
                homeTeamAbbr: 'CHI',
                awayTeam: 'Minnesota Vikings',
                awayTeamAbbr: 'MIN',
                homeScore: 0,
                awayScore: 0,
                spread: -7,
                total: 42.5,
                gameTime: new Date(Date.now() + 86400000).toISOString(),
                status: 'scheduled',
                isLive: false,
                isFinal: false
            },
            {
                id: 'demo-2',
                gameId: 'demo-2',
                homeTeam: 'Buffalo Bills',
                homeTeamAbbr: 'BUF',
                awayTeam: 'Kansas City Chiefs',
                awayTeamAbbr: 'KC',
                homeScore: 0,
                awayScore: 0,
                spread: -3,
                total: 52.5,
                gameTime: new Date(Date.now() + 90000000).toISOString(),
                status: 'scheduled',
                isLive: false,
                isFinal: false
            }
        ];
    }
    
    getDemoTodayGames() {
        return this.getDemoSchedule(1);
    }
    
    getDemoLines(gameId) {
        return {
            gameId: gameId,
            spread: { home: -7, away: 7 },
            total: { over: 42.5, under: 42.5 },
            moneyline: { home: -280, away: 240 }
        };
    }
    
    getDemoGamesWithLines() {
        return this.getDemoSchedule(1).map(game => ({
            ...game,
            lines: this.getDemoLines(game.id)
        }));
    }
}

// Create and export singleton
export const gameDataService = new GameDataService();
export default GameDataService;