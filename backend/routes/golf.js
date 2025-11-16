const express = require('express');
const router = express.Router();
const JGSRScraper = require('../scrapers/JGSRScraper');

const scraper = new JGSRScraper();

// Get player data from JGSR
router.get('/player/:playerId', async (req, res) => {
    try {
        const playerData = await scraper.getPlayerData(req.params.playerId);
        res.json({ success: true, data: playerData });
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

// Get rankings
router.get('/rankings/:type', async (req, res) => {
    try {
        const rankings = await scraper.getRankings(req.params.type);
        res.json({ success: true, rankings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
