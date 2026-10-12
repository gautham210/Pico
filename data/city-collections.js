// Curated place identities with validated coordinates, sources, and planning durations.
const karnataka = 'https://karnatakatourism.org/en/destinations/';
const kerala = 'https://www.keralatourism.org/';

export const destinations = [
  { city: 'Kochi', region: 'Kerala', description: 'Fishing nets, spice alleys, art cafés and quiet backwaters.', image: '/assets/fort-kochi.jpg', art: 'coast', photoId: 'fort-kochi' },
  { city: 'Bengaluru', region: 'Karnataka', description: 'Garden walks, glasshouses, modern art and heritage tiffins.', image: '/assets/destinations/lalbagh.jpg', art: 'garden', photoId: 'blr-lalbagh' },
  { city: 'Goa', region: 'Konkan coast', description: 'Crescent beaches, Portuguese forts and vibrant old quarters.', image: '/assets/destinations/palolem.jpg', art: 'coast', photoId: 'goa_palolem_beach' },
  { city: 'Kozhikode', region: 'Kerala', description: 'Malabar coastal piers, legendary biryani and Mananchira square.', image: '/assets/destinations/kozhikode-beach.jpg', art: 'waterfront', photoId: 'ccj-beach' },
  { city: 'Munnar', region: 'Kerala', description: 'High-altitude tea estates, mountain ridges and serene lakes.', image: '/assets/destinations/munnar-tea.jpg', art: 'hills', photoId: 'mun-tea' },
  { city: 'Mysuru', region: 'Karnataka', description: 'Illuminated royal palaces, Chamundi temple and bustling bazaars.', image: '/assets/destinations/mysore-palace.jpg', art: 'palace', photoId: 'mys-palace' },
];

export const supportedCities = destinations.map(d => d.city);

const row = (city, id, name, category, description, time, sourceUrl, cost = null, coords = null, dietary = 'any') => ({
  id,
  city,
  name,
  category,
  description,
  time,
  sourceUrl,
  cost,
  avg_cost_inr: cost,
  coords: Array.isArray(coords) && coords.length === 2 ? coords : null,
  dietary,
  source: 'CACHED',
  provider: 'Pico curated guide',
  subtitle: `${city} · ${category}`,
  distance: 'Visit length is a planning suggestion',
  caveat: 'Confirm opening hours, admission and accessibility locally before travelling.'
});

