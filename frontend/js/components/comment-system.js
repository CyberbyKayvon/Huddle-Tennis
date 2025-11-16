// Comment System - Handles comment display and posting

// Import core services
import { apiService } from '/js/core/services/api-service.js';
import { API_ENDPOINTS } from '/js/core/config/api-endpoints.js';
import { storageService } from '/js/core/services/storage-service.js';
import { sanitizer } from '/js/core/utils/sanitizer.js';

class CommentSystem {
    constructor() {
        this.currentPostId = null;
        this.authService = window.authService;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Comment input handler
        const commentInput = document.getElementById('commentInput');
        const postBtn = document.getElementById('postCommentBtn');
        
        if (commentInput && postBtn) {
            commentInput.addEventListener('input', function() {
                postBtn.disabled = this.value.trim().length === 0;
                postBtn.style.opacity = this.value.trim().length === 0 ? '0.5' : '1';
            });
        }
    }

    // Open comment modal for a post
    async open(postId) {
        this.currentPostId = postId;
        const modal = document.getElementById('commentModal');
        if (!modal) return;
        
        modal.style.display = 'block';
        
        // Load the original post
        await this.loadOriginalPost(postId);
        
        // Load existing comments
        await this.loadComments(postId);
        
        // Update user avatar in comment input
        const user = this.authService?.getCurrentUser() || storageService.getUser();
        if (user) {
            const avatar = document.getElementById('commentUserAvatar');
            if (avatar) {
                avatar.textContent = sanitizer.text((user.displayName || user.username).charAt(0).toUpperCase());
            }
        }
        
        // Focus input
        const input = document.getElementById('commentInput');
        if (input) {
            input.value = '';
            input.focus();
        }
    }

