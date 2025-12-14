// postRedisService.js
const { client: redisClient } = require('../config/redis');
const { handleEntityAction, readEntityFromRedis } = require('./redisEntityService');

// Constants
const POST_TTL = 3600; // 1 hour cache TTL
const POST_KEY_PREFIX = 'post:';
const POST_LIKES_PREFIX = 'post:likes:';
const POST_SAVES_PREFIX = 'post:saves:';
const POST_COMMENTS_PREFIX = 'post:comments:';
const COMMENT_LIKES_PREFIX = 'comment:likes:';

/**
 * Base Redis operations with error handling
 */
class RedisPostService {
    /**
     * Get post comments count
     * @param {string} postId
     * @returns {Promise<number>}
     */
    static async getPostCommentsCount(postId) {
        try {
            // Use Redis LLEN to get the number of comments for the post
            return await redisClient.lLen(`${POST_COMMENTS_PREFIX}${postId}`);
        } catch (error) {
            console.error('Redis getPostCommentsCount error:', error);
            return 0;
        }
    }
    /**
     * Check and fix inconsistencies in user liked/saved posts caches
     * Removes post IDs from user liked/saved sets and data if the post no longer exists in Redis
     * Can be run periodically or on demand
     */
    static async fixUserPostCacheInconsistencies() {
        try {
            // Get all user liked posts data keys
            const likedPostsDataKeys = await redisClient.keys('user:*:liked_posts_data');
            for (const key of likedPostsDataKeys) {
                const userId = key.split(':')[1];
                const cachedData = await redisClient.get(key);
                if (cachedData) {
                    let posts;
                    try {
                        posts = JSON.parse(cachedData);
                    } catch { posts = []; }
                    if (Array.isArray(posts) && posts.length > 0) {
                        // Check which posts still exist
                        const validPosts = [];
                        for (const post of posts) {
                            const exists = await redisClient.exists(`${POST_KEY_PREFIX}${post._id}`);
                            if (exists) validPosts.push(post);
                        }
                        if (validPosts.length !== posts.length) {
                            await redisClient.set(key, JSON.stringify(validPosts), 'EX', POST_TTL);
                        }
                    }
                }
                // Also fix the liked_posts set
                const setKey = `user:${userId}:liked_posts`;
                const postIds = await redisClient.sMembers(setKey);
                if (postIds && postIds.length > 0) {
                    for (const postId of postIds) {
                        const exists = await redisClient.exists(`${POST_KEY_PREFIX}${postId}`);
                        if (!exists) {
                            await redisClient.sRem(setKey, postId);
                        }
                    }
                }
            }

            // Get all user saved posts sets
            const savedPostsKeys = await redisClient.keys(`${POST_SAVES_PREFIX}*`);
            for (const key of savedPostsKeys) {
                const userId = key.split(':')[2];
                const postIds = await redisClient.sMembers(key);
                if (postIds && postIds.length > 0) {
                    for (const postId of postIds) {
                        const exists = await redisClient.exists(`${POST_KEY_PREFIX}${postId}`);
                        if (!exists) {
                            await redisClient.sRem(key, postId);
                        }
                    }
                }
            }

            // --- Clean up user comments cache for deleted posts ---
            // const userCommentsKeys = await redisClient.keys('user:*:comments:*');
            // for (const key of userCommentsKeys) {
            //     const cached = await redisClient.get(key);
            //     if (cached) {
            //         try {
            //             const data = JSON.parse(cached);
            //             if (data && Array.isArray(data.posts) && data.posts.length > 0) {
            //                 let changed = false;
            //                 const filteredPosts = data.posts.filter(item => {
            //                     if (!item.post || !item.post._id) return false;
            //                     // If post is missing in Redis, remove it
            //                     return true;
            //                 });
            //                 // Now check which posts still exist in Redis
            //                 const validPosts = [];
            //                 for (const item of filteredPosts) {
            //                     const exists = await redisClient.exists(`${POST_KEY_PREFIX}${item.post._id}`);
            //                     if (exists) {
            //                         validPosts.push(item);
            //                     } else {
            //                         changed = true;
            //                     }
            //                 }
            //                 if (changed || validPosts.length !== data.posts.length) {
            //                     const newData = { ...data, posts: validPosts };
            //                     await redisClient.set(key, JSON.stringify(newData), 'EX', POST_TTL);
            //                 }
            //             }
            //         } catch (e) {
            //             // fallback: just delete the key if parse fails
            //             await redisClient.del(key);
            //         }
            //     }
            // }

            return true;
        } catch (error) {
            console.error('Error fixing user post cache inconsistencies:', error);
            return false;
        }
    }
    /**
     * Like a post
     * @param {string} userId 
     * @param {string} postId 
     */
    static async likePost(userId, postId) {
        const multi = redisClient.multi();
        try {
            const postLikesKey = `${POST_LIKES_PREFIX}${postId}`;
            const userLikedPostsKey = `user:${userId}:liked_posts`;
            const userLikedPostsDataKey = `user:${userId}:liked_posts_data`;

            // Add to both Redis sets
            multi.sAdd(postLikesKey, userId);
            multi.sAdd(userLikedPostsKey, postId);
            // Increment likes counter
            multi.hIncrBy(`${POST_KEY_PREFIX}${postId}`, 'likesCount', 1);
            
            await multi.exec();

            // Set TTL for the user's liked posts set
            await redisClient.expire(userLikedPostsKey, POST_TTL);
            await redisClient.expire(postLikesKey, POST_TTL);

            // Update both the general posts list and user's liked posts list
            const [allPosts, likedPosts] = await Promise.all([
                this.getAllPosts(1, 10),
                this.getUserLikedPosts(userId)
            ]);

            // Update general posts list
            if (allPosts) {
                const updatedPosts = allPosts.map(post => {
                    if (post._id.toString() === postId.toString()) {
                        return {
                            ...post,
                            likesCount: (parseInt(post.likesCount) || 0) + 1,
                            isLiked: true
                        };
                    }
                    return post;
                });
                await this.setAllPosts(updatedPosts, 1, 10);
            }

            // Update liked posts list
            if (Array.isArray(likedPosts)) {
                // Check if post is already in the list
                const existingPostIndex = likedPosts.findIndex(post => 
                    post._id.toString() === postId.toString()
                );

                if (existingPostIndex === -1) {
                    // If post doesn't exist in liked posts, add it
                    const post = allPosts?.find(p => p._id.toString() === postId.toString());
                    if (post) {
                        const updatedPost = {
                            ...post,
                            likesCount: (parseInt(post.likesCount) || 0) + 1,
                            isLiked: true,
                            likedAt: new Date().toISOString()
                        };
                        likedPosts.unshift(updatedPost);
                        await this.setUserLikedPosts(userId, likedPosts);
                    }
                } else {
                    // If post exists, update its likes count
                    likedPosts[existingPostIndex] = {
                        ...likedPosts[existingPostIndex],
                        likesCount: (parseInt(likedPosts[existingPostIndex].likesCount) || 0) + 1,
                        isLiked: true
                    };
                    await this.setUserLikedPosts(userId, likedPosts);
                }
            }

            // Log action for MongoDB sync
            await handleEntityAction({
                entityType: 'like',
                action: 'create',
                userId,
                payload: { userId, postId }
            });

            return true;
        } catch (error) {
            console.error('Redis likePost error:', error);
            return false;
        }
    }

