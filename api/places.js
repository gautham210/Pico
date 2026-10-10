import {getPlaces} from '../services/places.js';
import {env} from '../services/env.js';
import {validCoords} from '../services/providers/contracts.js';
import {json,method,validPlaceRequest,withTimeout,redactSecrets} from '../server/api-utils.js';

export default async function handler(req,res){
  if(!method(req,res,'GET'))return;
  const query=validPlaceRequest(req.query||{});
  if(!query)return json(res,400,{status:'ERROR',results:[],error:'Provide a supported city and optional provider/query.'});
  if(query.provider==='google'&&!env('VITE_GOOGLE_PLACES_KEY'))return json(res,200,{status:'UNAVAILABLE',provider:null,results:[],reason:'Google Places is not configured.'});
  const options=query.provider?{provider:query.provider,query:query.query,endpoint:query.provider==='osm'?env('VITE_OSM_PLACES_ENDPOINT'):undefined}:{};
  if(query.provider==='osm'&&!options.endpoint)return json(res,200,{status:'UNAVAILABLE',provider:null,results:[],reason:'A policy-compliant OSM geocoding endpoint is not configured.'});
  try{
    const results=await withTimeout(getPlaces(query.city,options));
    const places=Array.isArray(results)?results.filter(place=>validCoords(place?.coords)):[];
    const source=places.length?places[0].source||'CACHED':'UNAVAILABLE';
    const allowed=['LIVE','CACHED','DEMO','UNAVAILABLE'].includes(source)?source:'UNAVAILABLE';
    return json(res,200,{status:allowed,provider:places[0]?.provider||null,results:redactSecrets(places),reason:allowed==='CACHED'?places[0]?.fallbackReason||null:allowed==='UNAVAILABLE'?'No validated places were returned.':null,attribution:places[0]?.attribution||null});
  }catch{return json(res,200,{status:'UNAVAILABLE',provider:null,results:[],reason:'Place search timed out or is unavailable.'});}
}
