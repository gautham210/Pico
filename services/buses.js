import ApifyClientModule from 'apify-client';
import { env } from './env.js';

export async function searchBuses(origin, dest, date) {
  try {
    const token = env('VITE_APIFY_KEY');
    if (!token) {
      throw new Error('Missing VITE_APIFY_KEY');
    }

    const ApifyConstructor = ApifyClientModule?.ApifyClient || ApifyClientModule?.default || ApifyClientModule;
    if (typeof ApifyConstructor !== 'function') {
      throw new Error('ApifyClient constructor not available');
    }

    const client = new ApifyConstructor({ token });

    // Call redBus scraper actor
    const run = await client.actor('curious_coder/redbus-scraper').call({
      from: origin,
      to: dest,
      date: date
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      throw new Error('No bus results returned from Apify redBus actor');
    }

    return items.map((bus) => ({
      mode: 'bus',
      cost: Number(bus.fare || bus.price || bus.cost || 0),
      duration: bus.duration || bus.travelTime || '0h 0m',
      url: bus.url || bus.bookingUrl || `https://www.redbus.in/bus-tickets/${encodeURIComponent(origin.toLowerCase())}-to-${encodeURIComponent(dest.toLowerCase())}?date=${encodeURIComponent(date)}`,
      operator: bus.operator || bus.travelsName || bus.travels || bus.name || 'Private Travels',
      departure: bus.departureTime || bus.departure || '',
      arrival: bus.arrivalTime || bus.arrival || ''
    }));
  } catch (error) {
    console.warn('searchBuses failed, falling back to cached buses.json:', error.message);
    try {
      const fallback = await import('../data/fallback/buses.json');
      return fallback.default || fallback;
    } catch (fallbackError) {
      console.warn('Fallback buses.json not found or unreadable:', fallbackError.message);
      return [];
    }
  }
}
