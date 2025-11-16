// quick-league/core/LeagueStorage.js
export class LeagueStorage {
    constructor(parent) {
        this.parent = parent;
        this.storageKey = 'all_quick_leagues';
        this.picksPrefix = 'league_picks_';
        this.messagesPrefix = 'league_messages_';
        this.standingsPrefix = 'league_standings_';
    }
    
    // League Storage
    saveLeague(league) {
        const leagues = this.getAllLeagues();
        const leagueId = league.id || league._id;
        const existingIndex = leagues.findIndex(l => (l.id || l._id) === leagueId);
        
        if (existingIndex >= 0) {
            leagues[existingIndex] = { 
                ...leagues[existingIndex], 
                ...league,
                lastUpdated: new Date().toISOString()
            };
        } else {
            leagues.push({
                ...league,
                id: leagueId,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            });
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(leagues));
        return league;
    }
    
    getAllLeagues() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch (error) {
            console.error('Error parsing leagues:', error);
            return [];
        }
    }
    
    getLeagueById(leagueId) {
        const leagues = this.getAllLeagues();
        return leagues.find(l => (l.id || l._id) === leagueId);
    }
    
    getUserLeagues(userId) {
        if (!userId) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            userId = user._id || user.id;
        }
        
        const leagues = this.getAllLeagues();
        return leagues.filter(l => 
    l.owner === userId || 
    l.owner === 'current-user' ||
    (l.membersList && Array.isArray(l.membersList) && (
        l.membersList.includes(userId) ||
        l.membersList.some(m => m._id === userId || m.id === userId || m === userId)
    ))
);
    }
    
    getPublicLeagues() {
    const leagues = this.getAllLeagues();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;
    
    // Return public leagues that user is not already in
    return leagues.filter(l => 
        l.type === 'public' && 
        (!l.membersList || !Array.isArray(l.membersList) || !l.membersList.some(m => 
            m === userId || m._id === userId || m.id === userId
        ))
    );
}
    
    deleteLeague(leagueId) {
        const leagues = this.getAllLeagues();
        const filtered = leagues.filter(l => (l.id || l._id) !== leagueId);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
        
        // Also clear related data
        this.clearLeagueData(leagueId);
    }
    
    clearLeagueData(leagueId) {
        // Clear picks
        const picksKeys = Object.keys(localStorage).filter(key => 
            key.startsWith(`${this.picksPrefix}${leagueId}_`)
        );
        picksKeys.forEach(key => localStorage.removeItem(key));
        
        // Clear messages
        localStorage.removeItem(`${this.messagesPrefix}${leagueId}`);
        
        // Clear standings
        localStorage.removeItem(`${this.standingsPrefix}${leagueId}`);
    }
    
    clearAllLeagues() {
        localStorage.removeItem(this.storageKey);
        // Also clear related data
        this.clearAllPicks();
        this.clearAllMessages();
        this.clearAllStandings();
    }
    
    // Picks Storage
    savePicks(leagueId, weekOrDate, picks, userId = null) {
        // Include userId in key if provided for user-specific picks
        const userSuffix = userId ? `_${userId}` : '';
        const key = `${this.picksPrefix}${leagueId}_${weekOrDate}${userSuffix}`;
        localStorage.setItem(key, JSON.stringify({
            ...picks,
            userId: userId,
            lastModified: new Date().toISOString()
        }));
    }
    
    getPicks(leagueId, weekOrDate) {
        const key = `${this.picksPrefix}${leagueId}_${weekOrDate}`;
        try {
            return JSON.parse(localStorage.getItem(key) || '{}');
        } catch (error) {
            console.error('Error parsing picks:', error);
            return {};
        }
    }
    
    savePickToMemory(leagueId, weekOrDate, gameId, pickData) {
        const picks = this.getPicks(leagueId, weekOrDate);
        picks[gameId] = {
            ...pickData,
            timestamp: new Date().toISOString()
        };
        this.savePicks(leagueId, weekOrDate, picks);
    }
    
    removePick(leagueId, weekOrDate, gameId) {
        const picks = this.getPicks(leagueId, weekOrDate);
        delete picks[gameId];
        this.savePicks(leagueId, weekOrDate, picks);
    }
    
    clearAllPicks() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.picksPrefix)) {
                localStorage.removeItem(key);
            }
        });
    }
    
    // Standings Storage
    saveStandings(leagueId, standings) {
        const key = `${this.standingsPrefix}${leagueId}`;
        localStorage.setItem(key, JSON.stringify({
            standings,
            lastUpdated: new Date().toISOString()
        }));
    }
    
    getStandings(leagueId) {
        const key = `${this.standingsPrefix}${leagueId}`;
        try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            return data.standings || [];
        } catch (error) {
            console.error('Error parsing standings:', error);
            return [];
        }
    }
    
    clearAllStandings() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.standingsPrefix)) {
                localStorage.removeItem(key);
            }
        });
    }
    
    // Messages Storage
    saveMessages(leagueId, messages) {
        const key = `${this.messagesPrefix}${leagueId}`;
        // Keep only last 100 messages
        const recentMessages = messages.slice(-100);
        localStorage.setItem(key, JSON.stringify(recentMessages));
    }
    
    getMessages(leagueId) {
        const key = `${this.messagesPrefix}${leagueId}`;
        try {
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch (error) {
            console.error('Error parsing messages:', error);
            return [];
        }
    }
    
    addMessage(leagueId, message) {
        const messages = this.getMessages(leagueId);
        messages.push({
            ...message,
            id: Date.now().toString(),
            timestamp: new Date().toISOString()
        });
        this.saveMessages(leagueId, messages);
        return messages;
    }
    
    clearAllMessages() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.messagesPrefix)) {
                localStorage.removeItem(key);
            }
        });
    }
    
    // User Preferences
    saveUserPreferences(prefs) {
        localStorage.setItem('quick_league_prefs', JSON.stringify({
            ...prefs,
            lastUpdated: new Date().toISOString()
        }));
    }
    
    getUserPreferences() {
        try {
            return JSON.parse(localStorage.getItem('quick_league_prefs') || '{}');
        } catch (error) {
            console.error('Error parsing preferences:', error);
            return {};
        }
    }
    
    // Cart Storage (for AI tools)
    saveCart(cart) {
        localStorage.setItem('aiToolsCart', JSON.stringify(cart));
    }
    
    getCart() {
        try {
            return JSON.parse(localStorage.getItem('aiToolsCart') || '[]');
        } catch (error) {
            console.error('Error parsing cart:', error);
            return [];
        }
    }
    
    addToCart(item) {
        const cart = this.getCart();
        const existingIndex = cart.findIndex(i => i.gameId === item.gameId);
        
        if (existingIndex >= 0) {
            cart[existingIndex] = { ...cart[existingIndex], ...item };
        } else {
            cart.push(item);
        }
        
        this.saveCart(cart);
        return cart;
    }
    
    removeFromCart(gameId) {
        const cart = this.getCart();
        const filtered = cart.filter(item => item.gameId !== gameId);
        this.saveCart(filtered);
        return filtered;
    }
    
    clearCart() {
        localStorage.removeItem('aiToolsCart');
    }
    
    // Migration helpers
    exportData() {
        return {
            leagues: this.getAllLeagues(),
            picks: this.getAllPicks(),
            messages: this.getAllMessages(),
            standings: this.getAllStandings(),
            preferences: this.getUserPreferences(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }
    
    importData(data) {
        try {
            if (data.leagues) {
                localStorage.setItem(this.storageKey, JSON.stringify(data.leagues));
            }
            if (data.picks) {
                Object.entries(data.picks).forEach(([key, value]) => {
                    localStorage.setItem(key, JSON.stringify(value));
                });
            }
            if (data.messages) {
                Object.entries(data.messages).forEach(([key, value]) => {
                    localStorage.setItem(key, JSON.stringify(value));
                });
            }
            if (data.standings) {
                Object.entries(data.standings).forEach(([key, value]) => {
                    localStorage.setItem(key, JSON.stringify(value));
                });
            }
            if (data.preferences) {
                this.saveUserPreferences(data.preferences);
            }
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
    
    getAllPicks() {
        const picks = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.picksPrefix)) {
                try {
                    picks[key] = JSON.parse(localStorage.getItem(key));
                } catch (error) {
                    console.error(`Error parsing picks for ${key}:`, error);
                }
            }
        });
        return picks;
    }
    
    getAllMessages() {
        const messages = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.messagesPrefix)) {
                try {
                    messages[key] = JSON.parse(localStorage.getItem(key));
                } catch (error) {
                    console.error(`Error parsing messages for ${key}:`, error);
                }
            }
        });
        return messages;
    }
    
    getAllStandings() {
        const standings = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.standingsPrefix)) {
                try {
                    standings[key] = JSON.parse(localStorage.getItem(key));
                } catch (error) {
                    console.error(`Error parsing standings for ${key}:`, error);
                }
            }
        });
        return standings;
    }
    
    // Storage size management
    getStorageSize() {
        let size = 0;
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                size += localStorage[key].length + key.length;
            }
        }
        return (size / 1024).toFixed(2) + ' KB';
    }
    
    cleanup() {
        // Remove old data (older than 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        // Clean up old leagues
        const leagues = this.getAllLeagues();
        const activeLeagues = leagues.filter(l => {
            const lastUpdated = new Date(l.lastUpdated || l.createdAt);
            return lastUpdated > thirtyDaysAgo;
        });
        
        if (activeLeagues.length < leagues.length) {
            localStorage.setItem(this.storageKey, JSON.stringify(activeLeagues));
        }
    }
}