import {modes} from './provider.js';
export function itinerary(state) {
  const days=Math.max(1,Math.min(7,Number(state.userPrefs.days)||3));
  const perDay=Math.max(1,Math.ceil(state.likedPlaces.length/days));
  return Array.from({length:Math.min(days,Math.max(1,state.likedPlaces.length))},(_,day)=>{
    let clock=day===0?9*60+modes[state.mode].minutes+state.routeDelay:9*60;
    return {day:day+1,stops:state.likedPlaces.slice(day*perDay,(day+1)*perDay).map(p=>{
      const start=clock;clock+=(Number(p.time)||90)+30;return {...p,start,end:clock-30};
    })};
  }).filter(d=>d.stops.length);
}
export const clockTime=minutes=>`${String(Math.floor(minutes/60)%24).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}${minutes>=1440?' (+1 day)':''}`;
export function profileFor(places,diary=[]) {
  const weights={S:5,A:4,B:3,C:2,D:1},counts={};
  for(const p of places){const rating=diary.find(e=>e.placeId===p.id)?.rating;counts[p.category]=(counts[p.category]||0)+(weights[rating]||3);}
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  const mix=Object.entries(counts).map(([name,value])=>({name,value,percent:Math.round(value/Math.max(1,total)*100)})).sort((a,b)=>b.value-a.value);
  const dominant=mix[0]?.name?.toLowerCase()||'';
  const title=!total?'Your next chapter awaits':/food|cafe/.test(dominant)?'The Flavour Seeker':/nature|beach/.test(dominant)?'The Coastal Wanderer':/cultur|heritage/.test(dominant)?'The Curious Explorer':'The Slow Explorer';
  return {title,mix,total};
}
