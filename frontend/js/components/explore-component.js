// Explore Component for Feed Integration
class ExploreComponent {
    constructor() {
        this.currentFilter = 'all';
        this.currentCategory = null;
        this.socket = null;
        this.liveUpdateInterval = null;
        this.selectedAnalyses = [];
        this.topPredictors = [];
        this.liveActivities = [];
        this.featuredContent = [];
    }

    render() {
        const isAuthenticated = localStorage.getItem('token');
        const demoNotice = !isAuthenticated ? `
            <div style="background: linear-gradient(135deg, #FFD700, #FFA500); color: black; padding: 15px; border-radius: 12px; margin-bottom: 20px; text-align: center; font-weight: 600;">
                <i class="fas fa-info-circle"></i> Preview Mode - <a href="/signup" style="color: black; text-decoration: underline;">Sign up</a> to see real activity
            </div>
        ` : '';
        
        return `
            <div class="explore-container" style="padding: 20px; animation: fadeIn 0.5s ease;">
                ${demoNotice}
                <!-- Header -->
                <div class="explore-header" style="background: var(--bg-secondary); border-radius: 20px; padding: 25px; margin-bottom: 25px; border: 1px solid var(--border);">
                    <h2 style="font-size: 2rem; font-weight: 700; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 15px;">
                        <i class="fas fa-compass"></i> Explore
                    </h2>
                    
                    <!-- Search Bar -->
                    <div style="position: relative; margin-bottom: 20px;">
                        <input type="text" 
                               id="exploreSearchInput"
                               placeholder="Search sports, teams, players, or expert predictors..." 
                               style="width: 100%; padding: 15px 50px 15px 20px; background: var(--bg-primary); border: 2px solid var(--border); border-radius: 50px; color: var(--text); font-size: 1rem; transition: all 0.3s;"
                               onfocus="this.style.borderColor='var(--primary)'; this.style.background='var(--bg-tertiary)'"
                               onblur="this.style.borderColor='var(--border)'; this.style.background='var(--bg-primary)'"
                               onkeyup="window.exploreComponent.handleSearch(event)">
                        <i class="fas fa-search" style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
                    </div>
                    
                    <!-- Filter Chips -->
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        ${this.renderFilterChips()}
                    </div>
                </div>
                
                <!-- Featured Section -->
                <div class="featured-section" style="margin-bottom: 30px;">
                    <h3 style="font-size: 1.3rem; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.5rem;">✨</span> Featured Today
                    </h3>
                    <div class="featured-carousel" style="display: flex; gap: 20px; overflow-x: auto; padding-bottom: 10px; scroll-behavior: smooth;">
                        ${this.renderFeaturedCards()}
                    </div>
                </div>
                
                <!-- Category Grid -->
                <div class="category-section" style="margin-bottom: 30px;">
                    <h3 style="font-size: 1.3rem; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-th-large"></i> Browse Categories
                    </h3>
                    <div class="category-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                        ${this.renderCategoryGrid()}
                    </div>
                </div>
                
                <!-- Live Activity Feed -->
                <div class="activity-section" style="margin-bottom: 30px;">
                    <h3 style="font-size: 1.3rem; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                        <span class="live-indicator" style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; background: var(--danger); color: white; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                            <span class="live-dot" style="width: 6px; height: 6px; background: white; border-radius: 50%; animation: blink 1.5s infinite;"></span>
                            LIVE
                        </span>
                        Recent Activity
                    </h3>
                    <div id="liveActivityFeed" class="activity-feed" style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 16px; padding: 20px;">
                        ${this.renderActivityFeed()}
                    </div>
                </div>
                
                <!-- Top Predictors -->
                <div class="predictors-section" style="margin-bottom: 30px;">
                    <h3 style="font-size: 1.3rem; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-trophy"></i> Top Predictors This Week
                    </h3>
                    <div class="predictors-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                        ${this.renderTopPredictors()}
                    </div>
                </div>
                
                <!-- Trending Challenges -->
                <div class="challenges-section">
                    <h3 style="font-size: 1.3rem; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-handshake"></i> Popular Challenges
                    </h3>
                    <div class="challenges-list" style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 16px; padding: 20px;">
                        ${this.renderChallenges()}
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                .featured-carousel::-webkit-scrollbar {
                    height: 4px;
                }
                
                .featured-carousel::-webkit-scrollbar-track {
                    background: var(--bg-secondary);
                    border-radius: 10px;
                }
                
                .featured-carousel::-webkit-scrollbar-thumb {
                    background: var(--primary);
                    border-radius: 10px;
                }
            </style>
        `;
    }

    renderFilterChips() {
        const filters = [
            { id: 'all', label: '🔥 Trending', active: true },
            { id: 'nfl', label: '🏈 NFL', active: false },
            { id: 'nba', label: '🏀 NBA', active: false },
            { id: 'mlb', label: '⚾ MLB', active: false },
            { id: 'soccer', label: '⚽ Soccer', active: false },
            { id: 'nhl', label: '🏒 NHL', active: false },
            { id: 'picks', label: '🎯 Hot Picks', active: false },
            { id: 'parlays', label: '💰 Parlays', active: false },
            { id: 'analytics', label: '📊 Analytics', active: false }
        ];

        return filters.map(filter => `
            <button class="filter-chip ${filter.active ? 'active' : ''}" 
                    data-filter="${filter.id}"
                    onclick="window.exploreComponent.setFilter('${filter.id}')"
                    style="padding: 8px 20px; background: ${filter.active ? 'var(--primary)' : 'var(--bg-secondary)'}; 
                           border: 1px solid ${filter.active ? 'var(--primary)' : 'var(--border)'}; 
                           border-radius: 20px; color: ${filter.active ? 'white' : 'var(--text)'}; 
                           cursor: pointer; transition: all 0.3s; font-size: 0.9rem; font-weight: 500;">
                ${filter.label}
            </button>
        `).join('');
    }

    renderFeaturedCards() {
        const featured = [
            {
                type: 'tournament',
                title: 'NFL Week 12 Predictor Challenge',
                description: '$10,000 prize pool • 2,847 entered',
                tag: '🏆 TOURNAMENT',
                gradient: 'linear-gradient(135deg, #667eea, #764ba2)'
            },
            {
                type: 'consensus',
                title: "Tonight's Consensus Picks",
                description: 'Community is 14-3 on primetime',
                tag: '🔥 HOT STREAK',
                gradient: 'linear-gradient(135deg, #f093fb, #f5576c)'
            },
            {
                type: 'expert',
                title: 'VIP Predictor Insights',
                description: 'Top 10 experts agree on 3 locks',
                tag: '💎 EXPERT PICK',
                gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)'
            }
        ];

