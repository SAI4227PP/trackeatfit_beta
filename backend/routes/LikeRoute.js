const express = require('express');
const Like = require('../models/Like');
const Post = require('../models/Post');
const User = require('../models/User');
const router = express.Router();
const NodeCache = require('node-cache');
const { notifyAllClients } = require('../middleware/sseMiddleware');
const RedisPostService = require('../utils/postRedisService');

// async function updatePostLikeInCache(postId, userId, isLiked, likeInfo = null) {
//   const [likesCount, post] = await Promise.all([
//     Like.countDocuments({ postId }),
//     Post.findById(postId).lean()
//   ]);

//   const keys = postCache.keys();
//   for (const key of keys) {
//     if (key === `post_${postId}`) {
//       const post = postCache.get(key);
//       if (post) {
//         post.likesCount = likesCount;
//         post.isLiked = isLiked;
//         postCache.set(key, post);
//       }
//     } else if (key.startsWith('posts_') || key.startsWith('user_posts_')) {
//       const data = postCache.get(key);
//       if (data?.posts) {
//         const postIndex = data.posts.findIndex(p => p._id.toString() === postId);
//         if (postIndex !== -1) {
//           data.posts[postIndex] = {
//             ...data.posts[postIndex],
//             likesCount,
//             isLiked
//           };
//           postCache.set(key, data);
//         }
//       }
//     }
//   }

//   // Send detailed SSE notification
//   notifyAllClients('posts', {
//     type: 'likeUpdate',
//     postId,
//     likesCount,
//     isLiked,
//     userId,
//     post,
//     timestamp: new Date().toISOString(),
//     likeInfo
//   });
// }

// Route to like a post

