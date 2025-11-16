// quick-league/QuickLeague.js
import { LeagueManager } from './core/LeagueManager.js';
import { LeagueRenderer } from './core/LeagueRenderer.js';
import { PicksManager } from './core/PicksManager.js';
import { GamesLoader } from './core/GamesLoader.js';
import { StandingsManager } from './core/StandingsManager.js';
import { LeagueStorage } from './core/LeagueStorage.js';
import { EventBus } from './utils/EventBus.js';
import { CONSTANTS } from './utils/Constants.js';

export class QuickLeague {
    constructor() {
        // Core state
        this.currentView = 'browse';
        this.activeLeague = null;
        this.selectedWeek = this.getCurrentNFLWeek();
        this.selectedDate = new Date();
        this.selectedDate.setHours(0, 0, 0, 0);
        this.activeTab = 'picks';
        this.currentWeek = this.getCurrentNFLWeek();
        this.isPreviewMode = false;
        
        // League configuration
        this.createLeagueForm = {
            name: '',
            type: 'public',
            sport: 'NFL',
            betTypes: ['spread'],
            duration: 18,
            gamesPerWeek: 'all',
            scoringSystem: 'standard',
            maxMembers: 20,
            entryFee: 0,
            paymentType: 'free'
        };
        
        // Initialize modules
        this.constants = CONSTANTS;
        this.eventBus = new EventBus();
        this.storage = new LeagueStorage(this);
        this.leagueManager = new LeagueManager(this);
        this.renderer = new LeagueRenderer(this);
        this.picksManager = new PicksManager(this);
        this.gamesLoader = new GamesLoader(this);
        this.standingsManager = new StandingsManager(this);
        
        // User leagues arrays
        this.userLeagues = [];
        this.availableLeagues = [];
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Auto-save to MongoDB periodically
        this.hasUnsavedChanges = false;
        this.startAutoSave();
    }
    
    startAutoSave() {
        // Save state to MongoDB every 30 seconds if there are changes
        setInterval(() => {
            if (this.hasUnsavedChanges) {
                this.saveStateToMongoDB();
                this.hasUnsavedChanges = false;
            }
        }, 30000);
    }
    
    async saveStateToMongoDB() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const state = {
                currentView: this.currentView,
                activeLeagueId: this.activeLeague?.id || this.activeLeague?._id || null,
                selectedWeek: parseInt(this.selectedWeek) || 1,
                activeTab: this.activeTab,
                currentWeek: parseInt(this.currentWeek) || 1,
                timestamp: Date.now()
            };
            