    /**
     * Unlike a post
     * @param {string} userId 
     * @param {string} postId 
     */
    static async unlikePost(userId, postId) {
        const multi = redisClient.multi();
        try {
            const postLikesKey = `${POST_LIKES_PREFIX}${postId}`;
            const userLikedPostsKey = `user:${userId}:liked_posts`;
            const userLikedPostsDataKey = `user:${userId}:liked_posts_data`;

            // Remove from Redis sets
            multi.sRem(postLikesKey, userId);
            multi.sRem(userLikedPostsKey, postId);
            // Decrement likes counter
            multi.hIncrBy(`${POST_KEY_PREFIX}${postId}`, 'likesCount', -1);
            
            await multi.exec();

            // Update both the general posts list and user's liked posts list
            const [allPosts, likedPosts] = await Promise.all([
                this.getAllPosts(1, 10),
                this.getUserLikedPosts(userId)
            ]);

            // Update general posts list
            if (allPosts) {
                const updatedPosts = allPosts.map(post => {
                    if (post._id.toString() === postId.toString()) {
                        return {
                            ...post,
                            likesCount: Math.max((parseInt(post.likesCount) || 0) - 1, 0),
                            isLiked: false
                        };
                    }
                    return post;
                });
                await this.setAllPosts(updatedPosts, 1, 10);
            }

            // Update liked posts list
            if (Array.isArray(likedPosts)) {
                // Remove the unliked post from the list
                const updatedLikedPosts = likedPosts.filter(post => 
                    post._id.toString() !== postId.toString()
                );
                await this.setUserLikedPosts(userId, updatedLikedPosts);
            }

            // Log action for MongoDB sync
            await handleEntityAction({
                entityType: 'like',
                action: 'delete',
                userId,
                payload: { userId, postId }
            });

            return true;
        } catch (error) {
            console.error('Redis unlikePost error:', error);
            return false;
        }
    }

    /**
     * Save a post
     * @param {string} userId 
     * @param {string} postId 
     */
    static async savePost(userId, postId) {
        try {
            // Add to Redis set of saved posts
            await redisClient.sAdd(`${POST_SAVES_PREFIX}${userId}`, postId);

            // Update the post in all cached lists
            const [allPosts, likedPosts] = await Promise.all([
                this.getAllPosts(1, 10),
                this.getUserLikedPosts(userId)
            ]);

            // Update general posts list
            if (allPosts) {
                const updatedPosts = allPosts.map(post => {
                    if (post._id === postId) {
                        return {
                            ...post,
                            isSaved: true
                        };
                    }
                    return post;
                });
                await this.setAllPosts(updatedPosts, 1, 10);
            }

            // Update liked posts list if it exists
            if (likedPosts && Array.isArray(likedPosts)) {
                const updatedLikedPosts = likedPosts.map(post => {
                    if (post._id.toString() === postId.toString()) {
                        return {
                            ...post,
                            isSaved: true
                        };
                    }
                    return post;
                });
                await this.setUserLikedPosts(userId, updatedLikedPosts);
            }

            // Log action for MongoDB sync
            await handleEntityAction({
                entityType: 'savedpost',
                action: 'create',
                userId,
                payload: { userId, postId }
            });

            return true;
        } catch (error) {
            console.error('Redis savePost error:', error);
            return false;
        }
    }

