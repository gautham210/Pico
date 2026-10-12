import { useState } from 'react';
import { useStore } from '../lib/store';
import { money } from '../lib/provider';
import Button from './Button';
import { PeekRating } from './reactbits/PeekRating';

const foodCatalogue = [
  {
    id: 'food-kashi-breakfast',
    city: 'Kochi',
    name: 'Kashi Art Café',
    specialty: 'Handmade Sourdough, Roast Coffee & Chocolate Cake',
    mealType: 'Breakfast',
    dietary: 'vegetarian',
    cost: 550,
    area: 'Burgher Street, Fort Kochi',
    coords: [9.9665, 76.2428],
    image: '/assets/kashi.jpg',
    description: 'Slow-brewed Arabica coffees, seasonal fruit bowls, and warm sourdough toasts in an open-air sculpture courtyard.',
    caveat: 'Popular morning spot; arrive before 9:30 AM to avoid breakfast wait times.'
  },
  {
    id: 'food-kayees-biryani',
    city: 'Kochi',
    name: 'Kayees Rahmathullah Hotel',
    specialty: 'Authentic Mattancherry Ghee Dum Biryani',
    mealType: 'Lunch',
    dietary: 'non-vegetarian',
    cost: 320,
    area: 'Mattancherry, Kochi',
    coords: [9.9575, 76.2570],
    image: '/assets/kashi.jpg',
    description: 'Iconic Malabar culinary tradition serving tender mutton and chicken slow-cooked with fragrant spices and caramelized onions.',
    caveat: 'Famous biryani pots run out by 1:45 PM daily. Arrive between 12:15 and 1:00 PM.'
  },
  {
    id: 'food-grand-sadhya',
    city: 'Kochi',
    name: 'Grand Pavilion (Grand Hotel)',
    specialty: 'Traditional Kerala Sadhya on Banana Leaf',
    mealType: 'Lunch',
    dietary: 'vegetarian',
    cost: 450,
    area: 'M.G. Road, Ernakulam',
    coords: [9.9725, 76.2842],
    image: '/assets/kashi.jpg',
    description: 'Grand vegetarian feast featuring 18 curated curries, avial, thoran, sambar, crispy pappadams, and warm payasam pudding.',
    caveat: 'Located across the harbour; combine with the scenic 20-minute passenger ferry from Fort Kochi jetty.'
  },
  {
    id: 'food-seagull-dinner',
    city: 'Kochi',
    name: 'Seagull Harbourfront Restaurant',
    specialty: 'Coastal Karimeen Pollichathu & Crab Roast',
    mealType: 'Dinner',
    dietary: 'non-vegetarian',
    cost: 850,
    area: 'Calvathy Harbour Pier, Fort Kochi',
    coords: [9.9692, 76.2490],
    image: '/assets/fort-kochi.jpg',
    description: 'Dine right over the water as Cochin port ships cruise past. Spicy pearl spot fish marinated in shallots and wrapped in banana leaf.',
    caveat: 'Waterfront deck tables fill fast by 6:45 PM. Open-air and breezy.'
  },
  {
    id: 'food-brindhavan-tiffin',
    city: 'Kochi',
    name: 'Brindhavan Pure Vegetarian',
    specialty: 'Ghee Roast Masala Dosa & Fresh Filter Coffee',
    mealType: 'Breakfast',
    dietary: 'vegetarian',
    cost: 180,
    area: 'Palarivattom / Ernakulam',
    coords: [9.9981, 76.3075],
    image: '/assets/kashi.jpg',
    description: 'Crisp, golden crepe roasted in pure ghee served with three fresh chutneys and piping hot drumstick sambar.',
    caveat: 'Busy local crowd on Sunday mornings. Quick service.'
  },
  {
    id: 'food-vidyarthi-blr',
    city: 'Bengaluru',
    name: 'Vidyarthi Bhavan',
    specialty: 'Legendary Crispy Thick Masala Dose',
    mealType: 'Breakfast',
    dietary: 'vegetarian',
    cost: 150,
    area: 'Gandhi Bazaar, Basavanagudi',
    coords: [12.9439, 77.5694],
    image: '/assets/destinations/lalbagh.jpg',
    description: 'South Bengaluru heritage restaurant operating since 1943. Waiters famously balance towers of dose plates.',
    caveat: 'Always packed on weekends; token queue system operates at the entrance.'
  },
  {
    id: 'food-paragon-ccj',
    city: 'Kozhikode',
    name: 'Paragon Restaurant Calicut',
    specialty: 'World-renowned Malabar Biryani & Seafood Stew',
    mealType: 'Dinner',
    dietary: 'non-vegetarian',
    cost: 420,
    area: 'Kannur Road, Kozhikode',
    coords: [11.2625, 75.7770],
    image: '/assets/destinations/kozhikode-beach.jpg',
    description: 'Culinary pilgrimage point in North Kerala known for short-grain Jeerakasala rice biryani and mango fish curry.',
    caveat: 'Expect 20-30 min wait times during peak dinner (8:00–9:30 PM).'
  }
];

