// Time Helpers - Utilities for time formatting and manipulation
class TimeHelpers {
    // Get time ago string (e.g., "2h", "3d", "1mo")
    static getTimeAgo(date) {
        if (!date) return '';
        
        // Ensure date is a Date object
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const seconds = Math.floor((new Date() - date) / 1000);
        
        // Just now (less than 30 seconds)
        if (seconds < 30) return 'now';
        
        // Seconds (less than a minute)
        if (seconds < 60) return `${seconds}s`;
        
        // Minutes (less than an hour)
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        
        // Hours (less than a day)
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        
        // Days (less than a month)
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d`;
        
        // Months (less than a year)
        const months = Math.floor(days / 30);
        if (months < 12) return `${months}mo`;
        
        // Years
        const years = Math.floor(months / 12);
        return `${years}y`;
    }

    // Get full time ago string (e.g., "2 hours ago")
    static getFullTimeAgo(date) {
        if (!date) return '';
        
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 30) return 'just now';
        if (seconds < 60) return `${seconds} seconds ago`;
        
        const minutes = Math.floor(seconds / 60);
        if (minutes === 1) return '1 minute ago';
        if (minutes < 60) return `${minutes} minutes ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours === 1) return '1 hour ago';
        if (hours < 24) return `${hours} hours ago`;
        
        const days = Math.floor(hours / 24);
        if (days === 1) return 'yesterday';
        if (days < 7) return `${days} days ago`;
        
        const weeks = Math.floor(days / 7);
        if (weeks === 1) return '1 week ago';
        if (weeks < 4) return `${weeks} weeks ago`;
        
        const months = Math.floor(days / 30);
        if (months === 1) return '1 month ago';
        if (months < 12) return `${months} months ago`;
        
        const years = Math.floor(months / 12);
        if (years === 1) return '1 year ago';
        return `${years} years ago`;
    }

    // Format date for display (e.g., "Jan 15, 2024")
    static formatDate(date) {
        if (!date) return '';
        
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const options = { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        };
        
        return date.toLocaleDateString('en-US', options);
    }

    // Format date and time (e.g., "Jan 15, 2024 at 3:30 PM")
    static formatDateTime(date) {
        if (!date) return '';
        
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const dateStr = this.formatDate(date);
        const timeStr = this.formatTime(date);
        
        return `${dateStr} at ${timeStr}`;
    }

    // Format time (e.g., "3:30 PM")
    static formatTime(date) {
        if (!date) return '';
        
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    // Format game time (e.g., "Thu 8:15 PM ET")
    static formatGameTime(date) {
        if (!date) return '';
        
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const day = dayNames[date.getDay()];
        const time = this.formatTime(date);
        
        return `${day} ${time}`;
    }

    // Check if date is today
    static isToday(date) {
        if (!date) return false;
        
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    // Check if date is yesterday
    static isYesterday(date) {
        if (!date) return false;
        
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        return date.getDate() === yesterday.getDate() &&
               date.getMonth() === yesterday.getMonth() &&
               date.getFullYear() === yesterday.getFullYear();
    }

    // Get countdown string (e.g., "2h 30m")
    static getCountdown(futureDate) {
        if (!futureDate) return '';
        
        if (typeof futureDate === 'string') {
            futureDate = new Date(futureDate);
        }
        
        const now = new Date();
        const diff = futureDate - now;
        
        if (diff <= 0) return 'Started';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    // Get timestamp for API
    static getTimestamp() {
        return new Date().toISOString();
    }

    // Parse various date formats
    static parseDate(dateInput) {
        if (!dateInput) return null;
        
        if (dateInput instanceof Date) {
            return dateInput;
        }
        
        if (typeof dateInput === 'string') {
            return new Date(dateInput);
        }
        
        if (typeof dateInput === 'number') {
            return new Date(dateInput);
        }
        
        return null;
    }
}

// Make available globally
window.TimeHelpers = TimeHelpers;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimeHelpers;
}