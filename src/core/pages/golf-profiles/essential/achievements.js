// Essential: achievements
const BaseGolfProfile = require('../../../base/BaseGolfProfile');

class achievements extends BaseGolfProfile {
    constructor() {
        super();
        this.pageName = 'achievements';
    }
    
    generateHTML(golferData) {
        const achievements = {
            major: [
                { icon: '🏆', title: 'Prep Tour Champion', event: 'Metro 349 at Texas 9', date: 'August 2024', detail: 'Shot 31 (-5) for wire-to-wire victory' },
                { icon: '🥉', title: '3rd Place - AAT Fall Masters', event: 'Srixon and Nike Fall Masters', date: 'September 2024', detail: '350 ranking points earned' },
                { icon: '🥈', title: 'Runner-Up Finish', event: 'Medalist Tour Metro 453', date: 'August 2024', detail: 'Shot 77 at Cedar Crest GC' }
            ],
            milestones: [
                { icon: '⭐', title: 'Top 15 National Ranking', detail: 'Achieved #13 AAT ranking in Boys 12 & Under', year: '2024' },
                { icon: '⛳', title: 'First Eagle', detail: 'Par 5, 15th hole at Whispering Pines', year: '2024' },
                { icon: '🎯', title: 'Sub-75 Round', detail: 'Personal best 74 in competition', year: '2024' },
                { icon: '📊', title: '1,000+ Ranking Points', detail: 'Accumulated 1,190 AAT points in 2024', year: '2024' }
            ],
            records: [
                { category: 'Lowest Round', value: '74', venue: 'Mansfield National GC' },
                { category: 'Best 9-Hole Score', value: '31 (-5)', venue: 'Texas 9' },
                { category: 'Most Birdies (Single Round)', value: '5', venue: 'Cedar Crest GC' },
                { category: 'Longest Drive', value: '245 yards', venue: 'Fields Ranch West' }
            ]
        };
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${golferData.golferName} - Achievements</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, 'SF Pro Display', sans-serif;
            background: #0a0f0d;
            color: #ffffff;
            min-height: 100vh;
        }
        
        /* Animated Background */
        .bg-gradient {
            position: fixed;
            width: 100%;
            height: 100%;
            background: radial-gradient(ellipse at top, #0f4c3a 0%, #0a0f0d 50%);
            z-index: -1;
        }
        
        .sparkles {
            position: fixed;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: -1;
        }
        
        .sparkle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #10b981;
            border-radius: 50%;
            animation: sparkle 3s linear infinite;
        }
        
        @keyframes sparkle {
            0% { transform: translateY(100vh) scale(0); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateY(-10vh) scale(1); opacity: 0; }
        }
        
        .sparkle:nth-child(1) { left: 10%; animation-delay: 0s; }
        .sparkle:nth-child(2) { left: 30%; animation-delay: 0.5s; }
        .sparkle:nth-child(3) { left: 50%; animation-delay: 1s; }
        .sparkle:nth-child(4) { left: 70%; animation-delay: 1.5s; }
        .sparkle:nth-child(5) { left: 90%; animation-delay: 2s; }
        
