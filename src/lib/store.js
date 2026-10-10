import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {modes} from './provider.js';
import {places} from '../data/places.js';
const finite=value=>Number.isFinite(value)&&value>=0;
const validPlace=p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&finite(p.cost);
const unique=list=>Array.isArray(list)?list.filter((p,i,all)=>validPlace(p)&&all.findIndex(x=>x.id===p.id)===i):[];
export const committed=s=>s.likedPlaces.reduce((t,p)=>t+p.cost,0)+(s.likedPlaces.length?modes[s.mode].cost+s.routeExtra:0);
const balance=s=>({...s,budgetRemaining:Math.max(0,s.budgetEnvelope-committed(s))});
const preferences={city:'Kochi',days:3,travelers:1,vibes:[]};
export const useStore=create(persist((set,get)=>({
 budgetEnvelope:20000,budgetRemaining:20000,likedPlaces:[],passedPlaces:[],userPrefs:preferences,
 mode:'convenient',routeExtra:0,routeDelay:0,disruption:false,diary:[],storageError:'',
 setBudget:n=>set(s=>balance({...s,budgetEnvelope:Math.max(committed(s),finite(n)?n:0)})),
 setPrefs:patch=>set(s=>({userPrefs:{...s.userPrefs,...patch}})),
 likePlace:p=>{const s=get();if(!validPlace(p))return false;if(s.likedPlaces.some(x=>x.id===p.id))return true;const next=balance({...s,likedPlaces:[...s.likedPlaces,p],passedPlaces:s.passedPlaces.filter(x=>x.id!==p.id)});if(committed(next)>s.budgetEnvelope)return false;set(next);return true;},
 passPlace:p=>set(s=>!validPlace(p)||s.passedPlaces.some(x=>x.id===p.id)||s.likedPlaces.some(x=>x.id===p.id)?s:{passedPlaces:[...s.passedPlaces,p]}),
 removePlace:id=>set(s=>{const likedPlaces=s.likedPlaces.filter(p=>p.id!==id);return balance({...s,likedPlaces,...(!likedPlaces.length?{routeExtra:0,routeDelay:0,disruption:false}:{})});}),
 movePlace:(id,d)=>set(s=>{const list=[...s.likedPlaces],i=list.findIndex(p=>p.id===id),j=i+d;if(i<0||j<0||j>=list.length)return s;[list[i],list[j]]=[list[j],list[i]];return {likedPlaces:list};}),
 setMode:mode=>{if(!modes[mode])return false;const next=balance({...get(),mode});if(committed(next)>next.budgetEnvelope)return false;set(next);return true;},
 triggerDisruption:()=>{if(get().likedPlaces.length)set({disruption:true});},rejectReroute:()=>set({disruption:false}),
 acceptReroute:()=>{const s=get();if(!s.disruption||!s.likedPlaces.length)return false;const next=balance({...s,routeExtra:s.routeExtra+770,routeDelay:s.routeDelay+95,disruption:false});if(committed(next)>s.budgetEnvelope)return false;set(next);return true;},
 loadDemo:()=>{if(get().likedPlaces.length)return false;const next={...get(),likedPlaces:places,passedPlaces:[],mode:'convenient',routeExtra:0,routeDelay:0,disruption:false,userPrefs:{...preferences}};next.budgetEnvelope=Math.max(next.budgetEnvelope,committed(next));set(balance(next));return true;},
 revisit:()=>set({passedPlaces:[]}),
 addEntry:entry=>set(s=>({diary:[{...entry,id:crypto.randomUUID(),date:new Date().toISOString()},...s.diary]})),
 removeEntry:id=>set(s=>({diary:s.diary.filter(e=>e.id!==id)}))
}),{name:'pico-trip-v1',version:1,merge:(saved,current)=>{
 const s={...current,...saved,likedPlaces:unique(saved?.likedPlaces),passedPlaces:unique(saved?.passedPlaces),diary:Array.isArray(saved?.diary)?saved.diary:[],userPrefs:{...preferences,...saved?.userPrefs},mode:modes[saved?.mode]?saved.mode:current.mode,routeExtra:finite(saved?.routeExtra)?saved.routeExtra:0,routeDelay:finite(saved?.routeDelay)?saved.routeDelay:0,storageError:''};
 if(!s.likedPlaces.length){s.routeExtra=0;s.routeDelay=0;s.disruption=false;}
 s.budgetEnvelope=Math.max(finite(s.budgetEnvelope)?s.budgetEnvelope:20000,committed(s));
 s.likedPlaces=s.likedPlaces.map(p=>({...p,image:places.find(x=>x.id===p.id)?.image||p.image}));return balance(s);
},storage:{getItem:name=>{try{return JSON.parse(localStorage.getItem(name));}catch{return null;}},setItem:(name,value)=>{try{localStorage.setItem(name,JSON.stringify(value));}catch{if(!useStore.getState().storageError)queueMicrotask(()=>useStore.setState({storageError:'Device storage is unavailable or full. Changes remain in memory this session.'}));}},removeItem:name=>{try{localStorage.removeItem(name);}catch{/* Storage may be disabled. */}}}}));
