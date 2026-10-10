import {price} from './providers/contracts.js';
import * as railkit from 'railkit';
import { env } from './env.js';

export async function searchTrains(origin, dest, date) {
  try {
    const apiKey = env('VITE_IRCTC_KEY');
    if (!apiKey) {
      throw new Error('IRCTC API key missing');
    }

    if (typeof railkit.configure === 'function') {
      railkit.configure({ apiKey });
    }

    const searchFn = railkit.searchTrainBetweenStations || railkit.getTrainsBetweenStations;
    let trains = [];
    if (typeof searchFn === 'function') {
      const response = await searchFn(origin, dest, date);
      trains = Array.isArray(response) ? response : response?.trains || [];
    }

    if (trains.length === 0) {
      throw new Error('No train data returned');
    }

    return trains.map((t) => ({
      mode: 'train',
      cost: price(t.fare ?? t.price ?? t.cost),
      duration: t.duration || t.travelTime || '0h 0m',
      url: t.bookingUrl || t.url || `https://www.irctc.co.in/nget/booking/train-list?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}`,
      name: t.trainName || t.name || 'Express Train',
      number: t.trainNumber || t.number || '',
      departure: t.departureTime || t.departure || '',
      arrival: t.arrivalTime || t.arrival || ''
    }));
  } catch (error) {
    console.warn('searchTrains failed, falling back to cached trains.json:', error.message);
    try {
      const fallback = await import('../data/fallback/trains.json', { with: { type: 'json' } });
      return fallback.default || fallback;
    } catch (fallbackError) {
      console.warn('Fallback trains.json not found or unreadable:', fallbackError.message);
      return [];
    }
  }
}

