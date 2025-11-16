const BaseGolfProfile = require('../../../base/BaseGolfProfile');

class tournamenthistory extends BaseGolfProfile {
    constructor() {
        super();
        this.pageName = 'tournament-history';
    }
    
    generateHTML(golferData) {
        // Benjamin's tournament data
        const tournaments2024 = [
            { date: 'Aug 3', name: 'Prep Tour: Metro 349', course: 'Texas 9', score: '31', result: '1st', points: '', tour: 'Prep' },
            { date: 'Aug 5', name: 'Medalist Tour: Metro 453', course: 'Cedar Crest GC', score: '77', result: '2nd', points: '', tour: 'Medalist' },
            { date: 'Sep 7-8', name: 'AAT: Fall Showdown', course: 'Watters Creek', score: '79-77 (156)', result: '10th', points: '120', tour: 'AAT' },
            { date: 'Sep 21-22', name: 'AAT: Srixon and Nike Fall Masters', course: 'Mansfield National GC', score: '81-74 (155)', result: '3rd', points: '350', tour: 'AAT' },
            { date: 'Dec 7-8', name: 'Kinetic Centre #WHOSNEXT Major', course: 'Fields Ranch West', score: '78-84 (162)', result: '6th', points: '400', tour: 'AAT' },
            { date: 'Dec 14-15', name: 'AAT: WHOSNEXT Major at The Bridges', course: 'The Bridges GC', score: '92-41 (133)', result: '8th', points: '320', tour: 'AAT' }
        ];
        
        const tournaments2025 = [
            { date: 'Feb 17', name: 'Medalist Tour: Metro 212', course: 'Brookhaven CC', score: '84', result: 'T4', points: '137.50', tour: 'Medalist' },
            { date: 'Jun 18-19', name: 'AAT: ahead Summer Slam', course: 'Sherrill Park GC', score: '81-76 (157)', result: '14th', points: '80', tour: 'AAT' },
            { date: 'Aug 4-5', name: 'Southern Turf Co. Gleneagles Showcase', course: 'Gleneagles CC', score: '82-83 (165)', result: 'T11', points: '105', tour: 'Other' }
        ];
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${golferData.golferName} - Tournament History</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, 'SF Pro Display', sans-serif;
            background: #0a0f0d;
            color: #ffffff;
            min-height: 100vh;
        }
        
        /* Background */
        .bg-gradient {
            position: fixed;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0a0f0d 0%, #0f4c3a 100%);
            z-index: -1;
        }
        
        /* Navigation (reuse from profile-home) */
        .nav-header {
            position: fixed;
            top: 0;
            width: 100%;
            background: rgba(10, 15, 13, 0.95);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(16, 185, 129, 0.2);
            z-index: 1000;
            padding: 1rem 0;
        }
        
