import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { env } from './env.js';

const rawConfig = env('VITE_FIREBASE_CONFIG');
let firebaseConfig = {};

if (rawConfig) {
  try {
    firebaseConfig = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;
  } catch (err) {
    console.error('Failed to parse VITE_FIREBASE_CONFIG:', err);
  }
}

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
