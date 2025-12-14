require('dotenv').config();
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

const CONSUMER_KEY = process.env.FATSECRET_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.FATSECRET_CONSUMER_SECRET;

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  throw new Error('Missing required environment variables for recipe types');
}

// Static credentials (replace these with environment variables for production)
const BASE_URL = "https://platform.fatsecret.com/rest/recipe-types/v2";

// Generate a unique nonce for each request
const generateNonce = () => uuidv4().replace(/-/g, "");

// Generate the OAuth signature for the request
const generateOAuthSignature = (method, url, params, consumerSecret) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((obj, key) => {
      obj[key] = params[key];
      return obj;
    }, {});

  const parameterString = Object.keys(sortedParams)
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(sortedParams[key])}`
    )
    .join("&");

  const baseString = `${method.toUpperCase()}&${encodeURIComponent(
    url
  )}&${encodeURIComponent(parameterString)}`;

  const signingKey = `${encodeURIComponent(consumerSecret)}&`;

  const hmac = crypto.createHmac("sha1", signingKey);
  hmac.update(baseString);
  return hmac.digest("base64");
};

// FatSecret API request to get all recipe types
const fatsecretGetAllRecipeTypes = async () => {
  try {
    const recipeTypes = {
      recipe_types: {
        recipe_type: [
          "Appetizer",
          "Soup",
          "Main Dish",
          "Side Dish",
          "Baked",
          "Salad and Salad Dressing",
          "Sauce and Condiment",
          "Dessert",
          "Snack",
          "Beverage",
          "Other",
          "Breakfast",
          "Lunch"
        ]
      }
    };
    // Remove console.log and return data directly
    return recipeTypes;
  } catch (error) {
    throw new Error("Failed to get recipe types");
  }
};

module.exports = { fatsecretGetAllRecipeTypes };
