const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const CurrentUser =require('../models/CurrentUser')
const Post = require('../models/Post');
const Like = require('../models/Like');
const Comment = require('../models/CommentSchema');
const LikeOnComment = require('../models/LikeOnCommentSchema');
const { sendWelcomeEmail, sendLoginNotification } = require('../utils/emailService');
const { verifyToken, JWT_SECRET } = require('../middleware/authMiddleware');
const verifyGoogleToken = require('../middleware/googleAuthMiddleware');
const router = express.Router();
const Subscription = require('../models/Subscription/SubscriptionSchema');
const rateLimit = require('express-rate-limit');  // Import rate limit package
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

// Add request validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

// Strengthen rate limiters
const signinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter to limit user creation attempts
const createUserLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 3 requests per window
  message: { error: 'Too many account creation attempts. Please try again later.' },
});

// --- Avatar Upload Endpoint ---

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function generateUniqueFileName(originalName) {
  const ext = originalName.split('.').pop();
  const unique = crypto.randomBytes(16).toString('hex');
  return `${unique}.${ext}`;
}

// Profile avatar upload (only 1 image, folder: profile, must provide userId or uniqueName)
router.post('/upload-avatar', upload.single('image'), async (req, res) => {
  const uploadTimeout = setTimeout(() => {
    res.status(504).json({ error: 'Upload timeout' });
  }, 30000); // 30 second timeout

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Accept userId or uniqueName in body or query
    const { userId, uniqueName } = req.body;
    if (!userId && !uniqueName) {
      return res.status(400).json({ error: 'userId or uniqueName required' });
    }

    // Find user by userId or uniqueName
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else if (uniqueName) {
      user = await User.findOne({ 'profile.uniqueName': uniqueName.toLowerCase().trim() });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const file = req.file;
    // Use userId or uniqueName in file name for traceability
    const idPart = userId ? userId : user._id.toString();
    const unamePart = user.profile.uniqueName ? user.profile.uniqueName : 'nouname';
    const ext = file.originalname.split('.').pop();
    // const fileName = `${idPart}_${unamePart}_${generateUniqueFileName(file.originalname)}`;
    const fileName = `${idPart}_${unamePart}_${generateUniqueFileName(file.originalname)}`;
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `profile/${fileName}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'public, max-age=31536000, immutable',
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    clearTimeout(uploadTimeout);

    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.us-east-1.amazonaws.com/profile/${fileName}`;

    // Optionally update user profile.avatar here if you want atomic update
    // user.profile.avatar = url;
    // await user.save();

    res.status(200).json({
      message: 'Avatar uploaded successfully',
      url,
    });
  } catch (error) {
    clearTimeout(uploadTimeout);
    console.error('Avatar upload error:', error);
    res.status(500).json({
      error: 'Failed to upload avatar',
      details: error.message,
    });
  }
});


