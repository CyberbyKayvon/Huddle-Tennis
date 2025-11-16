// Premium: coach-portal
const BaseGolfProfile = require('../../../base/BaseGolfProfile');

class coachportal extends BaseGolfProfile {
    constructor() {
        super();
        this.tier = 'premium';
        this.pageName = 'coach-portal';
    }
    
    generateHTML(golferData) {
        return '<!-- coach-portal page -->';
    }
}

module.exports = coachportal;
