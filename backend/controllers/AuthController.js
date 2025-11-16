const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthController {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'huddle-tennis-secret-key-change-in-production';
    }

    // Generate JWT token
    generateToken(userId) {
        return jwt.sign({ userId }, this.jwtSecret, { expiresIn: '30d' });
    }

    // Register new user
    async register(req, res) {
        try {
            const { username, email, password, displayName, accountType } = req.body;

            // Validation
            if (!username || !email || !password || !displayName) {
                return res.status(400).json({
                    success: false,
                    error: 'All fields are required'
                });
            }

            if (!accountType || !['player', 'coach', 'parent'].includes(accountType)) {
                return res.status(400).json({
                    success: false,
                    error: 'Valid account type is required (player, coach, or parent)'
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email: email.toLowerCase() }, { username }]
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: existingUser.email === email.toLowerCase()
                        ? 'Email already registered'
                        : 'Username already taken'
                });
            }

            // Create new user
            const user = new User({
                username,
                email: email.toLowerCase(),
                password,
                displayName,
                accountType,
                status: 'active', // Auto-approve for now
                registrationIP: req.ip,
                createdAt: new Date()
            });

            await user.save();

            // Generate token
            const token = this.generateToken(user._id);

            // Return user data (without password)
            const userData = {
                id: user._id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                accountType: user.accountType,
                status: user.status,
                avatar: user.avatar,
                verified: user.verified
            };

            res.status(201).json({
                success: true,
                message: 'Account created successfully',
                token,
                user: userData
            });

            console.log(`✅ New ${accountType} registered: ${username} (${email})`);

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Registration failed'
            });
        }
    }

    // Login user
    async login(req, res) {
        try {
            const { identifier, password } = req.body;

            // Validation
            if (!identifier || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email/username and password are required'
                });
            }

            // Find user by email or username
            const user = await User.findOne({
                $or: [
                    { email: identifier.toLowerCase() },
                    { username: identifier }
                ]
            }).select('+password');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }

            // Check password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }

            // Check if account is active
            if (user.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    error: `Account is ${user.status}. Please contact support.`
                });
            }

            // Update last login
            await user.updateLastLogin();

            // Generate token
            const token = this.generateToken(user._id);

            // Return user data (without password)
            const userData = {
                id: user._id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                accountType: user.accountType,
                status: user.status,
                avatar: user.avatar,
                verified: user.verified,
                stats: user.stats,
                seasonStats: user.seasonStats
            };

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: userData
            });

            console.log(`✅ ${user.accountType} logged in: ${user.username}`);

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed'
            });
        }
    }

    // Verify token (middleware)
    async verifyToken(req, res, next) {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided'
                });
            }

            const decoded = jwt.verify(token, this.jwtSecret);
            const user = await User.findById(decoded.userId);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token'
                });
            }

            req.user = user;
            next();

        } catch (error) {
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }
    }

    // Get current user
    async getCurrentUser(req, res) {
        try {
            const user = req.user;

            const userData = {
                id: user._id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                accountType: user.accountType,
                status: user.status,
                avatar: user.avatar,
                verified: user.verified,
                bio: user.bio,
                location: user.location,
                stats: user.stats,
                seasonStats: user.seasonStats,
                createdAt: user.createdAt
            };

            res.json({
                success: true,
                user: userData
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get user data'
            });
        }
    }
}

module.exports = new AuthController();
