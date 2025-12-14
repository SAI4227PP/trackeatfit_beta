const express = require('express');
const Comment = require('../models/CommentSchema');
const Post = require('../models/Post');
const LikeOnComment = require('../models/LikeOnCommentSchema');
const LikeOnPost = require('../models/Like');
const SavedPost = require('../models/SavedPost');
const { client: redisClient } = require('../config/redis');
const { notifyAllClients } = require('../middleware/sseMiddleware');
const RedisPostService = require('../utils/postRedisService');
const router = express.Router();
const mongoose = require('mongoose');

// Constants
const CDN_URL = 'https://cdn.trackeatfit.me';
const S3_URL = 'https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com';

// Create a comment
router.post('/create', async (req, res) => {
  const { postId, content, userId, profilename, profilepic, uniqueName } = req.body;
  try {
    // Validate if post exists (optional, based on requirements)
    const post = await Post.findById(postId).lean();
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Create the MongoDB comment first to get a valid _id
    const newComment = new Comment({
      postId,
      content,
      userId,
      profilename,
      uniqueName,
      profilepic,
      timestamp: new Date().toISOString(),
    });

    const commentData = {
      ...newComment.toObject(),
      _id: newComment._id.toString() // Convert ObjectId to string for Redis
    };
    // Save to Redis first as primary storage
    const redisResult = await RedisPostService.addComment(userId, postId, commentData);
    if (!redisResult) {
      return res.status(500).json({ error: 'Failed to save comment in Redis' });
    }
    // Save the comment to MongoDB as backup
    const savedComment = await newComment.save();
    res.status(201).json({ message: 'Comment created successfully', comment: savedComment });

    // Update user comments cache asynchronously
    (async () => {
      // Update user comments cache for all paginations
      const userCommentsKeys = await redisClient.keys(`user:${userId}:comments:*`);
      for (const key of userCommentsKeys) {
        const cached = await redisClient.get(key);
        if (cached) {
          try {
            const data = JSON.parse(cached);
            let updated = false;
            const postsArr = data.posts.map(item => {
              if (item.post && item.post._id?.toString() === postId.toString()) {
                const newComments = [savedComment, ...(item.comments || [])];
                updated = true;
                return {
                  ...item,
                  comments: newComments
                };
              }
              return item;
            });
            if (updated) {
              const newData = { ...data, posts: postsArr };
              await redisClient.set(key, JSON.stringify(newData), 'EX', 3600);
            }
          } catch (e) { /* ignore parse errors */ }
        }
      }
      // Remove manual rPush to post comments cache to avoid duplicates
      // const postCommentsKey = `post:comments:${postId}`;
      // await redisClient.rPush(postCommentsKey, JSON.stringify(savedComment));
      // await redisClient.expire(postCommentsKey, 3600);
    })();

    // Notify all clients about the new comment
    notifyAllClients('newComment', { postId, comment: savedComment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Fetch comments by postId with pagination
router.get('/comments-by-post/:postId', async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 10, currentUserId } = req.query;

  if (!currentUserId) {
    return res.status(400).json({ error: 'currentUserId is required in query parameters' });
  }

  try {
    // Try to get comments from Redis first
    let redisComments = await RedisPostService.getPostComments(postId, page, limit);

    // Only return Redis response if it has comments data (non-empty array)
    if (Array.isArray(redisComments) && redisComments.length > 0) {
      // Show latest comment first (reverse the array)
      redisComments = redisComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Get likes info for each comment
      const commentIds = redisComments.map(c => c._id);
      const [likeCounts, userLikes] = await Promise.all([
        Promise.all(commentIds.map(cid => RedisPostService.getCommentLikesCount(cid))),
        currentUserId ? Promise.all(commentIds.map(cid => RedisPostService.hasUserLikedComment(currentUserId, cid))) : []
      ]);

      // Format comments with likes and CDN URLs
      const formattedComments = redisComments.map((comment, index) => ({
        ...comment,
        likesCount: likeCounts[index] || 0,
        isLiked: userLikes[index] || false,
        profilepic: comment.profilepic && typeof comment.profilepic === 'string'
          ? comment.profilepic.replace(S3_URL, CDN_URL)
          : comment.profilepic
      }));

      return res.status(200).json({
        message: 'Comments fetched successfully from Redis',
        comments: formattedComments,
        source: 'redis'
      });
    }

    const offset = (page - 1) * limit;

    const aggregatePipeline = [
      { $match: { postId: new mongoose.Types.ObjectId(postId) } },
      { $sort: { timestamp: -1 } },
      { $skip: offset },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'likeoncomments', // Changed to use LikeOnComment collection
          let: { commentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { 
                  $and: [
                    { $eq: ['$commentId', '$$commentId'] },
                    { $eq: ['$userId', new mongoose.Types.ObjectId(currentUserId)] }
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
          from: 'likeoncomments', // Changed to use LikeOnComment collection
          let: { commentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$commentId', '$$commentId'] }
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
        $addFields: {
          likesCount: {
            $ifNull: [{ $arrayElemAt: ['$likesInfo.count', 0] }, 0]
          },
          isLiked: {
            $cond: {
              if: { $gt: [{ $ifNull: [{ $size: '$userLike' }, 0] }, 0] },
              then: true,
              else: false
            }
          }
        }
      },
      {
        $project: {
          content: 1,
          userId: 1,
          profilename: 1,
          uniqueName: 1,
          profilepic: 1,
          timestamp: 1,
          likesCount: 1,
          isLiked: 1,
          _id: 1
        }
      }
    ];

    let comments = await Comment.aggregate(aggregatePipeline);

    // Replace S3 URLs with CDN for profilepic only
    comments = comments.map(comment => ({
      ...comment,
      profilepic: comment.profilepic && typeof comment.profilepic === 'string'
        ? comment.profilepic.replace(S3_URL, CDN_URL)
        : comment.profilepic
    }));

    // Ensure latest comment first (sort by timestamp descending)
    comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Store fetched comments in Redis for future requests
    await RedisPostService.setPostComments(postId, comments, page, limit);

    res.status(200).json({ 
      message: 'Comments fetched successfully', 
      comments,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Fetch total number of comments for a post
router.get('/comment-count/:postId', async (req, res) => {
  const { postId } = req.params;

  try {
    const commentCount = await Comment.countDocuments({ postId }).lean();

    res.status(200).json({ message: 'Total comments count fetched successfully', commentCount });
  } catch (error) {
    console.error('Error fetching comment count:', error);
    res.status(500).json({ error: 'Failed to fetch comment count' });
  }
});

// Fetch comments by userId with pagination
router.get('/comments-by-user/:userId', async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.query.currentUserId || req.query.currentuserId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    // Try to get from Redis first
    const cachedData = await RedisPostService.getUserComments(userId, page, limit);

    if (cachedData !== null && cachedData !== undefined) {
      // Always update likesCount, isLiked, isSaved from Redis for each post and comment
      const postsWithRealtime = await Promise.all(
        cachedData.posts.map(async item => {
          if (!item.post) return item;
          const postId = item.post._id?.toString();
          // Fetch real-time values from Redis for post
          const [
            likesCount,
            isLiked,
            isSaved,
            commentsCount
          ] = currentUserId && postId
            ? await Promise.all([
                RedisPostService.getPostLikesCount(postId),
                RedisPostService.hasUserLikedPost(currentUserId, postId),
                RedisPostService.hasUserSavedPost(currentUserId, postId),
                RedisPostService.getPostCommentsCount(postId)
              ])
            : [item.post.likesCount, false, false, item.post.commentsCount];

          // Fetch real-time values from Redis for each comment
          const commentsWithRealtime = item.comments
            ? await Promise.all(item.comments.map(async comment => {
                const commentId = comment._id?.toString();
                const [commentLikesCount, commentIsLiked] = currentUserId && commentId
                  ? await Promise.all([
                      RedisPostService.getCommentLikesCount(commentId),
                      RedisPostService.hasUserLikedComment(currentUserId, commentId)
                    ])
                  : [comment.likesCount, false];
                return {
                  ...comment,
                  likesCount: commentLikesCount || 0,
                  isLiked: !!commentIsLiked,
                  profilepic: comment.profilepic && typeof comment.profilepic === 'string'
                    ? comment.profilepic.replace(S3_URL, CDN_URL)
                    : comment.profilepic
                };
              }))
            : [];

          return {
            post: {
              ...item.post,
              likesCount: likesCount || 0,
              isLiked: !!isLiked,
              isSaved: !!isSaved,
              commentsCount: commentsCount || 0,
              images: Array.isArray(item.post.images)
                ? item.post.images.map(img =>
                    img.replace(S3_URL, CDN_URL)
                  )
                : item.post.images,
              profilepic: item.post.profilepic && typeof item.post.profilepic === 'string'
                ? item.post.profilepic.replace(S3_URL, CDN_URL)
                : item.post.profilepic
            },
            comments: commentsWithRealtime
          };
        })
      );

      const totalPages = Math.ceil((cachedData.totalPosts || 0) / limit);
      const hasMore = page < totalPages;
      return res.status(200).json({
        message: 'User posts with comments fetched successfully from cache',
        posts: postsWithRealtime,
        totalPosts: cachedData.totalPosts,
        totalPages,
        currentPage: page,
        limit,
        hasMore,
        source: 'redis'
      });
    }

    // Always fetch from DB first
    // Get all comments by user, sorted by timestamp descending
    const allComments = await Comment.find({ userId })
      .sort({ timestamp: -1 })
      .lean();

    // Group comments by postId
    const commentsByPost = {};
    for (const comment of allComments) {
      const postIdStr = comment.postId?.toString();
      if (!commentsByPost[postIdStr]) {
        commentsByPost[postIdStr] = [];
      }
      commentsByPost[postIdStr].push(comment);
    }

    // Paginate posts (not comments)
    const allPostIdStrings = Object.keys(commentsByPost);
    const totalPosts = allPostIdStrings.length;
    const postIdStrings = allPostIdStrings
      .slice((page - 1) * limit, (page - 1) * limit + limit);
    const postIds = postIdStrings.map(id => new mongoose.Types.ObjectId(id));

    // Fetch post info
    const posts = await Post.find({ _id: { $in: postIds } }).lean();
    const postsMap = posts.reduce((acc, post) => {
      acc[post._id.toString()] = post;
      return acc;
    }, {});

    // Gather all commentIds for likes lookup
    const allCommentIds = postIdStrings.flatMap(pid => commentsByPost[pid].map(c => c._id));

    // Likes count for each comment
    const commentLikes = await LikeOnComment.aggregate([
      { $match: { commentId: { $in: allCommentIds } } },
      { $group: { _id: '$commentId', count: { $sum: 1 } } }
    ]);
    const commentLikesMap = commentLikes.reduce((acc, like) => {
      acc[like._id.toString()] = like.count;
      return acc;
    }, {});

    // isLiked for each comment
    let userLikesMap = {};
    if (currentUserId) {
      const userLikes = await LikeOnComment.find({ commentId: { $in: allCommentIds }, userId: currentUserId }).lean();
      userLikesMap = userLikes.reduce((acc, like) => {
        acc[like.commentId.toString()] = true;
        return acc;
      }, {});
    }

    // Comments count for each post
    const postCommentsCountArr = await Comment.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } }
    ]);
    const postCommentsCountMap = postCommentsCountArr.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    // Likes count for each post
    const postLikesArr = await LikeOnPost.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } }
    ]);
    const postLikesMap = postLikesArr.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    // isLiked for each post
    let postUserLikesMap = {};
    if (currentUserId) {
      const postUserLikes = await LikeOnPost.find({ postId: { $in: postIds }, userId: currentUserId }).lean();
      postUserLikesMap = postUserLikes.reduce((acc, like) => {
        acc[like.postId.toString()] = true;
        return acc;
      }, {});
    }

    // isSaved for each post
    let savedPostsSet = new Set();
    if (currentUserId) {
      const savedPosts = await SavedPost.find({ userId: currentUserId, postId: { $in: postIds } }).lean();
      savedPostsSet = new Set(savedPosts.map(sp => sp.postId.toString()));
    }

    // Build response: one entry per post, with comments under it
    // --- Update likesCount, isLiked, isSaved from Redis for each post and comment ---
    const postsWithComments = await Promise.all(postIdStrings.map(async postIdStr => {
      const post = postsMap[postIdStr] || null;
      // Fetch real-time values from Redis for post
      let likesCount = postLikesMap[postIdStr] || 0;
      let isLiked = !!postUserLikesMap[postIdStr];
      let isSaved = savedPostsSet.has(postIdStr);
      if (post) {
        const [
          redisLikesCount,
          redisIsLiked,
          redisIsSaved
        ] = currentUserId
          ? await Promise.all([
              RedisPostService.getPostLikesCount(postIdStr),
              RedisPostService.hasUserLikedPost(currentUserId, postIdStr),
              RedisPostService.hasUserSavedPost(currentUserId, postIdStr)
            ])
          : [likesCount, isLiked, isSaved];
        likesCount = redisLikesCount || 0;
        isLiked = !!redisIsLiked;
        isSaved = !!redisIsSaved;
      }

      // Fetch real-time values from Redis for each comment
      const comments = await Promise.all(
        (commentsByPost[postIdStr] || []).map(async comment => {
          const commentId = comment._id?.toString();
          const [commentLikesCount, commentIsLiked] = currentUserId && commentId
            ? await Promise.all([
                RedisPostService.getCommentLikesCount(commentId),
                RedisPostService.hasUserLikedComment(currentUserId, commentId)
              ])
            : [commentLikesMap[comment._id.toString()] || 0, !!userLikesMap[comment._id.toString()]];
          return {
            ...comment,
            likesCount: commentLikesCount || 0,
            isLiked: !!commentIsLiked,
            profilepic: comment.profilepic && typeof comment.profilepic === 'string'
              ? comment.profilepic.replace(S3_URL, CDN_URL)
              : comment.profilepic
          };
        })
      );

      let postProfilepic = post && post.profilepic && typeof post.profilepic === 'string'
        ? post.profilepic.replace(S3_URL, CDN_URL)
        : (post ? post.profilepic : undefined);

      return {
        post: post
          ? {
              ...post,
              images: Array.isArray(post.images)
                ? post.images.map(img =>
                    img.replace(S3_URL, CDN_URL)
                  )
                : post.images,
              profilepic: postProfilepic,
              commentsCount: postCommentsCountMap[postIdStr] || 0,
              likesCount,
              isLiked,
              isSaved
            }
          : null,
        comments
      };
    }));

    // Store in Redis for future requests with proper structure and pagination info
    const dataToCache = {
      posts: postsWithComments.map(item => ({
        post: item.post ? {
          ...item.post,
          images: Array.isArray(item.post.images)
            ? item.post.images.map(img => img.replace(S3_URL, CDN_URL))
            : item.post.images,
          profilepic: item.post.profilepic && typeof item.post.profilepic === 'string'
            ? item.post.profilepic.replace(S3_URL, CDN_URL)
            : item.post.profilepic
        } : null,
        comments: (item.comments || []).map(comment => ({
          ...comment,
          profilepic: comment.profilepic && typeof comment.profilepic === 'string'
            ? comment.profilepic.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
            : comment.profilepic
        }))
      })),
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page,
      limit,
      hasMore: page < Math.ceil(totalPosts / limit)
    };
    await RedisPostService.setUserComments(userId, dataToCache, page, limit);

    return res.status(200).json({
      message: 'User posts with their comments, likes, and comments count fetched successfully',
      posts: postsWithComments,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page,
      limit,
      hasMore: page < Math.ceil(totalPosts / limit),
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching user comments:', error);
    res.status(500).json({ error: 'Failed to fetch user comments' });
  }
});

// Delete a comment by commentId (only owner can delete)
router.delete('/delete/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required in request body' });
    }

  try {
    // Check Redis first
    // Note: RedisPostService.getComment now expects (commentId, postId)
    // But here we don't have postId, so fallback to DB if not found
    let comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this comment' });
    }

    const postId = comment.postId.toString();

    // Delete from Redis first as primary storage
    const redisResult = await RedisPostService.deleteComment(userId, commentId);
    if (!redisResult) {
      return res.status(500).json({ error: 'Failed to delete comment from Redis' });
    }

    // Decrement comment count in Redis
    await RedisPostService.decrementPostCommentCount(postId);

    // Real-time update: Update user comments cache for all paginations
    const userCommentsKeys = await redisClient.keys(`user:${userId}:comments:*`);
    for (const key of userCommentsKeys) {
      const cached = await redisClient.get(key);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          // Remove the comment from all relevant posts
          let changed = false;
          const postsArr = data.posts.map(item => {
            if (item.post && item.post._id?.toString() === postId.toString()) {
              const filteredComments = (item.comments || []).filter(c => c._id?.toString() !== commentId.toString());
              if (filteredComments.length !== (item.comments || []).length) changed = true;
              return { ...item, comments: filteredComments };
            }
            return item;
          });
          if (changed) {
            const newData = { ...data, posts: postsArr };
            await redisClient.set(key, JSON.stringify(newData), 'EX', 3600);
          }
        } catch (e) { /* ignore parse errors */ }
      }
    }

    // Cascade delete likes on this comment in MongoDB
    await Promise.all([
      LikeOnComment.deleteMany({ commentId }),
      Comment.findByIdAndDelete(commentId)
    ]);

    // Notify all clients about the deleted comment
    notifyAllClients('comments', { type: 'delete', commentId, userId });

    res.status(200).json({ message: 'Comment and related likes deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment and related likes' });
  }
});

module.exports = router;
