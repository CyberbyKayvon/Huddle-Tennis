// Modal Templates - Generates HTML for various modals
class ModalTemplates {
    constructor() {
        this.activeModals = new Set();
    }

    // Create comment modal
    createCommentModal() {
        const modalId = 'commentModal';
        
        if (document.getElementById(modalId)) {
            return; // Modal already exists
        }

        const modalHTML = `
            <div id="${modalId}" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.85); z-index: 10000; overflow-y: auto; backdrop-filter: blur(10px);">
                <div style="max-width: 600px; margin: 30px auto; background: var(--bg-secondary); border-radius: 20px; max-height: 90vh; display: flex; flex-direction: column; border: 1px solid var(--border); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
                    <!-- Modal Header -->
                    <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: var(--bg-secondary); border-radius: 20px 20px 0 0;">
                        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">Post</h3>
                        <button onclick="commentSystem.close()" style="background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.2s;" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='none'">
                            <span>&times;</span>
                        </button>
                    </div>
                    
                    <!-- Original Post -->
                    <div id="originalPost" style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); background: var(--bg-secondary);">
                        <!-- Original post content will be inserted here -->
                    </div>
                    
                    <!-- Comments Container -->
                    <div id="commentsContainer" style="flex: 1; overflow-y: auto; padding: 1rem 1.5rem; min-height: 200px; max-height: 400px;">
                        <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; opacity: 0.5;"></i>
                            <p style="margin-top: 1rem;">Loading comments...</p>
                        </div>
                    </div>
                    
                    <!-- Add Comment -->
                    <div style="padding: 1rem 1.5rem; border-top: 1px solid var(--border); background: var(--bg-secondary); border-radius: 0 0 20px 20px;">
                        <div style="display: flex; gap: 0.75rem;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; flex-shrink: 0;">
                                <span id="commentUserAvatar">U</span>
                            </div>
                            <div style="flex: 1;">
                                <textarea id="commentInput" placeholder="Post your reply" style="width: 100%; padding: 0.75rem; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 16px; color: var(--text-primary); resize: none; font-family: inherit; font-size: 0.95rem; line-height: 1.4;" rows="2"></textarea>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
                                    <div style="display: flex; gap: 0.5rem;">
                                        <button style="background: none; border: none; color: var(--primary); cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: all 0.2s;" title="Add image">
                                            <i class="far fa-image"></i>
                                        </button>
                                        <button style="background: none; border: none; color: var(--primary); cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: all 0.2s;" title="Add GIF">
                                            <i class="far fa-smile"></i>
                                        </button>
                                    </div>
                                    <button id="postCommentBtn" onclick="commentSystem.postComment()" style="padding: 0.5rem 1.25rem; background: var(--primary); color: white; border: none; border-radius: 20px; font-weight: 600; cursor: pointer; font-size: 0.9rem; opacity: 0.5; transition: all 0.2s;" disabled>Reply</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.activeModals.add(modalId);
    }

    // Create sports/game picker modal
    createSportsModal() {
        const modalId = 'sportsModal';
        
        if (document.getElementById(modalId)) {
            return; // Modal already exists
        }

        const modalHTML = `
            <div class="modal-overlay" id="${modalId}">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">
                            <i class="fas fa-calendar-alt"></i>
                            Select Game
                        </div>
                        <button class="close-button" onclick="gamePicker.close()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="search-bar">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" class="search-input" placeholder="Search teams or games..." id="gameSearch" onkeyup="gamePicker.searchGames()">
                        </div>

                        <div class="sports-tabs">
                            <button class="sport-tab active" data-sport="all" onclick="gamePicker.filterSport('all')">
                                <i class="fas fa-th"></i> All Sports
                            </button>
                            <button class="sport-tab" data-sport="NFL" onclick="gamePicker.filterSport('NFL')">
                                🏈 NFL
                            </button>
                            <button class="sport-tab" data-sport="NBA" onclick="gamePicker.filterSport('NBA')">
                                🏀 NBA
                            </button>
                            <button class="sport-tab" data-sport="MLB" onclick="gamePicker.filterSport('MLB')">
                                ⚾ MLB
                            </button>
                            <button class="sport-tab" data-sport="NHL" onclick="gamePicker.filterSport('NHL')">
                                🏒 NHL
                            </button>
                        </div>

                        <div class="games-grid" id="gamesGrid">
                            <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
                                <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>
                                <p style="margin-top: 1rem;">Loading games...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.activeModals.add(modalId);
    }

