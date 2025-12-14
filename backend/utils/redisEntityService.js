// redisEntityService.js
// Generic Redis-first service for any entity/action
// Note: Batch persistence to MongoDB is scheduled every hour in redisBatchWorker.js using node-cron.

const { client: redisClient, setCache, getCache } = require('../config/redis');
const { v4: uuidv4 } = require('uuid');

// Constants
const BATCH_INTERVAL = 5 * 60; // 5 minutes
const REDIS_KEY_EXPIRY = 4 * 60 * 60; // 4 hours (much longer than batch interval)
const EPHEMERAL_KEY_EXPIRY = 5 * 60; // 5 minutes for temporary data like OTPs

const CHANGE_LOG_KEY = 'change_log'; // Redis list for ordered change log

// Helper: Safe key scanning
async function scanKeys(pattern) {
  const keys = [];
  let cursor = '0';
  
  do {
    const [newCursor, batch] = await redisClient.scan(cursor, {
      MATCH: pattern,
      COUNT: 100
    });
    cursor = newCursor;
    keys.push(...batch);
  } while (cursor !== '0');
  
  return keys;
}

// Add Redis operation error handler
const handleRedisError = (error, operation) => {
  console.error(`Redis error during ${operation}:`, {
    message: error.message,
    code: error.code,
    operation
  });
  return null;
};

// Write entity to Redis with no expiry
async function writeEntityToRedis(entityType, entityId, payload) {
  const key = `${entityType}:${entityId}`;
  try {
    const sanitizedData = {};
    Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (typeof v === 'object') {
            sanitizedData[k] = JSON.stringify(v);
        } else {
            sanitizedData[k] = String(v);
        }
    });
    await redisClient.hSet(key, sanitizedData);
    // No expiry set
    return key;
  } catch (error) {
    return handleRedisError(error, 'writeEntityToRedis');
  }
}

// Add readEntityFromRedis function
async function readEntityFromRedis(entityType, entityId) {
  try {
    const key = `${entityType}:${entityId}`;
    const data = await redisClient.hGetAll(key);
    return Object.keys(data).length ? data : null;
  } catch (error) {
    handleRedisError(error, 'readEntityFromRedis');
    return null;
  }
}

// Improved cache invalidation with scanning
async function invalidateCache(pattern) {
  const keys = await scanKeys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}

// Atomic counter operations
async function updateCounter(key, field, increment = true) {
  const multi = redisClient.multi();
  multi
    .hIncrBy(key, field, increment ? 1 : -1);
  // No expiry set
  const [result] = await multi.exec();
  return result;
}

// Log action to Redis change log (for batch persistence)
async function logActionToRedis({ entityType, entityId, userId, action, payload }) {
  const logEntry = JSON.stringify({
    entityType,
    entityId,
    userId,
    action,
    timestamp: Date.now(),
    payload,
  });
  await redisClient.rPush(CHANGE_LOG_KEY, logEntry);
}

// Generic handler for any action
async function handleEntityAction({ entityType, action, userId, payload }) {
  let entityId = payload._id || uuidv4();
  // Write to Redis first
  if (action === 'create' || action === 'update') {
    await writeEntityToRedis(entityType, entityId, payload);
  } else if (action === 'delete') {
    await redisClient.del(`${entityType}:${entityId}`);
  }
  // Log the action
  await logActionToRedis({ entityType, entityId, userId, action, payload });
  return { entityId };
}

// Add health check method
async function checkRedisHealth() {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

module.exports = {
  writeEntityToRedis,
  readEntityFromRedis,
  logActionToRedis,
  handleEntityAction,
  scanKeys,
  invalidateCache,
  updateCounter,
  checkRedisHealth,
};
