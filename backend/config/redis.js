const { createClient } = require('redis');

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
const REDIS_USERNAME = process.env.REDIS_USERNAME || 'default';

console.log('Redis config:', {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_USERNAME,
  REDIS_PASSWORD: REDIS_PASSWORD ? '***' : '(empty)',
});

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
      return Math.min(retries * 200, 3000);
    },
    keepAlive: 5000,
  },
  legacyMode: false,
});

let isConnected = false;

client.on('connect', () => {
  console.log(`Redis: Connecting to ${REDIS_HOST}:${REDIS_PORT}...`);
});

client.on('ready', () => {
  isConnected = true;
  console.log('Redis: Connected and ready');
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

client.on('end', () => {
  isConnected = false;
  console.warn('Redis: Connection closed');
});

async function connectRedis() {
  if (client.isReady || isConnected) {
    return true;
  }

  try {
    await client.connect();
    const pong = await client.ping();

    if (pong === 'PONG') {
      isConnected = true;
      console.log(`Redis PING response: ${pong}`);
      return true;
    }

    console.error('Redis PING failed, continuing without Redis.');
    isConnected = false;
    return false;
  } catch (error) {
    isConnected = false;
    console.error('Redis connection failed:', error);
    console.warn('Continuing startup without Redis. Cache-dependent features will be degraded.');
    return false;
  }
}

async function setCache(key, value) {
  if (!client.isReady) {
    return;
  }

  try {
    await client.set(key, JSON.stringify(value));
    console.log(`Cache SET: ${key} (no expiry)`);
  } catch (err) {
    console.error(`Redis SET error for key "${key}":`, err);
  }
}

async function getCache(key) {
  if (!client.isReady) {
    return null;
  }

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

const shutdown = async () => {
  console.log('Shutting down gracefully...');

  if (!client.isOpen) {
    process.exit(0);
  }

  try {
    await client.quit();
  } catch (err) {
    console.error('Error during Redis shutdown:', err);
  }

  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = {
  client,
  setCache,
  getCache,
  connectRedis,
  isConnected: () => isConnected && client.isReady,
};
