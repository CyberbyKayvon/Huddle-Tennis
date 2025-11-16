// Premium: college-matches
const BaseGolfProfile = require('../../../base/BaseGolfProfile');

class collegematches extends BaseGolfProfile {
    constructor() {
        super();
        this.tier = 'premium';
        this.pageName = 'college-matches';
    }
    
    generateHTML(golferData) {
        return '<!-- college-matches page -->';
    }
}

module.exports = collegematches;
