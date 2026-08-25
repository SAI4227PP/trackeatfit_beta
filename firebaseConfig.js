import analytics from "@react-native-firebase/analytics";
import firebaseApp from "@react-native-firebase/app";
import auth from "@react-native-firebase/auth";
import messaging from "@react-native-firebase/messaging";

export const firebaseConfig = {
  apiKey: "AIzaSyAfKWID7km52F8GRhNdeGpNPXYtuHhjY6A",
  authDomain: "trackeatfit-3bacc.firebaseapp.com",
  projectId: "trackeatfit-3bacc",
  storageBucket: "trackeatfit-3bacc.firebasestorage.app",
  messagingSenderId: "1074372441109",
  appId: "1:1074372441109:android:ab024d279bfcf6b2474a1c",
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
      messaging: messagingInstance,
    };
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return {
      app: null,
      auth: null,
      analytics: null,
      messaging: null,
    };
  }
}

const firebase = {
  initializeFirebase,
};

export { initializeFirebase };
export default firebase;
