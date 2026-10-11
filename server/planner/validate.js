import {supportedCities} from '../../data/city-collections.js';
import {validCoords} from '../../services/providers/contracts.js';
import {text} from '../api-utils.js';

export function validatePlannerInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  const origin = body.origin ? text(body.origin, 80) : '';
  const destination = body.destination ? text(body.destination, 80) : text(body.city, 80);
  
  if (!destination) {
    return { valid: false, error: 'Destination is required.' };
  }

  const multiCity = Boolean(body.multiCity || (Array.isArray(body.destinations) && body.destinations.length > 1));
  const rawDestinations = Array.isArray(body.destinations) 
    ? body.destinations.map(d => text(d, 80)).filter(Boolean)
    : [destination];

  const destinations = rawDestinations.length ? rawDestinations : [destination];

  const daysNum = Number(body.days);
  const days = Number.isFinite(daysNum) ? Math.max(1, Math.min(7, Math.trunc(daysNum))) : 3;

  const travelersNum = Number(body.travelers);
  const travelers = Number.isFinite(travelersNum) ? Math.max(1, Math.min(12, Math.trunc(travelersNum))) : 1;

  const budgetNum = Number(body.budget ?? body.budgetEnvelope);
  const budget = Number.isFinite(budgetNum) && budgetNum >= 0 ? Math.trunc(budgetNum) : 20000;

  const startDate = typeof body.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.startDate)
    && !Number.isNaN(Date.parse(`${body.startDate}T00:00:00Z`))
    ? body.startDate
    : null;

  const pace = ['relaxed', 'balanced', 'full'].includes(body.pace) ? body.pace : 'balanced';

  const vibes = Array.isArray(body.vibes || body.interests)
    ? [...new Set((body.vibes || body.interests).filter(v => typeof v === 'string').map(v => v.trim().toLowerCase()).filter(Boolean))]
    : [];

  const mode = ['cheapest', 'convenient', 'fastest'].includes(body.mode) ? body.mode : 'convenient';

  // Saved places validation
  const rawSaved = Array.isArray(body.savedPlaces) ? body.savedPlaces : Array.isArray(body.places) ? body.places : [];
  const savedPlaces = [];
  const seenIds = new Set();

  for (const item of rawSaved) {
    if (!item || typeof item !== 'object') continue;
    const id = text(item.id, 160);
    const name = text(item.name, 160);
    if (!id || !name || seenIds.has(id)) continue;
    seenIds.add(id);

    const costNum = Number(item.cost ?? item.avg_cost_inr);
    const cost = Number.isFinite(costNum) && costNum >= 0 ? Math.round(costNum) : null;

    const timeNum = Number(item.time);
    const time = Number.isFinite(timeNum) && timeNum > 0 ? Math.round(timeNum) : 90;

    const city = item.city ? text(item.city, 80) : destination;
    const coords = validCoords(item.coords) ? [Number(item.coords[0]), Number(item.coords[1])] : null;
    const category = item.category ? text(item.category, 60) : 'General';
    const caveat = item.caveat || item.reality_check ? text(item.caveat || item.reality_check, 300) : null;
    const description = item.description ? text(item.description, 400) : '';

    savedPlaces.push({
      id,
      name,
      city: city || destination,
      category,
      cost,
      time,
      coords,
      caveat,
      description,
      image: item.image || ''
    });
  }

  // Rejected places
  const rawRejected = Array.isArray(body.rejectedPlaces) ? body.rejectedPlaces : [];
  const rejectedPlaces = [];
  for (const item of rawRejected) {
    if (!item || typeof item !== 'object') continue;
    const id = text(item.id, 160);
    if (id) rejectedPlaces.push(id);
  }

  // Constraints
  const constraints = typeof body.constraints === 'object' && body.constraints !== null ? {
    noFlights: Boolean(body.constraints.noFlights),
    maxPerDayBudget: Number.isFinite(Number(body.constraints.maxPerDayBudget)) ? Number(body.constraints.maxPerDayBudget) : null,
    mustVisit: Array.isArray(body.constraints.mustVisit) ? body.constraints.mustVisit.map(x => text(x, 160)).filter(Boolean) : [],
    avoidCategories: Array.isArray(body.constraints.avoidCategories) ? body.constraints.avoidCategories.map(x => text(x, 60)).filter(Boolean) : []
  } : {
    noFlights: false,
    maxPerDayBudget: null,
    mustVisit: [],
    avoidCategories: []
  };

  return {
    valid: true,
    data: {
      origin,
      destination,
      destinations,
      multiCity,
      days,
      travelers,
      budget,
      startDate,
      pace,
      vibes,
      mode,
      savedPlaces,
      rejectedPlaces,
      constraints
    }
  };
}
