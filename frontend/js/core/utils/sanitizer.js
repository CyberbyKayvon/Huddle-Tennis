// sanitizer.js
// XSS prevention utility
// Sanitizes user input to prevent script injection attacks

class Sanitizer {
    constructor() {
        // Check if DOMPurify is available (recommended)
        this.hasDOMPurify = typeof window.DOMPurify !== 'undefined';
        
        if (this.hasDOMPurify) {
            console.log('✅ DOMPurify detected - using advanced sanitization');
        } else {
            console.log('⚠️ DOMPurify not found - using basic sanitization');
        }
    }
    
    // Main sanitization method
    clean(dirty, options = {}) {
        if (!dirty) return '';
        
        // Convert to string if not already
        const input = typeof dirty === 'string' ? dirty : String(dirty);
        
        // Use DOMPurify if available
        if (this.hasDOMPurify && window.DOMPurify) {
            const config = {
                ALLOWED_TAGS: options.allowedTags || ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'div', 'span', 'ul', 'ol', 'li'],
                ALLOWED_ATTR: options.allowedAttr || ['href', 'class', 'id', 'target'],
                ALLOW_DATA_ATTR: false,
                ...options
            };
            
            return window.DOMPurify.sanitize(input, config);
        }
        
        // Fallback: Basic HTML escaping
        return this.escapeHtml(input);
    }
    
    // Escape HTML entities
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        
        return text.replace(/[&<>"'`=\/]/g, char => map[char]);
    }
    
    // Unescape HTML entities
    unescapeHtml(text) {
        const map = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#039;': "'",
            '&#x2F;': '/',
            '&#x60;': '`',
            '&#x3D;': '='
        };
        
        return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;|&#x2F;|&#x60;|&#x3D;/g, entity => map[entity]);
    }
    
    // Sanitize for text content (no HTML allowed)
    text(dirty) {
        if (!dirty) return '';
        return this.escapeHtml(String(dirty));
    }
    
    // Sanitize for attributes
    attribute(dirty) {
        if (!dirty) return '';
        
        const input = String(dirty);
        
        // Remove any quotes and escape special characters
        return input
            .replace(/["']/g, '')
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '');
    }
    
    // Sanitize URL
    url(dirty) {
        if (!dirty) return '';
        
        const input = String(dirty).trim();
        
        // Block dangerous protocols
        const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
        const lowerInput = input.toLowerCase();
        
        for (const protocol of dangerousProtocols) {
            if (lowerInput.startsWith(protocol)) {
                console.warn(`Blocked dangerous URL: ${input}`);
                return '#';
            }
        }
        
        // Allow http, https, mailto, and relative URLs
        if (lowerInput.startsWith('http://') || 
            lowerInput.startsWith('https://') || 
            lowerInput.startsWith('mailto:') ||
            lowerInput.startsWith('/') ||
            lowerInput.startsWith('#')) {
            return this.attribute(input);
        }
        
        // Default to relative URL
        return this.attribute(input);
    }
    
    // Sanitize CSS
    css(dirty) {
        if (!dirty) return '';
        
        const input = String(dirty);
        
        // Remove dangerous CSS
        return input
            .replace(/javascript:/gi, '')
            .replace(/expression\(/gi, '')
            .replace(/@import/gi, '')
            .replace(/url\(/gi, '')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    
    // Create safe HTML element
    createElement(tag, content = '', attributes = {}) {
        const element = document.createElement(tag);
        
        // Set text content safely
        if (content) {
            element.textContent = content;
        }
        
        // Set attributes safely
        for (const [key, value] of Object.entries(attributes)) {
            // Skip event handlers
            if (key.startsWith('on')) {
                console.warn(`Skipped event handler attribute: ${key}`);
                continue;
            }
            
            // Special handling for specific attributes
            if (key === 'href' || key === 'src') {
                element.setAttribute(key, this.url(value));
            } else if (key === 'style') {
                element.setAttribute(key, this.css(value));
            } else {
                element.setAttribute(key, this.attribute(value));
            }
        }
        
        return element;
    }
    
    // Sanitize and insert HTML
    setHTML(element, html, options = {}) {
        if (!element) return;
        
        const sanitized = this.clean(html, options);
        
        // Use textContent for plain text
        if (options.textOnly) {
            element.textContent = this.text(html);
        } else {
            element.innerHTML = sanitized;
        }
    }
    
    // Sanitize form data
    sanitizeFormData(formData) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(formData)) {
            // Sanitize the key
            const cleanKey = this.attribute(key);
            
            // Sanitize the value based on type
            if (typeof value === 'string') {
                sanitized[cleanKey] = this.text(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[cleanKey] = this.sanitizeFormData(value);
            } else {
                sanitized[cleanKey] = value;
            }
        }
        
        return sanitized;
    }
    
    // Check if string contains XSS attempts
    detectXSS(input) {
        if (!input) return false;
        
        const str = String(input).toLowerCase();
        
        // Common XSS patterns
        const xssPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+=/i,
            /<iframe/i,
            /<embed/i,
            /<object/i,
            /eval\(/i,
            /expression\(/i,
            /vbscript:/i,
            /data:text\/html/i,
            /<svg.*onload/i
        ];
        
        for (const pattern of xssPatterns) {
            if (pattern.test(str)) {
                console.warn(`XSS attempt detected: ${pattern}`);
                return true;
            }
        }
        
        return false;
    }
    
    // Validate and sanitize JSON
    sanitizeJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            return this.sanitizeObject(parsed);
        } catch (error) {
            console.error('Invalid JSON:', error);
            return null;
        }
    }
    
    // Recursively sanitize object
    sanitizeObject(obj) {
        if (typeof obj === 'string') {
            return this.text(obj);
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }
        
        if (typeof obj === 'object' && obj !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[this.attribute(key)] = this.sanitizeObject(value);
            }
            return sanitized;
        }
        
        return obj;
    }
}

// Create and export singleton instance
export const sanitizer = new Sanitizer();

// Also export the class if needed
export default Sanitizer;

// Helper function for quick sanitization
export function sanitize(dirty, options) {
    return sanitizer.clean(dirty, options);
}

// Helper function for text-only sanitization
export function sanitizeText(dirty) {
    return sanitizer.text(dirty);
}

// Helper function for URL sanitization
export function sanitizeURL(dirty) {
    return sanitizer.url(dirty);
}