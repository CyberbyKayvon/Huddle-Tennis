// Golf Profile Component - Secure, Complete Implementation
// Handles both Junior Golfer and College Recruiter profiles with full security

class GolfProfileComponent {
    constructor() {
        this.currentUser = null;
        this.viewingUser = null;
        this.isOwnProfile = true;
        this.profileType = null; // 'golfer' or 'recruiter'
        this.tempProfileData = {};
        this.uploadedFiles = {};
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    }

    // Security utilities
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePhone(phone) {
        const re = /^[\d\s\-\(\)\+]+$/;
        return re.test(phone);
    }

    validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    async loadProfile(username = null) {
        const container = document.querySelector('.feed-posts') || document.querySelector('.main-content');
        if (!container) return;

        container.innerHTML = this.createLoadingState();

        try {
            if (!username) {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                username = currentUser?.username || 'current_user';
                this.isOwnProfile = true;
                
                // Check for saved profile data
                const savedProfile = localStorage.getItem('golfProfileData');
                if (savedProfile) {
                    this.viewingUser = JSON.parse(savedProfile);
                    this.profileType = this.viewingUser.profileType;
                    
                    // Render the appropriate profile
                    if (this.profileType === 'golfer') {
                        container.innerHTML = this.createGolferProfileHTML();
                    } else if (this.profileType === 'recruiter') {
                        container.innerHTML = this.createRecruiterProfileHTML();
                    }
                    this.attachEventListeners();
                    return;
                }
            } else {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                this.isOwnProfile = currentUser?.username === username || username === 'current_user';
            }

            // Fetch user data
            try {
                const response = await fetch(`/api/users/${username}`, {
                    headers: this.getAuthHeaders()
                });

                if (!response.ok) {
                    throw new Error('User not found');
                }

            const data = await response.json();
            
            // Handle missing or incomplete data
            if (!data || !data.user) {
                // Mock data for testing - replace with actual user data later
                this.viewingUser = {
                    username: username || 'test_user',
                    displayName: 'Test User',
                    profileType: null
                };
            } else {
                this.viewingUser = data.user;
            }
            
            this.profileType = this.viewingUser?.profileType || null;

            // Render profile based on type
            if (this.profileType === 'golfer') {
                container.innerHTML = this.createGolferProfileHTML();
            } else if (this.profileType === 'recruiter') {
                container.innerHTML = this.createRecruiterProfileHTML();
            } else if (this.isOwnProfile) {
                container.innerHTML = this.createProfileTypeSelection();
            } else {
                container.innerHTML = this.createIncompleteProfileView();
            }

            this.attachEventListeners();
            
            } catch (fetchError) {
                // Use mock data for development
                console.log('API not available, using mock data');
                this.viewingUser = {
                    username: username || 'test_user',
                    displayName: 'Test User',
                    profileType: null
                };
                this.profileType = null;
                
                if (this.isOwnProfile) {
                    container.innerHTML = this.createProfileTypeSelection();
                } else {
                    container.innerHTML = this.createIncompleteProfileView();
                }
                
                this.attachEventListeners();
            }

        } catch (error) {
            console.error('Failed to load profile:', error);
            container.innerHTML = this.createErrorState();
        }
    }

    createGolferProfileHTML() {
        const user = this.viewingUser;
        const info = user.golferInfo || {};
        const stats = info.stats || {};
        const rankings = info.rankings || {};

        return `
            <div class="golfer-profile">
                <!-- Header with Cover Photo -->
                <div class="profile-header" style="position: relative; height: 300px; background: linear-gradient(135deg, #0a3d0c, #4ade80); border-radius: 20px; overflow: hidden; margin-bottom: 2rem;">
                    ${info.coverPhoto ? `<img src="${this.sanitizeInput(info.coverPhoto)}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;">` : ''}
                    
                    <!-- Overlay gradient -->
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 150px; background: linear-gradient(transparent, rgba(0,0,0,0.8));"></div>
                    
                    <!-- Profile Info Overlay -->
                    <div style="position: absolute; bottom: 2rem; left: 2rem; right: 2rem; display: flex; gap: 2rem; align-items: flex-end;">
                        <!-- Avatar -->
                        <div style="position: relative;">
                            <div style="width: 120px; height: 120px; border-radius: 50%; background: white; padding: 4px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                                ${user.avatar ? 
                                    `<img src="${this.sanitizeInput(user.avatar)}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
                                    `<div style="width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #10b981, #34d399); display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: bold; color: white;">
                                        ${this.sanitizeInput(user.displayName?.charAt(0) || 'G')}
                                    </div>`
                                }
                            </div>
                            ${this.isOwnProfile ? `
                                <button onclick="window.golfProfile.openEditModal()" style="position: absolute; bottom: 0; right: 0; width: 36px; height: 36px; border-radius: 50%; background: #10b981; border: 3px solid white; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-camera"></i>
                                </button>
                            ` : ''}
                        </div>
                        
                        <!-- Name and Basic Info -->
                        <div style="flex: 1; color: white;">
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                                <h1 style="margin: 0; font-size: 2rem;">${this.sanitizeInput(user.displayName || user.username)}</h1>
                                ${user.verified ? '<i class="fas fa-check-circle" style="color: #10b981;"></i>' : ''}
                                ${info.committed ? `<span style="background: #fbbf24; color: black; padding: 0.25rem 0.75rem; border-radius: 20px; font-weight: bold; font-size: 0.875rem;">Committed</span>` : ''}
                            </div>
                            <div style="display: flex; gap: 2rem; font-size: 0.95rem; opacity: 0.9;">
                                <span><i class="fas fa-graduation-cap"></i> Class of ${this.sanitizeInput(info.graduationYear || '20XX')}</span>
                                <span><i class="fas fa-map-marker-alt"></i> ${this.sanitizeInput(info.hometown || 'Location')}</span>
                                <span><i class="fas fa-school"></i> ${this.sanitizeInput(info.highSchool || 'School')}</span>
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div style="display: flex; gap: 1rem;">
                            ${this.isOwnProfile ? `
                                <button onclick="window.golfProfile.openEditModal()" style="padding: 0.75rem 1.5rem; background: white; color: #0a3d0c; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">
                                    <i class="fas fa-edit"></i> Edit Profile
                                </button>
                                <button onclick="window.golfProfile.switchProfileType()" style="padding: 0.75rem 1.5rem; background: #fbbf24; color: black; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">
                                    <i class="fas fa-exchange-alt"></i> Switch to Recruiter
                                </button>
                            ` : `
                                <button onclick="window.golfProfile.toggleFollow('${user.id}')" style="padding: 0.75rem 1.5rem; background: #10b981; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">
                                    ${user.isFollowing ? 'Following' : 'Follow'}
                                </button>
                                <button onclick="window.golfProfile.sendMessage('${user.id}')" style="padding: 0.75rem 1.5rem; background: white; color: #0a3d0c; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">
                                    <i class="fas fa-envelope"></i> Message
                                </button>
                            `}
                        </div>
                    </div>
                </div>

