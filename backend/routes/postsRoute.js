const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { 
  client: redisClient, 
  setCache, 
  getCache
} = require('../config/redis');
const RedisPostService = require('../utils/postRedisService');
const Post = require('../models/Post');
const Like = require('../models/Like');
const Comment = require('../models/CommentSchema');
const Following = require('../models/Following');
const SavedPost = require('../models/SavedPost');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const { notifyAllClients } = require('../middleware/sseMiddleware');

// Add debug logging to notifyAllClients to verify SSE events are sent
function notifyAllClientsWithLog(event, data) {
  console.log(`[SSE DEBUG] notifyAllClients called: event=${event}, data=`, JSON.stringify(data));
  notifyAllClients(event, data);
}

require('dotenv').config();
const compression = require('compression');

router.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// (router.use(limiter);)

// Update multer config for larger files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // Increase to 100MB limit
    files: 6 // Limit to 6 files
  },
});

// Configure S3 with explicit region
const s3Client = new S3Client({
  region: 'us-east-1', // Hardcode the region or ensure it's set in environment
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Add error logging for environment variables
console.log('AWS Config:', {
  region: process.env.AWS_REGION,
  bucketName: process.env.AWS_BUCKET_NAME,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
});

// Generate unique filename
const generateUniqueFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};

// Update image upload endpoint to handle multiple images
router.post('/upload-image', upload.array('images', 6), async (req, res) => {
  const uploadTimeout = setTimeout(() => {
    res.status(504).json({ error: 'Upload timeout' });
  }, 30000); // 30 second timeout

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    if (req.files.length > 6) {
      return res.status(400).json({ error: 'Maximum 6 images allowed' });
    }

    const uploadPromises = req.files.map(file => {
      const fileName = generateUniqueFileName(file.originalname);
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `posts/${fileName}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read',
          CacheControl: 'public, max-age=31536000, immutable'   // Cache for 1 year

      };

      return s3Client.send(new PutObjectCommand(uploadParams))
        .then(() => `https://${process.env.AWS_BUCKET_NAME}.s3.us-east-1.amazonaws.com/posts/${fileName}`)
        // .then(() => `https://cdn.trackeatfit.xyz/posts/${fileName}`)
        .catch(error => {
          console.error('S3 upload error:', error);
          throw error;
        });
    });

    const imageUrls = await Promise.all(uploadPromises);
    clearTimeout(uploadTimeout);

    res.status(200).json({
      message: 'Images uploaded successfully',
      urls: imageUrls
    });
  } catch (error) {
    clearTimeout(uploadTimeout);
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload images',
      details: error.message
    });
  }
});

// Create a new post
router.post('/create', async (req, res) => {
  const { content, images, userId, profilename, uniqueName, profilepic } = req.body;

  try {
    const postData = {
      content,
      images: images || [],
      userId,
      profilename,
      uniqueName,
      profilepic,
      timestamp: new Date().toISOString(),
      likesCount: 0,
      commentsCount: 0
    };

    // Save to MongoDB to get a valid _id
    const createdPost = await Post.create(postData);
    const postId = createdPost._id.toString();

    // Save to Redis
    await RedisPostService.createPost(userId, postId, {
      ...postData,
      _id: postId
    });

    // (Cache update logic moved to RedisPostService.createPost)

    notifyAllClientsWithLog('posts', { 
      type: 'create', 
      post: { ...createdPost.toObject(), _id: postId },
      timestamp: new Date().toISOString()
    });
    res.status(201).json({ 
      message: 'Post created successfully', 
      post: { ...createdPost.toObject(), _id: postId }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Helper: Retry function for Redis operations
async function withRetry(operation, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i === maxRetries - 1) break;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
    }
  }
  handleRedisError(lastError, operation.name);
}

// Helper: Process CDN URLs
function processCDNUrls(data) {
  const CDN_URL = 'https://cdn.trackeatfit.xyz';
  const processUrl = url => url?.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL);
  
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      images: Array.isArray(item.images) ? item.images.map(processUrl) : item.images,
      profilepic: processUrl(item.profilepic)
    }));
  }
  return {
    ...data,
    images: Array.isArray(data.images) ? data.images.map(processUrl) : data.images,
    profilepic: processUrl(data.profilepic)
  };
}

// Helper: Log Redis errors
function handleRedisError(error, operationName) {
  console.error(`Redis error in operation "${operationName}":`, error);
}

