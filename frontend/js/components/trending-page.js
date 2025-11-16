// Trending Page Component

// Import core services
import { apiService } from '/js/core/services/api-service.js';
import { API_ENDPOINTS } from '/js/core/config/api-endpoints.js';
import { sanitizer } from '/js/core/utils/sanitizer.js';

class TrendingPage {
    constructor() {
        this.allTrending = [];
        this.activeSport = 'all';
        this.sports = ['all', 'nfl', 'nba', 'mlb', 'betting', 'community'];
        this.isLoading = false;
    }

    render() {
        return `
            <div class="trending-page" style="padding: 1.5rem;">
                <!-- Header -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <button onclick="feedController.clearSearch()" style="background: none; border: none; color: var(--primary); font-size: 1.5rem; cursor: pointer;" title="Back to feed">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div>
                            <h1 style="margin: 0; font-size: 1.75rem;">📈 Trending Now</h1>
                            <p style="margin: 0.25rem 0 0 0; color: var(--text-muted);">What's happening in sports right now</p>
                        </div>
                    </div>
                    <button onclick="trendingPage.refreshTrending()" style="padding: 0.5rem 1rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; font-size: 0.875rem;">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>

                <!-- Sport Filter Tabs -->
                <div class="sport-filter-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; overflow-x: auto;">
                    ${this.sports.map(sport => `
                        <button class="sport-filter-tab ${sport === this.activeSport ? 'active' : ''}" 
                                onclick="trendingPage.switchSport('${sport}')"
                                style="padding: 0.75rem 1.25rem; background: ${sport === this.activeSport ? 'var(--primary)' : 'var(--bg-secondary)'}; 
                                       color: ${sport === this.activeSport ? 'white' : 'var(--text-primary)'}; border: none; border-radius: 8px; cursor: pointer; 
                                       font-weight: 600; white-space: nowrap; min-width: fit-content;">
                            ${this.getSportDisplayName(sport)} ${this.getSportIcon(sport)}
                        </button>
                    `).join('')}
                </div>

                <!-- Trending Content -->
                <div id="trending-content-container">
                    <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p>Loading trending topics...</p>
                    </div>
                </div>
            </div>
        `;
    }

    getSportDisplayName(sport) {
        const names = {
            'all': 'All Sports',
            'nfl': 'NFL',
            'nba': 'NBA', 
            'mlb': 'MLB',
            'betting': 'Betting',
            'community': 'Community'
        };
        return names[sport] || sport.toUpperCase();
    }

    getSportIcon(sport) {
        const icons = {
            'all': '🏆',
            'nfl': '🏈',
            'nba': '🏀',
            'mlb': '⚾',
            'betting': '💰',
            'community': '👥'
        };
        return icons[sport] || '🔥';
    }

    async initialize() {
        // Initializing Trending Page
        
        await this.loadAllTrending();
        this.renderTrendingContent();
        
        // Trending Page initialized
    }

    async loadAllTrending() {
        try {
            this.isLoading = true;
            
            // Get trending data from API
            const data = await apiService.get(API_ENDPOINTS.TRENDING.LIVE);
            
            if (data.success) {
                this.allTrending = data.trending || [];
                
                // Also get more detailed trending from each sport
                await this.loadExtendedTrending();
            } else {
                // Failed to load trending
                this.allTrending = this.getFallbackTrending();
            }
            
        } catch (error) {
            // Error loading trending
            this.allTrending = this.getFallbackTrending();
        } finally {
            this.isLoading = false;
        }
    }

    async loadExtendedTrending() {
        try {
            // Get more trending topics to reach top 20
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            
            // Load more ESPN data for different sports
            const sports = [
                { name: 'NFL', url: API_ENDPOINTS.EXTERNAL.ESPN_NFL },
                { name: 'NBA', url: API_ENDPOINTS.EXTERNAL.ESPN_NBA },
                { name: 'MLB', url: API_ENDPOINTS.EXTERNAL.ESPN_MLB }
            ];

            for (const sport of sports) {
                try {
                    const response = await fetch(sport.url);
                    const data = await response.json();
                    
                    if (data.articles) {
                        const sportTrending = data.articles.slice(0, 5).map((article, index) => ({
                            category: `${sport.name} • News`,
                            title: this.extractHashtagFromHeadline(article.headline),
                            shortDescription: this.createShortDescription(article.headline, article.description),
                            stats: this.generateMockEngagement(sport.name.toLowerCase(), index),
                            url: article.links?.web?.href,
                            timestamp: new Date(article.published || Date.now()),
                            sport: sport.name
                        }));
                        
                        this.allTrending.push(...sportTrending);
                    }
                } catch (error) {
                    // Error loading sport trending
                }
            }
            
            // Remove duplicates and sort by engagement
            this.allTrending = this.removeDuplicates(this.allTrending);
            this.allTrending.sort((a, b) => this.parseEngagement(b.stats) - this.parseEngagement(a.stats));
            
        } catch (error) {
            // Error loading extended trending
        }
    }

