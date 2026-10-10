import {env} from '../env.js';
import {requestJSON} from './contracts.js';
// Teammate Google provider, kept server-only; the public adapter owns validation/fallbacks.
export async function getPlaces(city,prefs){
 if(typeof window!=='undefined')throw new Error('Google Places requires a secure server boundary.');
 const key=env('VITE_GOOGLE_PLACES_KEY');if(!key)throw new Error('Google Places is not configured.');
 const data=await requestJSON('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types'},body:JSON.stringify({textQuery:`${prefs?.query||'attractions'} in ${city}`})});
 return (data.places||[]).map(p=>({id:p.id,google_place_id:p.id,name:p.displayName?.text,city,address:p.formattedAddress||'',coords:[p.location?.latitude,p.location?.longitude],category:p.types?.[0]||'attraction',vibe_tags:p.types||[],rating:p.rating??null,userRatingCount:p.userRatingCount??null,avg_cost_inr:null,images:[],source:'LIVE',provider:'Google Places',retrievedAt:new Date().toISOString()}));
}
