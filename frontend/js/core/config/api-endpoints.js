// api-endpoints.js
// SINGLE SOURCE OF TRUTH for all API endpoints
// Every component will import from this file

export const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        LOGIN: '/api/auth/login',
        SIGNUP: '/api/auth/signup',
        VERIFY: '/api/auth/verify',
        REFRESH: '/api/auth/refresh',
        DAILY_BONUS: '/api/auth/daily-bonus',
        PROFILE: '/api/auth/profile'
    },
    
    // Posts & Social
    POSTS: {
        CREATE: '/api/posts/create',
        FEED: '/api/posts/feed',
        FILTER: '/api/posts/filter',
        BY_ID: (postId) => `/api/posts/${postId}`,
        LIKE: (postId) => `/api/posts/${postId}/like`,
        DISLIKE: (postId) => `/api/posts/${postId}/dislike`,
        COMMENT: (postId) => `/api/posts/${postId}/comment`,
        COMMENTS: (postId) => `/api/posts/${postId}/comments`,
        ACCEPT_BET: (postId) => `/api/posts/${postId}/accept-bet`,
        CANCEL_BET: (postId) => `/api/posts/${postId}/cancel-bet`,
        LEAVE_BET: (postId) => `/api/posts/${postId}/leave-bet`,
        DELETE: (postId) => `/api/posts/${postId}`
    },
    
    // Games & Schedule
    GAMES: {
        NFL_SCHEDULE: (week, seasonType = 'regular') => `/api/nfl/schedule/${week}?seasonType=${seasonType}`,
        GET_TODAY: '/api/games/today',  // Add this for betting-hub
        LIVE_GAMES: '/api/games/live',
        BY_SPORT_DATE: (sport, date) => `/api/games/${sport}/${date}`,
        BY_SPORT_WEEK: (sport, startDate) => `/api/games/${sport}/week/${startDate}`
    },
    
    // NFL Specific (Add this entire new section)
    NFL: {
        GET_CURRENT_WEEK: '/api/nfl/current-week',
        GET_SCHEDULE: (week, seasonType) => `/api/nfl/schedule/${week}?seasonType=${seasonType}`,
        GET_GAME: (gameId) => `/api/nfl/game/${gameId}`,
        GET_STANDINGS: '/api/nfl/standings'
    },
    
    // Betting Lines
    LINES: {
        ALL_GAMES: '/api/lines/games',
        BY_GAME: (gameId) => `/api/lines/${gameId}`,
        MOVEMENT: (gameId) => `/api/lines/${gameId}/movement`,
        BEST: (gameId) => `/api/lines/${gameId}/best`,
        SCORES: '/api/lines/scores'
    },
    
    // User
    USERS: {
        BY_USERNAME: (username) => `/api/users/${username}`,
        POSTS: (username) => `/api/users/${username}/posts`,
        PREDICTIONS: (username) => `/api/users/${username}/predictions`,
        FOLLOWERS: (username) => `/api/users/${username}/followers`,
        FOLLOWING: (username) => `/api/users/${username}/following`,
        FOLLOW: (userId) => `/api/users/${userId}/follow`,
        UNFOLLOW: (userId) => `/api/users/${userId}/unfollow`
    },
    
    // Leagues
    LEAGUES: {
        USER: '/api/leagues/user',
        PUBLIC: '/api/leagues/public',
        CREATE: '/api/leagues/create',
        JOIN: (leagueId) => `/api/leagues/${leagueId}/join`,
        JOIN_BY_CODE: '/api/leagues/join-by-code',
        PICKS: (leagueId) => `/api/leagues/${leagueId}/picks`,
        CHAT: (leagueId) => `/api/leagues/${leagueId}/chat`,
        BY_ID: (leagueId) => `/api/leagues/${leagueId}`
    },
    
    // Groups
    GROUPS: {
        ALL: '/api/groups',
        DISCOVER: '/api/groups/discover',
        DISCOVER_BY_CATEGORY: (category) => `/api/groups/discover?category=${category}`,
        INVITES: '/api/groups/invites',
        JOIN: (groupId) => `/api/groups/${groupId}/join`,
        JOIN_BY_CODE: (code) => `/api/groups/join/${code}`
    },
    
    // Explore
    EXPLORE: {
        ACTIVITY: '/api/explore/activity',
        FILTER: (filter) => `/api/explore/filter?type=${filter}`,
        SEARCH: (query) => `/api/explore/search?query=${encodeURIComponent(query)}`,
        CONSENSUS: '/api/explore/consensus'
    },
    
    // Trending
    TRENDING: {
        LIVE: '/api/trending/live',
        BY_HASHTAG: (tag) => `/api/trending/hashtag/${tag}`
    },
    
    // Notifications
    NOTIFICATIONS: {
        ALL: '/api/notifications',
        MARK_READ: (notifId) => `/api/notifications/${notifId}/read`,
        MARK_ALL_READ: '/api/notifications/read-all',
        UNREAD_COUNT: '/api/notifications/unread-count'
    },
    
    // Analysis
    ANALYSIS: {
        BASIC: (gameId) => `/api/analysis/basic/${gameId}`,
        COMPREHENSIVE: '/api/analysis/comprehensive',
        ENHANCED: '/api/analysis/enhanced',
        ULTRA: '/api/analysis/ultra-comprehensive'
    },
    
    // Coins & Currency
    COINS: {
        DEDUCT: '/api/coins/deduct',
        BALANCE: '/api/coins/balance',
        PACKAGES: '/api/coins/packages'
    },
    
    // Reputation
    REPUTATION: {
        GET: (userId) => `/api/reputation/${userId}`
    },
    
    // Platforms
    PLATFORMS: {
        GENERATE: '/api/platforms/generate'
    },
    
    // Side Bets
    SIDEBETS: {
        CHALLENGE: '/api/sidebets/challenge'
    },
    
    // External APIs
    EXTERNAL: {
        ESPN_NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
        ESPN_NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
        ESPN_MLB: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard'
    }
};

// Freeze to prevent accidental modifications
Object.freeze(API_ENDPOINTS);