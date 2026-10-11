import {useStore} from '../lib/store';
export default function DestinationCollections({navigate}){
 const s=useStore();
 return <section><small className="eyebrow">Choose your next chapter</small><h2>Where curiosity takes you</h2><div className="destination-collections">{[
 {city:'Kochi',count:3,description:'Coastal heritage, village waterways and art cafés.',image:'/assets/fort-kochi.jpg',source:'STITCH DEMO'},
 {city:'Goa',count:50,description:'Beaches, historic forts, markets and coastal neighbourhoods.',source:'CURATED CACHE'}
 ].map(c=><button key={c.city} className="destination-collection" onClick={()=>{s.setPrefs({city:c.city});navigate('discover');}}>{c.image?<img src={c.image} alt={c.city}/>:<div className="category-art" aria-label="Illustrated coastline"><svg viewBox="0 0 320 160" aria-hidden="true"><circle cx="245" cy="40" r="24" fill="currentColor"/><path d="M0 105 Q80 45 150 95 T320 90 V160 H0Z" fill="currentColor" opacity=".3"/><path d="M0 125 Q80 80 160 125 T320 120" fill="none" stroke="currentColor" strokeWidth="4"/></svg><small>Coastline illustration</small></div>}<div><small>{c.source} · {c.count} places</small><h3>{c.city}</h3><p>{c.description}</p><strong>Explore {c.city} →</strong></div></button>)}</div><p className="muted">Changing collections preserves your saved itinerary. More cities will appear as validated catalogues become available.</p></section>;
}
