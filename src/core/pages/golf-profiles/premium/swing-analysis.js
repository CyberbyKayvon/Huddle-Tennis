// Premium: swing-analysis
const BaseGolfProfile = require('../../../base/BaseGolfProfile');

class swinganalysis extends BaseGolfProfile {
    constructor() {
        super();
        this.tier = 'premium';
        this.pageName = 'swing-analysis';
    }
    
    generateHTML(golferData) {
        return '<!-- swing-analysis page -->';
    }
}

module.exports = swinganalysis;
