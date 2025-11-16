// API Service - Centralized API communication with demo fallbacks
class ApiService {
    constructor() {
        this.baseUrl = window.location.origin;
        this.token = localStorage.getItem('token');
        this.demoMode = false; // Track if we're using demo data
    }

    // Update token
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Clear token
    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    // Generic fetch wrapper with demo fallback
    async request(endpoint, options = {}, demoFallback = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        // Add auth token if available
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            // If we get a 404 or 500, use demo fallback if available
            if ((response.status === 404 || response.status === 500) && demoFallback) {
                console.log(`📦 Using demo data for ${endpoint}`);
                return demoFallback();
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                // Try demo fallback on any error if available
                if (demoFallback) {
                    console.log(`📦 Using demo data for ${endpoint} (error fallback)`);
                    return demoFallback();
                }
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            // If fetch fails completely and we have demo data, use it
            if (demoFallback) {
                console.log(`📦 Using demo data for ${endpoint} (network fallback)`);
                return demoFallback();
            }
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Auth endpoints
    async login(username, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        }, () => {
            // Demo login always succeeds
            const user = {
                _id: 'user-' + Date.now(),
                username: username.includes('@') ? username.split('@')[0] : username,
                email: username.includes('@') ? username : `${username}@huddle.com`,
                displayName: username.includes('@') ? username.split('@')[0] : username,
                verified: true,
                degenCoins: 100,
                stats: {
                    posts: 0,
                    followers: 0,
                    following: 0,
                    picks: 0,
                    accuracy: 0
                }
            };
            
            const token = 'demo-token-' + Date.now();
            this.setToken(token);
            
            // Store in localStorage
            localStorage.setItem('user', JSON.stringify(user));
            
            return {
                success: true,
                user,
                token
            };
        });
    }

