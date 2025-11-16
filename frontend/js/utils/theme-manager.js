// Theme Manager - Handles theme and mode switching
class ThemeManager {
    constructor() {
        this.currentMode = localStorage.getItem('huddleMode') || 'dark';
        this.currentTheme = localStorage.getItem('huddleTheme') || 'default';
        this.init();
    }

    init() {
        // Apply saved preferences
        this.applyMode(this.currentMode);
        this.applyTheme(this.currentTheme);
        
        // Set up listeners if selectors exist
        this.attachListeners();
    }

    attachListeners() {
        const modeSelector = document.getElementById('modeSelector');
        const themeSelector = document.getElementById('themeSelector');
        
        if (modeSelector) {
            modeSelector.value = this.currentMode;
            modeSelector.addEventListener('change', (e) => this.setMode(e.target.value));
        }
        
        if (themeSelector) {
            themeSelector.value = this.currentTheme;
            themeSelector.addEventListener('change', (e) => this.setTheme(e.target.value));
        }
    }

    // Set background mode (dark, light, midnight, dim)
    setMode(mode) {
        this.currentMode = mode;
        this.applyMode(mode);
        localStorage.setItem('huddleMode', mode);
        console.log(`🌓 Switched to ${mode.toUpperCase()} mode!`);
    }

    // Set accent theme (team colors)
    setTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        localStorage.setItem('huddleTheme', theme);
        
        if (theme !== 'default') {
            console.log(`🏈 Applied ${theme.toUpperCase()} theme!`);
        }
    }

    // Apply mode to DOM
    applyMode(mode) {
        document.documentElement.setAttribute('data-mode', mode);
        document.body.style.transition = 'background 0.3s ease';
    }

    // Apply theme to DOM
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.style.transition = 'background 0.3s ease';
    }

    // Get current mode
    getMode() {
        return this.currentMode;
    }

    // Get current theme
    getTheme() {
        return this.currentTheme;
    }

    // Check if dark mode
    isDarkMode() {
        return this.currentMode === 'dark' || this.currentMode === 'midnight' || this.currentMode === 'dim';
    }

    // Check if light mode
    isLightMode() {
        return this.currentMode === 'light';
    }

    // Toggle between light and dark
    toggleMode() {
        const newMode = this.isDarkMode() ? 'light' : 'dark';
        this.setMode(newMode);
    }

    // Get all available modes
    getAvailableModes() {
        return [
            { value: 'dark', label: '🌑 Dark Mode', description: 'Default dark theme' },
            { value: 'light', label: '☀️ Light Mode', description: 'Bright theme for daytime' },
            { value: 'midnight', label: '🌙 Midnight (OLED)', description: 'Pure black for OLED screens' },
            { value: 'dim', label: '🌆 Dim (Twitter)', description: 'Soft dark with blue tint' }
        ];
    }

    // Get all available themes (NFL teams)
    getAvailableThemes() {
        return {
            default: 'Default Purple',
            // AFC East
            bills: 'Buffalo Bills',
            dolphins: 'Miami Dolphins',
            patriots: 'New England Patriots',
            jets: 'New York Jets',
            // AFC North
            ravens: 'Baltimore Ravens',
            bengals: 'Cincinnati Bengals',
            browns: 'Cleveland Browns',
            steelers: 'Pittsburgh Steelers',
            // AFC South
            texans: 'Houston Texans',
            colts: 'Indianapolis Colts',
            jaguars: 'Jacksonville Jaguars',
            titans: 'Tennessee Titans',
            // AFC West
            broncos: 'Denver Broncos',
            chiefs: 'Kansas City Chiefs',
            raiders: 'Las Vegas Raiders',
            chargers: 'Los Angeles Chargers',
            // NFC East
            cowboys: 'Dallas Cowboys',
            giants: 'New York Giants',
            eagles: 'Philadelphia Eagles',
            commanders: 'Washington Commanders',
            // NFC North
            bears: 'Chicago Bears',
            lions: 'Detroit Lions',
            packers: 'Green Bay Packers',
            vikings: 'Minnesota Vikings',
            // NFC South
            falcons: 'Atlanta Falcons',
            panthers: 'Carolina Panthers',
            saints: 'New Orleans Saints',
            buccaneers: 'Tampa Bay Buccaneers',
            // NFC West
            cardinals: 'Arizona Cardinals',
            rams: 'Los Angeles Rams',
            '49ers': 'San Francisco 49ers',
            seahawks: 'Seattle Seahawks'
        };
    }

    // Get CSS variable value
    getCSSVariable(variable) {
        return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    }

    // Set CSS variable
    setCSSVariable(variable, value) {
        document.documentElement.style.setProperty(variable, value);
    }

    // Get current color palette
    getColorPalette() {
        return {
            primary: this.getCSSVariable('--primary'),
            primaryDark: this.getCSSVariable('--primary-dark'),
            primaryLight: this.getCSSVariable('--primary-light'),
            accent: this.getCSSVariable('--accent'),
            success: this.getCSSVariable('--success'),
            danger: this.getCSSVariable('--danger'),
            warning: this.getCSSVariable('--warning'),
            bgPrimary: this.getCSSVariable('--bg-primary'),
            bgSecondary: this.getCSSVariable('--bg-secondary'),
            textPrimary: this.getCSSVariable('--text-primary'),
            textSecondary: this.getCSSVariable('--text-secondary')
        };
    }
}

// Create global instance
window.themeManager = new ThemeManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}