// DOM Helpers - Utilities for DOM manipulation
class DOMHelpers {
    // Query selector with error handling
    static $(selector, parent = document) {
        return parent.querySelector(selector);
    }

    // Query selector all
    static $$(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    }

    // Create element with attributes and content
    static createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('data')) {
                element.setAttribute(key, value);
            } else {
                element[key] = value;
            }
        });
        
        // Set content
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content instanceof Element) {
            element.appendChild(content);
        } else if (Array.isArray(content)) {
            content.forEach(child => {
                if (child instanceof Element) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    }

    // Add event listener with delegation support
    static on(element, event, selectorOrHandler, handler) {
        if (typeof selectorOrHandler === 'function') {
            // Direct event listener
            element.addEventListener(event, selectorOrHandler);
        } else {
            // Delegated event listener
            element.addEventListener(event, function(e) {
                const target = e.target.closest(selectorOrHandler);
                if (target && element.contains(target)) {
                    handler.call(target, e);
                }
            });
        }
    }

    // Remove element from DOM
    static remove(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    // Insert element after another element
    static insertAfter(newElement, referenceElement) {
        referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
    }

    // Show element
    static show(element) {
        if (element) {
            element.style.display = '';
            element.hidden = false;
        }
    }

    // Hide element
    static hide(element) {
        if (element) {
            element.style.display = 'none';
        }
    }

    // Toggle element visibility
    static toggle(element) {
        if (element) {
            if (element.style.display === 'none') {
                this.show(element);
            } else {
                this.hide(element);
            }
        }
    }

    // Add class
    static addClass(element, className) {
        if (element) {
            element.classList.add(className);
        }
    }

    // Remove class
    static removeClass(element, className) {
        if (element) {
            element.classList.remove(className);
        }
    }

    // Toggle class
    static toggleClass(element, className) {
        if (element) {
            element.classList.toggle(className);
        }
    }

    // Has class
    static hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    }

    // Get/set data attribute
    static data(element, key, value) {
        if (!element) return null;
        
        if (value === undefined) {
            // Get data
            return element.dataset[key];
        } else {
            // Set data
            element.dataset[key] = value;
        }
    }

    // Animate element
    static animate(element, properties, duration = 300, callback) {
        if (!element) return;
        
        element.style.transition = `all ${duration}ms ease`;
        
        // Apply properties
        Object.assign(element.style, properties);
        
        // Callback after animation
        if (callback) {
            setTimeout(callback, duration);
        }
    }

    // Fade in
    static fadeIn(element, duration = 300, callback) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.display = '';
        
        setTimeout(() => {
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '1';
            
            if (callback) {
                setTimeout(callback, duration);
            }
        }, 10);
    }

    // Fade out
    static fadeOut(element, duration = 300, callback) {
        if (!element) return;
        
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.style.display = 'none';
            if (callback) callback();
        }, duration);
    }

    // Scroll to element
    static scrollTo(element, options = {}) {
        if (!element) return;
        
        const defaultOptions = {
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
        };
        
        element.scrollIntoView({ ...defaultOptions, ...options });
    }

    // Get element position
    static getPosition(element) {
        if (!element) return { top: 0, left: 0 };
        
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
        };
    }

    // Check if element is in viewport
    static isInViewport(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Empty element content
    static empty(element) {
        if (element) {
            element.innerHTML = '';
        }
    }

    // Replace element content
    static html(element, content) {
        if (element) {
            element.innerHTML = content;
        }
    }

    // Get/set text content
    static text(element, content) {
        if (!element) return '';
        
        if (content === undefined) {
            return element.textContent;
        } else {
            element.textContent = content;
        }
    }

    // Clone element
    static clone(element, deep = true) {
        return element ? element.cloneNode(deep) : null;
    }

    // Find parent by selector
    static closest(element, selector) {
        return element ? element.closest(selector) : null;
    }

    // Create document fragment from HTML string
    static createFragment(htmlString) {
        const template = document.createElement('template');
        template.innerHTML = htmlString.trim();
        return template.content;
    }

    // Debounce function
    static debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    static throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Ready function (DOMContentLoaded)
    static ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }
}

// Create shortcuts
const $ = DOMHelpers.$;
const $$ = DOMHelpers.$$;

// Make available globally
window.DOMHelpers = DOMHelpers;
window.$ = $;
window.$$ = $$;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DOMHelpers;
}