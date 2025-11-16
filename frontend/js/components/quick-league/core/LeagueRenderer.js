// quick-league/core/LeagueRenderer.js
import { LeagueCards } from '../ui/LeagueCards.js';
import { LeagueModals } from '../ui/LeagueModals.js';
import { GamePickers } from '../ui/GamePickers.js';
import { ChatComponent } from '../ui/ChatComponent.js';
import { LiveScoresWidget } from '../ui/LiveScoresWidget.js';

export class LeagueRenderer {
    constructor(parent) {
        this.parent = parent;
        this.cards = new LeagueCards(parent);
        this.modals = new LeagueModals(parent);
        this.pickers = new GamePickers(parent);
        this.chat = new ChatComponent(parent);
        this.liveScores = new LiveScoresWidget(parent);
    }
    
    render() {
        const html = `
            <div class="quick-league-container" style="padding: 20px;">
                ${this.renderHeader()}
                ${this.renderContent()}
            </div>
        `;
        
        const clean = DOMPurify ? DOMPurify.sanitize(html, {
            ALLOWED_ATTR: ['style', 'class', 'id', 'type', 'value', 'placeholder', 'title', 'name', 
                          'disabled', 'readonly', 'checked', 'min', 'max', 'data-*', 'onclick']
        }) : html;
        
        setTimeout(() => this.parent.attachAllEventListeners(), 0);
        
        return clean;
    }
    
    renderHeader() {
        const league = this.parent.activeLeague;
        const isLeagueView = this.parent.currentView === 'league';
        
        return `
            <div class="ql-header" style="background: linear-gradient(135deg, #1a1a2e, #2a2a3e); border-radius: 20px; padding: 25px; margin-bottom: 25px; border: 2px solid rgba(99, 102, 241, 0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h2 style="font-size: 2rem; font-weight: 900; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">
                        ⚡ ${league ? league.name : 'Quick Leagues'}
                    </h2>
                    <div style="display: flex; gap: 10px;">
                        ${!isLeagueView ? `
                            <button data-action="create-modal" 
                                    style="padding: 10px 20px; background: linear-gradient(135deg, #00ff88, #00cc6a); color: #000; border: none; border-radius: 12px; cursor: pointer; font-weight: 600;">
                                <i class="fas fa-plus"></i> Create League
                            </button>
                        ` : ''}
                        ${this.parent.userLeagues.length > 0 || this.parent.availableLeagues.length > 0 ? `
                            <button data-action="clear-all-leagues" 
                                    style="padding: 10px 20px; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; border-radius: 12px; cursor: pointer; font-weight: 600;">
                                🗑️ Clear All
                            </button>
                        ` : ''}
                    </div>
                </div>
                <p style="color: #94a3b8; margin: 0;">${league ? this.getLeagueDescription(league) : 'Join or create instant pick\'em leagues with friends'}</p>
                
                ${!isLeagueView ? this.renderNavigationTabs() : ''}
            </div>
        `;
    }
    
