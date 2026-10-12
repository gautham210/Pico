import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  validatePlacesDataset,
  validateAccommodationDataset,
  generateStablePlaceId
} from '../scripts/validate-india-datasets.mjs';
import {
  getDestinations,
  getDestinationById,
  getAccommodation,
  getAccommodationById,
  toPicoDiscoverPlace
} from '../services/india-data.js';

console.log('--- Testing Pico Kerala Places & Accommodation Integration (Phase 7) ---');

// 1. Parse both complete source JSON files
const placesFile = path.join(process.cwd(), 'data', 'india', 'kerala', 'places.json');
const accomFile = path.join(process.cwd(), 'data', 'india', 'kerala', 'accommodation.json');

assert.ok(fs.existsSync(placesFile), 'places.json must exist in data/india/kerala/');
assert.ok(fs.existsSync(accomFile), 'accommodation.json must exist in data/india/kerala/');

const rawPlaces = JSON.parse(fs.readFileSync(placesFile, 'utf8'));
const rawAccom = JSON.parse(fs.readFileSync(accomFile, 'utf8'));

assert.equal(Array.isArray(rawPlaces), true, 'places.json must parse into array');
assert.equal(Array.isArray(rawAccom), true, 'accommodation.json must parse into array');
assert.equal(rawPlaces.length, 7, 'Exact 7 destination records in places.json');
assert.equal(rawAccom.length, 3, 'Exact 3 accommodation records in accommodation.json');
console.log('PASS: Both source JSON files parsed successfully with exact record counts (7 places, 3 stays).');

// 2. Validate every record is processed
const placesReport = validatePlacesDataset(rawPlaces, 'Kerala');
const accomReport = validateAccommodationDataset(rawAccom, 'Kerala');

assert.equal(placesReport.total, 7);
assert.equal(placesReport.valid, 7, 'All 7 places pass schema validation');
assert.equal(accomReport.total, 3);
assert.equal(accomReport.valid, 3, 'All 3 stays pass schema validation');
console.log('PASS: 100% of records processed without dropped entities.');

// 3. Safe handling of missing optional values (null coordinates, null entry fee, null duration)
const biennale = placesReport.normalized.find(p => p.name.includes('Biennale'));
assert.ok(biennale, 'Kochi-Muziris Biennale record exists');
assert.equal(biennale.coords, null, 'Null coordinates preserved safely');
assert.equal(biennale.hasCoords, false, 'hasCoords flagged false');
assert.equal(biennale.address, null, 'Null address preserved safely');
assert.equal(biennale.durationMinutes, 60, 'Default fallback duration applied when duration is null');

const varamm = accomReport.normalized.find(a => a.id === 'KL-TVM-VARAMM');
assert.ok(varamm, 'The Varamm homestay exists');
assert.equal(varamm.observedPriceInr, null, 'Null price observation preserved safely');
assert.equal(varamm.priceObservationText, 'Price on enquiry');
console.log('PASS: Missing optional values handled safely without runtime errors.');

// 4. Stable, deterministic collision-resistant IDs
const id1 = generateStablePlaceId('Kerala', 'Kochi', 'Chinese Fishing Nets');
const id2 = generateStablePlaceId('Kerala', 'Kochi', 'Chinese Fishing Nets');
assert.equal(id1, id2, 'Deterministic ID is identical on repeated invocation');
assert.equal(id1, 'kl-kochi-chinese-fishing-nets', 'ID format matches state-city-slug');

assert.equal(accomReport.normalized[0].id, 'KL-TVM-VARAMM', 'Accommodation ID preserves upstream key');
console.log('PASS: Stable IDs verified and collision-resistant.');

// 5. Duplicate detection
const duplicateTest = validatePlacesDataset([
  rawPlaces[0],
  rawPlaces[0] // duplicate
]);
assert.equal(duplicateTest.duplicates.length, 1, 'Duplicate detected by city and name');
console.log('PASS: Duplicate detection works.');

// 6. Coordinate validation (records with null coords are preserved as null, not invented)
assert.equal(placesReport.missingCoords.length, 7, 'All 7 researched places have null coordinates');
assert.ok(placesReport.normalized.every(p => p.coords === null), 'Never invent coordinates for missing entries');
console.log('PASS: Missing coordinates preserved honestly as null.');

