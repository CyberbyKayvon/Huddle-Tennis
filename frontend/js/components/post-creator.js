// Post Creator Component - Handles creating new posts with secure DOM manipulation
class PostCreator {
    constructor() {
        this.postInput = null;
        this.postSubmit = null;
        this.mediaFiles = [];
        this.selectedLocation = null;
        this.selectedGame = null;
        this.predictionGame = null;
        this.submitting = false;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.postInput = document.querySelector('.post-input');
        this.postSubmit = document.querySelector('.post-submit');
        
        // Input handler
        if (this.postInput) {
            this.postInput.addEventListener('input', () => this.handleInput());
            
            // Handle Enter key (submit on Ctrl/Cmd+Enter)
            this.postInput.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    this.submitPost();
                }
            });
        }
        
        // Submit handler
        if (this.postSubmit) {
            this.postSubmit.addEventListener('click', () => this.submitPost());
        }
        
        // Create post button in sidebar
        const createPostBtn = document.querySelector('.create-post-btn');
        if (createPostBtn) {
            createPostBtn.addEventListener('click', () => this.focusPostInput());
        }
        
        console.log('✅ PostCreator initialized');
    }

    // Sanitize HTML to prevent XSS
    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Create element safely
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        // Set attributes safely
        Object.keys(attributes).forEach(key => {
            if (key === 'style' && typeof attributes[key] === 'object') {
                Object.assign(element.style, attributes[key]);
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, attributes[key]);
            } else if (key === 'className') {
                element.className = attributes[key];
            } else if (key !== 'innerHTML' && key !== 'onclick') {
                element[key] = attributes[key];
            }
        });
        
        // Set content safely
        if (content) {
            if (typeof content === 'string') {
                element.textContent = content;
            } else if (content instanceof HTMLElement) {
                element.appendChild(content);
            }
        }
        
        return element;
    }

    handleInput() {
        const hasContent = this.postInput && this.postInput.value.trim().length > 0;
        const hasMedia = this.mediaFiles.length > 0;
        const challengeMode = document.querySelector('.challenge-creator');
        const predictionMode = document.querySelector('.prediction-creator');
        
        // Enable submit if there's content, media, challenge mode, or valid prediction
        let canSubmit = hasContent || hasMedia || challengeMode;
        
        // Check if prediction is valid
        if (predictionMode) {
            const pickSelect = predictionMode.querySelector('#predictionPick');
            // For game picker predictions, we don't have a gameSelect element
            const hasValidPrediction = (window.currentPredictionGame && pickSelect?.value) || 
                                       (predictionMode.querySelector('#predictionGame')?.value && pickSelect?.value);
            canSubmit = canSubmit || hasValidPrediction;
        }
        
        if (this.postSubmit) {
            this.postSubmit.disabled = !canSubmit;
        }
        
        // Emit typing indicator
        if (hasContent && window.realtimeService) {
            window.realtimeService.emitTyping('post');
        }
    }

    focusPostInput() {
        if (this.postInput) {
            this.postInput.focus();
            // Scroll to create post area
            document.querySelector('.create-post-area')?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }

    async submitPost() {
        // Prevent multiple submissions
        if (this.submitting) {
            console.log('🚫 Already submitting, ignoring duplicate call');
            return;
        }
        
        this.submitting = true;
        
        // Disable button immediately to prevent double clicks
        if (this.postSubmit) {
            this.postSubmit.disabled = true;
        }
        
        try {
            const content = this.postInput?.value?.trim();
            
            // Check if we have content or media
            if (!content && this.mediaFiles.length === 0 && !document.querySelector('.challenge-creator') && !document.querySelector('.prediction-creator')) {
                this.showToast('Please enter some content, add media, or make a prediction', 'warning');
                return;
            }
            
            // Build post data
            const postData = await this.buildPostData(content);
            if (!postData) {
                this.showToast('Invalid post data. Please check your input.', 'error');
                return;
            }
            
            // Validate challenge bet if active
            if (postData.type === 'challenge_bet') {
                if (!this.validateChallengeBet(postData.challengeBet)) {
                    return;
                }
            }
            
            // Create bet in database if it's a challenge
            if (postData.type === 'challenge_bet' && window.betService) {
                const betResult = await window.betService.createBetChallenge(postData.challengeBet);
                if (betResult.success) {
                    console.log('✅ Bet challenge created:', betResult.bet);
                    postData.challengeBet.betId = betResult.bet._id;
                } else {
                    this.showToast('Failed to create bet challenge', 'error');
                    this.setSubmitLoading(false);
                    return;
                }
            }
            
            // Disable submit and show loading
            this.setSubmitLoading(true, postData.type === 'challenge_bet' || postData.type === 'prediction');
            
            // Submit to database API
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(postData)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Update user stats if prediction
                if (postData.type === 'prediction') {
                    this.updateUserPredictionStats();
                }
                
                this.handleSuccessfulPost(result.post);
                
                // Emit real-time update for OTHER users only
                if (window.realtimeService && result.post) {
                    window.realtimeService.emitNewPost(result.post);
                }
            } else {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Failed to create post');
            }
        } catch (error) {
            console.error('Error posting:', error);
            this.showToast('Failed to create post. Please try again.', 'error');
        } finally {
            this.setSubmitLoading(false);
            this.submitting = false;
        }
    }

    async buildPostData(content) {
        const challengeCreator = document.querySelector('.challenge-creator');
        const predictionCreator = document.querySelector('.prediction-creator');
        
        let postData = {
            content: this.sanitizeHTML(content || ''),
            type: 'post',
            timestamp: new Date(),
            media: this.mediaFiles.length > 0 ? this.getMediaData() : [],
            location: this.selectedLocation
        };
        
        // Check for prediction mode
        if (predictionCreator) {
            const predictionData = this.getPredictionData();
            if (predictionData) {
                postData.type = 'prediction';
                postData.prediction = predictionData;
                // Auto-generate content if empty
                if (!postData.content) {
                    postData.content = this.sanitizeHTML(`🎯 ${predictionData.pick} • ${predictionData.confidence}% confident${predictionData.amount > 0 ? ` • $${predictionData.amount}` : ''}`);
                }
            }
        }
        
        // Check for challenge bet mode
        if (challengeCreator && window.challengeBet) {
            const challengeData = await window.challengeBet.getChallengeData();
            
            if (!challengeData || !challengeData.game || !challengeData.game.gameId) {
                console.error('Invalid challenge data:', challengeData);
                this.showToast('Please select a valid game for the challenge bet', 'error');
                return null;
            }
            
            // Fetch game lines to ensure accurate spread
            let gameData = challengeData.game;
            try {
                const response = await fetch(`/api/lines/${challengeData.game.gameId}`);
                const linesData = await response.json();
                if (linesData.success && linesData.lines) {
                    gameData = { ...gameData, ...linesData.lines };
                }
            } catch (error) {
                console.error('Failed to fetch game lines for challenge bet:', error);
            }
            
            postData.type = 'challenge_bet';
            postData.challengeBet = {
                ...challengeData,
                game: {
                    gameId: challengeData.game.gameId,
                    awayTeam: gameData.awayTeam || 'Away',
                    homeTeam: gameData.homeTeam || 'Home',
                    spread: gameData.sportsbooks?.draftkings?.spread?.home || gameData.spread || '+0',
                    total: gameData.total || '+0',
                    sport: gameData.sport || 'NFL',
                    sportsbooks: gameData.sportsbooks || {}
                },
                side: challengeData.side || 'home',
                betType: challengeData.betType || 'spread',
                amount: challengeData.amount || 10,
                maxOpponents: challengeData.maxOpponents || 1
            };
        }
        
        // Check for tagged game
        if (window.gamePicker?.selectedGame || this.selectedGame) {
            postData.taggedGame = window.gamePicker?.selectedGame || this.selectedGame;
        }
        
        return postData;
    }

    getMediaData() {
        return this.mediaFiles.map(file => ({
            type: file.type.startsWith('image/') ? 'image' : 'video',
            url: file.base64 || URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            mimeType: file.type
        }));
    }

    validateChallengeBet(challengeBet) {
        if (!challengeBet) {
            this.showToast('Please configure your challenge bet', 'warning');
            return false;
        }
        
        if (!challengeBet.game || !challengeBet.game.gameId) {
            this.showToast('Please select a valid game!', 'warning');
            return false;
        }
        
        if (!challengeBet.side || !challengeBet.amount) {
            this.showToast('Please select your bet side and enter an amount!', 'warning');
            return false;
        }
        
        if (challengeBet.amount < 1) {
            this.showToast('Bet amount must be at least $1', 'warning');
            return false;
        }
        
        if (challengeBet.amount > 10000) {
            this.showToast('Bet amount cannot exceed $10,000', 'warning');
            return false;
        }
        
        return true;
    }

    getPredictionData() {
        const predictionCreator = document.querySelector('.prediction-creator');
        if (!predictionCreator) return null;
        
        // Check if using game picker prediction
        if (window.currentPredictionGame) {
            const pickSelect = predictionCreator.querySelector('#predictionPick');
            const confidenceInput = predictionCreator.querySelector('#confidenceSlider');
            const amountInput = predictionCreator.querySelector('#predictionAmount');
            
            console.log('Getting prediction data:', {
                game: window.currentPredictionGame,
                pick: pickSelect?.value,
                confidence: confidenceInput?.value,
                amount: amountInput?.value
            });
            
            if (!pickSelect?.value) {
                console.error('No pick selected');
                return null;
            }
            
            const predictionData = {
                gameId: window.currentPredictionGame.gameId,
                game: `${window.currentPredictionGame.awayTeam} @ ${window.currentPredictionGame.homeTeam}`,
                awayTeam: window.currentPredictionGame.awayTeam,
                homeTeam: window.currentPredictionGame.homeTeam,
                team1: window.currentPredictionGame.awayTeam,
                team2: window.currentPredictionGame.homeTeam,
                pick: pickSelect.value,
                confidence: parseInt(confidenceInput?.value) || 75,
                amount: parseInt(amountInput?.value) || 0,
                spread: parseFloat(window.currentPredictionGame.spread) || 0,
                total: parseFloat(window.currentPredictionGame.total) || 45.5,
                sport: window.currentPredictionGame.sport || 'NFL',
                league: window.currentPredictionGame.sport || 'NFL',
                betType: window.currentBetType || 'spread',
                pickType: window.currentBetType || 'spread',
                gameTime: window.currentPredictionGame.gameTime || new Date()
            };
            
            console.log('Returning prediction data:', predictionData);
            return predictionData;
        }
        
        // Original logic for manual game selection
        const gameSelect = predictionCreator.querySelector('#predictionGame');
        const pickSelect = predictionCreator.querySelector('#predictionPick');
        const confidenceInput = predictionCreator.querySelector('#confidenceSlider');
        const amountInput = predictionCreator.querySelector('#predictionAmount');
        
        if (!gameSelect?.value || !pickSelect?.value) return null;
        
        const selectedOption = gameSelect.options[gameSelect.selectedIndex];
        
        return {
            gameId: gameSelect.value,
            game: `${selectedOption.dataset.away} @ ${selectedOption.dataset.home}`,
            awayTeam: selectedOption.dataset.away,
            homeTeam: selectedOption.dataset.home,
            pick: pickSelect.value,
            confidence: parseInt(confidenceInput?.value) || 75,
            amount: parseInt(amountInput?.value) || 0,
            spread: parseFloat(selectedOption.dataset.spread) || 0,
            sport: selectedOption.dataset.sport || 'NFL',
            betType: pickSelect.value.includes('Over') || pickSelect.value.includes('Under') ? 'total' : 
                     pickSelect.value.includes('ML') ? 'moneyline' : 'spread'
        };
    }

    async updateUserPredictionStats() {
        try {
            // Update local user object
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user && user.stats) {
                user.stats.predictions = (user.stats.predictions || 0) + 1;
                localStorage.setItem('user', JSON.stringify(user));
            }
        } catch (error) {
            console.error('Failed to update prediction stats:', error);
        }
    }

    setSubmitLoading(loading, isSpecialPost = false) {
        if (!this.postSubmit) return;
        
        this.postSubmit.disabled = loading;
        
        if (loading) {
            if (isSpecialPost) {
                this.postSubmit.textContent = '🤝 Creating...';
            } else {
                this.postSubmit.textContent = 'Posting...';
            }
        } else {
            this.postSubmit.textContent = 'Post';
        }
    }

    handleSuccessfulPost(post) {
        // Clear input
        if (this.postInput) {
            this.postInput.value = '';
        }
        
        // Clear media
        this.mediaFiles = [];
        document.querySelector('.media-preview')?.remove();
        
        // Remove any active creators
        document.querySelector('.challenge-creator')?.remove();
        document.querySelector('.prediction-creator')?.remove();
        document.querySelector('.location-badge')?.remove();
        
        // Reset selections
        this.selectedLocation = null;
        this.selectedGame = null;
        this.predictionGame = null;
        window.uploadedMedia = null;
        window.selectedLocation = null;
        window.selectedGame = null;
        
        if (window.challengeBet) {
            window.challengeBet.reset?.();
        }
        
        if (window.gamePicker) {
            window.gamePicker.selectedGame = null;
        }
        
        // Reset submit button
        if (this.postSubmit) {
            this.postSubmit.disabled = true;
            this.postSubmit.textContent = 'Post';
        }

        // Add to feed immediately for current user only
        const feedContainer = document.querySelector('#posts-container') || document.querySelector('.feed-posts');
        if (feedContainer) {
            // Check if post already exists to prevent duplicates
            const existingPost = feedContainer.querySelector(`[data-post-id="${post._id}"]`);
            if (!existingPost) {
                const postHTML = window.postTemplate.createPostHTML(post);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = postHTML;
                const postElement = tempDiv.firstElementChild;
                feedContainer.insertBefore(postElement, feedContainer.firstChild);
                console.log('✅ Post added to feed for posting user');
            }
        }
        
        console.log('✅ Post created successfully');
        
        // Show success animation
        this.showSuccessAnimation();
    }

    showSuccessAnimation() {
        this.showToast('Post created successfully!', 'success');
    }

    showToast(message, type = 'info') {
        // Remove any existing toast
        document.querySelector('.toast-notification')?.remove();
        
        const toast = this.createElement('div', {
            className: 'toast-notification'
        });
        
        const bgColors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: bgColors[type] || bgColors.info,
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            zIndex: '10000',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            animation: 'slideIn 0.3s ease',
            maxWidth: '400px'
        });
        
        const icon = this.createElement('i', {
            className: `fas ${icons[type] || icons.info}`
        });
        
        const text = this.createElement('span', {}, message);
        
        toast.appendChild(icon);
        toast.appendChild(text);
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Media upload handling
    async triggerImageUpload() {
        // Create hidden file input
        const fileInput = this.createElement('input', {
            type: 'file',
            accept: 'image/*,video/*',
            multiple: true
        });
        fileInput.style.display = 'none';
        
        fileInput.onchange = async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            
            // Validate file sizes
            const maxSize = 10 * 1024 * 1024; // 10MB
            for (let file of files) {
                if (file.size > maxSize) {
                    this.showToast(`File ${file.name} is too large. Maximum size is 10MB.`, 'error');
                    return;
                }
            }
            
            // Process files and convert to base64 for storage
            for (let file of files) {
                const base64 = await this.fileToBase64(file);
                file.base64 = base64;
            }
            
            // Add to media files
            this.mediaFiles = [...this.mediaFiles, ...files];
            
            // Show preview
            this.showMediaPreview();
            
            // Store globally for backwards compatibility
            window.uploadedMedia = this.mediaFiles;
            
            // Enable post button
            this.handleInput();
        };
        
        document.body.appendChild(fileInput);
        fileInput.click();
        
        // Clean up
        setTimeout(() => fileInput.remove(), 100);
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    showMediaPreview() {
        // Remove existing preview
        document.querySelector('.media-preview')?.remove();
        
        if (this.mediaFiles.length === 0) return;
        
        const preview = this.createElement('div', {
            className: 'media-preview'
        });
        
        Object.assign(preview.style, {
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1rem',
            flexWrap: 'wrap'
        });
        
        this.mediaFiles.forEach((file, index) => {
            const previewItem = this.createElement('div');
            
            Object.assign(previewItem.style, {
                position: 'relative',
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'var(--bg-tertiary)'
            });
            
            if (file.type.startsWith('image/')) {
                const img = this.createElement('img', {
                    src: file.base64 || URL.createObjectURL(file)
                });
                Object.assign(img.style, {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                });
                previewItem.appendChild(img);
            } else {
                const videoIcon = this.createElement('i', {
                    className: 'fas fa-video'
                });
                Object.assign(videoIcon.style, {
                    fontSize: '2rem',
                    color: 'var(--text-muted)',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                });
                previewItem.appendChild(videoIcon);
            }
            
            // Add remove button
            const removeBtn = this.createElement('button', {}, '×');
            Object.assign(removeBtn.style, {
                position: 'absolute',
                top: '4px',
                right: '4px',
                background: 'var(--danger)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                lineHeight: '1'
            });
            
            removeBtn.onclick = () => {
                this.mediaFiles.splice(index, 1);
                window.uploadedMedia = this.mediaFiles;
                this.showMediaPreview();
                this.handleInput();
            };
            
            previewItem.appendChild(removeBtn);
            preview.appendChild(previewItem);
        });
        
        const composerContent = document.querySelector('.composer-content');
        if (composerContent) {
            composerContent.appendChild(preview);
        }
    }

    toggleLocationPicker() {
        // Simple location input for now
        const location = prompt('Enter location (e.g., "MetLife Stadium" or "New York, NY"):');
        if (location) {
            this.selectedLocation = this.sanitizeHTML(location);
            window.selectedLocation = this.selectedLocation; // For backwards compatibility
            
            // Show location badge
            this.showLocationBadge(this.selectedLocation);
            
            // Enable post button
            this.handleInput();
        }
    }

    showLocationBadge(location) {
        // Remove existing badge
        document.querySelector('.location-badge')?.remove();
        
        const badge = this.createElement('div', {
            className: 'location-badge'
        });
        
        Object.assign(badge.style, {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--surface)',
            color: 'var(--primary)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            marginTop: '0.5rem',
            fontSize: '0.875rem'
        });
        
        const icon = this.createElement('i', { className: 'fas fa-map-marker-alt' });
        const text = this.createElement('span', {}, location);
        const removeBtn = this.createElement('button', {}, '×');
        
        Object.assign(removeBtn.style, {
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            marginLeft: '0.5rem'
        });
        
        // Add remove handler
        removeBtn.onclick = () => {
            this.selectedLocation = null;
            window.selectedLocation = null;
            badge.remove();
            this.handleInput();
        };
        
        badge.appendChild(icon);
        badge.appendChild(text);
        badge.appendChild(removeBtn);
        
        const composerContent = document.querySelector('.composer-content');
        if (composerContent) {
            composerContent.appendChild(badge);
        }
    }

    async togglePredictionMode() {
        // Always use game picker instead of manual mode
        if (window.gamePicker) {
            window.gamePicker.open('prediction');
            return;
        }
        
        // Fallback: Remove existing prediction creator if any
        document.querySelector('.prediction-creator')?.remove();
        
        // Get live games for prediction
        let games = [];
        try {
            const response = await fetch('/api/lines/games');
            const data = await response.json();
            if (data.success) {
                games = data.games || [];
            }
        } catch (error) {
            console.error('Failed to load games for prediction:', error);
        }
        
        const predictionCreator = this.createElement('div', {
            className: 'prediction-creator'
        });
        
        Object.assign(predictionCreator.style, {
            background: 'linear-gradient(135deg, var(--surface), var(--bg-secondary))',
            border: '1px solid var(--primary)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginTop: '1rem'
        });
        
        // Create header
        const header = this.createElement('div');
        Object.assign(header.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
        });
        
        const title = this.createElement('h4', {}, '🎯 Make a Prediction');
        title.style.margin = '0';
        
        const closeBtn = this.createElement('button', {}, '×');
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1.25rem'
        });
        closeBtn.onclick = () => {
            predictionCreator.remove();
            this.predictionGame = null;
            this.handleInput();
        };
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Create form container
        const formContainer = this.createElement('div');
        Object.assign(formContainer.style, {
            display: 'grid',
            gap: '1rem'
        });
        
        // Game selection
        const gameSelect = this.createElement('select', {
            id: 'predictionGame'
        });
        Object.assign(gameSelect.style, {
            padding: '0.75rem',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text)',
            fontSize: '0.95rem'
        });
        
        // Add default option
        const defaultOption = this.createElement('option', { value: '' }, 'Select a game...');
        gameSelect.appendChild(defaultOption);
        
        // Add game options
        games.forEach(game => {
            const gameTime = new Date(game.commence_time).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
            });
            
            const option = this.createElement('option', {
                value: game.id,
                'data-away': game.away_team,
                'data-home': game.home_team,
                'data-spread': game.sportsbooks?.[0]?.markets?.[0]?.outcomes?.[0]?.point || 0,
                'data-sport': game.sport_title
            }, `${game.away_team} @ ${game.home_team} (${gameTime})`);
            
            gameSelect.appendChild(option);
        });
        
        // Pick selection (will be populated when game is selected)
        const pickSelect = this.createElement('select', {
            id: 'predictionPick',
            disabled: true
        });
        Object.assign(pickSelect.style, {
            padding: '0.75rem',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text)',
            fontSize: '0.95rem'
        });
        
        const pickDefault = this.createElement('option', { value: '' }, 'Select game first...');
        pickSelect.appendChild(pickDefault);
        
        // Game select change handler
        gameSelect.onchange = () => {
            if (gameSelect.value) {
                const selectedOption = gameSelect.options[gameSelect.selectedIndex];
                this.predictionGame = {
                    id: gameSelect.value,
                    awayTeam: selectedOption.dataset.away,
                    homeTeam: selectedOption.dataset.home,
                    spread: parseFloat(selectedOption.dataset.spread) || 0
                };
                
                // Clear and populate pick options
                pickSelect.innerHTML = '';
                pickSelect.disabled = false;
                
                const pickOptions = [
                    { value: '', text: 'Select your pick...' },
                    { value: `${this.predictionGame.awayTeam} ${this.predictionGame.spread > 0 ? '+' : ''}${this.predictionGame.spread}`, text: `${this.predictionGame.awayTeam} ${this.predictionGame.spread > 0 ? '+' : ''}${this.predictionGame.spread}` },
                    { value: `${this.predictionGame.homeTeam} ${-this.predictionGame.spread > 0 ? '+' : ''}${-this.predictionGame.spread}`, text: `${this.predictionGame.homeTeam} ${-this.predictionGame.spread > 0 ? '+' : ''}${-this.predictionGame.spread}` },
                    { value: `Over`, text: 'Over Total' },
                    { value: `Under`, text: 'Under Total' },
                    { value: `${this.predictionGame.awayTeam} ML`, text: `${this.predictionGame.awayTeam} Moneyline` },
                    { value: `${this.predictionGame.homeTeam} ML`, text: `${this.predictionGame.homeTeam} Moneyline` }
                ];
                
                pickOptions.forEach(opt => {
                    const option = this.createElement('option', { value: opt.value }, opt.text);
                    pickSelect.appendChild(option);
                });
            } else {
                pickSelect.disabled = true;
                pickSelect.innerHTML = '';
                const pickDefault = this.createElement('option', { value: '' }, 'Select game first...');
                pickSelect.appendChild(pickDefault);
            }
            
            this.handleInput();
        };
        
        pickSelect.onchange = () => this.handleInput();
        
        // Confidence slider container
        const confidenceContainer = this.createElement('div');
        
        const confidenceLabel = this.createElement('label');
        Object.assign(confidenceLabel.style, {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            color: 'var(--text-muted)'
        });
        
        const confidenceText = this.createElement('span', {}, 'Confidence Level');
        const confidenceValue = this.createElement('span', { id: 'confidenceValue' }, '75%');
        confidenceValue.style.fontWeight = 'bold';
        confidenceValue.style.color = 'var(--primary)';
        
        confidenceLabel.appendChild(confidenceText);
        confidenceLabel.appendChild(confidenceValue);
        
        const confidenceSlider = this.createElement('input', {
            type: 'range',
            id: 'confidenceSlider',
            min: '50',
            max: '100',
            value: '75'
        });
        Object.assign(confidenceSlider.style, {
            width: '100%',
            height: '6px',
            background: 'var(--bg-tertiary)',
            borderRadius: '3px',
            outline: 'none',
            cursor: 'pointer'
        });
        
        confidenceSlider.oninput = () => {
            confidenceValue.textContent = `${confidenceSlider.value}%`;
            // Update color based on confidence
            if (confidenceSlider.value >= 90) {
                confidenceValue.style.color = 'var(--success)';
            } else if (confidenceSlider.value >= 75) {
                confidenceValue.style.color = 'var(--primary)';
            } else if (confidenceSlider.value >= 60) {
                confidenceValue.style.color = 'var(--warning)';
            } else {
                confidenceValue.style.color = 'var(--text-muted)';
            }
        };
        
        confidenceContainer.appendChild(confidenceLabel);
        confidenceContainer.appendChild(confidenceSlider);
        
        // Amount input
        const amountContainer = this.createElement('div');
        
        const amountLabel = this.createElement('label', {}, 'Bet Amount (optional)');
        Object.assign(amountLabel.style, {
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            color: 'var(--text-muted)'
        });
        
        const amountInput = this.createElement('input', {
            type: 'number',
            id: 'predictionAmount',
            placeholder: 'Enter amount in $',
            min: '0',
            step: '1'
        });
        Object.assign(amountInput.style, {
            width: '100%',
            padding: '0.75rem',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text)',
            fontSize: '0.95rem'
        });
        
        amountContainer.appendChild(amountLabel);
        amountContainer.appendChild(amountInput);
        
        // Stats preview
        const statsPreview = this.createElement('div');
        Object.assign(statsPreview.style, {
            marginTop: '0.5rem',
            padding: '0.75rem',
            background: 'var(--bg-tertiary)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        });
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userStats = user.stats || {};
        
        const statsText = this.createElement('span', {}, 
            `Your Record: ${userStats.wins || 0}-${userStats.losses || 0} (${userStats.accuracy || 0}%)`
        );
        const streakText = this.createElement('span', {}, 
            `Streak: ${userStats.streak > 0 ? `W${userStats.streak}` : userStats.streak < 0 ? `L${Math.abs(userStats.streak)}` : '0'}`
        );
        
        statsPreview.appendChild(statsText);
        statsPreview.appendChild(streakText);
        
        // Assemble the form
        formContainer.appendChild(gameSelect);
        formContainer.appendChild(pickSelect);
        formContainer.appendChild(confidenceContainer);
        formContainer.appendChild(amountContainer);
        formContainer.appendChild(statsPreview);
        
        predictionCreator.appendChild(header);
        predictionCreator.appendChild(formContainer);
        
        const composerContent = document.querySelector('.composer-content');
        if (composerContent) {
            composerContent.appendChild(predictionCreator);
        }
        
        this.handleInput();
    }
}

// Create global instance
window.postCreator = new PostCreator();

// Global function wrappers for onclick handlers
window.triggerImageUpload = function() {
    window.postCreator?.triggerImageUpload();
};

window.toggleLocationPicker = function() {
    window.postCreator?.toggleLocationPicker();
};

window.togglePredictionMode = function() {
    // Always open game picker for predictions
    if (window.gamePicker) {
        window.gamePicker.open('prediction');
    } else {
        console.error('Game picker not loaded');
    }
};

window.toggleGamePicker = function() {
    window.gamePicker?.open();
};

window.toggleChallengeMode = function() {
    window.challengeBet?.toggleChallengeMode();
};

// Add CSS animations if not already present
if (!document.querySelector('#post-creator-styles')) {
    const style = document.createElement('style');
    style.id = 'post-creator-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes slideDown {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 18px;
            height: 18px;
            background: var(--primary);
            cursor: pointer;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            background: var(--primary);
            cursor: pointer;
            border-radius: 50%;
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
    `;
    document.head.appendChild(style);
}