import { useStore } from '../lib/store';
import Button from '../components/Button';
import { useState } from 'react';
import { modes } from '../lib/provider';

export default function Profile({ navigate }) {
  const { profile, updateProfile, logout, diary, likedPlaces } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(profile);
  const [error, setError] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    if(!editForm.displayName.trim()||!Number.isFinite(editForm.budgetDefault)||editForm.budgetDefault<0){setError('Enter a name and a non-negative budget.');return;}
    updateProfile({...editForm,displayName:editForm.displayName.trim()});
    setIsEditing(false);
  };

  const chooseAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/png','image/jpeg','image/webp'].includes(f.type) || f.size > 2 * 1024 * 1024) {
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

  return (
    <main className="journey">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <small className="eyebrow">Local profile</small>
          <h1>Profile</h1>
        </div>
        <Button variant="ghost" onClick={() => { logout(); navigate('login'); }}>Sign Out</Button>
      </div>

      <section className="panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {profile.avatar ? (
          <img src={profile.avatar} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '40px', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h2>{profile.displayName}</h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>Demo — this device only</p>
        </div>
      </section>

      {isEditing ? (
        <form className="panel" onSubmit={handleSave}>
          <h2>Edit Profile</h2>
          <label>Display Name
            <input type="text" value={editForm.displayName} onChange={e => setEditForm({...editForm, displayName: e.target.value})} required />
          </label>
          <label>Profile Avatar
            <input type="file" accept="image/*" onChange={chooseAvatar} />
          </label>
          {error && <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
          
          <label>Preferred Travel Style
            <select value={editForm.travelStyle} onChange={e => setEditForm({...editForm, travelStyle: e.target.value})}>
              <option value="Conservative">Conservative</option>
              <option value="Balanced">Balanced</option>
              <option value="Lavish">Lavish</option>
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
            <input type="number" value={editForm.budgetDefault} onChange={e => setEditForm({...editForm, budgetDefault: Number(e.target.value)})} />
          </label>

          <div className="actions" style={{ marginTop: '16px' }}>
            <Button type="submit">Save Changes</Button>
            <Button variant="ghost" onClick={() => setIsEditing(false)} type="button">Cancel</Button>
          </div>
        </form>
      ) : (
        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2>Travel Preferences</h2>
            <Button variant="secondary" onClick={() => {setEditForm(profile);setError('');setIsEditing(true);}}>Edit</Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div>
              <small className="eyebrow">Style</small>
              <p>{profile.travelStyle}</p>
            </div>
            <div>
              <small className="eyebrow">Transport</small>
              <p>{modes[profile.transportMode]?.name || 'Convenient'}</p>
            </div>
            <div>
              <small className="eyebrow">Default Budget</small>
              <p>₹{profile.budgetDefault.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </section>
      )}

      <section className="panel" style={{ marginTop: '16px' }}>
        <h2>Travel Stats</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <strong>{likedPlaces.length}</strong>
            <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Saved Places</p>
          </div>
          <div>
            <strong>{diary.length}</strong>
            <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Memories Logged</p>
          </div>
        </div>
      </section>

      <section className="panel profile-reviews-link">
        <div><small className="eyebrow">Your experience</small><h2>Travel reviews</h2><p>Keep a private trip or place review on this device. Public publishing is unavailable until a backend is configured.</p></div>
        <Button variant="secondary" onClick={() => navigate('reviews')}>Write or edit a review</Button>
      </section>

    </main>
  );
}
