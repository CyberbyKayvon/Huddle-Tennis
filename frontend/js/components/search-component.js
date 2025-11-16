// SECURE Search Component - XSS Protected
class SearchComponent {
    constructor() {
        this.searchInput = document.querySelector('.search-input');
        this.searchResults = null;
        this.searchTimeout = null;
        this.isSearching = false;
        this.searchMode = null;
        this.MAX_QUERY_LENGTH = 100;
        this.MIN_QUERY_LENGTH = 2;
    }

    init() {
        if (!this.searchInput) return;
        
        // Add event listeners with proper event handling
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        this.searchInput.addEventListener('focus', () => this.showSearchDropdown());
        this.searchInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Click outside to close - using capture phase for better control
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-bar')) {
                this.hideSearchDropdown();
            }
        }, true);
    }

    // Sanitize input to prevent XSS
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        // Remove any HTML tags and dangerous characters
        return input
            .substring(0, this.MAX_QUERY_LENGTH)
            .replace(/[<>\"\']/g, '')
            .trim();
    }

    // Escape HTML for safe display
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Create safe text node
    createSafeTextNode(text) {
        return document.createTextNode(text);
    }

    handleSearch(e) {
        const rawQuery = e.target.value;
        const query = this.sanitizeInput(rawQuery);
        
        // Update input with sanitized value if different
        if (rawQuery !== query) {
            e.target.value = query;
        }
        
        // Clear previous timeout
        clearTimeout(this.searchTimeout);
        
        if (query.length < this.MIN_QUERY_LENGTH) {
            this.hideSearchDropdown();
            return;
        }
        
        // Detect search type
        if (query.startsWith('#')) {
            this.searchMode = 'hashtag';
        } else if (query.startsWith('@')) {
            this.searchMode = 'user';
        } else {
            this.searchMode = 'all';
        }
        
        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    async performSearch(query) {
        this.isSearching = true;
        this.showSearchDropdown();
        this.showLoadingState();
        
        try {
            if (this.searchMode === 'hashtag') {
                await this.searchHashtags(query);
            } else if (this.searchMode === 'user') {
                await this.searchUsers(query.substring(1));
            } else {
                await this.searchAll(query);
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError();
        } finally {
            this.isSearching = false;
        }
    }

    async searchUsers(query) {
        try {
            // Validate query
            const sanitizedQuery = this.sanitizeInput(query);
            if (!sanitizedQuery) return;
            
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(sanitizedQuery)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Search failed');
            
            const data = await response.json();
            
            // Validate response data
            if (!data || !Array.isArray(data.users)) {
                this.displayUserResults([]);
                return;
            }
            
            this.displayUserResults(data.users);
        } catch (error) {
            console.error('Error searching users:', error);
            this.displayUserResults([]);
        }
    }

    async searchHashtags(query) {
        const hashtag = this.sanitizeInput(query.substring(1));
        
        // Mock data - in production this would come from backend
        const trendingHashtags = [
            { tag: 'Kings', count: '15.3K posts' },
            { tag: 'Fantasy', count: '8.6K posts' },
            { tag: 'players', count: '12.3K posts' },
            { tag: 'Olympic', count: '6.7K posts' }
        ].filter(h => h.tag.toLowerCase().includes(hashtag.toLowerCase()));
        
        this.displayHashtagResults(trendingHashtags);
    }

    async searchAll(query) {
        try {
            const sanitizedQuery = this.sanitizeInput(query);
            if (!sanitizedQuery) return;
            
            // Search users
            const usersResponse = await fetch(`/api/users/search?q=${encodeURIComponent(sanitizedQuery)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const usersData = usersResponse.ok ? await usersResponse.json() : { users: [] };
            
            // Mock posts search
            const posts = this.searchPostsLocally(sanitizedQuery);
            
            // Mock hashtags
            const hashtags = [
                { tag: 'Kings', count: '15.3K posts' },
                { tag: 'Fantasy', count: '8.6K posts' }
            ].filter(h => h.tag.toLowerCase().includes(sanitizedQuery.toLowerCase()));
            
            this.displayAllResults({
                users: usersData.users || [],
                posts: posts,
                hashtags: hashtags
            });
        } catch (error) {
            console.error('Error in search:', error);
            this.showError();
        }
    }

    searchPostsLocally(query) {
        const sanitizedQuery = this.sanitizeInput(query).toLowerCase();
        const posts = [];
        
        document.querySelectorAll('.post-content').forEach(postEl => {
            const content = (postEl.textContent || '').toLowerCase();
            if (content.includes(sanitizedQuery)) {
                const postContainer = postEl.closest('.post');
                if (!postContainer) return;
                
                const author = postContainer.querySelector('.author-name')?.textContent || 'Unknown';
                const snippet = content.substring(0, 100);
                
                posts.push({
                    id: postContainer.dataset.postId || '',
                    author: this.sanitizeInput(author),
                    snippet: this.sanitizeInput(snippet) + '...'
                });
            }
        });
        
        return posts.slice(0, 5);
    }

    displayUserResults(users) {
        const container = document.createElement('div');
        container.className = 'search-results-section';
        
        const title = document.createElement('div');
        title.className = 'search-section-title';
        title.textContent = 'Users';
        container.appendChild(title);
        
        if (!users || users.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'search-no-results';
            noResults.textContent = 'No users found';
            container.appendChild(noResults);
        } else {
            users.forEach(user => {
                // Validate user data
                if (!user || !user.username) return;
                
                const userItem = document.createElement('div');
                userItem.className = 'search-result-item user-result';
                
                // Create avatar
                const avatar = document.createElement('div');
                avatar.className = 'search-user-avatar';
                avatar.textContent = (user.displayName || user.username || 'U').charAt(0).toUpperCase();
                userItem.appendChild(avatar);
                
                // Create info container
                const info = document.createElement('div');
                info.className = 'search-user-info';
                
                const name = document.createElement('div');
                name.className = 'search-user-name';
                name.textContent = user.displayName || user.username || 'Unknown';
                
                if (user.verified) {
                    const verifiedIcon = document.createElement('i');
                    verifiedIcon.className = 'fas fa-check-circle verified-badge';
                    verifiedIcon.style.marginLeft = '0.25rem';
                    name.appendChild(verifiedIcon);
                }
                
                const handle = document.createElement('div');
                handle.className = 'search-user-handle';
                handle.textContent = '@' + (user.username || 'unknown');
                
                info.appendChild(name);
                info.appendChild(handle);
                userItem.appendChild(info);
                
                // Add click handler safely
                userItem.addEventListener('click', () => {
                    const safeUsername = encodeURIComponent(user.username);
                    window.location.href = `/profile?u=${safeUsername}`;
                });
                
                // Add follow button if not self
                const currentUser = window.authService?.getCurrentUser();
                if (currentUser && user._id && user._id !== currentUser._id) {
                    const followBtn = document.createElement('button');
                    followBtn.className = 'search-follow-btn';
                    followBtn.setAttribute('data-follow-user-id', user._id);
                    followBtn.textContent = 'Follow';
                    
                    followBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (window.followService) {
                            window.followService.toggleFollow(user._id, user.username);
                        }
                    });
                    
                    userItem.appendChild(followBtn);
                }
                
                container.appendChild(userItem);
            });
        }
        
        this.updateSearchResultsSafely(container);
    }

    displayHashtagResults(hashtags) {
        const container = document.createElement('div');
        container.className = 'search-results-section';
        
        const title = document.createElement('div');
        title.className = 'search-section-title';
        title.textContent = 'Hashtags';
        container.appendChild(title);
        
        if (!hashtags || hashtags.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'search-no-results';
            noResults.textContent = 'No hashtags found';
            container.appendChild(noResults);
        } else {
            hashtags.forEach(hashtag => {
                if (!hashtag || !hashtag.tag) return;
                
                const hashtagItem = document.createElement('div');
                hashtagItem.className = 'search-result-item hashtag-result';
                
                const icon = document.createElement('div');
                icon.className = 'search-hashtag-icon';
                icon.innerHTML = '<i class="fas fa-hashtag"></i>';
                hashtagItem.appendChild(icon);
                
                const info = document.createElement('div');
                info.className = 'search-hashtag-info';
                
                const name = document.createElement('div');
                name.className = 'search-hashtag-name';
                name.textContent = '#' + this.sanitizeInput(hashtag.tag);
                
                const count = document.createElement('div');
                count.className = 'search-hashtag-count';
                count.textContent = hashtag.count || '0 posts';
                
                info.appendChild(name);
                info.appendChild(count);
                hashtagItem.appendChild(info);
                
                // Add click handler safely
                hashtagItem.addEventListener('click', () => {
                    if (window.feedController) {
                        window.feedController.searchHashtag('#' + hashtag.tag);
                    }
                });
                
                container.appendChild(hashtagItem);
            });
        }
        
        this.updateSearchResultsSafely(container);
    }

    displayAllResults(results) {
        const container = document.createElement('div');
        
        // Users section
        if (results.users && results.users.length > 0) {
            const usersSection = this.createUsersSection(results.users.slice(0, 3));
            container.appendChild(usersSection);
        }
        
        // Posts section
        if (results.posts && results.posts.length > 0) {
            const postsSection = this.createPostsSection(results.posts);
            container.appendChild(postsSection);
        }
        
        // Hashtags section
        if (results.hashtags && results.hashtags.length > 0) {
            const hashtagsSection = this.createHashtagsSection(results.hashtags);
            container.appendChild(hashtagsSection);
        }
        
        if (container.children.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'search-no-results';
            noResults.textContent = 'No results found';
            container.appendChild(noResults);
        }
        
        this.updateSearchResultsSafely(container);
    }

    createUsersSection(users) {
        const section = document.createElement('div');
        section.className = 'search-results-section';
        
        const title = document.createElement('div');
        title.className = 'search-section-title';
        title.textContent = 'Users';
        section.appendChild(title);
        
        users.forEach(user => {
            if (!user || !user.username) return;
            
            const userItem = document.createElement('div');
            userItem.className = 'search-result-item user-result';
            
            const avatar = document.createElement('div');
            avatar.className = 'search-user-avatar';
            avatar.textContent = (user.displayName || user.username || 'U').charAt(0).toUpperCase();
            
            const info = document.createElement('div');
            info.className = 'search-user-info';
            
            const name = document.createElement('div');
            name.className = 'search-user-name';
            name.textContent = user.displayName || user.username;
            
            const handle = document.createElement('div');
            handle.className = 'search-user-handle';
            handle.textContent = '@' + user.username;
            
            info.appendChild(name);
            info.appendChild(handle);
            
            userItem.appendChild(avatar);
            userItem.appendChild(info);
            
            userItem.addEventListener('click', () => {
                window.location.href = `/profile?u=${encodeURIComponent(user.username)}`;
            });
            
            section.appendChild(userItem);
        });
        
        return section;
    }

    createPostsSection(posts) {
        const section = document.createElement('div');
        section.className = 'search-results-section';
        
        const title = document.createElement('div');
        title.className = 'search-section-title';
        title.textContent = 'Posts';
        section.appendChild(title);
        
        posts.forEach(post => {
            if (!post) return;
            
            const postItem = document.createElement('div');
            postItem.className = 'search-result-item post-result';
            
            const author = document.createElement('div');
            author.className = 'search-post-author';
            author.textContent = post.author || 'Unknown';
            
            const snippet = document.createElement('div');
            snippet.className = 'search-post-snippet';
            snippet.textContent = post.snippet || '';
            
            postItem.appendChild(author);
            postItem.appendChild(snippet);
            
            if (post.id) {
                postItem.addEventListener('click', () => {
                    if (window.commentSystem) {
                        window.commentSystem.open(post.id);
                    }
                });
            }
            
            section.appendChild(postItem);
        });
        
        return section;
    }

    createHashtagsSection(hashtags) {
        const section = document.createElement('div');
        section.className = 'search-results-section';
        
        const title = document.createElement('div');
        title.className = 'search-section-title';
        title.textContent = 'Trending';
        section.appendChild(title);
        
        hashtags.forEach(hashtag => {
            if (!hashtag || !hashtag.tag) return;
            
            const hashtagItem = document.createElement('div');
            hashtagItem.className = 'search-result-item hashtag-result';
            
            const icon = document.createElement('div');
            icon.className = 'search-hashtag-icon';
            const iconElement = document.createElement('i');
            iconElement.className = 'fas fa-hashtag';
            icon.appendChild(iconElement);
            
            const info = document.createElement('div');
            info.className = 'search-hashtag-info';
            
            const name = document.createElement('div');
            name.className = 'search-hashtag-name';
            name.textContent = '#' + hashtag.tag;
            
            const count = document.createElement('div');
            count.className = 'search-hashtag-count';
            count.textContent = hashtag.count || '0 posts';
            
            info.appendChild(name);
            info.appendChild(count);
            
            hashtagItem.appendChild(icon);
            hashtagItem.appendChild(info);
            
            hashtagItem.addEventListener('click', () => {
                if (window.feedController) {
                    window.feedController.searchHashtag('#' + hashtag.tag);
                }
            });
            
            section.appendChild(hashtagItem);
        });
        
        return section;
    }

    updateSearchResultsSafely(element) {
        if (!this.searchResults) return;
        
        // Clear existing content
        while (this.searchResults.firstChild) {
            this.searchResults.removeChild(this.searchResults.firstChild);
        }
        
        // Add new content
        if (element instanceof Node) {
            this.searchResults.appendChild(element);
        }
        
        // Update follow buttons if service is loaded
        if (window.followService && window.followService.isLoaded) {
            window.followService.updateAllButtons();
        }
    }

    showSearchDropdown() {
        if (!this.searchResults) {
            this.createSearchDropdown();
        }
        if (this.searchResults) {
            this.searchResults.style.display = 'block';
        }
    }

    hideSearchDropdown() {
        if (this.searchResults) {
            this.searchResults.style.display = 'none';
        }
    }

    createSearchDropdown() {
        const searchBar = document.querySelector('.search-bar');
        if (!searchBar) return;
        
        this.searchResults = document.createElement('div');
        this.searchResults.className = 'search-results-dropdown';
        
        // Use CSS classes instead of inline styles for better CSP compliance
        this.searchResults.style.position = 'absolute';
        this.searchResults.style.top = '100%';
        this.searchResults.style.left = '0';
        this.searchResults.style.right = '0';
        this.searchResults.style.marginTop = '0.5rem';
        this.searchResults.style.maxHeight = '400px';
        this.searchResults.style.overflowY = 'auto';
        this.searchResults.style.zIndex = '1000';
        this.searchResults.style.display = 'none';
        
        searchBar.style.position = 'relative';
        searchBar.appendChild(this.searchResults);
    }

    showLoadingState() {
        const container = document.createElement('div');
        container.style.padding = '1rem';
        container.style.textAlign = 'center';
        
        const spinner = document.createElement('i');
        spinner.className = 'fas fa-spinner fa-spin';
        spinner.style.color = 'var(--primary)';
        
        const text = document.createElement('div');
        text.style.marginTop = '0.5rem';
        text.style.color = 'var(--text-muted)';
        text.style.fontSize = '0.875rem';
        text.textContent = 'Searching...';
        
        container.appendChild(spinner);
        container.appendChild(text);
        
        this.updateSearchResultsSafely(container);
    }

    showError() {
        const container = document.createElement('div');
        container.style.padding = '1rem';
        container.style.textAlign = 'center';
        container.style.color = 'var(--text-muted)';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-exclamation-circle';
        
        const text = document.createElement('div');
        text.style.marginTop = '0.5rem';
        text.style.fontSize = '0.875rem';
        text.textContent = 'Error searching. Please try again.';
        
        container.appendChild(icon);
        container.appendChild(text);
        
        this.updateSearchResultsSafely(container);
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.searchInput.value = '';
            this.hideSearchDropdown();
            this.searchInput.blur();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const query = this.sanitizeInput(this.searchInput.value);
            
            if (query.startsWith('#')) {
                if (window.feedController) {
                    window.feedController.searchHashtag(query);
                }
                this.hideSearchDropdown();
            } else if (query.startsWith('@')) {
                const firstUser = this.searchResults?.querySelector('.user-result');
                if (firstUser) {
                    firstUser.click();
                }
            }
        }
    }
}

// Initialize search component safely
if (typeof window !== 'undefined') {
    window.searchComponent = new SearchComponent();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.searchComponent.init();
        });
    } else {
        window.searchComponent.init();
    }
}