    removeDuplicates(trending) {
        const seen = new Set();
        return trending.filter(item => {
            const key = item.title + item.category;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    parseEngagement(stats) {
        // Convert "12.4K posts" to number for sorting
        if (!stats) return 0;
        const match = stats.match(/([\d.]+)([KM]?)/);
        if (!match) return 0;
        
        let num = parseFloat(match[1]);
        const multiplier = match[2];
        
        if (multiplier === 'K') num *= 1000;
        if (multiplier === 'M') num *= 1000000;
        
        return num;
    }

    extractHashtagFromHeadline(headline) {
        // Similar to server-side logic
        const teamNames = [
            'Chiefs', 'Bills', 'Cowboys', 'Patriots', 'Packers', 'Raiders',
            'Lakers', 'Celtics', 'Warriors', 'Heat', 'Knicks'
            // Add more as needed
        ];
        
        for (const team of teamNames) {
            if (headline.toLowerCase().includes(team.toLowerCase())) {
                return `#${team}`;
            }
        }
        
        // Extract significant word
        const words = headline.split(' ');
        const significant = words.find(word => 
            word.length > 4 && 
            !['the', 'and', 'for', 'with', 'from'].includes(word.toLowerCase())
        );
        
        return significant ? `#${significant}` : '#Sports';
    }

    createShortDescription(headline, description) {
        if (description && description.length <= 80) {
            return description;
        }
        if (description && description.length > 80) {
            return description.substring(0, 77) + '...';
        }
        if (headline.length <= 80) {
            return headline;
        }
        return headline.substring(0, 77) + '...';
    }

    generateMockEngagement(sport, index) {
        const base = {
            nfl: [18000, 12000, 8500, 5200, 3100],
            nba: [15000, 9500, 6200, 4100, 2800],
            mlb: [8500, 5200, 3400, 2100, 1500]
        };
        
        const sportBase = base[sport] || [5000, 3000, 2000, 1200, 800];
        const engagement = sportBase[index] || 1000;
        const variation = Math.floor(Math.random() * 1000) - 500;
        const final = Math.max(100, engagement + variation);
        
        if (final >= 10000) {
            return `${(final / 1000).toFixed(1)}K posts`;
        }
        return `${final} posts`;
    }

    renderTrendingContent() {
        const container = document.getElementById('trending-content-container');
        if (!container) return;

        let filteredTrending = this.allTrending;
        
        // Filter by sport if not 'all'
        if (this.activeSport !== 'all') {
            filteredTrending = this.allTrending.filter(item => {
                if (this.activeSport === 'betting') {
                    return item.category.toLowerCase().includes('betting') || 
                           item.title.toLowerCase().includes('bet');
                }
                if (this.activeSport === 'community') {
                    return item.category.toLowerCase().includes('community');
                }
                return item.sport?.toLowerCase() === this.activeSport ||
                       item.category.toLowerCase().includes(this.activeSport);
            });
        }
        
        // Group by sport for better organization
        const bySport = {};
        filteredTrending.forEach(item => {
            const sport = item.sport || this.extractSportFromCategory(item.category);
            if (!bySport[sport]) bySport[sport] = [];
            bySport[sport].push(item);
        });
        
        if (!filteredTrending.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                    <h3>No trending topics</h3>
                    <p>No trending topics found for ${this.getSportDisplayName(this.activeSport)}</p>
                    <button onclick="trendingPage.switchSport('all')" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
                        View All Sports
                    </button>
                </div>
            `;
            return;
        }

        const html = Object.entries(bySport).map(([sport, items]) => `
            <div class="sport-trending-section" style="margin-bottom: 2.5rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 2px solid ${this.getSportColor(sport)};">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.5rem;">${this.getSportIcon(sport)}</span>
                        <h3 style="margin: 0; color: var(--text-primary); font-size: 1.25rem;">${sport.toUpperCase()}</h3>
                    </div>
                    <span style="background: ${this.getSportColor(sport)}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
                        ${items.length} trending
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
                    ${items.slice(0, 6).map((item, index) => {
                        const safeTitle = sanitizer.text(item.title);
                        const safeCategory = sanitizer.text(item.category);
                        const safeDescription = item.shortDescription ? sanitizer.text(item.shortDescription) : '';
                        const safeStats = sanitizer.text(item.stats);
                        const safeUrl = item.url ? sanitizer.url(item.url) : '';
                        
                        return `
                            <div class="trending-card" 
                                 onclick="trendingPage.openTrendingItem('${safeUrl}', '${safeTitle}')"
                                 style="background: linear-gradient(135deg, var(--bg-secondary), var(--surface)); 
                                        border-radius: 16px; padding: 1.25rem; cursor: pointer; 
                                        border: 1px solid var(--border); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                        position: relative; overflow: hidden;"
                                 onmouseover="this.style.transform='translateY(-4px) scale(1.02)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.15)'"
                                 onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='none'">
                                
                                <!-- Rank Badge -->
                                <div style="position: absolute; top: 0.75rem; right: 0.75rem; background: ${this.getSportColor(sport)}; 
                                            color: white; width: 28px; height: 28px; border-radius: 50%; 
                                            display: flex; align-items: center; justify-content: center; 
                                            font-weight: bold; font-size: 0.75rem;">
                                    ${index + 1}
                                </div>
                                
                                <div style="margin-bottom: 0.75rem;">
                                    <span style="background: linear-gradient(135deg, ${this.getSportColor(sport)}, ${this.getLighterColor(this.getSportColor(sport))}); 
                                                 color: white; padding: 0.25rem 0.6rem; border-radius: 8px; 
                                                 font-size: 0.7rem; font-weight: 600; display: inline-block;">
                                        ${safeCategory}
                                    </span>
                                </div>
                                
                                <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; color: var(--text-primary); 
                                           font-weight: 700; line-height: 1.3;">
                                    ${safeTitle}
                                </h4>
                                
                                ${safeDescription ? `
                                    <p style="margin: 0 0 0.75rem 0; color: var(--text-muted); 
                                              font-size: 0.85rem; line-height: 1.4; 
                                              display: -webkit-box; -webkit-line-clamp: 2; 
                                              -webkit-box-orient: vertical; overflow: hidden;">
                                        ${safeDescription}
                                    </p>
                                ` : ''}
                                
                                <div style="display: flex; align-items: center; gap: 0.75rem; 
                                            padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1);">
                                    <div style="display: flex; align-items: center; gap: 0.25rem; 
                                                color: ${this.getSportColor(sport)}; font-weight: 600; font-size: 0.85rem;">
                                        🔥 <span>${safeStats}</span>
                                    </div>
                                    <div style="color: var(--text-muted); font-size: 0.75rem;">
                                        ${this.getTimeAgo(item.timestamp)}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="trending-results">
                ${html}
            </div>
        `;
    }

    getSportColor(sport) {
        const colors = {
            'NFL': '#FF6B35',
            'NBA': '#FF8C42', 
            'MLB': '#FF9500',
            'all': '#6C5CE7',
            'betting': '#00B894',
            'community': '#A29BFE'
        };
        return colors[sport] || colors['all'];
    }

    getTimeAgo(timestamp) {
        if (!timestamp) return 'Recent';
        
        const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
        
        if (seconds < 60) return 'Just now';
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    extractSportFromCategory(category) {
        if (category.includes('NFL')) return 'NFL';
        if (category.includes('NBA')) return 'NBA';
        if (category.includes('MLB')) return 'MLB';
        if (category.includes('NHL')) return 'NHL';
        if (category.includes('Betting')) return 'Betting';
        return 'General';
    }

    getLighterColor(color) {
        // Simple color lightening - just return a lighter variant
        const colorMap = {
            '#FF6B35': '#FF8A65',
            '#FF8C42': '#FFAB78',
            '#FF9500': '#FFB74D',
            '#6C5CE7': '#9B8BF4',
            '#00B894': '#26D0B0',
            '#A29BFE': '#C7C1FF'
        };
        return colorMap[color] || color;
    }

    switchSport(sport) {
        this.activeSport = sport;
        
        // Update active tab
        document.querySelectorAll('.sport-filter-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.textContent.trim().includes(this.getSportDisplayName(sport))) {
                tab.classList.add('active');
            }
        });
        
        // Re-render content
        this.renderTrendingContent();
    }

    openTrendingItem(url, hashtag) {
        if (url && url !== 'undefined' && url !== '') {
            // Open ESPN article in new tab
            window.open(url, '_blank');
        } else {
            // Fallback to hashtag search
            if (window.feedController && typeof window.feedController.searchHashtag === 'function') {
                window.feedController.searchHashtag(hashtag);
            }
        }
    }

    async refreshTrending() {
        // Refreshing trending data
        
        const container = document.getElementById('trending-content-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Refreshing trending topics...</p>
                </div>
            `;
        }
        
        await this.loadAllTrending();
        this.renderTrendingContent();
    }

    getFallbackTrending() {
        return [
            {
                category: 'NFL • Breaking',
                title: '#Raiders',
                shortDescription: 'Raiders make key roster moves ahead of playoffs',
                stats: '14.7K posts',
                sport: 'NFL',
                timestamp: new Date()
            },
            {
                category: 'NBA • Hot',
                title: '#LeBronJames',
                shortDescription: 'LeBron reaches new milestone in Lakers victory',
                stats: '28.3K posts',
                sport: 'NBA',
                timestamp: new Date()
            },
            {
                category: 'Betting • Trending',
                title: '#LiveBetting',
                shortDescription: 'Monday Night Football generating huge action',
                stats: '12.1K posts',
                sport: 'Betting',
                timestamp: new Date()
            }
        ];
    }
}

// Create and export instance
const trendingPage = new TrendingPage();

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.trendingPage = trendingPage;
}

// Export for module usage
export { trendingPage, TrendingPage };

// Trending page component loaded