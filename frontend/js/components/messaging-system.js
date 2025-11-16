class MessagingSystem {
    constructor() {
        this.currentConversation = null;
        this.conversations = new Map();
        this.socket = null;
        this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        this.isOpen = false;
        this.typingTimers = new Map();
        this.messageCache = new Map();
        this.init();
    }

    init() {
        // Check authentication
        if (!this.currentUser?._id) {
            console.warn('User not authenticated for messaging');
            return;
        }
        this.connectSocket();
        this.loadConversations();
    }

    // Sanitize HTML to prevent XSS
    sanitizeHTML(str) {
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(str, {
                ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
                ALLOWED_ATTR: ['href', 'target']
            });
        }
        // Fallback basic sanitization
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Escape HTML entities
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    connectSocket() {
        if (typeof io !== 'undefined' && window.socket) {
            this.socket = window.socket;
            this.setupSocketListeners();
            
            // Join user's message room
            this.socket.emit('join_messages', {
                userId: this.currentUser._id
            });
        }
    }

    setupSocketListeners() {
        // Remove existing listeners to prevent duplicates
        this.socket.off('new_message');
        this.socket.off('user_typing');
        this.socket.off('message_read');
        this.socket.off('conversation_created');

        this.socket.on('new_message', (data) => {
            // Validate message data
            if (!this.validateMessageData(data)) return;
            this.handleIncomingMessage(data);
        });

        this.socket.on('user_typing', (data) => {
            if (data.conversationId && data.userId !== this.currentUser._id) {
                this.showTypingIndicator(data);
            }
        });

        this.socket.on('message_read', (data) => {
            if (data.messageId && data.userId) {
                this.markMessageAsRead(data);
            }
        });

        this.socket.on('conversation_created', (data) => {
            if (data.conversation) {
                this.addConversation(data.conversation);
            }
        });
    }

    validateMessageData(data) {
        return data && 
               data.conversationId && 
               data.sender && 
               data.content && 
               typeof data.content === 'string' &&
               data.content.length <= 5000; // Message length limit
    }

    async loadConversations() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/messages/conversations', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            if (data.success && Array.isArray(data.conversations)) {
                this.conversations.clear();
                data.conversations.forEach(conv => {
                    if (this.validateConversation(conv)) {
                        this.conversations.set(conv._id, conv);
                    }
                });
                this.updateConversationsUI();
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    validateConversation(conv) {
        return conv && conv._id && Array.isArray(conv.participants);
    }

    openMessaging(targetUserId = null) {
        // Prevent multiple instances
        if (document.querySelector('.message-panel')) {
            this.closeMessaging();
        }

        const messagePanel = document.createElement('div');
        messagePanel.className = 'message-panel';
        
        // Use safe HTML generation
        messagePanel.innerHTML = this.renderMessagePanel();
        document.body.appendChild(messagePanel);
        this.isOpen = true;

        // Add CSS if not already present
        if (!document.querySelector('#messaging-styles')) {
            this.injectStyles();
        }

        // Attach event listeners safely
        this.attachEventListeners();

        // Open specific conversation if targetUserId provided
        if (targetUserId) {
            this.openOrCreateConversation(targetUserId);
        }
    }

    renderMessagePanel() {
        return `
            <div class="message-container" data-panel="messaging">
                <div class="message-sidebar">
                    <div class="message-header">
                        <h3>Messages</h3>
                        <div class="message-controls">
                            <button class="new-message-btn" data-action="new-conversation" title="New Conversation">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="close-btn" data-action="close" title="Close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="search-bar">
                        <input type="text" class="search-input" placeholder="Search conversations..." maxlength="100">
                    </div>
                    <div class="conversations-list" data-list="conversations">
                        ${this.renderConversationsList()}
                    </div>
                </div>
                <div class="message-main" data-area="chat">
                    ${this.renderEmptyState()}
                </div>
            </div>
        `;
    }

    renderConversationsList() {
        if (this.conversations.size === 0) {
            return '<div class="no-conversations">No conversations yet</div>';
        }

        const sortedConversations = Array.from(this.conversations.values())
            .sort((a, b) => new Date(b.lastMessage?.createdAt || b.createdAt) - new Date(a.lastMessage?.createdAt || a.createdAt));

        return sortedConversations.map(conv => {
            const otherParticipants = conv.participants.filter(p => p._id !== this.currentUser._id);
            const displayName = this.escapeHtml(otherParticipants.map(p => p.displayName || p.username).join(', '));
            const lastMessage = conv.lastMessage ? this.escapeHtml(conv.lastMessage.content) : 'No messages yet';
            const unreadClass = conv.unreadCount > 0 ? 'unread' : '';
            
            return `
                <div class="conversation-item ${unreadClass}" data-conversation-id="${conv._id}">
                    <div class="conversation-avatar">
                        ${this.renderAvatar(otherParticipants[0])}
                    </div>
                    <div class="conversation-content">
                        <div class="conversation-name">${displayName}</div>
                        <div class="conversation-preview">${lastMessage}</div>
                    </div>
                    ${conv.unreadCount > 0 ? `<div class="unread-badge">${conv.unreadCount}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    renderAvatar(user) {
        if (!user) return '<div class="avatar-placeholder"><i class="fas fa-user"></i></div>';
        
        const initials = (user.displayName || user.username || '?').substring(0, 2).toUpperCase();
        if (user.avatar) {
            const sanitizedAvatar = this.escapeHtml(user.avatar);
            return `<img src="${sanitizedAvatar}" alt="${this.escapeHtml(user.username)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="avatar-fallback" style="display:none;">${this.escapeHtml(initials)}</div>`;
        }
        return `<div class="avatar-fallback">${this.escapeHtml(initials)}</div>`;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list or start a new one</p>
            </div>
        `;
    }

    async openOrCreateConversation(userId) {
        try {
            // Check if conversation exists
            const existingConv = Array.from(this.conversations.values()).find(conv => 
                conv.participants.length === 2 && 
                conv.participants.some(p => p._id === userId)
            );

            if (existingConv) {
                this.openConversation(existingConv._id);
            } else {
                await this.createConversation([userId]);
            }
        } catch (error) {
            console.error('Error opening conversation:', error);
        }
    }

    async createConversation(userIds) {
        try {
            const response = await fetch('/api/messages/conversations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ participants: userIds })
            });

            const data = await response.json();
            if (data.success) {
                this.conversations.set(data.conversation._id, data.conversation);
                this.openConversation(data.conversation._id);
                this.updateConversationsUI();
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
        }
    }

    async openConversation(conversationId) {
        this.currentConversation = conversationId;
        
        // Load messages
        await this.loadMessages(conversationId);
        
        // Render conversation
        const mainArea = document.querySelector('[data-area="chat"]');
        if (mainArea) {
            const conversation = this.conversations.get(conversationId);
            mainArea.innerHTML = this.renderConversation(conversation);
            this.scrollToBottom();
            
            // Mark as read
            this.markConversationRead(conversationId);
        }

        // Join conversation room via socket
        if (this.socket) {
            this.socket.emit('join_conversation', { conversationId });
        }
    }

    renderConversation(conversation) {
        const otherParticipants = conversation.participants.filter(p => p._id !== this.currentUser._id);
        const displayName = this.escapeHtml(otherParticipants.map(p => p.displayName || p.username).join(', '));

        return `
            <div class="conversation-header">
                <div class="conversation-info">
                    <h3>${displayName}</h3>
                    <span class="participant-count">${conversation.participants.length} participants</span>
                </div>
                <div class="conversation-actions">
                    <button data-action="add-participant" title="Add Participant">
                        <i class="fas fa-user-plus"></i>
                    </button>
                    <button data-action="conversation-info" title="Info">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
            <div class="messages-area" data-conversation="${conversation._id}">
                ${this.renderMessages(conversation._id)}
            </div>
            <div class="typing-indicator" style="display: none;">
                <span></span>
            </div>
            <div class="message-input-area">
                <input type="text" 
                       class="message-input" 
                       placeholder="Type a message..." 
                       maxlength="5000"
                       data-conversation="${conversation._id}">
                <button class="send-btn" data-action="send">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;
    }

    renderMessages(conversationId) {
        const messages = this.messageCache.get(conversationId) || [];
        
        return messages.map(msg => {
            const isMine = msg.sender._id === this.currentUser._id;
            const sanitizedContent = this.sanitizeHTML(msg.content);
            const time = new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
            });

            return `
                <div class="message ${isMine ? 'mine' : 'theirs'}" data-message-id="${msg._id}">
                    ${!isMine ? `<div class="message-avatar">${this.renderAvatar(msg.sender)}</div>` : ''}
                    <div class="message-bubble">
                        <div class="message-content">${sanitizedContent}</div>
                        <div class="message-time">${this.escapeHtml(time)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadMessages(conversationId) {
        try {
            const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.messageCache.set(conversationId, data.messages);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    async sendMessage(content, conversationId) {
        if (!content.trim() || !conversationId) return;

        try {
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversationId,
                    content: content.trim()
                })
            });

            const data = await response.json();
            if (data.success) {
                // Message will be added via socket event
                return true;
            }
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }

    handleIncomingMessage(data) {
        // Add to cache
        const messages = this.messageCache.get(data.conversationId) || [];
        messages.push(data.message);
        this.messageCache.set(data.conversationId, messages);

        // Update UI if this conversation is open
        if (this.currentConversation === data.conversationId) {
            this.appendMessage(data.message);
        }

        // Update conversation list
        this.updateConversationPreview(data.conversationId, data.message);

        // Show notification if not from current user
        if (data.message.sender._id !== this.currentUser._id) {
            this.showNotification(data.message);
        }
    }

    appendMessage(message) {
        const messagesArea = document.querySelector('.messages-area');
        if (!messagesArea) return;

        const isMine = message.sender._id === this.currentUser._id;
        const messageHTML = `
            <div class="message ${isMine ? 'mine' : 'theirs'}" data-message-id="${message._id}">
                ${!isMine ? `<div class="message-avatar">${this.renderAvatar(message.sender)}</div>` : ''}
                <div class="message-bubble">
                    <div class="message-content">${this.sanitizeHTML(message.content)}</div>
                    <div class="message-time">${new Date(message.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                </div>
            </div>
        `;

        messagesArea.insertAdjacentHTML('beforeend', messageHTML);
        this.scrollToBottom();
    }

    scrollToBottom() {
        const messagesArea = document.querySelector('.messages-area');
        if (messagesArea) {
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }
    }

    attachEventListeners() {
        const panel = document.querySelector('.message-panel');
        if (!panel) return;

        // Use event delegation for security
        panel.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            const convId = e.target.closest('[data-conversation-id]')?.dataset.conversationId;

            if (action === 'close') {
                this.closeMessaging();
            } else if (action === 'new-conversation') {
                this.showNewConversationModal();
            } else if (action === 'send') {
                const input = panel.querySelector('.message-input');
                if (input && input.value.trim()) {
                    this.sendMessage(input.value, this.currentConversation);
                    input.value = '';
                }
            } else if (action === 'add-participant') {
                this.showAddParticipantModal();
            } else if (convId) {
                this.openConversation(convId);
            }
        });

        // Message input enter key
        const messageInput = panel.querySelector('.message-input');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const sendBtn = panel.querySelector('[data-action="send"]');
                    if (sendBtn) sendBtn.click();
                }
            });

            // Typing indicator
            messageInput.addEventListener('input', () => {
                this.handleTyping();
            });
        }

        // Search
        const searchInput = panel.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterConversations(e.target.value);
            });
        }
    }

    handleTyping() {
        if (!this.currentConversation || !this.socket) return;

        // Clear existing timer
        const existingTimer = this.typingTimers.get(this.currentConversation);
        if (existingTimer) clearTimeout(existingTimer);

        // Emit typing event
        this.socket.emit('typing', {
            conversationId: this.currentConversation,
            userId: this.currentUser._id
        });

        // Set timer to stop typing indicator
        const timer = setTimeout(() => {
            this.socket.emit('stop_typing', {
                conversationId: this.currentConversation,
                userId: this.currentUser._id
            });
        }, 2000);

        this.typingTimers.set(this.currentConversation, timer);
    }

    showTypingIndicator(data) {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator && data.conversationId === this.currentConversation) {
            indicator.style.display = 'block';
            indicator.querySelector('span').textContent = `${data.username} is typing...`;
            
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 3000);
        }
    }

    closeMessaging() {
        const panel = document.querySelector('.message-panel');
        if (panel) {
            panel.remove();
        }
        this.isOpen = false;
        
        // Leave conversation room
        if (this.currentConversation && this.socket) {
            this.socket.emit('leave_conversation', { 
                conversationId: this.currentConversation 
            });
        }
        this.currentConversation = null;
    }

    injectStyles() {
        const styles = `
            <style id="messaging-styles">
                .message-panel {
                    position: fixed;
                    bottom: 0;
                    right: 20px;
                    width: 600px;
                    height: 500px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border);
                    border-radius: 12px 12px 0 0;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
                }

                .message-container {
                    display: flex;
                    height: 100%;
                }

                .message-sidebar {
                    width: 200px;
                    background: var(--bg-primary);
                    border-right: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                }

                .message-header {
                    padding: 1rem;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .message-header h3 {
                    margin: 0;
                    font-size: 1rem;
                }

                .message-controls {
                    display: flex;
                    gap: 0.5rem;
                }

                .message-controls button {
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 0.25rem;
                }

                .search-bar {
                    padding: 0.5rem;
                }

                .search-input {
                    width: 100%;
                    padding: 0.5rem;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    color: var(--text);
                }

                .conversations-list {
                    flex: 1;
                    overflow-y: auto;
                }

                .conversation-item {
                    padding: 0.75rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    border-bottom: 1px solid var(--border);
                    position: relative;
                }

                .conversation-item:hover {
                    background: var(--surface);
                }

                .conversation-item.unread {
                    background: rgba(99, 102, 241, 0.05);
                }

                .conversation-avatar img,
                .message-avatar img {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                }

                .avatar-fallback,
                .avatar-placeholder {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--primary);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                }

                .conversation-content {
                    flex: 1;
                    min-width: 0;
                }

                .conversation-name {
                    font-weight: 600;
                    color: var(--text);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .conversation-preview {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .unread-badge {
                    position: absolute;
                    right: 0.5rem;
                    background: var(--primary);
                    color: white;
                    font-size: 0.75rem;
                    padding: 0.125rem 0.375rem;
                    border-radius: 10px;
                }

                .message-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--text-muted);
                }

                .empty-state i {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .conversation-header {
                    padding: 1rem;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .conversation-header h3 {
                    margin: 0;
                    font-size: 1rem;
                }

                .participant-count {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                }

                .conversation-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .conversation-actions button {
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 0.25rem;
                }

                .messages-area {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .message {
                    display: flex;
                    gap: 0.5rem;
                    align-items: flex-start;
                }

                .message.mine {
                    justify-content: flex-end;
                }

                .message.theirs {
                    justify-content: flex-start;
                }

                .message-bubble {
                    max-width: 70%;
                    padding: 0.75rem;
                    border-radius: 12px;
                    background: var(--surface);
                }

                .message.mine .message-bubble {
                    background: var(--primary);
                    color: white;
                }

                .message-content {
                    word-wrap: break-word;
                }

                .message-time {
                    font-size: 0.75rem;
                    opacity: 0.7;
                    margin-top: 0.25rem;
                }

                .typing-indicator {
                    padding: 0.5rem 1rem;
                    color: var(--text-muted);
                    font-size: 0.875rem;
                    font-style: italic;
                }

                .message-input-area {
                    padding: 1rem;
                    border-top: 1px solid var(--border);
                    display: flex;
                    gap: 0.5rem;
                }

                .message-input {
                    flex: 1;
                    padding: 0.75rem;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 20px;
                    color: var(--text);
                }

                .send-btn {
                    padding: 0.75rem 1rem;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .send-btn:hover {
                    opacity: 0.9;
                }

                .no-conversations {
                    text-align: center;
                    padding: 2rem;
                    color: var(--text-muted);
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    showNewConversationModal() {
        // Implementation for user selection modal
        console.log('Show user selection modal');
    }

    showAddParticipantModal() {
        // Implementation for adding participants
        console.log('Show add participant modal');
    }

    filterConversations(searchTerm) {
        // Implementation for filtering conversations
        console.log('Filter conversations:', searchTerm);
    }

    showNotification(message) {
        // Browser notification if permitted
        if (Notification.permission === 'granted') {
            new Notification('New Message', {
                body: message.content,
                icon: '/favicon.ico'
            });
        }
    }

    updateConversationPreview(conversationId, message) {
        // Update conversation list with latest message
        const conv = this.conversations.get(conversationId);
        if (conv) {
            conv.lastMessage = message;
            this.updateConversationsUI();
        }
    }

    updateConversationsUI() {
        const listEl = document.querySelector('[data-list="conversations"]');
        if (listEl) {
            listEl.innerHTML = this.renderConversationsList();
        }
    }

    markConversationRead(conversationId) {
        // Mark conversation as read
        const conv = this.conversations.get(conversationId);
        if (conv) {
            conv.unreadCount = 0;
            this.updateConversationsUI();
        }
    }

    markMessageAsRead(data) {
        // Update message read status
        console.log('Message read:', data);
    }
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.messagingSystem = new MessagingSystem();
    });
} else {
    window.messagingSystem = new MessagingSystem();
}