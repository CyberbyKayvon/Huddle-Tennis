// quick-league/ui/GamePickers.js
export class GamePickers {
    constructor(parent) {
        this.parent = parent;
    }
    
    renderPicksSection() {
        const isPastWeek = this.parent.selectedWeek < this.parent.currentWeek;
        const league = this.parent.activeLeague;
        const hasGameLimit = league?.gamesPerWeek && league.gamesPerWeek !== 'all' && league.gamesPerWeek !== 16;
        
        return `
            <div class="picks-section" style="background: rgba(26, 26, 46, 0.95); border-radius: 15px; padding: 20px;">
                ${this.renderPicksHeader(isPastWeek, hasGameLimit)}
                ${this.renderBetTypeFilter()}
                ${this.renderPicksSummary()}
                
                <div id="gamesForPicks" style="display: grid; gap: 15px;">
                    <div style="text-align: center; color: #94a3b8; padding: 20px;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>Loading games...</p>
                    </div>
                </div>
                
                ${!isPastWeek ? this.renderSubmitButton(hasGameLimit) : ''}
            </div>
        `;
    }
    
    renderPicksHeader(isPastWeek, hasGameLimit) {
        const league = this.parent.activeLeague;
        const weekDisplay = league?.sport === 'MLB' 
            ? new Date(this.parent.selectedDate || Date.now()).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            : `Week ${this.parent.selectedWeek}`;
        
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #00ff88; margin: 0;">
                    ${weekDisplay} ${isPastWeek ? 'Picks (View Only)' : 'Picks'}
                </h3>
                <div style="display: flex; gap: 10px; align-items: center;">
                    ${!isPastWeek ? `
                        <button data-action="open-ai-store" 
                                style="padding: 8px 16px; background: linear-gradient(135deg, #6366f1, #8b5cf6); 
                                       border: none; border-radius: 8px; color: white; cursor: pointer; 
                                       font-weight: 600; display: flex; align-items: center; gap: 8px;">
                            <span>🤖</span>
                            <span>Analyze Selected</span>
                        </button>
                    ` : ''}
                    ${hasGameLimit ? this.renderPicksCounter(league) : ''}
                </div>
            </div>
        `;
    }
    
    renderPicksCounter(league) {
        let displayText = '';
        const gamesPerWeek = league?.gamesPerWeek;
        
        if (typeof gamesPerWeek === 'string' && gamesPerWeek.includes('-')) {
            displayText = gamesPerWeek;
        } else if (gamesPerWeek && gamesPerWeek !== 'all' && gamesPerWeek !== 16) {
            displayText = gamesPerWeek;
        } else {
            return ''; // No counter for "all games" leagues
        }
        
        return `
            <div style="background: rgba(99, 102, 241, 0.2); padding: 8px 16px; border-radius: 8px; border: 1px solid #6366f1;">
                <span style="color: #6366f1; font-weight: 600;">
                    <span id="picksCounter">0</span> / ${displayText} Games Selected
                </span>
            </div>
        `;
    }
    
    renderBetTypeFilter() {
        const betTypes = this.parent.activeLeague?.betTypes || ['spread'];
        
        if (betTypes.length <= 1) {
            return `
                <div style="margin-bottom: 10px; padding: 10px; background: rgba(99, 102, 241, 0.1); border-radius: 8px; border: 1px solid rgba(99, 102, 241, 0.3);">
                    <span style="color: #6366f1; font-weight: 600;">
                        Primary Bet Type: ${this.parent.constants?.BET_TYPE_ICONS?.[betTypes[0]] || ''} ${betTypes[0]?.toUpperCase() || 'SPREAD'}
                    </span>
                </div>
            `;
        }
        
        return `
            <div style="margin-bottom: 15px;">
                <div style="display: flex; gap: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 10px;">
                    ${betTypes.map(type => `
                        <button data-pick-type="${type}" 
                                style="padding: 6px 14px; background: rgba(255, 255, 255, 0.05); 
                                       border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; 
                                       color: #94a3b8; cursor: pointer; font-size: 0.85rem;">
                            ${this.parent.constants?.BET_TYPE_ICONS?.[type] || ''} ${type.toUpperCase()}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    renderPicksSummary() {
        return `
            <div id="currentPicksSummary" style="margin-bottom: 20px; padding: 15px; background: rgba(99, 102, 241, 0.1); 
                                                  border-radius: 10px; border: 1px solid rgba(99, 102, 241, 0.3); display: none;">
                <h4 style="color: #8b5cf6; margin-bottom: 10px;">📋 Your Current Picks</h4>
                <div id="picksList" style="display: grid; gap: 8px;"></div>
            </div>
        `;
    }
    
    renderSubmitButton(hasGameLimit) {
        const league = this.parent.activeLeague;
        let buttonText = 'Submit Picks';
        let buttonSubtext = '';
        
        if (hasGameLimit && league.gamesPerWeek !== 16) {
            const gamesPerWeek = league.gamesPerWeek;
            if (typeof gamesPerWeek === 'string' && gamesPerWeek.includes('-')) {
                const [min, max] = gamesPerWeek.split('-').map(n => parseInt(n));
                buttonText = `Submit Picks (0/${gamesPerWeek})`;
                buttonSubtext = `Min ${min} picks required • Can submit partial picks`;
            } else {
                buttonText = `Submit Picks (0/${gamesPerWeek})`;
                buttonSubtext = `Exactly ${gamesPerWeek} picks required`;
            }
        } else {
            buttonText = 'Submit Picks (0 selected)';
            buttonSubtext = 'Submit any number of picks';
        }
        
        return `
            <div style="margin-top: 20px;">
                ${buttonSubtext ? `
                    <div style="text-align: center; color: #94a3b8; font-size: 0.85rem; margin-bottom: 8px;">
                        ${buttonSubtext}
                    </div>
                ` : ''}
                <button data-action="submit-picks" 
                        id="submitPicksButton"
                        style="width: 100%; padding: 12px; 
                               background: linear-gradient(135deg, #00ff88, #00cc6a); 
                               color: #000; border: none; border-radius: 12px; 
                               cursor: pointer; font-weight: 600;">
                    ${buttonText}
                </button>
            </div>
        `;
    }
    
    renderGame(game, betType, index) {
        const isPastWeek = this.parent.selectedWeek < this.parent.currentWeek;
        const hasLimit = this.parent.activeLeague?.gamesPerWeek && 
                        this.parent.activeLeague.gamesPerWeek !== 'all' && 
                        this.parent.activeLeague.gamesPerWeek !== 16;
        
        // Check if game is complete
        const isComplete = game.status === 'post' || game.isFinal || game.status === 'final';
        const homeScore = parseInt(game.homeScore) || 0;
        const awayScore = parseInt(game.awayScore) || 0;
        
        // If game is complete, show final score box
        if (isComplete) {
            return this.renderCompletedGame(game, homeScore, awayScore, index);
        }
        
        // Check for commissioner line adjustments
        const leagueId = this.parent.activeLeague?.id || this.parent.activeLeague?._id;
        const week = this.parent.selectedWeek;
        const adjustmentKey = `league_line_adjustments_${leagueId}_${week}`;
        const adjustments = JSON.parse(localStorage.getItem(adjustmentKey) || '{}');
        const gameId = game.gameId || game.id || index;
        
        // Apply adjustments if they exist
        if (adjustments[gameId]) {
            game.spread = adjustments[gameId].spread;
            game.total = adjustments[gameId].total;
            game.homeML = adjustments[gameId].homeML;
            game.awayML = adjustments[gameId].awayML;
        }
        
        // Add data attribute to game container
        const gameData = JSON.stringify({
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            spread: game.spread,
            total: game.total,
            homeML: game.homeML,
            awayML: game.awayML,
            gameTime: game.gameTime
        });
        
        switch(betType) {
            case 'spread':
                return this.renderSpreadGame(game, isPastWeek, hasLimit, index, gameData);
            case 'moneyline':
                return this.renderMoneylineGame(game, isPastWeek, hasLimit, index, gameData);
            case 'overunder':
                return this.renderOverUnderGame(game, isPastWeek, hasLimit, index, gameData);
            default:
                return this.renderSpreadGame(game, isPastWeek, hasLimit, index, gameData);
        }
    }
    
    renderSpreadGame(game, isPastWeek, hasLimit, index, gameData) {
        const spread = parseFloat(game.spread || 0);
        const homeFavored = spread < 0;
        
        let homeSpread, awaySpread;
        if (homeFavored) {
            homeSpread = spread;
            awaySpread = `+${Math.abs(spread)}`;
        } else {
            homeSpread = `+${Math.abs(spread)}`;
            awaySpread = -Math.abs(spread);
        }
        
        const gameId = game.gameId || game.id || index;
        
        return `
            <div data-game-id="${gameId}" 
                 data-game-info='${gameData}'
                 style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05)); 
                        border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 18px;">
                ${this.renderGameHeader(game, hasLimit, isPastWeek)}
                
                <div style="display: grid; gap: 12px;">
                    <!-- Away Team -->
                    <label style="display: flex; align-items: center; padding: 12px; 
                                  background: rgba(0,0,0,0.2); border-radius: 8px; cursor: pointer;">
                        <input type="radio" name="game_${gameId}" value="away" 
                               data-team="${game.awayTeam}"
                               data-spread="${awaySpread}"
                               data-game-time="${game.gameTime}"
                               style="width: 20px; height: 20px; margin-right: 15px; accent-color: #6366f1;" 
                               ${isPastWeek || !this.parent.picksManager.canEditPick(game.gameTime) ? 'disabled' : ''}>
                        <div style="flex: 1; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                ${game.awayTeam ? `<img src="${this.getTeamLogo(game.awayTeam)}" style="width: 28px; height: 28px;" onerror="this.style.display='none'">` : ''}
                                <div>
                                    <span style="color: white; font-size: 1.1rem; font-weight: 600;">${game.awayTeam || 'Away Team'}</span>
                                    ${!homeFavored ? '<span style="color: #ffd700; font-size: 0.75rem; margin-left: 8px;">FAV</span>' : ''}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: #00ff88; font-size: 1.2rem; font-weight: bold;">${awaySpread}</div>
                                <div style="color: #94a3b8; font-size: 0.75rem;">SPREAD</div>
                            </div>
                        </div>
                    </label>
                    
                    <!-- Home Team -->
                    <label style="display: flex; align-items: center; padding: 12px; 
                                  background: rgba(0,0,0,0.2); border-radius: 8px; cursor: pointer;">
                        <input type="radio" name="game_${gameId}" value="home" 
                               data-team="${game.homeTeam}"
                               data-spread="${homeSpread}"
                               data-game-time="${game.gameTime}"
                               style="width: 20px; height: 20px; margin-right: 15px; accent-color: #6366f1;" 
                               ${isPastWeek || !this.parent.picksManager.canEditPick(game.gameTime) ? 'disabled' : ''}>
                        <div style="flex: 1; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                ${game.homeTeam ? `<img src="${this.getTeamLogo(game.homeTeam)}" style="width: 28px; height: 28px;" onerror="this.style.display='none'">` : ''}
                                <div>
                                    <span style="color: white; font-size: 1.1rem; font-weight: 600;">${game.homeTeam || 'Home Team'}</span>
                                    ${homeFavored ? '<span style="color: #ffd700; font-size: 0.75rem; margin-left: 8px;">FAV</span>' : ''}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: #00ff88; font-size: 1.2rem; font-weight: bold;">${homeSpread}</div>
                                <div style="color: #94a3b8; font-size: 0.75rem;">SPREAD</div>
                            </div>
                        </div>
                    </label>
                </div>
                
                ${this.renderGameFooter(game)}
            </div>
        `;
    }
    
    renderMoneylineGame(game, isPastWeek, hasLimit, index, gameData) {
        const gameId = game.gameId || game.id || index;
        
        return `
            <div data-game-id="${gameId}"
                 data-game-info='${gameData}'
                 style="background: linear-gradient(135deg, rgba(0, 255, 136, 0.05), rgba(0, 204, 106, 0.05)); 
                        border: 1px solid rgba(0, 255, 136, 0.2); border-radius: 12px; padding: 18px;">
                ${this.renderGameHeader(game, hasLimit, isPastWeek)}
                
                <div style="display: grid; gap: 12px;">
                    <!-- Away Team -->
                    <label style="display: flex; align-items: center; padding: 12px; 
                                  background: rgba(0,0,0,0.2); border-radius: 8px; cursor: pointer;">
                        <input type="radio" name="ml_${gameId}" value="away" 
                               data-team="${game.awayTeam}"
                               data-ml="${game.awayML}"
                               style="width: 20px; height: 20px; margin-right: 15px; accent-color: #00ff88;" 
                               ${isPastWeek || !this.parent.picksManager.canEditPick(game.gameTime) ? 'disabled' : ''}>
                        <div style="flex: 1; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <img src="${this.getTeamLogo(game.awayTeam)}" style="width: 28px; height: 28px;" onerror="this.style.display='none'">
                                <span style="color: white; font-size: 1.1rem; font-weight: 600;">${game.awayTeam}</span>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: ${game.awayML > 0 ? '#00ff88' : '#ff4444'}; font-size: 1.2rem; font-weight: bold;">
                                    ${game.awayML > 0 ? '+' : ''}${game.awayML}
                                </div>
                                <div style="color: #94a3b8; font-size: 0.75rem;">MONEYLINE</div>
                            </div>
                        </div>
                    </label>
                    
                    <!-- Home Team -->
                    <label style="display: flex; align-items: center; padding: 12px; 
                                  background: rgba(0,0,0,0.2); border-radius: 8px; cursor: pointer;">
                        <input type="radio" name="ml_${gameId}" value="home" 
                               data-team="${game.homeTeam}"
                               data-ml="${game.homeML}"
                               style="width: 20px; height: 20px; margin-right: 15px; accent-color: #00ff88;" 
                               ${isPastWeek || !this.parent.picksManager.canEditPick(game.gameTime) ? 'disabled' : ''}>
                        <div style="flex: 1; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <img src="${this.getTeamLogo(game.homeTeam)}" style="width: 28px; height: 28px;" onerror="this.style.display='none'">
                                <span style="color: white; font-size: 1.1rem; font-weight: 600;">${game.homeTeam}</span>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: ${game.homeML > 0 ? '#00ff88' : '#ff4444'}; font-size: 1.2rem; font-weight: bold;">
                                    ${game.homeML > 0 ? '+' : ''}${game.homeML}
                                </div>
                                <div style="color: #94a3b8; font-size: 0.75rem;">MONEYLINE</div>
                            </div>
                        </div>
                    </label>
                </div>
                
                ${this.renderGameFooter(game)}
            </div>
        `;
    }
    
    renderOverUnderGame(game, isPastWeek, hasLimit, index, gameData) {
        const gameId = game.gameId || game.id || index;
        
        return `
            <div data-game-id="${gameId}"
                 data-game-info='${gameData}'
                 style="background: linear-gradient(135deg, rgba(251, 146, 60, 0.05), rgba(254, 215, 170, 0.05)); 
                        border: 1px solid rgba(251, 146, 60, 0.2); border-radius: 12px; padding: 18px;">
                ${this.renderGameHeader(game, hasLimit, isPastWeek)}
                
                <div style="background: rgba(0,0,0,0.3); border-radius: 10px; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="color: white; font-weight: 600; margin-bottom: 10px;">
                            ${game.awayTeam} @ ${game.homeTeam}
                        </div>
                        <div style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 5px;">TOTAL POINTS</div>
                        <div style="color: white; font-size: 2rem; font-weight: bold;">${game.total}</div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <label style="display: flex; flex-direction: column; align-items: center; padding: 15px; 
                                      background: rgba(0,255,136,0.1); border: 2px solid rgba(0,255,136,0.3); 
                                      border-radius: 8px; cursor: pointer;">
                            <input type="radio" name="ou_${gameId}" value="over" 
                                   data-total="${game.total}"
                                   style="width: 20px; height: 20px; margin-bottom: 10px; accent-color: #00ff88;" 
                                   ${isPastWeek || !this.parent.picksManager.canEditPick(game.gameTime) ? 'disabled' : ''}>
                            <div style="color: #00ff88; font-size: 1.2rem; font-weight: bold;">OVER</div>
                            <div style="color: #94a3b8; font-size: 0.85rem; margin-top: 5px;">-110</div>
                        </label>
                        
                        <label style="display: flex; flex-direction: column; align-items: center; padding: 15px; 
                                      background: rgba(255,68,68,0.1); border: 2px solid rgba(255,68,68,0.3); 
                                      border-radius: 8px; cursor: pointer;">
                            <input type="radio" name="ou_${gameId}" value="under" 
                                   data-total="${game.total}"
                                   style="width: 20px; height: 20px; margin-bottom: 10px; accent-color: #ff4444;" 
                                   ${isPastWeek || !this.parent.picksManager.canEditPick(game.gameTime) ? 'disabled' : ''}>
                            <div style="color: #ff4444; font-size: 1.2rem; font-weight: bold;">UNDER</div>
                            <div style="color: #94a3b8; font-size: 0.85rem; margin-top: 5px;">-110</div>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderGameHeader(game, hasLimit, isPastWeek) {
        const gameTimeObj = new Date(game.gameTime);
        const gameTime = gameTimeObj.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
        
        // Check if game is locked (2 minutes before kickoff)
        const now = new Date();
        const lockTime = new Date(gameTimeObj.getTime() - 2 * 60 * 1000);
        const isLocked = now >= lockTime;
        const minutesUntilLock = Math.floor((lockTime - now) / 60000);
        
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${game.isLive ? `
                        <div style="display: flex; align-items: center; gap: 4px; background: #dc2626; color: white; 
                                    padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 700;">
                            <div style="width: 5px; height: 5px; background: white; border-radius: 50%; animation: pulse 2s infinite;"></div>
                            LIVE
                        </div>
                    ` : game.isFinal ? `
                        <span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 4px 10px; 
                                     border-radius: 6px; font-size: 0.75rem; font-weight: 600;">
                            FINAL
                        </span>
                    ` : isLocked ? `
                        <span style="background: rgba(255, 68, 68, 0.2); color: #ff4444; padding: 4px 10px; 
                                     border-radius: 6px; font-size: 0.75rem; font-weight: 600;">
                            🔒 LOCKED
                        </span>
                    ` : minutesUntilLock <= 60 ? `
                        <span style="background: rgba(255, 193, 7, 0.2); color: #ffc107; padding: 4px 10px; 
                                     border-radius: 6px; font-size: 0.75rem; font-weight: 600;">
                            ⏰ Locks in ${minutesUntilLock}m
                        </span>
                    ` : `
                        <span style="color: #94a3b8; font-size: 0.85rem;">${gameTime}</span>
                    `}
                </div>
                ${!isLocked && !game.isFinal && !isPastWeek ? `
                    <div style="color: #00ff88; font-size: 0.75rem;">
                        ✅ Open for picks
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderGameFooter(game) {
        return `
            <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; 
                        border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; gap: 15px; align-items: center;">
                    <div>
                        <span style="color: #64748b; font-size: 0.75rem;">TOTAL</span>
                        <span style="color: #94a3b8; font-size: 0.9rem; margin-left: 5px;">${game.total || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    getTeamLogo(teamName) {
        const sport = this.parent.activeLeague?.sport || 'NFL';
        
        if (!teamName) {
            return '';
        }
        
        const teamAbbr = this.parent.constants?.TEAM_MAPPINGS?.[teamName] || teamName.substring(0, 3).toUpperCase();
        
        if (sport === 'MLB') {
            return `https://a.espncdn.com/i/teamlogos/mlb/500/${teamAbbr.toLowerCase()}.png`;
        } else if (sport === 'NBA') {
            return `https://a.espncdn.com/i/teamlogos/nba/500/${teamAbbr.toLowerCase()}.png`;
        } else if (sport === 'NHL') {
            return `https://a.espncdn.com/i/teamlogos/nhl/500/${teamAbbr.toLowerCase()}.png`;
        } else if (sport === 'NCAAF') {
            const teamId = this.parent.constants?.CFB_TEAMS?.[teamName] || '333';
            return `https://a.espncdn.com/i/teamlogos/ncaa/500/${teamId}.png`;
        }
        return `https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/${teamAbbr}.png`;
    }
    
    renderCompletedGame(game, homeScore, awayScore, index) {
        const gameId = game.gameId || game.id || index;
        const winner = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'tie';
        const spread = parseFloat(game.spread || 0);
        const homeWonSpread = (homeScore - awayScore) > spread;
        const totalScore = homeScore + awayScore;
        const overHit = totalScore > parseFloat(game.total || 0);
        
        return `
            <div data-game-id="${gameId}" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); 
                                                   border-radius: 12px; padding: 20px; opacity: 0.8;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 4px 10px; 
                                border-radius: 6px; font-size: 0.75rem; font-weight: 600;">
                        FINAL
                    </div>
                    <div style="color: #64748b; font-size: 0.85rem;">
                        Game ${index + 1}
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; 
                            background: rgba(0, 0, 0, 0.3); border-radius: 8px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: ${winner === 'away' ? '#00ff88' : 'white'}; font-weight: 600;">
                                ${game.awayTeam}
                            </span>
                            <span style="color: ${winner === 'away' ? '#00ff88' : 'white'}; font-size: 1.5rem; font-weight: bold;">
                                ${awayScore}
                            </span>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <span style="color: ${winner === 'home' ? '#00ff88' : 'white'}; font-weight: 600;">
                                ${game.homeTeam}
                            </span>
                            <span style="color: ${winner === 'home' ? '#00ff88' : 'white'}; font-size: 1.5rem; font-weight: bold;">
                                ${homeScore}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 15px; padding: 10px; background: rgba(99, 102, 241, 0.05); border-radius: 8px;">
                    <div style="display: flex; justify-content: space-around; color: #94a3b8; font-size: 0.85rem;">
                        <div>
                            <span style="color: #64748b;">Spread:</span>
                            <span style="color: white; font-weight: 600; margin-left: 5px;">
                                ${game.homeTeam} ${spread}
                                ${homeWonSpread ? ' ✅' : ' ❌'}
                            </span>
                        </div>
                        <div>
                            <span style="color: #64748b;">O/U ${game.total}:</span>
                            <span style="color: ${overHit ? '#00ff88' : '#ff4444'}; font-weight: 600; margin-left: 5px;">
                                ${totalScore} (${overHit ? 'OVER' : 'UNDER'})
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderGameWithSavedPick(game, savedPick, betType, index) {
        const gameId = game.gameId || game.id || index;
        const isComplete = game.status === 'post' || game.isFinal || game.status === 'final';
        
        if (!isComplete || !savedPick?.lockedLine) {
            // Use regular rendering if not complete or no locked line
            return this.renderGame(game, betType, index);
        }
        
        // Display completed game with locked line
        const lockedSpread = savedPick.lockedLine.spread;
        const homeScore = parseInt(game.homeScore) || 0;
        const awayScore = parseInt(game.awayScore) || 0;
        const winner = homeScore > awayScore ? 'home' : 'away';
        
        return `
            <div data-game-id="${gameId}" style="background: rgba(255, 215, 0, 0.05); border: 2px solid rgba(255, 215, 0, 0.3); 
                                                   border-radius: 12px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 4px 10px; 
                                border-radius: 6px; font-size: 0.75rem; font-weight: 600;">
                        FINAL
                    </div>
                    <div style="background: rgba(255, 215, 0, 0.2); color: #ffd700; padding: 4px 10px;
                                border-radius: 6px; font-size: 0.75rem; font-weight: 600;">
                        📌 Locked: ${savedPick.lockedLine.homeTeam} ${lockedSpread > 0 ? '+' : ''}${lockedSpread}
                    </div>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: ${winner === 'away' ? '#00ff88' : 'white'}; font-weight: 600;">
                            ${game.awayTeam}
                        </span>
                        <span style="color: ${winner === 'away' ? '#00ff88' : 'white'}; font-size: 1.5rem; font-weight: bold;">
                            ${awayScore}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: ${winner === 'home' ? '#00ff88' : 'white'}; font-weight: 600;">
                            ${game.homeTeam}
                        </span>
                        <span style="color: ${winner === 'home' ? '#00ff88' : 'white'}; font-size: 1.5rem; font-weight: bold;">
                            ${homeScore}
                        </span>
                    </div>
                </div>
                
                <div style="margin-top: 15px; padding: 10px; background: rgba(99, 102, 241, 0.1); border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <span style="color: #94a3b8;">Your Pick:</span>
                            <span style="color: white; font-weight: 600; margin-left: 8px;">
                                ${savedPick.pick === 'home' ? game.homeTeam : game.awayTeam} ${savedPick.lockedLine.spread > 0 ? '+' : ''}${savedPick.lockedLine.spread}
                            </span>
                        </div>
                        <div style="color: ${savedPick.result === 'win' ? '#00ff88' : savedPick.result === 'loss' ? '#ff4444' : '#ffd700'}; 
                                    font-weight: 600; font-size: 1.1rem;">
                            ${savedPick.result === 'win' ? '✓ WIN' : savedPick.result === 'loss' ? '✗ LOSS' : '⊖ PUSH'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}