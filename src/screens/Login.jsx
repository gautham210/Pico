import { supportedCities } from '../../data/city-collections.js';
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import Button from '../components/Button';
import fullLogo from '../../Full Logo.png';
import birdOnly from '../../Bird Only.png';
import { interests } from '../lib/discovery.js';
import { modes, money } from '../lib/provider.js';
import {
  isSupabaseConfigured,
  signInWithEmail,
  signUpWithEmail,
  signInWithPhoneOtp,
  verifyPhoneOtp,
  signInWithGoogle as signInWithGoogleSupabase,
  requestPasswordReset,
  savePreferences,
  saveProfile
} from '../../services/supabase.js';

export default function Login({ navigate, onComplete }) {
  const s = useStore();
  const [step, setStep] = useState(1); // 1 = Account selection, 2 = Travel preferences
  const [authMethod, setAuthMethod] = useState('menu'); // 'menu' | 'email' | 'phone' | 'guest'
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  // Trip setup parameters
  const [city, setCity] = useState(s.userPrefs?.city || 'Kochi');
  const [origin, setOrigin] = useState(s.userPrefs?.origin || 'Bengaluru');
  const [days, setDays] = useState(s.userPrefs?.days || 4);
  const [travelers, setTravelers] = useState(s.userPrefs?.travelers || 2);
  const [startDate, setStartDate] = useState(s.userPrefs?.startDate || '');
  const [budget, setBudget] = useState(s.budgetEnvelope || 20000);
  const [spendingStyle, setSpendingStyle] = useState(s.profile?.travelStyle || 'Balanced');
  const [groupType, setGroupType] = useState('Friends'); // Solo | Friends | Couple | Family
  const [pace, setPace] = useState(s.userPrefs?.pace || 'balanced');
  const [mode, setMode] = useState(s.mode || 'convenient');
  const [vibes, setVibes] = useState(s.userPrefs?.vibes?.length ? s.userPrefs.vibes : ['beach', 'food']);
  const [accessibility, setAccessibility] = useState({ wheelchair: false, lowStairs: false, vegetarian: false });

  const hasCloud = isSupabaseConfigured();

  // Helper for logging in and checking guest migration
  const handleAuthenticatedUser = (userData) => {
    const hasGuestDraft = s.user?.provider === 'guest' && (s.likedPlaces?.length > 0 || s.diary?.length > 0);
    if (hasGuestDraft) {
      setPendingUser(userData);
      setShowMigrationPrompt(true);
    } else {
      finalizeLogin(userData, false);
    }
  };

  const finalizeLogin = async (userData, shouldMigrateGuest) => {
    s.login(userData.name, {
      uid: userData.uid,
      provider: userData.provider || 'supabase',
      avatar: userData.avatar || '',
      email: userData.email || '',
      phone: userData.phone || ''
    });

    if (hasCloud && userData.uid) {
      try {
        await saveProfile({
          id: userData.uid,
          display_name: userData.name,
          avatar_url: userData.avatar || '',
          travel_style: spendingStyle
        });
      } catch {}
    }

    if (!shouldMigrateGuest && s.user?.provider === 'guest') {
      // User chose to start fresh
      s.setItineraryPlan(null);
    }

    setShowMigrationPrompt(false);
    setPendingUser(null);
    setStep(2);
  };

  // 1. Continue with Google
  const continueWithGoogle = async () => {
    setLoading(true);
    setError('');
    setStatusMessage('');
    try {
      if (hasCloud) {
        const { error: gError } = await signInWithGoogleSupabase();
        if (gError) throw gError;
      } else {
        // Fallback: If Firebase is present, try it; otherwise provide clean demo cloud profile
        try {
          const { signInWithGoogle: fbSignIn } = await import('../../services/auth.js');
          const credential = await fbSignIn();
          if (credential?.user) {
            handleAuthenticatedUser({
              name: credential.user.displayName || 'Google Explorer',
              uid: credential.user.uid,
              provider: 'firebase',
              avatar: credential.user.photoURL || '',
              email: credential.user.email || ''
            });
            return;
          }
        } catch {
          // Cloud auth unconfigured simulation
          handleAuthenticatedUser({
            name: 'Demo Traveller (Google)',
            uid: `demo-google-${Date.now()}`,
            provider: 'demo',
            avatar: '',
            email: 'demo@pico.travel'
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Google sign-in could not be completed. Check credentials or continue as guest.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Email Auth
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email.trim() || (!password && authMode !== 'forgot')) {
      setError('Please provide all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    setStatusMessage('');

    try {
      if (authMode === 'forgot') {
        const { error: resetError } = await requestPasswordReset(email.trim());
        if (resetError) throw resetError;
        setStatusMessage('Password reset link sent to your email. Check your inbox.');
        setLoading(false);
        return;
      }

      if (authMode === 'signup') {
        const displayName = name.trim() || email.split('@')[0];
        const res = await signUpWithEmail(email.trim(), password, displayName);
        if (res.error) throw res.error;
        if (res.user) {
          handleAuthenticatedUser({
            name: displayName,
            uid: res.user.id,
            provider: 'supabase',
            email: res.user.email
          });
        } else {
          setStatusMessage('Account created! Please check your email to verify your address.');
        }
      } else {
        // Sign in
        const res = await signInWithEmail(email.trim(), password);
        if (res.error) throw res.error;
        if (res.user) {
          handleAuthenticatedUser({
            name: res.user.user_metadata?.display_name || email.split('@')[0],
            uid: res.user.id,
            provider: 'supabase',
            email: res.user.email
          });
        }
      }
    } catch (err) {
      if (!hasCloud) {
        // Graceful fallback for local development without active Supabase credentials
        handleAuthenticatedUser({
          name: name.trim() || email.split('@')[0] || 'Local Explorer',
          uid: `local-${Date.now()}`,
          provider: 'local',
          email: email.trim()
        });
      } else {
        setError(err.message || 'Authentication error. Please check your details and retry.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Phone OTP Auth
  const handleSendPhoneOtp = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setError('Please enter a valid phone number with country code (e.g. +91 9876543210).');
      return;
    }
    setLoading(true);
    setError('');
    setStatusMessage('');

    try {
      if (hasCloud) {
        const { error: otpError } = await signInWithPhoneOtp(cleanPhone);
        if (otpError) throw otpError;
        setOtpSent(true);
        setStatusMessage(`Verification code sent to ${cleanPhone}.`);
      } else {
        // Demo simulation when SMS gateway not configured
        setOtpSent(true);
        setStatusMessage(`[Demo Mode] Simulated SMS sent to ${cleanPhone}. Enter code 123456 below.`);
      }
    } catch (err) {
      setError(err.message || 'Could not send SMS code. Please check number format and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError('Enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (hasCloud) {
        const { data, error: vError } = await verifyPhoneOtp(phone.trim(), otpCode.trim());
        if (vError) throw vError;
        handleAuthenticatedUser({
          name: name.trim() || `Traveller ${phone.slice(-4)}`,
          uid: data?.user?.id || `phone-${Date.now()}`,
          provider: 'supabase',
          phone: phone.trim()
        });
      } else {
        // Demo verification
        handleAuthenticatedUser({
          name: name.trim() || `Traveller ${phone.slice(-4)}`,
          uid: `phone-demo-${Date.now()}`,
          provider: 'demo',
          phone: phone.trim()
        });
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Guest Mode
  const continueAsGuest = (e) => {
    if (e) e.preventDefault();
    s.startGuestSession(name.trim() || 'Curious Explorer', { city, budget, pace });
    setStep(2);
  };

  // 5. Complete Step 2 Onboarding
  const completeOnboarding = async (useDefaults = false) => {
    if (!useDefaults) {
      if (!Number.isFinite(Number(budget)) || Number(budget) < 0) {
        setError('Enter a non-negative budget.');
        return;
      }
      const prefsPayload = {
        origin: origin.trim(),
        city,
        days: Number(days),
        travelers: Number(travelers),
        startDate,
        pace,
        vibes,
        spendingStyle,
        groupType,
        accessibility
      };

      s.setPrefs(prefsPayload);
      s.setBudget(Number(budget));
      s.setMode(mode);
      s.updateProfile({ travelStyle: spendingStyle, budgetDefault: Number(budget) });

      if (hasCloud && s.user?.uid) {
        try {
          await savePreferences({
            user_id: s.user.uid,
            home_city: origin.trim(),
            budget_tier: spendingStyle.toLowerCase(),
            budget_default: Number(budget),
            travel_pace: pace,
            vibes,
            group_type: groupType.toLowerCase(),
            transport_preference: mode,
            dietary_preference: accessibility.vegetarian ? 'vegetarian' : 'any',
            accessibility_needs: [
              accessibility.wheelchair ? 'wheelchair' : null,
              accessibility.lowStairs ? 'low_stairs' : null
            ].filter(Boolean)
          });
        } catch {}
      }
    }
    onComplete?.();
    navigate('discover');
  };

  return (
    <main className="journey onboarding-screen" style={{ minHeight: '85vh', justifyContent: 'center' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img src={fullLogo} alt="Pico Logo" style={{ width: '180px', height: 'auto', marginBottom: '8px' }} />
        <h1 style={{ fontSize: '26px', margin: '0 0 6px', fontWeight: 800, letterSpacing: '-0.02em' }}>Welcome to Pico</h1>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '14px' }}>
          Real places. Budget-aware plans. Live group travel.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="onboarding-progress" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2} style={{ width: '100%', maxWidth: '520px', margin: '0 auto 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
          <span>STEP {step} OF 2</span>
          <span>{step === 1 ? 'IDENTITY & SYNC' : 'TRAVEL PREFERENCES'}</span>
        </div>
        <div style={{ height: '4px', width: '100%', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: step === 1 ? '50%' : '100%', background: 'var(--coral)', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* STEP 1: AUTHENTICATION */}
      {step === 1 ? (
        <div className="panel login-panel" style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>
          {/* Active Profile Banner if already signed in */}
          {s.user && (
            <div style={{ padding: '14px', borderRadius: '16px', background: 'color-mix(in srgb, var(--coral) 8%, var(--paper))', border: '1px solid var(--coral)', marginBottom: '16px', display: 'grid', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <small className="eyebrow" style={{ margin: 0 }}>ACTIVE PROFILE</small>
                  <strong style={{ display: 'block', fontSize: '15px' }}>{s.user.name}</strong>
                </div>
                <span className={`status-tag status-${s.user.provider === 'guest' ? 'cached' : 'live'}`}>
                  {s.user.provider === 'guest' ? 'LOCAL GUEST' : 'CLOUD SYNC'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                {s.user.provider === 'guest'
                  ? 'Device-local guest profile. All planning stays on this device.'
                  : `Signed in via ${s.user.provider}. Itinerary, preferences, and group rides sync to Supabase.`}
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <Button type="button" variant="primary" onClick={() => setStep(2)}>
                  Trip Preferences →
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

          {/* Guest Migration Modal Prompt */}
          {showMigrationPrompt && (
            <div style={{ padding: '16px', borderRadius: '16px', background: '#eff6ff', border: '1.5px solid #3b82f6', marginBottom: '16px', display: 'grid', gap: '10px' }} role="dialog" aria-labelledby="migration-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📦</span>
                <strong id="migration-title" style={{ fontSize: '15px', color: '#1e3a8a' }}>Migrate your guest draft?</strong>
              </div>
              <p style={{ fontSize: '13px', color: '#1e40af', margin: 0, lineHeight: 1.45 }}>
                You have {s.likedPlaces.length} place(s) saved from your guest session. Would you like to link them to your authenticated account, or start with a fresh cloud trip?
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <Button type="button" variant="primary" onClick={() => finalizeLogin(pendingUser, true)}>
                  Keep & Migrate Draft
                </Button>
                <Button type="button" variant="secondary" onClick={() => finalizeLogin(pendingUser, false)}>
                  Start Fresh Trip
                </Button>
              </div>
            </div>
          )}

          <h2>{s.user ? 'Switch Account or Sign In' : 'Get Started'}</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 16px' }}>
            Choose how you'd like to travel. Sign in with Google, Email, or Phone to sync across devices and access live group rides, or explore locally as a guest.
          </p>

          {/* Status and Error Alerts */}
          {statusMessage && (
            <div role="status" style={{ padding: '10px 14px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '12px', color: '#166534', marginBottom: '12px' }}>
              ✓ {statusMessage}
            </div>
          )}
          {error && (
            <div role="alert" style={{ padding: '10px 14px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '12px', color: '#991b1b', marginBottom: '12px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Cloud Provider Indicator */}
          {!hasCloud && (
            <div style={{ padding: '8px 12px', borderRadius: '12px', background: 'color-mix(in srgb, var(--gold) 15%, var(--paper))', border: '1px solid color-mix(in srgb, var(--gold) 35%, var(--line))', fontSize: '11px', color: 'var(--muted)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>ℹ️</span>
              <span>Cloud keys unconfigured in this environment. Local guest and demo sign-in modes are active.</span>
            </div>
          )}

          {/* AUTH VIEW 1: Main Menu Options */}
          {authMethod === 'menu' && (
            <div className="account-choice-grid" style={{ display: 'grid', gap: '12px' }}>
              {/* Google Sign In */}
              <button
                type="button"
                id="login-google-btn"
                disabled={loading}
                onClick={continueWithGoogle}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  borderRadius: '999px',
                  border: '1px solid #dadce0',
                  background: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#3c4043',
                  cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Continue with Email */}
              <button
                type="button"
                id="login-email-btn"
                onClick={() => { setAuthMethod('email'); setError(''); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px 20px',
                  borderRadius: '999px',
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  cursor: 'pointer'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>mail</span>
                <span>Continue with Email & Password</span>
              </button>

              {/* Continue with Phone */}
              <button
                type="button"
                id="login-phone-btn"
                onClick={() => { setAuthMethod('phone'); setError(''); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px 20px',
                  borderRadius: '999px',
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  cursor: 'pointer'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sms</span>
                <span>Continue with Phone Number</span>
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '4px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
              </div>

              {/* Guest Card */}
              <form onSubmit={continueAsGuest} style={{ padding: '16px', borderRadius: '18px', border: '1px solid var(--line)', background: 'var(--card)', display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'grid', placeItems: 'center', width: '30px', height: '30px', borderRadius: '8px', background: 'var(--line)', fontSize: '15px' }}>👤</span>
                    <strong style={{ fontSize: '14px' }}>Explore as Guest</strong>
                  </div>
                  <span className="status-tag status-cached">LOCAL ONLY</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.45 }}>
                  Instant access. Your plans stay private on this device without cloud sync.
                </p>
                <input
                  type="text"
                  id="guest-name-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your Name (e.g. Explorer Alex)"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                />
                <Button type="submit" variant="secondary" id="continue-guest-btn" style={{ width: '100%' }}>
                  Continue as {name.trim() || 'Guest'} →
                </Button>
              </form>
            </div>
          )}

          {/* AUTH VIEW 2: Email Sign In / Sign Up */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailAuth} style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('menu'); setError(''); }}
                  style={{ fontSize: '12px', color: 'var(--coral)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  ← All sign in options
                </button>
                <div style={{ display: 'flex', gap: '4px', background: 'var(--line)', padding: '2px', borderRadius: '999px' }}>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signin'); setError(''); }}
                    style={{
                      padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                      background: authMode === 'signin' ? 'var(--card)' : 'transparent',
                      color: authMode === 'signin' ? 'var(--ink)' : 'var(--muted)'
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setError(''); }}
                    style={{
                      padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                      background: authMode === 'signup' ? 'var(--card)' : 'transparent',
                      color: authMode === 'signup' ? 'var(--ink)' : 'var(--muted)'
                    }}
                  >
                    Create Account
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                  Display Name
                  <input
                    type="text"
                    id="signup-name-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Maya Rao"
                    required
                    style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                  />
                </label>
              )}

              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Email Address
                <input
                  type="email"
                  id="email-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                />
              </label>

              {authMode !== 'forgot' && (
                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                  Password
                  <input
                    type="password"
                    id="password-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                  />
                </label>
              )}

              {authMode === 'signin' && (
                <div style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('forgot'); setError(''); }}
                    style={{ fontSize: '11px', color: 'var(--coral)', fontWeight: 600 }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button type="submit" variant="primary" id="email-submit-btn" disabled={loading} style={{ width: '100%', minHeight: '44px' }}>
                {loading ? 'Processing…' : authMode === 'signup' ? 'Create Account & Continue →' : authMode === 'forgot' ? 'Send Reset Link' : 'Sign In →'}
              </Button>
            </form>
          )}

          {/* AUTH VIEW 3: Phone OTP */}
          {authMethod === 'phone' && (
            <div style={{ display: 'grid', gap: '14px' }}>
              <button
                type="button"
                onClick={() => { setAuthMethod('menu'); setError(''); setOtpSent(false); }}
                style={{ fontSize: '12px', color: 'var(--coral)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                ← All sign in options
              </button>

              {!otpSent ? (
                <form onSubmit={handleSendPhoneOtp} style={{ display: 'grid', gap: '12px' }}>
                  <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                    Mobile Number
                    <input
                      type="tel"
                      id="phone-input"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                      style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                    />
                  </label>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0 }}>
                    We'll send a 6-digit one-time code via SMS. Standard carrier rates may apply.
                  </p>
                  <Button type="submit" variant="primary" id="send-otp-btn" disabled={loading} style={{ width: '100%', minHeight: '44px' }}>
                    {loading ? 'Sending code…' : 'Send Verification Code'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhoneOtp} style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <small style={{ fontSize: '12px', color: 'var(--muted)' }}>Code sent to {phone}</small>
                    <button type="button" onClick={() => setOtpSent(false)} style={{ fontSize: '11px', color: 'var(--coral)', fontWeight: 600 }}>Change number</button>
                  </div>
                  <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                    Enter 6-digit Code
                    <input
                      type="text"
                      id="otp-code-input"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      required
                      style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '18px', letterSpacing: '4px', textAlign: 'center' }}
                    />
                  </label>
                  <Button type="submit" variant="primary" id="verify-otp-btn" disabled={loading} style={{ width: '100%', minHeight: '44px' }}>
                    {loading ? 'Verifying…' : 'Verify & Sign In →'}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Privacy & Recovery note */}
          <p style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', margin: '16px 0 0', lineHeight: 1.45 }}>
            By continuing, you agree to Pico's Terms of Service and Privacy Policy. Guest sessions remain isolated on this device.
          </p>
        </div>
      ) : (
        /* STEP 2: TRAVEL PREFERENCES & ONBOARDING */
        <div className="panel" style={{ width: '100%', maxWidth: '540px', margin: '0 auto', display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              id="back-to-step-1"
              onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: 0 }}
            >
              ← Back to account choice
            </button>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Welcome, <strong>{s.user?.name || name || 'Explorer'}</strong>
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--coral)', display: 'inline-block' }} />
              <small className="eyebrow" style={{ margin: 0 }}>PERSONALIZED TRAVEL DNA</small>
            </div>
            <h2 style={{ margin: '4px 0 2px', fontSize: '20px' }}>Tell Pico your travel style</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
              These preferences tailor destination recommendations, budget envelopes, and live itineraries.
            </p>
          </div>

          {/* Destination & Departure */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              First Destination
              <select
                id="prefs-city-select"
                value={city}
                onChange={e => setCity(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
              >
                {supportedCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              Home City / Origin
              <input
                type="text"
                id="prefs-origin-input"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                placeholder="e.g. Bengaluru"
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
              />
            </label>
          </div>

          {/* Group Type & Spending Style */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              Travel Group
              <select
                id="prefs-group-select"
                value={groupType}
                onChange={e => setGroupType(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
              >
                <option value="Solo">Solo Explorer</option>
                <option value="Friends">Friends Convoy</option>
                <option value="Couple">Couple Getaway</option>
                <option value="Family">Family Journey</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              Spending Style
              <select
                id="prefs-spending-select"
                value={spendingStyle}
                onChange={e => {
                  setSpendingStyle(e.target.value);
                  if (e.target.value === 'Conservative') setBudget(12000);
                  if (e.target.value === 'Balanced') setBudget(20000);
                  if (e.target.value === 'Lavish') setBudget(40000);
                }}
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
              >
                <option value="Conservative">Conservative (Value first)</option>
                <option value="Balanced">Balanced (Comfort & experience)</option>
                <option value="Lavish">Lavish (Premium stays & dining)</option>
              </select>
            </label>
          </div>

          {/* Budget, Duration, Travellers, Pace */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              Budget / person (INR)
              <input
                type="number"
                id="prefs-budget-input"
                min="3000"
                step="1000"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
              />
            </label>

            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              Travel Pace
              <select
                id="prefs-pace-select"
                value={pace}
                onChange={e => setPace(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
              >
                <option value="relaxed">Relaxed (+60m breaks)</option>
                <option value="balanced">Balanced (+30m breaks)</option>
                <option value="full">Full days (+15m breaks)</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              Duration
              <select
                id="prefs-days-select"
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
                id="prefs-travelers-select"
                value={travelers}
                onChange={e => setTravelers(Number(e.target.value))}
                style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'Traveller' : 'Travellers'}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Transport mode preference */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, marginBottom: '6px' }}>
              Preferred Travel Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {Object.entries(modes).map(([id, m]) => (
                <button
                  key={id}
                  type="button"
                  id={`mode-btn-${id}`}
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
              Places you love exploring
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

          {/* Dietary & Accessibility Preferences (Optional) */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'var(--paper)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--line)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={accessibility.vegetarian}
                onChange={e => setAccessibility({ ...accessibility, vegetarian: e.target.checked })}
                style={{ accentColor: 'var(--teal)' }}
              />
              Vegetarian dining focus
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'var(--paper)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--line)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={accessibility.wheelchair}
                onChange={e => setAccessibility({ ...accessibility, wheelchair: e.target.checked })}
                style={{ accentColor: 'var(--teal)' }}
              />
              Wheelchair accessibility
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'var(--paper)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--line)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={accessibility.lowStairs}
                onChange={e => setAccessibility({ ...accessibility, lowStairs: e.target.checked })}
                style={{ accentColor: 'var(--teal)' }}
              />
              Low-stair / easy walking
            </label>
          </div>

          {error && <p role="alert" style={{ color: '#991b1b', fontSize: '12px' }}>{error}</p>}

          {/* Action Buttons */}
          <div style={{ display: 'grid', gap: '8px', marginTop: '6px' }}>
            <Button
              type="button"
              variant="primary"
              id="start-exploring-btn"
              onClick={() => completeOnboarding(false)}
              style={{ width: '100%', minHeight: '44px' }}
            >
              Start Exploring Places →
            </Button>
            <Button
              type="button"
              variant="ghost"
              id="skip-onboarding-btn"
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

