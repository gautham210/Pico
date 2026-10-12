import TransportPreview from '../components/TransportPreview';
import {supportedCities} from '../../data/city-collections.js';
import DestinationCollections from '../components/DestinationCollections';
import {SampleMemories,SampleDNA} from '../components/DemoPreviews';
import dnaTern from '../../Bird Only.png';
import {lazy,Suspense,useCallback,useEffect,useRef,useState} from 'react';
import {useStore,committed,unknownPlaceCosts,activeTripPlaces} from '../lib/store';
import {modes,money} from '../lib/provider';
import {places} from '../data/places';
import Button from '../components/Button';
import TripParameters from '../components/TripParameters';
import {PlaceImage,PhotoCredit} from '../components/JourneyUI';
import {itinerary,clockTime,profileFor} from '../lib/journey';
import {getRoute,validCoords,requestAiPlan} from '../lib/service-api.js';
import {loadCatalog} from '../lib/catalog.js';
import {createTravelDnaCard} from '../lib/travel-dna-card.js';
import {getLocalPhoto,removeLocalPhoto,saveLocalPhoto} from '../lib/media-store.js';
import {
  LatticeLoader,
  SquishSwitch,
  SpringCheck,
  SwipeRow,
  BellToggle,
  SwipeToast,
  HoloCard,
  PeekRating
} from '../components/reactbits';
import CostIntelligence from '../components/CostIntelligence';
import AccommodationDiscovery from '../components/AccommodationDiscovery';
import FoodDiscovery from '../components/FoodDiscovery';
import PlanAdjuster from '../components/PlanAdjuster';
import CollectiblesGallery from '../components/CollectiblesGallery';
import DestinationHunts from '../components/DestinationHunts';
import CommunityGems from '../components/CommunityGems';
import { PicoMascot } from '../components/pico';
const InteractiveMap=lazy(()=>import('../components/InteractiveMap.jsx'));
const tripCity=s=>{const active=activeTripPlaces(s);const cities=[...new Set(active.map(p=>p.city||s.userPrefs?.city||'Kochi'))];return cities.join(' & ')||s.userPrefs?.city||'Kochi';};
const Heading=({eyebrow,title,children})=><><small className="eyebrow">{eyebrow}</small><h1>{title}</h1>{children}</>;
const Empty=({navigate})=><section className="panel empty"><h2>Your next adventure is still a blank page.</h2><p>Save a place in Discover to build your own costed itinerary.</p><Button onClick={()=>navigate('discover')}>Start exploring</Button></section>;
function TransportLookup({city,prefs}){
 const defaultTrainDest = {Goa:'MAO',Kochi:'ERS',Bengaluru:'SBC',Kozhikode:'CLT',Mysuru:'MYS'}[city]||'';
 const defaultAirportDest = {Goa:'GOI',Kochi:'COK',Bengaluru:'BLR',Kozhikode:'CCJ',Mysuru:'MYQ'}[city]||'';
 const defaultBusDest = city || (/goa/i.test(city) ? 'Goa' : 'Kochi');
 const defaultDate = prefs.startDate || new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10);
 const [date,setDate]=useState(defaultDate);
 const [stationOrigin,setStationOrigin]=useState('SBC');
 const [stationDestination,setStationDestination]=useState(defaultTrainDest);
 const [airportOrigin,setAirportOrigin]=useState('BLR');
 const [airportDestination,setAirportDestination]=useState(defaultAirportDest);
 const [busOrigin,setBusOrigin]=useState(prefs.origin||'Bengaluru');
 const [busDestination,setBusDestination]=useState(defaultBusDest);
 const [results,setResults]=useState({});
 const [loading,setLoading]=useState('');

 useEffect(()=>{
  if(prefs.startDate) setDate(prefs.startDate);
  if(prefs.origin) setBusOrigin(prefs.origin);
  setStationDestination(defaultTrainDest);
  setAirportDestination(defaultAirportDest);
  setBusDestination(city || (/goa/i.test(city) ? 'Goa' : 'Kochi'));
 },[city,prefs.startDate,prefs.origin]);

 const search=async type=>{
  const origin=type==='flights'?(airportOrigin.trim().toUpperCase()||'BLR'):type==='trains'?(stationOrigin.trim().toUpperCase()||'SBC'):(busOrigin.trim()||'Bengaluru');
  const destination=type==='flights'?(airportDestination.trim().toUpperCase()||defaultAirportDest):type==='trains'?(stationDestination.trim().toUpperCase()||defaultTrainDest):(busDestination.trim()||defaultBusDest);
  const travelDate=date||defaultDate;
  if(!origin||!destination||!travelDate||origin.toLowerCase()===destination.toLowerCase()){
   setResults(old=>({...old,[type]:{status:'UNAVAILABLE',reason:'Please provide distinct origin and destination, and a travel date.',results:[]}}));
   return;
  }
  setLoading(type);
  try{
   const response=await fetch(`/api/${type}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin,destination,date:travelDate}),signal:AbortSignal.timeout(18000)});
   const data=await response.json();
   setResults(old=>({...old,[type]:data}));
  }catch{
   setResults(old=>({...old,[type]:{status:'UNAVAILABLE',reason:'The endpoint is unavailable in this environment. On Vercel Preview, check function deployment and server configuration.',results:[]}}));
  }finally{setLoading('');}
 };

 const names={trains:'Train',buses:'Bus',flights:'Flight'};
 const directLinks = {
  trains: 'https://www.irctc.co.in/nget/booking/train-list',
  buses: `https://www.redbus.in/bus-tickets/${encodeURIComponent((busOrigin||'bengaluru').toLowerCase())}-to-${encodeURIComponent((busDestination||city||'goa').toLowerCase())}`,
  flights: `https://www.google.com/travel/flights?q=flights%20from%20${encodeURIComponent(airportOrigin||'BLR')}%20to%20${encodeURIComponent(airportDestination||defaultAirportDest)}`
 };

 return (
  <section className="panel transport-lookup">
   <small className="eyebrow">Transport providers</small>
   <h2>Check transport data</h2>
   <p>Check available trains, buses and flights for your dates. When provider results are unavailable, you can search directly with the booking provider.</p>
   <div className="transport-search-fields">
    <label>Travel date<input type="date" value={date} onChange={event=>setDate(event.target.value)}/></label>
    <label>Train origin station code<input value={stationOrigin} onChange={event=>setStationOrigin(event.target.value.toUpperCase().slice(0,5))} maxLength={5} placeholder="e.g. SBC"/></label>
    <label>Train destination station code<input value={stationDestination} onChange={event=>setStationDestination(event.target.value.toUpperCase().slice(0,5))} maxLength={5} placeholder="e.g. MAO or ERS"/></label>
    <label>Bus origin city<input value={busOrigin} onChange={e=>setBusOrigin(e.target.value)} placeholder="e.g. Bengaluru"/></label>
    <label>Bus destination city<input value={busDestination} onChange={e=>setBusDestination(e.target.value)} placeholder="e.g. Goa or Kochi"/></label>
    <label>Flight origin IATA<input value={airportOrigin} onChange={event=>setAirportOrigin(event.target.value.toUpperCase().slice(0,3))} maxLength={3} placeholder="e.g. BLR"/></label>
    <label>Flight destination IATA<input value={airportDestination} onChange={event=>setAirportDestination(event.target.value.toUpperCase().slice(0,3))} maxLength={3} placeholder="e.g. GOI or COK"/></label>
   </div>
   <div className="actions">
    {Object.keys(names).map(type=>(
     <Button key={type} variant="secondary" disabled={loading!==''} onClick={()=>search(type)}>
      {loading===type?'Searching…':`Search ${names[type]} data`}
     </Button>
    ))}
   </div>
   {Object.entries(results).map(([type,result])=>(
    <div className="transport-result" key={type} role="status">
     <h3>
      {names[type]} · <span className={`status-tag status-${(result.status||'UNAVAILABLE').toLowerCase()}`}>{result.status||'UNAVAILABLE'}</span>
      {result.provider?` · ${result.provider}`:''}
     </h3>
     {(result.error||result.reason)&&<p className="transport-reason">{result.error||result.reason}</p>}
     {result.status==='DEMO'&&<p className="notice"><strong>DEMO FIXTURE:</strong> Labelled fixture shown for preview purposes. Not live provider data.</p>}
     {result.results?.length?result.results.map((item,index)=>(
      <article key={`${type}-${index}`}>
       <strong>{item.name||item.operator||item.airline||`${names[type]} option`}</strong>
       <span>{item.cost==null?'Fare unavailable':money(item.cost)} · {item.duration||'Duration unavailable'}</span>
       {item.departure&&<small>Departure {item.departure}{item.arrival?` · Arrival ${item.arrival}`:''}</small>}
       {item.url&&<a href={item.url} target="_blank" rel="noreferrer">Open booking link</a>}
      </article>
     )):(
      <div className="no-provider-results">
       <p>No live provider results returned. Live fares or schedules are not invented.</p>
       <a href={directLinks[type]} target="_blank" rel="noreferrer" className="direct-provider-link">
        Search {names[type]}s directly on {type==='trains'?'IRCTC':type==='buses'?'redBus':'Google Flights'} →
       </a>
      </div>
     )}
    </div>
   ))}
  </section>
 );
}
function DiaryPhoto({id,alt}){const [src,setSrc]=useState('');useEffect(()=>{let url='',active=true;getLocalPhoto(id).then(blob=>{if(active&&blob){url=URL.createObjectURL(blob);setSrc(url);}}).catch(()=>{});return()=>{active=false;if(url)URL.revokeObjectURL(url);};},[id]);return src?<img className="entry-photo" src={src} alt={alt}/>:<p className="muted">This saved photo is unavailable on this device.</p>;}
export function Home({navigate}){
  const s=useStore(),activePlaces=activeTripPlaces(s),city=s.userPrefs?.city||'Kochi';
  const hasStops=activePlaces.length>0;
  const welcomeMsg=hasStops
    ? `You've saved ${activePlaces.length} places in ${city}! Ready to build your day-by-day plan?`
    : `Hi! I'm Pico, your Arctic Tern travel companion. Where should we explore next? Let's check Discover!`;

  return <main className="journey home-page">
    <section className="pico-companion-hero">
      <PicoMascot
        mood={hasStops?'happy':'curious'}
        size="lg"
        message={welcomeMsg}
        actionLabel={hasStops?"Review Plan →":"Start Exploring →"}
        onAction={()=>navigate(hasStops?'plan':'discover')}
      />
      <div style={{flex:1,minWidth:0}}>
        <small className="eyebrow">YOUR TRAVEL COMPANION</small>
        <h1 style={{margin:'4px 0 8px',fontSize:'24px'}}>Welcome to {city}</h1>
        <p style={{margin:0,fontSize:'13px',color:'var(--muted)'}}>
          {hasStops
            ? `${activePlaces.length} stops ready. Customise your budget or discover more hidden gems.`
            : `Explore honest local recommendations, cost estimates, and real caveats before you travel.`}
        </p>
      </div>
    </section>
    <DestinationCollections navigate={navigate}/>
    <div className="home-next">
      <div>
        <small className="eyebrow">A plan that feels like you</small>
        <h2>Discover. Keep. Make a day of it.</h2>
        <p>Your saved places become a day-by-day itinerary, with honest estimates and room to change your mind.</p>
      </div>
      <Button onClick={()=>navigate('plan')}>Open my itinerary</Button>
    </div>
    <details className="trip-settings">
      <summary>Personalise your trip · budget, dates & pace</summary>
      <TripParameters/>
    </details>
    <div className="actions">
      <Button variant="secondary" onClick={()=>navigate('trips')}>Your journeys</Button>
      <Button variant="ghost" onClick={()=>navigate('dna')}>Your Travel DNA</Button>
    </div>
  </main>;
}
export function Plan({navigate}){
 const s=useStore(),[error,setError]=useState(''),[planning,setPlanning]=useState(false),[planNotice,setPlanNotice]=useState('');
 const [showAdjuster, setShowAdjuster] = useState(false);
 const [activePlanTab, setActivePlanTab] = useState('itinerary');
 const [toastMsg, setToastMsg] = useState('');
 const mode=modes[s.mode],activePlaces=activeTripPlaces(s),unknown=unknownPlaceCosts(s);

 const generatePlan=async()=>{
  if(!activePlaces.length)return;
  setPlanning(true);
  setPlanNotice('');
  try{
   const planResult=await requestAiPlan({
    destination:s.userPrefs?.city||'Kochi',
    days:s.userPrefs?.days||3,
    travelers:s.userPrefs?.travelers||1,
    startDate:s.userPrefs?.startDate||'',
    budget:s.budgetEnvelope,
    pace:s.userPrefs?.pace||'balanced',
    vibes:s.userPrefs?.vibes||[],
    savedPlaces:activePlaces,
    rejectedPlaces:s.passedPlaces||[],
    mode:s.mode||'convenient',
    origin:s.userPrefs?.origin||''
   });
   if(planResult&&planResult.status==='SUCCESS'&&Array.isArray(planResult.days)&&planResult.days.length>0){
    s.setItineraryPlan(planResult);
    if(planResult.source==='AI_PLAN'){
     setPlanNotice(`✨ Pico AI organized your ${activePlaces.length} saved places (${planResult.model||'Gemini'}).`);
    }else{
     setPlanNotice(`Pico deterministic planning engine organized your ${activePlaces.length} saved places.`);
    }
   }else{
    setPlanNotice(planResult?.error||'Planner was unable to complete the request. Your current itinerary remains unchanged.');
   }
  }catch{
   setPlanNotice('Planning service is unavailable right now. Your current itinerary remains unchanged.');
  }finally{
   setPlanning(false);
  }
 };

 const plan=s.itineraryPlan;
 const days=plan?.days?.length?plan.days:itinerary(s);

 const planSourceBadge=plan?(
  plan.source==='AI_PLAN'?(
   <span className="status-tag status-ai">✨ AI-Assisted · {plan.model||'Gemini'}</span>
  ):(
   <span className="status-tag status-cached">Rule-Based · Deterministic Engine</span>
  )
 ):(
  <span className="status-tag status-cached">Rule-based plan</span>
 );

 const modifiedBadge=plan?.manuallyModified?(
  <span className="status-tag status-demo">Manually Adjusted</span>
 ):null;

 return <main className="journey">
  <Heading
   eyebrow={<>Your days, your way · {planSourceBadge}{modifiedBadge&&<> · {modifiedBadge}</>}</>}
   title={tripCity(s)+' itinerary'}
  />
  {!activePlaces.length?<Empty navigate={navigate}/>:<>
  <section className="panel">
   <div className="row spread">
    <div>
     <small className="eyebrow">Known planned · per traveller</small>
     <h2>{money(committed(s))}</h2>
    </div>
    <strong>{activePlaces.length} saved stops</strong>
   </div>
   <p>{money(s.budgetRemaining)} {unknown?'available before unknown costs':'estimated remaining'} · {s.userPrefs.days} days · {s.userPrefs.travelers} traveller(s)</p>
   {unknown>0&&<p>{unknown} stop prices unknown and excluded. Stays and additional intercity transfers are not included.</p>}
   <div className="actions">
    <Button onClick={generatePlan} disabled={planning}>
     {planning?'Crafting balanced plan…':plan?'✨ Regenerate Itinerary':'✨ Generate AI Itinerary'}
    </Button>
    <Button variant="secondary" onClick={()=>setShowAdjuster(true)}>⚙️ Adjust Plan</Button>
    <Button variant="secondary" onClick={()=>navigate('map')}>View route</Button>
    <Button variant="secondary" onClick={()=>{s.triggerDisruption();navigate('reroute');}}>Try reroute simulation</Button>
    <Button variant="ghost" onClick={()=>navigate('discover')}>Add a place</Button>
   </div>
   {planNotice&&<p role="status" className="transport-reason" style={{marginTop:'12px'}}>{planNotice}</p>}

   <div className="plan-tabs-bar" style={{ display: 'flex', gap: '8px', margin: '14px 0 0', overflowX: 'auto', paddingBottom: '4px' }}>
    {[
      ['itinerary', 'Timeline Plan 🗺️'],
      ['cost', 'Cost Model 💰'],
      ['stays', 'Where to Stay 🏨'],
      ['food', 'Food & Dining 🍽️']
    ].map(([tabId, label]) => (
      <button
        key={tabId}
        type="button"
        className={`pref-pill ${activePlanTab === tabId ? 'active' : ''}`}
        onClick={() => setActivePlanTab(tabId)}
        style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '16px', whiteSpace: 'nowrap' }}
      >
        {label}
      </button>
    ))}
   </div>

   <div style={{marginTop:'16px'}}>
     <BellToggle
       destinationName={tripCity(s)}
       departureDate={s.userPrefs.startDate||'Upcoming departure'}
       initialEnabled={s.reminders?.enabled}
       initialOffset={s.reminders?.offsetDays||1}
       onToggle={settings=>s.setReminder(settings)}
     />
   </div>
  </section>

  {toastMsg&&(
    <div style={{margin:'10px 0'}}>
      <SwipeToast
        id={`plan-toast-${Date.now()}`}
        type="info"
        title="Schedule Updated"
        message={toastMsg}
        source="Pico Itinerary Engine"
        onDismiss={()=>setToastMsg('')}
      />
    </div>
  )}

  <PlanAdjuster
    isOpen={showAdjuster}
    onClose={()=>setShowAdjuster(false)}
    onPlanRegenerated={generatePlan}
  />

  {activePlanTab==='cost'&&<CostIntelligence onAdjustPlan={()=>setShowAdjuster(true)}/>}
  {activePlanTab==='stays'&&<AccommodationDiscovery/>}
  {activePlanTab==='food'&&<FoodDiscovery/>}

  {activePlanTab==='itinerary'&&(<>

  {planning&&(
    <section style={{margin:'16px 0'}}>
      <div style={{display:'flex',justifyContent:'center',marginBottom:'12px'}}>
        <PicoMascot
          mood="thinking"
          size="md"
          message="Calculating routes and arranging your days into a balanced rhythm…"
        />
      </div>
      <LatticeLoader
        title="Pico AI Itinerary Engine"
        onRetry={generatePlan}
      />
    </section>
  )}

  <section className="panel" style={{marginTop:'16px'}}>
   <div className="row spread" style={{marginBottom:'8px'}}>
     <div>
       <small className="eyebrow">TRIP PREPARATION</small>
       <h2 style={{margin:'2px 0 0'}}>Readiness Checklist</h2>
     </div>
     <span className="count-pill">
       {(s.checklist||[]).filter(c=>c.completed).length} / {(s.checklist||[]).length} done
     </span>
   </div>
   {(s.checklist||[]).length>0&&(s.checklist||[]).every(c=>c.completed)&&(
     <div style={{margin:'8px 0 12px',display:'flex',justifyContent:'center'}}>
       <PicoMascot
         mood="celebrating"
         size="sm"
         message="All set! Your trip checklist is 100% complete. Ready for takeoff!"
       />
     </div>
   )}
   <p style={{fontSize:'12px',color:'var(--muted)',marginBottom:'12px'}}>
     Check off tasks as you prepare. Swipe left to remove an item.
   </p>
   <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
     {(s.checklist||[]).map(item=>(
       <SwipeRow
         key={item.id}
         actions={[
           {
             id:'delete',
             label:'Remove',
             icon:'🗑️',
             variant:'danger',
             onClick:()=>s.removeChecklistItem(item.id)
           }
         ]}
       >
         <SpringCheck
           id={`chk-${item.id}`}
           checked={item.completed}
           onChange={()=>s.toggleChecklistItem(item.id)}
           label={item.text}
         />
       </SwipeRow>
     ))}
   </div>
  </section>

  {plan?.warnings?.length>0&&<section className="plan-warnings panel">
   <h3>Planning Caveats & Warnings</h3>
   <ul>{plan.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul>
  </section>}

  {days.map(day=><section className="day-group" key={day.day}>
   <header>
    <span>{String(day.day).padStart(2,'0')}</span>
    <div>
     <small className="eyebrow">{s.userPrefs.pace} pace · suggested timing{day.date?` · ${day.date}`:''}</small>
     <h2>Day {day.day}{day.theme?` · ${day.theme}`:''}</h2>
    </div>
   </header>
   <div className="timeline">
    {day.stops.map((p,idx)=>{
     const i=activePlaces.findIndex(x=>x.id===p.id);
     const leg=day.legs?.[idx];
     return <div key={p.id}>
      <article className="panel stop">
       <PlaceImage place={p}/>
       <PhotoCredit place={p}/>
       <small className="eyebrow">{clockTime(p.start)}–{clockTime(p.end)} · {p.visitMinutes||p.time||90} min suggested</small>
       <h2>{p.name}</h2>
       <p>{p.city||s.userPrefs?.city||'Kochi'} · {p.category} · {Number.isFinite(p.cost)?money(p.cost)+' estimate':'Price not verified'}</p>
       {p.fitReason&&<div className="fit-reason-badge"><strong>Why Pico planned this:</strong> {p.fitReason}</div>}
       <p>{p.description}</p>
       <details><summary>Reality Check</summary><p className="reality">{p.caveat||p.realityCheck||'No caveat recorded for this stop.'}</p></details>
       <div className="actions">
        <button aria-label={'Move '+p.name+' up'} onClick={()=>s.movePlace(p.id,-1)} disabled={i<=0}>Move up</button>
        <button aria-label={'Move '+p.name+' down'} onClick={()=>s.movePlace(p.id,1)} disabled={i===-1||i>=activePlaces.length-1}>Move down</button>
        <button
          type="button"
          aria-label={((s.lockedStops||[]).includes(p.id)?'Unlock ':'Lock ')+p.name}
          onClick={()=>{
            const locked=(s.lockedStops||[]).includes(p.id);
            s.toggleLockStop(p.id);
            setToastMsg(locked?`Unlocked ${p.name}`:`Locked ${p.name} in schedule`);
          }}
          style={{
            background:(s.lockedStops||[]).includes(p.id)?'var(--teal)':'transparent',
            color:(s.lockedStops||[]).includes(p.id)?'#fff':'var(--ink)'
          }}
        >
          {(s.lockedStops||[]).includes(p.id)?'🔒 Locked':'🔓 Lock'}
        </button>
        <button onClick={()=>s.removePlace(p.id)}>Remove {p.name}</button>
       </div>
      </article>
      {leg&&<div className="travel-leg">
       <span className="material-symbols-outlined leg-icon" aria-hidden="true">directions_car</span>
       <div><strong>Transfer to {leg.toStopName||'next stop'}:</strong> {leg.distanceKm!=null?`${leg.distanceKm.toFixed(1)} km · `:''}{leg.durationMinutes} min estimate ({leg.note})</div>
      </div>}
     </div>;
    })}
   </div>
  </section>)}

  <section className="panel">
   <h2>Travel style & budget</h2>
   <div className="mode-tabs">
    {Object.entries(modes).map(([id,m])=><button key={id} aria-pressed={s.mode===id} onClick={()=>setError(s.setMode(id)?'':'This mode exceeds your budget. Adjust it on Home first.')}>{m.name}<strong>{money(m.cost)}</strong></button>)}
   </div>
   <div style={{margin:'14px 0'}}>
     <SquishSwitch
       checked={s.mode==='fastest'}
       onChange={isFlight=>{
         const target=isFlight?'fastest':'convenient';
         const ok=s.setMode(target);
         if(!ok)setError('Flight mode transport exceeds your budget envelope.');
         else setError('');
       }}
       label="Flight / Airplane Route Mode"
       description="Prioritizes flight connections in transit calculations and budget"
     />
   </div>
   <p>{mode.explanation}</p>
   <p>{mode.minutes+s.routeDelay} min illustrative inbound transport · not a live quote.</p>
   <p role="alert">{error}</p>
  </section>

  <TransportPreview/>
  <details className="trip-settings">
   <summary>Search real providers · dates and station codes</summary>
   <TransportLookup city={s.userPrefs.city} prefs={s.userPrefs}/>
  </details>
  <p className="fine-print">
   {plan
    ? `${plan.source==='AI_PLAN'?'AI-assisted plan':'Deterministic fallback plan'}. ${plan.provenance?.notes||''} Visit lengths are suggestions. Fares and transfer times are illustrative estimates; confirm transfers, opening hours and admission locally.`
    : 'Rule-based planning, not AI-generated. Visit lengths are suggestions. Confirm transfers, opening hours and admission locally.'}
  </p>
  </>)}
  </>}
 </main>;
}
export function Reroute({navigate}){const s=useStore(),[error,setError]=useState(''),activePlaces=activeTripPlaces(s);const m=modes[s.mode];return <main className="journey"><Heading eyebrow="Adaptive Plan Diff · Simulated" title="When plans change, Pico adapts."/>{!activePlaces.length?<Empty navigate={navigate}/>:!s.disruption?<section className="panel"><h2>No disruption pending</h2><p>Your {m.vehicle} route is selected. {s.routeDelay>0&&`An accepted adjustment adds ${s.routeDelay} minutes and ${money(s.routeExtra)}.`}</p><Button onClick={s.triggerDisruption}>Simulate transport delay</Button>{s.routeDelay>0&&<Button variant="secondary" onClick={s.restoreRoute}>Restore original transport</Button>}<Button variant="ghost" onClick={()=>navigate('plan')}>Back to itinerary</Button></section>:<>
<div style={{margin:'14px 0'}}>
  <div style={{display:'flex',justifyContent:'center',marginBottom:'10px'}}>
    <PicoMascot
      mood="worried"
      size="sm"
      message="Transit delay detected! Swipe the notification below or check the proposed reroute."
    />
  </div>
  <SwipeToast
    id="reroute-toast"
    type="warning"
    title="Transit Connection Delay Detected"
    message={`Demo: ${s.mode==='fastest'?'a runway closure':s.mode==='cheapest'?'track maintenance':'a bridge closure'} delays the selected connection by 95 minutes.`}
    source="OSRM Transit Simulation"
    timestamp="Just now"
    isSimulated={true}
    onDismiss={()=>s.rejectReroute()}
  />
</div>
<section className="alert-panel"><h2>Simulated disruption</h2><p>Demo: {s.mode==='fastest'?'a runway closure':s.mode==='cheapest'?'track maintenance':'a bridge closure'} delays the selected connection by 95 minutes.</p></section><div className="diff"><section className="panel"><small>ORIGINAL PLAN</small><h2>{money(committed(s))}</h2><p>{m.vehicle}</p><p>{m.minutes+s.routeDelay} min transport</p></section><section className="panel"><small>PROPOSED PLAN</small><h2>{money(committed(s)+770)}</h2><p>{m.vehicle} + replacement transfer</p><p>{m.minutes+s.routeDelay+95} min transport</p></section></div><section className="panel"><h2>Pico's advice</h2><p>Shift the first activity later and use a replacement transfer. Your places remain in order.</p><p>+{money(770)} · +1h 35m · estimated, not booked</p><p role="alert">{error}</p><div className="actions"><Button onClick={()=>{if(s.acceptReroute())navigate('plan');else setError('Adjustment exceeds your budget. Increase the budget or reject it.');}}>Accept reroute</Button><Button variant="secondary" onClick={s.rejectReroute}>Keep original plan</Button></div></section></>}</main>;}
export function Diary(){
 const s=useStore(),fileInput=useRef(null);
 const diaryPlaces=[...new Map([...places,...s.likedPlaces].map(p=>[p.id,p])).values()];
 const today=new Date().toISOString().slice(0,10);
 const [note,setNote]=useState(''),[place,setPlace]=useState(s.likedPlaces[0]?.id||places[0]?.id||'');
 const [photo,setPhoto]=useState(''),[photoId,setPhotoId]=useState(''),[photoBlob,setPhotoBlob]=useState(null),[photoPreview,setPhotoPreview]=useState('');
 const [rating,setRating]=useState('A'),[numericRating,setNumericRating]=useState(4);
 const [entryDate,setEntryDate]=useState(today),[editingId,setEditingId]=useState(''),[error,setError]=useState('');
 const [selectedTags,setSelectedTags]=useState([]);
 const [markVisited,setMarkVisited]=useState(true);
 const [searchQuery,setSearchQuery]=useState('');
 const [showInspiration,setShowInspiration]=useState(false);

 const availableTags=['Sunset','Heritage','Local Food','Hidden Gem','Scenic View','Art & Culture','Peaceful','Adventure'];

 useEffect(()=>{
  if(!photoBlob){setPhotoPreview('');return;}
  const url=URL.createObjectURL(photoBlob);
  setPhotoPreview(url);
  return()=>URL.revokeObjectURL(url);
 },[photoBlob]);

 const resetForm=()=>{
  setNote('');setPhoto('');setPhotoId('');setPhotoBlob(null);
  setRating('A');setNumericRating(4);setEntryDate(today);
  setEditingId('');setError('');setSelectedTags([]);setMarkVisited(true);
  if(fileInput.current)fileInput.current.value='';
 };

 const edit=entry=>{
  setEditingId(entry.id);
  setNote(entry.note||'');
  setPlace(entry.placeId||diaryPlaces[0]?.id||'');
  setPhoto(entry.photo||'');
  setPhotoId(entry.photoId||'');
  setPhotoBlob(null);
  setRating(entry.rating||'A');
  setNumericRating(entry.rating==='S'?5:entry.rating==='A'?4:entry.rating==='B'?3:entry.rating==='C'?2:1);
  setEntryDate(new Date(entry.date||Date.now()).toISOString().slice(0,10));
  setSelectedTags(entry.tags||[]);
  setError('');
  window.scrollTo({top:0,behavior:'smooth'});
 };

 const choose=e=>{
  const f=e.target.files?.[0];
  if(!f)return;
  if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>3*1024*1024){
   setError('Choose a PNG, JPEG or WebP under 3 MB.');
   e.target.value='';
   return;
  }
  const url=URL.createObjectURL(f),image=new Image();
  image.onload=()=>{URL.revokeObjectURL(url);setPhotoBlob(f);setPhoto('');setError('');};
  image.onerror=()=>{URL.revokeObjectURL(url);setError('This file is not a readable image. Choose another photo.');e.target.value='';};
  image.src=url;
 };

 const toggleTag=t=>setSelectedTags(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t]);

 const save=async e=>{
  e.preventDefault();
  if(!note.trim()&&!photo&&!photoId&&!photoBlob){
   setError('Add a note or a photo first.');
   return;
  }
  const id=editingId||globalThis.crypto?.randomUUID?.()||`memory-${Date.now()}`;
  const placeObj=diaryPlaces.find(p=>p.id===place);
  try{
   if(photoBlob)await saveLocalPhoto(id,photoBlob);
   const entry={
    id,
    note:note.trim(),
    placeId:place,
    placeName:placeObj?.name||'Travel memory',
    photo:photoBlob?'':photo,
    photoId:photoBlob||photoId?id:'',
    rating,
    tags:selectedTags,
    date:entryDate
   };
   const previous=s.diary.find(item=>item.id===editingId);
   if(editingId)s.editEntry(editingId,entry);
   else s.addEntry(entry);
   if(previous?.photoId&&!entry.photoId)removeLocalPhoto(previous.photoId).catch(()=>{});
   if(markVisited&&placeObj){
    s.markPlaceVisited(placeObj,note.trim());
   }
   resetForm();
  }catch(err){
   setError(`Memory was not saved: ${err.message||'local photo storage is unavailable.'}`);
  }
 };

 const filteredDiary=s.diary.filter(item=>{
  if(!searchQuery.trim())return true;
  const q=searchQuery.toLowerCase();
  return (item.placeName||'').toLowerCase().includes(q)||(item.note||'').toLowerCase().includes(q)||(item.tags||[]).some(t=>t.toLowerCase().includes(q));
 });

 return (
  <main className="journey">
   <Heading eyebrow="Personal Memory Vault" title="Trip Diary & Field Notes">
    <p>Your authentic stories live here. Saved privately on this device with offline IndexedDB vault; no cloud tracking or unauthorized exposure.</p>
   </Heading>

   {!s.diary.length&&(
    <section className="panel empty" style={{textAlign:'center',padding:'24px 16px',marginBottom:'20px'}}>
     <div style={{display:'flex',justifyContent:'center',marginBottom:'12px'}}>
      <PicoMascot
       mood="curious"
       size="md"
       message="Your memory vault is waiting for its first story! Log your reflections and photos below."
      />
     </div>
     <h2>Your travel vault is clean and ready.</h2>
     <p>Log a moment with a photo, personal reflections, tags and a vibe rating.</p>
     <div style={{marginTop:'12px'}}>
      <Button variant="secondary" onClick={()=>setShowInspiration(prev=>!prev)}>
       {showInspiration ? 'Hide sample examples' : 'Need inspiration? View demo examples 💡'}
      </Button>
     </div>
    </section>
   )}

   {showInspiration&&(
    <div style={{background:'rgba(255,183,3,0.07)',border:'1.5px dashed var(--saffron)',borderRadius:'16px',padding:'14px',marginBottom:'18px'}}>
     <div className="row spread" style={{alignItems:'center',marginBottom:'6px'}}>
      <small style={{fontWeight:700,color:'var(--ink)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
       💡 Illustrative Examples (Demo Preview — Not your real history)
      </small>
      <button type="button" className="quiet-button" onClick={()=>setShowInspiration(false)} style={{fontSize:'12px',cursor:'pointer'}}>Close ✕</button>
     </div>
     <p style={{fontSize:'12px',color:'var(--muted)',marginBottom:'12px'}}>These demo cards illustrate how logged memories appear with photos and ratings.</p>
     <SampleMemories onHide={()=>setShowInspiration(false)}/>
    </div>
   )}

   <form className="panel" onSubmit={save} style={{marginBottom:'24px'}}>
    <small className="eyebrow">{editingId?'EDITING MEMORY':'LOG A NEW MEMORY'}</small>
    <h2 style={{margin:'4px 0 16px'}}>{editingId?'Update your memory':'Record a moment'}</h2>

    <label>Destination / Location
     <select value={place} onChange={e=>setPlace(e.target.value)}>
      {diaryPlaces.map(p=><option key={p.id} value={p.id}>{p.name} ({p.city||'Kochi'})</option>)}
     </select>
    </label>

    <label>Memory date
     <input type="date" value={entryDate} onChange={e=>setEntryDate(e.target.value)}/>
    </label>

    <div style={{margin:'14px 0'}}>
     <label style={{display:'block',marginBottom:'6px',fontWeight:600,fontSize:'13px'}}>Experience Rating (PeekRating)</label>
     <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
      <PeekRating
       value={numericRating}
       onChange={val=>{
        setNumericRating(val);
        setRating(val>=5?'S':val===4?'A':val===3?'B':val===2?'C':'D');
       }}
      />
      <span className="count-pill" style={{background:'var(--teal)',color:'#fff',fontWeight:700,fontSize:'12px'}}>
       {rating} TIER ({numericRating} ★)
      </span>
     </div>
    </div>

    <label>Personal reflections
     <textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={2000} placeholder="What made this moment special? The morning light, a conversation with a local, the taste of cardamoms..."/>
    </label>

    <div style={{margin:'12px 0'}}>
     <label style={{display:'block',marginBottom:'6px',fontWeight:600,fontSize:'13px'}}>Memory Tags</label>
     <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
      {availableTags.map(t=>(
       <button
        type="button"
        key={t}
        className={`chip ${selectedTags.includes(t)?'mint':''}`}
        onClick={()=>toggleTag(t)}
        style={{cursor:'pointer',fontSize:'12px'}}
       >
        {selectedTags.includes(t)?`✓ ${t}`:`+ ${t}`}
       </button>
      ))}
     </div>
    </div>

    <div style={{margin:'12px 0'}}>
     <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'13px'}}>
      <input type="checkbox" checked={markVisited} onChange={e=>setMarkVisited(e.target.checked)}/>
      <span>Mark this location as <strong>Visited</strong> in your Travel DNA Passport</span>
     </label>
    </div>

    <label>Attach photo
     <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={choose}/>
    </label>

    {(photo||photoPreview||photoId)&&(
     <div style={{margin:'12px 0'}}>
      {photoPreview?<img className="entry-photo" src={photoPreview} alt="Selected memory photo preview"/>:photo?<img className="entry-photo" src={photo} alt="Legacy saved memory photo preview"/>:<DiaryPhoto id={photoId} alt="Saved memory photo preview"/>}
      <button type="button" className="quiet-button" onClick={()=>{setPhoto('');setPhotoId('');setPhotoBlob(null);if(fileInput.current)fileInput.current.value='';}} style={{fontSize:'12px',marginTop:'6px',color:'var(--coral)'}}>
       Remove selected photo
      </button>
     </div>
    )}

    {error&&<p role="alert" style={{color:'var(--coral)',fontSize:'13px'}}>{error}</p>}

    <div className="actions" style={{marginTop:'16px'}}>
     <button className="solid" type="submit">{editingId?'Update memory in vault':'Save memory to vault'}</button>
     {editingId&&<button type="button" onClick={resetForm}>Cancel edit</button>}
    </div>
   </form>

   {s.diary.length>0&&(
    <section>
     <div className="row spread" style={{alignItems:'center',marginBottom:'12px'}}>
      <h2>Your Saved Memories ({s.diary.length})</h2>
      <input
       type="search"
       placeholder="Search memories or tags…"
       value={searchQuery}
       onChange={e=>setSearchQuery(e.target.value)}
       style={{maxWidth:'200px',padding:'6px 12px',fontSize:'13px'}}
      />
     </div>

     {filteredDiary.length===0&&<p className="muted">No memories matching "{searchQuery}".</p>}

     <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      {filteredDiary.map(entry=>(
       <article className="panel" key={entry.id}>
        <div className="row spread" style={{alignItems:'center'}}>
         <small>{new Date(entry.date).toLocaleDateString()} · <strong style={{color:'var(--teal)'}}>{entry.rating} TIER</strong></small>
         <span className="count-pill" style={{fontSize:'11px'}}>VERIFIED VAULT</span>
        </div>
        <h2 style={{margin:'6px 0'}}>{entry.placeName||diaryPlaces.find(p=>p.id===entry.placeId)?.name||'Travel memory'}</h2>
        {entry.photo&&<img className="entry-photo" src={entry.photo} alt="Saved travel memory"/>}
        {entry.photoId&&<DiaryPhoto id={entry.photoId} alt="Saved travel memory"/>}
        <p style={{whiteSpace:'pre-line'}}>{entry.note}</p>
        {entry.tags?.length>0&&(
         <div style={{display:'flex',gap:'6px',flexWrap:'wrap',margin:'8px 0'}}>
          {entry.tags.map(t=><span key={t} className="chip mint" style={{fontSize:'11px'}}>#{t}</span>)}
         </div>
        )}
        <div className="actions">
         <button onClick={()=>edit(entry)}>Edit memory</button>
         <button onClick={()=>{if(window.confirm('Delete this memory from this device?')){s.removeEntry(entry.id);if(entry.photoId)removeLocalPhoto(entry.photoId).catch(()=>{});}}}>Delete memory</button>
        </div>
       </article>
      ))}
     </div>
    </section>
   )}
  </main>
 );
}

export function DNA({navigate}){
 const s=useStore(),[status,setStatus]=useState(''),[shareText,setShareText]=useState(''),[previewUrl,setPreviewUrl]=useState(''),[hideSamples,setHideSamples]=useState(false);
 const [activeTab,setActiveTab]=useState('dna'); // 'dna' | 'badges' | 'hunts' | 'gems'
 const activePlaces=activeTripPlaces(s);
 const visitedPlaces=s.visitedPlaces||[];
 const verifiedHunts=Object.values(s.huntSubmissions||{}).filter(h=>h.status==='verified');
 const userBadges=s.userBadges||[];

 const counts=activePlaces.reduce((acc,place)=>({...acc,[place.category||'Other']:(acc[place.category||'Other']||0)+1}),{});
 const title=profileFor(activePlaces,s.diary).title;
 const denominator=Math.max(1,activePlaces.length);
 const summary=Object.entries(counts).map(([category,count])=>category+': '+Math.round(count/denominator*100)+'%').join(' · ');

 useEffect(()=>()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);},[previewUrl]);

 const prepareCard=async()=>{
  const blob=await createTravelDnaCard({
   title,
   summary,
   categories:Object.entries(counts).map(([name,count])=>({name,share:count/denominator})),
   placeCount:activePlaces.length,
   visitedCount:visitedPlaces.length,
   memoryCount:s.diary.length,
   city:tripCity(s),
   places:activePlaces.map(place=>place.name)
  });
  if(previewUrl)URL.revokeObjectURL(previewUrl);
  setPreviewUrl(URL.createObjectURL(blob));
  return blob;
 };

 const share=async()=>{
  const text=`Pico Travel DNA — ${title}. ${summary||'A profile waiting for its first saved place.'}. ${activePlaces.length} planned in ${tripCity(s)}, ${visitedPlaces.length} visited, ${verifiedHunts.length} photo-verified. Planned places are distinct from visited stops.`;
  setShareText(text);
  setStatus('Preparing your portrait Travel DNA card…');
  try{
   const blob=await prepareCard();
   const file=new File([blob],'pico-travel-dna.png',{type:'image/png'});
   if(navigator.share&&navigator.canShare?.({files:[file]})){
    await navigator.share({title:'My Pico Travel DNA',text,files:[file]});
    setStatus('Travel DNA image shared.');
   }else if(navigator.share){
    await navigator.share({title:'My Pico Travel DNA',text});
    setStatus('Travel DNA text shared. The PNG preview is ready below.');
   }else if(navigator.clipboard?.writeText){
    await navigator.clipboard.writeText(text);
    setStatus('Travel DNA text copied. The PNG preview is ready below.');
   }else setStatus('Share is unavailable here. The PNG preview is ready to download.');
  }catch(error){
   if(error.name==='AbortError')setStatus('Share cancelled. The PNG preview is ready below.');
   else setStatus('Could not share the card here. Download the PNG instead.');
  }
 };

 const download=async()=>{
  try{
   const blob=await prepareCard(),url=URL.createObjectURL(blob),anchor=document.createElement('a');
   anchor.href=url;
   anchor.download='pico-travel-dna.png';
   anchor.click();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   setStatus('1080 × 1350 Travel DNA PNG downloaded.');
  }catch(error){
   setStatus(error.message||'Could not export the card in this browser.');
  }
 };

 return (
  <main className="journey dna-screen">
   <Heading eyebrow="Traveler Identity & Game Hub" title="Travel DNA & Achievements">
    <p>Your unique travel archetype, collectible destination badges, photo-hunt achievements, and community discoveries in one place.</p>
   </Heading>

   {/* Game Hub Navigation Bar */}
   <div className="dna-nav-bar" style={{display:'flex',gap:'8px',overflowX:'auto',paddingBottom:'8px',marginBottom:'16px'}}>
    {[
     ['dna', '🧬 Travel DNA Passport'],
     ['badges', `🏆 Badges (${userBadges.length})`],
     ['hunts', `📸 Photo Hunts (${verifiedHunts.length})`],
     ['gems', '💎 Community Gems']
    ].map(([tabId, label])=>(
     <button
      key={tabId}
      type="button"
      className={`pref-pill ${activeTab===tabId?'active':''}`}
      onClick={()=>setActiveTab(tabId)}
      style={{fontSize:'13px',padding:'6px 14px',borderRadius:'16px',whiteSpace:'nowrap',cursor:'pointer'}}
     >
      {label}
     </button>
    ))}
   </div>

   {activeTab==='badges'&&<CollectiblesGallery/>}
   {activeTab==='hunts'&&<DestinationHunts/>}
   {activeTab==='gems'&&<CommunityGems/>}

   {activeTab==='dna'&&(<>
    {/* Explicit separation metrics: Planned vs Saved vs Visited vs Verified */}
    <section className="panel" style={{marginBottom:'16px'}}>
     <small className="eyebrow">EXPLORATION INTEGRITY AUDIT</small>
     <h2 style={{margin:'2px 0 10px'}}>Travel Footprint Separation</h2>
     <p style={{fontSize:'12px',color:'var(--muted)',marginBottom:'14px'}}>
      Planned itineraries are strictly segregated from verified real-world visits. Saving a place never falsely increments your visited tally.
     </p>
     <div className="trip-stat-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))'}}>
      <article className="panel" style={{margin:0,background:'var(--card)'}}>
       <small className="eyebrow" style={{color:'var(--muted)'}}>DECK SAVED</small>
       <strong style={{fontSize:'22px'}}>{s.likedPlaces.length}</strong>
       <span style={{fontSize:'11px'}}>in your collection</span>
      </article>
      <article className="panel" style={{margin:0,background:'var(--card)'}}>
       <small className="eyebrow" style={{color:'var(--teal)'}}>PLANNED</small>
       <strong style={{fontSize:'22px',color:'var(--teal)'}}>{activePlaces.length}</strong>
       <span style={{fontSize:'11px'}}>scheduled in plan</span>
      </article>
      <article className="panel" style={{margin:0,background:'var(--card)'}}>
       <small className="eyebrow" style={{color:'var(--coral)'}}>VISITED</small>
       <strong style={{fontSize:'22px',color:'var(--coral)'}}>{visitedPlaces.length}</strong>
       <span style={{fontSize:'11px'}}>verified visits</span>
      </article>
      <article className="panel" style={{margin:0,background:'var(--card)'}}>
       <small className="eyebrow" style={{color:'var(--saffron)'}}>PHOTO VERIFIED</small>
       <strong style={{fontSize:'22px',color:'var(--saffron)'}}>{verifiedHunts.length}</strong>
       <span style={{fontSize:'11px'}}>hunts completed</span>
      </article>
     </div>
    </section>

    {!activePlaces.length&&!visitedPlaces.length&&!hideSamples&&(
     <section className="panel empty" style={{textAlign:'center',padding:'20px 14px',marginBottom:'16px'}}>
      <div style={{display:'flex',justifyContent:'center',marginBottom:'8px'}}>
       <PicoMascot mood="curious" size="sm" message="Save places in Discover to reveal your personal archetype!"/>
      </div>
      <h2>Your archetype profile is waiting for places.</h2>
      <p>Save places to reveal your resonance, or preview the sample profile below.</p>
      <div style={{marginTop:'10px'}}>
       <Button variant="secondary" onClick={()=>setHideSamples(prev=>!prev)}>
        {hideSamples?'Hide sample profile':'Preview demo profile (Illustrative) 💡'}
       </Button>
      </div>
     </section>
    )}

    {hideSamples&&!activePlaces.length&&(
     <div style={{marginBottom:'16px'}}>
      <SampleDNA navigate={navigate} onHide={()=>setHideSamples(false)}/>
     </div>
    )}

    {(activePlaces.length>0||visitedPlaces.length>0)&&(
     <>
      <section className="dna-card">
       <div className="dna-ribbon">
        <span><span className="material-symbols-outlined" aria-hidden="true">fingerprint</span> {title}</span>
        <small>AUTHENTIC TRAVEL IDENTITY</small>
       </div>
       <div className="dna-hero">
        <div>
         <h2>{activePlaces.length?title:'Curious Wanderer'}</h2>
         <p>{summary||'Save places or write a memory to refine your travel archetype.'}</p>
        </div>
        <img src={dnaTern} alt="Original Pico Arctic Tern illustration"/>
       </div>
       {Object.entries(counts).length>0&&(
        <>
         <div className="dna-affinities">
          {Object.entries(counts).map(([category,count])=><span key={category}>{category} {Math.round(count/denominator*100)}%</span>)}
         </div>
         <div className="dna-spectrum">
          <small className="eyebrow">DNA resonance · saved-place mix</small>
          {Object.entries(counts).map(([category,count])=>(
           <div key={category}>
            <label>{category} · {Math.round(count/denominator*100)}%</label>
            <progress aria-label={category+' affinity'} max={activePlaces.length} value={count}/>
           </div>
          ))}
         </div>
        </>
       )}
       <p>{activePlaces.length} planned · {visitedPlaces.length} visited · {s.diary.length} memories · {(s.userPrefs.travelers||1)} traveller(s)</p>
      </section>

      <div className="actions" style={{margin:'16px 0'}}>
       <Button onClick={share}>Share Travel DNA</Button>
       <Button variant="secondary" onClick={download}>Download 1080 × 1350 PNG</Button>
      </div>
      {status&&<p role="status" style={{fontSize:'13px',color:'var(--teal)'}}>{status}</p>}

      {previewUrl&&(
       <figure className="dna-share-preview">
        <img src={previewUrl} alt="1080 by 1350 Pico Travel DNA share card"/>
        <figcaption>Portrait share card · planned destinations distinguished from visited stops.</figcaption>
       </figure>
      )}

      {shareText&&<label>Travel DNA share text<textarea readOnly value={shareText} onFocus={e=>e.target.select()}/></label>}

      {visitedPlaces.length>0&&(
       <section className="panel" style={{marginTop:'20px'}}>
        <div className="row spread" style={{alignItems:'center'}}>
         <div>
          <small className="eyebrow">VERIFIED FOOTPRINT</small>
          <h2>Places You Have Actually Visited ({visitedPlaces.length})</h2>
         </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'8px',marginTop:'12px'}}>
         {visitedPlaces.map(v=>(
          <article key={v.id} className="row spread" style={{alignItems:'center',padding:'8px 12px',borderRadius:'10px',background:'var(--card)',border:'1px solid var(--line)'}}>
           <div>
            <strong>✓ {v.name}</strong>
            <div style={{fontSize:'11px',color:'var(--muted)'}}>{v.city} · {v.category} · Visited {new Date(v.visitedAt).toLocaleDateString()}</div>
           </div>
           <button type="button" className="quiet-button" onClick={()=>s.unmarkPlaceVisited(v.id)} style={{fontSize:'11px',color:'var(--coral)'}}>
            Remove
           </button>
          </article>
         ))}
        </div>
       </section>
      )}

      <h2 style={{marginTop:'24px'}}>Destination Stamps</h2>
      <p style={{fontSize:'12px',color:'var(--muted)'}}>Collectible stamps rendered with holographic foil. Planned stops marked Planned; verified visits marked Visited.</p>
      <div className="stamp-grid">
       {visitedPlaces.map(place=>(
        <HoloCard key={`visited-${place.id}`} rarity="legendary" className="stamp-holo-card">
         <article className="panel" style={{height:'100%',margin:0,background:'color-mix(in srgb, var(--teal) 8%, var(--card))'}}>
          <PlaceImage place={place}/>
          <h3>{place.name}</h3>
          <small style={{color:'var(--teal)',fontWeight:700}}>✓ VISITED · {place.category}</small>
         </article>
        </HoloCard>
       ))}
       {activePlaces.map(place=>(
        <HoloCard key={`planned-${place.id}`} rarity="rare" className="stamp-holo-card">
         <article className="panel" style={{height:'100%',margin:0}}>
          <PlaceImage place={place}/>
          <h3>{place.name}</h3>
          <small>PLANNED · {place.category}</small>
         </article>
        </HoloCard>
       ))}
      </div>
     </>
    )}
   </>)}
  </main>
 );
}
export function MapScreen({navigate}){
 const s=useStore();
 const [area,setArea]=useState(s.userPrefs.city||'Kochi'),[catalog,setCatalog]=useState([]),[loadState,setLoadState]=useState('loading'),[retry,setRetry]=useState(0);
 const [selectedId,setSelectedId]=useState(''),[currentLocation,setCurrentLocation]=useState(null),[locationState,setLocationState]=useState(''),[route,setRoute]=useState(null),[routeState,setRouteState]=useState(''),[actionMessage,setActionMessage]=useState('');
 const activePlaces=activeTripPlaces(s);
 const savedWithCoords=activePlaces.filter(p=>validCoords(p?.coords));
 const mapped=[...new Map([...catalog,...activePlaces].filter(p=>validCoords(p?.coords)).map(p=>[p.id,p])).values()];
 const selected=mapped.find(p=>p.id===selectedId)||mapped.find(p=>savedWithCoords.some(x=>x.id===p.id))||mapped[0];
 const select=useCallback(id=>setSelectedId(id),[]);
 useEffect(()=>{let active=true;setLoadState('loading');setCatalog([]);loadCatalog(area).then(result=>{if(!active)return;const rows=result.places;setCatalog(rows);setLoadState(rows.length?'ready':'empty');setSelectedId(current=>rows.some(p=>p.id===current)?current:'');}).catch(error=>{if(active)setLoadState(error.message||'Destination catalogue unavailable.');});return()=>{active=false;};},[area,retry]);
 useEffect(()=>{
  let active=true;const points=[...(currentLocation?[currentLocation]:[]),...savedWithCoords.map(p=>p.coords)];
  if(points.length<2){setRoute(null);setRouteState(savedWithCoords.length?'Select your current location or add another mapped itinerary stop.':'Keep mapped places to preview an ordered route.');return()=>{active=false;};}
  setRouteState('Requesting an OSRM road route…');getRoute(points).then(result=>{if(!active)return;setRoute(result);setRouteState(result.source==='LIVE'?'Road route from OSRM · LIVE':result.source==='CACHED'?'Road route from OSRM · CACHED':result.reason||'Road route unavailable.');});
  return()=>{active=false;};
 },[currentLocation?.join(','),savedWithCoords.map(p=>p.id+':'+p.coords.join(',')).join('|')]);
 const locate=()=>{
  if(!navigator.geolocation){setLocationState('This browser does not support location access.');return;}
  setLocationState('Requesting your permission…');navigator.geolocation.getCurrentPosition(pos=>{const coords=[pos.coords.latitude,pos.coords.longitude];if(!validCoords(coords)){setLocationState('The browser returned invalid coordinates.');return;}setCurrentLocation(coords);setLocationState('Your location is shown for this session only.');},error=>setLocationState(error.code===1?'Location permission was denied. You can still explore mapped places.':'Location is unavailable right now. You can still explore mapped places.'),{enableHighAccuracy:false,timeout:10000,maximumAge:300000});
 };
 const keep=()=>{if(!selected)return;const ok=s.likePlace(selected);setActionMessage(ok?`${selected.name} added to your itinerary.`:'This place cannot be added with the current cost data or budget.');};
 const pass=()=>{if(!selected)return;s.passPlace(selected);setActionMessage(`${selected.name} passed.`);};
 const selectedCost=selected?.avg_cost_inr??selected?.cost;
 return <main className="journey map-page">
  <div className="page-heading"><Heading eyebrow="Route Explorer · OpenStreetMap" title="Places, plotted honestly"><p>Only places with validated coordinates appear as pins. Road routes and distances are shown only when OSRM returns them.</p></Heading></div>
  <section className="panel map-controls">
   <label>Trip destination collection<select value={area} onChange={e=>{setArea(e.target.value);s.setPrefs({city:e.target.value});}}>{supportedCities.map(city=><option key={city}>{city}</option>)}</select></label>
   <p className="fine-print">Changing this also updates Discover. Only places with validated coordinates become map pins.</p>
   <div className="actions"><Button onClick={locate}>Use my location</Button><Button variant="secondary" onClick={()=>navigate('plan')}>Back to itinerary</Button></div>
   {locationState&&<p role="status">{locationState}</p>}
   <div className="map-legend"><span><i className="place"/> Available place</span><span><i className="itinerary"/> Itinerary stop</span><span><i className="current"/> Your location</span></div>
  </section>
  {loadState==='loading'&&<section className="panel" role="status">Loading the {area} place collection…</section>}
  {(loadState==='empty'||loadState==='ready'&&!catalog.some(p=>validCoords(p?.coords)))&&!savedWithCoords.length&&<section className="panel empty"><h2>No validated map pins for {area}</h2><p>This guide does not yet include validated coordinates. Your saved places remain in your plan. Goa has a coordinate-validated map collection.</p><Button onClick={()=>{setArea('Goa');s.setPrefs({city:'Goa'});}}>Open mapped Goa places</Button><Button variant="ghost" onClick={()=>navigate('discover')}>Discover places</Button></section>}
  {loadState==='ready'&&!catalog.some(p=>validCoords(p?.coords))&&savedWithCoords.length>0&&<section className="panel" role="status">No validated coordinates for {area}; showing the saved itinerary stops that do have coordinates.</section>}
  {loadState!=='loading'&&mapped.length>0&&<>
   <section className="map-summary panel"><div><small className="eyebrow">Route status</small><p role="status">{routeState||'Route not requested.'}</p><small>{currentLocation?`Your current location → ${savedWithCoords.length} itinerary stop(s)`:`${savedWithCoords.length} mapped itinerary stop(s) in saved order`} · OSRM driving profile; traffic not included.</small></div>{route?.distanceKm!=null&&<div className="map-stats"><strong>{route.distanceKm.toFixed(1)} km</strong><span>routed distance</span><strong>{route.minutes} min</strong><span>OSRM estimate · driving profile</span></div>}</section>
   <Suspense fallback={<section className="pico-map-shell" role="status">Preparing the interactive map…</section>}><InteractiveMap places={catalog} likedPlaces={activePlaces} selectedId={selected?.id} currentLocation={currentLocation} route={route} onSelect={select}/></Suspense>
   {selected&&<section className="panel map-place-card" aria-live="polite"><small className="eyebrow">{selected.city||area} · {selected.category||'Place'} · {selected.source||'CACHED'}</small><h2>{selected.name}</h2><PlaceImage className="map-place-image" place={selected}/><p>{selected.address||selected.subtitle||'Area not supplied'}</p><p className="map-coordinates">{selected.coords[0].toFixed(5)}, {selected.coords[1].toFixed(5)}</p><p><strong>Estimated activity cost:</strong> {Number.isFinite(selectedCost)&&selectedCost>0?`${money(selectedCost)} · cached estimate; confirm locally`:Number.isFinite(selectedCost)&&selectedCost===0?'No verified price supplied':'Price unavailable'}</p><p><strong>Reality Check</strong><br/>{selected.reality_check||selected.caveat||'No verified caveat available. Check access and local conditions.'}</p><div className="actions">{activePlaces.some(p=>p.id===selected.id)?<Button variant="secondary" onClick={()=>s.removePlace(selected.id)}>Remove from itinerary</Button>:<><Button onClick={keep}>Keep place</Button><Button variant="secondary" onClick={pass}>Pass</Button></>}<Button variant="ghost" onClick={()=>navigate('discover')}>Open Discover</Button></div><p role="status">{actionMessage}</p></section>}
   <section className="panel map-attribution"><small>Map tiles © OpenStreetMap contributors · Place records: {catalog[0]?.source||'saved itinerary'}. Routes: OSRM when available. No traffic or live fare claims.</small><a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">Report a map issue</a></section>
  </>}
  {loadState!=='loading'&&loadState!=='empty'&&loadState!=='ready'&&<section className="panel" role="alert">{String(loadState)} <Button onClick={()=>setRetry(n=>n+1)}>Retry</Button></section>}
 </main>;
}
export function Trips({navigate}){
 const s=useStore(),activePlaces=activeTripPlaces(s),travelers=Math.max(1,Number(s.userPrefs.travelers)||1),groupBudget=s.budgetEnvelope*travelers,groupSpend=committed(s)*travelers;
 const date=s.userPrefs.startDate?new Date(`${s.userPrefs.startDate}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Dates not set';
 return <main className="journey trips-screen"><Heading eyebrow="Travel Vault · Local journeys" title="Your Journeys"><p>Trips on this device are drafts for your own planning. They are not shared with another traveller.</p></Heading>
  {!activePlaces.length?<Empty navigate={navigate}/>:<>
   <section className="trips-hero panel"><PlaceImage className="trips-hero-image" place={activePlaces[0]}/><div><small className="eyebrow">CURRENT LOCAL DRAFT · {s.userPrefs.city}</small><h2>{tripCity(s)} getaway</h2><p>{date} · {s.userPrefs.days} days · {travelers} {travelers===1?'traveller':'travellers'} · {s.userPrefs.pace} pace</p><Button onClick={()=>navigate('plan')}>Continue planning</Button></div></section>
   <section className="trip-stat-grid" aria-label="Current trip summary"><article className="panel"><small className="eyebrow">PLACES</small><strong>{activePlaces.length}</strong><span>saved to itinerary</span></article><article className="panel"><small className="eyebrow">PER PERSON</small><strong>{money(committed(s))}</strong><span>planned estimate</span></article><article className="panel"><small className="eyebrow">GROUP ESTIMATE</small><strong>{money(groupSpend)}</strong><span>for {travelers} travellers</span></article><article className="panel"><small className="eyebrow">GROUP BUDGET LEFT</small><strong>{money(Math.max(0,groupBudget-groupSpend))}</strong><span>estimated, not paid</span></article></section>
   <section className="panel trips-stop-list"><div className="row spread"><div><small className="eyebrow">YOUR SAVED STOPS</small><h2>Places taking shape</h2></div><Button variant="secondary" onClick={()=>navigate('discover')}>Find another place</Button></div>{activePlaces.map((place,index)=><article key={place.id} className="trip-stop"><PlaceImage place={place}/><div><small>STOP {index+1} · {place.category||'DESTINATION'}</small><h3>{place.name}</h3><p>{place.time?`${place.time} minute visit estimate`:'Visit duration unavailable'} · {Number.isFinite(place.cost)?`${money(place.cost)} estimated per person`:'Activity price unavailable'}</p></div><Button variant="ghost" onClick={()=>navigate('map')}>Map</Button></article>)}</section>
  </>}
  <section className="panel shared-trip-block"><div><small className="eyebrow">{s.user?.provider==='supabase'||s.user?.provider==='firebase'?'TRAVEL TOGETHER · CLOUD CONVOY':'TRAVEL TOGETHER'}</small><h2>{s.user?.provider==='supabase'||s.user?.provider==='firebase'?'Group Travel & Live Convoy':'Ride Together with Friends'}</h2><p>{s.user?.provider==='supabase'||s.user?.provider==='firebase'?`Signed in as ${s.user?.name}. Start a live convoy room, share live GPS presence, and track pooled expenses together.`:'Create or join a live convoy room to travel alongside friends with shared routes, live GPS presence, and pooled budget tracking.'}</p></div><div className="actions"><Button variant="primary" onClick={()=>navigate('ride')}>Open Ride Together 🚴</Button>{s.user?.provider==='guest'&&<Button variant="secondary" onClick={()=>navigate('login')}>Cloud Sign In</Button>}</div><small className="muted">{s.user?.provider==='supabase'||s.user?.provider==='firebase'?'Realtime GPS sharing updates your convoy companions while the app is active.':'Your local draft and group budget calculations remain fully usable offline on this device.'}</small></section>
  <div className="actions trips-shortcuts"><Button variant="primary" onClick={()=>navigate('ride')}>Ride Together</Button><Button variant="secondary" onClick={()=>navigate('map')}>Open route map</Button><Button variant="secondary" onClick={()=>navigate('diary')}>Trip diary</Button><Button variant="secondary" onClick={()=>navigate('dna')}>Travel DNA</Button><Button variant="ghost" onClick={()=>navigate('reviews')}>Write a review</Button></div>
 </main>;
}
