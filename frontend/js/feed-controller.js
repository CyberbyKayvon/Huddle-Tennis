// Feed Controller - Orchestrates all feed components
class FeedController {
    constructor() {
        this.components = {};
        this.initialized = false;
        this.posts = [];
        this.currentTab = 'for-you';
        this.currentPage = 1;
        this.isLoadingMore = false;
        this.hasMorePosts = true;
        this.postsPerPage = 20;
    }

    // Initialize the feed
    async init() {
        console.log('🚀 Initializing Feed Controller...');
        
        try {
            // Check for required components
            this.checkComponents();
            
            // Initialize services
        this.initializeServices();
        
        // Load follow service early
        if (window.followService && !window.followService.isLoaded) {
            await window.followService.loadFollowing();
        }
        
        // Listen for real-time new posts from OTHER users
        window.addEventListener('realtimeNewPost', (event) => {
            console.log('📡 Received real-time new post:', event.detail);
            const { post } = event.detail;
            const feedContainer = document.getElementById('posts-container') || document.querySelector('.feed-posts');
            if (feedContainer && post) {
                // Check if post already exists
                const existingPost = feedContainer.querySelector(`[data-post-id="${post._id}"]`);
                if (!existingPost) {
                    const postHTML = window.postTemplate.createPostHTML(post);
                    feedContainer.insertAdjacentHTML('afterbegin', postHTML);
                    console.log('✅ Added real-time post from another user');
                }
            }
        });
        
        // Listen for real-time bet updates
        // Set up Socket.IO listener with a small delay to ensure socket is connected
        setTimeout(() => {
            if (window.socket) {
                // Remove any existing listeners first
                window.socket.off('bet_updated');
                
                // Add new listener
                window.socket.on('bet_updated', (data) => {
                    console.log('📡 Received real-time bet update:', data);
                    this.handleRealtimeBetUpdate(data);
                });
                
                console.log('✅ Socket.IO bet update listener attached');
            } else {
                console.warn('⚠️ Socket.IO not initialized');
            }
        }, 1000);
        
        // Initialize UI components
        this.initializeComponents();
            
            // Auto-login if needed
            await this.ensureAuthentication();
            
            // Load initial data
            await this.loadInitialData();
            
            // Attach event listeners
            this.attachEventListeners();
            
            // Initialize modals
            this.initializeModals();
            
            // Setup navigation
            this.setupNavigation();
            
            // Setup tab switching
            this.setupTabSwitching();
            
            // Start real-time updates
            this.startRealTimeUpdates();
            
            this.initialized = true;
            console.log('✅ Feed Controller initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Feed Controller:', error);
        }
    }

    // Check that all required components are loaded
    checkComponents() {
        const required = [
            'apiService',
            'authService',
            'themeManager',
            'liveLinesService',
            'postTemplate',
            'sidebarTemplates',
            'modalTemplates',
            'postCreator',
            'challengeBet',
            'gamePicker',
            'postInteractions',
            'betAcceptance',
            'commentSystem',
            'TimeHelpers',
            'DOMHelpers'
        ];

        const missing = [];
        required.forEach(component => {
            if (!window[component]) {
                missing.push(component);
                console.warn(`⚠️ Missing component: ${component}`);
            } else {
                this.components[component] = window[component];
                console.log(`✅ Component loaded: ${component}`);
            }
        });

        if (missing.length > 0) {
            throw new Error(`Missing required components: ${missing.join(', ')}`);
        }
    }

    // Initialize services
    initializeServices() {
        // Update API service with current token
        if (this.components.authService.isAuthenticated()) {
            // The old api-service doesn't have setToken, skip this
// this.components.apiService.setToken(this.components.authService.token);
        }
        
        // Initialize theme
        this.components.themeManager.init();
        
        // Initialize follow service if user is authenticated
        if (window.followService && this.components.authService.isAuthenticated()) {
            console.log('Initializing follow service...');
            window.followService.loadFollowing().then(() => {
                console.log('Follow service initialized');
                window.followService.updateAllButtons();
            });
        }
    }

    // Initialize UI components
    initializeComponents() {
        // Initialize modals
        this.components.modalTemplates.init();
        
        // Update sidebar with user info
        this.updateUserInfo();
        
        // Initialize create post area
        this.initializeCreatePostArea();
        
        // Initialize mobile navigation
        this.initializeMobileNav();
    }

    // Ensure user is authenticated
    async ensureAuthentication() {
        if (!this.components.authService.isAuthenticated()) {
            console.log('🔐 User not authenticated');
            
            // Show login prompt in create post area
            const createPostArea = document.querySelector('.create-post-area');
            if (createPostArea) {
                createPostArea.innerHTML = `
                    <div style="background: var(--surface); padding: 2rem; border-radius: 12px; text-align: center;">
                        <h3 style="margin-bottom: 1rem;">Join Huddle to share your picks!</h3>
                        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Login or create an account to post, bet, and track your predictions</p>
                        <div style="display: flex; gap: 1rem; justify-content: center;">
                            <button onclick="window.location.href='/login'" style="padding: 0.75rem 2rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                                Login
                            </button>
                            <button onclick="window.location.href='/signup'" style="padding: 0.75rem 2rem; background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; font-weight: bold;">
                                Sign Up
                            </button>
                        </div>
                    </div>
                `;
            }
            
            // Disable post interactions
            document.querySelectorAll('.interaction-btn').forEach(btn => {
                const originalOnClick = btn.onclick;
                btn.onclick = () => {
                    alert('Please login to interact with posts');
                    return false;
                };
                btn.style.cursor = 'not-allowed';
                btn.style.opacity = '0.6';
            });
            
            // Hide create post button in sidebar
            const createPostBtn = document.querySelector('.create-post-btn');
            if (createPostBtn) {
                createPostBtn.style.display = 'none';
            }
        }
    }

    // Load initial data
    async loadInitialData() {
        // Load feed posts
        await this.loadFeedPosts('for-you');
        
        // Load live games
        await this.loadLiveGames();
        
        // Load trending
        this.loadTrending();
        
        // Load follow suggestions
        this.loadFollowSuggestions();
    }