        .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .nav-logo {
            font-size: 1.25rem;
            font-weight: 700;
            background: linear-gradient(135deg, #10b981, #34d399);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .nav-links {
            display: flex;
            gap: 3rem;
        }
        
        .nav-links a {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            font-size: 0.95rem;
            font-weight: 500;
            transition: all 0.3s;
            position: relative;
        }
        
        .nav-links a.active {
            color: #10b981;
        }
        
        /* Main Content */
        .main-content {
            margin-top: 80px;
            padding: 3rem 2rem;
            max-width: 1400px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .page-header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .page-title {
            font-size: 3rem;
            font-weight: 700;
            background: linear-gradient(135deg, #ffffff, #10b981);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
        }
        
        .page-subtitle {
            color: rgba(255, 255, 255, 0.6);
            font-size: 1.1rem;
        }
        
        /* Stats Summary */
        .stats-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }
        
        .summary-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 16px;
            padding: 1.5rem;
            text-align: center;
        }
        
        .summary-value {
            font-size: 2rem;
            font-weight: 700;
            color: #10b981;
            margin-bottom: 0.5rem;
        }
        
        .summary-label {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        /* Year Selector */
        .year-selector {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .year-btn {
            padding: 0.75rem 2rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 25px;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 500;
        }
        
        .year-btn.active {
            background: linear-gradient(135deg, #10b981, #34d399);
            border-color: transparent;
            color: white;
        }
        
        .year-btn:hover {
            border-color: #10b981;
        }
        
        /* Tournament Table */
        .tournament-section {
            margin-bottom: 3rem;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #10b981;
        }
        
        .tournament-table {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid rgba(16, 185, 129, 0.1);
        }
        
        .table-header {
            background: rgba(16, 185, 129, 0.1);
            display: grid;
            grid-template-columns: 100px 2fr 1.5fr 100px 100px 80px 80px;
            padding: 1rem 1.5rem;
            font-weight: 600;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #10b981;
        }
        
        .tournament-row {
            display: grid;
            grid-template-columns: 100px 2fr 1.5fr 100px 100px 80px 80px;
            padding: 1.25rem 1.5rem;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.3s;
            align-items: center;
        }
        
        .tournament-row:hover {
            background: rgba(16, 185, 129, 0.05);
            transform: translateX(5px);
        }
        
        .date-cell {
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.875rem;
        }
        
        .tournament-name {
            font-weight: 600;
            color: white;
        }
        
        .course-name {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.95rem;
        }
        
        .score-cell {
            font-weight: 500;
        }
        
        .result-cell {
            font-weight: 600;
        }
        
        .result-cell.first {
            color: #fbbf24;
        }
        
        .result-cell.second {
            color: #cbd5e1;
        }
        
        .result-cell.third {
            color: #fb923c;
        }
        
        .result-cell.top10 {
            color: #10b981;
        }
        
        .points-cell {
            color: #10b981;
            font-weight: 600;
        }
        
        .tour-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            text-align: center;
        }
        
        .tour-badge.AAT {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }
        
        .tour-badge.Prep {
            background: rgba(251, 191, 36, 0.2);
            color: #fbbf24;
        }
        
        .tour-badge.Medalist {
            background: rgba(139, 92, 246, 0.2);
            color: #8b5cf6;
        }
        
        /* Mobile Responsive */
        @media (max-width: 968px) {
            .table-header,
            .tournament-row {
                grid-template-columns: 1fr;
                gap: 0.5rem;
            }
            
            .tournament-row {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 12px;
                margin-bottom: 1rem;
            }
            
            .table-header {
                display: none;
            }
            
            .tournament-row > * {
                display: flex;
                justify-content: space-between;
            }
            
            .tournament-row > *::before {
                content: attr(data-label);
                font-weight: 600;
                color: rgba(255, 255, 255, 0.5);
            }
        }
    </style>
</head>
<body>
    <div class="bg-gradient"></div>
    
    <header class="nav-header">
        <div class="nav-container">
            <div class="nav-logo">⛳ ${golferData.golferName}</div>
            <nav class="nav-links">
                <a href="index.html">Overview</a>
                <a href="stats-dashboard.html">Stats</a>
                <a href="tournament-history.html" class="active">Tournaments</a>
                <a href="academic-info.html">Academics</a>
                <a href="contact.html">Contact</a>
            </nav>
        </div>
    </header>
    
    <main class="main-content">
        <div class="page-header">
            <h1 class="page-title">Tournament History</h1>
            <p class="page-subtitle">Complete competitive record and achievements</p>
        </div>
        
        <div class="stats-summary">
            <div class="summary-card">
                <div class="summary-value">9</div>
                <div class="summary-label">Total Events</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">1</div>
                <div class="summary-label">Wins</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">1</div>
                <div class="summary-label">Runner-Up</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">4</div>
                <div class="summary-label">Top 10s</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">1,512.50</div>
                <div class="summary-label">Total Points</div>
            </div>
        </div>
        
        <div class="year-selector">
            <button class="year-btn active" onclick="showYear(2024)">2024 Season</button>
            <button class="year-btn" onclick="showYear(2025)">2025 Season</button>
            <button class="year-btn" onclick="showAll()">All Time</button>
        </div>
        
        <div id="tournaments-2024" class="tournament-section">
            <div class="section-header">
                <h2 class="section-title">2024 Season</h2>
                <span style="color: rgba(255,255,255,0.5)">6 Events • 1,190 Points</span>
            </div>
            <div class="tournament-table">
                <div class="table-header">
                    <div>Date</div>
                    <div>Tournament</div>
                    <div>Course</div>
                    <div>Score</div>
                    <div>Result</div>
                    <div>Points</div>
                    <div>Tour</div>
                </div>
                ${tournaments2024.map(t => this.renderTournamentRow(t)).join('')}
            </div>
        </div>
        
        <div id="tournaments-2025" class="tournament-section" style="display: none;">
            <div class="section-header">
                <h2 class="section-title">2025 Season</h2>
                <span style="color: rgba(255,255,255,0.5)">3 Events • 322.50 Points</span>
            </div>
            <div class="tournament-table">
                <div class="table-header">
                    <div>Date</div>
                    <div>Tournament</div>
                    <div>Course</div>
                    <div>Score</div>
                    <div>Result</div>
                    <div>Points</div>
                    <div>Tour</div>
                </div>
                ${tournaments2025.map(t => this.renderTournamentRow(t)).join('')}
            </div>
        </div>
    </main>
    
    <script>
        function showYear(year) {
            document.querySelectorAll('.tournament-section').forEach(section => {
                section.style.display = 'none';
            });
            document.getElementById('tournaments-' + year).style.display = 'block';
            
            document.querySelectorAll('.year-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
        }
        
        function showAll() {
            document.querySelectorAll('.tournament-section').forEach(section => {
                section.style.display = 'block';
            });
            
            document.querySelectorAll('.year-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
        }
    </script>
</body>
</html>`;
    }
    
    renderTournamentRow(tournament) {
        const resultClass = tournament.result === '1st' ? 'first' : 
                           tournament.result === '2nd' ? 'second' :
                           tournament.result === '3rd' ? 'third' :
                           tournament.result.includes('T') && parseInt(tournament.result.slice(1)) <= 10 ? 'top10' : '';
        
        return `
            <div class="tournament-row">
                <div class="date-cell" data-label="Date">${tournament.date}</div>
                <div class="tournament-name" data-label="Tournament">${tournament.name}</div>
                <div class="course-name" data-label="Course">${tournament.course}</div>
                <div class="score-cell" data-label="Score">${tournament.score}</div>
                <div class="result-cell ${resultClass}" data-label="Result">${tournament.result}</div>
                <div class="points-cell" data-label="Points">${tournament.points || '-'}</div>
                <div data-label="Tour"><span class="tour-badge ${tournament.tour}">${tournament.tour}</span></div>
            </div>
        `;
    }
}

module.exports = tournamenthistory;