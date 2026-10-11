import {useEffect,useState} from 'react';
import {motion,useReducedMotion} from 'framer-motion';
import Nav from './components/Nav';
import Discover from './screens/Discover';
import {Home,Plan,Reroute,Diary,DNA,MapScreen,Trips} from './screens/Journey';
import Login from './screens/Login';
import Profile from './screens/Profile';
import Reviews from './screens/Reviews';
import InstallPico from './components/InstallPico';
import {useStore} from './lib/store';
import {hasFirebaseConfig} from '../services/firebase-config.js';
import idle from '../Pico emotions/idle.png';
import curious from '../Pico emotions/curious.png';
import excited from '../Pico emotions/excited.png';
import worried from '../Pico emotions/worried.png';
import lost from '../Pico emotions/lost.png';
import proud from '../Pico emotions/proud.png';
import sleepy from '../Pico emotions/sleepy.png';
const emotions={idle,curious,excited,worried,lost,proud,sleepy};

const tabs=[['home','explore','Home'],['discover','style','Discover'],['plan','calendar_today','Plan'],['map','map','Map'],['reroute','sync_problem','Reroute'],['diary','menu_book','Diary'],['dna','fingerprint','DNA']];
const titles={home:'Where to next?',discover:'Discover Swipe Deck',plan:'Plan & Itinerary',reroute:'Disruption Diff',diary:'Trip Diary',dna:'Your Travel DNA',map:'Route Explorer',trips:'Your Journeys',profile:'Profile',reviews:'Travel Reviews',login:'Welcome & Setup'};

