import assert from 'node:assert/strict';

// Set up localStorage mock for test environment
const storage = new Map();
globalThis.localStorage = {
  getItem: k => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, v),
  removeItem: k => storage.delete(k)
};

const { useStore, committed, unknownPlaceCosts, activeTripPlaces } = await import('../src/lib/store.js');
const { itinerary, profileFor } = await import('../src/lib/journey.js');

const getS = () => useStore.getState();

// 1. GUEST 1: Plans a Goa trip with saved beaches, diary entries, and custom budget
const g1 = getS().startGuestSession('Explorer Alex', { city: 'Goa', budget: 35000 });

assert.ok(g1.user.uid, 'Guest 1 must have a unique session ID');
assert.equal(g1.user.name, 'Explorer Alex');
assert.equal(getS().userPrefs.city, 'Goa');
assert.equal(getS().budgetEnvelope, 35000);

const goaBeach1 = { id: 'goa_anjuna', name: 'Anjuna Beach', city: 'Goa', cost: 500, time: 90 };
const goaBeach2 = { id: 'goa_baga', name: 'Baga Beach', city: 'Goa', cost: 400, time: 60 };

assert.equal(getS().likePlace(goaBeach1), true);
assert.equal(getS().likePlace(goaBeach2), true);
assert.equal(getS().likedPlaces.length, 2);
assert.equal(itinerary(getS()).flatMap(d => d.stops).length, 2);

getS().addEntry({ note: 'Sunset at Anjuna', placeId: 'goa_anjuna', rating: 'S', date: '2026-11-01' });
assert.equal(getS().diary.length, 1);

const guest1SessionId = getS().user.uid;
assert.ok(guest1SessionId.startsWith('guest-'));

// 2. GUEST 2: Starts a genuinely new guest session for Kochi
const g2 = getS().startGuestSession('Curious Bea', { city: 'Kochi' });

assert.ok(g2.user.uid, 'Guest 2 must have a unique session ID');
assert.notEqual(g2.user.uid, guest1SessionId, 'Guest 2 session ID must be distinct from Guest 1');
assert.equal(getS().user.name, 'Curious Bea');
assert.equal(getS().userPrefs.city, 'Kochi');

// CRITICAL ASSERTION: Previous guest's trip state must be completely cleared
assert.equal(getS().likedPlaces.length, 0, 'New guest session must start with clean likedPlaces');
assert.equal(getS().passedPlaces.length, 0, 'New guest session must start with clean passedPlaces');
assert.equal(getS().diary.length, 0, 'New guest must not inherit previous guest Diary entries');
assert.equal(getS().reviews.length, 0, 'New guest must not inherit previous guest reviews');
assert.equal(itinerary(getS()).length, 0, 'New guest itinerary must be empty');
assert.equal(getS().budgetEnvelope, 20000, 'New guest budget must be reset to clean default');
assert.equal(getS().budgetRemaining, 20000, 'New guest remaining budget must be full');

// 3. Guest 2 saves Kochi places
const kochiPlace1 = { id: 'fort-kochi', name: 'Fort Kochi', city: 'Kochi', cost: 1200, time: 90 };
const kochiPlace2 = { id: 'kumbalangi', name: 'Kumbalangi Village', city: 'Kochi', cost: 850, time: 120 };

assert.equal(getS().likePlace(kochiPlace1), true);
assert.equal(getS().likePlace(kochiPlace2), true);

const g2Stops = itinerary(getS()).flatMap(d => d.stops);
assert.equal(g2Stops.length, 2, 'Kochi itinerary must have 2 stops');
assert.ok(g2Stops.every(p => p.city === 'Kochi'), 'Zero Goa places in Kochi itinerary');
assert.ok(!g2Stops.some(p => p.name.includes('Anjuna') || p.name.includes('Baga')), 'No Goa beaches in Kochi itinerary');

// Check Travel DNA of Guest 2
const dnaProfile = profileFor(activeTripPlaces(getS()), getS().diary);
assert.ok(dnaProfile.title);
assert.equal(activeTripPlaces(getS()).length, 2);
assert.ok(activeTripPlaces(getS()).every(p => p.city === 'Kochi'));

// 4. Session Resumption for the same guest
await useStore.persist.rehydrate();
assert.equal(getS().user.uid, g2.user.uid, 'Same guest session ID restored on reload');
assert.equal(getS().likedPlaces.length, 2, 'Same guest places restored');
assert.equal(getS().likedPlaces[0].id, 'fort-kochi');

// 5. Destination Isolation on Destination Change
// User also saves a Goa place while browsing
const goaPlace3 = { id: 'goa_chapora', name: 'Chapora Fort', city: 'Goa', cost: 300, time: 90 };
assert.equal(getS().likePlace(goaPlace3), true);
assert.equal(getS().likedPlaces.length, 3, 'Store holds all saved places');

// In single-city mode (default), Kochi itinerary must only show Kochi places
getS().setPrefs({ city: 'Kochi', multiCity: false });
const kochiFiltered = activeTripPlaces(getS());
assert.equal(kochiFiltered.length, 2);
assert.ok(kochiFiltered.every(p => p.city === 'Kochi'));
assert.equal(itinerary(getS()).flatMap(d => d.stops).length, 2);

// In single-city mode, Goa itinerary must only show Goa places
getS().setPrefs({ city: 'Goa', multiCity: false });
const goaFiltered = activeTripPlaces(getS());
assert.equal(goaFiltered.length, 1);
assert.equal(goaFiltered[0].id, 'goa_chapora');
assert.equal(itinerary(getS()).flatMap(d => d.stops).length, 1);

// When user explicitly creates a multi-city itinerary:
getS().setPrefs({ multiCity: true });
const multiCityPlaces = activeTripPlaces(getS());
assert.equal(multiCityPlaces.length, 3, 'Multi-city itinerary includes all saved destinations');
assert.equal(itinerary(getS()).flatMap(d => d.stops).length, 3);

// 6. Logout / Sign out cleanly clears local workspace
getS().logout();
assert.equal(getS().user, null);
assert.equal(getS().likedPlaces.length, 0);
assert.equal(getS().diary.length, 0);
assert.equal(getS().budgetRemaining, 20000);

console.log('PASS: Guest session isolation, clean session lifecycle, and destination scoping verified.');
