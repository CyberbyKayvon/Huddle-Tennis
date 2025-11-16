// quick-league/ui/SettingsPanel.js
export class SettingsPanel {
    constructor(parent) {
        this.parent = parent;
    }
    
    render(league) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user._id || user.id;
        const isOwner = league.owner === userId || league.owner?._id === userId;
        
        if (!isOwner) {
            return `
                <div style="padding: 2rem; text-align: center; color: #94a3b8;">
                    <i class="fas fa-lock" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Only the league owner can access settings</p>
                </div>
            `;
        }
        
        return `
            <div class="league-settings" style="padding: 1.5rem;">
                <h3 style="color: #00ff88; margin-bottom: 1.5rem;">⚙️ League Management</h3>
                
                <!-- View All Team Picks -->
                <div style="background: rgba(99, 102, 241, 0.1); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                    <h4 style="color: #8b5cf6; margin-bottom: 1rem;">
                        <i class="fas fa-list"></i> All Member Picks - Week ${league.currentWeek || '1'}
                    </h4>
                    <div id="allMemberPicks" style="max-height: 400px; overflow-y: auto;">
                        ${this.renderAllMemberPicks(league)}
                    </div>
                </div>
                
                <!-- Edit Standings -->
                <div style="background: rgba(0, 255, 136, 0.1); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                    <h4 style="color: #00ff88; margin-bottom: 1rem;">
                        <i class="fas fa-edit"></i> Adjust Standings
                    </h4>
                    <div id="standingsEditor">
                        ${this.renderStandingsEditor(league)}
                    </div>
                    <button onclick="window.quickLeague.settingsPanel.saveStandings('${league._id || league.id}')" 
                            style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #00ff88; 
                                   color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
                
                <!-- Process Results -->
                <div style="background: rgba(255, 215, 0, 0.1); padding: 1.5rem; border-radius: 12px;">
                    <h4 style="color: #ffd700; margin-bottom: 1rem;">
                        <i class="fas fa-trophy"></i> Process Game Results
                    </h4>
                    <button onclick="window.quickLeague.settingsPanel.processResults('${league._id || league.id}')" 
                            style="padding: 0.75rem 1.5rem; background: #ffd700; 
                                   color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-calculator"></i> Auto-Calculate Week Results
                    </button>
                </div>
            </div>
        `;
    }
    
    renderAllMemberPicks(league) {
        const week = league.currentWeek || '1';
        const allPicks = league.picks?.filter(p => p.week == week) || [];
        
        if (allPicks.length === 0) {
            return '<p style="color: #94a3b8;">No picks submitted yet</p>';
        }
        
        return allPicks.map(userPicks => `
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 8px;">
                <div style="font-weight: 600; color: #6366f1; margin-bottom: 0.5rem;">
                    ${userPicks.userId?.username || userPicks.userId?.displayName || 'Unknown'}
                </div>
                <div style="display: grid; gap: 0.5rem;">
                    ${userPicks.picks.map(pick => `
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem; 
                                    background: rgba(255,255,255,0.05); border-radius: 4px;">
                            <span>${pick.gameId}</span>
                            <strong style="color: #00ff88;">${pick.pick} ${pick.pickDetails || ''}</strong>
                            <span style="color: #94a3b8;">${pick.pickType || 'spread'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
    
    renderStandingsEditor(league) {
        const standings = league.standings || [];
        
        return standings.map(standing => `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; 
                        padding: 0.75rem; background: rgba(0,0,0,0.3); border-radius: 8px;">
                <span style="flex: 1; font-weight: 600; color: white;">
                    ${standing.userId?.username || standing.userId?.displayName || 'Unknown'}
                </span>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <label style="color: #94a3b8;">W:</label>
                    <input type="number" value="${standing.wins}" 
                           data-user-id="${standing.userId?._id || standing.userId}" 
                           data-field="wins"
                           style="width: 60px; padding: 0.25rem; background: rgba(0,0,0,0.5); 
                                  border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: white;">
                    <label style="color: #94a3b8;">L:</label>
                    <input type="number" value="${standing.losses}" 
                           data-user-id="${standing.userId?._id || standing.userId}" 
                           data-field="losses"
                           style="width: 60px; padding: 0.25rem; background: rgba(0,0,0,0.5); 
                                  border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: white;">
                </div>
            </div>
        `).join('');
    }
    
    async saveStandings(leagueId) {
        const inputs = document.querySelectorAll('#standingsEditor input');
        const updates = {};
        
        inputs.forEach(input => {
            const userId = input.dataset.userId;
            const field = input.dataset.field;
            const value = parseInt(input.value) || 0;
            
            if (!updates[userId]) {
                updates[userId] = {};
            }
            updates[userId][field] = value;
        });
        
        try {
            const response = await fetch(`/api/leagues/${leagueId}/update-standings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ standings: updates })
            });
            
            if (response.ok) {
                alert('Standings updated successfully!');
                // Reload the league
                window.quickLeague.loadLeagueView(leagueId);
            } else {
                alert('Failed to update standings');
            }
        } catch (error) {
            console.error('Error updating standings:', error);
            alert('Error updating standings');
        }
    }
    
    async processResults(leagueId) {
        if (!confirm('This will process results for all games in the current week. Continue?')) {
            return;
        }
        
        try {
            // This would fetch actual game results and update standings
            alert('Processing results... (This feature will connect to live scores API)');
        } catch (error) {
            console.error('Error processing results:', error);
        }
    }
}