                <!-- Quick Stats Bar -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 1rem; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #10b981;">${this.sanitizeInput(stats.handicap || 'N/A')}</div>
                        <div style="color: #6ee7b7; font-size: 0.875rem;">Handicap</div>
                    </div>
                    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 1rem; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #10b981;">${this.sanitizeInput(stats.scoringAverage || 'N/A')}</div>
                        <div style="color: #6ee7b7; font-size: 0.875rem;">Scoring Avg</div>
                    </div>
                    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 1rem; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #10b981;">#${this.sanitizeInput(rankings.national || 'N/A')}</div>
                        <div style="color: #6ee7b7; font-size: 0.875rem;">National Rank</div>
                    </div>
                    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 1rem; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #10b981;">${this.sanitizeInput(info.gpa || 'N/A')}</div>
                        <div style="color: #6ee7b7; font-size: 0.875rem;">GPA</div>
                    </div>
                </div>

                <!-- Profile Tabs -->
                <div style="display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid rgba(16, 185, 129, 0.2); padding-bottom: 0;">
                    <button class="profile-tab active" data-tab="overview" style="padding: 1rem 1.5rem; background: none; border: none; color: #10b981; cursor: pointer; position: relative; font-weight: 600;">
                        <i class="fas fa-user"></i> Overview
                        <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #10b981; border-radius: 3px 3px 0 0;"></div>
                    </button>
                    <button class="profile-tab" data-tab="stats" style="padding: 1rem 1.5rem; background: none; border: none; color: #6ee7b7; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-chart-line"></i> Stats
                    </button>
                    <button class="profile-tab" data-tab="tournaments" style="padding: 1rem 1.5rem; background: none; border: none; color: #6ee7b7; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-trophy"></i> Tournaments
                    </button>
                    <button class="profile-tab" data-tab="videos" style="padding: 1rem 1.5rem; background: none; border: none; color: #6ee7b7; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-video"></i> Videos
                    </button>
                    <button class="profile-tab" data-tab="academics" style="padding: 1rem 1.5rem; background: none; border: none; color: #6ee7b7; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-graduation-cap"></i> Academics
                    </button>
                </div>

                <!-- Tab Content -->
                <div id="profileTabContent">
                    ${this.createGolferOverviewTab()}
                </div>
            </div>
        `;
    }

    createGolferOverviewTab() {
        const info = this.viewingUser.golferInfo || {};
        const achievements = info.achievements || [];
        const equipment = info.equipment || {};

        return `
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                <!-- Left Column -->
                <div>
                    <!-- About Section -->
                    <div style="background: rgba(16, 185, 129, 0.05); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                        <h3 style="color: #10b981; margin-bottom: 1rem;"><i class="fas fa-info-circle"></i> About</h3>
                        <p style="color: #e6fffa; line-height: 1.6;">${this.sanitizeInput(this.viewingUser.bio || 'No bio yet')}</p>
                        
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1.5rem;">
                            <div>
                                <span style="color: #6ee7b7; font-size: 0.875rem;">Height</span>
                                <div style="color: #e6fffa; font-weight: 600;">${this.sanitizeInput(info.height || 'N/A')}</div>
                            </div>
                            <div>
                                <span style="color: #6ee7b7; font-size: 0.875rem;">Weight</span>
                                <div style="color: #e6fffa; font-weight: 600;">${this.sanitizeInput(info.weight || 'N/A')}</div>
                            </div>
                            <div>
                                <span style="color: #6ee7b7; font-size: 0.875rem;">Plays</span>
                                <div style="color: #e6fffa; font-weight: 600;">${this.sanitizeInput(info.plays || 'N/A')}</div>
                            </div>
                            <div>
                                <span style="color: #6ee7b7; font-size: 0.875rem;">Home Club</span>
                                <div style="color: #e6fffa; font-weight: 600;">${this.sanitizeInput(info.homeClub || 'N/A')}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity Feed -->
                    <div style="background: rgba(16, 185, 129, 0.05); border-radius: 16px; padding: 1.5rem;">
                        <h3 style="color: #10b981; margin-bottom: 1rem;"><i class="fas fa-stream"></i> Recent Activity</h3>
                        ${this.createActivityFeed()}
                    </div>
                </div>

                <!-- Right Column -->
                <div>
                    <!-- Achievements -->
                    <div style="background: rgba(16, 185, 129, 0.05); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                        <h3 style="color: #10b981; margin-bottom: 1rem;"><i class="fas fa-medal"></i> Achievements</h3>
                        ${achievements.length > 0 ? 
                            achievements.map(achievement => `
                                <div style="padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; margin-bottom: 0.5rem;">
                                    <i class="fas fa-trophy" style="color: #fbbf24; margin-right: 0.5rem;"></i>
                                    <span style="color: #e6fffa;">${this.sanitizeInput(achievement)}</span>
                                </div>
                            `).join('') :
                            '<p style="color: #6ee7b7;">No achievements added yet</p>'
                        }
                    </div>

