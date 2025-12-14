require('dotenv').config();
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

const CONSUMER_KEY = process.env.FATSECRET_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.FATSECRET_CONSUMER_SECRET;
const BASE_URL = process.env.BASE_URL_FOOD;

if (!CONSUMER_KEY || !CONSUMER_SECRET || !BASE_URL) {
  throw new Error('Missing required environment variables for food details');
}

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

// FatSecret API request to get food details by food_id
const fatsecretGetFoodById = async (foodId, CONSUMER_KEY, CONSUMER_SECRET) => {
  const oauthParams = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: generateNonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000),
    oauth_version: "1.0",
    method: "food.get.v4",
    food_id: foodId, // The unique food ID
    format: "json",
  };

  // Generate OAuth signature and add it to the parameters
  oauthParams.oauth_signature = generateOAuthSignature(
    "GET",
    BASE_URL,
    oauthParams,
    CONSUMER_SECRET
  );

  // Make the API request to get food details
  const response = await axios.get(BASE_URL, { params: oauthParams });
  return response.data;
};

module.exports = { fatsecretGetFoodById };