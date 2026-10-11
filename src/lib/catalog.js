import {places as kochiPlaces} from '../data/places.js';
import goaPlaces from '../../data/places.json' with {type:'json'};
import realityChecks from '../../data/reality_checks.json' with {type:'json'};
import {placeCost} from '../../services/providers/contracts.js';
import {cityPlaces} from '../../data/city-collections.js';
import {photoFor} from '../data/destination-photos.js';

const normalize=(rows,source)=>rows.map(place=>({
  ...place,
  cost:placeCost(place.avg_cost_inr,place.cost_source||place.cost_provenance),
  image: [place.image,...(Array.isArray(place.images)?place.images:[])].find(url=>typeof url==='string'&&(url.startsWith('https://')||url.startsWith('/assets/'))&&!url.includes('placehold.co'))||null,
  subtitle:place.subtitle||`${place.category||'Place'} · ${place.city}`,
  description:place.description||(Array.isArray(place.vibe_tags)?place.vibe_tags.join(' · '):''),
  caveat:place.reality_check||realityChecks[place.id]||'No verified caveat available. Check access, opening hours and local conditions.',
  time:Number.isFinite(place.time)?place.time:90,
  distance:place.best_time?`Best time: ${place.best_time}`:'Timing to be confirmed',
  source:place.source||source,
  city:place.city,
  ...photoFor(place.id),
}));

export async function loadCatalog(city,prefs={}) {
  if(city==='Kochi')return {places:kochiPlaces,source:'DEMO · Stitch collection · estimates'};
  const curated=cityPlaces.filter(p=>p.city===city);
  if(curated.length)return {places:curated.map(p=>({...p,...photoFor(p.id)})),source:'CACHED · curated guide · prices unknown'};
  const query=new URLSearchParams({city});
  if(prefs.provider)query.set('provider',prefs.provider);
  if(prefs.query)query.set('query',prefs.query);
  try{
    const response=await fetch(`/api/places?${query.toString()}`,{signal:AbortSignal.timeout(15000)});
    if(response.ok){
      const data=await response.json();
      const matched=(Array.isArray(data.results)?data.results:[]).filter(place=>place.city?.toLowerCase()===city.toLowerCase());
      if(matched.length)return {places:normalize(matched,data.status),source:`${data.status}${data.provider?` · ${data.provider}`:''}${data.reason?` · ${data.reason}`:''}`};
    }
  }catch{/* Static, source-labelled catalog keeps discovery usable offline. */}
  const local=goaPlaces.filter(place=>place.city?.toLowerCase()===city.toLowerCase());
  if(!local.length)throw new Error(`No available ${city} collection. Try the Kochi demo.`);
  return {places:normalize(local,'CACHED'),source:'CACHED · local curated collection · estimates'};
}
