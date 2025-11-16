// Premium: training-log
const BaseGolfProfile = require('../../../base/BaseGolfProfile');

class traininglog extends BaseGolfProfile {
    constructor() {
        super();
        this.tier = 'premium';
        this.pageName = 'training-log';
    }
    
    generateHTML(golferData) {
        return '<!-- training-log page -->';
    }
}

module.exports = traininglog;