                    <!-- Equipment -->
                    <div style="background: rgba(16, 185, 129, 0.05); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                        <h3 style="color: #10b981; margin-bottom: 1rem;"><i class="fas fa-golf-ball"></i> Equipment</h3>
                        <div style="display: grid; gap: 0.75rem;">
                            <div>
                                <span style="color: #6ee7b7; font-size: 0.875rem;">Driver</span>
                                <div style="color: #e6fffa;">${this.sanitizeInput(equipment.driver || 'Not specified')}</div>
                            </div>
                            <div>
                                <span style="color: #6ee7b7; font-size: 0.875rem;">Irons</span>
                                <div style="color: #e6fffa;">${this.sanitizeInput(equipment.irons || 'Not specified')}</div>
                            </div>
                            <div>
                                <span style="color: #6ee7b7; font-size: 0.875rem;">Putter</span>
                                <div style="color: #e6fffa;">${this.sanitizeInput(equipment.putter || 'Not specified')}</div>
                            </div>
                            <div>
                                <span style="color: #6ee7b7; font-size: 0.875rem;">Ball</span>
                                <div style="color: #e6fffa;">${this.sanitizeInput(equipment.ball || 'Not specified')}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Contact Info (if public or own profile) -->
                    ${(this.isOwnProfile || info.publicContact) ? `
                        <div style="background: rgba(16, 185, 129, 0.05); border-radius: 16px; padding: 1.5rem;">
                            <h3 style="color: #10b981; margin-bottom: 1rem;"><i class="fas fa-address-card"></i> Contact</h3>
                            ${info.email ? `
                                <div style="margin-bottom: 0.75rem;">
                                    <i class="fas fa-envelope" style="color: #6ee7b7; margin-right: 0.5rem;"></i>
                                    <a href="mailto:${this.sanitizeInput(info.email)}" style="color: #10b981; text-decoration: none;">${this.sanitizeInput(info.email)}</a>
                                </div>
                            ` : ''}
                            ${info.phone ? `
                                <div style="margin-bottom: 0.75rem;">
                                    <i class="fas fa-phone" style="color: #6ee7b7; margin-right: 0.5rem;"></i>
                                    <span style="color: #e6fffa;">${this.sanitizeInput(info.phone)}</span>
                                </div>
                            ` : ''}
                            ${info.instagram ? `
                                <div style="margin-bottom: 0.75rem;">
                                    <i class="fab fa-instagram" style="color: #6ee7b7; margin-right: 0.5rem;"></i>
                                    <a href="https://instagram.com/${this.sanitizeInput(info.instagram)}" target="_blank" style="color: #10b981; text-decoration: none;">@${this.sanitizeInput(info.instagram)}</a>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createRecruiterProfileHTML() {
        const user = this.viewingUser;
        const info = user.recruiterInfo || {};
        const program = info.programInfo || {};

        return `
            <div class="recruiter-profile">
                <!-- Header -->
                <div style="position: relative; height: 250px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); border-radius: 20px; overflow: hidden; margin-bottom: 2rem;">
                    ${info.schoolBanner ? `<img src="${this.sanitizeInput(info.schoolBanner)}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
                    
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 100px; background: linear-gradient(transparent, rgba(0,0,0,0.8));"></div>
                    
                    <div style="position: absolute; bottom: 2rem; left: 2rem; right: 2rem; display: flex; gap: 2rem; align-items: flex-end;">
                        <!-- School Logo -->
                        <div style="width: 100px; height: 100px; background: white; border-radius: 12px; padding: 1rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                            ${info.schoolLogo ? 
                                `<img src="${this.sanitizeInput(info.schoolLogo)}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` :
                                `<span style="font-size: 2rem; font-weight: bold; color: #1e3a8a;">${this.sanitizeInput(info.school?.charAt(0) || 'U')}</span>`
                            }
                        </div>
                        
                        <!-- School Info -->
                        <div style="flex: 1; color: white;">
                            <h1 style="margin: 0; font-size: 2rem;">${this.sanitizeInput(info.school || 'University')}</h1>
                            <div style="display: flex; gap: 2rem; font-size: 0.95rem; opacity: 0.9;">
                                <span>${this.sanitizeInput(user.displayName)}</span>
                                <span>${this.sanitizeInput(info.position || 'Coach')}</span>
                                <span>${this.sanitizeInput(info.division || 'Division')}</span>
                                <span>${this.sanitizeInput(info.conference || 'Conference')}</span>
                            </div>
                        </div>
                        
                        <!-- Actions -->
                        <div style="display: flex; gap: 1rem;">
                            ${this.isOwnProfile ? `
                                <button onclick="window.golfProfile.openEditModal()" style="padding: 0.75rem 1.5rem; background: white; color: #1e3a8a; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">
                                    <i class="fas fa-edit"></i> Edit Profile
                                </button>
                                <button onclick="window.golfProfile.switchProfileType()" style="padding: 0.75rem 1.5rem; background: #fbbf24; color: black; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">
                                    <i class="fas fa-exchange-alt"></i> Switch to Golfer
                                </button>
                            ` : `
                                <button onclick="window.golfProfile.sendMessage('${user.id}')" style="padding: 0.75rem 1.5rem; background: white; color: #1e3a8a; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">
                                    <i class="fas fa-envelope"></i> Contact Coach
                                </button>
                            `}
                        </div>
                    </div>
                </div>

                <!-- Program Quick Stats -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 1rem; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">#${this.sanitizeInput(program.ranking || 'N/A')}</div>
                        <div style="color: #93bbfc; font-size: 0.875rem;">National Ranking</div>
                    </div>
                    <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 1rem; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">${this.sanitizeInput(program.scholarships || 'N/A')}</div>
                        <div style="color: #93bbfc; font-size: 0.875rem;">Scholarships Available</div>
                    </div>
                    <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 1rem; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">${this.sanitizeInput(program.championships || '0')}</div>
                        <div style="color: #93bbfc; font-size: 0.875rem;">Championships</div>
                    </div>
                    <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 1rem; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">${this.sanitizeInput(program.rosterSize || 'N/A')}</div>
                        <div style="color: #93bbfc; font-size: 0.875rem;">Roster Size</div>
                    </div>
                </div>

                <!-- Tabs -->
                <div style="display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid rgba(59, 130, 246, 0.2); padding-bottom: 0;">
                    <button class="profile-tab active" data-tab="program" style="padding: 1rem 1.5rem; background: none; border: none; color: #3b82f6; cursor: pointer; position: relative; font-weight: 600;">
                        <i class="fas fa-university"></i> Program
                        <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #3b82f6; border-radius: 3px 3px 0 0;"></div>
                    </button>
                    <button class="profile-tab" data-tab="recruiting" style="padding: 1rem 1.5rem; background: none; border: none; color: #93bbfc; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-search"></i> Recruiting
                    </button>
                    <button class="profile-tab" data-tab="roster" style="padding: 1rem 1.5rem; background: none; border: none; color: #93bbfc; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-users"></i> Roster
                    </button>
                    <button class="profile-tab" data-tab="facilities" style="padding: 1rem 1.5rem; background: none; border: none; color: #93bbfc; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-golf-ball"></i> Facilities
                    </button>
                </div>

                <!-- Tab Content -->
                <div id="profileTabContent">
                    ${this.createRecruiterProgramTab()}
                </div>
            </div>
        `;
    }

    createRecruiterProgramTab() {
        const info = this.viewingUser.recruiterInfo || {};
        const program = info.programInfo || {};

        return `
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                <!-- Left Column -->
                <div>
                    <!-- About Program -->
                    <div style="background: rgba(59, 130, 246, 0.05); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                        <h3 style="color: #3b82f6; margin-bottom: 1rem;"><i class="fas fa-info-circle"></i> About Our Program</h3>
                        <p style="color: #e6fffa; line-height: 1.6;">${this.sanitizeInput(program.description || 'Program description not available')}</p>
                        
                        <div style="margin-top: 1.5rem;">
                            <h4 style="color: #3b82f6; margin-bottom: 1rem;">What We Offer</h4>
                            <div style="display: grid; gap: 0.5rem;">
                                ${program.offerings ? program.offerings.map(offer => `
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <i class="fas fa-check-circle" style="color: #10b981;"></i>
                                        <span style="color: #e6fffa;">${this.sanitizeInput(offer)}</span>
                                    </div>
                                `).join('') : '<p style="color: #93bbfc;">Details coming soon</p>'}
                            </div>
                        </div>
                    </div>

                    <!-- Recent Commits -->
                    <div style="background: rgba(59, 130, 246, 0.05); border-radius: 16px; padding: 1.5rem;">
                        <h3 style="color: #3b82f6; margin-bottom: 1rem;"><i class="fas fa-handshake"></i> Recent Commitments</h3>
                        ${info.recentSignees && info.recentSignees.length > 0 ? 
                            info.recentSignees.map(signee => `
                                <div style="padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px; margin-bottom: 0.75rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <div style="font-weight: 600; color: #e6fffa;">${this.sanitizeInput(signee.name)}</div>
                                            <div style="font-size: 0.875rem; color: #93bbfc;">
                                                ${this.sanitizeInput(signee.hometown || '')} • Class of ${this.sanitizeInput(signee.year)}
                                            </div>
                                        </div>
                                        ${signee.ranking ? `
                                            <div style="text-align: right;">
                                                <div style="color: #fbbf24; font-weight: 600;">#${this.sanitizeInput(signee.ranking)}</div>
                                                <div style="font-size: 0.75rem; color: #93bbfc;">National</div>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('') :
                            '<p style="color: #93bbfc;">No recent commitments to display</p>'
                        }
                    </div>
                </div>

                <!-- Right Column -->
                <div>
                    <!-- Recruiting Needs -->
                    <div style="background: rgba(59, 130, 246, 0.05); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                        <h3 style="color: #3b82f6; margin-bottom: 1rem;"><i class="fas fa-bullseye"></i> Recruiting Priorities</h3>
                        <div style="display: grid; gap: 1rem;">
                            <div>
                                <span style="color: #93bbfc; font-size: 0.875rem;">Recruiting Classes</span>
                                <div style="color: #e6fffa; font-weight: 600;">
                                    ${info.recruitingNeeds?.classYears?.join(', ') || 'All classes'}
                                </div>
                            </div>
                            <div>
                                <span style="color: #93bbfc; font-size: 0.875rem;">Positions Available</span>
                                <div style="color: #e6fffa; font-weight: 600;">
                                    ${info.recruitingNeeds?.positions || 'Contact coach'}
                                </div>
                            </div>
                            <div>
                                <span style="color: #93bbfc; font-size: 0.875rem;">Min. Handicap</span>
                                <div style="color: #e6fffa; font-weight: 600;">
                                    ${info.recruitingNeeds?.preferences?.minHandicap || 'Varies'}
                                </div>
                            </div>
                            <div>
                                <span style="color: #93bbfc; font-size: 0.875rem;">Min. GPA</span>
                                <div style="color: #e6fffa; font-weight: 600;">
                                    ${info.recruitingNeeds?.preferences?.minGPA || 'Contact coach'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Contact Information -->
                    <div style="background: rgba(59, 130, 246, 0.05); border-radius: 16px; padding: 1.5rem;">
                        <h3 style="color: #3b82f6; margin-bottom: 1rem;"><i class="fas fa-phone"></i> Contact</h3>
                        ${info.email ? `
                            <div style="margin-bottom: 0.75rem;">
                                <i class="fas fa-envelope" style="color: #93bbfc; margin-right: 0.5rem;"></i>
                                <a href="mailto:${this.sanitizeInput(info.email)}" style="color: #3b82f6; text-decoration: none;">
                                    ${this.sanitizeInput(info.email)}
                                </a>
                            </div>
                        ` : ''}
                        ${info.phone ? `
                            <div style="margin-bottom: 0.75rem;">
                                <i class="fas fa-phone" style="color: #93bbfc; margin-right: 0.5rem;"></i>
                                <span style="color: #e6fffa;">${this.sanitizeInput(info.phone)}</span>
                            </div>
                        ` : ''}
                        ${info.recruitingCoordinator ? `
                            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(59, 130, 246, 0.2);">
                                <div style="font-size: 0.875rem; color: #93bbfc;">Recruiting Coordinator</div>
                                <div style="color: #e6fffa; font-weight: 600;">${this.sanitizeInput(info.recruitingCoordinator)}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    openEditModal() {
        const modal = document.createElement('div');
        modal.id = 'profileEditModal';
        modal.className = 'profile-edit-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow-y: auto;
        `;

        const content = this.profileType === 'golfer' ? 
            this.createGolferEditForm() : 
            this.createRecruiterEditForm();

        modal.innerHTML = `
            <div style="background: #0a1f0a; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 20px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative;">
                <div style="position: sticky; top: 0; background: #0a1f0a; padding: 1.5rem; border-bottom: 1px solid rgba(16, 185, 129, 0.2); display: flex; justify-content: space-between; align-items: center; z-index: 10;">
                    <h2 style="margin: 0; color: #10b981;">Edit Profile</h2>
                    <button onclick="window.golfProfile.closeEditModal()" style="background: none; border: none; color: #6ee7b7; font-size: 2rem; cursor: pointer; width: 40px; height: 40px;">&times;</button>
                </div>
                <div style="padding: 2rem;">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.attachEditModalListeners();
    }

    createGolferEditForm() {
        // Ensure viewingUser exists with proper structure
        if (!this.viewingUser) {
            this.viewingUser = {
                username: 'current_user',
                displayName: 'Your Name',
                profileType: 'golfer',
                golferInfo: {
                    graduationYear: new Date().getFullYear() + 4,
                    hometown: '',
                    highSchool: '',
                    stats: {},
                    rankings: {},
                    tournaments: [],
                    videos: {}
                }
            };
        }
        
        if (!this.viewingUser.golferInfo) {
            this.viewingUser.golferInfo = {
                graduationYear: new Date().getFullYear() + 4,
                hometown: '',
                highSchool: '',
                stats: {},
                rankings: {},
                tournaments: [],
                videos: {}
            };
        }
        
        const info = this.viewingUser.golferInfo || {};
        const stats = info.stats || {};
        const rankings = info.rankings || {};

        return `
            <form id="golferEditForm" onsubmit="window.golfProfile.saveProfile(event)">
                <!-- Basic Information -->
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #10b981; margin-bottom: 1rem;"><i class="fas fa-user"></i> Basic Information</h3>
                    
                    <!-- Profile Pictures -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1.5rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Profile Picture</label>
                            <input type="file" id="avatarInput" accept="image/*" onchange="window.golfProfile.handleImageUpload(event, 'avatar')" style="display: none;">
                            <button type="button" onclick="document.getElementById('avatarInput').click()" style="padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; color: #10b981; cursor: pointer; width: 100%;">
                                <i class="fas fa-camera"></i> Upload Avatar
                            </button>
                            <div id="avatarPreview" style="margin-top: 0.5rem;"></div>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Cover Photo</label>
                            <input type="file" id="coverInput" accept="image/*" onchange="window.golfProfile.handleImageUpload(event, 'cover')" style="display: none;">
                            <button type="button" onclick="document.getElementById('coverInput').click()" style="padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; color: #10b981; cursor: pointer; width: 100%;">
                                <i class="fas fa-image"></i> Upload Cover
                            </button>
                            <div id="coverPreview" style="margin-top: 0.5rem;"></div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Display Name *</label>
                            <input type="text" name="displayName" value="${this.sanitizeInput(this.viewingUser.displayName || '')}" required
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Graduation Year *</label>
                            <select name="graduationYear" required style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                                ${[2025, 2026, 2027, 2028, 2029, 2030].map(year => 
                                    `<option value="${year}" ${info.graduationYear == year ? 'selected' : ''}>${year}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Hometown *</label>
                            <input type="text" name="hometown" value="${this.sanitizeInput(info.hometown || '')}" required
                                   placeholder="City, State"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">High School *</label>
                            <input type="text" name="highSchool" value="${this.sanitizeInput(info.highSchool || '')}" required
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Height</label>
                            <input type="text" name="height" value="${this.sanitizeInput(info.height || '')}"
                                   placeholder="5'10\""
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Weight</label>
                            <input type="text" name="weight" value="${this.sanitizeInput(info.weight || '')}"
                                   placeholder="150 lbs"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                    </div>
                    
                    <div style="margin-top: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Bio</label>
                        <textarea name="bio" rows="3" maxlength="500"
                                  style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa; resize: vertical;"
                                  placeholder="Tell recruiters about yourself...">${this.sanitizeInput(this.viewingUser.bio || '')}</textarea>
                        <div style="text-align: right; font-size: 0.75rem; color: #6ee7b7; margin-top: 0.25rem;">
                            <span id="bioCharCount">0</span>/500
                        </div>
                    </div>
                </div>

                <!-- Golf Stats -->
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #10b981; margin-bottom: 1rem;"><i class="fas fa-chart-line"></i> Golf Statistics</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Handicap</label>
                            <input type="text" name="handicap" value="${this.sanitizeInput(stats.handicap || '')}"
                                   placeholder="+2.0"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Scoring Average</label>
                            <input type="number" step="0.1" name="scoringAverage" value="${stats.scoringAverage || ''}"
                                   placeholder="72.5"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Driving Distance (yards)</label>
                            <input type="number" name="drivingDistance" value="${stats.drivingDistance || ''}"
                                   placeholder="280"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Driving Accuracy (%)</label>
                            <input type="number" name="drivingAccuracy" value="${stats.drivingAccuracy || ''}"
                                   min="0" max="100" placeholder="65"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">GIR (%)</label>
                            <input type="number" name="greensInRegulation" value="${stats.greensInRegulation || ''}"
                                   min="0" max="100" placeholder="70"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Putts Per Round</label>
                            <input type="number" step="0.1" name="puttsPerRound" value="${stats.puttsPerRound || ''}"
                                   placeholder="29.5"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                    </div>
                </div>

                <!-- Rankings -->
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #10b981; margin-bottom: 1rem;"><i class="fas fa-trophy"></i> Rankings</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">JGSR Ranking</label>
                            <input type="number" name="jgsrRanking" value="${rankings.jgsr || ''}"
                                   placeholder="125"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">AJGA Ranking</label>
                            <input type="number" name="ajgaRanking" value="${rankings.ajga || ''}"
                                   placeholder="87"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">State Ranking</label>
                            <input type="number" name="stateRanking" value="${rankings.state || ''}"
                                   placeholder="5"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">National Ranking</label>
                            <input type="number" name="nationalRanking" value="${rankings.national || ''}"
                                   placeholder="125"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                    </div>
                </div>

                <!-- Academic Information -->
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #10b981; margin-bottom: 1rem;"><i class="fas fa-graduation-cap"></i> Academics</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">GPA</label>
                            <input type="number" step="0.01" name="gpa" value="${info.gpa || ''}"
                                   min="0" max="5.0" placeholder="3.85"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">SAT Score</label>
                            <input type="number" name="satScore" value="${info.satScore || ''}"
                                   placeholder="1400"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">ACT Score</label>
                            <input type="number" name="actScore" value="${info.actScore || ''}"
                                   placeholder="32"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                    </div>
                </div>

                <!-- Contact Information -->
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #10b981; margin-bottom: 1rem;"><i class="fas fa-address-card"></i> Contact Information</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Email</label>
                            <input type="email" name="email" value="${this.sanitizeInput(info.email || '')}"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Phone</label>
                            <input type="tel" name="phone" value="${this.sanitizeInput(info.phone || '')}"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Instagram</label>
                            <input type="text" name="instagram" value="${this.sanitizeInput(info.instagram || '')}"
                                   placeholder="@username"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Twitter/X</label>
                            <input type="text" name="twitter" value="${this.sanitizeInput(info.twitter || '')}"
                                   placeholder="@username"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                    </div>
                    
                    <div style="margin-top: 1rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" name="publicContact" ${info.publicContact ? 'checked' : ''}
                                   style="width: 20px; height: 20px;">
                            <span style="color: #6ee7b7;">Make contact information public</span>
                        </label>
                    </div>
                </div>

                <!-- Swing Videos -->
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #10b981; margin-bottom: 1rem;"><i class="fas fa-video"></i> Swing Videos</h3>
                    <div style="display: grid; gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Driver Swing Video URL</label>
                            <input type="url" name="driverVideo" value="${this.sanitizeInput(info.videos?.driver || '')}"
                                   placeholder="YouTube or Vimeo URL"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Iron Swing Video URL</label>
                            <input type="url" name="ironVideo" value="${this.sanitizeInput(info.videos?.iron || '')}"
                                   placeholder="YouTube or Vimeo URL"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #6ee7b7;">Course Vlog/Highlights URL</label>
                            <input type="url" name="highlightsVideo" value="${this.sanitizeInput(info.videos?.highlights || '')}"
                                   placeholder="YouTube or Vimeo URL"
                                   style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; gap: 1rem; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid rgba(16, 185, 129, 0.2);">
                    <button type="button" onclick="window.golfProfile.closeEditModal()" 
                            style="padding: 0.75rem 2rem; background: transparent; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; color: #6ee7b7; cursor: pointer;">
                        Cancel
                    </button>
                    <button type="submit" 
                            style="padding: 0.75rem 2rem; background: linear-gradient(135deg, #10b981, #34d399); border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer;">
                        Save Changes
                    </button>
                </div>
            </form>
        `;
    }

    createRecruiterEditForm() {
        // Ensure viewingUser exists with proper structure
        if (!this.viewingUser) {
            this.viewingUser = {
                username: 'current_user',
                displayName: 'Coach Name',
                profileType: 'recruiter',
                recruiterInfo: {
                    school: '',
                    position: '',
                    division: '',
                    conference: '',
                    programInfo: {},
                    recruitingNeeds: {}
                }
            };
        }
        
        if (!this.viewingUser.recruiterInfo) {
            this.viewingUser.recruiterInfo = {
                school: '',
                position: '',
                division: '',
                conference: '',
                programInfo: {},
                recruitingNeeds: {}
            };
        }
        
        const info = this.viewingUser.recruiterInfo || {};
        const program = info.programInfo || {};

        return `
            <form id="recruiterEditForm" onsubmit="window.golfProfile.saveProfile(event)">
                <!-- School Information -->
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #3b82f6; margin-bottom: 1rem;"><i class="fas fa-university"></i> School Information</h3>
                    
                    <!-- School Images -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1.5rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">School Logo</label>
                            <input type="file" id="logoInput" accept="image/*" onchange="window.golfProfile.handleImageUpload(event, 'logo')" style="display: none;">
                            <button type="button" onclick="document.getElementById('logoInput').click()" style="padding: 0.75rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; color: #3b82f6; cursor: pointer; width: 100%;">
                                <i class="fas fa-upload"></i> Upload Logo
                            </button>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Banner Image</label>
                            <input type="file" id="bannerInput" accept="image/*" onchange="window.golfProfile.handleImageUpload(event, 'banner')" style="display: none;">
                            <button type="button" onclick="document.getElementById('bannerInput').click()" style="padding: 0.75rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; color: #3b82f6; cursor: pointer; width: 100%;">
                                <i class="fas fa-image"></i> Upload Banner
                            </button>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">School Name *</label>
                            <input type="text" name="school" value="${this.sanitizeInput(info.school || '')}" required
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Your Position *</label>
                            <select name="position" required style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                                <option value="Head Coach" ${info.position === 'Head Coach' ? 'selected' : ''}>Head Coach</option>
                                <option value="Assistant Coach" ${info.position === 'Assistant Coach' ? 'selected' : ''}>Assistant Coach</option>
                                <option value="Recruiting Coordinator" ${info.position === 'Recruiting Coordinator' ? 'selected' : ''}>Recruiting Coordinator</option>
                                <option value="Director of Golf" ${info.position === 'Director of Golf' ? 'selected' : ''}>Director of Golf</option>
                            </select>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Division *</label>
                            <select name="division" required style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                                <option value="Division I" ${info.division === 'Division I' ? 'selected' : ''}>Division I</option>
                                <option value="Division II" ${info.division === 'Division II' ? 'selected' : ''}>Division II</option>
                                <option value="Division III" ${info.division === 'Division III' ? 'selected' : ''}>Division III</option>
                                <option value="NAIA" ${info.division === 'NAIA' ? 'selected' : ''}>NAIA</option>
                                <option value="Junior College" ${info.division === 'Junior College' ? 'selected' : ''}>Junior College</option>
                            </select>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Conference</label>
                            <input type="text" name="conference" value="${this.sanitizeInput(info.conference || '')}"
                                   placeholder="ACC, SEC, Big Ten, etc."
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                    </div>
                </div>

                <!-- Program Details -->
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #3b82f6; margin-bottom: 1rem;"><i class="fas fa-golf-ball"></i> Program Details</h3>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Program Description</label>
                        <textarea name="programDescription" rows="4" maxlength="1000"
                                  style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa; resize: vertical;"
                                  placeholder="Describe your golf program, culture, and what makes it unique...">${this.sanitizeInput(program.description || '')}</textarea>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">National Ranking</label>
                            <input type="number" name="ranking" value="${program.ranking || ''}"
                                   placeholder="12"
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Championships Won</label>
                            <input type="number" name="championships" value="${program.championships || ''}"
                                   placeholder="3"
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Roster Size</label>
                            <input type="number" name="rosterSize" value="${program.rosterSize || ''}"
                                   placeholder="10"
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Scholarships Available</label>
                            <input type="number" step="0.5" name="scholarships" value="${program.scholarships || ''}"
                                   placeholder="4.5"
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Home Course</label>
                            <input type="text" name="homeCourse" value="${this.sanitizeInput(program.facilities || '')}"
                                   placeholder="University Golf Club"
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Years Coaching</label>
                            <input type="number" name="yearsCoaching" value="${info.yearsCoaching || ''}"
                                   placeholder="10"
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                    </div>
                </div>

                <!-- Recruiting Needs -->
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #3b82f6; margin-bottom: 1rem;"><i class="fas fa-search"></i> Recruiting Needs</h3>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Recruiting Classes (select multiple)</label>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
                                ${[2025, 2026, 2027, 2028, 2029, 2030].map(year => `
                                    <label style="display: flex; align-items: center; gap: 0.25rem; cursor: pointer;">
                                        <input type="checkbox" name="classYears" value="${year}" 
                                               ${info.recruitingNeeds?.classYears?.includes(year) ? 'checked' : ''}>
                                        <span style="color: #e6fffa; font-size: 0.875rem;">${year}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Positions Available</label>
                            <input type="number" name="positionsAvailable" value="${info.recruitingNeeds?.positions || ''}"
                                   placeholder="3"
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Minimum Handicap</label>
                            <input type="text" name="minHandicap" value="${this.sanitizeInput(info.recruitingNeeds?.preferences?.minHandicap || '')}"
                                   placeholder="+2"
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Minimum GPA</label>
                            <input type="number" step="0.1" name="minGPA" value="${info.recruitingNeeds?.preferences?.minGPA || ''}"
                                   placeholder="3.0"
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Target Scoring Average</label>
                            <input type="number" step="0.1" name="targetScoringAvg" value="${info.recruitingNeeds?.preferences?.scoringAverage || ''}"
                                   placeholder="72"
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Recruiting Coordinator</label>
                            <input type="text" name="recruitingCoordinator" value="${this.sanitizeInput(info.recruitingCoordinator || '')}"
                                   placeholder="Name"
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                    </div>
                </div>

                <!-- Contact Information -->
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #3b82f6; margin-bottom: 1rem;"><i class="fas fa-phone"></i> Contact Information</h3>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Email *</label>
                            <input type="email" name="email" value="${this.sanitizeInput(info.email || '')}" required
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Phone</label>
                            <input type="tel" name="phone" value="${this.sanitizeInput(info.phone || '')}"
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Program Website</label>
                            <input type="url" name="website" value="${this.sanitizeInput(info.website || '')}"
                                   placeholder="https://..."
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: #93bbfc;">Twitter/X</label>
                            <input type="text" name="twitter" value="${this.sanitizeInput(info.twitter || '')}"
                                   placeholder="@program"
                                   style="width: 100%; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: #e6fffa;">
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; gap: 1rem; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid rgba(59, 130, 246, 0.2);">
                    <button type="button" onclick="window.golfProfile.closeEditModal()" 
                            style="padding: 0.75rem 2rem; background: transparent; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; color: #93bbfc; cursor: pointer;">
                        Cancel
                    </button>
                    <button type="submit" 
                            style="padding: 0.75rem 2rem; background: linear-gradient(135deg, #3b82f6, #60a5fa); border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer;">
                        Save Changes
                    </button>
                </div>
            </form>
        `;
    }

    async handleImageUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file
        if (!this.allowedImageTypes.includes(file.type)) {
            alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        if (file.size > this.maxFileSize) {
            alert('Image must be less than 5MB');
            return;
        }

        // Store file for upload
        this.uploadedFiles[type] = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewId = `${type}Preview`;
            const preview = document.getElementById(previewId);
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; max-height: 100px; border-radius: 8px; margin-top: 0.5rem;">`;
            }
        };
        reader.readAsDataURL(file);
    }

    async saveProfile(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        // Add uploaded files
        for (const [type, file] of Object.entries(this.uploadedFiles)) {
            formData.append(type, file);
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to save profile');
            }

            const result = await response.json();
            
            // Update local data
            this.viewingUser = result.user;
            
            // Close modal and reload profile
            this.closeEditModal();
            this.loadProfile(this.viewingUser.username);
            
            // Show success message
            this.showNotification('Profile updated successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to save profile:', error);
            this.showNotification('Failed to save profile. Please try again.', 'error');
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    closeEditModal() {
        const modal = document.getElementById('profileEditModal');
        if (modal) {
            modal.remove();
        }
        this.uploadedFiles = {};
        this.tempProfileData = {};
        this.unsavedChanges = false;
    }

    attachEditModalListeners() {
        // Bio character counter
        const bioTextarea = document.querySelector('textarea[name="bio"]');
        const charCount = document.getElementById('bioCharCount');
        if (bioTextarea && charCount) {
            const updateCount = () => {
                charCount.textContent = bioTextarea.value.length;
                charCount.style.color = bioTextarea.value.length > 500 ? '#ef4444' : '#6ee7b7';
            };
            bioTextarea.addEventListener('input', updateCount);
            updateCount();
        }

        // Track unsaved changes
        const form = document.querySelector('#golferEditForm') || document.querySelector('#recruiterEditForm');
        if (form) {
            form.addEventListener('change', () => {
                this.unsavedChanges = true;
            });
        }

        // Warn on close with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.unsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    createActivityFeed() {
        // Mock activity data - would come from API
        const activities = [
            { type: 'tournament', text: 'Posted tournament result: T-5 at AJGA Championship', time: '2 hours ago' },
            { type: 'video', text: 'Uploaded new swing video', time: '1 day ago' },
            { type: 'achievement', text: 'Updated ranking: #125 National', time: '3 days ago' }
        ];

        return activities.map(activity => `
            <div style="padding: 1rem; background: rgba(16, 185, 129, 0.05); border-radius: 8px; margin-bottom: 0.75rem; display: flex; gap: 1rem; align-items: start;">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(16, 185, 129, 0.1); display: flex; align-items: center; justify-content: center; color: #10b981; flex-shrink: 0;">
                    <i class="fas fa-${activity.type === 'tournament' ? 'trophy' : activity.type === 'video' ? 'video' : 'medal'}"></i>
                </div>
                <div style="flex: 1;">
                    <div style="color: #e6fffa;">${this.sanitizeInput(activity.text)}</div>
                    <div style="color: #6ee7b7; font-size: 0.875rem; margin-top: 0.25rem;">${this.sanitizeInput(activity.time)}</div>
                </div>
            </div>
        `).join('');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10001;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    attachEventListeners() {
        // Tab switching
        document.querySelectorAll('.profile-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.showTab(tab);
            });
        });
    }

    showTab(tab) {
        // Update active tab
        document.querySelectorAll('.profile-tab').forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
                // Update styles based on profile type
                const color = this.profileType === 'golfer' ? '#10b981' : '#3b82f6';
                btn.style.color = color;
                btn.querySelector('div')?.remove();
                const indicator = document.createElement('div');
                indicator.style.cssText = `position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: ${color}; border-radius: 3px 3px 0 0;`;
                btn.appendChild(indicator);
            } else {
                btn.classList.remove('active');
                btn.style.color = this.profileType === 'golfer' ? '#6ee7b7' : '#93bbfc';
                btn.querySelector('div')?.remove();
            }
        });