        return featured.map(card => `
            <div class="featured-card" 
                 onclick="window.exploreComponent.handleFeaturedClick('${card.type}')"
                 style="min-width: 280px; height: 160px; background: ${card.gradient}; 
                        border-radius: 16px; padding: 20px; display: flex; flex-direction: column; 
                        justify-content: space-between; cursor: pointer; transition: all 0.3s; 
                        position: relative; overflow: hidden;"
                 onmouseover="this.style.transform='scale(1.02)'"
                 onmouseout="this.style.transform='scale(1)'">
                <div style="position: relative; z-index: 2;">
                    <span style="display: inline-block; padding: 4px 12px; background: rgba(0, 0, 0, 0.3); 
                                 border-radius: 12px; font-size: 0.75rem; margin-bottom: 10px; color: white;">
                        ${card.tag}
                    </span>
                    <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 5px; color: white;">
                        ${card.title}
                    </div>
                    <div style="font-size: 0.9rem; opacity: 0.9; color: white;">
                        ${card.description}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderCategoryGrid() {
        const categories = [
            { icon: '🏈', name: 'NFL', count: '12.4k' },
            { icon: '🏀', name: 'NBA', count: '8.7k' },
            { icon: '⚾', name: 'MLB', count: '5.2k' },
            { icon: '⚽', name: 'Soccer', count: '9.1k' },
            { icon: '🏒', name: 'NHL', count: '3.8k' },
            { icon: '🎾', name: 'Tennis', count: '2.1k' },
            { icon: '🥊', name: 'Boxing', count: '4.5k' },
            { icon: '🏎️', name: 'F1', count: '3.3k' },
            { icon: '⛳', name: 'Golf', count: '1.8k' }
        ];

        return categories.map(cat => `
            <div class="category-card" 
                 onclick="window.exploreComponent.filterByCategory('${cat.name.toLowerCase()}')"
                 style="background: var(--bg-secondary); border: 1px solid var(--border); 
                        border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; 
                        transition: all 0.3s; position: relative; overflow: hidden;"
                 onmouseover="this.style.background='var(--bg-tertiary)'; this.style.borderColor='var(--primary)'; this.style.transform='translateY(-3px)'"
                 onmouseout="this.style.background='var(--bg-secondary)'; this.style.borderColor='var(--border)'; this.style.transform='translateY(0)'">
                <div style="font-size: 2rem; margin-bottom: 10px;">${cat.icon}</div>
                <div style="font-weight: 600; margin-bottom: 5px;">${cat.name}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${cat.count} active</div>
            </div>
        `).join('');
    }

    renderActivityFeed() {
        const activities = [
            {
                icon: '🎯',
                text: '<strong>@sharp_mike</strong> just hit their 10th straight pick! 🔥',
                time: '2 minutes ago',
                bg: 'var(--gradient-gold)'
            },
            {
                icon: '💰',
                text: '<strong>Lakers -5.5</strong> is trending with 78% of the community',
                time: '5 minutes ago',
                bg: 'var(--gradient-success)'
            },
            {
                icon: '🏆',
                text: 'New challenge: <strong>@betmaster</strong> vs <strong>@rookie_joe</strong> on TNF',
                time: '8 minutes ago',
                bg: 'var(--gradient-primary)'
            }
        ];

        return activities.map((activity, index) => `
            <div class="activity-item" 
                 style="display: flex; align-items: center; gap: 15px; padding: 15px 0; 
                        border-bottom: ${index < activities.length - 1 ? '1px solid var(--border)' : 'none'}; 
                        animation: slideIn 0.5s ease ${index * 0.1}s both;">
                <div style="width: 40px; height: 40px; border-radius: 50%; display: flex; 
                            align-items: center; justify-content: center; background: ${activity.bg};">
                    ${activity.icon}
                </div>
                <div style="flex: 1;">
                    <div style="margin-bottom: 5px;">${activity.text}</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    renderTopPredictors() {
        const predictors = [
            {
                avatar: 'PT',
                name: 'Pat Turner',
                handle: '@pturner',
                verified: true,
                accuracy: '87%',
                record: '42-6',
                profit: '+28.5u',
                gradient: 'var(--gradient-gold)',
                pulse: true
            },
            {
                avatar: 'SK',
                name: 'Sarah Kim',
                handle: '@sarahk_nba',
                verified: true,
                accuracy: '82%',
                record: '38-8',
                profit: '+22.3u',
                gradient: 'var(--gradient-success)',
                pulse: false
            },
            {
                avatar: 'JW',
                name: 'Jake Wilson',
                handle: '@jwilson_picks',
                verified: false,
                accuracy: '79%',
                record: '35-9',
                profit: '+19.8u',
                gradient: 'var(--gradient-primary)',
                pulse: false
            }
        ];

        return predictors.map(pred => `
            <div class="predictor-card ${pred.pulse ? 'pulse' : ''}" 
                 style="background: var(--bg-secondary); border: 1px solid var(--border); 
                        border-radius: 16px; padding: 20px; transition: all 0.3s; 
                        ${pred.pulse ? 'animation: pulse 2s infinite;' : ''}"
                 onmouseover="this.style.background='var(--bg-tertiary)'; this.style.transform='translateY(-2px)'"
                 onmouseout="this.style.background='var(--bg-secondary)'; this.style.transform='translateY(0)'">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <div style="width: 50px; height: 50px; border-radius: 50%; display: flex; 
                                align-items: center; justify-content: center; font-weight: bold; 
                                font-size: 1.2rem; background: ${pred.gradient}; color: white;">
                        ${pred.avatar}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; display: flex; align-items: center; gap: 5px;">
                            ${pred.name}
                            ${pred.verified ? '<i class="fas fa-check-circle" style="color: var(--primary); font-size: 0.9rem;"></i>' : ''}
                        </div>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">${pred.handle}</div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; 
                            padding: 10px 0; border-top: 1px solid var(--border); 
                            border-bottom: 1px solid var(--border);">
                    <div style="text-align: center;">
                        <div style="font-weight: 600; font-size: 1.1rem; color: var(--success);">${pred.accuracy}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Accuracy</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-weight: 600; font-size: 1.1rem; color: var(--success);">${pred.record}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Record</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-weight: 600; font-size: 1.1rem; color: var(--success);">${pred.profit}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Profit</div>
                    </div>
                </div>
                <button onclick="window.exploreComponent.followUser('${pred.handle}')"
                        data-demo="true" 
                        class="follow-btn"
                        style="width: 100%; padding: 10px; background: var(--primary); color: white; 
                               border: none; border-radius: 25px; font-weight: 600; cursor: pointer; 
                               transition: all 0.3s;"
                        onmouseover="this.style.background='var(--primary-hover)'; this.style.transform='translateY(-1px)'"
                        onmouseout="this.style.background='var(--primary)'; this.style.transform='translateY(0)'">
                    Follow
                </button>
            </div>
        `).join('');
    }

    renderChallenges() {
        const challenges = [
            {
                icon: '🤝',
                title: '$500 Challenge',
                description: 'Chiefs ML vs Bills ML',
                participants: '47 participants',
                time: 'Closes in 2 hours'
            },
            {
                icon: '🎲',
                title: 'Parlay Contest',
                description: 'Build your 5-leg parlay',
                participants: '183 entries',
                time: 'Ends tonight'
            }
        ];

        return challenges.map((challenge, index) => `
            <div style="display: flex; align-items: center; gap: 15px; padding: 15px 0; 
                        border-bottom: ${index < challenges.length - 1 ? '1px solid var(--border)' : 'none'};">
                <div style="font-size: 1.5rem;">${challenge.icon}</div>
                <div style="flex: 1;">
                    <div><strong>${challenge.title}:</strong> ${challenge.description} • ${challenge.participants}</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">${challenge.time}</div>
                </div>
                <button onclick="window.exploreComponent.joinChallenge('${challenge.title}')"
                        style="padding: 8px 16px; background: var(--primary); color: white; 
                               border: none; border-radius: 20px; font-size: 0.85rem; 
                               font-weight: 600; cursor: pointer;">
                    Join
                </button>
            </div>
        `).join('');
    }

    // Event Handlers
    setFilter(filterId) {
        this.currentFilter = filterId;
        
        // Update UI
        document.querySelectorAll('.filter-chip').forEach(chip => {
            const isActive = chip.dataset.filter === filterId;
            chip.classList.toggle('active', isActive);
            chip.style.background = isActive ? 'var(--primary)' : 'var(--bg-secondary)';
            chip.style.borderColor = isActive ? 'var(--primary)' : 'var(--border)';
            chip.style.color = isActive ? 'white' : 'var(--text)';
        });

        // Fetch filtered data
        this.fetchFilteredContent(filterId);
    }

    async fetchFilteredContent(filter) {
        try {
            const response = await fetch(`/api/explore/filter?type=${filter}`);
            const data = await response.json();
            
            if (data.success) {
                this.updateContent(data);
            }
        } catch (error) {
            console.error('Error fetching filtered content:', error);
        }
    }

    updateContent(data) {
        // Get the main content area
        const container = document.querySelector('.explore-container');
        if (!container) return;
        
        // Based on the current filter, show different content
        switch(this.currentFilter) {
            case 'nfl':
            case 'nba':
            case 'mlb':
            case 'soccer':
            case 'nhl':
                this.showSportContent(this.currentFilter);
                break;
            case 'picks':
                this.showHotPicks();
                break;
            case 'parlays':
                this.showParlays();
                break;
            case 'analytics':
                this.showAnalytics();
                break;
            default:
                // Show trending/default content
                if (data.activities) {
                    this.updateActivityFeed(data.activities);
                }
        }
    }

    showSportContent(sport) {
        const container = document.querySelector('.explore-container');
        
        // Create sport-specific view
        const sportContent = `
            <div class="sport-filter-view" style="animation: fadeIn 0.5s ease;">
                <h2 style="font-size: 1.8rem; margin-bottom: 20px; text-transform: uppercase;">
                    ${sport === 'nfl' ? '🏈' : sport === 'nba' ? '🏀' : sport === 'mlb' ? '⚾' : '⚽'} ${sport} ACTION
                </h2>
                
                <!-- Today's Games -->
                <div class="games-section" style="margin-bottom: 30px;">
                    <h3 style="margin-bottom: 15px;">Today's ${sport.toUpperCase()} Games</h3>
                    <div class="games-grid" style="display: grid; gap: 15px;">
                        ${this.renderSportGames(sport)}
                    </div>
                </div>
                
                <!-- Sport Challenges -->
                <div class="challenges-section" style="margin-bottom: 30px;">
                    <h3 style="margin-bottom: 15px;">${sport.toUpperCase()} Challenges</h3>
                    <div style="background: var(--bg-secondary); border-radius: 15px; padding: 20px;">
                        ${this.renderSportChallenges(sport)}
                    </div>
                </div>
                
                <!-- Top Predictors -->
                <div class="predictors-section">
                    <h3 style="margin-bottom: 15px;">Top ${sport.toUpperCase()} Predictors</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        ${this.renderSportPredictors(sport)}
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = sportContent;
    }

    renderSportGames(sport) {
        // Mock games for now - will connect to real API
        const games = {
            nfl: [
                { away: 'Chiefs', home: 'Bills', time: '8:20 PM', spread: 'BUF -2.5', total: '47.5' },
                { away: 'Cowboys', home: 'Eagles', time: '4:25 PM', spread: 'PHI -3.5', total: '51.5' }
            ],
            nba: [
                { away: 'Lakers', home: 'Warriors', time: '10:00 PM', spread: 'GSW -4.5', total: '229.5' },
                { away: 'Nets', home: 'Celtics', time: '7:30 PM', spread: 'BOS -8.5', total: '218.5' }
            ],
            mlb: [
                { away: 'Yankees', home: 'Red Sox', time: '7:10 PM', spread: 'NYY -1.5', total: '9.5' },
                { away: 'Dodgers', home: 'Giants', time: '9:45 PM', spread: 'LAD -1.5', total: '8.5' }
            ]
        };
        
        const sportGames = games[sport] || [];
        
        return sportGames.map(game => `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; padding: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong>${game.away}</strong> @ <strong>${game.home}</strong></span>
                    <span style="color: var(--text-muted);">${game.time}</span>
                </div>
                <div style="display: flex; gap: 15px; font-size: 0.9rem;">
                    <span style="color: var(--primary);">Spread: ${game.spread}</span>
                    <span style="color: var(--success);">O/U: ${game.total}</span>
                </div>
                <button onclick="window.challengeBet.openForGame('${game.away}', '${game.home}')" 
                        style="margin-top: 10px; width: 100%; padding: 8px; background: var(--primary); 
                               color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Create Challenge
                </button>
            </div>
        `).join('');
    }

    renderSportChallenges(sport) {
        const challenges = [
            { user: '@sharp_mike', amount: '$100', pick: `${sport === 'nfl' ? 'Chiefs -2.5' : 'Lakers -4.5'}`, accepts: 2 },
            { user: '@degen_dave', amount: '$50', pick: `${sport === 'nfl' ? 'Over 47.5' : 'Celtics ML'}`, accepts: 5 }
        ];
        
        return challenges.map(ch => `
            <div style="padding: 15px 0; border-bottom: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${ch.user}</strong> wants ${ch.amount} on <span style="color: var(--primary);">${ch.pick}</span>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${ch.accepts} takers</div>
                    </div>
                    <button style="padding: 6px 16px; background: var(--success); color: white; 
                                   border: none; border-radius: 20px; cursor: pointer;">
                        Accept
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderSportPredictors(sport) {
        const predictors = [
            { name: `${sport.toUpperCase()} King`, handle: '@king_picks', record: '42-18', profit: '+24.5u' },
            { name: `${sport} Sharp`, handle: '@sharp_bets', record: '38-22', profit: '+18.2u' },
            { name: `Data Mike`, handle: '@data_mike', record: '35-25', profit: '+12.8u' }
        ];
        
        return predictors.map(pred => `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border); 
                        border-radius: 12px; padding: 15px;">
                <div style="font-weight: bold; margin-bottom: 5px;">${pred.name}</div>
                <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 10px;">${pred.handle}</div>
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                    <span>${pred.record}</span>
                    <span style="color: var(--success);">${pred.profit}</span>
                </div>
                <button style="width: 100%; margin-top: 10px; padding: 8px; background: var(--primary); 
                               color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Follow
                </button>
            </div>
        `).join('');
    }

    showHotPicks() {
        const container = document.querySelector('.explore-container');
        container.innerHTML = `
            <div style="animation: fadeIn 0.5s ease;">
                <h2 style="font-size: 1.8rem; margin-bottom: 20px;">🎯 HOT PICKS</h2>
                <div style="background: var(--bg-secondary); border-radius: 15px; padding: 20px;">
                    <div style="padding: 15px; background: linear-gradient(135deg, #667eea, #764ba2); 
                                border-radius: 10px; margin-bottom: 15px; color: white;">
                        <div style="font-size: 1.2rem; font-weight: bold;">🔥 LOCK OF THE DAY</div>
                        <div style="margin-top: 10px;">Chiefs -2.5 vs Bills</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">87% Sharp Money • 92% Win Rate on Primetime</div>
                    </div>
                    <!-- Add more hot picks here -->
                </div>
            </div>
        `;
    }

    showParlays() {
        const container = document.querySelector('.explore-container');
        container.innerHTML = `
            <div style="animation: fadeIn 0.5s ease;">
                <h2 style="font-size: 1.8rem; margin-bottom: 20px;">💰 POPULAR PARLAYS</h2>
                
                <!-- Featured Parlay -->
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 20px; padding: 25px; margin-bottom: 25px; color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div>
                            <div style="font-size: 1.3rem; font-weight: bold; margin-bottom: 5px;">🔥 MEGA PARLAY OF THE DAY</div>
                            <div style="opacity: 0.9;">5-Leg Monster • Potential Payout: $2,847</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 2rem; font-weight: bold;">+1847</div>
                            <div style="font-size: 0.9rem; opacity: 0.9;">$100 to win $1,847</div>
                        </div>
                    </div>
                    <div style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 15px;">
                        <div style="margin-bottom: 8px;">✅ Chiefs ML vs Bills</div>
                        <div style="margin-bottom: 8px;">✅ Eagles -3.5 vs Cowboys</div>
                        <div style="margin-bottom: 8px;">✅ Ravens vs Steelers OVER 41.5</div>
                        <div style="margin-bottom: 8px;">✅ 49ers -7 vs Cardinals</div>
                        <div style="margin-bottom: 8px;">✅ Dolphins +10.5 vs Packers</div>
                    </div>
                    <button style="width: 100%; margin-top: 15px; padding: 12px; background: white; color: #667eea; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">
                        TAIL THIS PARLAY
                    </button>
                </div>
                
                <!-- Popular Parlays Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    ${this.renderParlayCards()}
                </div>
                
                <!-- Same Game Parlays Section -->
                <h3 style="margin-top: 30px; margin-bottom: 20px;">⚡ Same Game Parlays (SGPs)</h3>
                <div style="display: grid; gap: 15px;">
                    ${this.renderSGPCards()}
                </div>
            </div>
        `;
    }
    
    renderParlayCards() {
        const parlays = [
            {
                user: '@parlay_paul',
                legs: 3,
                odds: '+485',
                bet: '$50 to win $242',
                picks: ['Lakers ML', 'Celtics -5.5', 'Warriors OVER 220.5'],
                tails: 47,
                gradient: 'linear-gradient(135deg, #f093fb, #f5576c)'
            },
            {
                user: '@sharp_sarah',
                legs: 4,
                odds: '+750',
                bet: '$25 to win $187',
                picks: ['Bills +2.5', 'Bengals ML', 'Titans UNDER 38.5', 'Rams -3'],
                tails: 83,
                gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)'
            },
            {
                user: '@degen_dave',
                legs: 6,
                odds: '+2450',
                bet: '$10 to win $245',
                picks: ['6 NFL Underdogs ML'],
                tails: 156,
                gradient: 'linear-gradient(135deg, #FFD700, #FFA500)'
            }
        ];
        
        return parlays.map(p => `
            <div style="background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 15px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <div>
                        <strong>${p.user}</strong>
                        <div style="color: var(--text-muted); font-size: 0.85rem;">${p.legs}-leg parlay</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--success);">${p.odds}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${p.bet}</div>
                    </div>
                </div>
                <div style="padding: 10px; background: var(--bg-primary); border-radius: 8px; margin-bottom: 15px;">
                    ${p.picks.map(pick => `<div style="margin: 5px 0;">• ${pick}</div>`).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-muted); font-size: 0.85rem;">👥 ${p.tails} tailing</span>
                    <button style="padding: 8px 20px; background: ${p.gradient}; color: white; border: none; border-radius: 20px; font-weight: bold; cursor: pointer;">
                        TAIL
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    renderSGPCards() {
        const sgps = [
            {
                game: 'Chiefs vs Bills',
                legs: ['Mahomes 300+ yards', 'Kelce Anytime TD', 'OVER 47.5'],
                odds: '+625',
                boost: 'BOOSTED from +550'
            },
            {
                game: 'Lakers vs Warriors',
                legs: ['LeBron 25+ pts', 'Curry 5+ threes', 'Lakers ML'],
                odds: '+425',
                boost: 'FanDuel Special'
            }
        ];
        
        return sgps.map(sgp => `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; padding: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <strong>${sgp.game}</strong>
                    <span style="color: var(--success); font-weight: bold;">${sgp.odds}</span>
                </div>
                <div style="margin-bottom: 10px;">
                    ${sgp.legs.map(leg => `<div style="font-size: 0.9rem; margin: 3px 0;">✓ ${leg}</div>`).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--warning); font-size: 0.85rem;">⚡ ${sgp.boost}</span>
                    <button style="padding: 6px 16px; background: var(--primary); color: white; border: none; border-radius: 15px; cursor: pointer;">
                        BET NOW
                    </button>
                </div>
            </div>
        `).join('');
    }

    showAnalytics() {
        const container = document.querySelector('.explore-container');
        container.innerHTML = `
            <div style="animation: fadeIn 0.5s ease;">
                <h2 style="font-size: 1.8rem; margin-bottom: 20px;">📊 ANALYTICS HUB</h2>
                
                <!-- Key Metrics -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                    <div style="background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 15px; padding: 20px; color: white;">
                        <div style="font-size: 0.9rem; opacity: 0.9;">Sharp Money %</div>
                        <div style="font-size: 2rem; font-weight: bold;">73%</div>
                        <div style="font-size: 0.85rem; opacity: 0.8;">on favorites today</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #00d084, #00a870); border-radius: 15px; padding: 20px; color: white;">
                        <div style="font-size: 0.9rem; opacity: 0.9;">Public Fade Alert</div>
                        <div style="font-size: 2rem; font-weight: bold;">5</div>
                        <div style="font-size: 0.85rem; opacity: 0.8;">games to fade</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #f093fb, #f5576c); border-radius: 15px; padding: 20px; color: white;">
                        <div style="font-size: 0.9rem; opacity: 0.9;">Line Movement</div>
                        <div style="font-size: 2rem; font-weight: bold;">12</div>
                        <div style="font-size: 0.85rem; opacity: 0.8;">significant moves</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #FFD700, #FFA500); border-radius: 15px; padding: 20px; color: white;">
                        <div style="font-size: 0.9rem; opacity: 0.9;">Win Rate</div>
                        <div style="font-size: 2rem; font-weight: bold;">68.5%</div>
                        <div style="font-size: 0.85rem; opacity: 0.8;">last 7 days</div>
                    </div>
                </div>
                
                <!-- Line Movement Analysis -->
                <div style="background: var(--bg-secondary); border-radius: 15px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="margin-bottom: 15px;">📈 Significant Line Movements</h3>
                    ${this.renderLineMovements()}
                </div>
                
                <!-- Sharp vs Public -->
                <div style="background: var(--bg-secondary); border-radius: 15px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="margin-bottom: 15px;">💰 Sharp vs Public Money</h3>
                    ${this.renderSharpVsPublic()}
                </div>
                
                <!-- AI Predictions -->
                <div style="background: var(--bg-secondary); border-radius: 15px; padding: 20px;">
                    <h3 style="margin-bottom: 15px;">🤖 AI Analysis Top Picks</h3>
                    ${this.renderAIPicks()}
                </div>
            </div>
        `;
    }
    
    renderLineMovements() {
        const movements = [
            { game: 'Chiefs vs Bills', from: 'KC -3.5', to: 'KC -2.5', reason: 'Sharp money on Bills', impact: 'HIGH' },
            { game: 'Lakers vs Warriors', from: 'LAL +4', to: 'LAL +5.5', reason: 'LeBron questionable', impact: 'MEDIUM' },
            { game: 'Eagles vs Cowboys', from: 'PHI -3', to: 'PHI -4', reason: 'Public hammering Eagles', impact: 'LOW' }
        ];
        
        return movements.map(m => `
            <div style="padding: 15px 0; border-bottom: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${m.game}</strong>
                        <div style="margin-top: 5px;">
                            <span style="color: var(--text-muted);">From:</span> ${m.from} 
                            <span style="color: var(--primary); margin: 0 10px;">→</span>
                            <span style="color: var(--text-muted);">To:</span> ${m.to}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 3px;">${m.reason}</div>
                    </div>
                    <div style="padding: 6px 12px; background: ${m.impact === 'HIGH' ? 'var(--danger)' : m.impact === 'MEDIUM' ? 'var(--warning)' : 'var(--info)'}; 
                                color: white; border-radius: 20px; font-size: 0.8rem; font-weight: bold;">
                        ${m.impact}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    renderSharpVsPublic() {
        const games = [
            { game: 'Chiefs vs Bills', publicPct: '67%', publicSide: 'Chiefs', sharpPct: '72%', sharpSide: 'Bills', edge: 'SHARP' },
            { game: 'Eagles vs Cowboys', publicPct: '81%', publicSide: 'Eagles', sharpPct: '55%', sharpSide: 'Eagles', edge: 'AGREE' },
            { game: 'Ravens vs Steelers', publicPct: '44%', publicSide: 'Steelers', sharpPct: '78%', sharpSide: 'Ravens', edge: 'SHARP' }
        ];
        
        return games.map(g => `
            <div style="padding: 15px; background: var(--bg-primary); border-radius: 10px; margin-bottom: 10px;">
                <div style="font-weight: bold; margin-bottom: 10px;">${g.game}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 5px;">Public Money</div>
                        <div style="font-size: 1.2rem; font-weight: bold;">${g.publicPct} on ${g.publicSide}</div>
                    </div>
                    <div>
                        <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 5px;">Sharp Money</div>
                        <div style="font-size: 1.2rem; font-weight: bold; color: var(--success);">${g.sharpPct} on ${g.sharpSide}</div>
                    </div>
                </div>
                ${g.edge === 'SHARP' ? 
                    '<div style="margin-top: 10px; padding: 8px; background: var(--success); color: white; border-radius: 8px; text-align: center; font-weight: bold;">⚡ SHARP DIVERGENCE - FADE PUBLIC</div>' :
                    '<div style="margin-top: 10px; padding: 8px; background: var(--info); color: white; border-radius: 8px; text-align: center;">Sharp & Public Agree</div>'
                }
            </div>
        `).join('');
    }
    
    renderAIPicks() {
        const picks = [
            { game: 'Chiefs vs Bills', pick: 'Bills +2.5', confidence: '92%', model: 'Neural Network v3.2' },
            { game: 'Lakers vs Warriors', pick: 'OVER 229.5', confidence: '87%', model: 'Statistical Regression' },
            { game: 'Eagles vs Cowboys', pick: 'Eagles -3.5', confidence: '79%', model: 'Machine Learning Ensemble' }
        ];
        
        return picks.map(p => `
            <div style="padding: 15px; background: var(--bg-primary); border-radius: 10px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${p.game}</strong>
                        <div style="color: var(--primary); font-size: 1.1rem; margin-top: 5px;">${p.pick}</div>
                        <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 3px;">${p.model}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.8rem; font-weight: bold; color: var(--success);">${p.confidence}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Confidence</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async handleSearch(event) {
        const query = event.target.value;
        
        if (event.key === 'Enter' && query.length > 2) {
            // Check if authenticated
            if (!localStorage.getItem('token')) {
                this.showEmptySearchResults(query);
                return;
            }
            try {
                // Use existing search endpoint
                const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                
                if (data.success) {
                    this.displaySearchResults(data.users);
                }
            } catch (error) {
                console.error('Search error:', error);
            }
        }
    }
    
    displaySearchResults(users) {
        const container = document.querySelector('.explore-container');
        if (!container) return;
        
        const resultsHTML = `
            <div class="search-results" style="background: var(--bg-secondary); border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                <h3>Search Results</h3>
                ${users.map(user => `
                    <div style="display: flex; align-items: center; gap: 15px; padding: 10px 0; border-bottom: 1px solid var(--border);">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center;">
                            ${user.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div style="flex: 1;">
                            <div><strong>${user.displayName || user.username}</strong></div>
                            <div style="color: var(--text-muted); font-size: 0.9rem;">@${user.username}</div>
                        </div>
                        <button onclick="window.followService.toggleFollow('${user._id}', '${user.username}')" 
                                style="padding: 6px 16px; background: var(--primary); color: white; border: none; border-radius: 20px; cursor: pointer;">
                            Follow
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Insert results after header
        const header = container.querySelector('.explore-header');
        if (header && header.nextSibling) {
            header.insertAdjacentHTML('afterend', resultsHTML);
        }
    }

    showEmptySearchResults(query) {
        const container = document.querySelector('.explore-container');
        if (!container) return;
        
        const resultsHTML = `
            <div class="search-results" style="background: var(--bg-secondary); border-radius: 15px; padding: 30px; margin-bottom: 20px; text-align: center;">
                <h3>No results for "${query}"</h3>
                <p style="color: var(--text-muted); margin: 15px 0;">Be one of the first to join!</p>
                <button onclick="window.location.href='/signup'" 
                        style="padding: 10px 30px; background: var(--primary); color: white; 
                               border: none; border-radius: 25px; font-weight: 600; cursor: pointer;">
                    Sign Up Now
                </button>
            </div>
        `;
        
        // Insert results after header
        const header = container.querySelector('.explore-header');
        if (header && header.nextSibling) {
            const existingResults = container.querySelector('.search-results');
            if (existingResults) existingResults.remove();
            header.insertAdjacentHTML('afterend', resultsHTML);
        }
    }

    filterByCategory(category) {
        this.currentCategory = category;
        this.setFilter(category);
    }

    handleFeaturedClick(type) {
        switch(type) {
            case 'tournament':
                window.location.href = '/tournaments';
                break;
            case 'consensus':
                this.showConsensusPicks();
                break;
            case 'expert':
                this.showExpertInsights();
                break;
        }
    }

    async followUser(handle) {
        // Check if user is logged in
        if (!localStorage.getItem('token')) {
            // Show login prompt
            if (confirm('Sign in to follow users. Would you like to login now?')) {
                window.location.href = '/login';
            }
            return;
        }
        
        // For demo users, just update the button
        const button = event.target;
        button.textContent = 'Following';
        button.style.background = 'var(--bg-tertiary)';
        button.style.color = 'var(--text)';
        button.disabled = true;
    }

    joinChallenge(challengeTitle) {
        // Check authentication first
        if (!localStorage.getItem('token')) {
            if (confirm('Sign in to join challenges. Would you like to login now?')) {
                window.location.href = '/login';
            }
            return;
        }
        
        // Use existing challenge bet system
        if (window.challengeBet) {
            // Parse challenge details from title
            const match = challengeTitle.match(/\$(\d+)/);
            const amount = match ? parseInt(match[1]) : 100;
            
            // Open challenge creation with pre-filled amount
            window.challengeBet.openWithAmount(amount);
        } else {
            console.error('Challenge bet component not loaded');
        }
    }

    // Live Updates
    startLiveUpdates() {
        // Connect to WebSocket for real-time updates
        if (window.io) {
            this.socket = window.io();
            this.socket.on('explore_activity', (data) => {
                this.addLiveActivity(data);
            });
        }

        // Poll for updates every 10 seconds
        this.liveUpdateInterval = setInterval(() => {
            this.fetchLiveActivities();
        }, 10000);
    }

    async fetchLiveActivities() {
        try {
            // Fetch real activities from the seeded database
            const response = await fetch('/api/posts/feed?limit=10', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }
            });
            const data = await response.json();
            
            if (data.success && data.posts && data.posts.length > 0) {
                // Convert posts to activity format with variety
                const activities = data.posts.slice(0, 5).map(post => {
                    let icon, text, bg;
                    
                    if (post.type === 'prediction' && post.prediction) {
                        icon = '🎯';
                        text = `<strong>@${post.author?.username || 'user'}</strong> predicts ${post.prediction.game} - ${post.prediction.pick}`;
                        bg = 'linear-gradient(135deg, #667eea, #764ba2)';
                    } else if (post.type === 'challenge_bet' && post.challengeBet) {
                        icon = '🤝';
                        const bet = post.challengeBet;
                        text = `<strong>@${post.author?.username || 'user'}</strong> posted $${bet.amount} challenge on ${bet.game?.awayTeam || 'game'}`;
                        bg = 'linear-gradient(135deg, #FFD700, #FFA500)';
                    } else {
                        icon = post.likes?.length > 50 ? '🔥' : '💬';
                        text = `<strong>@${post.author?.username || 'user'}</strong> ${post.content.substring(0, 100)}`;
                        bg = post.likes?.length > 50 ? 'linear-gradient(135deg, #f093fb, #f5576c)' : 'var(--gradient-primary)';
                    }
                    
                    return {
                        icon: icon,
                        text: text,
                        time: this.getRelativeTime(post.createdAt),
                        bg: bg
                    };
                });
                
                this.updateActivityFeed(activities);
                
                // Also update top predictors with real users
                await this.fetchTopPredictors();
            } else {
                this.generateMockActivities();
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
            this.generateMockActivities();
        }
    }
    
    async fetchTopPredictors() {
        try {
            const response = await fetch('/api/users/top-predictors?limit=3', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }
            });
            const data = await response.json();
            
            if (data.success && data.users) {
                const predictorsGrid = document.querySelector('.predictors-grid');
                if (!predictorsGrid) return;
                
                const predictorsHTML = data.users.map(user => {
                    const initials = user.displayName ? 
                        user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 
                        user.username.substring(0, 2).toUpperCase();
                    
                    const accuracy = user.stats?.accuracy || Math.floor(Math.random() * 20) + 70;
                    const wins = user.stats?.posts || Math.floor(Math.random() * 40) + 20;
                    const losses = Math.floor(wins * (100 - accuracy) / accuracy);
                    
                    return `
                        <div class="predictor-card" 
                             style="background: var(--bg-secondary); border: 1px solid var(--border); 
                                    border-radius: 16px; padding: 20px; transition: all 0.3s;"
                             onmouseover="this.style.background='var(--bg-tertiary)'; this.style.transform='translateY(-2px)'"
                             onmouseout="this.style.background='var(--bg-secondary)'; this.style.transform='translateY(0)'">
                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                                <div style="width: 50px; height: 50px; border-radius: 50%; display: flex; 
                                            align-items: center; justify-content: center; font-weight: bold; 
                                            font-size: 1.2rem; background: var(--gradient-primary); color: white;">
                                    ${initials}
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; display: flex; align-items: center; gap: 5px;">
                                        ${user.displayName || user.username}
                                        ${user.verified ? '<i class="fas fa-check-circle" style="color: var(--primary); font-size: 0.9rem;"></i>' : ''}
                                    </div>
                                    <div style="color: var(--text-muted); font-size: 0.9rem;">@${user.username}</div>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; 
                                        padding: 10px 0; border-top: 1px solid var(--border); 
                                        border-bottom: 1px solid var(--border);">
                                <div style="text-align: center;">
                                    <div style="font-weight: 600; font-size: 1.1rem; color: var(--success);">${accuracy}%</div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">Accuracy</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-weight: 600; font-size: 1.1rem; color: var(--success);">${wins}-${losses}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">Record</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-weight: 600; font-size: 1.1rem; color: var(--success);">+${(wins * 1.5).toFixed(1)}u</div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">Profit</div>
                                </div>
                            </div>
                            <button onclick="window.followService.toggleFollow('${user._id}', '${user.username}')"
                                    class="follow-btn"
                                    style="width: 100%; padding: 10px; background: var(--primary); color: white; 
                                           border: none; border-radius: 25px; font-weight: 600; cursor: pointer; 
                                           transition: all 0.3s;"
                                    onmouseover="this.style.background='var(--primary-hover)'; this.style.transform='translateY(-1px)'"
                                    onmouseout="this.style.background='var(--primary)'; this.style.transform='translateY(0)'">
                                Follow
                            </button>
                        </div>
                    `;
                }).join('');
                
                predictorsGrid.innerHTML = predictorsHTML;
            }
        } catch (error) {
            console.error('Error fetching top predictors:', error);
        }
    }
    
    getRelativeTime(date) {
        const now = new Date();
        const then = new Date(date);
        const diff = Math.floor((now - then) / 1000);
        
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    }

    generateMockActivities() {
        const mockActivities = [
            {
                icon: '🔥',
                text: '<strong>@degen_master</strong> is on a 12-pick win streak!',
                time: '1 minute ago',
                bg: 'linear-gradient(135deg, #FFD700, #FFA500)'
            },
            {
                icon: '💰',
                text: '<strong>Chiefs -3.5</strong> line moved to -4.5 (Sharp money detected)',
                time: '3 minutes ago',
                bg: 'linear-gradient(135deg, #00d084, #00a870)'
            },
            {
                icon: '🎯',
                text: '<strong>@sarah_picks</strong> hit 5-leg parlay +1200 odds!',
                time: '7 minutes ago',
                bg: 'linear-gradient(135deg, #667eea, #764ba2)'
            },
            {
                icon: '⚡',
                text: 'New $1000 challenge: <strong>TNF Over/Under</strong>',
                time: '12 minutes ago',
                bg: 'linear-gradient(135deg, #f093fb, #f5576c)'
            },
            {
                icon: '📊',
                text: '<strong>Vikings vs Bears</strong> - 82% backing Vikings',
                time: '15 minutes ago',
                bg: 'linear-gradient(135deg, #4facfe, #00f2fe)'
            }
        ];
        
        this.updateActivityFeed(mockActivities);
        
        // Simulate live updates every 5-10 seconds
        this.startMockLiveUpdates();
    }

    startMockLiveUpdates() {
        // Clear any existing interval
        if (this.mockUpdateInterval) {
            clearInterval(this.mockUpdateInterval);
        }
        
        this.mockUpdateInterval = setInterval(() => {
            const randomActivity = this.generateRandomActivity();
            this.addLiveActivity(randomActivity);
        }, Math.random() * 10000 + 5000); // Random between 5-15 seconds
    }

    generateRandomActivity() {
        const activities = [
            {
                templates: [
                    { icon: '🎯', text: '<strong>@{user}</strong> just hit their {streak}th straight pick!' },
                    { icon: '💰', text: '<strong>{team}</strong> line moved from {old} to {new}' },
                    { icon: '🔥', text: '<strong>@{user}</strong> won ${amount} on {game}!' },
                    { icon: '⚡', text: 'New ${amount} challenge posted for {game}' },
                    { icon: '📊', text: '{percent}% of sharp money on <strong>{team}</strong>' },
                    { icon: '🏆', text: '<strong>@{user}</strong> climbed to #{rank} on leaderboard' },
                    { icon: '🎲', text: 'Parlay alert: <strong>{legs}-leg</strong> parlay at +{odds}' },
                    { icon: '🤝', text: '<strong>@{user1}</strong> accepted <strong>@{user2}</strong> bet' }
                ]
            }
        ];
        
        const users = ['sharp_mike', 'degen_dave', 'sarah_stats', 'tommy_picks', 'alex_insider', 'jenny_parlay'];
        const teams = ['Chiefs', 'Bills', 'Eagles', 'Cowboys', 'Ravens', '49ers', 'Dolphins', 'Packers'];
        const games = ['TNF', 'SNF', 'MNF', 'Chiefs vs Bills', 'Eagles vs Cowboys', 'Ravens vs Steelers'];
        
        const template = activities[0].templates[Math.floor(Math.random() * activities[0].templates.length)];
        let text = template.text;
        
        // Replace placeholders
        text = text.replace('{user}', users[Math.floor(Math.random() * users.length)]);
        text = text.replace('{user1}', users[Math.floor(Math.random() * users.length)]);
        text = text.replace('{user2}', users[Math.floor(Math.random() * users.length)]);
        text = text.replace('{team}', teams[Math.floor(Math.random() * teams.length)]);
        text = text.replace('{game}', games[Math.floor(Math.random() * games.length)]);
        text = text.replace('{streak}', Math.floor(Math.random() * 10) + 5);
        text = text.replace('{amount}', (Math.floor(Math.random() * 20) + 1) * 50);
        text = text.replace('{old}', `-${(Math.random() * 4 + 1).toFixed(1)}`);
        text = text.replace('{new}', `-${(Math.random() * 4 + 2).toFixed(1)}`);
        text = text.replace('{percent}', Math.floor(Math.random() * 20) + 65);
        text = text.replace('{rank}', Math.floor(Math.random() * 20) + 1);
        text = text.replace('{legs}', Math.floor(Math.random() * 4) + 3);
        text = text.replace('{odds}', (Math.floor(Math.random() * 30) + 10) * 100);
        
        const gradients = [
            'linear-gradient(135deg, #667eea, #764ba2)',
            'linear-gradient(135deg, #f093fb, #f5576c)',
            'linear-gradient(135deg, #4facfe, #00f2fe)',
            'linear-gradient(135deg, #FFD700, #FFA500)',
            'linear-gradient(135deg, #00d084, #00a870)'
        ];
        
        return {
            icon: template.icon,
            text: text,
            time: 'Just now',
            bg: gradients[Math.floor(Math.random() * gradients.length)]
        };
    }

    addLiveActivity(activity) {
        const feedElement = document.getElementById('liveActivityFeed');
        if (!feedElement) return;

        const newActivity = document.createElement('div');
        newActivity.className = 'activity-item';
        newActivity.style.cssText = `
            display: flex; align-items: center; gap: 15px; padding: 15px 0;
            border-bottom: 1px solid var(--border); animation: slideIn 0.5s ease;
        `;
        
        newActivity.innerHTML = `
            <div style="width: 40px; height: 40px; border-radius: 50%; display: flex; 
                        align-items: center; justify-content: center; background: ${activity.bg || 'var(--gradient-primary)'};">
                ${activity.icon}
            </div>
            <div style="flex: 1;">
                <div style="margin-bottom: 5px;">${activity.text}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">Just now</div>
            </div>
        `;

        feedElement.insertBefore(newActivity, feedElement.firstChild);

        // Remove old activities if too many
        while (feedElement.children.length > 5) {
            feedElement.removeChild(feedElement.lastChild);
        }
    }

    updateActivityFeed(activities) {
        const feedElement = document.getElementById('liveActivityFeed');
        if (!feedElement) return;

        feedElement.innerHTML = activities.map((activity, index) => `
            <div class="activity-item" 
                 style="display: flex; align-items: center; gap: 15px; padding: 15px 0; 
                        border-bottom: ${index < activities.length - 1 ? '1px solid var(--border)' : 'none'}; 
                        animation: slideIn 0.5s ease ${index * 0.1}s both;">
                <div style="width: 40px; height: 40px; border-radius: 50%; display: flex; 
                            align-items: center; justify-content: center; background: ${activity.bg};">
                    ${activity.icon}
                </div>
                <div style="flex: 1;">
                    <div style="margin-bottom: 5px;">${activity.text}</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    showConsensusPicks() {
        // Create modal to show consensus picks
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: var(--bg-secondary); padding: 30px; border-radius: 20px;
            z-index: 10000; min-width: 500px; border: 2px solid var(--primary);
        `;
        
        modal.innerHTML = `
            <h3 style="margin-bottom: 20px;">Tonight's Consensus Picks</h3>
            <div>Loading consensus data...</div>
            <button onclick="this.parentElement.remove()" 
                    style="position: absolute; top: 10px; right: 10px; 
                           background: none; border: none; color: var(--text); 
                           font-size: 20px; cursor: pointer;">×</button>
        `;
        
        document.body.appendChild(modal);
        
        // Fetch consensus data
        fetch('/api/explore/consensus')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Update modal with real data
                }
            });
    }

    showExpertInsights() {
        // Similar to consensus picks but for expert insights
        console.log('Showing expert insights...');
    }

    stopLiveUpdates() {
        if (this.liveUpdateInterval) {
            clearInterval(this.liveUpdateInterval);
        }
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    initialize() {
        console.log('🌟 Explore component initialized');
        
        // Cleanup any existing intervals first
        this.cleanup();
        
        // Start live updates
        this.startLiveUpdates();
        
        // Generate initial mock data
        this.generateMockActivities();
        
        // Load initial data
        this.fetchLiveActivities();
        
        // Setup any additional event listeners
        setTimeout(() => {
            // Add any DOM manipulation here after render
        }, 100);
    }

    // Cleanup when leaving the explore section
    cleanup() {
        this.stopLiveUpdates();
        if (this.mockUpdateInterval) {
            clearInterval(this.mockUpdateInterval);
        }
    }
}

// Create global instance
window.exploreComponent = new ExploreComponent();