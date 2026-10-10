import realityChecks from '../data/reality_checks.json' with { type: 'json' };
import { env } from './env.js';

export async function getPlaces(city, prefs) {
  try {
    const apiKey = env('VITE_GOOGLE_PLACES_KEY');
    if (!apiKey) {
      throw new Error('Missing VITE_GOOGLE_PLACES_KEY');
    }

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.rating,places.userRatingCount,places.types'
      },
      body: JSON.stringify({
        textQuery: `top attractions in ${city}`
      })
    });

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.places || !Array.isArray(data.places) || data.places.length === 0) {
      const fallbackModule = await import('../data/places.json', { with: { type: 'json' } });
      return fallbackModule.default || fallbackModule;
    }

    return data.places.map((p) => {
      const id = p.id;
      return {
        id,
        google_place_id: id,
        name: p.displayName?.text || '',
        city: city || 'Goa',
        coords: [p.location?.latitude || 0, p.location?.longitude || 0],
        category: (p.types && p.types[0]) || 'attraction',
        vibe_tags: p.types || [],
        rating: p.rating || 0,
        userRatingCount: p.userRatingCount || 0,
        cost_tier: 1,
        avg_cost_inr: 0,
        crowd_level: 'medium',
        best_time: 'morning',
        closed_days: [],
        rarity: 'common',
        reality_check: realityChecks[id] || 'Nothing worth warning you about.',
        images: ['https://placehold.co/600x800']
      };
    });
  } catch (error) {
    console.warn('getPlaces failed, falling back to local places.json:', error.message);
    const fallbackModule = await import('../data/places.json', { with: { type: 'json' } });
    return fallbackModule.default || fallbackModule;
  }
}

export async function getRealityCheck(placeId) {
  if (!placeId) {
    return 'Nothing worth warning you about.';
  }

  return realityChecks[placeId] || 'Nothing worth warning you about.';
}
