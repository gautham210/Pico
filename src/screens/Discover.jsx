import {useState} from 'react';
import {motion,useReducedMotion} from 'framer-motion';
import {useStore,committed} from '../lib/store';
import {places} from '../data/places';
import {money} from '../lib/provider';
import Button from '../components/Button';
import Sheet from '../components/Sheet';
export default function Discover({navigate}){
const s=useStore(); const reduced=useReducedMotion(); const [details,setDetails]=useState(false); const [filters,setFilters]=useState(false); const [message,setMessage]=useState('');
const [dragIntent,setDragIntent]=useState(0);
const place=places.find(p=>!s.likedPlaces.some(x=>x.id===p.id)&&!s.passedPlaces.some(x=>x.id===p.id));
const nextPlace=places.find(p=>p.id!==place?.id&&!s.likedPlaces.some(x=>x.id===p.id)&&!s.passedPlaces.some(x=>x.id===p.id));
const decide=(like)=>{if(!place)return; if(like&&place.cost>s.budgetRemaining){setMessage('This place exceeds your remaining budget. Adjust your budget or pass.');return;} if(like&&!s.likePlace(place)){setMessage('Activities plus transport exceed your budget. Increase it or pass.');return;}if(!like)s.passPlace(place);setMessage('');};
return <><p className="demo-label">Demo estimates · per traveller · activities + selected transport</p><p role="status" className="notice">{message}</p>
<main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface">
<div className="flex flex-col w-full px-margin pb-6 gap-space-md select-none overflow-x-hidden">
{/* Live Budget & Trip Tracker Pill */}
<section className="w-full bg-surface-container-lowest rounded-lg p-3.5 shadow-[0_4px_16px_-2px_rgba(19,28,38,0.04)] flex flex-col gap-2.5">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
{/* Pico Mascot Avatar Badge */}
<div className="relative w-7 h-7 rounded-full bg-surface-container flex items-center justify-center shrink-0">
<svg className="w-4 h-4 text-on-surface" fill="currentColor" viewBox="0 0 24 24">
<path d="M21.5 5.5c-2 .5-4.5 1.5-6.5 3.5l-4-2.5-3 1.5 3 3.5-3.5 2.5-2-1-2 1 2.5 2.5-1 2.5 3.5-.5 2 2 1-1.5-1-2 4-2.5 4 1.5 2.5-2.5-3.5-2c2-2 3.5-4.5 4-6.5z">
</path>
<path d="M22 5l-3 1 1.5 2.5z" fill="#ff5b49">
</path>
</svg>
<span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-secondary-container">
</span>
</div>
<div className="flex flex-col">
<span className="font-body-sm text-[11px] text-on-surface-variant font-medium leading-none">Trip Budget: {money(s.budgetEnvelope)}</span>
<span className="font-label-code-sm text-label-code-sm text-on-surface font-semibold mt-0.5">{money(s.budgetRemaining)} <span className="text-secondary font-normal">remaining</span>
</span>
</div>
</div>
<div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-container-low text-on-surface-variant">
<span className="material-symbols-outlined text-xs text-secondary">savings</span>
<span className="font-label-code-sm text-[10px] text-on-surface-variant">Spent: {money(committed(s))}</span>
</div>
</div>
{/* Animated Smooth Meter */}
<div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden flex">
<div className="h-full bg-primary-container rounded-full transition-all duration-500 ease-out" style={{width: `${Math.min(100,committed(s)/Math.max(1,s.budgetEnvelope)*100)}%`}}>
</div>
</div>
</section>
{/* Editorial Section Header */}
<header className="flex items-end justify-between pt-1">
<div>
<div className="flex items-center gap-1.5">
<span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Discover</span>
<span className="px-2 py-0.5 text-[10px] font-label-code-sm bg-secondary-fixed text-on-secondary-fixed-variant rounded-full font-bold">KERALA</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Swipe places that match your vibe.</p>
</div>
{/* Active Filter Quick Badge */}
<button onClick={() => setFilters(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-surface-container text-on-surface font-body-sm text-[11px] font-medium shadow-sm hover:bg-surface-container-high active:scale-95 transition-all" type="button">
<span className="material-symbols-outlined text-sm text-primary">tune</span>
<span>Trip budget</span>
</button>
</header>
{place ? <> {/* Swipe Deck Stack Container */}
<div className="relative w-full h-[540px] flex items-center justify-center">
{/* Under-card preview (Kumbalangi Village & Backwaters) */}
{nextPlace && <div className="absolute inset-x-2 top-4 bottom-2 bg-surface-container-lowest rounded-lg shadow-[0_4px_16px_-2px_rgba(19,28,38,0.04)] flex flex-col overflow-hidden pointer-events-none transform scale-[0.95] translate-y-3 opacity-90 transition-all duration-300" id="deck-card-under" aria-hidden="true">
<div className="relative w-full h-52 bg-surface-container overflow-hidden">
<img className="w-full h-full object-cover" alt="Next place preview" src={nextPlace?.image}/>
<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
</div>
<div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-surface">
<div>
<span className="font-label-code-sm text-[10px] text-surface-variant uppercase tracking-wider">{nextPlace?.subtitle}</span>
<h3 className="font-headline-md text-headline-md text-surface leading-tight">{nextPlace?.name}</h3>
</div>
<span className="px-2.5 py-1 rounded-full bg-surface/90 text-on-surface text-[11px] font-label-code-sm font-semibold">{money(nextPlace?.cost||0)} / person</span>
</div>
</div>
<div className="p-4 flex-1 flex flex-col justify-between">
<p className="font-body-sm text-body-sm text-on-surface-variant">{nextPlace?.description}</p>
<div className="flex gap-2">
<span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-body-sm text-[11px]">Eco Vibe</span>
<span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-body-sm text-[11px]">Quiet</span>
</div>
</div>
</div>}
{/* Top Card: Fort Kochi (Interactive Draggable Card) */}
<motion.div key={place.id} drag={reduced ? false : "x"} dragConstraints={{left:0,right:0}} dragElastic={0.7} onDrag={(_,info)=>setDragIntent(info.offset.x>25?1:info.offset.x< -25?-1:0)} onDragEnd={(_, info) => { setDragIntent(0); if(info.offset.x > 80) decide(true); else if(info.offset.x < -80) decide(false); }} style={{touchAction:"pan-y"}} whileDrag={{rotate:3}} className="absolute inset-0 bg-surface-container-lowest rounded-lg shadow-[0_12px_32px_-4px_rgba(23,32,42,0.08),0_4px_12px_-2px_rgba(23,32,42,0.04)] flex flex-col overflow-hidden cursor-grab active:cursor-grabbing transition-transform ease-out" id="deck-card-top">
{/* Photo Visual with Vignette */}
<div className="relative w-full h-60 bg-surface-dim overflow-hidden shrink-0">
<img className="w-full h-full object-cover" alt={place.name} src={place.image}/>
<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
</div>
{/* Floating Quick Reaction Badges (Appear when swiping) */}
<div className="absolute top-4 right-4 px-3 py-1 bg-primary-container text-on-primary rounded-full font-headline-sm text-sm uppercase tracking-wider rotate-12 opacity-0 shadow-lg pointer-events-none transition-opacity" id="stamp-like" aria-hidden="true" style={{opacity:dragIntent===1?1:0,zIndex:2}}>
          KEEP
        </div>
<div className="absolute top-4 left-4 px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full font-headline-sm text-sm uppercase tracking-wider -rotate-12 opacity-0 shadow-lg pointer-events-none transition-opacity" id="stamp-pass" aria-hidden="true" style={{opacity:dragIntent===-1?1:0,zIndex:2}}>
          SKIP
        </div>
{/* Top Badges Overlay */}
<div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between pointer-events-none">
<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-sm">
<span className="material-symbols-outlined text-xs text-secondary" style={{"fontVariationSettings":"'FILL' 1"}}>location_on</span>
<span className="font-label-code-sm text-[10px] text-on-surface uppercase tracking-wide">Kochi, Kerala</span>
</div>
<button onClick={() => decide(true)} aria-label="Favorite destination" className="w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center text-primary-container shadow-sm active:scale-90 transition-transform pointer-events-auto" type="button">
<span className="material-symbols-outlined text-base" style={{"fontVariationSettings":"'FILL' 1"}}>bookmark</span>
</button>
</div>
{/* Card Title & Cost Pill over Scrim */}
<div className="absolute bottom-3 left-4 right-4 flex items-end justify-between pointer-events-none">
<div>
<span className="font-label-code-sm text-[10px] text-primary-fixed uppercase tracking-wider font-semibold">{place.subtitle}</span>
<h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-primary leading-none mt-0.5">{place.name}</h2>
</div>
<div className="px-2.5 py-1 rounded-full bg-surface-container-lowest text-on-surface shadow-sm">
<span className="font-label-code-sm text-[11px] font-bold text-secondary">{money(place.cost)}</span>
<span className="font-body-sm text-[10px] text-on-surface-variant">/ person</span>
</div>
</div>
</div>
{/* Card Editorial Details & Pico Reality Check */}
<div className="p-4 flex-1 flex flex-col justify-between overflow-y-auto">
<div className="flex flex-col gap-2.5">
{/* Category Chips */}
<div className="flex items-center gap-1.5 flex-wrap">
<span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-body-sm text-[11px] font-semibold">{place.category}</span>
<span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-body-sm text-[11px]">{place.distance}</span>
<span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-body-sm text-[11px]">Demo estimate</span>
<span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-code-sm text-[10px]">
<span className="material-symbols-outlined text-xs" style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
              Estimate
            </span>
</div>
{/* Editorial description quote */}
<p className="font-body-md text-body-md text-on-surface leading-snug">
            “{place.description}”
          </p>
{/* Pico's Signature Reality Check Widget */}
<div className="bg-tertiary-fixed/35 rounded-xl p-3 flex items-start gap-2.5 text-on-surface">
<div className="w-6 h-6 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-sm">lightbulb</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-1.5">
<span className="font-headline-sm text-xs font-bold text-on-tertiary-container">Pico Reality Check</span>
<span className="w-1.5 h-1.5 rounded-full bg-tertiary-container">
</span>
</div>
<p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                {place.caveat}
              </p>
</div>
</div>
</div>
{/* Card Footprint & Weather Micro Tag */}
<div className="pt-2 flex items-center justify-between text-on-surface-variant font-label-code-sm text-[10px]">
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-xs text-secondary">wb_sunny</span>
            Weather not live
          </span>
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-xs">directions_walk</span>
            {place.distance}
          </span>
</div>
</div>
</motion.div>
</div>
{/* Tactile Action Controls Floating Deck */}
<section className="flex items-center justify-center gap-4 py-1">
{/* Pass Button (X) */}
<button aria-label="Pass on location" className="w-14 h-14 rounded-full bg-surface-container-lowest text-on-surface-variant shadow-[0_4px_16px_-2px_rgba(23,32,42,0.06)] flex items-center justify-center active:scale-90 hover:bg-surface-container transition-all" onClick={() => decide(false)} id="btn-pass" type="button">
<span className="material-symbols-outlined text-2xl">close</span>
</button>
{/* Info / Details Pill Button */}
<button aria-label="Details" className="w-11 h-11 rounded-full bg-surface-container-lowest text-on-surface shadow-[0_4px_16px_-2px_rgba(23,32,42,0.06)] flex items-center justify-center active:scale-90 hover:bg-surface-container transition-all" onClick={() => setDetails(true)} id="btn-info" type="button">
<span className="material-symbols-outlined text-lg">info</span>
</button>
{/* Super Save / Must See Star Button */}
<button aria-label="Must visit" className="w-11 h-11 rounded-full bg-tertiary-fixed text-on-tertiary-fixed shadow-[0_4px_16px_-2px_rgba(23,32,42,0.06)] flex items-center justify-center active:scale-90 hover:bg-tertiary-fixed-dim transition-all" onClick={() => decide(true)} id="btn-star" type="button">
<span className="material-symbols-outlined text-lg" style={{"fontVariationSettings":"'FILL' 1"}}>kid_star</span>
</button>
{/* Like / Keep Button (Coral Heart with ambient glow) */}
<button aria-label="Keep place" className="w-14 h-14 rounded-full bg-primary-container text-on-primary shadow-[0_8px_20px_-4px_rgba(255,91,73,0.4)] flex items-center justify-center active:scale-90 hover:opacity-95 transition-all" onClick={() => decide(true)} id="btn-like" type="button">
<span className="material-symbols-outlined text-2xl" style={{"fontVariationSettings":"'FILL' 1"}}>favorite</span>
</button>
</section>
</> : <section className="panel empty"><h2>Your deck is complete</h2><p>{s.likedPlaces.length} places saved. Review your selections in Plan.</p><Button onClick={() => navigate("plan")}>Review itinerary</Button><Button variant="ghost" onClick={s.revisit}>Revisit passed places</Button></section>}
{/* Sticky Conversion Banner: "Plan My Trip" CTA */}
<section className="w-full pt-1">
<a className="w-full py-3.5 px-4 rounded-full bg-inverse-surface text-inverse-on-surface flex items-center justify-between shadow-[0_8px_24px_-4px_rgba(23,32,42,0.18)] active:scale-[0.98] transition-all" data-path="plan-and-itinerary" href="#plan">
<div className="flex items-center gap-2.5">
<div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-xs font-bold font-label-code-sm">
          {s.likedPlaces.length}
        </div>
<div className="flex flex-col text-left">
<span className="font-headline-sm text-xs font-semibold text-inverse-on-surface leading-tight">Plan My Itinerary</span>
<span className="font-body-sm text-[10px] text-surface-dim">{s.likedPlaces.length} places saved in Kochi</span>
</div>
</div>
<div className="flex items-center gap-1 font-label-code-sm text-xs font-semibold text-primary-fixed">
<span>Build Route</span>
<span className="material-symbols-outlined text-sm">arrow_forward</span>
</div>
</a>
</section>
</div>
</main>
<Sheet open={details} onClose={()=>setDetails(false)} title={place?.name}><p>{place?.description}</p><p className="reality">{place?.caveat}</p><p>{money(place?.cost||0)} estimated • {place?.time} minutes</p><Button onClick={()=>{decide(true);setDetails(false);}}>Keep this place</Button><Button variant="ghost" onClick={()=>setDetails(false)}>Close</Button></Sheet>
<Sheet open={filters} onClose={()=>setFilters(false)} title="Trip preferences"><label>Budget per traveller<input type="number" min={committed(s)} value={s.budgetEnvelope} onChange={e=>s.setBudget(Number(e.target.value))}/></label><p>Estimates include activities and one inbound transport leg. Accommodation and return travel are excluded.</p><Button onClick={()=>setFilters(false)}>Done</Button></Sheet></>;
}
