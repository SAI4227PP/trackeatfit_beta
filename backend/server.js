require('dotenv').config();
const express = require("express");
const { connectRedis } = require('./config/redis'); // Import Redis connection
const helmet = require("helmet");
const compression = require('compression');
const mongoose = require('mongoose'); // Add this line at the top with other imports
const { connectMainDB, connectFitnessDB, connectV2FitnessDB, initializeDatabases } = require('./config/database');
// V2 Fitness DB routes
const v2ExercisesRoute = require('./routes/V2_fitnessDB/V2_exercises');
const v2BodyPartsRoute = require('./routes/V2_fitnessDB/bodyparts');
const v2EquipmentsRoute = require('./routes/V2_fitnessDB/equipments');
const v2ExercisesMainRoute = require('./routes/V2_fitnessDB/exercises');
const v2ExerciseTypesRoute = require('./routes/V2_fitnessDB/exercisetypes');
const v2MusclesRoute = require('./routes/V2_fitnessDB/muscles');
const v3ExercisesRoute = require('./routes/V2_fitnessDB/V3_exercises'); // Import V3 exercises route
const FavoriteExerciseRoute = require('./routes/V2_fitnessDB/FavoriteExercise'); // Import FavoriteExecrise route
const ExerciseProgram = require('./routes/V2_fitnessDB/Program/ExerciseProgram'); // Import exercise program route
const UserProgramProgress = require('./routes/V2_fitnessDB/Program/UserProgramProgress'); // Import user program progress route
const ExerciseRecommendation = require('./routes/V2_fitnessDB/Recommendation/ExerciseRecommendation'); // Import exercise recommendation route
const WorkoutRoutes = require('./routes/V2_fitnessDB/Program/workoutSession'); // Import workout routes
const Payment = require('./routes/payment/payment'); // Import payment routes
const couponRoutes = require('./routes/payment/coupon'); // Import coupon routes
const plansRoutes = require('./routes/payment/plan'); // Import plans routes
const Subscription = require('./routes/Subscription/Subscription'); // Import subscription routes
const cors = require("cors");
const bodyParser = require("body-parser");
const { sendWelcomeEmail } = require("./Email/email");
const { fatsecretRequest } = require("./routes/fatsecret/fatsecret");
const {fatsecretGetFoodById} = require("./routes/fatsecret/fatsecretGetFoodById");
const { fatsecretGetAllRecipeTypes } = require("./routes/fatsecret/fatsecretGetAllRecipeTypes"); // Adjust import path
const { fatsecretrecipetypesearch } = require("./routes/fatsecret/fatsecretrecipetypesearch");
const { fatsecretRecipeSearch } = require("./routes/fatsecret/fatsecretrecipesearch");
const { fatsecretGetRecipeById } = require("./routes/fatsecret/fatsecretGetRecipeById");
const { fatsecretBarcodeSearch } = require("./routes/fatsecret/fatsecertbarcodescan");
const userRoutes = require('./routes/userRoutes');
const userSearchRoutes = require('./routes/userSearch');
const macronutrientRoutes = require('./routes/MacronutrientDataRoute');
const userGoalsRoutes = require('./routes/userGoalsroute');
const loggedFoodRoutes = require('./routes/loggedFoodRoute');
const postsRouter = require('./routes/postsRoute'); // Import the posts router
const likeRoutes = require('./routes/LikeRoute');  // Import the like routes
const commentRoutes = require('./routes/CommentRoute');  // Adjust the path as necessary
const commentLikeRoutes = require('./routes/CommentlikesRoute'); // Adjust the path
const achievementRoutes = require('./routes/achievementRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes'); // Add this line
const authRoutes = require('./routes/auth'); // Add this line
const { sseMiddleware, setupWebSocket } = require('./middleware/sseMiddleware'); // Import SSE middleware and WebSocket setup
const { imageRecognition } = require("./routes/fatsecret/imagerecognition");
const bodyPartsRoute = require('./routes/fitnessAppDB/bodyPartsRoute');
const equipmentRoute = require('./routes/fitnessAppDB/equipmentRoute');
const exercisesRoute = require('./routes/fitnessAppDB/exercisesRoute');
const notificationroute = require('./routes/notificationSettings'); // Import the notification settings route
const sleepRoutes = require('./routes/sleepRoutes'); // Import the sleep routes
const edamamRoutes = require('./routes/edamam/edamamrecipes'); // Import the Edamam routes
const friendRoutes = require('./routes/Friends/friends'); // Import friends route
const followingRoutes = require('./routes/followingRoute'); // Import following route
const http = require('http');
const socketIo = require('socket.io');
const { getFirebaseStatus } = require('./config/firebase-config');
const chatRoutes = require('./routes/Friends/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const cron = require('node-cron');
const { checkAndSendStreakReminders } = require('./routes/streakRoutes');
const userActivityRoutes = require('./routes/userActivityRoutes');
const savedPostsRoutes = require('./routes/savedPosts'); // Add saved posts routes
const { fixUserPostCacheInconsistencies } = require('./utils/postRedisService');

const app = express();
const PORT = process.env.PORT || 3000; // Change port to 5000

const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics(); // Collect Node.js default metrics

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.75, 1, 1.5, 2, 3, 5] // Time buckets in seconds
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Track all requests
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.path, code: res.statusCode });
  });
  next();
});

