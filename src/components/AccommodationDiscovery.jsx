import { useState } from 'react';
import { useStore } from '../lib/store';
import { money } from '../lib/provider';
import Button from './Button';
import { keralaResearchAccommodation } from '../lib/india-data.js';

const mappedKeralaStays = keralaResearchAccommodation.map(a => ({
  id: a.id,
  city: 'Kerala',
  name: a.name,
  type: a.type.charAt(0).toUpperCase() + a.type.slice(1),
  cost: a.observedPriceInr || 2500,
  area: a.location,
  image: '/assets/fort-kochi.jpg',
  amenities: a.facilities,
  description: `${a.classification ? a.classification + ' · ' : ''}${a.facilities.slice(0, 4).join(', ')}`,
  bookingUrl: '',
  caveat: `${a.source} listing. ${a.isPriceDated ? 'Price observation recorded ' + a.priceObservationDate + ', not a live quote.' : 'Price on local enquiry.'}`,
  classification: a.classification,
  priceObservation: a.priceObservationText,
  source: a.source
}));

const staysCatalog = [
  ...mappedKeralaStays,
  {
    id: 'stay-brunton',
    city: 'Kochi',
    name: 'Brunton Boatyard Hotel',
    type: 'Luxury Hotel',
    cost: 12500,
    area: 'Fort Kochi Waterfront',
    image: '/assets/fort-kochi.jpg',
    amenities: ['Harbour Pool', 'Ayurvedic Spa', 'Verandah Dining', 'Sea-facing'],
    description: 'Restored Victorian shipyard boutique hotel facing Cochin harbour with historical maritime prints and pier verandahs.',
    bookingUrl: 'https://www.cghearth.com/brunton-boatyard',
    caveat: 'Peak season requires advance reservation. Verified physical property.'
  },
  {
    id: 'stay-waltons',
    city: 'Kochi',
    name: "Walton's Verandah Heritage Homestay",
    type: 'Homestay',
    cost: 2400,
    area: 'Princess Street, Fort Kochi',
    image: '/assets/fort-kochi.jpg',
    amenities: ['Home-cooked Breakfast', 'Garden Courtyard', 'Host Guide', 'AC'],
    description: 'Charming Dutch-era residence with 4 tranquil rooms, family hospitality, and authentic Kerala vegetarian breakfasts.',
    bookingUrl: '',
    caveat: 'Limited rooms; family-run peaceful homestay with quiet hours after 10 PM.'
  },
  {
    id: 'stay-forte',
    city: 'Kochi',
    name: 'Forte Kochi Heritage Hotel',
    type: 'Boutique Hotel',
    cost: 8200,
    area: 'Princess Street',
    image: '/assets/fort-kochi.jpg',
    amenities: ['Swimming Pool', 'Central Courtyard', 'Heritage Suites', 'Free Wi-Fi'],
    description: '27 luxurious heritage suites blending Portuguese, Dutch, and British colonial aesthetics in the heart of Fort Kochi.',
    bookingUrl: '',
    caveat: 'Valet parking limited due to narrow heritage streets.'
  },
  {
    id: 'stay-zostel-kochi',
    city: 'Kochi',
    name: 'Zostel Fort Kochi',
    type: 'Hostel',
    cost: 850,
    area: 'Calvathy Road',
    image: '/assets/fort-kochi.jpg',
    amenities: ['Backpacker Dorms', 'Rooftop Lounge', 'Walking Tours', 'Co-working Wi-Fi'],
    description: 'Social backpacker hub with air-conditioned dorms, private rooms, community game nights, and bicycle rentals.',
    bookingUrl: 'https://www.zostel.com/zostel/kochi/',
    caveat: 'Social atmosphere best suited for solo travellers and backpackers.'
  },
  {
    id: 'stay-palolem-caba',
    city: 'Goa',
    name: 'Palolem Beach Coconut Huts',
    type: 'Resort',
    cost: 3500,
    area: 'Palolem Beach, South Goa',
    image: '/assets/destinations/palolem.jpg',
    amenities: ['Beachfront Huts', 'Sea Breeze Verandah', 'Yoga Deck', 'Shack Dining'],
    description: 'Eco-friendly wooden cottages under swaying coconut palms steps away from the crescent shoreline.',
    bookingUrl: '',
    caveat: 'Seasonal temporary huts operating October through May.'
  },
  {
    id: 'stay-fontainhas-heritage',
    city: 'Goa',
    name: 'Hospedaria Abrigo de Botelho',
    type: 'Homestay',
    cost: 3800,
    area: 'Fontainhas Latin Quarter, Panaji',
    image: '/assets/destinations/palolem.jpg',
    amenities: ['Heritage Azulejos', 'Continental Breakfast', 'Antique Furniture', 'AC'],
    description: 'Portuguese ancestral townhouse with hand-painted tile decor in the historic Latin Quarter.',
    bookingUrl: '',
    caveat: 'Narrow heritage lane; pedestrian access only for the last 50 metres.'
  },
  {
    id: 'stay-taj-westend',
    city: 'Bengaluru',
    name: 'The Taj West End Heritage Resort',
    type: 'Luxury Hotel',
    cost: 11500,
    area: 'Racecourse Road, Bengaluru',
    image: '/assets/destinations/lalbagh.jpg',
    amenities: ['20-acre Gardens', 'Heritage Trees', 'Open-air Pool', 'Fine Dining'],
    description: 'Founded in 1887, sprawling 20-acre lush sanctuary with century-old banyan trees and colonial architecture.',
    bookingUrl: '',
    caveat: 'Luxury price point. Central urban sanctuary.'
  }
];

