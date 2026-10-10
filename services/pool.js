import { db } from './firebase.js';
import { doc, getDoc } from 'firebase/firestore';

export async function getPool(tripId) {
  try {
    if (!tripId) {
      return { pool: 0, perPerson: [] };
    }

    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
      return { pool: 0, perPerson: [] };
    }

    const data = tripSnap.data();
    const poolData = data.pool || {};

    return {
      pool: poolData.total ?? poolData.pool ?? data.budgetEnvelope ?? 0,
      perPerson: poolData.perPerson || []
    };
  } catch (error) {
    console.error(`Error fetching pool for trip ${tripId}:`, error);
    return { pool: 0, perPerson: [] };
  }
}
