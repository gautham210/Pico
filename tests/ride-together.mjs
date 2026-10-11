import assert from 'node:assert/strict';

console.log('--- Testing Ride Together & Live Convoy Engine (Phase 5) ---');

// 1. Room Code Generation
function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const code1 = generateInviteCode();
assert.equal(code1.length, 6, 'Invite code must be exactly 6 characters');
assert.equal(code1, code1.toUpperCase(), 'Invite code must be uppercase');
assert.match(code1, /^[A-Z0-9]{6}$/, 'Invite code must be alphanumeric');

// 2. Location Throttle Logic
function shouldBroadcastLocation({ lastBroadcastTime, lastCoords, newCoords, now = Date.now() }) {
  if (!lastCoords) return true;
  const timeDiff = now - lastBroadcastTime;
  if (timeDiff >= 10000) return true; // 10 seconds passed

  // Check movement distance (> ~20 meters is roughly 0.0002 degrees)
  const dLat = Math.abs(lastCoords[0] - newCoords[0]);
  const dLng = Math.abs(lastCoords[1] - newCoords[1]);
  if (dLat > 0.0002 || dLng > 0.0002) return true;

  return false;
}

const t0 = 1000000;
const startCoords = [9.9312, 76.2673];

// Micro-movement within 3 seconds -> throttled (false)
assert.equal(
  shouldBroadcastLocation({
    lastBroadcastTime: t0,
    lastCoords: startCoords,
    newCoords: [9.93121, 76.26731],
    now: t0 + 3000
  }),
  false,
  'Jitter movement within 3 seconds must be throttled'
);

// After 10 seconds -> permitted (true)
assert.equal(
  shouldBroadcastLocation({
    lastBroadcastTime: t0,
    lastCoords: startCoords,
    newCoords: [9.93121, 76.26731],
    now: t0 + 10500
  }),
  true,
  'Movement after 10s must be broadcast'
);

// Significant movement (50m) within 2 seconds -> permitted (true)
assert.equal(
  shouldBroadcastLocation({
    lastBroadcastTime: t0,
    lastCoords: startCoords,
    newCoords: [9.9317, 76.2678],
    now: t0 + 2000
  }),
  true,
  'Significant movement >20m must be broadcast immediately'
);

console.log('PASS: GPS update rate-limiting and battery throttle verified');

// 3. Stale Location Freshness Calculation
function isLocationStale(updatedAtIso, nowMs = Date.now()) {
  const updatedTime = new Date(updatedAtIso).getTime();
  const ageMs = nowMs - updatedTime;
  return ageMs > 120000; // 2 minutes
}

const currentIso = new Date().toISOString();
const threeMinAgoIso = new Date(Date.now() - 180000).toISOString();

assert.equal(isLocationStale(currentIso), false, 'Recent location must be reported as live');
assert.equal(isLocationStale(threeMinAgoIso), true, 'Location > 2 minutes old must be labelled stale');

console.log('PASS: Honest stale position detection (> 2 min)');

// 4. Distance and Separation / Regrouping Detection
function haversineDistanceMeters(coord1, coord2) {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function checkSeparationAlert(riderCoords, mainConvoyCoords, thresholdMeters = 500) {
  const distance = haversineDistanceMeters(riderCoords, mainConvoyCoords);
  if (distance > thresholdMeters) {
    return {
      separated: true,
      distanceMeters: distance,
      regroupSuggested: true,
      safePoint: 'Rendezvous Point: Fuel Station / Cafe ahead'
    };
  }
  return {
    separated: false,
    distanceMeters: distance,
    regroupSuggested: false
  };
}

const kochiCenter = [9.9312, 76.2673];
const nearbyBuddy = [9.9325, 76.2685]; // ~200 meters away
const separatedBuddy = [9.9400, 76.2800]; // ~1.7 km away

const alertNearby = checkSeparationAlert(nearbyBuddy, kochiCenter);
assert.equal(alertNearby.separated, false);

const alertSeparated = checkSeparationAlert(separatedBuddy, kochiCenter);
assert.equal(alertSeparated.separated, true);
assert.ok(alertSeparated.distanceMeters > 500);
assert.ok(alertSeparated.regroupSuggested);

console.log('PASS: Route deviation and regrouping threshold detection');

// 5. Pooled Kitty & Group Split Arithmetic
function calculatePooledKitty(budgetEnvelopePerPerson, memberCount) {
  const count = Math.max(1, memberCount);
  const total = budgetEnvelopePerPerson * count;
  const split = Math.round(total / count);
  return { total, split, count };
}

const pool = calculatePooledKitty(20000, 4);
assert.equal(pool.total, 80000);
assert.equal(pool.split, 20000);
assert.equal(pool.count, 4);

console.log('PASS: Pooled kitty arithmetic and member expense splitting');
