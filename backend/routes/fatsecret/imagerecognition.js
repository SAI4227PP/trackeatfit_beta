require('dotenv').config();
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const FormData = require('form-data');

const CONSUMER_KEY = process.env.IMAGE_RECOGNITION_KEY;
const CONSUMER_SECRET = process.env.IMAGE_RECOGNITION_SECRET;
const BASE_URL = process.env.BASE_URL_IMAGE_RECOGNITION;

if (!CONSUMER_KEY || !CONSUMER_SECRET || !BASE_URL) {
  throw new Error('Missing required environment variables for image recognition');
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

const imageRecognition = async (imageData, region = "US", language = "en") => {
  try {
    console.log('Starting image recognition process');
    
    if (!imageData) {
      throw new Error('No image data provided');
    }

    // Convert base64 to buffer if it's a base64 string
    let imageBuffer;
    try {
      imageBuffer = Buffer.from(imageData, 'base64');
      console.log('Image buffer created, size:', imageBuffer.length, 'bytes');
    } catch (error) {
      console.error('Error converting base64 to buffer:', error);
      throw new Error('Invalid image data format');
    }

    const oauthParams = {
      oauth_consumer_key: CONSUMER_KEY,
      oauth_nonce: generateNonce(),
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: Math.floor(Date.now() / 1000),
      oauth_version: "1.0",
      method: "image.recognition",
      format: "json",
      language: language,
      region: region,
    };

    oauthParams.oauth_signature = generateOAuthSignature(
      "POST",
      BASE_URL,
      oauthParams,
      CONSUMER_SECRET
    );

    console.log('OAuth parameters generated:', {
      nonce: oauthParams.oauth_nonce,
      timestamp: oauthParams.oauth_timestamp
    });

    const formData = new FormData();
    
    // Add image buffer as a proper file
    formData.append('image', imageBuffer, {
      filename: 'food_image.jpg',
      contentType: 'image/jpeg',
      knownLength: imageBuffer.length
    });

    // Add OAuth parameters
    Object.keys(oauthParams).forEach(key => {
      formData.append(key, oauthParams[key]);
    });

    console.log('Sending request to FatSecret API with form data');

    try {
      const response = await axios.post(BASE_URL, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Length': formData.getLengthSync()
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 30000 // 30 second timeout
      });

      console.log('FatSecret API Response:', {
        status: response.status,
        headers: response.headers,
        data: response.data
      });

      if (!response.data) {
        throw new Error('Empty response from FatSecret API');
      }

      return response.data;
    } catch (axiosError) {
      console.error('Axios request failed:', {
        message: axiosError.message,
        code: axiosError.code,
        response: axiosError.response?.data,
        status: axiosError.response?.status
      });

      if (axiosError.response?.status === 413) {
        throw new Error('Image size too large');
      } else if (axiosError.code === 'ECONNABORTED') {
        throw new Error('Request timed out');
      } else {
        throw new Error(
          axiosError.response?.data?.error?.message || 
          'Failed to connect to FatSecret API'
        );
      }
    }
  } catch (error) {
    console.error('Image Recognition Failed:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

module.exports = { imageRecognition };
