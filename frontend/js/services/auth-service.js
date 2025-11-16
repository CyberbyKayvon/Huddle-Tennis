// Auth Service - Handles authentication and user session
class AuthService {
    constructor() {
        this.user = null;
        this.token = localStorage.getItem('token');
        this.loadUser();
    }

    // Load user from localStorage
    loadUser() {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                this.user = JSON.parse(storedUser);
            } catch (e) {
                console.error('Failed to parse stored user:', e);
                this.user = null;
            }
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Get user ID
    getUserId() {
        return this.user?.id || this.user?._id || null;
    }

    // Get username
    getUsername() {
        return this.user?.username || null;
    }

    // Get display name
    getDisplayName() {
        return this.user?.displayName || this.user?.username || 'User';
    }

    // Login
    async login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                
                // Store in localStorage
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                // Update API service token
                if (window.apiService) {
                    window.apiService.setToken(this.token);
                }
                
                return { success: true, user: this.user };
            } else {
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Register
    async register(userData) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.success) {
                // Auto-login after registration
                return this.login(userData.username, userData.password);
            } else {
                return { success: false, error: data.error || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Logout
    logout() {
        this.token = null;
        this.user = null;
        
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Clear API service token
        if (window.apiService) {
            window.apiService.clearToken();
        }
        
        // Redirect to login
        window.location.href = '/login.html';
    }

    // Update user profile in local storage
    updateLocalUser(updates) {
        if (this.user) {
            this.user = { ...this.user, ...updates };
            localStorage.setItem('user', JSON.stringify(this.user));
        }
    }

    // Verify token is still valid
    async verifyToken() {
        if (!this.token) return false;
        
        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (!data.success) {
                // Don't auto-logout, just return false
                console.warn('Token verification failed');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Token verification failed:', error);
            // Don't logout on network errors
            return false;
        }
    }

    // Check if user has permission
    hasPermission(permission) {
        return this.user?.permissions?.includes(permission) || false;
    }

    // Check if user is verified
    isVerified() {
        return this.user?.verified || false;
    }

    // Check if user is admin
    isAdmin() {
        return this.user?.role === 'admin' || false;
    }

    // Get user avatar initial
    getAvatarInitial() {
        const name = this.getDisplayName();
        return name ? name[0].toUpperCase() : 'U';
    }

    // Format user stats
    getUserStats() {
        return {
            predictions: this.user?.stats?.predictions || 0,
            accuracy: this.user?.stats?.accuracy || 0,
            followers: this.user?.stats?.followers || 0,
            following: this.user?.stats?.following || 0,
            wins: this.user?.stats?.wins || 0,
            losses: this.user?.stats?.losses || 0
        };
    }
}

// Create global instance
window.authService = new AuthService();

// Auto-verify token on load (commented out for now - causing logout issues)
// if (window.authService.isAuthenticated()) {
//     window.authService.verifyToken();
// }

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
}