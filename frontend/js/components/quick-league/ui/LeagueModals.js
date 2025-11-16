// quick-league/ui/LeagueModals.js
export class LeagueModals {
    constructor(parent) {
        this.parent = parent;
    }
    
    showCreateModal() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.setAttribute('data-modal-overlay', 'true');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9999;
        `;
        
        const modal = document.createElement('div');
        modal.setAttribute('data-modal', 'create-league');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #2a2a3e);
            padding: 30px;
            border-radius: 20px;
            z-index: 10000;
            width: 90%;
            max-width: 700px;
            max-height: 90vh;
            overflow-y: auto;
            border: 2px solid #6366f1;
            box-shadow: 0 20px 60px rgba(99, 102, 241, 0.3);
        `;
        
        modal.innerHTML = DOMPurify.sanitize(this.getCreateModalContent());
        
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
        
        // Initialize form state
        this.parent.createLeagueForm = {
            name: '',
            type: 'public',
            sport: 'NFL',
            betTypes: ['spread'],
            duration: 18,
            gamesPerWeek: 'all',
            scoringSystem: 'standard',
            maxMembers: 20,
            entryFee: 0
        };
        
        // Close on overlay click
        overlay.onclick = () => this.closeModal();
        
        setTimeout(() => this.parent.attachModalEventListeners(), 0);
    }
    
    closeModal() {
        const modal = document.querySelector('[data-modal="create-league"]');
        const overlay = document.querySelector('[data-modal-overlay]');
        if (modal) modal.remove();
        if (overlay) overlay.remove();
    }
    
    getCreateModalContent() {
        const constants = this.parent.constants || {};
        
        return `
            <h3 style="color: #00ff88; margin-bottom: 20px;">Create Quick League</h3>
            
            <!-- League Name -->
            <div style="margin-bottom: 20px;">
                <label style="color: #94a3b8; display: block; margin-bottom: 5px;">League Name</label>
                <input type="text" id="leagueName" placeholder="Sunday Sweats" 
                       style="width: 100%; padding: 10px; background: rgba(0, 0, 0, 0.3); 
                              border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
            </div>
            
            <!-- Sport Selection -->
            <div style="margin-bottom: 20px;">
                <label style="color: #94a3b8; display: block; margin-bottom: 10px;">Sport</label>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 8px;">
                    ${Object.entries(constants.SPORTS || {NFL: 'NFL', NCAAF: 'NCAAF', NBA: 'NBA', MLB: 'MLB', NHL: 'NHL'}).map(([key, value]) => `
                        <button data-sport="${value}" 
                                style="padding: 10px; background: ${value === 'NFL' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)'}; 
                                       border: 1px solid ${value === 'NFL' ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'}; 
                                       border-radius: 8px; color: ${value === 'NFL' ? '#6366f1' : '#94a3b8'}; cursor: pointer;">
                            ${this.getSportIcon(value)} ${value}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <!-- League Type and Max Members -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                <div>
                    <label style="color: #94a3b8; display: block; margin-bottom: 5px;">Type</label>
                    <select id="leagueType" style="width: 100%; padding: 10px; background: rgba(0, 0, 0, 0.3); 
                                                    border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                    </select>
                </div>
                <div>
                    <label style="color: #94a3b8; display: block; margin-bottom: 5px;">Max Members</label>
                    <input type="number" id="maxMembers" value="20" min="2" max="100"
                           style="width: 100%; padding: 10px; background: rgba(0, 0, 0, 0.3); 
                                  border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                </div>
            </div>
            
            <!-- Payment Structure -->
            <div style="margin-bottom: 20px;">
                <label style="color: #94a3b8; display: block; margin-bottom: 10px;">Payment Structure</label>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <button data-payment="free" 
                            style="padding: 10px; background: rgba(0, 255, 136, 0.2); 
                                   border: 1px solid #00ff88; border-radius: 8px; color: #00ff88; cursor: pointer;">
                        FREE League
                    </button>
                    <button data-payment="simple" 
                            style="padding: 10px; background: rgba(255, 255, 255, 0.05); 
                                   border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #94a3b8; cursor: pointer;">
                        Simple Entry Fee
                    </button>
                    <button data-payment="weekly" 
                            style="padding: 10px; background: rgba(255, 255, 255, 0.05); 
                                   border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #94a3b8; cursor: pointer;">
                        Weekly Payments
                    </button>
                    <button data-payment="combined" 
                            style="padding: 10px; background: rgba(255, 255, 255, 0.05); 
                                   border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #94a3b8; cursor: pointer;">
                        Weekly + Season
                    </button>
                </div>
                
                <div id="paymentFields" style="display: none; margin-top: 15px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                        <div id="simpleEntryField" style="display: none;">
                            <label style="color: #94a3b8; display: block; margin-bottom: 5px; font-size: 0.85rem;">Entry Fee</label>
                            <input type="number" id="entryFee" value="0" min="0" placeholder="$ per person"
                                   style="width: 100%; padding: 8px; background: rgba(0, 0, 0, 0.3); 
                                          border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                        </div>
                        <div id="weeklyAmountField" style="display: none;">
                            <label style="color: #94a3b8; display: block; margin-bottom: 5px; font-size: 0.85rem;">Weekly Amount</label>
                            <input type="number" id="weeklyAmount" value="100" min="0" placeholder="$ per week"
                                   style="width: 100%; padding: 8px; background: rgba(0, 0, 0, 0.3); 
                                          border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                        </div>
                        <div id="seasonAmountField" style="display: none;">
                            <label style="color: #94a3b8; display: block; margin-bottom: 5px; font-size: 0.85rem;">Season Amount</label>
                            <input type="number" id="seasonAmount" value="1000" min="0" placeholder="$ at season end"
                                   style="width: 100%; padding: 8px; background: rgba(0, 0, 0, 0.3); 
                                          border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                        </div>
                    </div>
                    
                    <div style="background: rgba(255, 193, 7, 0.1); padding: 12px; border-radius: 8px; margin-top: 15px; border: 1px solid rgba(255, 193, 7, 0.3);">
                        <div style="display: flex; align-items: center; gap: 8px; color: #ffc107; margin-bottom: 8px;">
                            <span style="font-size: 1.2rem;">💰</span>
                            <strong>Peer-to-Peer Payments</strong>
                        </div>
                        <p style="color: #ffc107; margin: 0; font-size: 0.85rem; line-height: 1.4;">
                            All payments are handled directly between members outside this platform. 
                            Winners will be tracked, but members arrange payments using their preferred method (Venmo, Cash App, Zelle, cash, etc).
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Bet Types -->
            <div style="margin-bottom: 20px;">
                <label style="color: #94a3b8; display: block; margin-bottom: 10px;">Bet Types (Select Multiple)</label>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    ${Object.entries(constants.BET_TYPES || {SPREAD: 'spread', MONEYLINE: 'moneyline', 'OVER/UNDER': 'overunder', PROPS: 'props'}).map(([key, value]) => `
                        <button data-bet-type="${value}" 
                                style="padding: 12px; background: ${value === 'spread' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)'}; 
                                       border: 1px solid ${value === 'spread' ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'}; 
                                       border-radius: 8px; color: ${value === 'spread' ? '#6366f1' : '#94a3b8'}; cursor: pointer;">
                            ${constants.BET_TYPE_ICONS?.[value] || ''} ${key}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <!-- League Duration -->
            <div style="margin-bottom: 20px;">
                <label style="color: #94a3b8; display: block; margin-bottom: 10px;">League Duration</label>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    ${(constants.LEAGUE_DURATIONS || [
                        {value: 1, label: '1 Week', icon: '⚡'},
                        {value: 4, label: '4 Weeks', icon: '📅'},
                        {value: 8, label: '8 Weeks', icon: '🗓️'},
                        {value: 18, label: 'Full Season', icon: '🏆'}
                    ]).slice(0, -1).map(dur => `
                        <button data-duration="${dur.value}" 
                                style="padding: 10px; background: ${dur.value === 18 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)'}; 
                                       border: 1px solid ${dur.value === 18 ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'}; 
                                       border-radius: 8px; color: ${dur.value === 18 ? '#6366f1' : '#94a3b8'}; cursor: pointer;">
                            ${dur.icon} ${dur.label}
                        </button>
                    `).join('')}
                    <button data-duration="custom" 
                            style="padding: 10px; background: rgba(255, 255, 255, 0.05); 
                                   border: 1px solid rgba(255, 255, 255, 0.1); 
                                   border-radius: 8px; color: #94a3b8; cursor: pointer;">
                        ⚙️ Custom
                    </button>
                </div>
                <div id="customDurationInput" style="display: none; margin-top: 10px;">
                    <input type="number" id="customDuration" placeholder="Number of weeks" min="1" max="22"
                           style="width: 100%; padding: 8px; background: rgba(0, 0, 0, 0.3); 
                                  border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                </div>
            </div>
            
            <!-- Games Per Week -->
            <div style="margin-bottom: 20px;">
                <label style="color: #94a3b8; display: block; margin-bottom: 10px;">Games Per Week</label>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    ${(constants.GAMES_PER_WEEK || [
                        {value: 'all', label: 'All Games'},
                        {value: 5, label: '5 Games'},
                        {value: 10, label: '10 Games'},
                        {value: '7-10', label: '7-10 Games'},
                        {value: 3, label: '3 Games'}
                    ]).map(games => `
                        <button data-games="${games.value}" 
                                style="padding: 10px; background: ${games.value === 'all' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)'}; 
                                       border: 1px solid ${games.value === 'all' ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'}; 
                                       border-radius: 8px; color: ${games.value === 'all' ? '#6366f1' : '#94a3b8'}; cursor: pointer;">
                            ${games.label}
                        </button>
                    `).join('')}
                </div>
                <div id="customGamesInput" style="display: none; margin-top: 10px;">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="number" id="customGamesMin" placeholder="Min" min="1" max="16"
                               style="flex: 1; padding: 8px; background: rgba(0, 0, 0, 0.3); 
                                      border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                        <span style="color: #94a3b8;">to</span>
                        <input type="number" id="customGamesMax" placeholder="Max" min="1" max="16"
                               style="flex: 1; padding: 8px; background: rgba(0, 0, 0, 0.3); 
                                      border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                    </div>
                </div>
            </div>
            
            <!-- Scoring System -->
            <div style="margin-bottom: 20px;">
                <label style="color: #94a3b8; display: block; margin-bottom: 10px;">Scoring System</label>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    <button data-scoring="standard" 
                            style="padding: 10px; background: rgba(99, 102, 241, 0.2); 
                                   border: 1px solid #6366f1; border-radius: 8px; color: #6366f1; cursor: pointer;">
                        📊 Standard
                    </button>
                    <button data-scoring="confidence" 
                            style="padding: 10px; background: rgba(255, 255, 255, 0.05); 
                                   border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #94a3b8; cursor: pointer;">
                        🎯 Confidence
                    </button>
                    <button data-scoring="weighted" 
                            style="padding: 10px; background: rgba(255, 255, 255, 0.05); 
                                   border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #94a3b8; cursor: pointer;">
                        ⚖️ Weighted
                    </button>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button data-modal-action="create-league" 
                        style="flex: 1; padding: 12px; background: linear-gradient(135deg, #00ff88, #00cc6a); 
                               color: #000; border: none; border-radius: 12px; cursor: pointer; font-weight: 600;">
                    Create League
                </button>
                <button data-modal-action="close-modal" 
                        style="flex: 1; padding: 12px; background: rgba(255, 255, 255, 0.05); 
                               border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: #94a3b8; cursor: pointer;">
                    Cancel
                </button>
            </div>
        `;
    }
    
    getSportIcon(sport) {
        const icons = {
            'NFL': '🏈',
            'NCAAF': '🎓',
            'NBA': '🏀',
            'MLB': '⚾',
            'NHL': '🏒'
        };
        return icons[sport] || '🏆';
    }
}