// Platform Manager Component - Secure Version
// File: /frontend/public/js/components/platform-manager-component.js

class PlatformManagerComponent {
    constructor() {
        this.platforms = [];
        this.initialized = false;
        this.isLoading = false;
    }

    // Sanitize user input to prevent XSS
    sanitize(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    async initialize() {
        if (this.initialized) return;
        this.initialized = true;
        
        // Load platforms from backend
        await this.loadPlatforms();
        
        // Set up event listeners
        this.attachEventListeners();
    }

    async loadPlatforms() {
        this.isLoading = true;
        this.updateDisplay();
        
        try {
            // Get current user
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user._id || user.id;
            
            // Load from backend API with user ID
            const response = await fetch(`/api/platforms/my-platforms?userId=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-User-Id': userId || ''
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.platforms = data.platforms || [];
            } else {
                // Fallback to localStorage if backend fails
                this.platforms = JSON.parse(localStorage.getItem('userPlatforms') || '[]');
            }
        } catch (error) {
            console.error('Error loading platforms:', error);
            // Fallback to localStorage
            this.platforms = JSON.parse(localStorage.getItem('userPlatforms') || '[]');
        } finally {
            this.isLoading = false;
            this.updateDisplay();
        }
    }

    render() {
        // Check both possible user storage keys
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const huddleUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const actualUser = user._id || user.id ? user : huddleUser;
        
        // Debug logging
        console.log('Platform Manager - User check:', {
            user: user,
            huddleUser: huddleUser,
            actualUser: actualUser,
            hasId: !!(actualUser._id || actualUser.id)
        });
        
        if (!actualUser._id && !actualUser.id) {
            return this.renderLoginPrompt();
        }
        
        return `
            <div class="platform-manager-container" style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
                ${this.renderHeader()}
                <div id="platforms-grid">
                    ${this.isLoading ? this.renderLoading() : this.renderPlatforms()}
                </div>
            </div>
        `;
    }

    renderHeader() {
        return `
            <div class="manager-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
                <div>
                    <h1 style="margin: 0; font-size: 2rem;">🏟️ My Platforms</h1>
                    <p style="color: var(--text-muted); margin: 0.5rem 0 0 0;">Manage your generated sports platforms</p>
                </div>
                <button onclick="platformManager.createNew()" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #00ff88, #00cc6a); color: black; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
                    <i class="fas fa-plus"></i> Create New Platform
                </button>
            </div>
        `;
    }

    renderLoading() {
        return `
            <div style="text-align: center; padding: 4rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary); margin-bottom: 1rem;"></i>
                <p style="color: var(--text-muted);">Loading your platforms...</p>
            </div>
        `;
    }

    renderLoginPrompt() {
        return `
            <div style="text-align: center; padding: 4rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🔐</div>
                <h2>Login Required</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">Please login to view and manage your platforms</p>
                <button onclick="window.location.href='/login'" style="padding: 1rem 2rem; background: var(--primary); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
                    Login
                </button>
            </div>
        `;
    }

    renderPlatforms() {
        if (this.platforms.length === 0) {
            return this.renderEmptyState();
        }
        
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
                ${this.platforms.map(platform => this.renderPlatformCard(platform)).join('')}
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div style="text-align: center; padding: 4rem; grid-column: 1 / -1;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🏟️</div>
                <h2>No Platforms Yet</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">Create your first sports platform to get started</p>
                <button onclick="platformManager.createNew()" style="padding: 1rem 2rem; background: linear-gradient(135deg, #00ff88, #00cc6a); color: black; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
                    Create Your First Platform
                </button>
            </div>
        `;
    }

    renderPlatformCard(platform) {
        // Sanitize all user-generated content
        const name = this.sanitize(platform.name || platform.leagueName || 'Unnamed Platform');
        const code = this.sanitize(platform.leagueCode || 'N/A');
        const theme = this.sanitize(platform.theme || 'professional');
        const sport = this.sanitize(platform.sport || 'NFL');
        const platformId = this.sanitize(platform.platformId || platform._id || '');
        
        // Safely handle numbers
        const members = parseInt(platform.members) || 0;
        const maxMembers = parseInt(platform.maxMembers) || 30;
        const pot = parseInt(platform.pot) || 0;
        const week = parseInt(platform.week) || 1;
        
        return `
            <div class="platform-card" style="background: var(--bg-secondary); border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border); transition: all 0.3s; cursor: pointer;" 
                 onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.2)'" 
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.25rem; color: var(--text-primary);">${name}</h3>
                        <p style="color: var(--text-muted); margin: 0.25rem 0 0 0; font-size: 0.875rem;">${theme} Theme • ${sport}</p>
                    </div>
                    <div style="background: var(--primary); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.875rem; font-weight: 600;">
                        ${code}
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1.5rem 0; text-align: center;">
                    <div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">${members}/${maxMembers}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Members</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--success);">$${pot}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Pot</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--warning);">W${week}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Current</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="platformManager.openPlatform('${platformId}')" 
                            style="flex: 1; padding: 0.75rem; background: var(--primary); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
                            onmouseover="this.style.opacity='0.9'" 
                            onmouseout="this.style.opacity='1'">
                        Open Platform
                    </button>
                    <button onclick="platformManager.copyInviteLink('${code}')" 
                            style="padding: 0.75rem 1rem; background: var(--surface); color: var(--text); border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
                            onmouseover="this.style.opacity='0.9'" 
                            onmouseout="this.style.opacity='1'">
                        <i class="fas fa-share"></i>
                    </button>
                    <button onclick="platformManager.deletePlatform('${platformId}')" 
                            style="padding: 0.75rem 1rem; background: var(--danger); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
                            onmouseover="this.style.opacity='0.9'" 
                            onmouseout="this.style.opacity='1'">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                ${platform.createdAt ? `
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); text-align: center;">
                        <span style="font-size: 0.75rem; color: var(--text-muted);">
                            Created ${this.getTimeAgo(new Date(platform.createdAt))}
                        </span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    openPlatform(platformId) {
        if (!platformId) return;
        window.open(`/platform/${platformId}/launcher.html`, '_blank');
    }

    copyInviteLink(code) {
        const link = `${window.location.origin}/join/${code}`;
        navigator.clipboard.writeText(link).then(() => {
            this.showToast('Invite link copied!');
        });
    }

    async deletePlatform(platformId) {
        if (!confirm('Are you sure you want to delete this platform? This cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/platforms/${platformId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                // Remove from local array
                this.platforms = this.platforms.filter(p => p.platformId !== platformId && p._id !== platformId);
                
                // Update localStorage
                localStorage.setItem('userPlatforms', JSON.stringify(this.platforms));
                
                // Refresh display
                this.updateDisplay();
                this.showToast('Platform deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting platform:', error);
            this.showToast('Failed to delete platform', 'error');
        }
    }

    createNew() {
        // Navigate to platform generator
        const platformGeneratorNav = document.getElementById('platform-generator-nav');
        if (platformGeneratorNav) {
            platformGeneratorNav.click();
        }
    }

    updateDisplay() {
        const container = document.getElementById('platforms-grid');
        if (container) {
            container.innerHTML = this.isLoading ? this.renderLoading() : this.renderPlatforms();
        }
    }

    attachEventListeners() {
        // Listen for platform creation events
        window.addEventListener('platformCreated', (event) => {
            this.platforms.unshift(event.detail);
            this.updateDisplay();
        });
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? 'var(--success)' : 'var(--danger)'};
            color: white;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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
}

// Initialize global instance
window.platformManager = new PlatformManagerComponent();