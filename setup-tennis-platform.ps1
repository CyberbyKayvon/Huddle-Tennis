# Huddle Tennis Platform Setup Script
# Run from the Huddle-Golf root directory

Write-Host "Setting up Huddle Tennis Platform Structure..." -ForegroundColor Green

# Create directory structure
$directories = @(
    "backend/routes",
    "backend/models", 
    "backend/templates/player-pages",
    "frontend/js/components",
    "frontend/public",
    "frontend/css",
    "generated-platforms"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "Created: $dir" -ForegroundColor Yellow
    } else {
        Write-Host "Exists: $dir" -ForegroundColor Cyan
    }
}

# Create backend model files
Write-Host "`nCreating Model Files..." -ForegroundColor Green

# PlayerProfile.js
$playerProfileModel = @'
const mongoose = require('mongoose');

const playerProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    graduationYear: String,
    hometown: String,
    highSchool: String,
    rankings: {
        utr: Number,
        itfJunior: Number,
        usta: Number,
        tennisRecruiting: Number
    },
    stats: {
        singlesRecord: String,
        doublesRecord: String,
        winPercentage: Number,
        tournamentsPlayed: Number,
        titles: Number,
        surfacePreference: String
    },
    platformId: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PlayerProfile', playerProfileSchema);
'@

Set-Content -Path "backend/models/PlayerProfile.js" -Value $playerProfileModel
Write-Host "Created: backend/models/PlayerProfile.js" -ForegroundColor Yellow

# Create route files
Write-Host "`nCreating Route Files..." -ForegroundColor Green

# player-platforms.js
$golferPlatformsRoute = @'
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const PlayerProfile = require('../models/PlayerProfile');

router.post('/generate', async (req, res) => {
    try {
        const { playerName, graduationYear, stats, userId } = req.body;
        
        const playerId = `player_${Date.now()}`;
        const platformDir = path.join(__dirname, '../../generated-platforms', playerId);
        
        fs.mkdirSync(platformDir, { recursive: true });
        
        // Save to database
        const profile = new PlayerProfile({
            userId,
            name: playerName,
            graduationYear,
            stats,
            platformId: playerId
        });
        await profile.save();
        
        // Generate HTML pages
        const pages = ['index', 'stats', 'videos', 'tournaments', 'contact'];
        
        pages.forEach(page => {
            const html = generatePage(page, { playerName, graduationYear, stats, playerId });
            fs.writeFileSync(path.join(platformDir, `${page}.html`), html);
        });
        
        res.json({
            success: true,
            platformUrl: `/player/${playerId}`,
            playerId
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

function generatePage(type, data) {
    // Simplified page generation
    return `<!DOCTYPE html>
<html>
<head>
    <title>${data.playerName} - ${type}</title>
    <style>
        body { font-family: Arial; margin: 0; padding: 20px; }
        .header { background: #0f4c3a; color: white; padding: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${data.playerName}</h1>
        <p>Class of ${data.graduationYear}</p>
    </div>
</body>
</html>`;
}

module.exports = router;
'@

Set-Content -Path "backend/routes/player-platforms.js" -Value $golferPlatformsRoute
Write-Host "Created: backend/routes/player-platforms.js" -ForegroundColor Yellow

# Update server.js to include new routes
Write-Host "`nUpdating server.js..." -ForegroundColor Green

$serverUpdate = @'

// Add after existing route definitions
const golferPlatformRoutes = require('./routes/player-platforms');
app.use('/api/player-platforms', golferPlatformRoutes);
'@

# Check if server.js exists and append
if (Test-Path "backend/server.js") {
    Add-Content -Path "backend/server.js" -Value $serverUpdate
    Write-Host "Updated: backend/server.js" -ForegroundColor Yellow
}

# Create frontend component
Write-Host "`nCreating Frontend Components..." -ForegroundColor Green

$golferPlatformGenerator = @'
class GolferPlatformGenerator {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.formData = {};
    }
    
    render() {
        return `
            <div class="golfer-platform-generator" style="max-width: 800px; margin: 0 auto; padding: 2rem;">
                <h1 style="color: #0f4c3a;">⛳ Create Your Golf Recruitment Profile</h1>
                <div class="progress-bar" style="height: 4px; background: #ddd; margin: 2rem 0;">
                    <div style="width: ${(this.currentStep / this.totalSteps) * 100}%; height: 100%; background: #0f4c3a;"></div>
                </div>
                ${this.renderCurrentStep()}
                <div style="margin-top: 2rem;">
                    ${this.currentStep > 1 ? '<button onclick="golferPlatformGenerator.previousStep()">Previous</button>' : ''}
                    ${this.currentStep < this.totalSteps ? 
                        '<button onclick="golferPlatformGenerator.nextStep()">Next</button>' : 
                        '<button onclick="golferPlatformGenerator.generate()">Generate Profile</button>'}
                </div>
            </div>
        `;
    }
    
    renderCurrentStep() {
        switch(this.currentStep) {
            case 1: return this.basicInfo();
            case 2: return this.golfStats();
            case 3: return this.tournaments();
            case 4: return this.academics();
            case 5: return this.review();
        }
    }
    
    basicInfo() {
        return `
            <div>
                <h2>Basic Information</h2>
                <input type="text" id="playerName" placeholder="Full Name" style="width: 100%; padding: 10px; margin: 10px 0;">
                <input type="text" id="graduationYear" placeholder="Class of 2026" style="width: 100%; padding: 10px; margin: 10px 0;">
                <input type="text" id="hometown" placeholder="Hometown" style="width: 100%; padding: 10px; margin: 10px 0;">
            </div>
        `;
    }
    
    golfStats() {
        return `
            <div>
                <h2>Golf Statistics</h2>
                <input type="number" id="scoringAvg" placeholder="Scoring Average" style="width: 100%; padding: 10px; margin: 10px 0;">
                <input type="number" id="nationalRank" placeholder="National Ranking" style="width: 100%; padding: 10px; margin: 10px 0;">
                <input type="number" id="stateRank" placeholder="State Ranking" style="width: 100%; padding: 10px; margin: 10px 0;">
            </div>
        `;
    }
    
    tournaments() {
        return `<div><h2>Tournament History</h2><p>Add your tournament results...</p></div>`;
    }
    
    academics() {
        return `<div><h2>Academic Information</h2><p>Add your GPA and test scores...</p></div>`;
    }
    
    review() {
        return `<div><h2>Review Your Profile</h2><p>Review and confirm your information...</p></div>`;
    }
    
    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.saveCurrentStep();
            this.currentStep++;
            this.updateDisplay();
        }
    }
    
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateDisplay();
        }
    }
    
    saveCurrentStep() {
        // Save form data based on current step
        if (this.currentStep === 1) {
            this.formData.playerName = document.getElementById('playerName')?.value;
            this.formData.graduationYear = document.getElementById('graduationYear')?.value;
            this.formData.hometown = document.getElementById('hometown')?.value;
        } else if (this.currentStep === 2) {
            this.formData.scoringAvg = document.getElementById('scoringAvg')?.value;
            this.formData.nationalRank = document.getElementById('nationalRank')?.value;
            this.formData.stateRank = document.getElementById('stateRank')?.value;
        }
    }
    
    updateDisplay() {
        const container = document.querySelector('.main-feed') || document.querySelector('.feed-posts');
        if (container) {
            container.innerHTML = this.render();
        }
    }
    
    async generate() {
        this.saveCurrentStep();
        
        try {
            const response = await fetch('/api/player-platforms/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.formData)
            });
            
            const result = await response.json();
            if (result.success) {
                alert('Profile created! URL: ' + result.platformUrl);
                window.open(result.platformUrl, '_blank');
            }
        } catch (error) {
            console.error('Generation failed:', error);
            alert('Failed to generate profile. Please try again.');
        }
    }
}

