// Main Feed JavaScript - All functionality in one file for now
// We'll split this into modules later

// Post interaction handlers
document.querySelectorAll('.interaction-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (this.querySelector('.fa-heart, .far.fa-heart')) {
            const icon = this.querySelector('i');
            const count = this.querySelector('span');
            
            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                this.classList.add('liked');
                if (count) {
                    count.textContent = parseInt(count.textContent) + 1;
                }
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                this.classList.remove('liked');
                if (count) {
                    count.textContent = parseInt(count.textContent) - 1;
                }
            }
        }
    });
});

// Tab switching
document.querySelectorAll('.feed-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
    });
});

// Smooth scroll behavior
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
    });
});

// Theme System
const modeSelector = document.getElementById('modeSelector');
const themeSelector = document.getElementById('themeSelector');

const savedMode = localStorage.getItem('huddleMode') || 'dark';
const savedTheme = localStorage.getItem('huddleTheme') || 'default';

document.documentElement.setAttribute('data-mode', savedMode);
document.documentElement.setAttribute('data-theme', savedTheme);

if (modeSelector) {
    modeSelector.value = savedMode;
}
if (themeSelector) {
    themeSelector.value = savedTheme;
}

modeSelector?.addEventListener('change', function(e) {
    const mode = e.target.value;
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem('huddleMode', mode);
    
    document.body.style.transition = 'background 0.3s ease';
    console.log(`🌓 Switched to ${mode.toUpperCase()} mode!`);
});

themeSelector?.addEventListener('change', function(e) {
    const theme = e.target.value;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('huddleTheme', theme);
    
    document.body.style.transition = 'background 0.3s ease';
    
    if (theme !== 'default') {
        console.log(`🏈 Applied ${theme.toUpperCase()} colors!`);
    }
});

// Function to load posts
window.loadPosts = async function loadPosts() {
    try {
        const response = await fetch('/api/posts/feed');
        const data = await response.json();
        
        if (data.success) {
            displayPosts(data.posts);
        }
    } catch (error) {
        console.error('Failed to load posts:', error);
        // Load demo posts if API fails
        loadDemoPosts();
    }
}

// Function to display posts
function displayPosts(posts) {
    const feedContainer = document.querySelector('.feed-posts');
    
    const demoBetPost = createDemoBetPost();
    
    feedContainer.innerHTML = demoBetPost;
    
    if (posts && posts.length > 0) {
        posts.forEach(post => {
            const postHTML = createPostHTML(post);
            feedContainer.insertAdjacentHTML('beforeend', postHTML);
        });
    }
}

// Create demo bet post
function createDemoBetPost() {
    return `
        <article class="post" data-post-id="demo-bet">
            <div class="post-header">
                <div class="post-avatar" style="background: var(--gradient-primary);">MT</div>
                <div class="post-meta">
                    <div class="post-author">
                        <span class="author-name">Mike Thompson</span>
                        <i class="fas fa-check-circle verified-badge"></i>
                        <span class="author-handle">@mikethompson</span>
                        <span class="post-time">• 5m</span>
                    </div>
                </div>
                <button class="post-menu">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
            
            <div class="post-content">
                Vikings are gonna absolutely destroy the Bears tonight! 🔥 
                Weather's perfect, defense is locked in, and Jefferson is healthy. 
                
                Who's brave enough to take the other side? 💪
            </div>
            
            <div class="bet-challenge" data-bet-id="demo-bet-1" data-max-accepts="3">
                <div class="bet-header">
                    <div class="bet-info">💰 Challenge Bet: Vikings -7 • $25 each</div>
                    <div class="handshake-container state-single">
                        <span class="hand-left">🤚</span>
                        <span class="hand-right">✋</span>
                    </div>
                </div>
                
                <div class="bet-progress">
                    <button class="accept-btn" onclick="acceptBet('demo-bet-1')">
                        🤝 Accept Bet (<span class="accept-count">0</span>/3 spots)
                    </button>
                    <button class="cancel-btn" onclick="cancelBet('demo-bet-1')" style="display: none;">
                        ❌ Cancel
                    </button>
                </div>
                
                <div class="participants"></div>
                
                <div class="progress-text">
                    Looking for opponents to take Bears +7...
                </div>
            </div>
            
            <div class="post-interactions">
                <div class="interaction-group">
                    <button class="interaction-btn" onclick="toggleStaticLike(this)">
                        <i class="fas fa-trophy"></i>
                        <span>12</span>
                    </button>
                    <button class="interaction-btn" onclick="toggleStaticDislike(this)">
                        <i class="fas fa-times-circle"></i>
                        <span>2</span>
                    </button>
                    <button class="interaction-btn" onclick="alert('Comments feature coming soon!')">
                        <i class="fas fa-bullhorn"></i>
                        <span>8</span>
                    </button>
                    <button class="interaction-btn" onclick="alert('Share feature coming soon!')">
                        <i class="fas fa-share"></i>
                        <span>3</span>
                    </button>
                </div>
                <button class="interaction-btn" onclick="alert('Bookmark feature coming soon!')">
                    <i class="far fa-flag"></i>
                </button>
            </div>
        </article>
    `;
}

