import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA9aEJRGDYA-XahyPFZ4adZu6Yf7ikhufw",
  authDomain: "lexicon-duel.firebaseapp.com",
  projectId: "lexicon-duel",
  storageBucket: "lexicon-duel.firebasestorage.app",
  messagingSenderId: "149125973030",
  appId: "1:149125973030:web:6312d9f44c2cc7ccf7d2e7",
  measurementId: "G-H02VQQQC5M",
  // Adding the default Realtime Database URL based on your project ID for Multiplayer later
  databaseURL: "https://lexicon-duel-default-rtdb.firebaseio.com",
};

// Check if Firebase is configured
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

let app, auth, db, rtdb, googleProvider;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  rtdb = getDatabase(app);
  googleProvider = new GoogleAuthProvider();
}

export { app, auth, db, rtdb, googleProvider, isConfigured };
