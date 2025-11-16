// Essential: schedule
const BaseGolfProfile = require('../../../base/BaseGolfProfile');

class schedule extends BaseGolfProfile {
    constructor() {
        super();
        this.pageName = 'schedule';
    }
    
    generateHTML(golferData) {
        // Upcoming tournaments from September 2025
        const upcomingEvents = [
            { date: '2025-09-20', name: 'Fall Championship', location: 'Dallas National GC', tour: 'AAT', status: 'registered' },
            { date: '2025-10-04', name: 'Texas State Junior', location: 'Colonial CC', tour: 'TJGT', status: 'registered' },
            { date: '2025-10-18', name: 'Southwest Regional', location: 'TPC Las Colinas', tour: 'AJGA', status: 'pending' },
            { date: '2025-11-08', name: 'Thanksgiving Classic', location: 'Whispering Pines', tour: 'AAT', status: 'registered' },
            { date: '2025-11-22', name: 'Winter Prep Tour', location: 'Brook Hollow GC', tour: 'Prep', status: 'confirmed' },
            { date: '2025-12-06', name: 'Holiday Invitational', location: 'Gleneagles CC', tour: 'AAT', status: 'pending' },
            { date: '2025-12-20', name: 'Year-End Championship', location: 'The Bridges GC', tour: 'AAT', status: 'invited' }
        ];
        
        const pastEvents = [
            { date: '2025-08-04', name: 'Gleneagles Showcase', location: 'Gleneagles CC', result: 'T11', points: '105' },
            { date: '2025-06-18', name: 'Summer Slam', location: 'Sherrill Park GC', result: '14th', points: '80' },
            { date: '2025-02-17', name: 'Metro 212', location: 'Brookhaven CC', result: 'T4', points: '137.50' }
        ];
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${golferData.golferName} - Tournament Schedule</title>
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
        
        /* Calendar Overview */
        .calendar-overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 3rem;
            animation: fadeInUp 0.8s ease 0.2s both;
        }
        
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .month-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 16px;
            padding: 1.5rem;
            text-align: center;
            transition: all 0.3s;
        }
        
        .month-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.2);
        }
        
        .month-card.active {
            background: rgba(16, 185, 129, 0.1);
            border-color: #10b981;
        }
        
        .month-name {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            margin-bottom: 0.5rem;
        }
        
        .event-count {
            font-size: 2rem;
            font-weight: 700;
            color: #10b981;
        }
        
        /* Events Sections */
        .events-container {
            display: grid;
            gap: 3rem;
        }
        
        .events-section {
            animation: fadeIn 0.8s ease 0.4s both;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
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
        
        .section-badge {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
            padding: 0.25rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
        }
        
        .events-grid {
            display: grid;
            gap: 1.5rem;
        }
        
        .event-card {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(16, 185, 129, 0.1);
            border-radius: 20px;
            padding: 1.5rem;
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 2rem;
            align-items: center;
            transition: all 0.3s;
            cursor: pointer;
        }
        
        .event-card:hover {
            transform: translateX(10px);
            background: rgba(16, 185, 129, 0.05);
            border-color: rgba(16, 185, 129, 0.3);
        }
        
        .event-date {
            text-align: center;
            padding: 1rem;
            background: rgba(16, 185, 129, 0.1);
            border-radius: 12px;
            min-width: 80px;
        }
        
        .event-day {
            font-size: 1.75rem;
            font-weight: 700;
            color: #10b981;
        }
        
        .event-month {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
        }
        
        .event-details {
            flex: 1;
        }
        
        .event-name {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .event-location {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.95rem;
            margin-bottom: 0.5rem;
        }
        
        .event-meta {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }
        
        .meta-tag {
            padding: 0.25rem 0.75rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .tour-tag {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }
        
        .event-status {
            padding: 0.5rem 1.5rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-registered {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }
        
        .status-pending {
            background: rgba(251, 191, 36, 0.2);
            color: #fbbf24;
        }
        
        .status-confirmed {
            background: rgba(59, 130, 246, 0.2);
            color: #3b82f6;
        }
        
        .status-invited {
            background: rgba(139, 92, 246, 0.2);
            color: #8b5cf6;
        }
        
        .event-result {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
        }
        
        .result-position {
            font-size: 1.5rem;
            font-weight: 700;
            color: #10b981;
        }
        
        .result-points {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.5);
        }
        
        /* Add Event Button */
        .add-event-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.02);
            border: 2px dashed rgba(16, 185, 129, 0.3);
            border-radius: 20px;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 2rem;
        }
        
        .add-event-btn:hover {
            background: rgba(16, 185, 129, 0.05);
            border-color: #10b981;
            color: #10b981;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .event-card {
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
    
    <header class="nav-header">
        <div class="nav-container">
            <div class="nav-logo">⛳ ${golferData.golferName}</div>
            <nav class="nav-links">
                <a href="index.html">Overview</a>
                <a href="stats-dashboard.html">Stats</a>
                <a href="tournament-history.html">Tournaments</a>
                <a href="academic-info.html">Academics</a>
                <a href="contact.html">Contact</a>
                <a href="schedule.html" class="active">Schedule</a>
            </nav>
        </div>
    </header>
    
    <main class="main-content">
        <div class="page-header">
            <h1 class="page-title">Tournament Schedule</h1>
            <p class="page-subtitle">Upcoming events and competition calendar</p>
        </div>
        
        <!-- Calendar Overview -->
        <div class="calendar-overview">
            <div class="month-card active">
                <div class="month-name">September</div>
                <div class="event-count">1</div>
            </div>
            <div class="month-card active">
                <div class="month-name">October</div>
                <div class="event-count">2</div>
            </div>
            <div class="month-card active">
                <div class="month-name">November</div>
                <div class="event-count">2</div>
            </div>
            <div class="month-card active">
                <div class="month-name">December</div>
                <div class="event-count">2</div>
            </div>
        </div>
        
        <div class="events-container">
            <!-- Upcoming Events -->
            <div class="events-section">
                <div class="section-header">
                    <h2 class="section-title">Upcoming Tournaments</h2>
                    <span class="section-badge">${upcomingEvents.length} Events</span>
                </div>
                <div class="events-grid">
                    ${upcomingEvents.map(event => {
                        const date = new Date(event.date);
                        const day = date.getDate();
                        const month = date.toLocaleDateString('en-US', { month: 'short' });
                        return `
                            <div class="event-card">
                                <div class="event-date">
                                    <div class="event-day">${day}</div>
                                    <div class="event-month">${month}</div>
                                </div>
                                <div class="event-details">
                                    <div class="event-name">${event.name}</div>
                                    <div class="event-location">
                                        <i class="fas fa-map-marker-alt"></i> ${event.location}
                                    </div>
                                    <div class="event-meta">
                                        <span class="meta-tag tour-tag">${event.tour}</span>
                                    </div>
                                </div>
                                <div class="event-status status-${event.status}">
                                    ${event.status}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- Past Events -->
            <div class="events-section">
                <div class="section-header">
                    <h2 class="section-title">Recent Results</h2>
                    <span class="section-badge">2025 Season</span>
                </div>
                <div class="events-grid">
                    ${pastEvents.map(event => {
                        const date = new Date(event.date);
                        const day = date.getDate();
                        const month = date.toLocaleDateString('en-US', { month: 'short' });
                        return `
                            <div class="event-card">
                                <div class="event-date">
                                    <div class="event-day">${day}</div>
                                    <div class="event-month">${month}</div>
                                </div>
                                <div class="event-details">
                                    <div class="event-name">${event.name}</div>
                                    <div class="event-location">
                                        <i class="fas fa-map-marker-alt"></i> ${event.location}
                                    </div>
                                </div>
                                <div class="event-result">
                                    <div class="result-position">${event.result}</div>
                                    <div class="result-points">${event.points} pts</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- Add Event -->
            <div class="add-event-btn">
                <i class="fas fa-plus-circle" style="font-size: 1.5rem;"></i>
                <span>Add Tournament</span>
            </div>
        </div>
    </main>
</body>
</html>`;
    }
}

module.exports = schedule;