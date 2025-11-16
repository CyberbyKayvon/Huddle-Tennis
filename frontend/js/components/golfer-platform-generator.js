class GolferPlatformGenerator {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.formData = {};
    }
    
    quickGenerate() {
        // Benjamin Brisson's actual data from JGSR
        this.formData = {
            golferName: "Benjamin Brisson",
            graduationYear: "2030",
            hometown: "Dallas, TX",
            highSchool: "TBD (Class of 2030)",
            age: "12",
            scoringAvg: "80.71",  // All American Tour average
            nationalRank: "13",  // AAT Boys 12 & Under ranking
            stateRank: "T16",  // Texas ranking
            tournamentsPlayed: "6",  // 2024 season
            wins: "1",  // Prep Tour: Metro 349
            gpa: "",  // Not provided
            tournament1: "AAT: Srixon and Nike Fall Masters",
            result1: "3rd (350 pts)",
            tournament2: "Prep Tour: Metro 349",
            result2: "1st",
            lowRound: "74",
            totalBirdies: "10",
            parBreakers: "7.9%",
            events2024: "4",
            points2024: "1,190",
            topFinishes: {
                first: 1,
                second: 1,
                third: 1,
                top10: 4,
                top25: 4
            }
        };
        
        // Jump to review step
        this.currentStep = 5;
        this.updateDisplay();
    }
    
    render() {
        return `
            <div class="generator-container" style="background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px; padding: 2rem; max-width: 800px; margin: 0 auto; position: relative;">
                <button onclick="golferPlatformGenerator.quickGenerate()" style="position: absolute; top: 1rem; right: 1rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, #fbbf24, #f59e0b); border: none; color: black; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.875rem; z-index: 10;">
                    ⚡ Quick Test (Benjamin)
                </button>
                
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="font-size: 2rem; margin-bottom: 0.5rem; background: linear-gradient(135deg, #10b981, #34d399); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">
                        ⛳ Create Your Golf Recruitment Profile
                    </h1>
                    <p style="color: rgba(255, 255, 255, 0.5);">Step ${this.currentStep} of ${this.totalSteps}</p>
                </div>
                
                <div style="height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; margin-bottom: 2rem; overflow: hidden;">
                    <div style="width: ${(this.currentStep / this.totalSteps) * 100}%; height: 100%; background: linear-gradient(90deg, #10b981, #34d399); transition: width 0.3s;"></div>
                </div>
                
                ${this.renderCurrentStep()}
                
                <div style="display: flex; justify-content: space-between; margin-top: 2rem;">
                    ${this.currentStep > 1 ? 
                        '<button onclick="golferPlatformGenerator.previousStep()" style="padding: 0.75rem 2rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: white; border-radius: 12px; cursor: pointer;">← Previous</button>' : 
                        '<div></div>'}
                    ${this.currentStep < this.totalSteps ? 
                        '<button onclick="golferPlatformGenerator.nextStep()" style="padding: 0.75rem 2rem; background: linear-gradient(135deg, #10b981, #34d399); border: none; color: white; border-radius: 12px; cursor: pointer; font-weight: 600;">Next →</button>' : 
                        '<button onclick="golferPlatformGenerator.generate()" style="padding: 0.75rem 2rem; background: linear-gradient(135deg, #10b981, #34d399); border: none; color: white; border-radius: 12px; cursor: pointer; font-weight: 600;">🚀 Generate Profile</button>'}
                </div>
            </div>
        `;
    }
    
    renderCurrentStep() {
        const inputStyle = "width: 100%; padding: 1rem; margin: 0.5rem 0; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: white; font-size: 1rem;";
        
        switch(this.currentStep) {
            case 1: return this.basicInfo(inputStyle);
            case 2: return this.golfStats(inputStyle);
            case 3: return this.tournaments(inputStyle);
            case 4: return this.academics(inputStyle);
            case 5: return this.review();
        }
    }
    
    basicInfo(inputStyle) {
        return `
            <div style="background: rgba(0, 0, 0, 0.2); padding: 2rem; border-radius: 16px;">
                <h2 style="margin-bottom: 1.5rem; color: #10b981;">Basic Information</h2>
                <input type="text" id="golferName" placeholder="Full Name" value="${this.formData.golferName || ''}" style="${inputStyle}">
                <input type="text" id="graduationYear" placeholder="Class of 2026" value="${this.formData.graduationYear || ''}" style="${inputStyle}">
                <input type="text" id="hometown" placeholder="Hometown (City, State)" value="${this.formData.hometown || ''}" style="${inputStyle}">
                <input type="text" id="highSchool" placeholder="High School" value="${this.formData.highSchool || ''}" style="${inputStyle}">
            </div>
        `;
    }
    
    golfStats(inputStyle) {
        return `
            <div style="background: rgba(0, 0, 0, 0.2); padding: 2rem; border-radius: 16px;">
                <h2 style="margin-bottom: 1.5rem; color: #10b981;">Golf Statistics</h2>
                <input type="number" step="0.1" id="scoringAvg" placeholder="Scoring Average (e.g., 72.5)" value="${this.formData.scoringAvg || ''}" style="${inputStyle}">
                <input type="number" id="nationalRank" placeholder="National Ranking" value="${this.formData.nationalRank || ''}" style="${inputStyle}">
                <input type="number" id="stateRank" placeholder="State Ranking" value="${this.formData.stateRank || ''}" style="${inputStyle}">
                <input type="number" id="tournamentsPlayed" placeholder="Tournaments Played" value="${this.formData.tournamentsPlayed || ''}" style="${inputStyle}">
                <input type="number" id="wins" placeholder="Tournament Wins" value="${this.formData.wins || ''}" style="${inputStyle}">
            </div>
        `;
    }
    
    tournaments(inputStyle) {
        return `
            <div style="background: rgba(0, 0, 0, 0.2); padding: 2rem; border-radius: 16px;">
                <h2 style="margin-bottom: 1.5rem; color: #10b981;">Recent Tournament Results</h2>
                <input type="text" id="tournament1" placeholder="Tournament Name #1" value="${this.formData.tournament1 || ''}" style="${inputStyle}">
                <input type="text" id="result1" placeholder="Result (e.g., 1st, T-5)" value="${this.formData.result1 || ''}" style="${inputStyle}">
                <input type="text" id="tournament2" placeholder="Tournament Name #2" value="${this.formData.tournament2 || ''}" style="${inputStyle}">
                <input type="text" id="result2" placeholder="Result" value="${this.formData.result2 || ''}" style="${inputStyle}">
            </div>
        `;
    }
    
    academics(inputStyle) {
        return `
            <div style="background: rgba(0, 0, 0, 0.2); padding: 2rem; border-radius: 16px;">
                <h2 style="margin-bottom: 1.5rem; color: #10b981;">Academic Information</h2>
                <input type="number" step="0.01" id="gpa" placeholder="GPA (e.g., 3.85)" value="${this.formData.gpa || ''}" style="${inputStyle}">
                <input type="number" id="satScore" placeholder="SAT Score (optional)" value="${this.formData.satScore || ''}" style="${inputStyle}">
                <input type="number" id="actScore" placeholder="ACT Score (optional)" value="${this.formData.actScore || ''}" style="${inputStyle}">
                <input type="text" id="interests" placeholder="Academic Interests" value="${this.formData.interests || ''}" style="${inputStyle}">
            </div>
        `;
    }
    
    review() {
        return `
            <div style="background: rgba(0, 0, 0, 0.2); padding: 2rem; border-radius: 16px;">
                <h2 style="margin-bottom: 1.5rem; color: #10b981;">Review Your Profile</h2>
                <div style="display: grid; gap: 1rem;">
                    <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
                        <strong>Name:</strong> ${this.formData.golferName || 'Not provided'}
                    </div>
                    <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
                        <strong>Age:</strong> ${this.formData.age || 'Not provided'} • <strong>Class:</strong> ${this.formData.graduationYear || 'Not provided'}
                    </div>
                    <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
                        <strong>Hometown:</strong> ${this.formData.hometown || 'Not provided'}
                    </div>
                    <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
                        <strong>Scoring Average:</strong> ${this.formData.scoringAvg || 'Not provided'}
                    </div>
                    <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
                        <strong>AAT Ranking:</strong> #${this.formData.nationalRank || 'Not provided'}
                    </div>
                    <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
                        <strong>2024 Points:</strong> ${this.formData.points2024 || 'Not provided'}
                    </div>
                    <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
                        <strong>Low Round:</strong> ${this.formData.lowRound || 'Not provided'}
                    </div>
                    <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
                        <strong>Recent Result:</strong> ${this.formData.result2} at ${this.formData.tournament2}
                    </div>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 12px;">
                    <strong>Tournament Highlights:</strong>
                    <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                        <li>${this.formData.tournament1}: ${this.formData.result1}</li>
                        <li>${this.formData.tournament2}: ${this.formData.result2}</li>
                    </ul>
                </div>
            </div>
        `;
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
            this.saveCurrentStep();
            this.currentStep--;
            this.updateDisplay();
        }
    }
    
    saveCurrentStep() {
        if (this.currentStep === 1) {
            this.formData.golferName = document.getElementById('golferName')?.value;
            this.formData.graduationYear = document.getElementById('graduationYear')?.value;
            this.formData.hometown = document.getElementById('hometown')?.value;
            this.formData.highSchool = document.getElementById('highSchool')?.value;
        } else if (this.currentStep === 2) {
            this.formData.scoringAvg = document.getElementById('scoringAvg')?.value;
            this.formData.nationalRank = document.getElementById('nationalRank')?.value;
            this.formData.stateRank = document.getElementById('stateRank')?.value;
            this.formData.tournamentsPlayed = document.getElementById('tournamentsPlayed')?.value;
            this.formData.wins = document.getElementById('wins')?.value;
        } else if (this.currentStep === 3) {
            this.formData.tournament1 = document.getElementById('tournament1')?.value;
            this.formData.result1 = document.getElementById('result1')?.value;
            this.formData.tournament2 = document.getElementById('tournament2')?.value;
            this.formData.result2 = document.getElementById('result2')?.value;
        } else if (this.currentStep === 4) {
            this.formData.gpa = document.getElementById('gpa')?.value;
            this.formData.satScore = document.getElementById('satScore')?.value;
            this.formData.actScore = document.getElementById('actScore')?.value;
            this.formData.interests = document.getElementById('interests')?.value;
        }
    }
    
    updateDisplay() {
        const container = document.querySelector('.main-feed');
        if (container) {
            container.innerHTML = this.render();
            container.scrollTop = 0;
        }
    }
    
    async generate() {
        this.saveCurrentStep();
        
        const container = document.querySelector('.main-feed');
        container.innerHTML = '<div style="text-align: center; padding: 4rem;"><h2 style="color: #10b981;">Generating your profile...</h2></div>';
        
        try {
            const response = await fetch('/api/golfer-platforms/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.formData)
            });
            
            const result = await response.json();
            if (result.success) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 4rem; background: rgba(16, 185, 129, 0.1); border-radius: 20px;">
                        <h2 style="color: #10b981; margin-bottom: 1rem;">✅ Profile Created Successfully!</h2>
                        <p style="margin-bottom: 2rem;">Your recruitment profile is ready</p>
                        <a href="${result.platformUrl}" target="_blank" style="padding: 1rem 2rem; background: linear-gradient(135deg, #10b981, #34d399); color: white; text-decoration: none; border-radius: 12px; display: inline-block;">View Profile</a>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Generation failed:', error);
            container.innerHTML = '<div style="text-align: center; padding: 4rem;"><h2 style="color: #ef4444;">Failed to generate profile. Please try again.</h2></div>';
        }
    }
}

window.golferPlatformGenerator = new GolferPlatformGenerator();