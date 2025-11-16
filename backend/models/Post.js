const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // ==========================================
    // CONTENT
    // ==========================================
    content: {
        type: String,
        maxlength: 5000 // Increased for long-form
    },
    
    type: {
        type: String,
        enum: ['post', 'prediction', 'group_invite', 'challenge_bet'],
        default: 'post'
    },
    
    // Challenge Bet fields
    challengeBet: {
        amount: Number,
        maxOpponents: Number,
        side: String,
        betType: String,
        team: String,        // Add this
        spread: String,      // Add this
        awayTeam: String,    // Add this
        homeTeam: String,    // Add this
        game: {
            gameId: String,
            homeTeam: String,
            awayTeam: String,
            home: String,      // Keep for backwards compatibility
            away: String,      // Keep for backwards compatibility
            spread: String,
            total: String
        },
        status: {
            type: String,
            enum: ['open', 'locked', 'completed', 'cancelled'],
            default: 'open'
        },
        participants: [{
            userId: String,
            username: String,
            displayName: String
        }],
        acceptedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    
    // Rich media
    media: [{
        type: {
            type: String,
            enum: ['image', 'video', 'gif', 'audio', 'document'],
            required: true
        },
        url: String,
        thumbnail: String,
        duration: Number, // for video/audio
        width: Number,
        height: Number,
        size: Number,
        mimeType: String,
        alt: String // accessibility
    }],
    
    // Link preview
    linkPreview: {
        url: String,
        title: String,
        description: String,
        image: String,
        siteName: String
    },
    
    // ==========================================
    // SPORTS/BETTING FEATURES
    // ==========================================
    prediction: {
        sport: String,
        league: String,
        gameId: String,
        gameTime: Date,
        team1: String,
        team2: String,
        pick: String,
        pickType: {
            type: String,
            enum: ['spread', 'moneyline', 'total', 'prop', 'parlay', 'teaser', 'live']
        },
        odds: String,
        line: Number,
        units: Number,
        confidence: {
            type: Number,
            min: 1,
            max: 100
        },
        reasoning: String,
        result: {
            type: String,
            enum: ['pending', 'won', 'lost', 'push', 'void'],
            default: 'pending'
        },
        payout: Number,
        isLive: Boolean,
        tailCount: Number // how many people tailed this bet
    },
    
    // Parlay builder
    parlay: [{
        gameId: String,
        pick: String,
        odds: String,
        result: String
    }],
    
    // ==========================================
    // ENGAGEMENT
    // ==========================================
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        type: {
            type: String,
            enum: ['like', 'love', 'fire', 'laugh', 'sad', 'angry'],
            default: 'like'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    comments: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId()
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            maxlength: 500
        },
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        replies: [{
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                default: mongoose.Types.ObjectId
            },
            author: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            content: String,
            likes: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }],
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        isPinned: Boolean,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    shares: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        type: {
            type: String,
            enum: ['repost', 'quote', 'story', 'message'],
            default: 'repost'
        },
        comment: String, // for quote tweets
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    bookmarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // Who tailed this bet
    tails: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        units: Number,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // ==========================================
    // POLLS
    // ==========================================
    poll: {
        question: String,
        options: [{
            text: String,
            votes: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }]
        }],
        expiresAt: Date,
        multipleChoice: Boolean
    },
    
    // ==========================================
    // MONETIZATION
    // ==========================================
    monetization: {
        isPaid: {
            type: Boolean,
            default: false
        },
        price: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
            enum: ['degenCoins', 'usd'],
            default: 'degenCoins'
        },
        purchasedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        tips: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            amount: Number,
            message: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        boost: {
            isActive: Boolean,
            amount: Number,
            expiresAt: Date,
            impressions: Number
        }
    },
    
    // ==========================================
    // METADATA
    // ==========================================
    hashtags: [String],
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    location: {
        name: String,
        coordinates: {
            lat: Number,
            lng: Number
        },
        city: String,
        country: String
    },
    
    visibility: {
        type: String,
        enum: ['public', 'followers', 'group', 'private', 'paid'],
        default: 'public'
    },
    
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    
    // Threading
    thread: {
        parentPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        },
        threadId: String, // to group threads
        position: Number
    },
    
    // Quote tweet
    quotedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    
    // Scheduling
    scheduled: {
        publishAt: Date,
        isPublished: {
            type: Boolean,
            default: false
        }
    },
    
    // Story (24hr content)
    story: {
        expiresAt: Date,
        views: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            viewedAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    
    // Analytics
    analytics: {
        views: {
            type: Number,
            default: 0
        },
        impressions: {
            type: Number,
            default: 0
        },
        engagement: {
            type: Number,
            default: 0
        },
        clicks: {
            type: Number,
            default: 0
        },
        shareCount: {
            type: Number,
            default: 0
        },
        reach: {
            type: Number,
            default: 0
        }
    },
    
    // Moderation
    moderation: {
        isNSFW: {
            type: Boolean,
            default: false
        },
        isFlagged: {
            type: Boolean,
            default: false
        },
        reports: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            reason: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        isHidden: {
            type: Boolean,
            default: false
        },
        moderatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        moderationNote: String
    },
    
    // AI Features
    ai: {
        sentiment: {
            type: String,
            enum: ['positive', 'negative', 'neutral', 'mixed']
        },
        topics: [String],
        language: String,
        toxicityScore: Number,
        engagementPrediction: Number
    },
    
    // Status flags
    isPinned: {
        type: Boolean,
        default: false
    },
    isPromoted: {
        type: Boolean,
        default: false
    },
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: Date,
    editHistory: [{
        content: String,
        editedAt: Date
    }],
    
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// ==========================================
// INDEXES
// ==========================================
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ 'prediction.result': 1, createdAt: -1 });
PostSchema.index({ hashtags: 1 });
PostSchema.index({ mentions: 1 });
PostSchema.index({ groupId: 1, createdAt: -1 });
PostSchema.index({ 'analytics.views': -1 });
PostSchema.index({ 'monetization.isPaid': 1 });
PostSchema.index({ 'thread.threadId': 1, 'thread.position': 1 });

// ==========================================
// VIRTUALS
// ==========================================
PostSchema.virtual('likeCount').get(function() {
    return this.likes.length;
});

PostSchema.virtual('commentCount').get(function() {
    return this.comments.length;
});

PostSchema.virtual('shareCount').get(function() {
    return this.shares.length;
});

PostSchema.virtual('isStory').get(function() {
    return this.type === 'story' && this.story?.expiresAt > new Date();
});

// ==========================================
// MIDDLEWARE
// ==========================================
PostSchema.pre(/^find/, function() {
    this.populate({
        path: 'author',
        select: 'username displayName avatar verified stats'
    });
});

// Auto-populate quoted posts
PostSchema.pre(/^find/, function() {
    this.populate({
        path: 'quotedPost',
        select: 'content author media createdAt'
    });
});

// ==========================================
// METHODS
// ==========================================
PostSchema.methods.canView = function(userId) {
    if (this.visibility === 'public') return true;
    if (this.visibility === 'private' && this.author.equals(userId)) return true;
    if (this.visibility === 'paid' && this.monetization.purchasedBy.includes(userId)) return true;
    // Add more logic for followers, groups, etc.
    return false;
};

PostSchema.methods.addView = async function(userId) {
    this.analytics.views += 1;
    if (this.type === 'story' && userId) {
        const hasViewed = this.story.views.some(v => v.user.equals(userId));
        if (!hasViewed) {
            this.story.views.push({ user: userId });
        }
    }
    return this.save();
};

module.exports = mongoose.model('Post', PostSchema);