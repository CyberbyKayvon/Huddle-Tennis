// api-service.js
// Centralized API service for all HTTP requests
// Handles authentication, errors, and retries automatically

import { storageService } from './storage-service.js';
import { API_ENDPOINTS } from '../config/api-endpoints.js';

class ApiService {
    constructor() {
        this.baseURL = window.location.origin;
        this.timeout = 30000; // 30 seconds
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }
    
    // Get auth token
    getToken() {
        return storageService.get('token') || storageService.get('authToken');
    }
    
    // Get current user
    getCurrentUser() {
        return storageService.get('user');
    }
    
    // Main request method with error handling
    async request(endpoint, options = {}) {
        const token = this.getToken();
        
        // Build full URL
        const url = endpoint.startsWith('http') 
            ? endpoint 
            : `${this.baseURL}${endpoint}`;
        
        // Build headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // Add auth token if available
        if (token && !endpoint.includes('auth/login') && !endpoint.includes('auth/signup')) {
            headers['Authorization'] = `Bearer ${token}`;
            headers['x-auth-token'] = token; // Some endpoints use this
        }
        
        // Build final config
        const config = {
            ...options,
            headers,
            timeout: this.timeout
        };
        
        // Add timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        config.signal = controller.signal;
        
        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);
            
            // Handle different response types
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            
            // Handle HTTP errors
            if (!response.ok) {
                // Handle specific error codes
                if (response.status === 401) {
                    // Token expired or invalid
                    this.handleAuthError();
                    throw new Error('Authentication required. Please log in again.');
                }
                
                if (response.status === 403) {
                    throw new Error('You do not have permission to perform this action.');
                }
                
                if (response.status === 404) {
                    throw new Error('The requested resource was not found.');
                }
                
                if (response.status === 429) {
                    throw new Error('Too many requests. Please try again later.');
                }
                
                if (response.status >= 500) {
                    throw new Error('Server error. Please try again later.');
                }
                
                // Use error message from server if available
                const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
                throw new Error(errorMessage);
            }
            
            return data;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            // Handle network errors
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Please check your connection.');
            }
            
            if (!navigator.onLine) {
                throw new Error('No internet connection. Please check your network.');
            }
            
            // Log error for debugging
            console.error('API Error:', {
                endpoint,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            throw error;
        }
    }
    
    // Convenience methods
    async get(endpoint, params = {}) {
        // Add query parameters if provided
        if (Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            endpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}`;
        }
        
        return this.request(endpoint, { method: 'GET' });
    }
    
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }
    
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
    
    // Upload file
    async upload(endpoint, formData) {
        const token = this.getToken();
        
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers // Don't set Content-Type for FormData
        });
    }
    
    // Handle authentication errors
    handleAuthError() {
        // Clear stored auth data
        storageService.remove('token');
        storageService.remove('user');
        storageService.remove('authToken');
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('login')) {
            // Store current location to redirect back after login
            storageService.set('redirectAfterLogin', window.location.href);
            
            // Redirect to login
            window.location.href = '/login.html';
        }
    }
    
    // Retry logic for failed requests
    async requestWithRetry(endpoint, options, attemptNumber = 1) {
        try {
            return await this.request(endpoint, options);
        } catch (error) {
            if (attemptNumber >= this.retryAttempts) {
                throw error;
            }
            
            // Don't retry auth errors
            if (error.message.includes('Authentication')) {
                throw error;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, this.retryDelay * attemptNumber));
            
            console.log(`Retrying request (attempt ${attemptNumber + 1}/${this.retryAttempts})...`);
            return this.requestWithRetry(endpoint, options, attemptNumber + 1);
        }
    }
    
    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    }
    
    // Set auth token (for login)
    setAuthToken(token) {
        storageService.set('token', token);
        storageService.set('authToken', token); // Backup
    }
    
    // Set current user (for login)
    setCurrentUser(user) {
        storageService.set('user', user);
    }
    
    // Logout
    logout() {
        storageService.remove('token');
        storageService.remove('authToken');
        storageService.remove('user');
        window.location.href = '/login.html';
    }
}

// Create and export a single instance
export const apiService = new ApiService();

// Also export the class if needed
export default ApiService;