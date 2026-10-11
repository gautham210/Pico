// Curated place identities, not live inventory. Sources verify identity/city;
// visit lengths are planning suggestions. Prices and unsourced coordinates stay unknown.
const karnataka='https://karnatakatourism.org/en/destinations/';
const kerala='https://www.keralatourism.org/';
export const destinations = [
 {city:'Kochi',region:'Kerala',description:'Fishing nets, art cafés and quiet backwaters.',image:'/assets/fort-kochi.jpg',art:'coast'},
 {city:'Bengaluru',region:'Karnataka',description:'Garden walks, glasshouses and royal architecture.',art:'garden'},
 {city:'Goa',region:'Konkan coast',description:'Crescent beaches, sea forts and colourful old quarters.',art:'coast'},
 {city:'Kozhikode',region:'Kerala',description:'Malabar waterfronts and the city around Mananchira.',art:'waterfront'},
 {city:'Munnar',region:'Kerala',description:'Tea country, mountain scenery and lakeside detours.',art:'hills'},
 {city:'Mysuru',region:'Karnataka',description:'Palace courtyards, hilltop heritage and lake walks.',art:'palace'},
];
export const supportedCities=destinations.map(d=>d.city);
const row=(city,id,name,category,description,time,sourceUrl,cost=null)=>({id,city,name,category,description,time,sourceUrl,cost,avg_cost_inr:cost,coords:null,source:'CACHED',provider:'Pico curated guide',subtitle:city+' · '+category,distance:'Visit length is a planning suggestion',caveat:'Confirm opening hours, admission and accessibility locally before travelling.'});
export const cityPlaces=[
 row('Bengaluru','blr-lalbagh','Lalbagh Botanical Garden','Nature','Explore the botanical garden and its celebrated glasshouse.',90,karnataka+'bengaluru',50),
 row('Bengaluru','blr-cubbon','Cubbon Park','Nature','Leafy paths and a green pause in the heart of Bengaluru.',60,karnataka+'bengaluru',0),
 row('Bengaluru','blr-palace','Bangalore Palace','Cultural','A Tudor-inspired palace and grounds in the city.',90,'https://old.karnatakatourism.org/tour-item/bangalore-palace',250),
 row('Kozhikode','ccj-beach','Kozhikode Beach','Beach','A Malabar coast promenade for an unhurried seaside walk.',60,'https://kozhikode.nic.in/en/tourist-place/kozhikode-beach/',0),
 row('Kozhikode','ccj-mananchira','Mananchira Square','Cultural','The central pond and surrounding public space at the heart of Kozhikode.',45,kerala+'topic/kozhikode',0),
 row('Kozhikode','ccj-kappad','Kappad Beach','Beach','A historic coastal stretch north of Kozhikode.',90,'https://www.incredibleindia.gov.in/en/kerala/kozhikode/kappad-beach',0),
 row('Munnar','mun-eravikulam','Eravikulam National Park','Nature','High-altitude grasslands and mountain scenery near Munnar.',180,kerala+'destination/eravikulam-national-park/319/',200),
 row('Munnar','mun-mattupetty','Mattupetty Lake','Nature','A lakeside detour among the hills outside Munnar.',90,kerala+'destination/munnar/202/',100),
 row('Munnar','mun-tea','Munnar Tea Museum','Cultural','Explore the story of tea cultivation in the region.',60,kerala+'destination/munnar/202/',150),
 row('Mysuru','mys-palace','Mysuru Palace','Cultural','The royal palace complex at the centre of Mysuru.',120,karnataka+'mysuru',100),
 row('Mysuru','mys-chamundi','Chamundi Hill','Cultural','A temple hill overlooking Mysuru.',90,karnataka+'mysuru',0),
 row('Mysuru','mys-karanji','Karanji Lake','Nature','A lake and nature park for a quieter city break.',60,karnataka+'mysuru',50),
];
