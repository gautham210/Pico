import {supportedCities} from '../../data/city-collections.js';
import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {modes} from './provider.js';
import {places} from '../data/places.js';

const finite=value=>Number.isFinite(value)&&value>=0;
const validPlace=p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&(p.cost===null||p.cost===undefined||finite(p.cost));
const unique=list=>Array.isArray(list)?list.filter((p,i,all)=>validPlace(p)&&all.findIndex(x=>x.id===p.id)===i):[];
const memoryDate=value=>{const parsed=value?new Date(`${value}T12:00:00`):new Date();return Number.isNaN(parsed.getTime())?new Date().toISOString():parsed.toISOString();};
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(new Date(`${value}T12:00:00`).getTime());
const reviewId=()=>globalThis.crypto?.randomUUID?.()||`review-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
const guestSessionId=()=>{const raw=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2,9)}`;return `guest-${raw}`;};
const reviewRatings=r=>({overall:clampRating(r?.overall),value:clampRating(r?.value),places:clampRating(r?.places),transport:clampRating(r?.transport)});
const clampRating=value=>Math.max(1,Math.min(5,Math.round(Number(value)||1)));

export const activeTripPlaces=s=>{
  if(!s||!Array.isArray(s.likedPlaces))return [];
  const list=s.likedPlaces;
  if(!list.length)return [];
  const isMultiCity=Boolean(s.userPrefs?.multiCity||(Array.isArray(s.userPrefs?.cities)&&s.userPrefs.cities.length>1));
  if(isMultiCity){
    const allowed=Array.isArray(s.userPrefs?.cities)&&s.userPrefs.cities.length?s.userPrefs.cities:null;
    return allowed?list.filter(p=>!p.city||allowed.includes(p.city)):list;
  }
  const currentCity=s.userPrefs?.city;
  if(!currentCity)return list;
  const distinctCities=[...new Set(list.map(p=>p.city).filter(Boolean))];
  if(distinctCities.length<=1){
    return list;
  }
  return list.filter(p=>!p.city||p.city===currentCity);
};

export const committed=s=>{
  const active=activeTripPlaces(s);
  return active.reduce((t,p)=>t+(finite(p.cost)?p.cost:0),0)+(active.length?modes[s.mode].cost+s.routeExtra:0);
};

export const unknownPlaceCosts=s=>activeTripPlaces(s).filter(p=>!finite(p.cost)).length;
const balance=s=>({...s,budgetRemaining:Math.max(0,s.budgetEnvelope-committed(s))});
const preferences={origin:'',city:'Kochi',days:3,travelers:1,startDate:'',pace:'balanced',vibes:[],multiCity:false};

const syncPlanOnRemove=(plan,id)=>{
  if(!plan||!Array.isArray(plan.days))return plan;
  const days=plan.days.map(d=>({...d,stops:d.stops.filter(s=>s.id!==id)})).filter(d=>d.stops.length>0);
  return {...plan,days,manuallyModified:true};
};
const syncPlanOnMove=(plan,reorderedList)=>{
  if(!plan||!Array.isArray(plan.days)||!plan.days.length)return plan;
  const metaMap=new Map();
  for(const d of plan.days){for(const s of d.stops)metaMap.set(s.id,s);}
  const plannedOrder=reorderedList.filter(p=>metaMap.has(p.id));
  if(!plannedOrder.length)return plan;
  const numDays=plan.days.length;
  const perDay=Math.max(1,Math.ceil(plannedOrder.length/numDays));
  const days=plan.days.map((d,idx)=>{
    const stops=plannedOrder.slice(idx*perDay,(idx+1)*perDay).map(p=>({...metaMap.get(p.id),...p,day:d.day}));
    return {...d,stops};
  }).filter(d=>d.stops.length>0);
  return {...plan,days,manuallyModified:true};
};

const defaultChecklist = [
  { id: 'tickets', text: 'Confirm transport tickets', completed: false },
  { id: 'packing', text: 'Pack essentials & travel documents', completed: false },
  { id: 'weather', text: 'Check local climate & weather advisories', completed: false },
  { id: 'offline-maps', text: 'Save offline navigation pins', completed: false },
  { id: 'accommodation', text: 'Confirm accommodation bookings', completed: false },
  { id: 'transport-prep', text: 'Prepare for chosen transit mode', completed: false }
];

