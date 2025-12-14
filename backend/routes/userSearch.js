const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Following = require('../models/Following');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

// Create compound index for better search performance
User.collection.createIndex({ 'profile.username': 1, 'profile.uniqueName': 1 });

router.get('/search', async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const cacheKey = `search:${query}:${page}:${limit}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const skip = (page - 1) * limit;

    // Execute count query and search query in parallel
    const [totalUsers, users] = await Promise.all([
      User.countDocuments({
        $or: [
          { 'profile.username': { $regex: `^${query}`, $options: 'i' } },
          { 'profile.uniqueName': { $regex: `^${query}`, $options: 'i' } },
        ]
      }),
      User.find({
        $or: [
          { 'profile.username': { $regex: `^${query}`, $options: 'i' } },
          { 'profile.uniqueName': { $regex: `^${query}`, $options: 'i' } },
        ]
      }, { 
        'profile.username': 1,
        'profile.uniqueName': 1,
        'profile.avatar': 1,
        'profile.bio': 1,
        // 'profile.link': 1,
        // 'meta.createdAt': 1,
        // 'progress.level': 1,
        // 'goals.preferredExerciseTypes': 1,
        _id: 1 
      })
      .sort({ 'profile.username': 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
    ]);

    // Get follower and following counts for each user
    const userIds = users.map(user => user._id);
    
    // Get all follower and following counts in bulk for better performance
    const [followerCounts, followingCounts] = await Promise.all([
      Following.aggregate([
        { $match: { following: { $in: userIds } } },
        { $group: { _id: "$following", count: { $sum: 1 } } }
      ]),
      Following.aggregate([
        { $match: { follower: { $in: userIds } } },
        { $group: { _id: "$follower", count: { $sum: 1 } } }
      ])
    ]);
    
    // Create maps for quick access to counts
    const followerCountMap = followerCounts.reduce((map, item) => {
      map[item._id.toString()] = item.count;
      return map;
    }, {});
    
    const followingCountMap = followingCounts.reduce((map, item) => {
      map[item._id.toString()] = item.count;
      return map;
    }, {});
    
    // Add counts to each user
    const usersWithCounts = users.map(user => {
      const userId = user._id.toString();
      return {
        ...user,
        followers: followerCountMap[userId] || 0,
        following: followingCountMap[userId] || 0
      };
    });

    const totalPages = Math.ceil(totalUsers / limit);
    const result = {
      users: usersWithCounts,
      pagination: {
        total: totalUsers,
        page: parseInt(page),
        totalPages,
        hasMore: page < totalPages
      }
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
});

// Get user details with follow status
router.get('/user/:uniqueName', async (req, res) => {
  try {
    const { uniqueName } = req.params;
    const currentUserId = req.query.currentUserId;

    if (!uniqueName) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Find the user by uniqueName
    const user = await User.findOne(
      { 'profile.uniqueName': uniqueName }
    ).select('profile.username profile.uniqueName profile.avatar profile.bio profile.link meta.createdAt progress.level goals.preferredExerciseTypes').lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get follower and following counts, follow status, and mutual friends in parallel
    const [followerCount, followingCount, followStatusAndMutuals] = await Promise.all([
      Following.countDocuments({ following: user._id }),
      Following.countDocuments({ follower: user._id }),
      (async () => {
        let status = { 
          isFollowing: false, 
          isMutual: false,
          mutualFriends: [] 
        };
        
        if (currentUserId && currentUserId !== user._id.toString()) {
          const [followRelation, reverseFollow, currentUserFriends, targetUserFriends] = await Promise.all([
            Following.findOne({ 
              follower: currentUserId, 
              following: user._id 
            }).lean(),
            Following.findOne({ 
              follower: user._id, 
              following: currentUserId 
            }).lean(),
            // Get users that the current user follows
            Following.find({ 
              follower: currentUserId 
            }).select('following').lean(),
            // Get users that the target user follows
            Following.find({ 
              follower: user._id 
            }).select('following').lean()
          ]);

          // Convert to sets of friend IDs for easier comparison
          const currentUserFriendIds = new Set(currentUserFriends.map(f => f.following.toString()));
          const targetUserFriendIds = new Set(targetUserFriends.map(f => f.following.toString()));

          // Find mutual friends (intersection of both sets)
          const mutualFriendIds = [...currentUserFriendIds].filter(id => targetUserFriendIds.has(id));

          // Get user details for mutual friends
          let mutualFriends = [];
          if (mutualFriendIds.length > 0) {
            mutualFriends = await User.find(
              { _id: { $in: mutualFriendIds } }
            ).select('profile.username profile.uniqueName profile.avatar').lean();

            mutualFriends = mutualFriends.map(friend => ({
              _id: friend._id,
              username: friend.profile.username,
              uniqueName: friend.profile.uniqueName,
              avatar: friend.profile.avatar
            }));
          }

          status = {
            isFollowing: !!followRelation,
            isMutual: !!(followRelation && reverseFollow),
            mutualFriends,
            mutualFriendsCount: mutualFriends.length
          };
        }
        return status;
      })()
    ]);

    // Replace S3 URLs with CDN for avatar
    const CDN_URL = 'https://cdn.trackeatfit.me';
    let avatar = user.profile.avatar;
    if (avatar && typeof avatar === 'string') {
      avatar = avatar.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL);
    }

    // Format user data
    const userData = {
      _id: user._id,
      username: user.profile.username,
      uniqueName: user.profile.uniqueName,
      avatar: avatar,
      bio: user.profile.bio,
      link: user.profile.link,
      createdAt: user.meta.createdAt,
      level: user.progress?.level || 1,
      exerciseTypes: user.goals?.preferredExerciseTypes || [],
      followersCount: followerCount,
      followingCount: followingCount,
      followStatus: {
        isFollowing: followStatusAndMutuals.isFollowing,
        isMutual: followStatusAndMutuals.isMutual,
        mutualFriends: followStatusAndMutuals.mutualFriends,
        mutualFriendsCount: followStatusAndMutuals.mutualFriendsCount || 0
      }
    };

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

module.exports = router;