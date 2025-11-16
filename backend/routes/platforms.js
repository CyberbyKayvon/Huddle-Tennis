const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Platform Generation Routes - COMPLETE REWRITE
module.exports = (platform) => {
    const app = platform.app;
    
    // Helper function to detect available pages
    function detectAvailablePages(tier = 'essential') {
        const basePath = path.join(__dirname, '../../src/core/pages/sports-platforms');
        const essentialPath = path.join(basePath, 'essential');
        
        // Always get essential files for now (until all tier pages are ready)
        const essentialFiles = fs.existsSync(essentialPath) 
            ? fs.readdirSync(essentialPath).filter(f => f.endsWith('.js')).map(f => f.replace('.js', ''))
            : [];
        
        console.log('📂 Essential files found:', essentialFiles.join(', '));
        console.log('📂 Using tier:', tier, '(but generating essential pages for all)');
        
        const pageMap = [];
        
        // Core pages that ALL tiers get (using essential versions)
        const corePagesMapping = [
            { pattern: 'homepage', target: 'index.html', title: 'Home' },
            { pattern: 'dashboard', target: 'dashboard.html', title: 'Dashboard' },
            { pattern: 'picks', target: 'picks.html', title: 'Picks' },
            { pattern: 'standings|leaderboard', target: 'leaderboard.html', title: 'Leaderboard' },
            { pattern: 'games', target: 'games.html', title: 'Games Hub' },
            { pattern: 'profile', target: 'profile.html', title: 'Profile' },
            { pattern: 'settings', target: 'settings.html', title: 'Settings' },
            { pattern: 'livelines|lines', target: 'lines.html', title: 'Live Lines' }
        ];
        
        // Add core pages from essential tier for ALL themes
        corePagesMapping.forEach(mapping => {
            const essentialFile = essentialFiles.find(f => 
                f.match(new RegExp(mapping.pattern, 'i'))
            );
            if (essentialFile) {
                pageMap.push({ 
                    source: essentialFile, 
                    target: mapping.target, 
                    title: mapping.title, 
                    tier: 'essential' 
                });
            }
        });
        
        // Add sidebets for ALL tiers since it's a core feature
        const premiumPath = path.join(basePath, 'premium');
        if (fs.existsSync(path.join(premiumPath, 'sidebets.js'))) {
            pageMap.push({ 
                source: 'sidebets', 
                target: 'sidebets.html', 
                title: 'Side Bets', 
                tier: 'premium' 
            });
            console.log('📂 Added sidebets page for all tiers');
        }
        
        console.log('📂 Total pages to generate:', pageMap.length);
        
        return pageMap;
    }
    
    // Main Generate Endpoint - COMPLETE REWRITE
    app.post('/api/platforms/generate', async (req, res) => {
        try {
            const User = require('../models/User');
            const League = require('../models/League');
            const Platform = require('../models/Platform');
            const SavedPlatform = require('../models/SavedPlatform');
            
            // Get creator from request
            const creatorId = req.body.userId || req.user?._id;
            
            if (!creatorId) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Must be logged in to create platform' 
                });
            }
            
            console.log('🚀 Creating platform for user:', creatorId);
            
            // Find the creator user
            const creator = await User.findById(creatorId);
            if (!creator) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'User not found' 
                });
            }
            
            console.log('✅ Found creator:', creator.username);
            
            // Generate unique IDs
            const platformId = `platform_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
            const leagueCode = 'LG' + crypto.randomBytes(3).toString('hex').toUpperCase();
            
            // Create platform directory
            const platformDir = path.join(__dirname, '../../generated-platforms', platformId);
            fs.mkdirSync(platformDir, { recursive: true });
            
            // Extract configuration
            const leagueName = req.body.leagueName || req.body.groupName || 'Elite Platform';
            const theme = req.body.theme || req.body.customization?.theme || 'professional';
            const sport = req.body.customization?.sport || 'nfl';
            const entryFee = req.body.entryFee || 0;
            const maxMembers = req.body.maxMembers || 30;
            const tier = req.body.tier || 'essential';
            
            console.log('📋 Configuration:', { leagueName, theme, sport, entryFee, maxMembers });
            
            // STEP 1: Create League with creator as member
            const newLeague = await League.create({
                platformId: platformId,
                code: leagueCode,
                name: leagueName,
                owner: creator._id,
                creator: creator._id,
                admins: [creator._id],
                members: [{
                    user: creator._id,
                    username: creator.username,
                    displayName: creator.displayName || creator.username,
                    joinedAt: new Date(),
                    role: 'owner',
                    stats: { wins: 0, losses: 0 }
                }],
                settings: {
                    sport: sport,
                    maxMembers: maxMembers,
                    entryFee: entryFee,
                    isPublic: req.body.isPublic || false,
                    allowInvites: true,
                    theme: theme
                },
                createdAt: new Date()
            });
            
            console.log('✅ League created:', newLeague._id);
            
            // STEP 2: Create Platform with creator in members array
            const platformDoc = await Platform.create({
                platformId: platformId,
                name: leagueName,
                theme: theme,
                leagueId: newLeague._id,
                leagueCode: leagueCode,
                creatorId: creator._id,
                members: [creator._id],  // Creator is first member
                config: {
                    entryFee: entryFee,
                    maxMembers: maxMembers,
                    sport: sport,
                    betTypes: ['spread', 'moneyline', 'overunder'],
                    features: req.body.features || ['picks', 'leaderboard']
                },
                stats: {
                    totalMembers: 1,  // Start with 1 (creator)
                    totalPot: entryFee,
                    currentWeek: 1
                }
            });
            
            console.log('✅ Platform created with', platformDoc.members.length, 'members');
            
            // STEP 3: Create SavedPlatform record
            await SavedPlatform.create({
                platformId: platformId,
                leagueCode: leagueCode,
                name: leagueName,
                theme: theme,
                sport: sport,
                ownerId: creator._id,
                members: 1,
                maxMembers: maxMembers,
                pot: entryFee,
                week: 1
            });
            
            console.log('✅ SavedPlatform record created');
            
            // STEP 4: Generate configuration for pages
            const config = {
                name: leagueName,
                theme: theme,
                features: req.body.features || ['picks', 'leaderboard'],
                sport: sport,
                creatorId: creator._id.toString(),
                creatorUsername: creator.username,
                adminEmail: creator.email,
                leagueCode: leagueCode,
                leagueId: newLeague._id.toString()
            };
            
            // STEP 5: Generate pages based on tier
            const pages = detectAvailablePages(tier);
            const result = await generateAllPages(platformDir, config, platformId, pages, tier, {
                platformDoc,
                league: newLeague,
                creator
            });
            
            // Return success response
            res.json({
                success: true,
                platformId: platformId,
                launcherUrl: `/platform/${platformId}/launcher.html`,
                directUrl: `/platform/${platformId}/index.html`,
                leagueCode: leagueCode,
                pages: result.pages,
                message: `Generated ${result.success}/${result.total} pages successfully`,
                league: {
                    name: leagueName,
                    members: 1,
                    maxMembers: maxMembers,
                    entryFee: entryFee,
                    pot: entryFee
                }
            });
            
        } catch (error) {
            console.error('❌ Generation failed:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // Quick Generate Endpoint - FIXED WITH PROPER MEMBER HANDLING
    app.post('/api/platforms/quick-generate', async (req, res) => {
        try {
            const User = require('../models/User');
            const League = require('../models/League');
            const Platform = require('../models/Platform');
            const SavedPlatform = require('../models/SavedPlatform');
            const crypto = require('crypto');
            
            const { preset = 'professional', tier = 'essential', userId } = req.body;
            
            console.log('🚀 Quick generating platform, preset:', preset, 'tier:', tier, 'userId:', userId);
            
            // Find or create test user if no userId provided
            let creator;
            if (userId) {
                creator = await User.findById(userId);
            }
            
            if (!creator) {
                // Create a test user for quick generation
                const testUsername = 'test_' + Date.now();
                const bcrypt = require('bcryptjs');
                creator = await User.create({
                    username: testUsername,
                    email: testUsername + '@test.com',
                    displayName: 'Test User',
                    password: await bcrypt.hash('test123', 10)
                });
                console.log('Created test user:', creator.username);
            }
            
            // Generate IDs
            const platformId = `platform_${preset.toUpperCase().substring(0,3)}${crypto.randomBytes(2).toString('hex').toUpperCase()}_${Date.now()}`;
            const leagueCode = preset.substring(0,3).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
            
            // Create platform directory
            const platformDir = path.join(__dirname, '../../generated-platforms', platformId);
            fs.mkdirSync(platformDir, { recursive: true });
            
            // Configuration
            const leagueName = `${preset.charAt(0).toUpperCase() + preset.slice(1)} League`;
            const theme = preset;
            
            // Create League - First create empty, then update
            const newLeague = new League({
                platformId: platformId,
                code: leagueCode,
                name: leagueName,
                owner: creator._id,
                creator: creator._id,
                admins: [creator._id],
                members: [],  // Start empty
                settings: {
                    sport: 'nfl',
                    maxMembers: 30,
                    entryFee: 50,
                    theme: theme
                }
            });
            
            // Now add the member with proper structure
            // Check if members expects subdocuments or just IDs
            const LeagueSchema = League.schema.paths.members;
            if (LeagueSchema && LeagueSchema.caster && LeagueSchema.caster.schema) {
                // It's a subdocument array
                newLeague.members.push({
                    user: creator._id,
                    username: creator.username,
                    displayName: creator.displayName || creator.username,
                    joinedAt: new Date(),
                    role: 'owner',
                    stats: { wins: 0, losses: 0 }
                });
            } else {
                // It's just ObjectIds
                newLeague.members.push(creator._id);
            }
            
            await newLeague.save();
            console.log('✅ League created with ID:', newLeague._id);
            
            // Determine the tier based on preset or passed tier parameter
            const actualTier = tier || (preset === 'luxury' ? 'luxury' : preset === 'neon-vegas' ? 'premium' : 'essential');
            console.log('📦 Using tier:', actualTier, 'from tier param:', tier, 'preset:', preset);
            
            // Create Platform
            const platformDoc = await Platform.create({
                platformId: platformId,
                name: leagueName,
                theme: theme,
                tier: actualTier,
                leagueId: newLeague._id,
                leagueCode: leagueCode,
                creatorId: creator._id,
                members: [creator._id],  // Platform always uses ObjectIds
                config: {
                    entryFee: 50,
                    maxMembers: 30,
                    sport: 'nfl',
                    betTypes: ['spread', 'moneyline', 'overunder'],
                    features: ['picks', 'leaderboard', 'analytics']
                },
                stats: {
                    totalMembers: 1,
                    totalPot: 50,
                    currentWeek: 1
                }
            });
            
            console.log('✅ Platform created with ID:', platformDoc._id);
            
            // Create SavedPlatform
            await SavedPlatform.create({
                platformId: platformId,
                leagueCode: leagueCode,
                name: leagueName,
                theme: theme,
                sport: 'nfl',
                ownerId: creator._id,
                members: 1,
                maxMembers: 30,
                pot: 50,
                week: 1
            });
            
            console.log('✅ SavedPlatform created');
            
            // Generate pages configuration
            const config = {
                name: leagueName,
                theme: theme,
                features: ['picks', 'leaderboard', 'analytics'],
                sport: 'nfl',
                creatorId: creator._id.toString(),
                creatorUsername: creator.username,
                adminEmail: creator.email,
                leagueCode: leagueCode,
                leagueId: newLeague._id.toString()
            };
            
            // actualTier already declared above
            const pages = detectAvailablePages(actualTier);
            
            // For page generation, prepare member data
            const memberData = {
                username: creator.username,
                displayName: creator.displayName || creator.username,
                stats: { wins: 0, losses: 0 }
            };
            
            const result = await generateAllPages(platformDir, config, platformId, pages, actualTier, {
                platformDoc,
                league: {
                    ...newLeague.toObject(),
                    members: [memberData]  // Pass simplified member data for pages
                },
                creator
            });
            
            console.log('✅ Quick generation complete:', platformId);
            
            res.json({
                success: true,
                platformId: platformId,
                launcherUrl: `/platform/${platformId}/launcher.html`,
                directUrl: `/platform/${platformId}/index.html`,
                leagueCode: leagueCode,
                pages: result.pages,
                generated: `${result.success}/${result.total} pages`,
                league: {
                    name: leagueName,
                    members: 1,
                    maxMembers: 30,
                    entryFee: 50,
                    pot: 50
                }
            });
            
        } catch (error) {
            console.error('Quick generation failed:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // Core page generation function
    async function generateAllPages(platformDir, config, platformId, pageDefinitions, tier, data) {
        const sourcePath = path.join(__dirname, '../../src/core/pages/sports-platforms', tier || 'essential');
        const generatedPages = [];
        let successCount = 0;
        
        console.log(`\n🚀 Generating ${pageDefinitions.length} pages...`);
        
        for (const pageDef of pageDefinitions) {
            const tierPath = pageDef.tier || tier || 'essential';
            const sourceFile = path.join(__dirname, '../../src/core/pages/sports-platforms', tierPath, `${pageDef.source}.js`);
            
            try {
                delete require.cache[require.resolve(sourceFile)];
                const PageClass = require(sourceFile);
                const pageInstance = new PageClass();
                
                // Prepare business data with actual member info
                const businessData = {
                    platformId: platformId,
                    name: config.name,
                    description: 'Premium sports betting platform',
                    businessType: 'sports-platform',
                    tier: 'essential',
                    themeId: config.theme,
                    layoutId: 'general',
                    memberCount: data.platformDoc.members.length,
                    entryFee: data.platformDoc.config.entryFee,
                    totalPot: data.platformDoc.stats.totalPot,
                    weekNumber: 1,
                    features: config.features,
                    sport: config.sport,
                    bettingTypes: ['spread', 'moneyline'],
                    leagueCode: config.leagueCode,
                    leagueId: config.leagueId,
                    tagline: 'Where Champions Play',
                    creatorId: config.creatorId,
                    creatorUsername: config.creatorUsername,
                    creatorEmail: config.adminEmail,
                    isAdmin: true,
                    adminEmail: config.adminEmail,
                    // Include actual members with proper data
                    members: data.league.members.map(m => ({
                        username: m.username || data.creator.username,
                        displayName: m.displayName || m.username || data.creator.displayName,
                        avatar: null,
                        stats: m.stats || { wins: 0, losses: 0 }
                    })),
                    platformSettings: {
                        entryFee: data.platformDoc.config.entryFee,
                        maxMembers: data.platformDoc.config.maxMembers,
                        weeklyDeadline: 'Thursday 8PM',
                        allowLateJoins: true
                    }
                };
                
                let html = pageInstance.generateHTML(businessData, config.theme, 'general');
                
                // Fix navigation links
                html = fixNavigation(html);
                
                // Save the file
                fs.writeFileSync(path.join(platformDir, pageDef.target), html);
                
                generatedPages.push({
                    source: pageDef.source,
                    target: pageDef.target,
                    title: pageDef.title,
                    success: true
                });
                
                successCount++;
                console.log(`✅ Generated ${pageDef.target}`);
                
            } catch (error) {
                console.error(`❌ Failed ${pageDef.target}: ${error.message}`);
                generatedPages.push({
                    source: pageDef.source,
                    target: pageDef.target,
                    title: pageDef.title,
                    success: false,
                    error: error.message
                });
            }
        }
        
        // Create launcher
        createLauncher(platformDir, config, generatedPages, platformId);
        
        // Create manifest
        const manifest = {
            id: platformId,
            platformId: platformId,
            name: config.name,
            theme: config.theme,
            leagueCode: config.leagueCode,
            creatorId: config.creatorId,
            creatorUsername: config.creatorUsername,
            adminEmail: config.adminEmail,
            pages: generatedPages.filter(p => p.success),
            pageCount: generatedPages.filter(p => p.success).length,
            created: new Date().toISOString(),
            stats: {
                total: pageDefinitions.length,
                success: successCount,
                failed: pageDefinitions.length - successCount
            }
        };
        
        fs.writeFileSync(
            path.join(platformDir, 'manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        console.log(`\n📊 Complete: ${successCount}/${pageDefinitions.length} pages generated`);
        
        return {
            pages: generatedPages,
            success: successCount,
            total: pageDefinitions.length
        };
    }
    
    // Fix navigation links
    function fixNavigation(html) {
        const replacements = [
            [/href=["'](?:\.\/)?homepage(?:\d+)?(?:\.html)?["']/gi, 'href="index.html"'],
            [/href=["'](?:\.\/)?dashboard(?:\d+)?(?:\.html)?["']/gi, 'href="dashboard.html"'],
            [/href=["'](?:\.\/)?picks(?:\d+)?(?:\.html)?["']/gi, 'href="picks.html"'],
            [/href=["'](?:\.\/)?leaderboard(?:\d+)?(?:\.html)?["']/gi, 'href="leaderboard.html"'],
            [/href=["'](?:\.\/)?standings(?:\d+)?(?:\.html)?["']/gi, 'href="leaderboard.html"'],
            [/href=["'](?:\.\/)?games(?:\d+)?(?:\.html)?["']/gi, 'href="games.html"'],
            [/href=["'](?:\.\/)?profile(?:\d+)?(?:\.html)?["']/gi, 'href="profile.html"'],
            [/href=["'](?:\.\/)?settings(?:\d+)?(?:\.html)?["']/gi, 'href="settings.html"']
        ];
        
        for (const [pattern, replacement] of replacements) {
            html = html.replace(pattern, replacement);
        }
        
        return html;
    }
    
    // Create launcher
    function createLauncher(dir, config, pages, platformId) {
        const successfulPages = pages.filter(p => p.success);
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 3rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { margin-bottom: 2rem; }
        .pages {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        .page-link {
            padding: 1.5rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            text-align: center;
            transition: transform 0.3s;
        }
        .page-link:hover { transform: translateY(-5px); }
    </style>
</head>
<body>
    <div class="container">
        <h1>${config.name}</h1>
        <p>Generated ${successfulPages.length} pages successfully</p>
        <div class="pages">
            ${successfulPages.map(p => `<a href="${p.target}" class="page-link">${p.title}</a>`).join('')}
        </div>
    </div>
</body>
</html>`;
        
        fs.writeFileSync(path.join(dir, 'launcher.html'), html);
    }
    
    // Platform Management Endpoints
    
    // Join platform endpoint - FIXED
    app.post('/api/platforms/:platformId/join', async (req, res) => {
        try {
            const User = require('../models/User');
            const League = require('../models/League');
            const Platform = require('../models/Platform');
            
            // Get userId from request body or authenticated user
            const userId = req.body.userId || req.user?._id;
            
            console.log('🔗 Join request for platform:', req.params.platformId, 'by user:', userId);
            
            if (!userId) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'User authentication required' 
                });
            }
            
            // Find the existing user
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'User not found' 
                });
            }
            
            console.log('✅ Found user:', user.username);
            
            // Update Platform
            const platformUpdate = await Platform.findOneAndUpdate(
                { platformId: req.params.platformId },
                { 
                    $addToSet: { members: user._id },
                    $inc: { 'stats.totalMembers': 1 }
                },
                { new: true }
            );
            
            if (!platformUpdate) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Platform not found' 
                });
            }
            
            console.log('✅ Added to platform. Total members:', platformUpdate.members.length);
            
            // Update League
            await League.findOneAndUpdate(
                { platformId: req.params.platformId },
                { 
                    $addToSet: { 
                        members: {
                            user: user._id,
                            username: user.username,
                            displayName: user.displayName || user.username,
                            joinedAt: new Date(),
                            role: 'member',
                            stats: { wins: 0, losses: 0 }
                        }
                    }
                }
            );
            
            res.json({
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName || user.username
                }
            });
            
        } catch (error) {
            console.error('Join error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // Invite Users to Platform
    app.post('/api/platforms/:platformId/invite', async (req, res) => {
        try {
            const User = require('../models/User');
            const League = require('../models/League');
            const Notification = require('../models/Notification');
            
            const { usernames } = req.body;
            const inviterId = req.body.userId || req.user?._id;
            
            const league = await League.findOne({ platformId: req.params.platformId });
            if (!league) {
                return res.status(404).json({ success: false, error: 'League not found' });
            }
            
            const inviter = await User.findById(inviterId);
            const invited = [];
            const failed = [];
            
            for (const username of usernames) {
                try {
                    const user = await User.findOne({ username });
                    if (!user) {
                        failed.push({ username, reason: 'User not found' });
                        continue;
                    }
                    
                    // Check if already member (handle both subdocument and ObjectId formats)
                    const isAlreadyMember = league.members.some(m => {
                        if (m && m.user) {
                            return m.user.toString() === user._id.toString();
                        } else if (m) {
                            return m.toString() === user._id.toString();
                        }
                        return false;
                    });
                    
                    if (isAlreadyMember) {
                        failed.push({ username, reason: 'Already a member' });
                        continue;
                    }
                    
                    // Create notification
                    await Notification.create({
                        recipient: user._id,
                        type: 'league_invite',
                        title: 'League Invitation',
                        message: `${inviter.displayName} invited you to join "${league.name}"`,
                        data: {
                            leagueId: league._id,
                            platformId: league.platformId,
                            leagueCode: league.code,
                            inviterId: inviter._id,
                            inviterName: inviter.displayName
                        },
                        read: false,
                        createdAt: new Date()
                    });
                    
                    invited.push({
                        username: user.username,
                        userId: user._id
                    });
                    
                } catch (err) {
                    failed.push({ username, reason: err.message });
                }
            }
            
            res.json({
                success: true,
                invited,
                failed,
                message: `Invited ${invited.length} users`
            });
            
        } catch (error) {
            console.error('Invite error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // Get platform members
    app.get('/api/platforms/:platformId/members', async (req, res) => {
        try {
            const Platform = require('../models/Platform');
            const platform = await Platform.findOne({ platformId: req.params.platformId })
                .populate('members', 'username displayName avatar');
            
            if (!platform) {
                return res.json({ success: true, members: [] });
            }
            
            res.json({
                success: true,
                members: platform.members.map(m => ({
                    username: m.username,
                    displayName: m.displayName || m.username,
                    avatar: m.avatar
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // Accept League Invite - Fixed for proper platform sync
    app.post('/api/platforms/accept-invite', async (req, res) => {
        try {
            const User = require('../models/User');
            const League = require('../models/League');
            const Platform = require('../models/Platform');
            const Notification = require('../models/Notification');
            
            const { leagueCode, notificationId } = req.body;
            const userId = req.body.userId || req.user?._id;
            
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            
            const league = await League.findOne({ code: leagueCode });
            if (!league) {
                return res.status(404).json({ success: false, error: 'League not found' });
            }
            
            // Check if already member
            const alreadyMember = league.members.some(m => {
                if (m.user) return m.user.toString() === userId.toString();
                return m.toString() === userId.toString();
            });
            
            if (alreadyMember) {
                return res.status(400).json({ success: false, error: 'Already a member' });
            }
            
            // Add to League
            const memberData = {
                user: user._id,
                username: user.username,
                displayName: user.displayName || user.username,
                joinedAt: new Date(),
                role: 'member',
                stats: { wins: 0, losses: 0 }
            };
            
            // Check if League expects subdocuments or just IDs
            if (league.members.length > 0 && league.members[0].user) {
                league.members.push(memberData);
            } else {
                league.members.push(user._id);
            }
            await league.save();
            
            // Add to Platform
            await Platform.findOneAndUpdate(
                { platformId: league.platformId },
                { 
                    $addToSet: { members: user._id },
                    $inc: { 'stats.totalMembers': 1 }
                }
            );
            
            // Mark notification as read
            if (notificationId) {
                await Notification.findByIdAndUpdate(notificationId, { read: true });
            }
            
            // Notify via Socket.IO if available
            if (platform.app.locals.io) {
                platform.app.locals.io.to(`platform-${league.platformId}`).emit('member_joined', {
                    username: user.username,
                    displayName: user.displayName
                });
            }
            
            res.json({
                success: true,
                message: 'Successfully joined league',
                platformId: league.platformId,
                leagueUrl: `/platform/${league.platformId}/index.html`
            });
            
        } catch (error) {
            console.error('Accept invite error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // Get all platforms (for testing)
    app.get('/api/platforms', (req, res) => {
        const platformsDir = path.join(__dirname, '../../generated-platforms');
        
        if (!fs.existsSync(platformsDir)) {
            return res.json({ success: true, platforms: [] });
        }
        
        const platforms = fs.readdirSync(platformsDir)
            .filter(dir => fs.statSync(path.join(platformsDir, dir)).isDirectory())
            .map(dir => {
                try {
                    const manifestPath = path.join(platformsDir, dir, 'manifest.json');
                    if (fs.existsSync(manifestPath)) {
                        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                        return {
                            id: manifest.id,
                            name: manifest.name,
                            theme: manifest.theme,
                            created: manifest.created,
                            pages: manifest.stats?.success || 0,
                            launcherUrl: `/platform/${manifest.id}/launcher.html`
                        };
                    }
                } catch (e) {}
                return null;
            })
            .filter(Boolean);
        
        res.json({ success: true, platforms });
    });
    
    // Delete platform
    app.delete('/api/platforms/:platformId', async (req, res) => {
        try {
            const Platform = require('../models/Platform');
            const League = require('../models/League');
            const SavedPlatform = require('../models/SavedPlatform');
            
            // Delete from database
            await Platform.deleteOne({ platformId: req.params.platformId });
            await League.deleteOne({ platformId: req.params.platformId });
            await SavedPlatform.deleteOne({ platformId: req.params.platformId });
            
            // Delete files
            const platformDir = path.join(__dirname, '../../generated-platforms', req.params.platformId);
            if (fs.existsSync(platformDir)) {
                fs.rmSync(platformDir, { recursive: true, force: true });
            }
            
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // Get my platforms
    app.get('/api/platforms/my-platforms', async (req, res) => {
        try {
            const Platform = require('../models/Platform');
            const userId = req.query.userId || req.user?._id || req.headers['x-user-id'];
            
            console.log('Fetching platforms for user:', userId);
            
            if (!userId) {
                return res.json({ success: true, platforms: [] });
            }
            
            const platforms = await Platform.find({
                $or: [
                    { creatorId: userId },
                    { members: userId }
                ]
            }).populate('members', 'username displayName');
            
            const formattedPlatforms = platforms.map(p => ({
                platformId: p.platformId,
                name: p.name,
                theme: p.theme,
                sport: p.config?.sport || 'NFL',
                leagueCode: p.leagueCode,
                members: p.members.length,
                maxMembers: p.config?.maxMembers || 30,
                pot: p.stats?.totalPot || 0,
                week: p.stats?.currentWeek || 1,
                createdAt: p.createdAt,
                directUrl: `/platform/${p.platformId}/index.html`,
                launcherUrl: `/platform/${p.platformId}/launcher.html`
            }));
            
            res.json({
                success: true,
                platforms: formattedPlatforms
            });
            
        } catch (error) {
            console.error('Error fetching platforms:', error);
            res.status(500).json({ success: false, error: error.message, platforms: [] });
        }
    });
    
    // Submit picks
    app.post('/api/platforms/:platformId/picks', async (req, res) => {
        try {
            const { picks, week } = req.body;
            const userId = req.user?._id || req.body.userId;
            
            if (platform.app.locals.io) {
                platform.app.locals.io.to(`platform-${req.params.platformId}`).emit('picks_updated', {
                    userId,
                    week,
                    picks
                });
            }
            
            res.json({ success: true, message: 'Picks saved' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
};