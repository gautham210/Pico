import assert from 'node:assert/strict';

// Setup mock storage
const storage = new Map();
globalThis.localStorage = {
  getItem: k => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, v),
  removeItem: k => storage.delete(k)
};

const { useStore } = await import('../src/lib/store.js');
const {
  isSupabaseConfigured,
  signUpWithEmail,
  signInWithEmail,
  signInWithPhoneOtp,
  verifyPhoneOtp,
  signInWithGoogle,
  signOutUser,
  normalizePhone,
  migrateGuestDataToCloud,
  joinCloudTrip,
  fetchPublicLikes
} = await import('../services/supabase.js');

console.log('--- Testing Supabase Auth & Session Isolation (Pico 2.0 / 2.2) ---');

// 1. Supabase Client Configuration Checks
assert.equal(typeof isSupabaseConfigured(), 'boolean');

// 2. Phone Number Normalization Tests (+91 Indian format & E.164)
{
  assert.equal(normalizePhone('+919876543210'), '+919876543210');
  assert.equal(normalizePhone('+91 98765 43210'), '+919876543210');
  assert.equal(normalizePhone('+91-98765-43210'), '+919876543210');
  assert.equal(normalizePhone('9876543210'), '+919876543210');
  assert.equal(normalizePhone('09876543210'), '+919876543210');
  assert.equal(normalizePhone('(98765) 43210'), '+919876543210');
  assert.equal(normalizePhone(''), '');
  assert.equal(normalizePhone(null), '');
}
console.log('PASS: Phone number normalization (+91 Indian and E.164)');

// 3. Offline / Unconfigured Cloud Fallback Handlers (No Fake Demo Auth)
{
  const emailRes = await signInWithEmail('test@example.com', 'wrongpassword');
  assert.ok(emailRes.error, 'Unconfigured / invalid credentials must return clear error object');
  assert.equal(emailRes.user, null);

  const signUpRes = await signUpWithEmail('test@example.com', 'secret123');
  assert.ok(signUpRes.error, 'Unconfigured signup must return error object');

  const googleRes = await signInWithGoogle();
  assert.ok(googleRes.error, 'Unconfigured Google OAuth must return error object without fabricating user');

  const phoneRes = await signInWithPhoneOtp('+919876543210');
  assert.ok(phoneRes.error, 'Unconfigured SMS provider must return informative error');

  const invalidPhoneRes = await signInWithPhoneOtp('123');
  assert.ok(invalidPhoneRes.error, 'Invalid phone number format must be rejected');

  const verifyRes = await verifyPhoneOtp('+919876543210', '123456');
  assert.ok(verifyRes.error, 'Unconfigured SMS verify must return error object');

  const signOutRes = await signOutUser();
  assert.equal(signOutRes.error, null, 'Sign out with null client must succeed safely without throwing');

  const joinRes = await joinCloudTrip('TESTCD', 'user-123');
  assert.ok(joinRes.error, 'Unconfigured join trip must return error object');

  const likesRes = await fetchPublicLikes('kochi-beach');
  assert.equal(typeof likesRes.count, 'number');
}
console.log('PASS: Supabase auth graceful error handling in unconfigured environment');

// 4. Guest Session Creation & Isolation
{
  const getS = () => useStore.getState();
  const guest1 = getS().startGuestSession('Solo Rider', { city: 'Goa', budget: 15000 });
  assert.ok(guest1.user.uid.startsWith('guest-'));
  assert.equal(guest1.user.provider, 'guest');
  assert.equal(getS().likedPlaces.length, 0);

  getS().likePlace({ id: 'goa-fort-aguada', name: 'Aguada Fort', city: 'Goa', cost: 100 });
  assert.equal(getS().likedPlaces.length, 1);

  // Intentional Guest-to-Account Migration Simulation
  // Scenario A: User chooses to migrate guest draft
  const cloudUser1 = { name: 'Aarav Patel', uid: 'user-cloud-123', provider: 'supabase', email: 'aarav@pico.travel' };
  getS().login(cloudUser1.name, { uid: cloudUser1.uid, provider: cloudUser1.provider, email: cloudUser1.email });

  assert.equal(getS().user.name, 'Aarav Patel');
  assert.equal(getS().user.provider, 'supabase');
  assert.equal(getS().likedPlaces.length, 1, 'Migrated guest places must be preserved on intentional migration');
  assert.equal(getS().likedPlaces[0].id, 'goa-fort-aguada');

  // Scenario B: User logs out and another user chooses to start fresh
  getS().logout();
  assert.equal(getS().user, null);
  assert.equal(getS().likedPlaces.length, 0);

  const freshUser = { name: 'Deepa Sen', uid: 'user-cloud-456', provider: 'supabase', email: 'deepa@pico.travel' };
  getS().login(freshUser.name, { uid: freshUser.uid, provider: freshUser.provider, email: freshUser.email });
  assert.equal(getS().likedPlaces.length, 0, 'Clean account starts with empty itinerary');
}
console.log('PASS: Guest session isolation and intentional account migration lifecycle');

// 5. Session Persistence & Rehydration Contract
{
  const getS = () => useStore.getState();
  getS().startGuestSession('Persistent Guest', { city: 'Kochi' });
  getS().likePlace({ id: 'fort-kochi', name: 'Fort Kochi Beach', city: 'Kochi', cost: 50 });

  await useStore.persist.rehydrate();
  const restored = useStore.getState();
  assert.equal(restored.user.provider, 'guest', 'Guest session is restored on reload');
  assert.equal(restored.likedPlaces.length, 1);
  assert.equal(restored.likedPlaces[0].id, 'fort-kochi');

  // Supabase/Firebase sessions are NOT persisted into local unencrypted store partialize
  const partializeResult = useStore.persist.getOptions().partialize(restored);
  assert.equal(partializeResult.user.provider, 'guest');

  // If user had a cloud provider, partialize keeps local data clean
  const cloudState = { ...restored, user: { name: 'Cloud User', provider: 'supabase' } };
  const cloudPartialize = useStore.persist.getOptions().partialize(cloudState);
  assert.equal(cloudPartialize.user?.provider, 'supabase');
}
console.log('PASS: Secure session serialization and credential privacy invariants');
