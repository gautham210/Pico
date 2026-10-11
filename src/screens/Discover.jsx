import {supportedCities} from '../../data/city-collections.js';
import {useEffect,useState,useCallback,useRef} from 'react';
import {motion,useReducedMotion} from 'framer-motion';
import {useStore,committed,activeTripPlaces} from '../lib/store';
import {loadCatalog} from '../lib/catalog';
import {money} from '../lib/provider';
import {Budget,Companion,Heading,Icon,PlaceImage,PhotoCredit} from '../components/JourneyUI';
import Button from '../components/Button';
import Sheet from '../components/Sheet';
import {interests,matchesInterests} from '../lib/discovery.js';
import {PaperCrumple,FoldText,PulseHeart,PeekRating} from '../components/reactbits';
import {PicoMascot} from '../components/pico';
export default function Discover({navigate}){
 const s=useStore(),reduced=useReducedMotion();
 const [catalog,setCatalog]=useState([]),[source,setSource]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const [details,setDetails]=useState(false),[filters,setFilters]=useState(false),[message,setMessage]=useState(''),[intent,setIntent]=useState(0);
 const [isCrumpling,setIsCrumpling]=useState(false);
 const isProcessingRef=useRef(false);
 const city=s.userPrefs.city||'Kochi';
 useEffect(()=>{let active=true;setLoading(true);setError('');loadCatalog(city).then(result=>{if(active){setCatalog(result.places);setSource(result.source);}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[city,retry]);
 const unseen=catalog.filter(p=>!s.likedPlaces.some(x=>x.id===p.id)&&!s.passedPlaces.some(x=>x.id===p.id));
 const vibes=s.userPrefs.vibes||[];
 const matches=unseen.filter(place=>matchesInterests(place,vibes));
 const noInterestMatches=vibes.length>0&&unseen.length>0&&matches.length===0;
 const ordered=noInterestMatches?unseen:matches;
 useEffect(()=>{if(noInterestMatches)setMessage('No exact category matches in this collection; showing all remaining places.');},[noInterestMatches,vibes.join(',')]);
 const place=ordered[0],next=ordered[1];
 const decide=like=>{
  if(!place||isProcessingRef.current)return;
  if(like){
   isProcessingRef.current=true;
   if(!s.likePlace(place)){
    setMessage('Activities plus known transport estimates exceed your budget. Increase it or pass.');
    isProcessingRef.current=false;
    return;
   }
   setMessage(`${place.name} saved. Unknown activity costs remain excluded from your budget total.`);
   setTimeout(()=>{isProcessingRef.current=false;},300);
  }else{
   if(reduced){
    s.passPlace(place);
    setMessage(`Passed ${place.name}.`);
   }else{
    isProcessingRef.current=true;
    setIsCrumpling(true);
   }
  }
 };
 const handleCrumpleFinish=()=>{
  if(place){
   s.passPlace(place);
   setMessage(`Passed ${place.name}.`);
  }
  setIsCrumpling(false);
  isProcessingRef.current=false;
 };
 const closeDetails=useCallback(()=>setDetails(false),[]),closeFilters=useCallback(()=>setFilters(false),[]);
  const activePlaces=activeTripPlaces(s);
  return <main className="page discover-page"><Heading eyebrow={`${city} · Discover your next detour`} title="Follow your curiosity." action={<button className="quiet-button" onClick={()=>setFilters(true)}><Icon>tune</Icon>Trip preferences</button>}>Swipe places that match your vibe. A little instinct goes a long way.</Heading><div className="discover-layout"><section className="deck-column"><div className="mobile-budget"><Budget/></div><div className="row spread"><small className="eyebrow">{loading?'Opening collection':source}</small><span className="count-pill">{catalog.length-unseen.length} / {catalog.length}</span></div>{loading?<section className="panel loading" role="status">Pico is opening your collection…</section>:error?<section className="panel" role="alert"><h2>We couldn't open this collection.</h2><p>{error}</p><Button onClick={()=>setRetry(retry+1)}>Try again</Button><Button variant="ghost" onClick={()=>s.setPrefs({city:'Kochi'})}>Use Kochi demo</Button></section>:place?<><div className="deck-stack">{next&&<div className="deck-under" aria-hidden="true"/>}<PaperCrumple isCrumpling={isCrumpling} onCrumpleComplete={handleCrumpleFinish}><motion.article key={place.id} id="deck-card-top" className="swipe-card" drag={isCrumpling?false:"x"} dragConstraints={{left:0,right:0}} dragElastic={.65} onDrag={(_,info)=>setIntent(info.offset.x>25?1:info.offset.x< -25?-1:0)} onDragEnd={(_,info)=>{setIntent(0);if(info.offset.x>80)decide(true);else if(info.offset.x< -80)decide(false);}} whileDrag={reduced?undefined:{rotate:2}} initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{touchAction:'pan-y'}}><div className={"card-visual "+(place.image?"has-photo":"no-photo")}><PlaceImage place={place}/><span className="location-pill"><Icon>location_on</Icon>{city}{city==='Kochi'?', Kerala':''}</span>{intent!==0&&<strong className={'decision-stamp '+(intent>0?'keep':'pass')}>{intent>0?'KEEP':'PASS'}</strong>}<div style={{position:'absolute',top:'10px',right:'10px',zIndex:10,background:'rgba(255,255,255,0.85)',borderRadius:'9999px',backdropFilter:'blur(8px)',padding:'2px'}}><PulseHeart isLiked={Boolean(s.publicLikes?.[place.id]?.userLiked)} likesCount={s.publicLikes?.[place.id]?.count??14} onToggle={()=>s.togglePublicLike(place.id)}/></div></div><div className="card-copy"><div className="card-header-flow"><small className="card-eyebrow">{place.city||city} · {place.category}</small><h2 className="card-title"><FoldText key={place.id} text={place.name}/></h2></div><div className="chips"><span className="chip mint">{place.category}</span><span className="chip">{place.time} min suggested</span><span className="chip">{place.distance}</span></div><p className="card-desc">{place.description}</p><div className="visit-price">{Number.isFinite(place.cost)?`${money(place.cost)} / person · planning estimate`:"Visit price not verified · confirm locally"}</div><PhotoCredit place={place}/><div className="reality"><Icon>lightbulb</Icon><div><strong>Pico Reality Check</strong><p>{place.caveat}</p></div></div><div className="row spread metadata"><span>Timing suggested · costs may vary</span><span>Weather not live</span></div></div></motion.article></PaperCrumple></div><div className="swipe-actions"><button id="btn-pass" aria-label="Pass on location" onClick={()=>decide(false)} disabled={isCrumpling}><Icon>close</Icon><small>Pass</small></button><button id="btn-info" aria-label="Details" onClick={()=>setDetails(true)}><Icon>info</Icon><small>Details</small></button><button id="btn-like" className="keep" aria-label="Keep place" onClick={()=>decide(true)} disabled={isCrumpling}><Icon>favorite</Icon><small>Keep</small></button></div><div className="pico-companion-card" style={{marginTop:'14px'}}><PicoMascot mood={isCrumpling?'curious':intent>0?'excited':intent<0?'curious':s.budgetRemaining<s.budgetEnvelope*0.15?'worried':'curious'} size="md" message={isCrumpling?`Passing ${place.name}! Moving on…`:intent>0?`Release to keep ${place.name}!`:intent<0?`Release to pass ${place.name}.`:s.budgetRemaining<s.budgetEnvelope*0.15?'Budget envelope is getting tight!':message||`Swipe right to save ${place.name}, or left to pass.`} animateSpeech={true}/></div></>:<section className="panel empty"><Icon>check_circle</Icon><h2>A few good places. Endless possibilities.</h2><p>Your deck is complete. {activePlaces.length} places are ready for your itinerary.</p><Button onClick={()=>navigate('plan')}>Review itinerary</Button><Button variant="ghost" onClick={s.revisit}>Revisit passed places</Button></section>}<p className="feedback" role="status">{message}</p></section><aside className="discover-aside"><div className="desktop-budget"><Budget/></div><section className="panel shortlist"><div className="row spread"><h2>Your little collection</h2><span className="count-pill">{activePlaces.length}</span></div>{activePlaces.length?<ul>{activePlaces.map(p=><li key={p.id}><PlaceImage place={p}/><div><strong>{p.name}</strong><small>{p.category} · {money(p.cost)}</small></div></li>)}</ul>:<p>Keep what calls to you. Your saved places appear here as you explore.</p>}<button className="ink-button" onClick={()=>navigate('plan')}>Plan my itinerary <Icon>arrow_forward</Icon></button></section><Companion title="The honest bit matters.">Every place comes with one practical caveat. Your time away deserves fewer surprises.</Companion><p className="fine-print">One illustrative inbound transport leg is included once you save a place. Stays, return travel and reservations are excluded.</p></aside></div><Sheet open={details} onClose={closeDetails} title={place?.name}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',margin:'6px 0 12px'}}><PeekRating value={4.7} count={52} source="Pico Community" readOnly={true}/><PulseHeart isLiked={Boolean(s.publicLikes?.[place?.id]?.userLiked)} likesCount={s.publicLikes?.[place?.id]?.count??14} onToggle={()=>place&&s.togglePublicLike(place.id)}/></div><p>{place?.description}</p><div className="reality"><Icon>lightbulb</Icon><p>{place?.caveat}</p></div><p>{money(place?.cost)} estimated · {place?.time} minutes suggested</p><div className="actions"><Button onClick={()=>{decide(true);setDetails(false);}}>Keep this place</Button><Button variant="ghost" onClick={closeDetails}>Close</Button></div></Sheet><Sheet open={filters} onClose={closeFilters} title="Trip preferences"><label>Collection<select value={city} onChange={e=>s.setPrefs({city:e.target.value})}>{supportedCities.map(city=><option key={city}>{city}</option>)}</select></label><label>Budget per traveller<input type="number" min={0} value={s.budgetEnvelope} onChange={e=>s.setBudget(Number(e.target.value))}/></label><p>Collections are curated guides, not live inventory. Changing city preserves your saved stops.</p><Button onClick={closeFilters}>Done</Button></Sheet></main>;
}