router.post('/create-user', createUserLimiter, async (req, res) => {
    const { email, password, username, uniqueName, googleId, idToken } = req.body;
    
    try {
      if (googleId && idToken) {
        const verification = await verifyGoogleToken(idToken, googleId);
        
        if (!verification.verified) {
          return res.status(401).json({ 
            error: 'Invalid Google authentication' 
          });
        }
      }
      
      if (!email || !username || !uniqueName || (!password && !googleId)) {
        return res.status(400).json({ error: 'Missing required fields. Need email, username, uniqueName, and either password or Google ID' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Validate password if provided
      if (password && password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      // Normalize email and uniqueName for case-insensitive comparison
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedUniqueName = uniqueName.toLowerCase().trim();

      // Log input data (excluding password for security)
      console.log('Create user request:', {
        email: normalizedEmail,
        username,
        uniqueName: normalizedUniqueName,
        timestamp: new Date().toISOString()
      });

      // Check for existing user with same email or uniqueName (case-insensitive)
      const [existingEmail, existingUniqueName] = await Promise.all([
        User.findOne({ 'auth.email': { $regex: new RegExp(`^${email}$`, 'i') } }),
        User.findOne({ 'profile.uniqueName': { $regex: new RegExp(`^${uniqueName}$`, 'i') } })
      ]);

      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      
      if (existingUniqueName) {
        return res.status(400).json({ error: 'Username already taken' });
      }
  
      // Determine auth methods and prepare auth object
      const authMethods = [];
      const auth = { email };
      
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        auth.password = hashedPassword;
        authMethods.push('password');
      } else {
        auth.password = null; // Explicitly set null for Google-only accounts
      }
      
      if (googleId) {
        auth.googleId = googleId;
        authMethods.push('google');
      }
      
      const avatarUrl = `https://th.bing.com/th/id/OIP.yd94h9eJxZuHPrDg31LkiQHaHa?w=500&h=500&rs=1&pid=ImgDetMain`;
      
      const newUser = new User({
        auth: {
          ...auth,
          authMethods
        },
        profile: {
          username,
          uniqueName,
          avatar: avatarUrl,
          bio: '',
          link: '',
        },
        progress: {
          streak: 0,
          lastStreak: new Date(),
          level: 1,
          xp: 0,
        },        
        personal: {
          age: null,
          gender: 'select',
          height: null,
          weight: null,
          targetWeight: null,
          weightUnit: 'kg',
        },
        health: {
          activityLevel: 'sedentary',
          bloodType: 'unknown',
          medicalConditions: [],
          allergies: [],
          medications: [],
          dietaryRestrictions: 'none',
          supplementsUsed: [],
          foodIntolerances: [],
        },
        goals: {
          weightGoal: 'maintain',
          mealFrequency: '3_meals',
          dietaryPreference: 'no_preference',
          weeklyExerciseDays: 3,
          preferredExerciseTypes: [],
        },
        metrics: {
          bmi: null,
          bmr: null,
          tdee: null,
          idealWeightRange: {
            min: null,
            max: null
          }
        },
        meta: {
          createdAt: new Date(),
          lastUpdated: new Date(),
          completionPercentage: 0
        },
        profileCompleted: false
      });
  
      await newUser.save();
      
      // Send welcome email
      try {
        await sendWelcomeEmail(email, username);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't stop the registration process if email fails
      }
  
      console.log("User created successfully:", newUser);  // Log the newly created user
      res.status(201).json({ 
        message: 'User created successfully', 
        user: newUser, 
        uri: avatarUrl 
      });    } catch (error) {
      console.error('Error creating user:', error);  // Log any backend error
      
      // Check for duplicate key error
      if (error.code === 11000) {
        let errorMessage = 'Duplicate key error';
        if (error.keyPattern?.['auth.email']) {
          errorMessage = 'Email already exists';
        } else if (error.keyPattern?.['profile.uniqueName']) {
          errorMessage = 'Username already taken';
        }
        return res.status(400).json({ error: errorMessage });
      }
      
      res.status(500).json({ error: 'An unexpected error occurred', details: error.message });
    }
  });
  
// Update an existing user
router.put('/update/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    // Normalize email if it's being updated
    if (updateData.auth?.email) {
      updateData.auth.email = updateData.auth.email.toLowerCase().trim();
      
      // Check if email already exists
      const existingEmail = await User.findOne({ 
        _id: { $ne: userId },
        'auth.email': updateData.auth.email 
      });
      
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Normalize uniqueName if it's being updated
    if (updateData.profile?.uniqueName) {
      updateData.profile.uniqueName = updateData.profile.uniqueName.toLowerCase().trim();
      
      // Check if uniqueName already exists
      const existingUniqueName = await User.findOne({ 
        _id: { $ne: userId },
        'profile.uniqueName': updateData.profile.uniqueName 
      });
      
      if (existingUniqueName) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Fetch the user document
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the user document with new data
    // If profile is present, update nested fields explicitly
    if (updateData.profile) {
      userDoc.profile = {
        ...userDoc.profile.toObject(),
        ...updateData.profile
      };
    }
    // If auth is present, update nested fields explicitly
    if (updateData.auth) {
      userDoc.auth = {
        ...userDoc.auth.toObject(),
        ...updateData.auth
      };
    }
    // For other top-level fields, assign directly
    Object.keys(updateData).forEach(key => {
      if (key !== 'profile' && key !== 'auth') {
        userDoc[key] = updateData[key];
      }
    });
    userDoc.meta.lastUpdated = new Date();
    const updatedUser = await userDoc.save();

    // --- Update all related collections with new profile info ---
    const newProfile = userDoc.profile || {};
    const updateProfileFields = {
      profilename: newProfile.username,
      uniqueName: newProfile.uniqueName,
      profilepic: newProfile.avatar
    };

    await Promise.all([
      // Update all posts by this user
      Post.updateMany(
        { userId: userDoc._id },
        { $set: updateProfileFields }
      ),
      // Update all likes by this user
      Like.updateMany(
        { userId: userDoc._id },
        { $set: updateProfileFields }
      ),
      // Update all comments by this user
      Comment.updateMany(
        { userId: userDoc._id },
        { $set: updateProfileFields }
      ),
      // Update all likes on comments by this user
      LikeOnComment.updateMany(
        { userId: userDoc._id },
        { $set: updateProfileFields }
      )
    ]);

    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      let errorMessage = 'Duplicate key error';
      if (error.keyPattern?.['auth.email']) {
        errorMessage = 'Email already exists';
      } else if (error.keyPattern?.['profile.uniqueName']) {
        errorMessage = 'Username already taken';
      }
      return res.status(400).json({ error: errorMessage });
    }

    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Get user details by ID
router.get('/details/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Fetch user details
    const userDocument = await User.findById(userId);
    if (!userDocument) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User details fetched successfully:', userDocument);
    res.status(200).json({ message: 'User details fetched successfully', user: userDocument });
  } catch (error) {
    console.error('Error fetching user details:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

router.get('/check-unique-name/:name', async (req, res) => {
  const name = req.params.name;

  if (!name) {
    return res.status(400).json({ error: 'Unique name is required' });
  }

  try {
    // Log the input name and ensure it's formatted correctly
    console.log('Checking unique name:', name);

    // Normalize the unique name to lowercase
    const normalizedUniqueName = name.trim().toLowerCase();
    console.log('Normalized unique name:', normalizedUniqueName);

    // Use a case-insensitive regex to find the unique name in the nested profile structure
    const existingUser = await User.findOne({
      'profile.uniqueName': { $regex: new RegExp(`^${normalizedUniqueName}$`, 'i') },
    });

    console.log('Existing user:', existingUser);

    if (existingUser) {
      return res.status(200).json({ status: 'taken' });
    }

    return res.status(200).json({ status: 'available' });
  } catch (error) {
    console.error('Error checking unique name:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});


// Sign In User and create session in CurrentUser model
router.post('/signin', signinLimiter, async (req, res) => {
  try {
    const { email, password, googleId, idToken, deviceInfo } = req.body;
    
    // Validate required fields
    if ((!email || !password) && (!googleId || !idToken)) {
      return res.status(400).json({
        error: 'Invalid authentication credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Find user by email
    const user = await User.findOne({ 'auth.email': email });

    if (!user) {
      return res.status(404).json({ 
        error: 'Account not found. Please sign up first.' 
      });
    }

    if (googleId && idToken) {
      // Verify Google token before proceeding
      const verification = await verifyGoogleToken(idToken, googleId);
      
      if (!verification.verified) {
        return res.status(401).json({ 
          error: 'Invalid Google authentication' 
        });
      }

      // Rest of Google sign in logic
      if (!user.auth.googleId) {
        user.auth.googleId = googleId;
        if (!user.auth.authMethods.includes('google')) {
          user.auth.authMethods.push('google');
        }
        await user.save();
      } else if (user.auth.googleId !== googleId) {
        return res.status(401).json({ 
          error: 'This Google account is linked to a different user.' 
        });
      }
    } else if (password) {
      // Password Sign In Flow
      if (user.auth.password === null) {
        return res.status(401).json({ 
          error: 'This account can only be accessed via Google Sign In' 
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.auth.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password.' });
      }
    } else {
      return res.status(400).json({ error: 'No authentication method provided' });
    }

    // Create session and token
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    
    const sessionDeviceInfo = {
      deviceType: deviceInfo?.deviceType || 'unknown',
      browser: deviceInfo?.browser || 'unknown',
      platform: deviceInfo?.platform || 'unknown',
      os: deviceInfo?.os || 'unknown',
      ip: deviceInfo?.ip || req.ip
    };

    const session = new CurrentUser({
      userId: user._id,
      sessionToken: token,
      deviceInfo: sessionDeviceInfo,
      lastActive: new Date()
    });

    await session.save();

    // Prepare user object for response (same style for both Google and password login)
    const userObj = {
      _id: user._id,
      email: user.auth?.email,
      username: user.profile?.username,
      uniqueName: user.profile?.uniqueName,
      avatar: user.profile?.avatar,
      bio: user.profile?.bio || '',
      link: user.profile?.link || '',
      createdAt: user.meta?.createdAt,
      streak: user.progress?.streak || 0,
      level: user.progress?.level || 1,
      xp: user.progress?.xp || 0,
      lastStreak: user.progress?.lastStreak,
      profileCompleted: user.profileCompleted || false,
      completionPercentage: user.meta?.completionPercentage || 0,
      // Optionally add more fields as needed
    };

    res.status(200).json({ 
      message: 'Login successful', 
      token,
      user: userObj,
      deviceInfo: sessionDeviceInfo,
      authMethods: user.auth.authMethods
    });

    // Send login notification email asynchronously
    sendLoginNotification(email, sessionDeviceInfo).catch(console.error);

  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      code: error.code || 'AUTH_ERROR',
      message: 'Unable to complete sign-in process'
    });
  }
});

// Sign Out User (remove session)
router.post('/signout', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.warn('Signout attempted with no token');
      return res.status(400).json({ error: 'No token provided for signout' });
    }

    // Remove specific session instead of all sessions
    const deleted = await CurrentUser.findOneAndDelete({ 
      userId: userId,
      sessionToken: token
    });

    if (!deleted) {
      console.warn(`No session found for user ${userId} with token ${token}`);
      return res.status(200).json({ message: 'No active session found or already signed out' });
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Add new route to get all active sessions
router.get('/active-sessions', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const sessions = await CurrentUser.find({ userId })
      .select('deviceInfo lastActive createdAt')
      .sort('-lastActive');

    res.status(200).json({ 
      message: 'Active sessions retrieved successfully',
      sessions
    });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
});

// Add new route to terminate specific session
router.delete('/terminate-session/:sessionId', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    const session = await CurrentUser.findById(sessionId);
    if (!session || session.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized to terminate this session' });
    }

    await CurrentUser.findByIdAndDelete(sessionId);
    res.status(200).json({ message: 'Session terminated successfully' });
  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({ error: 'Failed to terminate session' });
  }
});

router.post('/update-streak', verifyToken, async (req, res) => {
  try {
    const { userId, streak } = req.body;
    
    // Validate the request
    if (!userId || streak === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify that the user making the request is updating their own streak
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to update this user\'s streak' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $set: {
          'progress.streak': streak,
          'progress.lastStreak': new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`Updated streak for user ${userId} to ${streak}`);
    res.json({ 
      success: true, 
      user: updatedUser,
      message: `Streak updated to ${streak} days`
    });

  } catch (error) {
    console.error('Streak update error:', error);
    res.status(500).json({ error: 'Failed to update streak' });
  }
});

// Add a route to get current streak
router.get('/get-streak/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own streak
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to view this user\'s streak' });
    }

    const user = await User.findById(userId)
      .select('progress.streak progress.lastStreak')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      streak: user.progress?.streak || 0,
      lastStreak: user.progress?.lastStreak || new Date(),
      message: 'Current streak retrieved successfully'
    });

  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({ error: 'Failed to get streak' });
  }
});

// Route to get current user data from CurrentUser model

router.get('/get-current-user', verifyToken, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    const [currentSession, userDocRaw] = await Promise.all([
      CurrentUser.findOne({
        userId: req.userId,
        sessionToken: token
      }),
      User.findById(req.userId)
        .select({
          '_id': 1,
          'auth.email': 1,
          'auth.password': 1,
          'profile.username': 1,
          'profile.uniqueName': 1,
          'profile.avatar': 1,
          'profile.bio': 1,
          'profile.link': 1,
          'progress.streak': 1,
          'progress.level': 1,
          'progress.xp': 1,
          'progress.lastStreak': 1,
          'meta.createdAt': 1,
          'meta.lastUpdated': 1,
          'goals': 1,
          'health': 1,
          'metrics': 1,
          'personal': 1,
          'subscriptions': 1,
          '__v': 1
        })
        .populate({
          path: 'subscriptions',
          options: { lean: false }
        })
    ]);

    if (!currentSession || !userDocRaw) {
      return res.status(401).json({
        error: userDocRaw ? 'Invalid session' : 'User not found',
        code: userDocRaw ? 'INVALID_SESSION' : 'USER_NOT_FOUND'
      });
    }

    // Use Mongoose doc for methods/virtuals
    const userDoc = userDocRaw;

    // --- Profile Completion Check ---
    const requiredFields = [
      { name: 'age', value: userDoc.personal?.age, check: v => Number(v) > 0 && Number(v) < 120 },
      { name: 'gender', value: userDoc.personal?.gender, check: v => ['male', 'female', 'other'].includes(v) },
      { name: 'height', value: userDoc.personal?.height, check: v => Number(v) > 0 && Number(v) < 300 },
      { name: 'weight', value: userDoc.personal?.weight, check: v => Number(v) > 0 && Number(v) < 500 },
      { name: 'activityLevel', value: userDoc.health?.activityLevel, check: v => ['light', 'moderate', 'active', 'very_active'].includes(v) },
      { name: 'bloodType', value: userDoc.health?.bloodType, check: v => v && v !== 'unknown' },
      { name: 'dietaryPreference', value: userDoc.goals?.dietaryPreference, check: v => ['no_preference', 'mediterranean', 'low_carb', 'high_protein', 'plant_based', 'balanced'].includes(v) }
    ];

    const completedFields = requiredFields.filter(field => field.check(field.value));
    const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
    const isProfileCompleted = completedFields.length === requiredFields.length;

    // Update profile completion in DB
    await User.findByIdAndUpdate(userDoc._id, {
      $set: {
        profileCompleted: isProfileCompleted,
        'meta.completionPercentage': completionPercentage
      }
    });

    // --- Replace S3 URLs with CDN ---
    const CDN_URL = 'https://cdn.trackeatfit.me';
    const avatar = typeof userDoc.profile?.avatar === 'string'
      ? userDoc.profile.avatar.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
      : null;

    // --- Only the most recent ACTIVE subscription ---
    const activeSubscriptions = (userDoc.subscriptions || [])
      .map(sub => new Subscription(sub))
      .filter(sub => sub.computedStatus === 'ACTIVE')
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    let subscriptions;
    if (activeSubscriptions.length > 0) {
      // Only include the most recent active subscription
      const mostRecent = activeSubscriptions[0];
      subscriptions = [{
        plan: mostRecent.plan,
        status: mostRecent.computedStatus,
        startDate: mostRecent.startDate,
        endDate: mostRecent.endDate,
        remainingDays: mostRecent.remainingDays
      }];
    } else {
      subscriptions = [{ plan: 'BASIC' }];
    }

    // --- Robust XP/Level/NextLevelXP calculation using model method ---
    const { level, xp, nextLevelXP } = userDoc.calculateLevelXP();

    // --- Final Response ---
    const responseUser = {
      _id: userDoc._id,
      email: userDoc.auth?.email,
      username: userDoc.profile?.username,
      uniqueName: userDoc.profile?.uniqueName,
      avatar,
      bio: userDoc.profile?.bio || '',
      link: userDoc.profile?.link || '',
      createdAt: userDoc.meta?.createdAt,
      streak: userDoc.progress?.streak || 0,
      level,
      xp,
      nextLevelXP,
      lastStreak: userDoc.progress?.lastStreak,
      profileCompleted: isProfileCompleted,
      completionPercentage,
      subscriptions
    };

    res.status(200).json({
      message: 'Current user fetched successfully',
      user: responseUser,
      session: {
        deviceInfo: currentSession.deviceInfo,
        lastActive: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({
      error: 'Unable to fetch current user. Please try again.',
      code: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// Add new route to update user level
router.post('/update-level', verifyToken, async (req, res) => {
  try {
    const { userId, level, xp } = req.body;
    
    // Validate the request
    if (!userId || level === undefined || xp === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify that the user making the request is updating their own level
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to update this user\'s level' });
    }

    // Use findOneAndUpdate to ensure atomic update
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { 
        $set: { 
          'progress.level': level,
          'progress.xp': xp
        }
      },
      { 
        new: true,
        runValidators: true,
        select: 'progress.level progress.xp' // Only return needed fields
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      success: true, 
      level: updatedUser.progress.level,
      xp: updatedUser.progress.xp,
      message: `Level updated to ${level} with ${xp} XP`
    });

  } catch (error) {
    console.error('Level/XP update error:', error);
    res.status(500).json({ error: 'Failed to update level and XP' });
  }
});

// Add route to get current level
router.get('/get-level/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own level
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to view this user\'s level' });
    }

    const user = await User.findById(userId)
      .select('progress.level progress.xp')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      level: user.progress?.level || 1,
      xp: user.progress?.xp || 0,
      message: 'Current level retrieved successfully'
    });

  } catch (error) {
    console.error('Get level error:', error);
    res.status(500).json({ error: 'Failed to get level' });
  }
});


// Update user health details
router.put('/health-details/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to update this user\'s details' });
    }

    const { personal, health, goals, metrics } = req.body;

    // Structure update data according to new schema
    const updateData = {      personal: {
        age: personal.age ? Number(personal.age) : null,
        gender: personal.gender,
        height: personal.height ? Number(personal.height) : null,
        weight: personal.weight ? Number(personal.weight) : null,
        targetWeight: personal.targetWeight ? Number(personal.targetWeight) : null,
        weightUnit: personal.weightUnit || 'kg'
      },
      health: {
        medicalConditions: health.medicalConditions || [],
        allergies: health.allergies || [],
        medications: health.medications || [],
        bloodType: health.bloodType || 'unknown',
        dietaryRestrictions: health.dietaryRestrictions || 'none',
        activityLevel: health.activityLevel || 'sedentary'
      },
      goals: {
        weightGoal: goals.weightGoal || 'maintain',
        mealFrequency: goals.mealFrequency || '3_meals',
        dietaryPreference: goals.dietaryPreference || 'no_preference',
        weeklyExerciseDays: goals.weeklyExerciseDays || 3,
        preferredExerciseTypes: goals.preferredExerciseTypes || []
      },
      metrics: {
        bmi: metrics.bmi,
        bmr: metrics.bmr,
        tdee: metrics.tdee,
        idealWeightRange: {
          min: metrics.idealWeightRange?.min,
          max: metrics.idealWeightRange?.max
        }
      },
      'meta.lastUpdated': new Date()
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: updatedUser,
      message: 'Health details updated successfully'
    });

  } catch (error) {
    console.error('Health details update error:', error);
    res.status(500).json({ 
      error: 'Failed to update health details',
      details: error.message 
    });
  }
});

