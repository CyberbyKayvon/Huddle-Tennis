const express = require('express');
const router = express.Router();
const TennisRankingScraper = require('../scrapers/TennisRankingScraper');

const scraper = new TennisRankingScraper();

// Get comprehensive player data from all sources (UTR, ITF, TennisRecruiting.net, USTA)
router.get('/player/:playerId', async (req, res) => {
    try {
        // Expected format: playerIds as query params
        // Example: /api/tennis/player/combined?utr=123&itf=456&tr=789&usta=101
        const playerIds = {
            utr: req.query.utr || req.params.playerId,
            itf: req.query.itf,
            tennisRecruiting: req.query.tr,
            usta: req.query.usta
        };

        const playerData = await scraper.getPlayerData(playerIds);
        res.json({ success: true, data: playerData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get UTR data specifically
router.get('/player/:playerId/utr', async (req, res) => {
    try {
        const utrData = await scraper.getUTRData(req.params.playerId);
        res.json({ success: true, data: utrData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get ITF data specifically
router.get('/player/:playerId/itf', async (req, res) => {
    try {
        const itfData = await scraper.getITFData(req.params.playerId);
        res.json({ success: true, data: itfData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get TennisRecruiting.net data specifically
router.get('/player/:playerId/tennisrecruiting', async (req, res) => {
    try {
        const trData = await scraper.getTennisRecruitingData(req.params.playerId);
        res.json({ success: true, data: trData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get USTA data specifically
router.get('/player/:playerId/usta', async (req, res) => {
    try {
        const ustaData = await scraper.getUSTAData(req.params.playerId);
        res.json({ success: true, data: ustaData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Search players
router.get('/search', async (req, res) => {
    try {
        const results = await scraper.searchPlayers(req.query.q);
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get rankings by type
// Types: utr, itf, tennisrecruiting, usta
// Query params: ageGroup (u18, u16, u14, u12), gender (boys, girls), limit
router.get('/rankings/:type', async (req, res) => {
    try {
        const options = {
            ageGroup: req.query.ageGroup || 'u18',
            gender: req.query.gender || 'boys',
            limit: parseInt(req.query.limit) || 100
        };

        const rankings = await scraper.getRankings(req.params.type, options);
        res.json({ success: true, type: req.params.type, rankings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Trigger manual rankings update
router.post('/update-rankings', async (req, res) => {
    try {
        const result = await scraper.scheduledUpdate();
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
