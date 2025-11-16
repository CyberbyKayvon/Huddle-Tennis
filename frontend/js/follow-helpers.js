// Enhanced follow helper functions with better sync
window.loadMoreSuggestions = async function() {
    try {
        const container = document.getElementById('follow-suggestions-container');
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 1rem;"><i class="fas fa-spinner fa-spin"></i></div>';
        }
        
        const response = await fetch('/api/users/suggestions?limit=5', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderSuggestions(data.suggestions);
        }
    } catch (error) {
        console.error('Error loading more suggestions:', error);
        const container = document.getElementById('follow-suggestions-container');
        if (container) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1rem;">Unable to load suggestions</div>';
        }
    }
};

window.renderSuggestions = function(suggestions) {
    const container = document.getElementById('follow-suggestions-container');
    if (!container) return;
    
    if (!suggestions || suggestions.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No suggestions available</div>';
        return;
    }
    
    const gradients = [
        'linear-gradient(135deg, #667eea, #764ba2)',
        'linear-gradient(135deg, #f093fb, #f5576c)',
        'linear-gradient(135deg, #4facfe, #00f2fe)',
        'linear-gradient(135deg, #43e97b, #38f9d7)',
        'linear-gradient(135deg, #fa709a, #fee140)'
    ];
    
    container.innerHTML = suggestions.map((user, index) => `
        <div class="user-suggestion" style="animation: fadeIn 0.3s ease ${index * 0.1}s both;">
            <div class="suggestion-avatar" style="background: ${gradients[index % gradients.length]}; position: relative;">
                ${user.displayName.charAt(0).toUpperCase()}
                ${user.verified ? '<span style="position: absolute; bottom: -2px; right: -2px; background: #1da1f2; color: white; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10px; border: 2px solid var(--bg-primary);">✓</span>' : ''}
            </div>
            <div class="suggestion-info">
                <div class="suggestion-name">
                    ${user.displayName}
                </div>
                <div class="suggestion-handle">
                    @${user.username} 
                    ${user.stats?.accuracy ? `• ${user.stats.accuracy}%` : ''}
                    ${user.stats?.followers ? `• ${user.stats.followers} followers` : ''}
                </div>
            </div>
            <button class="follow-btn" 
                    data-follow-user-id="${user._id}" 
                    onclick="window.followService.toggleFollow('${user._id}', '${user.username}')">
                <span class="btn-text">Follow</span>
            </button>
        </div>
    `).join('');
    
    // Add animation keyframes if not exists
    if (!document.getElementById('follow-animations')) {
        const style = document.createElement('style');
        style.id = 'follow-animations';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Update button states after render
    setTimeout(() => {
        if (window.followService) {
            window.followService.updateAllButtons();
        }
    }, 100);
};