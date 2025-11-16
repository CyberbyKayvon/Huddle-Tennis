// Follow Service - Handles all follow/unfollow operations
class FollowService {
    constructor() {
        this.apiService = window.apiService;
        this.authService = window.authService;
        this.followingCache = new Set();
        this.isLoaded = false;
        this.loadPromise = null;
    }

    // Load user's following list
    async loadFollowing(force = false) {
        // If already loading, return the existing promise
        if (this.loadPromise && !force) {
            return this.loadPromise;
        }

        const user = this.authService.getCurrentUser();
        if (!user) {
            console.log('No user found');
            this.isLoaded = true;
            return;
        }

        console.log('📋 Loading following list for:', user.username, user._id);
        
        this.loadPromise = fetch(`/api/users/${user._id}/following`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    // User not found, return empty following
                    return { success: true, following: [] };
                }
                throw new Error('Failed to load following');
            }
            return response.json();
        })
        .then(data => {
            console.log('📦 Raw API response:', data);
            
            // Clear and rebuild cache with string IDs
            this.followingCache.clear();
            
            // Handle different response formats
            let followingArray = [];
            if (data.following) followingArray = data.following;
            else if (data.followingDetails) followingArray = data.followingDetails;
            else if (data.users) followingArray = data.users;
            else if (Array.isArray(data)) followingArray = data;
            
            if (Array.isArray(followingArray)) {
                followingArray.forEach(item => {
                    let userId;
                    if (typeof item === 'string') {
                        userId = item;
                    } else if (item && item._id) {
                        userId = item._id.toString();
                    } else if (item && item.id) {
                        userId = item.id.toString();
                    }
                    
                    if (userId) {
                        this.followingCache.add(userId);
                        console.log('Added to cache:', userId);
                    }
                });
            }
            
            // Update user object with following list
            const currentUser = this.authService.getCurrentUser();
            if (currentUser) {
                currentUser.following = Array.from(this.followingCache);
                localStorage.setItem('user', JSON.stringify(currentUser));
                this.authService.updateLocalUser(currentUser);
            }
            
            this.isLoaded = true;
            console.log('✅ Following cache loaded with', this.followingCache.size, 'users:', Array.from(this.followingCache));
            
            // Update all buttons after loading
            this.updateAllButtons();
            
            // Update stats
            this.updateSidebarStats();
        })
        .catch(async error => {
            console.error('❌ Error loading following:', error);
            
            // Try to load from localStorage as fallback
            const currentUser = this.authService.getCurrentUser();
            if (currentUser && currentUser.following) {
                currentUser.following.forEach(id => {
                    this.followingCache.add(id.toString());
                });
                console.log('📦 Loaded following from localStorage:', this.followingCache.size);
            }
            
            this.isLoaded = true;
            
            // Still update buttons
            this.updateAllButtons();
        });

        return this.loadPromise;
    }

    // Update all follow buttons on the page
    updateAllButtons() {
        // Immediate update for all visible buttons
        const updateButtons = () => {
            document.querySelectorAll('[data-follow-user-id]').forEach(btn => {
                const userId = btn.getAttribute('data-follow-user-id');
                if (userId) {
                    const isFollowingUser = this.isFollowing(userId);
                    this.updateFollowButtons(userId, isFollowingUser);
                }
            });
        };
        
        // Immediate update
        updateButtons();
        
        // Update again after a short delay for dynamic content
        setTimeout(updateButtons, 200);
        setTimeout(updateButtons, 500);
        
        // Update sidebar stats
        this.updateSidebarStats();
    }
    
    // Force update sidebar stats
    updateSidebarStats() {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) return;
        
        const followingCount = this.followingCache.size || currentUser.stats?.following || 0;
        const followersCount = currentUser.stats?.followers || 0;
        
        // Update following count (4th stat in sidebar)
        const followingElement = document.querySelector('.stat-item:nth-child(4) .stat-value');
        if (followingElement) {
            followingElement.textContent = this.formatNumber(followingCount);
        }
        
        // Update followers count (3rd stat in sidebar)
        const followersElement = document.querySelector('.stat-item:nth-child(3) .stat-value');
        if (followersElement) {
            followersElement.textContent = this.formatNumber(followersCount);
        }
        
        // Make sure labels are correct
        const followersLabel = document.querySelector('.stat-item:nth-child(3) .stat-label');
        if (followersLabel) {
            followersLabel.textContent = 'Followers';
        }
        
        const followingLabel = document.querySelector('.stat-item:nth-child(4) .stat-label');
        if (followingLabel) {
            followingLabel.textContent = 'Following';
        }
        
        // If we're on a profile page, update profile stats directly
        if (window.profileComponent && window.profileComponent.viewingUser) {
            // Update the displayed stats in profile header
            const profileStats = document.querySelectorAll('.profile-header div[style*="display: flex"] > div');
            profileStats.forEach(statDiv => {
                const label = statDiv.querySelector('div:nth-child(2)');
                const value = statDiv.querySelector('div:nth-child(1)');
                if (label && value) {
                    if (label.textContent === 'Followers') {
                        // If viewing own profile, use current user's follower count
                        if (window.profileComponent.isOwnProfile) {
                            value.textContent = followersCount;
                        }
                        // Otherwise keep the viewed user's count
                    } else if (label.textContent === 'Following') {
                        // If viewing own profile, use current user's following count
                        if (window.profileComponent.isOwnProfile) {
                            value.textContent = followingCount;
                        }
                        // Otherwise keep the viewed user's count
                    }
                }
            });
        }
    }

    // Check if following a user
    isFollowing(userId) {
        if (!userId) return false;
        const stringId = userId.toString();
        return this.followingCache.has(stringId);
    }

    // Follow a user
    async followUser(userId, username) {
        if (!this.authService.isAuthenticated()) {
            this.showToast('Please login to follow users', 'info');
            return { success: false };
        }

        const stringId = userId.toString();
        console.log('➕ Following user:', stringId, username);

        // Optimistically update UI immediately
        this.followingCache.add(stringId);
        this.updateFollowButtons(stringId, true);

        try {
            const response = await fetch(`/api/users/${stringId}/follow`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success) {
                // Show toast
                this.showToast(`You are now following @${username}`, 'success');
                
                // Update user object in localStorage
                const currentUser = this.authService.getCurrentUser();
                if (currentUser) {
                    // Update stats from server or increment locally
                    if (data.stats) {
                        currentUser.stats = data.stats;
                    } else {
                        currentUser.stats = currentUser.stats || {};
                        currentUser.stats.following = this.followingCache.size;
                    }
                    
                    // IMPORTANT: Update follower count if viewing the target user's profile
                    if (data.targetStats && window.profileComponent && window.profileComponent.viewingUser) {
                        if (window.profileComponent.viewingUser._id === stringId || 
                            window.profileComponent.viewingUser.id === stringId) {
                            // Update the stats object
                            window.profileComponent.viewingUser.stats = data.targetStats;
                            // Update the DOM directly without reloading
                            this.updateProfileStatsDOM(data.targetStats);
                        }
                    }
                    
                    // Update following array
                    currentUser.following = Array.from(this.followingCache);
                    
                    // Save to localStorage
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    this.authService.updateLocalUser(currentUser);
                }
                
                // Update all UI elements
                this.updateSidebarStats();
                
                // Keep button state
                setTimeout(() => {
                    this.updateFollowButtons(stringId, true);
                }, 100);
                
                return data;
            } else {
                // Revert on failure
                this.followingCache.delete(stringId);
                this.updateFollowButtons(stringId, false);
                this.showToast(data.error || 'Failed to follow user', 'error');
                return { success: false };
            }
        } catch (error) {
            console.error('Error following user:', error);
            // Revert on error
            this.followingCache.delete(stringId);
            this.updateFollowButtons(stringId, false);
            this.showToast('Failed to follow user', 'error');
            return { success: false };
        }
    }

    // Unfollow a user
    async unfollowUser(userId, username) {
        if (!this.authService.isAuthenticated()) {
            return { success: false };
        }

        const stringId = userId.toString();
        console.log('➖ Unfollowing user:', stringId, username);

        // Optimistically update UI immediately
        this.followingCache.delete(stringId);
        this.updateFollowButtons(stringId, false);

        try {
            const response = await fetch(`/api/users/${stringId}/unfollow`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success) {
                // Show toast
                this.showToast(`You unfollowed @${username}`, 'info');
                
                // Update user object in localStorage
                const currentUser = this.authService.getCurrentUser();
                if (currentUser) {
                    // Update stats from server or decrement locally
                    if (data.stats) {
                        currentUser.stats = data.stats;
                    } else {
                        currentUser.stats = currentUser.stats || {};
                        currentUser.stats.following = this.followingCache.size;
                    }
                    
                    // IMPORTANT: Update follower count if viewing the target user's profile
                    if (data.targetStats && window.profileComponent && window.profileComponent.viewingUser) {
                        if (window.profileComponent.viewingUser._id === stringId || 
                            window.profileComponent.viewingUser.id === stringId) {
                            // Update the stats object
                            window.profileComponent.viewingUser.stats = data.targetStats;
                            // Update the DOM directly without reloading
                            this.updateProfileStatsDOM(data.targetStats);
                        }
                    }
                    
                    // Update following array
                    currentUser.following = Array.from(this.followingCache);
                    
                    // Save to localStorage
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    this.authService.updateLocalUser(currentUser);
                }
                
                // Update all UI elements
                this.updateSidebarStats();
                
                // Keep button state
                setTimeout(() => {
                    this.updateFollowButtons(stringId, false);
                }, 100);
                
                return data;
            } else {
                // Revert on failure
                this.followingCache.add(stringId);
                this.updateFollowButtons(stringId, true);
                this.showToast(data.error || 'Failed to unfollow user', 'error');
                return { success: false };
            }
        } catch (error) {
            console.error('Error unfollowing user:', error);
            // Revert on error
            this.followingCache.add(stringId);
            this.updateFollowButtons(stringId, true);
            this.showToast('Failed to unfollow user', 'error');
            return { success: false };
        }
    }

    // Toggle follow status
    async toggleFollow(userId, username) {
        const stringId = userId.toString();
        
        if (this.isFollowing(stringId)) {
            return await this.unfollowUser(stringId, username);
        } else {
            return await this.followUser(stringId, username);
        }
    }

    // Update all follow buttons for a user
    updateFollowButtons(userId, isFollowing) {
        const stringId = userId.toString();
        
        // Update all buttons for this user
        document.querySelectorAll(`[data-follow-user-id="${stringId}"]`).forEach(btn => {
            // Store onclick handler
            const originalOnclick = btn.getAttribute('onclick');
            
            // Clone to remove old event listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Restore onclick
            if (originalOnclick) {
                newBtn.setAttribute('onclick', originalOnclick);
            }
            
            // Clear inline styles
            newBtn.style.cssText = '';
            
            if (isFollowing) {
                // Following state - Twitter style
                newBtn.textContent = 'Following';
                newBtn.className = 'follow-btn following';
                newBtn.style.cssText = `
                    background: transparent;
                    color: var(--text);
                    border: 1px solid var(--border);
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-width: 100px;
                    text-align: center;
                `;
                
                // Hover shows Unfollow
                newBtn.addEventListener('mouseenter', () => {
                    newBtn.textContent = 'Unfollow';
                    newBtn.style.background = 'rgba(244, 33, 46, 0.1)';
                    newBtn.style.color = 'rgb(244, 33, 46)';
                    newBtn.style.borderColor = 'rgba(244, 33, 46, 0.5)';
                });
                
                newBtn.addEventListener('mouseleave', () => {
                    newBtn.textContent = 'Following';
                    newBtn.style.background = 'transparent';
                    newBtn.style.color = 'var(--text)';
                    newBtn.style.borderColor = 'var(--border)';
                });
            } else {
                // Not following - Follow button
                newBtn.textContent = 'Follow';
                newBtn.className = 'follow-btn';
                newBtn.style.cssText = `
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-width: 100px;
                    text-align: center;
                `;
                
                // Hover effect
                newBtn.addEventListener('mouseenter', () => {
                    newBtn.style.opacity = '0.9';
                    newBtn.style.transform = 'scale(1.02)';
                });
                
                newBtn.addEventListener('mouseleave', () => {
                    newBtn.style.opacity = '1';
                    newBtn.style.transform = 'scale(1)';
                });
            }
        });
        
        // Update profile page follow button if it exists
        const profileFollowBtn = document.querySelector('.profile-follow-btn');
        if (profileFollowBtn && profileFollowBtn.dataset.userId === stringId) {
            this.updateProfileFollowButton(profileFollowBtn, isFollowing);
        }
    }

    // Special handling for profile page follow button
    updateProfileFollowButton(btn, isFollowing) {
        if (isFollowing) {
            btn.textContent = 'Following';
            btn.className = 'profile-follow-btn following';
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text)';
            btn.style.border = '1px solid var(--border)';
        } else {
            btn.textContent = 'Follow';
            btn.className = 'profile-follow-btn';
            btn.style.background = 'var(--primary)';
            btn.style.color = 'white';
            btn.style.border = 'none';
        }
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const bgColors = {
            success: 'var(--success)',
            error: 'var(--danger)',
            info: 'var(--primary)'
        };
        
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${bgColors[type]};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10001;
            animation: slideUp 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            max-width: 350px;
        `;
        
        const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
        toast.innerHTML = `<span style="font-size: 1.2rem;">${icon}</span> ${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Format numbers for display
    formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    // Update profile stats in DOM without reloading
    updateProfileStatsDOM(stats) {
        if (!stats) return;
        
        // Find all stat containers in the profile header
        const profileHeader = document.querySelector('.profile-header');
        if (!profileHeader) return;
        
        // Update the Quick Stats section
        const statDivs = profileHeader.querySelectorAll('div[style*="display: flex; gap: 2rem"] > div');
        statDivs.forEach(div => {
            const valueDiv = div.querySelector('div:first-child');
            const labelDiv = div.querySelector('div:last-child');
            
            if (valueDiv && labelDiv) {
                const label = labelDiv.textContent.trim().toLowerCase();
                
                if (label === 'posts' && stats.posts !== undefined) {
                    valueDiv.textContent = stats.posts || 0;
                } else if (label === 'followers' && stats.followers !== undefined) {
                    valueDiv.textContent = stats.followers || 0;
                } else if (label === 'following' && stats.following !== undefined) {
                    valueDiv.textContent = stats.following || 0;
                }
            }
        });
        
        // Update the Prediction Stats Card if it exists
        const predictionCard = profileHeader.querySelector('div[style*="min-width: 250px"]');
        if (predictionCard && stats) {
            // Update overall record
            const overallSpan = Array.from(predictionCard.querySelectorAll('span')).find(
                span => span.previousSibling && span.previousSibling.textContent && span.previousSibling.textContent.includes('Overall:')
            );
            if (overallSpan && stats.wins !== undefined && stats.losses !== undefined) {
                const accuracy = stats.accuracy || 0;
                const colorClass = accuracy >= 60 ? 'var(--success)' : accuracy >= 50 ? 'var(--warning)' : 'var(--danger)';
                overallSpan.innerHTML = `
                    ${stats.wins || 0}-${stats.losses || 0} 
                    <span style="color: ${colorClass};">
                        (${accuracy}%)
                    </span>
                `;
            }
        }
    }
}

// Create global instance
window.followService = new FollowService();

// Initialize when DOM is ready and user is logged in
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in before loading
    const checkAndLoad = async () => {
        if (window.authService && window.authService.isAuthenticated()) {
            await window.followService.loadFollowing();
            
            // Update buttons after a delay to ensure everything is rendered
            setTimeout(() => {
                window.followService.updateAllButtons();
            }, 500);
        }
    };
    
    // Try immediately
    checkAndLoad();
    
    // Try again after services are initialized
    setTimeout(checkAndLoad, 1000);
});

// Add CSS animation styles if not already present
if (!document.querySelector('#follow-service-styles')) {
    const style = document.createElement('style');
    style.id = 'follow-service-styles';
    style.textContent = `
        @keyframes slideUp {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideDown {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Export for global access
window.toggleFollow = function(userId, username) {
    return window.followService.toggleFollow(userId, username);
};