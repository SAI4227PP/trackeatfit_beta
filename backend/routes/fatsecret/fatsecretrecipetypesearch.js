require('dotenv').config();
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

const CONSUMER_KEY = process.env.FATSECRET_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.FATSECRET_CONSUMER_SECRET;
const BASE_URL = process.env.BASE_URL_RECIPES;

if (!CONSUMER_KEY || !CONSUMER_SECRET || !BASE_URL) {
  throw new Error('Missing required environment variables for recipe search');
}

const generateNonce = () => uuidv4().replace(/-/g, "");

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

const fatsecretrecipetypesearch = async (
  searchExpression,
  maxResults = 20,
  region = "US",
  language = "en"
) => {
  const oauthParams = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: generateNonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000),
    oauth_version: "1.0",
    method: "recipes.search.v3",
    search_expression: searchExpression,
    format: "json",
    include_sub_categories: "true",
    flag_default_serving: "true",
    max_results: maxResults,
    language: language,
    region: region,
  };

  oauthParams.oauth_signature = generateOAuthSignature(
    "GET",
    BASE_URL,
    oauthParams,
    CONSUMER_SECRET
  );

  try {
    const response = await axios.get(BASE_URL, { params: oauthParams });
    return response.data;
  } catch (error) {
    console.error("FatSecret API Request Error:", error.response?.data || error.message);
    throw new Error("Failed to fetch data from FatSecret API");
  }
};

module.exports = { fatsecretrecipetypesearch };
