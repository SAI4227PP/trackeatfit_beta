const express = require('express');
const router = express.Router();
const Friend = require('../../models/Friends/Friend');
const FriendActivity = require('../../models/Friends/FriendActivity');
const User = require('../../models/User');
const Achievement = require('../../models/Achievement');
const mongoose = require('mongoose');

// Get all friends
router.get('/all', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Find all friendships where the user is involved
    const friendships = await Friend.find({
      $or: [
        { user: userId, status: 'accepted' },
        { friend: userId, status: 'accepted' }
      ]
    })
    .populate('user friend', 'profile.username profile.uniqueName profile.avatar progress.level health.activityLevel goals.preferredExerciseTypes goals.weeklyExerciseDays meta.lastActive')
    .sort('-createdAt');

    // Process each friendship to maintain correct follow states based on perspective
    const processedFriendships = friendships.map(friendship => {
      const isReceiver = friendship.friend._id.toString() === userId;
      
      if (isReceiver) {
        // Viewing as receiver (B), swap the follow states
        return {
          ...friendship.toObject(),
          isFollowing: friendship.isFollowedBack,  // If receiver follows sender
          isFollowedBack: friendship.isFollowing   // If sender follows receiver
        };
      }
      // Viewing as sender (A), keep original states
      return friendship.toObject();
    });

    res.json(processedFriendships);
  } catch (error) {
    console.error('Get all friends error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get pending friend requests
router.get('/requests', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    console.log('Fetching friend requests...');
    
    const requests = await Friend.find({
      friend: userId,
      status: 'pending'
    })
    .populate('user', 'profile.username profile.uniqueName profile.avatar progress.level')
    .sort('-createdAt');
    
    console.log('Found friend requests:', requests);
    res.json(requests);
  } catch (error) {
    console.error('Friend requests error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get sent friend requests
router.get('/sent-requests', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    console.log('Fetching sent requests...');
    
    const sentRequests = await Friend.find({
      user: userId,
      status: 'pending'
    })
    .populate('friend', 'profile.username profile.uniqueName profile.avatar progress.level')
    .sort('-createdAt');
    
    console.log('Found sent requests:', sentRequests);
    res.json(sentRequests);
  } catch (error) {
    console.error('Sent requests error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Send friend request
router.post('/request/:userId', async (req, res) => {
  try {
    console.log('\n===== Friend Request Received =====');
    console.log('Request body:', req.body);
    console.log('URL params:', req.params);

    const { senderId } = req.body;
    const receiverId = req.params.userId;

    // Convert string IDs to ObjectIds
    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    console.log('Converted ObjectIds:', {
      sender: senderObjectId,
      receiver: receiverObjectId
    });

    if (!senderId || !receiverId) {
      console.log('Missing IDs - Validation Failed:', { senderId, receiverId });
      return res.status(400).json({ message: "Both sender and receiver IDs are required" });
    }

    if (senderId === receiverId) {
      console.log('Self-request blocked');
      return res.status(400).json({ message: "Can't send friend request to yourself" });
    }

    const existingFriend = await Friend.findOne({
      $or: [
        { user: senderObjectId, friend: receiverObjectId },
        { user: receiverObjectId, friend: senderObjectId }
      ]
    });

    console.log('Existing friend check:', existingFriend);

    if (existingFriend) {
      console.log('Existing friendship found:', existingFriend);
      return res.status(400).json({ message: "Friend request already exists" });
    }

    console.log('Creating new friend request...');
    const newFriend = new Friend({
      user: senderObjectId,
      friend: receiverObjectId,
      status: 'pending',
      isFollowing: true,      // Sender follows receiver initially
      isFollowedBack: false,  // Receiver not following sender yet
      mutualFollow: false
    });

    const savedRequest = await newFriend.save();
    console.log('Friend request saved successfully:', savedRequest);
    res.json({ status: 'sent', ...savedRequest.toObject() });

  } catch (error) {
    console.error('===== Friend Request Error =====');
    console.error('Error details:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
});

// Accept/Decline friend request
router.patch('/request/:requestId', async (req, res) => {
  try {
    const { status, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (status === 'declined') {
      // Delete the request instead of updating status
      const deletedRequest = await Friend.findOneAndDelete({
        _id: req.params.requestId,
        friend: userId,
        status: 'pending'
      });

      if (!deletedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }

      return res.json({ message: "Request declined and deleted" });
    }

    // Handle accept case as before
    const request = await Friend.findOneAndUpdate(
      { 
        _id: req.params.requestId, 
        friend: userId, 
        status: 'pending' 
      },
      { 
        status,
        // Keep isFollowing true since sender initiated following
        isFollowing: true,
        // Receiver not following back initially when accepting
        isFollowedBack: false,
        mutualFollow: false
      },
      { new: true }
    ).populate('user friend', 'username uniqueName avatar level');

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json(request);
  } catch (error) {
    console.error('Accept/Decline error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Cancel sent friend request
router.delete('/cancel-request/:requestId', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const deletedRequest = await Friend.findOneAndDelete({
      _id: req.params.requestId,
      user: userId,
      status: 'pending'
    });

    if (!deletedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json({ message: "Request cancelled successfully" });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get friend suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const existingConnections = await Friend.find({
      $or: [
        { user: userId },
        { friend: userId }
      ]
    });

    const connectedUserIds = existingConnections.map(conn => 
      conn.user.toString() === userId ? conn.friend : conn.user
    );

    const suggestions = await User.find({
      _id: { $nin: [...connectedUserIds, userId] }
    })
    .select('profile.username profile.uniqueName profile.avatar progress.level goals.preferredExerciseTypes')
    .limit(10);

    res.json(suggestions);
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get workout buddies
router.get('/workout-buddies', async (req, res) => {
  try {
    const workoutBuddies = await Friend.find({
      $or: [
        { user: req.user.id, isWorkoutBuddy: true, status: 'accepted' },
        { friend: req.user.id, isWorkoutBuddy: true, status: 'accepted' }
      ]
    })
    .populate('user friend', 'profile.username profile.avatar progress.level goals.preferredExerciseTypes health.activityLevel');

    res.json(workoutBuddies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle workout buddy status
router.patch('/workout-buddy/:friendId', async (req, res) => {
  try {
    const friend = await Friend.findOne({
      _id: req.params.friendId,
      status: 'accepted',
      $or: [
        { user: req.user.id },
        { friend: req.user.id }
      ]
    });

    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    friend.isWorkoutBuddy = !friend.isWorkoutBuddy;
    await friend.save();
    res.json(friend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle follow status
router.patch('/:friendId/follow', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID is required" });
    }

    const friendship = await Friend.findOne({
      $or: [
        { user: userId, friend: req.params.friendId },
        { friend: userId, user: req.params.friendId }
      ],
      status: 'accepted'
    });

    if (!friendship) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    // If userId matches the user field (initiator/sender)
    const isInitiator = friendship.user.toString() === userId;
    
    if (isInitiator) {
      friendship.isFollowing = !friendship.isFollowing;
    } else {
      friendship.isFollowedBack = !friendship.isFollowedBack;
    }

    // Update mutual follow status
    friendship.mutualFollow = friendship.isFollowing && friendship.isFollowedBack;
    await friendship.save();

    res.json({
      success: true,
      message: "Following status updated",
      friendship: {
        ...friendship.toObject(),
        isFollowing: isInitiator ? friendship.isFollowing : friendship.isFollowedBack,
        isFollowedBack: isInitiator ? friendship.isFollowedBack : friendship.isFollowing
      }
    });
  } catch (error) {
    console.error('Follow toggle error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get friendship status
router.get('/status/:friendId', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const friendship = await Friend.findOne({
      $or: [
        { user: userId, friend: req.params.friendId },
        { friend: userId, user: req.params.friendId }
      ],
      status: 'accepted'
    });

    if (!friendship) {
      return res.json({ status: 'none' });
    }

    const isReceiver = friendship.friend.toString() === userId;

    return res.json({
      status: 'friends',
      // Adjust follow states based on perspective
      isFollowing: isReceiver ? friendship.isFollowedBack : friendship.isFollowing,
      isFollowedBack: isReceiver ? friendship.isFollowing : friendship.isFollowedBack,
      mutualFollow: friendship.mutualFollow
    });
  } catch (error) {
    console.error('Friendship status error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get friend activities and profile details
router.get('/profile/:friendId', async (req, res) => {
  try {
    if (!req.params.friendId) {
      return res.status(400).json({ message: 'Friend ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.friendId)) {
      return res.status(400).json({ message: 'Invalid friend ID format' });
    }

    const friendProfile = await User.findById(req.params.friendId).select(
      'profile.username profile.uniqueName profile.avatar profile.bio profile.link ' +
      'meta.createdAt progress.streak progress.level progress.xp ' +
      'health.activityLevel personal.age personal.gender personal.height personal.weight ' +
      'goals.weightGoal goals.preferredExerciseTypes goals.weeklyExerciseDays'
    );

    if (!friendProfile) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get follower count (users who follow this profile)
    const followerCount = await Friend.countDocuments({
      $or: [
        { user: req.params.friendId, isFollowedBack: true },
        { friend: req.params.friendId, isFollowing: true }
      ],
      status: 'accepted'
    });

    // Get following count (users this profile follows)
    const followingCount = await Friend.countDocuments({
      $or: [
        { user: req.params.friendId, isFollowing: true },
        { friend: req.params.friendId, isFollowedBack: true }
      ],
      status: 'accepted'
    });

    const activities = await FriendActivity.find({
      user: req.params.friendId,
      shared: true
    })
    .sort('-createdAt')
    .limit(5);

    const workoutStats = await FriendActivity.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.params.friendId),
          activityType: 'workout',
          createdAt: { 
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalDistance: { $sum: '$distance' },
          averageCalories: { $avg: '$calories' }
        }
      }
    ]);

    const response = {
      ...friendProfile.toObject(),
      followers: followerCount,
      following: followingCount,
      isWorkoutBuddy: false,
      recentActivities: activities,
      weeklyStats: workoutStats[0] || null
    };

    res.json(response);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Remove friend
router.delete('/:friendId', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.friendId)) {
      return res.status(400).json({ message: "Invalid friend ID" });
    }

    const deleted = await Friend.findOneAndDelete({
      $or: [
        { user: userId, friend: req.params.friendId },
        { friend: userId, user: req.params.friendId }
      ],
      status: 'accepted'
    });

    if (!deleted) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    // Update both users' friend counts or other related data if needed
    console.log('Friendship deleted:', deleted);

    res.json({ 
      success: true, 
      message: "Friend removed successfully",
      deletedFriendship: deleted
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get followers, following, and mutual friends data
router.get('/follow-data/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get followers (users who follow this profile)
    const followersData = await Friend.find({
      $or: [
        { user: userId, isFollowedBack: true },
        { friend: userId, isFollowing: true }
      ],
      status: 'accepted'
    }).populate('user friend', 'profile.username profile.uniqueName profile.avatar');

    // Get following (users this profile follows)
    const followingData = await Friend.find({
      $or: [
        { user: userId, isFollowing: true },
        { friend: userId, isFollowedBack: true }
      ],
      status: 'accepted'
    }).populate('user friend', 'profile.username profile.uniqueName profile.avatar');

    // Process followers and following lists
    const followers = followersData.map(f => {
      const follower = f.user._id.toString() === userId ? f.friend : f.user;
      return {
        ...follower.toObject(),
        isMutual: f.mutualFollow
      };
    });

    const following = followingData.map(f => {
      const followedUser = f.user._id.toString() === userId ? f.friend : f.user;
      return {
        ...followedUser.toObject(),
        isMutual: f.mutualFollow
      };
    });

    // Get mutual friends (where mutualFollow is true)
    const mutual = followers.filter(f => f.isMutual);

    res.json({
      followers,
      following,
      mutual
    });
  } catch (error) {
    console.error('Follow data error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;