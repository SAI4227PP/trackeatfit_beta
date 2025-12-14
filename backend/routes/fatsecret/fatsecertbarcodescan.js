// filepath: c:\NutrixPath\backend\routes\fatsecertbarcodescan.js
require('dotenv').config();
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

const CONSUMER_KEY = process.env.FATSECRET_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.FATSECRET_CONSUMER_SECRET;
const BASE_URL = "https://platform.fatsecret.com/rest/food/barcode/find-by-id/v1";

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  throw new Error('Missing required environment variables for barcode scanning');
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

/**
 * Convert various barcode formats to GTIN-13
 * UPC-A, EAN-13, EAN-8 to GTIN-13
 * UPC-E needs to be converted to UPC-A first, then to GTIN-13
 * @param {string} barcode - The barcode to convert
 * @returns {string} - GTIN-13 formatted barcode
 */
const convertToGTIN13 = (barcode) => {
  // Remove any non-digit characters
  let cleanBarcode = barcode.replace(/\D/g, '');
  
  // Handle different barcode types
  if (cleanBarcode.length === 8) {
    // EAN-8: Convert to GTIN-13 by adding zeros in front
    // Format: 000 + EAN-8 + check digit (already included)
    return '00000' + cleanBarcode;
  } else if (cleanBarcode.length === 12) {
    // UPC-A: Add leading zero to make it GTIN-13
    return '0' + cleanBarcode;
  } else if (cleanBarcode.length === 6 || cleanBarcode.length === 7) {
    // Likely UPC-E, needs to be expanded to UPC-A first
    // UPC-E is a compressed version of UPC-A
    // This is a simplified conversion and might not cover all cases
    let expandedUPC = '';
    
    // Last digit (without check digit)
    const lastDigit = cleanBarcode.charAt(cleanBarcode.length - 2);
    
    if (lastDigit === '0' || lastDigit === '1' || lastDigit === '2') {
      // Manufacturer code ends with 00, 01, or 02
      expandedUPC = cleanBarcode.substr(0, 2) + lastDigit + '0000' + cleanBarcode.substr(2, 3);
    } else if (lastDigit === '3') {
      // Manufacturer code ends with 3
      expandedUPC = cleanBarcode.substr(0, 3) + '00000' + cleanBarcode.substr(3, 2);
    } else if (lastDigit === '4') {
      // Manufacturer code ends with 4
      expandedUPC = cleanBarcode.substr(0, 4) + '00000' + cleanBarcode.substr(4, 1);
    } else {
      // Manufacturer code ends with 5, 6, 7, 8, 9
      expandedUPC = cleanBarcode.substr(0, 5) + '0000' + lastDigit;
    }
    
    // Add check digit back and convert to GTIN-13
    return '0' + expandedUPC + cleanBarcode.charAt(cleanBarcode.length - 1);
  } else if (cleanBarcode.length === 13) {
    // Already EAN-13/GTIN-13
    return cleanBarcode;
  } else if (cleanBarcode.length < 13) {
    // Pad with zeros at the beginning to make it 13 digits
    return cleanBarcode.padStart(13, '0');
  }
  
  // Return as is if none of the above conditions match
  return cleanBarcode;
};

// FatSecret API request to get food by barcode
const fatsecretBarcodeSearch = async (barcode, market = 'US') => {
  try {
    // Normalize region value for FatSecret API
    let region = (market || 'US').toUpperCase();
    if (region === 'INDIA') region = 'IN';

    // Convert barcode to GTIN-13 format
    const gtin13Barcode = convertToGTIN13(barcode);
    
    const oauthParams = {
      oauth_consumer_key: CONSUMER_KEY,
      oauth_nonce: generateNonce(),
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: Math.floor(Date.now() / 1000),
      oauth_version: "1.0",
      method: "food.find_id_for_barcode", // Use documented method
      format: "json",
      barcode: gtin13Barcode, // Use documented parameter name
      region: region, // Use documented parameter name
      language: "en", // Add language parameter
    };

    // Generate OAuth signature
    oauthParams.oauth_signature = generateOAuthSignature(
      "GET",
      BASE_URL,
      oauthParams,
      CONSUMER_SECRET
    );

    // Build query string from parameters
    const queryString = Object.keys(oauthParams)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`
      )
      .join("&");

    // Log the final API URL and parameters for debugging
    console.log(`FatSecret API Request: ${BASE_URL}?${queryString}`);

    // Make the API request
    const response = await axios.get(`${BASE_URL}?${queryString}`);
    
    if (!response.data) {
      throw new Error("No data received from FatSecret API");
    }

    return response.data;
  } catch (error) {
    console.error("Error in barcode search:", error.message);
    throw error;
  }
};

module.exports = { fatsecretBarcodeSearch };
