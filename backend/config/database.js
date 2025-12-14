require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const FITNESS_DB_URI = process.env.FITNESS_DB_URI;
const RECIPE_DB_URI = process.env.RECIPE_DB_URI;
const V2_FITNESS_DB_URI = process.env.V2_FITNESS_DB_URI;

// Common connection options
const connectionOptions = {
  maxPoolSize: 100,
  minPoolSize: 10,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 3000,
  family: 4,
  heartbeatFrequencyMS: 5000,
  appName: 'Nutrix-Backend',
  compressors: 'zlib',
//   useUnifiedTopology: true
};

// Store database connections and models
let mainConnection = null;
let fitnessConnection = null;
let recipeConnection = null;
let v2FitnessConnection = null;
let RecipeModel = null;

// Main database connection
const connectMainDB = async () => {
    try {
        if (!mainConnection) {
            await mongoose.connect(MONGODB_URI, connectionOptions);
            mainConnection = mongoose.connection;
            // Setup connection event listeners for main connection
            mainConnection.once('connected', () => {
                console.log('Connected to main MongoDB successfully!');
            });
            mainConnection.on('error', (err) => {
                console.error('Main MongoDB connection error:', err);
            });
            mainConnection.on('disconnected', () => {
                console.log('Main MongoDB connection disconnected');
            });
            console.log("Main MongoDB connection established");
        }
        return mainConnection;
    } catch (error) {
        console.error("Error connecting to main MongoDB:", error);
        process.exit(1);
    }
};

// Fitness database connection
const connectFitnessDB = async () => {
    try {
        if (!fitnessConnection) {
            fitnessConnection = await mongoose.createConnection(FITNESS_DB_URI, connectionOptions);

            fitnessConnection.once('connected', () => {
                console.log('Connected to Fitness Database successfully!');
            });

            fitnessConnection.on('error', (err) => {
                console.error('Fitness Database connection error:', err);
            });

            fitnessConnection.on('disconnected', () => {
                console.log('Fitness Database disconnected');
            });
        }
        return fitnessConnection;
    } catch (error) {
        console.error("Error connecting to Fitness Database:", error);
        process.exit(1);
    }
};

// Recipe database connection
const connectRecipeDB = async () => {
    try {
        if (!recipeConnection) {
            recipeConnection = await mongoose.createConnection(RECIPE_DB_URI, {
                ...connectionOptions,
                dbName: 'recipe_DB'
            });

            // Initialize Recipe model after successful connection
            const { schema } = require('../models/Recipe');
            RecipeModel = recipeConnection.model('Recipe', schema);

            recipeConnection.once('connected', () => {
                console.log('Connected to Recipe Database successfully!');
            });
        }
        return recipeConnection;
    } catch (error) {
        console.error("Error connecting to Recipe Database:", error);
        throw error;
    }
};

// V2 Fitness database connection
const connectV2FitnessDB = async () => {
    try {
        if (!v2FitnessConnection) {
            v2FitnessConnection = await mongoose.createConnection(V2_FITNESS_DB_URI, connectionOptions);

            v2FitnessConnection.once('connected', () => {
                console.log('Connected to V2 Fitness Database successfully!');
            });

            v2FitnessConnection.on('error', (err) => {
                console.error('V2 Fitness Database connection error:', err);
            });

            v2FitnessConnection.on('disconnected', () => {
                console.log('V2 Fitness Database disconnected');
            });
        }
        return v2FitnessConnection;
    } catch (error) {
        console.error("Error connecting to V2 Fitness Database:", error);
        process.exit(1);
    }
};

// Add initialization function
const initializeDatabases = async () => {
    try {
        // Connect to all databases in parallel for faster startup
        await Promise.all([
            connectMainDB(),
            connectFitnessDB(),
            connectRecipeDB(),
            connectV2FitnessDB()
        ]);
        console.log('All database connections established');
        return true;
    } catch (error) {
        console.error('Failed to initialize databases:', error);
        return false;
    }
};

// All connection functions reuse persistent connections, ensuring lower latency.

module.exports = {
    connectMainDB,
    connectFitnessDB,
    connectRecipeDB,
    connectV2FitnessDB,
    initializeDatabases,
    getMainConnection: () => mainConnection,
    getFitnessConnection: () => fitnessConnection,
    getRecipeConnection: () => recipeConnection,
    getRecipeModel: () => RecipeModel,
    getV2FitnessConnection: () => v2FitnessConnection
};
