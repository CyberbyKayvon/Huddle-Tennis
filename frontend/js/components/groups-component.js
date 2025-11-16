// Groups Component - Persistent social betting communities for Huddle
// XSS Secured with DOMPurify and Enhanced Features
class GroupsComponent {
    constructor() {
        // Security check
        if (typeof DOMPurify === 'undefined') {
            console.error('⚠️ DOMPurify not loaded! Add: <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script>');
        }
        
        this.currentView = 'hub'; // hub, discover, create, group-detail
        this.myGroups = [];
        this.discoverGroups = [];
        this.pendingInvites = [];
        this.activeGroup = null;
        this.filters = {
            sport: 'all',
            entryFee: 'all',
            size: 'all'
        };
        this.searchQuery = '';
        this.groupActivity = new Map(); // Store real-time activity per group
        this.activeVoiceRooms = new Map(); // Track voice room participants
        
        // Group customization options
        this.groupTypes = {
            casual: { name: 'Casual', icon: '🎮', color: '#00ff88' },
            competitive: { name: 'Competitive', icon: '🏆', color: '#ffd700' },
            learning: { name: 'Learning', icon: '📚', color: '#6366f1' },
            premium: { name: 'Premium', icon: '💎', color: '#8b5cf6' },
            seasonal: { name: 'Seasonal', icon: '📅', color: '#ff6b6b' }
        };
        
        this.sports = {
            nfl: { name: 'NFL', icon: '🏈' },
            nba: { name: 'NBA', icon: '🏀' },
            mlb: { name: 'MLB', icon: '⚾' },
            nhl: { name: 'NHL', icon: '🏒' },
            ncaaf: { name: 'NCAAF', icon: '🎓' },
            soccer: { name: 'Soccer', icon: '⚽' },
            mixed: { name: 'Mixed', icon: '🎯' }
        };
    }

    // Secure HTML sanitization
    sanitize(html) {
        return typeof DOMPurify !== 'undefined' ? 
            DOMPurify.sanitize(html, {
                ALLOWED_ATTR: ['style', 'class', 'id', 'onclick', 'onmouseover', 'onmouseout', 
                              'onkeyup', 'onchange', 'value', 'placeholder', 'title', 'type']
            }) : html;
    }

    render() {
        const html = `
            <div class="groups-container" style="padding: 20px; max-width: 1400px; margin: 0 auto;">
                ${this.renderHeader()}
                ${this.renderContent()}
            </div>
        `;
        return this.sanitize(html);
    }

    renderHeader() {
        const html = `
            <div class="groups-header" style="background: linear-gradient(135deg, #1a1a2e, #2a2a3e); border-radius: 20px; padding: 30px; margin-bottom: 25px; border: 2px solid rgba(99, 102, 241, 0.3); position: relative; overflow: hidden;">
                <!-- Animated Background Effect -->
                <div style="position: absolute; top: -50%; right: -10%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%); animation: pulse 4s ease-in-out infinite;"></div>
                
                <div style="position: relative; z-index: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <div>
                            <h2 style="font-size: 2.5rem; font-weight: 900; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">
                                👥 Groups
                            </h2>
                            <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 1.1rem;">
                                Join persistent betting communities with your crew
                            </p>
                        </div>
                        <div style="display: flex; gap: 12px;">
                            <button onclick="window.groupsComponent.showCreateGroup()" 
                                    style="padding: 12px 24px; background: linear-gradient(135deg, #00ff88, #00cc6a); color: #000; border: none; border-radius: 12px; cursor: pointer; font-weight: 700; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);"
                                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 255, 136, 0.4)'"
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 255, 136, 0.3)'">
                                <i class="fas fa-plus"></i> Create Group
                            </button>
                            <button onclick="window.groupsComponent.showJoinModal()" 
                                    style="padding: 12px 24px; background: rgba(99, 102, 241, 0.2); border: 1px solid #6366f1; color: #6366f1; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.3s;"
                                    onmouseover="this.style.background='rgba(99, 102, 241, 0.3)'"
                                    onmouseout="this.style.background='rgba(99, 102, 241, 0.2)'">
                                <i class="fas fa-key"></i> Join with Code
                            </button>
                            ${window.quickLeague ? `
                                <button onclick="window.quickLeague.switchView('my-leagues')" 
                                        style="padding: 12px 24px; background: rgba(255, 215, 0, 0.2); border: 1px solid #ffd700; color: #ffd700; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.3s;"
                                        onmouseover="this.style.background='rgba(255, 215, 0, 0.3)'"
                                        onmouseout="this.style.background='rgba(255, 215, 0, 0.2)'">
                                    <i class="fas fa-trophy"></i> Quick Leagues
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Quick Stats Bar -->
                    <div style="display: flex; gap: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <div>
                            <div style="color: #00ff88; font-size: 1.8rem; font-weight: bold;">${this.myGroups.length}</div>
                            <div style="color: #94a3b8; font-size: 0.9rem;">Your Groups</div>
                        </div>
                        <div>
                            <div style="color: #ffd700; font-size: 1.8rem; font-weight: bold;">
                                ${this.myGroups.reduce((sum, g) => sum + (g.unreadCount || 0), 0)}
                            </div>
                            <div style="color: #94a3b8; font-size: 0.9rem;">Unread Messages</div>
                        </div>
                        <div>
                            <div style="color: #6366f1; font-size: 1.8rem; font-weight: bold;">
                                ${this.getActiveMembers()}
                            </div>
                            <div style="color: #94a3b8; font-size: 0.9rem;">Members Online</div>
                        </div>
                        <div>
                            <div style="color: #ff6b6b; font-size: 1.8rem; font-weight: bold;">
                                ${this.getLiveGamesCount()}
                            </div>
                            <div style="color: #94a3b8; font-size: 0.9rem;">Live Games</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return this.sanitize(html);
    }

    renderContent() {
        // Pending Invites Banner (if any)
        const invitesBanner = this.pendingInvites.length > 0 ? `
            <div style="background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1)); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="font-size: 2rem;">🎉</div>
                    <div>
                        <div style="color: #ffd700; font-weight: 600;">You have ${this.pendingInvites.length} pending invite${this.pendingInvites.length > 1 ? 's' : ''}</div>
                        <div style="color: #94a3b8; font-size: 0.9rem;">${this.pendingInvites.map(i => i.groupName).join(', ')}</div>
                    </div>
                </div>
                <button onclick="window.groupsComponent.showInvites()" 
                        style="padding: 8px 16px; background: rgba(255, 215, 0, 0.2); border: 1px solid #ffd700; color: #ffd700; border-radius: 8px; cursor: pointer;">
                    View Invites
                </button>
            </div>
        ` : '';

        const html = `
            ${invitesBanner}
            ${this.renderMyGroups()}
            ${this.renderDiscoverSection()}
        `;
        return this.sanitize(html);
    }

