// frontend/public/js/services/bet-service.js
class BetService {
    constructor() {
        this.apiBase = '/api';
    }

    async createBetChallenge(challengeData) {
        try {
            const response = await fetch(`${this.apiBase}/bets/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify({
                    challengerId: challengeData.challengerId || localStorage.getItem('userId') || 'demo-user',
                    gameId: typeof challengeData.game === 'object' ? challengeData.game.gameId : challengeData.game,
                    amount: challengeData.amount,
                    terms: `${challengeData.team} ${challengeData.spread}`,
                    betType: challengeData.betType || 'spread',
                    challengerPick: challengeData.team,
                    gameDetails: {
                        sport: challengeData.game?.sport || 'NFL',
                        homeTeam: challengeData.game?.homeTeam || challengeData.homeTeam,
                        awayTeam: challengeData.game?.awayTeam || challengeData.awayTeam,
                        startTime: challengeData.game?.gameTime || new Date()
                    },
                    paymentMethod: challengeData.paymentMethod
                })
            });

            const result = await response.json();
            
            if (result.success) {
                // Return the bet data - post creation is handled by post-creator.js
                console.log('✅ Bet created in database:', result.bet);
            }
            
            return result;
        } catch (error) {
            console.error('Failed to create bet challenge:', error);
            return { success: false, error: error.message };
        }
    }

    // Feed post creation is handled by post-creator.js, not here
    // async createFeedPost(bet, challengeData) {
    //     // Not needed - removed
    // }

    async acceptBetChallenge(betId, acceptorData) {
        try {
            const response = await fetch(`${this.apiBase}/bets/${betId}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify({
                    acceptorId: acceptorData.acceptorId || localStorage.getItem('userId') || 'demo-user-2',
                    acceptorPick: acceptorData.acceptorPick,
                    paymentMethod: acceptorData.paymentMethod
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Failed to accept bet:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserBets(userId) {
        try {
            const response = await fetch(`${this.apiBase}/bets/user/${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get user bets:', error);
            return { success: false, bets: [] };
        }
    }

    async confirmPaymentSent(betId) {
        try {
            const response = await fetch(`${this.apiBase}/bets/${betId}/payment-sent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: localStorage.getItem('userId') || 'demo-user'
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Failed to confirm payment:', error);
            return { success: false, error: error.message };
        }
    }

    async confirmPaymentReceived(betId) {
        try {
            const response = await fetch(`${this.apiBase}/bets/${betId}/payment-received`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: localStorage.getItem('userId') || 'demo-user'
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Failed to confirm payment received:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create global instance
window.betService = new BetService();

console.log('💰 Bet service loaded');