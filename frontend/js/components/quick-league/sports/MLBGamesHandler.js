// quick-league/sports/MLBGamesHandler.js
export class MLBGamesHandler {
    constructor(parent) {
        this.parent = parent;
        this.seasonYear = 2025;
    }
    
    async loadGamesForDate(date) {
        try {
            const dateString = typeof date === 'string' ? date : this.formatDate(date);
            const token = localStorage.getItem('token');
            
            // Try backend first
            let response = await fetch(`/api/mlb/schedule/${dateString}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.games && data.games.length > 0) {
                    return this.parseBackendGames(data.games);
                }
            }
            
            // Try MLB API
            response = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateString}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.dates && data.dates[0]?.games) {
                    return this.parseMLBAPIGames(data.dates[0].games);
                }
            }
            
        } catch (error) {
            console.error('Error loading MLB games:', error);
        }
        
        return this.getMockGames(date);
    }
    
    parseBackendGames(games) {
        return games.map(game => ({
            gameId: game.gameId || game.gamePk || game.id,
            homeTeam: game.homeTeam || game.teams?.home?.team?.name,
            awayTeam: game.awayTeam || game.teams?.away?.team?.name,
            homeTeamAbbr: this.getTeamAbbr(game.homeTeam || game.teams?.home?.team?.name),
            awayTeamAbbr: this.getTeamAbbr(game.awayTeam || game.teams?.away?.team?.name),
            spread: parseFloat(game.spread || game.runLine || 1.5),
            total: parseFloat(game.total || game.overUnder || 8.5),
            homeML: game.homeML || game.homeOdds || -110,
            awayML: game.awayML || game.awayOdds || +100,
            gameTime: new Date(game.gameTime || game.gameDate),
            status: game.status || 'pre',
            venue: game.venue || '',
            homeScore: game.homeScore || 0,
            awayScore: game.awayScore || 0,
            inning: game.inning || '',
            isLive: game.status === 'in' || game.isLive,
            isFinal: game.status === 'post' || game.isFinal
        }));
    }
    
    parseMLBAPIGames(games) {
        return games.map(game => {
            const homeTeam = game.teams.home;
            const awayTeam = game.teams.away;
            
            return {
                gameId: game.gamePk,
                homeTeam: homeTeam.team.name,
                awayTeam: awayTeam.team.name,
                homeTeamAbbr: homeTeam.team.abbreviation,
                awayTeamAbbr: awayTeam.team.abbreviation,
                spread: 1.5, // Standard MLB run line
                total: 8.5, // Will need odds API for actual total
                homeML: -110, // Will need odds API
                awayML: +100, // Will need odds API
                gameTime: new Date(game.gameDate),
                status: game.status.statusCode,
                venue: game.venue.name,
                homeScore: homeTeam.score || 0,
                awayScore: awayTeam.score || 0,
                inning: game.linescore?.currentInning || '',
                isLive: game.status.statusCode === 'I',
                isFinal: game.status.statusCode === 'F'
            };
        });
    }
    
    getTeamAbbr(teamName) {
        // Use constants if available
        if (this.parent.constants?.TEAM_MAPPINGS[teamName]) {
            return this.parent.constants.TEAM_MAPPINGS[teamName];
        }
        
        // Fallback mappings
        const mappings = {
            'Yankees': 'NYY', 'Red Sox': 'BOS', 'Blue Jays': 'TOR', 'Rays': 'TB', 'Orioles': 'BAL',
            'White Sox': 'CWS', 'Guardians': 'CLE', 'Tigers': 'DET', 'Royals': 'KC', 'Twins': 'MIN',
            'Astros': 'HOU', 'Athletics': 'OAK', 'Rangers': 'TEX', 'Angels': 'LAA', 'Mariners': 'SEA',
            'Mets': 'NYM', 'Phillies': 'PHI', 'Nationals': 'WSH', 'Marlins': 'MIA', 'Braves': 'ATL',
            'Cubs': 'CHC', 'Reds': 'CIN', 'Brewers': 'MIL', 'Pirates': 'PIT', 'Cardinals': 'STL',
            'Dodgers': 'LAD', 'Giants': 'SF', 'Padres': 'SD', 'Rockies': 'COL', 'Diamondbacks': 'ARI'
        };
        
        return mappings[teamName] || teamName.substring(0, 3).toUpperCase();
    }
    
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    getMockGames(date) {
        const baseTime = new Date(date || Date.now());
        baseTime.setHours(19, 10, 0, 0);
        
        return [
            {
                gameId: `mlb_${this.formatDate(baseTime)}_1`,
                homeTeam: 'Yankees',
                awayTeam: 'Red Sox',
                homeTeamAbbr: 'NYY',
                awayTeamAbbr: 'BOS',
                spread: -1.5,
                total: 9.5,
                homeML: -150,
                awayML: +130,
                gameTime: new Date(baseTime),
                status: 'pre',
                venue: 'Yankee Stadium'
            },
            {
                gameId: `mlb_${this.formatDate(baseTime)}_2`,
                homeTeam: 'Dodgers',
                awayTeam: 'Giants',
                homeTeamAbbr: 'LAD',
                awayTeamAbbr: 'SF',
                spread: -1.5,
                total: 8.5,
                homeML: -180,
                awayML: +160,
                gameTime: new Date(baseTime.setHours(22, 10)),
                status: 'pre',
                venue: 'Dodger Stadium'
            },
            {
                gameId: `mlb_${this.formatDate(baseTime)}_3`,
                homeTeam: 'Astros',
                awayTeam: 'Rangers',
                homeTeamAbbr: 'HOU',
                awayTeamAbbr: 'TEX',
                spread: -1.5,
                total: 10,
                homeML: -120,
                awayML: +100,
                gameTime: new Date(baseTime.setHours(20, 10)),
                status: 'pre',
                venue: 'Minute Maid Park'
            }
        ];
    }
}