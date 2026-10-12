import fs from 'node:fs';
import path from 'node:path';

// In-memory cache of normalized India state datasets
let cachedDestinations = null;
let cachedAccommodation = null;

function loadDatasets() {
  if (cachedDestinations && cachedAccommodation) {
    return { destinations: cachedDestinations, accommodation: cachedAccommodation };
  }

  const root = process.cwd();
  const placesFile = path.join(root, 'data', 'india', 'kerala', 'normalized-places.json');
  const accomFile = path.join(root, 'data', 'india', 'kerala', 'normalized-accommodation.json');

  let dests = [];
  let accom = [];

  try {
    if (fs.existsSync(placesFile)) {
      dests = JSON.parse(fs.readFileSync(placesFile, 'utf8'));
    }
    if (fs.existsSync(accomFile)) {
      accom = JSON.parse(fs.readFileSync(accomFile, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to load India datasets from disk:', err);
  }

  cachedDestinations = dests;
  cachedAccommodation = accom;
  return { destinations: dests, accommodation: accom };
}

export function getDestinations(filters = {}) {
  const { destinations } = loadDatasets();
  let list = destinations;

  if (filters.state) {
    const s = filters.state.toLowerCase();
    list = list.filter(d => (d.state || '').toLowerCase() === s);
  }

  if (filters.city) {
    const c = filters.city.toLowerCase();
    list = list.filter(d => (d.city || '').toLowerCase() === c);
  }

  if (filters.category) {
    const cat = filters.category.toLowerCase();
    list = list.filter(d => (d.category || '').toLowerCase().includes(cat));
  }

  if (filters.neighbourhood) {
    const n = filters.neighbourhood.toLowerCase();
    list = list.filter(d => (d.neighbourhood || '').toLowerCase().includes(n));
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

export function getDestinationById(id) {
  const { destinations } = loadDatasets();
  return destinations.find(d => d.id === id) || null;
}

export function getAccommodation(filters = {}) {
  const { accommodation } = loadDatasets();
  let list = accommodation;

  if (filters.state) {
    const s = filters.state.toLowerCase();
    list = list.filter(a => (a.state || '').toLowerCase() === s);
  }

  if (filters.type) {
    const t = filters.type.toLowerCase();
    list = list.filter(a => (a.type || '').toLowerCase().includes(t));
  }

  if (filters.location) {
    const loc = filters.location.toLowerCase();
    list = list.filter(a => (a.location || '').toLowerCase().includes(loc));
  }

  if (filters.facility) {
    const fac = filters.facility.toLowerCase();
    list = list.filter(a => a.facilities.some(f => f.toLowerCase().includes(fac)));
  }

  if (filters.query) {
    const q = filters.query.toLowerCase().trim();
    list = list.filter(a => 
      (a.name || '').toLowerCase().includes(q) ||
      (a.location || '').toLowerCase().includes(q) ||
      (a.classification || '').toLowerCase().includes(q)
    );
  }

  return list;
}

export function getAccommodationById(id) {
  const { accommodation } = loadDatasets();
  return accommodation.find(a => a.id === id) || null;
}

/**
 * Adapter to shape research destinations into Pico's Discover card schema
 */
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
    coords: dest.coords, // Preserved as null if missing; no false pins
    hasCoords: dest.hasCoords,
    time: dest.durationMinutes || 60,
    distance: dest.visitDurationText,
    caveat: caveatText,
    realityCheck: caveatText,
    source: 'RESEARCH_CATALOGUE',
    sourceUrls: dest.sourceUrls,
    officialUrl: dest.officialUrl,
    confidence: dest.confidence,
    image: '/assets/fort-kochi.jpg' // branded fallback asset
  };
}