// 7. Conflicting and outdated data flagged correctly
assert.equal(placesReport.conflictingFees.length, 3, 'Mattancherry Palace, Paradesi Synagogue, Hill Palace Museum flagged for fee conflict');
assert.equal(placesReport.conflictingHours.length, 3, 'Paradesi Synagogue, Hill Palace Museum, Cherai Beach flagged for hours conflict');
assert.equal(placesReport.timeSensitive.length, 1, 'Biennale flagged for time-sensitive edition status');

const mat = placesReport.normalized.find(p => p.name === 'Mattancherry Palace');
assert.equal(mat.isFeeConflicting, true);
const discoverMat = toPicoDiscoverPlace(mat);
assert.match(discoverMat.caveat, /Fee requires verification/);
console.log('PASS: Conflicting fees, hours, and past events flagged transparently.');

// 8. Service search and filtering
const kochiDests = getDestinations({ city: 'Kochi' });
assert.equal(kochiDests.length, 7, 'Filter by city Kochi returns all 7 places');

const museumDests = getDestinations({ category: 'Museum' });
assert.equal(museumDests.length, 3, 'Folklore Museum, Hill Palace, Mattancherry Palace');

const searchResult = getDestinations({ query: 'synagogue' });
assert.equal(searchResult.length, 1);
assert.equal(searchResult[0].name, 'Paradesi Synagogue');

const homestays = getAccommodation({ type: 'homestay' });
assert.equal(homestays.length, 2, 'The Varamm and Coconut Creek');

const yogaStays = getAccommodation({ facility: 'yoga' });
assert.equal(yogaStays.length, 1);
assert.equal(yogaStays[0].name, 'The Varamm');
console.log('PASS: Search by name, category, city, and accommodation facilities verified.');

// 9. Accommodation isolated from attractions count
assert.equal(kochiDests.every(d => d.sourceType === 'RESEARCH_CATALOGUE'), true);
assert.equal(homestays.every(h => h.sourceType === 'ACCOMMODATION_CATALOGUE'), true);
console.log('PASS: Accommodation and attraction entity models strictly decoupled.');

// 10. Destination detail formatting
const folklore = getDestinationById('kl-kochi-kerala-folklore-museum');
assert.ok(folklore, 'Folklore museum by ID retrieved');
const discoverFolklore = toPicoDiscoverPlace(folklore);
assert.equal(discoverFolklore.cost, 100, 'Entry fee ₹100 parsed cleanly');
assert.equal(discoverFolklore.hasCoords, false);
console.log('PASS: Destination detail formatting produces clean Discover card objects.');

// 11. Coordinate-less places do not create false map pins
const { validCoords } = await import('../services/providers/contracts.js');
assert.equal(validCoords(discoverFolklore.coords), false, 'Null coords rejected by map validator');
assert.equal(validCoords([9.9658, 76.2421]), true, 'Real coordinates accepted by map validator');
console.log('PASS: Coordinate-less places cannot create false map pins.');

// 12. Existing API compatibility test
const { getPlaces } = await import('../services/places.js');
const goaPlaces = await getPlaces('Goa');
assert.ok(goaPlaces.length > 0, 'Existing /api/places functionality preserved for Goa');
console.log('PASS: Existing /api/places functionality and contracts preserved.');

// 13. Extensible multi-state architecture (adding Karnataka mock does not break Kerala)
const mockKarnataka = [
  { name: 'Badami Cave Temples', city: 'Badami', category: 'Heritage', description: 'Rock-cut temples' }
];
const karnatakaReport = validatePlacesDataset(mockKarnataka, 'Karnataka');
assert.equal(karnatakaReport.valid, 1);
assert.equal(karnatakaReport.normalized[0].id, 'ka-badami-badami-cave-temples');
assert.equal(karnatakaReport.normalized[0].state, 'Karnataka');
console.log('PASS: Multi-state ingestion architecture validated with independent state namespaces.');

console.log('ALL KERALA INTEGRATION TESTS PASSED SUCCESSFULLY.');
