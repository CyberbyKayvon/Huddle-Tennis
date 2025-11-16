// quick-league/core/PicksManager.js
export class PicksManager {
    constructor(parent) {
        this.parent = parent;
        this.currentPicks = new Map();
        this.maxPicksAllowed = null;
        this.minPicksRequired = null;
    }
    
    initialize(league) {
        if (!league) return;
        
        // Clear current picks when initializing new league
        this.currentPicks.clear();
        
        // Handle game range (e.g., "7-10" games)
        if (typeof league.gamesPerWeek === 'string' && league.gamesPerWeek.includes('-')) {
            const [min, max] = league.gamesPerWeek.split('-').map(n => parseInt(n));
            this.minPicksRequired = min;
            this.maxPicksAllowed = max;
        } else if (league.gamesPerWeek === 'all' || league.gamesPerWeek === 16) {
            this.minPicksRequired = 1;  // At least 1 pick
            this.maxPicksAllowed = 16;  // Up to all games
        } else if (league.gamesPerWeek) {
            this.minPicksRequired = league.gamesPerWeek;
            this.maxPicksAllowed = league.gamesPerWeek;
        }
    }
    
    savePickToMemory(gameId, pickData) {
        const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
        const weekOrDate = this.getWeekOrDate();
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = currentUser._id || currentUser.id;
        
        if (!leagueId || !userId) return;
        
        // Get the game element to extract all line data
        const gameElement = document.querySelector(`[data-game-id="${gameId}"]`);
        const gameInfo = gameElement?.getAttribute('data-game-info');
        let lockedLine = {};
        
        if (gameInfo) {
            try {
                const gameData = JSON.parse(gameInfo);
                // Ensure spread is stored as a number, not a string
                lockedLine = {
                    spread: parseFloat(gameData.spread),
                    total: parseFloat(gameData.total),
                    homeML: gameData.homeML,
                    awayML: gameData.awayML,
                    homeTeam: gameData.homeTeam,
                    awayTeam: gameData.awayTeam,
                    lockedAt: new Date().toISOString(),
                    gameTime: gameData.gameTime
                };
            } catch (e) {
                console.error('Error parsing game info:', e);
            }
        }
        
        // Track that this game has a pick with locked line
        const enrichedPickData = {
            ...pickData,
            lockedLine
        };
        this.currentPicks.set(gameId, enrichedPickData);
        
        // Save to localStorage for persistence - user-specific
        const picksKey = `league_picks_${leagueId}_${weekOrDate}_${userId}`;
        let allPicks = JSON.parse(localStorage.getItem(picksKey) || '{}');
        
        // If this is already submitted, don't allow changes
        if (allPicks.status === 'submitted') {
            console.log('Picks already submitted, cannot change');
            return;
        }
        
        // Save individual pick with locked line
        allPicks[gameId] = {
            ...enrichedPickData,
            gameId: gameId,
            status: 'pending',
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem(picksKey, JSON.stringify(allPicks));
        
        // Auto-save to MongoDB as draft
        this.debouncedSaveToMongoDB();
        
        this.updatePicksCount();
        this.parent.eventBus.emit('pickSaved', { gameId, pickData });
    }
    
    debouncedSaveToMongoDB = (() => {
        let timeout;
        return () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.savePicksToMongoDB();
            }, 2000); // Save after 2 seconds of inactivity
        };
    })();
    
    async savePicksToMongoDB() {
        try {
            const token = localStorage.getItem('token');
            const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
            if (!token || !leagueId) return;
            
            const picks = Array.from(this.currentPicks.entries()).map(([gameId, pickData]) => ({
                gameId,
                ...pickData
            }));
            
            const response = await fetch(`/api/leagues/${leagueId}/picks/draft`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    picks,
                    week: this.getWeekOrDate(),
                    isDraft: true
                })
            });
            
            if (!response.ok) {
                console.error('Failed to save draft picks to MongoDB');
            } else {
                console.log('Draft picks saved to MongoDB');
            }
        } catch (error) {
            console.error('Error saving picks to MongoDB:', error);
        }
    }
    
    async loadSavedPicksFromMongoDB(leagueId, weekOrDate) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return this.loadSavedPicks(); // Fall back to localStorage
            }
            
            const response = await fetch(`/api/leagues/${leagueId}/picks/draft/${weekOrDate}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.picks && data.picks.length > 0) {
                    // Load picks into memory
                    this.currentPicks.clear();
                    const picksObj = {};
                    
                    data.picks.forEach(pick => {
                        this.currentPicks.set(pick.gameId, pick);
                        picksObj[pick.gameId] = pick;
                    });
                    
                    // Update localStorage cache
                    const picksKey = `league_picks_${leagueId}_${weekOrDate}`;
                    localStorage.setItem(picksKey, JSON.stringify(picksObj));
                    
                    console.log('Loaded picks from MongoDB:', data.picks.length);
                    return picksObj;
                }
            }
            
            // Fall back to localStorage if MongoDB fails or no picks
            return this.loadSavedPicks();
            
        } catch (error) {
            console.error('Error loading picks from MongoDB:', error);
            return this.loadSavedPicks();
        }
    }
    
    loadSavedPicks() {
        const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
        const weekOrDate = this.getWeekOrDate();
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = currentUser._id || currentUser.id;
        
        if (!leagueId || !userId) return {};
        
        // Clear any picks from other users first
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`league_picks_${leagueId}_${weekOrDate}_`) && !key.endsWith(userId)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Include userId in the storage key to separate picks by user
        const picksKey = `league_picks_${leagueId}_${weekOrDate}_${userId}`;
        const savedData = JSON.parse(localStorage.getItem(picksKey) || '{}');
        
        // Load into currentPicks map
        if (savedData && typeof savedData === 'object') {
            this.currentPicks.clear();
            Object.entries(savedData).forEach(([gameId, pickData]) => {
                if (gameId !== 'status' && gameId !== 'submittedAt' && gameId !== 'weekOrDate' && gameId !== 'leagueId' && gameId !== 'picks') {
                    this.currentPicks.set(gameId, pickData);
                }
            });
        }
        
        // If submitted, return the picks array
        if (savedData.status === 'submitted' && savedData.picks) {
            const picksObj = {};
            savedData.picks.forEach(pick => {
                picksObj[pick.gameId] = pick;
            });
            return picksObj;
        }
        
        // Otherwise return the saved picks object (old format)
        return savedData;
    }
    
    removePick(gameId) {
        const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
        const weekOrDate = this.getWeekOrDate();
        
        if (!leagueId) return;
        
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = currentUser._id || currentUser.id;
        const picksKey = `league_picks_${leagueId}_${weekOrDate}_${userId}`;
        let allPicks = JSON.parse(localStorage.getItem(picksKey) || '{}');
        
        // Handle both submitted and partial picks
        if (allPicks.status === 'submitted' || allPicks.status === 'partial') {
            // If picks array exists, filter it
            if (allPicks.picks && Array.isArray(allPicks.picks)) {
                allPicks.picks = allPicks.picks.filter(p => p.gameId !== gameId);
                // Update status if needed
                if (allPicks.picks.length === 0) {
                    delete allPicks.status;
                    delete allPicks.picks;
                }
            }
        } else {
            // Old format - just delete the gameId
            delete allPicks[gameId];
        }
        
        localStorage.setItem(picksKey, JSON.stringify(allPicks));
        
        this.currentPicks.delete(gameId);
        
        // Save removal to MongoDB
        this.debouncedSaveToMongoDB();
        
        this.updatePicksCount();
        this.parent.eventBus.emit('pickRemoved', gameId);
    }
    
    handleGameSelection(gameId, selected) {
        if (selected) {
            if (this.maxPicksAllowed && this.currentPicks.size >= this.maxPicksAllowed) {
                this.parent.eventBus.emit('maxPicksReached', this.maxPicksAllowed);
                return false;
            }
            this.currentPicks.set(gameId, true);
        } else {
            this.currentPicks.delete(gameId);
            // Save removal to MongoDB
            this.debouncedSaveToMongoDB();
        }
        
        this.updatePicksCount();
        return true;
    }
    
    gatherPicks() {
        const picks = [];
        const processedGames = new Set();
        
        // Get all checked radio buttons
        const radios = document.querySelectorAll('input[type="radio"]:checked');
        
        radios.forEach(radio => {
            // Extract gameId from the radio name (handles game_, ml_, ou_ prefixes)
            let gameId = radio.name;
            let pickType = 'spread';
            
            if (radio.name.startsWith('ml_')) {
                gameId = radio.name.substring(3); // Remove 'ml_' prefix
                pickType = 'moneyline';
            } else if (radio.name.startsWith('ou_')) {
                gameId = radio.name.substring(3); // Remove 'ou_' prefix
                pickType = 'overunder';
            } else if (radio.name.startsWith('game_')) {
                gameId = radio.name.substring(5); // Remove 'game_' prefix
                pickType = 'spread';
            }
            
            // Create unique key for this game and pick type
            const uniqueKey = `${gameId}_${pickType}`;
            
            // Skip if we already processed this game/type combo
            if (processedGames.has(uniqueKey)) {
                return;
            }
            
            const gameTime = radio.getAttribute('data-game-time');
            
            // Skip if game is locked
            if (gameTime && !this.canEditPick(gameTime)) {
                console.log(`Skipping locked game: ${gameId}`);
                return;
            }
            
            // Get game info from the DOM
            const gameElement = radio.closest('[data-game-id]') || radio.closest('div[style*="background"]');
            const gameDataAttr = gameElement?.getAttribute('data-game-info');
            let gameInfo = {};
            
            // Parse the game data to get all line information
            if (gameDataAttr) {
                try {
                    gameInfo = JSON.parse(gameDataAttr);
                } catch (e) {
                    console.error('Error parsing game data:', e);
                }
            }
            
            // Get the locked line data with full details - ensure numbers are parsed
            const lockedLine = {
                spread: parseFloat(radio.getAttribute('data-spread') || gameInfo.spread),
                moneyline: radio.getAttribute('data-ml') || gameInfo.homeML || gameInfo.awayML,
                total: parseFloat(radio.getAttribute('data-total') || gameInfo.total),
                homeTeam: gameInfo.homeTeam,
                awayTeam: gameInfo.awayTeam,
                lockedAt: new Date().toISOString(),
                gameTime: gameInfo.gameTime || radio.getAttribute('data-game-time')
            };
            
            picks.push({
                gameId: gameId,
                pick: radio.value,
                pickType: pickType,
                betType: pickType,  // Add betType field for backend validation
                gameInfo: gameInfo,
                gameTime: gameTime,
                lockedLine: lockedLine
            });
            
            processedGames.add(uniqueKey);
        });
        
        return picks;
    }
    
    validatePicks(picks, isPartial = false) {
        if (!picks || picks.length === 0) {
            this.parent.eventBus.emit('validationError', 'No picks selected');
            return false;
        }
        
        // For partial submissions, just check max limit
        if (isPartial) {
            if (this.maxPicksAllowed && picks.length > this.maxPicksAllowed) {
                this.parent.eventBus.emit('validationError', `Maximum ${this.maxPicksAllowed} picks allowed`);
                return false;
            }
            return true;
        }
        
        // For final submissions, check min requirement
        // For exact game requirements
        if (this.minPicksRequired && this.minPicksRequired === this.maxPicksAllowed) {
            if (picks.length !== this.minPicksRequired) {
                this.parent.eventBus.emit('validationError', `Exactly ${this.minPicksRequired} picks required`);
                return false;
            }
        } else {
            // For ranges or flexible requirements
            if (this.minPicksRequired && picks.length < this.minPicksRequired) {
                this.parent.eventBus.emit('validationError', `Minimum ${this.minPicksRequired} picks required`);
                return false;
            }
            
            if (this.maxPicksAllowed && picks.length > this.maxPicksAllowed) {
                this.parent.eventBus.emit('validationError', `Maximum ${this.maxPicksAllowed} picks allowed`);
                return false;
            }
        }
        
        return true;
    }
    
    async submitPicks() {
        const picks = this.gatherPicks();
        const existingPicks = await this.getExistingSubmittedPicks();
        
        // Check if this is a partial submission (less than min required)
        const isPartial = picks.length < (this.minPicksRequired || 1);
        
        // Merge with existing picks if any
        const mergedPicks = this.mergePicksWithExisting(picks, existingPicks);
        
        // Add user ID to each pick for tracking
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        mergedPicks.forEach(pick => {
            pick.userId = currentUser._id || currentUser.id;
            pick.username = currentUser.username;
        });
        
        if (!this.validatePicks(mergedPicks, isPartial)) {
            return false;
        }
        
        const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
        const weekOrDate = this.getWeekOrDate();
        const token = localStorage.getItem('token');
        
        if (!token) {
            this.parent.eventBus.emit('submitError', 'Please login to submit picks');
            return false;
        }
        
        try {
            const response = await fetch(`/api/leagues/${leagueId}/picks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    picks: mergedPicks,
                    week: this.parent.activeLeague?.sport === 'MLB' ? undefined : weekOrDate,
                    date: this.parent.activeLeague?.sport === 'MLB' ? weekOrDate : undefined,
                    isDraft: false, // Final submission
                    isPartial: isPartial // Flag for partial submission
                })
            });
            
            if (response.ok) {
                // Mark as submitted in localStorage
                const picksKey = `league_picks_${leagueId}_${weekOrDate}`;
                const submittedPicks = {
                    picks: mergedPicks,
                    status: isPartial ? 'partial' : 'submitted',
                    submittedAt: new Date().toISOString(),
                    weekOrDate: weekOrDate,
                    leagueId: leagueId,
                    isPartial: isPartial
                };
                localStorage.setItem(picksKey, JSON.stringify(submittedPicks));
                
                // Clear draft from MongoDB
                this.currentPicks.clear();
                
                const message = isPartial ? 
                    `${mergedPicks.length} pick${mergedPicks.length !== 1 ? 's' : ''} saved! Remember to submit at least ${Math.max(0, (this.minPicksRequired || 1) - mergedPicks.length)} more before games lock.` :
                    'All picks submitted successfully!';
                    
                this.parent.eventBus.emit(isPartial ? 'picksPartiallySubmitted' : 'picksSubmitted', mergedPicks);
                alert(message);
                return true;
            } else {
                const error = await response.json();
                this.parent.eventBus.emit('submitError', error.error || 'Failed to submit picks');
                return false;
            }
        } catch (error) {
            console.error('Error submitting picks:', error);
            this.parent.eventBus.emit('submitError', 'Network error submitting picks');
            return false;
        }
    }
    
    async getExistingSubmittedPicks() {
        const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
        const weekOrDate = this.getWeekOrDate();
        const picksKey = `league_picks_${leagueId}_${weekOrDate}`;
        const savedData = JSON.parse(localStorage.getItem(picksKey) || '{}');
        
        if (savedData.status === 'partial' || savedData.status === 'submitted') {
            return savedData.picks || [];
        }
        return [];
    }
    
    mergePicksWithExisting(newPicks, existingPicks) {
        const picksMap = new Map();
        
        // Add existing picks first
        existingPicks.forEach(pick => {
            // Only keep if game hasn't locked yet
            if (this.canEditPick(pick.gameTime)) {
                picksMap.set(pick.gameId, pick);
            }
        });
        
        // Override with new picks
        newPicks.forEach(pick => {
            picksMap.set(pick.gameId, pick);
        });
        
        return Array.from(picksMap.values());
    }
    
    updatePicksCount() {
        // Count actual radio buttons that are checked
        const checkedRadios = document.querySelectorAll('input[type="radio"]:checked');
        const uniqueGames = new Set();
        
        checkedRadios.forEach(radio => {
            const gameId = radio.name.replace(/^(game_|ml_|ou_)/, '');
            uniqueGames.add(gameId);
        });
        
        const count = uniqueGames.size;
        
        // Update the counter in the UI
        const counter = document.getElementById('picksCounter');
        if (counter) {
            counter.textContent = count;
        }
        
        // Update submit button text
        const submitBtn = document.querySelector('[data-action="submit-picks"]');
        if (submitBtn) {
            let buttonText = `Submit Picks (${count}`;
            if (this.maxPicksAllowed) {
                buttonText += `/${this.maxPicksAllowed})`;
            } else {
                buttonText += ' selected)';
            }
            submitBtn.textContent = buttonText;
        }
        
        this.parent.eventBus.emit('picksCountUpdated', {
            current: count,
            min: this.minPicksRequired,
            max: this.maxPicksAllowed
        });
    }
    
    getPicksSummary() {
        const savedPicks = this.loadSavedPicks();
        const summary = [];
        
        Object.entries(savedPicks).forEach(([gameId, pickData]) => {
            if (gameId !== 'status' && gameId !== 'submittedAt' && gameId !== 'weekOrDate' && gameId !== 'picks' && gameId !== 'leagueId') {
                summary.push({
                    gameId,
                    ...pickData
                });
            }
        });
        
        return summary;
    }
    
    canEditPick(gameTime) {
        const now = new Date();
        const gameStart = new Date(gameTime);
        
        // Each game locks 2 minutes before its start time
        const lockTime = new Date(gameStart.getTime() - 2 * 60 * 1000);
        
        return now < lockTime;
    }
    
    getWeekOrDate() {
        if (this.parent.activeLeague?.sport === 'MLB') {
            return this.parent.selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
        }
        return this.parent.selectedWeek || this.parent.currentWeek;
    }
    
    clearCurrentPicks() {
        this.currentPicks.clear();
        
        // Clear from localStorage too
        const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
        const weekOrDate = this.getWeekOrDate();
        if (leagueId) {
            const picksKey = `league_picks_${leagueId}_${weekOrDate}`;
            localStorage.removeItem(picksKey);
        }
        
        this.updatePicksCount();
    }
    
    async restorePicksToUI() {
        const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
        const weekOrDate = this.getWeekOrDate();
        
        if (!leagueId) return;
        
        // Try to load from MongoDB first
        const savedPicks = await this.loadSavedPicksFromMongoDB(leagueId, weekOrDate);
        
        // Restore all saved picks including partial submissions
        if (savedPicks && (savedPicks.status === 'submitted' || savedPicks.status === 'partial' || Object.keys(savedPicks).length > 0)) {
            // Handle new format with picks array
            if (savedPicks.picks && Array.isArray(savedPicks.picks)) {
                savedPicks.picks.forEach(pickData => {
                    if (pickData && pickData.pick && pickData.gameId) {
                        // Only restore if game hasn't locked
                        if (this.canEditPick(pickData.gameTime)) {
                            const radio = document.querySelector(`input[type="radio"][name*="${pickData.gameId}"][value="${pickData.pick}"]`);
                            if (radio) {
                                radio.checked = true;
                                this.currentPicks.set(pickData.gameId, pickData);
                                
                                // Show locked line indicator if line has changed
                                if (pickData.lockedLine) {
                                    const gameElement = radio.closest('[data-game-id]');
                                    if (gameElement) {
                                        // Add visual indicator for locked line
                                        const lockedIndicator = document.createElement('div');
                                        lockedIndicator.style.cssText = 'background: rgba(255, 193, 7, 0.2); border: 1px solid #ffc107; padding: 4px 8px; border-radius: 4px; margin-top: 8px; font-size: 0.75rem; color: #ffc107;';
                                        lockedIndicator.innerHTML = `📌 Line locked at: ${pickData.lockedLine.spread || pickData.lockedLine.total || pickData.lockedLine.moneyline}`;
                                        const existingIndicator = gameElement.querySelector('.locked-line-indicator');
                                        if (!existingIndicator) {
                                            lockedIndicator.className = 'locked-line-indicator';
                                            gameElement.appendChild(lockedIndicator);
                                        }
                                    }
                                }
                            }
                        } else {
                            // Show locked pick as disabled
                            const radio = document.querySelector(`input[type="radio"][name*="${pickData.gameId}"][value="${pickData.pick}"]`);
                            if (radio) {
                                radio.checked = true;
                                radio.disabled = true;
                                // Add visual indicator that this pick is locked
                                const gameElement = radio.closest('[data-game-id]');
                                if (gameElement) {
                                    gameElement.style.opacity = '0.7';
                                    gameElement.style.border = '1px solid #ffc107';
                                }
                            }
                        }
                    }
                });
            } else {
                // Handle old format
                Object.entries(savedPicks).forEach(([gameId, pickData]) => {
                    // Skip metadata fields
                    if (gameId === 'status' || gameId === 'submittedAt' || gameId === 'weekOrDate' || gameId === 'leagueId' || gameId === 'picks' || gameId === 'isPartial') {
                        return;
                    }
                    
                    if (pickData && pickData.pick) {
                        const radio = document.querySelector(`input[type="radio"][name*="${gameId}"][value="${pickData.pick}"]`);
                        if (radio) {
                            radio.checked = true;
                            this.currentPicks.set(gameId, pickData);
                        }
                    }
                });
            }
            
            // Show status message if partial
            if (savedPicks.status === 'partial') {
                const picksCount = savedPicks.picks ? savedPicks.picks.length : Object.keys(savedPicks).length - 5;
                setTimeout(() => {
                    const container = document.getElementById('gamesForPicks');
                    if (container) {
                        const notice = document.createElement('div');
                        notice.style.cssText = 'padding: 10px; background: rgba(255, 193, 7, 0.2); border: 1px solid #ffc107; border-radius: 8px; margin-bottom: 15px; color: #ffc107;';
                        notice.innerHTML = `⚠️ You have ${picksCount} picks saved. Remember to submit at least ${this.minPicksRequired - picksCount} more before games lock!`;
                        container.insertBefore(notice, container.firstChild);
                    }
                }, 100);
            }
        }
        
        this.updatePicksCount();
    }
    
    exportPicks() {
        const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
        if (!leagueId) return null;
        
        const allPicks = {};
        const keys = Object.keys(localStorage);
        const prefix = `league_picks_${leagueId}_`;
        
        keys.forEach(key => {
            if (key.startsWith(prefix)) {
                const weekOrDate = key.replace(prefix, '');
                allPicks[weekOrDate] = JSON.parse(localStorage.getItem(key));
            }
        });
        
        return allPicks;
    }
}