    // Create image viewer modal
    createImageModal() {
        const modalId = 'imageModal';
        
        if (document.getElementById(modalId)) {
            return;
        }

        const modalHTML = `
            <div id="${modalId}" class="modal-overlay" style="display: none;" onclick="closeImageModal()">
                <div class="image-modal-content" onclick="event.stopPropagation()">
                    <button class="modal-close-btn" onclick="closeImageModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <img id="modalImage" src="" alt="" style="max-width: 90vw; max-height: 90vh; border-radius: 12px;">
                    <div class="image-modal-actions" style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                        <button class="modal-action-btn" onclick="downloadImage()">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button class="modal-action-btn" onclick="shareImage()">
                            <i class="fas fa-share"></i> Share
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.activeModals.add(modalId);
    }

    // Create confirmation modal
    createConfirmModal(title, message, onConfirm, onCancel) {
        const modalId = `confirmModal_${Date.now()}`;
        
        const modalHTML = `
            <div id="${modalId}" class="modal-overlay active">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <div class="modal-title">
                            <i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i>
                            ${title}
                        </div>
                    </div>
                    
                    <div class="modal-body" style="padding: 1.5rem;">
                        <p style="color: var(--text-primary); margin: 0;">${message}</p>
                    </div>
                    
                    <div class="modal-footer" style="display: flex; gap: 1rem; padding: 1.5rem; border-top: 1px solid var(--border);">
                        <button class="modal-btn cancel" onclick="modalTemplates.closeModal('${modalId}')" style="flex: 1; padding: 0.75rem; background: var(--bg-tertiary); color: var(--text-primary); border: none; border-radius: 8px; cursor: pointer;">
                            Cancel
                        </button>
                        <button class="modal-btn confirm" onclick="modalTemplates.confirmAction('${modalId}')" style="flex: 1; padding: 0.75rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Store callbacks
        this[modalId] = { onConfirm, onCancel };
        
        return modalId;
    }

    // Create share modal
    createShareModal(postId) {
        const modalId = 'shareModal';
        
        const shareUrl = `${window.location.origin}/post/${postId}`;
        
        const modalHTML = `
            <div id="${modalId}" class="modal-overlay active">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <div class="modal-title">
                            <i class="fas fa-share"></i>
                            Share Post
                        </div>
                        <button class="close-button" onclick="modalTemplates.closeModal('${modalId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="share-options" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                            <button class="share-option" onclick="shareToTwitter('${postId}')" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; background: var(--bg-tertiary); border: none; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
                                <i class="fab fa-twitter" style="font-size: 2rem; color: #1DA1F2;"></i>
                                <span style="font-size: 0.875rem; color: var(--text-secondary);">Twitter</span>
                            </button>
                            <button class="share-option" onclick="shareToFacebook('${postId}')" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; background: var(--bg-tertiary); border: none; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
                                <i class="fab fa-facebook" style="font-size: 2rem; color: #1877F2;"></i>
                                <span style="font-size: 0.875rem; color: var(--text-secondary);">Facebook</span>
                            </button>
                            <button class="share-option" onclick="shareToWhatsApp('${postId}')" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; background: var(--bg-tertiary); border: none; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
                                <i class="fab fa-whatsapp" style="font-size: 2rem; color: #25D366;"></i>
                                <span style="font-size: 0.875rem; color: var(--text-secondary);">WhatsApp</span>
                            </button>
                            <button class="share-option" onclick="copyShareLink('${postId}')" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; background: var(--bg-tertiary); border: none; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
                                <i class="fas fa-link" style="font-size: 2rem; color: var(--primary);"></i>
                                <span style="font-size: 0.875rem; color: var(--text-secondary);">Copy Link</span>
                            </button>
                        </div>
                        
                        <div class="share-link-container" style="display: flex; gap: 0.5rem;">
                            <input type="text" value="${shareUrl}" readonly style="flex: 1; padding: 0.75rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary);">
                            <button onclick="copyShareLink('${postId}')" style="padding: 0.75rem 1rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing share modal if present
        const existing = document.getElementById(modalId);
        if (existing) {
            existing.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        return modalId;
    }

    // Close modal
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                this.activeModals.delete(modalId);
                
                // Clean up stored callbacks
                if (this[modalId]) {
                    delete this[modalId];
                }
            }, 300);
        }
    }

    // Confirm action for confirmation modal
    confirmAction(modalId) {
        const callbacks = this[modalId];
        if (callbacks && callbacks.onConfirm) {
            callbacks.onConfirm();
        }
        this.closeModal(modalId);
    }

    // Close all modals
    closeAllModals() {
        this.activeModals.forEach(modalId => {
            this.closeModal(modalId);
        });
    }

    // Initialize modals that should always exist
    init() {
        this.createCommentModal();
        this.createImageModal();
    }
}

// Create global instance
window.modalTemplates = new ModalTemplates();

// Global functions for modal interactions
window.openImageModal = function(imageUrl) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    
    if (modal && modalImage) {
        modalImage.src = imageUrl;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

window.closeImageModal = function() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

window.downloadImage = function() {
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        const link = document.createElement('a');
        link.href = modalImage.src;
        link.download = 'huddle-image.jpg';
        link.click();
    }
};

window.shareImage = function() {
    const modalImage = document.getElementById('modalImage');
    if (modalImage && navigator.share) {
        navigator.share({
            title: 'Check out this image from Huddle',
            url: modalImage.src
        });
    }
};

window.shareToTwitter = function(postId) {
    const url = `${window.location.origin}/post/${postId}`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=Check out this post on Huddle!`, '_blank');
};

window.shareToFacebook = function(postId) {
    const url = `${window.location.origin}/post/${postId}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
};

window.shareToWhatsApp = function(postId) {
    const url = `${window.location.origin}/post/${postId}`;
    window.open(`https://wa.me/?text=Check out this post on Huddle: ${encodeURIComponent(url)}`, '_blank');
};

window.copyShareLink = function(postId) {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
        // Show success toast
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10001;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = 'Link copied to clipboard!';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    });
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalTemplates;
}