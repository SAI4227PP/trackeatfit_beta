// redisClient.js
const { createClient } = require('redis');

// =======================
// Load from environment
// =======================
// Example .env file:
// REDIS_HOST=10.0.0.1       (WireGuard private IP of Redis VM)
// REDIS_PORT=6379
// REDIS_PASSWORD=yourStrongPassword

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
const REDIS_USERNAME = process.env.REDIS_USERNAME || 'default';

console.log('Redis config:', {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_USERNAME,
  REDIS_PASSWORD: REDIS_PASSWORD ? '***' : '(empty)'
});

// =======================
// Create Redis Client
// =======================
const client = createClient({
  username: REDIS_USERNAME,
  password: REDIS_PASSWORD,
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis: Too many retries, giving up.');
        return new Error('Retry limit reached');
      }
      console.warn(`Redis: Reconnecting attempt #${retries}...`);
      return Math.min(retries * 200, 3000); // exponential backoff up to 3s
    },
    keepAlive: 5000,
  },
  legacyMode: false, // modern API only
});

// =======================
// Event Listeners
// =======================
client.on('connect', () => {
  console.log(`Redis: Connecting to ${REDIS_HOST}:${REDIS_PORT}...`);
});
client.on('ready', () => {
  console.log('Redis: Connected and ready ✅');
});
client.on('error', (err) => {
  console.error('Redis Client Error ❌', err);
});
client.on('end', () => {
  console.warn('Redis: Connection closed');
});

// =======================
// Connect Function with Health Check
// =======================
async function connectRedis() {
  try {
    await client.connect();

    // Health check
    const pong = await client.ping();
    if (pong === 'PONG') {
      console.log(`Redis PING response: ${pong} ✅`);
    } else {
      console.error('Redis PING failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Redis connection failed:', error);
    process.exit(1); // fail fast in production
  }
}

// =======================
// Cache Helpers
// =======================
// Set cache without expiry
async function setCache(key, value) {
  try {
    await client.set(key, JSON.stringify(value));
    console.log(`Cache SET: ${key} (no expiry)`);
  } catch (err) {
    console.error(`Redis SET error for key "${key}":`, err);
  }
}

async function getCache(key) {
  try {
    const value = await client.get(key);
    if (value) {
      console.log(`Cache HIT: ${key}`);
      return JSON.parse(value);
    }
    console.log(`Cache MISS: ${key}`);
    return null;
  } catch (err) {
    console.error(`Redis GET error for key "${key}":`, err);
    return null;
  }
}

// =======================
// Graceful Shutdown
// =======================
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  try {
    await client.quit();
  } catch (err) {
    console.error('Error during Redis shutdown:', err);
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// =======================
// Initialize
// =======================

let isConnected = false;

// Modified connect function that ensures single connection
async function connectRedis() {
  if (isConnected) {
    return;
  }
  
  try {
    await client.connect();
    isConnected = true;

    // Health check
    const pong = await client.ping();
    if (pong === 'PONG') {
      console.log(`Redis PING response: ${pong} ✅`);
    } else {
      console.error('Redis PING failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Redis connection failed:', error);
    isConnected = false;
    throw error;
  }
}

module.exports = {
  client,
  setCache,
  getCache,
  connectRedis,
  isConnected: () => isConnected
};
