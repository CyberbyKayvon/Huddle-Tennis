// service-bridge.js
import { apiService } from './api-service.js';
import { storageService } from './storage-service.js';
import { gameDataService } from './game-data-service.js';
import { sanitizer } from '../utils/sanitizer.js';
import { API_ENDPOINTS } from '../config/api-endpoints.js';

// Make services available globally
window.apiService = apiService;
window.storageService = storageService;
window.gameDataService = gameDataService;
window.sanitizer = sanitizer;
window.API_ENDPOINTS = API_ENDPOINTS;

console.log('✅ Service Bridge: All core services loaded globally');

export { apiService, storageService, gameDataService, sanitizer, API_ENDPOINTS };