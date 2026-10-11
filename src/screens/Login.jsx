import {supportedCities} from '../../data/city-collections.js';
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import Button from '../components/Button';
import fullLogo from '../../Full Logo.png';
import { hasFirebaseConfig } from '../../services/firebase-config.js';
import { interests } from '../lib/discovery.js';
import { modes, money } from '../lib/provider.js';

export default function Login({ navigate, onComplete }) {
  const s = useStore();
  const [step, setStep] = useState(1); // 1 = Account selection, 2 = Guided trip setup
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('guest');
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirectAvailable,setRedirectAvailable]=useState(false);

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
      if(!credential)return;
      const user = credential.user;
      s.login(user.displayName || user.email || 'Pico traveller', {
        uid: user.uid,
        provider: 'firebase',
        avatar: user.photoURL || ''
      });
      setAccountType('firebase');
      setStep(2);
    } catch (err) {
      const messages={'auth/unauthorized-domain':'Google sign-in is not enabled for this domain. Add this hostname to Firebase Authentication → Settings → Authorized domains, or continue as guest.','auth/popup-blocked':'Allow the Google sign-in popup, then try again. Guest mode is available below.','auth/popup-closed-by-user':'Sign-in was cancelled. Try again or continue as guest.','auth/operation-not-allowed':'Google sign-in is disabled in Firebase. Continue as guest.','auth/network-request-failed':'Sign-in could not reach Firebase. Check your connection and retry.'};
      setError(messages[err.code] || 'Google sign-in could not be completed. Retry or continue as guest.');
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = (useDefaults = false) => {
    if (!useDefaults) {
      if(!Number.isFinite(Number(budget))||Number(budget)<0){setError('Enter a non-negative budget.');return;}
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
    onComplete?.();
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
                <Button type="button" variant="ghost" onClick={async () => { try { if(s.user?.provider==='firebase'){const {signOut}=await import('../../services/auth.js');await signOut();}s.logout(); } catch {setError('Sign out failed. Try again.');} }}>
                  Sign Out
                </Button>
              </div>
            </div>
          )}

          <div className="account-choice-grid" style={{ display: 'grid', gap: '14px' }}>
            {/* Card 1: Guest Access */}
            <form onSubmit={continueAsGuest} className="login-card" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--line)', background: 'var(--card)', display: 'grid', gap: '12px', transition: 'border-color 0.2s, box-shadow 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: '32px', height: '32px', borderRadius: '10px', background: 'var(--line)', fontSize: '16px' }}>👤</span>
                  <strong style={{ fontSize: '15px' }}>Explore as Guest</strong>
                </div>
                <span className="status-tag status-cached">LOCAL ONLY</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                Instant access. Your plans and memories stay private on this device.
              </p>
              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Your Name (optional)
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Explorer Alex"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                />
              </label>
              <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '4px' }}>
                Continue as {name.trim() || 'Guest'} →
              </Button>
            </form>

            {/* Visual divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 4px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
            </div>

            {/* Card 2: Firebase Google Auth — Premium branded */}
            <div className="login-card" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--line)', background: 'var(--card)', display: 'grid', gap: '14px', transition: 'border-color 0.2s, box-shadow 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: '32px', height: '32px', borderRadius: '10px', background: '#e8f5e9', fontSize: '14px' }}>☁️</span>
                  <strong style={{ fontSize: '15px' }}>Continue with Google</strong>
                </div>
                <span className="status-tag status-live">CLOUD SYNC</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                Sign in to sync your trips, preferences, and diary across all your devices.
              </p>

              {/* Branded Google sign-in button */}
              <button
                type="button"
                disabled={!firebaseReady || loading}
                onClick={continueWithGoogle}
                className="google-signin-btn"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  border: '1px solid #dadce0',
                  background: '#fff',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: "'Plus Jakarta Sans', 'Roboto', sans-serif",
                  color: '#3c4043',
                  cursor: (!firebaseReady || loading) ? 'default' : 'pointer',
                  opacity: (!firebaseReady || loading) ? 0.55 : 1,
                  transition: 'background 0.2s, box-shadow 0.2s, border-color 0.2s',
                  minHeight: '48px',
                  position: 'relative',
                }}
              >
                {loading ? (
                  <>
                    <span className="google-spinner" style={{
                      display: 'inline-block', width: '20px', height: '20px',
                      border: '2.5px solid #dadce0', borderTopColor: '#4285f4',
                      borderRadius: '50%', animation: 'google-spin 0.7s linear infinite',
                    }} />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    {/* Official Google "G" logo SVG */}
                    <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              {/* Benefits list */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '2px 0' }}>
                {[
                  { icon: '🔄', text: 'Cross-device sync' },
                  { icon: '☁️', text: 'Cloud backup' },
                  { icon: '🔒', text: 'Secure & private' }
                ].map(b => (
                  <span key={b.text} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--muted)' }}>
                    <span style={{ fontSize: '13px' }}>{b.icon}</span>{b.text}
                  </span>
                ))}
              </div>

              {!firebaseReady && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  padding: '10px 12px', borderRadius: '12px',
                  background: 'color-mix(in srgb, var(--gold) 12%, var(--paper))',
                  border: '1px solid color-mix(in srgb, var(--gold) 30%, var(--line))',
                  fontSize: '11px', lineHeight: 1.5, color: 'var(--muted)'
                }}>
                  <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
                  <span>Google sign-in is loading or unavailable. Check your connection, or continue as a guest below.</span>
                </div>
              )}

              {error && (
                <div role="alert" style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  padding: '10px 12px', borderRadius: '12px',
                  background: '#fef2f2', border: '1px solid #fecaca',
                  fontSize: '12px', lineHeight: 1.5, color: '#991b1b'
                }}>
                  <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {redirectAvailable && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const { signInWithGoogle } = await import('../../services/auth.js');
                      await signInWithGoogle({ redirect: true });
                    } catch {
                      setError('Redirect sign-in could not start. Continue as guest.');
                      setLoading(false);
                    }
                  }}
                  style={{
                    padding: '10px 20px', borderRadius: '999px',
                    border: '1px solid var(--line)', background: 'var(--paper)',
                    fontSize: '12px', fontWeight: 600, color: 'var(--ink)',
                    cursor: loading ? 'default' : 'pointer',
                    opacity: loading ? 0.5 : 1, transition: 'background 0.2s',
                  }}
                >
                  Try Google redirect sign-in instead
                </button>
              )}
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

          <label>Destination<select value={city} onChange={event=>setCity(event.target.value)}>{supportedCities.map(name=><option key={name}>{name}</option>)}</select></label>
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

          {error&&<p role="alert">{error}</p>}
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
