/**
 * CONTRACT FROZEN — do not rename or reorder args.
 * Pico Integration Layer - API Contract Implementation
 */

import { searchTrains as _searchTrains } from './trains.js';
import { searchBuses as _searchBuses } from './buses.js';
import { searchFlights as _searchFlights } from './flights.js';
import { getPlaces as _getPlaces, getRealityCheck as _getRealityCheck } from './places.js';
import { getNearby as _getNearby } from './distance.js';
import {
  createTrip as _createTrip,
  joinTrip as _joinTrip,
  subscribeTrip as _subscribeTrip,
  updateDestination as _updateDestination
} from './trips.js';
import { updatePosition as _updatePosition } from './positions.js';
import { getPool as _getPool } from './pool.js';
import { addFriend as _addFriend } from './friends.js';
import { auth } from './firebase.js';

export async function searchTrains(origin, dest, date) {
  return _searchTrains(origin, dest, date);
}

export async function searchBuses(origin, dest, date) {
  return _searchBuses(origin, dest, date);
}

export async function searchFlights(origin, dest, date) {
  return _searchFlights(origin, dest, date);
}

export async function getPlaces(city, prefs) {
  return _getPlaces(city, prefs);
}

export async function getRealityCheck(placeId) {
  return _getRealityCheck(placeId);
}

export async function getNearby(coords, placeIds, mode) {
  return _getNearby(coords, placeIds, mode);
}

export async function createTrip(userId, dest, dates, budget) {
  return _createTrip(userId, dest, dates, budget);
}

export async function joinTrip(code) {
  return _joinTrip(code);
}

export async function subscribeTrip(tripId, callback) {
  return _subscribeTrip(tripId, callback);
}

export async function updatePosition(tripId, userId, lat, lng) {
  return _updatePosition(tripId, userId, lat, lng);
}

export async function updateDestination(tripId, place) {
  return _updateDestination(tripId, place);
}

export async function getPool(tripId) {
  return _getPool(tripId);
}

export async function addFriend(username) {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) {
    return { success: false, error: 'User not authenticated' };
  }
  return _addFriend(currentUserId, username);
}
