// quick-league/ui/LeagueCards.js
export class LeagueCards {
    constructor(parent) {
        this.parent = parent;
    }
    
    renderLeagueCard(league) {
        const leagueId = league.id || league._id;
        const isFull = league.members >= league.maxMembers;
        const canJoin = league.joinable !== false && !isFull;
        
        // Check if current user is the owner
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isOwner = league.owner === 'current-user' || 
                       league.owner === currentUser._id ||
                       league.owner === currentUser.id;
        
        // Check if user is already a member
        const isMember = this.parent.userLeagues.some(l => (l.id || l._id) === leagueId);
        
        return `
            <div class="league-card" data-league-id="${leagueId}" 
                 style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); 
                        border-radius: 12px; padding: 15px; cursor: pointer; transition: all 0.3s;">
                
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div>
                        <h4 style="color: white; margin: 0 0 5px 0; font-size: 1.1rem;">${league.name}</h4>
                <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 5px;">Owner: ${league.owner?.username || league.owner?.displayName || 'Admin'}</div>
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                    ${this.renderLeagueBadges(league)}
                        </div>
                    </div>
                    ${league.pot > 0 ? this.renderPrizePool(league.pot) : ''}
                </div>
                
                ${this.renderBetTypes(league.betTypes)}
                ${this.renderLeagueStats(league)}
                ${this.renderLeagueActions(league, canJoin, isOwner, isMember, leagueId)}
            </div>
        `;
    }
    
    renderLeagueBadges(league) {
        const badges = [];
        
        // Type badge
        badges.push(`
            <span style="background: ${league.type === 'public' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(99, 102, 241, 0.2)'}; 
                         color: ${league.type === 'public' ? '#00ff88' : '#6366f1'}; 
                         padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                ${league.type === 'public' ? 'PUBLIC' : 'PRIVATE'}
            </span>
        `);
        
        // Code badge (clickable to copy)
        if (league.code) {
            badges.push(`
                <button data-action="copy-code" data-code="${league.code}" 
                        onclick="event.stopPropagation();"
                        style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); 
                               padding: 2px 8px; border-radius: 4px; color: #94a3b8; font-size: 0.75rem; cursor: pointer;"
                        title="Click to copy league code">
                    📋 ${league.code}
                </button>
            `);
        }
        
        // Duration badge
        badges.push(`
            <span style="background: rgba(255, 215, 0, 0.2); color: #ffd700; 
                         padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                ${this.getDurationLabel(league.duration)}
            </span>
        `);
        
        // Sport badge
        if (league.sport && league.sport !== 'NFL') {
            badges.push(`
                <span style="background: rgba(139, 92, 246, 0.2); color: #8b5cf6; 
                             padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                    ${league.sport}
                </span>
            `);
        }
        
        // Week/Date badge
        if (league.currentWeek || league.week) {
            const weekDisplay = league.sport === 'MLB' 
                ? 'Today' 
                : `Week ${league.currentWeek || league.week}`;
            badges.push(`
                <span style="background: rgba(59, 130, 246, 0.2); color: #3b82f6; 
                             padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                    ${weekDisplay}
                </span>
            `);
        }
        
        return badges.join('');
    }
    
    renderPrizePool(pot) {
        return `
            <div style="text-align: right;">
                <div style="color: #ffd700; font-size: 0.85rem;">Prize Pool</div>
                <div style="color: white; font-weight: bold;">$${pot}</div>
            </div>
        `;
    }
    
    renderBetTypes(betTypes) {
        if (!betTypes || betTypes.length === 0) {
            betTypes = ['spread'];
        }
        
        const icons = this.parent.constants?.BET_TYPE_ICONS || {
            spread: '📊',
            moneyline: '💰',
            overunder: '📈',
            props: '🎯'
        };
        
        return `
            <div style="margin-bottom: 10px;">
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    ${betTypes.map(type => `
                        <span style="background: rgba(99, 102, 241, 0.2); color: #8b5cf6; 
                                     padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">
                            ${icons[type] || ''} ${type.toUpperCase()}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    renderLeagueStats(league) {
        const membersText = `${league.members || 0}/${league.maxMembers || 20}`;
        const gamesText = this.formatGamesPerWeek(league.gamesPerWeek);
        const entryText = league.entryFee === 0 || !league.entryFee ? 'FREE' : '$' + league.entryFee;
        
        return `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
                <div>
                    <div style="color: #94a3b8; font-size: 0.85rem;">Members</div>
                    <div style="color: white; font-weight: 600;">${membersText}</div>
                </div>
                <div>
                    <div style="color: #94a3b8; font-size: 0.85rem;">Games</div>
                    <div style="color: white; font-weight: 600;">${gamesText}</div>
                </div>
                <div>
                    <div style="color: #94a3b8; font-size: 0.85rem;">Entry</div>
                    <div style="color: white; font-weight: 600;">${entryText}</div>
                </div>
            </div>
        `;
    }
    
    renderLeagueActions(league, canJoin, isOwner, isMember, leagueId) {
        const actions = [];
        
        // Check if user is member (from backend flag or local check)
        const isUserMember = league.isUserMember || isMember || isOwner;
        
        if (isUserMember) {
            // User is already in this league
            actions.push(`
                <button data-action="enter-league" data-league-id="${leagueId}" 
                        style="flex: 1; padding: 8px; background: linear-gradient(135deg, #6366f1, #8b5cf6); 
                               color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Enter League
                </button>
            `);
        } else if (canJoin && league.members < league.maxMembers) {
            // User can join this league
            actions.push(`
                <button data-action="preview-league" data-league-id="${leagueId}" 
                        style="flex: 1; padding: 8px; background: rgba(99, 102, 241, 0.2); 
                               border: 1px solid #6366f1; color: #6366f1;
                               border-radius: 8px; cursor: pointer; font-weight: 600;">
                    View Details
                </button>
            `);
            actions.push(`
                <button data-action="join-league" data-league-id="${leagueId}" 
                        style="flex: 1; padding: 8px; background: linear-gradient(135deg, #00ff88, #00cc6a); 
                               color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Join League
                </button>
            `);
        } else if (league.members >= league.maxMembers) {
            // League is full
            actions.push(`
                <div style="flex: 1; padding: 8px; background: rgba(255, 255, 255, 0.05); 
                            color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.1); 
                            border-radius: 8px; text-align: center; font-size: 0.9rem;">
                    League Full
                </div>
            `);
        } else {
            // League is closed or not joinable
            actions.push(`
                <div style="flex: 1; padding: 8px; background: rgba(255, 255, 255, 0.05); 
                            color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.1); 
                            border-radius: 8px; text-align: center; font-size: 0.9rem;">
                    Not Available
                </div>
            `);
        }
        
        return `<div style="display: flex; gap: 8px;">${actions.join('')}</div>`;
    }
    
    getDurationLabel(duration) {
        if (!duration) return 'Custom';
        if (duration === 1) return '1 Week';
        if (duration === 3) return '3 Weeks';
        if (duration === 4) return '4 Weeks';
        if (duration === 6) return '6 Weeks';
        if (duration === 8) return '8 Weeks';
        if (duration === 10) return '10 Weeks';
        if (duration === 18) return 'Full Season';
        return `${duration} Weeks`;
    }
    
    formatGamesPerWeek(games) {
        if (!games || games === 'all' || games === 16) return 'All';
        if (typeof games === 'string' && games.includes('-')) return games;
        return games.toString();
    }
}