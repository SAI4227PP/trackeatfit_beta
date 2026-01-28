# TrackEatFit 🏋️‍♂️🥗💪

**Your All-in-One Health & Wellness Companion**

TrackEatFit is a comprehensive React Native mobile application built with Expo that combines nutrition tracking, fitness management, meal planning, and community features to help users achieve their health and wellness goals.

## 📱 Features

### 🍎 Nutrition & Diet
- **Smart Food Tracking**: Log meals with detailed nutritional information
- **Barcode Scanner**: Instantly scan food products for nutritional data
- **Image Recognition**: AI-powered food recognition from photos using Google Vision API
- **Recipe Search**: Browse thousands of recipes with detailed nutritional breakdowns
- **Meal Planning**: Create personalized diet plans with macronutrient tracking
- **AI Diet Assistant**: Gemini AI-powered chatbot for personalized diet recommendations
- **Micronutrient Analysis**: Track vitamins, minerals, and other micronutrients
- **Water & Hydration Tracking**: Monitor daily water intake

### 💪 Fitness & Exercise
- **Exercise Library**: Comprehensive database with 1000+ exercises
- **Exercise Programs**: Pre-designed workout programs for various fitness goals
- **Program Calendar**: Track and schedule your workout routines
- **Workout Sessions**: Log and track individual workout sessions with sets, reps, and weights
- **Exercise Recommendations**: AI-powered exercise suggestions based on goals
- **Muscle Visualization**: Interactive muscle group visualizations
- **Favorite Exercises**: Save and quickly access your preferred exercises
- **Text-to-Speech**: Audio guidance for exercise instructions

### 📊 Health Tracking
- **Google Fit Integration**: Sync steps, calories, and activity data
- **Bluetooth Device Support**: Connect health trackers via BLE
- **Sleep Tracking**: Monitor sleep patterns and duration
- **Weight Tracking**: Track weight progress over time
- **Calorie Monitoring**: Daily calorie intake and burn tracking
- **Activity Goals**: Set and monitor daily activity targets

### 👥 Social & Community
- **User Posts**: Share progress, recipes, and fitness tips
- **Social Feed**: Browse community content
- **Likes & Comments**: Engage with other users' posts
- **Friend System**: Add friends and follow other users
- **Real-time Chat**: Direct messaging with friends using Socket.IO
- **User Profiles**: Customizable profiles with stats and achievements
- **Saved Posts**: Bookmark favorite community content

### 🎯 Goals & Achievements
- **Goal Setting**: Define custom health and fitness objectives
- **Achievement System**: Earn badges for milestones and streaks
- **Progress Tracking**: Visualize progress with charts and statistics
- **Streak Monitoring**: Track daily consistency with reminders

### 💳 Premium Features
- **Subscription Plans**: Access premium features with Razorpay integration
- **Coupons & Discounts**: Apply promotional codes
- **Ad-free Experience**: Remove advertisements with premium membership

### 🔔 Notifications & Reminders
- **Meal Reminders**: Never miss a meal with scheduled alerts
- **Water Reminders**: Stay hydrated throughout the day
- **Exercise Reminders**: Daily workout notifications
- **Weight Tracking Reminders**: Weekly check-in prompts
- **Streak Reminders**: Maintain consistency with cron-based alerts

### 🎨 User Experience
- **Dark Mode**: Eye-friendly theme for night-time use
- **Multi-language Support**: Available in English, Hindi, and Telugu
- **Offline Support**: Core features work without internet
- **Haptic Feedback**: Tactile responses for better UX
- **Animations**: Smooth transitions using Moti and React Native Reanimated
- **Skeleton Loaders**: Fast-loading placeholders

## 🛠️ Technology Stack

### Frontend
- **Framework**: React Native 0.81.4 with React 19.1.0
- **Navigation**: Expo Router 6.0.7 (file-based routing)
- **UI Libraries**: 
  - React Native Paper 5.14.5
  - NativeWind 4.2.1 (Tailwind CSS)
  - Moti 0.30.0 (animations)
  - React Native Reanimated 4.1.0
- **State Management**: Context API (GlobalProvider, ThemeContext, etc.)
- **AI Integration**: Google Generative AI (Gemini)
- **Charts**: React Native Chart Kit
- **Media**: Expo Image, Expo Video, Expo Audio

### Backend
- **Server**: Node.js with Express 4.21.2
- **Database**: MongoDB with Mongoose 8.9.5
- **Caching**: Redis 4.7.1
- **Real-time**: Socket.IO 4.8.1
- **Authentication**: JWT & Firebase Auth
- **File Upload**: Multer & AWS S3
- **Security**: Helmet, bcrypt, express-rate-limit
- **Email**: Nodemailer
- **Payments**: Razorpay 2.9.6
- **Monitoring**: prom-client (Prometheus metrics)
- **Scheduled Tasks**: node-cron 4.1.0

### APIs & Services
- **FatSecret API**: Nutritional database and food information
- **Edamam API**: Recipe search and nutritional analysis
- **Google Cloud Vision**: Image recognition for food
- **Firebase**: Analytics, Push Notifications, Cloud Messaging
- **Google Fit**: Activity and health data synchronization
- **Bluetooth LE**: Device connectivity (react-native-ble-plx)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- MongoDB instance
- Redis server
- Android Studio (for Android development) or Xcode (for iOS)

