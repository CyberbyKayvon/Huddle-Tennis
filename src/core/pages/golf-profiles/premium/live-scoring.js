// Premium: live-scoring
const BaseGolfProfile = require('../../../base/BaseGolfProfile');

class livescoring extends BaseGolfProfile {
    constructor() {
        super();
        this.tier = 'premium';
        this.pageName = 'live-scoring';
    }
    
    generateHTML(golferData) {
        return '<!-- live-scoring page -->';
    }
}

module.exports = livescoring;
