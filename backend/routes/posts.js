const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            // Allow guest access but with no user
            req.userId = null;
            return next();
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'huddle-secret-key');
        req.userId = decoded.userId || decoded.id || decoded._id;
        
        console.log('Auth middleware - userId:', req.userId);
        next();
    } catch (error) {
        console.error('Auth error:', error);
        req.userId = null;
        next();
    }
};

// Require auth middleware for protected routes
const requireAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Please authenticate' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'huddle-secret-key');
        req.userId = decoded.userId || decoded.id || decoded._id;
        
        console.log('Auth middleware - userId:', req.userId);
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Please authenticate' });
    }
};

// Get feed posts
router.get('/feed', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const posts = await Post.find({ visibility: 'public' })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .populate('author', 'username displayName avatar verified')
            .populate('comments.author', 'username displayName avatar')
            .populate('challengeBet.acceptedBy', 'username displayName');
            
        res.json({
            success: true,
            posts,
            page,
            hasMore: posts.length === limit
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Create a post
router.post('/', requireAuth, async (req, res) => {
    try {
        const { content, type, prediction, groupInvite, challengeBet, media, location, taggedGame } = req.body;
        
        const post = new Post({
            author: req.userId,
            content,
            type: type || 'post',
            prediction,
            groupInvite,
            media: media || [],
            location: location ? { name: location } : null,
            taggedGame
        });
        
        if (type === 'challenge_bet' && challengeBet) {
            post.challengeBet = {
                amount: challengeBet.amount,
                maxOpponents: challengeBet.maxOpponents,
                side: challengeBet.side,
                betType: challengeBet.betType,
                game: challengeBet.game,
                status: 'open',
                participants: [],
                acceptedBy: [],
                createdBy: req.userId
            };
        }
        
        await post.save();
        await post.populate('author', 'username displayName avatar verified');
        
        await User.findByIdAndUpdate(req.userId, { $inc: { 'stats.posts': 1 } });
        
        res.json({
            success: true,
            post
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Like/unlike a post
router.post('/:postId/like', requireAuth, async (req, res) => {
    try {
        console.log('LIKE ROUTE HIT:', {
            postId: req.params.postId,
            userId: req.userId
        });
        
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.json({ success: false, error: 'Post not found' });
        }
        
        // Check if user already liked
        const existingLikeIndex = post.likes.findIndex(
            like => like.user.toString() === req.userId
        );
        
        const isLiking = existingLikeIndex === -1;
        
        if (existingLikeIndex > -1) {
            // Unlike
            post.likes.splice(existingLikeIndex, 1);
        } else {
            // Like
            post.likes.push({
                user: req.userId,
                type: 'like'
            });
        }
        
        await post.save();
        
        // Create notification for post author if someone liked their post
        if (isLiking && post.author.toString() !== req.userId) {
            console.log('Creating like notification for author:', post.author.toString());
            
            const Notification = require('../models/Notification');
            const liker = await User.findById(req.userId).select('username displayName');
            
            try {
                const notif = await Notification.create({
                    recipient: post.author,
                    sender: req.userId,
                    type: 'like',
                    message: `${liker.displayName || liker.username} liked your post`,
                    data: {
                        postId: post._id
                    }
                });
                console.log('Like notification created:', notif);
            } catch (notifError) {
                console.error('Failed to create like notification:', notifError);
            }
        }
        
        res.json({
            success: true,
            liked: isLiking,
            likes: post.likes.filter(l => l.type === 'like').length
        });
    } catch (error) {
        console.error('Like route error:', error);
        res.json({ success: false, error: error.message });
    }
});

// Dislike/undislike a post
router.post('/:postId/dislike', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.json({ success: false, error: 'Post not found' });
        }
        
        const existingDislikeIndex = post.likes.findIndex(
            like => like.user.toString() === req.userId && like.type === 'dislike'
        );
        
        if (existingDislikeIndex > -1) {
            post.likes.splice(existingDislikeIndex, 1);
        } else {
            const existingLikeIndex = post.likes.findIndex(
                like => like.user.toString() === req.userId && like.type === 'like'
            );
            
            if (existingLikeIndex > -1) {
                post.likes.splice(existingLikeIndex, 1);
            }
            
            post.likes.push({
                user: req.userId,
                type: 'dislike'
            });
        }
        
        await post.save();
        
        const dislikeCount = post.likes.filter(l => l.type === 'dislike').length;
        
        res.json({
            success: true,
            disliked: existingDislikeIndex === -1,
            dislikes: dislikeCount
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Add comment
router.post('/:postId/comment', requireAuth, async (req, res) => {
    try {
        const { content } = req.body;
        
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.json({ success: false, error: 'Post not found' });
        }
        
        const newComment = {
            author: req.userId,
            content: content,
            likes: [],
            replies: [],
            createdAt: new Date()
        };
        
        post.comments.push(newComment);
        
        await post.save();
        await post.populate('comments.author', 'username displayName avatar');
        
        // Create notification for post author if someone commented
        if (post.author.toString() !== req.userId) {
            console.log('Creating comment notification for author:', post.author.toString());
            
            const Notification = require('../models/Notification');
            const commenter = await User.findById(req.userId).select('username displayName');
            
            try {
                const notif = await Notification.create({
                    recipient: post.author,
                    sender: req.userId,
                    type: 'comment',
                    message: `${commenter.displayName || commenter.username} commented on your post`,
                    data: {
                        postId: post._id,
                        commentId: post.comments[post.comments.length - 1]._id
                    }
                });
                console.log('Comment notification created:', notif);
            } catch (notifError) {
                console.error('Failed to create comment notification:', notifError);
            }
        }
        
        res.json({
            success: true,
            comment: post.comments[post.comments.length - 1]
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get comments for a post
router.get('/:postId/comments', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
            .populate('comments.author', 'username displayName verified avatar');
        
        if (!post) {
            return res.json({ success: false, error: 'Post not found' });
        }
        
        res.json({
            success: true,
            comments: post.comments || []
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get single post
router.get('/:postId', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
            .populate('author', 'username displayName verified avatar');
        
        if (!post) {
            return res.json({ success: false, error: 'Post not found' });
        }
        
        res.json({
            success: true,
            post
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Accept a challenge bet
router.post('/:postId/accept-bet', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.json({ success: false, error: 'Post not found' });
        }
        
        if (!post.challengeBet) {
            return res.json({ success: false, error: 'This is not a challenge bet' });
        }
        
        if (post.challengeBet.status !== 'open') {
            return res.json({ success: false, error: 'Bet is no longer open' });
        }
        
        if (!post.challengeBet.acceptedBy) {
            post.challengeBet.acceptedBy = [];
        }
        
        const alreadyAccepted = post.challengeBet.acceptedBy.some(
            userId => userId.toString() === req.userId
        );
        
        if (alreadyAccepted) {
            return res.json({ success: false, error: 'You already accepted this bet' });
        }
        
        if (post.challengeBet.acceptedBy.length >= post.challengeBet.maxOpponents) {
            return res.json({ success: false, error: 'Bet is full' });
        }
        
        post.challengeBet.acceptedBy.push(req.userId);
        
        const user = await User.findById(req.userId).select('username displayName');
        
        if (post.challengeBet.acceptedBy.length >= post.challengeBet.maxOpponents) {
            post.challengeBet.status = 'locked';
        }
        
        await post.save();
        
        // Create notification for bet creator
        if (post.author.toString() !== req.userId) {
            const Notification = require('../models/Notification');
            try {
                await Notification.create({
                    recipient: post.author,
                    sender: req.userId,
                    type: 'bet_accepted',
                    message: `${user.displayName || user.username} accepted your challenge bet!`,
                    data: {
                        postId: post._id,
                        amount: post.challengeBet.amount
                    }
                });
                console.log('Bet accepted notification created');
            } catch (notifError) {
                console.error('Failed to create bet notification:', notifError);
            }
        }
        
        res.json({
            success: true,
            message: 'Bet accepted!',
            participant: {
                _id: user._id,
                username: user.username,
                displayName: user.displayName || user.username
            },
            acceptedCount: post.challengeBet.acceptedBy.length,
            maxCount: post.challengeBet.maxOpponents,
            status: post.challengeBet.status
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Cancel a challenge bet
router.post('/:postId/cancel-bet', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.json({ success: false, error: 'Post not found' });
        }
        
        if (!post.challengeBet) {
            return res.json({ success: false, error: 'This is not a challenge bet' });
        }
        
        if (post.author.toString() !== req.userId) {
            return res.json({ success: false, error: 'Only the creator can cancel this bet' });
        }
        
        if (post.challengeBet.game && post.challengeBet.game.gameTime) {
            const gameTime = new Date(post.challengeBet.game.gameTime);
            const cutoffTime = new Date(gameTime.getTime() - 60000);
            const now = new Date();
            
            if (now >= cutoffTime) {
                return res.json({ 
                    success: false, 
                    error: 'Cannot cancel bet - game is about to start or has started' 
                });
            }
        }
        
        if (post.challengeBet.status === 'completed') {
            return res.json({ success: false, error: 'Cannot cancel a completed bet' });
        }
        
        const wasLocked = post.challengeBet.status === 'locked';
        const participantCount = post.challengeBet.acceptedBy.length;
        
        post.challengeBet.status = 'cancelled';
        
        await post.save();
        
        if (wasLocked && participantCount > 0) {
            console.log(`Notifying ${participantCount} participants that bet was cancelled`);
        }
        
        res.json({ 
            success: true, 
            message: wasLocked 
                ? `Bet cancelled. ${participantCount} participants have been notified.`
                : 'Bet cancelled successfully',
            refundNeeded: wasLocked
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Leave a challenge bet
router.post('/:postId/leave-bet', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.json({ success: false, error: 'Post not found' });
        }
        
        if (!post.challengeBet) {
            return res.json({ success: false, error: 'This is not a challenge bet' });
        }
        
        if (post.challengeBet.game && post.challengeBet.game.gameTime) {
            const gameTime = new Date(post.challengeBet.game.gameTime);
            const cutoffTime = new Date(gameTime.getTime() - 60000);
            const now = new Date();
            
            if (now >= cutoffTime) {
                return res.json({ 
                    success: false, 
                    error: 'Cannot leave bet - game is about to start or has started' 
                });
            }
        }
        
        if (post.challengeBet.status === 'completed') {
            return res.json({ success: false, error: 'Cannot leave a completed bet' });
        }
        
        const index = post.challengeBet.acceptedBy.indexOf(req.userId);
        if (index === -1) {
            return res.json({ success: false, error: 'You have not accepted this bet' });
        }
        
        post.challengeBet.acceptedBy.splice(index, 1);
        
        post.challengeBet.participants = post.challengeBet.participants.filter(
            p => p.userId !== req.userId
        );
        
        if (post.challengeBet.acceptedBy.length === 0) {
            post.challengeBet.status = 'open';
        } else if (post.challengeBet.status === 'locked') {
            post.challengeBet.status = 'open';
        }
        
        await post.save();
        
        res.json({ 
            success: true, 
            message: 'You have left the bet',
            acceptedCount: post.challengeBet.acceptedBy.length,
            maxCount: post.challengeBet.maxOpponents
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Delete a post
router.delete('/:postId', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId).populate('author');
        
        if (!post) {
            return res.json({ success: false, error: 'Post not found' });
        }
        
        let authorId;
        if (post.author._id) {
            authorId = post.author._id.toString();
        } else {
            authorId = post.author.toString();
        }
        
        if (authorId !== req.userId) {
            return res.json({ success: false, error: 'You can only delete your own posts' });
        }
        
        await Post.findByIdAndDelete(req.params.postId);
        
        res.json({ 
            success: true, 
            message: 'Post deleted successfully' 
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.json({ success: false, error: error.message });
    }
});

module.exports = router;