// Load demo posts
function loadDemoPosts() {
    const feedContainer = document.querySelector('.feed-posts');
    feedContainer.innerHTML = createDemoBetPost() + `
        <article class="post">
            <div class="post-header">
                <div class="post-avatar" style="background: var(--gradient-gold);">SK</div>
                <div class="post-meta">
                    <div class="post-author">
                        <span class="author-name">Sarah Kim</span>
                        <span class="author-handle">@sarahk</span>
                        <span class="post-time">• 15m</span>
                    </div>
                </div>
                <button class="post-menu">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
            
            <div class="post-content">
                Can we talk about how the refs have been this season? That call in the Chiefs game was absolutely brutal. 
                The league needs to address this officiating problem ASAP. 🤔
            </div>
            
            <div class="post-interactions">
                <div class="interaction-group">
                    <button class="interaction-btn" onclick="toggleStaticLike(this)">
                        <i class="fas fa-trophy"></i>
                        <span>567</span>
                    </button>
                    <button class="interaction-btn" onclick="toggleStaticDislike(this)">
                        <i class="fas fa-times-circle"></i>
                        <span>15</span>
                    </button>
                    <button class="interaction-btn" onclick="alert('Comments feature coming soon!')">
                        <i class="fas fa-bullhorn"></i>
                        <span>128</span>
                    </button>
                    <button class="interaction-btn" onclick="alert('Share feature coming soon!')">
                        <i class="fas fa-share"></i>
                        <span>34</span>
                    </button>
                </div>
                <button class="interaction-btn" onclick="alert('Bookmark feature coming soon!')">
                    <i class="far fa-flag"></i>
                </button>
            </div>
        </article>
    `;
}

// Create post HTML
function createPostHTML(post) {
    const timeAgo = getTimeAgo(new Date(post.createdAt));
    const verified = post.author.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : '';
    
    let challengeBetHTML = '';
    if (post.type === 'challenge_bet' && post.challengeBet) {
        const bet = post.challengeBet;
        const acceptedCount = bet.acceptedBy?.length || 0;
        const maxCount = bet.maxOpponents || 3;
        challengeBetHTML = createChallengeBetHTML(post, bet, acceptedCount, maxCount);
    }
    
    return `
        <article class="post" data-post-id="${post._id}">
            <div class="post-header">
                <div class="post-avatar" onclick="window.location.href='/profile.html?u=${post.author.username}'">
                    ${post.author.displayName[0].toUpperCase()}
                </div>
                <div class="post-meta">
                    <div class="post-author">
                        <a href="/profile.html?u=${post.author.username}" style="text-decoration: none; color: inherit;">
                            <span class="author-name">${post.author.displayName}</span>
                            ${verified}
                            <span class="author-handle">@${post.author.username}</span>
                        </a>
                        <span class="post-time">• ${timeAgo}</span>
                    </div>
                </div>
                <button class="post-menu">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
            
            <div class="post-content">
                ${post.content}
            </div>
            
            ${challengeBetHTML}
            
            <div class="post-interactions">
                <div class="interaction-group">
                    <button class="interaction-btn ${post.likes?.some(l => l.user === getUserId() || l === getUserId()) ? 'liked' : ''}" onclick="toggleStaticLike(this)">
                        <i class="fas fa-trophy"></i>
                        <span>${post.likes?.length || 0}</span>
                    </button>
                    <button class="interaction-btn ${post.dislikes?.some(d => d.user === getUserId() || d === getUserId()) ? 'disliked' : ''}" onclick="toggleStaticDislike(this)">
                        <i class="fas fa-times-circle"></i>
                        <span>${post.dislikes?.length || 0}</span>
                    </button>
                    <button class="interaction-btn" onclick="openComments('${post._id}')">
                        <i class="fas fa-bullhorn"></i>
                        <span>${post.comments?.length || 0}</span>
                    </button>
                    <button class="interaction-btn" onclick="sharePost('${post._id}')">
                        <i class="fas fa-share"></i>
                        <span>${post.shares?.length || 0}</span>
                    </button>
                </div>
                <button class="interaction-btn" onclick="bookmarkPost('${post._id}')">
                    <i class="far fa-flag"></i>
                </button>
            </div>
        </article>
    `;
}

