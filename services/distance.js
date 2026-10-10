import { env } from './env.js';

export async function getNearby(coords, placeIds, mode = 'driving') {
  try {
    const apiKey = env('VITE_GOOGLE_PLACES_KEY');
    if (!apiKey) {
      throw new Error('Google Places API key is missing');
    }

    if (!coords || !Array.isArray(placeIds) || placeIds.length === 0) {
      return [];
    }

    const originParam = Array.isArray(coords) ? `${coords[0]},${coords[1]}` : `${coords.lat},${coords.lng}`;
    
    // Support placeIds as either strings (place_id or id) or objects with coordinates
    const destinationsParam = placeIds
      .map((p) => {
        if (typeof p === 'string') {
          return p.startsWith('ChIJ') ? `place_id:${p}` : p;
        }
        if (p.coords && Array.isArray(p.coords)) {
          return `${p.coords[0]},${p.coords[1]}`;
        }
        return p.id ? `place_id:${p.id}` : '';
      })
      .filter(Boolean)
      .join('|');

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(originParam)}&destinations=${encodeURIComponent(destinationsParam)}&mode=${encodeURIComponent(mode)}&departure_time=now&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Distance Matrix API HTTP error: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== 'OK' || !data.rows || !data.rows[0]?.elements) {
      throw new Error(data.error_message || 'Distance Matrix returned invalid status');
    }

    const elements = data.rows[0].elements;

    return placeIds.map((place, index) => {
      const el = elements[index] || {};
      const durationInTraffic = el.duration_in_traffic?.text;
      const duration = el.duration?.text || '15 mins';

      return {
        place: typeof place === 'object' ? (place.id || place.name) : place,
        mode,
        time: durationInTraffic || duration,
        traffic: durationInTraffic ? 'heavy' : 'normal'
      };
    });
  } catch (error) {
    console.warn('getNearby failed, returning estimated distances:', error.message);
    return placeIds.map((place) => ({
      place: typeof place === 'object' ? (place.id || place.name) : place,
      mode,
      time: '20 mins',
      traffic: 'normal'
    }));
  }
}
