// Real-Time Service - Handles all Socket.IO connections

// Import core services
import { storageService } from '/js/core/services/storage-service.js';

class RealtimeService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.listeners = new Map();
        this.typingTimers = new Map();
        this.onlineUsers = new Set();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    // Initialize socket connection
    init() {
        if (this.socket) return;
        
        // Check if Socket.IO is loaded
        if (typeof io === 'undefined') {
            console.error('Socket.IO not loaded! Retrying...');
            setTimeout(() => this.init(), 1000);
            return;
        }
        
        console.log('🔌 Initializing real-time connection...');
        
        this.socket = io(window.location.origin, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts
        });
        
        this.setupEventListeners();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('✅ Real-time connected!');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.authenticateSocket();
            this.showToast('Connected to live updates', 'success');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Real-time disconnected');
            this.connected = false;
            this.showToast('Live updates disconnected', 'warning');
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            this.reconnectAttempts = attemptNumber;
            if (attemptNumber > 3) {
                this.showToast(`Reconnecting... (${attemptNumber}/${this.maxReconnectAttempts})`, 'info');
            }
        });

        // Real-time events
        this.socket.on('new_post', (post) => this.handleNewPost(post));
        this.socket.on('post_liked', (data) => this.updatePostLikes(data));
        this.socket.on('new_comment', (data) => this.handleNewComment(data));
        this.socket.on('user_typing', (data) => this.showTypingIndicator(data));
        this.socket.on('user_online', (userId) => this.handleUserOnline(userId));
        this.socket.on('user_offline', (userId) => this.handleUserOffline(userId));
        this.socket.on('notification', (notification) => this.showLiveNotification(notification));
        this.socket.on('new_follower', (data) => this.handleNewFollower(data));
        this.socket.on('line_update', (data) => this.handleLineUpdate(data));
        this.socket.on('score_update', (data) => this.handleScoreUpdate(data));
    }

    // Authenticate socket with user
    authenticateSocket() {
        const user = storageService.get('user');
        if (user && user._id) {
            this.socket.emit('authenticate', {
                userId: user._id,
                username: user.username
            });
        }
    }

    // Handle new post in real-time
    handleNewPost(post) {
        // Check if post already exists
        const existingPost = document.querySelector(`[data-post-id="${post._id}"]`);
        if (existingPost) return;
        
        // Only show posts from OTHER users
        const user = storageService.get('user');
        if (post.author._id === user?._id) return;
        
        // Dispatch event for components to handle
        window.dispatchEvent(new CustomEvent('realtimeNewPost', {
            detail: { post }
        }));
        
        // Show notification if tab not focused
        if (!document.hasFocus()) {
            this.showBrowserNotification(
                `New post from ${post.author.username}`, 
                post.content.substring(0, 100)
            );
        }
    }

    // Handle new comment
    handleNewComment(data) {
        window.dispatchEvent(new CustomEvent('realtimeNewComment', {
            detail: data
        }));
    }

    // Update post likes
    updatePostLikes(data) {
        window.dispatchEvent(new CustomEvent('realtimePostLiked', {
            detail: data
        }));
    }

    // Handle line updates
    handleLineUpdate(data) {
        window.dispatchEvent(new CustomEvent('realtimeLineUpdate', {
            detail: data
        }));
    }

    // Handle score updates
    handleScoreUpdate(data) {
        window.dispatchEvent(new CustomEvent('realtimeScoreUpdate', {
            detail: data
        }));
    }

    // Handle user online
    handleUserOnline(userId) {
        this.onlineUsers.add(userId);
        window.dispatchEvent(new CustomEvent('userOnline', {
            detail: { userId }
        }));
    }

    // Handle user offline
    handleUserOffline(userId) {
        this.onlineUsers.delete(userId);
        window.dispatchEvent(new CustomEvent('userOffline', {
            detail: { userId }
        }));
    }

    // Handle new follower
    handleNewFollower(data) {
        window.dispatchEvent(new CustomEvent('newFollower', {
            detail: data
        }));
        this.showLiveNotification({
            type: 'follow',
            message: `started following you`,
            from: data.followerName
        });
    }

    // Show typing indicator
    showTypingIndicator(data) {
        window.dispatchEvent(new CustomEvent('userTyping', {
            detail: data
        }));
        
        // Clear existing timer
        if (this.typingTimers.has(data.userId)) {
            clearTimeout(this.typingTimers.get(data.userId));
        }
        
        // Hide after 3 seconds
        const timer = setTimeout(() => {
            window.dispatchEvent(new CustomEvent('userStoppedTyping', {
                detail: { userId: data.userId }
            }));
        }, 3000);
        
        this.typingTimers.set(data.userId, timer);
    }

    // Show live notification
    showLiveNotification(notification) {
        window.dispatchEvent(new CustomEvent('liveNotification', {
            detail: notification
        }));
        
        // Update notification badge
        this.incrementNotificationBadge();
    }

    // Emit typing event
    emitTyping(location) {
        if (!this.connected) return;
        
        const user = storageService.get('user');
        if (user?._id) {
            this.socket.emit('typing', {
                userId: user._id,
                username: user.username,
                location
            });
        }
    }

    // Emit new post
    emitNewPost(post) {
        if (!this.connected) return;
        this.socket.emit('post_created', post);
    }

    // Emit like
    emitLike(postId, likeCount) {
        if (!this.connected) return;
        
        const user = storageService.get('user');
        this.socket.emit('like_post', {
            postId,
            likeCount,
            userId: user?._id,
            username: user?.username
        });
    }

    // Emit comment
    emitComment(postId, comment) {
        if (!this.connected) return;
        this.socket.emit('new_comment', {
            postId,
            comment
        });
    }

    // Check if user is online
    isUserOnline(userId) {
        return this.onlineUsers.has(userId);
    }

    // Helper functions
    showToast(message, type = 'info') {
        const event = new CustomEvent('showToast', {
            detail: { message, type }
        });
        window.dispatchEvent(event);
    }

    showBrowserNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/icon.png'
            });
        }
    }

    incrementNotificationBadge() {
        const badge = document.querySelector('.nav-badge');
        if (badge) {
            const current = parseInt(badge.textContent) || 0;
            badge.textContent = current + 1;
        }
    }

    // Cleanup on disconnect
    cleanup() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.connected = false;
        this.listeners.clear();
        this.typingTimers.clear();
        this.onlineUsers.clear();
    }
}

// Create and export instance
const realtimeService = new RealtimeService();

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    // Make available globally
    window.realtimeService = realtimeService;
    
    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => realtimeService.init(), 1000);
        });
    } else {
        setTimeout(() => realtimeService.init(), 1000);
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Export for module usage
export { realtimeService, RealtimeService };