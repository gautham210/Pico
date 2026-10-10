import { auth, db } from './firebase.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  runTransaction
} from 'firebase/firestore';

function requireFirebase(){
  if(!auth||!db)throw new Error('Firebase is not configured for this deployment.');
}

export async function signInWithGoogle() {
  requireFirebase();
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
}

export async function signInAnonymously() {
  requireFirebase();
  return await firebaseSignInAnonymously(auth);
}

export async function signOut() {
  requireFirebase();
  return await firebaseSignOut(auth);
}

export function onAuthChange(callback) {
  if(!auth||!db)return ()=>{};
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            username: '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            archetype: '',
            friends: [],
            optedInMetrics: [],
            onboarding: {},
            createdAt: Date.now()
          });
        }
      } catch (error) {
        console.error('Error checking/creating user profile:', error);
      }
    }
    callback(user);
  });
}

export async function setUsername(uid, username) {
  requireFirebase();
  if (!uid || !username) {
    throw new Error('User ID and username are required');
  }

  const normalizedUsername = username.trim().toLowerCase();
  if(auth.currentUser?.uid!==uid)throw new Error('You can only update your own username.');
  const usernameRef = doc(db, 'usernames', normalizedUsername);
  const userRef = doc(db, 'users', uid);

  return await runTransaction(db, async (transaction) => {
    const usernameDoc = await transaction.get(usernameRef);
    if (usernameDoc.exists() && usernameDoc.data().uid !== uid) {
      throw new Error('Username already taken');
    }

    transaction.set(usernameRef, { uid });
    transaction.set(userRef, { username: normalizedUsername }, { merge: true });

    return { success: true, username: normalizedUsername };
  });
}
