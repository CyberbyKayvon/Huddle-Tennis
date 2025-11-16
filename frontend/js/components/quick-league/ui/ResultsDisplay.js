// quick-league/ui/ResultsDisplay.js
export class ResultsDisplay {
    constructor(parent) {
        this.parent = parent;
    }
    
    render() {
        const league = this.parent.activeLeague;
        const week = this.parent.selectedWeek;
        
        return `
            <div class="results-section" style="background: rgba(26, 26, 46, 0.95); border-radius: 15px; padding: 20px;">
                <h3 style="color: #00ff88; margin-bottom: 20px;">Week ${week} Results</h3>
                <div id="resultsContainer">
                    ${this.renderWeekResults()}
                </div>
            </div>
        `;
    }
    
    async renderWeekResults() {
        const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
        const week = this.parent.selectedWeek;
        
        try {
            // Fetch picks with results
            const response = await fetch(`/api/leagues/${leagueId}/picks-results/${week}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (!response.ok) throw new Error('Failed to fetch results');
            
            const data = await response.json();
            
            return data.results.map(userResult => `
                <div style="margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 10px;">
                    <h4 style="color: #6366f1; margin-bottom: 10px;">${userResult.user}</h4>
                    <div style="display: grid; gap: 10px;">
                        ${userResult.picks.map(pick => this.renderPickResult(pick)).join('')}
                    </div>
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <span style="color: #00ff88;">Wins: ${userResult.summary.wins}</span>
                        <span style="color: #ff4444; margin-left: 15px;">Losses: ${userResult.summary.losses}</span>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading results:', error);
            return '<p style="color: #94a3b8;">No results available yet</p>';
        }
    }
    
    renderPickResult(pick) {
        const lockedSpread = pick.lockedLine?.spread || 'N/A';
        const resultColor = pick.result === 'win' ? '#00ff88' : pick.result === 'loss' ? '#ff4444' : '#ffd700';
        
        return `
            <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                <span>${pick.gameId}: ${pick.pick}</span>
                <span style="color: #94a3b8;">Locked: ${lockedSpread > 0 ? '+' : ''}${lockedSpread}</span>
                <span style="color: ${resultColor}; font-weight: 600;">${pick.result.toUpperCase()}</span>
            </div>
        `;
    }
}