export const cityPlaces = [
  // Bengaluru
  row('Bengaluru', 'blr-lalbagh', 'Lalbagh Botanical Garden & Glass House', 'Nature', 'Explore the 240-acre botanical haven, century-old trees and celebrated crystal glasshouse.', 90, karnataka + 'bengaluru', 50, [12.9507, 77.5848]),
  row('Bengaluru', 'blr-cubbon', 'Cubbon Park & Bamboo Groves', 'Nature', 'Lush green pathways, historic bandstand and the red-brick State Central Library.', 60, karnataka + 'bengaluru', 0, [12.9763, 77.5929]),
  row('Bengaluru', 'blr-palace', 'Bangalore Palace Grounds', 'Cultural', 'Tudor-inspired royal residence with fortified towers, wood carvings and family gallery.', 90, 'https://old.karnatakatourism.org/tour-item/bangalore-palace', 250, [12.9988, 77.5921]),
  row('Bengaluru', 'blr-vidyarthi', 'Vidyarthi Bhavan Gandhi Bazaar', 'Foodie', 'Iconic South Indian tiffin institution legendary for crispy ghee roast masala dose.', 45, karnataka + 'bengaluru', 160, [12.9439, 77.5694], 'vegetarian'),
  row('Bengaluru', 'blr-ngma', 'National Gallery of Modern Art (NGMA)', 'Cultural', 'Historic Manikyavelu heritage mansion displaying classical and post-modern Indian art.', 75, karnataka + 'bengaluru', 50, [12.9892, 77.5889]),

  // Kozhikode
  row('Kozhikode', 'ccj-beach', 'Kozhikode Beach & Historic Pier', 'Beach', 'Malabar coastline with colonial sea pier ruins, cool evening breeze and street snacks.', 60, 'https://kozhikode.nic.in/en/tourist-place/kozhikode-beach/', 0, [11.2618, 75.7694]),
  row('Kozhikode', 'ccj-mananchira', 'Mananchira Square Heritage Garden', 'Cultural', 'Clear freshwater reservoir surrounded by heritage Kerala architecture and paved paths.', 45, kerala + 'topic/kozhikode', 0, [11.2530, 75.7797]),
  row('Kozhikode', 'ccj-paragon', 'Paragon Restaurant Calicut', 'Foodie', 'World-acclaimed Malabar culinary hub famous for fragrant Thalassery Biryani and Alleppey fish curry.', 60, kerala + 'topic/kozhikode', 380, [11.2625, 75.7770], 'non-vegetarian'),
  row('Kozhikode', 'ccj-kappad', 'Kappad Beach & Rocky Promontory', 'Beach', 'Historic coastline north of the city with tranquil rock formations and clean shores.', 90, 'https://www.incredibleindia.gov.in/en/kerala/kozhikode/kappad-beach', 0, [11.3887, 75.7188]),
  row('Kozhikode', 'ccj-sm-street', 'S.M. Street (Sweet Meat Street)', 'Cultural', 'Centuries-old pedestrian trading lane filled with authentic Calicut Halwa and banana chips.', 60, kerala + 'topic/kozhikode', 100, [11.2505, 75.7820]),

  // Munnar
  row('Munnar', 'mun-eravikulam', 'Eravikulam National Park (Rajamalai)', 'Nature', 'Rolling high-altitude grasslands home to the endangered Nilgiri Tahr mountain goat.', 180, kerala + 'destination/eravikulam-national-park/319/', 200, [10.1518, 77.0658]),
  row('Munnar', 'mun-mattupetty', 'Mattupetty Lake & Speedboat Basin', 'Nature', 'Lakeside sanctuary surrounded by tea hills, with water boating and elephant spotting.', 90, kerala + 'destination/munnar/202/', 100, [10.1062, 77.1245]),
  row('Munnar', 'mun-tea', 'KDHP Tea Museum & Factory', 'Cultural', 'Step through the 1880s history of Munnar tea picking, CTC roller machinery and tasting.', 60, kerala + 'destination/munnar/202/', 150, [10.0894, 77.0547]),
  row('Munnar', 'mun-topstation', 'Top Station Ridge Viewpoint', 'Nature', 'Highest point on the Munnar-Kodaikanal road offering panoramic views over the Western Ghats.', 90, kerala + 'destination/munnar/202/', 50, [10.1244, 77.2439]),

  // Mysuru
  row('Mysuru', 'mys-palace', 'Mysuru Royal Palace (Amba Vilas)', 'Cultural', 'Three-storey stone palace with marble domes, silver gates, Durbar Hall and royal regalia.', 120, karnataka + 'mysuru', 100, [12.3051, 76.6551]),
  row('Mysuru', 'mys-chamundi', 'Chamundi Hill & Temple Monolith', 'Cultural', 'Sacred granite hill overlooking Mysuru with a colossal monolithic Nandi bull statue.', 90, karnataka + 'mysuru', 0, [12.2727, 76.6710]),
  row('Mysuru', 'mys-karanji', 'Karanji Lake & Walk-through Aviary', 'Nature', 'Picturesque conservation lake featuring India’s largest walk-through nature aviary.', 60, karnataka + 'mysuru', 50, [12.3025, 76.6744]),
  row('Mysuru', 'mys-devaraja', 'Devaraja 100-Year Spice & Flower Market', 'Cultural', 'Vibrant century-old bazaar packed with conical pigment piles, jasmine garlands and Mysore Pak.', 60, karnataka + 'mysuru', 80, [12.3105, 76.6496]),
  row('Mysuru', 'mys-mylari', 'Original Hotel Vinayaka Mylari', 'Foodie', 'Tiny legendary establishment renowned for feather-soft dosas served with fresh butter dollop.', 40, karnataka + 'mysuru', 120, [12.3060, 76.6625], 'vegetarian'),

  // Goa
  row('Goa', 'goa-palolem', 'Palolem Beach Crescent & Kayak Cove', 'Beach', 'Pristine crescent bay with gently sloping waters, beach shacks and sunset dolphin kayak paddles.', 120, 'https://goa-tourism.com/', 0, [15.0100, 74.0231]),
  row('Goa', 'goa-aguada', 'Fort Aguada & Sea Lighthouse', 'Cultural', '17th-century Portuguese coastal bastion with panoramic views over Sinquerim and Arabian Sea.', 75, 'https://goa-tourism.com/', 50, [15.4925, 73.7736]),
  row('Goa', 'goa-fontainhas', 'Fontainhas Latin Quarter', 'Cultural', 'Colourful heritage enclave in Panaji with cobblestone lanes, azulejos ceramic tiles and terracotta roofs.', 60, 'https://goa-tourism.com/', 0, [15.4989, 73.8344]),
  row('Goa', 'goa-anjuna', 'Anjuna Beach & Rocky Coastal Trail', 'Beach', 'Famous coastal stretch with volcanic rock shelves, seaside music cafes and sunset lookouts.', 90, 'https://goa-tourism.com/', 0, [15.5804, 73.7423])
];