    renderMyGroups() {
        if (this.myGroups.length === 0) {
            const html = `
                <div style="background: rgba(26, 26, 46, 0.95); border-radius: 15px; padding: 40px; text-align: center; margin-bottom: 30px; border: 1px solid rgba(99, 102, 241, 0.2);">
                    <div style="font-size: 4rem; margin-bottom: 20px;">🏈</div>
                    <h3 style="color: white; margin-bottom: 10px; font-size: 1.5rem;">No Groups Yet</h3>
                    <p style="color: #94a3b8; margin-bottom: 25px; max-width: 400px; margin-left: auto; margin-right: auto;">
                        Join a group to start competing with friends or create your own betting community
                    </p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button onclick="window.groupsComponent.scrollToDiscover()" 
                                style="padding: 12px 30px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600;">
                            Browse Groups
                        </button>
                        <button onclick="window.groupsComponent.showCreateGroup()" 
                                style="padding: 12px 30px; background: rgba(0, 255, 136, 0.2); border: 1px solid #00ff88; color: #00ff88; border-radius: 12px; cursor: pointer; font-weight: 600;">
                            Create Your First Group
                        </button>
                    </div>
                </div>
            `;
            return this.sanitize(html);
        }

        const html = `
            <div style="margin-bottom: 30px;">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: white; font-size: 1.4rem; font-weight: 700; margin: 0;">
                        My Groups
                        <span style="color: #6366f1; font-size: 1rem; margin-left: 10px;">(${this.myGroups.length})</span>
                    </h3>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px;">
                    ${this.myGroups.map(group => this.renderGroupCard(group, true)).join('')}
                </div>
            </div>
        `;
        return this.sanitize(html);
    }

