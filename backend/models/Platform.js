const mongoose = require('mongoose');

const platformSchema = new mongoose.Schema({
    platformId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    theme: { type: String, default: 'professional' },
    leagueId: { type: mongoose.Schema.Types.ObjectId, ref: 'League' },
    leagueCode: { type: String },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pages: [{
        name: String,
        title: String,
        filename: String,
        url: String
    }],
    config: {
        entryFee: { type: Number, default: 0 },
        maxMembers: { type: Number, default: 30 },
        sport: { type: String, default: 'NFL' },
        betTypes: [String],
        features: [String],
        weeklyPrize: { type: Number, default: 100 },
        seasonPotPerPlayer: { type: Number, default: 1000 }
    },
    stats: {
        totalMembers: { type: Number, default: 0 },
        totalPot: { type: Number, default: 0 },
        currentWeek: { type: Number, default: 1 }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Platform', platformSchema);