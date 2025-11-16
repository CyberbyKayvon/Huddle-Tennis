# Create golf profile page structure
Write-Host "Creating Golf Profile Page Structure..." -ForegroundColor Green

# Create directories
$dirs = @(
    "src/core/pages/golf-profiles/essential",
    "src/core/pages/golf-profiles/premium",
    "src/core/base",
    "backend/routes"
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Path $dir -Force
    Write-Host "Created: $dir" -ForegroundColor Yellow
}

# Create Base Golf Profile Class
$baseGolfProfile = @'
// Base class for all golf profile pages
class BaseGolfProfile {
    constructor() {
        this.pageType = 'golf-profile';
        this.tier = 'essential';
    }
    
    generateHTML(golferData, theme = 'modern') {
        // This will be overridden by each page
        return '';
    }
    
    getHeader(golferData) {
        return `
            <header class="golf-header">
                <nav class="golf-nav">
                    <a href="index.html">Overview</a>
                    <a href="stats.html">Stats</a>
                    <a href="tournaments.html">Tournaments</a>
                    <a href="academics.html">Academics</a>
                    <a href="contact.html">Contact</a>
                </nav>
            </header>
        `;
    }
    
    getStyles() {
        return `
            body {
                font-family: -apple-system, sans-serif;
                margin: 0;
                background: linear-gradient(135deg, #0f4c3a, #1a7350);
                color: white;
            }
            .golf-nav {
                display: flex;
                gap: 2rem;
                padding: 1rem;
                background: rgba(0,0,0,0.3);
            }
            .golf-nav a {
                color: white;
                text-decoration: none;
            }
        `;
    }
}

module.exports = BaseGolfProfile;
'@

Set-Content -Path "src/core/base/BaseGolfProfile.js" -Value $baseGolfProfile
Write-Host "Created: BaseGolfProfile.js" -ForegroundColor Green

# Create profile-home.js
$profileHome = @'
const BaseGolfProfile = require('../../../base/BaseGolfProfile');

class GolfProfileHome extends BaseGolfProfile {
    constructor() {
        super();
        this.title = 'Golfer Profile Home';
    }
    
    generateHTML(golferData) {
        return `<!DOCTYPE html>
<html>
<head>
    <title>${golferData.name} - Golf Recruitment Profile</title>
    <style>${this.getStyles()}</style>
</head>
<body>
    ${this.getHeader(golferData)}
    <div class="profile-hero">
        <h1>${golferData.name}</h1>
        <p>Class of ${golferData.graduationYear} • ${golferData.hometown}</p>
        <div class="quick-stats">
            <div class="stat">
                <span class="value">#${golferData.nationalRank || 'N/A'}</span>
                <span class="label">National Rank</span>
            </div>
            <div class="stat">
                <span class="value">${golferData.scoringAvg || 'N/A'}</span>
                <span class="label">Scoring Average</span>
            </div>
            <div class="stat">
                <span class="value">${golferData.gpa || 'N/A'}</span>
                <span class="label">GPA</span>
            </div>
        </div>
    </div>
</body>
</html>`;
    }
}

module.exports = GolfProfileHome;
'@

Set-Content -Path "src/core/pages/golf-profiles/essential/profile-home.js" -Value $profileHome
Write-Host "Created: profile-home.js" -ForegroundColor Green

Write-Host "`n✅ Golf Profile Page Structure Created!" -ForegroundColor Green
Write-Host "Run from Huddle-Golf root: .\setup-golf-pages.ps1" -ForegroundColor Yellow