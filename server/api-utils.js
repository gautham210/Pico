import 'dotenv/config';
import {validCoords} from '../services/providers/contracts.js';

const safeUnavailable = 'Provider unavailable. Check server configuration or try again later.';

export function json(res,status,body){
  if(typeof res.status==='function')return res.status(status).json(body);
  res.statusCode=status;
  res.setHeader?.('Content-Type','application/json; charset=utf-8');
  res.end?.(JSON.stringify(body));
}

export function unavailable(res,status=200,reason=safeUnavailable){
  return json(res,status,{status:'UNAVAILABLE',provider:null,results:[],reason});
}

export function method(req,res,expected='POST'){
  if(req.method===expected)return true;
  res.setHeader?.('Allow',expected);
  json(res,405,{status:'ERROR',error:`Use ${expected}.`});
  return false;
}

export function text(value,max=100){
  return typeof value==='string'&&value.trim().length>0&&value.trim().length<=max&&!/[\u0000-\u001f]/.test(value)?value.trim():null;
}

export function validTripQuery(body,{airportCodes=false}={}){
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  const origin=text(body.origin,80),destination=text(body.destination??body.dest,80),date=text(body.date,10);
  const parsedDate=date&&/^\d{4}-\d{2}-\d{2}$/.test(date)?Date.parse(`${date}T00:00:00Z`):NaN;
  if(!origin||!destination||origin.toLowerCase()===destination.toLowerCase()||!Number.isFinite(parsedDate)||new Date(parsedDate).toISOString().slice(0,10)!==date)return null;
  if(airportCodes&&(!/^[A-Z]{3}$/.test(origin)||!/^[A-Z]{3}$/.test(destination)))return null;
  return {origin,destination,date};
}

export function withTimeout(promise,milliseconds=12000){
  let timer;
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error('Provider timed out.'),{name:'TimeoutError'})),milliseconds);});
  return Promise.race([Promise.resolve(promise),deadline]).finally(()=>clearTimeout(timer));
}

export function provenance(result){
  const source=['LIVE','CACHED','DEMO','UNAVAILABLE'].includes(result?.source)?result.source:'UNAVAILABLE';
  return {status:source,provider:source==='UNAVAILABLE'?null:result?.provider||null,reason:source==='UNAVAILABLE'||source==='DEMO'?result?.reason||safeUnavailable:null};
}

export function redactSecrets(value){
  const secrets=['IRCTC_KEY','APIFY_KEY','NOBLE_KEY','AVIATIONSTACK_KEY','GOOGLE_PLACES_KEY'].map(name=>typeof process!=='undefined'?process.env[name]:undefined).filter(secret=>typeof secret==='string'&&secret.length>0);
  const scrub=text=>secrets.reduce((safe,secret)=>safe.split(secret).join('[redacted]').split(encodeURIComponent(secret)).join('[redacted]'),text);
  if(typeof value==='string')return scrub(value);
  if(Array.isArray(value))return value.map(redactSecrets);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[scrub(key),redactSecrets(item)]));
  return value;
}

export function validPlaceRequest(body){
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  const city=text(body.city,80),query=body.query==null?'':text(body.query,100);
  const provider=body.provider==null?'':text(body.provider,16);
  if(!city||!['','google','osm'].includes(provider)||(body.query!=null&&!query))return null;
  return {city,query,provider};
}

export function validNearbyRequest(body){
  if(!body||typeof body!=='object'||Array.isArray(body)||!validCoords(body.coords)||!Array.isArray(body.places)||!body.places.length||body.places.length>25)return null;
  if(body.places.some(place=>typeof place!=='object'||!place||typeof place.id!=='string'||place.id.length>160||!validCoords(place.coords)))return null;
  const mode=text(body.mode||'driving',24);
  return mode?{coords:body.coords,places:body.places,mode}:null;
}

export function validRouteRequest(body){
  if(!body||typeof body!=='object'||Array.isArray(body)||!Array.isArray(body.stops)||body.stops.length<2||body.stops.length>25)return null;
  if(body.stops.some(stop=>!validCoords(Array.isArray(stop)?stop:stop?.coords)))return null;
  return body.stops;
}
