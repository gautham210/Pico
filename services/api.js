/**
 * CONTRACT FROZEN — do not rename or reorder args.
 * Pico Integration Layer - API Contract Stubs
 */

export async function searchTrains(origin, dest, date) {
  return [];
}

export async function searchBuses(origin, dest, date) {
  return [];
}

export async function searchFlights(origin, dest, date) {
  return [];
}

export async function getPlaces(city, prefs) {
  return [];
}

export async function getRealityCheck(placeId) {
  return '';
}

export async function getNearby(coords, placeIds, mode) {
  return [];
}

export async function createTrip(userId, dest, dates, budget) {
  return { code: '', tripId: '' };
}

export async function joinTrip(code) {
  return { tripId: '' };
}

export async function subscribeTrip(tripId, callback) {
  return () => {};
}

export async function updatePosition(tripId, userId, lat, lng) {
  return;
}

export async function updateDestination(tripId, place) {
  return;
}

export async function getPool(tripId) {
  return { pool: 0, perPerson: [] };
};

export async function addFriend(username) {
  return { success: false };
}
