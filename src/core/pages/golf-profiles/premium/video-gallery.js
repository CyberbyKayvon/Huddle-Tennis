// Premium: video-gallery
const BaseGolfProfile = require('../../../base/BaseGolfProfile');

class videogallery extends BaseGolfProfile {
    constructor() {
        super();
        this.tier = 'premium';
        this.pageName = 'video-gallery';
    }
    
    generateHTML(golferData) {
        return '<!-- video-gallery page -->';
    }
}

module.exports = videogallery;
