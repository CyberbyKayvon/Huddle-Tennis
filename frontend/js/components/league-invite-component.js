// League Invite Component
class LeagueInviteComponent {
    constructor(platformId, leagueCode) {
        this.platformId = platformId;
        this.leagueCode = leagueCode;
        this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    }
    
    render() {
        return `
            <div class="invite-modal" id="inviteModal">
                <div class="modal-content">
                    <h2>Invite Users to League</h2>
                    
                    <div class="invite-methods">
                        <div class="method-card">
                            <h3>Share League Code</h3>
                            <div class="code-display">
                                <code>${this.leagueCode}</code>
                                <button onclick="leagueInvite.copyCode()">Copy</button>
                            </div>
                        </div>
                        
                        <div class="method-card">
                            <h3>Invite by Username</h3>
                            <div class="username-input">
                                <input type="text" id="usernameInput" placeholder="Enter username">
                                <button onclick="leagueInvite.addUsername()">Add</button>
                            </div>
                            <div id="usernameList" class="username-list"></div>
                            <button onclick="leagueInvite.sendInvites()" class="send-btn">
                                Send Invitations
                            </button>
                        </div>
                    </div>
                    
                    <button onclick="leagueInvite.close()" class="close-btn">Close</button>
                </div>
            </div>
        `;
    }
    
    async sendInvites() {
        const usernames = Array.from(document.querySelectorAll('.username-tag'))
            .map(tag => tag.dataset.username);
        
        if (usernames.length === 0) {
            alert('Please add at least one username');
            return;
        }
        
        try {
            const response = await fetch(`/api/platforms/${this.platformId}/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usernames,
                    userId: this.currentUser._id
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert(`Successfully invited ${result.invited.length} users!`);
                if (result.failed.length > 0) {
                    console.log('Failed invites:', result.failed);
                }
                this.close();
            }
        } catch (error) {
            alert('Failed to send invites: ' + error.message);
        }
    }
    
    addUsername() {
        const input = document.getElementById('usernameInput');
        const username = input.value.trim();
        
        if (username) {
            const list = document.getElementById('usernameList');
            list.innerHTML += `
                <span class="username-tag" data-username="${username}">
                    ${username}
                    <button onclick="this.parentElement.remove()">×</button>
                </span>
            `;
            input.value = '';
        }
    }
    
    copyCode() {
        navigator.clipboard.writeText(this.leagueCode);
        alert('League code copied!');
    }
    
    close() {
        document.getElementById('inviteModal').remove();
    }
}

// Initialize globally
window.leagueInvite = null;

function showInviteModal(platformId, leagueCode) {
    window.leagueInvite = new LeagueInviteComponent(platformId, leagueCode);
    document.body.insertAdjacentHTML('beforeend', window.leagueInvite.render());
}