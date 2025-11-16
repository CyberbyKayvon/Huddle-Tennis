// quick-league/core/GamesLoader.js
import { NFLGamesHandler } from '../sports/NFLGamesHandler.js';
import { MLBGamesHandler } from '../sports/MLBGamesHandler.js';
import { NCAAFGamesHandler } from '../sports/NCAAFGamesHandler.js';
import { NBAGamesHandler } from '../sports/NBAGamesHandler.js';
import { NHLGamesHandler } from '../sports/NHLGamesHandler.js';

export class GamesLoader {
    constructor(parent) {
        this.parent = parent;
        this.sportHandlers = {
            'NFL': new NFLGamesHandler(parent),
            'MLB': new MLBGamesHandler(parent),
            'NCAAF': new NCAAFGamesHandler(parent),
            'NBA': new NBAGamesHandler(parent),
            'NHL': new NHLGamesHandler(parent)
        };
        this.cachedGames = new Map();
    }
    
    async loadGames(sport = 'NFL', weekOrDate) {
        const cacheKey = `${sport}_${weekOrDate}`;
        
        // Check cache first (5 minute expiry)
        if (this.cachedGames.has(cacheKey)) {
            const cached = this.cachedGames.get(cacheKey);
            if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
                console.log(`Using cached games for ${cacheKey}`);
                return cached.games;
            }
        }
        
        const handler = this.sportHandlers[sport];
        if (!handler) {
            console.error(`No handler for sport: ${sport}`);
            return this.getMockGamesForSport(sport, weekOrDate);
        }
        
