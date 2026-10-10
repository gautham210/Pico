import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {modes} from './provider.js';
export const committed=s=>s.likedPlaces.reduce((t,p)=>t+p.cost,0)+(s.likedPlaces.length?modes[s.mode].cost+s.routeExtra:0);
const balance=s=>({...s,budgetRemaining:Math.max(0,s.budgetEnvelope-committed(s))});
export const useStore=create(persist((set,get)=>({budgetEnvelope:20000,budgetRemaining:20000,likedPlaces:[],passedPlaces:[],userPrefs:{},mode:'convenient',routeExtra:0,routeDelay:0,disruption:false,diary:[],storageError:'',
setBudget:n=>set(s=>balance({...s,budgetEnvelope:Math.max(committed(s),Number.isFinite(n)?n:0)})),
likePlace:p=>{const s=get();if(s.likedPlaces.some(x=>x.id===p.id))return true;const next=balance({...s,likedPlaces:[...s.likedPlaces,p]});if(committed(next)>s.budgetEnvelope)return false;set(next);return true;},
passPlace:p=>set(s=>s.passedPlaces.some(x=>x.id===p.id)?s:{passedPlaces:[...s.passedPlaces,p]}),
removePlace:id=>set(s=>{const likedPlaces=s.likedPlaces.filter(p=>p.id!==id);return balance({...s,likedPlaces,...(!likedPlaces.length?{routeExtra:0,routeDelay:0,disruption:false}:{})});}),
movePlace:(id,d)=>set(s=>{const list=[...s.likedPlaces],i=list.findIndex(p=>p.id===id),j=i+d;if(i<0||j<0||j>=list.length)return s;[list[i],list[j]]=[list[j],list[i]];return {likedPlaces:list};}),
setMode:mode=>{if(!modes[mode])return false;const s=get(),next=balance({...s,mode});if(committed(next)>s.budgetEnvelope)return false;set(next);return true;},
triggerDisruption:()=>set({disruption:true}),rejectReroute:()=>set({disruption:false}),
acceptReroute:()=>{const s=get();if(!s.disruption)return false;const next=balance({...s,routeExtra:s.routeExtra+770,routeDelay:s.routeDelay+95,disruption:false});if(committed(next)>s.budgetEnvelope)return false;set(next);return true;},
revisit:()=>set({passedPlaces:[]}),addEntry:entry=>set(s=>({diary:[{...entry,id:crypto.randomUUID(),date:new Date().toISOString()},...s.diary]})),removeEntry:id=>set(s=>({diary:s.diary.filter(e=>e.id!==id)}))
}),{name:'pico-trip-v1',version:1,merge:(saved,current)=>{const s={...current,...saved,mode:modes[saved?.mode]?saved.mode:current.mode};if(!s.likedPlaces.length){s.routeExtra=0;s.routeDelay=0;s.disruption=false;}return balance(s);},storage:{getItem:name=>{try{return JSON.parse(localStorage.getItem(name));}catch{return null;}},setItem:(name,value)=>{try{localStorage.setItem(name,JSON.stringify(value));}catch{if(!useStore.getState().storageError)queueMicrotask(()=>useStore.setState({storageError:'Device storage is unavailable or full. Changes remain in memory this session.'}));}},removeItem:name=>localStorage.removeItem(name)}}));
