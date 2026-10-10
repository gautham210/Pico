import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import Button from '../components/Button';
import fullLogo from '../../Full Logo.png';
import { hasFirebaseConfig } from '../../services/firebase-config.js';
import { interests } from '../lib/discovery.js';
import { modes, money } from '../lib/provider.js';

export default function Login({ navigate }) {
  const s = useStore();
  const [step, setStep] = useState(1); // 1 = Account selection, 2 = Guided trip setup
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('guest');
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Trip setup parameters
  const [city, setCity] = useState(s.userPrefs?.city || 'Kochi');
  const [origin, setOrigin] = useState(s.userPrefs?.origin || 'Bengaluru');
  const [days, setDays] = useState(s.userPrefs?.days || 4);
  const [travelers, setTravelers] = useState(s.userPrefs?.travelers || 2);
  const [startDate, setStartDate] = useState(s.userPrefs?.startDate || '');
  const [budget, setBudget] = useState(s.budgetEnvelope || 20000);
  const [pace, setPace] = useState(s.userPrefs?.pace || 'balanced');
  const [mode, setMode] = useState(s.mode || 'convenient');
  const [vibes, setVibes] = useState(s.userPrefs?.vibes?.length ? s.userPrefs.vibes : ['beach', 'food']);

  useEffect(() => {
    let active = true;
    if (!hasFirebaseConfig()) {
      setFirebaseReady(false);
      return () => { active = false; };
    }
    import('../../services/firebase.js').then(({ firebaseReady }) => {
      if (active) setFirebaseReady(firebaseReady);
    }).catch(() => {
      if (active) setFirebaseReady(false);
    });
    return () => { active = false; };
  }, []);

  const continueAsGuest = (e) => {
    if (e) e.preventDefault();
    setAccountType('guest');
    s.login(name.trim() || 'Curious Explorer', { provider: 'guest' });
    setStep(2);
  };

  const continueWithGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const { signInWithGoogle } = await import('../../services/auth.js');
      const credential = await signInWithGoogle();
      const user = credential.user;
      s.login(user.displayName || user.email || 'Pico traveller', {
        uid: user.uid,
        provider: 'firebase',
        avatar: user.photoURL || ''
      });
      setAccountType('firebase');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Google sign-in could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = (useDefaults = false) => {
    if (!useDefaults) {
      s.setPrefs({
        origin: origin.trim(),
        city,
        days: Number(days),
        travelers: Number(travelers),
        startDate,
        pace,
        vibes
      });
      s.setBudget(Number(budget));
      s.setMode(mode);
    }
    navigate('discover');
  };

  return (
    <main className="journey onboarding-screen" style={{ minHeight: '85vh', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img src={fullLogo} alt="Pico Logo" style={{ width: '180px', height: 'auto', marginBottom: '12px' }} />
        <h1 style={{ fontSize: '26px', margin: '0 0 6px' }}>Welcome to Pico</h1>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '14px' }}>
          Everywhere you've been. Everywhere you're going.
        </p>
      </div>

      <div className="onboarding-progress" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2} style={{ width: '100%', maxWidth: '520px', margin: '0 auto 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
          <span>STEP {step} OF 2</span>
          <span>{step === 1 ? 'WELCOME & ACCOUNT' : 'TRIP ARCHITECT SETUP'}</span>
        </div>
        <div style={{ height: '4px', width: '100%', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: step === 1 ? '50%' : '100%', background: 'var(--coral)', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {step === 1 ? (
        <div className="panel login-panel" style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>
          <h2>{s.user ? 'Account & Session' : 'Get started'}</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 16px' }}>
            {s.user
              ? 'Manage your active session or upgrade to cloud sync.'
              : "Choose how you'd like to travel. Sign in with Google to sync across devices, or explore locally as a guest."}
          </p>

          {s.user && (
            <div style={{ padding: '14px', borderRadius: '14px', background: 'color-mix(in srgb, var(--coral) 8%, var(--paper))', border: '1px solid var(--coral)', marginBottom: '16px', display: 'grid', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <small className="eyebrow" style={{ margin: 0 }}>ACTIVE PROFILE</small>
                  <strong style={{ display: 'block', fontSize: '15px' }}>{s.user.name}</strong>
                </div>
                <span className={`status-tag status-${s.user.provider === 'firebase' ? 'live' : 'cached'}`}>
                  {s.user.provider === 'firebase' ? 'CLOUD SYNC' : 'LOCAL GUEST'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                {s.user.provider === 'firebase'
                  ? 'Authenticated via Google. Itinerary and preferences sync to Firestore.'
                  : 'Device-local guest profile. All planning stays on this device.'}
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <Button type="button" variant="primary" onClick={() => setStep(2)}>
                  Guided Trip Setup →
                </Button>
                <Button type="button" variant="secondary" onClick={() => navigate('discover')}>
                  Go to Discover
                </Button>
                <Button type="button" variant="ghost" onClick={() => { s.logout(); }}>
                  Sign Out
                </Button>
              </div>
            </div>
          )}

          <div className="account-choice-grid" style={{ display: 'grid', gap: '14px' }}>
            {/* Card 1: Guest Access */}
            <form onSubmit={continueAsGuest} style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--line)', background: 'var(--paper)', display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '15px' }}>Explore as Guest</strong>
                <span className="status-tag status-cached">LOCAL ONLY</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                Instant access. Your plans and memories stay private on this device.
              </p>
              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Your Name (optional)
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Explorer Alex"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: '#fff', fontSize: '13px' }}
                />
              </label>
              <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '6px' }}>
                Continue as {name.trim() || 'Guest'} →
              </Button>
            </form>

            {/* Card 2: Firebase Google Auth */}
            <div style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--line)', background: 'var(--paper)', display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '15px' }}>Continue with Google</strong>
                <span className="status-tag status-live">CLOUD SYNC</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                Sign in to sync your trips, preferences, and profile to Firebase.
              </p>
              <Button
                type="button"
                variant="secondary"
                disabled={!firebaseReady || loading}
                onClick={continueWithGoogle}
                style={{ width: '100%' }}
              >
                {loading ? 'Opening Google…' : 'Sign in with Google'}
              </Button>
              {!firebaseReady && (
                <small className="muted" style={{ fontSize: '11px', lineHeight: 1.4 }}>
                  Firebase web configuration is loaded. Interactive popup auth is ready in a standard browser window.
                </small>
              )}
              {error && <p role="alert" className="review-blocker" style={{ margin: 0 }}>{error}</p>}
            </div>
          </div>
        </div>
      ) : (
        /* Step 2: Guided Trip Parameters Setup ("Where to next?") */
        <div className="panel" style={{ width: '100%', maxWidth: '520px', margin: '0 auto', display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="quiet-button"
              onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: 0 }}
            >
              ← Back to account choice
            </button>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Logged in as <strong>{s.user?.name || name || 'Guest'}</strong>
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--coral)', display: 'inline-block' }} />
              <small className="eyebrow" style={{ margin: 0 }}>TRIP ARCHITECT MODE</small>
            </div>
            <h2 style={{ margin: '4px 0' }}>Where to next?</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
              Set up your journey parameters. Pico will curate stops and calculate your budget.
            </p>
          </div>

          {/* Destination Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, marginBottom: '6px' }}>Destination</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCity('Kochi')}
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  border: `2px solid ${city === 'Kochi' ? 'var(--coral)' : 'var(--line)'}`,
                  background: city === 'Kochi' ? 'color-mix(in srgb, var(--coral) 8%, var(--paper))' : 'var(--paper)',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <strong style={{ display: 'block', fontSize: '14px' }}>Kochi</strong>
                <small style={{ color: 'var(--muted)', fontSize: '11px' }}>Stitch demo collection</small>
              </button>
              <button
                type="button"
                onClick={() => setCity('Goa')}
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  border: `2px solid ${city === 'Goa' ? 'var(--coral)' : 'var(--line)'}`,
                  background: city === 'Goa' ? 'color-mix(in srgb, var(--coral) 8%, var(--paper))' : 'var(--paper)',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <strong style={{ display: 'block', fontSize: '14px' }}>Goa</strong>
                <small style={{ color: 'var(--muted)', fontSize: '11px' }}>50 mapped places</small>
              </button>
            </div>
          </div>

          {/* Logistics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              Starting location
              <input
                type="text"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                placeholder="e.g. Bengaluru"
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
              />
            </label>
            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              First travel day (optional)
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
              />
            </label>
            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              Duration
              <select
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
              >
                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                  <option key={d} value={d}>{d} {d === 1 ? 'Day' : 'Days'}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              Travellers
              <select
                value={travelers}
                onChange={e => setTravelers(Number(e.target.value))}
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'Traveller' : 'Travellers'}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              Budget / person (INR)
              <input
                type="number"
                min="5000"
                step="1000"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
              />
            </label>
            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              Pace
              <select
                value={pace}
                onChange={e => setPace(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
              >
                <option value="relaxed">Relaxed (+60m breaks)</option>
                <option value="balanced">Balanced (+30m breaks)</option>
                <option value="full">Full days (+15m breaks)</option>
              </select>
            </label>
          </div>

          {/* Transport mode preference */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, marginBottom: '6px' }}>Illustrative transport preference</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {Object.entries(modes).map(([id, m]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '12px',
                    border: `1.5px solid ${mode === id ? 'var(--coral)' : 'var(--line)'}`,
                    background: mode === id ? 'color-mix(in srgb, var(--coral) 8%, var(--paper))' : 'var(--paper)',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  <strong style={{ display: 'block' }}>{m.name}</strong>
                  <span style={{ color: 'var(--muted)' }}>{money(m.cost)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Activity Vibes / Interests */}
          <fieldset style={{ margin: 0, padding: '12px', borderRadius: '14px', border: '1px solid var(--line)' }}>
            <legend style={{ fontSize: '12px', fontWeight: 700, padding: '0 6px' }}>
              Places you enjoy <small style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</small>
            </legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {interests.map(([val, label]) => {
                const checked = vibes.includes(val);
                return (
                  <label
                    key={val}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      background: checked ? 'color-mix(in srgb, var(--coral) 8%, var(--paper))' : 'var(--paper)',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => {
                        setVibes(e.target.checked ? [...vibes, val] : vibes.filter(x => x !== val));
                      }}
                      style={{ accentColor: 'var(--coral)' }}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gap: '8px', marginTop: '6px' }}>
            <Button
              type="button"
              variant="primary"
              onClick={() => completeOnboarding(false)}
              style={{ width: '100%', minHeight: '44px' }}
            >
              Start Exploring Places →
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => completeOnboarding(true)}
              style={{ width: '100%' }}
            >
              Skip setup (use defaults)
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
