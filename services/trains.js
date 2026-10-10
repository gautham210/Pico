import {price} from './providers/contracts.js';
import * as railkit from 'railkit';
import { env } from './env.js';

export async function searchTrainsWithStatus(origin, dest, date) {
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
      const providerDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split('-').reverse().join('-') : date;
      const response = await searchFn(origin, dest, providerDate);
      trains = Array.isArray(response) ? response : response?.trains || [];
    }

    if (trains.length === 0) {
      throw new Error('No train data returned');
    }

    return {source:'LIVE',provider:'IRCTC via railkit',results:trains.map((t) => ({
      mode: 'train',
      cost: price(t.fare ?? t.price ?? t.cost),
      duration: t.duration || t.travelTime || null,
      url: t.bookingUrl || t.url || `https://www.irctc.co.in/nget/booking/train-list?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}`,
      name: t.trainName || t.name || 'Train name unavailable',
      number: t.trainNumber || t.number || '',
      departure: t.departureTime || t.departure || '',
      arrival: t.arrivalTime || t.arrival || ''
    }))};
  } catch (error) {
    console.warn('Train provider failed; using the configured local fallback.');
    try {
      const fallback = await import('../data/fallback/trains.json', { with: { type: 'json' } });
      const results=fallback.default || fallback;
      return {source:results.length?'DEMO':'UNAVAILABLE',provider:results.length?'local fallback':'IRCTC via railkit',results,reason:'Train provider is unavailable or not configured.'};
    } catch (fallbackError) {
      console.warn('Train fallback data is unavailable.');
      return {source:'UNAVAILABLE',provider:'IRCTC via railkit',results:[],reason:'Train provider is unavailable or not configured.'};
    }
  }
}

export async function searchTrains(origin, dest, date) {
  return (await searchTrainsWithStatus(origin,dest,date)).results;
}

