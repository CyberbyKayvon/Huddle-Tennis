// Platform Generator Component V2 - Complete Rewrite
// File: /js/components/platform-generator-v2.js

class PlatformGeneratorV2 {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 6; // Simplified to 6 focused steps
        this.formData = {
            // Set defaults
            theme: 'professional',
            features: [],
            bettingTypes: ['spread'],
            enableLeaderboard: true,
            enableChat: true
        };
        this.isGenerating = false;
        
        // Simplified themes
        this.themes = {
            professional: {
                name: '🏢 Professional',
                colors: {
                    primary: '#1a365d',
                    secondary: '#2d3748', 
                    accent: '#718096'
                }
            },
            luxury: {
                name: '💎 Luxury Gold',
                colors: {
                    primary: '#744210',
                    secondary: '#975a16',
                    accent: '#d69e2e'
                }
            },
            'neon-vegas': {
                name: '🎰 Neon Vegas',
                colors: {
                    primary: '#ff00ff',
                    secondary: '#00ffff',
                    accent: '#ffff00'
                }
            }
        };
    }

    render() {
        return `
            <div class="platform-generator-v2">
                <div class="generator-header">
                    <h1>🚀 Create Your Sports Platform</h1>
                    <p>Build a complete betting platform in minutes</p>
                    
                    <!-- Quick Actions -->
                    <div class="quick-actions">
                        <button onclick="generatorV2.quickGenerate('test-professional')" class="quick-btn primary">
                            🏢 Test Professional
                        </button>
                        <button onclick="generatorV2.quickGenerate('test-luxury')" class="quick-btn" style="background: linear-gradient(135deg, #d4af37, #f4e4c1); color: #000;">
                            💎 Test Luxury
                        </button>
                        <button onclick="generatorV2.quickGenerate('test-neon')" class="quick-btn" style="background: linear-gradient(135deg, #ff00ff, #00ffff); color: #000;">
                            🎰 Test Neon Vegas
                        </button>
                        <button onclick="generatorV2.quickGenerate('custom')" class="quick-btn">
                            ⚙️ Custom Setup
                        </button>
                    </div>
                    
                    <!-- Progress -->
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(this.currentStep / this.totalSteps) * 100}%"></div>
                    </div>
                    <span class="step-indicator">Step ${this.currentStep} of ${this.totalSteps}</span>
                </div>

                <div class="generator-body">
                    ${this.renderStep()}
                </div>

                <div class="generator-footer">
                    ${this.currentStep > 1 ? `
                        <button onclick="generatorV2.previousStep()" class="nav-btn secondary">
                            ← Previous
                        </button>
                    ` : '<div></div>'}
                    
                    ${this.currentStep < this.totalSteps ? `
                        <button onclick="generatorV2.nextStep()" class="nav-btn primary">
                            Next →
                        </button>
                    ` : `
                        <button onclick="generatorV2.generatePlatform()" class="nav-btn generate" ${this.isGenerating ? 'disabled' : ''}>
                            ${this.isGenerating ? '⏳ Generating...' : '🚀 Generate Platform'}
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    renderStep() {
        switch(this.currentStep) {
            case 1: return this.step1_basics();
            case 2: return this.step2_theme();
            case 3: return this.step3_features();
            case 4: return this.step4_betting();
            case 5: return this.step5_customization();
            case 6: return this.step6_review();
            default: return this.step1_basics();
        }
    }

    step1_basics() {
        return `
            <div class="step-content">
                <h2>📋 Basic Information</h2>
                
                <div class="form-group">
                    <label>League Name*</label>
                    <input type="text" 
                           id="leagueName" 
                           placeholder="e.g., Monday Night Degenerates"
                           value="${this.formData.leagueName || ''}"
                           onchange="generatorV2.updateData('leagueName', this.value)">
                    <small>This will be displayed throughout your platform</small>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Sport</label>
                        <select onchange="generatorV2.updateData('sport', this.value)">
                            <option value="nfl" ${this.formData.sport === 'nfl' ? 'selected' : ''}>🏈 NFL</option>
                            <option value="nba" ${this.formData.sport === 'nba' ? 'selected' : ''}>🏀 NBA</option>
                            <option value="mlb" ${this.formData.sport === 'mlb' ? 'selected' : ''}>⚾ MLB</option>
                            <option value="nhl" ${this.formData.sport === 'nhl' ? 'selected' : ''}>🏒 NHL</option>
                            <option value="multi" ${this.formData.sport === 'multi' ? 'selected' : ''}>🏆 Multiple</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>League Size</label>
                        <select onchange="generatorV2.updateData('size', this.value)">
                            <option value="small" ${this.formData.size === 'small' ? 'selected' : ''}>Small (5-15)</option>
                            <option value="medium" ${this.formData.size === 'medium' ? 'selected' : ''}>Medium (16-50)</option>
                            <option value="large" ${this.formData.size === 'large' ? 'selected' : ''}>Large (50+)</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Description</label>
                    <textarea rows="3" 
                              placeholder="Brief description of your league..."
                              onchange="generatorV2.updateData('description', this.value)">${this.formData.description || ''}</textarea>
                </div>
            </div>
        `;
    }

    step2_theme() {
        return `
            <div class="step-content">
                <h2>🎨 Choose Theme</h2>
                
                <div class="theme-grid">
                    ${Object.entries(this.themes).map(([key, theme]) => `
                        <div class="theme-card ${this.formData.theme === key ? 'selected' : ''}" 
                             onclick="generatorV2.selectTheme('${key}')">
                            <div class="theme-preview" style="background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})">
                                <div class="theme-colors">
                                    <span style="background: ${theme.colors.primary}"></span>
                                    <span style="background: ${theme.colors.secondary}"></span>
                                    <span style="background: ${theme.colors.accent}"></span>
                                </div>
                            </div>
                            <h3>${theme.name}</h3>
                        </div>
                    `).join('')}
                </div>

                ${this.formData.theme ? `
                    <div class="color-customizer">
                        <h3>Customize Colors (Optional)</h3>
                        <div class="color-inputs">
                            <div>
                                <label>Primary</label>
                                <input type="color" 
                                       value="${this.formData.customColors?.primary || this.themes[this.formData.theme].colors.primary}"
                                       onchange="generatorV2.updateColor('primary', this.value)">
                            </div>
                            <div>
                                <label>Secondary</label>
                                <input type="color" 
                                       value="${this.formData.customColors?.secondary || this.themes[this.formData.theme].colors.secondary}"
                                       onchange="generatorV2.updateColor('secondary', this.value)">
                            </div>
                            <div>
                                <label>Accent</label>
                                <input type="color" 
                                       value="${this.formData.customColors?.accent || this.themes[this.formData.theme].colors.accent}"
                                       onchange="generatorV2.updateColor('accent', this.value)">
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    step3_features() {
        return `
            <div class="step-content">
                <h2>⚡ Platform Features</h2>
                
                <div class="features-grid">
                    <label class="feature-card ${this.formData.enableLeaderboard ? 'selected' : ''}">
                        <input type="checkbox" 
                               ${this.formData.enableLeaderboard ? 'checked' : ''}
                               onchange="generatorV2.updateData('enableLeaderboard', this.checked)">
                        <div class="feature-content">
                            <span class="feature-icon">🏆</span>
                            <h4>Leaderboard</h4>
                            <p>Rankings & standings</p>
                        </div>
                    </label>

                    <label class="feature-card ${this.formData.enableChat ? 'selected' : ''}">
                        <input type="checkbox" 
                               ${this.formData.enableChat ? 'checked' : ''}
                               onchange="generatorV2.updateData('enableChat', this.checked)">
                        <div class="feature-content">
                            <span class="feature-icon">💬</span>
                            <h4>Group Chat</h4>
                            <p>Real-time messaging</p>
                        </div>
                    </label>

                    <label class="feature-card ${this.formData.enableSideBets ? 'selected' : ''}">
                        <input type="checkbox" 
                               ${this.formData.enableSideBets ? 'checked' : ''}
                               onchange="generatorV2.updateData('enableSideBets', this.checked)">
                        <div class="feature-content">
                            <span class="feature-icon">🤝</span>
                            <h4>Side Bets</h4>
                            <p>Member vs member</p>
                        </div>
                    </label>

                    <label class="feature-card ${this.formData.enableAnalytics ? 'selected' : ''}">
                        <input type="checkbox" 
                               ${this.formData.enableAnalytics ? 'checked' : ''}
                               onchange="generatorV2.updateData('enableAnalytics', this.checked)">
                        <div class="feature-content">
                            <span class="feature-icon">📊</span>
                            <h4>AI Analytics</h4>
                            <p>Smart insights</p>
                        </div>
                    </label>

                    <label class="feature-card ${this.formData.enableLiveScores ? 'selected' : ''}">
                        <input type="checkbox" 
                               ${this.formData.enableLiveScores ? 'checked' : ''}
                               onchange="generatorV2.updateData('enableLiveScores', this.checked)">
                        <div class="feature-content">
                            <span class="feature-icon">📡</span>
                            <h4>Live Scores</h4>
                            <p>Real-time updates</p>
                        </div>
                    </label>

                    <label class="feature-card ${this.formData.enableMobile ? 'selected' : ''}">
                        <input type="checkbox" 
                               ${this.formData.enableMobile ? 'checked' : ''}
                               onchange="generatorV2.updateData('enableMobile', this.checked)">
                        <div class="feature-content">
                            <span class="feature-icon">📱</span>
                            <h4>Mobile App</h4>
                            <p>PWA support</p>
                        </div>
                    </label>
                </div>
            </div>
        `;
    }

    step4_betting() {
        return `
            <div class="step-content">
                <h2>🎯 Betting Configuration</h2>
                
                <div class="betting-types">
                    <h3>Bet Types</h3>
                    <div class="bet-type-grid">
                        ${['spread', 'moneyline', 'totals', 'props', 'parlays'].map(type => `
                            <label class="bet-type-card ${(this.formData.bettingTypes || []).includes(type) ? 'selected' : ''}">
                                <input type="checkbox" 
                                       ${(this.formData.bettingTypes || []).includes(type) ? 'checked' : ''}
                                       onchange="generatorV2.toggleBetType('${type}')">
                                <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Games Per Week</label>
                        <select onchange="generatorV2.updateData('gamesPerWeek', this.value)">
                            <option value="3" ${this.formData.gamesPerWeek === '3' ? 'selected' : ''}>3 Games (Casual)</option>
                            <option value="5" ${this.formData.gamesPerWeek === '5' ? 'selected' : ''}>5 Games (Standard)</option>
                            <option value="8" ${this.formData.gamesPerWeek === '8' ? 'selected' : ''}>8 Games (Competitive)</option>
                            <option value="all" ${this.formData.gamesPerWeek === 'all' ? 'selected' : ''}>All Games</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Entry Type</label>
                        <select onchange="generatorV2.updateData('entryType', this.value)">
                            <option value="free" ${this.formData.entryType === 'free' ? 'selected' : ''}>Free</option>
                            <option value="paid" ${this.formData.entryType === 'paid' ? 'selected' : ''}>Paid Entry</option>
                            <option value="weekly" ${this.formData.entryType === 'weekly' ? 'selected' : ''}>Weekly Fee</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    step5_customization() {
        return `
            <div class="step-content">
                <h2>🛠️ Customization</h2>
                
                <div class="form-group">
                    <label>Member Terminology</label>
                    <input type="text" 
                           placeholder="e.g., Players, Degenerates, Members"
                           value="${this.formData.memberTerm || 'Players'}"
                           onchange="generatorV2.updateData('memberTerm', this.value)">
                </div>

                <div class="form-group">
                    <label>Currency Name</label>
                    <input type="text" 
                           placeholder="e.g., Points, Coins, Bucks"
                           value="${this.formData.currencyName || 'Points'}"
                           onchange="generatorV2.updateData('currencyName', this.value)">
                </div>

                <div class="form-group">
                    <label>Language Style</label>
                    <select onchange="generatorV2.updateData('languageStyle', this.value)">
                        <option value="professional" ${this.formData.languageStyle === 'professional' ? 'selected' : ''}>Professional</option>
                        <option value="casual" ${this.formData.languageStyle === 'casual' ? 'selected' : ''}>Casual</option>
                        <option value="edgy" ${this.formData.languageStyle === 'edgy' ? 'selected' : ''}>Edgy/Fun</option>
                    </select>
                </div>
            </div>
        `;
    }

    step6_review() {
        const theme = this.themes[this.formData.theme || 'professional'];
        
        return `
            <div class="step-content">
                <h2>📋 Review & Generate</h2>
                
                <div class="review-card">
                    <h3>Platform Configuration</h3>
                    
                    <div class="review-item">
                        <strong>League Name:</strong>
                        <span>${this.formData.leagueName || 'Not Set'}</span>
                    </div>
                    
                    <div class="review-item">
                        <strong>Theme:</strong>
                        <span>${theme.name}</span>
                    </div>
                    
                    <div class="review-item">
                        <strong>Sport:</strong>
                        <span>${this.formData.sport?.toUpperCase() || 'NFL'}</span>
                    </div>
                    
                    <div class="review-item">
                        <strong>Features:</strong>
                        <span>${this.getEnabledFeatures().join(', ') || 'Basic'}</span>
                    </div>
                    
                    <div class="review-item">
                        <strong>Bet Types:</strong>
                        <span>${(this.formData.bettingTypes || ['spread']).join(', ')}</span>
                    </div>
                </div>

                <div class="ready-message">
                    <h3>🚀 Ready to Generate!</h3>
                    <p>Your complete platform will include:</p>
                    <ul>
                        <li>✅ Custom Homepage</li>
                        <li>✅ Dashboard</li>
                        <li>✅ Picks Management</li>
                        <li>✅ Leaderboard</li>
                        <li>✅ Games Hub</li>
                        <li>✅ User Profiles</li>
                        <li>✅ Live Lines</li>
                    </ul>
                </div>
            </div>
        `;
    }

    // Helper Methods
    updateData(key, value) {
        this.formData[key] = value;
        this.updateDisplay();
    }

    selectTheme(theme) {
        this.formData.theme = theme;
        this.updateDisplay();
    }

    updateColor(type, value) {
        if (!this.formData.customColors) {
            this.formData.customColors = {};
        }
        this.formData.customColors[type] = value;
    }

    toggleBetType(type) {
        if (!this.formData.bettingTypes) {
            this.formData.bettingTypes = [];
        }
        const index = this.formData.bettingTypes.indexOf(type);
        if (index > -1) {
            this.formData.bettingTypes.splice(index, 1);
        } else {
            this.formData.bettingTypes.push(type);
        }
        this.updateDisplay();
    }

    getEnabledFeatures() {
        const features = [];
        if (this.formData.enableLeaderboard) features.push('Leaderboard');
        if (this.formData.enableChat) features.push('Chat');
        if (this.formData.enableSideBets) features.push('Side Bets');
        if (this.formData.enableAnalytics) features.push('Analytics');
        if (this.formData.enableLiveScores) features.push('Live Scores');
        if (this.formData.enableMobile) features.push('Mobile');
        return features;
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
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

    updateDisplay() {
        const container = document.querySelector('.feed-posts');
        if (container) {
            container.innerHTML = this.render();
        }
    }

    // Quick Generate Presets
    async quickGenerate(preset) {
        const timestamp = Date.now();
        
        // For test presets, use backend quick generation
        if (preset.startsWith('test-')) {
            const themeMap = {
                'test-professional': 'professional',
                'test-luxury': 'luxury',
                'test-neon': 'neon-vegas'
            };
            
            console.log('Quick generating platform with preset:', preset);
            this.isGenerating = true;
            
            // Show loading state
            const container = document.querySelector('.feed-posts');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 4rem;">
                        <div style="font-size: 3rem; animation: spin 1s linear infinite;">⚡</div>
                        <h2>Generating ${themeMap[preset]} Platform...</h2>
                        <p>Creating league with real users from database...</p>
                    </div>
                `;
            }
            
            try {
                // Get current user from localStorage
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                
                const tierMap = {
                    'test-professional': 'essential',
                    'test-luxury': 'luxury',
                    'test-neon': 'premium'
                };
                
                const response = await fetch('/api/platforms/quick-generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        preset: themeMap[preset] || 'professional',
                        tier: tierMap[preset] || 'essential',
                        userId: currentUser._id || currentUser.id
                    })
                });
                
                const result = await response.json();
                console.log('Quick generation result:', result);
                
                if (result.success) {
                    this.showQuickSuccess(result);
                } else {
                    throw new Error(result.error || 'Generation failed');
                }
                this.isGenerating = false;
                return;
                
            } catch (error) {
                console.error('Quick generation failed:', error);
                this.showError(error.message || 'Failed to generate platform. Make sure backend is running.');
                this.isGenerating = false;
                return;
            }
        }
        
        const presets = {
            'test-professional': {
                leagueName: 'Professional Test ' + timestamp,
                sport: 'nfl',
                theme: 'professional',
                size: 'small',
                description: 'Professional theme test platform',
                enableLeaderboard: true,
                enableChat: true,
                enableAnalytics: true,
                bettingTypes: ['spread', 'moneyline']
            },
            'test-luxury': {
                leagueName: 'Luxury Test ' + timestamp,
                sport: 'nfl',
                theme: 'luxury',
                size: 'small',
                description: 'Luxury gold theme test platform',
                enableLeaderboard: true,
                enableAnalytics: true,
                enableSideBets: true,
                enableLiveScores: true,
                bettingTypes: ['spread', 'moneyline', 'totals'],
                memberTerm: 'VIP Members',
                currencyName: 'Gold Coins'
            },
            'test-neon': {
                leagueName: 'Neon Vegas Test ' + timestamp,
                sport: 'nfl',
                theme: 'neon-vegas',
                size: 'small',
                description: 'Neon Vegas theme test platform',
                enableLeaderboard: true,
                enableChat: true,
                enableSideBets: true,
                enableMobile: true,
                bettingTypes: ['spread', 'totals', 'props'],
                memberTerm: 'High Rollers',
                currencyName: 'Chips',
                languageStyle: 'edgy'
            },
            'custom': {
                // This one goes through the normal steps
                theme: 'professional',
                bettingTypes: ['spread'],
                enableLeaderboard: true,
                enableChat: true
            },
            // Keep old presets for backward compatibility
            'professional': {
                leagueName: 'Corporate League',
                sport: 'nfl',
                theme: 'professional',
                size: 'large',
                description: 'Professional workplace league',
                enableLeaderboard: true,
                enableAnalytics: true,
                bettingTypes: ['spread', 'moneyline']
            },
            'casual': {
                leagueName: 'Friends & Family',
                sport: 'nfl',
                theme: 'neonVegas',
                size: 'small',
                description: 'Casual fun league',
                enableChat: true,
                enableSideBets: true,
                bettingTypes: ['spread', 'totals']
            },
            'luxury': {
                leagueName: 'High Stakes Elite',
                sport: 'multi',
                theme: 'luxury',
                size: 'medium',
                description: 'Premium high-stakes league',
                enableLeaderboard: true,
                enableAnalytics: true,
                enableLiveScores: true,
                enableMobile: true,
                bettingTypes: ['spread', 'moneyline', 'totals', 'props', 'parlays']
            }
        };

        if (preset === 'custom') {
            // Don't generate, just reset to start the form process
            this.reset();
            return;
        }

        this.formData = presets[preset] || presets['test-professional'];
        this.generatePlatform();
    }

    // Main Generation Function
    async generatePlatform() {
        if (this.isGenerating) return;
        
        this.isGenerating = true;
        this.updateDisplay();
        
        try {
            // Prepare data for backend
            const config = {
                // Required fields
                groupName: this.formData.leagueName || 'Custom League',
                leagueName: this.formData.leagueName || 'Custom League',
                
                // Theme - ensure it's passed correctly
                theme: this.formData.theme || 'professional',
                selectedTheme: this.formData.theme || 'professional',
                
                // Features array
                features: [
                    ...this.getEnabledFeatures().map(f => f.toLowerCase().replace(' ', '-')),
                    'picks',
                    'games'
                ],
                
                // Customization
                customization: {
                    theme: this.formData.theme || 'professional',
                    colors: this.formData.customColors || this.themes[this.formData.theme || 'professional'].colors,
                    language: this.formData.languageStyle || 'casual',
                    leagueDescription: this.formData.description || '',
                    sport: this.formData.sport || 'nfl'
                },
                
                // Settings
                settings: {
                    bettingTypes: this.formData.bettingTypes || ['spread'],
                    entryType: this.formData.entryType || 'free',
                    memberTerm: this.formData.memberTerm || 'Players',
                    currencyName: this.formData.currencyName || 'Points'
                }
            };

            console.log('Generating platform with config:', config);
            console.log('Theme being sent:', config.theme);
            
            const response = await fetch('/api/platforms/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(result);
            } else {
                throw new Error(result.error || 'Generation failed');
            }
            
        } catch (error) {
            console.error('Generation error:', error);
            this.showError(error.message);
        } finally {
            this.isGenerating = false;
        }
    }

    showQuickSuccess(result) {
        // Save platform to localStorage for platform manager
        const userPlatforms = JSON.parse(localStorage.getItem('userPlatforms') || '[]');
        userPlatforms.push({
            platformId: result.platformId || 'N/A',
            leagueCode: result.leagueCode || 'N/A',
            name: result.league?.name || 'Quick Platform',
            leagueName: result.league?.name || 'Quick Platform',
            theme: 'professional',
            sport: 'NFL',
            members: result.league?.members || 0,
            maxMembers: result.league?.maxMembers || 30,
            pot: result.league?.pot || 0,
            entryFee: result.league?.entryFee || 0,
            week: 1,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('userPlatforms', JSON.stringify(userPlatforms));
        
        // Dispatch event for platform manager
        window.dispatchEvent(new CustomEvent('platformCreated', {
            detail: userPlatforms[userPlatforms.length - 1]
        }));
        
        const container = document.querySelector('.feed-posts');
        const launcherUrl = window.location.origin + (result.launcherUrl || '/');
        const directUrl = window.location.origin + (result.directUrl || '/');
        
        container.innerHTML = `
            <div class="success-container">
                <div class="success-icon">✅</div>
                <h1>Platform Generated with Live League!</h1>
                <p>Your platform is connected to the backend and ready for users</p>
                
                <div class="platform-info">
                    <div class="info-item">
                        <strong>Platform ID:</strong> ${result.platformId || 'N/A'}
                    </div>
                    <div class="info-item">
                        <strong>League Code:</strong> ${result.leagueCode || 'N/A'}
                    </div>
                    <div class="info-item">
                        <strong>Current Members:</strong> ${result.league?.members || 0}/${result.league?.maxMembers || 30}
                    </div>
                    <div class="info-item">
                        <strong>Entry Fee:</strong> $${result.league?.entryFee || 0}
                    </div>
                    <div class="info-item">
                        <strong>Current Pot:</strong> $${result.league?.pot || 0}
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button onclick="window.open('${launcherUrl}', '_blank')" class="btn-primary">
                        🚀 Open Platform Launcher
                    </button>
                    <button onclick="window.open('${directUrl}', '_blank')" class="btn-primary" style="background: linear-gradient(135deg, #764ba2, #667eea);">
                        🏠 Direct to Homepage
                    </button>
                    <button onclick="window.open('/platform-manager.html', '_blank')" class="btn-secondary">
                        📁 View All Platforms
                    </button>
                    <button onclick="generatorV2.reset()" class="btn-secondary">
                        ➕ Create Another
                    </button>
                </div>
            </div>
        `;
    }
    
    showSuccess(result) {
        // Save platform to localStorage for platform manager
        const userPlatforms = JSON.parse(localStorage.getItem('userPlatforms') || '[]');
        userPlatforms.push({
            platformId: result.platformId,
            leagueCode: result.leagueCode || 'N/A',
            name: this.formData.leagueName,
            leagueName: this.formData.leagueName,
            theme: this.formData.theme || 'professional',
            sport: this.formData.sport || 'NFL',
            members: 0,
            maxMembers: 30,
            pot: 0,
            week: 1,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('userPlatforms', JSON.stringify(userPlatforms));
        
        // Dispatch event for platform manager
        window.dispatchEvent(new CustomEvent('platformCreated', {
            detail: userPlatforms[userPlatforms.length - 1]
        }));
        
        const container = document.querySelector('.feed-posts');
        const launcherUrl = window.location.origin + result.launcherUrl;
        const directUrl = window.location.origin + result.directUrl;
        
        container.innerHTML = `
            <div class="success-container">
                <div class="success-icon">✅</div>
                <h1>Platform Generated Successfully!</h1>
                <p>Your "${this.formData.leagueName}" platform is ready to use</p>
                
                <div class="platform-info">
                    <div class="info-item">
                        <strong>Platform ID:</strong> ${result.platformId}
                    </div>
                    <div class="info-item">
                        <strong>Pages Created:</strong> ${result.pages?.length || 7}
                    </div>
                    <div class="info-item">
                        <strong>Theme:</strong> ${this.formData.theme}
                    </div>
                </div>
                
                <div class="url-section">
                    <label>Platform Launcher URL:</label>
                    <div class="url-copy">
                        <input type="text" value="${launcherUrl}" readonly>
                        <button onclick="navigator.clipboard.writeText('${launcherUrl}')">Copy</button>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button onclick="window.open('${result.launcherUrl}', '_blank')" class="btn-primary">
                        🚀 Open Platform Launcher
                    </button>
                    <button onclick="window.open('${result.directUrl}', '_blank')" class="btn-primary" style="background: linear-gradient(135deg, #764ba2, #667eea);">
                        🏠 Direct to Homepage
                    </button>
                    <button onclick="generatorV2.reset()" class="btn-secondary">
                        ➕ Create Another
                    </button>
                </div>
            </div>
        `;
    }

    showError(message) {
        const container = document.querySelector('.feed-posts');
        container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2>Generation Failed</h2>
                <p>${message}</p>
                <button onclick="generatorV2.reset()" class="btn-primary">Try Again</button>
            </div>
        `;
    }

    reset() {
        this.currentStep = 1;
        this.formData = {
            theme: 'professional',
            features: [],
            bettingTypes: ['spread'],
            enableLeaderboard: true,
            enableChat: true
        };
        this.isGenerating = false;
        this.updateDisplay();
    }
}

// Initialize
window.generatorV2 = new PlatformGeneratorV2();

// Add styles
const styles = `
<style>
.platform-generator-v2 {
    max-width: 800px;
    margin: 0 auto;
    background: var(--bg-secondary, #1a1f2e);
    border-radius: 20px;
    padding: 2rem;
    color: white;
}

.generator-header {
    text-align: center;
    margin-bottom: 2rem;
}

.generator-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
}

.quick-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin: 1.5rem 0;
    flex-wrap: wrap;
}

.quick-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    background: rgba(255,255,255,0.1);
    color: white;
}

.quick-btn.primary {
    background: linear-gradient(135deg, #00ff88, #00cc6a);
    color: black;
}

.quick-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,255,136,0.3);
}

.progress-bar {
    height: 6px;
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
    overflow: hidden;
    margin: 1rem 0;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #00ff88, #00cc6a);
    transition: width 0.3s;
}

.step-indicator {
    color: rgba(255,255,255,0.6);
    font-size: 0.9rem;
}

.step-content {
    padding: 2rem 0;
}

.step-content h2 {
    margin-bottom: 1.5rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 0.75rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 8px;
    color: white;
}

.form-group small {
    display: block;
    margin-top: 0.25rem;
    color: rgba(255,255,255,0.6);
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.theme-card {
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s;
}

.theme-card.selected {
    border-color: #00ff88;
    box-shadow: 0 0 20px rgba(0,255,136,0.3);
}

.theme-preview {
    height: 80px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
}

.theme-colors {
    display: flex;
    gap: 0.5rem;
}

.theme-colors span {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
}

.color-customizer {
    margin-top: 2rem;
    padding: 1.5rem;
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
}

.color-inputs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-top: 1rem;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
}

.feature-card {
    position: relative;
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 12px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s;
}

.feature-card input {
    position: absolute;
    opacity: 0;
}

.feature-card.selected {
    border-color: #00ff88;
    background: rgba(0,255,136,0.1);
}

.feature-content {
    text-align: center;
}

.feature-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.bet-type-grid {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.bet-type-card {
    padding: 0.75rem 1.5rem;
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
}

.bet-type-card input {
    display: none;
}

.bet-type-card.selected {
    border-color: #00ff88;
    background: rgba(0,255,136,0.1);
}

.review-card {
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.review-item {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.review-item:last-child {
    border-bottom: none;
}

.ready-message {
    background: linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,204,106,0.1));
    border: 1px solid #00ff88;
    border-radius: 12px;
    padding: 1.5rem;
}

.ready-message ul {
    list-style: none;
    padding: 0;
    margin-top: 1rem;
}

.ready-message li {
    padding: 0.5rem 0;
}

.generator-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255,255,255,0.1);
}

.nav-btn {
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.nav-btn.primary {
    background: linear-gradient(135deg, #00ff88, #00cc6a);
    color: black;
}

.nav-btn.secondary {
    background: rgba(255,255,255,0.1);
    color: white;
}

.nav-btn.generate {
    background: linear-gradient(135deg, #ff00ff, #00ffff);
    color: white;
    font-size: 1.1rem;
}

.nav-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Success Screen */
.success-container {
    text-align: center;
    padding: 3rem;
    background: var(--bg-secondary, #1a1f2e);
    border-radius: 20px;
}

.success-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.platform-info {
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
    padding: 1.5rem;
    margin: 2rem 0;
}

.info-item {
    padding: 0.5rem;
}

.url-section {
    margin: 2rem 0;
}

.url-copy {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
}

.url-copy input {
    flex: 1;
    padding: 0.75rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 8px;
    color: white;
}

.url-copy button {
    padding: 0.75rem 1.5rem;
    background: #00ff88;
    color: black;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

.action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
}

.btn-primary,
.btn-secondary {
    padding: 1rem 2rem;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-primary {
    background: linear-gradient(135deg, #00ff88, #00cc6a);
    color: black;
}

.btn-secondary {
    background: rgba(255,255,255,0.1);
    color: white;
}

/* Error Screen */
.error-container {
    text-align: center;
    padding: 3rem;
    background: var(--bg-secondary, #1a1f2e);
    border-radius: 20px;
}

.error-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
    }
    
    .theme-grid,
    .features-grid {
        grid-template-columns: 1fr;
    }
    
    .quick-actions {
        flex-direction: column;
    }
    
    .generator-footer {
        flex-direction: column;
        gap: 1rem;
    }
    
    .nav-btn {
        width: 100%;
    }
}
</style>
`;

// Inject styles
if (!document.getElementById('generator-v2-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'generator-v2-styles';
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
}

// Load function
function loadPlatformGeneratorV2() {
    const container = document.querySelector('.feed-posts');
    if (container) {
        container.innerHTML = generatorV2.render();
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformGeneratorV2;
}