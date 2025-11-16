// quick-league/sports/NFLGamesHandler.js
export class NFLGamesHandler {
    constructor(parent) {
        this.parent = parent;
        this.seasonYear = 2025;
        this.seasonStart = new Date('2025-09-04');
        this.currentWeek = this.calculateCurrentWeek();
    }
    
    calculateCurrentWeek() {
        const now = new Date();
        const seasonStart = new Date(this.seasonStart);
        
        if (now < seasonStart) {
            return 1; // Pre-season or early season
        }
        
        const weeksPassed = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.min(Math.max(1, weeksPassed + 1), 18);
    }
    
    async loadGamesForWeek(week) {
    try {
        // Ensure week is a number
        const weekNum = typeof week === 'string' ? parseInt(week.replace(/[^0-9]/g, '')) || 1 : parseInt(week) || 1;
        
        // Try ESPN API
        let url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`;
        
        // Add week parameter if not current week
        if (weekNum && weekNum !== this.currentWeek) {
            url += `?week=${weekNum}&seasontype=2`; // seasontype=2 for regular season
        }
            
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                if (data.events && data.events.length > 0) {
                    console.log(`🏈 Loaded ${data.events.length} NFL games for week ${week || this.currentWeek}`);
                    return this.parseESPNGames(data.events);
                }
            }
        } catch (error) {
            console.error('Error loading NFL games:', error);
        }
        
        // Fallback to mock games
        console.log('📦 Using mock NFL games for week', week || this.currentWeek);
        return this.getMockGames(week || this.currentWeek);
    }
    
    parseESPNGames(events) {
        return events.map(event => {
            try {
                const competition = event.competitions?.[0];
                if (!competition) return null;
                
                const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
                const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
                
                if (!awayTeam || !homeTeam) return null;
                
                const odds = competition.odds?.[0];
                
                // Parse spread with better error handling
                let spread = 0;
                if (odds?.details) {
                    // Format is usually "TEAM -X.X" or "PICK"
                    if (odds.details.includes('PICK') || odds.details.includes('PK')) {
                        spread = 0;
                    } else {
                        const spreadMatch = odds.details.match(/([A-Z]+)\s*([-+]?\d+\.?\d*)/);
                        if (spreadMatch) {
                            const favoredTeam = spreadMatch[1];
                            const spreadValue = parseFloat(spreadMatch[2]);
                            // If home team is favored, spread is negative
                            spread = favoredTeam === homeTeam.team.abbreviation ? -Math.abs(spreadValue) : Math.abs(spreadValue);
                        }
                    }
                } else if (odds?.spread) {
                    spread = parseFloat(odds.spread);
                }
                
                // Calculate moneylines if not provided
                let homeML = -110, awayML = -110;
                if (odds?.homeTeamOdds?.moneyLine) {
                    homeML = parseInt(odds.homeTeamOdds.moneyLine);
                    awayML = parseInt(odds.awayTeamOdds?.moneyLine) || -110;
                } else if (spread !== 0) {
                    const mlCalc = this.parent.gamesLoader?.calculateMoneylineFromSpread(spread);
                    if (mlCalc) {
                        homeML = mlCalc.homeML;
                        awayML = mlCalc.awayML;
                    }
                }
                
                return {
                    gameId: event.id || `nfl_${Date.now()}_${Math.random()}`,
                    homeTeam: homeTeam.team.displayName || homeTeam.team.name,
                    awayTeam: awayTeam.team.displayName || awayTeam.team.name,
                    homeTeamAbbr: homeTeam.team.abbreviation,
                    awayTeamAbbr: awayTeam.team.abbreviation,
                    spread: spread || 0,
                    total: parseFloat(odds?.overUnder) || 45.5,
                    homeML: homeML,
                    awayML: awayML,
                    gameTime: new Date(event.date),
                    status: event.status?.type?.state || 'pre',
                    isLive: event.status?.type?.state === 'in',
                    isFinal: event.status?.type?.state === 'post',
                    period: event.status?.period || 0,
                    clock: event.status?.displayClock || '',
                    homeScore: parseInt(homeTeam.score) || 0,
                    awayScore: parseInt(awayTeam.score) || 0,
                    venue: competition.venue?.fullName || 'TBD'
                };
            } catch (error) {
                console.error('Error parsing game:', error);
                return null;
            }
        }).filter(game => game !== null); // Remove any null games from parsing errors
    }
    
    getMockGames(week) {
        const weekNum = typeof week === 'string' ? parseInt(week.replace('PS-', '')) : parseInt(week) || 1;
        
        // Calculate dates based on week number
        const baseDate = new Date(this.seasonStart);
        baseDate.setDate(baseDate.getDate() + (weekNum - 1) * 7);
        
        const thursday = new Date(baseDate);
        thursday.setHours(20, 20, 0, 0);
        
        const sunday = new Date(baseDate);
        sunday.setDate(sunday.getDate() + 3);
        sunday.setHours(13, 0, 0, 0);
        
        const sundayLate = new Date(sunday);
        sundayLate.setHours(16, 25, 0, 0);
        
        const sundayNight = new Date(sunday);
        sundayNight.setHours(20, 20, 0, 0);
        
        const monday = new Date(sunday);
        monday.setDate(monday.getDate() + 1);
        monday.setHours(20, 15, 0, 0);
        
        // Return a full slate of games
        const games = [
            {
                gameId: `nfl_wk${weekNum}_1`,
                homeTeam: 'Kansas City Chiefs',
                awayTeam: 'Detroit Lions', 
                homeTeamAbbr: 'KC',
                awayTeamAbbr: 'DET',
                spread: -4.5,
                total: 52.5,
                homeML: -190,
                awayML: +160,
                gameTime: thursday,
                status: 'pre',
                venue: 'GEHA Field at Arrowhead Stadium',
                isLive: false,
                isFinal: false,
                homeScore: 0,
                awayScore: 0
            },
            {
                gameId: `nfl_wk${weekNum}_2`,
                homeTeam: 'Chicago Bears',
                awayTeam: 'Green Bay Packers',
                homeTeamAbbr: 'CHI',
                awayTeamAbbr: 'GB',
                spread: 3.5,
                total: 44.5,
                homeML: +150,
                awayML: -170,
                gameTime: sunday,
                status: 'pre',
                venue: 'Soldier Field',
                isLive: false,
                isFinal: false,
                homeScore: 0,
                awayScore: 0
            },
            {
                gameId: `nfl_wk${weekNum}_3`,
                homeTeam: 'Buffalo Bills',
                awayTeam: 'Arizona Cardinals',
                homeTeamAbbr: 'BUF',
                awayTeamAbbr: 'ARI',
                spread: -6.5,
                total: 47.5,
                homeML: -250,
                awayML: +210,
                gameTime: sunday,
                status: 'pre',
                venue: 'Highmark Stadium',
                isLive: false,
                isFinal: false,
                homeScore: 0,
                awayScore: 0
            },
            {
                gameId: `nfl_wk${weekNum}_4`,
                homeTeam: 'Cincinnati Bengals',
                awayTeam: 'New England Patriots',
                homeTeamAbbr: 'CIN',
                awayTeamAbbr: 'NE',
                spread: -8.5,
                total: 42.5,
                homeML: -350,
                awayML: +280,
                gameTime: sunday,
                status: 'pre',
                venue: 'Paycor Stadium',
                isLive: false,
                isFinal: false,
                homeScore: 0,
                awayScore: 0
            },
            {
                gameId: `nfl_wk${weekNum}_5`,
                homeTeam: 'Indianapolis Colts',
                awayTeam: 'Houston Texans',
                homeTeamAbbr: 'IND',
                awayTeamAbbr: 'HOU',
                spread: 2.5,
                total: 48.5,
                homeML: +120,
                awayML: -140,
                gameTime: sunday,
                status: 'pre',
                venue: 'Lucas Oil Stadium',
                isLive: false,
                isFinal: false,
                homeScore: 0,
                awayScore: 0
            },
            {
                gameId: `nfl_wk${weekNum}_6`,
                homeTeam: 'Jacksonville Jaguars',
                awayTeam: 'Miami Dolphins',
                homeTeamAbbr: 'JAX',
                awayTeamAbbr: 'MIA',
                spread: 3.5,
                total: 49.5,
                homeML: +150,
                awayML: -170,
                gameTime: sunday,
                status: 'pre',
                venue: 'TIAA Bank Field',
                isLive: false,
                isFinal: false,
                homeScore: 0,
                awayScore: 0
            },
            {
                gameId: `nfl_wk${weekNum}_7`,
                homeTeam: 'Philadelphia Eagles',
                awayTeam: 'Dallas Cowboys',
                homeTeamAbbr: 'PHI',
                awayTeamAbbr: 'DAL',
                spread: -7.5,
                total: 46.5,
                homeML: -320,
                awayML: +260,
                gameTime: sundayLate,
                status: 'pre',
                venue: 'Lincoln Financial Field',
                isLive: false,
                isFinal: false,
                homeScore: 0,
                awayScore: 0
            },
            {
                gameId: `nfl_wk${weekNum}_8`,
                homeTeam: 'Los Angeles Chargers',
                awayTeam: 'Las Vegas Raiders',
                homeTeamAbbr: 'LAC',
                awayTeamAbbr: 'LV',
                spread: -3.5,
                total: 44.5,
                homeML: -165,
                awayML: +145,
                gameTime: sundayLate,
                status: 'pre',
                venue: 'SoFi Stadium',
                isLive: false,
                isFinal: false,
                homeScore: 0,
                awayScore: 0
            },
            {
                gameId: `nfl_wk${weekNum}_9`,
                homeTeam: 'San Francisco 49ers',
                awayTeam: 'Seattle Seahawks',
                homeTeamAbbr: 'SF',
                awayTeamAbbr: 'SEA',
                spread: -10.5,
                total: 43.5,
                homeML: -450,
                awayML: +350,
                gameTime: sundayNight,
                status: 'pre',
                venue: 'Levi\'s Stadium',
                isLive: false,
                isFinal: false,
                homeScore: 0,
                awayScore: 0
            },
            {
                gameId: `nfl_wk${weekNum}_10`,
                homeTeam: 'Baltimore Ravens',
                awayTeam: 'Pittsburgh Steelers',
                homeTeamAbbr: 'BAL',
                awayTeamAbbr: 'PIT',
                spread: -3,
                total: 41.5,
                homeML: -155,
                awayML: +135,
                gameTime: monday,
                status: 'pre',
                venue: 'M&T Bank Stadium',
                isLive: false,
                isFinal: false,
                homeScore: 0,
                awayScore: 0
            }
        ];
        
        // Add more games to reach 16 total
        const additionalGames = [
            { home: 'Tennessee Titans', away: 'Cleveland Browns', spread: 1.5 },
            { home: 'Atlanta Falcons', away: 'Carolina Panthers', spread: -4.5 },
            { home: 'New Orleans Saints', away: 'Tampa Bay Buccaneers', spread: -2.5 },
            { home: 'Denver Broncos', away: 'Minnesota Vikings', spread: 3 },
            { home: 'New York Giants', away: 'Washington Commanders', spread: 2.5 },
            { home: 'Los Angeles Rams', away: 'New York Jets', spread: -7 }
        ];
        
        additionalGames.forEach((game, index) => {
            games.push({
                gameId: `nfl_wk${weekNum}_${11 + index}`,
                homeTeam: game.home,
                awayTeam: game.away,
                homeTeamAbbr: game.home.substring(0, 3).toUpperCase(),
                awayTeamAbbr: game.away.substring(0, 3).toUpperCase(),
                spread: game.spread,
                total: 44 + Math.random() * 10,
                homeML: game.spread < 0 ? -140 - Math.abs(game.spread) * 10 : 120 + game.spread * 10,
                awayML: game.spread < 0 ? 120 + Math.abs(game.spread) * 10 : -140 - Math.abs(game.spread) * 10,
                gameTime: sunday,
                status: 'pre',
                venue: 'Stadium',
                isLive: false,
                isFinal: false,
                homeScore: 0,
                awayScore: 0
            });
        });
        
        return games;
    }
}