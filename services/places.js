import records from '../data/places.json' with {type:'json'};
import checks from '../data/reality_checks.json' with {type:'json'};
import {inDestination,placeCost} from './providers/contracts.js';
export async function getPlaces(city,prefs={}){
 const destination=String(city||'').trim();let reason='Curated local dataset; not a live query.';
 if(prefs.provider){try{
  const provider=prefs.provider==='google'?await import('./providers/google-places.js'):prefs.provider==='osm'?await import('./providers/osm-places.js'):null;
  if(!provider)throw new Error('Unsupported place provider.');
  const rows=await provider.getPlaces(destination,prefs);
  const valid=rows.filter(p=>p.id&&p.name&&p.address&&inDestination(destination,p.coords,p.address)).map(p=>({...p,avg_cost_inr:placeCost(p.avg_cost_inr,p.cost_source||p.cost_provenance),reality_check:checks[p.id]||'No verified caveat available. Check access, opening hours and local conditions.'}));
  if(valid.length)return valid;reason='No geographically verified provider results.';
 }catch(error){reason=error.name==='TimeoutError'?'Provider timed out.':error.message;}}
 return records.filter(p=>p.city.toLowerCase()===destination.toLowerCase()&&inDestination(destination,p.coords)).map(p=>({...p,avg_cost_inr:placeCost(p.avg_cost_inr,p.cost_source||p.cost_provenance),source:'CACHED',provider:'Pico curated dataset',retrievedAt:null,fallbackReason:reason}));
}
export async function getRealityCheck(placeId){return checks[placeId]||'No verified caveat available. Check access, opening hours and local conditions.';}