export const useStore=create(persist((set,get)=>({
  budgetEnvelope:20000,budgetRemaining:20000,likedPlaces:[],passedPlaces:[],userPrefs:preferences,itineraryPlan:null,
  mode:'convenient',routeExtra:0,routeDelay:0,disruption:false,diary:[],reviews:[],storageError:'',
  checklist: defaultChecklist,
  reminders: { enabled: false, offsetDays: 1, scheduledAt: null },
  publicLikes: {},
  user:null, // { name: '', avatar: '', provider: '', uid: '' }
  profile: { displayName: 'Demo Traveller', avatar: '', interests: [], travelStyle: 'Balanced', budgetDefault: 20000, transportMode: 'convenient' },

  startGuestSession: (name='Curious Explorer',options={})=>{
    const newUid=guestSessionId();
    const initialCity=supportedCities.includes(options.city)?options.city:'Kochi';
    const cleanPrefs={
      ...preferences,
      city:initialCity,
      origin:String(options.origin||'').slice(0,80),
      days:Math.max(1,Math.min(7,Number(options.days)||3)),
      travelers:Math.max(1,Math.min(12,Number(options.travelers)||1)),
      startDate:validDate(options.startDate)?options.startDate:'',
      pace:['relaxed','balanced','full'].includes(options.pace)?options.pace:'balanced',
      vibes:Array.isArray(options.vibes)?[...new Set(options.vibes.filter(v=>typeof v==='string'))]:[],
      multiCity:Boolean(options.multiCity)
    };
    const envelope=finite(options.budget)?Number(options.budget):20000;
    const cleanState={
      budgetEnvelope:envelope,
      budgetRemaining:envelope,
      likedPlaces:[],
      passedPlaces:[],
      userPrefs:cleanPrefs,
      itineraryPlan:null,
      mode:modes[options.mode]?options.mode:'convenient',
      routeExtra:0,
      routeDelay:0,
      disruption:false,
      diary:[],
      reviews:[],
      storageError:'',
      user:{name:(name||'Curious Explorer').trim(),avatar:'',provider:'guest',uid:newUid},
      profile:{...get().profile,displayName:(name||'Curious Explorer').trim(),budgetDefault:envelope,transportMode:modes[options.mode]?options.mode:'convenient'}
    };
    set(cleanState);
    try{localStorage.setItem('pico-trip-v1',JSON.stringify({version:1,state:cleanState}));}catch{}
    return cleanState;
  },

  login: (name,identity={}) => {
    const provider=identity.provider||'guest';
    const uid=identity.uid||(provider==='guest'?(get().user?.uid||guestSessionId()):null);
    set(s=>({
      user: { name, avatar: identity.avatar||'',provider,uid },
      profile: { ...s.profile, displayName: name, ...(identity.avatar?{avatar:identity.avatar}:{}) }
    }));
  },

  logout: () => {
    const cleanState={
      user:null,
      likedPlaces:[],
      passedPlaces:[],
      userPrefs:{...preferences},
      itineraryPlan:null,
      budgetEnvelope:20000,
      budgetRemaining:20000,
      mode:'convenient',
      routeExtra:0,
      routeDelay:0,
      disruption:false,
      diary:[],
      reviews:[],
      storageError:''
    };
    set(cleanState);
    try{localStorage.setItem('pico-trip-v1',JSON.stringify({version:1,state:{...cleanState,profile:get().profile}}));}catch{}
  },

  updateProfile: (patch) => set(s => ({ profile: { ...s.profile, ...patch }, user:s.user&&patch.displayName?{...s.user,name:patch.displayName}:s.user })),
  setBudget:n=>set(s=>balance({...s,budgetEnvelope:finite(n)?n:s.budgetEnvelope})),
  setPrefs:patch=>set(s=>{
    const next={...s.userPrefs,...patch},days=Number(next.days),travelers=Number(next.travelers);
    return balance({
      ...s,
      userPrefs:{
        ...next,
        origin:String(next.origin||'').slice(0,80),
        city:supportedCities.includes(next.city)?next.city:s.userPrefs.city,
        days:Math.max(1,Math.min(7,Number.isFinite(days)?Math.trunc(days):3)),
        travelers:Math.max(1,Math.min(12,Number.isFinite(travelers)?Math.trunc(travelers):1)),
        startDate:validDate(next.startDate)?next.startDate:'',
        pace:['relaxed','balanced','full'].includes(next.pace)?next.pace:'balanced',
        vibes:Array.isArray(next.vibes)?[...new Set(next.vibes.filter(v=>typeof v==='string'))]:[],
        multiCity:Boolean(next.multiCity)
      }
    });
  }),
  likePlace:p=>{
    const s=get();
    if(!validPlace(p))return false;
    if(s.likedPlaces.some(x=>x.id===p.id))return true;
    const placeCity=p.city||s.userPrefs?.city||'Kochi';
    const placeWithCity={...p,city:placeCity};
    const next=balance({...s,likedPlaces:[...s.likedPlaces,placeWithCity],passedPlaces:s.passedPlaces.filter(x=>x.id!==p.id)});
    if(committed(next)>s.budgetEnvelope)return false;
    set(next);
    return true;
  },
  passPlace:p=>set(s=>!validPlace(p)||s.passedPlaces.some(x=>x.id===p.id)||s.likedPlaces.some(x=>x.id===p.id)?s:{passedPlaces:[...s.passedPlaces,{...p,city:p.city||s.userPrefs?.city||'Kochi'}]}),
  removePlace:id=>set(s=>{
    const likedPlaces=s.likedPlaces.filter(p=>p.id!==id);
    const itineraryPlan=syncPlanOnRemove(s.itineraryPlan,id);
    return balance({...s,likedPlaces,itineraryPlan,...(!likedPlaces.length?{routeExtra:0,routeDelay:0,disruption:false}:{})});
  }),
  movePlace:(id,d)=>set(s=>{
    const list=[...s.likedPlaces],i=list.findIndex(p=>p.id===id),j=i+d;
    if(i<0||j<0||j>=list.length)return s;
    [list[i],list[j]]=[list[j],list[i]];
    const itineraryPlan=syncPlanOnMove(s.itineraryPlan,list);
    return {likedPlaces:list,itineraryPlan};
  }),
  setItineraryPlan:plan=>set(s=>{
    if(!plan||!Array.isArray(plan.days))return {itineraryPlan:plan};
    const plannedStops=plan.days.flatMap(d=>d.stops||[]);
    const plannedIds=new Set(plannedStops.map(p=>p.id));
    const remainingLiked=s.likedPlaces.filter(p=>!plannedIds.has(p.id));
    const newLikedPlaces=[
      ...plannedStops.map(p=>{
        const existing=s.likedPlaces.find(x=>x.id===p.id)||{};
        return {...existing,...p};
      }),
      ...remainingLiked
    ];
    return balance({
      ...s,
      likedPlaces:newLikedPlaces,
      itineraryPlan:plan
    });
  }),
  clearItineraryPlan:()=>set({itineraryPlan:null}),
  setMode:mode=>{if(!modes[mode])return false;const next=balance({...get(),mode});if(committed(next)>next.budgetEnvelope&&committed(next)>=committed(get()))return false;set(next);return true;},
  restoreRoute:()=>set(s=>balance({...s,routeExtra:0,routeDelay:0,disruption:false})),
  triggerDisruption:()=>{if(activeTripPlaces(get()).length)set({disruption:true});},rejectReroute:()=>set({disruption:false}),
  acceptReroute:()=>{const s=get();if(!s.disruption||!activeTripPlaces(s).length)return false;const next=balance({...s,routeExtra:s.routeExtra+770,routeDelay:s.routeDelay+95,disruption:false});if(committed(next)>s.budgetEnvelope)return false;set(next);return true;},
  loadDemo:()=>{if(get().likedPlaces.length)return false;const next={...get(),likedPlaces:places.map(p=>({...p,city:p.city||'Kochi'})),passedPlaces:[],mode:get().profile.transportMode || 'convenient',routeExtra:0,routeDelay:0,disruption:false,userPrefs:{...preferences},itineraryPlan:null};next.budgetEnvelope=Math.max(next.budgetEnvelope,committed(next));set(balance(next));return true;},
  revisit:()=>set({passedPlaces:[]}),
  addEntry:entry=>set(s=>({diary:[{...entry,id:entry.id||crypto.randomUUID(),date:memoryDate(entry.date)},...s.diary]})),
  editEntry:(id,patch)=>set(s=>({diary:s.diary.map(entry=>entry.id===id?{...entry,...patch,id,date:patch.date?memoryDate(patch.date):entry.date}:entry)})),
  removeEntry:id=>set(s=>({diary:s.diary.filter(e=>e.id!==id)})),
  saveReview:review=>set(s=>{const id=review.id||reviewId(),old=s.reviews.find(item=>item.id===id),ratings=reviewRatings(review.ratings);const saved={...old,...review,id,ratings,total:Object.values(ratings).reduce((sum,value)=>sum+value,0),status:review.status==='private'?'private':'draft',visibility:review.visibility==='public'?'public':'private',publication:'local-only',createdAt:old?.createdAt||Date.now(),updatedAt:Date.now()};return {reviews:[saved,...s.reviews.filter(item=>item.id!==id)]};}),
  removeReview:id=>set(s=>({reviews:s.reviews.filter(item=>item.id!==id)})),
  toggleChecklistItem:id=>set(s=>({checklist:(s.checklist||defaultChecklist).map(item=>item.id===id?{...item,completed:!item.completed}:item)})),
  addChecklistItem:text=>set(s=>({checklist:[...(s.checklist||defaultChecklist),{id:`item-${Date.now()}`,text:String(text).slice(0,120),completed:false}]})),
  removeChecklistItem:id=>set(s=>({checklist:(s.checklist||defaultChecklist).filter(item=>item.id!==id)})),
  setReminder:patch=>set(s=>({reminders:{...(s.reminders||{enabled:false,offsetDays:1}),...patch}})),
  togglePublicLike:placeId=>set(s=>{
    const current=(s.publicLikes&&s.publicLikes[placeId])||{count:14,userLiked:false};
    const nextLiked=!current.userLiked;
    return {
      publicLikes:{
        ...(s.publicLikes||{}),
        [placeId]:{
          count:nextLiked?current.count+1:Math.max(0,current.count-1),
          userLiked:nextLiked
        }
      }
    };
  })
 }),{name:'pico-trip-v1',version:1,partialize:state=>({...state,user:state.user?.provider==='firebase'?null:state.user}),merge:(saved,current)=>{
  const s={...current,...saved,likedPlaces:unique(saved?.likedPlaces),passedPlaces:unique(saved?.passedPlaces),itineraryPlan:saved?.itineraryPlan||null,diary:Array.isArray(saved?.diary)?saved.diary:[],reviews:Array.isArray(saved?.reviews)?saved.reviews.map(review=>{const ratings=reviewRatings(review.ratings);return {...review,ratings,total:Object.values(ratings).reduce((sum,value)=>sum+value,0),status:review.status==='private'?'private':'draft',visibility:review.visibility==='public'?'public':'private',publication:'local-only'};}):[],checklist:Array.isArray(saved?.checklist)?saved.checklist:defaultChecklist,reminders:saved?.reminders||{enabled:false,offsetDays:1,scheduledAt:null},publicLikes:saved?.publicLikes||{},userPrefs:{...preferences,...saved?.userPrefs},mode:modes[saved?.mode]?saved.mode:current.mode,routeExtra:finite(saved?.routeExtra)?saved.routeExtra:0,routeDelay:finite(saved?.routeDelay)?saved.routeDelay:0,storageError:'', user: saved?.user || null, profile: { ...current.profile, ...saved?.profile }};
  if(!s.likedPlaces.length){s.routeExtra=0;s.routeDelay=0;s.disruption=false;}
  s.budgetEnvelope=finite(s.budgetEnvelope)?s.budgetEnvelope:20000;
  s.likedPlaces=s.likedPlaces.map(p=>({...p,city:p.city||s.userPrefs?.city||'Kochi',image:places.find(x=>x.id===p.id)?.image||p.image}));
  return balance(s);
 },storage:{getItem:name=>{try{return JSON.parse(localStorage.getItem(name));}catch{return null;}},setItem:(name,value)=>{try{localStorage.setItem(name,JSON.stringify(value));}catch{if(!useStore.getState().storageError)queueMicrotask(()=>useStore.setState({storageError:'Device storage is unavailable or full. Changes remain in memory this session.'}));}},removeItem:name=>{try{localStorage.removeItem(name);}catch{/* Storage may be disabled. */}}}}));