### Frontend Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd simple
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Update `firebaseConfig.js` with your Firebase credentials
   - Add `google-services.json` for Android Firebase setup

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device/emulator**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file with:
   ```env
   PORT=3000
   MONGODB_URI=<your-mongodb-connection-string>
   JWT_SECRET=<your-jwt-secret>
   REDIS_URL=<your-redis-url>
   AWS_ACCESS_KEY=<your-aws-key>
   AWS_SECRET_KEY=<your-aws-secret>
   RAZORPAY_KEY_ID=<your-razorpay-key>
   RAZORPAY_KEY_SECRET=<your-razorpay-secret>
   FATSECRET_CLIENT_ID=<fatsecret-client-id>
   FATSECRET_CLIENT_SECRET=<fatsecret-client-secret>
   GOOGLE_CLOUD_PROJECT_ID=<google-cloud-project-id>
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **For proxy server (development)**
   ```bash
   npm run proxy
   ```

## 📂 Project Structure

```
simple/
├── app/                          # Main application screens
│   ├── (auth)/                   # Authentication screens
│   ├── (tabs)/                   # Tab-based navigation screens
│   ├── Community/                # Community features
│   ├── Home/                     # Home screen components
│   ├── notification/             # Notification screens
│   ├── Payment/                  # Payment & subscription
│   ├── posts/                    # Post detail screens
│   ├── screens/                  # Additional screens
│   ├── Workout/                  # Workout features
│   └── workout_pages/            # Workout detail pages
├── backend/                      # Node.js backend server
│   ├── config/                   # Configuration files
│   ├── Email/                    # Email templates & service
│   ├── middleware/               # Express middleware
│   ├── models/                   # MongoDB models
│   ├── routes/                   # API routes
│   │   ├── fatsecret/           # FatSecret API integration
│   │   ├── edamam/              # Edamam API integration
│   │   ├── Friends/             # Friend & chat features
│   │   ├── payment/             # Payment processing
│   │   ├── V2_fitnessDB/        # Fitness database routes
│   │   └── ...                  # Other route modules
│   ├── services/                 # Business logic services
│   └── utils/                    # Utility functions
├── components/                   # Reusable UI components
├── constants/                    # App constants & config
├── context/                      # React Context providers
├── hooks/                        # Custom React hooks
├── services/                     # Frontend services
├── translations/                 # i18n translations
├── utils/                        # Utility functions
└── assets/                       # Images, fonts, videos
```

## 🔧 Configuration Files

- `app.json` - Expo configuration
- `eas.json` - Expo Application Services config
- `tailwind.config.js` - TailwindCSS/NativeWind setup
- `tsconfig.json` - TypeScript configuration
- `metro.config.js` - Metro bundler configuration
- `eslint.config.js` - ESLint rules

## 📱 Available Scripts

### Frontend
```bash
npm start          # Start Expo development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm run lint       # Run ESLint
npm run reset-project  # Reset to clean state
```

### Backend
```bash
npm start          # Start production server
npm run proxy      # Start development proxy server
```

## 🔐 Authentication

- Firebase Authentication
- JWT token-based auth
- OTP verification for password reset
- Google Sign-In integration
- Session management with AsyncStorage

## 🗄️ Database Schema

### Main Database
- Users
- Posts
- Comments
- Likes
- Friends
- LoggedFoods
- Achievements
- Subscriptions
- Notifications

### Fitness Database
- Exercises
- Programs
- WorkoutSessions
- BodyParts
- Muscles
- Equipment

## 🔌 API Endpoints

### User Management
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile

### Nutrition
- `POST /api/logged-food` - Log food entry
- `GET /api/fatsecret/search` - Search foods
- `GET /api/fatsecret/recipe/:id` - Get recipe details
- `POST /api/fatsecret/barcode` - Barcode scan
- `POST /api/fatsecret/image` - Image recognition

### Fitness
- `GET /api/exercises` - Get exercises
- `GET /api/programs` - Get workout programs
- `POST /api/workout-session` - Log workout
- `POST /api/favorite-exercise` - Save favorite

### Social
- `GET /api/posts` - Get posts feed
- `POST /api/posts` - Create post
- `POST /api/likes` - Like post/comment
- `POST /api/comments` - Add comment
- `POST /api/friends/request` - Send friend request

### Payment
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment
- `GET /api/subscription` - Get subscription status

## 🎨 Theme & Styling

- Dark/Light mode support
- Premium gradient themes (Gold, Orange, Purple)
- Responsive design with Tailwind utilities
- Consistent color palette
- Smooth animations and transitions

## 📊 Analytics & Monitoring

- Firebase Analytics for user behavior
- Prometheus metrics on backend
- Error tracking and logging
- Performance monitoring
- User activity tracking

## 🔔 Push Notifications

- Firebase Cloud Messaging (FCM)
- Notifee for local notifications
- Real-time SSE (Server-Sent Events)
- WebSocket for live updates
- Scheduled cron-based reminders

## 🌐 Deployment

### Frontend (Expo)
- Build using EAS (Expo Application Services)
- Deploy to Google Play Store / Apple App Store

### Backend
- Deploy to cloud platforms (Render, AWS, Heroku)
- Use PM2 for process management
- Set up load balancing for scalability
- Configure SSL/HTTPS

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and queries:
- Email: support@trackeatfit.com
- Create an issue in the repository

## 🙏 Acknowledgments

- Expo team for the amazing framework
- FatSecret & Edamam for nutrition APIs
- React Native community
- All open-source contributors

---

**Version**: 1.0.2  
**Last Updated**: December 2025  
**Developed with** ❤️ **by TrackEatFit Team**