    // Load original post content
    async loadOriginalPost(postId) {
        const container = document.getElementById('originalPost');
        if (!container) return;
        
        try {
            // Try to get post from API
            const data = await apiService.get(API_ENDPOINTS.POSTS.GET_BY_ID(postId));
            if (data.success && data.post) {
                container.innerHTML = sanitizer.clean(this.createPostPreview(data.post));
                return;
            }
        } catch (error) {
            // Using local post data as fallback
        }
        
        // Fallback: Get post from DOM
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const author = postElement.querySelector('.author-name')?.textContent || 'Unknown';
            const handle = postElement.querySelector('.author-handle')?.textContent || '@unknown';
            const content = postElement.querySelector('.post-content')?.textContent || '';
            const time = postElement.querySelector('.post-time')?.textContent || '';
            
            container.innerHTML = sanitizer.clean(`
                <div style="display: flex; gap: 0.75rem;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; flex-shrink: 0;">
                        ${sanitizer.text(author.charAt(0).toUpperCase())}
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                            <span style="font-weight: 600;">${sanitizer.text(author)}</span>
                            <span style="color: var(--text-muted); font-size: 0.875rem;">${sanitizer.text(handle)} ${sanitizer.text(time)}</span>
                        </div>
                        <div style="color: var(--text); line-height: 1.5;">${sanitizer.text(content)}</div>
                    </div>
                </div>
            `);
        }
    }

    // Create post preview HTML
    createPostPreview(post) {
        const author = post.author || {};
        const displayName = sanitizer.text(author.displayName || author.username || 'Unknown');
        const avatar = displayName.charAt(0).toUpperCase();
        
        return `
            <div style="display: flex; gap: 0.75rem;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; flex-shrink: 0;">
                    ${avatar}
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <span style="font-weight: 600;">${displayName}</span>
                        ${author.verified ? '<i class="fas fa-check-circle" style="color: var(--primary); font-size: 0.875rem;"></i>' : ''}
                        <span style="color: var(--text-muted); font-size: 0.875rem;">@${sanitizer.text(author.username || 'unknown')}</span>
                    </div>
                    <div style="color: var(--text); line-height: 1.5;">${sanitizer.text(post.content)}</div>
                </div>
            </div>
        `;
    }

    // Load comments for a post
    async loadComments(postId) {
        const container = document.getElementById('commentsContainer');
        if (!container) return;
        
        // Show loading
        container.innerHTML = sanitizer.clean(`
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: var(--text-muted);"></i>
                <p style="margin-top: 0.5rem; color: var(--text-muted);">Loading comments...</p>
            </div>
        `);
        
        try {
            const data = await apiService.get(API_ENDPOINTS.POSTS.GET_COMMENTS(postId));
            
            if (data.success && data.comments && data.comments.length > 0) {
                container.innerHTML = data.comments.map(comment => 
                    sanitizer.clean(this.createCommentHTML(comment))
                ).join('');
            } else {
                container.innerHTML = sanitizer.clean(`
                    <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        <i class="far fa-comment" style="font-size: 2rem; opacity: 0.5;"></i>
                        <p style="margin-top: 1rem;">No comments yet. Be the first to reply!</p>
                    </div>
                `);
            }
        } catch (error) {
            // Failed to load comments - show demo comments
            container.innerHTML = this.getDemoComments();
        }
    }

    // Create comment HTML
    createCommentHTML(comment) {
        const author = comment.author || {};
        const displayName = sanitizer.text(author.displayName || author.username || 'Unknown');
        const avatar = displayName.charAt(0).toUpperCase();
        const timeAgo = window.TimeHelpers ? 
            window.TimeHelpers.getTimeAgo(new Date(comment.createdAt)) : 
            'just now';
        
        // Sanitize the comment ID for safe use in onclick
        const safeCommentId = sanitizer.text(comment._id);
        
        return `
            <div class="comment" style="display: flex; gap: 0.75rem; padding: 1rem 0; border-bottom: 1px solid var(--border);">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--surface); display: flex; align-items: center; justify-content: center; color: var(--text); font-weight: 600; font-size: 0.875rem; flex-shrink: 0;">
                    ${avatar}
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <span style="font-weight: 600; font-size: 0.9rem;">${displayName}</span>
                        ${author.verified ? '<i class="fas fa-check-circle" style="color: var(--primary); font-size: 0.75rem;"></i>' : ''}
                        <span style="color: var(--text-muted); font-size: 0.8rem;">@${sanitizer.text(author.username || 'unknown')} · ${sanitizer.text(timeAgo)}</span>
                    </div>
                    <div style="color: var(--text); line-height: 1.4; font-size: 0.95rem;">${sanitizer.text(comment.content)}</div>
                    <div style="display: flex; gap: 1.5rem; margin-top: 0.5rem;">
                        <button onclick="commentSystem.likeComment('${safeCommentId}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0; font-size: 0.875rem; display: flex; align-items: center; gap: 0.25rem;">
                            <i class="${comment.isLiked ? 'fas' : 'far'} fa-heart"></i>
                            <span>${comment.likes?.length || 0}</span>
                        </button>
                        <button onclick="commentSystem.replyToComment('${safeCommentId}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0; font-size: 0.875rem;">
                            <i class="far fa-comment"></i> Reply
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Get demo comments for testing
    getDemoComments() {
        const demoComments = [
            {
                _id: 'demo-1',
                author: {
                    username: 'sportsfan22',
                    displayName: 'John Smith',
                    verified: true
                },
                content: 'Great analysis! I\'m taking the Vikings too. That home field advantage is huge in December.',
                createdAt: new Date(Date.now() - 300000),
                likes: []
            },
            {
                _id: 'demo-2',
                author: {
                    username: 'bearsfan',
                    displayName: 'Chicago Mike',
                    verified: false
                },
                content: 'Bears +7 is the play. We\'re getting healthier and Fields is playing better.',
                createdAt: new Date(Date.now() - 600000),
                likes: []
            }
        ];
        
        return demoComments.map(comment => sanitizer.clean(this.createCommentHTML(comment))).join('');
    }

    // Post a new comment
    async postComment() {
        const input = document.getElementById('commentInput');
        const content = input?.value.trim();
        
        if (!content || !this.currentPostId) return;
        
        // Check if user is logged in
        if (!this.authService?.isAuthenticated()) {
            this.showToast('Please login to comment', 'error');
            return;
        }
        
        const postBtn = document.getElementById('postCommentBtn');
        if (postBtn) {
            postBtn.disabled = true;
            postBtn.textContent = 'Posting...';
        }
        
        try {
            const data = await apiService.post(
                API_ENDPOINTS.POSTS.ADD_COMMENT(this.currentPostId),
                { content }
            );
            
            if (data.success) {
                // Clear input
                if (input) input.value = '';
                
                // Create comment object with current user
                const user = this.authService?.getCurrentUser() || storageService.getUser();
                const newComment = {
                    _id: Date.now().toString(),
                    author: {
                        username: user.username,
                        displayName: user.displayName || user.username,
                        verified: user.verified || false
                    },
                    content: content,
                    createdAt: new Date(),
                    likes: []
                };
                
                // Add new comment to the top
                const container = document.getElementById('commentsContainer');
                if (container) {
                    // Remove "no comments" message if it exists
                    if (container.querySelector('.fa-comment')) {
                        container.innerHTML = '';
                    }
                    
                    // Add new comment
                    const newCommentHTML = sanitizer.clean(this.createCommentHTML(newComment));
                    container.insertAdjacentHTML('afterbegin', newCommentHTML);
                }
                
                // Update comment count in the main feed
                this.updateCommentCount(this.currentPostId, 1);
                
                // Show success toast
                this.showToast('Comment posted!', 'success');
            } else {
                this.showToast(data.error || 'Failed to post comment', 'error');
            }
        } catch (error) {
            // Failed to post comment
            this.showToast('Failed to post comment', 'error');
        } finally {
            if (postBtn) {
                postBtn.disabled = false;
                postBtn.textContent = 'Reply';
            }
        }
    }

    // Update comment count in feed
    updateCommentCount(postId, increment) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const commentBtn = postElement.querySelector('.fa-bullhorn')?.parentElement;
            if (commentBtn) {
                const countSpan = commentBtn.querySelector('span');
                if (countSpan) {
                    const currentCount = parseInt(countSpan.textContent) || 0;
                    countSpan.textContent = currentCount + increment;
                }
            }
        }
    }

    // Like a comment
    async likeComment(commentId) {
        // Liking comment - feature coming soon
        this.showToast('Like feature coming soon!', 'info');
    }

    // Reply to a comment
    replyToComment(commentId) {
        const input = document.getElementById('commentInput');
        if (input) {
            input.value = '@reply ';
            input.focus();
        }
    }

    // Close modal
    close() {
        const modal = document.getElementById('commentModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentPostId = null;
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const bgColors = {
            success: 'var(--success)',
            error: 'var(--danger)',
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
            z-index: 10001;
            animation: slideUp 0.3s ease;
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
const commentSystem = new CommentSystem();

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.commentSystem = commentSystem;
    
    // Global function for onclick handlers
    window.closeCommentModal = function() {
        commentSystem.close();
    };

    window.postComment = function() {
        commentSystem.postComment();
    };
}

// Export for module usage
export { commentSystem, CommentSystem };