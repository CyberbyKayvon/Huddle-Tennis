// Premium: advanced-stats
const BaseGolfProfile = require('../../../base/BaseGolfProfile');

class advancedstats extends BaseGolfProfile {
    constructor() {
        super();
        this.tier = 'premium';
        this.pageName = 'advanced-stats';
    }
    
    generateHTML(golferData) {
        return '<!-- advanced-stats page -->';
    }
}

module.exports = advancedstats;
