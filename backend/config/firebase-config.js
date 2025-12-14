const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = {
  "type": "service_account",
  "project_id": "trackeatfit-3bacc",
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIREBASE_CERT_URL
};

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

function getFirebaseStatus() {
  try {
    // If app is initialized, admin.apps.length > 0
    if (admin.apps && admin.apps.length > 0) {
      return 'connected';
    } else {
      return 'disconnected';
    }
  } catch (e) {
    return 'disconnected';
  }
}

module.exports = {
  admin,
  getFirebaseStatus
};