export default function FoodDiscovery() {
  const s = useStore();
  const currentCity = s.userPrefs?.city || 'Kochi';
  const userDietary = s.userPrefs?.dietary || 'any';
  const [activeDietary, setActiveDietary] = useState(userDietary === 'any' ? 'all' : userDietary);
  const [activeMeal, setActiveMeal] = useState('all');
  const [feedback, setFeedback] = useState('');
  const [ratings, setRatings] = useState({});

  const cityDishes = foodCatalogue.filter(item => item.city.toLowerCase() === currentCity.toLowerCase());
  const displayDishes = cityDishes.length ? cityDishes : foodCatalogue.filter(item => item.city === 'Kochi');

  const filtered = displayDishes.filter(item => {
    const matchesDiet = activeDietary === 'all' || item.dietary === activeDietary;
    const matchesMeal = activeMeal === 'all' || item.mealType.toLowerCase() === activeMeal.toLowerCase();
    return matchesDiet && matchesMeal;
  });

  const addFoodToItinerary = (dish) => {
    const placeRepresentation = {
      id: dish.id,
      name: `${dish.name} (${dish.mealType})`,
      city: dish.city,
      cost: dish.cost,
      coords: dish.coords,
      category: 'Foodie',
      subtitle: `${dish.specialty} · ${dish.area}`,
      description: dish.description,
      caveat: dish.caveat,
      time: 60,
      dietary: dish.dietary,
      isMeal: true,
      mealType: dish.mealType.toLowerCase()
    };

    const ok = s.likePlace(placeRepresentation);
    if (ok) {
      setFeedback(`✓ Added ${dish.name} to your trip plan!`);
      setTimeout(() => setFeedback(''), 3000);
    } else {
      setFeedback(`⚠️ Could not add: exceeds budget envelope or invalid.`);
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const dietOptions = [
    { id: 'all', label: 'All Cuisines' },
    { id: 'vegetarian', label: 'Pure Veg 🌿' },
    { id: 'non-vegetarian', label: 'Non-Veg 🍗' }
  ];

  const mealOptions = [
    { id: 'all', label: 'All Meals' },
    { id: 'breakfast', label: 'Breakfast ☕' },
    { id: 'lunch', label: 'Lunch 🍲' },
    { id: 'dinner', label: 'Dinner 🌙' }
  ];

  return (
    <section className="panel food-discovery-section" style={{ marginTop: '16px' }}>
      <div className="row spread" style={{ marginBottom: '6px' }}>
        <div>
          <small className="eyebrow">FOOD & LOCAL DINING · FIRST-CLASS ITINERARY PLANNING</small>
          <h2 style={{ margin: '2px 0 0', fontSize: '20px' }}>Taste {currentCity}</h2>
        </div>
        <span className="status-tag status-live">
          {activeDietary === 'all' ? 'All Dietary Choices' : activeDietary.toUpperCase()}
        </span>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 12px' }}>
        Verified culinary stops with authentic local specialties, dietary transparency, and direct itinerary addition.
      </p>

      {feedback && (
        <div role="status" style={{ padding: '8px 12px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '12px', marginBottom: '12px' }}>
          {feedback}
        </div>
      )}

      {/* Filter Row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {dietOptions.map(opt => (
            <button
              key={opt.id}
              type="button"
              className={`pref-pill ${activeDietary === opt.id ? 'active' : ''}`}
              onClick={() => setActiveDietary(opt.id)}
              style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '16px' }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {mealOptions.map(opt => (
            <button
              key={opt.id}
              type="button"
              className={`pref-pill ${activeMeal === opt.id ? 'active' : ''}`}
              onClick={() => setActiveMeal(opt.id)}
              style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '16px' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dishes List */}
      <div className="food-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(dish => {
          const isAdded = s.likedPlaces.some(p => p.id === dish.id);
          return (
            <article
              key={dish.id}
              className="panel food-item-card"
              style={{
                margin: 0,
                border: isAdded ? '2px solid var(--teal)' : '1px solid var(--border)',
                background: isAdded ? 'rgba(46, 196, 182, 0.04)' : 'var(--card-bg, #fff)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="status-tag status-cached" style={{ fontSize: '11px' }}>{dish.mealType}</span>
                    <span className="status-tag status-live" style={{ fontSize: '11px', background: dish.dietary === 'vegetarian' ? '#dcfce7' : '#fee2e2', color: dish.dietary === 'vegetarian' ? '#15803d' : '#b91c1c' }}>
                      {dish.dietary === 'vegetarian' ? 'VEG' : 'NON-VEG'}
                    </span>
                    <small style={{ color: 'var(--muted)', fontSize: '12px' }}>{dish.area}</small>
                  </div>
                  <h3 style={{ margin: '4px 0 2px', fontSize: '16px' }}>{dish.name}</h3>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--coral)' }}>{dish.specialty}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '16px', color: 'var(--ink)' }}>{money(dish.cost)}</strong>
                  <small style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>avg meal cost</small>
                </div>
              </div>

              <p style={{ fontSize: '12px', margin: '8px 0', color: 'var(--ink)' }}>{dish.description}</p>

              {/* PeekRating Integration */}
              <div style={{ margin: '8px 0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <small style={{ fontSize: '11px', color: 'var(--muted)' }}>Eatery Vibe:</small>
                <PeekRating
                  value={ratings[dish.id] || 4}
                  onChange={r => setRatings(prev => ({ ...prev, [dish.id]: r }))}
                  size="sm"
                />
              </div>

              <details style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Timing & Reality Check</summary>
                <p style={{ margin: '4px 0 0' }}>{dish.caveat}</p>
              </details>

              <div className="actions" style={{ marginTop: '6px' }}>
                {isAdded ? (
                  <Button variant="secondary" onClick={() => s.removePlace(dish.id)} style={{ fontSize: '12px' }}>
                    ✓ Added to Plan · Remove
                  </Button>
                ) : (
                  <Button onClick={() => addFoodToItinerary(dish)} style={{ fontSize: '12px' }}>
                    + Add to {dish.mealType} Plan
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
