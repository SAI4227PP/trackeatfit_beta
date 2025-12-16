const express = require('express');
const LikeOnComment = require('../models/LikeOnCommentSchema');
const Comment = require('../models/CommentSchema');
const { notifyAllClients } = require('../middleware/sseMiddleware');
const RedisPostService = require('../utils/postRedisService');
const router = express.Router();

// Like a specific comment
router.post('/like', async (req, res) => {
  const { userId, commentId, profilename, profilepic, uniqueName } = req.body;

  try {
    // Validate the comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if the user has already liked this comment
    const existingLike = await LikeOnComment.findOne({ userId, commentId });
    if (existingLike) {
      return res.status(400).json({ error: 'You have already liked this comment' });
    }

    // Update Redis first
    await RedisPostService.likeComment(userId, comment.postId, commentId);

    // Create a new like on the comment
    const newLike = new LikeOnComment({
      userId,
      commentId,
      profilename,
      uniqueName,
      profilepic,
    });

    await newLike.save();

    // Replace S3 URLs with CDN for profilepic only
    const CDN_URL = 'https://cdn.trackeatfit.me';
    if (newLike.profilepic && typeof newLike.profilepic === 'string') {
      newLike.profilepic = newLike.profilepic.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL);
    }

    // Notify all clients about the new like
    notifyAllClients('commentLike', { commentId, userId, profilepic: newLike.profilepic });

    res.status(201).json({ 
      message: 'Like added to comment', 
      like: newLike, 
      isLiked: true // Add isLiked dynamically
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

// Get likes for a specific comment
router.get('/likes/:commentId', async (req, res) => {
  const { commentId } = req.params;

  try {
    const likes = await LikeOnComment.find({ commentId }).populate('userId', 'profilename profilepic uniqueName').lean();
    res.status(200).json({ message: 'Likes fetched successfully', likes });
  } catch (error) {
    console.error('Error fetching likes for comment:', error);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

// Remove like from a specific comment
router.delete('/remove-like', async (req, res) => {
  const { userId, commentId } = req.body;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Update Redis first
    await RedisPostService.unlikeComment(userId, comment.postId, commentId);
    
    const like = await LikeOnComment.findOneAndDelete({ userId, commentId });
    if (!like) {
      return res.status(404).json({ error: 'Like not found' });
    }

    // Replace S3 URLs with CDN for profilepic only
    const CDN_URL = 'https://cdn.trackeatfit.me';
    let profilepic = like && like.profilepic && typeof like.profilepic === 'string'
      ? like.profilepic.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
      : (like ? like.profilepic : undefined);

    // Notify all clients about the removed like
    notifyAllClients('commentUnlike', { commentId, userId, profilepic });

    res.status(200).json({ 
      message: 'Like removed from comment', 
      isLiked: false // Add isLiked dynamically
    });
  } catch (error) {
    console.error('Error removing like from comment:', error);
    res.status(500).json({ error: 'Failed to remove like' });
  }
});

// Get total likes for a specific comment
router.get('/total-likes/:commentId', async (req, res) => {
  const { commentId } = req.params;

  try {
    // Get from Redis first, fallback to MongoDB
    let totalLikes = await RedisPostService.getCommentLikesCount(commentId);
    if (totalLikes === null) {
      totalLikes = await LikeOnComment.countDocuments({ commentId });
    }
    res.status(200).json({ message: 'Total likes fetched successfully', totalLikes });
  } catch (error) {
    console.error('Error fetching total likes for comment:', error);
    res.status(500).json({ error: 'Failed to fetch total likes' });
  }
});

// Add this new route before module.exports
router.get('/user-likes/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Find all likes by this user
    const userLikes = await LikeOnComment.find({ userId })
      .populate('commentId') // Optionally populate comment details
      .lean();

    console.log('Fetching likes for user:', userId);
    console.log('Found likes:', userLikes);

    res.status(200).json({
      message: 'User likes fetched successfully',
      likes: userLikes,
      count: userLikes.length
    });
  } catch (error) {
    console.error('Error fetching user likes:', error);
    res.status(500).json({ error: 'Failed to fetch user likes' });
  }
});

module.exports = router;