export default function App(){
  const s=useStore();
  const [cloud,setCloud]=useState({uid:null,status:'idle',message:''});
  const [onboarding,setOnboarding]=useState(()=>!useStore.getState().user);
  const [route,setRoute]=useState(location.hash.slice(1)||'home');
  const reduced=useReducedMotion();
  
  useEffect(()=>{
    const change=()=>{setRoute(location.hash.slice(1)||'home');window.scrollTo(0,0);};
    window.addEventListener('hashchange',change);
    return()=>window.removeEventListener('hashchange',change);
  },[]);

  useEffect(()=>{
    if(!hasFirebaseConfig())return;
    let active=true,unsubscribe=()=>{};
    import('../services/auth.js').then(({onAuthChange,completeGoogleRedirect})=>{
      completeGoogleRedirect().catch(()=>setCloud({uid:null,status:'blocked',message:'Google redirect sign-in could not finish. Continue as guest or retry sign-in.'}));
      if(!active)return;
      unsubscribe=onAuthChange(async user=>{
        const current=useStore.getState().user;
        if(user){
          useStore.getState().login(user.displayName||user.email||'Pico traveller',{uid:user.uid,provider:'firebase',avatar:user.photoURL||''});
          try{
            const {getUserTrip}=await import('../services/trips.js');
            const remote=await getUserTrip(user.uid);
            if(!active||useStore.getState().user?.uid!==user.uid)return;
            if(remote?.likedPlaces?.length&&useStore.getState().likedPlaces.length){setCloud({uid:user.uid,status:'blocked',message:'A cloud trip and local draft both exist. Automatic upload is paused to preserve both. Continue using your local draft.'});return;}
            if(remote&&active&&useStore.getState().user?.uid===user.uid){
              if(remote.userPrefs)useStore.getState().setPrefs(remote.userPrefs);
              if(Number.isFinite(remote.budgetEnvelope))useStore.getState().setBudget(remote.budgetEnvelope);
              if(remote.mode)useStore.getState().setMode(remote.mode);
              if(Array.isArray(remote.likedPlaces)&&remote.likedPlaces.length&&!useStore.getState().likedPlaces.length){
                remote.likedPlaces.forEach(p=>useStore.getState().likePlace(p));
              }
            }
          if(active)setCloud({uid:user.uid,status:'ready',message:'Cloud trip checked. Local edits will be saved to your account.'});
          }catch{if(active)setCloud({uid:user.uid,status:'blocked',message:'Cloud trip could not be read. Automatic upload is paused to protect your saved trip. Local planning is still available.'});}
        }
        else if(current?.provider==='firebase')useStore.getState().logout();
      });
    }).catch(()=>{});
    return()=>{active=false;unsubscribe();};
  },[]);

  useEffect(()=>{
    const user=s.user;
    if(user?.provider!=='firebase'||!user?.uid||cloud.uid!==user.uid||!['ready','saved'].includes(cloud.status))return;
    const timer=setTimeout(()=>{
      import('../services/trips.js').then(({saveUserTrip})=>{
        if(useStore.getState().user?.uid!==user.uid)return;
        saveUserTrip(user.uid,{userPrefs:s.userPrefs,likedPlaces:s.likedPlaces,budgetEnvelope:s.budgetEnvelope,mode:s.mode}).then(()=>setCloud({uid:user.uid,status:'saved',message:'Your current trip was saved to your account.'})).catch(()=>setCloud({uid:user.uid,status:'blocked',message:'Cloud save failed. Your changes remain on this device; sign in again to retry.'}));
      }).catch(()=>{});
    },1200);
    return()=>clearTimeout(timer);
  },[s.user?.uid,s.user?.provider,s.userPrefs,s.likedPlaces,s.budgetEnvelope,s.mode,cloud.uid,cloud.status==='ready']);
  
  const navigate=name=>{location.hash=name;};
  
  // Enforce login for unauthenticated users, or allow explicit login navigation
  const activeRoute = !s.user || onboarding ? 'login' : route;

  const Screen={home:Home,plan:Plan,reroute:Reroute,diary:Diary,dna:DNA,map:MapScreen,trips:Trips,profile:Profile,reviews:Reviews}[activeRoute];
  const quietHours=new Date().getHours()>=22||new Date().getHours()<6;
  const noMappedHomeCollection=activeRoute==='map'&&s.userPrefs.city==='Kochi'&&!s.likedPlaces.some(p=>Array.isArray(p.coords)&&p.coords.length===2&&p.coords.every(Number.isFinite));
  const mood=s.storageError||noMappedHomeCollection?'lost':s.disruption||s.budgetRemaining<s.budgetEnvelope*.2?'worried':activeRoute==='diary'&&s.diary.length?'proud':activeRoute==='dna'&&s.likedPlaces.length?'proud':activeRoute==='discover'?'curious':activeRoute==='home'&&!s.likedPlaces.length&&quietHours?'sleepy':s.likedPlaces.length?'excited':'idle';

  if (activeRoute === 'login') {
    return <div className="pico-app"><Login navigate={navigate} onComplete={()=>setOnboarding(false)} /></div>;
  }

  return (
    <div className="pico-app">
      <Nav title={titles[activeRoute]||'Pico'} mood={mood} moodImage={emotions[mood]}/>
      <div className="app-content">
        {activeRoute==='home'&&<InstallPico/>}
        {s.user?.provider==='firebase'&&cloud.message&&<p role="status" className="notice">{cloud.message}</p>}
        {s.storageError&&<p role="alert" className="notice">{s.storageError}</p>}
        {activeRoute==='discover'?<Discover navigate={navigate}/>:Screen?<Screen navigate={navigate}/>:<Home navigate={navigate}/>}
      </div>
      <aside className="mascot" aria-label={`Pico is ${mood}`}>
        <motion.img src={emotions[mood]} alt="Pico Arctic Tern" style={{ width: '40px', height: 'auto', display: 'block', margin: '0 auto' }} animate={reduced?{}:mood==='worried'?{rotate:[-5,5,-5]}:mood==='excited'?{y:[0,-6,0]}:{y:0}} transition={{duration:1.2,repeat:mood==='idle'?0:Infinity}}/>
        <small>{mood}</small>
      </aside>
      <nav className="bottom-nav" aria-label="Main navigation">
        {tabs.map(([id,icon,label])=><a key={id} href={'#'+id} aria-current={activeRoute===id?'page':undefined}><span className="material-symbols-outlined" aria-hidden="true">{icon}</span><span>{label}</span></a>)}
      </nav>
    </div>
  );
}

