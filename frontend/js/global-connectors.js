// Global Connectors - Connects all onclick handlers to their components
// This file should be loaded AFTER all components but BEFORE feed-controller.js

// Post Creator functions
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

// Challenge Bet functions
window.toggleChallengeMode = function() {
    if (window.challengeBet) {
        window.challengeBet.toggleChallengeMode();
    }
};

window.selectBetType = function(type) {
    if (window.challengeBet) {
        window.challengeBet.selectBetType(type);
    }
};

window.selectPick = function(pick) {
    if (window.challengeBet) {
        window.challengeBet.selectPick(pick);
    }
};

// Game Picker functions
window.toggleGamePicker = function() {
    if (window.gamePicker) {
        window.gamePicker.toggle();
    }
};

window.selectGame = function(gameId, home, away, sport) {
    if (window.gamePicker) {
        window.gamePicker.selectGame(gameId, home, away, sport);
    }
};

window.selectGameFromModal = function(gameId, home, away, sport) {
    if (window.gamePicker) {
        window.gamePicker.selectGame(gameId, home, away, sport);
    }
};

// Post Interactions functions
window.toggleStaticLike = function(button) {
    if (window.postInteractions) {
        // Call handleLike which will fall back to toggleStaticLike
        window.postInteractions.handleLike(button);
    }
};

window.toggleStaticDislike = function(button) {
    if (window.postInteractions) {
        // Call handleDislike which will fall back to toggleStaticDislike
        window.postInteractions.handleDislike(button);
    }
};

// Bet Acceptance functions
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

window.removeFromBet = function(postId) {
    if (window.betAcceptance) {
        window.betAcceptance.removeFromBet(postId);
    }
};

// Comment System functions
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

window.likeComment = function(commentId) {
    if (window.commentSystem) {
        window.commentSystem.likeComment(commentId);
    }
};

// Share functions
window.sharePost = function(postId) {
    console.log('Share post:', postId);
    alert('Share feature coming soon!');
};

window.bookmarkPost = function(postId) {
    console.log('Bookmark post:', postId);
    alert('Bookmark feature coming soon!');
};

// Load posts function (for other components to refresh feed)
window.loadPosts = async function() {
    if (window.feedController && window.feedController.initialized) {
        await window.feedController.refreshFeed();
    } else {
        console.log('Feed controller not ready, trying again...');
        setTimeout(() => {
            if (window.feedController) {
                window.feedController.refreshFeed();
            }
        }, 1000);
    }
};

console.log('✅ Global connectors loaded');