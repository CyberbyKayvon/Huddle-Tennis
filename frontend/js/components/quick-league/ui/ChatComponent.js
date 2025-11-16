// quick-league/ui/ChatComponent.js
export class ChatComponent {
    constructor(parent) {
        this.parent = parent;
        this.socket = null;
        this.messages = [];
        this.isConnected = false;
    }
    
    connectSocket() {
        if (!this.socket && window.io) {
            this.socket = window.io();
            
            const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
            if (leagueId) {
                this.socket.emit('join_quick_league', leagueId);
            }
            
            this.socket.on('new_league_message', (message) => {
                this.addMessageToUI(message);
            });
            
            this.isConnected = true;
        }
    }
    
    render() {
        const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
        
        // Connect socket and load messages from MongoDB
        setTimeout(() => {
            this.connectSocket();
            this.loadMessagesFromServer();
        }, 100);
        
        return `
            <div class="chat-section" style="background: rgba(26, 26, 46, 0.95); border-radius: 15px; padding: 20px;">
                <h3 style="color: #00ff88; margin-bottom: 20px;">League Chat</h3>
                
                <!-- Messages Container -->
                <div id="chatMessages" style="height: 400px; overflow-y: auto; background: rgba(0, 0, 0, 0.3); 
                                              border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                    ${this.renderMessages(messages)}
                </div>
                
                <!-- Message Input -->
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="chatInput" placeholder="Type your message..." 
                           style="flex: 1; padding: 10px; background: rgba(0, 0, 0, 0.3); 
                                  border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white;">
                    <button data-action="send-message" 
                            style="padding: 10px 20px; background: linear-gradient(135deg, #6366f1, #8b5cf6); 
                                   color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Send
                    </button>
                </div>
            </div>
        `;
    }
    
    async loadMessagesFromServer() {
        try {
            const token = localStorage.getItem('token');
            const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
            
            if (!token || !leagueId) return;
            
            const response = await fetch(`/api/leagues/${leagueId}/chat`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.messages = data.messages || [];
                this.updateMessagesUI();
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }
    
    updateMessagesUI() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        container.innerHTML = this.renderMessages(this.messages);
        this.scrollToBottom();
    }
    
    addMessageToUI(message) {
        this.messages.push(message);
        this.updateMessagesUI();
    }
    
    renderMessages(messages) {
        if (!messages || messages.length === 0) {
            return `
                <div style="text-align: center; color: #94a3b8; padding: 40px;">
                    <i class="fas fa-comments" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
        }
        
        const userId = JSON.parse(localStorage.getItem('user') || '{}')._id || 'current-user';
        
        return messages.map(msg => {
            const isOwnMessage = msg.userId === userId || msg.user === 'You';
            const time = msg.timestamp 
                ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : msg.time || '';
            
            return `
                <div style="margin-bottom: 15px; ${isOwnMessage ? 'text-align: right;' : ''}">
                    <div style="display: inline-block; max-width: 70%; text-align: left;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: ${isOwnMessage ? '#00ff88' : '#6366f1'}; font-weight: 600; font-size: 0.85rem;">
                                ${msg.user || msg.username || 'Anonymous'}
                            </span>
                            <span style="color: #64748b; font-size: 0.75rem; margin-left: 10px;">${time}</span>
                        </div>
                        <div style="background: ${isOwnMessage ? 'rgba(0, 255, 136, 0.1)' : 'rgba(99, 102, 241, 0.1)'}; 
                                    padding: 10px 15px; border-radius: 12px; 
                                    border: 1px solid ${isOwnMessage ? 'rgba(0, 255, 136, 0.3)' : 'rgba(99, 102, 241, 0.3)'};">
                            <div style="color: white; word-wrap: break-word;">${this.escapeHtml(msg.text || msg.message)}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    async sendMessage(messageText) {
        const input = messageText || document.getElementById('chatInput')?.value;
        if (!input || !input.trim()) return;
        
        const inputEl = document.getElementById('chatInput');
        if (inputEl) inputEl.value = '';
        
        try {
            const token = localStorage.getItem('token');
            const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
            
            if (!token || !leagueId) {
                console.error('Missing auth token or league ID');
                return;
            }
            
            const response = await fetch(`/api/leagues/${leagueId}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: input.trim() })
            });
            
            if (response.ok) {
                // Message will be added via socket event
                // Just scroll to bottom
                this.scrollToBottom();
            } else {
                console.error('Failed to send message');
                // Re-add text to input if failed
                if (inputEl) inputEl.value = input;
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const inputEl = document.getElementById('chatInput');
            if (inputEl) inputEl.value = input;
        }
    }
    
    // Remove sendToServer method completely - it's now integrated into sendMessage
    
    scrollToBottom() {
        const container = document.getElementById('chatMessages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}