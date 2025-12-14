const redis = require('redis');
const REDIS_CHANNEL = 'sse:events';

// Use the same Redis URL as your main redis client config
const REDIS_URL = process.env.REDIS_URL ||
  `redis://${process.env.REDIS_PASSWORD ? ':' + encodeURIComponent(process.env.REDIS_PASSWORD) + '@' : ''}${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

// Create a Redis publisher and subscriber with explicit URL
const pubClient = redis.createClient({ url: REDIS_URL });
const subClient = redis.createClient({ url: REDIS_URL });

pubClient.connect().catch(console.error);
subClient.connect().catch(console.error);

const sseClients = new Map();
const wsClients = new Set(); // Store WebSocket clients

// Broadcast function for both SSE and WebSocket clients
function broadcast(eventType, data) {
  // SSE clients
  for (const [clientId, client] of sseClients) {
    try {
      client.res.write(`event: ${eventType}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error(`Error notifying client ${clientId}:`, error);
      clearInterval(client.heartbeat);
      sseClients.delete(clientId);
    }
  }
  // WebSocket clients
  for (const ws of wsClients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ eventType, data }));
    }
  }
}

// Subscribe to the SSE channel
subClient.subscribe(REDIS_CHANNEL, (message) => {
  try {
    const { eventType, data } = JSON.parse(message);
    broadcast(eventType, data);
  } catch (err) {
    console.error('Failed to parse SSE pub/sub message:', err, message);
  }
});

const sseMiddleware = (req, res, next) => {
  if (req.url.includes('/events')) {
    // Pick allowed origin dynamically
    let allowedOrigin = 'http://localhost:3000';
    if (process.env.NODE_ENV === 'production') {
      allowedOrigin = [
        'https://healthifyme-o9qv.onrender.com',
        'https://trackeatfit.onrender.com',
        'https://v1.trackeatfit.xyz'
      ].includes(req.headers.origin)
        ? req.headers.origin
        : 'https://v1.trackeatfit.xyz'; // fallback
    }

    // Add security headers for SSE connections
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Credentials': 'true',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-XSS-Protection': '1; mode=block'
    });

    const clientId = Date.now();
    const client = {
      id: clientId,
      res,
      heartbeat: setInterval(() => {
        res.write(': heartbeat\n\n');
      }, 30000)
    };

    sseClients.set(clientId, client);
    console.log(`Client ${clientId} connected. Total clients: ${sseClients.size}`);

    // Send initial connection confirmation
    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ clientId })}\n\n`);

    req.on('close', () => {
      clearInterval(client.heartbeat);
      sseClients.delete(clientId);
      console.log(`Client ${clientId} disconnected. Remaining clients: ${sseClients.size}`);
    });
  } else {
    next();
  }
};

// WebSocket setup function
function setupWebSocket(server) {
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ server, path: '/ws/events' });

  wss.on('connection', (ws, req) => {
    wsClients.add(ws);
    ws.send(JSON.stringify({ eventType: 'connected', data: { message: 'WebSocket connected' } }));

    ws.on('close', () => {
      wsClients.delete(ws);
    });

    ws.on('error', () => {
      wsClients.delete(ws);
    });
  });
}

// Notify all clients via Redis pub/sub
const notifyAllClients = (eventType = 'update', data = 'fetch') => {
  pubClient.publish(REDIS_CHANNEL, JSON.stringify({ eventType, data }))
    .catch(err => console.error('Redis publish error:', err));
};

module.exports = { sseMiddleware, notifyAllClients, setupWebSocket };