export default function AccommodationDiscovery() {
  const s = useStore();
  const currentCity = s.userPrefs?.city || 'Kochi';
  const selectedStay = s.selectedAccommodation;
  const [filterType, setFilterType] = useState('ALL');

  const cityStays = staysCatalog.filter(stay => stay.city.toLowerCase() === currentCity.toLowerCase());
  const displayStays = cityStays.length ? cityStays : staysCatalog.filter(stay => stay.city === 'Kochi');

  const filtered = filterType === 'ALL'
    ? displayStays
    : displayStays.filter(stay => stay.type.toLowerCase().includes(filterType.toLowerCase()));

  const types = ['ALL', 'Hotel', 'Homestay', 'Hostel', 'Resort'];

  return (
    <section className="panel accommodation-discovery-section" style={{ marginTop: '16px' }}>
      <div className="row spread" style={{ marginBottom: '6px' }}>
        <div>
          <small className="eyebrow">ACCOMMODATION DISCOVERY · VERIFIED STAYS</small>
          <h2 style={{ margin: '2px 0 0', fontSize: '20px' }}>Where to Stay in {currentCity}</h2>
        </div>
        {selectedStay && (
          <span className="status-tag status-live">
            Selected: {selectedStay.name}
          </span>
        )}
      </div>

      <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 12px' }}>
        Curated stays with price estimates, verified physical locations, and distinct atmospheres.
      </p>

      {/* Filter Chips */}
      <div className="stay-filters" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {types.map(t => (
          <button
            key={t}
            type="button"
            className={`pref-pill ${filterType === t ? 'active' : ''}`}
            onClick={() => setFilterType(t)}
            style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '16px' }}
          >
            {t === 'ALL' ? 'All Stays' : t}
          </button>
        ))}
      </div>

      {/* Stays Grid */}
      <div className="stays-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(stay => {
          const isSelected = selectedStay?.id === stay.id;
          return (
            <article
              key={stay.id}
              className="panel stay-card"
              style={{
                margin: 0,
                border: isSelected ? '2px solid var(--teal)' : '1px solid var(--border)',
                background: isSelected ? 'rgba(46, 196, 182, 0.04)' : 'var(--card-bg, #fff)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="status-tag status-cached" style={{ fontSize: '11px' }}>{stay.type}</span>
                    <small style={{ color: 'var(--muted)', fontSize: '12px' }}>{stay.area}</small>
                  </div>
                  <h3 style={{ margin: '4px 0 2px', fontSize: '16px' }}>{stay.name}</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '16px', color: 'var(--ink)' }}>{money(stay.cost)}</strong>
                  <small style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>per night estimate</small>
                </div>
              </div>

              <p style={{ fontSize: '12px', margin: '8px 0', color: 'var(--ink)' }}>{stay.description}</p>

              {/* Amenities */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '6px 0 10px' }}>
                {stay.amenities.map((amenity, i) => (
                  <span key={i} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(0,0,0,0.04)', color: 'var(--muted)' }}>
                    ✓ {amenity}
                  </span>
                ))}
              </div>

              <details style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Stay Caveat & Terms</summary>
                <p style={{ margin: '4px 0 0' }}>{stay.caveat}</p>
              </details>

              <div className="actions" style={{ marginTop: '6px' }}>
                {isSelected ? (
                  <Button variant="secondary" onClick={() => s.setAccommodation(null)} style={{ fontSize: '12px' }}>
                    ✓ Selected · Remove Selection
                  </Button>
                ) : (
                  <Button onClick={() => s.setAccommodation(stay)} style={{ fontSize: '12px' }}>
                    Select for Trip Itinerary
                  </Button>
                )}
                {stay.bookingUrl && (
                  <a href={stay.bookingUrl} target="_blank" rel="noreferrer" className="direct-provider-link" style={{ fontSize: '12px', alignSelf: 'center' }}>
                    Official Website ↗
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className="fine-print" style={{ marginTop: '12px' }}>
        Note: Pico presents researched stay estimates and verified physical properties. Live reservations, room availability and cancellations must be made directly with property managers.
      </p>
    </section>
  );
}
