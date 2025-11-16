const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const jwt = require('jsonwebtoken');

// Middleware to verify token (optional for profile viewing)
const authenticateOptional = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'huddle-secret-key');
            req.userId = decoded.userId || decoded.id || decoded._id;
        }
        next();
    } catch (error) {
        // Token invalid but continue anyway (for public profiles)
        next();
    }
};

// Get current user
router.get('/me', authenticateOptional, async (req, res) => {
    try {
        if (!req.userId) {
            return res.json({ success: false, error: 'Not authenticated' });
        }
        
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get user by username (simplified route)
router.get('/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        const user = await User.findOne({ username }).select('-password');
        
        if (!user) {
            return res.json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        // Add default stats if missing
        if (!user.stats) {
            user.stats = {
                posts: 0,
                followers: 0,
                following: 0,
                predictions: 0,
                accuracy: 0,
                wins: 0,
                losses: 0,
                streak: 0
            };
        }
        
        res.json({
            success: true,
            user
        });
        
    } catch (error) {
        console.error('Error fetching user:', error);
        res.json({ 
            success: false, 
            error: 'Failed to load user' 
        });
    }
});

// Get user profile by username (more detailed)
router.get('/profile/:username', authenticateOptional, async (req, res) => {
    try {
        const { username } = req.params;
        
        const user = await User.findOne({ username })
            .select('-password')
            .lean();
        
        if (!user) {
            return res.json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        // Add follower status if logged in
        if (req.userId) {
            const currentUser = await User.findById(req.userId);
            user.isFollowing = currentUser?.following?.includes(user._id) || false;
        }
        
        res.json({
            success: true,
            user
        });
        
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.json({ 
            success: false, 
            error: 'Failed to load profile' 
        });
    }
});

// Update user profile
router.put('/profile/update', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.json({ success: false, error: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'huddle-secret-key');
        const userId = decoded.userId || decoded.id || decoded._id;
        
        const { displayName, bio, location } = req.body;
        
        const updates = {};
        if (displayName) updates.displayName = displayName;
        if (bio !== undefined) updates.bio = bio;
        if (location !== undefined) updates.location = location;
        
        const user = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true }
        ).select('-password');
        
        res.json({
            success: true,
            user
        });
        
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Comprehensive profile update (for new profile editor)
router.put('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.json({ success: false, error: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'huddle-secret-key');
        const userId = decoded.userId || decoded.id || decoded._id;
        
        // Extract all possible update fields
        const {
            displayName,
            bio,
            location,
            website,
            avatar,
            favoriteTeam,
            bettingStyle,
            publicPicks,
            paymentMethods,
            socialLinks,
            notifications,
            privateProfile,
            hideStats,
            requireApproval
        } = req.body;
        
        // Build updates object with all provided fields
        const updates = {};
        
        // Basic info
        if (displayName !== undefined) updates.displayName = displayName;
        if (bio !== undefined) updates.bio = bio.substring(0, 160); // Enforce 160 char limit
        if (location !== undefined) updates.location = location;
        if (website !== undefined) updates.website = website;
        
        // Avatar handling (base64 or URL)
        if (avatar !== undefined) {
            // If it's base64 data, you might want to save it to disk or cloud storage
            // For now, we'll store it directly (consider using CDN in production)
            updates.avatar = avatar;
        }
        
        // Sports preferences
        if (favoriteTeam !== undefined) updates.favoriteTeam = favoriteTeam;
        if (bettingStyle !== undefined) updates.bettingStyle = bettingStyle;
        if (publicPicks !== undefined) updates.publicPicks = publicPicks;
        
        // Payment methods
        if (paymentMethods !== undefined) {
            updates.paymentMethods = {
                venmo: paymentMethods.venmo || '',
                cashapp: paymentMethods.cashapp || '',
                paypal: paymentMethods.paypal || '',
                zelle: paymentMethods.zelle || ''
            };
        }
        
        // Social links
        if (socialLinks !== undefined) {
            updates.socialLinks = {
                twitter: socialLinks.twitter || '',
                instagram: socialLinks.instagram || '',
                discord: socialLinks.discord || ''
            };
        }
        
        // Notification settings
        if (notifications !== undefined) {
            updates.notifications = {
                follows: notifications.follows !== false,
                likes: notifications.likes !== false,
                comments: notifications.comments !== false,
                bets: notifications.bets !== false,
                lineMovement: notifications.lineMovement !== false
            };
        }
        
        // Privacy settings
        if (privateProfile !== undefined) updates.privateProfile = privateProfile;
        if (hideStats !== undefined) updates.hideStats = hideStats;
        if (requireApproval !== undefined) updates.requireApproval = requireApproval;
        
        // Update user
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.json({ success: false, error: 'User not found' });
        }
        
        res.json({
            success: true,
            user,
            message: 'Profile updated successfully'
        });
        
    } catch (error) {
        console.error('Profile update error:', error);
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Follow user
router.post('/:userId/follow', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.json({ success: false, error: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'huddle-secret-key');
        const currentUserId = decoded.userId || decoded.id || decoded._id;
        const targetUserId = req.params.userId;
        
        if (currentUserId === targetUserId) {
            return res.json({ 
                success: false, 
                error: 'Cannot follow yourself' 
            });
        }
        
        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);
        
        if (!targetUser) {
            return res.json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        // Initialize arrays if they don't exist
        if (!currentUser.following) currentUser.following = [];
        if (!targetUser.followers) targetUser.followers = [];
        
        // Check if already following (handle both string and ObjectId)
        const isFollowing = currentUser.following.some(
            id => id.toString() === targetUserId.toString()
        );
        
        if (isFollowing) {
            return res.json({ 
                success: true, 
                message: 'Already following this user',
                stats: currentUser.stats || {}
            });
        }
        
        // Add to following
        currentUser.following.push(targetUserId);
        targetUser.followers.push(currentUserId);
        
        // Update stats
        if (!currentUser.stats) currentUser.stats = {};
        if (!targetUser.stats) targetUser.stats = {};
        currentUser.stats.following = currentUser.following.length;
        targetUser.stats.followers = targetUser.followers.length;
        
        await currentUser.save();
        await targetUser.save();
        
        res.json({
            success: true,
            message: 'Successfully followed user',
            stats: currentUser.stats,
            targetStats: targetUser.stats,
            isFollowing: true
        });
        
    } catch (error) {
        console.error('Follow error:', error);
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Unfollow user
router.post('/:userId/unfollow', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.json({ success: false, error: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'huddle-secret-key');
        const currentUserId = decoded.userId || decoded.id || decoded._id;
        const targetUserId = req.params.userId;
        
        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);
        
        if (!targetUser) {
            return res.json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        // Initialize arrays if they don't exist
        if (!currentUser.following) currentUser.following = [];
        if (!targetUser.followers) targetUser.followers = [];
        
        // Remove from following (handle both string and ObjectId)
        const followIndex = currentUser.following.findIndex(
            id => id.toString() === targetUserId.toString()
        );
        
        if (followIndex === -1) {
            return res.json({ 
                success: true, 
                message: 'Not following this user',
                stats: currentUser.stats || {}
            });
        }
        
        // Remove from arrays
        currentUser.following.splice(followIndex, 1);
        
        const followerIndex = targetUser.followers.findIndex(
            id => id.toString() === currentUserId.toString()
        );
        if (followerIndex !== -1) {
            targetUser.followers.splice(followerIndex, 1);
        }
        
        // Update stats
        if (!currentUser.stats) currentUser.stats = {};
        if (!targetUser.stats) targetUser.stats = {};
        currentUser.stats.following = currentUser.following.length;
        targetUser.stats.followers = targetUser.followers.length;
        
        await currentUser.save();
        await targetUser.save();
        
        res.json({
            success: true,
            message: 'Successfully unfollowed user',
            stats: currentUser.stats,
            targetStats: targetUser.stats,
            isFollowing: false
        });
        
    } catch (error) {
        console.error('Unfollow error:', error);
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get user's followers
router.get('/:identifier/followers', authenticateOptional, async (req, res) => {
    try {
        const { identifier } = req.params;
        
        // Try to find by ID first, then by username
        let user;
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            // It's an ObjectId
            user = await User.findById(identifier)
                .populate('followers', '_id username displayName avatar verified stats')
                .select('followers');
        } else {
            // It's a username
            user = await User.findOne({ username: identifier })
                .populate('followers', '_id username displayName avatar verified stats')
                .select('followers');
        }
        
        if (!user) {
            return res.json({ 
                success: false, 
                error: 'User not found',
                followers: [] 
            });
        }
        
        res.json({
            success: true,
            followers: user.followers || [],
            count: (user.followers || []).length
        });
        
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.json({ 
            success: false, 
            error: error.message,
            followers: [] 
        });
    }
});

// Get user's following by userId (for follow service)
router.get('/:identifier/following', authenticateOptional, async (req, res) => {
    try {
        const { identifier } = req.params;
        
        // Try to find by ID first, then by username if that fails
        let user;
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            // It's an ObjectId
            user = await User.findById(identifier)
                .populate('following', '_id username displayName avatar verified stats')
                .select('following');
        } else {
            // It's a username
            user = await User.findOne({ username: identifier })
                .populate('following', '_id username displayName avatar verified stats')
                .select('following');
        }
        
        if (!user) {
            return res.json({ 
                success: false, 
                error: 'User not found',
                following: []
            });
        }
        
        res.json({
            success: true,
            following: user.following || [],
            count: (user.following || []).length
        });
        
    } catch (error) {
        console.error('Error fetching following:', error);
        res.json({ 
            success: false, 
            error: error.message,
            following: []
        });
    }
});

// Get user's posts
router.get('/:username/posts', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.json({ success: false, error: 'User not found' });
        }
        
        const posts = await Post.find({ author: user._id })
            .populate('author', 'username displayName verified avatar')
            .sort({ createdAt: -1 })
            .limit(20);
        
        res.json({ success: true, posts });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get user's predictions
router.get('/:username/predictions', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.json({ success: false, error: 'User not found' });
        }
        
        const predictions = await Post.find({ 
            author: user._id,
            type: 'prediction'
        })
        .sort({ createdAt: -1 })
        .limit(20);
        
        res.json({ success: true, predictions });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get user suggestions for "Who to follow"
router.get('/suggestions', authenticateOptional, async (req, res) => {
    try {
        const currentUserId = req.userId;
        const limit = parseInt(req.query.limit) || 5;
        
        let query = {};
        
        if (currentUserId) {
            // Get current user's following list
            const currentUser = await User.findById(currentUserId);
            const followingIds = currentUser?.following || [];
            
            // Exclude self and already following
            query._id = { 
                $nin: [...followingIds, currentUserId] 
            };
        }
        
        // Add quality filters
        query['stats.posts'] = { $gte: 0 }; // Changed from $gt to $gte to include users with 0 posts
        
        const suggestions = await User.find(query)
            .select('username displayName avatar verified stats bio favoriteTeam bettingStyle')
            .sort({ 
                'verified': -1,         // Verified users first
                'stats.followers': -1,  // Then by followers
                'stats.accuracy': -1,   // Then by accuracy
                'stats.posts': -1       // Then by activity
            })
            .limit(limit)
            .lean();
        
        // If not enough suggestions, add specific demo users
        if (suggestions.length < limit) {
            const demoUsernames = ['SharpMike', 'VegasVince', 'BamaJake', 'GeorgiaSarah', 'LanceCampusWager', 'JoshR', 'SeanS', 'SherwinG'];
            
            const existingSuggestionIds = suggestions.map(s => s._id.toString());
            const excludeIds = currentUserId ? [...existingSuggestionIds, currentUserId.toString()] : existingSuggestionIds;
            
            const demoUsers = await User.find({
                username: { $in: demoUsernames },
                _id: { $nin: excludeIds }
            })
            .select('username displayName avatar verified stats bio favoriteTeam bettingStyle')
            .limit(limit - suggestions.length)
            .lean();
            
            suggestions.push(...demoUsers);
        }
        
        res.json({
            success: true,
            suggestions: suggestions.map(user => ({
                _id: user._id.toString(),
                username: user.username,
                displayName: user.displayName || user.username,
                avatar: user.avatar,
                verified: user.verified || false,
                stats: {
                    followers: user.stats?.followers || 0,
                    following: user.stats?.following || 0,
                    accuracy: user.stats?.accuracy || 0,
                    posts: user.stats?.posts || 0
                },
                bio: user.bio,
                favoriteTeam: user.favoriteTeam,
                bettingStyle: user.bettingStyle
            }))
        });
        
    } catch (error) {
        console.error('Error getting suggestions:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            suggestions: []
        });
    }
});

module.exports = router;