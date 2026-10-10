import {price} from './providers/contracts.js';
import { env } from './env.js';

async function queryNoble(origin, dest, date, apiKey) {
  const url = `https://api.noblewebstudio.com/v1/flights?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Noble API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const flights = data.flights || data.data || (Array.isArray(data) ? data : []);

  if (!Array.isArray(flights) || flights.length === 0) {
    throw new Error('No flights found in Noble response');
  }

  return flights.map((f) => ({
    mode: 'flight',
    cost: price(f.price ?? f.cost ?? f.fare),
    duration: f.duration || '2h 15m',
    url: f.url || f.bookingUrl || `https://www.google.com/travel/flights?q=flights%20from%20${encodeURIComponent(origin)}%20to%20${encodeURIComponent(dest)}%20on%20${encodeURIComponent(date)}`,
    airline: f.airline || f.airlineName || 'Domestic Airline'
  }));
}

async function queryAviationstack(origin, dest, date, apiKey) {
  const url = `https://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(apiKey)}&dep_iata=${encodeURIComponent(origin)}&arr_iata=${encodeURIComponent(dest)}&flight_date=${encodeURIComponent(date)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Aviationstack error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
    throw new Error('No flight data returned from Aviationstack');
  }

  return data.data.map((f) => ({
    mode: 'flight',
    cost: price(f.price ?? f.cost ?? f.fare),
    duration: f.flight?.duration || '2h 30m',
    url: `https://www.google.com/travel/flights?q=flights%20from%20${encodeURIComponent(origin)}%20to%20${encodeURIComponent(dest)}%20on%20${encodeURIComponent(date)}`,
    airline: f.airline?.name || 'Scheduled Carrier'
  }));
}

export async function searchFlights(origin, dest, date) {
  try {
    const nobleKey = env('VITE_NOBLE_KEY');
    const aviationKey = env('VITE_AVIATIONSTACK_KEY');

    let results = null;

    if (nobleKey) {
      try {
        results = await queryNoble(origin, dest, date, nobleKey);
      } catch (nobleErr) {
        console.warn('Noble flight query failed, trying Aviationstack fallback:', nobleErr.message);
      }
    }

    if (!results && aviationKey) {
      try {
        results = await queryAviationstack(origin, dest, date, aviationKey);
      } catch (aviationErr) {
        console.warn('Aviationstack query failed:', aviationErr.message);
      }
    }

    if (!results || results.length === 0) {
      throw new Error('No flight data available from live providers');
    }

    return results;
  } catch (error) {
    console.warn('searchFlights failed, falling back to cached flights.json:', error.message);
    try {
      const fallback = await import('../data/fallback/flights.json', { with: { type: 'json' } });
      return fallback.default || fallback;
    } catch (fallbackError) {
      console.warn('Fallback flights.json not found or unreadable:', fallbackError.message);
      return [];
    }
  }
}

