import {requestJSON,validCoords,unavailable} from './contracts.js';
const cache=new Map();
const routeCache=new Map();
export async function getNearby(coords,places,mode='driving'){
 if(!Array.isArray(places))return [];
 if(mode!=='driving')return unavailable(places,mode,'This OSRM endpoint supports driving only.');
 const origin=Array.isArray(coords)?coords:[coords?.lat,coords?.lng];
 if(!validCoords(origin)||places.some(p=>!validCoords(p?.coords)))return unavailable(places,mode,'Valid coordinates are required for every place.');
 const points=[origin,...places.map(p=>p.coords)].map(c=>`${c[1]},${c[0]}`).join(';');
 if(cache.has(points))return cache.get(points).map(p=>({...p,source:'CACHED'}));
 try{const data=await requestJSON(`https://router.project-osrm.org/table/v1/driving/${points}?sources=0`);
 if(data.code!=='Ok'||!Array.isArray(data.durations?.[0]))throw new Error('No route returned.');
 const rows=places.map((p,i)=>{const seconds=data.durations[0][i+1],valid=Number.isFinite(seconds)&&seconds>=0;return {place:p.id||p.name,mode,time:valid?`${Math.ceil(seconds/60)} mins`:'Unavailable',minutes:valid?Math.ceil(seconds/60):null,traffic:'unknown',source:valid?'LIVE':'UNAVAILABLE',provider:'OSRM',attribution:'© OpenStreetMap contributors',retrievedAt:new Date().toISOString()};});cache.set(points,rows);return rows;
 }catch(error){return unavailable(places,mode,error.name==='TimeoutError'?'Routing timed out.':error.message);}
}

// Returns an ordered, road-routed line only when OSRM supplies valid geometry.
// Coordinates entering this adapter use [latitude, longitude]; GeoJSON leaves
// the provider in [longitude, latitude] order.
export async function getRoute(stops){
 if(!Array.isArray(stops)||stops.length<2)return {source:'UNAVAILABLE',reason:'Add at least two mapped stops to route this trip.'};
 if(stops.length>25)return {source:'UNAVAILABLE',reason:'Route preview supports up to 25 stops at a time.'};
 if(stops.some(stop=>!validCoords(Array.isArray(stop)?stop:stop?.coords)))return {source:'UNAVAILABLE',reason:'One or more stops do not have valid coordinates.'};
 const coords=stops.map(stop=>Array.isArray(stop)?stop:stop.coords);
 const points=coords.map(([lat,lng])=>`${lng},${lat}`).join(';');
 if(routeCache.has(points))return {...routeCache.get(points),source:'CACHED'};
 try{
  const data=await requestJSON(`https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson&steps=false`);
  const route=data.code==='Ok'?data.routes?.[0]:null;
  const geometry=route?.geometry?.coordinates;
  const validGeometry=Array.isArray(geometry)&&geometry.length>=2&&geometry.every(c=>Array.isArray(c)&&c.length===2&&c.every(Number.isFinite)&&Math.abs(c[0])<=180&&Math.abs(c[1])<=90);
  if(!validGeometry||!Number.isFinite(route.distance)||!Number.isFinite(route.duration)||route.distance<0||route.duration<0)throw new Error('OSRM did not return a valid mapped route.');
  const result={source:'LIVE',provider:'OSRM',attribution:'© OpenStreetMap contributors',geometry,distanceMeters:route.distance,distanceKm:route.distance/1000,minutes:Math.ceil(route.duration/60),retrievedAt:new Date().toISOString()};
  routeCache.set(points,result);return result;
 }catch(error){return {source:'UNAVAILABLE',provider:'OSRM',reason:error.name==='TimeoutError'?'Routing timed out.':error.message,geometry:null,distanceKm:null,minutes:null};}
}
