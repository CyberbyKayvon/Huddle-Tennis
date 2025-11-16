// Post Template - Generates HTML for posts with secure DOM manipulation
class PostTemplate {
    constructor() {
        this.timeHelpers = window.TimeHelpers || { getTimeAgo: (d) => 'now' };
        this.authService = window.authService;
    }

    // Sanitize HTML to prevent XSS
    sanitizeHTML(str) {
        if (!str) return '';
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Create complete post HTML
    createPostHTML(post) {
        if (!post) return '';
        
        const timeAgo = this.timeHelpers.getTimeAgo(new Date(post.createdAt || post.timestamp || Date.now()));
        const currentUser = this.authService?.getCurrentUser();
        const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId;
        
        return `
            <article class="post" data-post-id="${this.sanitizeHTML(post._id || post.id)}">
                ${this.createPostHeader(post.author, timeAgo)}
                ${this.createPostContent(post.content)}
                ${post.location ? this.createLocationBadge(post.location) : ''}
                ${post.taggedGame ? this.createGameTag(post.taggedGame) : ''}
                ${post.media && post.media.length > 0 ? this.createPostMedia(post.media) : ''}
                ${post.type === 'prediction' && post.prediction ? this.createPredictionDisplay(post.prediction) : ''}
                ${post.type === 'challenge_bet' && post.challengeBet ? this.createChallengeBet(post, currentUserId) : ''}
                ${this.createPostInteractions(post, currentUserId)}
            </article>
        `;
    }

    // Create post header
    createPostHeader(author, timeAgo) {
        if (!author) {
            author = { username: 'unknown', displayName: 'Unknown User' };
        }
        
        const verified = author.verified || author.isVerified ? '<i class="fas fa-check-circle verified-badge"></i>' : '';
        const displayName = this.sanitizeHTML(author.displayName || author.username || 'User');
        const avatarInitial = displayName.charAt(0).toUpperCase();
        const username = this.sanitizeHTML(author.username || 'user');
        
        // Create avatar with fallback to initial - check for base64 or URL
        const avatarContent = author.avatar 
            ? `<img src="${this.sanitizeHTML(author.avatar)}" alt="${displayName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.style.display='none'; this.parentElement.innerHTML='${avatarInitial}'">` 
            : avatarInitial;
        
        // Add follow button if followService exists and author has _id
        const currentUser = this.authService?.getCurrentUser();
        let followButton = '';
        
        // Make sure we have valid author._id before creating follow button
        if (window.followService && currentUser && author._id && currentUser._id !== author._id && currentUser.username !== username) {
            // Check if already following (synchronously if loaded)
            let isFollowing = false;
            if (window.followService.isLoaded) {
                isFollowing = window.followService.isFollowing(author._id);
            }
            
            // Create button with current state
            followButton = `
                <button 
                    class="follow-btn-inline ${isFollowing ? 'following' : 'follow'}"
                    data-follow-user-id="${this.sanitizeHTML(author._id)}"
                    onclick="followService.toggleFollow('${this.sanitizeHTML(author._id)}', '${username}')"
                    style="
                        margin-left: auto;
                        padding: 0.25rem 0.75rem;
                        background: ${isFollowing ? 'var(--danger)' : 'var(--primary)'};
                        color: white;
                        border: none;
                        border-radius: 20px;
                        font-size: 0.875rem;
                        cursor: pointer;
                        transition: all 0.2s;
                    "
                >
                    ${isFollowing ? 'Unfollow' : 'Follow'}
                </button>
            `;
            
            // Update button after a delay if service wasn't loaded
            if (!window.followService.isLoaded) {
                setTimeout(() => {
                    if (window.followService && window.followService.isLoaded) {
                        const actuallyFollowing = window.followService.isFollowing(author._id);
                        const btn = document.querySelector(`[data-follow-user-id="${author._id}"]`);
                        if (btn && actuallyFollowing) {
                            btn.textContent = 'Unfollow';
                            btn.style.background = 'var(--danger)';
                            btn.className = 'follow-btn-inline following';
                        }
                    }
                }, 1500);
            }
        }
        
        return `
            <div class="post-header" data-author-id="${this.sanitizeHTML(author._id || author.id || '')}">
                <div class="post-avatar" style="cursor: pointer; background: ${this.getAvatarGradient(username)}; overflow: hidden;" onclick="event.preventDefault(); window.profileComponent?.loadProfile('${username}')">
                    ${avatarContent}
                </div>
                <div class="post-meta">
                    <div class="post-author">
                        <a href="#" onclick="event.preventDefault(); window.profileComponent?.loadProfile('${username}'); return false;" style="text-decoration: none; color: inherit;">
                            <span class="author-name">${displayName}</span>
                            ${verified}
                            <span class="author-handle">@${username}</span>
                        </a>
                        ${author.reputation && window.reputationBadge ? window.reputationBadge.renderCompactBadge(author.reputation) : ''}
                        <span class="post-time">• ${timeAgo}</span>
                    </div>
                </div>
                ${followButton}
                <button class="post-menu" onclick="postInteractions.handleMenu(this)">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
        `;
    }

    // Create post content
    createPostContent(content) {
        // Make sure content is a string, not an object
        if (!content || typeof content === 'object') return '';
        
        const formattedContent = this.formatContent(content);
        
        return `
            <div class="post-content">
                ${formattedContent}
            </div>
        `;
    }

    // Create location badge
    createLocationBadge(location) {
        // Handle location object or string
        const locationText = typeof location === 'object' ? 
            this.sanitizeHTML(location.name || location.city || '') : 
            this.sanitizeHTML(location);
        if (!locationText) return '';
        
        return `
            <div class="post-location" style="display: inline-flex; align-items: center; gap: 0.25rem; color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;">
                <i class="fas fa-map-marker-alt"></i>
                <span>${locationText}</span>
            </div>
        `;
    }

    // Create game tag
    createGameTag(game) {
        const gameText = game.awayTeam && game.homeTeam 
            ? `${this.sanitizeHTML(game.awayTeam)} @ ${this.sanitizeHTML(game.homeTeam)}`
            : this.sanitizeHTML(game.name || game.id || 'Game');
            
        return `
            <div class="post-game-tag" style="display: inline-flex; align-items: center; gap: 0.5rem; background: var(--surface); padding: 0.25rem 0.75rem; border-radius: 20px; margin-top: 0.5rem; font-size: 0.875rem;">
                <span>🏈</span>
                <span>${gameText}</span>
            </div>
        `;
    }

    // Format content (hashtags, mentions, links)
    formatContent(content) {
        if (!content) return '';
        
        // Escape HTML first
        let formatted = this.sanitizeHTML(content);
        
        // Convert URLs to links
        formatted = formatted.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener" style="color: var(--primary);">$1</a>'
        );
        
        // Convert @mentions
        formatted = formatted.replace(
            /@(\w+)/g,
            '<a href="/profile?u=$1" class="mention" style="color: var(--primary); text-decoration: none;">@$1</a>'
        );
        
        // Convert #hashtags
        formatted = formatted.replace(
            /#(\w+)/g,
            '<span class="hashtag" style="color: var(--primary); cursor: pointer;" onclick="feedController.handleSearch(\'#$1\')">#$1</span>'
        );
        
        // Convert line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    // Create post media
    createPostMedia(media) {
        if (!media || media.length === 0) return '';
        
        if (media.length === 1) {
            return this.createSingleMedia(media[0]);
        } else {
            return this.createMediaGrid(media);
        }
    }

    // Create single media item
    createSingleMedia(item) {
        if (!item) return '';
        
        // Handle base64 images
        const imageUrl = this.sanitizeHTML(item.url || item.base64 || '');
        
        if (item.type === 'image') {
            return `
                <div class="post-media" style="margin-top: 0.75rem; max-width: 100%; overflow: hidden;">
                    <img src="${imageUrl}" alt="" class="post-image" style="display: block; width: 100%; max-width: 100%; height: auto; max-height: 350px; object-fit: contain; border-radius: 12px; cursor: pointer; background: var(--bg-primary);" onclick="postInteractions.openImageModal('${imageUrl}')">
                </div>
            `;
        } else if (item.type === 'video') {
            return `
                <div class="post-media" style="margin-top: 0.75rem;">
                    <video controls class="post-video" style="width: 100%; border-radius: 12px;">
                        <source src="${this.sanitizeHTML(item.url)}" type="video/mp4">
                    </video>
                </div>
            `;
        }
        return '';
    }

    // Create media grid for multiple items
    createMediaGrid(media) {
        const gridClass = media.length === 2 ? 'grid-2' : media.length === 3 ? 'grid-3' : 'grid-4';
        
        const items = media.slice(0, 4).map((item, index) => {
            const extra = media.length > 4 && index === 3 
                ? `<div class="media-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;">+${media.length - 4}</div>` 
                : '';
                
            const itemUrl = this.sanitizeHTML(item.url);
            return `
                <div class="media-grid-item" style="position: relative; overflow: hidden; border-radius: 8px;">
                    ${item.type === 'image' 
                        ? `<img src="${itemUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" onclick="postInteractions.openImageModal('${itemUrl}')">${extra}`
                        : `<video src="${itemUrl}" style="width: 100%; height: 100%; object-fit: cover;"></video>${extra}`
                    }
                </div>
            `;
        }).join('');
        
        return `
            <div class="post-media media-grid ${gridClass}" style="display: grid; gap: 0.25rem; margin-top: 0.75rem; grid-template-columns: ${media.length === 2 ? '1fr 1fr' : '1fr 1fr'};">
                ${items}
            </div>
        `;
    }

    // Create enhanced prediction display
    createPredictionDisplay(prediction) {
        if (!prediction) return '';
        
        const pred = prediction;
        const confidence = parseInt(pred.confidence) || 75;
        const confidenceColor = confidence >= 90 ? '#10b981' : 
                               confidence >= 75 ? '#6366f1' : 
                               confidence >= 60 ? '#f59e0b' : '#6b7280';
        
        // Sanitize all prediction values
        const pick = this.sanitizeHTML(pred.pick || 'Unknown');
        const game = this.sanitizeHTML(pred.game || '');
        const amount = parseInt(pred.amount) || 0;
        
        return `
            <div class="prediction-display" style="
                background: linear-gradient(135deg, ${confidenceColor}15, ${confidenceColor}08);
                border: 2px solid ${confidenceColor};
                border-radius: 12px;
                padding: 1rem;
                margin: 0.75rem 0;
                position: relative;
                overflow: hidden;
                animation: predictionGlow 2s ease-in-out;
            ">
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    width: ${confidence}%;
                    background: linear-gradient(90deg, ${confidenceColor}20, transparent);
                    transition: width 0.5s ease;
                    animation: confidenceWave 3s ease-in-out infinite;
                "></div>
                
                <div style="position: relative; z-index: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <div>
                            <div style="font-size: 1.25rem; font-weight: bold; color: var(--text); margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.5rem; animation: bounce 2s infinite;">🎯</span>
                                <span>${pick}</span>
                            </div>
                            ${game ? `
                                <div style="font-size: 0.875rem; color: var(--text-muted);">
                                    ${game}
                                </div>
                            ` : ''}
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 2rem; font-weight: bold; color: ${confidenceColor}; text-shadow: 0 0 20px ${confidenceColor}40;">
                                ${confidence}%
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">
                                confidence
                            </div>
                        </div>
                    </div>
                    
                    ${amount > 0 ? `
                        <div style="
                            margin-top: 0.75rem;
                            padding-top: 0.75rem;
                            border-top: 1px solid ${confidenceColor}30;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <span style="color: var(--text-muted); font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.125rem;">💰</span>
                                Wagered
                            </span>
                            <span style="color: var(--text); font-weight: bold; font-size: 1.125rem;">
                                $${amount}
                            </span>
                        </div>
                    ` : ''}
                    
                    <div style="
                        margin-top: 0.5rem;
                        display: flex;
                        gap: 0.5rem;
                        align-items: center;
                    ">
                        ${this.getConfidenceEmoji(confidence)}
                        <span style="font-size: 0.875rem; color: ${confidenceColor}; font-weight: 600;">
                            ${this.getConfidenceText(confidence)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    // Get confidence emoji based on level
    getConfidenceEmoji(confidence) {
        if (confidence >= 95) return '<span style="font-size: 1.25rem;">🔥🔥🔥</span>';
        if (confidence >= 90) return '<span style="font-size: 1.25rem;">🔥🔥</span>';
        if (confidence >= 80) return '<span style="font-size: 1.25rem;">🔥</span>';
        if (confidence >= 70) return '<span style="font-size: 1.25rem;">💪</span>';
        if (confidence >= 60) return '<span style="font-size: 1.25rem;">🤔</span>';
        return '<span style="font-size: 1.25rem;">🎲</span>';
    }

    // Get confidence text
    getConfidenceText(confidence) {
        if (confidence >= 95) return 'LOCK OF THE CENTURY!';
        if (confidence >= 90) return 'EXTREMELY CONFIDENT';
        if (confidence >= 80) return 'VERY CONFIDENT';
        if (confidence >= 70) return 'CONFIDENT';
        if (confidence >= 60) return 'SOMEWHAT CONFIDENT';
        return 'TAKING A CHANCE';
    }

    // Create challenge bet (keeping existing logic, just adding sanitization)
    createChallengeBet(post, currentUserId) {
        const bet = post.challengeBet;
        if (!bet) return '';
        
        const acceptedCount = bet.currentOpponents || bet.acceptedBy?.length || 0;
        const maxCount = bet.maxOpponents || 3;
        const postAuthorId = post.author?._id || post.author?.id || post.author;
        const isCreator = postAuthorId === currentUserId;
        const hasAccepted = bet.acceptedBy?.some(user => 
            (typeof user === 'string' ? user : user._id) === currentUserId
        ) || bet.opponents?.includes(currentUserId);
        const isFull = acceptedCount >= maxCount;
        
        // Prepare display data with sanitization
        const displayData = {
            team: this.sanitizeHTML(bet.side === 'home' ? bet.game.homeTeam : bet.game.awayTeam),
            spread: bet.betType === 'spread' ? 
                this.sanitizeHTML((bet.side === 'home' ? 
                    bet.game.sportsbooks?.draftkings?.spread?.home || bet.game.spread || 'N/A' : 
                    bet.game.sportsbooks?.draftkings?.spread?.away || bet.game.spread || 'N/A').toString()) : 'N/A',
            side: bet.side,
            betType: bet.betType || 'spread',
            awayTeam: this.sanitizeHTML(bet.game.awayTeam),
            homeTeam: this.sanitizeHTML(bet.game.homeTeam),
            gameText: `${this.sanitizeHTML(bet.game.awayTeam)} @ ${this.sanitizeHTML(bet.game.homeTeam)}`
        };
        
        // Check if game has started
        const gameTime = bet.game?.startTime || bet.game?.gameTime;
        const isBettingClosed = gameTime ? new Date(gameTime) < new Date() : false;
        
        // Determine handshake state
        let handshakeState = 'single';
        let handshakeHTML = '<span class="hand-left">🤚</span><span class="hand-right">✋</span>';
        let gapLevel = '0';
        
        if (isFull || bet.status === 'full') {
            handshakeState = 'completed';
            handshakeHTML = '<span class="handshake-joined">🤝</span>';
            gapLevel = 'full';
        } else if (acceptedCount > 0) {
            handshakeState = 'pending';
            gapLevel = Math.ceil((acceptedCount / maxCount) * 5).toString();
        }
        
        // Format the bet display based on type
        let betDisplay = '';
        const teamName = displayData.team;
        const spreadValue = displayData.spread;
        const betType = displayData.betType;
        
        if (betType === 'spread') {
            betDisplay = `${teamName} ${spreadValue}`;
        } else if (betType === 'moneyline') {
            betDisplay = `${teamName} ML`;
        } else if (betType === 'total' || betType === 'ou') {
            const totalValue = this.sanitizeHTML((bet.game?.total || bet.lineDetails?.total || '45.5').toString());
            betDisplay = `${bet.side === 'over' ? 'Over' : 'Under'} ${totalValue}`;
        } else {
            betDisplay = `${teamName} ${spreadValue}`.trim() || 'Bet';
        }
        
        // Get max opponents display
        const maxDisplay = bet.maxOpponents === 10 ? '∞' : bet.maxOpponents || 1;
        const postId = this.sanitizeHTML(post._id);
        const betId = this.sanitizeHTML(post.challengeBet?.betId || post._id);
        const amount = parseInt(bet.amount) || 0;
        
        return `
            <div class="bet-challenge glass-card neon-border" data-bet-id="${postId}" data-max-accepts="${maxCount}" style="background: var(--surface); border-radius: 12px; padding: 1rem; margin-top: 0.75rem; position: relative; overflow: hidden;">
                <div class="bet-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div class="bet-info" style="font-weight: 600;">
                        ${isBettingClosed ? '🔒' : '💰'} Challenge: ${betDisplay} • $${amount} • ${acceptedCount}/${maxDisplay} takers
                        ${bet.minTrustScore ? ` • ⭐${bet.minTrustScore}+ required` : ''}
                        ${displayData.gameText ? ` • ${displayData.gameText}` : ''}
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div class="handshake-container state-${handshakeState}" data-gap="${gapLevel}">
                            ${handshakeHTML}
                        </div>
                        ${acceptedCount > 0 ? `
                            <div style="display: flex; align-items: center; gap: 0.25rem; margin-left: 0.5rem;">
                                ${Array(Math.min(acceptedCount, 5)).fill('').map((_, i) => 
                                    `<div style="width: 8px; height: 8px; background: var(--success); border-radius: 50%; animation: pulse ${1 + i * 0.1}s infinite;"></div>`
                                ).join('')}
                                ${acceptedCount > 5 ? `<span style="font-size: 0.75rem; color: var(--text-muted);">+${acceptedCount - 5}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="bet-progress" data-game-time="${gameTime || ''}">
                    ${isBettingClosed ? `
                        <div style="color: var(--warning); font-weight: 600;">
                            ⏰ Betting closed - Game has started
                        </div>
                    ` : bet.status === 'cancelled' ? `
                        <div style="color: var(--danger); font-weight: 600;">
                            ❌ This bet has been cancelled
                        </div>
                    ` : `
                        ${!isCreator && !hasAccepted && acceptedCount < maxCount && bet.status !== 'cancelled' ? `
                            <button class="accept-btn" onclick="window.betAcceptance?.acceptChallengeBet('${postId}', '${betId}')" 
                                    style="background: var(--primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                🤝 Accept Bet (${acceptedCount}/${maxCount} spots)
                            </button>
                        ` : ''}
                        ${hasAccepted && !isCreator ? `
                            <button class="cancel-btn" onclick="window.betAcceptance?.removeFromBet('${postId}')" 
                                    style="background: var(--warning); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
                                🚪 Back Out
                            </button>
                        ` : ''}
                        ${isCreator && bet.status !== 'cancelled' ? `
                            <button class="cancel-btn" onclick="window.betAcceptance?.cancelChallengeBet('${postId}')" 
                                    style="background: var(--danger); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
                                ❌ Cancel Entire Bet
                            </button>
                        ` : ''}
                        ${acceptedCount >= maxCount && !hasAccepted && !isCreator ? `
                            <div style="color: var(--text-muted); font-weight: 600;">
                                🔒 Bet is full (${acceptedCount}/${maxCount})
                            </div>
                        ` : ''}
                    `}
                </div>
                
                ${bet.acceptedBy && bet.acceptedBy.length > 0 ? `
                    <div class="participants" style="margin-top: 0.75rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${bet.acceptedBy.map(user => `
                            <div class="participant accepted" style="background: var(--success)20; color: var(--success); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.875rem;">
                                ✅ @${this.sanitizeHTML(user.username || user)}
                            </div>
                        `).join('')}
                    </div>
                ` : bet.opponents && bet.opponents.length > 0 ? `
                    <div class="participants" style="margin-top: 0.75rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${bet.opponents.map(username => `
                            <div class="participant accepted" style="background: var(--success)20; color: var(--success); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.875rem;">
                                ✅ @${this.sanitizeHTML(username)}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="progress-text" style="margin-top: 0.75rem; color: var(--text-muted); font-size: 0.875rem;">
                    ${this.getBetProgressText(acceptedCount, maxCount, isBettingClosed)}
                </div>
            </div>
        `;
    }

    // Create post interactions
    createPostInteractions(post, currentUserId) {
        const likes = Array.isArray(post.likes) ? post.likes.length : 0;
        const dislikes = Array.isArray(post.dislikes) ? post.dislikes.length : 0;
        const comments = Array.isArray(post.comments) ? post.comments.length : 0;
        const shares = Array.isArray(post.shares) ? post.shares.length : 0;
        
        const liked = post.isLiked || (Array.isArray(post.likes) && post.likes.includes(currentUserId));
        const disliked = post.isDisliked || (Array.isArray(post.dislikes) && post.dislikes.includes(currentUserId));
        const bookmarked = post.isBookmarked || (Array.isArray(post.bookmarks) && post.bookmarks.includes(currentUserId));
        
        const postId = this.sanitizeHTML(post._id || post.id);
        
        return `
    <div class="post-interactions">
        <div class="interaction-group">
            <button class="interaction-btn ${liked ? 'liked' : ''}" onclick="window.postInteractions.handleLike(this)" data-post-id="${postId}">
                <i class="fas fa-trophy"></i>
                <span>${likes}</span>
            </button>
            <button class="interaction-btn ${disliked ? 'disliked' : ''}" onclick="window.postInteractions.handleDislike(this)" data-post-id="${postId}">
                <i class="fas fa-times-circle"></i>
                <span>${dislikes}</span>
            </button>
                    <button class="interaction-btn" onclick="window.commentSystem?.open('${postId}')">
                        <i class="fas fa-bullhorn"></i>
                        <span>${comments}</span>
                    </button>
                    <button class="interaction-btn" onclick="window.postInteractions?.handleShare(this)" data-post-id="${postId}">
                        <i class="fas fa-share"></i>
                        <span>${shares}</span>
                    </button>
                </div>
                <button class="interaction-btn ${bookmarked ? 'bookmarked' : ''}" onclick="window.postInteractions?.handleBookmark(this)" data-post-id="${postId}">
                    <i class="${bookmarked ? 'fas' : 'far'} fa-flag"></i>
                </button>
            </div>
        `;
    }

    // Helper functions
    getConfidenceColor(confidence) {
        if (confidence >= 80) return 'var(--success)';
        if (confidence >= 50) return 'var(--warning)';
        return 'var(--danger)';
    }

    getAvatarGradient(username) {
        const gradients = [
            'var(--gradient-primary)',
            'var(--gradient-success)',
            'var(--gradient-danger)',
            'var(--gradient-gold)',
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
        ];
        
        // Use username to consistently pick a gradient
        const index = username ? username.charCodeAt(0) % gradients.length : 0;
        return gradients[index];
    }

    getBetProgressText(accepted, max, isClosed) {
        if (isClosed) {
            return '⏰ Betting closed - Game has started';
        } else if (accepted === 0) {
            return 'Looking for opponents to take the other side...';
        } else if (accepted < max) {
            return `${accepted}/${max} spots taken. ${max - accepted} remaining.`;
        } else {
            return '✅ All spots filled! Bet is locked in.';
        }
    }
}

// Add animations for predictions
if (!document.querySelector('#prediction-animations')) {
    const style = document.createElement('style');
    style.id = 'prediction-animations';
    style.textContent = `
        @keyframes predictionGlow {
            0% { box-shadow: 0 0 0 rgba(99, 102, 241, 0); }
            50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
            100% { box-shadow: 0 0 0 rgba(99, 102, 241, 0); }
        }
        
        @keyframes confidenceWave {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
        }
    `;
    document.head.appendChild(style);
}

// Create global instance
window.postTemplate = new PostTemplate();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PostTemplate;
}