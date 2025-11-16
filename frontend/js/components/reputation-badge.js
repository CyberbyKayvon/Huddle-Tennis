// frontend/public/js/components/reputation-badge.js

// Import core services
import { apiService } from '/js/core/services/api-service.js';
import { API_ENDPOINTS } from '/js/core/config/api-endpoints.js';
import { sanitizer } from '/js/core/utils/sanitizer.js';

class ReputationBadge {
    constructor() {
        this.reputationCache = new Map();
    }

    async getUserReputation(userId) {
        // Check cache first
        if (this.reputationCache.has(userId)) {
            const cached = this.reputationCache.get(userId);
            if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 min cache
                return cached.data;
            }
        }

        try {
            const data = await apiService.get(API_ENDPOINTS.REPUTATION.GET(userId));
            
            if (data.success) {
                this.reputationCache.set(userId, {
                    data: data.reputation,
                    timestamp: Date.now()
                });
                return data.reputation;
            }
        } catch (error) {
            // Error is handled by apiService, just return null
        }
        
        return null;
    }

    renderStars(count) {
        const fullStars = Math.floor(count);
        const hasHalf = count % 1 >= 0.5;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '⭐';
        }
        if (hasHalf && fullStars < 5) {
            stars += '✨';
        }
        
        return stars || '⭐';
    }

    renderCompactBadge(reputation) {
        if (!reputation) return '';
        
        const trust = reputation.trustLevel;
        const completion = reputation.totalBets > 0 
            ? Math.round((reputation.completedBets / reputation.totalBets) * 100) 
            : 100;
        
        return `
            <div class="reputation-compact" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.5rem; background: ${trust.color}22; border-radius: 20px; border: 1px solid ${trust.color}44;">
                <span style="font-size: 0.875rem;">${this.renderStars(trust.stars)}</span>
                <span style="font-size: 0.75rem; font-weight: 600; color: ${trust.color};">${trust.level}</span>
                ${completion < 100 ? `<span style="font-size: 0.7rem; color: var(--text-muted);">${completion}%</span>` : ''}
                ${reputation.badges.includes('fast-payer') ? '<span title="Fast Payer">⚡</span>' : ''}
                ${reputation.badges.includes('verified') ? '<span title="Verified">✅</span>' : ''}
            </div>
        `;
    }

    renderFullBadge(reputation) {
        if (!reputation) {
            return `
                <div class="reputation-full" style="padding: 1rem; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border);">
                    <div style="text-align: center; color: var(--text-muted);">
                        <p>No reputation data available</p>
                        <button onclick="window.location.href='/api/auth/signup'" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Create Account
                        </button>
                    </div>
                </div>
            `;
        }

        const trust = reputation.trustLevel;
        const winRate = reputation.totalBets > 0 
            ? Math.round((reputation.wonBets / reputation.completedBets) * 100) 
            : 0;
        const paymentTime = reputation.avgPaymentTime 
            ? `${reputation.avgPaymentTime.toFixed(1)}hrs` 
            : 'N/A';

        return `
            <div class="reputation-full" style="padding: 1.5rem; background: linear-gradient(135deg, ${trust.color}11, ${trust.color}22); border-radius: 16px; border: 1px solid ${trust.color}44;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <div>
                        <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">${this.renderStars(trust.stars)}</div>
                        <div style="font-size: 1.25rem; font-weight: bold; color: ${trust.color};">${trust.level} Reputation</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--text-primary);">${reputation.overallScore}</div>
                        <div style="font-size: 0.875rem; color: var(--text-muted);">Trust Score</div>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: var(--bg-primary); padding: 1rem; border-radius: 12px;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">Total Bets</div>
                        <div style="font-size: 1.25rem; font-weight: bold; color: var(--text-primary);">${reputation.totalBets}</div>
                    </div>
                    <div style="background: var(--bg-primary); padding: 1rem; border-radius: 12px;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">Completed</div>
                        <div style="font-size: 1.25rem; font-weight: bold; color: var(--success);">${reputation.completedBets}</div>
                    </div>
                    <div style="background: var(--bg-primary); padding: 1rem; border-radius: 12px;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">Win Rate</div>
                        <div style="font-size: 1.25rem; font-weight: bold; color: ${winRate > 50 ? 'var(--success)' : 'var(--warning)'};">${winRate}%</div>
                    </div>
                    <div style="background: var(--bg-primary); padding: 1rem; border-radius: 12px;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">Avg Pay Time</div>
                        <div style="font-size: 1.25rem; font-weight: bold; color: var(--primary);">${paymentTime}</div>
                    </div>
                </div>

                <!-- Payment Score Bar -->
                <div style="margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.875rem; color: var(--text-muted);">Payment Score</span>
                        <span style="font-size: 0.875rem; font-weight: bold; color: var(--text-primary);">${reputation.paymentScore}/100</span>
                    </div>
                    <div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${reputation.paymentScore}%; background: linear-gradient(90deg, var(--danger), var(--warning), var(--success)); transition: width 0.3s;"></div>
                    </div>
                </div>

                <!-- Badges -->
                ${reputation.badges.length > 0 ? `
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem;">
                        ${reputation.badges.map(badge => this.renderBadge(badge)).join('')}
                    </div>
                ` : ''}

                <!-- Current Streak -->
                ${reputation.currentStreak !== 0 ? `
                    <div style="padding: 0.75rem; background: ${reputation.currentStreak > 0 ? 'var(--success)' : 'var(--danger)'}22; border-radius: 8px; text-align: center;">
                        <span style="font-size: 0.875rem; color: ${reputation.currentStreak > 0 ? 'var(--success)' : 'var(--danger)'};">
                            ${reputation.currentStreak > 0 ? '🔥 Win' : '❄️ Loss'} Streak: ${Math.abs(reputation.currentStreak)}
                        </span>
                    </div>
                ` : ''}

                <!-- Payment Methods -->
                ${reputation.paymentMethods && reputation.paymentMethods.length > 0 ? `
                    <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
                        <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.75rem;">Accepted Payment Methods</div>
                        <div style="display: flex; gap: 0.5rem;">
                            ${reputation.paymentMethods.map(method => `
                                <div style="padding: 0.5rem 0.75rem; background: var(--bg-primary); border-radius: 8px; font-size: 0.875rem;">
                                    ${this.getPaymentIcon(method.type)} ${method.verified ? '✅' : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderBadge(badge) {
        const badges = {
            'fast-payer': { icon: '⚡', label: 'Fast Payer', color: '#00D084' },
            'reliable': { icon: '🛡️', label: 'Reliable', color: '#6C5CE7' },
            'high-roller': { icon: '💰', label: 'High Roller', color: '#FFD700' },
            'verified': { icon: '✅', label: 'Verified', color: '#00B894' },
            'founding-member': { icon: '🏆', label: 'OG', color: '#FF6B6B' },
            'dispute-free': { icon: '🤝', label: 'No Disputes', color: '#4ECDC4' }
        };

        const b = badges[badge] || { icon: '🏅', label: badge, color: '#95A5A6' };
        
        return `
            <div style="display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.375rem 0.75rem; background: ${b.color}22; border: 1px solid ${b.color}44; border-radius: 20px;">
                <span>${b.icon}</span>
                <span style="font-size: 0.75rem; font-weight: 600; color: ${b.color};">${b.label}</span>
            </div>
        `;
    }

    getPaymentIcon(type) {
        const icons = {
            'venmo': '📱',
            'cashapp': '💵',
            'zelle': '🏦',
            'paypal': '💳',
            'crypto': '₿'
        };
        return icons[type] || '💰';
    }
}

// Create global instance
// Create and export instance
const reputationBadge = new ReputationBadge();

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.reputationBadge = reputationBadge;
}

// Export for module usage
export { reputationBadge, ReputationBadge };

// Component loadedadge = new ReputationBadge();

console.log('✅ Reputation badge component loaded');