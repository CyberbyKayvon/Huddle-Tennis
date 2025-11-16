// storage-service.js
// Safe localStorage wrapper with error handling
// Prevents app crashes if localStorage is full or disabled

class StorageService {
    constructor() {
        this.prefix = 'huddle_'; // Prefix to avoid conflicts
        this.isAvailable = this.checkAvailability();
    }
    
    // Check if localStorage is available
    checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage not available:', e);
            return false;
        }
    }
    
    // Get item with fallback
    get(key, defaultValue = null) {
        if (!this.isAvailable) {
            console.warn('Storage not available, returning default value');
            return defaultValue;
        }
        
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (item === null) {
                return defaultValue;
            }
            
            // Try to parse JSON, otherwise return as string
            try {
                return JSON.parse(item);
            } catch {
                return item;
            }
        } catch (error) {
            console.error(`Error reading ${key} from storage:`, error);
            return defaultValue;
        }
    }
    
    // Set item with error handling
    set(key, value) {
        if (!this.isAvailable) {
            console.warn('Storage not available, cannot save');
            return false;
        }
        
        try {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(this.prefix + key, serialized);
            return true;
        } catch (error) {
            console.error(`Error saving ${key} to storage:`, error);
            
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                console.warn('Storage quota exceeded, attempting cleanup...');
                this.cleanup();
                
                // Try one more time after cleanup
                try {
                    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
                    localStorage.setItem(this.prefix + key, serialized);
                    return true;
                } catch (retryError) {
                    console.error('Failed to save even after cleanup:', retryError);
                    return false;
                }
            }
            
            return false;
        }
    }
    
    // Remove item
    remove(key) {
        if (!this.isAvailable) {
            return false;
        }
        
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key} from storage:`, error);
            return false;
        }
    }
    
    // Clear all items with our prefix
    clear() {
        if (!this.isAvailable) {
            return false;
        }
        
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }
    
    // Check if key exists
    has(key) {
        if (!this.isAvailable) {
            return false;
        }
        
        return localStorage.getItem(this.prefix + key) !== null;
    }
    
    // Get all keys with our prefix
    keys() {
        if (!this.isAvailable) {
            return [];
        }
        
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key.replace(this.prefix, ''));
            }
        }
        return keys;
    }
    
    // Get storage size in bytes
    getSize() {
        if (!this.isAvailable) {
            return 0;
        }
        
        let size = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith(this.prefix)) {
                size += localStorage[key].length + key.length;
            }
        }
        return size;
    }
    
    // Cleanup old/expired data
    cleanup() {
        if (!this.isAvailable) {
            return;
        }
        
        console.log('Running storage cleanup...');
        
        // Remove old temporary data
        const tempKeys = ['temp_', 'cache_', 'draft_'];
        const now = Date.now();
        
        this.keys().forEach(key => {
            // Remove temporary items
            if (tempKeys.some(prefix => key.startsWith(prefix))) {
                this.remove(key);
                return;
            }
            
            // Remove expired cache items
            if (key.includes('_expiry')) {
                const expiry = this.get(key);
                if (expiry && expiry < now) {
                    const dataKey = key.replace('_expiry', '');
                    this.remove(key);
                    this.remove(dataKey);
                }
            }
        });
        
        console.log('Storage cleanup complete');
    }
    
    // Set item with expiration
    setWithExpiry(key, value, expiryMs) {
        const now = Date.now();
        const expiry = now + expiryMs;
        
        this.set(key, value);
        this.set(key + '_expiry', expiry);
        
        return true;
    }
    
    // Get item checking expiration
    getWithExpiry(key, defaultValue = null) {
        const expiryKey = key + '_expiry';
        const expiry = this.get(expiryKey);
        
        if (expiry) {
            const now = Date.now();
            if (now > expiry) {
                // Expired - remove both keys
                this.remove(key);
                this.remove(expiryKey);
                return defaultValue;
            }
        }
        
        return this.get(key, defaultValue);
    }
}

// Create and export a single instance
export const storageService = new StorageService();

// Also export the class if needed
export default StorageService;