// Create HTTP server
// const https = require("https");
// const fs = require("fs");
// const options={
//   key:fs.readFileSync('./certs/key.pem'),
//   cert:fs.readFileSync('./certs/cert.pem'),
//   minVersion: 'TLSv1.2',
//   maxVersion: 'TLSv1.3'
// }
// const server = https.createServer(options, app);

const server = http.createServer(app);

// Add WebSocket support for events
setupWebSocket(server);

// Keep-alive and headers timeout settings
server.keepAliveTimeout = 60000; // 60 seconds
server.headersTimeout = 65000; // 65 seconds - slightly higher than keepAliveTimeout

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://healthifyme-o9qv.onrender.com', 'https://v1.trackeatfit.xyz', 'https://trackeatfit.onrender.com'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store io instance on app
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join chat room
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  // Leave chat room
  socket.on('leave_chat', (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left chat ${chatId}`);
  });

  // Handle typing events
  socket.on('typing_start', ({ chatId, userId }) => {
    socket.to(chatId).emit('typing_start', { userId });
  });

  socket.on('typing_end', ({ chatId, userId }) => {
    socket.to(chatId).emit('typing_end', { userId });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// app.use(compression()); // compress first

// Add global SSE middleware first
app.use(sseMiddleware);

// Update CORS configuration to handle SSE
app.use(cors({
  origin: ['http://localhost:3000', 'https://healthifyme-o9qv.onrender.com','https://v1.trackeatfit.xyz', 'https://trackeatfit.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));


// Add Helmet middleware for security
app.use(helmet());

// Configure CSP if needed
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.fatsecret.com", "https://healthifyme-o9qv.onrender.com", "https://v1.trackeatfit.xyz", "https://trackeatfit.onrender.com"],
  }
}));


app.use(bodyParser.json());

// Remove static credentials and use environment variables
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const CONSUMER_KEY = process.env.FATSECRET_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.FATSECRET_CONSUMER_SECRET;

app.post("/send-welcome-email", async (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: "Username and email are required." });
  }

  try {
    await sendWelcomeEmail(username, email, GMAIL_USER, GMAIL_PASS);
    res.status(200).send({ message: "Welcome email sent successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send welcome email." });
  }
});

app.post("/search", async (req, res) => {
  const { query, page = 0, maxResults = 20 } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required." });
  }

  try {
    const data = await fatsecretRequest(query, page, maxResults);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search route to get food details by food_id
app.post("/get-food-by-id", async (req, res) => {
  const { foodId } = req.body;

  if (!foodId) {
    return res.status(400).json({ error: "Food ID is required." });
  }

  try {
    const data = await fatsecretGetFoodById(foodId, CONSUMER_KEY, CONSUMER_SECRET);
    res.json(data); // Return the detailed food data
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// // Search route to get food by barcode
// app.post("/search-by-barcode", async (req, res) => {
//   const { barcode, market } = req.body;

//   if (!barcode) {
//     return res.status(400).json({ error: "Barcode is required." });
//   }

//   try {
//     // Use US market as default if not specified
//     const data = await fatsecretBarcodeSearch(barcode, market || 'US');
    
//     if (data && data.food) {
//       res.json(data);
//     } else {
//       // If no food found with the barcode
//       res.status(404).json({ error: "No food found with the provided barcode." });
//     }
//   } catch (error) {
//     console.error('Barcode search error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// Route to get all recipe types
app.get("/get-recipe-types", async (req, res) => {
  try {
    const data = await fatsecretGetAllRecipeTypes();
    res.json(data); // Return the recipe types
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post("/recipe-type-search", async (req, res) => {
  const { recipe_type } = req.body;

  if (!recipe_type) {
    return res.status(400).json({ error: "Recipe type is required." });
  }

  try {
    const data = await fatsecretrecipetypesearch(recipe_type);
    if (data.recipes && data.recipes.recipe) {
      res.json(data);
    } else {
      res.status(404).json({ error: "No recipes found for the specified recipe type." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/search/recipes", async (req, res) => {
  const { query, maxResults } = req.body; // Use req.body for POST data

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required." });
  }

  try {
    const recipes = await fatsecretRecipeSearch(query, maxResults || 10);
    return res.status(200).json({ success: true, recipes });
  } catch (error) {
    console.error("Error fetching recipes:", error.message);
    return res.status(500).json({ error: "Failed to fetch recipes." });
  }
});

// Express route to get recipe details by recipe_id
app.post("/get-recipe-by-id", async (req, res) => {
  const { recipe_id } = req.body;

  if (!recipe_id) {
    return res.status(400).json({ error: "Recipe ID is required." });
  }  try {
    const data = await fatsecretGetRecipeById(recipe_id);
    res.json(data); // Return the detailed recipe data
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Express route to search food by barcode
app.post("/search-by-barcode", async (req, res) => {
  const { barcode, market } = req.body;

  if (!barcode) {
    return res.status(400).json({ error: "Barcode is required." });
  }

  // Normalize market value for FatSecret API
  let normalizedMarket = (market || 'US').toUpperCase();
  if (normalizedMarket === 'INDIA') normalizedMarket = 'IN';

  try {
    // Log the barcode and market for debugging
    console.log(`FatSecret barcode search: barcode=${barcode}, market=${normalizedMarket}`);
    const data = await fatsecretBarcodeSearch(barcode, normalizedMarket);
    
    // Check if food was found
    if (data && data.food) {
      res.json(data); // Return the food data
    } else {
      console.error(`No food found for barcode: ${barcode}, market: ${normalizedMarket}`);
      res.status(404).json({ error: "No food found with this barcode." });
    }
  } catch (error) {
    console.error("Barcode search error:", error.message, { barcode, market: normalizedMarket });
    res.status(500).json({ error: error.message });
  }
});

app.post("/image-recognition", async (req, res) => {
  const { imageData } = req.body;

  if (!imageData) {
    return res.status(400).json({ error: "Image data is required." });
  }

  try {
    const data = await imageRecognition(imageData);
    res.json(data);
  } catch (error) {
    console.error("Image Recognition Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update the health check endpoint
app.get('/health', (req, res) => {
  const mainDBStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const fitnessDBStatus = mongoose.connections[1]?.readyState === 1 ? 'connected' : 'disconnected';
  const firebaseStatus = getFirebaseStatus();

  res.json({
    status: 'healthy',
    databases: {
      main: mainDBStatus,
      fitness: fitnessDBStatus,
      firebase: firebaseStatus
    },
    timestamp: new Date().toISOString()
  });
});

// Update how we mount the posts router
app.use('/posts', postsRouter);

// Routes
app.use('/users', userRoutes); 
app.use('/UserSearch', userSearchRoutes);
app.use('/auth', authRoutes); // for otp verification

app.use('/macronutrient', macronutrientRoutes);

app.use('/user-goals', userGoalsRoutes);

app.use('/logged-food', loggedFoodRoutes);

app.use('/posts-likes', likeRoutes);  // Mount the routes under /posts

app.use('/comments', commentRoutes);

app.use('/comment-likes', commentLikeRoutes);

app.use('/saved-posts', savedPostsRoutes); // Add saved posts routes

app.use('/achievements', achievementRoutes);

app.use('/favorites', favoriteRoutes); // Add this line


// Fitness routes
app.use('/api/bodyparts', bodyPartsRoute);
app.use('/api/equipment', equipmentRoute);
app.use('/api/exercises', exercisesRoute);

// V2 Fitness DB routes
app.use('/api/v2/bodyparts', v2BodyPartsRoute);
app.use('/api/v2/equipments', v2EquipmentsRoute);
app.use('/api/v2/exercises', v2ExercisesMainRoute);
app.use('/api/v2/exercisetypes', v2ExerciseTypesRoute);
app.use('/api/v2/muscles', v2MusclesRoute);
app.use('/api/v2/v2_exercises', v2ExercisesRoute);
app.use('/api/v3/v3_exercises', v3ExercisesRoute);
app.use('/api/v3/favorite-exercise', FavoriteExerciseRoute);

// V2 Fitness DB Program routes
app.use('/api/v3/programs', ExerciseProgram); // Mount the exercise program routes

// Mount the user program progress routes
app.use('/api/v3/user-program-progress', UserProgramProgress);

app.use('/api/v3/workouts', WorkoutRoutes); // Mount the workout routes
// Mount the exercise recommendation routes
app.use('/api/v3/recommendation', ExerciseRecommendation);

// payment routes
app.use('/api/payment', Payment); // Mount the payment routes 

// Mount the plans routes
app.use('/api/plans', plansRoutes);

// Mount the coupon routes
app.use('/api/coupon', couponRoutes);

app.use('/api/subscription', Subscription); // Mount the subscription routes

// Mount the recipe routes
app.use('/api/recipes', require('./routes/recipeRoutes'));

app.use('/api/notification-settings', notificationroute);

app.use('/api/sleep', sleepRoutes); // Mount the sleep routes

app.use('/api/edamam', edamamRoutes); // Mount the Edamam routes

app.use('/api/friends', friendRoutes); // Mount friends route with auth
app.use('/api/following', followingRoutes); // Mount following route

// Add chat routes
app.use('/api/chats', chatRoutes);

// Add notification routes
app.use('/api/notifications', notificationRoutes);

// Add streak routes
app.use('/api/streaks', require('./routes/streakRoutes').router);

// Add user activity routes
app.use('/api/user-activity', userActivityRoutes);


// Add saved posts routes
app.use('/api/saved-posts', savedPostsRoutes);

// Mount dynamic entity route for Redis-first actions
const dynamicEntityRoute = require('./routes/dynamicEntityRoute');
app.use('/api/entity', dynamicEntityRoute);

// Schedule streak reminder check every day at 12 PM
cron.schedule('0 12 * * *', async () => {
  console.log('Running streak reminder check...');
  await checkAndSendStreakReminders();
});

// Schedule cache consistency check every 1 minute
// cron.schedule('* * * * *', async () => {
//   console.log('Running Redis post cache consistency check...');
//   await fixUserPostCacheInconsistencies();
// });

// Update server start
const startServer = async () => {
    try {
        await initializeDatabases();
        const redisConnected = await connectRedis();
        if (!redisConnected) {
            console.warn('Redis unavailable at startup. Server will continue without Redis-backed cache.');
        }
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
