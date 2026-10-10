import {requestJSON,validCoords,unavailable} from './contracts.js';
const cache=new Map();
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
