// Premium: media-kit
const BaseGolfProfile = require('../../../base/BaseGolfProfile');

class mediakit extends BaseGolfProfile {
    constructor() {
        super();
        this.tier = 'premium';
        this.pageName = 'media-kit';
    }
    
    generateHTML(golferData) {
        return '<!-- media-kit page -->';
    }
}

module.exports = mediakit;
