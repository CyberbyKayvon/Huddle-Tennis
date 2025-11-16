// Premium: performance-charts
const BaseGolfProfile = require('../../../base/BaseGolfProfile');

class performancecharts extends BaseGolfProfile {
    constructor() {
        super();
        this.tier = 'premium';
        this.pageName = 'performance-charts';
    }
    
    generateHTML(golferData) {
        return '<!-- performance-charts page -->';
    }
}

module.exports = performancecharts;