router.post('/like', async (req, res) => {
  const { userId, postId, profilename, uniqueName, profilepic } = req.body;

  try {
    const [post, user] = await Promise.all([
      Post.findById(postId)
        .populate('userId', 'username avatar')
        .lean(),
      User.findById(userId).lean()
    ]);

    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check in Redis first
    const hasLiked = await RedisPostService.hasUserLikedPost(userId, postId);
    const existingLike = hasLiked ? true : await Like.findOne({ userId, postId });

    if (existingLike) {
      const likesCount = await RedisPostService.getPostLikesCount(postId) || await Like.countDocuments({ postId });
      // Replace S3 URLs with CDN in images and profilepic
      const CDN_URL = 'https://cdn.trackeatfit.me';
      const postWithCdn = {
        ...post,
        likesCount,
        isLiked: true,
        images: Array.isArray(post.images)
          ? post.images.map(img =>
              img.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
            )
          : post.images,
        profilepic: post.profilepic && typeof post.profilepic === 'string'
          ? post.profilepic.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
          : post.profilepic
      };
      notifyAllClients('posts', {
        type: 'likeUpdate',
        postId,
        likesCount,
        isLiked: true,
        userId,
        post: postWithCdn
      });
      return res.status(200).json({ 
        message: 'Already liked',
        likesCount,
        isLiked: true,
        timestamp: existingLike.timestamp
      });
    }

    // Update Redis first
    await RedisPostService.likePost(userId, postId);

    const newLike = new Like({
      userId,
      postId,
      profilename: profilename || user.username,
      profilepic: profilepic || user.avatar,
      uniqueName: uniqueName || user.uniqueName,
      timestamp: new Date()
    });

    await newLike.save();
    const likesCount = await RedisPostService.getPostLikesCount(postId);
    

    // Replace S3 URLs with CDN in images and profilepic
    const CDN_URL = 'https://cdn.trackeatfit.me';
    const postWithCdn = {
      ...post,
      likesCount,
      isLiked: true,
      images: Array.isArray(post.images)
        ? post.images.map(img =>
            img.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
          )
        : post.images,
      profilepic: post.profilepic && typeof post.profilepic === 'string'
        ? post.profilepic.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
        : post.profilepic
    };
    notifyAllClients('posts', {
      type: 'likeUpdate',
      postId,
      likesCount,
      isLiked: true,
      userId,
      post: postWithCdn
    });

    res.status(201).json({
      message: 'Liked successfully',
      likesCount,
      isLiked: true,
      timestamp: newLike.timestamp
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Route to get likes for a post with pagination (for handling large data)
router.get('/likes-for-post/:postId', async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const offset = (page - 1) * limit;
    
    const likes = await Like.find({ postId })
      .skip(offset)
      .limit(parseInt(limit))
      .sort({ timestamp: -1 })  // Sort likes by newest first
      .lean();  // Use lean to return plain objects and save memory

    res.status(200).json({ message: 'Likes fetched successfully', likes });
  } catch (error) {
    console.error('Error fetching post likes:', error);
    res.status(500).json({ error: 'Failed to fetch likes for the post' });
  }
});

// Route to get likes by a user (with pagination)
router.get('/likes-by-user/:userId', async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, currentUserId } = req.query;

  try {
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Try to get liked posts from Redis first
    const redisLikedPosts = await RedisPostService.getUserLikedPosts(userId);
    
    if (redisLikedPosts && redisLikedPosts.length > 0) {
      // If we have data in Redis, use it
      res.status(200).json({
        message: 'User likes fetched successfully',
        posts: redisLikedPosts,
        currentPage: parseInt(page),
        totalPages: Math.ceil(redisLikedPosts.length / parseInt(limit)),
        hasMore: (parseInt(page) - 1) * parseInt(limit) + redisLikedPosts.length < redisLikedPosts.length,
        source: 'redis'
      });
      return;
    }

    const mongoose = require('mongoose');
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Use aggregation pipeline similar to savedPosts.js
    const aggregatePipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $sort: { timestamp: -1 } },
      { $skip: skip },
      { $limit: limitNumber },
      {
        $lookup: {
          from: 'posts',
          localField: 'postId',
          foreignField: '_id',
          as: 'post'
        }
      },
      { $unwind: '$post' },
      {
        $lookup: {
          from: 'likes',
          let: { postId: '$post._id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$postId', '$$postId'] } } },
            { $count: 'count' }
          ],
          as: 'likesInfo'
        }
      },
      {
        $lookup: {
          from: 'savedposts',
          let: { postId: '$post._id' },
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
        $lookup: {
          from: 'comments',
          let: { postId: '$post._id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$postId', '$$postId'] } } },
            { $count: 'count' }
          ],
          as: 'commentsInfo'
        }
      },
      {
        $lookup: {
          from: 'likes',
          let: { postId: '$post._id' },
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
          from: 'followings',
          let: { postUserId: '$post.userId' },
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
        $addFields: {
          likesCount: { $ifNull: [{ $arrayElemAt: ['$likesInfo.count', 0] }, 0] },
          commentsCount: { $ifNull: [{ $arrayElemAt: ['$commentsInfo.count', 0] }, 0] },
          isLiked: {
            $cond: {
              if: { $gt: [{ $size: '$userLike' }, 0] },
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
          _id: '$post._id',
          content: '$post.content',
          images: { $ifNull: ['$post.images', []] },
          userId: '$post.userId',
          profilename: '$post.profilename',
          uniqueName: '$post.uniqueName',
          profilepic: '$post.profilepic',
          likesCount: 1,
          commentsCount: 1,
          isLiked: 1,
          isFollowing: 1,
          isSaved: 1,
          likedAt: '$timestamp',
          createdAt: '$post.timestamp'
        }
      }
    ];

    const [posts, total] = await Promise.all([
      Like.aggregate(aggregatePipeline),
      Like.countDocuments({ userId })
    ]);

    // Replace S3 URLs with CDN for both images and profilepic in each post
    const CDN_URL = 'https://cdn.trackeatfit.me';
    const postsWithCdn = posts.map(post => ({
      ...post,
      images: Array.isArray(post.images)
        ? post.images.map(img =>
            img.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
          )
        : post.images,
      profilepic: post.profilepic && typeof post.profilepic === 'string'
        ? post.profilepic.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
        : post.profilepic
    }));

    // Cache the results in Redis
    await RedisPostService.setUserLikedPosts(userId, postsWithCdn);

    res.status(200).json({
      message: 'User likes fetched successfully',
      posts: postsWithCdn,
      currentPage: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      hasMore: skip + postsWithCdn.length < total,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching user likes:', error);
    res.status(500).json({ error: 'Failed to fetch user likes', details: error.message });
  }
});


router.get('/likes-count/:postId', async (req, res) => {
  const { postId } = req.params;

  if (!postId) {
    console.error("Missing postId in request");
    return res.status(400).json({ error: 'postId is required' });
  }

  try {
    // Get from Redis first, fallback to MongoDB
    let likeCount = await RedisPostService.getPostLikesCount(postId);
    if (likeCount === null) {
      likeCount = await Like.countDocuments({ postId });
    }
    console.log("Likes count for postId:", postId, "is:", likeCount);
    res.status(200).json({ message: 'Total likes fetched successfully', likeCount });
  } catch (error) {
    console.error("Error fetching total likes for postId:", postId, error);
    res.status(500).json({ error: 'Failed to fetch total likes' });
  }
});

// Route to remove a like
router.delete('/unlike', async (req, res) => {
  const { userId, postId } = req.body;

  try {
    const [like, post] = await Promise.all([
      Like.findOne({ userId, postId }),
      Post.findById(postId)
        .populate('userId', 'username avatar')
        .lean()
    ]);
    

    if (!like) {
      const likesCount = await Like.countDocuments({ postId });
      // Replace S3 URLs with CDN in images and profilepic
      const CDN_URL = 'https://cdn.trackeatfit.me';
      const postWithCdn = {
        ...post,
        likesCount,
        isLiked: false,
        images: Array.isArray(post.images)
          ? post.images.map(img =>
              img.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
            )
          : post.images,
        profilepic: post.profilepic && typeof post.profilepic === 'string'
          ? post.profilepic.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
          : post.profilepic
      };
      notifyAllClients('posts', {
        type: 'likeUpdate',
        postId,
        likesCount,
        isLiked: false,
        userId,
        post: postWithCdn
      });
      return res.status(200).json({ 
        message: 'Not liked',
        likesCount,
        isLiked: false
      });
    }

    if (like.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to remove this like' });
    }

    // Update Redis first
    await RedisPostService.unlikePost(userId, postId);
    
    await Like.findOneAndDelete({ userId, postId });
    const likesCount = await RedisPostService.getPostLikesCount(postId);


    // Replace S3 URLs with CDN in images and profilepic
    const CDN_URL = 'https://cdn.trackeatfit.me';
    const postWithCdn = {
      ...post,
      likesCount,
      isLiked: false,
      images: Array.isArray(post.images)
        ? post.images.map(img =>
            img.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
          )
        : post.images,
      profilepic: post.profilepic && typeof post.profilepic === 'string'
        ? post.profilepic.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
        : post.profilepic
    };
    notifyAllClients('posts', {
      type: 'likeUpdate',
      postId,
      likesCount,
      isLiked: false,
      userId,
      post: postWithCdn
    });

    res.status(200).json({ 
      message: 'Unliked successfully',
      likesCount,
      isLiked: false
    });
  } catch (error) {
    console.error('Unlike error:', error);
    res.status(500).json({ error: 'Failed to unlike post' });
  }
});

module.exports = router;
