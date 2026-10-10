import {getNearby as osm} from './providers/osrm-distance.js';
import {getRoute as osrmRoute} from './providers/osrm-distance.js';
import {env} from './env.js';
export async function getNearby(coords,placeIds,mode='driving'){
 if(typeof window==='undefined'&&env('VITE_GOOGLE_PLACES_KEY')){const google=await import('./providers/google-distance.js');return google.getNearby(coords,placeIds,mode);}
 return osm(coords,placeIds,mode);
}
// Ordered route geometry remains an explicit OSRM operation. It never falls
// back to straight-line distance or fabricates a route when unavailable.
export async function getRoute(stops){return osrmRoute(stops);}
