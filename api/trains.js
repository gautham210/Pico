import {searchTrainsWithStatus} from '../services/trains.js';
import {json,method,validTripQuery,withTimeout,provenance,redactSecrets} from '../server/api-utils.js';

export default async function handler(req,res){
  if(!method(req,res))return;
  const query=validTripQuery(req.body);
  if(!query)return json(res,400,{status:'ERROR',error:'Provide origin, destination and a valid YYYY-MM-DD date.'});
  if(!/^[A-Z0-9]{2,5}$/.test(query.origin)||!/^[A-Z0-9]{2,5}$/.test(query.destination))return json(res,400,{status:'ERROR',error:'Train searches require valid station codes (2–5 uppercase letters or digits).'});
  try{
    const result=await withTimeout(searchTrainsWithStatus(query.origin,query.destination,query.date));
    const source=provenance(result);
    return json(res,200,{...source,results:redactSecrets(Array.isArray(result.results)?result.results:[])});
  }catch{return json(res,200,{status:'UNAVAILABLE',provider:null,results:[],reason:'Train search timed out or is unavailable.'});}
}
