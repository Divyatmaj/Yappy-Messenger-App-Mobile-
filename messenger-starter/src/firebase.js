import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

/** False until real values are pasted into src/firebaseConfig.js. */
export const isFirebaseConfigured =
  typeof firebaseConfig.apiKey === 'string' &&
  firebaseConfig.apiKey.length > 0 &&
  !firebaseConfig.apiKey.startsWith('YOUR_');

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);

  // Keep the anonymous sign-in across app restarts on iOS/Android.
  auth =
    Platform.OS !== 'web' && FirebaseAuth.getReactNativePersistence
      ? FirebaseAuth.initializeAuth(app, {
          persistence: FirebaseAuth.getReactNativePersistence(AsyncStorage),
        })
      : FirebaseAuth.getAuth(app);

  db = initializeFirestore(app, {});
}

export { auth, db };

let signingIn = null;

/**
 * Resolves with the signed-in (anonymous) Firebase user, signing in on
 * first use. Firestore rules only allow signed-in clients.
 */
export function ensureSignedIn() {
  if (!auth) return Promise.reject(new Error('firebase/not-configured'));
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (!signingIn) {
    signingIn = new Promise((resolve, reject) => {
      // Wait for a saved session to be restored before creating a new one.
      const unsubscribe = FirebaseAuth.onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          if (user) {
            resolve(user);
            return;
          }
          FirebaseAuth.signInAnonymously(auth).then(
            (credential) => resolve(credential.user),
            reject,
          );
        },
        reject,
      );
    }).finally(() => {
      signingIn = null;
    });
  }
  return signingIn;
}

/** Turns a Firebase error into a short, actionable message for the UI. */
export function describeFirebaseError(error) {
  const code = error?.code ?? error?.message ?? '';
  if (code.includes('not-configured')) {
    return 'Firebase is not set up yet. Add your config to src/firebaseConfig.js.';
  }
  if (
    code.includes('operation-not-allowed') ||
    code.includes('admin-restricted')
  ) {
    return 'Enable Anonymous sign-in in Firebase → Authentication → Sign-in method.';
  }
  if (code.includes('permission-denied')) {
    return 'Firestore rejected the request. Publish the rules from firestore.rules.';
  }
  if (code.includes('invalid-api-key') || code.includes('api-key-not-valid')) {
    return 'The Firebase API key is invalid. Check src/firebaseConfig.js.';
  }
  return null;
}