// Create challenge bet HTML
function createChallengeBetHTML(post, bet, acceptedCount, maxCount) {
    const betId = `bet-${post._id}`;
    const currentUserId = getUserId();
    const isCreator = post.author._id === currentUserId;
    const hasAccepted = bet.acceptedBy?.some(id => id === currentUserId);
    
    let handshakeState = 'single';
    if (acceptedCount > 0 && acceptedCount < maxCount) {
        handshakeState = 'pending';
    } else if (acceptedCount >= maxCount) {
        handshakeState = 'completed';
    }
    
    return `
        <div class="bet-challenge" data-bet-id="${betId}" data-max-accepts="${maxCount}" data-post-id="${post._id}">
            <div class="bet-header">
                <div class="bet-info">💰 Challenge Bet: ${bet.side} • $${bet.amount} each</div>
                <div class="handshake-container state-${handshakeState}">
                    ${handshakeState === 'completed' ? '<span style="font-size: 2rem;">🤝</span>' : '<span class="hand-left">🤚</span><span class="hand-right">✋</span>'}
                </div>
            </div>
            
            <div class="bet-progress">
                ${acceptedCount < maxCount && !isCreator && !hasAccepted ? `
                    <button class="accept-btn" onclick="acceptChallengeBet('${post._id}')">
                        🤝 Accept Bet (<span class="accept-count">${acceptedCount}</span>/${maxCount} spots)
                    </button>
                ` : ''}
                ${isCreator ? `
                    <button class="cancel-btn" onclick="cancelChallengeBet('${post._id}')">
                        ❌ Cancel Bet
                    </button>
                ` : ''}
            </div>
            
            <div class="participants">
                ${bet.participants?.map(p => `
                    <div class="participant accepted">✅ ${p.displayName || p.username}</div>
                `).join('') || ''}
            </div>
            
            <div class="progress-text">
                ${acceptedCount === 0 
                    ? `Looking for opponents to take the other side...`
                    : acceptedCount < maxCount 
                        ? `${acceptedCount}/${maxCount} spots taken. ${maxCount - acceptedCount} remaining.`
                        : '✅ All spots filled! Bet is locked in.'
                }
            </div>
        </div>
    `;
}

// Helper function to get time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm';
    
    return 'now';
}

// Helper function to get user ID
function getUserId() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || null;
}

// Global functions for interactions
window.toggleStaticLike = function(button) {
    if (window.postInteractions) {
        window.postInteractions.toggleStaticLike(button);
    }
};

window.toggleStaticDislike = function(button) {
    if (window.postInteractions) {
        window.postInteractions.toggleStaticDislike(button);
    }
};

window.acceptBet = function(betId) {
    if (window.betAcceptance) {
        window.betAcceptance.acceptBet(betId);
    }
};

window.cancelBet = function(betId) {
    if (window.betAcceptance) {
        window.betAcceptance.cancelBet(betId);
    }
};

window.acceptChallengeBet = function(postId) {
    if (window.betAcceptance) {
        window.betAcceptance.acceptChallengeBet(postId);
    }
};

window.cancelChallengeBet = function(postId) {
    if (window.betAcceptance) {
        window.betAcceptance.cancelChallengeBet(postId);
    }
};

window.openComments = function(postId) {
    if (window.commentSystem) {
        window.commentSystem.open(postId);
    }
};

window.closeCommentModal = function() {
    if (window.commentSystem) {
        window.commentSystem.close();
    }
};

window.postComment = function() {
    if (window.commentSystem) {
        window.commentSystem.postComment();
    }
};

window.sharePost = function(postId) {
    // Handled by post-interactions.js through event delegation
    console.log('Share handled by post-interactions');
};

window.bookmarkPost = function(postId) {
    // Handled by post-interactions.js through event delegation
    console.log('Bookmark handled by post-interactions');
};

window.triggerImageUpload = function() {
    if (window.postCreator) {
        window.postCreator.triggerImageUpload();
    }
};

window.toggleLocationPicker = function() {
    if (window.postCreator) {
        window.postCreator.toggleLocationPicker();
    }
};

window.togglePredictionMode = function() {
    if (window.postCreator) {
        window.postCreator.togglePredictionMode();
    }
};

window.toggleChallengeMode = function() {
    if (window.challengeBet) {
        window.challengeBet.toggleChallengeMode();
    }
};

window.toggleGamePicker = function() {
    if (window.gamePicker) {
        window.gamePicker.toggle();
    }
};

// Update user sidebar
function updateUserSidebar() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.username) {
        const avatarElement = document.getElementById('sidebarUserAvatar');
        if (avatarElement) {
            avatarElement.textContent = (user.displayName || user.username)[0].toUpperCase();
        }
        
        const nameElement = document.getElementById('sidebarUserName');
        if (nameElement) {
            nameElement.innerHTML = `
                ${user.displayName || user.username}
                ${user.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
            `;
        }
        
        const handleElement = document.getElementById('sidebarUserHandle');
        if (handleElement) {
            handleElement.textContent = `@${user.username}`;
        }
        
        const createPostAvatar = document.getElementById('createPostAvatar');
        if (createPostAvatar) {
            createPostAvatar.textContent = (user.displayName || user.username)[0].toUpperCase();
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    updateUserSidebar();
    loadPosts();
    
    console.log('🚀 Huddle Feed Initialized');
    console.log('📱 Social platform ready');
    console.log('🎯 Real-time updates active');
});