            // Save user preferences to MongoDB
            await fetch('/api/users/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quickLeagueState: state })
            });
            
            // Also keep localStorage as cache
            localStorage.setItem('quickLeagueState', JSON.stringify(state));
            
        } catch (error) {
            console.error('Error saving state to MongoDB:', error);
        }
    }
    
    saveState() {
        try {
            const state = {
                currentView: this.currentView,
                activeLeagueId: this.activeLeague?.id || this.activeLeague?._id || null,
                selectedWeek: parseInt(this.selectedWeek) || 1,
                activeTab: this.activeTab,
                currentWeek: parseInt(this.currentWeek) || 1,
                timestamp: Date.now()
            };
            localStorage.setItem('quickLeagueState', JSON.stringify(state));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }
    
    async restoreStateFromMongoDB() {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!token || !user._id) {
                // Fall back to localStorage if not logged in
                console.log('No auth token or user, using localStorage');
                this.restoreState();
                return;
            }
            
            // Try to get state from MongoDB first
            const response = await fetch('/api/users/preferences', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.quickLeagueState) {
                    this.applyState(data.quickLeagueState);
                    
                    // Update localStorage cache
                    localStorage.setItem('quickLeagueState', JSON.stringify(data.quickLeagueState));
                    return;
                }
            }
            
            // Fall back to localStorage if MongoDB fails
            this.restoreState();
            
        } catch (error) {
            console.error('Error restoring state from MongoDB:', error);
            this.restoreState();
        }
    }
    
    restoreState() {
        try {
            const savedState = localStorage.getItem('quickLeagueState');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.applyState(state);
            }
        } catch (error) {
            console.error('Error restoring state:', error);
            // Reset to defaults on error
            this.currentView = 'browse';
            this.selectedWeek = this.getCurrentNFLWeek();
            this.currentWeek = this.getCurrentNFLWeek();
            this.activeTab = 'picks';
        }
    }
    
    applyState(state) {
        // Validate and apply state
        this.currentView = ['browse', 'my-leagues', 'live-scores', 'league'].includes(state.currentView) 
            ? state.currentView : 'browse';
            
        this.selectedWeek = parseInt(state.selectedWeek);
        if (isNaN(this.selectedWeek) || this.selectedWeek < 1 || this.selectedWeek > 18) {
            this.selectedWeek = this.getCurrentNFLWeek();
        }
        
        this.currentWeek = parseInt(state.currentWeek);
        if (isNaN(this.currentWeek) || this.currentWeek < 1 || this.currentWeek > 18) {
            this.currentWeek = this.getCurrentNFLWeek();
        }
        
        this.activeTab = ['picks', 'results', 'standings', 'chat'].includes(state.activeTab) 
            ? state.activeTab : 'picks';
        
        // Restore active league if it exists
        if (state.activeLeagueId) {
            const league = this.storage.getLeagueById(state.activeLeagueId);
            if (league) {
                this.activeLeague = league;
            } else {
                // Store for later loading
                this.pendingLeagueId = state.activeLeagueId;
            }
        }
    }
    
    async initialize() {
        try {
            // Restore saved state from MongoDB first
            await this.restoreStateFromMongoDB();
            
            await this.leagueManager.loadUserLeagues();
            await this.leagueManager.loadAvailableLeagues();
            
            // Don't create sample leagues on every init
            // Only if explicitly needed for demo
            
            this.userLeagues = this.leagueManager.userLeagues;
            this.availableLeagues = this.leagueManager.availableLeagues;
            
            if (this.currentView === 'league' && this.activeLeague) {
                // Don't load games here if we're on picks tab - let the tab render handle it
                if (this.activeTab === 'picks') {
                    // Just ensure picks are initialized
                    this.picksManager.initialize(this.activeLeague);
                } else {
                    await this.loadLeagueGames();
                }
                
                // Load picks from MongoDB after a short delay
                setTimeout(async () => {
                    if (this.picksManager.loadSavedPicksFromMongoDB) {
                        await this.picksManager.loadSavedPicksFromMongoDB(
                            this.activeLeague.id || this.activeLeague._id, 
                            this.selectedWeek
                        );
                        // Only restore to UI if we're on picks tab and games are loaded
                        if (this.activeTab === 'picks' && document.getElementById('gamesForPicks')) {
                            this.picksManager.restorePicksToUI();
                        }
                    }
                }, 500);
            }
            
            // Don't save immediately on init, wait for user changes
            // this.saveStateToMongoDB();
            
            // Restore pending league if we had one
            if (this.pendingLeagueId) {
                const league = this.storage.getLeagueById(this.pendingLeagueId);
                if (league) {
                    this.activeLeague = league;
                    // Ensure we're on Week 1 for 2025 season
                    this.selectedWeek = 1;
                    this.currentWeek = 1;
                    // Load saved picks from MongoDB
                    if (this.picksManager.loadSavedPicksFromMongoDB) {
                        await this.picksManager.loadSavedPicksFromMongoDB(league.id, this.selectedWeek);
                    }
                } else {
                    this.currentView = 'browse';
                }
                delete this.pendingLeagueId;
            }
            
            // Save state after successful initialization
            this.saveStateToMongoDB();
        } catch (error) {
            console.error('Error initializing Quick League:', error);
        }
    }
    
    render() {
        return this.renderer.render();
    }
    
    getCurrentNFLWeek() {
        const now = new Date();
        const year = now.getFullYear();
        
        // 2025 NFL Season - starts Sept 4, 2025
        if (year === 2025) {
            const seasonStart = new Date(2025, 8, 4); // Sept 4, 2025 (Thursday)
            
            if (now < seasonStart) {
                return 1; // Before season starts, show Week 1
            }
            
            // NFL weeks run Thursday to Wednesday
            // Week 1: Sept 4-10, 2025
            // Week 2: Sept 11-17, 2025, etc.
            const msPerWeek = 7 * 24 * 60 * 60 * 1000;
            const timeSinceStart = now - seasonStart;
            const weekNumber = Math.floor(timeSinceStart / msPerWeek) + 1;
            
            // Today is Sept 8, 2025 = still Week 1 (ends Sept 10)
            return Math.min(Math.max(1, weekNumber), 18);
        }
        
        // For other years, default calculation
        const seasonStart = new Date(year, 8, 1); // Sept 1
        if (now < seasonStart) return 1;
        
        const daysSinceStart = Math.floor((now - seasonStart) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.floor(daysSinceStart / 7) + 1;
        return Math.min(Math.max(1, weekNumber), 18);
    }
    
    formatWeekDisplay(week) {
        // No more preseason - always show regular season week
        const weekNum = parseInt(week) || 1;
        return `Week ${weekNum}`;
    }
    
    setupEventListeners() {
        // Listen for completed games from live widget
        window.addEventListener('gameCompleted', async (event) => {
            if (this.activeLeague) {
                await this.processGameResult(event.detail);
            }
        });
        
        // League events
        this.eventBus.on('leagueCreated', (league) => {
            this.activeLeague = league;
            this.currentView = 'league';
            this.hasUnsavedChanges = true;
            this.reRender();
        });
        
        this.eventBus.on('leagueJoined', (league) => {
            this.activeLeague = league;
            this.currentView = 'league';
            this.reRender();
        });
        
        this.eventBus.on('viewChanged', (view) => {
            this.currentView = view;
            this.reRender();
        });
        
        this.eventBus.on('leaguesCleared', () => {
            this.userLeagues = [];
            this.availableLeagues = [];
            this.activeLeague = null;
            this.currentView = 'browse';
            this.reRender();
        });
        
        // Picks events
        this.eventBus.on('picksSubmitted', (picks) => {
            this.activeTab = 'results';
            this.reRender();
        });
        
        this.eventBus.on('picksPartiallySubmitted', (picks) => {
            this.activeTab = 'results';
            this.reRender();
        });
        
        this.eventBus.on('picksCountUpdated', (data) => {
            const counter = document.getElementById('picksCounter');
            if (counter) {
                counter.textContent = data.current;
            }
            
            const submitBtn = document.getElementById('submitPicksButton');
            if (submitBtn) {
                let buttonText = `Submit Picks (${data.current}`;
                if (data.max && data.max !== 16) {
                    buttonText += `/${data.max})`;
                } else {
                    buttonText += ' selected)';
                }
                submitBtn.textContent = buttonText;
            }
        });
        
        this.eventBus.on('validationError', (error) => {
            alert(error);
        });
        
        this.eventBus.on('submitError', (error) => {
            alert('Error: ' + error);
        });
        
        this.eventBus.on('maxPicksReached', (max) => {
            alert(`Maximum ${max} picks allowed for this league`);
        });
    }
    
    attachAllEventListeners() {
        // View navigation
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.onclick = () => {
                this.currentView = btn.getAttribute('data-view');
                this.reRender();
            };
        });
        
        // Tab navigation
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.onclick = () => {
                this.activeTab = btn.getAttribute('data-tab');
                const leagueContent = document.getElementById('leagueContent');
                if (leagueContent) {
                    leagueContent.innerHTML = this.renderer.renderLeagueTabContent();
                    setTimeout(() => {
                        this.attachAllEventListeners();
                        if (this.activeTab === 'picks') {
                            this.loadLeagueGames();
                        }
                    }, 100);
                }
            };
        });
        
        // Week/Date navigation
        document.querySelectorAll('[data-week-change]').forEach(btn => {
            btn.onclick = () => {
                const change = parseInt(btn.getAttribute('data-week-change'));
                const currentWeek = parseInt(this.selectedWeek) || 1;
                this.selectedWeek = Math.max(1, Math.min(18, currentWeek + change));
                this.hasUnsavedChanges = true;
                this.reRender();
                this.loadLeagueGames();
            };
        });
        
        document.querySelectorAll('[data-date-change]').forEach(btn => {
            btn.onclick = () => {
                const change = parseInt(btn.getAttribute('data-date-change'));
                this.selectedDate = new Date(this.selectedDate);
                this.selectedDate.setDate(this.selectedDate.getDate() + change);
                this.reRender();
                this.loadLeagueGames();
            };
        });
        
        // Actions
        document.querySelectorAll('[data-action]').forEach(btn => {
            const action = btn.getAttribute('data-action');
            btn.onclick = async (e) => {
                e.stopPropagation();
                
                switch(action) {
                    case 'create-modal':
                        this.renderer.modals.showCreateModal();
                        break;
                    case 'join-private':
                        await this.joinPrivateLeague();
                        break;
                    case 'join-league':
                        await this.joinLeague(btn.getAttribute('data-league-id'));
                        break;
                    case 'enter-league':
                        this.enterLeague(btn.getAttribute('data-league-id'));
                        break;
                    case 'preview-league':
                        this.previewLeague(btn.getAttribute('data-league-id'));
                        break;
                    case 'back-to-list':
                        this.backToList();
                        break;
                    case 'copy-code':
                        this.copyCode(btn.getAttribute('data-code'));
                        break;
                    case 'submit-picks':
                        await this.picksManager.submitPicks();
                        break;
                    case 'send-message':
                        this.renderer.chat.sendMessage();
                        break;
                    case 'clear-all-leagues':
                        this.clearAllLeagues();
                        break;
                    case 'open-ai-store':
                        this.openAIStore();
                        break;
                    case 'refresh-leagues':
                        await this.refreshLeagues();
                        break;
                }
            };
        });
        
        // League selector for live scores
        const leagueSelector = document.getElementById('leagueScoreSelector');
        if (leagueSelector) {
            leagueSelector.onchange = (e) => {
                this.renderer.liveScores.loadLeagueScores(e.target.value);
            };
        }
        
        // Chat input
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    this.renderer.chat.sendMessage();
                }
            };
        }
        
        // Radio buttons for picks - Updated to properly track selections
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.onclick = (e) => {
                const gameId = radio.name.replace(/^(game_|ml_|ou_)/, '');
                const pickType = radio.name.startsWith('ml_') ? 'moneyline' : 
                                radio.name.startsWith('ou_') ? 'overunder' : 'spread';
                
                // Check if this radio is already checked (for unselect)
                const wasChecked = radio.getAttribute('data-was-checked') === 'true';
                
                // Clear all data-was-checked for this game
                document.querySelectorAll(`input[name="${radio.name}"]`).forEach(r => {
                    r.setAttribute('data-was-checked', 'false');
                });
                
                if (wasChecked) {
                    // Unselect the radio
                    radio.checked = false;
                    // Remove the pick
                    this.picksManager.removePick(gameId);
                } else {
                    // Mark as checked
                    radio.setAttribute('data-was-checked', 'true');
                    // Save the pick
                    this.picksManager.savePickToMemory(gameId, {
                        gameId,
                        pick: radio.value,
                        pickType
                    });
                }
                
                // Update picks count
                this.picksManager.updatePicksCount();
            };
        });
        
        // Checkboxes for limited games
        document.querySelectorAll('input[type="checkbox"][data-game-id]').forEach(checkbox => {
            checkbox.onchange = () => {
                const gameId = checkbox.getAttribute('data-game-id');
                this.picksManager.handleGameSelection(gameId, checkbox.checked);
            };
        });
    }
    
    attachModalEventListeners() {
        document.querySelectorAll('[data-modal-action]').forEach(btn => {
            const action = btn.getAttribute('data-modal-action');
            btn.onclick = async () => {
                switch(action) {
                    case 'create-league':
                        await this.createLeague();
                        break;
                    case 'close-modal':
                        this.renderer.modals.closeModal();
                        break;
                }
            };
        });
        
        // Sport selection
        document.querySelectorAll('[data-sport]').forEach(btn => {
            btn.onclick = () => {
                this.createLeagueForm.sport = btn.getAttribute('data-sport');
                this.updateModalButtons('[data-sport]', btn);
            };
        });
        
        // Bet types
        document.querySelectorAll('[data-bet-type]').forEach(btn => {
            btn.onclick = () => {
                const type = btn.getAttribute('data-bet-type');
                const index = this.createLeagueForm.betTypes.indexOf(type);
                
                if (index > -1 && this.createLeagueForm.betTypes.length > 1) {
                    this.createLeagueForm.betTypes.splice(index, 1);
                    btn.style.background = 'rgba(255, 255, 255, 0.05)';
                    btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    btn.style.color = '#94a3b8';
                } else if (index === -1) {
                    this.createLeagueForm.betTypes.push(type);
                    btn.style.background = 'rgba(99, 102, 241, 0.2)';
                    btn.style.borderColor = '#6366f1';
                    btn.style.color = '#6366f1';
                }
            };
        });
        
        // Duration
        document.querySelectorAll('[data-duration]').forEach(btn => {
            btn.onclick = () => {
                const value = btn.getAttribute('data-duration');
                this.createLeagueForm.duration = value === 'custom' ? 'custom' : parseInt(value);
                this.updateModalButtons('[data-duration]', btn);
                
                const customInput = document.getElementById('customDurationInput');
                if (customInput) {
                    customInput.style.display = value === 'custom' ? 'block' : 'none';
                }
            };
        });
        
        // Games per week
        document.querySelectorAll('[data-games]').forEach(btn => {
            btn.onclick = () => {
                const value = btn.getAttribute('data-games');
                this.createLeagueForm.gamesPerWeek = value;
                this.updateModalButtons('[data-games]', btn);
                
                const customInput = document.getElementById('customGamesInput');
                if (customInput) {
                    customInput.style.display = value === 'custom' ? 'block' : 'none';
                }
            };
        });
        
        // Scoring
        document.querySelectorAll('[data-scoring]').forEach(btn => {
            btn.onclick = () => {
                this.createLeagueForm.scoringSystem = btn.getAttribute('data-scoring');
                this.updateModalButtons('[data-scoring]', btn);
            };
        });
        
        // Payment structure buttons
        document.querySelectorAll('[data-payment]').forEach(btn => {
            btn.onclick = () => {
                const paymentType = btn.getAttribute('data-payment');
                this.createLeagueForm.paymentType = paymentType;
                this.updateModalButtons('[data-payment]', btn);
                this.updatePaymentFields(paymentType);
            };
        });
        
        // Entry fee
        document.querySelectorAll('[data-fee]').forEach(btn => {
            btn.onclick = () => {
                document.getElementById('entryFee').value = btn.getAttribute('data-fee');
                this.updateModalButtons('[data-fee]', btn);
            };
        });
    }
    
    updateModalButtons(selector, activeBtn) {
        document.querySelectorAll(selector).forEach(btn => {
            btn.style.background = 'rgba(255, 255, 255, 0.05)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            btn.style.color = '#94a3b8';
        });
        activeBtn.style.background = 'rgba(99, 102, 241, 0.2)';
        activeBtn.style.borderColor = '#6366f1';
        activeBtn.style.color = '#6366f1';
    }
    
    updatePaymentFields(type) {
        const paymentFields = document.getElementById('paymentFields');
        const simpleField = document.getElementById('simpleEntryField');
        const weeklyField = document.getElementById('weeklyAmountField');
        const seasonField = document.getElementById('seasonAmountField');
        
        if (type === 'free') {
            paymentFields.style.display = 'none';
        } else {
            paymentFields.style.display = 'block';
            simpleField.style.display = type === 'simple' ? 'block' : 'none';
            weeklyField.style.display = (type === 'weekly' || type === 'combined') ? 'block' : 'none';
            seasonField.style.display = (type === 'combined') ? 'block' : 'none';
        }
    }
    
    async createLeague() {
        const name = document.getElementById('leagueName').value;
        const type = document.getElementById('leagueType').value;
        const maxMembers = document.getElementById('maxMembers').value;
        const entryFee = document.getElementById('entryFee').value;
        
        let duration = this.createLeagueForm.duration;
        if (duration === 'custom') {
            duration = parseInt(document.getElementById('customDuration').value) || 18;
        }
        
        let gamesPerWeek = this.createLeagueForm.gamesPerWeek;
        if (gamesPerWeek === 'custom') {
            const min = document.getElementById('customGamesMin')?.value;
            const max = document.getElementById('customGamesMax')?.value;
            if (min && max) {
                gamesPerWeek = `${min}-${max}`;
            } else {
                gamesPerWeek = min || max || 'all';
            }
        }
        
        if (!name) {
            alert('Please enter a league name');
            return;
        }
        
        const paymentType = this.createLeagueForm.paymentType || 'free';
        const weeklyAmount = document.getElementById('weeklyAmount')?.value || 0;
        const seasonAmount = document.getElementById('seasonAmount')?.value || 0;
        
        const leagueData = {
            name,
            type,
            sport: this.createLeagueForm.sport,
            betTypes: this.createLeagueForm.betTypes,
            duration,
            gamesPerWeek,
            scoringSystem: this.createLeagueForm.scoringSystem,
            maxMembers: parseInt(maxMembers),
            entryFee: parseFloat(entryFee) || 0,
            paymentStructure: {
                type: paymentType === 'free' ? 'simple' : paymentType,
                weeklyAmount: parseFloat(weeklyAmount) || 0,
                seasonAmount: parseFloat(seasonAmount) || 0,
                weeklyPayout: 'winner-take-all',
                seasonPayout: 'top-3'
            }
        };
        
        const league = await this.leagueManager.createLeague(leagueData);
        this.renderer.modals.closeModal();
        
        this.userLeagues = this.leagueManager.userLeagues;
        this.enterLeague(league.id || league._id);
    }
    
    async joinLeague(leagueId) {
        try {
            await this.leagueManager.joinLeague(leagueId);
            this.userLeagues = this.leagueManager.userLeagues;
            this.availableLeagues = this.leagueManager.availableLeagues;
            this.enterLeague(leagueId);
        } catch (error) {
            alert(error.message || 'Failed to join league');
        }
    }
    
    async joinPrivateLeague() {
        const code = document.getElementById('leagueCode')?.value?.trim().toUpperCase();
        if (!code) {
            alert('Please enter a league code');
            return;
        }
        
        try {
            const leagueId = await this.leagueManager.joinPrivateLeague(code);
            this.userLeagues = this.leagueManager.userLeagues;
            this.enterLeague(leagueId);
        } catch (error) {
            alert(error.message || 'Invalid league code');
        }
    }
    
    enterLeague(leagueId) {
        const league = [...this.userLeagues, ...this.availableLeagues].find(l => 
            (l.id || l._id) === leagueId
        );
        
        if (league) {
            // Clean up preseason weeks
            if (typeof league.currentWeek === 'string' && league.currentWeek.startsWith('PS-')) {
                league.currentWeek = 1;
                league.week = 1;
            }
            
            this.activeLeague = league;
            this.currentView = 'league';
            this.activeTab = 'picks';
            this.isPreviewMode = false;
            
            // Force week to 1 for 2025 season
            this.selectedWeek = 1;
            this.currentWeek = 1;
            
            this.picksManager.initialize(league);
            
            // Load full league details including standings
            this.loadLeagueDetails(leagueId);
            
            if (league.sport === 'MLB') {
                this.selectedDate = new Date();
            } else {
                this.selectedWeek = league.currentWeek || this.currentWeek;
            }
            
            this.reRender();
            this.loadLeagueGames();
            
            if (!league.seasonProgress) {
                this.leagueManager.initializeLeagueProgress(leagueId);
            }
        }
    }

    async loadLeagueDetails(leagueId) {
        try {
            // Clean the league ID
            const cleanId = leagueId.replace('league_', '');
            const details = await this.leagueManager.loadLeagueDetails(cleanId);
            if (details) {
                this.activeLeague = { ...this.activeLeague, ...details };
                
                // Update standings if available
                if (this.activeLeague.standings) {
                    this.standingsManager.standings = this.activeLeague.standings;
                }
                
                // Re-render if on standings tab
                if (this.activeTab === 'standings') {
                    const leagueContent = document.getElementById('leagueContent');
                    if (leagueContent) {
                        leagueContent.innerHTML = this.renderer.renderLeagueTabContent();
                        this.attachAllEventListeners();
                    }
                }
            }
        } catch (error) {
            console.error('Error loading league details:', error);
        }
    }
    
    previewLeague(leagueId) {
        const league = [...this.userLeagues, ...this.availableLeagues].find(l => 
            (l.id || l._id) === leagueId
        );
        
        if (league) {
            this.activeLeague = league;
            this.currentView = 'league';
            this.activeTab = 'standings';
            this.isPreviewMode = true;
            this.reRender();
        }
    }
    
    backToList() {
        this.currentView = this.userLeagues.length > 0 ? 'my-leagues' : 'browse';
        this.activeLeague = null;
        this.isPreviewMode = false;
        this.picksManager.clearCurrentPicks();
        this.reRender();
    }
    
    async loadLeagueGames() {
        const container = document.getElementById('gamesForPicks');
        if (!container) return;
        
        // Check if we already have games loaded (don't show loading if editing)
        const hasExistingGames = container.querySelector('[data-game-id]');
        if (!hasExistingGames) {
            // Only show loading state if no games are present
            container.innerHTML = `
                <div style="text-align: center; color: #94a3b8; padding: 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Loading games...</p>
                </div>
            `;
        }
        
        try {
            const games = await this.gamesLoader.loadLeagueGames();
            
            if (games.length > 0) {
                const betType = this.activeLeague?.betTypes?.[0] || 'spread';
                const gamesHTML = games.map((game, index) => 
                    this.renderer.pickers.renderGame(game, betType, index)
                ).join('');
                
                container.innerHTML = DOMPurify ? DOMPurify.sanitize(gamesHTML) : gamesHTML;
                
                setTimeout(() => {
                    this.attachAllEventListeners();
                    this.picksManager.restorePicksToUI();
                }, 100);
            } else {
                container.innerHTML = `
                    <div style="text-align: center; color: #94a3b8; padding: 40px;">
                        <p>No games available for this week/date</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading games:', error);
            container.innerHTML = `
                <div style="text-align: center; color: #ff4444; padding: 40px;">
                    <p>Error loading games. Please try again.</p>
                </div>
            `;
        }
    }
    
    copyCode(code) {
        navigator.clipboard.writeText(code).then(() => {
            const btn = event.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ Copied!';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        }).catch(() => {
            alert(`League code: ${code}`);
        });
    }
    
    async editPick(gameId) {
        this.activeTab = 'picks';
        this.reRender();
        
        // Wait for games to load before trying to scroll
        setTimeout(async () => {
            // Ensure games are loaded
            await this.loadLeagueGames();
            
            // Wait a bit more for DOM to update
            setTimeout(() => {
                // Restore picks to UI after games load
                this.picksManager.restorePicksToUI();
                
                const gameElement = document.querySelector(`[data-game-id="${gameId}"]`);
                if (gameElement) {
                    gameElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    gameElement.style.border = '2px solid #6366f1';
                    gameElement.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.5)';
                    setTimeout(() => {
                        gameElement.style.border = '';
                        gameElement.style.boxShadow = '';
                    }, 3000);
                }
            }, 500);
        }, 100);
    }
    
    clearAllLeagues() {
        if (confirm('Clear all saved leagues? This cannot be undone.')) {
            this.leagueManager.clearAllLeagues();
            localStorage.removeItem('quickLeagueState');
            localStorage.removeItem('quickLeagueInitialized');
            this.currentView = 'browse';
            this.activeLeague = null;
            this.selectedWeek = this.getCurrentNFLWeek();
            this.currentWeek = this.getCurrentNFLWeek();
            this.reRender();
        }
    }
    
    async refreshLeagues() {
        try {
            // Show loading state
            const btn = event.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = '⏳ Loading...';
            btn.disabled = true;
            
            // Reload both league lists from server
            await this.leagueManager.loadAvailableLeagues();
            await this.leagueManager.loadUserLeagues();
            
            this.availableLeagues = this.leagueManager.availableLeagues;
            this.userLeagues = this.leagueManager.userLeagues;
            
            // Re-render the view
            this.reRender();
            
            // Show success
            setTimeout(() => {
                const newBtn = document.querySelector('[data-action="refresh-leagues"]');
                if (newBtn) {
                    newBtn.innerHTML = '✅ Updated!';
                    setTimeout(() => {
                        newBtn.innerHTML = originalText;
                        newBtn.disabled = false;
                    }, 2000);
                }
            }, 100);
            
        } catch (error) {
            console.error('Error refreshing leagues:', error);
            const btn = event.target;
            btn.innerHTML = '❌ Error';
            btn.disabled = false;
        }
    }

    async saveLeagueSettings() {
        const league = this.activeLeague;
        if (!league) return;
        
        const updates = {
            name: document.getElementById('settingsLeagueName')?.value,
            entryFee: parseFloat(document.getElementById('settingsEntryFee')?.value) || 0,
            paymentStructure: {
                weeklyAmount: parseFloat(document.getElementById('settingsWeeklyAmount')?.value) || 0,
                seasonAmount: parseFloat(document.getElementById('settingsSeasonAmount')?.value) || 0,
            }
        };
        
        // Update locally
        Object.assign(this.activeLeague, updates);
        this.storage.saveLeague(this.activeLeague);
        
        // Update on server if authenticated
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await fetch(`/api/leagues/${league.id || league._id}/settings`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updates)
                });
            } catch (error) {
                console.error('Error saving settings:', error);
            }
        }
        
        alert('Settings saved successfully!');
        this.reRender();
    }
    
    async updateMemberRecord(userId) {
        const wins = parseInt(document.getElementById(`wins-${userId}`)?.value) || 0;
        const losses = parseInt(document.getElementById(`losses-${userId}`)?.value) || 0;
        
        // Update standings
        const standing = this.activeLeague.standings.find(s => s.userId?._id === userId);
        if (standing) {
            standing.wins = wins;
            standing.losses = losses;
            standing.points = wins * 2; // Standard scoring
        }
        
        // Save
        this.storage.saveLeague(this.activeLeague);
        alert('Record updated!');
    }
    
    exportLeagueData() {
        const data = {
            league: this.activeLeague,
            exported: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `league-${this.activeLeague.code}-export.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    openAIStore() {
        if (window.bettingStore) {
            const leagueContext = {
                name: this.activeLeague?.name || 'Quick League',
                betTypes: this.activeLeague?.betTypes || ['spread'],
                week: this.selectedWeek,
                gamesPerWeek: this.activeLeague?.gamesPerWeek || 'all'
            };
            window.bettingStore.openStoreInFeed(leagueContext);
        } else {
            alert('AI Analysis tools are not available');
        }
    }
    
    async processGameResult(gameResult) {
    if (!this.activeLeague) return;
    
    const token = localStorage.getItem('token');
    const leagueId = this.activeLeague.id || this.activeLeague._id;
    
    // Handle preseason weeks properly
    let week = this.selectedWeek;
    if (typeof week === 'string' && week.startsWith('PS-')) {
        week = week; // Keep as is for preseason
    } else {
        week = week.toString();
    }
    
    // Preserve the original spread from the game
    const originalSpread = parseFloat(gameResult.spread || 0);
    
    // Emit to Socket.IO for real-time updates
    if (window.socket && window.socket.connected) {
        window.socket.emit('quick_league_results', {
            leagueId: leagueId,
            gameResult: gameResult,
            week: this.selectedWeek
        });
    }
        
        try {
            // 1. First fetch ALL picks for this week to process results
            const picksResponse = await fetch(`/api/leagues/${leagueId}/all-picks/${this.selectedWeek}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!picksResponse.ok) {
                console.error('Failed to fetch league picks');
                return;
            }
            
            const picksData = await picksResponse.json();
            const allMemberPicks = picksData.picks || [];
            
            // 2. Calculate results for each member's pick on this game
            const gameId = gameResult.gameId;
            const homeScore = parseInt(gameResult.homeScore) || 0;
            const awayScore = parseInt(gameResult.awayScore) || 0;
            
            // Use the original spread that was locked when picks were made
            let spread = originalSpread;
            
            const memberResults = allMemberPicks.map(memberPick => {
                const pick = memberPick.picks?.find(p => p.gameId === gameId);
                if (!pick) return null;
                
                let won = false;
                if (pick.pickType === 'spread') {
                    const actualDiff = homeScore - awayScore;
                    // Use locked line if available, otherwise use original spread
                    const spreadValue = pick.lockedLine?.spread !== undefined ? 
                        parseFloat(pick.lockedLine.spread) : spread;
                    
                    if (pick.pick === 'home') {
                        // Home team covers if actual diff + spread > 0
                        won = actualDiff + spreadValue > 0;
                    } else {
                        // Away team covers if they win outright or lose by less than spread
                        won = -actualDiff + Math.abs(spreadValue) > 0;
                    }
                } else if (pick.pickType === 'moneyline') {
                    const homeWon = homeScore > awayScore;
                    won = (pick.pick === 'home' && homeWon) || (pick.pick === 'away' && !homeWon);
                }
                
                return {
                    userId: memberPick.userId,
                    username: memberPick.username,
                    gameId: gameId,
                    won: won
                };
            }).filter(r => r !== null);
            
            // 3. Update standings locally for immediate UI update
            if (!this.activeLeague.standings) {
                this.activeLeague.standings = [];
            }
            
            memberResults.forEach(result => {
                let standing = this.activeLeague.standings.find(s => 
                    s.userId === result.userId || 
                    s.username === result.username ||
                    (s.userId?._id === result.userId)
                );
                
                if (!standing) {
                    standing = {
                        userId: result.userId,
                        username: result.username,
                        wins: 0,
                        losses: 0,
                        points: 0,
                        streak: 0,
                        streakType: null
                    };
                    this.activeLeague.standings.push(standing);
                }
                
                if (result.won) {
                    standing.wins = (standing.wins || 0) + 1;
                    standing.points = (standing.points || 0) + 2;
                    if (standing.streakType === 'W') {
                        standing.streak++;
                    } else {
                        standing.streak = 1;
                        standing.streakType = 'W';
                    }
                } else {
                    standing.losses = (standing.losses || 0) + 1;
                    if (standing.streakType === 'L') {
                        standing.streak++;
                    } else {
                        standing.streak = 1;
                        standing.streakType = 'L';
                    }
                }
            });
            
            // Re-sort standings
            this.activeLeague.standings = this.standingsManager.sortStandings(this.activeLeague.standings);
            this.standingsManager.standings = this.activeLeague.standings;
            
            // 4. Save to localStorage
            const standingsKey = `league_standings_${leagueId}`;
            localStorage.setItem(standingsKey, JSON.stringify(this.activeLeague.standings));
            this.storage.saveLeague(this.activeLeague);
            
            // 5. Send to backend
            const processResponse = await fetch(`/api/leagues/${leagueId}/process-results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    week: this.selectedWeek,
                    gameResults: {
                        [gameId]: {
                            ...gameResult,
                            homeScore,
                            awayScore,
                            spread,
                            spreadWinner: homeScore - awayScore > spread ? 'home' : 'away',
                            winner: homeScore > awayScore ? 'home' : 'away'
                        }
                    }
                })
            });
            
            // 6. Update UI based on current tab
            if (this.activeTab === 'standings') {
                const leagueContent = document.getElementById('leagueContent');
                if (leagueContent) {
                    leagueContent.innerHTML = this.renderer.renderLeagueTabContent();
                    this.attachAllEventListeners();
                }
            } else if (this.activeTab === 'league-picks') {
                // Refresh league picks to show the result
                const leaguePicksContent = document.getElementById('leaguePicksContent');
                if (leaguePicksContent) {
                    await this.renderer.loadLeaguePicks();
                }
            } else if (this.activeTab === 'results') {
                // Refresh results tab
                await this.renderer.loadUserResults();
            }
            
            // 7. Show notification for current user
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const userResult = memberResults.find(r => 
                r.userId === currentUser._id || 
                r.username === currentUser.username
            );
            
            if (userResult) {
                this.showResultNotification({
                    ...gameResult,
                    userWon: userResult.won
                });
            }
            
        } catch (error) {
            console.error('Error processing game results:', error);
        }
    }
    
    showResultNotification(result) {
        const toast = document.createElement('div');
        const bgColor = result.userWon ? '#00ff88' : '#ff4444';
        toast.style.cssText = `
            position: fixed; bottom: 20px; right: 20px;
            background: ${bgColor}; color: ${result.userWon ? '#000' : '#fff'};
            padding: 1rem; border-radius: 8px;
            z-index: 10000; animation: slideIn 0.3s;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        toast.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">
                ${result.userWon ? '✅ WIN!' : '❌ LOSS'}
            </div>
            📊 Final: ${result.awayTeam} ${result.awayScore} - ${result.homeScore} ${result.homeTeam}<br>
            <small>Standings updated • Record: ${result.userWon ? '+1 Win' : '+1 Loss'}</small>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }
    
    async loadMemberPicks(memberId) {
        if (!memberId) {
            document.getElementById('memberPicksDisplay').innerHTML = '';
            document.getElementById('editPicksBtn').disabled = true;
            document.getElementById('editPicksBtn').style.opacity = '0.5';
            return;
        }
        
        const display = document.getElementById('memberPicksDisplay');
        const editBtn = document.getElementById('editPicksBtn');
        
        display.innerHTML = '<div style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading picks...</div>';
        
        try {
            const token = localStorage.getItem('token');
            const leagueId = this.activeLeague?.id || this.activeLeague?._id;
            const week = this.selectedWeek;
            
            // Get all picks for the week
            const response = await fetch(`/api/leagues/${leagueId}/all-picks/${week}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const memberPicks = data.picks?.find(p => p.userId === memberId);
                
                if (!memberPicks || memberPicks.picks.length === 0) {
                    display.innerHTML = `
                        <div style="padding: 20px; text-align: center; background: rgba(255, 193, 7, 0.1); 
                                    border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px;">
                            <p style="color: #ffc107; margin: 0;">⚠️ No picks submitted for Week ${week}</p>
                            <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 0.85rem;">
                                Click "Edit Selected Member's Picks" to add picks for this member
                            </p>
                        </div>
                    `;
                } else {
                    display.innerHTML = `
                        <div style="padding: 10px; background: rgba(0, 255, 136, 0.1); 
                                    border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 8px; margin-bottom: 10px;">
                            <p style="color: #00ff88; margin: 0;">✅ ${memberPicks.picks.length} picks submitted for Week ${week}</p>
                        </div>
                        <div style="display: grid; gap: 0.5rem;">
                            ${memberPicks.picks.map(pick => `
                                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; 
                                            padding: 0.75rem; background: rgba(0,0,0,0.3); border-radius: 6px;">
                                    <span style="color: white;">${pick.gameId}</span>
                                    <strong style="color: #00ff88;">${pick.pick} ${pick.pickDetails || ''}</strong>
                                    <span style="color: #8b5cf6; text-align: right;">${pick.pickType || 'spread'}</span>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
                
                // Enable edit button
                editBtn.disabled = false;
                editBtn.style.opacity = '1';
                editBtn.setAttribute('data-member-id', memberId);
                
                // Store member name for later use
                const memberName = document.getElementById('memberSelector').options[document.getElementById('memberSelector').selectedIndex].text;
                editBtn.setAttribute('data-member-name', memberName);
            }
        } catch (error) {
            console.error('Error loading member picks:', error);
            display.innerHTML = '<p style="color: #ff4444;">Error loading picks</p>';
        }
    }
    
    async editMemberPicks() {
        const editBtn = document.getElementById('editPicksBtn');
        const memberId = editBtn.getAttribute('data-member-id');
        const memberName = editBtn.getAttribute('data-member-name');
        
        if (!memberId) return;
        
        // Store current editing context
        this.editingForMember = {
            id: memberId,
            name: memberName
        };
        
        // Switch to picks tab with admin override
        this.activeTab = 'picks';
        this.isAdminEditing = true;
        
        // Clear current picks and load fresh games
        this.picksManager.clearCurrentPicks();
        
        // Re-render with admin editing mode
        const leagueContent = document.getElementById('leagueContent');
        if (leagueContent) {
            // Add admin editing banner
            const adminBanner = `
                <div style="background: linear-gradient(135deg, #ff6b6b, #ff8e53); padding: 15px; 
                            border-radius: 10px; margin-bottom: 20px; color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>🛡️ ADMIN MODE:</strong> Making picks for <strong>${memberName}</strong>
                        </div>
                        <button onclick="window.quickLeague.cancelAdminEdit()" 
                                style="padding: 8px 16px; background: rgba(0,0,0,0.3); border: none; 
                                       border-radius: 8px; color: white; cursor: pointer;">
                            Cancel Admin Edit
                        </button>
                    </div>
                </div>
            `;
            
            leagueContent.innerHTML = adminBanner + this.renderer.renderLeagueTabContent();
            
            // Load games and setup pick interface
            setTimeout(async () => {
                await this.loadLeagueGames();
                this.attachAllEventListeners();
                
                // Override the submit button to save for the member
                const submitBtn = document.querySelector('[data-action="submit-picks"]');
                if (submitBtn) {
                    submitBtn.onclick = async () => {
                        await this.submitPicksForMember(memberId, memberName);
                    };
                    submitBtn.innerHTML = `💾 Save Picks for ${memberName}`;
                    submitBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #ff8e53)';
                }
            }, 100);
        }
    }
    
    async submitPicksForMember(memberId, memberName) {
        const picks = this.picksManager.getCurrentPicks();
        
        if (picks.length === 0) {
            alert('Please select at least one pick');
            return;
        }
        
        if (!confirm(`Save ${picks.length} picks for ${memberName}?`)) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const leagueId = this.activeLeague?.id || this.activeLeague?._id;
            
            // Submit picks with admin override
            const response = await fetch(`/api/leagues/${leagueId}/admin-picks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    memberId: memberId,
                    week: this.selectedWeek,
                    picks: picks
                })
            });
            
            if (response.ok) {
                alert(`Successfully saved ${picks.length} picks for ${memberName}`);
                this.cancelAdminEdit();
            } else {
                const error = await response.json();
                alert(`Failed to save picks: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving picks:', error);
            alert('Error saving picks');
        }
    }
    
    setWeek(week) {
        this.selectedWeek = parseInt(week) || 1;
        this.currentWeek = this.getCurrentNFLWeek(); // Always use calculated current week
        
        // Update the league's current week if needed
        if (this.activeLeague) {
            // Don't override the actual current week
            this.activeLeague.week = this.selectedWeek;
            
            // Clean up any preseason data
            if (typeof this.activeLeague.currentWeek === 'string' && this.activeLeague.currentWeek.startsWith('PS-')) {
                this.activeLeague.currentWeek = 1;
            }
            if (typeof this.activeLeague.startWeek === 'string' && this.activeLeague.startWeek.startsWith('PS-')) {
                this.activeLeague.startWeek = 1;
            }
            
            this.storage.saveLeague(this.activeLeague);
        }
        
        this.hasUnsavedChanges = true;
        this.reRender();
        this.loadLeagueGames();
    }
    
    cancelAdminEdit() {
        this.isAdminEditing = false;
        this.editingForMember = null;
        this.activeTab = 'settings';
        
        // Re-render back to settings
        const leagueContent = document.getElementById('leagueContent');
        if (leagueContent) {
            leagueContent.innerHTML = this.renderer.renderLeagueTabContent();
            this.attachAllEventListeners();
        }
    }
    
    async quickViewPicks(memberId, memberName) {
        const display = document.getElementById('adminPicksDisplay');
        if (!display) return;
        
        display.style.display = 'block';
        display.innerHTML = '<div style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        
        try {
            const token = localStorage.getItem('token');
            const leagueId = this.activeLeague?.id || this.activeLeague?._id;
            const week = this.selectedWeek;
            
            const response = await fetch(`/api/leagues/${leagueId}/all-picks/${week}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const memberPicks = data.picks?.find(p => p.userId === memberId);
                
                if (!memberPicks || memberPicks.picks.length === 0) {
                    display.innerHTML = `
                        <h4 style="color: #ffc107;">⚠️ ${memberName} - No picks for Week ${week}</h4>
                        <button onclick="window.quickLeague.quickEditPicks('${memberId}', '${memberName}')" 
                                style="padding: 10px 20px; background: linear-gradient(135deg, #00ff88, #00cc6a); 
                                       color: #000; border: none; border-radius: 8px; cursor: pointer;">
                            Make Picks for ${memberName}
                        </button>
                    `;
                } else {
                    display.innerHTML = `
                        <h4 style="color: #00ff88;">✅ ${memberName}'s Picks - Week ${week}</h4>
                        <div style="display: grid; gap: 6px;">
                            ${memberPicks.picks.map(pick => `
                                <div style="padding: 8px; background: rgba(0,0,0,0.3); border-radius: 6px;">
                                    <strong>${pick.pick}</strong> - ${pick.pickType || 'spread'}
                                </div>
                            `).join('')}
                        </div>
                        <button onclick="window.quickLeague.quickEditPicks('${memberId}', '${memberName}')" 
                                style="margin-top: 10px; padding: 10px 20px; background: rgba(99, 102, 241, 0.2); 
                                       border: 1px solid #6366f1; border-radius: 8px; color: #6366f1;">
                            Edit Picks
                        </button>
                    `;
                }
            }
        } catch (error) {
            display.innerHTML = '<p style="color: #ff4444;">Error loading picks</p>';
        }
    }
    
    async quickEditPicks(memberId, memberName) {
        this.editingForMember = { id: memberId, name: memberName };
        this.adminOverride = true; // Allow picking completed games
        
        const modal = document.createElement('div');
        modal.id = 'adminPickModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.95); z-index: 10000; overflow-y: auto; padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="max-width: 900px; margin: 0 auto; background: #1a1a2e; border-radius: 15px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <h2 style="color: #00ff88; margin: 0;">Admin Picks for ${memberName} - Week ${this.selectedWeek}</h2>
                    <button onclick="document.getElementById('adminPickModal').remove()" 
                            style="background: #ff4444; color: white; border: none; 
                                   padding: 10px 20px; border-radius: 8px; cursor: pointer;">✕ Close</button>
                </div>
                
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button onclick="window.quickLeague.toggleLineEdit()" id="lineEditToggle"
                            style="padding: 8px 16px; background: rgba(255, 193, 7, 0.2); 
                                   border: 1px solid #ffc107; border-radius: 6px; 
                                   color: #ffc107; cursor: pointer;">
                        📏 Edit Lines
                    </button>
                    <button onclick="window.quickLeague.fetchLatestLines()" 
                            style="padding: 8px 16px; background: rgba(99, 102, 241, 0.2); 
                                   border: 1px solid #6366f1; border-radius: 6px; 
                                   color: #6366f1; cursor: pointer;">
                        🔄 Get Latest Lines
                    </button>
                </div>
                
                <div id="adminGamesGrid">Loading all games...</div>
                
                <div style="position: sticky; bottom: -20px; background: #1a1a2e; padding: 20px 0; margin-top: 20px; 
                            border-top: 2px solid #6366f1;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: white;">Selected: <strong id="pickCount" style="color: #00ff88;">0</strong> games</span>
                        <button onclick="window.quickLeague.clearAdminSelections()" 
                                style="background: #ff4444; color: white; padding: 8px 16px; 
                                       border: none; border-radius: 6px; cursor: pointer;">Clear All</button>
                    </div>
                    <button onclick="window.quickLeague.saveAdminSelections()" 
                            style="width: 100%; padding: 15px; background: linear-gradient(135deg, #00ff88, #00cc6a); 
                                   color: #000; border: none; border-radius: 10px; cursor: pointer; 
                                   font-weight: bold; font-size: 1.1rem;">
                        💾 Save Picks for ${memberName}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.loadSimpleAdminGames();
    }
    
    async loadSimpleAdminGames() {
        const container = document.getElementById('adminGamesGrid');
        if (!container) return;
        
        try {
            const games = await this.gamesLoader.loadLeagueGames();
            
            const completed = games.filter(g => g.status === 'post' || g.isFinal);
            const live = games.filter(g => g.isLive || g.status === 'in');
            const upcoming = games.filter(g => !g.isFinal && !g.isLive && g.status !== 'post' && g.status !== 'in');
            
            container.innerHTML = `
                <div style="display: grid; gap: 10px;">
                    ${completed.length > 0 ? `<h4 style="color: #94a3b8;">Completed Games</h4>` : ''}
                    ${completed.map((game, idx) => this.renderSimpleGamePicker(game, idx, true)).join('')}
                    
                    ${live.length > 0 ? `<h4 style="color: #ff4444;">🔴 Live Games</h4>` : ''}
                    ${live.map((game, idx) => this.renderSimpleGamePicker(game, idx + completed.length, false)).join('')}
                    
                    ${upcoming.length > 0 ? `<h4 style="color: #00ff88;">Upcoming Games</h4>` : ''}
                    ${upcoming.map((game, idx) => this.renderSimpleGamePicker(game, idx + completed.length + live.length, false)).join('')}
                </div>
            `;
            
            await this.loadAndHighlightExistingPicks();
            
        } catch (error) {
            container.innerHTML = '<div style="color: #ff4444;">Error loading games</div>';
        }
    }
    
    renderSimpleGamePicker(game, idx, isComplete) {
        const gameId = game.gameId || game.id || `game_${idx}`;
        let spread = parseFloat(game.spread || 0);
        
        // Check for admin-adjusted lines
        if (this.adminLineAdjustments && this.adminLineAdjustments[gameId]) {
            spread = this.adminLineAdjustments[gameId].spread;
        }
        
        return `
            <div id="game_container_${gameId}" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); 
                        border-radius: 8px; padding: 12px; ${isComplete ? 'opacity: 0.8;' : ''}">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <strong style="color: white;">${game.awayTeam} @ ${game.homeTeam}</strong>
                    ${isComplete ? 
                        `<span style="color: #10b981;">FINAL: ${game.awayScore}-${game.homeScore}</span>` : 
                        game.isLive ? 
                        `<span style="color: #ff4444;">🔴 LIVE: ${game.awayScore || 0}-${game.homeScore || 0}</span>` :
                        `<span style="color: #94a3b8;">${new Date(game.gameTime).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}</span>`
                    }
                </div>
                
                <div class="line-edit-controls" style="display: none; margin-bottom: 10px; padding: 10px; 
                                                        background: rgba(255, 193, 7, 0.1); border-radius: 6px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="color: #ffc107; font-size: 0.75rem;">Set Spread</label>
                            <div style="display: flex; gap: 5px; margin-top: 5px;">
                                <select id="spread_fav_${gameId}" onchange="window.quickLeague.updateSpreadWithTeam('${gameId}')"
                                        style="padding: 6px; background: rgba(0,0,0,0.5); 
                                               border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: white;">
                                    <option value="away" ${spread > 0 ? 'selected' : ''}>${game.awayTeam}</option>
                                    <option value="home" ${spread <= 0 ? 'selected' : ''}>${game.homeTeam}</option>
                                </select>
                                <select id="spread_edit_${gameId}" onchange="window.quickLeague.updateSpreadWithTeam('${gameId}')"
                                        style="width: 80px; padding: 6px; background: rgba(0,0,0,0.5); 
                                               border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: white;">
                                    <option value="0" ${Math.abs(spread) === 0 ? 'selected' : ''}>PK</option>
                                    ${[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(val => 
                                        `<option value="${val}" ${Math.abs(spread) === val ? 'selected' : ''}>${val}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style="color: #ffc107; font-size: 0.75rem;">Total O/U</label>
                            <input type="number" id="total_edit_${gameId}" value="${game.total || 0}" step="0.5"
                                   onchange="window.quickLeague.updateAdminLine('${gameId}', 'total', this.value)"
                                   style="width: 100%; padding: 6px; margin-top: 5px; background: rgba(0,0,0,0.5); 
                                          border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: white;">
                        </div>
                    </div>
                    <div style="margin-top: 8px; font-size: 0.75rem; color: #94a3b8;">
                        ${isComplete ? `Game ended: ${game.awayTeam} ${game.awayScore} - ${game.homeScore} ${game.homeTeam}` : 
                         game.isLive ? `Live: ${game.awayTeam} ${game.awayScore || 0} - ${game.homeScore || 0} ${game.homeTeam}` :
                         'Game not started - using current lines'}
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button onclick="window.quickLeague.selectAdminPick('${gameId}', 'away', '${game.awayTeam}')" 
                            id="pick_${gameId}_away"
                            style="padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); 
                                   border-radius: 6px; color: white; cursor: pointer;">
                        <div>${game.awayTeam}</div>
                        <div id="spread_${gameId}_away" style="color: #00ff88; font-size: 0.9rem;">
                            ${spread > 0 ? `+${spread}` : spread < 0 ? `+${Math.abs(spread)}` : 'PK'}
                        </div>
                    </button>
                    
                    <button onclick="window.quickLeague.selectAdminPick('${gameId}', 'home', '${game.homeTeam}')" 
                            id="pick_${gameId}_home"
                            style="padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); 
                                   border-radius: 6px; color: white; cursor: pointer;">
                        <div>${game.homeTeam}</div>
                        <div id="spread_${gameId}_home" style="color: #00ff88; font-size: 0.9rem;">
                            ${spread < 0 ? spread : `+${Math.abs(spread)}`}
                        </div>
                    </button>
                </div>
            </div>
        `;
    }
    
    selectAdminPick(gameId, pick, team) {
        if (!this.adminSelections) this.adminSelections = {};
        
        document.getElementById(`pick_${gameId}_away`).style.background = 'rgba(0,0,0,0.3)';
        document.getElementById(`pick_${gameId}_away`).style.border = '1px solid rgba(255,255,255,0.2)';
        document.getElementById(`pick_${gameId}_home`).style.background = 'rgba(0,0,0,0.3)';
        document.getElementById(`pick_${gameId}_home`).style.border = '1px solid rgba(255,255,255,0.2)';
        
        const btn = document.getElementById(`pick_${gameId}_${pick}`);
        if (this.adminSelections[gameId]?.pick === pick) {
            delete this.adminSelections[gameId];
        } else {
            this.adminSelections[gameId] = { gameId, pick, team, pickType: 'spread', betType: 'spread' };
            btn.style.background = 'rgba(0, 255, 136, 0.3)';
            btn.style.border = '2px solid #00ff88';
        }
        
        document.getElementById('pickCount').textContent = Object.keys(this.adminSelections || {}).length;
    }
    
    clearAdminSelections() {
        this.adminSelections = {};
        document.querySelectorAll('[id^="pick_"]').forEach(btn => {
            btn.style.background = 'rgba(0,0,0,0.3)';
            btn.style.border = '1px solid rgba(255,255,255,0.2)';
        });
        document.getElementById('pickCount').textContent = '0';
    }
    
    async loadAndHighlightExistingPicks() {
        try {
            const token = localStorage.getItem('token');
            const leagueId = this.activeLeague?.id || this.activeLeague?._id;
            
            const response = await fetch(`/api/leagues/${leagueId}/all-picks/${this.selectedWeek}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const memberPicks = data.picks?.find(p => p.userId === this.editingForMember.id);
                
                if (memberPicks && memberPicks.picks) {
                    this.adminSelections = {};
                    memberPicks.picks.forEach(pick => {
                        this.adminSelections[pick.gameId] = pick;
                        const btn = document.getElementById(`pick_${pick.gameId}_${pick.pick}`);
                        if (btn) {
                            btn.style.background = 'rgba(0, 255, 136, 0.3)';
                            btn.style.border = '2px solid #00ff88';
                        }
                    });
                    document.getElementById('pickCount').textContent = Object.keys(this.adminSelections).length;
                }
            }
        } catch (error) {
            console.error('Error loading existing picks:', error);
        }
    }
    
    toggleLineEdit() {
        this.lineEditMode = !this.lineEditMode;
        const controls = document.querySelectorAll('.line-edit-controls');
        const btn = document.getElementById('lineEditToggle');
        
        controls.forEach(control => {
            control.style.display = this.lineEditMode ? 'block' : 'none';
        });
        
        btn.style.background = this.lineEditMode ? 'rgba(255, 193, 7, 0.5)' : 'rgba(255, 193, 7, 0.2)';
        btn.textContent = this.lineEditMode ? '✓ Lines Editable' : '📏 Edit Lines';
    }
    
    updateAdminLine(gameId, type, value) {
        if (!this.adminLineAdjustments) this.adminLineAdjustments = {};
        
        if (!this.adminLineAdjustments[gameId]) {
            this.adminLineAdjustments[gameId] = {};
        }
        
        if (type === 'spread') {
            const spread = parseFloat(value);
            this.adminLineAdjustments[gameId].spread = spread;
            
            // Update display
            document.getElementById(`spread_${gameId}_away`).textContent = 
                spread > 0 ? `+${spread}` : spread < 0 ? `+${Math.abs(spread)}` : 'PK';
            document.getElementById(`spread_${gameId}_home`).textContent = 
                spread < 0 ? `-${Math.abs(spread)}` : `+${spread}`;
        } else if (type === 'total') {
            this.adminLineAdjustments[gameId].total = parseFloat(value);
        }
    }
    
    updateSpreadWithTeam(gameId) {
        const favoredTeam = document.getElementById(`spread_fav_${gameId}`).value;
        const spreadValue = parseFloat(document.getElementById(`spread_edit_${gameId}`).value) || 0;
        
        if (!this.adminLineAdjustments) this.adminLineAdjustments = {};
        if (!this.adminLineAdjustments[gameId]) {
            this.adminLineAdjustments[gameId] = {};
        }
        
        // If away team is favored, spread is positive for home team getting points
        // If home team is favored, spread is negative (home team giving points)
        const finalSpread = favoredTeam === 'home' ? -Math.abs(spreadValue) : Math.abs(spreadValue);
        this.adminLineAdjustments[gameId].spread = finalSpread;
        
        // Update the button displays
        if (favoredTeam === 'home') {
            // Home favored by X
            document.getElementById(`spread_${gameId}_home`).textContent = `-${Math.abs(spreadValue)}`;
            document.getElementById(`spread_${gameId}_away`).textContent = `+${Math.abs(spreadValue)}`;
        } else {
            // Away favored by X  
            document.getElementById(`spread_${gameId}_away`).textContent = `-${Math.abs(spreadValue)}`;
            document.getElementById(`spread_${gameId}_home`).textContent = `+${Math.abs(spreadValue)}`;
        }
    }
    
    async fetchLatestLines() {
        const btn = event.target;
        btn.disabled = true;
        btn.textContent = '⏳ Loading...';
        
        try {
            // Force reload games to get latest lines
            const games = await this.gamesLoader.loadLeagueGames(true); // true = force refresh
            
            // Update the display
            await this.loadSimpleAdminGames();
            
            btn.textContent = '✅ Updated!';
            setTimeout(() => {
                btn.textContent = '🔄 Get Latest Lines';
                btn.disabled = false;
            }, 2000);
        } catch (error) {
            btn.textContent = '❌ Error';
            btn.disabled = false;
        }
    }
    
    async saveAdminSelections() {
        const picks = Object.values(this.adminSelections || {});
        
        if (picks.length === 0) {
            alert('Please select at least one game');
            return;
        }
        
        // Get games to have access to current lines
        const games = await this.gamesLoader.loadLeagueGames();
        
        // Add lines to each pick
        picks.forEach(pick => {
            const game = games.find(g => (g.gameId || g.id) === pick.gameId);
            if (game) {
                // Check if admin adjusted the line
                if (this.adminLineAdjustments && this.adminLineAdjustments[pick.gameId]) {
                    pick.lockedLine = {
                        spread: this.adminLineAdjustments[pick.gameId].spread,
                        total: this.adminLineAdjustments[pick.gameId].total || game.total,
                        homeML: this.adminLineAdjustments[pick.gameId].homeML || game.homeML,
                        awayML: this.adminLineAdjustments[pick.gameId].awayML || game.awayML,
                        lockedAt: new Date().toISOString(),
                        adminAdjusted: true
                    };
                } else {
                    // Use the game's current lines (which should be the closing lines for completed games)
                    pick.lockedLine = {
                        spread: game.spread,
                        total: game.total,
                        homeML: game.homeML,
                        awayML: game.awayML,
                        lockedAt: game.gameTime, // Use game time as lock time
                        adminAdjusted: false
                    };
                }
                
                // If game is complete, calculate result immediately
                if (game.isFinal || game.status === 'post') {
                    const homeScore = parseInt(game.homeScore) || 0;
                    const awayScore = parseInt(game.awayScore) || 0;
                    const spread = parseFloat(pick.lockedLine.spread);
                    
                    let won = false;
                    if (pick.pickType === 'spread') {
                        const actualDiff = homeScore - awayScore;
                        if (pick.pick === 'home') {
                            won = actualDiff + spread > 0;
                        } else {
                            won = awayScore + Math.abs(spread) > homeScore;
                        }
                    } else if (pick.pickType === 'moneyline') {
                        won = (pick.pick === 'home' && homeScore > awayScore) || 
                              (pick.pick === 'away' && awayScore > homeScore);
                    } else if (pick.pickType === 'overunder') {
                        const total = homeScore + awayScore;
                        const line = parseFloat(pick.lockedLine.total);
                        won = (pick.pick === 'over' && total > line) || 
                              (pick.pick === 'under' && total < line);
                    }
                    
                    pick.result = won ? 'win' : 'loss';
                    pick.finalScore = { home: homeScore, away: awayScore };
                }
            }
        });
        
        if (!confirm(`Save ${picks.length} picks for ${this.editingForMember.name}?`)) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const leagueId = this.activeLeague?.id || this.activeLeague?._id;
            
            const response = await fetch(`/api/leagues/${leagueId}/admin-picks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    memberId: this.editingForMember.id,
                    week: this.selectedWeek.toString(),
                    picks: picks,
                    adminOverride: true,
                    allowCompleted: true
                })
            });
            
            if (response.ok) {
                alert(`✅ Saved ${picks.length} picks for ${this.editingForMember.name}`);
                document.getElementById('adminPickModal').remove();
                this.adminSelections = {};
                this.adminLineAdjustments = {};
            } else {
                const error = await response.json();
                alert(`❌ Failed: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            alert('❌ Error saving picks');
        }
    }
    
    async loadAllPicksForWeek(week) {
        if (!week) return;
        
        const display = document.getElementById('allPicksDisplay');
        if (!display) return;
        
        display.innerHTML = '<div style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading picks...</div>';
        
        try {
            const token = localStorage.getItem('token');
            const leagueId = this.activeLeague?.id || this.activeLeague?._id;
            
            const response = await fetch(`/api/leagues/${leagueId}/all-picks/${week}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const picks = data.picks || [];
                
                if (picks.length === 0) {
                    display.innerHTML = '<p style="color: #94a3b8;">No picks for this week</p>';
                    return;
                }
                
                display.innerHTML = picks.map(userPicks => `
                    <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 8px;">
                        <div style="font-weight: 600; color: #00ff88; margin-bottom: 0.75rem;">
                            ${userPicks.username} (${userPicks.picks.length} picks)
                        </div>
                        <div style="display: grid; gap: 0.5rem;">
                            ${userPicks.picks.map(pick => `
                                <div style="display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 1rem; padding: 0.5rem; 
                                            background: rgba(255,255,255,0.05); border-radius: 4px; align-items: center;">
                                    <span style="color: #94a3b8; font-size: 0.85rem;">${pick.gameId}</span>
                                    <strong style="color: white;">${pick.pick} ${pick.pickDetails || ''}</strong>
                                    <span style="color: #8b5cf6; text-align: right; font-size: 0.85rem;">${pick.pickType || 'spread'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading picks:', error);
            display.innerHTML = '<p style="color: #ff4444;">Error loading picks</p>';
        }
    }
    
    async loadMemberPicks(memberId) {
        if (!memberId) {
            document.getElementById('memberPicksDisplay').innerHTML = '';
            document.getElementById('editPicksBtn').disabled = true;
            document.getElementById('editPicksBtn').style.opacity = '0.5';
            return;
        }
        
        const display = document.getElementById('memberPicksDisplay');
        const editBtn = document.getElementById('editPicksBtn');
        
        display.innerHTML = '<div style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading picks...</div>';
        
        try {
            const token = localStorage.getItem('token');
            const leagueId = this.activeLeague?.id || this.activeLeague?._id;
            const week = this.selectedWeek;
            
            const response = await fetch(`/api/leagues/${leagueId}/all-picks/${week}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const memberPicks = data.picks?.find(p => p.userId === memberId);
                
                if (!memberPicks || memberPicks.picks.length === 0) {
                    display.innerHTML = `
                        <div style="padding: 20px; text-align: center; background: rgba(255, 193, 7, 0.1); 
                                    border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px;">
                            <p style="color: #ffc107; margin: 0;">⚠️ No picks for Week ${week}</p>
                            <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 0.85rem;">
                                Click "Edit" to add picks for this member
                            </p>
                        </div>
                    `;
                } else {
                    display.innerHTML = `
                        <div style="padding: 10px; background: rgba(0, 255, 136, 0.1); 
                                    border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 8px; margin-bottom: 10px;">
                            <p style="color: #00ff88; margin: 0;">✅ ${memberPicks.picks.length} picks for Week ${week}</p>
                        </div>
                        ${memberPicks.picks.map(pick => `
                            <div style="padding: 0.75rem; background: rgba(0,0,0,0.3); border-radius: 6px; margin-bottom: 8px;">
                                <strong style="color: #00ff88;">${pick.pick}</strong> - ${pick.pickType || 'spread'}
                            </div>
                        `).join('')}
                    `;
                }
                
                editBtn.disabled = false;
                editBtn.style.opacity = '1';
                editBtn.setAttribute('data-member-id', memberId);
                
                const memberName = document.getElementById('memberSelector').options[document.getElementById('memberSelector').selectedIndex].text;
                editBtn.setAttribute('data-member-name', memberName);
            }
        } catch (error) {
            console.error('Error loading member picks:', error);
            display.innerHTML = '<p style="color: #ff4444;">Error loading picks</p>';
        }
    }
    
    async editMemberPicks() {
        const editBtn = document.getElementById('editPicksBtn');
        const memberId = editBtn.getAttribute('data-member-id');
        const memberName = editBtn.getAttribute('data-member-name');
        
        if (!memberId) return;
        
        this.editingForMember = { id: memberId, name: memberName };
        this.activeTab = 'picks';
        this.isAdminEditing = true;
        
        this.picksManager.clearCurrentPicks();
        
        const leagueContent = document.getElementById('leagueContent');
        if (leagueContent) {
            const adminBanner = `
                <div style="background: linear-gradient(135deg, #ff6b6b, #ff8e53); padding: 15px; 
                            border-radius: 10px; margin-bottom: 20px; color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>🛡️ ADMIN MODE:</strong> Making picks for <strong>${memberName}</strong>
                        </div>
                        <button onclick="window.quickLeague.cancelAdminEdit()" 
                                style="padding: 8px 16px; background: rgba(0,0,0,0.3); border: none; 
                                       border-radius: 8px; color: white; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                </div>
            `;
            
            leagueContent.innerHTML = adminBanner + this.renderer.renderLeagueTabContent();
            
            setTimeout(async () => {
                await this.loadLeagueGames();
                this.attachAllEventListeners();
                
                const submitBtn = document.querySelector('[data-action="submit-picks"]');
                if (submitBtn) {
                    submitBtn.onclick = async () => {
                        await this.submitPicksForMember(memberId, memberName);
                    };
                    submitBtn.innerHTML = `💾 Save Picks for ${memberName}`;
                    submitBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #ff8e53)';
                }
            }, 100);
        }
    }
    
    async submitPicksForMember(memberId, memberName) {
        const picks = this.picksManager.getCurrentPicks();
        
        if (picks.length === 0) {
            alert('Please select at least one pick');
            return;
        }
        
        if (!confirm(`Save ${picks.length} picks for ${memberName}?`)) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const leagueId = this.activeLeague?.id || this.activeLeague?._id;
            
            const response = await fetch(`/api/leagues/${leagueId}/admin-picks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    memberId: memberId,
                    week: this.selectedWeek.toString(),
                    picks: picks
                })
            });
            
            if (response.ok) {
                alert(`Successfully saved ${picks.length} picks for ${memberName}`);
                this.cancelAdminEdit();
            } else {
                const error = await response.json();
                alert(`Failed to save picks: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving picks:', error);
            alert('Error saving picks');
        }
    }
    
    async loadGamesForLineEdit() {
        const editor = document.getElementById('lineEditor');
        if (!editor) return;
        
        editor.innerHTML = '<div style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading games...</div>';
        
        try {
            const games = await this.gamesLoader.loadLeagueGames();
            
            if (games.length === 0) {
                editor.innerHTML = '<p style="color: #94a3b8;">No games available for this week</p>';
                return;
            }
            
            // Store original lines
            this.originalLines = {};
            games.forEach(game => {
                const gameId = game.gameId || game.id;
                this.originalLines[gameId] = {
                    spread: game.spread,
                    total: game.total,
                    homeML: game.homeML,
                    awayML: game.awayML
                };
            });
            
            editor.innerHTML = `
                <div style="display: grid; gap: 10px;">
                    ${games.map(game => this.renderLineEditor(game)).join('')}
                </div>
                <button onclick="window.quickLeague.saveLineAdjustments()" 
                        style="margin-top: 15px; width: 100%; padding: 12px; 
                               background: linear-gradient(135deg, #00ff88, #00cc6a); 
                               color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    💾 Save All Line Changes
                </button>
            `;
        } catch (error) {
            console.error('Error loading games:', error);
            editor.innerHTML = '<p style="color: #ff4444;">Error loading games</p>';
        }
    }
    
    renderLineEditor(game) {
        const gameId = game.gameId || game.id;
        
        return `
            <div style="padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong style="color: white;">${game.awayTeam} @ ${game.homeTeam}</strong>
                    <span style="color: #94a3b8; font-size: 0.85rem;">
                        ${new Date(game.gameTime).toLocaleString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric', 
                            hour: 'numeric', 
                            minute: '2-digit' 
                        })}
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <div>
                        <label style="color: #94a3b8; font-size: 0.75rem;">Spread (${game.spread < 0 ? game.homeTeam : game.awayTeam} favored)</label>
                        <input type="number" 
                               id="spread_${gameId}" 
                               value="${Math.abs(game.spread)}" 
                               step="0.5" 
                               style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); 
                                      border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; 
                                      color: white;">
                    </div>
                    
                    <div>
                        <label style="color: #94a3b8; font-size: 0.75rem;">Total O/U</label>
                        <input type="number" 
                               id="total_${gameId}" 
                               value="${game.total}" 
                               step="0.5" 
                               style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); 
                                      border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; 
                                      color: white;">
                    </div>
                    
                    <div>
                        <label style="color: #94a3b8; font-size: 0.75rem;">${game.homeTeam} ML</label>
                        <input type="text" 
                               id="homeML_${gameId}" 
                               value="${game.homeML || '-110'}" 
                               style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); 
                                      border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; 
                                      color: white;">
                    </div>
                    
                    <div>
                        <label style="color: #94a3b8; font-size: 0.75rem;">${game.awayTeam} ML</label>
                        <input type="text" 
                               id="awayML_${gameId}" 
                               value="${game.awayML || '-110'}" 
                               style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); 
                                      border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; 
                                      color: white;">
                    </div>
                </div>
                
                <div style="margin-top: 8px; display: flex; gap: 10px;">
                    <button onclick="window.quickLeague.resetLine('${gameId}')" 
                            style="padding: 4px 12px; background: rgba(239, 68, 68, 0.2); 
                                   border: 1px solid #ef4444; border-radius: 4px; 
                                   color: #ef4444; cursor: pointer; font-size: 0.85rem;">
                        Reset to Original
                    </button>
                    <span id="lineStatus_${gameId}" style="color: #00ff88; font-size: 0.85rem; display: none;">
                        ✓ Modified
                    </span>
                </div>
            </div>
        `;
    }
    
    resetLine(gameId) {
        const original = this.originalLines[gameId];
        if (!original) return;
        
        document.getElementById(`spread_${gameId}`).value = Math.abs(original.spread);
        document.getElementById(`total_${gameId}`).value = original.total;
        document.getElementById(`homeML_${gameId}`).value = original.homeML || '-110';
        document.getElementById(`awayML_${gameId}`).value = original.awayML || '-110';
        
        document.getElementById(`lineStatus_${gameId}`).style.display = 'none';
    }
    
    async saveLineAdjustments() {
        const adjustments = {};
        
        Object.keys(this.originalLines).forEach(gameId => {
            const spread = parseFloat(document.getElementById(`spread_${gameId}`).value);
            const total = parseFloat(document.getElementById(`total_${gameId}`).value);
            const homeML = document.getElementById(`homeML_${gameId}`).value;
            const awayML = document.getElementById(`awayML_${gameId}`).value;
            
            adjustments[gameId] = {
                spread: spread,
                total: total,
                homeML: homeML,
                awayML: awayML
            };
        });
        
        // Save to localStorage for this league/week
        const leagueId = this.activeLeague?.id || this.activeLeague?._id;
        const week = this.selectedWeek;
        const adjustmentKey = `league_line_adjustments_${leagueId}_${week}`;
        localStorage.setItem(adjustmentKey, JSON.stringify(adjustments));
        
        // Also save to backend if authenticated
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await fetch(`/api/leagues/${leagueId}/adjust-lines`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        week: week,
                        adjustments: adjustments
                    })
                });
            } catch (error) {
                console.error('Error saving line adjustments:', error);
            }
        }
        
        alert('Line adjustments saved successfully!');
        
        // Update status indicators
        Object.keys(adjustments).forEach(gameId => {
            const status = document.getElementById(`lineStatus_${gameId}`);
            if (status) {
                status.style.display = 'inline';
            }
        });
    }
    
    reRender() {
        // Find the container - try multiple possible selectors
        let container = document.querySelector('.feed-posts');
        if (!container) {
            container = document.querySelector('#quickLeagueContainer');
        }
        if (!container) {
            container = document.querySelector('[data-component="quick-league"]');
        }
        if (!container) {
            // If no container exists, try to find where QuickLeague should render
            const mainContent = document.querySelector('.main-content') || 
                              document.querySelector('#app') || 
                              document.querySelector('main') ||
                              document.body;
            
            if (mainContent) {
                container = document.createElement('div');
                container.id = 'quickLeagueContainer';
                mainContent.appendChild(container);
            }
        }
        
        if (container) {
            container.innerHTML = this.render();
            this.attachAllEventListeners();
            this.hasUnsavedChanges = true;
            this.saveState();
        }
    }
}

// Create global instance
window.quickLeague = new QuickLeague();