// Update cache references to use withRetry and log cache timings
router.get('/all', async (req, res) => {
  const endpointStart = startEndpointTimer();
  const { page = 1, limit = 10 } = req.query;
  const userId = req.query.userId;

  try {
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // Always get the total count from the database for totalPages
    const dbTotalPosts = await Post.countDocuments().maxTimeMS(2000);

    // Check how many posts are cached in Redis
    const [redisTotalPosts, listLength] = await Promise.all([
      RedisPostService.getTotalPostsCount(),
      redisClient.lLen('posts:all')
    ]);
    const totalCachedPosts = listLength || redisTotalPosts || 0;
    const startIdx = (pageNumber - 1) * limitNumber;

    let redisPosts = null;
    // Only use Redis if the requested page is within the cached range
    if (startIdx < totalCachedPosts) {
      redisPosts = await RedisPostService.getAllPosts(pageNumber, limitNumber, userId);
    }

    if (redisPosts && redisPosts.length > 0) {
      // Re-calculate isLiked and isSaved for the requesting user
      const postsWithUserFlags = await Promise.all(redisPosts.map(async post => {
        const [isLiked, isSaved] = userId
          ? await Promise.all([
              RedisPostService.hasUserLikedPost(userId, post._id),
              RedisPostService.hasUserSavedPost(userId, post._id)
            ])
          : [false, false];
        return {
          ...post,
          isLiked,
          isSaved
        };
      }));
      // Always use dbTotalPosts for totalPages
      const responseData = {
        message: 'Posts fetched successfully',
        posts: processCDNUrls(postsWithUserFlags),
        totalPages: Math.ceil(dbTotalPosts / limitNumber),
        currentPage: pageNumber,
        hasMore: pageNumber * limitNumber < dbTotalPosts,
        source: 'redis'
      };
      logEndpointTimer(endpointStart, 'Endpoint /all (redis)');
      return res.status(200).json(responseData);
    }

    // If no posts in Redis or empty result, proceed with database query
    const cacheKey = `posts:all:${pageNumber}:${limitNumber}:${userId || 'public'}`;
    
    // Time the cache get
    const cacheStart = process.hrtime.bigint();
    const cachedData = await withRetry(() => getCache(cacheKey));
    const cacheEnd = process.hrtime.bigint();
    const cacheMs = Number(cacheEnd - cacheStart) / 1e6;

    if (cachedData) {
      console.log(`Cache HIT: ${cacheKey} took ${cacheMs.toFixed(2)} ms`);
      logEndpointTimer(endpointStart, 'Endpoint /all (cache hit)');
      return res.status(200).json({
        ...cachedData,
        source: 'cache'
      });
    } else {
      console.log(`Cache MISS: ${cacheKey} took ${cacheMs.toFixed(2)} ms`);
    }

    const skipAmount = (pageNumber - 1) * limitNumber;
    const CDN_URL = 'https://cdn.trackeatfit.xyz';

    // Check Redis for saved posts first
    let userSavedPosts = [];
    if (userId) {
        userSavedPosts = await RedisPostService.getUserSavedPosts(userId);
    }

    // Existing aggregation pipeline
    const aggregatePipeline = [
      { $sort: { timestamp: -1 } },
      { $skip: skipAmount },
      { $limit: limitNumber },
      {
        $lookup: {
          from: 'followings',
          let: { postUserId: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$follower', userId ? new mongoose.Types.ObjectId(userId) : null] },
                    { $eq: ['$following', '$$postUserId'] },
                    { $eq: ['$isFollowing', true] }
                  ]
                }
              }
            }
          ],
          as: 'followStatus'
        }
      },
      {
        $lookup: {
          from: 'likes',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$postId', '$$postId'] },
                    { $eq: ['$userId', userId ? new mongoose.Types.ObjectId(userId) : null] }
                  ]
                }
              }
            }
          ],
          as: 'userLike'
        }
      },
      {
        $lookup: {
          from: 'likes',
          let: { postId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$postId', '$$postId'] } } },
            { $count: 'count' }
          ],
          as: 'likesInfo'
        }
      },
      {
        $lookup: {
          from: 'comments',
          let: { postId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$postId', '$$postId'] } } },
            { $count: 'count' }
          ],
          as: 'commentsInfo'
        }
      },
      {
        $lookup: {
          from: 'savedposts',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$postId', '$$postId'] },
                    { $eq: ['$userId', userId ? new mongoose.Types.ObjectId(userId) : null] }
                  ]
                }
              }
            }
          ],
          as: 'savedStatus'
        }
      },
      {
        $addFields: {
          likesCount: { $ifNull: [{ $arrayElemAt: ['$likesInfo.count', 0] }, 0] },
          commentsCount: { $ifNull: [{ $arrayElemAt: ['$commentsInfo.count', 0] }, 0] },
          isLiked: {
            $cond: {
              if: { $gt: [{ $ifNull: [{ $size: '$userLike' }, 0] }, 0] },
              then: true,
              else: false
            }
          },
          isFollowing: {
            $cond: {
              if: { $gt: [{ $ifNull: [{ $size: '$followStatus' }, 0] }, 0] },
              then: true,
              else: false
            }
          },
          isSaved: {
            $cond: {
              if: { $gt: [{ $ifNull: [{ $size: '$savedStatus' }, 0] }, 0] },
              then: true,
              else: false
            }
          }
        }
      },
      {
        $project: {
          content: 1,
          images: 1,
          userId: 1,
          profilename: 1,
          profilepic: 1,
          uniqueName: 1,
          timestamp: 1,
          likesCount: 1,
          commentsCount: 1,
          isLiked: 1,
          isFollowing: 1,
          isSaved: 1,
          _id: 1
        }
      }
    ];

    const dbStart = process.hrtime.bigint();
    const dbPosts = await Post.aggregate(aggregatePipeline)
      .option({ maxTimeMS: 5000 })
      .exec();
    const dbEnd = process.hrtime.bigint();
    const dbMs = Number(dbEnd - dbStart) / 1e6;
    console.log(`DB Query for /all took ${dbMs.toFixed(2)} ms`);

    if (!Array.isArray(dbPosts)) {
      throw new Error('Invalid response from database');
    }

    // Get saved posts from Redis first
    let savedPosts = [];
    if (userId) {
        savedPosts = await RedisPostService.getUserSavedPosts(userId);
    }

    // Process posts for CDN and update isSaved based on Redis data
    const processedPosts = await Promise.all(dbPosts.map(async post => {
        // Check Redis first for saved status
        const isSaved = userId ? await RedisPostService.hasUserSavedPost(userId, post._id.toString()) : false;
        
        return {
            ...post,
            images: post.images.map(img =>
                img.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
            ),
            profilepic: post.profilepic && typeof post.profilepic === 'string'
                ? post.profilepic.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
                : post.profilepic,
            isSaved
        };
    }));

    const responseData = {
      message: 'Posts fetched successfully',
      posts: processedPosts,
      totalPages: Math.ceil(dbTotalPosts / limitNumber),
      currentPage: pageNumber,
      hasMore: pageNumber * limitNumber < dbTotalPosts
    };

    // Store posts in Redis for future requests
    await Promise.all(processedPosts.map(async (post) => {
      await RedisPostService.setPost(post._id, post);
    }));

    // Cache the response
    const cacheSetStart = process.hrtime.bigint();
    await Promise.all([
      RedisPostService.setAllPosts(processedPosts, pageNumber, limitNumber, dbTotalPosts), // Use dbTotalPosts instead of totalPosts
      RedisPostService.setTotalPostsCount(dbTotalPosts)
    ]);
    const cacheSetEnd = process.hrtime.bigint();
    const cacheSetMs = Number(cacheSetEnd - cacheSetStart) / 1e6;
    console.log(`Redis SET: posts took ${cacheSetMs.toFixed(2)} ms`);

    // Notify connected clients in real-time
    notifyAllClientsWithLog('posts', {
      type: 'postsFetched',
      posts: processedPosts.map(post => ({
        ...post,
        likesCount: post.likesCount || 0,
        isLiked: post.isLiked || false,
        isFollowing: post.isFollowing || false
      })),
      timestamp: new Date().toISOString()
    });

    logEndpointTimer(endpointStart, 'Endpoint /all (db)');
    res.status(200).json({
      ...responseData,
      source: 'database'
    });

  } catch (error) {
    console.error('Error in /all endpoint:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return res.status(503).json({
        error: 'Database service unavailable',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});


