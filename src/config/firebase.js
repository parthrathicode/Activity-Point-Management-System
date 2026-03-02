import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // ✅ ADD THIS

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "enterprise-app-mgmt.firebaseapp.com",
  projectId: "enterprise-app-mgmt",
  storageBucket: "enterprise-app-mgmt.firebasestorage.app",
  messagingSenderId: "184126602948",
  appId: "1:184126602948:web:826cebf9f67b2e71641391"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ EXPORT STORAGE
export default app;
