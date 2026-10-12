import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Slugify helper for stable collision-resistant deterministic IDs
const stateCodeMap = {
  kerala: 'kl',
  karnataka: 'ka',
  goa: 'ga',
  tamilnadu: 'tn',
  maharashtra: 'mh'
};

export function generateStablePlaceId(state, city, name) {
  const key = String(state || '').toLowerCase().replace(/[^a-z]/g, '');
  const normState = stateCodeMap[key] || key.slice(0, 2) || 'kl';
  const normCity = String(city || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const normName = String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `${normState}-${normCity}-${normName}`;
}

export function validatePlacesDataset(records, state = 'Kerala') {
  const report = {
    total: records.length,
    valid: 0,
    errors: [],
    warnings: [],
    duplicates: [],
    missingCoords: [],
    conflictingFees: [],
    conflictingHours: [],
    timeSensitive: [],
    normalized: []
  };

  const seenNames = new Map();

  for (let i = 0; i < records.length; i++) {
    const item = records[i];
    const index = i;
    const issues = [];

    // 1. Required fields
    if (!item.name || typeof item.name !== 'string') {
      issues.push(`Record ${index}: Missing or invalid 'name'`);
    }
    if (!item.city || typeof item.city !== 'string') {
      issues.push(`Record ${index}: Missing or invalid 'city'`);
    }
    if (!item.category || typeof item.category !== 'string') {
      issues.push(`Record ${index}: Missing or invalid 'category'`);
    }
    if (!item.description || typeof item.description !== 'string') {
      issues.push(`Record ${index}: Missing or invalid 'description'`);
    }

    // 2. Duplicate Detection
    const nameKey = `${item.city || ''}::${(item.name || '').toLowerCase()}`;
    if (seenNames.has(nameKey)) {
      report.duplicates.push({
        name: item.name,
        city: item.city,
        indices: [seenNames.get(nameKey), index]
      });
      issues.push(`Duplicate destination detected: ${item.name} in ${item.city}`);
    } else {
      seenNames.set(nameKey, index);
    }

    // 3. Stable Identifier
    const id = generateStablePlaceId(state, item.city, item.name);

    // 4. Coordinates Verification
    const hasValidCoords = typeof item.latitude === 'number' && Number.isFinite(item.latitude) &&
                           typeof item.longitude === 'number' && Number.isFinite(item.longitude) &&
                           item.latitude >= 8.0 && item.latitude <= 13.0 && // Kerala lat range
                           item.longitude >= 74.5 && item.longitude <= 78.0; // Kerala lng range

    if (!hasValidCoords) {
      report.missingCoords.push({ id, name: item.name, lat: item.latitude, lng: item.longitude });
    }

    // 5. Conflicting Fees
    const feeStr = String(item.entry_fee || '');
    const isFeeConflicting = feeStr.includes('CONFLICTING') || (item.notes && item.notes.toLowerCase().includes('fee conflict'));
    if (isFeeConflicting) {
      report.conflictingFees.push({ id, name: item.name, entryFee: item.entry_fee, notes: item.notes });
    }

    // 6. Conflicting Hours
    const hoursStr = String(item.opening_hours || '');
    const isHoursConflicting = hoursStr.includes('CONFLICTING') || (item.notes && item.notes.toLowerCase().includes('hours affected'));
    if (isHoursConflicting) {
      report.conflictingHours.push({ id, name: item.name, openingHours: item.opening_hours });
    }

    // 7. Time-sensitive / Past Events
    const isTimeSensitive = item.notes && (item.notes.includes('TIME-SENSITIVE') || item.notes.includes('concluded'));
    if (isTimeSensitive) {
      report.timeSensitive.push({ id, name: item.name, notes: item.notes });
    }

    if (issues.length > 0 && (!item.name || !item.city)) {
      report.errors.push({ id, issues });
    } else {
      report.valid++;
      if (issues.length > 0) report.warnings.push({ id, issues });

      // Normalized object
      const normalizedRecord = {
        id,
        name: item.name,
        state,
        city: item.city,
        neighbourhood: item.neighbourhood || null,
        category: item.category,
        description: item.description,
        address: item.address || null,
        coords: hasValidCoords ? [item.latitude, item.longitude] : null,
        hasCoords: hasValidCoords,
        durationMinutes: parseDuration(item.visit_duration_estimate),
        visitDurationText: item.visit_duration_estimate || 'Timing flexible',
        openingHoursText: item.opening_hours || 'Hours unconfirmed',
        isHoursConflicting,
        entryFeeText: item.entry_fee || 'Unverified',
        isFeeConflicting,
        costEstimate: parseCost(item.entry_fee),
        isTimeSensitive,
        confidence: item.confidence || 'Medium',
        notes: item.notes || null,
        sourceUrls: Array.isArray(item.source_urls) ? item.source_urls : [],
        officialUrl: item.official_url || null,
        sourceCheckedAt: item.source_checked_at || '2026-10-12',
        sourceType: 'RESEARCH_CATALOGUE'
      };

      report.normalized.push(normalizedRecord);
    }
  }

  return report;
}

export function validateAccommodationDataset(records, state = 'Kerala') {
  const report = {
    total: records.length,
    valid: 0,
    errors: [],
    warnings: [],
    duplicates: [],
    normalized: []
  };

  const seenIds = new Set();

  for (let i = 0; i < records.length; i++) {
    const item = records[i];
    const issues = [];

    if (!item.id || typeof item.id !== 'string') {
      issues.push(`Record ${i}: Missing 'id'`);
    } else if (seenIds.has(item.id)) {
      report.duplicates.push(item.id);
      issues.push(`Duplicate accommodation id: ${item.id}`);
    } else {
      seenIds.add(item.id);
    }

    if (!item.name || typeof item.name !== 'string') issues.push(`Record ${i}: Missing 'name'`);
    if (!item.type || typeof item.type !== 'string') issues.push(`Record ${i}: Missing 'type'`);
    if (!item.location || typeof item.location !== 'string') issues.push(`Record ${i}: Missing 'location'`);

    if (issues.length > 0 && (!item.id || !item.name)) {
      report.errors.push({ index: i, issues });
    } else {
      report.valid++;
      if (issues.length > 0) report.warnings.push({ id: item.id, issues });

      const parsedCost = parseObservedPrice(item.price_observation);

      report.normalized.push({
        id: item.id,
        name: item.name,
        state,
        type: item.type,
        classification: item.classification || null,
        location: item.location,
        facilities: Array.isArray(item.facilities) ? item.facilities : [],
        priceObservationText: item.price_observation || 'Price on enquiry',
        observedPriceInr: parsedCost,
        priceObservationDate: item.price_date || item.source_checked_at || null,
        isPriceDated: Boolean(item.price_date),
        source: item.source || 'keralatourism.org',
        confidence: item.confidence || 'high',
        sourceCheckedAt: item.source_checked_at || '2026-10-12',
        sourceType: 'ACCOMMODATION_CATALOGUE'
      });
    }
  }

  return report;
}

function parseDuration(str) {
  if (!str) return 60;
  const match = str.match(/(\d+)/);
  if (!match) return 60;
  const num = parseInt(match[1], 10);
  if (str.toLowerCase().includes('hour')) return num * 60;
  return num;
}

function parseCost(feeStr) {
  if (!feeStr) return null;
  const lower = feeStr.toLowerCase();
  if (lower.includes('free') || lower.includes('no entry fee')) return 0;
  const match = feeStr.match(/₹\s*(\d+)/);
  if (match) return parseInt(match[1], 10);
  return null;
}

function parseObservedPrice(priceStr) {
  if (!priceStr) return null;
  const match = priceStr.match(/₹\s*([0-9,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return null;
}

// CLI runner when executed directly
if (process.argv[1] && process.argv[1].endsWith('validate-india-datasets.mjs')) {
  const root = process.cwd();
  const placesPath = path.join(root, 'data', 'india', 'kerala', 'places.json');
  const accomPath = path.join(root, 'data', 'india', 'kerala', 'accommodation.json');

  console.log('--- Pico India Data Ingestion & Validation ---');
  if (!fs.existsSync(placesPath) || !fs.existsSync(accomPath)) {
    console.error('Error: Source files not found at expected paths.');
    process.exit(1);
  }

  const rawPlaces = JSON.parse(fs.readFileSync(placesPath, 'utf8'));
  const rawAccom = JSON.parse(fs.readFileSync(accomPath, 'utf8'));

  const placesReport = validatePlacesDataset(rawPlaces, 'Kerala');
  const accomReport = validateAccommodationDataset(rawAccom, 'Kerala');

  console.log(`Places total: ${placesReport.total}, Valid: ${placesReport.valid}`);
  console.log(`Places with missing coords: ${placesReport.missingCoords.length} (coordinates preserved as null)`);
  console.log(`Places with conflicting fees: ${placesReport.conflictingFees.length}`);
  console.log(`Places with conflicting hours: ${placesReport.conflictingHours.length}`);
  console.log(`Places time-sensitive: ${placesReport.timeSensitive.length}`);
  console.log(`Accommodation total: ${accomReport.total}, Valid: ${accomReport.valid}`);

  const outputDir = path.join(root, 'data', 'india', 'kerala');
  fs.writeFileSync(path.join(outputDir, 'normalized-places.json'), JSON.stringify(placesReport.normalized, null, 2));
  fs.writeFileSync(path.join(outputDir, 'normalized-accommodation.json'), JSON.stringify(accomReport.normalized, null, 2));
  fs.writeFileSync(path.join(outputDir, 'validation-report.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    places: {
      total: placesReport.total,
      valid: placesReport.valid,
      missingCoordinatesCount: placesReport.missingCoords.length,
      conflictingFeesCount: placesReport.conflictingFees.length,
      conflictingHoursCount: placesReport.conflictingHours.length,
      timeSensitiveCount: placesReport.timeSensitive.length,
      missingCoords: placesReport.missingCoords,
      conflictingFees: placesReport.conflictingFees
    },
    accommodation: {
      total: accomReport.total,
      valid: accomReport.valid,
      duplicates: accomReport.duplicates
    }
  }, null, 2));

  console.log('Normalized outputs written to data/india/kerala/');
}