    async register(userData) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        }, () => {
            // Demo registration
            const user = {
                _id: 'user-' + Date.now(),
                ...userData,
                verified: false,
                degenCoins: 50,
                stats: {
                    posts: 0,
                    followers: 0,
                    following: 0,
                    picks: 0,
                    accuracy: 0
                }
            };
            
            const token = 'demo-token-' + Date.now();
            this.setToken(token);
            
            localStorage.setItem('user', JSON.stringify(user));
            
            return {
                success: true,
                user,
                token
            };
        });
    }

    async logout() {
        this.clearToken();
        localStorage.removeItem('user');
        window.location.href = '/';
    }

    // Post endpoints
    async getFeedPosts() {
        return this.request('/api/posts/feed', {}, () => {
            // Return demo posts
            return {
                success: true,
                posts: this.getDemoPosts()
            };
        });
    }

    async createPost(postData) {
        // Clean up the post data before sending
        const payload = {
            content: postData.content || '',
            type: postData.type || 'post',
            media: postData.media || [],
            location: postData.location || null,
            prediction: postData.prediction,
            challengeBet: postData.challengeBet ? {
                ...postData.challengeBet,
                // CRITICAL: Preserve teams at root level
                awayTeam: postData.challengeBet.awayTeam || postData.challengeBet.game?.awayTeam || 'Away',
                homeTeam: postData.challengeBet.homeTeam || postData.challengeBet.game?.homeTeam || 'Home',
                team: postData.challengeBet.team,
                spread: postData.challengeBet.spread,
                game: postData.challengeBet.game
            } : null,
            taggedGame: postData.taggedGame
        };
        
        console.log('📤 Sending to API with challengeBet:', payload.challengeBet);
        
        return this.request('/api/posts/create', {
            method: 'POST',
            body: JSON.stringify(payload)
        }, () => {
            // Create demo post
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const newPost = {
                _id: 'post-' + Date.now(),
                ...payload,
                // Ensure challengeBet has all needed data
                challengeBet: payload.challengeBet ? {
                    ...payload.challengeBet,
                    awayTeam: payload.challengeBet.awayTeam || payload.challengeBet.game?.awayTeam || 'Away',
                    homeTeam: payload.challengeBet.homeTeam || payload.challengeBet.game?.homeTeam || 'Home',
                    team: payload.challengeBet.team,
                    spread: payload.challengeBet.spread
                } : null,
                author: {
                    _id: user._id,
                    username: user.username,
                    displayName: user.displayName,
                    verified: user.verified
                },
                likes: [],
                dislikes: [],
                comments: [],
                shares: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            // Store in session for persistence
            const posts = JSON.parse(sessionStorage.getItem('demoPosts') || '[]');
            posts.unshift(newPost);
            sessionStorage.setItem('demoPosts', JSON.stringify(posts));
            
            return {
                success: true,
                post: newPost
            };
        });
    }

    async getPost(postId) {
        return this.request(`/api/posts/${postId}`, {}, () => {
            // Return demo post
            const posts = this.getDemoPosts();
            const post = posts.find(p => p._id === postId) || posts[0];
            return { success: true, post };
        });
    }

    async likePost(postId) {
        return this.request(`/api/posts/${postId}/like`, {
            method: 'POST'
        }, () => {
            // Demo like
            return { 
                success: true, 
                liked: true,
                likes: Math.floor(Math.random() * 1000) + 1
            };
        });
    }

    async dislikePost(postId) {
        return this.request(`/api/posts/${postId}/dislike`, {
            method: 'POST'
        }, () => {
            // Demo dislike
            return { 
                success: true, 
                disliked: true,
                dislikes: Math.floor(Math.random() * 100) + 1
            };
        });
    }

    async commentOnPost(postId, content) {
        return this.request(`/api/posts/${postId}/comment`, {
            method: 'POST',
            body: JSON.stringify({ content })
        }, () => {
            // Demo comment
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const comment = {
                _id: 'comment-' + Date.now(),
                content,
                author: {
                    _id: user._id,
                    username: user.username,
                    displayName: user.displayName,
                    verified: user.verified
                },
                createdAt: new Date(),
                likes: []
            };
            
            return {
                success: true,
                comment
            };
        });
    }

    async getComments(postId) {
        return this.request(`/api/posts/${postId}/comments`, {}, () => {
            // Demo comments
            return {
                success: true,
                comments: this.getDemoComments()
            };
        });
    }

    async sharePost(postId) {
        return this.request(`/api/posts/${postId}/share`, {
            method: 'POST'
        }, () => {
            return { 
                success: true, 
                shared: true,
                shares: Math.floor(Math.random() * 100) + 1
            };
        });
    }

    async bookmarkPost(postId) {
        return this.request(`/api/posts/${postId}/bookmark`, {
            method: 'POST'
        }, () => {
            return { 
                success: true, 
                bookmarked: true
            };
        });
    }

    // Challenge Bet endpoints
    async acceptBet(postId) {
        return this.request(`/api/posts/${postId}/accept-bet`, {
            method: 'POST'
        }, () => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return {
                success: true,
                participant: {
                    _id: user._id,
                    username: user.username,
                    displayName: user.displayName
                },
                message: 'Bet accepted!'
            };
        });
    }

    async cancelBet(postId) {
        return this.request(`/api/posts/${postId}/cancel-bet`, {
            method: 'POST'
        }, () => {
            return {
                success: true,
                message: 'Bet cancelled'
            };
        });
    }

    async leaveBet(postId) {
        return this.request(`/api/posts/${postId}/leave-bet`, {
            method: 'POST'
        }, () => {
            return {
                success: true,
                message: 'Left bet'
            };
        });
    }

    // User endpoints
    async getUser(username) {
        return this.request(`/api/users/${username}`, {}, () => {
            // Demo user profile
            return {
                success: true,
                user: {
                    _id: 'user-' + username,
                    username,
                    displayName: username,
                    bio: 'Sports betting enthusiast',
                    verified: Math.random() > 0.5,
                    stats: {
                        posts: Math.floor(Math.random() * 1000),
                        followers: Math.floor(Math.random() * 10000),
                        following: Math.floor(Math.random() * 500),
                        picks: Math.floor(Math.random() * 2000),
                        accuracy: Math.floor(Math.random() * 40) + 50
                    }
                }
            };
        });
    }

    async getCurrentUser() {
        if (!this.token) return null;
        return this.request('/api/users/me', {}, () => {
            // Return stored user
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            return { success: true, user };
        });
    }

    async updateProfile(updates) {
        return this.request('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(updates)
        }, () => {
            // Update local user
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { ...user, ...updates };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return { success: true, user: updatedUser };
        });
    }

    async followUser(userId) {
        return this.request(`/api/users/${userId}/follow`, {
            method: 'POST'
        }, () => {
            return { success: true, following: true };
        });
    }

    async unfollowUser(userId) {
        return this.request(`/api/users/${userId}/unfollow`, {
            method: 'POST'
        }, () => {
            return { success: true, following: false };
        });
    }

    // Lines/Games endpoints
    async getGames() {
        return this.request('/api/lines/games', {}, () => {
            // Use live lines service demo data
            return {
                success: true,
                games: window.liveLinesService ? window.liveLinesService.getDemoGames() : []
            };
        });
    }

    async getGameLines(gameId) {
        return this.request(`/api/lines/${gameId}`, {}, () => {
            // Use live lines service demo data
            return {
                success: true,
                lines: window.liveLinesService ? window.liveLinesService.getDemoLines(gameId) : {}
            };
        });
    }

    // Search endpoints
    async search(query) {
        return this.request(`/api/search?q=${encodeURIComponent(query)}`, {}, () => {
            return {
                success: true,
                results: {
                    users: [],
                    posts: [],
                    tags: []
                }
            };
        });
    }

    async searchUsers(query) {
        return this.request(`/api/search/users?q=${encodeURIComponent(query)}`, {}, () => {
            return { success: true, users: [] };
        });
    }

    async searchPosts(query) {
        return this.request(`/api/search/posts?q=${encodeURIComponent(query)}`, {}, () => {
            return { success: true, posts: [] };
        });
    }

    // Notifications
    async getNotifications() {
        return this.request('/api/notifications', {}, () => {
            return {
                success: true,
                notifications: [
                    {
                        _id: 'notif-1',
                        type: 'like',
                        message: 'Someone liked your post',
                        read: false,
                        createdAt: new Date(Date.now() - 3600000)
                    }
                ]
            };
        });
    }

    async markNotificationRead(notificationId) {
        return this.request(`/api/notifications/${notificationId}/read`, {
            method: 'POST'
        }, () => {
            return { success: true };
        });
    }

    // Analytics
    async getAnalytics() {
        return this.request('/api/analytics/me', {}, () => {
            return {
                success: true,
                analytics: {
                    totalPicks: 847,
                    winRate: 72,
                    roi: 15.3,
                    streak: 5,
                    bestSport: 'NFL'
                }
            };
        });
    }

    async getPostAnalytics(postId) {
        return this.request(`/api/analytics/posts/${postId}`, {}, () => {
            return {
                success: true,
                analytics: {
                    views: Math.floor(Math.random() * 10000),
                    engagement: Math.floor(Math.random() * 100),
                    shares: Math.floor(Math.random() * 100)
                }
            };
        });
    }

    // Demo data generators
    getDemoPosts() {
        // Check session storage for any created posts
        const sessionPosts = JSON.parse(sessionStorage.getItem('demoPosts') || '[]');
        
        const demoPosts = [
            {
                _id: 'demo-post-1',
                author: {
                    _id: 'user-1',
                    username: 'SharpShooter88',
                    displayName: 'Mike Thompson',
                    verified: true
                },
                content: "Vikings -7 is a LOCK tonight! 🔥 They're 8-2 at home this season and Chicago can't move the ball in cold weather. Hammer this line before it moves!",
                type: 'prediction',
                prediction: {
                    game: 'MIN vs CHI',
                    pick: 'Vikings -7',
                    confidence: 95,
                    amount: 500
                },
                likes: Array(234).fill(null),
                dislikes: Array(12).fill(null),
                comments: Array(45).fill(null),
                shares: Array(12).fill(null),
                createdAt: new Date(Date.now() - 3600000)
            },
            {
                _id: 'demo-post-2',
                author: {
                    _id: 'user-2',
                    username: 'BettyBets',
                    displayName: 'Betty Rodriguez',
                    verified: false
                },
                content: "Just hit a 5-leg parlay! 💰💰💰 All underdogs baby! Who else is riding the dog train tonight?",
                type: 'post',
                likes: Array(567).fill(null),
                dislikes: Array(23).fill(null),
                comments: Array(89).fill(null),
                shares: Array(45).fill(null),
                createdAt: new Date(Date.now() - 7200000)
            }
        ];
        
        // Combine session posts with demo posts
        return [...sessionPosts, ...demoPosts];
    }

    getDemoComments() {
        return [
            {
                _id: 'comment-1',
                content: 'Great pick! Tailing this one',
                author: {
                    _id: 'user-3',
                    username: 'sportsfan23',
                    displayName: 'Sports Fan',
                    verified: false
                },
                createdAt: new Date(Date.now() - 1800000),
                likes: Array(12).fill(null)
            },
            {
                _id: 'comment-2',
                content: 'Bears defense is underrated though',
                author: {
                    _id: 'user-4',
                    username: 'bearsbacker',
                    displayName: 'Chicago Native',
                    verified: false
                },
                createdAt: new Date(Date.now() - 900000),
                likes: Array(5).fill(null)
            }
        ];
    }
}

// Create global instance
window.apiService = new ApiService();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}