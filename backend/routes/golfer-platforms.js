const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.post('/generate', async (req, res) => {
    try {
        const golferData = req.body;
        const platformId = 'golfer_' + Date.now();
        const platformDir = path.join(__dirname, '../../generated-platforms', platformId);
        
        // Create directory
        fs.mkdirSync(platformDir, { recursive: true });
        
        // Generate profile-home page
        const ProfileHome = require('../../src/core/pages/golf-profiles/essential/profile-home');
        const profilePage = new ProfileHome();
        const homeHtml = profilePage.generateHTML(golferData);
        fs.writeFileSync(path.join(platformDir, 'index.html'), homeHtml);
        
        // Generate tournament history page
        const TournamentHistory = require('../../src/core/pages/golf-profiles/essential/tournament-history');
        const tournamentPage = new TournamentHistory();
        const tournamentHtml = tournamentPage.generateHTML(golferData);
        fs.writeFileSync(path.join(platformDir, 'tournament-history.html'), tournamentHtml);
        
        // Generate stats dashboard page
        const StatsDashboard = require('../../src/core/pages/golf-profiles/essential/stats-dashboard');
        const statsPage = new StatsDashboard();
        const statsHtml = statsPage.generateHTML(golferData);
        fs.writeFileSync(path.join(platformDir, 'stats-dashboard.html'), statsHtml);

        // Generate highlights page
        const Highlights = require('../../src/core/pages/golf-profiles/essential/highlights');
        const highlightsPage = new Highlights();
        const highlightsHtml = highlightsPage.generateHTML(golferData);
        fs.writeFileSync(path.join(platformDir, 'highlights.html'), highlightsHtml);
        
        // Generate schedule page
        const Schedule = require('../../src/core/pages/golf-profiles/essential/schedule');
        const schedulePage = new Schedule();
        const scheduleHtml = schedulePage.generateHTML(golferData);
        fs.writeFileSync(path.join(platformDir, 'schedule.html'), scheduleHtml);
        
        // Generate academic-info page
        const AcademicInfo = require('../../src/core/pages/golf-profiles/essential/academic-info');
        const academicPage = new AcademicInfo();
        const academicHtml = academicPage.generateHTML(golferData);
        fs.writeFileSync(path.join(platformDir, 'academic-info.html'), academicHtml);
        
        // Generate achievements page
        const Achievements = require('../../src/core/pages/golf-profiles/essential/achievements');
        const achievementsPage = new Achievements();
        const achievementsHtml = achievementsPage.generateHTML(golferData);
        fs.writeFileSync(path.join(platformDir, 'achievements.html'), achievementsHtml);
        
        // Generate contact page
        const Contact = require('../../src/core/pages/golf-profiles/essential/contact');
        const contactPage = new Contact();
        const contactHtml = contactPage.generateHTML(golferData);
        fs.writeFileSync(path.join(platformDir, 'contact.html'), contactHtml);
        
        res.json({
            success: true,
            platformId,
            platformUrl: `/golfer/${platformId}`
        });
    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// List all generated profiles
router.get('/list', (req, res) => {
    const platformsDir = path.join(__dirname, '../../generated-platforms');
    
    if (!fs.existsSync(platformsDir)) {
        return res.json({ success: true, profiles: [] });
    }
    
    const profiles = fs.readdirSync(platformsDir)
        .filter(dir => dir.startsWith('golfer_'))
        .map(dir => {
            return { id: dir, name: dir };
        });
    
    res.json({ success: true, profiles });
});

module.exports = router;