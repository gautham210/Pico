import {requestJSON} from './contracts.js';
const cache=new Map();let previousRequest=0;let pending=Promise.resolve();
// Public Nominatim is deliberately not hardcoded as an automatic POI-discovery service.
// A deployment must supply its own policy-compliant endpoint; named searches only.
export async function getPlaces(city,prefs={}){
 if(!prefs.query?.trim()||!prefs.endpoint)throw new Error('Named OSM search is not configured.');
 const endpoint=new URL(prefs.endpoint);
 if(endpoint.protocol!=='https:'||endpoint.hostname==='nominatim.openstreetmap.org')throw new Error('Use a configured geocoding provider with application-wide rate limiting.');
 const query=`${prefs.query.trim()}, ${city}`,key=endpoint.href+query;
 if(cache.has(key))return cache.get(key).map(p=>({...p,source:'CACHED'}));
 const task=pending.then(async()=>{
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,1100-(Date.now()-previousRequest))));previousRequest=Date.now();
  endpoint.search=new URLSearchParams({q:query,format:'json',addressdetails:'1',limit:'10'}).toString();
  const data=await requestJSON(endpoint.href,{headers:{Accept:'application/json'}});
  if(!Array.isArray(data))throw new Error('Invalid geocoding response.');
  const rows=data.map(p=>({id:`osm-${p.osm_type}-${p.osm_id}`,name:p.name||p.display_name?.split(',')[0],city,address:p.display_name||'',coords:[Number(p.lat),Number(p.lon)],category:p.type||'place',vibe_tags:[p.type,p.class].filter(Boolean),rating:null,userRatingCount:null,avg_cost_inr:null,images:[],source:'LIVE',provider:'OpenStreetMap',attribution:'© OpenStreetMap contributors',retrievedAt:new Date().toISOString()}));cache.set(key,rows);return rows;
 });pending=task.catch(()=>{});return task;
}
