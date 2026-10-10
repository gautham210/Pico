import realityChecks from '../data/reality_checks.json' with { type: 'json' };

export async function getPlaces(city, prefs) {
  try {
    const query = encodeURIComponent(`tourist attractions in ${city || 'Goa'}`);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=15`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Pico-Demo-App/0.1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data) || data.length === 0) {
      const fallbackModule = await import('../data/places.json', { with: { type: 'json' } });
      return fallbackModule.default || fallbackModule;
    }

    return data.map((p) => {
      const id = p.place_id.toString();
      return {
        id,
        google_place_id: id, // maintain contract compatibility
        name: p.name || p.display_name.split(',')[0],
        city: city || 'Goa',
        coords: [parseFloat(p.lat), parseFloat(p.lon)],
        category: p.type || 'attraction',
        vibe_tags: [p.type, p.class].filter(Boolean),
        rating: 4.5,
        userRatingCount: 100,
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