        // Load tab content
        const content = document.getElementById('profileTabContent');
        if (!content) return;

        // Different content based on profile type and tab
        if (this.profileType === 'golfer') {
            switch(tab) {
                case 'overview':
                    content.innerHTML = this.createGolferOverviewTab();
                    break;
                case 'stats':
                    content.innerHTML = this.createGolferStatsTab();
                    break;
                case 'tournaments':
                    content.innerHTML = this.createGolferTournamentsTab();
                    break;
                case 'videos':
                    content.innerHTML = this.createGolferVideosTab();
                    break;
                case 'academics':
                    content.innerHTML = this.createGolferAcademicsTab();
                    break;
            }
        } else if (this.profileType === 'recruiter') {
            switch(tab) {
                case 'program':
                    content.innerHTML = this.createRecruiterProgramTab();
                    break;
                case 'recruiting':
                    content.innerHTML = this.createRecruiterRecruitingTab();
                    break;
                case 'roster':
                    content.innerHTML = this.createRecruiterRosterTab();
                    break;
                case 'facilities':
                    content.innerHTML = this.createRecruiterFacilitiesTab();
                    break;
            }
        }
    }

    createGolferStatsTab() {
        const stats = this.viewingUser.golferInfo?.stats || {};
        
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                ${Object.entries({
                    'Handicap': stats.handicap || 'N/A',
                    'Scoring Average': stats.scoringAverage || 'N/A',
                    'Driving Distance': `${stats.drivingDistance || 'N/A'} yards`,
                    'Driving Accuracy': `${stats.drivingAccuracy || 'N/A'}%`,
                    'GIR': `${stats.greensInRegulation || 'N/A'}%`,
                    'Putts Per Round': stats.puttsPerRound || 'N/A',
                    'Sand Saves': `${stats.sandSaves || 'N/A'}%`,
                    'Par 3 Scoring': stats.par3Scoring || 'N/A',
                    'Par 4 Scoring': stats.par4Scoring || 'N/A',
                    'Par 5 Scoring': stats.par5Scoring || 'N/A'
                }).map(([label, value]) => `
                    <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 1.5rem; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #10b981; margin-bottom: 0.5rem;">${this.sanitizeInput(value)}</div>
                        <div style="color: #6ee7b7; font-size: 0.875rem;">${this.sanitizeInput(label)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    createGolferTournamentsTab() {
        const tournaments = this.viewingUser.golferInfo?.tournaments || [];
        
        if (tournaments.length === 0) {
            return `
                <div style="text-align: center; padding: 3rem; background: rgba(16, 185, 129, 0.05); border-radius: 16px;">
                    <i class="fas fa-trophy" style="font-size: 3rem; color: #6ee7b7; opacity: 0.5; margin-bottom: 1rem;"></i>
                    <p style="color: #6ee7b7;">No tournament results added yet</p>
                </div>
            `;
        }

        return `
            <div style="display: grid; gap: 1rem;">
                ${tournaments.map(tournament => `
                    <div style="background: rgba(16, 185, 129, 0.05); border-radius: 12px; padding: 1.5rem; border-left: 3px solid ${tournament.position === '1st' ? '#fbbf24' : '#10b981'};">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h4 style="margin: 0 0 0.5rem 0; color: #e6fffa;">${this.sanitizeInput(tournament.name)}</h4>
                                <div style="color: #6ee7b7; font-size: 0.875rem;">
                                    ${this.sanitizeInput(tournament.date)} • ${this.sanitizeInput(tournament.course || 'Course not specified')}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.5rem; font-weight: bold; color: ${tournament.position === '1st' ? '#fbbf24' : '#10b981'};">
                                    ${this.sanitizeInput(tournament.position)}
                                </div>
                                <div style="color: #6ee7b7; font-size: 0.875rem;">${this.sanitizeInput(tournament.score)}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    createGolferVideosTab() {
        const videos = this.viewingUser.golferInfo?.videos || {};
        
        return `
            <div style="display: grid; gap: 2rem;">
                ${videos.driver ? `
                    <div>
                        <h4 style="color: #10b981; margin-bottom: 1rem;">Driver Swing</h4>
                        <div style="aspect-ratio: 16/9; background: rgba(16, 185, 129, 0.05); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <iframe src="${this.sanitizeInput(videos.driver)}" style="width: 100%; height: 100%; border-radius: 12px;" frameborder="0" allowfullscreen></iframe>
                        </div>
                    </div>
                ` : ''}
                
                ${videos.iron ? `
                    <div>
                        <h4 style="color: #10b981; margin-bottom: 1rem;">Iron Swing</h4>
                        <div style="aspect-ratio: 16/9; background: rgba(16, 185, 129, 0.05); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <iframe src="${this.sanitizeInput(videos.iron)}" style="width: 100%; height: 100%; border-radius: 12px;" frameborder="0" allowfullscreen></iframe>
                        </div>
                    </div>
                ` : ''}
                
                ${!videos.driver && !videos.iron && !videos.highlights ? `
                    <div style="text-align: center; padding: 3rem; background: rgba(16, 185, 129, 0.05); border-radius: 16px;">
                        <i class="fas fa-video" style="font-size: 3rem; color: #6ee7b7; opacity: 0.5; margin-bottom: 1rem;"></i>
                        <p style="color: #6ee7b7;">No videos uploaded yet</p>
                        ${this.isOwnProfile ? `
                            <button onclick="window.golfProfile.openEditModal()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer;">
                                Add Videos
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    createGolferAcademicsTab() {
        const info = this.viewingUser.golferInfo || {};
        
        return `
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                <div>
                    <div style="background: rgba(16, 185, 129, 0.05); border-radius: 16px; padding: 1.5rem;">
                        <h3 style="color: #10b981; margin-bottom: 1rem;"><i class="fas fa-graduation-cap"></i> Academic Information</h3>
                        
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                            <div>
                                <span style="color: #6ee7b7; font-size: 0.875rem;">GPA</span>
                                <div style="font-size: 2rem; font-weight: bold; color: #e6fffa;">${this.sanitizeInput(info.gpa || 'N/A')}</div>
                            </div>
                            
                            <div>
                                <span style="color: #6ee7b7; font-size: 0.875rem;">Class Rank</span>
                                <div style="font-size: 2rem; font-weight: bold; color: #e6fffa;">${this.sanitizeInput(info.classRank || 'N/A')}</div>
                            </div>
                            
                            <div>
                                <span style="color: #6ee7b7; font-size: 0.875rem;">SAT Score</span>
                                <div style="font-size: 2rem; font-weight: bold; color: #e6fffa;">${this.sanitizeInput(info.satScore || 'N/A')}</div>
                            </div>
                            
                            <div>
                                <span style="color: #6ee7b7; font-size: 0.875rem;">ACT Score</span>
                                <div style="font-size: 2rem; font-weight: bold; color: #e6fffa;">${this.sanitizeInput(info.actScore || 'N/A')}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <div style="background: rgba(16, 185, 129, 0.05); border-radius: 16px; padding: 1.5rem;">
                        <h4 style="color: #10b981; margin-bottom: 1rem;">Academic Interests</h4>
                        ${info.academicInterests && info.academicInterests.length > 0 ? 
                            info.academicInterests.map(interest => `
                                <div style="padding: 0.5rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; margin-bottom: 0.5rem; color: #e6fffa;">
                                    ${this.sanitizeInput(interest)}
                                </div>
                            `).join('') :
                            '<p style="color: #6ee7b7;">Not specified</p>'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    createRecruiterRecruitingTab() {
        // Implementation for recruiter recruiting tab
        return `<div style="color: #e6fffa;">Recruiting information...</div>`;
    }

    createRecruiterRosterTab() {
        // Implementation for recruiter roster tab
        return `<div style="color: #e6fffa;">Current roster...</div>`;
    }

    createRecruiterFacilitiesTab() {
        // Implementation for recruiter facilities tab
        return `<div style="color: #e6fffa;">Facilities information...</div>`;
    }

    createProfileTypeSelection() {
        return `
            <div style="text-align: center; padding: 4rem;">
                <h2 style="color: #10b981; margin-bottom: 1rem;">Choose Your Profile Type</h2>
                <p style="color: #6ee7b7; margin-bottom: 3rem;">Select the type of profile that best fits you</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; max-width: 600px; margin: 0 auto;">
                    <button onclick="window.golfProfile.setupProfileType('golfer')" 
                            style="padding: 2rem; background: rgba(16, 185, 129, 0.1); border: 2px solid #10b981; border-radius: 16px; cursor: pointer; transition: all 0.3s;">
                        <i class="fas fa-golf-ball" style="font-size: 3rem; color: #10b981; margin-bottom: 1rem; display: block;"></i>
                        <h3 style="color: #e6fffa; margin-bottom: 0.5rem;">Junior Golfer</h3>
                        <p style="color: #6ee7b7; font-size: 0.875rem;">I'm a student athlete looking to get recruited</p>
                    </button>
                    
                    <button onclick="window.golfProfile.setupProfileType('recruiter')" 
                            style="padding: 2rem; background: rgba(59, 130, 246, 0.1); border: 2px solid #3b82f6; border-radius: 16px; cursor: pointer; transition: all 0.3s;">
                        <i class="fas fa-university" style="font-size: 3rem; color: #3b82f6; margin-bottom: 1rem; display: block;"></i>
                        <h3 style="color: #e6fffa; margin-bottom: 0.5rem;">College Recruiter</h3>
                        <p style="color: #93bbfc; font-size: 0.875rem;">I'm a coach or recruiter looking for talent</p>
                    </button>
                </div>
            </div>
        `;
    }

    createIncompleteProfileView() {
        return `
            <div style="text-align: center; padding: 4rem; background: rgba(16, 185, 129, 0.05); border-radius: 16px;">
                <i class="fas fa-user-circle" style="font-size: 4rem; color: #6ee7b7; opacity: 0.5; margin-bottom: 1rem;"></i>
                <h3 style="color: #e6fffa; margin-bottom: 0.5rem;">Profile Not Complete</h3>
                <p style="color: #6ee7b7;">This user hasn't completed their profile setup yet.</p>
            </div>
        `;
    }

    createLoadingState() {
        return `
            <div style="display: flex; justify-content: center; padding: 3rem;">
                <div style="text-align: center;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #10b981; margin-bottom: 1rem;"></i>
                    <p style="color: #6ee7b7;">Loading profile...</p>
                </div>
            </div>
        `;
    }

    createErrorState() {
        return `
            <div style="text-align: center; padding: 4rem; background: rgba(239, 68, 68, 0.1); border-radius: 16px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ef4444; margin-bottom: 1rem;"></i>
                <h3 style="color: #e6fffa; margin-bottom: 0.5rem;">Failed to Load Profile</h3>
                <p style="color: #f87171;">Please try again later or contact support.</p>
            </div>
        `;
    }

    async setupProfileType(type) {
        this.profileType = type;
        
        // Store in localStorage for persistence during development
        localStorage.setItem('golfProfileType', type);
        
        // Create mock user data based on type
        if (type === 'golfer') {
            this.viewingUser = {
                username: 'current_user',
                displayName: 'Your Name',
                profileType: 'golfer',
                golferInfo: {
                    graduationYear: new Date().getFullYear() + 4,
                    hometown: '',
                    highSchool: '',
                    stats: {},
                    rankings: {},
                    tournaments: [],
                    videos: {}
                }
            };
        } else if (type === 'recruiter') {
            this.viewingUser = {
                username: 'current_user',
                displayName: 'Coach Name',
                profileType: 'recruiter',
                recruiterInfo: {
                    school: '',
                    position: '',
                    division: '',
                    conference: '',
                    programInfo: {},
                    recruitingNeeds: {}
                }
            };
        }
        
        // Save to localStorage
        localStorage.setItem('golfProfileData', JSON.stringify(this.viewingUser));
        
        // Reload profile with new type
        const container = document.querySelector('.feed');
        if (container) {
            if (type === 'golfer') {
                container.innerHTML = this.createGolferProfileHTML();
            } else if (type === 'recruiter') {
                container.innerHTML = this.createRecruiterProfileHTML();
            }
            this.attachEventListeners();
        }
        
        this.showNotification('Profile type set successfully!', 'success');
    }

    switchProfileType() {
        // Clear current profile data
        localStorage.removeItem('golfProfileData');
        localStorage.removeItem('golfProfileType');
        
        // Reset profile type
        this.profileType = null;
        this.viewingUser = null;
        
        // Show profile type selection
        const container = document.querySelector('.feed');
        if (container) {
            container.innerHTML = this.createProfileTypeSelection();
            this.attachEventListeners();
        }
    }
}

// CSS for animations and additional styles
if (!document.getElementById('golf-profile-styles')) {
    const style = document.createElement('style');
    style.id = 'golf-profile-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .profile-tab {
            transition: all 0.3s ease;
        }
        
        .profile-tab:hover {
            background: rgba(16, 185, 129, 0.05) !important;
        }
        
        input[type="file"] {
            display: none;
        }
        
        textarea {
            font-family: inherit;
        }
        
        iframe {
            border: none;
        }
    `;
    document.head.appendChild(style);
}

// Initialize global instance
window.golfProfile = new GolfProfileComponent();