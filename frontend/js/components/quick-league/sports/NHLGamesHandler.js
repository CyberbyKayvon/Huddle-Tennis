// quick-league/sports/NHLGamesHandler.js
export class NHLGamesHandler {
    constructor(parent) {
        this.parent = parent;
        this.seasonYear = 2025;
        this.seasonStart = new Date('2025-10-07'); // NHL 2025-26 season starts early October
    }
    
    async loadGamesForWeek(week) {
        try {
            const token = localStorage.getItem('token');
            
            // Check if season has started (today is Aug 31, 2025)
            const today = new Date('2025-08-31');
            if (today < this.seasonStart) {
                return this.getPreseasonMessage();
            }
            
            // Try backend first
            let response = await fetch(`/api/nhl/schedule/week/${week}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.games && data.games.length > 0) {
                    return this.parseBackendGames(data.games);
                }
            }
            
            // Try ESPN API
            response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?week=${week}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.events && data.events.length > 0) {
                    return this.parseESPNGames(data.events);
                }
            }
            
        } catch (error) {
            console.error('Error loading NHL games:', error);
        }
        
        return this.getMockGames(week);
    }
    
    parseBackendGames(games) {
        return games.map(game => ({
            gameId: game.gameId || game.id,
            homeTeam: game.homeTeam || game.home,
            awayTeam: game.awayTeam || game.away,
            homeTeamAbbr: this.getTeamAbbr(game.homeTeam || game.home),
            awayTeamAbbr: this.getTeamAbbr(game.awayTeam || game.away),
            spread: parseFloat(game.spread || game.puckLine || -1.5),
            total: parseFloat(game.total || game.overUnder || 5.5),
            homeML: game.homeML || game.homeMoneyline || -110,
            awayML: game.awayML || game.awayMoneyline || +100,
            gameTime: new Date(game.gameTime || game.startTime),
            status: game.status || 'pre',
            venue: game.venue || '',
            homeScore: game.homeScore || 0,
            awayScore: game.awayScore || 0,
            period: game.period || '',
            clock: game.clock || '',
            isLive: game.status === 'in' || game.isLive,
            isFinal: game.status === 'post' || game.isFinal
        }));
    }
    
    parseESPNGames(events) {
        return events.map(event => {
            const competition = event.competitions[0];
            const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
            const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
            const odds = competition.odds?.[0];
            
            let spread = -1.5;
            if (odds?.details) {
                const spreadMatch = odds.details.match(/([-+]?\d+\.?\d*)/);
                if (spreadMatch) {
                    spread = parseFloat(spreadMatch[1]);
                }
            }
            
            return {
                gameId: event.id,
                homeTeam: homeTeam.team.displayName,
                homeTeamAbbr: homeTeam.team.abbreviation,
                awayTeam: awayTeam.team.displayName,
                awayTeamAbbr: awayTeam.team.abbreviation,
                spread: spread,
                total: odds?.overUnder || 5.5,
                homeML: odds?.homeTeamOdds?.moneyLine || -110,
                awayML: odds?.awayTeamOdds?.moneyLine || +100,
                gameTime: new Date(event.date),
                status: event.status.type.state,
                isLive: event.status.type.state === 'in',
                isFinal: event.status.type.state === 'post',
                period: event.status.period,
                clock: event.status.displayClock,
                homeScore: homeTeam.score || '0',
                awayScore: awayTeam.score || '0',
                venue: competition.venue?.fullName || ''
            };
        });
    }
    
    getTeamAbbr(teamName) {
        // Common NHL abbreviations
        const mappings = {
            'Bruins': 'BOS', 'Sabres': 'BUF', 'Canadiens': 'MTL', 'Senators': 'OTT',
            'Maple Leafs': 'TOR', 'Panthers': 'FLA', 'Lightning': 'TB', 'Red Wings': 'DET',
            'Hurricanes': 'CAR', 'Blue Jackets': 'CBJ', 'Devils': 'NJ', 'Islanders': 'NYI',
            'Rangers': 'NYR', 'Flyers': 'PHI', 'Penguins': 'PIT', 'Capitals': 'WSH',
            'Blackhawks': 'CHI', 'Avalanche': 'COL', 'Stars': 'DAL', 'Wild': 'MIN',
            'Predators': 'NSH', 'Blues': 'STL', 'Jets': 'WPG', 'Coyotes': 'ARI',
            'Flames': 'CGY', 'Oilers': 'EDM', 'Kings': 'LA', 'Kraken': 'SEA',
            'Sharks': 'SJ', 'Ducks': 'ANA', 'Canucks': 'VAN', 'Golden Knights': 'VGK'
        };
        
        return mappings[teamName] || teamName.substring(0, 3).toUpperCase();
    }
    
    getPreseasonMessage() {
        return [{
            gameId: 'nhl-preseason',
            homeTeam: 'Season Starts Oct 7, 2025',
            awayTeam: 'No Games Available',
            spread: 0,
            total: 0,
            gameTime: this.seasonStart,
            status: 'preseason',
            isPreseason: true
        }];
    }
    
    getMockGames(week) {
        // Since season hasn't started (Aug 31, 2025), return preseason message
        return this.getPreseasonMessage();
    }
}