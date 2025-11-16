// Service Bridge - Makes module services available globally
import { liveLinesService } from './live-lines-service.js';
import { nflDataService } from './nfl-data-service.js';
import { realtimeService } from './realtime-service.js';
import { storageService } from '/js/core/services/storage-service.js';

// Make services globally available immediately
window.liveLinesService = liveLinesService;
window.nflDataService = nflDataService;
window.realtimeService = realtimeService;
window.storageService = storageService;

console.log('✅ Service bridge loaded - all services available globally');

// Dispatch event when all services are ready
window.dispatchEvent(new CustomEvent('servicesReady', {
    detail: { 
        liveLinesService, 
        nflDataService,
        realtimeService,
        storageService
    }
}));