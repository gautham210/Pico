import {useState} from 'react';
import {getNearby} from '../../services/distance.js';
import {validCoords} from '../../services/providers/contracts.js';
import Button from './Button';
export default function RouteDetails({places}){
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(false);
 const eligible=places.length>1&&places.every(p=>validCoords(p.coords));
 const calculate=async()=>{setLoading(true);try{setRows(await getNearby(places[0].coords,places.slice(1),'driving'));}finally{setLoading(false);}};
 return <section className="panel"><h2>Location details</h2><p>The route above shows stop order, not road geometry. Driving estimates below start at your first saved place; traffic is unavailable.</p>{places.map(p=><p key={p.id}>{p.name}: {validCoords(p.coords)?<a href={`https://www.openstreetmap.org/?mlat=${p.coords[0]}&mlon=${p.coords[1]}#map=15/${p.coords[0]}/${p.coords[1]}`} target="_blank" rel="noreferrer">Open verified coordinates on OpenStreetMap</a>:'No verified coordinates supplied.'}</p>)}<Button disabled={!eligible||loading} onClick={calculate}>{loading?'Checking routes…':'Estimate driving times'}</Button>{!eligible&&<p>Two places with verified coordinates are required. The curated Goa records include coordinates.</p>}<div role="status">{rows.map(r=><p key={r.place}>{places.find(p=>p.id===r.place)?.name||r.place}: {r.time} · {r.source} {r.reason&&`— ${r.reason}`}</p>)}</div><p><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a> · Routing by OSRM · estimates, not live traffic.</p></section>;
}
