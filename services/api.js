/**
 * CONTRACT FROZEN — do not rename or reorder args.
 * Pico Integration Layer - API Contract Implementation
 */

export async function searchTrains(origin, dest, date) {
  const mod = await import('./trains.js');
  return mod.searchTrains(origin, dest, date);
}

export async function searchBuses(origin, dest, date) {
  const mod = await import('./buses.js');
  return mod.searchBuses(origin, dest, date);
}

export async function searchFlights(origin, dest, date) {
  const mod = await import('./flights.js');
  return mod.searchFlights(origin, dest, date);
}

export async function getPlaces(city, prefs) {
  const mod = await import('./places.js');
  return mod.getPlaces(city, prefs);
}

export async function getRealityCheck(placeId) {
  const mod = await import('./places.js');
  return mod.getRealityCheck(placeId);
}

export async function getNearby(coords, placeIds, mode) {
  const mod = await import('./distance.js');
  return mod.getNearby(coords, placeIds, mode);
}

export async function createTrip(userId, dest, dates, budget) {
  const mod = await import('./trips.js');
  return mod.createTrip(userId, dest, dates, budget);
}

export async function joinTrip(code) {
  const mod = await import('./trips.js');
  return mod.joinTrip(code);
}

export async function subscribeTrip(tripId, callback) {
  const mod = await import('./trips.js');
  return mod.subscribeTrip(tripId, callback);
}

export async function updatePosition(tripId, userId, lat, lng) {
  const mod = await import('./positions.js');
  return mod.updatePosition(tripId, userId, lat, lng);
}

export async function updateDestination(tripId, place) {
  const mod = await import('./trips.js');
  return mod.updateDestination(tripId, place);
}

export async function getPool(tripId) {
  const mod = await import('./pool.js');
  return mod.getPool(tripId);
}

export async function addFriend(username) {
  const { addFriend: addFriendInternal } = await import('./friends.js');
  const { auth } = await import('./firebase.js');
  const currentUserId = auth?.currentUser?.uid;
  if (!currentUserId) {
    return { success: false, error: 'User not authenticated' };
  }
  return addFriendInternal(currentUserId, username);
}