window.golferPlatformGenerator = new GolferPlatformGenerator();
'@

Set-Content -Path "frontend/js/components/golfer-platform-generator.js" -Value $golferPlatformGenerator
Write-Host "Created: frontend/js/components/golfer-platform-generator.js" -ForegroundColor Yellow

# Update golf-hub.html to include the generator
Write-Host "`nUpdating golf-hub.html..." -ForegroundColor Green

$htmlUpdate = @'
<!-- Add this script tag before closing body -->
<script src="/js/components/golfer-platform-generator.js"></script>
<script>
function loadGolferPlatformGenerator() {
    const mainFeed = document.querySelector('.main-feed');
    if (mainFeed && window.golferPlatformGenerator) {
        mainFeed.innerHTML = window.golferPlatformGenerator.render();
    }
}

// Add to navigation click handlers
document.addEventListener('DOMContentLoaded', function() {
    const createProfileBtn = document.querySelector('.create-profile-btn');
    if (createProfileBtn) {
        createProfileBtn.addEventListener('click', loadGolferPlatformGenerator);
    }
});
</script>
'@

# Check if golf-hub.html exists
if (Test-Path "frontend/public/golf-hub.html") {
    Write-Host "Add the following to golf-hub.html before </body>:" -ForegroundColor Cyan
    Write-Host $htmlUpdate -ForegroundColor Gray
}

# Create package.json if it doesn't exist
if (!(Test-Path "backend/package.json")) {
    Write-Host "`nInitializing npm..." -ForegroundColor Green
    Set-Location backend
    npm init -y
    npm install express mongoose cors dotenv bcryptjs jsonwebtoken socket.io
    Set-Location ..
}

Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Start MongoDB: mongod" -ForegroundColor White
Write-Host "2. Start server: cd backend && npm start" -ForegroundColor White
Write-Host "3. Open: http://localhost:5000/golf-hub" -ForegroundColor White
Write-Host "`nTo add the platform generator to your golf-hub:" -ForegroundColor Yellow
Write-Host "Add a button with onclick='loadGolferPlatformGenerator()'" -ForegroundColor White