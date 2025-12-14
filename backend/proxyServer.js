const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const LoadBalancer = require('./services/LoadBalancer');
const MetricsCollector = require('./services/MetricsCollector');
const cacheService = require('./services/CacheService');
const ConnectionPool = require('./services/ConnectionPool');

const targets = [
    'https://healthifyme-o9qv.onrender.com',
    'https://healthifyme-o9qv.onrender.com'
];

const loadBalancer = new LoadBalancer(targets, {
    healthCheckInterval: 5000,
    maxConsecutiveFailures: 3,
    requestTimeout: 3000
});

const metricsCollector = new MetricsCollector();
const connectionPool = new ConnectionPool({
    maxConnections: 50,
    minConnections: 5
});

const app = express();
app.use(cors());

// Cache middleware
app.use(async (req, res, next) => {
    if (req.method === 'GET') {
        try {
            const cachedResponse = await cacheService.get(req.originalUrl);
            if (cachedResponse) {
                return res.json(cachedResponse);
            }
        } catch (error) {
            console.error('Cache error:', error);
        }
    }
    next();
});

const proxy = createProxyMiddleware({
    target: targets[0],
    changeOrigin: true,
    secure: false,
    xfwd: true,
    timeout: 5000,
    proxyTimeout: 5000,
    onProxyReq: async (proxyReq, req) => {
        try {
            const conn = await connectionPool.acquire(req.target);
            proxyReq.agent = conn.agent;
            req.connection = conn;
        } catch (error) {
            console.error('Connection acquisition error:', error);
        }
    },
    onProxyRes: async (proxyRes, req, res) => {
        if (req.connection) {
            connectionPool.release(req.connection);
        }

        if (req.method === 'GET') {
            let rawBody = Buffer.from('');
            proxyRes.on('data', (chunk) => {
                rawBody = Buffer.concat([rawBody, chunk]);
            });

            proxyRes.on('end', () => {
                try {
                    const body = rawBody.toString('utf8');
                    const data = JSON.parse(body);
                    cacheService.set(req.originalUrl, data);
                } catch (error) {
                    // Ignore JSON parsing errors for non-JSON responses
                }
            });
        }
    },
    router: (req) => {
        const target = loadBalancer.getNextTarget();
        const startTime = Date.now();
        req.target = target;
        metricsCollector.recordRequest(target);
        
        req.on('end', () => {
            const responseTime = Date.now() - startTime;
            metricsCollector.recordResponseTime(target, responseTime);
        });
        
        return target;
    },
    onError: (err, req, res) => {
        const target = loadBalancer.getCurrentTarget();
        metricsCollector.recordError(target, err);
        loadBalancer.markUnhealthy(target);

        if (req.connection) {
            connectionPool.release(req.connection);
        }

        if (!res.headersSent) {
            res.writeHead(502);
            res.end("Bad Gateway");
        }
    }
});

// Health check endpoint
app.get('/status', (_, res) => {
    res.json({
        timestamp: Date.now(),
        loadBalancer: loadBalancer.getStats(),
        metrics: metricsCollector.getMetrics(),
        cache: cacheService.getStats(),
        connections: connectionPool.getStats()
    });
});

app.use('/', proxy);

// Cleanup on shutdown
process.on('SIGTERM', () => {
    connectionPool.destroy();
    process.exit(0);
});

const server = app.listen(3001, () => {
    console.log('Optimized proxy server running on port 3001');
});

server.on('error', (error) => {
    console.error('Server error:', error);
});
