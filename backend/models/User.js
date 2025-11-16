// Enhanced User Model with DegenCoin Currency System
// C:\Users\Redhe\OneDrive\Documents\Desktop\LifeOS-Industries\PickemSystem\models\User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // ==========================================
    // 🔐 EXISTING AUTHENTICATION & PROFILE
    // ==========================================
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [20, 'Username cannot exceed 20 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    accountType: {
        type: String,
        enum: ['player', 'coach', 'parent'],
        required: [true, 'Account type is required'],
        default: 'player'
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'rejected', 'suspended'],
        default: 'pending'
    },
    approvedBy: String,
    approvedAt: Date,
    approvalReason: String,
    registrationIP: String,
    referralSource: String,
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    displayName: {
        type: String,
        required: [true, 'Display name is required'],
        trim: true,
        maxlength: [30, 'Display name cannot exceed 30 characters']
    },
    
    // ==========================================
    // 🎨 ENHANCED PROFILE FIELDS (NEW)
    // ==========================================
    website: {
        type: String,
        default: '',
        maxlength: 100
    },
    
    favoriteTeam: {
        type: String,
        default: ''
    },
    
    bettingStyle: {
        type: String,
        enum: ['casual', 'serious', 'sharp', 'professional', 'degen'],
        default: 'casual'
    },
    
    publicPicks: {
        type: Boolean,
        default: true
    },
    
    // Payment methods for transactions
    paymentMethods: {
        venmo: { type: String, default: '' },
        cashapp: { type: String, default: '' },
        paypal: { type: String, default: '' },
        zelle: { type: String, default: '' }
    },
    
    // Social media links
    socialLinks: {
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
        discord: { type: String, default: '' }
    },
    
    // Notification preferences (separate from existing preferences.notifications)
    notifications: {
        follows: { type: Boolean, default: true },
        likes: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        bets: { type: Boolean, default: true },
        lineMovement: { type: Boolean, default: true }
    },
    
    // Privacy settings
    privateProfile: {
        type: Boolean,
        default: false
    },
    
    hideStats: {
        type: Boolean,
        default: false
    },
    
    requireApproval: {
        type: Boolean,
        default: false
    },

    // ==========================================
    // 💰 DEGENCOIN CURRENCY SYSTEM (NEW)
    // ==========================================
    coinWallet: {
        // Primary currency (earned + purchased)
        degenCoins: {
            type: Number,
            default: 100, // Welcome bonus
            min: 0
        },
        
        // Premium currency (real money purchases)
        premiumTokens: {
            type: Number,
            default: 0,
            min: 0
        },
        
        // Free currency from daily logins, wins, etc.
        freeCoins: {
            type: Number,
            default: 0,
            min: 0
        },
        
        // Lifetime spending tracker
        totalSpent: {
            type: Number,
            default: 0,
            min: 0
        },
        
        // Daily bonus system
dailyBonus: {
    streak: { type: Number, default: 0 },
    lastClaimed: { type: Date, default: null },
    todayAmount: { type: Number, default: 0 }
},

// Legacy field for compatibility
dailyEarnings: {
    today: { type: Number, default: 0 },
    lastEarnedDate: { type: Date, default: null },
    streak: { type: Number, default: 0 }
}
    },

    // ==========================================
    // 🎯 AI FEATURE CONFIGURATION
    // ==========================================
    aiFeatures: {
        // Basic Analysis (FREE for all users)
        basicAnalysis: {
            enabled: { type: Boolean, default: true },
            cost: { type: Number, default: 0 },
            description: { type: String, default: 'Free basic game analysis' }
        },
        
        // Spread Calculator
        spreadCalculator: {
            enabled: { type: Boolean, default: true },
            cost: { type: Number, default: 10 },
            description: { type: String, default: 'Calculate true spread value vs Vegas line' }
        },
        
        // Market Sentiment
        marketSentiment: {
            enabled: { type: Boolean, default: true },
            cost: { type: Number, default: 5 },
            description: { type: String, default: 'Sharp vs public money analysis' }
        },
        
        // Regression Predictor
        regressionPredictor: {
            enabled: { type: Boolean, default: true },
            cost: { type: Number, default: 8 },
            description: { type: String, default: 'Teams due for positive/negative regression' }
        },
        
        // Matchup Matrix (Premium)
        matchupMatrix: {
            enabled: { type: Boolean, default: false },
            cost: { type: Number, default: 15 },
            description: { type: String, default: 'Deep style matchup analysis' }
        },
        
        // Situational Analysis (Premium)
        situationalAnalysis: {
            enabled: { type: Boolean, default: false },
            cost: { type: Number, default: 8 },
            description: { type: String, default: 'Sandwich games, revenge spots, look-ahead' }
        },
        
        // Custom Analysis (VIP)
        customAnalysis: {
            enabled: { type: Boolean, default: false },
            cost: { type: Number, default: 25 },
            description: { type: String, default: 'Personalized AI analysis request' }
        }
    },

    // ==========================================
    // 📊 AI USAGE TRACKING
    // ==========================================
    aiUsage: {
        // Usage counters
        totalRequests: { type: Number, default: 0 },
        thisWeekRequests: { type: Number, default: 0 },
        weeklyResetDate: { type: Date, default: Date.now },
        
        // Feature-specific usage
        featureStats: {
            basicAnalysis: { 
                uses: { type: Number, default: 0 },
                lastUsed: { type: Date, default: null },
                averageAccuracy: { type: Number, default: 0 }
            },
            spreadCalculator: { 
                uses: { type: Number, default: 0 },
                lastUsed: { type: Date, default: null },
                averageAccuracy: { type: Number, default: 0 }
            },
            marketSentiment: {
                uses: { type: Number, default: 0 },
                lastUsed: { type: Date, default: null },
                averageAccuracy: { type: Number, default: 0 }
            },
            regressionPredictor: {
                uses: { type: Number, default: 0 },
                lastUsed: { type: Date, default: null },
                averageAccuracy: { type: Number, default: 0 }
            },
            matchupMatrix: {
                uses: { type: Number, default: 0 },
                lastUsed: { type: Date, default: null },
                averageAccuracy: { type: Number, default: 0 }
            },
            situationalAnalysis: {
                uses: { type: Number, default: 0 },
                lastUsed: { type: Date, default: null },
                averageAccuracy: { type: Number, default: 0 }
            },
            customAnalysis: {
                uses: { type: Number, default: 0 },
                lastUsed: { type: Date, default: null },
                averageAccuracy: { type: Number, default: 0 }
            }
        },
        
        // Favorite features (most used)
        favoriteFeatures: [String],
        weeklySpendingAverage: { type: Number, default: 0 }
    },

    // ==========================================
    // 💳 TRANSACTION HISTORY
    // ==========================================
    transactions: [{
        transactionId: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['purchase', 'spend', 'earn', 'bonus', 'refund'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            enum: ['degenCoins', 'premiumTokens', 'freeCoins'],
            default: 'degenCoins'
        },
        description: {
            type: String,
            required: true
        },
        
        // Feature-specific metadata
        metadata: {
            feature: String,
            gameId: String,
            week: Number,
            paymentMethod: String,
            packageType: String
        },
        
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'completed'
        },
        
        createdAt: { type: Date, default: Date.now }
    }],

    // ==========================================
    // 🏆 LOYALTY & REWARDS SYSTEM
    // ==========================================
    loyalty: {
        level: {
            type: String,
            enum: ['ROOKIE', 'VETERAN', 'PRO', 'EXPERT', 'LEGEND'],
            default: 'ROOKIE'
        },
        experience: { type: Number, default: 0 },
        nextLevelXP: { type: Number, default: 1000 },
        
        // Level-based benefits
        benefits: {
            coinMultiplier: { type: Number, default: 1.0 }, // 1.0x, 1.1x, 1.2x, etc.
            featureDiscount: { type: Number, default: 0 }, // 0%, 5%, 10%, 15%, 20%
            dailyBonusMultiplier: { type: Number, default: 1.0 }
        },
        
        // Achievements unlocked
        achievements: [{
            name: String,
            description: String,
            unlockedAt: { type: Date, default: Date.now },
            reward: {
                type: String, // 'coins', 'feature', 'discount'
                amount: Number
            }
        }]
    },

    // ==========================================
    // 🏈 EXISTING SEASON STATS (UNCHANGED)
    // ==========================================
    seasonStats: {
        currentSeason: { type: Number, default: 2025 },
        totalPicks: { type: Number, default: 0, min: 0 },
        correctPicks: { type: Number, default: 0, min: 0 },
        winRate: { type: Number, default: 0, min: 0, max: 100 },
        weeksPlayed: { type: Number, default: 0, min: 0 },
        currentStreak: { type: Number, default: 0 },
        bestStreak: { type: Number, default: 0, min: 0 },
        bestWeek: { type: String, default: '0-0' },
        worstWeek: { type: String, default: '0-0' },
        rank: { type: Number, default: 0, min: 0 },
        points: { type: Number, default: 0, min: 0 }
    },

    // ==========================================
    // 🔗 SOCIAL FEATURES
    // ==========================================
    bio: {
        type: String,
        maxlength: 160,
        default: ''
    },
    
    avatar: {
        type: String,
        default: null
    },
    
    verified: {
        type: Boolean,
        default: false
    },
    
    location: {
        type: String,
        default: ''
    },
    
    // Follow system
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // Groups
    groups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    
    // Platforms the user belongs to
    platforms: [{
        platformId: { type: String, required: true },
        name: { type: String, required: true },
        role: { 
            type: String, 
            enum: ['owner', 'admin', 'member'],
            default: 'member'
        },
        leagueCode: { type: String },
        joinedAt: { type: Date, default: Date.now }
    }],
    
    // Stats for social platform
    stats: {
        posts: {
            type: Number,
            default: 0
        },
        followers: {
            type: Number,
            default: 0
        },
        following: {
            type: Number,
            default: 0
        },
        predictions: {
            type: Number,
            default: 0
        },
        accuracy: {
            type: Number,
            default: 0
        }
    },
    
    preferences: {
        notifications: { type: Boolean, default: true },
        emailUpdates: { type: Boolean, default: false },
        weeklyReminders: { type: Boolean, default: true },
        favoriteTeams: { type: [String], default: [] },
        defaultGamesPerWeek: { type: Number, default: 5, min: 3, max: 5 },
        // NEW: League preferences
        leaguePreferences: {
            preferredBetTypes: { 
                type: [String], 
                enum: ['spread', 'moneyline', 'overunder', 'props'],
                default: ['spread'] 
            },
            preferredScoringSystem: { 
                type: String, 
                enum: ['standard', 'confidence', 'weighted'],
                default: 'standard' 
            },
            preferredDuration: { 
                type: Number, 
                default: 18 
            },
            autoJoinPublic: { 
                type: Boolean, 
                default: false 
            }
        },
        timezone: { type: String, default: 'America/New_York' },
        
        // NEW: Coin preferences
        autoTopUp: {
            enabled: { type: Boolean, default: false },
            threshold: { type: Number, default: 25 },
            amount: { type: Number, default: 100 }
        },
        
        spendingLimits: {
            daily: { type: Number, default: 200 },
            weekly: { type: Number, default: 1000 }
        }
    },

    subscription: {
        type: String,
        enum: ['free', 'premium', 'pro', 'vip'],
        default: 'free'
    },
    
    role: {
        type: String,
        enum: ['user', 'moderator', 'admin', 'superadmin'],
        default: 'user'
    },
    
    isAdmin: { type: Boolean, default: false },
    
    adminLevel: {
        type: Number,
        default: 0  // 0=user, 1=moderator, 2=admin, 3=superadmin
    },
    
    adminEmail: {
        type: String,
        default: null
    },
    lastLogin: { type: Date, default: Date.now },
    lastPickSubmission: { type: Date, default: null },
    totalLogins: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// ==========================================
