const express = require("express");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

const router = express.Router();

// Static credentials (Replace with your actual FatSecret credentials)
const CONSUMER_KEY = "523da1c5f8bb44ebb2115101fea54ece";
const CONSUMER_SECRET = "8e66f0e7b2f04f4ca47b6af96c0639db";
const BASE_URL = "https://platform.fatsecret.com/rest/recipes/search/v3";

// Helper Functions
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

// FatSecret Recipe Search
const fatsecretRecipeSearch = async (query, maxResults = 10) => {
  const oauthParams = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: generateNonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000),
    oauth_version: "1.0",
    search_expression: query,
    format: "json",
    max_results: maxResults,
    language: "en",
    region: "US",
  };

  oauthParams.oauth_signature = generateOAuthSignature(
    "GET",
    BASE_URL,
    oauthParams,
    CONSUMER_SECRET
  );

  const response = await axios.get(BASE_URL, { params: oauthParams });
  return response.data;
};

module.exports = { fatsecretRecipeSearch };