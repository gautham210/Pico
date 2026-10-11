import {supportedCities} from '../../data/city-collections.js';
import {useStore,committed,unknownPlaceCosts} from '../lib/store';
import {money,modes} from '../lib/provider';
import {interests} from '../lib/discovery.js';

const dateAfter=(date,days)=>{const end=new Date(`${date}T12:00:00`);end.setDate(end.getDate()+Number(days||1)-1);return end.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});};

export default function TripParameters(){
 const s=useStore(),p=s.userPrefs,travelers=Math.max(1,Number(p.travelers)||1),planned=committed(s),unknown=unknownPlaceCosts(s),groupBudget=s.budgetEnvelope*travelers,groupPlanned=planned*travelers;
 return <section className="panel">
  <h2>Trip parameters</h2>
  <p>Set a budget for one traveller. Group totals multiply that amount by everyone travelling. Planned estimates are not money spent.</p>
  <div className="parameter-grid">
   <label>Starting location<input value={p.origin||''} placeholder="e.g. Bengaluru" maxLength="80" onChange={e=>s.setPrefs({origin:e.target.value})}/></label>
   <label>Discover destination<select value={p.city} onChange={e=>s.setPrefs({city:e.target.value})}>{supportedCities.map(city=><option key={city}>{city}</option>)}</select></label>
   <label>First day (optional)<input type="date" value={p.startDate||''} onChange={e=>s.setPrefs({startDate:e.target.value})}/></label>
   <label>Duration in days<input type="number" min="1" max="7" value={p.days} onChange={e=>s.setPrefs({days:e.target.value})}/></label>
   <label>Travellers<input type="number" min="1" max="12" value={p.travelers} onChange={e=>s.setPrefs({travelers:e.target.value})}/></label>
   <label>Budget per traveller (INR)<input type="number" min={0} value={s.budgetEnvelope} onChange={e=>s.setBudget(Number(e.target.value))}/></label>
   <label>Travel pace<select value={p.pace||'balanced'} onChange={e=>s.setPrefs({pace:e.target.value})}><option value="relaxed">Relaxed</option><option value="balanced">Balanced</option><option value="full">Full days</option></select></label>
   <label style={{display:'flex',alignItems:'center',gap:'8px',gridColumn:'1 / -1',cursor:'pointer',fontSize:'12px'}}><input type="checkbox" checked={Boolean(p.multiCity)} onChange={e=>s.setPrefs({multiCity:e.target.checked})} style={{accentColor:'var(--coral)'}}/><span>Multi-destination trip (combine saved stops across different cities into one itinerary)</span></label>
  </div>
  <fieldset className="interest-fieldset"><legend>Places you might enjoy <small>Optional · choose any that fit</small></legend><div className="interest-options">{interests.map(([value,label])=><label key={value}><input type="checkbox" checked={(p.vibes||[]).includes(value)} onChange={event=>s.setPrefs({vibes:event.target.checked?[...(p.vibes||[]),value]:(p.vibes||[]).filter(item=>item!==value)})}/>{label}</label>)}</div></fieldset>
  {p.startDate&&<p>Planned date range: {new Date(`${p.startDate}T12:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})} – {dateAfter(p.startDate,p.days)} ({p.days} days).</p>}
  <div className="budget-breakdown" aria-live="polite">
   {planned>s.budgetEnvelope&&<p role="status">Your plan exceeds this budget by {money(planned-s.budgetEnvelope)} per traveller. Remove stops or choose cheaper transport to reduce spending.</p>}
   <p><strong>Per traveller:</strong> {money(s.budgetEnvelope)} budget · {money(planned)} known planned · {money(s.budgetRemaining)} {unknown?'available before unknown place costs':'estimated remaining'}</p>
   <p><strong>All {travelers} travellers:</strong> {money(groupBudget)} group budget · {money(groupPlanned)} known planned · {money(Math.max(0,groupBudget-groupPlanned))} {unknown?'available before unknown place costs':'estimated remaining'}</p>
   {unknown>0&&<p role="status">{unknown} saved {unknown===1?'place has':'places have'} no verified cost. These amounts are excluded, so remaining budget is an upper bound.</p>}
  </div>
  <label>Illustrative inbound transport<select value={s.mode} onChange={e=>s.setMode(e.target.value)}>{Object.entries(modes).map(([id,m])=><option key={id} value={id} disabled={s.likedPlaces.length>0&&committed({...s,mode:id})>s.budgetEnvelope&&committed({...s,mode:id})>=committed(s)}>{m.name} · {money(m.cost)} · {m.minutes} min</option>)}</select></label>
  <p className="fine-print">DEMO transport is not a quote for your origin or dates. Activities and one inbound leg are included per person. Group amounts multiply these per-person estimates by the traveller count. Stays, return travel, additional intercity travel and reservations are excluded. Switching the discovery collection preserves your saved itinerary.</p>
 </section>;
}