    /**
     * Unsave a post
     * @param {string} userId 
     * @param {string} postId 
     */
    static async unsavePost(userId, postId) {
        try {
            // Remove from Redis set of saved posts
            await redisClient.sRem(`${POST_SAVES_PREFIX}${userId}`, postId);

            // Update the post in all cached lists
            const [allPosts, likedPosts] = await Promise.all([
                this.getAllPosts(1, 10),
                this.getUserLikedPosts(userId)
            ]);

            // Update general posts list
            if (allPosts) {
                const updatedPosts = allPosts.map(post => {
                    if (post._id === postId) {
                        return {
                            ...post,
                            isSaved: false
                        };
                    }
                    return post;
                });
                await this.setAllPosts(updatedPosts, 1, 10);
            }

            // Update liked posts list if it exists
            if (likedPosts && Array.isArray(likedPosts)) {
                const updatedLikedPosts = likedPosts.map(post => {
                    if (post._id.toString() === postId.toString()) {
                        return {
                            ...post,
                            isSaved: false
                        };
                    }
                    return post;
                });
                await this.setUserLikedPosts(userId, updatedLikedPosts);
            }

            // Log action for MongoDB sync
            await handleEntityAction({
                entityType: 'savedpost',
                action: 'delete',
                userId,
                payload: { userId, postId }
            });

            return true;
        } catch (error) {
            console.error('Redis unsavePost error:', error);
            return false;
        }
    }

    /**
     * Add a comment to a post
     * @param {string} userId 
     * @param {string} postId 
     * @param {Object} commentData 
     */
    static async addComment(userId, postId, commentData) {
        const multi = redisClient.multi();
        try {
            const commentKey = `${POST_COMMENTS_PREFIX}${postId}`;
            
            // Add comment to Redis list
            multi.rPush(commentKey, JSON.stringify({
                ...commentData,
                userId,
                timestamp: new Date().toISOString()
            }));
            
            // Increment comments counter
            multi.hIncrBy(`${POST_KEY_PREFIX}${postId}`, 'commentsCount', 1);
            
            await multi.exec();

            // Update comment count in all cached lists
            await this.updateCommentCountInLists(postId, 1);

            // Log action for MongoDB sync
            await handleEntityAction({
                entityType: 'comment',
                action: 'create',
                userId,
                payload: { ...commentData, postId, userId }
            });

            return true;
        } catch (error) {
            console.error('Redis addComment error:', error);
            return false;
        }
    }

    /**
     * Delete a comment from a post
     * @param {string} userId 
     * @param {string} commentId 
     */
    static async deleteComment(userId, commentId) {
        const multi = redisClient.multi();
        try {
            // Find the comment in Redis
            const keys = await redisClient.keys(`${POST_COMMENTS_PREFIX}*`);
            let postId = null; // Store the postId associated with the comment
            for (const key of keys) {
                // Check if the key is a list before calling lRem
                const keyType = await redisClient.type(key);
                if (keyType !== 'list') continue;
                const comments = await redisClient.lRange(key, 0, -1);
                for (const comment of comments) {
                    const parsedComment = JSON.parse(comment);
                    if (parsedComment._id === commentId) {
                        postId = key.replace(POST_COMMENTS_PREFIX, ''); // Extract postId
                        multi.lRem(key, 0, comment); // Remove the comment from the list
                        break;
                    }
                }
                if (postId) break; // Exit loop once the comment is found
            }

            if (!postId) {
                console.warn(`Comment with ID ${commentId} not found in Redis.`);
                return false;
            }

            // Decrement the comment count for the post
            const commentCountKey = `${POST_KEY_PREFIX}${postId}`;
            multi.hIncrBy(commentCountKey, 'commentsCount', -1);

            // Delete the Redis set for likes on this comment
            const commentLikesKey = `${COMMENT_LIKES_PREFIX}${commentId}`;
            multi.del(commentLikesKey);

            // Log action for MongoDB sync
            await handleEntityAction({
                entityType: 'comment',
                action: 'delete',
                userId,
                payload: { commentId, postId }
            });

            await multi.exec();
            return true;
        } catch (error) {
            console.error('Redis deleteComment error:', error);
            return false;
        }
    }

    /**
     * Update comment count in all cached lists (posts, saved posts, liked posts)
     * @param {string} postId 
     * @param {number} delta - Increment or decrement value
     */
    static async updateCommentCountInLists(postId, delta) {
        try {
            if (!postId) {
                console.error('updateCommentCountInLists error: postId is null or undefined');
                return;
            }
            // Update general posts list
            const allPosts = await this.getAllPosts(1, 10);
            if (allPosts) {
                const updatedPosts = allPosts.map(post => {
                    if (post._id?.toString() === postId.toString()) {
                        return {
                            ...post,
                            commentsCount: Math.max((parseInt(post.commentsCount) || 0) + delta, 0)
                        };
                    }
                    return post;
                });
                await this.setAllPosts(updatedPosts, 1, 10);
            }

            // Update saved posts for all users
            const savedPostsKeys = await redisClient.keys(`${POST_SAVES_PREFIX}*`);
            for (const key of savedPostsKeys) {
                const userId = key.split(':')[2];
                const savedPosts = await this.getUserSavedPosts(userId);
                if (savedPosts) {
                    const updatedSavedPosts = savedPosts.map(post => {
                        if (post._id?.toString() === postId.toString()) {
                            return {
                                ...post,
                                commentsCount: Math.max((parseInt(post.commentsCount) || 0) + delta, 0)
                            };
                        }
                        return post;
                    });
                    if (typeof this.setUserSavedPosts === 'function') {
                        await this.setUserSavedPosts(userId, updatedSavedPosts);
                    } else {
                        console.error('setUserSavedPosts is not a function');
                    }
                }
            }

            // Update liked posts for all users
            const likedPostsKeys = await redisClient.keys(`user:*:liked_posts_data`);
            for (const key of likedPostsKeys) {
                const userId = key.split(':')[1];
                const likedPosts = await this.getUserLikedPosts(userId);
                if (likedPosts) {
                    const updatedLikedPosts = likedPosts.map(post => {
                        if (post._id?.toString() === postId.toString()) {
                            return {
                                ...post,
                                commentsCount: Math.max((parseInt(post.commentsCount) || 0) + delta, 0)
                            };
                        }
                        return post;
                    });
                    await this.setUserLikedPosts(userId, updatedLikedPosts);
                }
            }
        } catch (error) {
            console.error('Redis updateCommentCountInLists error:', error);
        }
    }

