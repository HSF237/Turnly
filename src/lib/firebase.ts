import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInAnonymously, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = import.meta.env;

// The Firebase web config is safe to ship in client code; access is controlled by firestore.rules.
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyBDrO8UNXLetoYg-ceqq3RsTUDCCUIU9eo',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'turnly-72b21.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'turnly-72b21',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'turnly-72b21.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '177533990191',
  appId: env.VITE_FIREBASE_APP_ID || '1:177533990191:web:18b3e5af13913f2f2f1dda',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-0RN31JVWZB',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics is optional and only loads in supported browsers.
if (typeof window !== 'undefined') {
  import('firebase/analytics')
    .then(async ({ getAnalytics, isSupported }) => {
      if (await isSupported()) getAnalytics(app);
    })
    .catch(() => {});
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}

/** Customers don't need an account: they get a silent anonymous session. */
export async function ensureGuest() {
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export function logOut() {
  return signOut(auth);
}
