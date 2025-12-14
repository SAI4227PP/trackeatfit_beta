// redisBatchWorker.js
// Batch worker to flush Redis change logs to MongoDB for all entities

const mongoose = require('mongoose');
const { client: redisClient, connectRedis } = require('../config/redis');
const { invalidateCache } = require('./redisEntityService');
const Post = require('../models/Post');
const Comment = require('../models/CommentSchema');
const Like = require('../models/Like');
const SavedPost = require('../models/SavedPost');
const Following = require('../models/Following');
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const LoggedFood = require('../models/LoggedFood');
const SleepData = require('../models/SleepData');
const Favorite = require('../models/Favorite');
const UserGoal = require('../models/UserGoal');
const NotificationSettings = require('../models/NotificationSettings');
const Achievement = require('../models/Achievement');
const UserToken = require('../models/UserToken');
const LikeOnComment = require('../models/LikeOnCommentSchema');
const CurrentUser = require('../models/CurrentUser');
const OTP = require('../models/OTP');
const MacronutrientData = require('../models/MacronutrientData.js');

const ENTITY_MODELS = {
  post: Post,
  comment: Comment,
  like: Like,
  savedpost: SavedPost,
  following: Following,
  user: User,
  recipe: Recipe,
  loggedfood: LoggedFood,
  sleepdata: SleepData,
  favorite: Favorite,
  usergoal: UserGoal,
  notificationsettings: NotificationSettings,
  achievement: Achievement,
  usertoken: UserToken,
  likeoncomment: LikeOnComment,
  currentuser: CurrentUser,
  otp: OTP,
  macronutrientdata: MacronutrientData,
};

const CHANGE_LOG_KEY = 'change_log'; // Redis list for ordered change log

// Constants for batch processing
const BATCH_SIZE = 1000; // Process logs in chunks of 1000
const MAX_RETRIES = 3;
const CHUNK_PROCESS_DELAY = 100; // ms between chunks

// Helper: Parse action log entry
function parseLogEntry(entry) {
  try {
    return JSON.parse(entry);
  } catch {
    return null;
  }
}

// Helper: Group actions by entity and id
function groupActionsByEntity(logs) {
  const map = {};
  for (const log of logs) {
    const { entityType, entityId } = log;
    if (!map[entityType]) map[entityType] = {};
    if (!map[entityType][entityId]) map[entityType][entityId] = [];
    map[entityType][entityId].push(log);
  }
  return map;
}

// Helper: Process a chunk of logs safely
async function processLogsChunk(chunk) {
  const logs = chunk.map(parseLogEntry).filter(Boolean);
  const grouped = groupActionsByEntity(logs);
  
  for (const [entityType, entities] of Object.entries(grouped)) {
    const Model = ENTITY_MODELS[entityType];
    if (!Model) continue;

    // Process in smaller batches to avoid overwhelming MongoDB
    const ops = [];
    for (const [entityId, actions] of Object.entries(entities)) {
      // Find if deleted
      const deleted = actions.find(a => a.action === 'delete');
      if (deleted) {
        // Delete entity, skip all other actions
        ops.push({ deleteOne: { filter: { _id: entityId } } });
        continue;
      }
      // Only keep last update/create/like/unlike etc. (idempotent)
      let lastAction = actions[actions.length - 1];
      if (lastAction.action === 'create' || lastAction.action === 'update') {
        ops.push({
          updateOne: {
            filter: { _id: entityId },
            update: { $set: lastAction.payload },
            upsert: true,
          },
        });
      } else if (lastAction.action === 'like') {
        // For like, ensure unique (idempotent)
        ops.push({
          updateOne: {
            filter: { _id: entityId },
            update: { $addToSet: { likes: lastAction.userId } },
            upsert: false,
          },
        });
      } else if (lastAction.action === 'unlike') {
        ops.push({
          updateOne: {
            filter: { _id: entityId },
            update: { $pull: { likes: lastAction.userId } },
            upsert: false,
          },
        });
      }
      // Add more actions as needed

      if (ops.length >= 1000) { // MongoDB bulk write limit
        await Model.bulkWrite(ops, { ordered: false });
        ops.length = 0;
      }
    }
    
    if (ops.length > 0) {
      await Model.bulkWrite(ops, { ordered: false });
    }
  }
}

// Main batch worker with safe log extraction
async function flushRedisToMongo() {
  await connectRedis();
  let processedCount = 0;
  let retryCount = 0;

  while (true) {
    const multi = redisClient.multi();
    
    try {
      // Atomic operation: get batch + remove from list
      const logs = await redisClient
        .multi()
        .lrange(CHANGE_LOG_KEY, 0, BATCH_SIZE - 1)
        .ltrim(CHANGE_LOG_KEY, BATCH_SIZE, -1)
        .exec();

      if (!logs?.[0]?.length) {
        break; // No more logs to process
      }

      await processLogsChunk(logs[0]);
      processedCount += logs[0].length;

      // Add delay between chunks to reduce system load
      await new Promise(resolve => setTimeout(resolve, CHUNK_PROCESS_DELAY));

    } catch (error) {
      console.error('Error processing batch:', error);
      retryCount++;
      
      if (retryCount >= MAX_RETRIES) {
        throw new Error(`Failed to process batch after ${MAX_RETRIES} retries`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }

  console.log(`Batch flush complete: ${processedCount} logs processed`);

  // Invalidate all relevant caches after flush
  // Adjust patterns as needed for your cache key scheme
  await Promise.all([
    invalidateCache('posts:all:*'),
    invalidateCache('post:*'),
    invalidateCache('user:*:posts:*'),
    invalidateCache('username:*:posts:*')
  ]);

  return processedCount;
}

// Run every hour (or use a scheduler like node-cron)
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
      await flushRedisToMongo();
      process.exit(0);
    });
}


// Schedule automatic batch flush every hour if this file is required (not just run directly)
if (require.main !== module) {
  const cron = require('node-cron');
  cron.schedule('*/5 * * * *', async () => {
    try {
      await flushRedisToMongo();
      console.log('[CRON] Redis batch flush completed');
    } catch (err) {
      console.error('[CRON] Redis batch flush failed:', err);
    }
  });
}

module.exports = { flushRedisToMongo };
