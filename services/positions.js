import { rtdb } from './firebase';
import { ref, set, onValue } from 'firebase/database';

export async function updatePosition(tripId, userId, lat, lng) {
  if (!tripId || !userId) return;

  const positionRef = ref(rtdb, `positions/${tripId}/${userId}`);
  return await set(positionRef, {
    lat,
    lng,
    heading: null,
    speed: null,
    battery: null,
    ts: Date.now()
  });
}

export function subscribePositions(tripId, callback) {
  if (!tripId) return () => {};

  const positionsRef = ref(rtdb, `positions/${tripId}`);
  return onValue(positionsRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
}
