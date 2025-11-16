// Premium: recruitment-tracker
const BaseGolfProfile = require('../../../base/BaseGolfProfile');

class recruitmenttracker extends BaseGolfProfile {
    constructor() {
        super();
        this.tier = 'premium';
        this.pageName = 'recruitment-tracker';
    }
    
    generateHTML(golferData) {
        return '<!-- recruitment-tracker page -->';
    }
}

module.exports = recruitmenttracker;