        /* Navigation */
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
            animation: fadeInDown 0.8s ease;
        }
        
        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
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
        
        /* Trophy Showcase */
        .trophy-showcase {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 24px;
            padding: 2rem;
            margin-bottom: 3rem;
            text-align: center;
            animation: fadeInUp 0.8s ease 0.2s both;
        }
        
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .trophy-row {
            display: flex;
            justify-content: center;
            gap: 3rem;
            flex-wrap: wrap;
            margin-bottom: 2rem;
        }
        
        .trophy-item {
            animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .trophy-item:nth-child(2) { animation-delay: 0.2s; }
        .trophy-item:nth-child(3) { animation-delay: 0.4s; }
        
        .trophy-icon {
            font-size: 4rem;
            margin-bottom: 0.5rem;
        }
        
        .trophy-count {
            font-size: 1.5rem;
            font-weight: 700;
            color: #10b981;
        }
        
        .trophy-label {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
        }
        
        /* Achievement Sections */
        .achievements-grid {
            display: grid;
            gap: 3rem;
            animation: fadeIn 0.8s ease 0.4s both;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .achievement-section {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(16, 185, 129, 0.1);
            border-radius: 24px;
            padding: 2rem;
        }
        
        .section-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .section-title {
            font-size: 1.75rem;
            font-weight: 600;
            color: #10b981;
        }
        
        /* Major Wins */
        .wins-grid {
            display: grid;
            gap: 1.5rem;
        }
        
        .win-card {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.05));
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 16px;
            padding: 1.5rem;
            display: flex;
            gap: 1.5rem;
            align-items: center;
            transition: all 0.3s;
            cursor: pointer;
        }
        
        .win-card:hover {
            transform: translateX(10px);
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.2);
        }
        
        .win-icon {
            font-size: 2.5rem;
        }
        
        .win-details {
            flex: 1;
        }
        
        .win-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
        }
        
        .win-event {
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 0.25rem;
        }
        
        .win-date {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.5);
        }
        
        .win-detail {
            font-size: 0.875rem;
            color: #10b981;
            margin-top: 0.5rem;
        }
        
        /* Milestones */
        .milestones-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
        }
        
        .milestone-card {
            background: rgba(0, 0, 0, 0.3);
            border-left: 4px solid #10b981;
            border-radius: 12px;
            padding: 1.5rem;
            transition: all 0.3s;
        }
        
        .milestone-card:hover {
            background: rgba(16, 185, 129, 0.1);
            transform: translateY(-5px);
        }
        
        .milestone-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.5rem;
        }
        
        .milestone-icon {
            font-size: 1.5rem;
        }
        
        .milestone-title {
            font-weight: 600;
        }
        
        .milestone-detail {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
        }
        
        .milestone-year {
            color: #10b981;
            font-weight: 600;
            margin-top: 0.5rem;
        }
        
        /* Records Table */
        .records-table {
            display: grid;
            gap: 1rem;
        }
        
        .record-row {
            display: grid;
            grid-template-columns: 2fr 1fr 2fr;
            gap: 1rem;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            align-items: center;
            transition: all 0.3s;
        }
        
        .record-row:hover {
            background: rgba(16, 185, 129, 0.1);
            transform: translateX(5px);
        }
        
        .record-category {
            color: rgba(255, 255, 255, 0.7);
        }
        
        .record-value {
            font-size: 1.25rem;
            font-weight: 700;
            color: #10b981;
            text-align: center;
        }
        
        .record-venue {
            text-align: right;
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.875rem;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .milestones-grid {
                grid-template-columns: 1fr;
            }
            
            .record-row {
                grid-template-columns: 1fr;
                text-align: center;
            }
            
            .nav-links {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="bg-gradient"></div>
    <div class="sparkles">
        <div class="sparkle"></div>
        <div class="sparkle"></div>
        <div class="sparkle"></div>
        <div class="sparkle"></div>
        <div class="sparkle"></div>
    </div>
    
    <header class="nav-header">
        <div class="nav-container">
            <div class="nav-logo">⛳ ${golferData.golferName}</div>
            <nav class="nav-links">
                <a href="index.html">Overview</a>
                <a href="stats-dashboard.html">Stats</a>
                <a href="tournament-history.html">Tournaments</a>
                <a href="academic-info.html">Academics</a>
                <a href="achievements.html" class="active">Achievements</a>
                <a href="contact.html">Contact</a>
            </nav>
        </div>
    </header>
    
    <main class="main-content">
        <div class="page-header">
            <h1 class="page-title">Achievements & Awards</h1>
            <p class="page-subtitle">Tournament victories, milestones, and personal records</p>
        </div>
        
        <!-- Trophy Showcase -->
        <div class="trophy-showcase">
            <div class="trophy-row">
                <div class="trophy-item">
                    <div class="trophy-icon">🏆</div>
                    <div class="trophy-count">1</div>
                    <div class="trophy-label">Tournament Win</div>
                </div>
                <div class="trophy-item">
                    <div class="trophy-icon">🥈</div>
                    <div class="trophy-count">1</div>
                    <div class="trophy-label">Runner-Up</div>
                </div>
                <div class="trophy-item">
                    <div class="trophy-icon">🥉</div>
                    <div class="trophy-count">1</div>
                    <div class="trophy-label">Third Place</div>
                </div>
            </div>
        </div>
        
        <div class="achievements-grid">
            <!-- Major Wins -->
            <div class="achievement-section">
                <div class="section-header">
                    <h2 class="section-title">🏆 Major Tournament Results</h2>
                </div>
                <div class="wins-grid">
                    ${achievements.major.map(win => `
                        <div class="win-card">
                            <div class="win-icon">${win.icon}</div>
                            <div class="win-details">
                                <div class="win-title">${win.title}</div>
                                <div class="win-event">${win.event}</div>
                                <div class="win-date">${win.date}</div>
                                <div class="win-detail">${win.detail}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Milestones -->
            <div class="achievement-section">
                <div class="section-header">
                    <h2 class="section-title">⭐ Career Milestones</h2>
                </div>
                <div class="milestones-grid">
                    ${achievements.milestones.map(milestone => `
                        <div class="milestone-card">
                            <div class="milestone-header">
                                <span class="milestone-icon">${milestone.icon}</span>
                                <span class="milestone-title">${milestone.title}</span>
                            </div>
                            <div class="milestone-detail">${milestone.detail}</div>
                            <div class="milestone-year">${milestone.year}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Personal Records -->
            <div class="achievement-section">
                <div class="section-header">
                    <h2 class="section-title">📊 Personal Records</h2>
                </div>
                <div class="records-table">
                    ${achievements.records.map(record => `
                        <div class="record-row">
                            <div class="record-category">${record.category}</div>
                            <div class="record-value">${record.value}</div>
                            <div class="record-venue">${record.venue}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </main>
</body>
</html>`;
    }
}

module.exports = achievements;