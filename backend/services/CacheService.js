const NodeCache = require('node-cache');

class CacheService {
    constructor(ttlSeconds = 300) {
        this.cache = new NodeCache({
            stdTTL: ttlSeconds,
            checkperiod: ttlSeconds * 0.2,
            useClones: false,
            maxKeys: 1000
        });

        this.stats = {
            hits: 0,
            misses: 0,
            keys: 0
        };

        // Cleanup on interval
        setInterval(() => this.cleanup(), 60000);
    }

    async get(key) {
        const value = this.cache.get(key);
        if (value) {
            this.stats.hits++;
            return value;
        }
        this.stats.misses++;
        return null;
    }

    async set(key, data) {
        if (!key || !data) return false;
        this.stats.keys = this.cache.keys().length;
        return this.cache.set(key, data);
    }

    async del(key) {
        this.stats.keys = this.cache.keys().length;
        return this.cache.del(key);
    }

    cleanup() {
        const keys = this.cache.keys();
        if (keys.length > 900) { // 90% of max
            const deleteCount = keys.length - 800; // Keep it under 80%
            const keysToDelete = keys.slice(0, deleteCount);
            keysToDelete.forEach(key => this.cache.del(key));
        }
        this.stats.keys = this.cache.keys().length;
    }

    getStats() {
        return {
            ...this.stats,
            keys: this.cache.keys().length,
            memory: process.memoryUsage().heapUsed
        };
    }
}

module.exports = new CacheService();