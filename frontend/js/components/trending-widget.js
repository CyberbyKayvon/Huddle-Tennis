// Trending Widget Component

// Import core services
import { apiService } from '/js/core/services/api-service.js';
import { API_ENDPOINTS } from '/js/core/config/api-endpoints.js';
import { sanitizer } from '/js/core/utils/sanitizer.js';

class TrendingWidget {
    constructor() {
        this.container = document.getElementById('trending-container');
        this.updateInterval = null;
        this.lastUpdate = null;
    }

    async init() {
        // Initializing trending widget
        
        if (!this.container) {
            // Trending container not found
            return;
        }

        await this.loadTrending();
        
        // Update every 5 minutes
        this.updateInterval = setInterval(() => {
            this.loadTrending();
        }, 5 * 60 * 1000);
        
        // Trending widget initialized
    }

    async loadTrending() {
        try {
            const data = await apiService.get(API_ENDPOINTS.TRENDING.LIVE);
            
            if (data.success && data.trending) {
                this.renderTrending(data.trending);
                this.lastUpdate = new Date(data.lastUpdate);
            } else {
                // No trending data received
                this.renderFallback();
            }
        } catch (error) {
            // Failed to load trending - show fallback
            this.renderFallback();
        }
    }

    renderTrending(trending) {
        if (!this.container || !trending.length) {
            this.renderFallback();
            return;
        }

        // Group trending by sport
        const bySport = {};
        trending.forEach(item => {
            const sport = this.extractSport(item.category);
            if (!bySport[sport]) bySport[sport] = [];
            bySport[sport].push(item);
        });

        const html = `
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${Object.entries(bySport).slice(0, 3).map(([sport, items]) => `
                    <div class="trending-sport-group" style="background: linear-gradient(135deg, ${this.getSportGradient(sport)}); padding: 1rem; border-radius: 12px; cursor: pointer; transition: all 0.2s;"
                         onclick="trendingWidget.showTrendingBySport('${sport}')"
                         onmouseover="this.style.transform='translateX(-4px)'"
                         onmouseout="this.style.transform='translateX(0)'">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.25rem;">${this.getSportEmoji(sport)}</span>
                                <span style="font-weight: 700; color: white; font-size: 0.9rem;">${sport.toUpperCase()}</span>
                            </div>
                            <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; color: white;">
                                ${items.length} trending
                            </span>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${items.slice(0, 2).map(item => `
                                <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 0.5rem 0.75rem; border-radius: 20px; font-size: 0.8rem; color: white; font-weight: 600;">
                                    ${sanitizer.text(item.title)}
                                    <span style="opacity: 0.8; margin-left: 0.25rem; font-size: 0.75rem;">${sanitizer.text(item.stats)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="text-align: center; margin-top: 0.5rem;">
                <button onclick="trendingWidget.showTrendingPage()" style="background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-primary); padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.8rem; cursor: pointer; width: 100%;">
                    View All Trending →
                </button>
            </div>
        `;

        this.container.innerHTML = html;
    }

    renderFallback() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="trending-item">
                <div class="trending-category">NFL • Live</div>
                <div class="trending-title">#SundayFootball</div>
                <div class="trending-stats">45.2K posts</div>
            </div>
            <div class="trending-item">
                <div class="trending-category">NBA • Hot</div>
                <div class="trending-title">#LeBronJames</div>
                <div class="trending-stats">28.7K posts</div>
            </div>
            <div class="trending-item">
                <div class="trending-category">Betting • Trending</div>
                <div class="trending-title">#Vikings</div>
                <div class="trending-stats">12.3K predictions</div>
            </div>
        `;
    }

    extractSport(category) {
        const sportMap = {
            'NFL': 'nfl',
            'NBA': 'nba', 
            'MLB': 'mlb',
            'NHL': 'nhl',
            'NCAAF': 'ncaaf',
            'Betting': 'betting'
        };
        
        for (const [key, value] of Object.entries(sportMap)) {
            if (category.includes(key)) return value;
        }
        return 'general';
    }

    getSportEmoji(sport) {
        const emojis = {
            'nfl': '🏈',
            'nba': '🏀',
            'mlb': '⚾',
            'nhl': '🏒',
            'ncaaf': '🎓',
            'betting': '💰',
            'general': '🔥'
        };
        return emojis[sport] || '🏆';
    }

    getSportGradient(sport) {
        const gradients = {
            'nfl': 'rgba(139, 69, 19, 0.9), rgba(205, 133, 63, 0.9)',
            'nba': 'rgba(255, 140, 0, 0.9), rgba(255, 69, 0, 0.9)',
            'mlb': 'rgba(0, 100, 0, 0.9), rgba(34, 139, 34, 0.9)',
            'nhl': 'rgba(0, 0, 139, 0.9), rgba(65, 105, 225, 0.9)',
            'ncaaf': 'rgba(128, 0, 128, 0.9), rgba(186, 85, 211, 0.9)',
            'betting': 'rgba(0, 128, 0, 0.9), rgba(50, 205, 50, 0.9)',
            'general': 'rgba(220, 20, 60, 0.9), rgba(255, 69, 0, 0.9)'
        };
        return gradients[sport] || gradients['general'];
    }

    showTrendingBySport(sport) {
        if (window.trendingPage) {
            this.showTrendingPage();
            setTimeout(() => {
                window.trendingPage.switchSport(sport);
            }, 100);
        }
    }

    searchHashtag(hashtag) {
        // Searching for hashtag
        
        // Update the search input if it exists
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.value = hashtag;
            searchInput.focus();
        }
        
        // Trigger search in feed controller
        if (window.feedController && typeof window.feedController.searchHashtag === 'function') {
            window.feedController.searchHashtag(hashtag);
        } else {
            // Fallback: show search results
            this.showHashtagResults(hashtag);
        }
    }

    async showHashtagResults(hashtag) {
        const feedContainer = document.querySelector('.feed-posts');
        if (!feedContainer) return;
        
        try {
            const cleanTag = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
            const data = await apiService.get(API_ENDPOINTS.TRENDING.BY_HASHTAG(cleanTag));
            
            if (data.success) {
                feedContainer.innerHTML = `
                    <div style="padding: 2rem;">
                        <h2 style="margin-bottom: 1rem;">🔍 ${sanitizer.text(data.hashtag)}</h2>
                        <p style="color: var(--text-muted); margin-bottom: 2rem;">Found ${data.count} posts</p>
                        
                        ${data.posts.length > 0 ? 
                            data.posts.map(post => {
                                const safeUsername = sanitizer.text(post.userId?.username || 'U');
                                const safeDisplayName = sanitizer.text(post.userId?.displayName || post.userId?.username || 'User');
                                const safeMessage = sanitizer.text(post.message);
                                
                                return `
                                    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                                        <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                                            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 0.75rem;">
                                                ${safeUsername[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div style="font-weight: bold;">${safeDisplayName}</div>
                                                <div style="font-size: 0.875rem; color: var(--text-muted);">${this.getTimeAgo(new Date(post.createdAt))}</div>
                                            </div>
                                        </div>
                                        <div style="margin-left: 2.5rem;">
                                            ${safeMessage}
                                        </div>
                                    </div>
                                `;
                            }).join('') :
                            '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No posts found for this hashtag</div>'
                        }
                    </div>
                `;
            }
        } catch (error) {
            // Error searching hashtag
            feedContainer.innerHTML = `
                <div style="padding: 2rem; text-align: center;">
                    <h3>Search Error</h3>
                    <p style="color: var(--text-muted);">Unable to search for ${sanitizer.text(hashtag)}</p>
                </div>
            `;
        }
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'just now';
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    showTrendingPage() {
        // Loading full trending page
        
        // CRITICAL: Set flags to prevent feed reload
        window.currentComponent = 'trending-page';
        window.preventFeedReload = true;
        
        // Load the trending page component
        if (window.trendingPage) {
            const feedContainer = document.querySelector('.feed-posts');
            if (feedContainer) {
                feedContainer.innerHTML = window.trendingPage.render();
                window.trendingPage.initialize();
            }
        } else {
            // Create and load trending page
            this.createTrendingPage();
        }
        
        // Clear active tabs
        const feedTabs = document.querySelectorAll('.feed-tab');
        feedTabs.forEach(t => t.classList.remove('active'));
        
        // Hide create post area
        const createPostArea = document.querySelector('.create-post-area');
        if (createPostArea) createPostArea.style.display = 'none';
    }

    createTrendingPage() {
        const feedContainer = document.querySelector('.feed-posts');
        if (feedContainer) {
            feedContainer.innerHTML = `
                <div style="padding: 2rem;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                        <button onclick="feedController.clearSearch()" style="background: none; border: none; color: var(--primary); font-size: 1.5rem; cursor: pointer;" title="Back to feed">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h2>📈 Trending Now</h2>
                    </div>
                    <p>Trending page component loading...</p>
                </div>
            `;
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Create and export instance
const trendingWidget = new TrendingWidget();

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.trendingWidget = trendingWidget;
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // Small delay to ensure container is ready
        setTimeout(() => {
            trendingWidget.init();
        }, 500);
    });
}

// Export for module usage
export { trendingWidget, TrendingWidget };

// Trending widget component loaded