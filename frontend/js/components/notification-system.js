// Notification System Component

// Import core services
import { apiService } from '/js/core/services/api-service.js';
import { API_ENDPOINTS } from '/js/core/config/api-endpoints.js';
import { storageService } from '/js/core/services/storage-service.js';
import { sanitizer } from '/js/core/utils/sanitizer.js';
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.isOpen = false;
        this.init();
    }

    init() {
        // Create notification UI elements
        this.createNotificationUI();
        
        // Load initial notifications
        this.loadNotifications();
        
        // Start polling for new notifications
        this.startPolling();
        
        // Notification system initialized
    }

    createNotificationUI() {
        // Update the notification nav item to show count
        const notificationNav = document.querySelector('.nav-item .fa-bell')?.closest('.nav-item');
        if (notificationNav) {
            notificationNav.onclick = (e) => {
                e.preventDefault();
                this.toggleNotificationPanel();
            };
        }

        // Create notification panel
        const panel = document.createElement('div');
        panel.id = 'notificationPanel';
        panel.className = 'notification-panel';
        panel.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            width: 400px;
            max-height: 600px;
            background: var(--bg-secondary);
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            display: none;
            overflow: hidden;
            border: 1px solid var(--border);
        `;
        
        panel.innerHTML = `
            <div class="notification-header" style="padding: 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 1.1rem;">Notifications</h3>
                <button onclick="notificationSystem.markAllAsRead()" style="background: none; border: none; color: var(--primary); cursor: pointer; font-size: 0.875rem;">Mark all as read</button>
            </div>
            <div class="notification-list" style="max-height: 500px; overflow-y: auto;">
                <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    <i class="fas fa-spinner fa-spin"></i> Loading...
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
    }

    async loadNotifications() {
        try {
            const data = await apiService.get(API_ENDPOINTS.NOTIFICATIONS.ALL);
            
            if (data.success) {
                this.notifications = data.notifications || [];
                this.unreadCount = data.unreadCount || 0;
                this.updateNotificationBadge();
                this.renderNotifications();
            }
        } catch (error) {
            // Error handled by apiService
            this.notifications = [];
            this.unreadCount = 0;
            this.renderNotifications();
        }
    }

    renderNotifications() {
        const listContainer = document.querySelector('.notification-list');
        if (!listContainer) return;

        if (this.notifications.length === 0) {
            listContainer.innerHTML = `
                <div style="padding: 3rem; text-align: center;">
                    <i class="fas fa-bell-slash" style="font-size: 3rem; color: var(--text-muted); opacity: 0.5; margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-muted);">No notifications yet</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = this.notifications.map(notif => this.createNotificationHTML(notif)).join('');
    }

    createNotificationHTML(notif) {
        const timeAgo = this.getTimeAgo(new Date(notif.createdAt));
        const icon = this.getNotificationIcon(notif.type);
        const bgColor = notif.read ? 'transparent' : 'var(--surface)';
        
        // Sanitize the message to prevent XSS
        const safeMessage = sanitizer.text(notif.message);
        const safeId = sanitizer.attribute(notif._id);
        
        // Add accept button for league invites
        let actionButton = '';
        if (notif.type === 'league_invite' && !notif.read) {
            actionButton = `
                <button onclick="notificationSystem.acceptLeagueInvite('${safeId}', '${notif.data?.leagueCode || ''}')" 
                        style="padding: 0.25rem 0.75rem; background: var(--primary); color: white; border: none; border-radius: 20px; font-size: 0.875rem; cursor: pointer;">
                    Accept
                </button>
            `;
        }
        
        return `
            <div class="notification-item" data-id="${safeId}" style="padding: 1rem; border-bottom: 1px solid var(--border); background: ${bgColor}; cursor: pointer; transition: all 0.2s;" 
                 onclick="notificationSystem.handleNotificationClick('${safeId}')"
                 onmouseover="this.style.background='var(--surface)'" 
                 onmouseout="this.style.background='${bgColor}'">
                <div style="display: flex; gap: 0.75rem;">
                    <div style="font-size: 1.25rem;">${icon}</div>
                    <div style="flex: 1;">
                        <div style="font-size: 0.95rem; color: var(--text); margin-bottom: 0.25rem;">
                            ${safeMessage}
                        </div>
                        ${notif.type === 'league_invite' && notif.data?.leagueCode ? 
                            `<div style="font-size: 0.875rem; color: var(--primary); margin: 0.25rem 0;">League Code: ${notif.data.leagueCode}</div>` : 
                            ''}
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${timeAgo}</div>
                    </div>
                    ${actionButton}
                    ${!notif.read && !actionButton ? '<div style="width: 8px; height: 8px; background: var(--primary); border-radius: 50%;"></div>' : ''}
                </div>
            </div>
        `;
    }

    getNotificationIcon(type) {
        const icons = {
            'bet_accepted': '🤝',
            'bet_cancelled': '❌',
            'bet_completed': '✅',
            'bet_won': '🏆',
            'bet_lost': '😔',
            'comment': '💬',
            'like': '👍',
            'follow': '👥',
            'prediction_result': '🎯',
            'mention': '@',
            'league_invite': '📨',
            'league_joined': '🎉',
            'payment_received': '💰',
            'payment_sent': '💸',
            'dispute': '⚠️',
            'system': '📢'
        };
        return icons[type] || '🔔';
    }

    updateNotificationBadge() {
        const badge = document.querySelector('.nav-badge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    toggleNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (!panel) return;

        this.isOpen = !this.isOpen;
        panel.style.display = this.isOpen ? 'block' : 'none';
        
        if (this.isOpen) {
            this.loadNotifications();
        }
    }

    async handleNotificationClick(notifId) {
        // Mark as read
        await this.markAsRead(notifId);
        
        // Navigate to relevant content
        const notif = this.notifications.find(n => n._id === notifId);
        if (notif && notif.data?.postId) {
            // Close panel
            this.toggleNotificationPanel();
            
            // Scroll to post or open it
            const postElement = document.querySelector(`[data-post-id="${notif.data.postId._id || notif.data.postId}"]`);
            if (postElement) {
                postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                postElement.style.animation = 'highlight 2s ease';
            }
        }
    }

    async markAsRead(notifId) {
        try {
            await apiService.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notifId));
            
            // Update local state
            const notif = this.notifications.find(n => n._id === notifId);
            if (notif && !notif.read) {
                notif.read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateNotificationBadge();
                this.renderNotifications();
            }
        } catch (error) {
            // Error handled by apiService
        }
    }

    async markAllAsRead() {
        try {
            await apiService.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
            
            // Update local state
            this.notifications.forEach(n => n.read = true);
            this.unreadCount = 0;
            this.updateNotificationBadge();
            this.renderNotifications();
            
            // Show success feedback
            this.showToast('All notifications marked as read', 'success');
        } catch (error) {
            // Error handled by apiService
        }
    }

    async acceptLeagueInvite(notifId, leagueCode) {
        try {
            // Stop event propagation
            event.stopPropagation();
            
            const response = await fetch('/api/platforms/accept-invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    leagueCode: leagueCode,
                    notificationId: notifId,
                    userId: JSON.parse(localStorage.getItem('user') || '{}')._id
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Successfully joined league!', 'success');
                
                // Mark notification as read
                await this.markAsRead(notifId);
                
                // Redirect to platform
                if (result.platformId) {
                    window.open(`/platform/${result.platformId}/index.html`, '_blank');
                }
            } else {
                this.showToast(result.error || 'Failed to join league', 'error');
            }
        } catch (error) {
            console.error('Error accepting league invite:', error);
            this.showToast('Failed to accept invite', 'error');
        }
    }
    
    startPolling() {
        // Poll for new notifications every 30 seconds
        setInterval(() => {
            if (window.authService?.isAuthenticated()) {
                this.checkForNewNotifications();
            }
        }, 30000);
    }

    async checkForNewNotifications() {
        try {
            const data = await apiService.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
            
            if (data.success && data.count !== this.unreadCount) {
                const oldCount = this.unreadCount;
                this.unreadCount = data.count;
                this.updateNotificationBadge();
                
                // If panel is open, reload notifications
                if (this.isOpen) {
                    this.loadNotifications();
                }
                
                // Show browser notification if count increased
                if (data.count > oldCount) {
                    this.showBrowserNotification();
                }
            }
        } catch (error) {
            // Silent fail for polling
        }
    }

    showBrowserNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Huddle', {
                body: 'You have new notifications!',
                icon: '/favicon.ico'
            });
        }
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
        if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
        return date.toLocaleDateString();
    }
    
    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? 'var(--success)' : 'var(--primary)'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // Add notification sound
    playNotificationSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTQIHGS56+OlViEOUam/');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors if autoplay blocked
    }
}

// Create and export instance
const notificationSystem = new NotificationSystem();

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.notificationSystem = notificationSystem;
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Export for module usage
export { notificationSystem, NotificationSystem };