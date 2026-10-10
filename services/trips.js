import { auth, db } from './firebase.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateTripCode(length = 6) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return result;
}

function generateTripId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'trip_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export async function createTrip(userId, dest, dates, budget) {
  const code = generateTripCode(6);
  const tripId = generateTripId();
  const tripRef = doc(db, 'trips', tripId);

  const newTrip = {
    code,
    creatorId: userId,
    destination: dest,
    dates,
    budgetEnvelope: Number(budget) || 0,
    members: [{ userId, joinedAt: Date.now() }],
    status: 'lobby',
    pool: {
      total: Number(budget) || 0,
      perPerson: [{ userId, spent: 0 }]
    },
    createdAt: Date.now()
  };

  await setDoc(tripRef, newTrip);
  return { code, tripId };
}

export async function joinTrip(code, overrideUserId = null) {
  const currentUserId = overrideUserId || auth.currentUser?.uid;
  if (!currentUserId) {
    throw new Error('User must be authenticated to join a trip');
  }

  const cleanCode = (code || '').trim().toUpperCase();
  const tripsRef = collection(db, 'trips');
  const q = query(tripsRef, where('code', '==', cleanCode));
  const querySnap = await getDocs(q);

  if (querySnap.empty) {
    throw new Error('Trip not found with this code');
  }

  const tripDoc = querySnap.docs[0];
  const tripId = tripDoc.id;
  const tripData = tripDoc.data();

  const isAlreadyMember = (tripData.members || []).some((m) => m.userId === currentUserId);
  if (!isAlreadyMember) {
    const updatedMembers = [
      ...(tripData.members || []),
      { userId: currentUserId, joinedAt: Date.now() }
    ];
    const updatedPerPerson = [
      ...(tripData.pool?.perPerson || [])
    ];
    if (!updatedPerPerson.some((p) => p.userId === currentUserId)) {
      updatedPerPerson.push({ userId: currentUserId, spent: 0 });
    }

    await updateDoc(doc(db, 'trips', tripId), {
      members: updatedMembers,
      'pool.perPerson': updatedPerPerson
    });
  }

  return { tripId };
}

export function subscribeTrip(tripId, callback) {
  if (!tripId) return () => {};
  const tripRef = doc(db, 'trips', tripId);

  return onSnapshot(
    tripRef,
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error(`Subscription error for trip ${tripId}:`, error);
    }
  );
}

export async function updateDestination(tripId, place) {
  if (!tripId) throw new Error('Trip ID is required');
  const tripRef = doc(db, 'trips', tripId);

  return await updateDoc(tripRef, {
    destination: place,
    updatedAt: Date.now()
  });
}

export async function saveUserTrip(userId, state) {
  if (!userId || !db) return null;
  const userTripRef = doc(db, 'userTrips', userId);
  const data = {
    destination: state.userPrefs?.city || 'Kochi',
    origin: state.userPrefs?.origin || '',
    userPrefs: state.userPrefs || {},
    likedPlaces: (state.likedPlaces || []).map(p => ({
      id: p.id,
      name: p.name,
      cost: p.cost,
      coords: p.coords || null,
      city: p.city || state.userPrefs?.city || 'Kochi',
      category: p.category || ''
    })),
    mode: state.mode || 'convenient',
    budgetEnvelope: state.budgetEnvelope || 20000,
    updatedAt: Date.now()
  };
  await setDoc(userTripRef, data, { merge: true });
  return data;
}

export async function getUserTrip(userId) {
  if (!userId || !db) return null;
  const userTripRef = doc(db, 'userTrips', userId);
  const snap = await getDoc(userTripRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

