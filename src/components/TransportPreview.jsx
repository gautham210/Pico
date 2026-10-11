const examples=[
 ['train','Train','A slower journey with room to stretch.','Illustrative budget ₹800–₹1,800/person','https://www.irctc.co.in/','Search IRCTC'],
 ['directions_bus','Bus','An overnight connection may save a hotel night.','Illustrative budget ₹900–₹2,000/person','https://www.redbus.in/','Search redBus'],
 ['flight','Flight','Compare airport transfers as well as flying time.','Illustrative budget ₹3,000–₹7,000/person','https://www.google.com/travel/flights','Search flights'],
 ['directions_car','Road','Flexible stops; fuel, tolls and hire add up.','Cost depends on your vehicle and route','https://www.google.com/maps','Explore roads'],
];
export default function TransportPreview(){return <section className="panel"><small className="eyebrow">Demo comparison · illustrative, not live inventory</small><h2>How would you like to get there?</h2><p>Example planning allowances for a regional trip, not quotes for your route or dates. These examples do not change your budget. Search below for provider results.</p><div className="transport-preview-grid">{examples.map(([icon,name,text,budget,url,link])=><article key={name}><span className="material-symbols-outlined" aria-hidden="true">{icon}</span><h3>{name}</h3><small>ILLUSTRATIVE ONLY</small><p>{text}</p><p><strong>{budget}</strong></p><a href={url} target="_blank" rel="noreferrer">{link} ↗</a></article>)}</div></section>;}
