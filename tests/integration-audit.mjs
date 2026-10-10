import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import * as api from '../services/api.js';
import { uberLink, olaLink } from '../services/rides.js';

// Offline contract audit: no provider calls, cloud writes or credentials.
globalThis.fetch = async () => { throw new Error('Offline contract audit'); };
const require = createRequire(import.meta.url);
const blocked = [];
for (const dependency of ['railkit', 'apify-client', 'firebase/app']) {
  try { require.resolve(dependency); } catch { blocked.push(`Missing dependency: ${dependency}`); }
}
for (const file of ['trains', 'buses']) {
  if (!fs.existsSync(`data/fallback/${file}.json`)) blocked.push(`Missing fallback: ${file}.json`);
}
const places = await api.getPlaces('Goa', {});
assert.ok(places.length >= 20);
assert.ok(places.every(p => typeof p.id === 'string' && Array.isArray(p.coords) && (Number.isFinite(p.avg_cost_inr)||p.avg_cost_inr===null)));
assert.ok(places.some(p=>p.avg_cost_inr===null),'Unsupported zero prices must be exposed as unknown.');
assert.equal(typeof await api.getRealityCheck(places[0].id), 'string');
const nearby = await api.getNearby(places[0].coords, [places[1].id], 'driving');
assert.equal(nearby.length, 1);
assert.equal(typeof nearby[0].time, 'string');
for (const search of ['searchTrains', 'searchBuses', 'searchFlights']) {
  try {
    const result = await api[search]('BLR', 'COK', '2026-11-01');
    assert.ok(Array.isArray(result));
    if (!result.length) blocked.push(`${search}: no usable cached results`);
  } catch (error) { blocked.push(`${search}: ${error.code || error.name}`); }
}
assert.equal(new URL(uberLink(places[0].coords, places[1].coords)).hostname, 'm.uber.com');
assert.equal(new URL(olaLink(places[0].coords, places[1].coords)).hostname, 'book.olacabs.com');
assert.equal(uberLink(null,places[1].coords),null);assert.equal(olaLink(places[0].coords,[91,181]),null);
console.log(`PASS: ${Object.keys(api).length} API exports; ${places.length} local place records; reality checks; nearby fallback shape; ride URLs.`);
console.log('BLOCKED (not live-provider passes):\n' + blocked.map(x => `- ${x}`).join('\n'));