// 💰 DEGENCOIN SYSTEM METHODS
// ==========================================

// Purchase coins (integrates with Stripe later)
userSchema.methods.purchaseCoins = async function(packageType, paymentId = null) {
    const packages = {
        'trial': { coins: 100, cost: 1.00, bonus: 0 },
        'starter': { coins: 500, cost: 5.00, bonus: 100 }, // 20% bonus
        'value': { coins: 1200, cost: 10.00, bonus: 200 }, // 17% bonus  
        'whale': { coins: 2800, cost: 20.00, bonus: 700 }, // 25% bonus
        'degen': { coins: 7500, cost: 50.00, bonus: 2500 } // 33% bonus
    };
    
    const pkg = packages[packageType];
    if (!pkg) {
        throw new Error('Invalid package type');
    }
    
    const totalCoins = pkg.coins + pkg.bonus;
    this.coinWallet.degenCoins += totalCoins;
    
    // Add transaction record
    const transaction = {
        transactionId: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'purchase',
        amount: totalCoins,
        currency: 'degenCoins',
        description: `Purchased ${pkg.coins} coins + ${pkg.bonus} bonus ($${pkg.cost})`,
        metadata: {
            packageType: packageType,
            paymentMethod: paymentId ? 'stripe' : 'test',
            baseCoins: pkg.coins,
            bonusCoins: pkg.bonus
        }
    };
    
    this.transactions.push(transaction);
    
    // Add XP for purchase
    await this.addExperience(Math.floor(pkg.cost * 10));
    
    console.log(`💰 ${this.username} purchased ${totalCoins} DegenCoins for $${pkg.cost}`);
    
    return this.save();
};

