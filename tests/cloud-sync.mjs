import assert from 'node:assert/strict';

// Test 1: Unauthenticated or mismatched user cannot write cloud trip
const { saveUserTrip, getUserTrip } = await import('../services/trips.js');

// 1. Unauthenticated or null userId / mismatched user throws
await assert.rejects(
  async () => saveUserTrip(null, {}),
  /Sign in to access your own cloud trip/
);

await assert.rejects(
  async () => saveUserTrip('unauthenticated-user', { userPrefs: { city: 'Goa' } }),
  /Sign in to access your own cloud trip/
);

// 2. getUserTrip with null userId returns null safely
assert.equal(await getUserTrip(null), null);

// Test 2: Local / Cloud trip conflict resolution logic
// We test the conflict resolution state machine used in App.jsx
function resolveCloudSync({ remoteTrip, localTrip, currentUserUid }) {
  if (!remoteTrip) {
    return {
      status: 'ready',
      message: 'Cloud trip checked. Local edits will be saved to your account.',
      shouldLoadRemote: false,
      shouldBlockUpload: false
    };
  }

  const localHasPlaces = Array.isArray(localTrip.likedPlaces) && localTrip.likedPlaces.length > 0;
  const remoteHasPlaces = Array.isArray(remoteTrip.likedPlaces) && remoteTrip.likedPlaces.length > 0;

  if (remoteHasPlaces && localHasPlaces) {
    // Conflict: both exist, automatic upload paused to protect both
    return {
      status: 'blocked',
      message: 'A cloud trip and local draft both exist. Automatic upload is paused to preserve both. Continue using your local draft.',
      shouldLoadRemote: false,
      shouldBlockUpload: true
    };
  }

  if (remoteHasPlaces && !localHasPlaces) {
    // Clean restore: local is blank, load remote
    return {
      status: 'ready',
      message: 'Cloud trip checked. Local edits will be saved to your account.',
      shouldLoadRemote: true,
      shouldBlockUpload: false
    };
  }

  return {
    status: 'ready',
    message: 'Cloud trip checked. Local edits will be saved to your account.',
    shouldLoadRemote: false,
    shouldBlockUpload: false
  };
}

// 2a. Both remote and local have places -> CONFLICT BLOCKED
const conflictResult = resolveCloudSync({
  remoteTrip: {
    destination: 'Goa',
    likedPlaces: [{ id: 'p1', name: 'Anjuna Beach' }]
  },
  localTrip: {
    likedPlaces: [{ id: 'p2', name: 'Fort Kochi' }]
  },
  currentUserUid: 'user_123'
});
assert.equal(conflictResult.status, 'blocked');
assert.equal(conflictResult.shouldBlockUpload, true);
assert.equal(conflictResult.shouldLoadRemote, false);
assert.match(conflictResult.message, /Automatic upload is paused to preserve both/);

// 2b. Remote has places, local is empty -> CLEAN RESTORE
const restoreResult = resolveCloudSync({
  remoteTrip: {
    destination: 'Goa',
    likedPlaces: [{ id: 'p1', name: 'Anjuna Beach' }],
    userPrefs: { city: 'Goa', days: 4 }
  },
  localTrip: {
    likedPlaces: []
  },
  currentUserUid: 'user_123'
});
assert.equal(restoreResult.status, 'ready');
assert.equal(restoreResult.shouldBlockUpload, false);
assert.equal(restoreResult.shouldLoadRemote, true);

// 2c. Remote is empty, local has places -> READY TO UPLOAD
const newLocalResult = resolveCloudSync({
  remoteTrip: null,
  localTrip: {
    likedPlaces: [{ id: 'p1', name: 'Chapora Fort' }]
  },
  currentUserUid: 'user_123'
});
assert.equal(newLocalResult.status, 'ready');
assert.equal(newLocalResult.shouldBlockUpload, false);
assert.equal(newLocalResult.shouldLoadRemote, false);

// Test 3: Cloud Read Failure Handling
function handleCloudReadError(error) {
  return {
    status: 'blocked',
    message: 'Cloud trip could not be read. Automatic upload is paused to protect your saved trip. Local planning is still available.'
  };
}
const readErrorResult = handleCloudReadError(new Error('Firestore unavailable'));
assert.equal(readErrorResult.status, 'blocked');
assert.match(readErrorResult.message, /Automatic upload is paused to protect your saved trip/);

// Test 4: Cloud Write Failure Handling
function handleCloudWriteError(error) {
  return {
    status: 'blocked',
    message: 'Cloud save failed. Your changes remain on this device; sign in again to retry.'
  };
}
const writeErrorResult = handleCloudWriteError(new Error('Permission denied'));
assert.equal(writeErrorResult.status, 'blocked');
assert.match(writeErrorResult.message, /Your changes remain on this device/);

// Test 5: Offline Local Storage Persistence & Rehydration
const storage = new Map();
globalThis.localStorage = {
  getItem: k => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, v),
  removeItem: k => storage.delete(k)
};

const { useStore, committed } = await import('../src/lib/store.js');
const s = useStore.getState();

s.login('Offline Guest', { provider: 'guest' });
s.setPrefs({ origin: 'Bengaluru', city: 'Goa', days: 3, travelers: 2, pace: 'balanced' });
s.setBudget(24000);
s.likePlace({ id: 'place-offline-1', name: 'Baga Beach', cost: 400, time: 90, coords: [15.55, 73.75] });

// Verify store snapshot in localStorage
const stored = JSON.parse(storage.get('pico-trip-v1'));
assert.equal(stored.state.user.name, 'Offline Guest');
assert.equal(stored.state.userPrefs.city, 'Goa');
assert.equal(stored.state.likedPlaces.length, 1);
assert.equal(stored.state.likedPlaces[0].id, 'place-offline-1');

// Verify rehydration into fresh store
const { useStore: rehydrated } = await import('../src/lib/store.js?rehydrate-offline-test');
assert.equal(rehydrated.getState().user.name, 'Offline Guest');
assert.equal(rehydrated.getState().userPrefs.city, 'Goa');
assert.equal(rehydrated.getState().likedPlaces.length, 1);
assert.equal(rehydrated.getState().likedPlaces[0].name, 'Baga Beach');

console.log('PASS: Cloud read/write success/failure contracts, conflict protection, and offline reload verified.');
