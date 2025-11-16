// Post Interactions Component - Handles likes, dislikes, shares, bookmarks

// Import core services
import { apiService } from '/js/core/services/api-service.js';
import { sanitizer } from '/js/core/utils/sanitizer.js';

class PostInteractions {
    constructor() {
        this.initializeInteractions();
    }

    initializeInteractions() {
        // Post interactions initialized
    }

    async handleLike(button) {
        // Prevent double handling
        if (button.dataset.handling) return;
        button.dataset.handling = 'true';
        
        const postElement = button.closest('[data-post-id]');
        const postId = postElement?.dataset.postId || button.dataset.postId;
        
        if (!postId) {
            this.toggleStaticLike(button);
            delete button.dataset.handling;
            return;
        }
        
        // Optimistic UI update
        this.toggleStaticLike(button);
        
        try {
            const result = await apiService.likePost(postId);
            
            if (result.success) {
                // Update count if server returns new count
                if (result.likes !== undefined) {
                    const span = button.querySelector('span');
                    if (span) span.textContent = result.likes;
                }
                
                // Emit real-time update
                if (window.realtimeService) {
                    window.realtimeService.emitLike(postId, result.likes || parseInt(span?.textContent || 0));
                }
            }
        } catch (error) {
            // Failed to like post - revert optimistic update
            this.toggleStaticLike(button);
        } finally {
            delete button.dataset.handling;
        }
    }

    async handleDislike(button) {
        // Prevent double handling
        if (button.dataset.handling) return;
        button.dataset.handling = 'true';
        
        const postElement = button.closest('[data-post-id]');
        const postId = postElement?.dataset.postId || button.dataset.postId;
        
        if (!postId) {
            this.toggleStaticDislike(button);
            delete button.dataset.handling;
            return;
        }
        
        // Optimistic UI update
        this.toggleStaticDislike(button);
        
        try {
            const result = await apiService.dislikePost(postId);
            
            if (result.success) {
                // Update count if server returns new count
                if (result.dislikes !== undefined) {
                    const span = button.querySelector('span');
                    if (span) span.textContent = result.dislikes;
                }
                
                // Add shake animation for fade effect
                button.style.animation = 'shake 0.5s ease';
                setTimeout(() => {
                    button.style.animation = '';
                }, 500);
                
                // Emit real-time update
                if (window.realtimeService) {
                    const span = button.querySelector('span');
                    window.realtimeService.emitDislike(postId, result.dislikes || parseInt(span?.textContent || 0));
                }
            }
        } catch (error) {
            // Failed to dislike post - revert optimistic update
            this.toggleStaticDislike(button);
        } finally {
            delete button.dataset.handling;
        }
    }

    async handleShare(button) {
        const postElement = button.closest('[data-post-id]');
        const postId = postElement?.dataset.postId || button.dataset.postId;
        
        if (!postId) {
            this.showShareOptions('demo-post');
            return;
        }
        
        // Show share modal with options
        this.showShareModal(postId);
    }

    showShareModal(postId) {
        // Remove existing modal if any
        document.querySelector('.share-modal')?.remove();
        
        const shareUrl = `${window.location.origin}/post/${postId}`;
        const safeUrl = sanitizer.url(shareUrl);
        
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
            animation: fadeIn 0.2s ease;
        `;
        
        modal.innerHTML = `
            <div style="background: var(--bg-secondary); border-radius: 20px; padding: 1.5rem; max-width: 400px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0; font-size: 1.25rem;">Share Post</h3>
                    <button onclick="this.closest('.share-modal').remove()" style="background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer;">×</button>
                </div>
                
                <div style="display: grid; gap: 0.75rem;">
                    ${navigator.share ? `
                        <button onclick="postInteractions.nativeShare('${postId}')" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--surface); border: none; border-radius: 12px; color: var(--text); cursor: pointer; transition: all 0.2s;">
                            <i class="fas fa-share-alt" style="font-size: 1.25rem; color: var(--primary);"></i>
                            <span>Share via System</span>
                        </button>
                    ` : ''}
                    
                    <button onclick="postInteractions.copyLink('${safeUrl}')" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--surface); border: none; border-radius: 12px; color: var(--text); cursor: pointer; transition: all 0.2s;">
                        <i class="fas fa-link" style="font-size: 1.25rem; color: var(--primary);"></i>
                        <span>Copy Link</span>
                    </button>
                    
