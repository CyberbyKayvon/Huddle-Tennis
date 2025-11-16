// Sidebar Templates - Generates HTML for sidebars
class SidebarTemplates {
    constructor() {
        this.authService = window.authService;
    }

    // Create left sidebar
    createLeftSidebar() {
        const user = this.authService?.getCurrentUser();
        
        return `
            <aside class="sidebar-left">
                ${this.createLogoSection()}
                ${this.createNavMenu()}
                ${this.createPostButton()}
                ${this.createUserProfileSection(user)}
                ${this.createThemeSelector()}
            </aside>
        `;
    }

    // Create logo section
    createLogoSection() {
        return `
            <div class="logo-section">
                <div class="logo" onclick="window.location.href='/'">
                    <i class="fas fa-users"></i>
                    <span>HUDDLE</span>
                </div>
            </div>
        `;
    }

    // Create navigation menu
    createNavMenu() {
        const menuItems = [
            { icon: 'fas fa-home', label: 'Home', href: '/', active: true },
            { icon: 'fas fa-compass', label: 'Explore', href: '/explore' },
            { icon: 'fas fa-bell', label: 'Notifications', href: '/notifications', badge: 3 },
            { icon: 'fas fa-envelope', label: 'Messages', href: '/messages' },
            { icon: 'fas fa-bookmark', label: 'Bookmarks', href: '/bookmarks' },
            { icon: 'fas fa-users', label: 'Groups', href: '/groups' },
            { icon: 'fas fa-chart-line', label: 'Analytics', href: '/analytics' },
            { icon: 'fas fa-user', label: 'Profile', href: '/profile' }
        ];

        const items = menuItems.map(item => `
            <a href="${item.href}" class="nav-item ${item.active ? 'active' : ''}" onclick="return handleNavClick(event, '${item.href}')">
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
                ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
            </a>
        `).join('');

        return `
            <nav class="nav-menu">
                ${items}
            </nav>
        `;
    }

    // Create post button
    createPostButton() {
        return `
            <button class="create-post-btn" onclick="postCreator.focusPostInput()">
                <i class="fas fa-plus"></i>
                <span>Create Post</span>
            </button>
        `;
    }

