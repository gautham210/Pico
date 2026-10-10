export const validCoords = c => Array.isArray(c) && c.length===2 && c.every(Number.isFinite) && Math.abs(c[0])<=90 && Math.abs(c[1])<=180;
const regions={goa:{aliases:['goa'],bounds:[14.8,15.9,73.6,74.4]},kochi:{aliases:['kochi','cochin','ernakulam'],bounds:[9.75,10.25,76.1,76.6]}};
export function inDestination(city,coords,address='') {
 const region=regions[String(city).trim().toLowerCase()];
 if(!region||!validCoords(coords))return false;
 const [south,north,west,east]=region.bounds;
 return coords[0]>=south&&coords[0]<=north&&coords[1]>=west&&coords[1]<=east&&(!address||region.aliases.some(name=>address.toLowerCase().includes(name)));
}
export const price=value=>value===null||value===undefined||value===''?null:Number.isFinite(Number(value))&&Number(value)>=0?Number(value):null;
export async function requestJSON(url,options={}){
 const response=await fetch(url,{...options,signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw new Error(response.status===429?'Provider rate limit reached. Try later.':`Provider unavailable (${response.status}).`);
 return response.json();
}
export const unavailable=(places,mode,reason)=>Array.isArray(places)?places.map(p=>({place:typeof p==='object'?p.id||p.name:p,mode,time:'Unavailable',minutes:null,traffic:'unknown',source:'UNAVAILABLE',reason})):[];
