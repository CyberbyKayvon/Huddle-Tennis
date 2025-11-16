// quick-league/utils/Constants.js
export const CONSTANTS = {
    SPORTS: {
        NFL: 'NFL',
        NCAAF: 'NCAAF',
        NBA: 'NBA',
        MLB: 'MLB',
        NHL: 'NHL'
    },
    
    BET_TYPES: {
        SPREAD: 'spread',
        MONEYLINE: 'moneyline',
        OVERUNDER: 'overunder',
        PROPS: 'props'
    },
    
    BET_TYPE_ICONS: {
        spread: '📊',
        moneyline: '💰',
        overunder: '📈',
        props: '🎯'
    },
    
    LEAGUE_DURATIONS: [
        { value: 1, label: '1 Week', icon: '⚡' },
        { value: 3, label: '3 Weeks', icon: '🔥' },
        { value: 6, label: '6 Weeks', icon: '📅' },
        { value: 10, label: '10 Weeks', icon: '📆' },
        { value: 18, label: 'Full Season', icon: '🏆' },
        { value: 'custom', label: 'Custom', icon: '⚙️' }
    ],
    
    GAMES_PER_WEEK: [
        { value: '2-4', label: '2-4 Games', min: 2, max: 4 },
        { value: '4-6', label: '4-6 Games', min: 4, max: 6 },
        { value: '7-10', label: '7-10 Games', min: 7, max: 10 },
        { value: '10-12', label: '10-12 Games', min: 10, max: 12 },
        { value: '12-16', label: '12-16 Games', min: 12, max: 16 },
        { value: 'all', label: 'All Games', min: 16, max: 16 },
        { value: 'custom', label: 'Custom Range' }
    ],
    
    SCORING_TYPES: [
        { value: 'weekly', label: 'Weekly Reset', description: 'Fresh start each week' },
        { value: 'cumulative', label: 'Season Total', description: 'Points accumulate' }
    ],
    
    TEAM_MAPPINGS: {
        // NFL (32 teams)
        'Bills': 'BUF', 'Buffalo': 'BUF', 'Buffalo Bills': 'BUF',
        'Dolphins': 'MIA', 'Miami': 'MIA', 'Miami Dolphins': 'MIA',
        'Patriots': 'NE', 'New England': 'NE', 'New England Patriots': 'NE',
        'Jets': 'NYJ', 'New York Jets': 'NYJ', 'NY Jets': 'NYJ',
        'Ravens': 'BAL', 'Baltimore': 'BAL', 'Baltimore Ravens': 'BAL',
        'Bengals': 'CIN', 'Cincinnati': 'CIN', 'Cincinnati Bengals': 'CIN',
        'Browns': 'CLE', 'Cleveland': 'CLE', 'Cleveland Browns': 'CLE',
        'Steelers': 'PIT', 'Pittsburgh': 'PIT', 'Pittsburgh Steelers': 'PIT',
        'Texans': 'HOU', 'Houston': 'HOU', 'Houston Texans': 'HOU',
        'Colts': 'IND', 'Indianapolis': 'IND', 'Indianapolis Colts': 'IND',
        'Jaguars': 'JAX', 'Jacksonville': 'JAX', 'Jacksonville Jaguars': 'JAX',
        'Titans': 'TEN', 'Tennessee': 'TEN', 'Tennessee Titans': 'TEN',
        'Broncos': 'DEN', 'Denver': 'DEN', 'Denver Broncos': 'DEN',
        'Chiefs': 'KC', 'Kansas City': 'KC', 'Kansas City Chiefs': 'KC',
        'Raiders': 'LV', 'Las Vegas': 'LV', 'Las Vegas Raiders': 'LV',
        'Chargers': 'LAC', 'Los Angeles Chargers': 'LAC', 'LA Chargers': 'LAC',
        'Cowboys': 'DAL', 'Dallas': 'DAL', 'Dallas Cowboys': 'DAL',
        'Giants': 'NYG', 'New York Giants': 'NYG', 'NY Giants': 'NYG',
        'Eagles': 'PHI', 'Philadelphia': 'PHI', 'Philadelphia Eagles': 'PHI',
        'Commanders': 'WSH', 'Washington': 'WSH', 'Washington Commanders': 'WSH',
        'Bears': 'CHI', 'Chicago': 'CHI', 'Chicago Bears': 'CHI',
        'Lions': 'DET', 'Detroit': 'DET', 'Detroit Lions': 'DET',
        'Packers': 'GB', 'Green Bay': 'GB', 'Green Bay Packers': 'GB',
        'Vikings': 'MIN', 'Minnesota': 'MIN', 'Minnesota Vikings': 'MIN',
        'Falcons': 'ATL', 'Atlanta': 'ATL', 'Atlanta Falcons': 'ATL',
        'Panthers': 'CAR', 'Carolina': 'CAR', 'Carolina Panthers': 'CAR',
        'Saints': 'NO', 'New Orleans': 'NO', 'New Orleans Saints': 'NO',
        'Buccaneers': 'TB', 'Tampa Bay': 'TB', 'Tampa Bay Buccaneers': 'TB', 'Bucs': 'TB',
        '49ers': 'SF', 'San Francisco': 'SF', 'San Francisco 49ers': 'SF',
        'Cardinals': 'ARI', 'Arizona': 'ARI', 'Arizona Cardinals': 'ARI',
        'Rams': 'LAR', 'Los Angeles Rams': 'LAR', 'LA Rams': 'LAR',
        'Seahawks': 'SEA', 'Seattle': 'SEA', 'Seattle Seahawks': 'SEA',
        
        // MLB (30 teams)
        'Yankees': 'NYY', 'New York Yankees': 'NYY',
        'Red Sox': 'BOS', 'Boston Red Sox': 'BOS',
        'Blue Jays': 'TOR', 'Toronto Blue Jays': 'TOR',
        'Rays': 'TB', 'Tampa Bay Rays': 'TB',
        'Orioles': 'BAL', 'Baltimore Orioles': 'BAL',
        'White Sox': 'CWS', 'Chicago White Sox': 'CWS',
        'Guardians': 'CLE', 'Cleveland Guardians': 'CLE',
        'Tigers': 'DET', 'Detroit Tigers': 'DET',
        'Royals': 'KC', 'Kansas City Royals': 'KC',
        'Twins': 'MIN', 'Minnesota Twins': 'MIN',
        'Astros': 'HOU', 'Houston Astros': 'HOU',
        'Athletics': 'OAK', 'Oakland Athletics': 'OAK', "A's": 'OAK',
        'Rangers': 'TEX', 'Texas Rangers': 'TEX',
        'Angels': 'LAA', 'Los Angeles Angels': 'LAA', 'LA Angels': 'LAA',
        'Mariners': 'SEA', 'Seattle Mariners': 'SEA',
        'Mets': 'NYM', 'New York Mets': 'NYM',
        'Phillies': 'PHI', 'Philadelphia Phillies': 'PHI',
        'Nationals': 'WSH', 'Washington Nationals': 'WSH',
        'Marlins': 'MIA', 'Miami Marlins': 'MIA',
        'Braves': 'ATL', 'Atlanta Braves': 'ATL',
        'Cubs': 'CHC', 'Chicago Cubs': 'CHC',
        'Reds': 'CIN', 'Cincinnati Reds': 'CIN',
        'Brewers': 'MIL', 'Milwaukee Brewers': 'MIL',
        'Pirates': 'PIT', 'Pittsburgh Pirates': 'PIT',
        'Cardinals': 'STL', 'St. Louis Cardinals': 'STL', 'Saint Louis Cardinals': 'STL',
        'Dodgers': 'LAD', 'Los Angeles Dodgers': 'LAD', 'LA Dodgers': 'LAD',
        'Giants': 'SF', 'San Francisco Giants': 'SF',
        'Padres': 'SD', 'San Diego Padres': 'SD',
        'Rockies': 'COL', 'Colorado Rockies': 'COL',
        'Diamondbacks': 'ARI', 'Arizona Diamondbacks': 'ARI', 'D-backs': 'ARI',
        
        // NBA (30 teams)
        'Celtics': 'BOS', 'Boston Celtics': 'BOS',
        'Nets': 'BKN', 'Brooklyn Nets': 'BKN',
        'Knicks': 'NY', 'New York Knicks': 'NY',
        '76ers': 'PHI', 'Philadelphia 76ers': 'PHI', 'Sixers': 'PHI',
        'Raptors': 'TOR', 'Toronto Raptors': 'TOR',
        'Bulls': 'CHI', 'Chicago Bulls': 'CHI',
        'Cavaliers': 'CLE', 'Cleveland Cavaliers': 'CLE', 'Cavs': 'CLE',
        'Pistons': 'DET', 'Detroit Pistons': 'DET',
        'Pacers': 'IND', 'Indiana Pacers': 'IND',
        'Bucks': 'MIL', 'Milwaukee Bucks': 'MIL',
        'Hawks': 'ATL', 'Atlanta Hawks': 'ATL',
        'Hornets': 'CHA', 'Charlotte Hornets': 'CHA',
        'Heat': 'MIA', 'Miami Heat': 'MIA',
        'Magic': 'ORL', 'Orlando Magic': 'ORL',
        'Wizards': 'WAS', 'Washington Wizards': 'WAS',
        'Nuggets': 'DEN', 'Denver Nuggets': 'DEN',
        'Timberwolves': 'MIN', 'Minnesota Timberwolves': 'MIN', 'T-Wolves': 'MIN',
        'Thunder': 'OKC', 'Oklahoma City Thunder': 'OKC',
        'Trail Blazers': 'POR', 'Portland Trail Blazers': 'POR', 'Blazers': 'POR',
        'Jazz': 'UTA', 'Utah Jazz': 'UTA',
        'Warriors': 'GSW', 'Golden State Warriors': 'GSW',
        'Clippers': 'LAC', 'Los Angeles Clippers': 'LAC', 'LA Clippers': 'LAC',
        'Lakers': 'LAL', 'Los Angeles Lakers': 'LAL', 'LA Lakers': 'LAL',
        'Suns': 'PHX', 'Phoenix Suns': 'PHX',
        'Kings': 'SAC', 'Sacramento Kings': 'SAC',
        'Mavericks': 'DAL', 'Dallas Mavericks': 'DAL', 'Mavs': 'DAL',
        'Rockets': 'HOU', 'Houston Rockets': 'HOU',
        'Grizzlies': 'MEM', 'Memphis Grizzlies': 'MEM',
        'Pelicans': 'NO', 'New Orleans Pelicans': 'NO', 'Pels': 'NO',
        'Spurs': 'SA', 'San Antonio Spurs': 'SA'
    },
    
    CFB_TEAMS: {
        // Power 5 Conferences
        // SEC
        'Alabama': '333', 'Auburn': '2', 'Arkansas': '8', 'Florida': '57', 'Georgia': '61',
        'Kentucky': '96', 'LSU': '99', 'Ole Miss': '145', 'Mississippi State': '344',
        'Missouri': '142', 'South Carolina': '2579', 'Tennessee': '2633', 'Texas A&M': '245',
        'Vanderbilt': '238', 'Texas': '251', 'Oklahoma': '201',
        
        // Big Ten
        'Illinois': '356', 'Indiana': '84', 'Iowa': '2294', 'Maryland': '120',
        'Michigan': '130', 'Michigan State': '127', 'Minnesota': '135', 'Nebraska': '158',
        'Northwestern': '77', 'Ohio State': '194', 'Penn State': '213', 'Purdue': '2509',
        'Rutgers': '164', 'Wisconsin': '275', 'USC': '30', 'UCLA': '26',
        'Oregon': '2483', 'Washington': '264',
        
        // ACC
        'Boston College': '103', 'Clemson': '228', 'Duke': '150', 'Florida State': '52',
        'Georgia Tech': '59', 'Louisville': '97', 'Miami': '2390', 'NC State': '152',
        'North Carolina': '153', 'Notre Dame': '87', 'Pittsburgh': '221', 'Syracuse': '183',
        'Virginia': '258', 'Virginia Tech': '259', 'Wake Forest': '154', 'California': '25',
        'Stanford': '24', 'SMU': '2567',
        
        // Big 12
        'Baylor': '239', 'BYU': '252', 'Cincinnati': '2132', 'Houston': '248',
        'Iowa State': '66', 'Kansas': '2305', 'Kansas State': '2306', 'Oklahoma State': '197',
        'TCU': '2628', 'Texas Tech': '2641', 'UCF': '2116', 'West Virginia': '277',
        'Colorado': '38', 'Arizona': '12', 'Arizona State': '9', 'Utah': '254',
        
        // Pac-12 (Legacy)
        'Oregon State': '204', 'Washington State': '265',
        
        // Group of 5
        // AAC
        'Charlotte': '2429', 'East Carolina': '151', 'FAU': '2226', 'Memphis': '235',
        'Navy': '2426', 'Rice': '242', 'South Florida': '58', 'Temple': '218',
        'Tulane': '2655', 'Tulsa': '202', 'UAB': '5', 'UTSA': '2636',
        'Army': '349', 'North Texas': '249',
        
        // Mountain West
        'Air Force': '2005', 'Boise State': '68', 'Colorado State': '36', 'Fresno State': '278',
        'Hawaii': '62', 'Nevada': '2440', 'New Mexico': '167', 'San Diego State': '21',
        'San Jose State': '23', 'UNLV': '2439', 'Utah State': '328', 'Wyoming': '2751',
        
        // MAC
        'Akron': '2006', 'Ball State': '2050', 'Bowling Green': '189', 'Buffalo': '2084',
        'Central Michigan': '2117', 'Eastern Michigan': '2199', 'Kent State': '2309',
        'Miami (OH)': '193', 'Northern Illinois': '2459', 'Ohio': '195', 'Toledo': '2649',
        'Western Michigan': '2711',
        
        // Sun Belt
        'App State': '2026', 'Arkansas State': '2032', 'Coastal Carolina': '324',
        'Georgia Southern': '290', 'Georgia State': '2247', 'James Madison': '256',
        'Louisiana': '309', 'Louisiana Monroe': '2433', 'Marshall': '276',
        'Old Dominion': '295', 'South Alabama': '6', 'Southern Miss': '2572',
        'Texas State': '326', 'Troy': '2653',
        
        // Conference USA
        'FIU': '2229', 'Jacksonville State': '55', 'Liberty': '2335', 'Louisiana Tech': '2348',
        'Middle Tennessee': '2393', 'New Mexico State': '166', 'Sam Houston': '2534',
        'UTEP': '2638', 'Western Kentucky': '98',
        
        // Independents
        'UConn': '41', 'UMass': '113'
    }
};