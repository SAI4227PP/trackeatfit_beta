class MetricsCollector {
    constructor() {
        this.metrics = {
            requests: new Map(),
            errors: new Map(),
            responseTimes: new Map(),
            timeouts: new Map(),
            lastErrors: new Map()
        };
        
        this.startPeriodicCleanup();
    }

    startPeriodicCleanup() {
        setInterval(() => {
            this.cleanupOldErrors();
        }, 300000); // Cleanup every 5 minutes
    }

    recordRequest(target) {
        const current = this.metrics.requests.get(target) || 0;
        this.metrics.requests.set(target, current + 1);
    }

    recordError(target, error) {
        // Update error count
        const errorCount = this.metrics.errors.get(target) || 0;
        this.metrics.errors.set(target, errorCount + 1);

        // Update timeout count if it's a timeout error
        if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
            const timeouts = this.metrics.timeouts.get(target) || 0;
            this.metrics.timeouts.set(target, timeouts + 1);
        }

        // Store last 10 errors with timestamp
        const errors = this.metrics.lastErrors.get(target) || [];
        errors.unshift({
            timestamp: Date.now(),
            message: error.message,
            code: error.code
        });
        if (errors.length > 10) errors.pop();
        this.metrics.lastErrors.set(target, errors);
    }

    recordResponseTime(target, time) {
        const times = this.metrics.responseTimes.get(target) || [];
        times.push(time);
        if (times.length > 100) times.shift();
        this.metrics.responseTimes.set(target, times);
    }

    cleanupOldErrors() {
        const threshold = Date.now() - 3600000; // 1 hour
        for (const [target, errors] of this.metrics.lastErrors) {
            const filtered = errors.filter(e => e.timestamp > threshold);
            this.metrics.lastErrors.set(target, filtered);
        }
    }

    getMetrics() {
        const result = {};
        for (const [target, requests] of this.metrics.requests) {
            const times = this.metrics.responseTimes.get(target) || [];
            result[target] = {
                requests,
                errors: this.metrics.errors.get(target) || 0,
                timeouts: this.metrics.timeouts.get(target) || 0,
                averageResponseTime: times.length ? 
                    Math.round(times.reduce((a,b) => a + b, 0) / times.length) : 0,
                last100ResponseTimes: times,
                lastErrors: this.metrics.lastErrors.get(target) || [],
                errorRate: requests ? 
                    ((this.metrics.errors.get(target) || 0) / requests * 100).toFixed(2) : 0
            };
        }
        return result;
    }

    resetMetrics() {
        this.metrics.requests.clear();
        this.metrics.errors.clear();
        this.metrics.responseTimes.clear();
        this.metrics.timeouts.clear();
        // Keep last errors for debugging
    }
}

module.exports = MetricsCollector;