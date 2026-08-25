const mongoose = require("mongoose");
const Subscription = require("./Subscription/SubscriptionSchema");

const userSchema = new mongoose.Schema({
  auth: {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      index: true,
      validate: {
        validator: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        message: "Invalid email format",
      },
    },
    password: {
      type: String,
      required: false,
      minlength: 8,
      validate: {
        validator: function (value) {
          // Only validate if password is provided
          return !value || value.length >= 8;
        },
        message: "Password must be at least 8 characters long.",
      },
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    authMethods: [
      {
        type: String,
        enum: ["password", "google"],
        required: true,
      },
    ],
  },
  profile: {
    username: {
      type: String,
      required: true,
    },
    uniqueName: {
      type: String,
      required: true,
      unique: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      match: /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/,
      default: "",
    },
  },
  progress: {
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastStreak: {
      type: Date,
      default: Date.now,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  personal: {
    age: {
      type: Number,
      validate: {
        validator: function (v) {
          return v === null || (v >= 13 && v <= 120);
        },
        message: "Age must be between 13 and 120",
      },
    },
    gender: String,
    birthDate: Date,
    height: {
      type: Number,
      validate: {
        validator: function (v) {
          return v === null || (v > 0 && v < 300);
        },
        message: "Height must be between 0 and 300 cm",
      },
    },
    weight: {
      type: Number,
      validate: {
        validator: function (v) {
          return v === null || (v > 0 && v < 500);
        },
        message: "Weight must be between 0 and 500 kg",
      },
    },
    targetWeight: {
      type: Number,
      validate: {
        validator: function (v) {
          return v === null || (v > 0 && v < 500);
        },
        message: "Target weight must be between 0 and 500 kg",
      },
    },
    weightUnit: {
      type: String,
      enum: ["kg", "lbs"],
      default: "kg",
    },
  },
  health: {
    medicalConditions: [String],
    allergies: [String],
    medications: [String],
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
      default: "sedentary",
    },
    bloodType: {
      type: String,
      enum: [
        "a_positive",
        "a_negative",
        "b_positive",
        "b_negative",
        "ab_positive",
        "ab_negative",
        "o_positive",
        "o_negative",
        "unknown",
      ],
      default: "unknown",
    },
    dietaryRestrictions: {
      type: String,
      enum: ["none", "vegetarian", "vegan", "pescatarian", "keto", "paleo"],
      default: "none",
    },
    supplementsUsed: [String],
    foodIntolerances: [String],
  },
  goals: {
    weightGoal: {
      type: String,
      enum: ["maintain", "lose", "gain"],
      default: "maintain",
    },
    mealFrequency: {
      type: String,
      enum: ["2_meals", "3_meals", "4_meals", "5_meals", "6_meals"],
      default: "3_meals",
    },
    dietaryPreference: {
      type: String,
      enum: [
        "no_preference",
        "mediterranean",
        "low_carb",
        "high_protein",
        "plant_based",
        "balanced",
      ],
      default: "no_preference",
    },
    weeklyExerciseDays: Number,
    preferredExerciseTypes: [String],
  },
  metrics: {
    bmi: Number,
    bmr: Number,
    tdee: Number,
    idealWeightRange: {
      min: Number,
      max: Number,
    },
  },
  meta: {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: Date,
  },
  profileCompleted: {
    type: Boolean,
    default: false,
  },

  // Reference to user's subscription(s)
  subscriptions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
  ],

  // Meal schedule for custom notification times
  mealSchedule: {
    meals: [
      {
        id: { type: Number },
        type: { type: String, required: true },
        time: { type: mongoose.Schema.Types.Mixed }, // Accept Date or String for flexibility
      },
    ],
    preferences: {
      reminderTime: { type: Number, default: 15 }, // Minutes before meal
      weekendSchedule: { type: Boolean, default: true },
    },
  },

  // Water reminder schedule (interval in hours with time range)
  waterReminderSchedule: {
    intervalHours: { type: Number, default: 2, min: 1, max: 12 },
    startTime: { type: mongoose.Schema.Types.Mixed, default: "08:00" }, // Accept Date or String (HH:MM format)
    endTime: { type: mongoose.Schema.Types.Mixed, default: "22:00" }, // Accept Date or String (HH:MM format)
  },
});

// Add method to safely return user data without sensitive fields
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.auth.password;
  delete obj.__v;
  return obj;
};

// Add method to validate password strength
userSchema.statics.validatePassword = function (password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long",
    };
  }
  if (!hasUpperCase || !hasLowerCase) {
    return {
      isValid: false,
      message: "Password must include both upper and lower case letters",
    };
  }
  if (!hasNumbers) {
    return {
      isValid: false,
      message: "Password must include at least one number",
    };
  }
  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: "Password must include at least one special character",
    };
  }

  return { isValid: true };
};

// Add middleware to sanitize data before save
userSchema.pre("save", function (next) {
  // Trim strings
  if (this.profile.username)
    this.profile.username = this.profile.username.trim();
  if (this.profile.uniqueName)
    this.profile.uniqueName = this.profile.uniqueName.trim().toLowerCase();
  if (this.auth.email) this.auth.email = this.auth.email.trim().toLowerCase();

  // Ensure arrays are unique
  if (this.health.medicalConditions) {
    this.health.medicalConditions = [...new Set(this.health.medicalConditions)];
  }
  if (this.health.allergies) {
    this.health.allergies = [...new Set(this.health.allergies)];
  }

  // Update lastUpdated timestamp
  this.meta.lastUpdated = new Date();
  next();
});

