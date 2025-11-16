class BaseGolfProfile {
    constructor() {
        this.tier = "essential";
        this.pageType = "golf-profile";
    }
    
    generateHTML(golferData) {
        const styles = this.getStyles();
        const navigation = this.getNavigation();
        const content = this.getContent(golferData);
        
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${golferData.golferName || 'Golfer'} - Recruitment Profile</title>
    <style>${styles}</style>
</head>
<body>
    ${navigation}
    <main class="main-content">
        ${content}
    </main>
</body>
</html>`;
    }
    
    getStyles() {
        return `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, sans-serif;
                background: linear-gradient(135deg, #0f4c3a, #1a7350);
                color: white;
                min-height: 100vh;
            }
            .nav-bar {
                background: rgba(0,0,0,0.3);
                padding: 1rem;
                display: flex;
                gap: 2rem;
                justify-content: center;
            }
            .nav-bar a {
                color: white;
                text-decoration: none;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                transition: all 0.3s;
            }
            .nav-bar a:hover {
                background: rgba(255,255,255,0.1);
            }
            .main-content {
                max-width: 1200px;
                margin: 2rem auto;
                padding: 0 2rem;
            }
        `;
    }
    
    getNavigation() {
        return `
            <nav class="nav-bar">
                <a href="index.html">Overview</a>
                <a href="stats-dashboard.html">Stats</a>
                <a href="tournament-history.html">Tournaments</a>
                <a href="academic-info.html">Academics</a>
                <a href="contact.html">Contact</a>
            </nav>
        `;
    }
    
    getContent(golferData) {
        // Override in child classes
        return '<h1>Golf Profile</h1>';
    }
}

module.exports = BaseGolfProfile;