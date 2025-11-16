// quick-league/core/LeagueManager.js
export class LeagueManager {
    constructor(parent) {
        this.parent = parent;
        this.userLeagues = [];
        this.availableLeagues = [];
    }
    
    async loadUserLeagues() {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user._id || user.id || 'demo-user';
            
            // Load from localStorage first for immediate display
            const localLeagues = this.parent.storage.getUserLeagues(userId);
            this.userLeagues = localLeagues;
            
            // Then try server
            if (token) {
                const response = await fetch('/api/leagues/user', {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'x-user-id': userId
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.userLeagues = this.mergeLeagues(localLeagues, data.leagues || []);
                    
                    // Update local storage with server data
                    this.userLeagues.forEach(league => {
                        this.parent.storage.saveLeague(league);
                    });
                }
            }
            
            console.log(`Loaded ${this.userLeagues.length} user leagues`);
            return this.userLeagues;
        } catch (error) {
            console.error('Error loading leagues:', error);
            // Fallback to local leagues
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user._id || user.id || 'demo-user';
            this.userLeagues = this.parent.storage.getUserLeagues(userId);
            return this.userLeagues;
        }
    }
    
    async loadAvailableLeagues() {
        try {
            const token = localStorage.getItem('token');
            
            // Load local leagues first
            this.availableLeagues = this.parent.storage.getPublicLeagues();
            
            if (token) {
                const response = await fetch('/api/leagues/public', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.availableLeagues = data.leagues || [];
                    
                    // Save to local storage
                    this.availableLeagues.forEach(league => {
                        this.parent.storage.saveLeague(league);
                    });
                }
            }
            
            return this.availableLeagues;
        } catch (error) {
            console.error('Error loading available leagues:', error);
            this.availableLeagues = this.parent.storage.getPublicLeagues();
            return this.availableLeagues;
        }
    }
    
    async createLeague(leagueData) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');
        const leagueCode = this.generateLeagueCode();
        const leagueId = this.generateLeagueId();
        
        const league = {
            ...leagueData,
            id: leagueId,
            _id: leagueId,
            code: leagueCode,
            owner: user._id || user.id || 'current-user',
            members: 1, // Start with 1 member (the creator)
            membersList: [user._id || user.id || 'current-user'],
            createdAt: new Date().toISOString(),
            currentWeek: leagueData.startWeek || this.parent.currentWeek || 1,
            week: leagueData.startWeek || this.parent.currentWeek || 1,
            pot: (leagueData.entryFee || 0) * (leagueData.members || 1),
            standings: [],
            status: 'open',
            joinable: true
        };
        
        try {
            if (token) {
                const response = await fetch('/api/leagues/create', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...league,
                        week: league.currentWeek
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    // Update league with server response
                    league.id = data.leagueId || league.id;
                    league._id = data.leagueId || league._id;
                    league.code = data.code || league.code;
                }
            }
        } catch (error) {
            console.error('Error creating league on server:', error);
            // Continue with local creation
        }
        
        // Save locally
        this.parent.storage.saveLeague(league);
        this.userLeagues.push(league);
        
        // Emit event
        this.parent.eventBus.emit('leagueCreated', league);
        
