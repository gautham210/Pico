import { useStore, activeTripPlaces } from '../lib/store';
import Button from '../components/Button';
import { useState } from 'react';
import { modes } from '../lib/provider';
import { supportedCities } from '../../data/city-collections.js';
import {
  isSupabaseConfigured,
  signOutUser,
  saveProfile,
  savePreferences
} from '../../services/supabase.js';
import { HoloCard } from '../components/reactbits/HoloCard';

export default function Profile({ navigate }) {
  const { profile, updateProfile, logout, diary, likedPlaces, user, userPrefs, setPrefs } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(profile);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [signOutBusy, setSignOutBusy] = useState(false);

  const isCloud = user?.provider === 'supabase' || user?.provider === 'firebase';

  const handleSignOut = async () => {
    setError('');
    setSignOutBusy(true);
    try {
      if (user?.provider === 'supabase') {
        await signOutUser();
      } else if (user?.provider === 'firebase') {
        const { signOut } = await import('../../services/auth.js');
        await signOut();
      }
      logout();
      navigate('login');
    } catch (err) {
      setError(err.message || 'Could not sign out.');
    } finally {
      setSignOutBusy(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editForm.displayName.trim() || !Number.isFinite(editForm.budgetDefault) || editForm.budgetDefault < 0) {
      setError('Enter a name and a non-negative budget.');
      return;
    }
    setError('');
    const updated = { ...editForm, displayName: editForm.displayName.trim() };
    updateProfile(updated);

    // Sync to Supabase if authenticated
    if (isSupabaseConfigured() && user?.uid && user?.provider === 'supabase') {
      try {
        await saveProfile({
          id: user.uid,
          display_name: updated.displayName,
          avatar_url: updated.avatar || '',
          travel_style: updated.travelStyle
        });
        await savePreferences({
          user_id: user.uid,
          budget_tier: updated.travelStyle.toLowerCase(),
          budget_default: Number(updated.budgetDefault),
          transport_preference: updated.transportMode
        });
        setSaveSuccess('Profile and preferences synced to Supabase.');
        setTimeout(() => setSaveSuccess(''), 3000);
      } catch (err) {
        setError('Saved locally; cloud sync failed. Check connection.');
      }
    }

    setIsEditing(false);
  };

  const chooseAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type) || f.size > 2 * 1024 * 1024) {
      setError('Choose a PNG, JPEG or WebP under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditForm({ ...editForm, avatar: reader.result });
      setError('');
    };
    reader.readAsDataURL(f);
  };

  // Collect distinct visited or planned destinations for Passport Stamps
  const plannedCities = [...new Set(likedPlaces.map(p => p.city).filter(Boolean))];
  const allStamps = plannedCities.length ? plannedCities : [userPrefs?.city || 'Kochi'];

  return (
    <main className="journey">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <small className="eyebrow">
            {user?.provider === 'supabase' ? 'Supabase Cloud Account' : user?.provider === 'firebase' ? 'Firebase Sync' : 'Local Device Profile'}
          </small>
          <h1 style={{ margin: 0, fontSize: '26px' }}>Traveller Profile</h1>
        </div>
        <Button variant="ghost" disabled={signOutBusy} onClick={handleSignOut}>
          {signOutBusy ? 'Signing out…' : 'Sign Out'}
        </Button>
      </div>

      {error && !isEditing && <p role="alert" className="review-blocker">{error}</p>}
      {saveSuccess && (
        <div role="status" style={{ padding: '10px 14px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '12px', color: '#166534', marginBottom: '12px' }}>
          ✓ {saveSuccess}
        </div>
      )}

      {/* Account Info Card */}
      <section className="panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {profile.avatar ? (
          <img src={profile.avatar} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '40px', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700 }}>
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>{profile.displayName}</h2>
            <span className={`status-tag status-${isCloud ? 'live' : 'cached'}`}>
              {isCloud ? 'CLOUD SYNC' : 'LOCAL GUEST'}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
            {user?.email || (user?.phone ? `Mobile: ${user.phone}` : isCloud ? 'Cloud authenticated' : 'Local guest — stays on this device only')}
          </p>
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {!isCloud && (
              <Button variant="secondary" onClick={() => navigate('login')} style={{ fontSize: '12px', minHeight: '32px', padding: '4px 10px' }}>
                Upgrade to Cloud Account ☁️
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate('login')} style={{ fontSize: '12px', minHeight: '32px', padding: '4px 10px' }}>
              Revisit Onboarding
            </Button>
            <Button variant="secondary" onClick={() => navigate('ride')} style={{ fontSize: '12px', minHeight: '32px', padding: '4px 10px' }}>
              Ride Together Lobby 🚴
            </Button>
          </div>
        </div>
      </section>

      {/* Edit Form or Preferences Display */}
      {isEditing ? (
        <form className="panel" onSubmit={handleSave}>
          <h2>Edit Travel DNA & Preferences</h2>
          <label>Display Name
            <input type="text" value={editForm.displayName} onChange={e => setEditForm({...editForm, displayName: e.target.value})} required />
          </label>
          <label>Profile Avatar
            <input type="file" accept="image/*" onChange={chooseAvatar} />
          </label>
          {error && <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
          
          <label>Preferred Travel Style
            <select value={editForm.travelStyle} onChange={e => setEditForm({...editForm, travelStyle: e.target.value})}>
              <option value="Conservative">Conservative (Budget-conscious)</option>
              <option value="Balanced">Balanced (Comfort & experience)</option>
              <option value="Lavish">Lavish (Luxury stays & dining)</option>
            </select>
          </label>

          <label>Default Transport Mode
            <select value={editForm.transportMode} onChange={e => setEditForm({...editForm, transportMode: e.target.value})}>
              {Object.entries(modes).map(([id, m]) => (
                <option key={id} value={id}>{m.name}</option>
              ))}
            </select>
          </label>

          <label>Budget Default per traveller (INR)
            <input type="number" min="1000" step="1000" value={editForm.budgetDefault} onChange={e => setEditForm({...editForm, budgetDefault: Number(e.target.value)})} />
          </label>

          <div className="actions" style={{ marginTop: '16px' }}>
            <Button type="submit">Save Changes</Button>
            <Button variant="ghost" onClick={() => setIsEditing(false)} type="button">Cancel</Button>
          </div>
        </form>
      ) : (
        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <small className="eyebrow">YOUR PREFERENCES</small>
              <h2 style={{ margin: '2px 0 0' }}>Travel DNA Attributes</h2>
            </div>
            <Button variant="secondary" onClick={() => { setEditForm(profile); setError(''); setIsEditing(true); }}>
              Edit
            </Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', marginTop: '16px' }}>
            <div>
              <small className="eyebrow">Spending Style</small>
              <p style={{ fontWeight: 600, margin: '2px 0' }}>{profile.travelStyle}</p>
            </div>
            <div>
              <small className="eyebrow">Transport Mode</small>
              <p style={{ fontWeight: 600, margin: '2px 0' }}>{modes[profile.transportMode]?.name || 'Convenient'}</p>
            </div>
            <div>
              <small className="eyebrow">Budget / Person</small>
              <p style={{ fontWeight: 600, margin: '2px 0' }}>₹{profile.budgetDefault?.toLocaleString('en-IN') || '20,000'}</p>
            </div>
          </div>
        </section>
      )}

      {/* Collectible Passport Stamps Layer */}
      <section className="panel" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <small className="eyebrow">COLLECTIBLE REWARDS</small>
            <h2 style={{ margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🛂</span> Passport Stamps
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
            {allStamps.length} Destination{allStamps.length === 1 ? '' : 's'} Unlocked
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 16px' }}>
          Stamps unlock as you explore destinations and save places to your itineraries.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
          {allStamps.map(cityName => (
            <HoloCard
              key={cityName}
              rarity={cityName === 'Goa' ? 'legendary' : 'rare'}
              badge="Passport"
            >
              <div
                style={{
                  border: '2px dashed var(--coral)',
                  borderRadius: '16px',
                  padding: '14px 10px',
                  textAlign: 'center',
                  background: 'color-mix(in srgb, var(--coral) 4%, var(--card))',
                  display: 'grid',
                  gap: '6px',
                  position: 'relative',
                  overflow: 'hidden',
                  height: '100%'
                }}
              >
                <span style={{ fontSize: '24px' }}>🏛️</span>
                <strong style={{ fontSize: '13px', color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {cityName}
                </strong>
                <small style={{ fontSize: '10px', color: 'var(--coral)', fontWeight: 700, letterSpacing: '0.06em' }}>
                  VERIFIED STAMP
                </small>
                <span style={{ fontSize: '9px', color: 'var(--muted)' }}>
                  {new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </HoloCard>
          ))}
          {/* Locked Stamp Teaser */}
          <div
            style={{
              border: '2px dashed var(--line)',
              borderRadius: '16px',
              padding: '14px 10px',
              textAlign: 'center',
              background: 'var(--paper)',
              display: 'grid',
              gap: '6px',
              opacity: 0.6
            }}
          >
            <span style={{ fontSize: '24px' }}>🔒</span>
            <strong style={{ fontSize: '12px', color: 'var(--muted)' }}>Next Journey</strong>
            <small style={{ fontSize: '10px', color: 'var(--muted)' }}>Explore to Unlock</small>
          </div>
        </div>
      </section>

      {/* Travel Stats */}
      <section className="panel" style={{ marginTop: '16px' }}>
        <h2>Travel Stats</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
          <div>
            <strong style={{ fontSize: '24px', color: 'var(--coral)' }}>{likedPlaces.length}</strong>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>Saved Places</p>
          </div>
          <div>
            <strong style={{ fontSize: '24px', color: 'var(--teal)' }}>{diary.length}</strong>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>Memories Logged</p>
          </div>
        </div>
      </section>

      {/* Reviews Shortcut */}
      <section className="panel profile-reviews-link" style={{ marginTop: '16px' }}>
        <div>
          <small className="eyebrow">YOUR EXPERIENCES</small>
          <h2>Travel reviews</h2>
          <p>Share ratings and tips on places and journeys you've experienced.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('reviews')}>Write or edit a review</Button>
      </section>
    </main>
  );
}

