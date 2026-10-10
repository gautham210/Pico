import {searchFlightsWithStatus} from '../services/flights.js';
import {json,method,validTripQuery,withTimeout,provenance,redactSecrets} from '../server/api-utils.js';

export default async function handler(req,res){
  if(!method(req,res))return;
  const query=validTripQuery(req.body,{airportCodes:true});
  if(!query)return json(res,400,{status:'ERROR',error:'Provide three-letter origin and destination IATA airport codes and a valid YYYY-MM-DD date.'});
  try{
    const result=await withTimeout(searchFlightsWithStatus(query.origin,query.destination,query.date));
    const source=provenance(result);
    return json(res,200,{...source,results:redactSecrets(Array.isArray(result.results)?result.results:[])});
  }catch{return json(res,200,{status:'UNAVAILABLE',provider:null,results:[],reason:'Flight search timed out or is unavailable.'});}
}
