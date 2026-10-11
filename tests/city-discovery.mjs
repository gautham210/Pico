import assert from 'node:assert/strict';
import fs from 'node:fs';
import {supportedCities,cityPlaces} from '../data/city-collections.js';
import {loadCatalog} from '../src/lib/catalog.js';
import {destinationPhotos} from '../src/data/destination-photos.js';
import {itinerary} from '../src/lib/journey.js';
const saved=new Map();globalThis.localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
const {useStore}=await import('../src/lib/store.js');
const beforeFetch=globalThis.fetch;globalThis.fetch=async()=>{throw new Error('Simulated offline');};
assert.equal(supportedCities.length,6);assert.equal(new Set(cityPlaces.map(p=>p.id)).size,cityPlaces.length);
for(const city of supportedCities){
 useStore.getState().setPrefs({city});assert.equal(useStore.getState().userPrefs.city,city);
 const collection=await loadCatalog(city);assert.ok(collection.places.length>=3);
 assert.ok(collection.places.every(p=>(p.city||'Kochi')===city));
 if(city==='Bengaluru'){
  assert.match(collection.places[0].name,/Lalbagh/);
  for(const place of collection.places.slice(0,2))assert.equal(useStore.getState().likePlace(place),true);
 }
}
assert.equal(useStore.getState().likedPlaces.length,2);await useStore.persist.rehydrate();
assert.equal(useStore.getState().likedPlaces.length,2);assert.equal(itinerary(useStore.getState()).flatMap(day=>day.stops).length,2);
assert.ok(useStore.getState().likedPlaces.every(p=>p.cost===null||Number.isFinite(p.cost)));assert.equal(useStore.getState().diary.length,0);
for(const photo of Object.values(destinationPhotos)){
 const bytes=fs.readFileSync('public'+photo.image);assert.equal(bytes[0],0xff);assert.equal(bytes[1],0xd8);assert.ok(bytes.length>50000);assert.ok(photo.photoAuthor&&photo.photoLicense&&photo.photoSource);
}
const goa=await loadCatalog('Goa');assert.ok(goa.places.find(p=>p.id==='goa_anjuna_beach').image.endsWith('anjuna.jpg'));
globalThis.fetch=beforeFetch;
console.log('PASS six isolated city collections, offline catalogs, saved-stop persistence, real itinerary derivation, unknown prices and licensed JPEG assets. No live-provider claim.');