    /**
     * Get a post by ID
     * @param {string} postId
     * @param {string} [userId] - Optional user ID to check if the user liked or saved the post
     * @returns {Promise<Object>} The post data or null
     */
    static async getPost(postId, userId) {
        try {
            const post = await redisClient.hGetAll(`${POST_KEY_PREFIX}${postId}`);
            if (!Object.keys(post).length) {
                return null;
            }

            // Always get isLiked and isSaved from Redis sets for the user, not from stored post fields
            let isLiked = false;
            let isSaved = false;
            if (userId) {
                isLiked = await this.hasUserLikedPost(userId, postId);
                isSaved = await this.hasUserSavedPost(userId, postId);
            }

            // Parse and clean up fields
            let images = post.images;
            if (typeof images === 'string') {
                try {
                    images = JSON.parse(images);
                } catch {
                    images = [];
                }
            }
            const stripQuotes = v =>
                typeof v === 'string' && v.length > 1 && v.startsWith('"') && v.endsWith('"')
                    ? v.slice(1, -1)
                    : v;
            const parseNum = v => isNaN(Number(v)) ? 0 : Number(v);

            return {
                ...post,
                _id: stripQuotes(post._id),
                userId: stripQuotes(post.userId),
                content: post.content,
                profilename: post.profilename,
                uniqueName: post.uniqueName,
                profilepic: post.profilepic,
                timestamp: stripQuotes(post.timestamp),
                images,
                likesCount: parseNum(post.likesCount),
                commentsCount: parseNum(post.commentsCount),
                isLiked, // always from Redis set
                isFollowing: post.isFollowing === 'true' || post.isFollowing === true,
                isSaved // always from Redis set
            };
        } catch (error) {
            console.error('Redis getPost error:', error);
            return null;
        }
    }