        return league;
    }
    
    async joinLeague(leagueId) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user._id || user.id || 'current-user';
        const token = localStorage.getItem('token');
        
        try {
            // Find the league
            let league = this.availableLeagues.find(l => (l.id || l._id) === leagueId) ||
                        this.parent.storage.getLeagueById(leagueId);
            
            if (!league) {
                throw new Error('League not found');
            }
            
            // Check if already a member
            if (league.membersList && league.membersList.includes(userId)) {
                throw new Error('Already a member of this league');
            }
            
            // Try server first
            if (token) {
                const response = await fetch(`/api/leagues/${leagueId}/join`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to join league');
                }
            }
            
            // Update local league
            league.members = (league.members || 0) + 1;
            if (!league.membersList) league.membersList = [];
            league.membersList.push(userId);
            league.pot = (league.entryFee || 0) * league.members;
            
            // Update joinable status
            if (league.members >= league.maxMembers) {
                league.joinable = false;
            }
            
            this.parent.storage.saveLeague(league);
            
            // Move from available to user leagues
            this.availableLeagues = this.availableLeagues.filter(l => (l.id || l._id) !== leagueId);
            this.userLeagues.push(league);
            
            this.parent.eventBus.emit('leagueJoined', league);
            
            return league;
        } catch (error) {
            console.error('Error joining league:', error);
            throw error;
        }
    }
    
    async joinPrivateLeague(code) {
        const token = localStorage.getItem('token');
        const upperCode = code.toUpperCase();
        
        try {
            if (token) {
                const response = await fetch(`/api/leagues/join-by-code`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ code: upperCode })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    await this.loadUserLeagues(); // Reload leagues
                    return data.leagueId;
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Invalid league code');
                }
            }
            
            // Check local leagues
            const leagues = this.parent.storage.getAllLeagues();
            const league = leagues.find(l => l.code === upperCode);
            
            if (league) {
                return await this.joinLeague(league.id || league._id);
            }
            
            throw new Error('Invalid league code');
        } catch (error) {
            console.error('Error joining private league:', error);
            throw error;
        }
    }
    
    async loadLeagueDetails(leagueId) {
        try {
            const token = localStorage.getItem('token');
            
            if (token) {
                const response = await fetch(`/api/leagues/${leagueId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const league = data.league;
                    
                    // Update local storage
                    this.parent.storage.saveLeague(league);
                    
                    return league;
                }
            }
        } catch (error) {
            console.error('Error loading league details:', error);
        }
        
        // Fallback to local
        return this.parent.storage.getLeagueById(leagueId);
    }
    
    async initializeLeagueProgress(leagueId) {
        const league = this.parent.storage.getLeagueById(leagueId);
        if (!league) return;
        
        league.seasonProgress = {
            gamesPlayed: 0,
            totalGames: league.duration * (league.gamesPerWeek === 'all' ? 16 : 
                        typeof league.gamesPerWeek === 'string' ? 
                        parseInt(league.gamesPerWeek.split('-')[1] || league.gamesPerWeek) : 
                        league.gamesPerWeek),
            weeksCompleted: 0,
            isActive: true
        };
        
        this.parent.storage.saveLeague(league);
        
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch(`/api/leagues/${leagueId}/initialize`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Error initializing league:', error);
        }
    }
    
    generateLeagueCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Ensure code is unique
        const existingCodes = this.parent.storage.getAllLeagues().map(l => l.code);
        if (existingCodes.includes(code)) {
            return this.generateLeagueCode(); // Recursive call for new code
        }
        
        return code;
    }
    
    generateLeagueId() {
        // Generate a MongoDB-compatible ObjectId (24 hex characters)
        const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
        const machineId = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
        const processId = Math.floor(Math.random() * 65536).toString(16).padStart(4, '0');
        const counter = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
        return timestamp + machineId + processId + counter;
    }
    
    mergeLeagues(local, server) {
        const merged = new Map();
        
        // Add local leagues first
        local.forEach(league => {
            const id = league.id || league._id;
            merged.set(id, league);
        });
        
        // Merge or add server leagues
        server.forEach(serverLeague => {
            const id = serverLeague.id || serverLeague._id;
            if (merged.has(id)) {
                // Merge with priority to server data
                merged.set(id, { ...merged.get(id), ...serverLeague });
            } else {
                merged.set(id, serverLeague);
            }
        });
        
        return Array.from(merged.values());
    }
    
    clearAllLeagues() {
        this.parent.storage.clearAllLeagues();
        this.userLeagues = [];
        this.availableLeagues = [];
        this.parent.eventBus.emit('leaguesCleared');
    }
    
    async createSampleLeagues() {
        // Check if we already have leagues
        if (this.availableLeagues.length > 0 || this.userLeagues.length > 0) {
            return;
        }
        
        const sampleLeagues = [
            {
                name: 'Sunday Sweats',
                type: 'public',
                sport: 'NFL',
                betTypes: ['spread'],
                duration: 18,
                gamesPerWeek: 'all',
                maxMembers: 100,
                entryFee: 0,
                scoringSystem: 'standard',
                members: Math.floor(Math.random() * 30) + 20
            },
            {
                name: 'Sharp Shooters Elite',
                type: 'public',
                sport: 'NFL',
                betTypes: ['spread', 'moneyline'],
                duration: 6,
                gamesPerWeek: '7-10',
                maxMembers: 50,
                entryFee: 25,
                scoringSystem: 'confidence',
                members: Math.floor(Math.random() * 20) + 10
            },
            {
                name: 'Primetime Picks',
                type: 'public',
                sport: 'NFL',
                betTypes: ['spread', 'overunder'],
                duration: 4,
                gamesPerWeek: 3,
                maxMembers: 20,
                entryFee: 10,
                scoringSystem: 'standard',
                members: Math.floor(Math.random() * 10) + 5
            }
        ];
        
        for (const leagueData of sampleLeagues) {
            const league = await this.createLeague(leagueData);
            // Move to available leagues since these are samples
            this.userLeagues = this.userLeagues.filter(l => (l.id || l._id) !== (league.id || league._id));
            this.availableLeagues.push(league);
        }
    }
}