        try {
            let games = [];
            
            // Load based on sport type
            if (sport === 'MLB' || sport === 'NBA' || sport === 'NHL') {
                // Date-based sports
                const dateStr = typeof weekOrDate === 'string' && weekOrDate.includes('-') 
                    ? weekOrDate 
                    : new Date().toISOString().split('T')[0];
                games = await handler.loadGamesForDate(dateStr);
            } else {
                // Week-based sports (NFL, NCAAF)
                const week = weekOrDate || this.parent.currentWeek || 1;
                games = await handler.loadGamesForWeek(week);
            }
            
            // Process games to ensure consistent format
            games = games.map(game => this.parseGameData(game, sport));
            
            // Cache the results
            this.cachedGames.set(cacheKey, {
                games,
                timestamp: Date.now()
            });
            
            return games;
        } catch (error) {
            console.error(`Error loading ${sport} games:`, error);
            return this.getMockGamesForSport(sport, weekOrDate);
        }
    }
    
    async loadLeagueGames() {
    const league = this.parent.activeLeague;
    if (!league) {
        console.warn('No active league');
        return [];
    }
    
    const sport = league.sport || 'NFL';
    
    // For NFL, always use integer week numbers
    let weekOrDate;
    if (sport === 'NFL') {
        weekOrDate = parseInt(this.parent.selectedWeek) || 1;
    } else {
        weekOrDate = this.getWeekOrDate();
    }
    
    const games = await this.loadGames(sport, weekOrDate);
    
    // Don't limit games for display - let PicksManager handle the selection limit
    // Users should see all available games and choose which ones to pick
    
    return games;
}
    
    parseGameData(game, sport) {
        // Ensure we have a valid game object
        if (!game) return null;
        
        // Extract team names
        const homeTeam = game.homeTeam || game.home || game.homeTeamName || 'Home Team';
        const awayTeam = game.awayTeam || game.away || game.awayTeamName || 'Away Team';
        
        // Parse spread with proper handling
        const spread = this.parseSpread(game, sport);
        const moneylines = this.getMoneylines(game, spread);
        
        return {
            gameId: game.id || game.gameId || game.game_id || Math.random().toString(36).substr(2, 9),
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            homeTeamAbbr: this.getTeamAbbr(homeTeam, sport),
            awayTeamAbbr: this.getTeamAbbr(awayTeam, sport),
            spread: spread,
            total: this.parseTotal(game, sport),
            homeML: moneylines.homeML,
            awayML: moneylines.awayML,
            gameTime: this.parseGameTime(game),
            status: game.status || 'pre',
            venue: game.venue || game.stadium || '',
            homeScore: parseInt(game.homeScore) || 0,
            awayScore: parseInt(game.awayScore) || 0,
            period: game.period || game.quarter || '',
            clock: game.clock || game.time || '',
            isLive: game.status === 'in' || game.isLive === true,
            isFinal: game.status === 'post' || game.isFinal === true || game.status === 'final'
        };
    }
    
    parseGameTime(game) {
        if (game.gameTime) return new Date(game.gameTime);
        if (game.startTime) return new Date(game.startTime);
        if (game.date) return new Date(game.date);
        if (game.kickoff) return new Date(game.kickoff);
        
        // Default to a future time
        const defaultTime = new Date();
        defaultTime.setHours(13, 0, 0, 0); // 1 PM
        defaultTime.setDate(defaultTime.getDate() + ((7 - defaultTime.getDay()) % 7)); // Next Sunday
        return defaultTime;
    }
    
    parseSpread(game, sport) {
        // Try multiple fields
        if (game.spread !== undefined && game.spread !== null) return parseFloat(game.spread);
        if (game.line !== undefined && game.line !== null) return parseFloat(game.line);
        if (game.pointSpread !== undefined) return parseFloat(game.pointSpread);
        if (game.odds?.spread !== undefined) return parseFloat(game.odds.spread);
        
        // Parse from odds details string
        if (game.odds?.details) {
            const match = game.odds.details.match(/([+-]?\d+\.?\d*)/);
            if (match) return parseFloat(match[1]);
        }
        
        // Sport-specific defaults
        const defaults = {
            'NFL': -3.5,
            'NBA': -5.5,
            'MLB': -1.5,
            'NHL': -1.5,
            'NCAAF': -7.5
        };
        
        return defaults[sport] || -3.5;
    }
    
    parseTotal(game, sport) {
        // Try multiple fields
        if (game.total !== undefined && game.total !== null) return parseFloat(game.total);
        if (game.overUnder !== undefined) return parseFloat(game.overUnder);
        if (game.over_under !== undefined) return parseFloat(game.over_under);
        if (game.totalLine !== undefined) return parseFloat(game.totalLine);
        if (game.odds?.total !== undefined) return parseFloat(game.odds.total);
        if (game.odds?.overUnder !== undefined) return parseFloat(game.odds.overUnder);
        
        // Sport-specific defaults
        const defaults = {
            'NFL': 45.5,
            'NBA': 220.5,
            'MLB': 8.5,
            'NHL': 5.5,
            'NCAAF': 55.5
        };
        
        return defaults[sport] || 45.5;
    }
    
    getMoneylines(game, spread) {
        // Check if moneylines are provided
        if (game.homeML !== undefined && game.awayML !== undefined) {
            return {
                homeML: parseInt(game.homeML),
                awayML: parseInt(game.awayML)
            };
        }
        
        if (game.homeMoneyline !== undefined && game.awayMoneyline !== undefined) {
            return {
                homeML: parseInt(game.homeMoneyline),
                awayML: parseInt(game.awayMoneyline)
            };
        }
        
        // Calculate from spread
        return this.calculateMoneylineFromSpread(spread);
    }
    
    getTeamAbbr(teamName, sport) {
        if (!teamName || teamName === 'Home Team' || teamName === 'Away Team') {
            return 'TBD';
        }
        
        // Check constants for mapping
        const mapping = this.parent.constants?.TEAM_MAPPINGS?.[teamName];
        if (mapping) return mapping;
        
        // Common abbreviations
        const abbreviations = {
            'San Francisco': 'SF',
            'Los Angeles Rams': 'LAR',
            'Los Angeles Chargers': 'LAC',
            'New England': 'NE',
            'New York Giants': 'NYG',
            'New York Jets': 'NYJ',
            'Kansas City': 'KC',
            'Tampa Bay': 'TB',
            'Green Bay': 'GB',
            'New Orleans': 'NO',
            'Las Vegas': 'LV'
        };
        
        return abbreviations[teamName] || teamName.substring(0, 3).toUpperCase();
    }
    
    getWeekOrDate() {
        const league = this.parent.activeLeague;
        
        if (league?.sport === 'MLB' || league?.sport === 'NBA' || league?.sport === 'NHL') {
            const date = this.parent.selectedDate || new Date();
            return date.toISOString().split('T')[0];
        }
        
        // Handle preseason weeks
        const week = this.parent.selectedWeek || this.parent.currentWeek || league?.currentWeek || 1;
        return week;
    }
    
    calculateMoneylineFromSpread(spread) {
        const absSpread = Math.abs(spread);
        let favML, dogML;
        
        if (absSpread <= 2.5) {
            favML = -110 - (absSpread * 15);
            dogML = 100 + (absSpread * 12);
        } else if (absSpread <= 3) {
            favML = -145;
            dogML = 125;
        } else if (absSpread <= 6.5) {
            favML = -110 - (absSpread * 25);
            dogML = 100 + (absSpread * 20);
        } else if (absSpread <= 10) {
            favML = -200 - ((absSpread - 6.5) * 50);
            dogML = 170 + ((absSpread - 6.5) * 40);
        } else {
            favML = -350 - ((absSpread - 10) * 40);
            dogML = 300 + ((absSpread - 10) * 30);
        }
        
        // Round to nearest 5
        favML = Math.round(favML / 5) * 5;
        dogML = Math.round(dogML / 5) * 5;
        
        // Return based on who is favored (negative spread = home favored)
        if (spread < 0) {
            return { homeML: favML, awayML: dogML };
        } else {
            return { homeML: dogML, awayML: favML };
        }
    }
    
    getMockGamesForSport(sport, weekOrDate) {
        // Return sport-specific mock games for testing
        const mockGames = {
            'NFL': [
                { gameId: 'nfl1', homeTeam: 'Chiefs', awayTeam: 'Bills', spread: -3.5, total: 48.5, gameTime: new Date() },
                { gameId: 'nfl2', homeTeam: 'Cowboys', awayTeam: 'Eagles', spread: -7, total: 45.5, gameTime: new Date() }
            ],
            'MLB': [
                { gameId: 'mlb1', homeTeam: 'Yankees', awayTeam: 'Red Sox', spread: -1.5, total: 8.5, gameTime: new Date() },
                { gameId: 'mlb2', homeTeam: 'Dodgers', awayTeam: 'Giants', spread: -1.5, total: 7.5, gameTime: new Date() }
            ],
            'NBA': [
                { gameId: 'nba1', homeTeam: 'Lakers', awayTeam: 'Celtics', spread: -5.5, total: 220.5, gameTime: new Date() }
            ],
            'NCAAF': [
                { gameId: 'cfb1', homeTeam: 'Alabama', awayTeam: 'Georgia', spread: -7.5, total: 55.5, gameTime: new Date() }
            ],
            'NHL': [
                { gameId: 'nhl1', homeTeam: 'Rangers', awayTeam: 'Bruins', spread: -1.5, total: 5.5, gameTime: new Date() }
            ]
        };
        
        return (mockGames[sport] || mockGames['NFL']).map(game => this.parseGameData(game, sport));
    }
    
    clearCache() {
        this.cachedGames.clear();
        console.log('Games cache cleared');
    }
    
    async preloadWeeklyGames(weeks) {
        const sport = this.parent.activeLeague?.sport || 'NFL';
        const promises = weeks.map(week => this.loadGames(sport, week));
        await Promise.all(promises);
        console.log(`Preloaded ${weeks.length} weeks of ${sport} games`);
    }
}