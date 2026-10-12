import normalizedKeralaPlaces from '../../data/india/kerala/normalized-places.json' with {type:'json'};
import normalizedKeralaAccom from '../../data/india/kerala/normalized-accommodation.json' with {type:'json'};

export const keralaResearchPlaces = normalizedKeralaPlaces;
export const keralaResearchAccommodation = normalizedKeralaAccom;

export function getKeralaDestinations(filters = {}) {
  let list = keralaResearchPlaces;

  if (filters.city) {
    const c = filters.city.toLowerCase();
    list = list.filter(d => (d.city || '').toLowerCase() === c);
  }

  if (filters.category) {
    const cat = filters.category.toLowerCase();
    list = list.filter(d => (d.category || '').toLowerCase().includes(cat));
  }

  if (typeof filters.hasCoords === 'boolean') {
    list = list.filter(d => d.hasCoords === filters.hasCoords);
  }

  if (filters.query) {
    const q = filters.query.toLowerCase().trim();
    list = list.filter(d =>
      (d.name || '').toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q) ||
      (d.neighbourhood || '').toLowerCase().includes(q)
    );
  }

  return list;
}

export function getKeralaAccommodation(filters = {}) {
  let list = keralaResearchAccommodation;

  if (filters.type) {
    const t = filters.type.toLowerCase();
    list = list.filter(a => (a.type || '').toLowerCase().includes(t));
  }

  if (filters.location) {
    const loc = filters.location.toLowerCase();
    list = list.filter(a => (a.location || '').toLowerCase().includes(loc));
  }

  if (filters.query) {
    const q = filters.query.toLowerCase().trim();
    list = list.filter(a =>
      (a.name || '').toLowerCase().includes(q) ||
      (a.location || '').toLowerCase().includes(q)
    );
  }

  return list;
}

export function toPicoDiscoverPlace(dest) {
  const caveatParts = [];
  if (dest.isFeeConflicting) {
    caveatParts.push(`Fee requires verification: ${dest.entryFeeText}`);
  }
  if (dest.isHoursConflicting) {
    caveatParts.push(`Hours conflict: ${dest.openingHoursText}`);
  }
  if (dest.isTimeSensitive) {
    caveatParts.push(`Time-sensitive event: ${dest.notes || 'Confirm current edition dates'}`);
  }
  if (dest.notes && !dest.isTimeSensitive && !dest.isFeeConflicting) {
    caveatParts.push(dest.notes);
  }

  const caveatText = caveatParts.length > 0
    ? caveatParts.join(' · ')
    : 'Confirm opening hours and admission locally.';

  return {
    id: dest.id,
    name: dest.name,
    city: dest.city,
    neighbourhood: dest.neighbourhood,
    category: dest.category.split('/')[0].trim(),
    subtitle: `${dest.neighbourhood || dest.city} · ${dest.category}`,
    description: dest.description,
    cost: dest.costEstimate,
    coords: dest.coords, // null if missing
    hasCoords: dest.hasCoords,
    time: dest.durationMinutes || 60,
    distance: dest.visitDurationText,
    caveat: caveatText,
    realityCheck: caveatText,
    source: 'RESEARCH_CATALOGUE',
    sourceUrls: dest.sourceUrls,
    officialUrl: dest.officialUrl,
    confidence: dest.confidence,
    image: '/assets/fort-kochi.jpg'
  };
}