    renderGroupCard(group, isMyGroup = false) {
        const activity = this.groupActivity.get(group.id) || [];
        const voiceRoom = this.activeVoiceRooms.get(group.id) || { count: 0 };
        const hasActivity = activity.length > 0 || voiceRoom.count > 0 || group.unreadCount > 0;
        const groupType = this.groupTypes[group.type] || this.groupTypes.casual;
        
        const html = `
            <div class="group-card" 
                 style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01)); 
                        border: 2px solid ${hasActivity ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.1)'}; 
                        border-radius: 16px; 
                        overflow: hidden; 
                        transition: all 0.3s; 
                        cursor: pointer;
                        position: relative;
                        ${hasActivity ? 'box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);' : ''}"
                 onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 10px 30px rgba(99, 102, 241, 0.3)'"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='${hasActivity ? '0 0 20px rgba(0, 255, 136, 0.2)' : ''}'"
                 onclick="window.groupsComponent.enterGroup('${group.id}')">
                
                <!-- Group Banner -->
                <div style="height: 100px; background: ${group.banner || 'linear-gradient(135deg, #667eea, #764ba2)'}; position: relative;">
                    ${group.coverImage ? `<img src="${group.coverImage}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
                    
                    <!-- Live Indicators -->
                    <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 8px;">
                        ${voiceRoom.count > 0 ? `
                            <div style="background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(10px); padding: 4px 10px; border-radius: 20px; display: flex; align-items: center; gap: 5px;">
                                <div style="width: 8px; height: 8px; background: #00ff88; border-radius: 50%; animation: pulse 2s infinite;"></div>
                                <span style="color: white; font-size: 0.85rem; font-weight: 600;">🎤 ${voiceRoom.count}</span>
                            </div>
                        ` : ''}
                        ${group.liveGames > 0 ? `
                            <div style="background: rgba(255, 0, 0, 0.8); padding: 4px 10px; border-radius: 20px;">
                                <span style="color: white; font-size: 0.85rem; font-weight: 600;">LIVE</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Group Type Badge -->
                    <div style="position: absolute; top: 10px; left: 10px; background: ${groupType.color}; padding: 4px 10px; border-radius: 20px;">
                        <span style="color: white; font-size: 0.75rem; font-weight: 600;">
                            ${groupType.icon} ${groupType.name}
                        </span>
                    </div>
                    
                    <!-- Group Avatar -->
                    <div style="position: absolute; bottom: -20px; left: 20px; width: 60px; height: 60px; background: ${group.avatar || 'linear-gradient(135deg, #6366f1, #8b5cf6)'}; border-radius: 12px; border: 3px solid #1a1a2e; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; color: white;">
                        ${group.icon || group.name.substring(0, 2).toUpperCase()}
                    </div>
                </div>
                
                <!-- Group Content -->
                <div style="padding: 30px 20px 20px 20px;">
                    <!-- Title and Members -->
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div>
                            <h4 style="color: white; margin: 0 0 5px 0; font-size: 1.2rem; font-weight: 700;">
                                ${group.name}
                                ${group.verified ? '<i class="fas fa-check-circle" style="color: #6366f1; margin-left: 5px; font-size: 0.9rem;"></i>' : ''}
                            </h4>
                            <div style="display: flex; gap: 15px; align-items: center;">
                                <span style="color: #94a3b8; font-size: 0.9rem;">
                                    <i class="fas fa-users" style="margin-right: 5px;"></i>${group.members}/${group.maxMembers || '∞'}
                                </span>
                                ${group.private ? `
                                    <span style="background: rgba(99, 102, 241, 0.2); color: #6366f1; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                                        PRIVATE
                                    </span>
                                ` : `
                                    <span style="background: rgba(0, 255, 136, 0.2); color: #00ff88; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                                        PUBLIC
                                    </span>
                                `}
                                ${group.sport ? `
                                    <span style="background: rgba(255, 215, 0, 0.2); color: #ffd700; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                                        ${this.sports[group.sport]?.icon || ''} ${this.sports[group.sport]?.name || group.sport}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                        ${group.pot > 0 ? `
                            <div style="text-align: right;">
                                <div style="color: #ffd700; font-size: 0.85rem;">Treasury</div>
                                <div style="color: white; font-weight: bold; font-size: 1.1rem;">$${group.pot}</div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Group Stats -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 12px; background: rgba(0, 0, 0, 0.2); border-radius: 8px; margin-bottom: 15px;">
                        <div style="text-align: center;">
                            <div style="color: #00ff88; font-weight: bold; font-size: 1.1rem;">${group.winRate || '0'}%</div>
                            <div style="color: #64748b; font-size: 0.75rem;">Win Rate</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: #ffd700; font-weight: bold; font-size: 1.1rem;">${group.activeStreak || '0'}</div>
                            <div style="color: #64748b; font-size: 0.75rem;">Best Streak</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: #6366f1; font-weight: bold; font-size: 1.1rem;">${group.weeklyPicks || '0'}</div>
                            <div style="color: #64748b; font-size: 0.75rem;">This Week</div>
                        </div>
                    </div>
                    
                    <!-- Recent Activity -->
                    ${activity.length > 0 ? `
                        <div style="margin-bottom: 15px; padding: 10px; background: rgba(0, 255, 136, 0.05); border-left: 2px solid #00ff88; border-radius: 4px;">
                            <div style="color: #00ff88; font-size: 0.85rem; margin-bottom: 5px;">Latest Activity</div>
                            <div style="color: white; font-size: 0.9rem;">${activity[0]}</div>
                        </div>
                    ` : ''}
                    
                    <!-- Tags -->
                    ${group.tags && group.tags.length > 0 ? `
                        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 15px;">
                            ${group.tags.slice(0, 3).map(tag => `
                                <span style="background: rgba(99, 102, 241, 0.1); color: #8b5cf6; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem;">
                                    #${tag}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 10px;">
                        ${isMyGroup ? `
                            <button onclick="event.stopPropagation(); window.groupsComponent.enterGroup('${group.id}')" 
                                    style="flex: 1; padding: 10px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                Enter Group
                                ${group.unreadCount > 0 ? `<span style="background: #ff0844; color: white; padding: 2px 6px; border-radius: 10px; margin-left: 5px; font-size: 0.8rem;">${group.unreadCount}</span>` : ''}
                            </button>
                            <button onclick="event.stopPropagation(); window.groupsComponent.shareGroup('${group.id}')" 
                                    style="padding: 10px; background: rgba(0, 255, 136, 0.2); border: 1px solid #00ff88; border-radius: 10px; cursor: pointer; color: #00ff88;"
                                    title="Share invite link">
                                <i class="fas fa-share"></i>
                            </button>
                            <button onclick="event.stopPropagation(); window.groupsComponent.toggleNotifications('${group.id}')" 
                                    style="padding: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; cursor: pointer; color: #94a3b8;"
                                    title="${group.muted ? 'Unmute' : 'Mute'} notifications">
                                <i class="fas fa-bell${group.muted ? '-slash' : ''}"></i>
                            </button>
                        ` : `
                            <button onclick="event.stopPropagation(); window.groupsComponent.joinGroup('${group.id}')" 
                                    style="flex: 1; padding: 10px; background: linear-gradient(135deg, #00ff88, #00cc6a); color: #000; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">
                                ${group.entryFee > 0 ? `Join ($${group.entryFee})` : 'Join Group'}
                            </button>
                            <button onclick="event.stopPropagation(); window.groupsComponent.previewGroup('${group.id}')" 
                                    style="padding: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; cursor: pointer; color: #94a3b8;"
                                    title="Preview group">
                                <i class="fas fa-eye"></i>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
        return this.sanitize(html);
    }

    renderDiscoverSection() {
        const html = `
            <div id="discoverSection" style="margin-top: 40px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h3 style="color: white; font-size: 1.4rem; font-weight: 700; margin: 0;">
                        Discover Groups
                        <span style="color: #6366f1; font-size: 1rem; margin-left: 10px;">(${this.discoverGroups.length})</span>
                    </h3>
                    
                    <!-- Search and Filters -->
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <div style="position: relative;">
                            <input type="text" id="groupSearch" placeholder="Search groups..." 
                                   onkeyup="window.groupsComponent.searchGroups(this.value)"
                                   style="padding: 10px 15px 10px 40px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; color: white; width: 250px;">
                            <i class="fas fa-search" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                        </div>
                        
                        <select onchange="window.groupsComponent.filterBySport(this.value)" 
                                style="padding: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; color: white; cursor: pointer;">
                            <option value="all">All Sports</option>
                            ${Object.entries(this.sports).map(([key, sport]) => 
                                `<option value="${key}">${sport.icon} ${sport.name}</option>`
                            ).join('')}
                        </select>
                        
                        <select onchange="window.groupsComponent.filterBySize(this.value)" 
                                style="padding: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; color: white; cursor: pointer;">
                            <option value="all">Any Size</option>
                            <option value="small">Small (2-10)</option>
                            <option value="medium">Medium (11-50)</option>
                            <option value="large">Large (50+)</option>
                        </select>
                        
                        <select onchange="window.groupsComponent.filterByFee(this.value)" 
                                style="padding: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; color: white; cursor: pointer;">
                            <option value="all">Any Entry</option>
                            <option value="free">Free</option>
                            <option value="low">$1-$25</option>
                            <option value="medium">$26-$100</option>
                            <option value="high">$100+</option>
                        </select>
                    </div>
                </div>
                
                <!-- Category Tabs -->
                <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 10px;">
                    <button onclick="window.groupsComponent.showCategory('featured')" 
                            class="category-tab active"
                            style="padding: 8px 16px; background: rgba(99, 102, 241, 0.2); border: none; border-radius: 8px; color: #6366f1; cursor: pointer; font-weight: 600;">
                        ⭐ Featured
                    </button>
                    <button onclick="window.groupsComponent.showCategory('trending')" 
                            class="category-tab"
                            style="padding: 8px 16px; background: transparent; border: none; border-radius: 8px; color: #94a3b8; cursor: pointer;">
                        🔥 Trending
                    </button>
                    <button onclick="window.groupsComponent.showCategory('new')" 
                            class="category-tab"
                            style="padding: 8px 16px; background: transparent; border: none; border-radius: 8px; color: #94a3b8; cursor: pointer;">
                        ✨ New Groups
                    </button>
                    <button onclick="window.groupsComponent.showCategory('highstakes')" 
                            class="category-tab"
                            style="padding: 8px 16px; background: transparent; border: none; border-radius: 8px; color: #94a3b8; cursor: pointer;">
                        💎 High Stakes
                    </button>
                    <button onclick="window.groupsComponent.showCategory('beginner')" 
                            class="category-tab"
                            style="padding: 8px 16px; background: transparent; border: none; border-radius: 8px; color: #94a3b8; cursor: pointer;">
                        🌱 Beginner Friendly
                    </button>
                </div>
                
                <!-- Groups Grid -->
                <div id="discoverGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px;">
                    ${this.discoverGroups.length > 0 ? 
                        this.discoverGroups.map(group => this.renderGroupCard(group, false)).join('') :
                        `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8;">
                            <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                            <p>No groups found matching your criteria</p>
                        </div>`
                    }
                </div>
                
                <!-- Load More -->
                ${this.discoverGroups.length >= 6 ? `
                    <div style="text-align: center; margin-top: 30px;">
                        <button onclick="window.groupsComponent.loadMoreGroups()" 
                                style="padding: 12px 40px; background: rgba(99, 102, 241, 0.1); border: 1px solid #6366f1; color: #6366f1; border-radius: 12px; cursor: pointer; font-weight: 600;">
                            Load More Groups
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        return this.sanitize(html);
    }

    // Initialize and load data
    async initialize() {
        try {
            console.log('Groups initialize called');
            
            // Load mock data immediately so UI shows
            this.loadMockData();
            
            // Start realtime updates
            this.startRealtimeUpdates();
            
            // Load real data in background (don't re-render)
            this.loadMyGroups().then(() => {
                console.log('My groups loaded:', this.myGroups);
            }).catch(console.error);
            
            this.loadDiscoverGroups().then(() => {
                console.log('Discover groups loaded:', this.discoverGroups);
            }).catch(console.error);
            
            this.loadPendingInvites().then(() => {
                console.log('Invites loaded:', this.pendingInvites);
            }).catch(console.error);
            
            console.log('Groups initialized successfully');
        } catch (error) {
            console.error('Error initializing groups:', error);
        }
    }

    async loadMyGroups() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/groups', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (response.ok) {
                const data = await response.json();
                this.myGroups = data.groups || [];
            }
        } catch (error) {
            console.error('Error loading groups:', error);
            this.loadMockMyGroups(); // Fallback to mock data
        }
    }

    async loadDiscoverGroups() {
        try {
            const response = await fetch('/api/groups/discover');
            if (response.ok) {
                const data = await response.json();
                this.discoverGroups = data.groups || [];
            }
        } catch (error) {
            console.error('Error loading discover groups:', error);
            this.loadMockDiscoverGroups(); // Fallback to mock data
        }
    }

    async loadPendingInvites() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/groups/invites', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (response.ok) {
                const data = await response.json();
                this.pendingInvites = data.invites || [];
            }
        } catch (error) {
            console.error('Error loading invites:', error);
        }
    }

    // Mock data loaders for demo
    loadMockMyGroups() {
        // First try to load from localStorage
        const savedGroups = JSON.parse(localStorage.getItem('huddle_groups') || '[]');
        if (savedGroups.length > 0) {
            this.myGroups = savedGroups;
            return;
        }
        
        // Otherwise use mock data
        this.myGroups = [
            {
                id: 'sunday-degenerates',
                name: 'Sunday Degenerates',
                icon: '🏈',
                type: 'competitive',
                sport: 'nfl',
                members: 12,
                maxMembers: 50,
                pot: 240,
                winRate: 67,
                activeStreak: 5,
                weeklyPicks: 8,
                private: false,
                verified: true,
                unreadCount: 3,
                tags: ['NFL', 'HighStakes', 'Competitive'],
                banner: 'linear-gradient(135deg, #667eea, #764ba2)',
                activity: ['Mike just won $50 on Vikings -7'],
                liveGames: 2
            },
            {
                id: 'nba-sharps',
                name: 'NBA Sharps',
                icon: '🏀',
                type: 'premium',
                sport: 'nba',
                members: 8,
                maxMembers: 20,
                pot: 500,
                winRate: 72,
                activeStreak: 3,
                weeklyPicks: 12,
                private: true,
                unreadCount: 0,
                tags: ['NBA', 'Analytics', 'Props'],
                banner: 'linear-gradient(135deg, #f093fb, #f5576c)'
            }
        ];

        // Set some mock activity
        this.groupActivity.set('sunday-degenerates', ['Mike just won $50 on Vikings -7']);
        this.activeVoiceRooms.set('sunday-degenerates', { count: 3 });
    }

    loadMockDiscoverGroups() {
        this.discoverGroups = [
            {
                id: 'elite-cappers',
                name: 'Elite Cappers',
                icon: '💎',
                type: 'premium',
                sport: 'mixed',
                members: 47,
                maxMembers: 100,
                pot: 5000,
                winRate: 78,
                entryFee: 100,
                private: false,
                verified: true,
                tags: ['Premium', 'AllSports', 'Verified'],
                banner: 'linear-gradient(135deg, #FFD700, #FFA500)'
            },
            {
                id: 'rookie-league',
                name: 'Rookie League',
                icon: '🌱',
                type: 'learning',
                sport: 'nfl',
                members: 23,
                maxMembers: 50,
                pot: 0,
                winRate: 52,
                entryFee: 0,
                private: false,
                tags: ['Beginner', 'Learning', 'Free'],
                banner: 'linear-gradient(135deg, #00ff88, #00cc6a)'
            },
            {
                id: 'late-night-locks',
                name: 'Late Night Locks',
                icon: '🌙',
                type: 'casual',
                sport: 'nba',
                members: 15,
                maxMembers: 30,
                pot: 750,
                winRate: 65,
                entryFee: 25,
                private: false,
                tags: ['WestCoast', 'NBA', 'LateGames'],
                banner: 'linear-gradient(135deg, #4158D0, #C850C0)'
            }
        ];
    }

    loadMockData() {
        // This is called after trying real API
        if (this.myGroups.length === 0) {
            this.loadMockMyGroups();
        }
        if (this.discoverGroups.length === 0) {
            this.loadMockDiscoverGroups();
        }
    }

    // Real-time updates
    startRealtimeUpdates() {
        // Simulate real-time activity updates
        setInterval(() => {
            // Update voice room counts
            this.myGroups.forEach(group => {
                if (Math.random() > 0.8) {
                    const currentCount = this.activeVoiceRooms.get(group.id)?.count || 0;
                    this.activeVoiceRooms.set(group.id, { 
                        count: Math.max(0, currentCount + (Math.random() > 0.5 ? 1 : -1))
                    });
                }
            });
        }, 10000);
    }

    // Create Group Modal
    showCreateGroup() {
        const modal = document.createElement('div');
        modal.id = 'createGroupModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow-y: auto;
        `;
        
        const modalHTML = `
            <div style="background: linear-gradient(135deg, #1a1a2e, #2a2a3e); border-radius: 20px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; border: 2px solid #6366f1;">
                <div style="padding: 30px;">
                    <h2 style="color: #00ff88; margin-bottom: 25px;">Create Your Group</h2>
                    
                    <!-- Group Name -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; color: #94a3b8; margin-bottom: 8px;">Group Name</label>
                        <input type="text" id="groupName" placeholder="e.g., Sunday Degenerates" 
                               style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                    </div>
                    
                    <!-- Group Type -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; color: #94a3b8; margin-bottom: 8px;">Group Type</label>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                            ${Object.entries(this.groupTypes).map(([key, type]) => `
                                <button onclick="window.groupsComponent.selectGroupType('${key}')" 
                                        id="type-${key}"
                                        style="padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #94a3b8; cursor: pointer; transition: all 0.2s;">
                                    <div style="font-size: 1.5rem; margin-bottom: 5px;">${type.icon}</div>
                                    <div style="font-size: 0.9rem;">${type.name}</div>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Sport Selection -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; color: #94a3b8; margin-bottom: 8px;">Sport Focus</label>
                        <select id="groupSport" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                            ${Object.entries(this.sports).map(([key, sport]) => 
                                `<option value="${key}">${sport.icon} ${sport.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <!-- Privacy -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; color: #94a3b8; margin-bottom: 8px;">Privacy</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <button onclick="window.groupsComponent.setPrivacy(false)" 
                                    id="privacy-public"
                                    style="padding: 12px; background: rgba(0, 255, 136, 0.2); border: 1px solid #00ff88; border-radius: 8px; color: #00ff88; cursor: pointer;">
                                🌐 Public
                            </button>
                            <button onclick="window.groupsComponent.setPrivacy(true)" 
                                    id="privacy-private"
                                    style="padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #94a3b8; cursor: pointer;">
                                🔒 Private
                            </button>
                        </div>
                    </div>
                    
                    <!-- Max Members -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; color: #94a3b8; margin-bottom: 8px;">Max Members</label>
                        <input type="number" id="maxMembers" placeholder="Leave empty for unlimited" min="2" max="1000"
                               style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                    </div>
                    
                    <!-- Entry Fee -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; color: #94a3b8; margin-bottom: 8px;">Entry Fee (Optional)</label>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="window.groupsComponent.setFee(0)" style="padding: 8px 16px; background: rgba(0, 255, 136, 0.2); border: 1px solid #00ff88; border-radius: 8px; color: #00ff88; cursor: pointer;">FREE</button>
                            <button onclick="window.groupsComponent.setFee(10)" style="padding: 8px 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #94a3b8; cursor: pointer;">$10</button>
                            <button onclick="window.groupsComponent.setFee(25)" style="padding: 8px 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #94a3b8; cursor: pointer;">$25</button>
                            <button onclick="window.groupsComponent.setFee(50)" style="padding: 8px 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #94a3b8; cursor: pointer;">$50</button>
                            <input type="number" id="entryFee" placeholder="Custom" min="0" 
                                   style="flex: 1; padding: 8px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 10px;">
                        <button onclick="window.groupsComponent.createGroup()" 
                                style="flex: 1; padding: 14px; background: linear-gradient(135deg, #00ff88, #00cc6a); color: #000; border: none; border-radius: 12px; cursor: pointer; font-weight: 700;">
                            Create Group
                        </button>
                        <button onclick="document.getElementById('createGroupModal').remove()" 
                                style="flex: 1; padding: 14px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: #94a3b8; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.innerHTML = this.sanitize(modalHTML);
        document.body.appendChild(modal);
    }

    // Group type selection
    selectGroupType(type) {
        // Reset all buttons
        Object.keys(this.groupTypes).forEach(key => {
            const btn = document.getElementById(`type-${key}`);
            if (btn) {
                btn.style.background = 'rgba(255, 255, 255, 0.05)';
                btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                btn.style.color = '#94a3b8';
            }
        });
        
        // Highlight selected
        const selectedBtn = document.getElementById(`type-${type}`);
        if (selectedBtn) {
            const groupType = this.groupTypes[type];
            selectedBtn.style.background = `${groupType.color}20`;
            selectedBtn.style.borderColor = groupType.color;
            selectedBtn.style.color = groupType.color;
        }
    }

    setPrivacy(isPrivate) {
        const publicBtn = document.getElementById('privacy-public');
        const privateBtn = document.getElementById('privacy-private');
        
        if (isPrivate) {
            publicBtn.style.background = 'rgba(255, 255, 255, 0.05)';
            publicBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            publicBtn.style.color = '#94a3b8';
            
            privateBtn.style.background = 'rgba(99, 102, 241, 0.2)';
            privateBtn.style.borderColor = '#6366f1';
            privateBtn.style.color = '#6366f1';
        } else {
            publicBtn.style.background = 'rgba(0, 255, 136, 0.2)';
            publicBtn.style.borderColor = '#00ff88';
            publicBtn.style.color = '#00ff88';
            
            privateBtn.style.background = 'rgba(255, 255, 255, 0.05)';
            privateBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            privateBtn.style.color = '#94a3b8';
        }
    }

    setFee(amount) {
        document.getElementById('entryFee').value = amount;
    }

    async createGroup(prefilledData = null) {
        const groupData = prefilledData || {
            name: document.getElementById('groupName').value,
            sport: document.getElementById('groupSport').value,
            maxMembers: document.getElementById('maxMembers').value || null,
            entryFee: document.getElementById('entryFee').value || 0
        };
        
        if (!groupData.name) {
            alert('Please enter a group name');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/groups/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(groupData)
            });
            
            if (response.ok) {
                const data = await response.json();
                window.location.href = `/g/${data.groupId}`;
            } else {
                alert('Failed to create group');
            }
        } catch (error) {
            console.error('Error creating group:', error);
            // Create mock group for demo
            const mockId = `group-${Date.now()}`;
            this.myGroups.push({
                id: mockId,
                ...groupData,
                members: 1,
                icon: this.sports[groupData.sport]?.icon || '🎯'
            });
            document.getElementById('createGroupModal').remove();
            this.enterGroup(mockId);
        }
    }

    // Create group from Quick League
    createFromLeague(leagueData) {
        // Close any open modals
        const existingModal = document.getElementById('createGroupModal');
        if (existingModal) existingModal.remove();
        
        // Create new group with league data
        const groupData = {
            name: leagueData.name || 'Upgraded League',
            type: leagueData.type || 'casual',
            sport: leagueData.sport || 'nfl',
            members: [],
            maxMembers: 100,
            entryFee: leagueData.entryFee || 0,
            pot: 0,
            winRate: 0,
            activeStreak: 0,
            weeklyPicks: 0,
            private: leagueData.type === 'private',
            tags: ['Upgraded', 'FromLeague'],
            banner: 'linear-gradient(135deg, #ffd700, #ffa500)',
            createdAt: new Date().toISOString(),
            importedFromLeague: leagueData.importedFromLeague
        };
        
        // Generate unique ID and code
        groupData.id = 'group-' + Date.now();
        groupData.code = this.generateGroupCode();
        
        // Save to storage
        this.myGroups.push(groupData);
        this.saveGroupToStorage(groupData);
        
        // Show success message
        this.showNotification('🎉 Successfully upgraded to permanent group!');
        
        // Enter the new group
        this.enterGroup(groupData.id);
        
        // Refresh the display
        const feedPosts = document.querySelector('.feed-posts');
        if (feedPosts) {
            feedPosts.innerHTML = this.render();
            this.initialize();
        }
    }
    
    generateGroupCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    saveGroupToStorage(group) {
        const groups = JSON.parse(localStorage.getItem('huddle_groups') || '[]');
        groups.push(group);
        localStorage.setItem('huddle_groups', JSON.stringify(groups));
    }
    
    // Share group functionality
    shareGroup(groupId) {
        const group = this.myGroups.find(g => g.id === groupId);
        if (!group) return;
        
        const inviteLink = `${window.location.origin}/join/${group.code || groupId}`;
        
        if (navigator.share) {
            navigator.share({
                title: `Join ${group.name} on Huddle`,
                text: `Join my betting group "${group.name}" on Huddle!`,
                url: inviteLink
            });
        } else {
            navigator.clipboard.writeText(inviteLink);
            this.showNotification('Invite link copied to clipboard!');
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00ff88, #00cc6a);
            color: black;
            padding: 15px 20px;
            border-radius: 10px;
            font-weight: 600;
            z-index: 10001;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Join modal functionality
    showJoinModal() {
        const modal = document.createElement('div');
        modal.id = 'joinModal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #2a2a3e);
            padding: 30px;
            border-radius: 20px;
            z-index: 10000;
            min-width: 400px;
            border: 2px solid #6366f1;
            box-shadow: 0 20px 60px rgba(99, 102, 241, 0.3);
        `;
        
        const modalHTML = `
            <h3 style="color: #00ff88; margin-bottom: 20px;">Join Private Group</h3>
            <p style="color: #94a3b8; margin-bottom: 20px;">Enter the invite code shared by the group admin</p>
            
            <input type="text" id="groupInviteCode" placeholder="Enter code (e.g., ABC123)" 
                   style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); 
                          border-radius: 8px; color: white; margin-bottom: 20px; text-transform: uppercase;">
            
            <div style="display: flex; gap: 10px;">
                <button onclick="window.groupsComponent.joinWithCode()" 
                        style="flex: 1; padding: 12px; background: linear-gradient(135deg, #6366f1, #8b5cf6); 
                               color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600;">
                    Join Group
                </button>
                <button onclick="document.getElementById('joinModal').remove()" 
                        style="flex: 1; padding: 12px; background: rgba(255, 255, 255, 0.05); 
                               border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; 
                               color: #94a3b8; cursor: pointer;">
                    Cancel
                </button>
            </div>
        `;
        
        modal.innerHTML = this.sanitize(modalHTML);
        document.body.appendChild(modal);
        document.getElementById('groupInviteCode').focus();
    }

    async joinWithCode() {
        const code = document.getElementById('groupInviteCode').value.trim().toUpperCase();
        if (!code) {
            alert('Please enter a group code');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/groups/join/${code}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                window.location.href = `/g/${data.groupId}`;
            } else {
                alert('Invalid group code');
            }
        } catch (error) {
            console.error('Error joining with code:', error);
            alert('Failed to join group');
        }
    }

    // Action methods
    enterGroup(groupId) {
        if (!event.defaultPrevented) {
            window.location.href = `/g/${groupId}`;
        }
    }

    async joinGroup(groupId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/groups/${groupId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            
            if (response.ok) {
                const group = this.discoverGroups.find(g => g.id === groupId);
                if (group) {
                    this.myGroups.push(group);
                    this.discoverGroups = this.discoverGroups.filter(g => g.id !== groupId);
                    document.querySelector('.feed-posts').innerHTML = this.render();
                    this.initialize();
                }
                
                window.location.href = `/g/${groupId}`;
            }
        } catch (error) {
            console.error('Error joining group:', error);
            alert('Failed to join group. Please try again.');
        }
    }

    previewGroup(groupId) {
        const group = [...this.myGroups, ...this.discoverGroups].find(g => g.id === groupId);
        if (!group) return;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #2a2a3e);
            padding: 30px;
            border-radius: 20px;
            z-index: 10000;
            min-width: 500px;
            max-width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            border: 2px solid #6366f1;
            box-shadow: 0 20px 60px rgba(99, 102, 241, 0.3);
        `;
        
        const modalHTML = `
            <h3 style="color: #00ff88; margin-bottom: 20px;">${group.name} Preview</h3>
            
            <div style="display: grid; gap: 20px;">
                <div style="padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 10px;">
                    <h4 style="color: #6366f1; margin-bottom: 10px;">Group Stats</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        <div>Members: ${group.members}/${group.maxMembers || '∞'}</div>
                        <div>Win Rate: ${group.winRate || 0}%</div>
                        <div>Treasury: $${group.pot || 0}</div>
                        <div>Entry Fee: ${group.entryFee ? `$${group.entryFee}` : 'FREE'}</div>
                    </div>
                </div>
                
                <div style="padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 10px;">
                    <h4 style="color: #6366f1; margin-bottom: 10px;">Recent Performance</h4>
                    <p style="color: #94a3b8;">Last 5 picks: W-W-L-W-W (80% success)</p>
                </div>
                
                <div style="padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 10px;">
                    <h4 style="color: #6366f1; margin-bottom: 10px;">Group Rules</h4>
                    <ul style="color: #94a3b8; margin: 0; padding-left: 20px;">
                        <li>Minimum 3 picks per week</li>
                        <li>All picks must be submitted before kickoff</li>
                        <li>Respect all members</li>
                    </ul>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                ${group.entryFee > 0 ? `
                    <button onclick="window.groupsComponent.joinGroup('${group.id}')" 
                            style="flex: 1; padding: 12px; background: linear-gradient(135deg, #00ff88, #00cc6a); 
                                   color: #000; border: none; border-radius: 12px; cursor: pointer; font-weight: 600;">
                        Join for $${group.entryFee}
                    </button>
                ` : `
                    <button onclick="window.groupsComponent.joinGroup('${group.id}')" 
                            style="flex: 1; padding: 12px; background: linear-gradient(135deg, #00ff88, #00cc6a); 
                                   color: #000; border: none; border-radius: 12px; cursor: pointer; font-weight: 600;">
                        Join Group
                        </button>
                `}
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="flex: 1; padding: 12px; background: rgba(255, 255, 255, 0.05); 
                               border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; 
                               color: #94a3b8; cursor: pointer;">
                    Close
                </button>
            </div>
        `;
        
        modal.innerHTML = this.sanitize(modalHTML);
        document.body.appendChild(modal);
    }

    toggleNotifications(groupId) {
        const group = this.myGroups.find(g => g.id === groupId);
        if (group) {
            group.muted = !group.muted;
            document.querySelector('.feed-posts').innerHTML = this.render();
            this.initialize();
        }
    }

    showInvites() {
        const modal = document.createElement('div');
        modal.id = 'invitesModal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #2a2a3e);
            padding: 30px;
            border-radius: 20px;
            z-index: 10000;
            min-width: 500px;
            max-width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            border: 2px solid #ffd700;
            box-shadow: 0 20px 60px rgba(255, 215, 0, 0.3);
        `;
        
        const modalHTML = `
            <h3 style="color: #ffd700; margin-bottom: 20px;">
                🎉 Pending Invites (${this.pendingInvites.length})
            </h3>
            
            <div style="display: grid; gap: 15px;">
                ${this.pendingInvites.length > 0 ? this.pendingInvites.map(invite => `
                    <div style="padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 10px; border: 1px solid rgba(255, 215, 0, 0.2);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="color: white; margin: 0;">${invite.groupName}</h4>
                            <span style="color: #94a3b8; font-size: 0.9rem;">Invited by ${invite.invitedBy}</span>
                        </div>
                        <p style="color: #94a3b8; margin: 10px 0;">${invite.message || 'Join us for some epic betting action!'}</p>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="window.groupsComponent.acceptInvite('${invite.id}')" 
                                    style="flex: 1; padding: 10px; background: linear-gradient(135deg, #00ff88, #00cc6a); 
                                           color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                Accept
                            </button>
                            <button onclick="window.groupsComponent.declineInvite('${invite.id}')" 
                                    style="flex: 1; padding: 10px; background: rgba(255, 255, 255, 0.05); 
                                           border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; 
                                           color: #94a3b8; cursor: pointer;">
                                Decline
                            </button>
                        </div>
                    </div>
                `).join('') : `
                    <p style="color: #94a3b8; text-align: center; padding: 20px;">
                        No pending invites at the moment
                    </p>
                `}
            </div>
            
            <button onclick="document.getElementById('invitesModal').remove()" 
                    style="width: 100%; padding: 12px; margin-top: 20px; background: rgba(255, 255, 255, 0.05); 
                           border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; 
                           color: #94a3b8; cursor: pointer;">
                Close
            </button>
        `;
        
        modal.innerHTML = this.sanitize(modalHTML);
        document.body.appendChild(modal);
    }

    async acceptInvite(inviteId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/groups/invites/${inviteId}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.pendingInvites = this.pendingInvites.filter(i => i.id !== inviteId);
                window.location.href = `/g/${data.groupId}`;
            }
        } catch (error) {
            console.error('Error accepting invite:', error);
            // Mock acceptance for demo
            this.pendingInvites = this.pendingInvites.filter(i => i.id !== inviteId);
            document.getElementById('invitesModal').remove();
            this.showNotification('Invite accepted!');
        }
    }

    async declineInvite(inviteId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/groups/invites/${inviteId}/decline`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            
            if (response.ok) {
                this.pendingInvites = this.pendingInvites.filter(i => i.id !== inviteId);
                if (this.pendingInvites.length === 0) {
                    document.getElementById('invitesModal').remove();
                } else {
                    this.showInvites(); // Refresh modal
                }
            }
        } catch (error) {
            console.error('Error declining invite:', error);
            // Mock decline for demo
            this.pendingInvites = this.pendingInvites.filter(i => i.id !== inviteId);
            if (this.pendingInvites.length === 0) {
                document.getElementById('invitesModal').remove();
            } else {
                this.showInvites(); // Refresh modal
            }
        }
    }

    // Filter and search methods
    searchGroups(query) {
        this.searchQuery = query.toLowerCase();
        this.applyFilters();
    }

    filterBySport(sport) {
        this.filters.sport = sport;
        this.applyFilters();
    }

    filterBySize(size) {
        this.filters.size = size;
        this.applyFilters();
    }

    filterByFee(fee) {
        this.filters.entryFee = fee;
        this.applyFilters();
    }

    showCategory(category) {
        // Update active tab styling
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
            tab.style.background = 'transparent';
            tab.style.color = '#94a3b8';
        });
        
        event.target.classList.add('active');
        event.target.style.background = 'rgba(99, 102, 241, 0.2)';
        event.target.style.color = '#6366f1';
        
        // Filter groups by category
        this.loadGroupsByCategory(category);
    }

    async loadGroupsByCategory(category) {
        try {
            const response = await fetch(`/api/groups/discover?category=${category}`);
            if (response.ok) {
                const data = await response.json();
                this.discoverGroups = data.groups || [];
            } else {
                // Use mock filtering for demo
                this.filterMockGroupsByCategory(category);
            }
        } catch (error) {
            console.error('Error loading category:', error);
            this.filterMockGroupsByCategory(category);
        }
        
        // Re-render discover grid
        const grid = document.getElementById('discoverGrid');
        if (grid) {
            grid.innerHTML = this.discoverGroups.length > 0 ? 
                this.sanitize(this.discoverGroups.map(group => this.renderGroupCard(group, false)).join('')) :
                this.sanitize(`
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8;">
                        <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                        <p>No groups found in this category</p>
                    </div>
                `);
        }
    }

    filterMockGroupsByCategory(category) {
        // Create category-specific mock groups
        const categoryGroups = {
            featured: [
                {
                    id: 'champions-circle',
                    name: 'Champions Circle',
                    icon: '👑',
                    type: 'premium',
                    sport: 'mixed',
                    members: 89,
                    maxMembers: 100,
                    pot: 10000,
                    winRate: 82,
                    entryFee: 250,
                    private: true,
                    verified: true,
                    tags: ['Elite', 'Verified', 'HighRollers'],
                    banner: 'linear-gradient(135deg, #FFD700, #FF6347)'
                }
            ],
            trending: [
                {
                    id: 'hot-streak',
                    name: 'Hot Streak Heroes',
                    icon: '🔥',
                    type: 'competitive',
                    sport: 'nfl',
                    members: 156,
                    maxMembers: 200,
                    pot: 3500,
                    winRate: 75,
                    entryFee: 50,
                    private: false,
                    tags: ['Trending', 'Popular', 'Active'],
                    banner: 'linear-gradient(135deg, #FF4500, #FFD700)'
                }
            ],
            new: [
                {
                    id: 'fresh-picks',
                    name: 'Fresh Picks',
                    icon: '🌟',
                    type: 'casual',
                    sport: 'nba',
                    members: 5,
                    maxMembers: 50,
                    pot: 0,
                    winRate: 0,
                    entryFee: 0,
                    private: false,
                    tags: ['New', 'Growing', 'Friendly'],
                    banner: 'linear-gradient(135deg, #00CED1, #00BFFF)'
                }
            ],
            highstakes: [
                {
                    id: 'whale-watchers',
                    name: 'Whale Watchers',
                    icon: '🐋',
                    type: 'premium',
                    sport: 'mixed',
                    members: 42,
                    maxMembers: 50,
                    pot: 25000,
                    winRate: 79,
                    entryFee: 500,
                    private: true,
                    verified: true,
                    tags: ['HighStakes', 'Premium', 'Exclusive'],
                    banner: 'linear-gradient(135deg, #4B0082, #8A2BE2)'
                }
            ],
            beginner: [
                {
                    id: 'betting-101',
                    name: 'Betting 101',
                    icon: '📚',
                    type: 'learning',
                    sport: 'nfl',
                    members: 234,
                    maxMembers: 500,
                    pot: 0,
                    winRate: 51,
                    entryFee: 0,
                    private: false,
                    tags: ['Learning', 'Beginner', 'Educational'],
                    banner: 'linear-gradient(135deg, #32CD32, #90EE90)'
                }
            ]
        };
        
        this.discoverGroups = categoryGroups[category] || this.loadMockDiscoverGroups();
    }

    applyFilters() {
        // This would normally be done server-side
        let filtered = [...this.discoverGroups];
        
        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(g => 
                g.name.toLowerCase().includes(this.searchQuery) ||
                g.tags?.some(t => t.toLowerCase().includes(this.searchQuery))
            );
        }
        
        // Apply sport filter
        if (this.filters.sport !== 'all') {
            filtered = filtered.filter(g => g.sport === this.filters.sport);
        }
        
        // Apply size filter
        if (this.filters.size !== 'all') {
            const sizeRanges = {
                small: [2, 10],
                medium: [11, 50],
                large: [51, Infinity]
            };
            const [min, max] = sizeRanges[this.filters.size];
            filtered = filtered.filter(g => g.members >= min && g.members <= max);
        }
        
        // Apply fee filter
        if (this.filters.entryFee !== 'all') {
            const feeRanges = {
                free: [0, 0],
                low: [1, 25],
                medium: [26, 100],
                high: [101, Infinity]
            };
            const [min, max] = feeRanges[this.filters.entryFee];
            filtered = filtered.filter(g => g.entryFee >= min && g.entryFee <= max);
        }
        
        // Update grid
        const grid = document.getElementById('discoverGrid');
        if (grid) {
            grid.innerHTML = filtered.length > 0 ?
                this.sanitize(filtered.map(group => this.renderGroupCard(group, false)).join('')) :
                this.sanitize(`
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8;">
                        <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                        <p>No groups found matching your criteria</p>
                    </div>
                `);
        }
    }

    async loadMoreGroups() {
        // Simulate loading more groups
        const moreGroups = [
            {
                id: `group-${Date.now()}`,
                name: 'Action Junkies',
                icon: '⚡',
                type: 'competitive',
                sport: 'mixed',
                members: 28,
                maxMembers: 50,
                pot: 1200,
                winRate: 68,
                entryFee: 25,
                private: false,
                tags: ['Active', 'Daily', 'AllSports'],
                banner: 'linear-gradient(135deg, #FF69B4, #FF1493)'
            },
            {
                id: `group-${Date.now() + 1}`,
                name: 'Data Driven',
                icon: '📊',
                type: 'premium',
                sport: 'nfl',
                members: 15,
                maxMembers: 30,
                pot: 2000,
                winRate: 71,
                entryFee: 75,
                private: true,
                tags: ['Analytics', 'Models', 'Advanced'],
                banner: 'linear-gradient(135deg, #4682B4, #1E90FF)'
            }
        ];
        
        this.discoverGroups.push(...moreGroups);
        
        // Re-render discover grid
        const grid = document.getElementById('discoverGrid');
        if (grid) {
            grid.innerHTML = this.sanitize(this.discoverGroups.map(group => this.renderGroupCard(group, false)).join(''));
        }
    }

    scrollToDiscover() {
        document.getElementById('discoverSection')?.scrollIntoView({ behavior: 'smooth' });
    }

    // Helper methods
    getActiveMembers() {
        return this.myGroups.reduce((sum, g) => {
            const voiceCount = this.activeVoiceRooms.get(g.id)?.count || 0;
            return sum + voiceCount;
        }, 0);
    }

    getLiveGamesCount() {
        return this.myGroups.reduce((sum, g) => sum + (g.liveGames || 0), 0);
    }

    // Integration with other components
    connectWithQuickLeague() {
        // Share data with Quick League component if available
        if (window.quickLeague) {
            // Add upgrade prompt if league has many members
            const activeLeagues = window.quickLeague.userLeagues.filter(l => l.members > 10);
            activeLeagues.forEach(league => {
                if (!this.myGroups.find(g => g.importedFromLeague === league.id)) {
                    // Show upgrade suggestion
                    console.log(`Suggest upgrading league: ${league.name}`);
                }
            });
        }
    }

    connectWithBettingStore() {
        // Integrate with AI betting store for group discounts
        if (window.bettingStore) {
            const groupDiscount = this.myGroups.length > 0 ? 10 : 0;
            window.bettingStore.applyGroupDiscount(groupDiscount);
        }
    }
}

// Add required CSS animations
if (!document.getElementById('groups-component-styles')) {
    const style = document.createElement('style');
    style.id = 'groups-component-styles';
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 0.3; }
        }
        
        @keyframes slideIn {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(20px);
                opacity: 0;
            }
        }
        
        .category-tab {
            transition: all 0.3s ease;
        }
        
        .category-tab:hover {
            transform: translateY(-2px);
        }
        
        .group-card {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// Create global instance
window.groupsComponent = new GroupsComponent();