    /**
     * Set a post in Redis
     * @param {string} postId 
     * @param {Object} postData 
     * @returns {Promise<boolean>}
     */
    static async setPost(postId, postData) {
        const multi = redisClient.multi();
        try {
            // Store all fields, including booleans and numbers, as strings (except arrays/objects)
            const processedData = Object.entries(postData).reduce((acc, [key, value]) => {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    acc[key] = JSON.stringify(value);
                } else if (Array.isArray(value)) {
                    acc[key] = JSON.stringify(value);
                } else {
                    acc[key] = String(value);
                }
                return acc;
            }, {});

            await redisClient.hSet(`${POST_KEY_PREFIX}${postId}`, processedData);
            await redisClient.expire(`${POST_KEY_PREFIX}${postId}`, POST_TTL);

            // Optionally, update likes/comments count as separate keys if needed
            if (postData.likesCount !== undefined) {
                await redisClient.set(`${POST_LIKES_PREFIX}${postId}:count`, postData.likesCount.toString());
            }
            if (postData.commentsCount !== undefined) {
                await redisClient.set(`${POST_COMMENTS_PREFIX}${postId}:count`, postData.commentsCount.toString());
            }

            return true;
        } catch (error) {
            console.error('Redis setPost error:', error);
            return false;
        }
    }

    /**
     * Update a post
     * @param {string} userId 
     * @param {string} postId 
     * @param {Object} postData 
     */
    static async updatePost(userId, postId, postData) {
        const multi = redisClient.multi();
        try {
            // Update post data
            await redisClient.hSet(`${POST_KEY_PREFIX}${postId}`, postData);

            // Log action for MongoDB sync
            await handleEntityAction({
                entityType: 'post',
                action: 'update',
                userId,
                payload: { _id: postId, ...postData }
            });

            // Invalidate caches
            await this.invalidatePostCache(postId);
            await redisClient.del('posts:all:*');

            return true;
        } catch (error) {
            console.error('Redis updatePost error:', error);
            throw error;
        }
    }

    /**
     * Delete a post
     * @param {string} userId 
     * @param {string} postId 
     */
    static async deletePost(userId, postId) {
        const multi = redisClient.multi();
        // Invalidate user comments cache for all users who commented on this post
        try {
            // Get all userIds who commented on this post
            const Comment = require('../models/CommentSchema');
            const comments = await Comment.find({ postId }, 'userId').lean();
            const userIds = [...new Set(comments.map(c => c.userId?.toString()).filter(Boolean))];
            for (const uid of userIds) {
                // Delete all user comments cache keys for this user (all pages/limits)
                const keys = await redisClient.keys(`user:${uid}:comments:*`);
                if (keys && keys.length > 0) {
                    await Promise.all(keys.map(async (key) => {
                        // Remove only posts that match the deleted postId from the cached data
                        const cached = await redisClient.get(key);
                        if (cached) {
                            try {
                                const data = JSON.parse(cached);
                                if (data && Array.isArray(data.posts)) {
                                    // Remove the post and its comments from the cache
                                    const filteredPosts = data.posts.filter(item => {
                                        // item.post may be null if post was deleted
                                        return item.post && item.post._id?.toString() !== postId.toString();
                                    });
                                    if (filteredPosts.length !== data.posts.length) {
                                        const newData = { ...data, posts: filteredPosts };
                                        await redisClient.set(key, JSON.stringify(newData), 'EX', POST_TTL);
                                    }
                                }
                            } catch (e) {
                                // fallback: just delete the key if parse fails
                                await redisClient.del(key);
                            }
                        }
                    }));
                }
            }
        } catch (e) {
            console.error('Error invalidating user comments cache for deleted post:', e);
        }
        // Remove the post from all users' liked posts sets and liked posts data
        const likedPostsKeys = await redisClient.keys('user:*:liked_posts');
        for (const key of likedPostsKeys) {
            multi.sRem(key, postId);
        }
        const likedPostsDataKeys = await redisClient.keys('user:*:liked_posts_data');
        for (const key of likedPostsDataKeys) {
            // Remove the post from the cached liked posts data array
            const cachedData = await redisClient.get(key);
            if (cachedData) {
                try {
                    const posts = JSON.parse(cachedData);
                    if (Array.isArray(posts)) {
                        const updatedPosts = posts.filter(post => post._id !== postId && post._id?.toString() !== postId.toString());
                        await redisClient.set(key, JSON.stringify(updatedPosts), 'EX', POST_TTL);
                    }
                } catch (e) { /* ignore parse errors */ }
            }
        }
        try {
            // Delete post data
            multi.del(`${POST_KEY_PREFIX}${postId}`);
            multi.del(`${POST_LIKES_PREFIX}${postId}`);
            multi.del(`${POST_COMMENTS_PREFIX}${postId}`);

            // Delete all comment likes sets for this post
            const commentListKey = `${POST_COMMENTS_PREFIX}${postId}`;
            const comments = await redisClient.lRange(commentListKey, 0, -1);
            if (comments && comments.length > 0) {
                for (const comment of comments) {
                    try {
                        const parsedComment = JSON.parse(comment);
                        if (parsedComment && parsedComment._id) {
                            multi.del(`${COMMENT_LIKES_PREFIX}${parsedComment._id}`);
                        }
                    } catch (e) { /* ignore parse errors */ }
                }
            }

            // Remove the post from all users' saved posts sets
            const savedPostsKeys = await redisClient.keys(`${POST_SAVES_PREFIX}*`);
            for (const key of savedPostsKeys) {
                multi.sRem(key, postId);
            }

            // Remove from posts:all list
            const postsAll = await redisClient.lRange('posts:all', 0, -1);
            if (postsAll && postsAll.length > 0) {
                for (let i = 0; i < postsAll.length; i++) {
                    const post = JSON.parse(postsAll[i]);
                    if (post._id?.toString() === postId.toString()) {
                        multi.lRem('posts:all', 0, postsAll[i]);
                        break;
                    }
                }
            }

            // Remove from user's posts list
            const userPostsKey = `user:${userId}:posts`;
            const userPosts = await redisClient.lRange(userPostsKey, 0, -1);
            if (userPosts && userPosts.length > 0) {
                for (let i = 0; i < userPosts.length; i++) {
                    const post = JSON.parse(userPosts[i]);
                    if (post._id?.toString() === postId.toString()) {
                        multi.lRem(userPostsKey, 0, userPosts[i]);
                        break;
                    }
                }
            }

            await multi.exec();

            // Log action for MongoDB sync
            await handleEntityAction({
                entityType: 'post',
                action: 'delete',
                userId,
                payload: { _id: postId }
            });

            // Invalidate related caches
            await redisClient.del('posts:all:*');
            await redisClient.del(`user:${userId}:posts:*`);

            return true;
        } catch (error) {
            console.error('Redis deletePost error:', error);
            throw error;
        }
    }

    /**
     * Like a comment
     * @param {string} userId 
     * @param {string} postId 
     * @param {string} commentId 
     */
    static async likeComment(userId, postId, commentId) {
        try {
            // Add to Redis set of comment likes
            await redisClient.sAdd(`${COMMENT_LIKES_PREFIX}${commentId}`, userId);

            // Update isLiked in Redis
            await redisClient.hSet(`${POST_COMMENTS_PREFIX}${postId}:${commentId}`, 'isLiked', true);

            // Log action for MongoDB sync
            await handleEntityAction({
                entityType: 'likeoncomment',
                action: 'create',
                userId,
                payload: { userId, commentId, postId }
            });

            return true;
        } catch (error) {
            console.error('Redis likeComment error:', error);
            return false;
        }
    }

    /**
     * Unlike a comment
     * @param {string} userId 
     * @param {string} postId 
     * @param {string} commentId 
     */
    static async unlikeComment(userId, postId, commentId) {
        try {
            // Remove from Redis set of comment likes
            await redisClient.sRem(`${COMMENT_LIKES_PREFIX}${commentId}`, userId);

            // Update isLiked in Redis
            await redisClient.hSet(`${POST_COMMENTS_PREFIX}${postId}:${commentId}`, 'isLiked', false);

            // Log action for MongoDB sync
            await handleEntityAction({
                entityType: 'likeoncomment',
                action: 'delete',
                userId,
                payload: { userId, commentId, postId }
            });

            return true;
        } catch (error) {
            console.error('Redis unlikeComment error:', error);
            return false;
        }
    }

    /**
     * Get post likes count
     * @param {string} postId 
     */
    static async getPostLikesCount(postId) {
        try {
            const redisKey = `${POST_LIKES_PREFIX}${postId}`;
            const exists = await redisClient.exists(redisKey);
            if (exists) {
                return await redisClient.sCard(redisKey);
            } else {
                // Redis set does not exist, check DB and repopulate cache
                const Like = require('../models/Like');
                const likeDocs = await Like.find({ postId }).select('userId').lean();
                if (likeDocs && likeDocs.length > 0) {
                    const userIds = likeDocs.map(like => like.userId.toString());
                    await redisClient.sAdd(redisKey, ...userIds);
                    await redisClient.expire(redisKey, POST_TTL);
                    return userIds.length;
                } else {
                    return 0;
                }
            }
        } catch (error) {
            console.error('Redis getPostLikesCount error:', error);
            return 0;
        }
    }

    /**
     * Check if user liked post
     * @param {string} userId 
     * @param {string} postId 
     */
    static async hasUserLikedPost(userId, postId) {
        try {
            const redisKey = `${POST_LIKES_PREFIX}${postId}`;
            const exists = await redisClient.exists(redisKey);
            if (exists) {
                return await redisClient.sIsMember(redisKey, userId);
            } else {
                // Redis set does not exist, check DB and repopulate cache
                const Like = require('../models/Like');
                const likeDoc = await Like.findOne({ userId, postId }).lean();
                if (likeDoc) {
                    // Repopulate Redis set for this post
                    await redisClient.sAdd(redisKey, userId);
                    await redisClient.expire(redisKey, POST_TTL);
                    return true;
                } else {
                    return false;
                }
            }
        } catch (error) {
            console.error('Redis hasUserLikedPost error:', error);
            return false;
        }
    }

    /**
     * Get comment likes count
     * @param {string} commentId 
     */
    static async getCommentLikesCount(commentId) {
        try {
            return await redisClient.sCard(`${COMMENT_LIKES_PREFIX}${commentId}`);
        } catch (error) {
            console.error('Redis getCommentLikesCount error:', error);
            return 0;
        }
    }

    /**
     * Check if user liked comment
     * @param {string} userId 
     * @param {string} commentId 
     */
    static async hasUserLikedComment(userId, commentId) {
        try {
            return await redisClient.sIsMember(`${COMMENT_LIKES_PREFIX}${commentId}`, userId);
        } catch (error) {
            console.error('Redis hasUserLikedComment error:', error);
            return false;
        }
    }

    /**
     * Get user's liked posts
     * @param {string} userId 
     * @returns {Promise<string[]>} Array of post IDs that the user has liked
     */
    static async getUserLikedPosts(userId) {
        try {
            // Check for cached full data first
            const userLikedPostsDataKey = `user:${userId}:liked_posts_data`;
            const cachedData = await redisClient.get(userLikedPostsDataKey);
            if (cachedData) {
                return JSON.parse(cachedData);
            }

            // Fallback to basic liked posts set
            const userLikedPostsKey = `user:${userId}:liked_posts`;
            return await redisClient.sMembers(userLikedPostsKey);
        } catch (error) {
            console.error('Redis getUserLikedPosts error:', error);
            return [];
        }
    }

    /**
     * Set user's liked posts with full data
     * @param {string} userId 
     * @param {Array} posts - Array of post objects with full data
     * @returns {Promise<boolean>}
     */
    static async setUserLikedPosts(userId, posts) {
        try {
            const userLikedPostsDataKey = `user:${userId}:liked_posts_data`;
            await redisClient.set(userLikedPostsDataKey, JSON.stringify(posts), 'EX', POST_TTL);
            
            // Also update the basic set of post IDs
            const userLikedPostsKey = `user:${userId}:liked_posts`;
            const multi = redisClient.multi();
            multi.del(userLikedPostsKey); // Clear existing set
            posts.forEach(post => {
                multi.sAdd(userLikedPostsKey, post._id.toString());
            });
            multi.expire(userLikedPostsKey, POST_TTL);
            await multi.exec();
            
            return true;
        } catch (error) {
            console.error('Redis setUserLikedPosts error:', error);
            return false;
        }
    }

    /**
     * Get user's saved posts
     * @param {string} userId 
     */
    static async getUserSavedPosts(userId) {
        try {
            return await redisClient.sMembers(`${POST_SAVES_PREFIX}${userId}`);
        } catch (error) {
            console.error('Redis getUserSavedPosts error:', error);
            return [];
        }
    }

    /**
     * Check if user saved post
     * @param {string} userId 
     * @param {string} postId 
     */
    static async hasUserSavedPost(userId, postId) {
        try {
            return await redisClient.sIsMember(`${POST_SAVES_PREFIX}${userId}`, postId);
        } catch (error) {
            console.error('Redis hasUserSavedPost error:', error);
            return false;
        }
    }

    /**
     * Create a new post in Redis
     * @param {string} userId 
     * @param {string} postId 
     * @param {Object} postData 
     */
    static async createPost(userId, postId, postData) {
        // Validate postId
        if (
            !postId ||
            typeof postId !== 'string' ||
            !/^[a-fA-F0-9]{24}$/.test(postId)
        ) {
            throw new Error(`Invalid postId for RedisPostService.createPost: "${postId}"`);
        }
        try {
            // Sanitize all values for Redis (stringify objects/arrays, skip undefined/null)
            const sanitizedData = {};
            Object.entries({
                ...postData,
                _id: postId,
                userId
            }).forEach(([key, value]) => {
                if (value === undefined || value === null) return;
                if (typeof value === 'object') {
                    sanitizedData[key] = JSON.stringify(value);
                } else {
                    sanitizedData[key] = String(value);
                }
            });

            await redisClient.hSet(`${POST_KEY_PREFIX}${postId}`, sanitizedData);

            // Log action for MongoDB sync
            await handleEntityAction({
                entityType: 'post',
                action: 'create',
                userId,
                payload: { _id: postId, ...postData }
            });

            // Invalidate relevant caches
            await this.invalidatePostCache(postId);
            await redisClient.del('posts:all:*');

            // --- Update Redis 'posts:all' cache for first page (if exists) ---
            try {
                const cachedPosts = await this.getAllPosts(1, 10);
                if (Array.isArray(cachedPosts) && cachedPosts.length > 0) {
                    const newPost = { ...postData, _id: postId };
                    const updatedPosts = [newPost, ...cachedPosts].slice(0, 10);
                    await this.setAllPosts(updatedPosts, 1, 10, 0);
                }
            } catch (cacheError) {
                console.error('Error updating Redis posts:all cache after create:', cacheError);
            }

            // --- Update Redis user posts cache for first page (if exists) ---
            try {
                if (userId) {
                    const userCachedPosts = await this.getUserPosts(userId, 1, 10);
                    if (Array.isArray(userCachedPosts) && userCachedPosts.length > 0) {
                        const newUserPost = { ...postData, _id: postId };
                        const updatedUserPosts = [newUserPost, ...userCachedPosts].slice(0, 10);
                        await this.setUserPosts(userId, updatedUserPosts, 1, 10);
                    }
                }
            } catch (userCacheError) {
                console.error('Error updating Redis user posts cache after create:', userCacheError);
            }

            return postId;
        } catch (error) {
            console.error('Redis createPost error:', error);
            throw error;
        }
    }

    /**
     * Invalidate post cache
     * @param {string} postId 
     */
    static async invalidatePostCache(postId) {
        const multi = redisClient.multi();
        try {
            // Remove all related keys
            multi.del(`${POST_KEY_PREFIX}${postId}`);
            multi.del(`${POST_LIKES_PREFIX}${postId}`);
            multi.del(`${POST_COMMENTS_PREFIX}${postId}`);
            
            await multi.exec();
            return true;
        } catch (error) {
            console.error('Redis invalidatePostCache error:', error);
            return false;
        }
    }

    /**
     * Get all posts with pagination
     * @param {number} page 
     * @param {number} limit 
     * @param {string} [userId] - Optional user ID to check if the user liked or saved the posts
     * @returns {Promise<Array>} Array of posts
     */
    static async getAllPosts(page, limit, userId) {
        try {
            const start = (page - 1) * limit;
            const end = start + limit - 1;
            const posts = await redisClient.lRange('posts:all', start, end);

            // Return null instead of empty array to trigger DB fallback
            if (!posts || posts.length === 0) {
                return null;
            }

            return await Promise.all(
                posts.map(async (post) => {
                    const parsedPost = JSON.parse(post);
                    const [isLiked, isSaved] = await Promise.all([
                        userId ? this.hasUserLikedPost(userId, parsedPost._id) : false,
                        userId ? this.hasUserSavedPost(userId, parsedPost._id) : false
                    ]);
                    // Remove any existing isLiked/isSaved from parsedPost to avoid stale values
                    const { isLiked: _oldIsLiked, isSaved: _oldIsSaved, ...rest } = parsedPost;
                    return {
                        ...rest,
                        isLiked,
                        isSaved: userId ? isSaved : undefined
                    };
                })
            );
        } catch (error) {
            console.error('Redis getAllPosts error:', error);
            return null;
        }
    }

    /**
     * Set all posts with pagination
     * @param {Array} posts 
     * @param {number} page 
     * @param {number} limit 
     * @param {number} [totalPostsCount]
     */
    static async setAllPosts(posts, page, limit, totalPostsCount) {
        const multi = redisClient.multi();
        try {
            // Store posts in a list
            if (page === 1) {
                // Clear the list if it's the first page
                multi.del('posts:all');

                // Set the total posts count if provided
                if (totalPostsCount !== undefined) {
                    await this.setTotalPostsCount(totalPostsCount);
                } else {
                    // Use posts length as fallback
                    await this.setTotalPostsCount(posts.length);
                }
            }

            // Add all posts to the list
            posts.forEach(post => {
                multi.rPush('posts:all', JSON.stringify(post));
            });

            // Set expiry
            multi.expire('posts:all', POST_TTL);

            await multi.exec();
            return true;
        } catch (error) {
            console.error('Redis setAllPosts error:', error);
            return false;
        }
    }

    /**
     * Get total posts count
     * @returns {Promise<number>}
     */
    static async getTotalPostsCount() {
        try {
            const count = await redisClient.get('posts:total');
            return parseInt(count) || 0;
        } catch (error) {
            console.error('Redis getTotalPostsCount error:', error);
            return 0;
        }
    }

    /**
     * Set total posts count
     * @param {number} count 
     */
    static async setTotalPostsCount(count) {
        try {
            await redisClient.set('posts:total', count.toString(), {
                EX: POST_TTL
            });
            return true;
        } catch (error) {
            console.error('Redis setTotalPostsCount error:', error);
            return false;
        }
    }

    /**
     * Get user's posts with pagination
     * @param {string} userId 
     * @param {number} page 
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    static async getUserPosts(userId, page, limit) {
        try {
            const key = `user:${userId}:posts:${page}:${limit}`;
            const posts = await redisClient.lRange(key, 0, -1);
            if (!posts || posts.length === 0) {
                return null;
            }
            return posts.map(post => JSON.parse(post));
        } catch (error) {
            console.error('Redis getUserPosts error:', error);
            return null;
        }
    }

    /**
     * Set user's posts with pagination
     * @param {string} userId 
     * @param {Array} posts 
     * @param {number} page 
     * @param {number} limit 
     */
    static async setUserPosts(userId, posts, page, limit) {
        const multi = redisClient.multi();
        try {
            const key = `user:${userId}:posts:${page}:${limit}`;
            multi.del(key);
            posts.forEach(post => {
                multi.rPush(key, JSON.stringify(post));
            });
            multi.expire(key, POST_TTL);
            await multi.exec();
            return true;
        } catch (error) {
            console.error('Redis setUserPosts error:', error);
            return false;
        }
    }

    /**
     * Get user's total posts count
     * @param {string} userId 
     * @returns {Promise<number>}
     */
    static async getUserTotalPostsCount(userId) {
        try {
            const count = await redisClient.get(`user:${userId}:posts:total`);
            return parseInt(count) || 0;
        } catch (error) {
            console.error('Redis getUserTotalPostsCount error:', error);
            return 0;
        }
    }

    /**
     * Set user's total posts count
     * @param {string} userId 
     * @param {number} count 
     */
    static async setUserTotalPostsCount(userId, count) {
        try {
            await redisClient.set(`user:${userId}:posts:total`, count.toString(), {
                EX: POST_TTL
            });
            return true;
        } catch (error) {
            console.error('Redis setUserTotalPostsCount error:', error);
            return false;
        }
    }

    /**
     * Check if user is following another user
     * @param {string} followerId 
     * @param {string} followingId 
     * @returns {Promise<boolean>}
     */
    static async isUserFollowing(followerId, followingId) {
        try {
            // Validate arguments: must be non-empty strings
            if (!followerId || !followingId || typeof followerId !== 'string' || typeof followingId !== 'string') {
                // Optionally log a warning here
                return false;
            }
            return await redisClient.sIsMember(`user:${followerId}:following`, followingId);
        } catch (error) {
            console.error('Redis isUserFollowing error:', error);
            return false;
        }
    }

    /**
     * Get comments for a post from Redis
     * @param {string} postId 
     * @param {number} page 
     * @param {number} limit 
     */
    static async getPostComments(postId, page, limit) {
        try {
            const start = (page - 1) * limit;
            const end = start + limit - 1;
            const comments = await redisClient.lRange(`${POST_COMMENTS_PREFIX}${postId}`, start, end);
            return comments.map(comment => JSON.parse(comment));
        } catch (error) {
            console.error('Redis getPostComments error:', error);
            return null;
        }
    }

    /**
     * Set comments for a post in Redis
     * @param {string} postId 
     * @param {Array} comments 
     * @param {number} page 
     * @param {number} limit 
     */
    static async setPostComments(postId, comments, page, limit) {
        const multi = redisClient.multi();
        try {
            const key = `${POST_COMMENTS_PREFIX}${postId}`;
            if (page === 1) {
                multi.del(key);
            }
            comments.forEach(comment => {
                multi.rPush(key, JSON.stringify(comment));
            });
            multi.expire(key, POST_TTL);
            await multi.exec();
            return true;
        } catch (error) {
            console.error('Redis setPostComments error:', error);
            return false;
        }
    }

    /**
     * Get comments by user from Redis
     * @param {string} userId 
     * @param {number} page 
     * @param {number} limit 
     */
    static async getUserComments(userId, page, limit) {
        try {
            const key = `user:${userId}:comments:${page}:${limit}`;
            const cachedData = await redisClient.get(key);
            // Return parsed object (with posts, totalPosts, etc.) or null
            return cachedData ? JSON.parse(cachedData) : null;
        } catch (error) {
            console.error('Redis getUserComments error:', error);
            return null;
        }
    }

    /**
     * Set comments by user in Redis
     * @param {string} userId 
     * @param {Object} data - Should include posts, totalPosts, etc.
     * @param {number} page 
     * @param {number} limit 
     */
    static async setUserComments(userId, data, page, limit) {
        try {
            const key = `user:${userId}:comments:${page}:${limit}`;
            await redisClient.set(key, JSON.stringify(data), 'EX', POST_TTL);
            return true;
        } catch (error) {
            console.error('Redis setUserComments error:', error);
            return false;
        }
    }

    /**
     * Get a specific comment by its ID from Redis
     * @param {string} commentId 
     * @param {string} postId 
     * @returns {Promise<Object|null>} The comment data or null if not found
     */
    static async getComment(commentId, postId) {
        try {
            const commentKey = `${POST_COMMENTS_PREFIX}${postId}`;
            const comments = await redisClient.lRange(commentKey, 0, -1); // Get all comments for the post
            for (const comment of comments) {
                const parsedComment = JSON.parse(comment);
                if (parsedComment._id === commentId) {
                    return parsedComment;
                }
            }
            return null; // Comment not found
        } catch (error) {
            console.error('Redis getComment error:', error);
            return null;
        }
    }

    /**
     * Decrement the comment count for a post
     * @param {string} postId 
     */
    static async decrementPostCommentCount(postId) {
        const key = `post:${postId}:commentCount`;
        const exists = await redisClient.exists(key);
        if (exists) {
            await redisClient.decr(key);
        }
    }
}

module.exports = RedisPostService;
