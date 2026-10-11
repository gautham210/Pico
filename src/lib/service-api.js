export const validCoords=coords=>Array.isArray(coords)&&coords.length===2&&coords.every(Number.isFinite)&&Math.abs(coords[0])<=90&&Math.abs(coords[1])<=180;

export async function getRoute(stops){
  if(!Array.isArray(stops)||stops.length<2||stops.some(stop=>!validCoords(Array.isArray(stop)?stop:stop?.coords)))return {source:'UNAVAILABLE',reason:'A route needs at least two stops with valid coordinates.',geometry:null,distanceKm:null,minutes:null};
  try{
    const response=await fetch('/api/distance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'route',stops}),signal:AbortSignal.timeout(18000)});
    if(!response.ok)return {source:'UNAVAILABLE',reason:`Route service returned ${response.status}.`,geometry:null,distanceKm:null,minutes:null};
    const result=await response.json();
    if(!['LIVE','CACHED'].includes(result.source)||!Number.isFinite(result.distanceKm)||result.distanceKm<0||!Number.isFinite(result.minutes)||result.minutes<0||!Array.isArray(result.geometry)||result.geometry.length<2||!result.geometry.every(validCoords))return {source:'UNAVAILABLE',reason:result.reason||'Route provider returned invalid measurements or geometry.',geometry:null,distanceKm:null,minutes:null};
    return result;
  }catch{return {source:'UNAVAILABLE',reason:'Route service is unavailable. Try again when connected.',geometry:null,distanceKm:null,minutes:null};}
}

export async function getNearby(coords,places,mode='driving'){
  if(!validCoords(coords)||!Array.isArray(places)||!places.length||places.some(place=>!validCoords(place?.coords)))return [];
  try{
    const response=await fetch('/api/distance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'nearby',coords,places,mode})});
    if(!response.ok)return places.map(place=>({place:place.id||place.name,mode,time:'Unavailable',minutes:null,source:'UNAVAILABLE',reason:'Distance service unavailable.'}));
    const data=await response.json();
    return Array.isArray(data.results)?data.results:[];
  }catch{return places.map(place=>({place:place.id||place.name,mode,time:'Unavailable',minutes:null,source:'UNAVAILABLE',reason:'Distance service unavailable.'}));}
}

export async function requestAiPlan(planRequest){
  try{
    const response=await fetch('/api/plan',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(planRequest),
      signal:AbortSignal.timeout(20000)
    });
    const data=await response.json();
    return data;
  }catch(err){
    return {
      status:'ERROR',
      source:'UNAVAILABLE',
      error:err?.message||'Network error or planner timeout.',
      days:[],
      warnings:['Could not connect to planning service. Please try again.']
    };
  }
}

