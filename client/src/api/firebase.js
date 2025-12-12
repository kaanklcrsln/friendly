import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyD26AL2n7KamwZGLpzAXLSbJjC_Mnblpl8',
  authDomain: 'friendly-2fb02.firebaseapp.com',
  projectId: 'friendly-2fb02',
  storageBucket: 'friendly-2fb02.firebasestorage.app',
  messagingSenderId: '278579009470',
  appId: '1:278579009470:web:896afe1f5dfd391cef8bef',
  databaseURL: 'https://friendly-2fb02-default-rtdb.europe-west1.firebasedatabase.app',
  measurementId: 'G-Y8N6D9Q1GJ'
};

if (!firebaseConfig.apiKey) {
  console.warn('Firebase API key is missing. Check your environment variables.');
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Initialize analytics (optional, only in browser)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };
