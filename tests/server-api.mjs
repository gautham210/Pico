import assert from 'node:assert/strict';
import trains from '../api/trains.js';
import buses from '../api/buses.js';
import flights from '../api/flights.js';
import places from '../api/places.js';
import distance from '../api/distance.js';
import {searchFlightsWithStatus} from '../services/flights.js';
import {withTimeout} from '../server/api-utils.js';
import {loadCatalog} from '../src/lib/catalog.js';

async function invoke(handler,req){
  let status=200,body;
  const res={status(code){status=code;return this;},json(value){body=value;return value;},setHeader(){}};
  await handler(req,res);
  return {status,body};
}

const credentialNames=['IRCTC_KEY','APIFY_KEY','NOBLE_KEY','AVIATIONSTACK_KEY','GOOGLE_PLACES_KEY','OSM_PLACES_ENDPOINT','VITE_IRCTC_KEY','VITE_APIFY_KEY','VITE_NOBLE_KEY','VITE_AVIATIONSTACK_KEY','VITE_GOOGLE_PLACES_KEY'];
const savedCredentials=Object.fromEntries(credentialNames.map(name=>[name,process.env[name]]));
const originalFetch=globalThis.fetch;
try{
  for(const name of credentialNames)delete process.env[name];
  globalThis.fetch=async()=>{throw new Error('offline fixture');};
  const offlineCatalog=await loadCatalog('Goa');
  assert.equal(offlineCatalog.places.length,50);
  assert.match(offlineCatalog.source,/CACHED/);
  const invalidMethod=await invoke(trains,{method:'GET',body:{}});
  assert.equal(invalidMethod.status,405);
  const invalidTrip=await invoke(buses,{method:'POST',body:{origin:'BLR',destination:'BLR',date:'2026-11-01'}});
  assert.equal(invalidTrip.status,400);
  assert.equal((await invoke(flights,{method:'POST',body:{origin:'Bengaluru',destination:'Kochi',date:'2026-11-01'}})).status,400);
  const noTrain=await invoke(trains,{method:'POST',body:{origin:'BLR',destination:'COK',date:'2026-11-01'}});
  assert.equal(noTrain.body.status,'UNAVAILABLE');
  assert.deepEqual(noTrain.body.results,[]);
  const noBus=await invoke(buses,{method:'POST',body:{origin:'Bengaluru',destination:'Kochi',date:'2026-11-01'}});
  assert.equal(noBus.body.status,'UNAVAILABLE');
  const noFlight=await invoke(flights,{method:'POST',body:{origin:'BLR',destination:'COK',date:'2026-11-01'}});
  assert.equal(noFlight.body.status,'UNAVAILABLE');
  assert.equal(JSON.stringify(noFlight.body).includes('NOBLE_KEY'),false);
  process.env.VITE_NOBLE_KEY='prefixed-test-value-never-print';
  const prefixedKeyIgnored=await searchFlightsWithStatus('BLR','COK','2026-11-01');
  assert.equal(prefixedKeyIgnored.source,'UNAVAILABLE');
  delete process.env.VITE_NOBLE_KEY;
  const city=await invoke(places,{method:'GET',query:{city:'Goa'}});
  assert.equal(city.body.status,'CACHED');
  assert.ok(city.body.results.length>=20);
  assert.ok(city.body.results.every(row=>row.city==='Goa'));
  assert.equal((await invoke(places,{method:'GET',query:{city:'Goa',provider:'google',query:'beach'}})).body.status,'UNAVAILABLE');
  process.env.GOOGLE_PLACES_KEY='synthetic-google-test-key-never-print';
  globalThis.fetch=async(_url,options)=>{
    assert.equal(options.headers['X-Goog-Api-Key'],'synthetic-google-test-key-never-print');
    return new Response(JSON.stringify({places:[{id:'fixture-place',displayName:{text:'Fixture Beach'},formattedAddress:'Goa, India',location:{latitude:15.4,longitude:73.8},types:['beach'],rating:4.2,userRatingCount:12}]}),{status:200,headers:{'Content-Type':'application/json'}});
  };
  const livePlaces=await invoke(places,{method:'GET',query:{city:'Goa',provider:'google',query:'beach'}});
  assert.equal(livePlaces.body.status,'LIVE');
  assert.equal(livePlaces.body.results[0].rating,4.2);
  assert.equal(JSON.stringify(livePlaces.body).includes('synthetic-google-test-key-never-print'),false);
  process.env.OSM_PLACES_ENDPOINT='https://provider.example/search';
  globalThis.fetch=async()=>new Response(JSON.stringify([{osm_type:'node',osm_id:99,name:'Fixture fort',display_name:'Fixture fort, Goa, India',lat:'15.41',lon:'73.81',type:'fort',class:'historic'}]),{status:200,headers:{'Content-Type':'application/json'}});
  const liveOsm=await invoke(places,{method:'GET',query:{city:'Goa',provider:'osm',query:'fort'}});
  assert.equal(liveOsm.body.status,'LIVE');
  assert.equal(liveOsm.body.results.length,1);
  assert.match(liveOsm.body.attribution,/OpenStreetMap/);
  globalThis.fetch=async()=>new Response(JSON.stringify([{osm_type:'node',osm_id:100,name:'Foreign fort',display_name:'Foreign fort, Hanoi, Vietnam',lat:'21.0',lon:'105.8',type:'fort',class:'historic'}]),{status:200,headers:{'Content-Type':'application/json'}});
  const wrongCity=await invoke(places,{method:'GET',query:{city:'Goa',provider:'osm',query:'foreign'}});
  assert.equal(wrongCity.body.status,'CACHED');
  assert.ok(wrongCity.body.results.every(row=>row.city==='Goa'));
  globalThis.fetch=async()=>new Response(JSON.stringify({code:'Ok',routes:[{geometry:{coordinates:[[73.8,15.4],[73.9,15.5]]},distance:1234,duration:987}]}),{status:200,headers:{'Content-Type':'application/json'}});
  const route=await invoke(distance,{method:'POST',body:{operation:'route',stops:[[15.4,73.8],[15.5,73.9]]}});
  assert.equal(route.body.status,'LIVE');
  assert.equal(route.body.distanceKm,1.234);
  assert.equal(route.body.minutes,17);
  assert.equal((await invoke(distance,{method:'POST',body:{operation:'nearby',coords:[0,0],places:[{id:'x',coords:[91,181]}]}})).status,400);
  assert.equal((await invoke(distance,{method:'POST',body:{operation:'route',stops:[[0,0],[91,181]]}})).status,400);
  await assert.rejects(withTimeout(new Promise(()=>{}),5),{name:'TimeoutError'});

  // Exercise the real flight adapter with an in-memory upstream response.
  process.env.NOBLE_KEY='synthetic-test-token-never-print';
  globalThis.fetch=async()=>new Response(JSON.stringify({flights:[{airline:'Test Air',url:'https://book.test/?api_key=synthetic-test-token-never-print'}]}),{status:200,headers:{'Content-Type':'application/json'}});
  const flightResult=await searchFlightsWithStatus('BLR','COK','2026-11-01');
  assert.equal(flightResult.source,'LIVE');
  assert.equal(flightResult.results[0].cost,null);
  assert.equal(flightResult.results[0].duration,null);
  const served=await invoke(flights,{method:'POST',body:{origin:'BLR',destination:'COK',date:'2026-11-01'}});
  assert.equal(served.body.status,'LIVE');
  assert.equal(JSON.stringify(served.body).includes('synthetic-test-token-never-print'),false);
  assert.match(served.body.results[0].url,/\[redacted\]/);
  assert.equal(served.body.results[0].duration,null);
  console.log('PASS: Vercel API validation, unavailable/provenance responses, city-scoped places, timeout, and credential-safe mocked flight integration.');
}finally{
  globalThis.fetch=originalFetch;
  for(const name of credentialNames){if(savedCredentials[name]===undefined)delete process.env[name];else process.env[name]=savedCredentials[name];}
}