// Get user health details
router.get('/health-details/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to view this user\'s details' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Include user details in response with nested structure
    const healthDetails = {
      username: user.profile?.username,
      personal: {
        age: user.personal?.age || null,
        gender: user.personal?.gender || 'select',
        height: user.personal?.height || null,
        weight: user.personal?.weight || null
      },
      health: {
        medicalConditions: user.health?.medicalConditions || [],
        allergies: user.health?.allergies || [],
        medications: user.health?.medications || [],
        bloodType: user.health?.bloodType || 'unknown',
        dietaryRestrictions: user.health?.dietaryRestrictions || 'none',
        activityLevel: user.health?.activityLevel || 'sedentary',
        supplementsUsed: user.health?.supplementsUsed || [],
        foodIntolerances: user.health?.foodIntolerances || []
      },
      goals: {
        weightGoal: user.goals?.weightGoal || 'maintain',
        mealFrequency: user.goals?.mealFrequency || '3_meals',
        dietaryPreference: user.goals?.dietaryPreference || 'no_preference',
        weeklyExerciseDays: user.goals?.weeklyExerciseDays || 3,
        preferredExerciseTypes: user.goals?.preferredExerciseTypes || []
      },
      metrics: {
        bmi: user.metrics?.bmi || null,
        bmr: user.metrics?.bmr || null,
        tdee: user.metrics?.tdee || null,
        idealWeightRange: user.metrics?.idealWeightRange || { min: null, max: null }
      },
      meta: {
        lastUpdated: user.meta?.lastUpdated || null,
        completionPercentage: user.meta?.completionPercentage || 0
      }
    };

    res.json({
      success: true,
      data: healthDetails,
      message: 'Health details retrieved successfully'
    });

  } catch (error) {
    console.error('Get health details error:', error);
    res.status(500).json({ error: 'Failed to get health details' });
  }
});