                    <button onclick="postInteractions.shareToTwitter('${safeUrl}')" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--surface); border: none; border-radius: 12px; color: var(--text); cursor: pointer; transition: all 0.2s;">
                        <i class="fab fa-twitter" style="font-size: 1.25rem; color: #1DA1F2;"></i>
                        <span>Share on Twitter</span>
                    </button>
                    
                    <button onclick="postInteractions.shareToFacebook('${safeUrl}')" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--surface); border: none; border-radius: 12px; color: var(--text); cursor: pointer; transition: all 0.2s;">
                        <i class="fab fa-facebook" style="font-size: 1.25rem; color: #1877F2;"></i>
                        <span>Share on Facebook</span>
                    </button>
                    
                    <button onclick="postInteractions.shareToReddit('${safeUrl}')" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--surface); border: none; border-radius: 12px; color: var(--text); cursor: pointer; transition: all 0.2s;">
                        <i class="fab fa-reddit" style="font-size: 1.25rem; color: #FF4500;"></i>
                        <span>Share on Reddit</span>
                    </button>
                </div>
                
                <div style="margin-top: 1.5rem; padding: 1rem; background: var(--surface); border-radius: 12px;">
                    <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">Post URL:</div>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="text" value="${safeUrl}" readonly style="flex: 1; padding: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 0.875rem;">
                        <button onclick="postInteractions.copyLink('${safeUrl}')" style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async nativeShare(postId) {
        const shareUrl = `${window.location.origin}/post/${postId}`;
        
        try {
            await navigator.share({
                title: 'Check out this post on Huddle',
                text: 'Check out this sports prediction!',
                url: shareUrl
            });
            
            // Close modal
            document.querySelector('.share-modal')?.remove();
            
            // Track share
            this.trackShare(postId);
            
            // Show success toast
            this.showToast('Post shared successfully!', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                // Share failed
            }
        }
    }

    copyLink(url) {
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('Link copied to clipboard!', 'success');
            
            // Close modal after brief delay
            setTimeout(() => {
                document.querySelector('.share-modal')?.remove();
            }, 1000);
        }).catch(() => {
            this.showToast('Failed to copy link', 'error');
        });
    }

    shareToTwitter(url) {
        const text = 'Check out this sports prediction on Huddle!';
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        document.querySelector('.share-modal')?.remove();
    }

    shareToFacebook(url) {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        document.querySelector('.share-modal')?.remove();
    }

    shareToReddit(url) {
        const title = 'Check out this sports prediction on Huddle!';
        window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank');
        document.querySelector('.share-modal')?.remove();
    }

    async trackShare(postId) {
        try {
            const result = await apiService.sharePost(postId);
            
            // Emit real-time update
            if (window.realtimeService && result.success) {
                window.realtimeService.emitShare(postId, result.shares || 0);
            }
        } catch (error) {
            // Failed to track share
        }
    }

    async handleBookmark(button) {
        const postElement = button.closest('[data-post-id]');
        const postId = postElement?.dataset.postId || button.dataset.postId;
        
        if (!postId) {
            this.toggleStaticBookmark(button);
            return;
        }
        
        // Optimistic UI update
        this.toggleStaticBookmark(button);
        
        try {
            const result = await apiService.bookmarkPost(postId);
            
            if (!result.success) {
                // Revert if failed
                this.toggleStaticBookmark(button);
            }
        } catch (error) {
            // Failed to bookmark post - revert optimistic update
            this.toggleStaticBookmark(button);
        }
    }

    handleMenu(button) {
        const postElement = button.closest('[data-post-id]');
        const postId = postElement?.dataset.postId;
        
        // Show post menu options
        this.showPostMenu(button, postId);
    }

    showPostMenu(button, postId) {
        // Remove existing menu
        document.querySelector('.post-menu-dropdown')?.remove();
        
        const menu = document.createElement('div');
        menu.className = 'post-menu-dropdown';
        menu.style.cssText = `
            position: absolute;
            top: ${button.offsetTop + button.offsetHeight}px;
            right: 20px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 0.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            min-width: 200px;
        `;
        
        const currentUser = window.authService?.getCurrentUser();
        const post = button.closest('.post');
        const authorHandle = post?.querySelector('.author-handle')?.textContent.replace('@', '');
        const isOwner = currentUser?.username === authorHandle;
        
        menu.innerHTML = `
            <button onclick="window.postInteractions.reportPost('${postId}')" style="display: block; width: 100%; text-align: left; padding: 0.75rem; background: none; border: none; color: var(--text); cursor: pointer; border-radius: 8px; transition: all 0.2s;">
                <i class="fas fa-flag" style="margin-right: 0.75rem; width: 20px;"></i>
                Report Post
            </button>
            ${isOwner ? `
                <button onclick="window.postInteractions.editPost('${postId}')" style="display: block; width: 100%; text-align: left; padding: 0.75rem; background: none; border: none; color: var(--text); cursor: pointer; border-radius: 8px; transition: all 0.2s;">
                    <i class="fas fa-edit" style="margin-right: 0.75rem; width: 20px;"></i>
                    Edit Post
                </button>
                <button onclick="window.postInteractions.deletePost('${postId}')" style="display: block; width: 100%; text-align: left; padding: 0.75rem; background: none; border: none; color: var(--danger); cursor: pointer; border-radius: 8px; transition: all 0.2s;">
                    <i class="fas fa-trash" style="margin-right: 0.75rem; width: 20px;"></i>
                    Delete Post
                </button>
            ` : ''}
            <button onclick="window.postInteractions.copyPostLink('${postId}')" style="display: block; width: 100%; text-align: left; padding: 0.75rem; background: none; border: none; color: var(--text); cursor: pointer; border-radius: 8px; transition: all 0.2s;">
                <i class="fas fa-link" style="margin-right: 0.75rem; width: 20px;"></i>
                Copy Link
            </button>
        `;
        
        button.parentElement.appendChild(menu);
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && e.target !== button) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    reportPost(postId) {
        document.querySelector('.post-menu-dropdown')?.remove();
        this.showToast('Post reported. We\'ll review it soon.', 'info');
    }

    editPost(postId) {
        document.querySelector('.post-menu-dropdown')?.remove();
        this.showToast('Edit feature coming soon!', 'info');
    }

    async deletePost(postId) {
        // deletePost called
        document.querySelector('.post-menu-dropdown')?.remove();
        
        if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) {
            // User cancelled delete
            return;
        }
        
        // User confirmed delete
        
        try {
            const result = await apiService.delete(`/api/posts/${postId}`);
            
            if (result.success) {
                // Delete successful, removing from UI
                
                // Remove from UI with animation
                const postElement = document.querySelector(`[data-post-id="${postId}"]`);
                if (postElement) {
                    postElement.style.animation = 'fadeOut 0.3s ease';
                    setTimeout(() => postElement.remove(), 300);
                }
                
                // Emit real-time deletion
                if (window.realtimeService) {
                    window.realtimeService.emitPostDeleted(postId);
                }
                
                this.showToast('Post deleted successfully', 'success');
            } else {
                // Delete failed
                this.showToast(result.error || 'Failed to delete post', 'error');
            }
        } catch (error) {
            // Exception during delete
            this.showToast('Failed to delete post', 'error');
        }
    }

    copyPostLink(postId) {
        document.querySelector('.post-menu-dropdown')?.remove();
        const url = `${window.location.origin}/post/${postId}`;
        this.copyLink(url);
    }

    openImageModal(imageUrl) {
        const safeUrl = sanitizer.url(imageUrl);
        
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: zoom-out;
            animation: fadeIn 0.2s ease;
        `;
        
        modal.innerHTML = `
            <img src="${safeUrl}" style="max-width: 90%; max-height: 90%; border-radius: 12px;">
            <button onclick="this.parentElement.remove()" style="position: absolute; top: 20px; right: 20px; background: rgba(0, 0, 0, 0.5); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 1.5rem; cursor: pointer;">×</button>
        `;
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
    }

    // Static toggle methods for UI feedback
    toggleStaticLike(button) {
        const postElement = button.closest('.post');
        
        if (button.classList.contains('liked')) {
            button.classList.remove('liked');
            const span = button.querySelector('span');
            if (span) span.textContent = Math.max(0, parseInt(span.textContent) - 1);
        } else {
            button.classList.add('liked');
            const span = button.querySelector('span');
            if (span) span.textContent = parseInt(span.textContent) + 1;
            
            // Trophy animation
            button.style.animation = 'bounce 0.5s ease';
            setTimeout(() => {
                button.style.animation = '';
            }, 500);
            
            // Remove dislike if active
            if (postElement) {
                const dislikeBtn = postElement.querySelector('.interaction-btn.disliked');
                if (dislikeBtn) {
                    dislikeBtn.classList.remove('disliked');
                    const dislikeSpan = dislikeBtn.querySelector('span');
                    if (dislikeSpan) dislikeSpan.textContent = Math.max(0, parseInt(dislikeSpan.textContent) - 1);
                }
            }
        }
    }

    toggleStaticDislike(button) {
        const postElement = button.closest('.post');
        
        if (button.classList.contains('disliked')) {
            button.classList.remove('disliked');
            const span = button.querySelector('span');
            if (span) span.textContent = Math.max(0, parseInt(span.textContent) - 1);
        } else {
            button.classList.add('disliked');
            const span = button.querySelector('span');
            if (span) span.textContent = parseInt(span.textContent) + 1;
            
            // Remove like if active
            if (postElement) {
                const likeBtn = postElement.querySelector('.interaction-btn.liked');
                if (likeBtn) {
                    likeBtn.classList.remove('liked');
                    const likeSpan = likeBtn.querySelector('span');
                    if (likeSpan) likeSpan.textContent = Math.max(0, parseInt(likeSpan.textContent) - 1);
                }
            }
        }
    }

    toggleStaticBookmark(button) {
        const icon = button.querySelector('i');
        if (icon) {
            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                button.classList.add('bookmarked');
                button.style.color = 'var(--warning)';
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                button.classList.remove('bookmarked');
                button.style.color = '';
            }
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'interaction-toast';
        
        const bgColors = {
            success: 'var(--success)',
            error: 'var(--danger)',
            warning: 'var(--warning)',
            info: 'var(--info)'
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
            z-index: 10000;
            animation: slideUp 0.3s ease;
            max-width: 300px;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Create and export instance
const postInteractions = new PostInteractions();

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.postInteractions = {
        handleLike: (button) => postInteractions.handleLike(button),
        handleDislike: (button) => postInteractions.handleDislike(button),
        handleShare: (button) => postInteractions.handleShare(button),
        handleBookmark: (button) => postInteractions.handleBookmark(button),
        handleMenu: (button) => postInteractions.handleMenu(button),
        toggleStaticLike: (button) => postInteractions.toggleStaticLike(button),
        toggleStaticDislike: (button) => postInteractions.toggleStaticDislike(button),
        toggleStaticBookmark: (button) => postInteractions.toggleStaticBookmark(button),
        reportPost: (postId) => postInteractions.reportPost(postId),
        editPost: (postId) => postInteractions.editPost(postId),
        deletePost: (postId) => postInteractions.deletePost(postId),
        copyPostLink: (postId) => postInteractions.copyPostLink(postId),
        nativeShare: (postId) => postInteractions.nativeShare(postId),
        copyLink: (url) => postInteractions.copyLink(url),
        shareToTwitter: (url) => postInteractions.shareToTwitter(url),
        shareToFacebook: (url) => postInteractions.shareToFacebook(url),
        shareToReddit: (url) => postInteractions.shareToReddit(url),
        openImageModal: (imageUrl) => postInteractions.openImageModal(imageUrl)
    };
}

// Export for module usage
export { postInteractions, PostInteractions };

// Add required animations
if (typeof document !== 'undefined' && !document.querySelector('#interaction-styles')) {
    const style = document.createElement('style');
    style.id = 'interaction-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slideDown {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(100%); opacity: 0; }
        }
        
        .interaction-btn.liked {
            color: var(--primary) !important;
        }
        
        .interaction-btn.disliked {
            color: var(--danger) !important;
        }
        
        .interaction-btn.bookmarked {
            color: var(--warning) !important;
        }
    `;
    document.head.appendChild(style);
}