import {env} from '../env.js';
import {requestJSON,unavailable,validCoords} from './contracts.js';
export async function getNearby(coords,places,mode='driving'){
 if(!Array.isArray(places))return [];
 const origin=Array.isArray(coords)?coords:[coords?.lat,coords?.lng];
 if(typeof window!=='undefined'||!validCoords(origin))return unavailable(places,mode,'Google routing requires a server and valid origin.');
 const key=env('VITE_GOOGLE_PLACES_KEY');if(!key)return unavailable(places,mode,'Google routing is not configured.');
 if(places.some(p=>typeof p!=='string'&&!validCoords(p?.coords)))return unavailable(places,mode,'Invalid destination coordinates.');
 try{const destinations=places.map(p=>typeof p==='string'?`place_id:${p}`:p.coords.join(',')).join('|');
 const query=new URLSearchParams({origins:origin.join(','),destinations,mode,key});
 const data=await requestJSON(`https://maps.googleapis.com/maps/api/distancematrix/json?${query}`);
 if(data.status!=='OK')throw new Error('Google routing is unavailable.');
 return places.map((p,i)=>{const el=data.rows?.[0]?.elements?.[i],duration=el?.duration_in_traffic||el?.duration;const valid=el?.status==='OK'&&Number.isFinite(duration?.value);return {place:typeof p==='string'?p:p.id||p.name,mode,time:valid?duration.text:'Unavailable',minutes:valid?Math.ceil(duration.value/60):null,traffic:'unknown',source:valid?'LIVE':'UNAVAILABLE',provider:'Google Maps'};});
 }catch(error){return unavailable(places,mode,error.message);}
}
