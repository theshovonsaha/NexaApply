// Debounce function for performance optimization
export function debounce(func, wait) {
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

// Throttle function for performance optimization
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Batch DOM operations for better performance
export class DOMBatch {
    constructor(wait = 16) {
        this.wait = wait;
        this.queue = new Set();
        this.running = false;
    }

    add(operation) {
        this.queue.add(operation);
        if (!this.running) {
            this.running = true;
            requestAnimationFrame(() => this.process());
        }
    }

    process() {
        const operations = Array.from(this.queue);
        this.queue.clear();
        
        operations.forEach(operation => {
            try {
                operation();
            } catch (error) {
                console.error('DOM operation failed:', error);
            }
        });
        
        if (this.queue.size > 0) {
            requestAnimationFrame(() => this.process());
        } else {
            this.running = false;
        }
    }
}

// Cache manager for form analysis results
export class AnalysisCache {
    constructor(maxSize = 50) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    set(key, value, ttl = 3600000) {
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl
        });
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return entry.value;
    }

    clear() {
        this.cache.clear();
    }
}

// Performance monitoring
export class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = new Set();
    }

    startOperation(name) {
        const start = performance.now();
        return {
            end: () => {
                const duration = performance.now() - start;
                this.recordMetric(name, duration);
            }
        };
    }

    recordMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        
        const metrics = this.metrics.get(name);
        metrics.push(value);
        
        if (metrics.length > 100) {
            metrics.shift();
        }
        
        this.notifyObservers(name, value);
    }

    getMetrics(name) {
        const metrics = this.metrics.get(name) || [];
        return {
            avg: metrics.reduce((a, b) => a + b, 0) / metrics.length,
            min: Math.min(...metrics),
            max: Math.max(...metrics),
            count: metrics.length
        };
    }

    addObserver(callback) {
        this.observers.add(callback);
        return () => this.observers.delete(callback);
    }

    notifyObservers(name, value) {
        this.observers.forEach(callback => {
            try {
                callback(name, value);
            } catch (error) {
                console.error('Observer notification failed:', error);
            }
        });
    }
}

// Initialize performance monitoring
export const performance = new PerformanceMonitor();