    // Update all user info in UI
    updateUserInfo() {
        // Try multiple sources for user data
        let user = this.components.authService.getCurrentUser();
        
        // If authService doesn't have user, try localStorage
        if (!user) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    user = JSON.parse(storedUser);
                    
                    // Clear all league picks from localStorage that don't belong to current user
                    if (user && user._id) {
                        const userId = user._id || user.id;
                        for (let i = localStorage.length - 1; i >= 0; i--) {
                            const key = localStorage.key(i);
                            if (key && key.includes('league_picks_') && !key.includes(userId)) {
                                localStorage.removeItem(key);
                            }
                        }
                        console.log('Cleared picks from other users');
                    }
                } catch (e) {
                    console.error('Error parsing stored user:', e);
                }
            }
        }
        
        if (!user) {
            // Show login prompt
            const userNameEl = document.getElementById('sidebarUserName');
            if (userNameEl) {
                userNameEl.innerHTML = 'Guest User';
            }
            const userHandleEl = document.getElementById('sidebarUserHandle');
            if (userHandleEl) {
                userHandleEl.textContent = '@guest';
            }
            return;
        }
        
        console.log('Updating UI with user:', user.username);
        
        // Update sidebar user info
        const userNameEl = document.getElementById('sidebarUserName');
        const userHandleEl = document.getElementById('sidebarUserHandle');
        const userAvatarEl = document.getElementById('sidebarUserAvatar');
        const createPostAvatar = document.getElementById('createPostAvatar');
        const commentUserAvatar = document.getElementById('commentUserAvatar');
        
        if (userNameEl) {
            userNameEl.innerHTML = `
                ${user.displayName || user.username}
                ${user.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
            `;
        }
        if (userHandleEl) {
            userHandleEl.textContent = `@${user.username}`;
        }
        
        const avatarInitial = (user.displayName || user.username).charAt(0).toUpperCase();
        
        // Update sidebar avatar
        if (userAvatarEl) {
            if (user.avatar) {
                userAvatarEl.innerHTML = `<img src="${user.avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                userAvatarEl.textContent = avatarInitial;
            }
        }
        
        // Update create post avatar
        if (createPostAvatar) {
            console.log('Updating create post avatar, user has avatar:', !!user.avatar);
            if (user.avatar) {
                createPostAvatar.innerHTML = `<img src="${user.avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                console.log('Set avatar image in create post area');
            } else {
                createPostAvatar.textContent = avatarInitial;
                console.log('Set avatar initial in create post area:', avatarInitial);
            }
        }
        
        // Update comment avatar
        if (commentUserAvatar) {
            if (user.avatar) {
                commentUserAvatar.innerHTML = `<img src="${user.avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                commentUserAvatar.textContent = avatarInitial;
            }
        }
        
        // Update stats - but fetch fresh data for followers count
        this.updateUserStats(user.stats || {});
        this.fetchAndUpdateFollowerCount(user._id);
        
        // Update coins display
        const coinsAmount = document.getElementById('coinsAmount');
        if (coinsAmount) {
            coinsAmount.textContent = user.degenCoins || user.coinWallet?.degenCoins || 0;
        }
        
        // Update loyalty level if shown
        const loyaltyBadge = document.getElementById('loyaltyLevel');
        if (loyaltyBadge && user.loyalty) {
            loyaltyBadge.textContent = user.loyalty.level;
            loyaltyBadge.className = `loyalty-badge ${user.loyalty.level.toLowerCase()}`;
        }
    }

    // Update user stats in sidebar
    updateUserStats(stats) {
        // Update Picks/Posts count
        const picksElement = document.querySelector('.stat-item:nth-child(1) .stat-value');
        if (picksElement) {
            // Use 'posts' if picks is not available
            const postsCount = stats.picks || stats.posts || 0;
            picksElement.textContent = this.formatNumber(postsCount);
            
            // Update the label too if needed
            const picksLabel = document.querySelector('.stat-item:nth-child(1) .stat-label');
            if (picksLabel && stats.posts !== undefined) {
                picksLabel.textContent = 'Posts';
            }
        }
        
        // Update Accuracy
        const accuracyElement = document.querySelector('.stat-item:nth-child(2) .stat-value');
        if (accuracyElement) {
            accuracyElement.textContent = `${stats.accuracy || 0}%`;
        }
        
        // Update Followers count (3rd stat should be Followers)
        const followersElement = document.querySelector('.stat-item:nth-child(3) .stat-value');
        if (followersElement) {
            followersElement.textContent = this.formatNumber(stats.followers || 0);
        }
        
        // Keep the label as "Followers"
        const followersLabel = document.querySelector('.stat-item:nth-child(3) .stat-label');
        if (followersLabel) {
            followersLabel.textContent = 'Followers';
        }
        
        // Update Following count (if there's a 4th stat)
        const followingElement = document.querySelector('.stat-item:nth-child(4) .stat-value');
        if (followingElement) {
            const user = this.components.authService.getCurrentUser();
            const followingCount = user?.stats?.following || user?.following?.length || 0;
            followingElement.textContent = this.formatNumber(followingCount);
            
            // Make sure label says "Following"
            const followingLabelEl = document.querySelector('.stat-item:nth-child(4) .stat-label');
            if (followingLabelEl) {
                followingLabelEl.textContent = 'Following';
            }
        }
        
        console.log('Updated stats:', stats);
    }

    // Fetch and update follower count
    async fetchAndUpdateFollowerCount(userId) {
        try {
            const response = await fetch(`/api/users/${userId}/followers`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const followerCount = data.followers?.length || 0;
                
                // Update the third stat to show followers
                const followersElement = document.querySelector('.stat-item:nth-child(3) .stat-value');
                if (followersElement) {
                    followersElement.textContent = this.formatNumber(followerCount);
                }
                
                const followersLabel = document.querySelector('.stat-item:nth-child(3) .stat-label');
                if (followersLabel) {
                    followersLabel.textContent = 'Followers';
                }
            }
        } catch (error) {
            console.error('Error fetching follower count:', error);
        }
    }

    // Initialize create post area
    initializeCreatePostArea() {
        const user = this.components.authService.getCurrentUser();
        if (user) {
            const avatar = (user.displayName || user.username).charAt(0).toUpperCase();
            const createPostAvatar = document.getElementById('createPostAvatar');
            if (createPostAvatar) {
                createPostAvatar.textContent = avatar;
            }
        }
    }
    
    // Initialize mobile navigation
    initializeMobileNav() {
        // Check if we need to add mobile nav elements
        if (window.innerWidth <= 768) {
            this.setupMobileNavigation();
        }
        
        // Handle resize events
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth <= 768) {
                    this.setupMobileNavigation();
                } else {
                    this.removeMobileNavigation();
                }
            }, 250);
        });
    }
    
    setupMobileNavigation() {
        // Disabled - using HTML script instead
        return;
        
        // Create overlay that will close sidebar when clicked
        const overlay = document.createElement('div');
        overlay.id = 'mobileNavOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 998;
            display: none;
        `;
        document.body.appendChild(overlay);
        
        // Create hamburger menu button
        const menuBtn = document.createElement('button');
        menuBtn.id = 'mobileMenuBtn';
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        menuBtn.style.cssText = `
            position: fixed;
            top: 15px;
            left: 15px;
            z-index: 1001;
            background: #00ff88;
            color: black;
            border: none;
            border-radius: 50%;
            width: 45px;
            height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(menuBtn);
        
        const sidebar = document.querySelector('.sidebar-left');
        
        // Menu button opens sidebar
        menuBtn.onclick = () => {
            sidebar.style.display = 'block';
            sidebar.style.transform = 'translateX(0)';
            overlay.style.display = 'block';
            menuBtn.style.display = 'none';
            document.body.style.overflow = 'hidden';
        };
        
        // Clicking ANYWHERE on overlay closes sidebar
        overlay.onclick = () => {
            sidebar.style.transform = 'translateX(-100%)';
            overlay.style.display = 'none';
            menuBtn.style.display = 'flex';
            document.body.style.overflow = '';
            setTimeout(() => {
                sidebar.style.display = 'none';
            }, 300);
        };
        
        // Click any nav item also closes sidebar
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.style.transform = 'translateX(-100%)';
                    overlay.style.display = 'none';
                    menuBtn.style.display = 'flex';
                    document.body.style.overflow = '';
                    setTimeout(() => {
                        sidebar.style.display = 'none';
                    }, 300);
                }
            });
        });
        
        // Set initial sidebar state
        if (sidebar) {
            sidebar.style.position = 'fixed';
            sidebar.style.top = '0';
            sidebar.style.left = '0';
            sidebar.style.height = '100vh';
            sidebar.style.zIndex = '999';
            sidebar.style.transform = 'translateX(-100%)';
            sidebar.style.transition = 'transform 0.3s ease';
            sidebar.style.display = 'none';
        }
        
        // Add bottom navigation for mobile
        if (!document.getElementById('mobileBottomNav')) {
            const bottomNav = document.createElement('div');
            bottomNav.id = 'mobileBottomNav';
            bottomNav.className = 'mobile-bottom-nav';
            bottomNav.innerHTML = `
                <button class="active" onclick="feedController.navigateToHome()">
                    <i class="fas fa-home"></i>
                    <span>Home</span>
                </button>
                <button onclick="feedController.navigateToExplore()">
                    <i class="fas fa-search"></i>
                    <span>Explore</span>
                </button>
                <button onclick="feedController.openCreatePost()">
                    <i class="fas fa-plus-circle"></i>
                    <span>Post</span>
                </button>
                <button onclick="feedController.navigateToNotifications()">
                    <i class="fas fa-bell"></i>
                    <span>Alerts</span>
                </button>
                <button onclick="feedController.navigateToProfile()">
                    <i class="fas fa-user"></i>
                    <span>Profile</span>
                </button>
            `;
            document.body.appendChild(bottomNav);
        }
    }
    
    removeMobileNavigation() {
        const overlay = document.getElementById('mobileNavOverlay');
        if (overlay) overlay.remove();
        
        const menuBtn = document.getElementById('mobileMenuBtn');
        if (menuBtn) menuBtn.remove();
        
        const sidebar = document.querySelector('.sidebar-left');
        if (sidebar) {
            sidebar.style.transform = '';
            sidebar.style.position = '';
            sidebar.style.zIndex = '';
            const closeBtn = sidebar.querySelector('.mobile-close-btn');
            if (closeBtn) closeBtn.remove();
        }
    }
    
    toggleMobileSidebar() {
        // Not used - handled inline in setupMobileNavigation
    }
    
    closeMobileSidebar() {
        // Simple close function for mobile nav methods
        const sidebar = document.querySelector('.sidebar-left');
        const overlay = document.getElementById('mobileNavOverlay');
        const menuBtn = document.getElementById('mobileMenuBtn');
        
        if (sidebar) {
            sidebar.style.transform = 'translateX(-100%)';
            sidebar.style.display = 'none';
        }
        if (overlay) {
            overlay.style.display = 'none';
        }
        if (menuBtn) {
            menuBtn.style.display = 'flex';
        }
        document.body.style.overflow = '';
    }
    
    addSwipeGestures() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        const handleSwipe = () => {
            if (touchEndX < touchStartX - 50) {
                // Swipe left - close sidebar
                this.closeMobileSidebar();
            }
            if (touchEndX > touchStartX + 50 && touchStartX < 50) {
                // Swipe right from edge - open sidebar
                this.toggleMobileSidebar();
            }
        };
        
        document.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        document.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    }

    // Load feed posts
    async loadFeedPosts(type = 'for-you') {
        // CRITICAL: Don't load feed if we're in a component view
        if (window.currentComponent === 'groups' || window.preventFeedReload) {
            console.log('Feed reload prevented - in component view');
            return;
        }
        
        console.log(`📰 Loading ${type} feed...`);
        const feedContainer = document.querySelector('.feed-posts');
        if (!feedContainer) return;

        // IMPORTANT: Mark that we're loading to prevent duplicates
        window.isLoadingFeed = true;

        try {
            // Show loading state
            feedContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
                    <p style="margin-top: 1rem; color: var(--text-muted);">Loading posts...</p>
                </div>
            `;

            // CRITICAL: Wait for follow service to be fully loaded
            if (window.followService) {
                console.log('⏳ Ensuring follow service is loaded...');
                await window.followService.loadFollowing();
                console.log('✅ Follow service ready');
            }
            
            // Reset pagination if loading new tab
            if (this.currentTab !== type) {
                this.currentPage = 1;
                this.hasMorePosts = true;
                this.posts = [];
            }
            this.currentTab = type;
            
            // Fetch posts from database with pagination
            const response = await fetch(`/api/posts/feed?type=${type}&page=${this.currentPage}&limit=${this.postsPerPage}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            let posts = [];
            if (response.ok) {
                const data = await response.json();
                posts = data.posts || [];
                console.log('✅ Loaded', posts.length, 'posts from database');
            }

            // Clear container
            feedContainer.innerHTML = '';

            if (posts.length === 0) {
                // Show empty state
                feedContainer.innerHTML = `
                    <div style="text-align: center; padding: 3rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
                        <h3 style="margin-bottom: 0.5rem;">No posts yet</h3>
                        <p style="color: var(--text-muted);">Be the first to share something!</p>
                    </div>
                `;
            } else {
                // Render posts
                posts.forEach(post => {
                    // Check if post doesn't already exist
                    const existingPost = document.querySelector(`[data-post-id="${post._id}"]`);
                    if (!existingPost) {
                        const postHTML = this.components.postTemplate.createPostHTML(post);
                        feedContainer.insertAdjacentHTML('beforeend', postHTML);
                    }
                });
            }

            console.log(`✅ Rendered ${posts.length} posts`);
        } catch (error) {
            console.error('❌ Error loading feed:', error);
            feedContainer.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Unable to load posts. Please try again.</p>
                    <button onclick="feedController.loadFeedPosts('${type}')" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Load more posts for infinite scroll
    async loadMorePosts() {
        if (this.isLoadingMore || !this.hasMorePosts) return;
        
        this.isLoadingMore = true;
        this.currentPage++;
        
        const feedContainer = document.querySelector('.feed-posts');
        
        // Add loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-more';
        loadingDiv.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: var(--primary);"></i>
            </div>
        `;
        feedContainer.appendChild(loadingDiv);
        
        try {
            const response = await fetch(`/api/posts/feed?type=${this.currentTab}&page=${this.currentPage}&limit=${this.postsPerPage}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const data = await response.json();
            const newPosts = data.posts || [];
            
            // Remove loading indicator
            const loader = document.getElementById('loading-more');
            if (loader) loader.remove();
            
            if (newPosts.length === 0) {
                this.hasMorePosts = false;
                // Only show "no more posts" if we don't already have it
                if (!document.querySelector('.no-more-posts')) {
                    feedContainer.insertAdjacentHTML('beforeend', `
                        <div class="no-more-posts" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                            <p>No more posts to load</p>
                        </div>
                    `);
                }
            } else {
                // Render new posts
                newPosts.forEach(post => {
                    const existingPost = document.querySelector(`[data-post-id="${post._id}"]`);
                    if (!existingPost) {
                        const postHTML = this.components.postTemplate.createPostHTML(post);
                        feedContainer.insertAdjacentHTML('beforeend', postHTML);
                    }
                });
                
                if (newPosts.length < this.postsPerPage) {
                    this.hasMorePosts = false;
                }
            }
        } catch (error) {
            console.error('Error loading more posts:', error);
            const loader = document.getElementById('loading-more');
            if (loader) loader.remove();
        } finally {
            this.isLoadingMore = false;
        }
    }

    // Get demo posts
    getDemoPosts() {
        const currentUser = this.components.authService.getCurrentUser();
        return [
            {
                _id: 'post-1',
                author: {
                    username: 'SharpShooter88',
                    displayName: 'Mike Thompson',
                    avatar: null,
                    verified: true
                },
                content: "Vikings -7 is a LOCK tonight! 🔥 They're 8-2 at home this season and Chicago can't move the ball in cold weather. Hammer this line before it moves!",
                type: 'prediction',
                prediction: {
                    game: 'MIN vs CHI',
                    pick: 'Vikings -7',
                    confidence: 95,
                    amount: 500
                },
                likes: Array(234).fill(null),
                dislikes: Array(12).fill(null),
                comments: Array(45).fill(null),
                shares: Array(12).fill(null),
                createdAt: new Date(Date.now() - 3600000),
                isLiked: false
            },
            {
                _id: 'post-2',
                author: {
                    username: 'BettyBets',
                    displayName: 'Betty Rodriguez',
                    avatar: null,
                    verified: false
                },
                content: "Who wants to bet on the Lakers game tonight? I got them +5.5 🏀",
                type: 'challenge',
                challengeBet: {
                    amount: 50,
                    maxOpponents: 3,
                    currentOpponents: 1,
                    opponents: ['JohnDoe'],
                    betType: 'spread',
                    side: 'Lakers +5.5',
                    game: {
                        id: 'lal-bos',
                        awayTeam: 'Lakers',
                        homeTeam: 'Celtics',
                        startTime: new Date(Date.now() + 7200000)
                    },
                    status: 'open'
                },
                likes: Array(89).fill(null),
                dislikes: Array(5).fill(null),
                comments: Array(23).fill(null),
                shares: Array(5).fill(null),
                createdAt: new Date(Date.now() - 7200000),
                isLiked: true
            },
            {
                _id: 'post-3',
                author: {
                    username: 'sarahk',
                    displayName: 'Sarah Kim',
                    verified: false
                },
                content: 'Can we talk about how the refs have been this season? That call in the Chiefs game was absolutely brutal. The league needs to address this officiating problem ASAP. 🤔',
                type: 'post',
                likes: Array(567).fill(null),
                dislikes: Array(15).fill(null),
                comments: Array(128).fill(null),
                shares: Array(34).fill(null),
                createdAt: new Date(Date.now() - 900000)
            }
        ];
    }

    // Create demo bet post
    createDemoBetPost() {
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
                        <button class="accept-btn" onclick="betAcceptance.acceptBet('demo-bet-1')">
                            🤝 Accept Bet (<span class="accept-count">0</span>/3 spots)
                        </button>
                        <button class="cancel-btn" onclick="betAcceptance.cancelBet('demo-bet-1')" style="display: none;">
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
                        <button class="interaction-btn" onclick="commentSystem.open('demo-bet')">
                            <i class="fas fa-bullhorn"></i>
                            <span>8</span>
                        </button>
                        <button class="interaction-btn" onclick="postInteractions.handleShare(this)">
                            <i class="fas fa-share"></i>
                            <span>3</span>
                        </button>
                    </div>
                    <button class="interaction-btn" onclick="postInteractions.handleBookmark(this)">
                        <i class="far fa-flag"></i>
                    </button>
                </div>
            </article>
        `;
    }

    // Load live games
    async loadLiveGames() {
        try {
            const scores = await this.components.liveLinesService.getLiveScores();
            this.updateLiveGamesWidget(scores);
        } catch (error) {
            console.log('Using demo live games data');
            // Use demo data instead of failing
            const demoScores = this.components.liveLinesService.getDemoScores();
            this.updateLiveGamesWidget(demoScores);
        }
    }

    // Update live games widget
    updateLiveGamesWidget(scores) {
        const liveGamesWidget = document.querySelector('.live-games-widget');
        if (!liveGamesWidget) return;

        const gamesHTML = scores.map(game => `
            <div class="live-game">
                <div>
                    <div class="live-indicator">
                        <div class="live-dot"></div>
                        LIVE
                    </div>
                    <div class="game-score">
                        <span class="${game.homeScore > game.awayScore ? 'winning-team' : ''}">${game.homeTeam} ${game.homeScore}</span> - 
                        <span class="${game.awayScore > game.homeScore ? 'winning-team' : ''}">${game.awayTeam} ${game.awayScore}</span>
                    </div>
                    <div class="game-time">${game.period}</div>
                </div>
            </div>
        `).join('');

        const widgetContent = liveGamesWidget.querySelector('.live-games-content');
        if (widgetContent) {
            widgetContent.innerHTML = gamesHTML || '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">No live games</div>';
        }
    }

    // Load trending topics
    loadTrending() {
        // Trending is static in HTML for now
        console.log('Trending topics loaded from HTML');
    }

    // Load follow suggestions
async loadFollowSuggestions() {
    try {
        const response = await fetch('/api/users/suggestions?limit=3', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (window.renderSuggestions) {
                window.renderSuggestions(data.suggestions || []);
            }
        }
        
        // Update button states after loading
        if (window.followService && window.followService.isLoaded) {
            setTimeout(() => {
                window.followService.updateAllButtons();
            }, 100);
        }
        
        console.log('Follow suggestions loaded');
    } catch (error) {
        console.error('Error loading follow suggestions:', error);
        // Show error state
        const container = document.getElementById('follow-suggestions-container');
        if (container) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">Unable to load suggestions</div>';
        }
    }
}

    // Setup tab switching
    setupTabSwitching() {
        const tabs = document.querySelectorAll('.feed-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', async (e) => {
                // Remove active from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                // Add active to clicked tab
                e.target.classList.add('active');
                
                // Load appropriate content
                const tabText = e.target.textContent.toLowerCase();
                
                if (tabText.includes('for you')) {
                    await this.loadFeedPosts('for-you');
                } else if (tabText.includes('following')) {
                    await this.loadFollowingFeed();
                } else if (tabText.includes('live')) {
                    await this.showLiveGames();
                } else if (tabText.includes('trending')) {
                    await this.showTrending();
                } else if (tabText.includes('profile')) {
                    // Handle profile tab
                    if (!window.profileComponent) {
                        // Lazy load profile component if not loaded
                        const script = document.createElement('script');
                        script.src = '/js/components/profile-component.js';
                        script.onload = () => {
                            window.profileComponent.loadProfile();
                        };
                        document.head.appendChild(script);
                    } else {
                        window.profileComponent.loadProfile();
                    }
                }
            });
        });
    }

    // Setup navigation
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active from all
                document.querySelectorAll('.nav-item').forEach(nav => {
                    nav.classList.remove('active');
                });
                
                // Add active to clicked
                item.classList.add('active');
                
                // Handle navigation
                const text = item.querySelector('span').textContent.toLowerCase();
                
                if (text === 'home') {
                    this.loadFeedPosts('for-you');
                } else if (text === 'explore') {
                    this.loadExplorePage();
                } else if (text === 'notifications') {
                    this.loadNotificationsPage();
                } else if (text === 'messages') {
                    this.loadMessagesPage();
                } else if (text === 'bookmarks') {
                    this.loadBookmarksPage();
                } else if (text === 'groups') {
                    // Don't navigate away, load the component
                    return;
                } else if (text === 'analytics') {
                    this.loadAnalyticsPage();
                } else if (text === 'profile') {
    // Load profile component directly
    if (window.profileComponent && typeof window.profileComponent.loadProfile === 'function') {
        window.profileComponent.loadProfile();
    }
}
            });
        });
    }

    // Load following feed
    async loadFollowingFeed() {
        const feedContainer = document.querySelector('.feed-posts');
        
        if (!this.components.authService.isAuthenticated()) {
            feedContainer.innerHTML = `
                <div style="padding: 3rem; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
                    <h3 style="margin-bottom: 1rem;">Login to see your Following feed</h3>
                    <p style="color: var(--text-muted);">Follow users to see their posts here</p>
                    <button onclick="window.location.href='/login'" style="margin-top: 1rem; padding: 0.75rem 2rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Login
                    </button>
                </div>
            `;
            return;
        }
        
        // Show loading
        feedContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
                <p style="margin-top: 1rem; color: var(--text-muted);">Loading posts from people you follow...</p>
            </div>
        `;
        
        try {
            // Load posts from following
            const response = await fetch('/api/posts/feed?type=following', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const data = await response.json();
            
            if (data.posts && data.posts.length > 0) {
                feedContainer.innerHTML = '';
                data.posts.forEach(post => {
                    const postHTML = this.components.postTemplate.createPostHTML(post);
                    feedContainer.insertAdjacentHTML('beforeend', postHTML);
                });
            } else {
                feedContainer.innerHTML = `
                    <div style="padding: 3rem; text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                        <h3 style="margin-bottom: 1rem;">No posts yet</h3>
                        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Follow some users to see their posts here!</p>
                        <button onclick="document.querySelector('.feed-tab:first-child').click()" style="padding: 0.75rem 2rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Discover Users
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading following feed:', error);
            feedContainer.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Unable to load following feed</p>
                    <button onclick="feedController.loadFollowingFeed()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Show live games
    async showLiveGames() {
        const feedContainer = document.querySelector('.feed-posts');
        const scores = await this.components.liveLinesService.getLiveScores();
        
        feedContainer.innerHTML = `
            <div style="padding: 2rem;">
                <h2 style="margin-bottom: 1.5rem;">🔴 Live Games</h2>
                <div class="live-games-grid" style="display: grid; gap: 1rem;">
                    ${scores.map(game => `
                        <div class="game-card" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--danger);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="color: var(--danger); font-weight: bold; margin-bottom: 0.5rem;">🔴 LIVE - ${game.period}</div>
                                    <div style="font-size: 1.25rem; font-weight: bold;">${game.homeTeam} ${game.homeScore} - ${game.awayTeam} ${game.awayScore}</div>
                                    <div style="color: var(--text-muted); margin-top: 0.5rem;">Time: ${game.timeRemaining}</div>
                                </div>
                                <button style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
                                    View Bets
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Show trending
    async showTrending() {
        const feedContainer = document.querySelector('.feed-posts');
        feedContainer.innerHTML = `
            <div style="padding: 2rem;">
                <h2 style="margin-bottom: 1.5rem;">🔥 Trending Now</h2>
                <div class="trending-list" style="display: grid; gap: 1rem;">
                    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 12px;">
                        <div style="color: var(--primary); font-size: 0.875rem; margin-bottom: 0.25rem;">NFL • Trending</div>
                        <div style="font-weight: bold; font-size: 1.1rem;">#ThursdayNightFootball</div>
                        <div style="color: var(--text-muted); font-size: 0.875rem;">12.4K posts</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 12px;">
                        <div style="color: var(--primary); font-size: 0.875rem; margin-bottom: 0.25rem;">Betting • Hot</div>
                        <div style="font-weight: bold; font-size: 1.1rem;">Vikings -7</div>
                        <div style="color: var(--text-muted); font-size: 0.875rem;">3.2K predictions</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 12px;">
                        <div style="color: var(--primary); font-size: 0.875rem; margin-bottom: 0.25rem;">NBA • Breaking</div>
                        <div style="font-weight: bold; font-size: 1.1rem;">LeBron James</div>
                        <div style="color: var(--text-muted); font-size: 0.875rem;">8.7K posts</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Load explore page
    loadExplorePage() {
        const feedContainer = document.querySelector('.feed-posts');
        feedContainer.innerHTML = `
            <div style="padding: 2rem;">
                <h2 style="margin-bottom: 1.5rem;">🔍 Explore</h2>
                <div style="display: grid; gap: 1rem;">
                    <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px;">
                        <h3>🏈 NFL Picks</h3>
                        <p style="color: var(--text-muted); margin-top: 0.5rem;">Discover top NFL predictions from expert handicappers</p>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px;">
                        <h3>🏀 NBA Tonight</h3>
                        <p style="color: var(--text-muted); margin-top: 0.5rem;">Hot picks for tonight's NBA games</p>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px;">
                        <h3>⚾ MLB Season</h3>
                        <p style="color: var(--text-muted); margin-top: 0.5rem;">Baseball betting trends and analysis</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Load notifications page
    loadNotificationsPage() {
        const feedContainer = document.querySelector('.feed-posts');
        feedContainer.innerHTML = `
            <div style="padding: 2rem;">
                <h2 style="margin-bottom: 1.5rem;">🔔 Notifications</h2>
                <div style="display: grid; gap: 0.5rem;">
                    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
                        <div style="font-weight: bold;">SharpShooter88 liked your post</div>
                        <div style="color: var(--text-muted); font-size: 0.875rem;">2 minutes ago</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
                        <div style="font-weight: bold;">You have a new follower</div>
                        <div style="color: var(--text-muted); font-size: 0.875rem;">1 hour ago</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
                        <div style="font-weight: bold;">Your bet was accepted</div>
                        <div style="color: var(--text-muted); font-size: 0.875rem;">3 hours ago</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Load messages page
    loadMessagesPage() {
        const feedContainer = document.querySelector('.feed-posts');
        feedContainer.innerHTML = `
            <div style="padding: 2rem;">
                <h2 style="margin-bottom: 1.5rem;">✉️ Messages</h2>
                <div style="text-align: center; padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📬</div>
                    <p style="color: var(--text-muted);">No messages yet</p>
                    <p style="color: var(--text-muted); font-size: 0.875rem;">When someone messages you, it will appear here</p>
                </div>
            </div>
        `;
    }

    // Load bookmarks page
    loadBookmarksPage() {
        const feedContainer = document.querySelector('.feed-posts');
        feedContainer.innerHTML = `
            <div style="padding: 2rem;">
                <h2 style="margin-bottom: 1.5rem;">🔖 Bookmarks</h2>
                <div style="text-align: center; padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📑</div>
                    <p style="color: var(--text-muted);">No bookmarks yet</p>
                    <p style="color: var(--text-muted); font-size: 0.875rem;">Save posts to view them later</p>
                </div>
            </div>
        `;
    }

    // Load analytics page
    loadAnalyticsPage() {
        const feedContainer = document.querySelector('.feed-posts');
        const user = this.components.authService.getCurrentUser();
        
        feedContainer.innerHTML = `
            <div style="padding: 2rem;">
                <h2 style="margin-bottom: 1.5rem;">📊 Your Analytics</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--primary);">${user?.stats?.picks || 0}</div>
                        <div style="color: var(--text-muted);">Total Picks</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--success);">${user?.stats?.accuracy || 0}%</div>
                        <div style="color: var(--text-muted);">Win Rate</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--warning);">${this.formatNumber(user?.stats?.followers || 0)}</div>
                        <div style="color: var(--text-muted);">Followers</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--info);">${user?.degenCoins || 0}</div>
                        <div style="color: var(--text-muted);">DegenCoins</div>
                    </div>
                </div>
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px;">
                    <h3 style="margin-bottom: 1rem;">Recent Performance</h3>
                    <p style="color: var(--text-muted);">Your betting analytics and performance tracking will appear here</p>
                </div>
            </div>
        `;
    }

    // Attach event listeners
    attachEventListeners() {
        // Infinite scroll - attach to window since feed-posts might not scroll itself
        window.addEventListener('scroll', () => {
            const feedContainer = document.querySelector('.feed-posts');
            if (!feedContainer) return;
            
            // Check if we're near the bottom of the page
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const clientHeight = document.documentElement.clientHeight;
            
            if (scrollTop + clientHeight >= scrollHeight - 200) {
                console.log('Near bottom, loading more posts...');
                this.loadMorePosts();
            }
        });
        
        // Search
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.components.DOMHelpers.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }

        // Create post button in sidebar
        const createPostBtn = document.querySelector('.create-post-btn');
        if (createPostBtn) {
            createPostBtn.addEventListener('click', () => {
                const postInput = document.querySelector('.post-input');
                if (postInput) {
                    postInput.focus();
                }
            });
        }
    }

    // Initialize modals
    initializeModals() {
        const commentInput = document.getElementById('commentInput');
        const postBtn = document.getElementById('postCommentBtn');
        
        if (commentInput && postBtn) {
            commentInput.addEventListener('input', function() {
                postBtn.disabled = this.value.trim().length === 0;
                postBtn.style.opacity = this.value.trim().length === 0 ? '0.5' : '1';
            });
        }
    }

    // Handle search
    handleSearch(query) {
        if (!query) {
            // Clear search, return to feed
            this.loadFeedPosts(this.currentTab);
            return;
        }
        
        console.log('Searching for:', query);
        
        // Check if it's a hashtag search
        if (query.startsWith('#')) {
            this.searchHashtag(query);
            return;
        }
        
        // Regular search
        const feedContainer = document.querySelector('.feed-posts');
        feedContainer.innerHTML = `
            <div style="padding: 2rem;">
                <h3>Search Results for "${query}"</h3>
                <p style="color: var(--text-muted); margin-top: 1rem;">Searching...</p>
            </div>
        `;
        
        // Perform the search
        this.performSearch(query);
    }

    // Add hashtag search functionality
    async searchHashtag(hashtag) {
        console.log('🔍 Searching hashtag:', hashtag);
        
        // CRITICAL: Set flags to prevent feed reload
        window.currentComponent = 'hashtag-search';
        window.preventFeedReload = true;
        
        // Hide create post area
        const createPostArea = document.querySelector('.create-post-area');
        if (createPostArea) createPostArea.style.display = 'none';
        
        // Clear active tabs
        const feedTabs = document.querySelectorAll('.feed-tab');
        feedTabs.forEach(t => t.classList.remove('active'));
        
        const feedContainer = document.querySelector('.feed-posts');
        if (!feedContainer) return;
        
        // Show loading
        feedContainer.innerHTML = `
            <div style="padding: 2rem;">
                <div style="display: flex; align-items: center; margin-bottom: 2rem;">
                    <button onclick="feedController.clearSearch()" style="background: none; border: none; color: var(--primary); font-size: 1.5rem; margin-right: 1rem; cursor: pointer;" title="Back to feed">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2>🔍 ${hashtag}</h2>
                </div>
                <div style="text-align: center; color: var(--text-muted);">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Searching posts...</p>
                </div>
            </div>
        `;
        
        try {
            const cleanTag = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
            const response = await fetch(`/api/trending/hashtag/${cleanTag}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderHashtagResults(data);
            } else {
                this.renderNoResults(hashtag);
            }
        } catch (error) {
            console.error('Error searching hashtag:', error);
            this.renderSearchError(hashtag);
        }
    }

    // Render hashtag search results
    renderHashtagResults(data) {
        const feedContainer = document.querySelector('.feed-posts');
        if (!feedContainer) return;
        
        feedContainer.innerHTML = `
            <div style="padding: 2rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
                    <div style="display: flex; align-items: center;">
                        <button onclick="feedController.clearSearch()" style="background: none; border: none; color: var(--primary); font-size: 1.5rem; margin-right: 1rem; cursor: pointer;" title="Back to feed">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div>
                            <h2 style="margin: 0;">${data.hashtag}</h2>
                            <p style="color: var(--text-muted); margin: 0.25rem 0 0 0;">${data.count} ${data.count === 1 ? 'post' : 'posts'} found</p>
                        </div>
                    </div>
                    <button onclick="feedController.followHashtag('${data.hashtag}')" style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 0.875rem;">
                        Follow ${data.hashtag}
                    </button>
                </div>
                
                <div class="hashtag-posts">
                    ${data.posts.length > 0 ? 
                        data.posts.map(post => this.renderHashtagPost(post)).join('') :
                        '<div style="text-align: center; padding: 3rem; color: var(--text-muted);"><div style="font-size: 3rem; margin-bottom: 1rem;">📭</div><p>No posts found for this hashtag</p><p style="font-size: 0.875rem;">Be the first to post with ${data.hashtag}!</p></div>'
                    }
                </div>
            </div>
        `;
    }

    // Render individual hashtag post
    renderHashtagPost(post) {
        const timeAgo = this.getTimeAgo(new Date(post.createdAt));
        const username = post.userId?.username || 'User';
        const displayName = post.userId?.displayName || username;
        const avatar = displayName.charAt(0).toUpperCase();
        
        return `
            <div class="hashtag-post" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem; border-left: 3px solid var(--primary);">
                <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 0.75rem;">
                        ${avatar}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: var(--text-primary);">${displayName}</div>
                        <div style="font-size: 0.875rem; color: var(--text-muted);">@${username} • ${timeAgo}</div>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">
                        ${post.room ? `#${post.room}` : ''}
                    </div>
                </div>
                <div style="color: var(--text-primary); line-height: 1.5;">
                    ${this.highlightHashtags(post.message)}
                </div>
            </div>
        `;
    }

    // Highlight hashtags in text
    highlightHashtags(text) {
        return text.replace(/#\w+/g, (match) => {
            return `<span style="color: var(--primary); font-weight: bold; cursor: pointer;" onclick="feedController.searchHashtag('${match}')">${match}</span>`;
        });
    }

    // Clear search and return to feed
    clearSearch() {
        console.log('🔄 Clearing search, returning to feed');
        
        // Reset flags
        window.currentComponent = null;
        window.preventFeedReload = false;
        
        // Show create post area
        const createPostArea = document.querySelector('.create-post-area');
        if (createPostArea) createPostArea.style.display = 'block';
        
        // Clear search input
        const searchInput = document.querySelector('.search-input');
        if (searchInput) searchInput.value = '';
        
        // Click "For You" tab to reload feed
        const forYouTab = document.querySelector('.feed-tab:first-child');
        if (forYouTab) {
            forYouTab.classList.add('active');
            this.loadFeedPosts('for-you');
        }
        
        // Reset nav to home
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const homeNav = document.querySelector('.nav-item:first-child');
        if (homeNav) homeNav.classList.add('active');
    }

    // Follow hashtag functionality
    followHashtag(hashtag) {
        console.log('📌 Following hashtag:', hashtag);
        
        // Store in localStorage for now
        const followedTags = JSON.parse(localStorage.getItem('followedHashtags') || '[]');
        if (!followedTags.includes(hashtag)) {
            followedTags.push(hashtag);
            localStorage.setItem('followedHashtags', JSON.stringify(followedTags));
            
            // Update button text
            const button = event.target;
            button.textContent = `Following ${hashtag}`;
            button.style.opacity = '0.7';
            button.disabled = true;
            
            console.log('✅ Now following', hashtag);
        }
    }

    // Perform regular search
    async performSearch(query) {
        // This can be expanded later for general search functionality
        const feedContainer = document.querySelector('.feed-posts');
        
        setTimeout(() => {
            feedContainer.innerHTML = `
                <div style="padding: 2rem;">
                    <h3>Search Results for "${query}"</h3>
                    <p style="color: var(--text-muted); margin-top: 1rem;">Search functionality coming soon!</p>
                    <button onclick="feedController.clearSearch()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Back to Feed
                    </button>
                </div>
            `;
        }, 1000);
    }

    // Helper function to get time ago (if not already present)
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'just now';
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        
        const weeks = Math.floor(days / 7);
        return `${weeks}w ago`;
    }

    // Start real-time updates
    startRealTimeUpdates() {
        // Update live games every 10 seconds
        setInterval(() => {
            if (document.querySelector('.live-games-widget')) {
                this.loadLiveGames();
            }
        }, 10000);

        // Check for new posts every 30 seconds
        setInterval(() => {
            if (this.currentTab === 'for-you' || this.currentTab === 'following') {
                console.log('Checking for new posts...');
            }
        }, 30000);
    }

    // Handle real-time bet updates
    handleRealtimeBetUpdate(data) {
        const { postId, challengeBet, type, userId } = data;
        
        console.log('🔄 Processing real-time bet update:', { postId, type, userId });
        
        // Find the bet element in the DOM (try both with and without toString)
        let betElement = document.querySelector(`[data-bet-id="${postId}"]`);
        if (!betElement) {
            betElement = document.querySelector(`[data-bet-id="${postId.toString()}"]`);
        }
        
        if (!betElement) {
            console.log('Bet element not found for update, trying post containers:', postId);
            // Try to find by post ID in case bet-id is different
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            if (postElement) {
                betElement = postElement.querySelector('.bet-challenge');
            }
        }
        
        if (!betElement) {
            console.log('Still no bet element found for:', postId);
            return;
        }
        
        console.log('✅ Found bet element, updating UI');
        
        // Update accepted count
        const acceptedCount = challengeBet.acceptedBy?.length || 0;
        const maxCount = challengeBet.maxOpponents || 3;
        
        // Update all accept count displays
        betElement.querySelectorAll('.accept-count').forEach(el => {
            el.textContent = acceptedCount;
        });
        
        // Update bet info text
        const betInfo = betElement.querySelector('.bet-info');
        if (betInfo) {
            const betText = betInfo.textContent.replace(/\d+\/\d+/, `${acceptedCount}/${maxCount}`);
            betInfo.textContent = betText;
        }
        
        // Update handshake visual immediately for other users
        const handshakeContainer = betElement.querySelector('.handshake-container');
        if (handshakeContainer) {
            // Update immediately without delay
            if (acceptedCount >= maxCount) {
                // Full - show completed handshake
                handshakeContainer.innerHTML = '<span class="handshake-joined">🤝</span>';
                handshakeContainer.className = 'handshake-container state-completed';
                handshakeContainer.setAttribute('data-gap', 'full');
            } else if (acceptedCount > 0) {
                // Partially filled
                handshakeContainer.innerHTML = '<span class="hand-left">🤚</span><span class="hand-right">✋</span>';
                handshakeContainer.className = 'handshake-container state-pending';
                const gapLevel = Math.ceil((acceptedCount / maxCount) * 5).toString();
                handshakeContainer.setAttribute('data-gap', gapLevel);
            } else {
                // Empty
                handshakeContainer.innerHTML = '<span class="hand-left">🤚</span><span class="hand-right">✋</span>';
                handshakeContainer.className = 'handshake-container state-single';
                handshakeContainer.setAttribute('data-gap', '0');
            }
        }
        
        // Update progress text
        const progressText = betElement.querySelector('.progress-text');
        if (progressText) {
            if (acceptedCount >= maxCount) {
                progressText.textContent = '✅ All spots filled! Bet is locked in.';
            } else if (acceptedCount > 0) {
                progressText.textContent = `${acceptedCount}/${maxCount} spots taken. ${maxCount - acceptedCount} remaining.`;
            } else {
                progressText.textContent = 'Looking for opponents to take the other side...';
            }
        }
        
        // Update buttons for current user
        const currentUser = this.components.authService.getCurrentUser();
        const currentUserId = currentUser?._id || currentUser?.id;
        
        // Try multiple ways to get the post author ID
        const postElement = betElement.closest('.post');
        let postAuthorId = postElement?.querySelector('.post-header')?.dataset?.authorId;
        
        // If not in dataset, try to get from the post's author info
        if (!postAuthorId && postElement) {
            const authorHandle = postElement.querySelector('.author-handle')?.textContent?.replace('@', '');
            // Check if this matches current user's username
            if (authorHandle === currentUser?.username) {
                postAuthorId = currentUserId;
            }
        }
        
        const isCreator = postAuthorId && currentUserId && (postAuthorId === currentUserId);
        
        console.log('🔍 Creator check:', {
            postAuthorId,
            currentUserId,
            isCreator,
            username: currentUser?.username
        });
        const isUserInBet = challengeBet.acceptedBy?.some(id => 
            (typeof id === 'string' ? id : id._id) === currentUserId
        );
        const betProgress = betElement.querySelector('.bet-progress');
        
        if (betProgress && currentUser) {
            // Clear current buttons
            betProgress.innerHTML = '';
            
            // Check if betting is closed (within 2 minutes of game)
            const gameTime = challengeBet.game?.startTime || challengeBet.game?.gameTime;
            let isBettingClosed = false;
            
            if (gameTime) {
                const now = new Date();
                const game = new Date(gameTime);
                const minutesUntilGame = (game - now) / (1000 * 60);
                isBettingClosed = minutesUntilGame < 2 || now >= game;
            }
            
            if (isBettingClosed) {
                // Betting is closed
                betProgress.innerHTML = `
                    <div style="color: var(--warning); font-weight: 600;">
                        ⏰ Betting closed - Game starting soon
                    </div>
                `;
            } else if (isCreator) {
                // Creator should NEVER see accept button, only cancel or wait message
                console.log('👤 User is creator, showing creator controls');
                if (acceptedCount === 0) {
                    betProgress.innerHTML = `
                        <button class="cancel-btn" onclick="window.betAcceptance?.cancelChallengeBet('${postId}')" 
                                style="background: var(--danger); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
                            ❌ Cancel Bet
                        </button>
                    `;
                } else {
                    betProgress.innerHTML = `
                        <div style="color: var(--text-muted); font-weight: 600;">
                            ⏳ Waiting for opponents (${acceptedCount}/${maxCount})
                        </div>
                    `;
                }
                return; // Exit early to prevent any other buttons from showing
            } else if (isUserInBet) {
                // User is in the bet - show back out button
                betProgress.innerHTML = `
                    <button class="cancel-btn" onclick="window.betAcceptance?.removeFromBet('${postId}')" 
                            style="background: var(--warning); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
                        🚪 Back Out
                    </button>
                `;
            } else if (acceptedCount < maxCount && !isCreator) {
                // Bet has open spots and user is not creator - show accept button
                betProgress.innerHTML = `
                    <button class="accept-btn" onclick="window.betAcceptance?.acceptChallengeBet('${postId}', '${postId}')" 
                            style="background: var(--primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                        🤝 Accept Bet (${acceptedCount}/${maxCount} spots)
                    </button>
                `;
            } else {
                // Bet is full and user is not in it
                betProgress.innerHTML = `
                    <div style="color: var(--text-muted); font-weight: 600;">
                        🔒 Bet is full (${acceptedCount}/${maxCount})
                    </div>
                `;
            }
        }
        
        // Show notification for the update
        if (type === 'accepted' && userId !== currentUserId) {
            console.log('💬 Someone accepted the bet');
        } else if (type === 'removed' && userId !== currentUserId) {
            console.log('💬 Someone left the bet');
        }
    }

    // Helper function to format numbers
    formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    // Refresh feed
    async refreshFeed() {
        await this.loadFeedPosts(this.currentTab);
    }
    
    // Mobile navigation methods
    navigateToHome() {
        this.closeMobileSidebar();
        this.updateBottomNavActive(0);
        this.loadFeedPosts('for-you');
    }
    
    navigateToExplore() {
        this.closeMobileSidebar();
        this.updateBottomNavActive(1);
        this.loadExplorePage();
    }
    
    openCreatePost() {
        this.closeMobileSidebar();
        const postInput = document.querySelector('.post-input');
        if (postInput) {
            postInput.focus();
            postInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    navigateToNotifications() {
        this.closeMobileSidebar();
        this.updateBottomNavActive(3);
        this.loadNotificationsPage();
    }
    
    navigateToProfile() {
        this.closeMobileSidebar();
        this.updateBottomNavActive(4);
        if (window.profileComponent && typeof window.profileComponent.loadProfile === 'function') {
            window.profileComponent.loadProfile();
        }
    }
    
    updateBottomNavActive(index) {
        const buttons = document.querySelectorAll('.mobile-bottom-nav button');
        buttons.forEach((btn, i) => {
            if (i === index) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

// Create global instance and initialize
window.feedController = new FeedController();

// Make loadPosts available globally for other components
window.loadPosts = async function() {
    if (window.feedController && window.feedController.initialized) {
        await window.feedController.refreshFeed();
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all components are loaded
    setTimeout(() => {
        window.feedController.init();
        // Force update user info after init
        if (window.feedController) {
            window.feedController.updateUserInfo();
        }
    }, 500);  // Increased delay to ensure services are loaded
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeedController;
}