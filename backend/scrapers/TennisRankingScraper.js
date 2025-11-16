// Tennis Rankings Multi-Source Scraper
// Integrates: UTR, ITF Junior Rankings, TennisRecruiting.net, USTA Rankings
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

class TennisRankingScraper {
    constructor() {
        this.sources = {
            utr: 'https://www.utrsports.net',
            itf: 'https://www.itftennis.com',
            tennisRecruiting: 'https://www.tennisrecruiting.net',
            usta: 'https://www.usta.com'
        };
        this.browser = null;
    }

    async initBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
        return this.browser;
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    // Get player data from UTR
    async getUTRData(playerId) {
        const browser = await this.initBrowser();
        const page = await browser.newPage();

        try {
            await page.goto(`${this.sources.utr}/player/${playerId}`, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            const html = await page.content();
            const $ = cheerio.load(html);

            const utrData = {
                source: 'UTR',
                utrRating: $('.utr-rating').text().trim() || 'N/A',
                singlesRating: $('.singles-rating').text().trim() || 'N/A',
                doublesRating: $('.doubles-rating').text().trim() || 'N/A',
                recentResults: []
            };

            // Scrape recent match results
            $('.result-row').each((i, elem) => {
                if (i < 10) { // Get last 10 results
                    utrData.recentResults.push({
                        date: $(elem).find('.match-date').text().trim(),
                        opponent: $(elem).find('.opponent-name').text().trim(),
                        result: $(elem).find('.match-result').text().trim(),
                        score: $(elem).find('.match-score').text().trim()
                    });
                }
            });

            return utrData;
        } catch (error) {
            console.error('UTR scraping error:', error.message);
            return { source: 'UTR', error: error.message };
        } finally {
            await page.close();
        }
    }

    // Get player data from ITF Junior Rankings
    async getITFData(playerId) {
        const browser = await this.initBrowser();
        const page = await browser.newPage();

        try {
            await page.goto(`${this.sources.itf}/en/players/player/profile/${playerId}`, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            const html = await page.content();
            const $ = cheerio.load(html);

            const itfData = {
                source: 'ITF',
                juniorRanking: $('.junior-ranking').text().trim() || 'N/A',
                nationality: $('.player-nationality').text().trim() || 'N/A',
                dateOfBirth: $('.player-dob').text().trim() || 'N/A',
                tournamentHistory: []
            };

            // Scrape tournament results
            $('.tournament-result').each((i, elem) => {
                if (i < 10) {
                    itfData.tournamentHistory.push({
                        tournament: $(elem).find('.tournament-name').text().trim(),
                        date: $(elem).find('.tournament-date').text().trim(),
                        surface: $(elem).find('.surface-type').text().trim(),
                        result: $(elem).find('.tournament-result').text().trim()
                    });
                }
            });

            return itfData;
        } catch (error) {
            console.error('ITF scraping error:', error.message);
            return { source: 'ITF', error: error.message };
        } finally {
            await page.close();
        }
    }

    // Get player data from TennisRecruiting.net
    async getTennisRecruitingData(playerId) {
        const browser = await this.initBrowser();
        const page = await browser.newPage();

        try {
            await page.goto(`${this.sources.tennisRecruiting}/player.asp?player=${playerId}`, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            const html = await page.content();
            const $ = cheerio.load(html);

            const trData = {
                source: 'TennisRecruiting.net',
                nationalRanking: $('.national-rank').text().trim() || 'N/A',
                stateRanking: $('.state-rank').text().trim() || 'N/A',
                sectionRanking: $('.section-rank').text().trim() || 'N/A',
                gradYear: $('.grad-year').text().trim() || 'N/A',
                stats: {
                    singlesRecord: $('.singles-record').text().trim() || 'N/A',
                    doublesRecord: $('.doubles-record').text().trim() || 'N/A'
                },
                collegeCommitment: $('.college-commitment').text().trim() || 'Uncommitted'
            };

            return trData;
        } catch (error) {
            console.error('TennisRecruiting.net scraping error:', error.message);
            return { source: 'TennisRecruiting.net', error: error.message };
        } finally {
            await page.close();
        }
    }

    // Get player data from USTA
    async getUSTAData(playerId) {
        const browser = await this.initBrowser();
        const page = await browser.newPage();

        try {
            await page.goto(`${this.sources.usta}/player/${playerId}`, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            const html = await page.content();
            const $ = cheerio.load(html);

            const ustaData = {
                source: 'USTA',
                nationalRanking: $('.usta-national-rank').text().trim() || 'N/A',
                sectionRanking: $('.usta-section-rank').text().trim() || 'N/A',
                section: $('.usta-section').text().trim() || 'N/A',
                membershipLevel: $('.membership-level').text().trim() || 'N/A'
            };

            return ustaData;
        } catch (error) {
            console.error('USTA scraping error:', error.message);
            return { source: 'USTA', error: error.message };
        } finally {
            await page.close();
        }
    }

    // Get comprehensive player data from all sources
    async getPlayerData(playerIds) {
        try {
            await this.initBrowser();

            const promises = [
                playerIds.utr ? this.getUTRData(playerIds.utr) : Promise.resolve({ source: 'UTR', status: 'no_id' }),
                playerIds.itf ? this.getITFData(playerIds.itf) : Promise.resolve({ source: 'ITF', status: 'no_id' }),
                playerIds.tennisRecruiting ? this.getTennisRecruitingData(playerIds.tennisRecruiting) : Promise.resolve({ source: 'TennisRecruiting.net', status: 'no_id' }),
                playerIds.usta ? this.getUSTAData(playerIds.usta) : Promise.resolve({ source: 'USTA', status: 'no_id' })
            ];

            const results = await Promise.allSettled(promises);

            const playerData = {
                lastUpdated: new Date(),
                sources: {
                    utr: results[0].status === 'fulfilled' ? results[0].value : { error: results[0].reason?.message },
                    itf: results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason?.message },
                    tennisRecruiting: results[2].status === 'fulfilled' ? results[2].value : { error: results[2].reason?.message },
                    usta: results[3].status === 'fulfilled' ? results[3].value : { error: results[3].reason?.message }
                }
            };

            return playerData;
        } catch (error) {
            throw new Error(`Failed to fetch player data: ${error.message}`);
        } finally {
            await this.closeBrowser();
        }
    }

    // Search for players across platforms
    async searchPlayers(query) {
        const browser = await this.initBrowser();
        const page = await browser.newPage();

        try {
            // Search on TennisRecruiting.net as primary source
            await page.goto(`${this.sources.tennisRecruiting}/search.asp?q=${encodeURIComponent(query)}`, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            const html = await page.content();
            const $ = cheerio.load(html);

            const results = [];
            $('.player-result').each((i, elem) => {
                results.push({
                    name: $(elem).find('.player-name').text().trim(),
                    gradYear: $(elem).find('.grad-year').text().trim(),
                    location: $(elem).find('.player-location').text().trim(),
                    ranking: $(elem).find('.player-rank').text().trim(),
                    playerId: $(elem).attr('data-player-id')
                });
            });

            return results;
        } catch (error) {
            console.error('Search error:', error.message);
            return [];
        } finally {
            await page.close();
            await this.closeBrowser();
        }
    }

    // Get rankings by type and age group
    async getRankings(type, options = {}) {
        const browser = await this.initBrowser();
        const page = await browser.newPage();

        try {
            let url;
            const { ageGroup = 'u18', gender = 'boys', limit = 100 } = options;

            switch (type) {
                case 'utr':
                    url = `${this.sources.utr}/rankings?age=${ageGroup}&gender=${gender}`;
                    break;
                case 'itf':
                    url = `${this.sources.itf}/en/rankings/world-tennis-tour-junior-rankings`;
                    break;
                case 'tennisrecruiting':
                    url = `${this.sources.tennisRecruiting}/rankings.asp`;
                    break;
                case 'usta':
                    url = `${this.sources.usta}/rankings/${ageGroup}/${gender}`;
                    break;
                default:
                    throw new Error(`Unknown ranking type: ${type}`);
            }

            await page.goto(url, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            const html = await page.content();
            const $ = cheerio.load(html);

            const rankings = [];
            $('.ranking-row').each((i, elem) => {
                if (i < limit) {
                    rankings.push({
                        rank: $(elem).find('.rank').text().trim(),
                        name: $(elem).find('.player-name').text().trim(),
                        rating: $(elem).find('.rating, .points').text().trim(),
                        location: $(elem).find('.location').text().trim(),
                        playerId: $(elem).attr('data-player-id')
                    });
                }
            });

            return rankings;
        } catch (error) {
            console.error('Rankings fetch error:', error.message);
            return [];
        } finally {
            await page.close();
            await this.closeBrowser();
        }
    }

    // Scheduled update - runs monthly to refresh all player rankings
    async scheduledUpdate() {
        console.log('Starting scheduled tennis rankings update...');
        // This would integrate with a cron job to update all tracked players
        // Implementation would pull all player IDs from database and refresh their data
        return { status: 'Updated', timestamp: new Date() };
    }
}

module.exports = TennisRankingScraper;
