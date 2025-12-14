const https = require('https');
const EventEmitter = require('events');

class ConnectionPool extends EventEmitter {
    constructor(options = {}) {
        super();
        this.maxConnections = options.maxConnections || 50;
        this.minConnections = options.minConnections || 5;
        this.ttl = options.ttl || 30000;
        this.maxIdleTime = options.maxIdleTime || 15000;
        
        this.connections = new Map();
        this.waitingQueue = [];
        this.stats = { active: 0, idle: 0, waiting: 0 };
        
        this.agent = new https.Agent({
            keepAlive: true,
            maxSockets: this.maxConnections,
            maxFreeSockets: this.minConnections,
            timeout: 3000,
            keepAliveMsecs: 1000
        });

        this.startMaintenanceInterval();
    }

    maintenance() {
        const now = Date.now();
        for (const [key, conn] of this.connections) {
            if (now - conn.lastUsed > this.maxIdleTime && 
                this.connections.size > this.minConnections) {
                this.connections.delete(key);
                this.stats.idle--;
                conn.socket?.destroy();
            }
        }
    }

    startMaintenanceInterval() {
        setInterval(() => this.maintenance(), 5000);
    }

    async acquire(target) {
        const key = `${target}`;
        
        if (this.connections.has(key) && this.isConnectionValid(this.connections.get(key))) {
            const conn = this.connections.get(key);
            conn.lastUsed = Date.now();
            this.stats.active++;
            this.stats.idle--;
            return conn;
        }

        if (this.connections.size >= this.maxConnections) {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.waitingQueue = this.waitingQueue.filter(w => w.timestamp !== timestamp);
                    this.stats.waiting--;
                    reject(new Error('Connection timeout'));
                }, 5000);

                const timestamp = Date.now();
                this.waitingQueue.push({ target, resolve, reject, timestamp, timeout });
                this.stats.waiting++;
            });
        }

        const newConn = this.createConnection(target);
        this.connections.set(key, newConn);
        this.stats.active++;
        return newConn;
    }

    release(connection) {
        if (!connection) return;
        
        connection.lastUsed = Date.now();
        this.stats.active--;
        this.stats.idle++;

        if (this.waitingQueue.length > 0) {
            const { target, resolve, timeout } = this.waitingQueue.shift();
            clearTimeout(timeout);
            this.stats.waiting--;
            resolve(this.createConnection(target));
        }
    }

    createConnection(target) {
        return {
            agent: this.agent,
            target,
            created: Date.now(),
            lastUsed: Date.now(),
            socket: null
        };
    }

    isConnectionValid(conn) {
        return Date.now() - conn.created < this.ttl && !conn.socket?.destroyed;
    }

    getStats() {
        return {
            ...this.stats,
            poolSize: this.connections.size,
            queueLength: this.waitingQueue.length
        };
    }

    destroy() {
        this.connections.forEach(conn => conn.socket?.destroy());
        this.connections.clear();
        this.waitingQueue.forEach(({ timeout }) => clearTimeout(timeout));
        this.waitingQueue = [];
        this.agent.destroy();
    }
}

module.exports = ConnectionPool;