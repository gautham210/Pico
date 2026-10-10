import {price,requestJSON} from './providers/contracts.js';
import { env } from './env.js';

async function queryNoble(origin, dest, date, apiKey) {
  const url = `https://api.noblewebstudio.com/v1/flights?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}`;
  const data = await requestJSON(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    }
  });

  const flights = data.flights || data.data || (Array.isArray(data) ? data : []);

  if (!Array.isArray(flights) || flights.length === 0) {
    throw new Error('No flights found in Noble response');
  }

  return flights.map((f) => ({
    mode: 'flight',
    cost: price(f.price ?? f.cost ?? f.fare),
    duration: f.duration || null,
    url: f.url || f.bookingUrl || `https://www.google.com/travel/flights?q=flights%20from%20${encodeURIComponent(origin)}%20to%20${encodeURIComponent(dest)}%20on%20${encodeURIComponent(date)}`,
    airline: f.airline || f.airlineName || 'Airline unavailable'
  }));
}

async function queryAviationstack(origin, dest, date, apiKey) {
  const url = `https://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(apiKey)}&dep_iata=${encodeURIComponent(origin)}&arr_iata=${encodeURIComponent(dest)}&flight_date=${encodeURIComponent(date)}`;
  const data = await requestJSON(url);
  if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
    throw new Error('No flight data returned from Aviationstack');
  }

  return data.data.map((f) => ({
    mode: 'flight',
    cost: price(f.price ?? f.cost ?? f.fare),
    duration: f.flight?.duration || null,
    url: `https://www.google.com/travel/flights?q=flights%20from%20${encodeURIComponent(origin)}%20to%20${encodeURIComponent(dest)}%20on%20${encodeURIComponent(date)}`,
    airline: f.airline?.name || 'Airline unavailable'
  }));
}

export async function searchFlightsWithStatus(origin, dest, date) {
  try {
    const nobleKey = env('VITE_NOBLE_KEY');
    const aviationKey = env('VITE_AVIATIONSTACK_KEY');

    let results = null;
    let provider = '';

    if (nobleKey) {
      try {
        results = await queryNoble(origin, dest, date, nobleKey);
        provider = 'Noble';
      } catch (nobleErr) {
        console.warn('Noble flight query failed; trying Aviationstack fallback.');
      }
    }

    if (!results && aviationKey) {
      try {
        results = await queryAviationstack(origin, dest, date, aviationKey);
        provider = 'Aviationstack';
      } catch (aviationErr) {
        console.warn('Aviationstack flight query failed.');
      }
    }

    if (!results || results.length === 0) {
      throw new Error('No flight data available from live providers');
    }

    return {source:'LIVE',provider,results};
  } catch (error) {
    console.warn('Flight providers failed; using the configured local fallback.');
    try {
      const fallback = await import('../data/fallback/flights.json', { with: { type: 'json' } });
      const results=fallback.default || fallback;
      return {source:results.length?'DEMO':'UNAVAILABLE',provider:results.length?'local fallback':'flight providers',results,reason:'Flight providers are unavailable or not configured.'};
    } catch (fallbackError) {
      console.warn('Flight fallback data is unavailable.');
      return {source:'UNAVAILABLE',provider:'flight providers',results:[],reason:'Flight providers are unavailable or not configured.'};
    }
  }
}

export async function searchFlights(origin, dest, date) {
  return (await searchFlightsWithStatus(origin,dest,date)).results;
}

