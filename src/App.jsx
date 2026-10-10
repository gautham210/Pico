import {useEffect,useState} from 'react';
import {motion,useReducedMotion} from 'framer-motion';
import Nav from './components/Nav';
import Discover from './screens/Discover';
import {Home,Plan,Reroute,Diary,DNA,MapScreen,Trips} from './screens/Journey';
import Login from './screens/Login';
import Profile from './screens/Profile';
import {useStore} from './lib/store';
import idle from '../Pico emotions/idle.png';
import curious from '../Pico emotions/curious.png';
import excited from '../Pico emotions/excited.png';
import worried from '../Pico emotions/worried.png';
import lost from '../Pico emotions/lost.png';
import proud from '../Pico emotions/proud.png';
import sleepy from '../Pico emotions/sleepy.png';
const emotions={idle,curious,excited,worried,lost,proud,sleepy};

const tabs=[['home','explore','Home'],['discover','style','Discover'],['plan','calendar_today','Plan'],['reroute','sync_problem','Reroute'],['diary','menu_book','Diary'],['dna','fingerprint','DNA']];
const titles={home:'Where to next?',discover:'Discover Swipe Deck',plan:'Plan & Itinerary',reroute:'Disruption Diff',diary:'Trip Diary',dna:'Your Travel DNA',map:'Route Explorer',trips:'Your Journeys',profile:'Profile'};

export default function App(){
  const s=useStore();
  const [route,setRoute]=useState(location.hash.slice(1)||'home');
  const reduced=useReducedMotion();
  
  useEffect(()=>{
    const change=()=>{setRoute(location.hash.slice(1)||'home');window.scrollTo(0,0);};
    window.addEventListener('hashchange',change);
    return()=>window.removeEventListener('hashchange',change);
  },[]);
  
  const navigate=name=>{location.hash=name;};
  
  // Enforce login
  const activeRoute = !s.user ? 'login' : (route === 'login' && s.user ? 'home' : route);

  const Screen={home:Home,plan:Plan,reroute:Reroute,diary:Diary,dna:DNA,map:MapScreen,trips:Trips,profile:Profile}[activeRoute];
  const quietHours=new Date().getHours()>=22||new Date().getHours()<6;
  const noMappedHomeCollection=activeRoute==='map'&&s.userPrefs.city==='Kochi'&&!s.likedPlaces.some(p=>Array.isArray(p.coords)&&p.coords.length===2&&p.coords.every(Number.isFinite));
  const mood=s.storageError||noMappedHomeCollection?'lost':s.disruption||s.budgetRemaining<s.budgetEnvelope*.2?'worried':activeRoute==='diary'&&s.diary.length?'proud':activeRoute==='dna'&&s.likedPlaces.length?'proud':activeRoute==='discover'?'curious':activeRoute==='home'&&!s.likedPlaces.length&&quietHours?'sleepy':s.likedPlaces.length?'excited':'idle';

  if (activeRoute === 'login') {
    return <div className="pico-app"><Login navigate={navigate} /></div>;
  }

  return (
    <div className="pico-app">
      <Nav title={titles[activeRoute]||'Pico'} mood={mood} moodImage={emotions[mood]}/>
      <div className="app-content">
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

