import type { FirebaseApp } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId);
}

export function initFirebase() {
  if (!isFirebaseConfigured()) {
    console.warn('[Firebase] Not configured — missing env vars. Running in mock mode.');
    return null;
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    // Offline-first cache. Persists Firestore data in IndexedDB so the app keeps
    // showing data when the connection drops (common at remote island sites) instead
    // of erroring. persistentMultipleTabManager makes it safe across multiple tabs —
    // the old enableIndexedDbPersistence threw a "only one tab" error here.
    // initializeFirestore is NOT idempotent: a module re-eval (Vite HMR / re-import)
    // would throw "already initialized", so fall back to the existing instance.
    try {
      dbInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch {
      dbInstance = getFirestore(app);
    }
    storageInstance = getStorage(app);
  }
  return { app, auth: authInstance!, db: dbInstance!, storage: storageInstance! };
}

export function getAuthInstance(): Auth | null {
  if (!authInstance) initFirebase();
  return authInstance;
}

export function getDbInstance(): Firestore | null {
  if (!dbInstance) initFirebase();
  return dbInstance;
}

export function getStorageInstance(): FirebaseStorage | null {
  if (!storageInstance) initFirebase();
  return storageInstance;
}

initFirebase();
