import { useState } from 'react';
import { useStore } from '../lib/store';
import { HoloCard } from './reactbits/HoloCard';
import { PlaceImage } from './JourneyUI';
import Button from './Button';

export const allBadges = [
  {
    id: 'badge-first-step',
    name: 'First Flight',
    tier: 'common',
    city: 'All Destinations',
    icon: 'flight_takeoff',
    description: 'Begin your journey with Pico and curate your initial destination.',
    unlockRule: 'Save at least 1 destination to your itinerary draft.',
    checkUnlock: (s) => s.likedPlaces?.length >= 1
  },
  {
    id: 'badge-coastal-wanderer',
    name: 'Coastal Promenade Sentinel',
    tier: 'common',
    city: 'Kochi',
    icon: 'waves',
    description: 'Breeze along Fort Kochi beach under colonial rain trees.',
    unlockRule: 'Save or explore Fort Kochi Beach in your itinerary.',
    checkUnlock: (s) => s.likedPlaces?.some(p => p.id === 'fort-kochi')
  },
  {
    id: 'badge-spice-route',
    name: 'Spice Route Pioneer',
    tier: 'uncommon',
    city: 'Kochi',
    icon: 'local_florist',
    description: 'Discover Mattancherry and the historical cinnamon and cardamom alleys.',
    unlockRule: 'Save Dutch Palace or Mattancherry places to your plan.',
    checkUnlock: (s) => s.likedPlaces?.some(p => p.id === 'dutch-palace' || p.id === 'jew-town-synagogue')
  },
  {
    id: 'badge-mangrove-canoeist',
    name: 'Silent Mangrove Canoeist',
    tier: 'uncommon',
    city: 'Kochi',
    icon: 'kayaking',
    description: 'Glide through country canals in India’s model eco-village.',
    unlockRule: 'Include Kumbalangi Eco-Village in your travel plan.',
    checkUnlock: (s) => s.likedPlaces?.some(p => p.id === 'kumbalangi')
  },
  {
    id: 'badge-classical-mudra',
    name: 'Classical Mudra Admirer',
    tier: 'rare',
    city: 'Kochi',
    icon: 'theater_comedy',
    description: 'Witness centuries of temple Kathakali dance-drama and mudra storytelling.',
    unlockRule: 'Add Kerala Kathakali Centre to your itinerary.',
    checkUnlock: (s) => s.likedPlaces?.some(p => p.id === 'kathakali-centre')
  },
  {
    id: 'badge-cheena-vala',
    name: 'Cheena Vala Sentinel',
    tier: 'rare',
    city: 'Kochi',
    icon: 'sailing',
    description: 'Stand before the iconic 14th-century cantilevered sea nets at golden hour.',
    unlockRule: 'Complete photo verification at the Chinese Fishing Nets or log a memory.',
    checkUnlock: (s) => (s.huntSubmissions?.['hunt-cheena-vala']?.status === 'VERIFIED') || s.diary?.some(d => d.placeId === 'chinese-fishing-nets')
  },
  {
    id: 'badge-malabar-feast',
    name: 'Malabar Feast Connoisseur',
    tier: 'epic',
    city: 'Kochi & Kozhikode',
    icon: 'restaurant_menu',
    description: 'Savour legendary ghee dum biryani and fresh backwater fish curry.',
    unlockRule: 'Add at least 2 authentic local eateries and rate them in your diary.',
    checkUnlock: (s) => s.diary?.filter(d => /kashi|kayees|seagull|paragon/i.test(d.placeName || d.placeId)).length >= 1
  },
  {
    id: 'badge-arctic-tern-odyssey',
    name: 'Arctic Tern Global Odyssey',
    tier: 'legendary',
    city: 'Global',
    icon: 'military_tech',
    description: 'Travel like the Arctic Tern: fearless, observant, and respectful of local cultures.',
    unlockRule: 'Save 5+ destinations, log 2+ diary memories, and complete at least 1 hunt verification.',
    checkUnlock: (s) => s.likedPlaces?.length >= 5 && s.diary?.length >= 2 && Object.values(s.huntSubmissions || {}).some(h => h.status === 'VERIFIED')
  }
];

export default function CollectiblesGallery() {
  const s = useStore();
  const [selectedTier, setSelectedTier] = useState('ALL');

  const tiers = ['ALL', 'common', 'uncommon', 'rare', 'epic', 'legendary'];

  const filtered = selectedTier === 'ALL'
    ? allBadges
    : allBadges.filter(b => b.tier === selectedTier);

  const earnedCount = allBadges.filter(b => b.checkUnlock(s)).length;

  return (
    <section className="panel collectibles-gallery-section" style={{ marginTop: '16px' }}>
      <div className="row spread" style={{ marginBottom: '6px' }}>
        <div>
          <small className="eyebrow">COLLECTIBLE DESTINATION BADGES · TRAVEL PROGRESS</small>
          <h2 style={{ margin: '2px 0 0', fontSize: '20px' }}>Passport Stamps & Badges</h2>
        </div>
        <span className="count-pill">
          {earnedCount} / {allBadges.length} unlocked
        </span>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 12px' }}>
        Achievements reflect honest travel milestones. Ordinary places are never falsely labelled as rare.
      </p>

      {/* Tier Filter Chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {tiers.map(t => (
          <button
            key={t}
            type="button"
            className={`pref-pill ${selectedTier === t ? 'active' : ''}`}
            onClick={() => setSelectedTier(t)}
            style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '16px', textTransform: 'capitalize' }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
        {filtered.map(badge => {
          const isUnlocked = badge.checkUnlock(s);
          const rarityTier = badge.tier;

          return (
            <HoloCard
              key={badge.id}
              rarity={rarityTier}
              className={`badge-holo-item ${!isUnlocked ? 'badge-locked' : ''}`}
            >
              <article
                className="panel"
                style={{
                  height: '100%',
                  margin: 0,
                  opacity: isUnlocked ? 1 : 0.68,
                  filter: isUnlocked ? 'none' : 'grayscale(35%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className={`status-tag status-${rarityTier}`} style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                      {rarityTier} TIER
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{badge.city}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: isUnlocked ? 'var(--coral)' : 'var(--border)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{badge.icon}</span>
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px' }}>{badge.name}</h3>
                      <small style={{ fontSize: '11px', color: isUnlocked ? 'var(--teal)' : 'var(--muted)', fontWeight: 600 }}>
                        {isUnlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}
                      </small>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', margin: '6px 0', color: 'var(--ink)' }}>{badge.description}</p>
                </div>

                <div style={{ marginTop: '10px', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', fontSize: '11px', color: 'var(--muted)' }}>
                  <strong>Condition:</strong> {badge.unlockRule}
                </div>
              </article>
            </HoloCard>
          );
        })}
      </div>
    </section>
  );
}
