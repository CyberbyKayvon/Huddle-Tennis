const mongoose = require('mongoose');

const golferProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    graduationYear: String,
    hometown: String,
    highSchool: String,
    handicap: String,
    stats: {
        scoringAverage: Number,
        nationalRank: Number,
        stateRank: Number,
        tournamentsPlayed: Number,
        wins: Number,
        top10Finishes: Number
    },
    platformId: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GolferProfile', golferProfileSchema);
