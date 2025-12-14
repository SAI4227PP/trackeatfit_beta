const express = require('express');
const router = express.Router();
const Following = require('../models/Following');
const User = require('../models/User');
const mongoose = require('mongoose');
const { notifyAllClients } = require('../middleware/sseMiddleware');
const { sendPushNotification } = require('../services/notificationService');

// Follow a user
router.post('/follow', async (req, res) => {
  try {
    const { followerId, followingId } = req.body;

    if (!followerId || !followingId) {
      return res.status(400).json({ message: "Both follower and following IDs are required" });
    }

    if (followerId === followingId) {
      return res.status(400).json({ message: "Users cannot follow themselves" });
    }    // Check if the follow relationship already exists
    const existingFollow = await Following.findOne({
      follower: followerId,
      following: followingId
    });

    if (existingFollow) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Check if the other user is following this user already
    const reverseFollow = await Following.findOne({
      follower: followingId,
      following: followerId
    });

    // Get follower's user details for the notification
    const follower = await User.findById(followerId);
    if (!follower) {
      return res.status(404).json({ message: "Follower user not found" });
    }

    // Get following user's details for push notification
    const followingUser = await User.findById(followingId);
    if (!followingUser) {
      return res.status(404).json({ message: "User to follow not found" });
    }

    // Create new follow relationship
    const newFollow = await Following.create({
      follower: followerId,
      following: followingId,
      isFollowing: true,
      isFollowedBack: !!reverseFollow,
      mutualFollow: !!reverseFollow
    });    // Send push notification to the user being followed
    try {
      if (followingUser.pushToken) {
        await sendPushNotification({
          to: followingUser.pushToken,
          title: 'New Follower',
          body: `${follower.profile.username} started following you`,
          data: {
            type: 'SOCIAL_FOLLOW',
            followerId: followerId,
            followerName: follower.profile.username,
            followerUniqueName: follower.profile.uniqueName,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error sending follow notification:', error);
      // Don't throw error, continue with the follow process
    }

    // Notify clients about the follow action
    notifyAllClients('posts', {
      type: 'followUpdate',
      followingId: followingId,
      isFollowing: true,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ 
      message: "Successfully followed user",
      follow: newFollow,
      isMutual: !!reverseFollow
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Unfollow a user
router.delete('/unfollow', async (req, res) => {
  try {
    const { followerId, followingId } = req.body;

    if (!followerId || !followingId) {
      return res.status(400).json({ message: "Both follower and following IDs are required" });
    }    const followDoc = await Following.findOne({
      follower: followerId,
      following: followingId
    });

    if (!followDoc) {
      return res.status(404).json({ message: "Follow relationship not found" });
    }

    // Check if there is a reverse follow relationship
    const reverseFollow = await Following.findOne({
      follower: followingId,
      following: followerId
    });

    // Update reverse follow if it exists
    if (reverseFollow) {
      reverseFollow.isFollowedBack = false;
      reverseFollow.mutualFollow = false;
      await reverseFollow.save();
    }

    // Now delete the follow relationship
    const result = await Following.findByIdAndDelete(followDoc._id);

    // Notify clients about the unfollow action
    notifyAllClients('posts', {
      type: 'followUpdate',
      followingId: followingId,
      isFollowing: false,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ 
      message: "Successfully unfollowed user",
      follow: result 
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Check if a user is following another user
router.get('/check', async (req, res) => {
  try {
    const { followerId, followingId } = req.query;

    if (!followerId || !followingId) {
      return res.status(400).json({ message: "Both follower and following IDs are required" });
    }

    const follow = await Following.findOne({
      follower: followerId,
      following: followingId
    });

    res.status(200).json({ 
      isFollowing: !!follow
    });
  } catch (error) {
    console.error('Check follow status error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get followers of a user
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const followers = await Following.find({ following: userId })
      .populate('follower', 'username uniqueName avatar')
      .sort('-createdAt');

    res.status(200).json(followers);
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get users that a user is following
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const following = await Following.find({ follower: userId })
      .populate('following', 'username uniqueName avatar')
      .sort('-createdAt');

    res.status(200).json(following);
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get followers, following, and mutual friends data
router.get('/follow-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID is required" });
    }

    // Get followers (users who follow this profile)
    const followersData = await Following.find({ following: userId })
      .populate('follower', 'profile.username profile.uniqueName profile.avatar');
    
    // Get following (users this profile follows)
    const followingData = await Following.find({ follower: userId })
      .populate('following', 'profile.username profile.uniqueName profile.avatar');
    
    // CDN URL for avatar replacement
    const CDN_URL = 'https://cdn.trackeatfit.me';

    // Helper to replace S3 URL with CDN
    const replaceAvatarUrl = (avatar) => {
      if (typeof avatar === 'string') {
        return avatar.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL);
      }
      return avatar;
    };

    // Process followers list
    const followers = followersData.map(f => {
      return {
        _id: f.follower._id,
        profile: {
          username: f.follower.profile?.username || 'User',
          uniqueName: f.follower.profile?.uniqueName || 'user',
          avatar: replaceAvatarUrl(f.follower.profile?.avatar || '')
        },
        isMutual: f.mutualFollow
      };
    });

    // Process following list
    const following = followingData.map(f => {
      return {
        _id: f.following._id,
        profile: {
          username: f.following.profile?.username || 'User',
          uniqueName: f.following.profile?.uniqueName || 'user',
          avatar: replaceAvatarUrl(f.following.profile?.avatar || '')
        },
        isMutual: f.mutualFollow
      };
    });

    // Get mutual friends (where mutualFollow is true)
    const mutual = followers.filter(f => f.isMutual);

    res.status(200).json({
      followers,
      following,
      mutual
    });
  } catch (error) {
    console.error('Follow data error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get following counts for a user
router.get('/counts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID is required" });
    }

    const followersCount = await Following.countDocuments({ following: userId });
    const followingCount = await Following.countDocuments({ follower: userId });

    res.status(200).json({
      followers: followersCount,
      following: followingCount
    });
  } catch (error) {
    console.error('Get follow counts error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get follow notifications for a user
router.get('/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find recent follow events where this user was followed
    const notifications = await Following.find({
      following: userId, // user being followed
      isFollowing: true
    })
    .sort({ timestamp: -1 }) // most recent first
    .limit(50) // limit to 50 most recent notifications
    .populate('follower', 'profile.username profile.uniqueName profile.avatar')
    .lean();

    // CDN URL for avatar replacement
    const CDN_URL = 'https://cdn.trackeatfit.me';
    // Helper to replace S3 URL with CDN
    const replaceAvatarUrl = (avatar) => {
      if (typeof avatar === 'string') {
        return avatar.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL);
      }
      return avatar;
    };

    // Format notifications for the client
    const formattedNotifications = notifications
      .filter(notification => notification.follower) // Ensure follower exists
      .map(notification => ({
        _id: notification._id,
        followerName: notification.follower.profile.username,
        followerUniqueName: notification.follower.profile.uniqueName,
        followerAvatar: replaceAvatarUrl(notification.follower.profile.avatar),
        timestamp: notification.timestamp || notification.createdAt || new Date()
      }));

    res.json({
      success: true,
      notifications: formattedNotifications
    });
  } catch (error) {
    console.error('Error fetching follow notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch follow notifications'
    });
  }
});

module.exports = router;