    // Create user profile section
    createUserProfileSection(user) {
        if (!user) {
            return `
                <div class="user-profile-section">
                    <a href="/login.html" class="login-prompt">
                        <i class="fas fa-sign-in-alt"></i>
                        <span>Login to continue</span>
                    </a>
                </div>
            `;
        }

        const avatar = (user.displayName || user.username || 'U')[0].toUpperCase();
        const stats = user.stats || { predictions: 0, accuracy: 0, followers: 0 };

        return `
            <div class="user-profile-section">
                <div class="user-profile" style="cursor: pointer;" onclick="window.location.href='/profile.html?u=${user.username}'">
                    <div class="user-avatar" id="sidebarUserAvatar">${avatar}</div>
                    <div class="user-info">
                        <div class="user-name" id="sidebarUserName">
                            ${user.displayName || user.username}
                            ${user.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                        </div>
                        <div class="user-handle" id="sidebarUserHandle">@${user.username}</div>
                    </div>
                </div>
                <div class="user-stats">
                    <div class="stat-item">
                        <div class="stat-value">${this.formatNumber(stats.predictions)}</div>
                        <div class="stat-label">Picks</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.accuracy}%</div>
                        <div class="stat-label">Accuracy</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.formatNumber(stats.followers)}</div>
                        <div class="stat-label">Followers</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Create theme selector
    createThemeSelector() {
        return `
            <div style="margin-top: 1rem; padding: 1rem; background: var(--surface); border-radius: 12px;">
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-muted);">Background Mode</label>
                <select id="modeSelector" style="width: 100%; padding: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); cursor: pointer; margin-bottom: 1rem;">
                    <option value="dark">🌑 Dark Mode</option>
                    <option value="light">☀️ Light Mode</option>
                    <option value="midnight">🌙 Midnight (OLED)</option>
                    <option value="dim">🌆 Dim (Twitter)</option>
                </select>
                
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-muted);">Accent Color</label>
                <select id="themeSelector" style="width: 100%; padding: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); cursor: pointer;">
                    ${this.getThemeOptions()}
                </select>
            </div>
        `;
    }

    // Create right sidebar
    createRightSidebar() {
        return `
            <aside class="sidebar-right">
                ${this.createSearchBar()}
                ${this.createLiveGamesWidget()}
                ${this.createTrendingSection()}
                ${this.createFollowSuggestions()}
            </aside>
        `;
    }

    // Create search bar
    createSearchBar() {
        return `
            <div class="search-bar">
                <i class="fas fa-search search-icon"></i>
                <input type="text" class="search-input" placeholder="Search Huddle" onkeyup="handleSearch(this.value)">
            </div>
        `;
    }

    // Create live games widget
    createLiveGamesWidget() {
        return `
            <div class="live-games-widget">
                <div class="section-header">
                    <h3 class="section-title">Live Now</h3>
                    <a href="#" class="section-link" onclick="showAllLiveGames(); return false;">View all</a>
                </div>
                <div id="liveGamesContainer">
                    ${this.createLiveGameItems()}
                </div>
            </div>
        `;
    }

    // Create live game items
    createLiveGameItems() {
        // This would be populated with real data
        const games = [
            { home: 'MIN', away: 'CHI', homeScore: 17, awayScore: 14, quarter: '3rd Quarter', winning: 'home' },
            { home: 'LAL', away: 'BOS', homeScore: 84, awayScore: 89, quarter: '4th Quarter', winning: 'away' }
        ];

        return games.map(game => `
            <div class="live-game">
                <div>
                    <div class="live-indicator">
                        <div class="live-dot"></div>
                        LIVE
                    </div>
                    <div class="game-score">
                        <span class="${game.winning === 'home' ? 'winning-team' : ''}">${game.home} ${game.homeScore}</span> - 
                        <span class="${game.winning === 'away' ? 'winning-team' : ''}">${game.away} ${game.awayScore}</span>
                    </div>
                    <div class="game-time">${game.quarter}</div>
                </div>
            </div>
        `).join('');
    }

    // Create trending section
    createTrendingSection() {
        const trends = [
            { category: 'NFL • Trending', title: '#ThursdayNightFootball', posts: '12.4K' },
            { category: 'NBA • Hot', title: 'LeBron James', posts: '8.7K' },
            { category: 'Betting • Trending', title: 'Vikings -7', posts: '3.2K' }
        ];

        const items = trends.map(trend => `
            <div class="trending-item" onclick="viewTrend('${trend.title}')">
                <div class="trending-category">${trend.category}</div>
                <div class="trending-title">${trend.title}</div>
                <div class="trending-stats">${trend.posts} posts</div>
            </div>
        `).join('');

        return `
            <div class="trending-section">
                <div class="section-header">
                    <h3 class="section-title">Trending</h3>
                    <a href="#" class="section-link" onclick="showMoreTrends(); return false;">Show more</a>
                </div>
                ${items}
            </div>
        `;
    }

    // Create follow suggestions
    createFollowSuggestions() {
        const suggestions = [
            { name: 'Pat Turner', handle: 'pturner', verified: true, badge: '84% accuracy' },
            { name: 'Jessica Wu', handle: 'jessw', verified: false, badge: 'NBA Expert' },
            { name: 'David Miller', handle: 'dmiller', verified: true, badge: 'Top 100' }
        ];

        const items = suggestions.map(user => `
            <div class="user-suggestion">
                <div class="suggestion-avatar">${user.name[0]}</div>
                <div class="suggestion-info">
                    <div class="suggestion-name">
                        ${user.name}
                        ${user.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                    </div>
                    <div class="suggestion-handle">@${user.handle} • ${user.badge}</div>
                </div>
                <button class="follow-btn" onclick="followUser('${user.handle}')">Follow</button>
            </div>
        `).join('');

        return `
            <div class="follow-suggestions">
                <div class="section-header">
                    <h3 class="section-title">Who to follow</h3>
                    <a href="#" class="section-link" onclick="viewAllSuggestions(); return false;">View all</a>
                </div>
                ${items}
            </div>
        `;
    }

    // Helper functions
    formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    getThemeOptions() {
        return `
            <option value="default">Default Purple</option>
            <optgroup label="AFC East">
                <option value="bills">Buffalo Bills</option>
                <option value="dolphins">Miami Dolphins</option>
                <option value="patriots">New England Patriots</option>
                <option value="jets">New York Jets</option>
            </optgroup>
            <optgroup label="AFC North">
                <option value="ravens">Baltimore Ravens</option>
                <option value="bengals">Cincinnati Bengals</option>
                <option value="browns">Cleveland Browns</option>
                <option value="steelers">Pittsburgh Steelers</option>
            </optgroup>
            <optgroup label="AFC South">
                <option value="texans">Houston Texans</option>
                <option value="colts">Indianapolis Colts</option>
                <option value="jaguars">Jacksonville Jaguars</option>
                <option value="titans">Tennessee Titans</option>
            </optgroup>
            <optgroup label="AFC West">
                <option value="broncos">Denver Broncos</option>
                <option value="chiefs">Kansas City Chiefs</option>
                <option value="raiders">Las Vegas Raiders</option>
                <option value="chargers">Los Angeles Chargers</option>
            </optgroup>
            <optgroup label="NFC East">
                <option value="cowboys">Dallas Cowboys</option>
                <option value="giants">New York Giants</option>
                <option value="eagles">Philadelphia Eagles</option>
                <option value="commanders">Washington Commanders</option>
            </optgroup>
            <optgroup label="NFC North">
                <option value="bears">Chicago Bears</option>
                <option value="lions">Detroit Lions</option>
                <option value="packers">Green Bay Packers</option>
                <option value="vikings">Minnesota Vikings</option>
            </optgroup>
            <optgroup label="NFC South">
                <option value="falcons">Atlanta Falcons</option>
                <option value="panthers">Carolina Panthers</option>
                <option value="saints">New Orleans Saints</option>
                <option value="buccaneers">Tampa Bay Buccaneers</option>
            </optgroup>
            <optgroup label="NFC West">
                <option value="cardinals">Arizona Cardinals</option>
                <option value="rams">Los Angeles Rams</option>
                <option value="49ers">San Francisco 49ers</option>
                <option value="seahawks">Seattle Seahawks</option>
            </optgroup>
        `;
    }

    // Update sidebar with new data
    updateLeftSidebar(user) {
        if (!user) return;

        const avatar = (user.displayName || user.username || 'U')[0].toUpperCase();
        
        // Update avatar
        const avatarEl = document.getElementById('sidebarUserAvatar');
        if (avatarEl) avatarEl.textContent = avatar;
        
        // Update name
        const nameEl = document.getElementById('sidebarUserName');
        if (nameEl) {
            nameEl.innerHTML = `
                ${user.displayName || user.username}
                ${user.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
            `;
        }
        
        // Update handle
        const handleEl = document.getElementById('sidebarUserHandle');
        if (handleEl) handleEl.textContent = `@${user.username}`;
    }
}

// Create global instance
window.sidebarTemplates = new SidebarTemplates();

// Global helper functions for onclick handlers
window.handleNavClick = function(event, href) {
    // Handle SPA navigation if needed
    // For now, just navigate normally
    return true;
};

window.handleSearch = function(value) {
    console.log('Search:', value);
    // Implement search functionality
};

window.showAllLiveGames = function() {
    console.log('Show all live games');
};

window.showMoreTrends = function() {
    console.log('Show more trends');
};

window.viewTrend = function(trend) {
    console.log('View trend:', trend);
};

window.viewAllSuggestions = function() {
    console.log('View all suggestions');
};

window.followUser = function(handle) {
    console.log('Follow user:', handle);
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarTemplates;
}