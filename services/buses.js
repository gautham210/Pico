import {price} from './providers/contracts.js';
import ApifyClientModule from 'apify-client';
import { env } from './env.js';

export async function searchBusesWithStatus(origin, dest, date) {
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
    },{waitSecs:8,timeout:8,log:null});

    if(run?.status&&run.status!=='SUCCEEDED')throw new Error('Bus search did not complete successfully.');

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      throw new Error('No bus results returned from Apify redBus actor');
    }

    return {source:'LIVE',provider:'Apify redBus scraper',results:items.map((bus) => ({
      mode: 'bus',
      cost: price(bus.fare ?? bus.price ?? bus.cost),
      duration: bus.duration || bus.travelTime || null,
      url: bus.url || bus.bookingUrl || `https://www.redbus.in/bus-tickets/${encodeURIComponent(origin.toLowerCase())}-to-${encodeURIComponent(dest.toLowerCase())}?date=${encodeURIComponent(date)}`,
      operator: bus.operator || bus.travelsName || bus.travels || bus.name || 'Operator unavailable',
      departure: bus.departureTime || bus.departure || '',
      arrival: bus.arrivalTime || bus.arrival || ''
    }))};
  } catch (error) {
    console.warn('Bus provider failed; using the configured local fallback.');
    try {
      const fallback = await import('../data/fallback/buses.json', { with: { type: 'json' } });
      const results=fallback.default || fallback;
      return {source:results.length?'DEMO':'UNAVAILABLE',provider:results.length?'local fallback':'Apify redBus scraper',results,reason:'Bus provider is unavailable or not configured.'};
    } catch (fallbackError) {
      console.warn('Bus fallback data is unavailable.');
      return {source:'UNAVAILABLE',provider:'Apify redBus scraper',results:[],reason:'Bus provider is unavailable or not configured.'};
    }
  }
}

export async function searchBuses(origin, dest, date) {
  return (await searchBusesWithStatus(origin,dest,date)).results;
}

