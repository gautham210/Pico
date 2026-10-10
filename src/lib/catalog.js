// Reuse the real module. The aggregate API also references unavailable cloud and
// transport SDKs, so importing that aggregate into Vite breaks unrelated routes.
import {getPlaces,getRealityCheck} from '../../services/places.js';
import {places} from '../data/places.js';
export async function loadCatalog(city,prefs={}) {
  if(city==='Kochi')return {places,source:'DEMO · Stitch collection · estimates'};
  const rows=await getPlaces(city,prefs);
  const matching=rows.filter(p=>p.city?.toLowerCase()===city.toLowerCase());
  if(!matching.length)throw new Error(`No available ${city} collection. Try the Kochi demo.`);
  const normalized=await Promise.all(matching.map(async p=>({
    ...p,cost:Number.isFinite(p.avg_cost_inr)&&p.avg_cost_inr>=0?p.avg_cost_inr:null,image:null,
    category:p.category,subtitle:p.rarity+' · '+p.city,description:(p.vibe_tags||[]).join(' · '),
    caveat:await getRealityCheck(p.id),time:90,distance:p.best_time?`Best time: ${p.best_time}`:'Timing to be confirmed',
    source:p.source,city:p.city,
  })));
  return {places:normalized,source:'CACHED · Goa curated catalogue · estimated costs · photos unavailable'};
}

