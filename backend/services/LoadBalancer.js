const https = require('https');

class LoadBalancer {
    constructor(targets, options = {}) {
        this.targets = targets;
        this.currentTarget = 0;
        this.healthStatus = new Map();
        this.responseTimes = new Map();
        this.consecutiveFailures = new Map();
        
        this.options = {
            healthCheckInterval: options.healthCheckInterval || 5000,
            maxConsecutiveFailures: options.maxConsecutiveFailures || 3,
            requestTimeout: options.requestTimeout || 3000,
            minHealthyTargets: options.minHealthyTargets || 1
        };

        this.agent = new https.Agent({
            keepAlive: true,
            maxSockets: 50,
            timeout: this.options.requestTimeout
        });

        this.initializeHealth();
        this.startHealthChecks();
    }

    initializeHealth() {
        this.targets.forEach(target => {
            this.healthStatus.set(target, true);
            this.responseTimes.set(target, []);
            this.consecutiveFailures.set(target, 0);
        });
    }

    async checkHealth(target) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const req = https.get(target, { 
                agent: this.agent,
                timeout: this.options.requestTimeout 
            }, (res) => {
                const responseTime = Date.now() - startTime;
                this.updateResponseTime(target, responseTime);
                
                const isHealthy = res.statusCode === 200;
                this.updateHealth(target, isHealthy);
                resolve(isHealthy);
            });

            req.on('error', () => {
                this.updateHealth(target, false);
                resolve(false);
            });

            req.on('timeout', () => {
                req.destroy();
                this.updateHealth(target, false);
                resolve(false);
            });
        });
    }

    updateHealth(target, isHealthy) {
        if (!isHealthy) {
            const failures = this.consecutiveFailures.get(target) + 1;
            this.consecutiveFailures.set(target, failures);
            if (failures >= this.options.maxConsecutiveFailures) {
                this.healthStatus.set(target, false);
            }
        } else {
            this.consecutiveFailures.set(target, 0);
            this.healthStatus.set(target, true);
        }
    }

    updateResponseTime(target, time) {
        const times = this.responseTimes.get(target);
        times.push(time);
        if (times.length > 10) times.shift();
        this.responseTimes.set(target, times);
    }

    getAverageResponseTime(target) {
        const times = this.responseTimes.get(target);
        return times.length ? times.reduce((a,b) => a + b, 0) / times.length : Infinity;
    }

    startHealthChecks() {
        setInterval(() => {
            this.targets.forEach(target => this.checkHealth(target));
        }, this.options.healthCheckInterval);
    }

    getNextTarget() {
        const healthyTargets = this.targets.filter(t => this.healthStatus.get(t));
        if (healthyTargets.length === 0) {
            if (this.targets.length >= this.options.minHealthyTargets) {
                // Reset health status if all targets are unhealthy
                this.targets.forEach(t => this.healthStatus.set(t, true));
                return this.targets[0];
            }
        }

        // Sort by response time and pick fastest healthy target
        const target = healthyTargets.sort((a, b) => 
            this.getAverageResponseTime(a) - this.getAverageResponseTime(b)
        )[0] || this.targets[0];

        this.currentTarget = this.targets.indexOf(target);
        return target;
    }

    getCurrentTarget() {
        return this.targets[this.currentTarget];
    }

    markUnhealthy(target) {
        const failures = this.consecutiveFailures.get(target) + 1;
        this.consecutiveFailures.set(target, failures);
        if (failures >= this.options.maxConsecutiveFailures) {
            this.healthStatus.set(target, false);
        }
    }

    getStats() {
        return {
            healthyTargets: this.targets.filter(t => this.healthStatus.get(t)).length,
            totalTargets: this.targets.length,
            targetStats: Object.fromEntries(this.targets.map(target => [
                target,
                {
                    healthy: this.healthStatus.get(target),
                    avgResponseTime: this.getAverageResponseTime(target),
                    consecutiveFailures: this.consecutiveFailures.get(target)
                }
            ]))
        };
    }
}

module.exports = LoadBalancer;