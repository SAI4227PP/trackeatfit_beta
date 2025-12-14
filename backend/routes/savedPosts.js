const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SavedPost = mongoose.model('SavedPost', require('../models/SavedPost').schema);
const Post = require('../models/Post');
const Following = require('../models/Following');
const { notifyAllClients } = require('../middleware/sseMiddleware');
const RedisPostService = require('../utils/postRedisService');

// Save a post
router.post('/save', async (req, res) => {
    try {
        const { userId, postId } = req.body;

        if (!userId || !postId) {
            return res.status(400).json({ message: 'User ID and Post ID are required' });
        }

        // Validate that the post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

                // Update Redis first
        await RedisPostService.savePost(userId, postId);

        // Create new saved post
        const savedPost = new SavedPost({
            userId,
            postId,
            savedAt: new Date()
        });
        
        try {
            await savedPost.save();

            // Notify all clients about the save action, with CDN image URLs
            const CDN_URL = 'https://cdn.trackeatfit.xyz';
            const postWithCdn = {
                ...post.toObject(),
                images: Array.isArray(post.images)
                    ? post.images.map(img =>
                        img.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
                    )
                    : post.images
            };
            notifyAllClients('savedPosts', { 
                type: 'save',
                postId: postId,
                userId: userId,
                timestamp: new Date().toISOString(),
                action: 'saved',
                post: postWithCdn
            });

            // Get the saved post details including the post data
            const populatedSavedPost = await SavedPost.findById(savedPost._id)
                .populate('postId', 'content images profilename uniqueName profilepic')
                .lean();

            res.status(201).json({
                message: 'Post saved successfully',
                savedPost: populatedSavedPost
            });

        } catch (error) {
            if (error.code === 11000) { // Duplicate key error
                const existingSave = await SavedPost.findOne({ userId, postId })
                    .populate('postId', 'content images profilename uniqueName profilepic')
                    .lean();
                
                return res.status(200).json({ 
                    message: 'Post is already saved',
                    savedPost: existingSave,
                    alreadySaved: true
                });
            }
            console.error('Error saving post:', error);
            res.status(500).json({ message: 'Error saving post', error: error.message });
        }
    } catch (error) {
        console.error('Error validating post:', error);
        res.status(500).json({ message: 'Error validating post', error: error.message });
    }
});

// Unsave a post
router.delete('/unsave', async (req, res) => {
    try {
        const { userId, postId } = req.body;

        if (!userId || !postId) {
            return res.status(400).json({ message: 'User ID and Post ID are required' });
        }

        // Update Redis first
    await RedisPostService.unsavePost(userId, postId);
    
    const result = await SavedPost.findOneAndDelete({ userId, postId });
    if (!result) {
        return res.status(404).json({ message: 'Saved post not found' });
    }

        // Notify all clients about the unsave action, with CDN image URLs
        const post = await Post.findById(postId);
        const CDN_URL = 'https://cdn.trackeatfit.xyz';
        const postWithCdn = post ? {
            ...post.toObject(),
            images: Array.isArray(post.images)
                ? post.images.map(img =>
                    img.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
                )
                : post.images
        } : undefined;
        notifyAllClients('savedPosts', { 
            type: 'unsave',
            postId: postId,
            userId: userId,
            timestamp: new Date().toISOString(),
            action: 'unsaved',
            post: postWithCdn
        });

        res.json({ message: 'Post unsaved successfully' });

    } catch (error) {
        console.error('Error unsaving post:', error);
        res.status(500).json({ message: 'Error unsaving post', error: error.message });
    }
});

// Get all saved posts for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.query.currentUserId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const aggregatePipeline = [
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $sort: { savedAt: -1 } },
            { $skip: skip },
            { $limit: limit },
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
                        {
                            $match: {
                                $expr: { $eq: ['$postId', '$$postId'] }
                            }
                        },
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
                        {
                            $match: {
                                $expr: { $eq: ['$postId', '$$postId'] }
                            }
                        },
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
                    likesCount: {
                        $ifNull: [{ $arrayElemAt: ['$likesInfo.count', 0] }, 0]
                    },
                    commentsCount: {
                        $ifNull: [{ $arrayElemAt: ['$commentsInfo.count', 0] }, 0]
                    },
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
                    isSaved: { $literal: true },
                    savedAt: 1,
                    createdAt: '$post.timestamp'
                }
            }
        ];
        let [posts, total] = await Promise.all([
            SavedPost.aggregate(aggregatePipeline),
            SavedPost.countDocuments({ userId })
        ]);

        // Replace S3 URLs with CDN in images for each post
        const CDN_URL = 'https://cdn.trackeatfit.xyz';
        posts = posts.map(post => ({
            _id: post._id,
            content: post.content,
            images: Array.isArray(post.images)
                ? post.images.map(img =>
                    img.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
                )
                : post.images,
            userId: post.userId,
            profilename: post.profilename,
            uniqueName: post.uniqueName,
            profilepic: post.profilepic,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            isLiked: post.isLiked,
            isFollowing: post.isFollowing,
            isSaved: post.isSaved,
            savedAt: post.savedAt,
            createdAt: post.createdAt
        }));

        // Try to get posts from Redis first
        const redisPosts = await RedisPostService.getUserSavedPosts(userId);
        
        if (redisPosts && redisPosts.length > 0) {
            // If we have data in Redis, return it
            res.json({
                posts,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + posts.length < total,
                source: 'redis'
            });
        } else {
            // If not in Redis, we're returning from MongoDB
            res.json({
                posts,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + posts.length < total,
                source: 'database'
            });
        }

    } catch (error) {
        console.error('Error fetching saved posts:', error);
        res.status(500).json({ message: 'Error fetching saved posts', error: error.message });
    }
});

    // Check if a post is saved by user
router.get('/check/:userId/:postId', async (req, res) => {
    try {
        const { userId, postId } = req.params;
        
        // Check Redis first
        const isSaved = await RedisPostService.hasUserSavedPost(userId, postId);
        if (isSaved !== null) {
            res.json({ isSaved });
            return;
        }
        
        // Fallback to MongoDB
        const savedPost = await SavedPost.findOne({ userId, postId });
        res.json({ isSaved: !!savedPost });

    } catch (error) {
        console.error('Error checking saved status:', error);
        res.status(500).json({ message: 'Error checking saved status', error: error.message });
    }
});module.exports = router;
