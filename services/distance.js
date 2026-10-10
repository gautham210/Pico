import {getNearby as osm} from './providers/osrm-distance.js';
import {env} from './env.js';
export async function getNearby(coords,placeIds,mode='driving'){
 if(typeof window==='undefined'&&env('VITE_GOOGLE_PLACES_KEY')){const google=await import('./providers/google-distance.js');return google.getNearby(coords,placeIds,mode);}
 return osm(coords,placeIds,mode);
}
