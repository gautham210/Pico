import {getNearby,getRoute} from '../services/distance.js';
import {json,method,validNearbyRequest,validRouteRequest,withTimeout,redactSecrets} from '../server/api-utils.js';

export default async function handler(req,res){
  if(!method(req,res))return;
  const body=req.body||{};
  if(body.operation==='nearby'){
    const input=validNearbyRequest(body);
    if(!input)return json(res,400,{status:'ERROR',results:[],error:'Provide valid origin and up to 25 destinations with coordinates.'});
    try{
      const results=await withTimeout(getNearby(input.coords,input.places,input.mode));
      const source=results.length?results[0].source||'UNAVAILABLE':'UNAVAILABLE';
      return json(res,200,{status:source,provider:results[0]?.provider||null,results:redactSecrets(results),attribution:results[0]?.attribution||null,reason:source==='UNAVAILABLE'?results[0]?.reason||'Route estimates unavailable.':null});
    }catch{return json(res,200,{status:'UNAVAILABLE',provider:null,results:[],reason:'Distance lookup timed out or is unavailable.'});}
  }
  if(body.operation==='route'){
    const stops=validRouteRequest(body);
    if(!stops)return json(res,400,{status:'ERROR',error:'Provide 2–25 ordered stops with valid coordinates.'});
    try{
      const result=await withTimeout(getRoute(stops));
      return json(res,200,redactSecrets({...result,status:result.source||'UNAVAILABLE'}));
    }catch{return json(res,200,{status:'UNAVAILABLE',source:'UNAVAILABLE',provider:null,geometry:null,distanceKm:null,minutes:null,reason:'Route lookup timed out or is unavailable.'});}
  }
  return json(res,400,{status:'ERROR',error:'operation must be nearby or route.'});
}
