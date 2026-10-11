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
export function Home({navigate}){return <main className="journey home-page"><DestinationCollections navigate={navigate}/><div className="home-next"><div><small className="eyebrow">A plan that feels like you</small><h2>Discover. Keep. Make a day of it.</h2><p>Your saved places become a day-by-day itinerary, with honest estimates and room to change your mind.</p></div><Button onClick={()=>navigate('plan')}>Open my itinerary</Button></div><details className="trip-settings"><summary>Personalise your trip · budget, dates & pace</summary><TripParameters/></details><div className="actions"><Button variant="secondary" onClick={()=>navigate('trips')}>Your journeys</Button><Button variant="ghost" onClick={()=>navigate('dna')}>Your Travel DNA</Button></div></main>;}
export function Plan({navigate}){
 const s=useStore(),[error,setError]=useState(''),[planning,setPlanning]=useState(false),[planNotice,setPlanNotice]=useState('');
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
    <Button variant="secondary" onClick={()=>navigate('map')}>View route</Button>
    <Button variant="secondary" onClick={()=>{s.triggerDisruption();navigate('reroute');}}>Try reroute simulation</Button>
    <Button variant="ghost" onClick={()=>navigate('discover')}>Add a place</Button>
   </div>
   {planNotice&&<p role="status" className="transport-reason" style={{marginTop:'12px'}}>{planNotice}</p>}
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
  </>}
 </main>;
}
export function Reroute({navigate}){const s=useStore(),[error,setError]=useState(''),activePlaces=activeTripPlaces(s);const m=modes[s.mode];return <main className="journey"><Heading eyebrow="Adaptive Plan Diff · Simulated" title="When plans change, Pico adapts."/>{!activePlaces.length?<Empty navigate={navigate}/>:!s.disruption?<section className="panel"><h2>No disruption pending</h2><p>Your {m.vehicle} route is selected. {s.routeDelay>0&&`An accepted adjustment adds ${s.routeDelay} minutes and ${money(s.routeExtra)}.`}</p><Button onClick={s.triggerDisruption}>Simulate transport delay</Button>{s.routeDelay>0&&<Button variant="secondary" onClick={s.restoreRoute}>Restore original transport</Button>}<Button variant="ghost" onClick={()=>navigate('plan')}>Back to itinerary</Button></section>:<><section className="alert-panel"><h2>Simulated disruption</h2><p>Demo: {s.mode==='fastest'?'a runway closure':s.mode==='cheapest'?'track maintenance':'a bridge closure'} delays the selected connection by 95 minutes.</p></section><div className="diff"><section className="panel"><small>ORIGINAL PLAN</small><h2>{money(committed(s))}</h2><p>{m.vehicle}</p><p>{m.minutes+s.routeDelay} min transport</p></section><section className="panel"><small>PROPOSED PLAN</small><h2>{money(committed(s)+770)}</h2><p>{m.vehicle} + replacement transfer</p><p>{m.minutes+s.routeDelay+95} min transport</p></section></div><section className="panel"><h2>Pico's advice</h2><p>Shift the first activity later and use a replacement transfer. Your places remain in order.</p><p>+{money(770)} · +1h 35m · estimated, not booked</p><p role="alert">{error}</p><div className="actions"><Button onClick={()=>{if(s.acceptReroute())navigate('plan');else setError('Adjustment exceeds your budget. Increase the budget or reject it.');}}>Accept reroute</Button><Button variant="secondary" onClick={s.rejectReroute}>Keep original plan</Button></div></section></>}</main>;}
export function Diary(){
 const s=useStore(),fileInput=useRef(null);
 const diaryPlaces=[...new Map([...places,...s.likedPlaces].map(p=>[p.id,p])).values()];
 const today=new Date().toISOString().slice(0,10);
 const [note,setNote]=useState(''),[place,setPlace]=useState(s.likedPlaces[0]?.id||places[0].id),[photo,setPhoto]=useState(''),[photoId,setPhotoId]=useState(''),[photoBlob,setPhotoBlob]=useState(null),[photoPreview,setPhotoPreview]=useState(''),[rating,setRating]=useState('A'),[entryDate,setEntryDate]=useState(today),[editingId,setEditingId]=useState(''),[error,setError]=useState(''),[hideSamples,setHideSamples]=useState(false);
 useEffect(()=>{if(!photoBlob){setPhotoPreview('');return;}const url=URL.createObjectURL(photoBlob);setPhotoPreview(url);return()=>URL.revokeObjectURL(url);},[photoBlob]);
 const resetForm=()=>{setNote('');setPhoto('');setPhotoId('');setPhotoBlob(null);setRating('A');setEntryDate(today);setEditingId('');setError('');if(fileInput.current)fileInput.current.value='';};
 const edit=entry=>{setEditingId(entry.id);setNote(entry.note||'');setPlace(entry.placeId||diaryPlaces[0]?.id||'');setPhoto(entry.photo||'');setPhotoId(entry.photoId||'');setPhotoBlob(null);setRating(entry.rating||'A');setEntryDate(new Date(entry.date||Date.now()).toISOString().slice(0,10));setError('');window.scrollTo({top:0,behavior:'smooth'});};
 const choose=e=>{const f=e.target.files?.[0];if(!f)return;if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>3*1024*1024){setError('Choose a PNG, JPEG or WebP under 3 MB.');e.target.value='';return;}const url=URL.createObjectURL(f),image=new Image();image.onload=()=>{URL.revokeObjectURL(url);setPhotoBlob(f);setPhoto('');setError('');};image.onerror=()=>{URL.revokeObjectURL(url);setError('This file is not a readable image. Choose another photo.');e.target.value='';};image.src=url;};
 const save=async e=>{e.preventDefault();if(!note.trim()&&!photo&&!photoId&&!photoBlob){setError('Add a note or a photo first.');return;}const id=editingId||globalThis.crypto?.randomUUID?.()||`memory-${Date.now()}`;try{if(photoBlob)await saveLocalPhoto(id,photoBlob);const entry={id,note:note.trim(),placeId:place,placeName:diaryPlaces.find(p=>p.id===place)?.name,photo:photoBlob?'':photo,photoId:photoBlob||photoId?id:'',rating,date:entryDate};const previous=s.diary.find(item=>item.id===editingId);if(editingId)s.editEntry(editingId,entry);else s.addEntry(entry);if(previous?.photoId&&!entry.photoId)removeLocalPhoto(previous.photoId).catch(()=>{});resetForm();}catch(err){setError(`Memory was not saved: ${err.message||'local photo storage is unavailable.'}`);}};
 return <main className="journey"><Heading eyebrow="Memory Vault" title="Trip Diary"><p>Your stories live here. Saved on this device; no server upload. Photos use browser storage and may be limited by device space.</p></Heading>
  {!s.diary.length&&!hideSamples&&<SampleMemories onHide={()=>setHideSamples(true)}/>}
  <form className="panel" onSubmit={save}>
   <label>Place<select value={place} onChange={e=>setPlace(e.target.value)}>{diaryPlaces.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
   <label>Memory date<input type="date" value={entryDate} onChange={e=>setEntryDate(e.target.value)}/></label>
   <label>Personal notes<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={2000} placeholder="What made this place memorable?"/></label>
   <label>Vibe tier<select value={rating} onChange={e=>setRating(e.target.value)}>{['S','A','B','C','D'].map(r=><option key={r}>{r}</option>)}</select></label>
   <label>Add photo<input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={choose}/></label>
   {(photo||photoPreview||photoId)&&<>{photoPreview?<img className="entry-photo" src={photoPreview} alt="Selected memory photo preview"/>:photo?<img className="entry-photo" src={photo} alt="Legacy saved memory photo preview"/>:<DiaryPhoto id={photoId} alt="Saved memory photo preview"/>}<button type="button" onClick={()=>{setPhoto('');setPhotoId('');setPhotoBlob(null);if(fileInput.current)fileInput.current.value='';}}>Remove selected photo</button></>}
   <p role="alert">{error}</p><div className="actions"><button className="solid" type="submit">{editingId?'Update memory':'Save memory'}</button>{editingId&&<button type="button" onClick={resetForm}>Cancel edit</button>}</div>
  </form>
  {!s.diary.length&&hideSamples&&<section className="panel empty"><h2>Your stories will live here.</h2><p>Log your first memory above. It stays on this device.</p></section>}
  {s.diary.map(entry=><article className="panel" key={entry.id}><small>{new Date(entry.date).toLocaleDateString()} · {entry.rating} TIER</small><h2>{entry.placeName||diaryPlaces.find(p=>p.id===entry.placeId)?.name||'Travel memory'}</h2>{entry.photo&&<img className="entry-photo" src={entry.photo} alt="Saved travel memory"/>}{entry.photoId&&<DiaryPhoto id={entry.photoId} alt="Saved travel memory"/>}<p>{entry.note}</p><div className="actions"><button onClick={()=>edit(entry)}>Edit memory</button><button onClick={()=>{if(window.confirm('Delete this memory from this device?')){s.removeEntry(entry.id);if(entry.photoId)removeLocalPhoto(entry.photoId).catch(()=>{});}}}>Delete memory</button></div></article>)}
 </main>;
}
export function DNA({navigate}){
 const s=useStore(),[status,setStatus]=useState(''),[shareText,setShareText]=useState(''),[previewUrl,setPreviewUrl]=useState(''),[hideSamples,setHideSamples]=useState(false);
 const activePlaces=activeTripPlaces(s);
 const counts=activePlaces.reduce((acc,place)=>({...acc,[place.category||'Other']:(acc[place.category||'Other']||0)+1}),{});
 const title=profileFor(activePlaces,s.diary).title;
 const denominator=Math.max(1,activePlaces.length);
 const summary=Object.entries(counts).map(([category,count])=>category+': '+Math.round(count/denominator*100)+'%').join(' · ');
 useEffect(()=>()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);},[previewUrl]);
 const prepareCard=async()=>{const blob=await createTravelDnaCard({title,summary,categories:Object.entries(counts).map(([name,count])=>({name,share:count/denominator})),placeCount:activePlaces.length,memoryCount:s.diary.length,city:tripCity(s),places:activePlaces.map(place=>place.name)});if(previewUrl)URL.revokeObjectURL(previewUrl);setPreviewUrl(URL.createObjectURL(blob));return blob;};
 const share=async()=>{const text='Pico Travel DNA — '+title+'. '+(summary||'A profile waiting for its first saved place.')+'. '+activePlaces.length+' places saved in '+tripCity(s)+'. Planned places are not verified visits.';setShareText(text);setStatus('Preparing your portrait Travel DNA card…');try{const blob=await prepareCard();const file=new File([blob],'pico-travel-dna.png',{type:'image/png'});if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({title:'My Pico Travel DNA',text,files:[file]});setStatus('Travel DNA image shared.');}else if(navigator.share){await navigator.share({title:'My Pico Travel DNA',text});setStatus('Travel DNA text shared. The PNG preview is ready below.');}else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);setStatus('Travel DNA text copied. The PNG preview is ready below.');}else setStatus('Share is unavailable here. The PNG preview is ready to download.');}catch(error){if(error.name==='AbortError')setStatus('Share cancelled. The PNG preview is ready below.');else setStatus('Could not share the card here. Download the PNG instead.');}};
 const download=async()=>{try{const blob=await prepareCard(),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='pico-travel-dna.png';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('1080 × 1350 Travel DNA PNG downloaded.');}catch(error){setStatus(error.message||'Could not export the card in this browser.');}};
 return <main className="journey"><Heading eyebrow="Archetype Profile" title="Your Travel DNA"><p>Built from saved places and diary ratings. Planned destinations are shown as planned, not visited.</p></Heading>
  {!activePlaces.length&&!hideSamples&&<SampleDNA navigate={navigate} onHide={()=>setHideSamples(true)}/>}
  {(activePlaces.length > 0 || hideSamples) && <><section className="dna-card"><div className="dna-ribbon"><span><span className="material-symbols-outlined" aria-hidden="true">fingerprint</span> {title}</span><small>PERSONAL EDITION</small></div>
   <div className="dna-hero"><div><h2>{activePlaces.length?title:'Your next chapter awaits'}</h2><p>{summary||'Keep a place or write a memory to reveal your travel style.'}</p></div><img src={dnaTern} alt="Original Pico Arctic Tern illustration"/></div>
   {Object.entries(counts).length>0&&<><div className="dna-affinities">{Object.entries(counts).map(([category,count])=><span key={category}>{category} {Math.round(count/denominator*100)}%</span>)}</div><div className="dna-spectrum"><small className="eyebrow">DNA resonance · saved-place mix</small>{Object.entries(counts).map(([category,count])=><div key={category}><label>{category} · {Math.round(count/denominator*100)}%</label><progress aria-label={category+' affinity'} max={activePlaces.length} value={count}/></div>)}</div></>}
   <p>{activePlaces.length} places saved · {s.diary.length} memories · {(s.userPrefs.travelers||1)} traveller(s)</p>{!activePlaces.length&&<Button onClick={()=>navigate('discover')}>Discover your taste</Button>}
  </section>
  <div className="actions"><Button onClick={share}>Share Travel DNA</Button><Button variant="secondary" onClick={download}>Download 1080 × 1350 PNG</Button></div><p role="status">{status}</p>
  {previewUrl&&<figure className="dna-share-preview"><img src={previewUrl} alt="1080 by 1350 Pico Travel DNA share card"/><figcaption>Portrait share card · destinations marked planned, not visited.</figcaption></figure>}
  {shareText&&<label>Travel DNA share text<textarea readOnly value={shareText} onFocus={e=>e.target.select()}/></label>}
  <h2>Destination stamps</h2><p>Planned places, not verified visits.</p><div className="stamp-grid">{activePlaces.map(place=><article className="panel" key={place.id}><PlaceImage place={place}/><h3>{place.name}</h3><small>PLANNED · {place.category}</small></article>)}</div>
  </>}</main>;
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
