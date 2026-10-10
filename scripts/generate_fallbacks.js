import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  searchTrains,
  searchBuses,
  searchFlights,
  getPlaces,
  getNearby
} from '../services/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const fallbackDir = path.join(rootDir, 'data', 'fallback');

if (!fs.existsSync(fallbackDir)) {
  fs.mkdirSync(fallbackDir, { recursive: true });
}

let okCount = 0;
let failedCount = 0;

// 1. searchTrains
try {
  const trains = await searchTrains('Kozhikode', 'Goa', '2026-11-02');
  fs.writeFileSync(path.join(fallbackDir, 'trains.json'), JSON.stringify(trains, null, 2));
  console.log(`trains: ${Array.isArray(trains) ? trains.length : 1} results`);
  okCount++;
} catch (error) {
  console.log(`trains: FAILED — ${error.message}`);
  failedCount++;
}

// 2. searchBuses
try {
  const buses = await searchBuses('Kozhikode', 'Goa', '2026-11-02');
  fs.writeFileSync(path.join(fallbackDir, 'buses.json'), JSON.stringify(buses, null, 2));
  console.log(`buses: ${Array.isArray(buses) ? buses.length : 1} results`);
  okCount++;
} catch (error) {
  console.log(`buses: FAILED — ${error.message}`);
  failedCount++;
}

// 3. searchFlights
try {
  const flights = await searchFlights('CCJ', 'GOI', '2026-11-02');
  fs.writeFileSync(path.join(fallbackDir, 'flights.json'), JSON.stringify(flights, null, 2));
  console.log(`flights: ${Array.isArray(flights) ? flights.length : 1} results`);
  okCount++;
} catch (error) {
  console.log(`flights: FAILED — ${error.message}`);
  failedCount++;
}

// 4. getPlaces
try {
  const places = await getPlaces('Goa', {});
  fs.writeFileSync(path.join(fallbackDir, 'places_goa.json'), JSON.stringify(places, null, 2));
  console.log(`places: ${Array.isArray(places) ? places.length : 1} results`);
  okCount++;
} catch (error) {
  console.log(`places: FAILED — ${error.message}`);
  failedCount++;
}

// 5. getNearby
try {
  const placesDataRaw = fs.readFileSync(path.join(rootDir, 'data', 'places.json'), 'utf-8');
  const placesData = JSON.parse(placesDataRaw);
  const first5Ids = placesData.slice(0, 5).map((p) => p.id);
  const nearby = await getNearby([15.5, 73.7], first5Ids, 'driving');
  fs.writeFileSync(path.join(fallbackDir, 'nearby.json'), JSON.stringify(nearby, null, 2));
  console.log(`nearby: ${Array.isArray(nearby) ? nearby.length : 1} results`);
  okCount++;
} catch (error) {
  console.log(`nearby: FAILED — ${error.message}`);
  failedCount++;
}

console.log(`OK: ${okCount}/5  FAILED: ${failedCount}/5`);