// Spend coins for AI features
userSchema.methods.spendCoins = async function(amount, feature, description, gameId = null, week = null) {
    // Check if user has enough coins
    if (this.coinWallet.degenCoins < amount) {
        throw new Error(`Insufficient DegenCoins. Need ${amount}, have ${this.coinWallet.degenCoins}`);
    }
    
    // Apply loyalty discount
    const discount = this.loyalty.benefits.featureDiscount / 100;
    const finalAmount = Math.ceil(amount * (1 - discount));
    
    // Deduct coins
    this.coinWallet.degenCoins -= finalAmount;
    this.coinWallet.totalSpent += finalAmount;
    
    // Add transaction record
    const transaction = {
        transactionId: `spend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'spend',
        amount: -finalAmount,
        currency: 'degenCoins',
        description: description,
        metadata: {
            feature: feature,
            gameId: gameId,
            week: week,
            originalCost: amount,
            discountApplied: discount
        }
    };
    
    this.transactions.push(transaction);
    
    // Track feature usage
    if (this.aiUsage.featureStats[feature]) {
        this.aiUsage.featureStats[feature].uses += 1;
        this.aiUsage.featureStats[feature].lastUsed = new Date();
    }
    
    // Update total counters
    this.aiUsage.totalRequests += 1;
    this.aiUsage.thisWeekRequests += 1;
    
    // Add XP for using features
    await this.addExperience(Math.floor(finalAmount / 2));
    
    console.log(`🎯 ${this.username} spent ${finalAmount} coins on ${feature} (${discount > 0 ? discount*100+'% discount' : 'no discount'})`);
    
    return this.save();
};

// Add coins (bonuses, rewards, etc.)
userSchema.methods.addCoins = async function(amount, type = 'bonus', description = 'Bonus coins', source = 'system') {
    // Apply loyalty multiplier for earned coins
    let finalAmount = amount;
    if (type === 'earn' || type === 'bonus') {
        finalAmount = Math.floor(amount * this.loyalty.benefits.coinMultiplier);
    }
    
    this.coinWallet.degenCoins += finalAmount;
    
    // Add transaction record
    const transaction = {
        transactionId: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: type,
        amount: finalAmount,
        currency: 'degenCoins',
        description: description,
        metadata: {
            source: source,
            originalAmount: amount,
            multiplierApplied: this.loyalty.benefits.coinMultiplier
        }
    };
    
    this.transactions.push(transaction);
    
    console.log(`💵 ${this.username} earned ${finalAmount} DegenCoins: ${description}`);
    
    return this.save();
};

// Daily login bonus
userSchema.methods.claimDailyBonus = async function() {
    const today = new Date().toDateString();
    const lastClaimed = this.coinWallet.dailyBonus.lastClaimed ? 
                       new Date(this.coinWallet.dailyBonus.lastClaimed).toDateString() : null;
    
    if (today === lastClaimed) {
        throw new Error('Daily bonus already claimed today');
    }
    
    // Calculate streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = lastClaimed === yesterday.toDateString();
    
    if (wasYesterday) {
        this.coinWallet.dailyBonus.streak += 1;
    } else {
        this.coinWallet.dailyBonus.streak = 1;
    }
    
    // Calculate bonus (base 25 + streak bonus, max 100)
    const baseBonus = 25;
    const streakBonus = Math.min(this.coinWallet.dailyBonus.streak * 5, 75);
    const loyaltyMultiplier = this.loyalty.benefits.dailyBonusMultiplier;
    const totalBonus = Math.floor((baseBonus + streakBonus) * loyaltyMultiplier);
    
    // Add coins
    await this.addCoins(
        totalBonus, 
        'bonus', 
        `Daily login bonus (${this.coinWallet.dailyBonus.streak} day streak)`,
        'daily_login'
    );
    
    // Update daily bonus tracking
    this.coinWallet.dailyBonus.lastClaimed = new Date();
    this.coinWallet.dailyBonus.todayAmount = totalBonus;
    
    // Add XP
    await this.addExperience(this.coinWallet.dailyBonus.streak * 10);
    
    return this.save();
};

// Check if user can afford a feature (with discount)
userSchema.methods.canAfford = function(feature) {
    const featureConfig = this.aiFeatures[feature];
    if (!featureConfig) {
        throw new Error(`Feature '${feature}' not found`);
    }
    
    const baseCost = featureConfig.cost;
    const discount = this.loyalty.benefits.featureDiscount / 100;
    const finalCost = Math.ceil(baseCost * (1 - discount));
    
    return {
        canAfford: this.coinWallet.degenCoins >= finalCost,
        baseCost: baseCost,
        finalCost: finalCost,
        discount: discount,
        currentBalance: this.coinWallet.degenCoins,
        needed: Math.max(0, finalCost - this.coinWallet.degenCoins)
    };
};

// Use AI feature (full workflow)
userSchema.methods.useAIFeature = async function(feature, gameId, description) {
    // Check if feature exists and is enabled
    const featureConfig = this.aiFeatures[feature];
    if (!featureConfig) {
        throw new Error(`AI feature '${feature}' not found`);
    }
    
    if (!featureConfig.enabled) {
        throw new Error(`AI feature '${feature}' not enabled for your subscription level`);
    }
    
    // Check affordability
    const affordability = this.canAfford(feature);
    if (!affordability.canAfford) {
        throw new Error(`Insufficient DegenCoins. Need ${affordability.finalCost}, have ${affordability.currentBalance}`);
    }
    
    // Spend coins (if not free)
    if (affordability.finalCost > 0) {
        await this.spendCoins(
            affordability.baseCost, 
            feature, 
            description || `${featureConfig.description} analysis`,
            gameId
        );
    }
    
    return {
        success: true,
        coinsSpent: affordability.finalCost,
        description: description || featureConfig.description
    };
};

// ==========================================
// 🏆 LOYALTY SYSTEM METHODS
// ==========================================

// Add experience and handle level ups
userSchema.methods.addExperience = async function(xp) {
    this.loyalty.experience += xp;
    
    // Check for level up
    while (this.loyalty.experience >= this.loyalty.nextLevelXP) {
        await this.levelUp();
    }
    
    return this.save();
};

// Level up logic
userSchema.methods.levelUp = async function() {
    const levels = ['ROOKIE', 'VETERAN', 'PRO', 'EXPERT', 'LEGEND'];
    const currentIndex = levels.indexOf(this.loyalty.level);
    
    if (currentIndex < levels.length - 1) {
        const oldLevel = this.loyalty.level;
        this.loyalty.level = levels[currentIndex + 1];
        
        // Update XP requirement (50% increase each level)
        this.loyalty.experience -= this.loyalty.nextLevelXP;
        this.loyalty.nextLevelXP = Math.floor(this.loyalty.nextLevelXP * 1.5);
        
        // Update benefits
        this.loyalty.benefits.coinMultiplier = 1.0 + (currentIndex + 1) * 0.05; // +5% per level
        this.loyalty.benefits.featureDiscount = Math.min(25, (currentIndex + 1) * 5); // +5% per level, max 25%
        this.loyalty.benefits.dailyBonusMultiplier = 1.0 + (currentIndex + 1) * 0.1; // +10% per level
        
        // Level up reward
        const coinReward = 250 * (currentIndex + 2); // 500, 750, 1000, 1250
        await this.addCoins(coinReward, 'bonus', `Level up to ${this.loyalty.level}!`, 'level_up');
        
        // Add achievement
        this.loyalty.achievements.push({
            name: `Level ${this.loyalty.level}`,
            description: `Reached ${this.loyalty.level} loyalty level`,
            reward: {
                type: 'coins',
                amount: coinReward
            }
        });
        
        console.log(`🎉 ${this.username} leveled up from ${oldLevel} to ${this.loyalty.level}! Reward: ${coinReward} coins`);
    }
    
    return this.save();
};

// ==========================================
// 📊 UTILITY METHODS
// ==========================================

// Get wallet summary for UI
userSchema.methods.getWalletSummary = function() {
    return {
        balances: {
            degenCoins: this.coinWallet.degenCoins,
            premiumTokens: this.coinWallet.premiumTokens,
            freeCoins: this.coinWallet.freeCoins
        },
        
        dailyBonus: {
            available: !this.coinWallet.dailyBonus.lastClaimed || 
                      new Date().toDateString() !== new Date(this.coinWallet.dailyBonus.lastClaimed).toDateString(),
            streak: this.coinWallet.dailyBonus.streak,
            todayAmount: this.coinWallet.dailyBonus.todayAmount
        },
        
        loyalty: {
            level: this.loyalty.level,
            experience: this.loyalty.experience,
            nextLevelXP: this.loyalty.nextLevelXP,
            progress: Math.floor((this.loyalty.experience / this.loyalty.nextLevelXP) * 100),
            benefits: this.loyalty.benefits
        },
        
        usage: {
            totalRequests: this.aiUsage.totalRequests,
            thisWeekRequests: this.aiUsage.thisWeekRequests,
            totalSpent: this.coinWallet.totalSpent
        }
    };
};

// Get AI feature pricing (with discounts applied)
userSchema.methods.getAIFeaturePricing = function() {
    const pricing = {};
    
    Object.keys(this.aiFeatures).forEach(featureName => {
        const feature = this.aiFeatures[featureName];
        const affordability = this.canAfford(featureName);
        
        pricing[featureName] = {
            name: feature.description,
            enabled: feature.enabled,
            baseCost: feature.cost,
            finalCost: affordability.finalCost,
            discount: Math.floor(affordability.discount * 100),
            canAfford: affordability.canAfford,
            uses: this.aiUsage.featureStats[featureName]?.uses || 0
        };
    });
    
    return pricing;
};

// Get recent transactions
userSchema.methods.getRecentTransactions = function(limit = 10) {
    return this.transactions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
};

// ==========================================
// 🏈 EXISTING METHODS (UNCHANGED)
// ==========================================

// Compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Update season statistics
userSchema.methods.updateSeasonStats = function(weeklyResult) {
    const { correct, total, weekRecord } = weeklyResult;
    
    this.seasonStats.totalPicks += total;
    this.seasonStats.correctPicks += correct;
    this.seasonStats.weeksPlayed += 1;
    
    // Update win rate
    this.seasonStats.winRate = parseFloat(
        ((this.seasonStats.correctPicks / this.seasonStats.totalPicks) * 100).toFixed(1)
    );
    
    // Update streak
    if (correct >= Math.ceil(total * 0.6)) { // 60% or better = good week
        this.seasonStats.currentStreak += 1;
        
        // Reward for good week
        const bonusCoins = 50 + (this.seasonStats.currentStreak * 10);
        this.addCoins(bonusCoins, 'bonus', `Good week bonus: ${correct}/${total}`, 'weekly_performance');
    } else {
        this.seasonStats.currentStreak = 0;
    }
    
    // Update best streak
    if (this.seasonStats.currentStreak > this.seasonStats.bestStreak) {
        this.seasonStats.bestStreak = this.seasonStats.currentStreak;
    }
    
    // Update best/worst weeks
    const currentWeekScore = correct / total;
    const bestWeekScore = parseFloat(this.seasonStats.bestWeek.split('-')[0]) / 
                          (parseFloat(this.seasonStats.bestWeek.split('-')[0]) + 
                           parseFloat(this.seasonStats.bestWeek.split('-')[1]));
    
    if (currentWeekScore > bestWeekScore) {
        this.seasonStats.bestWeek = weekRecord;
    }
    
    // Calculate points (correct picks + bonuses)
    this.seasonStats.points = this.seasonStats.correctPicks + 
                              (this.seasonStats.weeksPlayed * 0.1) + // Participation bonus
                              (this.seasonStats.winRate >= 60 ? 5 : 0); // Accuracy bonus
    
    // Add XP for playing
    this.addExperience(correct * 25 + total * 5); // XP based on performance
    
    return this.save();
};

// Get user's season summary
userSchema.methods.getSeasonSummary = function() {
    return {
        username: this.username,
        displayName: this.displayName,
        rank: this.seasonStats.rank,
        record: `${this.seasonStats.correctPicks}-${this.seasonStats.totalPicks - this.seasonStats.correctPicks}`,
        winRate: this.seasonStats.winRate,
        weeksPlayed: this.seasonStats.weeksPlayed,
        bestWeek: this.seasonStats.bestWeek,
        currentStreak: this.seasonStats.currentStreak,
        points: this.seasonStats.points,
        loyaltyLevel: this.loyalty.level,
        totalCoinsSpent: this.coinWallet.totalSpent
    };
};

// Update last login
userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    this.totalLogins += 1;
    
    // Bonus for frequent logins
    if (this.totalLogins % 7 === 0) { // Every 7th login
        this.addCoins(25, 'bonus', `Frequent player bonus (${this.totalLogins} logins)`, 'login_frequency');
    }
    
    return this.save();
};

// ==========================================
// 🔒 PRE-SAVE MIDDLEWARE
// ==========================================

userSchema.pre('save', async function(next) {
    // Hash password if modified
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        const salt = bcrypt.genSaltSync(10);
this.password = bcrypt.hashSync(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.pre('save', function(next) {
    // Update timestamps
    this.updatedAt = Date.now();
    
    // Update win rate calculation
    if (this.seasonStats.totalPicks > 0) {
        this.seasonStats.winRate = parseFloat(
            ((this.seasonStats.correctPicks / this.seasonStats.totalPicks) * 100).toFixed(1)
        );
    }
    
    // Update best streak
    if (this.seasonStats.currentStreak > this.seasonStats.bestStreak) {
        this.seasonStats.bestStreak = this.seasonStats.currentStreak;
    }
    
    // Reset weekly AI usage if needed
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    if (this.aiUsage.weeklyResetDate < oneWeekAgo) {
        this.aiUsage.thisWeekRequests = 0;
        this.aiUsage.weeklyResetDate = new Date();
    }
    
    next();
});

// ==========================================
// 📊 STATIC METHODS
// ==========================================

// Find user by credentials
userSchema.statics.findByCredentials = async function(identifier, password) {
    const user = await this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { username: identifier }
        ]
    }).select('+password');
    
    if (!user) {
        throw new Error('Invalid credentials');
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }
    
    return user;
};

// Get leaderboard with coin stats
userSchema.statics.getLeaderboard = async function(season = 2025, limit = 50) {
    return this.find({
        'seasonStats.currentSeason': season,
        'seasonStats.totalPicks': { $gt: 0 },
        isActive: true
    })
    .sort({
        'seasonStats.winRate': -1,
        'seasonStats.correctPicks': -1,
        'seasonStats.points': -1
    })
    .limit(limit)
    .select('username displayName seasonStats loyalty.level coinWallet.totalSpent createdAt');
};

// Update rankings for all users
userSchema.statics.updateRankings = async function(season = 2025) {
    const users = await this.find({
        'seasonStats.currentSeason': season,
        'seasonStats.totalPicks': { $gt: 0 },
        isActive: true
    })
    .sort({
        'seasonStats.winRate': -1,
        'seasonStats.correctPicks': -1,
        'seasonStats.points': -1
    });
    
    const updatePromises = users.map((user, index) => {
        user.seasonStats.rank = index + 1;
        return user.save();
    });
    
    return Promise.all(updatePromises);
};

module.exports = mongoose.model('User', userSchema);