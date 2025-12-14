import analytics from '@react-native-firebase/analytics';
import firebaseApp from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';

export const firebaseConfig = {
  apiKey: "AIzaSyAB3hSLY2TTVi8vry9WfOmSy2yKcgkuW9U",
  authDomain: "simple-3120f.firebaseapp.com",
  projectId: "simple-3120f",
  storageBucket: "simple-3120f.firebasestorage.app",
  messagingSenderId: "568128790697",
  appId: "1:568128790697:android:44458e42cec77b5186c9b8"
};

function initializeFirebase() {
  try {
    // Check if Firebase is already initialized
    if (!firebaseApp().apps.length) {
      firebaseApp.initializeApp(firebaseConfig);
    }

    // Initialize Firebase services
    const analyticsInstance = analytics();
    const messagingInstance = messaging();

    // Enable analytics collection
    analyticsInstance.setAnalyticsCollectionEnabled(true);

    // Initialize messaging
    messagingInstance.setAutoInitEnabled(true);

    return { 
      app: firebaseApp,
      auth: auth(),
      analytics: analyticsInstance,
      messaging: messagingInstance
    };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return {
      app: null,
      auth: null,
      analytics: null,
      messaging: null
    };
  }
}

const firebase = {
  initializeFirebase
};

export { initializeFirebase };
export default firebase;