// Link authentication method
router.post('/link-auth', verifyToken, async (req, res) => {
  try {
    const { userId, method, googleId, password } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (method === 'google' && googleId) {
      // Check if googleId is already used
      const existingGoogleUser = await User.findOne({ 'auth.googleId': googleId });
      if (existingGoogleUser && existingGoogleUser._id.toString() !== userId) {
        return res.status(400).json({ error: 'This Google account is already linked to another user' });
      }
      
      user.auth.googleId = googleId;
      if (!user.auth.authMethods.includes('google')) {
        user.auth.authMethods.push('google');
      }
    } else if (method === 'password' && password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.auth.password = hashedPassword;
      if (!user.auth.authMethods.includes('password')) {
        user.auth.authMethods.push('password');
      }
    } else {
      return res.status(400).json({ error: 'Invalid method or missing credentials' });
    }

    await user.save();
    res.json({ message: `Successfully linked ${method} authentication`, user });
  } catch (error) {
    console.error('Error linking auth method:', error);
    res.status(500).json({ error: 'Failed to link authentication method' });
  }
});

// Unlink authentication method
router.post('/unlink-auth', verifyToken, async (req, res) => {
  try {
    const { userId, method } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow unlinking if it's the only auth method
    if (user.auth.authMethods.length === 1) {
      return res.status(400).json({ error: 'Cannot unlink the only authentication method' });
    }

    if (method === 'google') {
      user.auth.googleId = undefined;
      user.auth.authMethods = user.auth.authMethods.filter(m => m !== 'google');
    } else if (method === 'password') {
      user.auth.password = undefined;
      user.auth.authMethods = user.auth.authMethods.filter(m => m !== 'password');
    } else {
      return res.status(400).json({ error: 'Invalid authentication method' });
    }

    await user.save();
    res.json({ message: `Successfully unlinked ${method} authentication`, user });
  } catch (error) {
    console.error('Error unlinking auth method:', error);
    res.status(500).json({ error: 'Failed to unlink authentication method' });
  }
});

// Export the router
module.exports = router;