// Fetch posts newer than a given timestamp
router.get('/recent/:timestamp', async (req, res) => {
  const { timestamp } = req.params;

  try {
    const recentPosts = await Post.find({
      timestamp: { $gt: new Date(timestamp) }
    })
    .sort({ timestamp: -1 })
    .select('-__v');

    res.status(200).json({
      message: 'Recent posts fetched successfully',
      posts: recentPosts
    });
  } catch (error) {
    console.error('Error fetching recent posts:', error.message);
    res.status(500).json({ error: 'Failed to fetch recent posts' });
  }
});

// Fetch a single post by ID with Redis-first and real-time updates
router.get('/:postId', async (req, res) => {
  const endpointStart = startEndpointTimer();
  const { postId } = req.params;
  const userId = req.query.userId; // Dynamically pass userId

  try {
    // Try Redis first (pass userId for real-time fields)
    let post = await RedisPostService.getPost(postId, userId);
    if (post) {
      // Re-calculate isLiked and isSaved for the requesting user
      let isLiked = false, isSaved = false;
      if (userId) {
        isLiked = await RedisPostService.hasUserLikedPost(userId, postId);
        isSaved = await RedisPostService.hasUserSavedPost(userId, postId);
      }
      post.isLiked = isLiked;
      post.isSaved = isSaved;
      logEndpointTimer(endpointStart, 'Endpoint /:postId (cache hit)');
      return res.status(200).json({
        message: 'Post fetched successfully',
        post,
        source: 'redis'
      });
    }

    // Fallback to MongoDB
    const aggregationPipeline = [
      {
        $match: { _id: new mongoose.Types.ObjectId(postId) }
      },
      {
        $lookup: {
          from: 'followings',
          let: { postUserId: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: { 
                  $and: [
                    { $eq: ['$follower', userId ? new mongoose.Types.ObjectId(userId) : null] },
                    { $eq: ['$following', '$$postUserId'] },
                    { $eq: ['$isFollowing', true] }
                  ]
                }
              }
            }
          ],
          as: 'followStatus'
        }
      },
      {
        $lookup: {
          from: 'likes',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { 
                  $and: [
                    { $eq: ['$postId', '$$postId'] },
                    { $eq: ['$userId', userId ? new mongoose.Types.ObjectId(userId) : null] }
                  ]
                }
              }
            }
          ],
          as: 'userLike'
        }
      },
      {
        $lookup: {
          from: 'likes',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$postId', '$$postId'] }
              }
            },
            {
              $count: 'count'
            }
          ],
          as: 'likesInfo'
        }
      },
      {
        $lookup: {
          from: 'comments',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$postId', '$$postId'] }
              }
            },
            {
              $count: 'count'
            }
          ],
          as: 'commentsInfo'
        }
      },
      {
        $lookup: {
          from: 'savedposts',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { 
                  $and: [
                    { $eq: ['$postId', '$$postId'] },
                    { $eq: ['$userId', userId ? new mongoose.Types.ObjectId(userId) : null] }
                  ]
                }
              }
            }
          ],
          as: 'savedStatus'
        }
      },
      {
        $addFields: {
          likesCount: {
            $ifNull: [{ $arrayElemAt: ['$likesInfo.count', 0] }, 0]
          },
          commentsCount: {
            $ifNull: [{ $arrayElemAt: ['$commentsInfo.count', 0] }, 0]
          },
          isLiked: {
            $cond: {
              if: { $gt: [{ $ifNull: [{ $size: '$userLike' }, 0] }, 0] },
              then: true,
              else: false
            }
          },
          isFollowing: {
            $cond: {
              if: { $gt: [{ $ifNull: [{ $size: '$followStatus' }, 0] }, 0] },
              then: true,
              else: false
            }
          },
          isSaved: {
            $cond: {
              if: { $gt: [{ $ifNull: [{ $size: '$savedStatus' }, 0] }, 0] },
              then: true,
              else: false
            }
          }
        }
      },
      {
        $project: {
          content: 1,
          images: 1,
          userId: 1,
          profilename: 1,
          profilepic: 1,
          uniqueName: 1,
          timestamp: 1,
          likesCount: 1,
          commentsCount: 1,
          isLiked: 1,
          isFollowing: 1,
          isSaved: 1,
          _id: 1
        }
      }
    ];

    const [dbPosts, totalLikes, totalComments] = await Promise.all([
      Post.aggregate(aggregationPipeline),
      RedisPostService.getPostLikesCount(postId),
      RedisPostService.getPostCommentsCount(postId)
    ]);
    
    let postObj = dbPosts[0];

    if (!postObj) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Process CDN URLs and enhance with real-time counts
    const CDN_URL = 'https://cdn.trackeatfit.xyz';
    postObj = {
      ...postObj,
      images: postObj.images.map(img =>
        img.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
      ),
      profilepic: postObj.profilepic && typeof postObj.profilepic === 'string'
        ? postObj.profilepic.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        : postObj.profilepic,
      likesCount: totalLikes || postObj.likesCount,
      commentsCount: totalComments || postObj.commentsCount
    };

    // Store the *full* post object in Redis as an object (not string)
    await RedisPostService.setPost(postId, postObj);

    // Subscribe to real-time updates
    notifyAllClientsWithLog('post', {
      type: 'postUpdated',
      postId,
      post: postObj,
      timestamp: new Date().toISOString()
    });

    logEndpointTimer(endpointStart, 'Endpoint /:postId (db)');
    res.status(200).json({
      message: 'Post fetched successfully',
      post: postObj,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Delete a comment and cascade delete likes on that comment
router.delete('/comment/:commentId', async (req, res) => {
  const { commentId } = req.params;
  const { userId } = req.body;
  try {
    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    // Only allow owner to delete
    if (comment.userId?.toString() !== userId?.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    // Delete likes on this comment
    const LikeOnComment = require('../models/LikeOnCommentSchema');
    await Promise.all([
      LikeOnComment.deleteMany({ commentId }),
      Comment.deleteOne({ _id: commentId })
    ]);
    notifyAllClientsWithLog('comments', { type: 'delete', commentId });
    res.status(200).json({ message: 'Comment and related likes deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment and related likes' });
  }
});

// Update fetch posts by user ID with pagination and real-time updates
router.get('/user/:userId', async (req, res) => {
  const endpointStart = startEndpointTimer();
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const currentUserId = req.query.currentUserId;

  try {
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // Try Redis cache first
    const redisPosts = await RedisPostService.getUserPosts(userId, pageNumber, limitNumber);
    const redisTotalPosts = await RedisPostService.getUserTotalPostsCount(userId);

    if (redisPosts && redisPosts.length > 0) {
      // Enhance posts with user-specific data, always recalculate isLiked/isSaved
      const CDN_URL = 'https://cdn.trackeatfit.xyz';
      const processedPosts = await Promise.all(redisPosts.map(async post => {
        const postIdStr = post._id ? post._id.toString() : undefined;
        const postUserIdStr = post.userId ? post.userId.toString() : undefined;
        const currUserIdStr = currentUserId ? currentUserId.toString() : undefined;

        let isLiked = false, isSaved = false, isFollowing = false, likesCount = 0, commentsCount = 0;

        try {
          isLiked = (currUserIdStr && postIdStr)
            ? await RedisPostService.hasUserLikedPost(currUserIdStr, postIdStr)
            : false;
        } catch (e) { /* ... */ }
        try {
          isSaved = (currUserIdStr && postIdStr)
            ? await RedisPostService.hasUserSavedPost(currUserIdStr, postIdStr)
            : false;
        } catch (e) { /* ... */ }
        try {
          isFollowing = (currUserIdStr && postUserIdStr)
            ? await RedisPostService.isUserFollowing(currUserIdStr, postUserIdStr)
            : false;
        } catch (e) { /* ... */ }
        try {
          if (postIdStr) {
            // Always get the latest likesCount from Redis, fallback to post.likesCount
            const redisLikesCount = await RedisPostService.getPostLikesCount(postIdStr);
            likesCount = typeof redisLikesCount === 'number' && !isNaN(redisLikesCount)
              ? redisLikesCount
              : post.likesCount || 0;
          } else {
            likesCount = post.likesCount || 0;
          }
        } catch (e) { likesCount = post.likesCount || 0; }
        try {
          commentsCount = postIdStr
            ? parseInt(await redisClient.hGet(`post:${postIdStr}`, 'commentsCount')) || post.commentsCount || 0
            : post.commentsCount || 0;
        } catch (e) { commentsCount = post.commentsCount || 0; }

        return {
          ...post,
          images: post.images.map(img =>
            img.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
          ),
          profilepic: post.profilepic && typeof post.profilepic === 'string'
            ? post.profilepic.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
            : post.profilepic,
          isLiked,
          isSaved,
          isFollowing,
          likesCount, // always use the latest likesCount
          commentsCount
        };
      }));

      const responseData = {
        message: 'User posts fetched successfully',
        posts: processedPosts,
        totalPages: Math.ceil((redisTotalPosts || processedPosts.length) / limitNumber),
        currentPage: pageNumber,
        hasMore: pageNumber * limitNumber < (redisTotalPosts || processedPosts.length),
        source: 'redis'
      };

      logEndpointTimer(endpointStart, 'Endpoint /user/:userId (redis)');
      return res.status(200).json(responseData);
    }

    // Always get the total count from the database for totalPages
    const dbTotalPosts = await Post.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });

    // Always fetch from database first
    const skipAmount = (pageNumber - 1) * limitNumber;
    const aggregatePipeline = [
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) }
      },
      { $sort: { timestamp: -1 } },
      { $skip: skipAmount },
      { $limit: limitNumber },
      {
        $lookup: {
          from: 'followings',
          let: { postUserId: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$follower', currentUserId ? new mongoose.Types.ObjectId(currentUserId) : null] },
                    { $eq: ['$following', '$$postUserId'] },
                    { $eq: ['$isFollowing', true] }
                  ]
                }
              }
            }
          ],
          as: 'followStatus'
        }
      },
      {
        $lookup: {
          from: 'likes',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$postId', '$$postId'] },
                    { $eq: ['$userId', currentUserId ? new mongoose.Types.ObjectId(currentUserId) : null] }
                  ]
                }
              }
            }
          ],
          as: 'userLike'
        }
      },
      {
        $lookup: {
          from: 'likes',
          let: { postId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$postId', '$$postId'] } } },
            { $count: 'count' }
          ],
          as: 'likesInfo'
        }
      },
      {
        $lookup: {
          from: 'comments',
          let: { postId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$postId', '$$postId'] } } },
            { $count: 'count' }
          ],
          as: 'commentsInfo'
        }
      },
      {
        $lookup: {
          from: 'savedposts',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$postId', '$$postId'] },
                    { $eq: ['$userId', currentUserId ? new mongoose.Types.ObjectId(currentUserId) : null] }
                  ]
                }
              }
            }
          ],
          as: 'savedStatus'
        }
      },
      {
        $addFields: {
          likesCount: { $ifNull: [{ $arrayElemAt: ['$likesInfo.count', 0] }, 0] },
          commentsCount: { $ifNull: [{ $arrayElemAt: ['$commentsInfo.count', 0] }, 0] },
          isLiked: {
            $cond: {
              if: { $gt: [{ $ifNull: [{ $size: '$userLike' }, 0] }, 0] },
              then: true,
              else: false
            }
          },
          isFollowing: {
            $cond: {
              if: { $gt: [{ $ifNull: [{ $size: '$followStatus' }, 0] }, 0] },
              then: true,
              else: false
            }
          },
          isSaved: {
            $cond: {
              if: { $gt: [{ $ifNull: [{ $size: '$savedStatus' }, 0] }, 0] },
              then: true,
              else: false
            }
          }
        }
      },
      {
        $project: {
          content: 1,
          images: 1,
          userId: 1,
          profilename: 1,
          profilepic: 1,
          uniqueName: 1,
          timestamp: 1,
          likesCount: 1,
          commentsCount: 1,
          isLiked: 1,
          isFollowing: 1,
          isSaved: 1,
          _id: 1
        }
      }
    ];

    const dbStart = process.hrtime.bigint();
    const posts = await Post.aggregate(aggregatePipeline).exec();
    const dbEnd = process.hrtime.bigint();
    const dbMs = Number(dbEnd - dbStart) / 1e6;
    console.log(`DB Query for /user/:userId took ${dbMs.toFixed(2)} ms`);

    const totalPosts = dbTotalPosts;

    // Process posts for CDN and update likes/saved/commentCount from Redis
    const CDN_URL = 'https://cdn.trackeatfit.xyz';
    const processedPosts = await Promise.all(posts.map(async post => {
      // Defensive: ensure IDs are present and strings
      const postIdStr = post._id ? post._id.toString() : undefined;
      const postUserIdStr = post.userId ? post.userId.toString() : undefined;
      const currUserIdStr = currentUserId ? currentUserId.toString() : undefined;

      let isLiked = false, isSaved = false, isFollowing = false, likesCount = 0, commentsCount = 0;

      try {
        isLiked = (currUserIdStr && postIdStr)
          ? await RedisPostService.hasUserLikedPost(currUserIdStr, postIdStr)
          : false;
      } catch (e) {
        console.error('Redis hasUserLikedPost error:', e);
      }

      try {
        isSaved = (currUserIdStr && postIdStr)
          ? await RedisPostService.hasUserSavedPost(currUserIdStr, postIdStr)
          : false;
      } catch (e) {
        console.error('Redis hasUserSavedPost error:', e);
      }

      try {
        isFollowing = (currUserIdStr && postUserIdStr)
          ? await RedisPostService.isUserFollowing(currUserIdStr, postUserIdStr)
          : false;
      } catch (e) {
        console.error('Redis isUserFollowing error:', e);
      }

      try {
        likesCount = postIdStr
          ? await RedisPostService.getPostLikesCount(postIdStr)
          : 0;
      } catch (e) {
        console.error('Redis getPostLikesCount error:', e);
      }

      try {
        commentsCount = postIdStr
          ? parseInt(await redisClient.hGet(`post:${postIdStr}`, 'commentsCount')) || post.commentsCount || 0
          : post.commentsCount || 0;
      } catch (e) {
        console.error('Redis get commentsCount error:', e);
        commentsCount = post.commentsCount || 0;
      }

      return {
        ...post,
        images: post.images.map(img =>
          img.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        ),
        profilepic: post.profilepic && typeof post.profilepic === 'string'
          ? post.profilepic.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
          : post.profilepic,
        isLiked,
        isSaved,
        isFollowing,
        likesCount: likesCount || post.likesCount || 0,
        commentsCount
      };
    }));

    const responseData = {
      message: 'User posts fetched successfully',
      posts: processedPosts,
      totalPages: Math.ceil(totalPosts / limitNumber),
      currentPage: pageNumber,
      hasMore: pageNumber * limitNumber < totalPosts
    };

    // Store posts in Redis for future requests (update cache like /all)
    await Promise.all([
      RedisPostService.setUserPosts(userId, processedPosts, pageNumber, limitNumber),
      RedisPostService.setUserTotalPostsCount(userId, totalPosts)
    ]);
    const cacheKey = `user:${userId}:posts:${pageNumber}:${limitNumber}:${currentUserId || 'public'}`;
    await setCache(cacheKey, responseData);

    // Notify connected clients in real-time
    notifyAllClientsWithLog('userPosts', {
      type: 'userPostsFetched',
      userId,
      posts: processedPosts,
      timestamp: new Date().toISOString()
    });

    logEndpointTimer(endpointStart, 'Endpoint /user/:userId (db)');
    res.status(200).json({
      ...responseData,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching user posts:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return res.status(503).json({
        error: 'Database service unavailable',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Add new endpoint to get posts with likes
router.get('/posts-with-likes/:userId', async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  try {
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skipAmount = (pageNumber - 1) * limitNumber;

    // First get the posts and total count
    const [posts, totalPosts] = await Promise.all([
      Post.find()
        .select('-__v')
        .sort({ timestamp: -1 })
        .skip(skipAmount)
        .limit(limitNumber)
        .lean()
        .maxTimeMS(5000),
      Post.countDocuments().maxTimeMS(3000)
    ]);

    // Then fetch likes
    const likesUrl = `${process.env.API_URL || 'https://healthifyme-o9qv.onrender.com'}/posts-likes/likes-by-user/${userId}`;
    const likesResponse = await fetch(likesUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!likesResponse.ok) {
      throw new Error(`Failed to fetch likes. Status: ${likesResponse.status}`);
    }

    const userLikes = await likesResponse.json();

    // Validate likes data
    if (!userLikes || !Array.isArray(userLikes.likes)) {
      console.error('Invalid likes data:', userLikes);
      throw new Error('Invalid likes data received');
    }

    // Enhance posts with like information
    const enhancedPosts = posts.map(post => ({
      ...post,
      isLiked: userLikes.likes.some(like => like.postId === post._id.toString()),
      likesCount: post.likesCount || 0
    }));

    res.status(200).json({
      message: 'Posts fetched successfully',
      posts: enhancedPosts,
      totalPages: Math.ceil(totalPosts / limitNumber),
      currentPage: pageNumber,
      hasMore: pageNumber * limitNumber < totalPosts
    });

  } catch (error) {
    console.error('Error fetching posts with likes:', error);
    res.status(error.name === 'MongooseError' ? 503 : 500).json({
      error: 'Failed to fetch posts with likes',
      details: error.message,
      type: error.name
    });
  }
});

// Update a post
router.put('/update/:postId', async (req, res) => {
  const { postId } = req.params;
  const { content, images, userId } = req.body;

  try {
    // Check post in Redis first
    const post = await RedisPostService.getPost(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedData = {
      ...post,
      content: content || post.content,
      images: images || post.images
    };

    // Update in Redis first
    await RedisPostService.updatePost(userId, postId, updatedData);

    notifyAllClientsWithLog('posts', { type: 'update', post: updatedData });
    res.status(200).json({ 
      message: 'Post updated successfully', 
      post: updatedData 
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete a post with Redis-first
router.delete('/delete/:postId', async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  try {
    // Check ownership in Redis first
    let post = await RedisPostService.getPost(postId);

    if (!post) {
      // If not found in Redis, check MongoDB
      post = await Post.findById(postId).lean();
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
    }

    // Check ownership
    if (post.userId?.toString() !== userId?.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete from Redis and update all related caches
    await RedisPostService.deletePost(userId, postId);

    // Cascade delete: Comments, Likes, SavedPosts
    const deleteComments = Comment.deleteMany({ postId });
    const deleteLikes = Like.deleteMany({ postId });
    const deleteSaved = SavedPost.deleteMany({ postId });

    // Also delete likes on comments for this post
    // First, get all comment IDs for this post
    const commentDocs = await Comment.find({ postId }, '_id');
    const commentIds = commentDocs.map(c => c._id);
    let deleteLikesOnComments = Promise.resolve();
    if (commentIds.length > 0) {
      const LikeOnComment = require('../models/LikeOnCommentSchema');
      deleteLikesOnComments = LikeOnComment.deleteMany({ commentId: { $in: commentIds } });
    }

    // Delete the post itself
    const deletePost = Post.deleteOne({ _id: postId });

    // Run all deletions in parallel
    await Promise.all([
      deleteComments,
      deleteLikes,
      deleteSaved,
      deleteLikesOnComments,
      deletePost
    ]);

    notifyAllClientsWithLog('posts', { type: 'delete', postId });
    res.status(200).json({ message: 'Post and related data deleted successfully' });

  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post and related data' });
  }
});

// Fetch posts by uniqueName with pagination
router.get('/user/name/:uniqueName', async (req, res) => {
  const endpointStart = startEndpointTimer();
  const { uniqueName } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const currentUserId = req.query.currentUserId;
  
  try {
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const cacheKey = `username:${uniqueName}:posts:${pageNumber}:${limitNumber}:${currentUserId || 'public'}`;
    
    // Try cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      logEndpointTimer(endpointStart, 'Endpoint /user/name/:uniqueName (cache hit)');
      return res.status(200).json({
        ...cachedData,
        source: 'cache'
      });
    }

    const skipAmount = (pageNumber - 1) * limitNumber;
    const aggregatePipeline = [
      {
        $match: { uniqueName: uniqueName }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $skip: skipAmount
      },
      {
        $limit: limitNumber
      },
      {
        $lookup: {
          from: 'comments',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$postId', '$$postId'] }
              }
            },
            {
              $count: 'count'
            }
          ],
          as: 'commentsInfo'
        }
      },
      {
        $lookup: {
          from: 'likes',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { 
                  $and: [
                    { $eq: ['$postId', '$$postId'] },
                    { $eq: ['$userId', currentUserId ? new mongoose.Types.ObjectId(currentUserId) : null] }
                  ]
                }
              }
            }
          ],
          as: 'userLike'
        }
      },
      {
        $lookup: {
          from: 'likes',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$postId', '$$postId'] }
              }
            },
            {
              $count: 'count'
            }
          ],
          as: 'likesInfo'
        }
      },
      {
        $lookup: {
          from: 'savedposts',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { 
                  $and: [
                    { $eq: ['$postId', '$$postId'] },
                    { $eq: ['$userId', currentUserId ? new mongoose.Types.ObjectId(currentUserId) : null] }
                  ]
                }
              }
            }
          ],
          as: 'savedStatus'
        }
      },
      {
        $addFields: {
          likesCount: {
            $ifNull: [{ $arrayElemAt: ['$likesInfo.count', 0] }, 0]
          },
          commentsCount: {
            $ifNull: [{ $arrayElemAt: ['$commentsInfo.count', 0] }, 0]
          },
          isLiked: {
            $cond: {
              if: { $gt: [{ $ifNull: [{ $size: '$userLike' }, 0] }, 0] },
              then: true,
              else: false
            }
          },
          isSaved: {
            $cond: {
              if: { $gt: [{ $ifNull: [{ $size: '$savedStatus' }, 0] }, 0] },
              then: true,
              else: false
            }
          }
        }
      },
      {
        $project: {
          content: 1,
          images: 1,
          userId: 1,
          profilename: 1,
          profilepic: 1,
          uniqueName: 1,
          timestamp: 1,
          likesCount: 1,
          commentsCount: 1,
          isLiked: 1,
          isSaved: 1,
          _id: 1
        }
      }
    ];

    const [posts, totalPosts] = await Promise.all([
      Post.aggregate(aggregatePipeline).exec(),
      Post.countDocuments({ uniqueName })
    ]);

    // Process posts for CDN
    const CDN_URL = 'https://cdn.trackeatfit.xyz';
    const processedPosts = posts.map(post => ({
      ...post,
      images: post.images.map(img =>
        img.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
      ),
      profilepic: post.profilepic && typeof post.profilepic === 'string'
        ? post.profilepic.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        : post.profilepic
    }));

    const responseData = {
      message: 'User posts fetched successfully',
      posts: processedPosts,
      totalPages: Math.ceil(totalPosts / limitNumber),
      currentPage: pageNumber,
      hasMore: pageNumber * limitNumber < totalPosts
    };

    // Cache the response
    await setCache(cacheKey, responseData);

    logEndpointTimer(endpointStart, 'Endpoint /user/name/:uniqueName (db)');
    res.status(200).json({
      ...responseData,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// Global middleware to log request duration for all posts routes
router.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${durationMs.toFixed(2)} ms`);
  });
  next();
});

// Helper to start endpoint timer
function startEndpointTimer() {
  return process.hrtime.bigint();
}
function logEndpointTimer(endpointStart, label) {
  const endpointEnd = process.hrtime.bigint();
  const endpointMs = Number(endpointEnd - endpointStart) / 1e6;
  console.log(`${label} total time: ${endpointMs.toFixed(2)} ms`);
}

module.exports = router;

// --- Instrument all cache gets globally for timing ---
const originalGetCache = getCache;
async function timedGetCache(key) {
  const start = process.hrtime.bigint();
  const result = await originalGetCache(key);
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1e6;
  if (result) {
    console.log(`Cache HIT: ${key} took ${ms.toFixed(2)} ms`);
  } else {
    console.log(`Cache MISS: ${key} took ${ms.toFixed(2)} ms`);
  }
  return result;
}
// Replace getCache everywhere in this file
// (You may need to replace all getCache() calls with timedGetCache() if you want global timing.)
// For now, only /all endpoint is instrumented above.