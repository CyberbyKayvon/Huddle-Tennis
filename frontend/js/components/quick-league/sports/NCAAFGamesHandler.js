// quick-league/sports/NCAAFGamesHandler.js
export class NCAAFGamesHandler {
    constructor(parent) {
        this.parent = parent;
        this.seasonYear = 2025; // 2025 season
    }
    
    async loadGamesForWeek(week) {
        try {
            const weekNumber = typeof week === 'string' ? week.replace('PS-', '') : week;
            const token = localStorage.getItem('token');
            
            // Try backend first
            let response = await fetch(`/api/cfb/schedule/2025/week/${weekNumber}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.games && data.games.length > 0) {
                    return this.parseBackendGames(data.games);
                }
            }
            
            // Try ESPN API
            response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?week=${weekNumber}&year=${this.seasonYear}&groups=80`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.events && data.events.length > 0) {
                    return this.parseESPNGames(data.events);
                }
            }
            
        } catch (error) {
            console.error('Error loading NCAAF games:', error);
        }
        
        return this.getMockGames(week);
    }
    
    parseBackendGames(games) {
        return games.map(game => ({
            gameId: game.id || game.gameId,
            homeTeam: game.home_team || game.homeTeam,
            awayTeam: game.away_team || game.awayTeam,
            homeTeamAbbr: this.getTeamAbbr(game.home_team || game.homeTeam),
            awayTeamAbbr: this.getTeamAbbr(game.away_team || game.awayTeam),
            spread: parseFloat(game.home_spread || game.spread || -3.5),
            total: parseFloat(game.total || game.overUnder || 55.5),
            homeML: game.home_moneyline || game.homeML || -110,
            awayML: game.away_moneyline || game.awayML || +100,
            gameTime: new Date(game.start_date || game.gameTime),
            status: game.status || 'pre',
            venue: game.venue || '',
            homeScore: game.home_points || game.homeScore || 0,
            awayScore: game.away_points || game.awayScore || 0,
            isLive: game.status === 'in_progress',
            isFinal: game.status === 'completed'
        }));
    }
    
    parseESPNGames(events) {
        return events.map(event => {
            const competition = event.competitions[0];
            const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
            const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
            const odds = competition.odds?.[0];
            
            let spread = -3.5;
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
                total: odds?.overUnder || 55.5,
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
        // Common abbreviations
        const mappings = {
            'Alabama': 'ALA', 'Georgia': 'UGA', 'Ohio State': 'OSU', 'Michigan': 'MICH',
            'Clemson': 'CLEM', 'USC': 'USC', 'LSU': 'LSU', 'Oklahoma': 'OU',
            'Texas': 'TEX', 'Florida': 'FLA', 'Notre Dame': 'ND', 'Penn State': 'PSU',
            'Tennessee': 'TENN', 'Auburn': 'AUB', 'Oregon': 'ORE', 'Washington': 'WASH'
        };
        
        return mappings[teamName] || teamName.substring(0, 3).toUpperCase();
    }
    
    getMockGames(week) {
        const weekNum = typeof week === 'string' ? 1 : week;
        
        // 2025 Season starts Sept 6, 2025
        return [
            {
                gameId: `cfb2025_wk${weekNum}_1`,
                homeTeam: 'Alabama',
                awayTeam: 'Florida State',
                homeTeamAbbr: 'ALA',
                awayTeamAbbr: 'FSU',
                spread: -14.5,
                total: 54.5,
                homeML: -500,
                awayML: +400,
                gameTime: new Date('2025-09-06T19:30:00'),
                status: 'pre',
                venue: 'Bryant-Denny Stadium'
            },
            {
                gameId: `cfb2025_wk${weekNum}_2`,
                homeTeam: 'Georgia',
                awayTeam: 'Tennessee',
                homeTeamAbbr: 'UGA',
                awayTeamAbbr: 'TENN',
                spread: -7.5,
                total: 51.5,
                homeML: -280,
                awayML: +230,
                gameTime: new Date('2025-09-06T15:30:00'),
                status: 'pre',
                venue: 'Sanford Stadium'
            }
        ];
    }
}