// Add compound indexes for better query performance
userSchema.index({ "auth.email": 1, "profile.username": 1 });
userSchema.index({ "profile.uniqueName": 1 });
// Add indexes for commonly queried fields
userSchema.index({ "profile.username": 1 });
userSchema.index({ "auth.googleId": 1 }, { sparse: true });
userSchema.index({ "meta.lastUpdated": -1 });

// Add virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.profile.firstName || ""} ${this.profile.lastName || ""}`.trim();
});

// Update completion percentage virtual
userSchema.virtual("profileCompletionPercentage").get(function () {
  const requiredFields = [
    {
      path: "personal.age",
      value: this.personal?.age,
      check: (v) => Number(v) > 0 && Number(v) < 120,
    },
    {
      path: "personal.gender",
      value: this.personal?.gender,
      check: (v) => ["male", "female", "other"].includes(v),
    },
    {
      path: "personal.height",
      value: this.personal?.height,
      check: (v) => Number(v) > 0 && Number(v) < 300,
    },
    {
      path: "personal.weight",
      value: this.personal?.weight,
      check: (v) => Number(v) > 0 && Number(v) < 500,
    },
    {
      path: "health.activityLevel",
      value: this.health?.activityLevel,
      check: (v) => v !== "sedentary",
    },
    {
      path: "health.bloodType",
      value: this.health?.bloodType,
      check: (v) => v !== "unknown",
    },
    {
      path: "goals.dietaryPreference",
      value: this.goals?.dietaryPreference,
      check: (v) =>
        [
          "no_preference",
          "mediterranean",
          "low_carb",
          "high_protein",
          "plant_based",
          "balanced",
        ].includes(v),
    },
  ];

  const completedFields = requiredFields.filter((field) => {
    if (!field.value) return false;
    return field.check(field.value);
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
});

// --- Level/XP Table (shared logic) ---
const LEVELS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 50 },
  { level: 3, xp: 100 },
  { level: 4, xp: 200 },
  { level: 5, xp: 350 },
  { level: 6, xp: 550 },
  { level: 7, xp: 800 },
  { level: 8, xp: 1100 },
  { level: 9, xp: 1450 },
  { level: 10, xp: 1850 },
];

// --- Level/XP Calculation Method ---
userSchema.methods.calculateLevelXP = function () {
  // XP calculation logic (expand as needed)
  const streak = this.progress?.streak || 0;
  // Optionally include calories and exercise if stored in user doc:
  // const foodCalories = this.metrics?.foodCalories || 0;
  // const goalCalories = this.metrics?.goalCalories || 1; // avoid division by zero
  // const exerciseCalories = this.metrics?.exerciseCalories || 0;

  // If you want to use only streak (current logic):
  let streakFactor = streak * 5;
  let streakMultiplier = streak >= 7 ? 1.2 : 1;
  let totalXP = Math.floor(streakFactor * streakMultiplier);

  // If you want to use calories/exercise as in frontend, uncomment and adjust:
  // const workoutsFactor = exerciseCalories / 100;
  // const goalsFactor = (foodCalories / goalCalories) * 10;
  // let totalXP = Math.floor((workoutsFactor + streakFactor + goalsFactor) * streakMultiplier);

  // Determine level
  let currentLevel = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xp) {
      currentLevel = LEVELS[i].level;
      break;
    }
  }

  // Next level XP
  let nextLevelXP = null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (LEVELS[i].level === currentLevel + 1) {
      nextLevelXP = LEVELS[i].xp;
      break;
    }
  }
  if (nextLevelXP === null) {
    nextLevelXP = LEVELS[LEVELS.length - 1].xp; // Max level
  }

  return {
    level: currentLevel,
    xp: totalXP,
    nextLevelXP,
  };
};

// Update pre-save middleware
userSchema.pre("save", function (next) {
  // Profile completion logic (existing)
  const requiredFields = [
    {
      name: "age",
      path: "personal.age",
      value: this.personal?.age,
      check: (v) => Number(v) > 0 && Number(v) < 120,
    },
    {
      name: "gender",
      path: "personal.gender",
      value: this.personal?.gender,
      check: (v) => ["male", "female", "other"].includes(v),
    },
    {
      name: "height",
      path: "personal.height",
      value: this.personal?.height,
      check: (v) => Number(v) > 0 && Number(v) < 300,
    },
    {
      name: "weight",
      path: "personal.weight",
      value: this.personal?.weight,
      check: (v) => Number(v) > 0 && Number(v) < 500,
    },
    {
      name: "activityLevel",
      path: "health.activityLevel",
      value: this.health?.activityLevel || "sedentary",
      check: (v) =>
        v && ["light", "moderate", "active", "very_active"].includes(v),
    },
    {
      name: "bloodType",
      path: "health.bloodType",
      value: this.health?.bloodType,
      check: (v) => v && v !== "unknown",
    },
    {
      name: "dietaryPreference",
      path: "goals.dietaryPreference",
      value: this.goals?.dietaryPreference,
      check: (v) =>
        [
          "no_preference",
          "mediterranean",
          "low_carb",
          "high_protein",
          "plant_based",
          "balanced",
        ].includes(v),
    },
  ];
  const completedFields = requiredFields.filter((field) =>
    field.check(field.value),
  );
  const completionPercentage = Math.round(
    (completedFields.length / requiredFields.length) * 100,
  );
  if (!this.meta) {
    this.meta = {};
  }
  this.meta.completionPercentage = completionPercentage;
  this.profileCompleted = completionPercentage === 100;
  this.meta.lastUpdated = new Date();

  // --- Level and XP calculation based on streak (and optionally other factors) ---
  // Use the shared method for calculation
  const { level, xp } = this.calculateLevelXP();
  this.progress = this.progress || {};
  this.progress.level = level;
  this.progress.xp = xp;

  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