    renderNavigationTabs() {
        const views = [
            { id: 'browse', label: '🌐 Browse Leagues' },
            { id: 'my-leagues', label: '🏆 My Leagues' },
            { id: 'live-scores', label: '📊 Live Scores' }
        ];
        
        return `
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                ${views.map(view => `
                    <button data-view="${view.id}" 
                            class="ql-tab ${this.parent.currentView === view.id ? 'active' : ''}"
                            style="padding: 8px 16px; background: ${this.parent.currentView === view.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent'}; 
                                   border: 1px solid ${this.parent.currentView === view.id ? '#6366f1' : 'transparent'}; 
                                   border-radius: 8px; color: ${this.parent.currentView === view.id ? '#6366f1' : '#94a3b8'}; 
                                   cursor: pointer; transition: all 0.2s;">
                        ${view.label}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    renderContent() {
        switch(this.parent.currentView) {
            case 'browse':
                return this.renderBrowseLeagues();
            case 'my-leagues':
                return this.renderMyLeagues();
            case 'live-scores':
                return this.liveScores.render();
            case 'league':
                return this.renderLeagueView();
            default:
                return this.renderBrowseLeagues();
        }
    }
    
    renderBrowseLeagues() {
        const leagues = [...this.parent.availableLeagues];
        
        return `
            <div class="browse-leagues">
                <div style="background: rgba(26, 26, 46, 0.95); border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: #00ff88; margin: 0;">🔥 Hot Leagues (${leagues.length} available)</h3>
                        <button data-action="refresh-leagues" 
                                style="padding: 8px 16px; background: rgba(99, 102, 241, 0.2); 
                                       border: 1px solid #6366f1; color: #6366f1; 
                                       border-radius: 8px; cursor: pointer; font-size: 0.85rem;">
                            🔄 Refresh
                        </button>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                        ${leagues.length > 0 ? 
                            leagues.map(league => this.cards.renderLeagueCard(league, league.isUserMember ? 'view' : 'join')).join('') :
                            '<div style="color: #94a3b8; text-align: center; padding: 20px;">No public leagues available. Create your own!</div>'
                        }
                    </div>
                </div>
                
                <div style="background: rgba(26, 26, 46, 0.95); border-radius: 15px; padding: 20px;">
                    <h3 style="color: #00ff88; margin-bottom: 15px;">🔐 Join Private League</h3>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="leagueCode" placeholder="Enter league code..." 
                               style="flex: 1; padding: 12px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                        <button data-action="join-private" 
                                style="padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            Join League
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderMyLeagues() {
        const leagues = this.parent.userLeagues;
        
        return `
            <div class="my-leagues">
                ${leagues.length > 0 ? `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                        ${leagues.map(league => this.cards.renderLeagueCard(league)).join('')}
                    </div>
                ` : `
                    <div style="background: rgba(26, 26, 46, 0.95); border-radius: 15px; padding: 40px; text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 20px;">🏈</div>
                        <h3 style="color: white; margin-bottom: 10px;">No Leagues Yet</h3>
                        <p style="color: #94a3b8; margin-bottom: 20px;">Join a public league or create your own!</p>
                        <button data-action="create-modal" 
                                style="padding: 12px 24px; background: linear-gradient(135deg, #00ff88, #00cc6a); color: #000; border: none; border-radius: 12px; cursor: pointer; font-weight: 600;">
                            Create Your First League
                        </button>
                    </div>
                `}
            </div>
        `;
    }
    
    renderLeagueView() {
        const league = this.parent.activeLeague;
        if (!league) return '';
        
        return `
            <div class="league-view">
                ${this.renderLeagueHeader()}
                ${this.renderLeagueTabs()}
                <div id="leagueContent">
                    ${this.renderLeagueTabContent()}
                </div>
            </div>
        `;
    }
    
    renderLeagueHeader() {
        const league = this.parent.activeLeague;
        
        return `
            <div style="background: rgba(26, 26, 46, 0.95); border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                <button data-action="back-to-list" 
                        style="padding: 8px 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #94a3b8; cursor: pointer; margin-bottom: 15px;">
                    ← Back to Leagues
                </button>
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="color: white; margin: 0 0 10px 0;">${league.name}</h2>
                        <div style="display: flex; gap: 20px; color: #94a3b8; flex-wrap: wrap;">
                            <span>${this.parent.formatWeekDisplay(this.parent.selectedWeek)}</span>
                            <span>${league.members} Members</span>
                            <span>${this.formatGamesPerWeek(league.gamesPerWeek)}</span>
                            <span>Prize Pool: $${league.pot || 0}</span>
                        </div>
                    </div>
                    <button data-action="copy-code" data-code="${league.code}" 
                            style="padding: 10px 20px; background: rgba(0, 255, 136, 0.2); border: 1px solid #00ff88; border-radius: 8px; color: #00ff88; cursor: pointer;">
                        📋 ${league.code}
                    </button>
                </div>
                
                ${this.renderWeekNavigation()}
            </div>
        `;
    }
    
    renderWeekNavigation() {
        const league = this.parent.activeLeague;
        
        // Handle both preseason and regular season weeks for NFL
        if (league?.sport === 'NFL' || !league?.sport) {
            // Keep current week as is (can be PS-X or regular week number)
            const currentWeek = league?.currentWeek || this.parent.selectedWeek;
            if (currentWeek && currentWeek !== this.parent.selectedWeek) {
                this.parent.selectedWeek = currentWeek;
            }
        }
        
        if (league?.sport === 'MLB') {
            const date = this.parent.selectedDate || new Date();
            return `
                <div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                    <button data-date-change="-1" style="padding: 6px 12px; background: rgba(255, 255, 255, 0.05); border: none; color: white; cursor: pointer; border-radius: 6px;">◀</button>
                    <div style="color: white; font-weight: 600; min-width: 200px; text-align: center;">
                        ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                    <button data-date-change="1" style="padding: 6px 12px; background: rgba(255, 255, 255, 0.05); border: none; color: white; cursor: pointer; border-radius: 6px;">▶</button>
                </div>
            `;
        }
        
        return `
            <div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <button data-week-change="-1" 
                        style="padding: 6px 12px; background: rgba(255, 255, 255, 0.05); border: none; color: white; cursor: pointer; border-radius: 6px;"
                        ${this.parent.selectedWeek <= 1 ? 'disabled style="opacity: 0.5;"' : ''}>◀</button>
                <select id="weekSelector" onchange="window.quickLeague.setWeek(this.value)"
                        style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); 
                               color: white; padding: 6px 12px; border-radius: 6px; min-width: 150px;">
                    ${Array.from({length: 18}, (_, i) => {
                        const weekNum = i + 1;
                        const isCurrent = weekNum === 1; // Week 1 is current
                        return `
                            <option value="${weekNum}" ${this.parent.selectedWeek == weekNum ? 'selected' : ''}>
                                Week ${weekNum}${isCurrent ? ' (Current)' : ''}
                            </option>
                        `;
                    }).join('')}
                </select>
                <button data-week-change="1" 
                        style="padding: 6px 12px; background: rgba(255, 255, 255, 0.05); border: none; color: white; cursor: pointer; border-radius: 6px;"
                        ${this.parent.selectedWeek >= 18 ? 'disabled style="opacity: 0.5;"' : ''}>▶</button>
            </div>
        `;
    }
    
    renderLeagueTabs() {
        const league = this.parent.activeLeague;
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isCommissioner = league?.owner === 'current-user' || 
                              league?.owner === currentUser._id ||
                              league?.owner === currentUser.id ||
                              league?.owner?._id === currentUser._id ||
                              league?.owner?.toString() === currentUser._id ||
                              league?.createdBy === currentUser._id ||
                              league?.createdBy === currentUser.id ||
                              league?.creator === currentUser._id ||
                              league?.creator === currentUser.id;
        
        const tabs = ['picks', 'results', 'standings', 'league-picks', 'chat'];
        if (isCommissioner) {
            tabs.push('settings');
        }
        
        return `
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                ${tabs.map(tab => `
                    <button data-tab="${tab}" 
                            style="padding: 10px 20px; background: ${this.parent.activeTab === tab ? 'rgba(99, 102, 241, 0.2)' : 'transparent'}; 
                                   border: 1px solid ${this.parent.activeTab === tab ? '#6366f1' : 'transparent'}; 
                                   border-radius: 8px; color: ${this.parent.activeTab === tab ? '#6366f1' : '#94a3b8'}; cursor: pointer;">
                        ${tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    renderLeagueTabContent() {
        switch(this.parent.activeTab) {
            case 'picks':
                return this.pickers.renderPicksSection();
            case 'results':
                return this.renderResultsSection();
            case 'standings':
                return this.renderStandingsSection();
            case 'league-picks':
                return this.renderLeaguePicksSection();
            case 'chat':
                return this.chat.render();
            case 'settings':
                return this.renderCommissionerSettings();
            default:
                return this.pickers.renderPicksSection();
        }
    }
    
    renderResultsSection() {
    setTimeout(() => {
        this.loadUserResults();
    }, 100);
    
    return `
        <div class="results-section" style="background: rgba(26, 26, 46, 0.95); border-radius: 15px; padding: 20px;">
            <h3 style="color: #00ff88; margin-bottom: 20px;">Week ${this.parent.selectedWeek} Results</h3>
            <div id="weekResults">
                <div style="text-align: center; color: #94a3b8; padding: 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Loading your picks...</p>
                </div>
            </div>
        </div>
    `;
}

async loadUserResults() {
    const container = document.getElementById('weekResults');
    if (!container) return;
    
    try {
        const games = await this.parent.gamesLoader.loadLeagueGames();
        const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
        const weekOrDate = this.parent.selectedWeek;
        const picksKey = `league_picks_${leagueId}_${weekOrDate}`;
        const savedData = JSON.parse(localStorage.getItem(picksKey) || '{}');
        
        // Check if user has any picks (including partial)
        if (!savedData || (!savedData.status && Object.keys(savedData).length === 0)) {
            container.innerHTML = `
                <div style="text-align: center; color: #94a3b8; padding: 40px;">
                    <i class="fas fa-clipboard-list" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h4 style="margin-bottom: 10px;">No Picks Submitted</h4>
                    <p>Make your picks in the Picks tab first!</p>
                </div>
            `;
            return;
        }
        
        // Show warning if partial submission
        const isPartial = savedData.status === 'partial' || savedData.isPartial;
        const picksCount = savedData.picks ? savedData.picks.length : Object.keys(savedData).filter(k => 
            k !== 'status' && k !== 'submittedAt' && k !== 'weekOrDate' && k !== 'leagueId' && k !== 'isPartial'
        ).length;
        
        // Get picks array from saved data
        let userPicks = [];
        if ((savedData.status === 'submitted' || savedData.status === 'partial') && savedData.picks) {
            userPicks = savedData.picks;
        } else {
            // Convert old format to array
            Object.entries(savedData).forEach(([gameId, pickData]) => {
                if (gameId !== 'status' && gameId !== 'submittedAt' && gameId !== 'weekOrDate' && gameId !== 'leagueId' && gameId !== 'isPartial') {
                    userPicks.push({ gameId, ...pickData });
                }
            });
        }
        
        // Add warning banner if partial
        let warningBanner = '';
        if (isPartial) {
            const league = this.parent.activeLeague;
            let minRequired = 1;
            if (typeof league.gamesPerWeek === 'string' && league.gamesPerWeek.includes('-')) {
                const [min] = league.gamesPerWeek.split('-').map(n => parseInt(n));
                minRequired = min;
            } else if (league.gamesPerWeek && league.gamesPerWeek !== 'all') {
                minRequired = league.gamesPerWeek;
            }
            
            const remaining = minRequired - picksCount;
            warningBanner = `
                <div style="background: rgba(255, 193, 7, 0.2); border: 1px solid #ffc107; 
                            border-radius: 8px; padding: 12px; margin-bottom: 20px; color: #ffc107;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.2rem;">⚠️</span>
                        <div>
                            <strong>Partial Submission:</strong> You have ${picksCount} pick${picksCount !== 1 ? 's' : ''} saved.
                            ${remaining > 0 ? `Need ${remaining} more pick${remaining !== 1 ? 's' : ''} to meet the minimum requirement.` : ''}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Only show games that user has picked
        const resultsHTML = userPicks.map(pickData => {
            const game = games.find(g => (g.gameId || g.id) === pickData.gameId);
            if (!game) return '';
            
            // Use locked line if available, otherwise use current line
            const currentSpread = parseFloat(game.spread || 0);
            const lockedSpread = pickData.lockedLine?.spread ? parseFloat(pickData.lockedLine.spread) : null;
            const spread = lockedSpread !== null ? lockedSpread : currentSpread;
            const total = pickData.lockedLine?.total || game.total;
            
            let pickText = 'Unknown';
            let lineChangedIndicator = '';
            
            if (pickData.pickType === 'spread') {
                const team = pickData.pick === 'home' ? game.homeTeam : game.awayTeam;
                let spreadValue;
                if (pickData.lockedLine?.spread) {
                    // Use the locked spread
                    spreadValue = pickData.lockedLine.spread;
                    // Check if line has moved
                    if (Math.abs(parseFloat(pickData.lockedLine.spread)) !== Math.abs(currentSpread)) {
                        lineChangedIndicator = `<span style="color: #ffc107; font-size: 0.75rem; margin-left: 8px;">📌 Locked (was ${spreadValue})</span>`;
                    }
                } else {
                    // Fall back to calculation
                    spreadValue = pickData.pick === 'home' 
                        ? (spread < 0 ? spread : `+${Math.abs(spread)}`)
                        : (spread < 0 ? `+${Math.abs(spread)}` : -Math.abs(spread));
                }
                pickText = `${team} ${spreadValue}`;
            } else if (pickData.pickType === 'moneyline') {
                const team = pickData.pick === 'home' ? game.homeTeam : game.awayTeam;
                const ml = pickData.lockedLine?.moneyline || '';
                pickText = ml ? `${team} ${ml}` : team;
            } else if (pickData.pickType === 'overunder') {
                pickText = `${pickData.pick.toUpperCase()} ${total}`;
                if (pickData.lockedLine?.total && pickData.lockedLine.total !== game.total) {
                    lineChangedIndicator = `<span style="color: #ffc107; font-size: 0.75rem; margin-left: 8px;">📌 Locked at ${total}</span>`;
                }
            }
            
            const canEdit = this.parent.picksManager.canEditPick(game.gameTime);
            const isComplete = game.status === 'post' || game.isFinal || game.status === 'final';
            let resultText = 'Pending';
            let resultColor = '#ffd700';
            let resultIcon = '⏳';
            let pickResult = '';
            
            if (isComplete) {
                const homeScore = parseInt(game.homeScore) || 0;
                const awayScore = parseInt(game.awayScore) || 0;
                resultText = `${game.awayTeam} ${awayScore} - ${homeScore} ${game.homeTeam}`;
                
                // Determine win/loss
                let won = false;
                
                if (pickData.pickType === 'spread') {
                    const actualDiff = homeScore - awayScore;
                    // Always use locked line if available for consistency
                    const spreadValue = pickData.lockedLine?.spread !== undefined ? 
                        parseFloat(pickData.lockedLine.spread) : parseFloat(spread);
                    
                    if (pickData.pick === 'home') {
                        // Home team covers if they win by more than spread (when favored)
                        // or lose by less than spread (when underdog)
                        won = actualDiff + spreadValue > 0;
                    } else {
                        // Away team covers
                        won = -actualDiff + Math.abs(spreadValue) > 0;
                    }
                } else if (pickData.pickType === 'moneyline') {
                    const homeWon = homeScore > awayScore;
                    const awayWon = awayScore > homeScore;
                    won = (pickData.pick === 'home' && homeWon) || (pickData.pick === 'away' && awayWon);
                } else if (pickData.pickType === 'overunder') {
                    const totalScore = homeScore + awayScore;
                    const totalLine = parseFloat(pickData.lockedLine?.total || game.total);
                    won = (pickData.pick === 'over' && totalScore > totalLine) || 
                          (pickData.pick === 'under' && totalScore < totalLine);
                }
                
                pickResult = won ? '✅ WIN' : '❌ LOSS';
                resultColor = won ? '#00ff88' : '#ff4444';
                resultIcon = won ? '✅' : '❌';
            }
            
            return `
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); 
                            border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div style="color: white; font-weight: 600;">${game.awayTeam} @ ${game.homeTeam}</div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="color: #94a3b8; font-size: 0.85rem;">
                                ${isComplete ? 'FINAL:' : ''} ${resultText}
                            </div>
                            ${isComplete ? `<div style="color: ${resultColor}; font-weight: bold; font-size: 1rem;">${pickResult}</div>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="color: #94a3b8;">
                            🎯 Your pick: <span style="color: white; font-weight: 600;">${pickText}</span>${lineChangedIndicator}
                        </div>
                        ${canEdit && !isComplete ? `
                            <button onclick="window.quickLeague.editPick('${pickData.gameId}')" 
                                    style="padding: 6px 12px; background: rgba(99, 102, 241, 0.2); 
                                           border: 1px solid #6366f1; border-radius: 6px; 
                                           color: #6366f1; cursor: pointer; font-size: 0.85rem;">
                                Edit Pick
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).filter(html => html !== '').join('');
        
        if (resultsHTML) {
            container.innerHTML = warningBanner + resultsHTML;
        } else if (userPicks.length > 0) {
            // If we have picks but no HTML was generated (shouldn't happen)
            container.innerHTML = warningBanner + '<div style="text-align: center; color: #94a3b8; padding: 20px;">Error displaying picks</div>';
        } else {
            container.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px;">No picks found for this week</div>';
        }
        
    } catch (error) {
        console.error('Error loading results:', error);
        container.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px;">Error loading results</div>';
    }
}
    
    renderStandingsSection() {
        // Initialize standings for all members if empty
        const league = this.parent.activeLeague;
        if (league && league.membersList && league.standings.length === 0) {
            // Create standings entries for all members
            league.membersList.forEach(member => {
                if (!league.standings.find(s => s.userId?._id === member._id)) {
                    league.standings.push({
                        userId: member,
                        username: member.username || member.displayName,
                        wins: 0,
                        losses: 0,
                        pushes: 0,
                        points: 0,
                        weeklyRecords: []
                    });
                }
            });
        }
        
        if (this.parent.activeLeague?.standings && this.parent.standingsManager.standings.length === 0) {
            this.parent.standingsManager.standings = this.parent.activeLeague.standings;
        }
        
        const standings = this.parent.standingsManager.standings;
        const prizes = this.parent.standingsManager.calculatePrizeDistribution(this.parent.activeLeague?.pot);
        
        this.parent.standingsManager.loadStandings().then(() => {
            const container = document.querySelector('.standings-section tbody');
            if (container) {
                // If no standings loaded, show all members with 0-0 records
                if (this.parent.standingsManager.standings.length === 0 && league?.membersList) {
                    const defaultStandings = league.membersList.map(member => ({
                        userId: member,
                        username: member.username || member.displayName || 'Unknown',
                        wins: 0,
                        losses: 0,
                        pushes: 0,
                        points: 0
                    }));
                    container.innerHTML = this.renderStandingsRows(defaultStandings);
                } else {
                    container.innerHTML = this.renderStandingsRows(this.parent.standingsManager.standings);
                }
            }
        });
        
        return `
            <div class="standings-section" style="background: rgba(26, 26, 46, 0.95); border-radius: 15px; padding: 20px;">
                <h3 style="color: #00ff88; margin-bottom: 20px;">League Standings</h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
                                <th style="text-align: left; padding: 10px; color: #94a3b8;">Rank</th>
                                <th style="text-align: left; padding: 10px; color: #94a3b8;">Player</th>
                                <th style="text-align: center; padding: 10px; color: #94a3b8;">W-L</th>
                                <th style="text-align: center; padding: 10px; color: #94a3b8;">Win %</th>
                                <th style="text-align: center; padding: 10px; color: #94a3b8;">Streak</th>
                                <th style="text-align: right; padding: 10px; color: #94a3b8;">Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderStandingsRows(standings)}
                        </tbody>
                    </table>
                </div>
                ${prizes ? this.renderPrizeDistribution(prizes) : ''}
            </div>
        `;
    }
    
    renderLeaguePicksSection() {
        setTimeout(() => {
            this.loadLeaguePicks();
        }, 100);
        
        return `
            <div class="league-picks-section" style="background: rgba(26, 26, 46, 0.95); border-radius: 15px; padding: 20px;">
                <div id="leaguePicksContent">
                    <div style="text-align: center; color: #94a3b8; padding: 20px;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>Loading league picks...</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderCommissionerSettings() {
        const league = this.parent.activeLeague;
        
        return `
            <div class="commissioner-settings" style="background: rgba(26, 26, 46, 0.95); border-radius: 15px; padding: 20px;">
                <h3 style="color: #00ff88; margin-bottom: 20px;">⚙️ Commissioner Settings</h3>
                
                <!-- Quick Pick Management -->
                <div style="background: rgba(99, 102, 241, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="color: #8b5cf6; margin-bottom: 15px;">🎯 Quick Pick Management - Week ${this.parent.selectedWeek}</h4>
                    
                    <!-- User List with Quick Actions -->
                    <div style="display: grid; gap: 8px; max-height: 300px; overflow-y: auto;">
                        ${league.membersList?.map(member => `
                            <div style="display: flex; justify-content: space-between; align-items: center; 
                                        padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px;">
                                <span style="color: white; font-weight: 500;">
                                    ${member.username || member.displayName}
                                </span>
                                <div style="display: flex; gap: 8px;">
                                    <button onclick="window.quickLeague.quickViewPicks('${member._id}', '${member.username || member.displayName}')" 
                                            style="padding: 6px 12px; background: rgba(99, 102, 241, 0.2); 
                                                   border: 1px solid #6366f1; border-radius: 6px; 
                                                   color: #6366f1; cursor: pointer; font-size: 0.85rem;">
                                        View Picks
                                    </button>
                                    <button onclick="window.quickLeague.quickEditPicks('${member._id}', '${member.username || member.displayName}')" 
                                            style="padding: 6px 12px; background: linear-gradient(135deg, #00ff88, #00cc6a); 
                                                   color: #000; border: none; border-radius: 6px; 
                                                   cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                                        Make/Edit Picks
                                    </button>
                                </div>
                            </div>
                        `).join('') || '<p style="color: #94a3b8;">No members yet</p>'}
                    </div>
                </div>
                
                <!-- Current Picks Display -->
                <div id="adminPicksDisplay" style="display: none; background: rgba(0, 255, 136, 0.1); 
                                                    padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                </div>
                
                <!-- Manage Member Picks -->
                <div style="background: rgba(99, 102, 241, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="color: #8b5cf6; margin-bottom: 15px;">🎯 Manage Member Picks</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                        <select id="memberSelector" onchange="window.quickLeague.loadMemberPicks(this.value)"
                                style="padding: 10px; background: rgba(0, 0, 0, 0.3); 
                                       border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                            <option value="">Select Member...</option>
                            ${league.membersList?.map(member => `
                                <option value="${member._id}">${member.username || member.displayName}</option>
                            `).join('') || ''}
                        </select>
                        <button onclick="window.quickLeague.editMemberPicks()" 
                                id="editPicksBtn"
                                style="padding: 10px; background: linear-gradient(135deg, #00ff88, #00cc6a); 
                                       color: #000; border: none; border-radius: 8px; cursor: pointer; 
                                       font-weight: 600; opacity: 0.5;" disabled>
                            Edit Selected Member's Picks
                        </button>
                    </div>
                    <div id="memberPicksDisplay" style="max-height: 400px; overflow-y: auto;"></div>
                </div>
                
                <!-- Adjust Game Lines -->
                <div style="background: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="color: #ffd700; margin-bottom: 15px;">📊 Adjust Game Lines - Week ${this.parent.selectedWeek}</h4>
                    <button onclick="window.quickLeague.loadGamesForLineEdit()" 
                            style="padding: 10px 20px; background: #ffd700; color: #000; 
                                   border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Load Games for Editing
                    </button>
                    <div id="lineEditor" style="margin-top: 15px; max-height: 400px; overflow-y: auto;"></div>
                </div>
                
                <!-- League Info -->
                <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="color: #6366f1; margin-bottom: 15px;">League Information</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        <div>
                            <label style="color: #94a3b8; display: block; margin-bottom: 5px; font-size: 0.85rem;">League Name</label>
                            <input type="text" id="settingsLeagueName" value="${league.name}" 
                                   style="width: 100%; padding: 8px; background: rgba(0, 0, 0, 0.3); 
                                          border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                        </div>
                        <div>
                            <label style="color: #94a3b8; display: block; margin-bottom: 5px; font-size: 0.85rem;">League Code</label>
                            <input type="text" value="${league.code}" readonly
                                   style="width: 100%; padding: 8px; background: rgba(0, 0, 0, 0.3); 
                                          border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #94a3b8;">
                        </div>
                    </div>
                </div>
                
                <!-- Manual Record Updates -->
                <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="color: #6366f1; margin-bottom: 15px;">📊 Update Member Records</h4>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${league.standings?.map(standing => `
                            <div style="display: flex; align-items: center; gap: 10px; padding: 10px; 
                                        background: rgba(0, 0, 0, 0.3); border-radius: 8px; margin-bottom: 10px;">
                                <span style="color: white; flex: 1;">${standing.userId?.username || 'Member'}</span>
                                <input type="number" id="wins-${standing.userId?._id}" value="${standing.wins}" 
                                       placeholder="W" min="0"
                                       style="width: 60px; padding: 5px; background: rgba(0, 0, 0, 0.3); 
                                              border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 5px; color: white;">
                                <span style="color: #94a3b8;">-</span>
                                <input type="number" id="losses-${standing.userId?._id}" value="${standing.losses}" 
                                       placeholder="L" min="0"
                                       style="width: 60px; padding: 5px; background: rgba(0, 0, 0, 0.3); 
                                              border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 5px; color: white;">
                                <button onclick="window.quickLeague.updateMemberRecord('${standing.userId?._id}')"
                                        style="padding: 5px 10px; background: rgba(99, 102, 241, 0.2); 
                                               border: 1px solid #6366f1; border-radius: 5px; color: #6366f1; cursor: pointer;">
                                    Update
                                </button>
                            </div>
                        `).join('') || '<p style="color: #94a3b8;">No members yet</p>'}
                    </div>
                </div>
                
                <!-- Save Button -->
                <div style="display: flex; gap: 10px;">
                    <button onclick="window.quickLeague.saveLeagueSettings()" 
                            style="flex: 1; padding: 12px; background: linear-gradient(135deg, #00ff88, #00cc6a); 
                                   color: #000; border: none; border-radius: 12px; cursor: pointer; font-weight: 600;">
                        💾 Save All Settings
                    </button>
                </div>
            </div>
        `;
    }
    
    async loadLeaguePicks() {
    const container = document.getElementById('leaguePicksContent');
    if (!container) return;
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            container.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px;">Please login to view picks</div>';
            return;
        }
        
        // Fetch all picks for this week
        const response = await fetch(`/api/leagues/${this.parent.activeLeague.id}/all-picks/${this.parent.selectedWeek}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            container.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px;">Unable to load picks</div>';
            return;
        }
        
        const data = await response.json();
        const allPicks = data.picks || [];
        const games = await this.parent.gamesLoader.loadLeagueGames();
        
        // Check if any games are locked
        const now = new Date();
        const hasLockedGames = games.some(game => {
            const gameTime = new Date(game.gameTime || game.startTime);
            const lockTime = new Date(gameTime.getTime() - 2 * 60 * 1000);
            return now >= lockTime;
        });
        
        const allGamesLocked = games.every(game => {
            const gameTime = new Date(game.gameTime || game.startTime);
            const lockTime = new Date(gameTime.getTime() - 2 * 60 * 1000);
            return now >= lockTime;
        });
        
        // Count how many picks each user has submitted
        const picksCountByUser = {};
        allPicks.forEach(userPick => {
            const userId = userPick.userId;
            const pickCount = userPick.picks ? userPick.picks.length : 0;
            picksCountByUser[userId] = pickCount;
        });
        
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #00ff88; margin: 0;">Week ${this.parent.selectedWeek} League Picks</h3>
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${!allGamesLocked ? `
                        <div style="padding: 5px 10px; background: rgba(255, 193, 7, 0.2); border-radius: 6px; color: #ffc107; font-size: 0.85rem;">
                            🔒 Picks reveal as games lock
                        </div>
                    ` : `
                        <div style="padding: 5px 10px; background: rgba(76, 175, 80, 0.2); border-radius: 6px; color: #4caf50; font-size: 0.85rem;">
                            ✅ All Picks Revealed
                        </div>
                    `}
                    <div style="padding: 5px 10px; background: rgba(99, 102, 241, 0.2); border-radius: 6px; color: #6366f1; font-size: 0.85rem;">
                        ${allPicks.length} / ${this.parent.activeLeague.members} submitted
                    </div>
                </div>
            </div>
            
            ${!hasLockedGames ? this.renderPreLockView(allPicks) : this.renderPostLockView(allPicks, games)}
        `;
        
    } catch (error) {
        console.error('Error loading league picks:', error);
        container.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px;">Error loading picks</div>';
    }
}
    
    getWeekLockTime(games) {
        if (!games || games.length === 0) {
            // Default to Sunday 11:58 AM CT if no games (2 min before noon)
            const sunday = new Date();
            sunday.setDate(sunday.getDate() + (7 - sunday.getDay()));
            sunday.setHours(11, 58, 0, 0);
            return sunday;
        }
        
        // Find the earliest game time
        let earliestGame = new Date(games[0].gameTime || games[0].startTime);
        games.forEach(game => {
            const gameTime = new Date(game.gameTime || game.startTime);
            if (gameTime < earliestGame) {
                earliestGame = gameTime;
            }
        });
        
        // Lock 2 minutes before first game
        return new Date(earliestGame.getTime() - (2 * 60 * 1000));
    }
    
    getTimeUntilLock(lockTime) {
        const now = new Date();
        const diff = lockTime - now;
        
        if (diff <= 0) return 'Locked';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
    
    renderPreLockView(picks) {
        // Before lock: show who has submitted and how many picks
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Build a map of userId to pick count
        const pickCountMap = {};
        picks.forEach(userPick => {
            const count = userPick.picks ? userPick.picks.length : 0;
            pickCountMap[userPick.userId] = count;
        });
        
        return `
            <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px;">
                <h4 style="color: #94a3b8; margin-bottom: 15px; font-size: 0.9rem;">SUBMISSION STATUS</h4>
                <div style="display: grid; gap: 10px;">
                    ${this.parent.activeLeague.membersList ? this.parent.activeLeague.membersList.map(member => {
                        // Check both submitted picks and local partial picks
                        const userPick = picks.find(p => p.userId === member._id || p.userId === member.username);
                        const hasPicks = !!userPick;
                        const pickCount = pickCountMap[member._id] || 0;
                        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                        const isCurrentUser = member._id === currentUser._id || member.username === currentUser.username;
                        
                        // Check for partial local picks if current user
                        let hasPartialPicks = false;
                        if (isCurrentUser && !hasPicks) {
                            const picksKey = `league_picks_${this.parent.activeLeague.id || this.parent.activeLeague._id}_${this.parent.selectedWeek}`;
                            const localPicks = JSON.parse(localStorage.getItem(picksKey) || '{}');
                            hasPartialPicks = localPicks.picks && localPicks.picks.length > 0;
                        }
                        
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; 
                                        padding: 12px; background: rgba(0, 0, 0, 0.3); border-radius: 8px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 8px; height: 8px; border-radius: 50%; 
                                                background: ${hasPicks ? '#00ff88' : '#ff4444'};"></div>
                                    <span style="color: white; font-weight: ${isCurrentUser ? '600' : '400'};">
                                        ${member.username || member.displayName}
                                        ${isCurrentUser ? ' (You)' : ''}
                                    </span>
                                </div>
                                <span style="color: ${hasPicks ? '#00ff88' : hasPartialPicks ? '#ffc107' : '#ff4444'}; font-size: 0.85rem;">
                                    ${hasPicks ? `✅ ${pickCount} pick${pickCount !== 1 ? 's' : ''} submitted` : hasPartialPicks ? '🟡 In Progress' : '⏳ No picks yet'}
                                </span>
                            </div>
                        `;
                    }).join('') : '<div style="color: #94a3b8;">Loading members...</div>'}
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: rgba(99, 102, 241, 0.1); border-radius: 8px; border: 1px solid rgba(99, 102, 241, 0.3);">
                    <p style="color: #94a3b8; margin: 0; font-size: 0.85rem;">
                        🔒 Each game locks 2 minutes before kickoff. You can submit picks for any unlocked games.
                    </p>
                    <p style="color: #ffc107; margin: 5px 0 0 0; font-size: 0.85rem;">
                        ⚠️ Thursday games lock Thursday, Sunday games lock at their kickoff times, Monday games lock Monday.
                    </p>
                </div>
            </div>
        `;
    }
    
    renderPostLockView(picks, games) {
        // Show picks for locked games, hide picks for unlocked games
        if (!picks || picks.length === 0) {
            return '<div style="text-align: center; color: #94a3b8; padding: 40px;">No picks submitted for this week</div>';
        }
        
        const now = new Date();
        
        return `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
                            <th style="text-align: left; padding: 10px; color: #94a3b8; position: sticky; left: 0; background: rgba(26, 26, 46, 0.95);">Player</th>
                            ${games.slice(0, 10).map(game => {
                                const gameTime = new Date(game.gameTime || game.startTime);
                                const lockTime = new Date(gameTime.getTime() - 2 * 60 * 1000);
                                const isLocked = now >= lockTime;
                                
                                return `
                                    <th style="text-align: center; padding: 10px; color: #94a3b8; font-size: 0.75rem; min-width: 80px;">
                                        ${game.awayTeam}<br>@<br>${game.homeTeam}
                                        ${!isLocked ? '<br><span style="color: #ffc107; font-size: 0.65rem;">🔒 Not locked</span>' : ''}
                                    </th>
                                `;
                            }).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${picks.map(userPicks => this.renderUserPickRow(userPicks, games)).join('')}
                    </tbody>
                </table>
            </div>
            
            ${games.length > 10 ? `
                <div style="margin-top: 10px; padding: 10px; background: rgba(255, 193, 7, 0.1); border-radius: 8px; text-align: center;">
                    <p style="color: #ffc107; margin: 0; font-size: 0.85rem;">
                        Showing first 10 games. Full picks available in Results tab.
                    </p>
                </div>
            ` : ''}
        `;
    }
    
    renderUserPickRow(userPicks, games) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isCurrentUser = userPicks.userId === currentUser._id || userPicks.username === currentUser.username;
        const now = new Date(); // Add this line to define 'now'
        
        return `
            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 12px 10px; color: white; font-weight: ${isCurrentUser ? '600' : '400'}; position: sticky; left: 0; background: rgba(26, 26, 46, 0.95);">
                    ${userPicks.username || userPicks.displayName || 'Unknown'}
                    ${isCurrentUser ? ' 👤' : ''}
                </td>
                ${games.slice(0, 10).map(game => {
                    const gameTime = new Date(game.gameTime || game.startTime);
                    const lockTime = new Date(gameTime.getTime() - 2 * 60 * 1000);
                    const isGameLocked = now >= lockTime;
                    
                    const pick = userPicks.picks?.find(p => p.gameId === (game.gameId || game.id));
                    
                    // If game is not locked yet, only show if pick was made
                    if (!isGameLocked) {
                        if (!pick) {
                            return '<td style="text-align: center; padding: 10px; color: #94a3b8;">-</td>';
                        } else {
                            // Show that a pick was made but hide what it is
                            return `
                                <td style="text-align: center; padding: 10px; background: rgba(255, 193, 7, 0.1); color: #ffc107; font-size: 0.8rem;">
                                    🔒 Hidden
                                </td>
                            `;
                        }
                    }
                    
                    // Game is locked, show the pick
                    if (!pick) return '<td style="text-align: center; padding: 10px; color: #94a3b8;">-</td>';
                    
                    let displayText = '';
                    let bgColor = 'rgba(99, 102, 241, 0.2)';
                    const pickType = pick.pickType || pick.betType || 'spread';
                    
                    if (pickType === 'spread') {
                        displayText = pick.pick === 'home' ? game.homeTeam : game.awayTeam;
                    } else if (pickType === 'moneyline' || pickType === 'ml') {
                        displayText = pick.pick === 'home' ? `${game.homeTeam} ML` : `${game.awayTeam} ML`;
                    } else if (pickType === 'overunder' || pickType === 'ou' || pickType === 'total') {
                        displayText = pick.pick.toUpperCase();
                    } else {
                        // Default to showing team name
                        displayText = pick.pick === 'home' ? game.homeTeam : game.awayTeam;
                    }
                    
                    // Check if game is complete and show win/loss
                    if (game.isFinal || game.status === 'post') {
                        const won = this.checkPickResult(pick, game);
                        bgColor = won ? 'rgba(0, 255, 136, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                        displayText = `${won ? '✅' : '❌'} ${displayText}`;
                    }
                    
                    return `
                        <td style="text-align: center; padding: 10px; background: ${bgColor}; color: white; font-size: 0.8rem;">
                            ${displayText}
                        </td>
                    `;
                }).join('')}
            </tr>
        `;
    }
    
    checkPickResult(pick, game) {
        const homeScore = parseInt(game.homeScore || 0);
        const awayScore = parseInt(game.awayScore || 0);
        const spread = parseFloat(game.spread || 0);
        
        if (pick.pickType === 'spread') {
            const actualDiff = homeScore - awayScore;
            const spreadCovered = actualDiff + spread > 0;
            return (pick.pick === 'home' && spreadCovered) || (pick.pick === 'away' && !spreadCovered);
        } else if (pick.pickType === 'moneyline') {
            return (pick.pick === 'home' && homeScore > awayScore) || (pick.pick === 'away' && awayScore > homeScore);
        } else if (pick.pickType === 'overunder') {
            const total = homeScore + awayScore;
            const line = parseFloat(game.total || 0);
            return (pick.pick === 'over' && total > line) || (pick.pick === 'under' && total < line);
        }
        
        return false;
    }
    
    renderStandingsRows(standings) {
        if (!standings || standings.length === 0) {
            return '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8;">No standings yet</td></tr>';
        }
        
        // Load any saved standings from localStorage and merge
        const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
        if (leagueId) {
            const standingsKey = `league_standings_${leagueId}`;
            const savedStandings = localStorage.getItem(standingsKey);
            if (savedStandings) {
                try {
                    const parsed = JSON.parse(savedStandings);
                    // Merge saved standings with current standings
                    standings = standings.map(standing => {
                        const saved = parsed.find(s => 
                            (s.userId === standing.userId) || 
                            (s.username === standing.username) ||
                            (s.userId?._id === standing.userId?._id)
                        );
                        if (saved) {
                            return { ...standing, ...saved };
                        }
                        return standing;
                    });
                } catch (e) {
                    console.error('Error merging standings:', e);
                }
            }
        }
        
        return standings.map((standing, index) => `
            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 12px 10px; color: ${index < 3 ? '#ffd700' : '#94a3b8'};">
                    ${index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                </td>
                <td style="padding: 12px 10px; color: white;">${standing.username || standing.userId?.username || standing.userId?.displayName || 'Player'}</td>
                <td style="padding: 12px 10px; text-align: center; color: white;">${standing.wins || 0}-${standing.losses || 0}</td>
                <td style="padding: 12px 10px; text-align: center; color: white;">
                    ${this.parent.standingsManager.formatRecord(standing.wins || 0, standing.losses || 0)}
                </td>
                <td style="padding: 12px 10px; text-align: center;">
                    <span style="color: ${standing.streakType === 'W' ? '#00ff88' : '#ff4444'};">
                        ${this.parent.standingsManager.formatStreak(standing.streak, standing.streakType)}
                    </span>
                </td>
                <td style="padding: 12px 10px; text-align: right; color: white; font-weight: 600;">${standing.points || 0}</td>
            </tr>
        `).join('');
    }
    
    renderPrizeDistribution(prizes) {
        return `
            <div style="margin-top: 20px; padding: 15px; background: rgba(255, 215, 0, 0.1); border-radius: 8px; border: 1px solid rgba(255, 215, 0, 0.3);">
                <h4 style="color: #ffd700; margin-bottom: 10px;">Prize Distribution</h4>
                <div style="display: grid; gap: 5px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #94a3b8;">🥇 1st Place (60%):</span>
                        <span style="color: white; font-weight: 600;">$${prizes.first}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #94a3b8;">🥈 2nd Place (30%):</span>
                        <span style="color: white; font-weight: 600;">$${prizes.second}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #94a3b8;">🥉 3rd Place (10%):</span>
                        <span style="color: white; font-weight: 600;">$${prizes.third}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    getLeagueDescription(league) {
        const sport = league.sport || 'NFL';
        const games = this.formatGamesPerWeek(league.gamesPerWeek);
        const duration = this.formatDuration(league.duration);
        return `${sport} • ${games} • ${duration} • ${league.members} members`;
    }
    
    formatGamesPerWeek(games) {
        if (!games || games === 'all' || games === 16) return 'All Games';
        if (typeof games === 'string' && games.includes('-')) return `${games} Games`;
        return `${games} Games/Week`;
    }
    
    formatDuration(duration) {
        if (!duration) return '';
        if (duration === 1) return '1 Week';
        if (duration === 18) return 'Full Season';
        return `${duration} Weeks`;
    }
}