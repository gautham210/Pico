import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../lib/store';
import { supportedCities } from '../../data/city-collections.js';
import Button from './Button';
import { PicoMascot } from './pico';
import { isSupabaseConfigured, savePreferences } from '../../services/supabase.js';

const TRAVEL_VIBES = [
  { id: 'relaxed', label: '🌿 Relaxed & Slow', desc: 'Unhurried wanderings' },
  { id: 'balanced', label: '⚖️ Balanced Flow', desc: 'Mix of sights & rest' },
  { id: 'packed', label: '⚡ Packed Schedule', desc: 'See everything possible' },
  { id: 'adventure', label: '🧗 Adventure & Trek', desc: 'Trails & outdoors' },
  { id: 'culture', label: '🏛️ Culture & Heritage', desc: 'Forts, history, museums' },
  { id: 'food', label: '🍜 Food Exploration', desc: 'Legendary eateries & cafes' },
  { id: 'nature', label: '🌴 Nature & Greenery', desc: 'Backwaters & hills' },
  { id: 'beach', label: '🌊 Waterfront & Coast', desc: 'Sunsets & breeze' },
  { id: 'art', label: '🎨 Art & Hidden Gems', desc: 'Biennale & street murals' },
  { id: 'nightlife', label: '🌙 Evening Strolls', desc: 'Night markets & seaside' },
  { id: 'accessible', label: '♿ Low-mobility Easy', desc: 'Step-free friendly paths' }
];

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: '🥗 Pure Vegetarian', desc: 'No meat, fish or poultry' },
  { id: 'vegan', label: '🌱 100% Plant-Based', desc: 'No animal products or dairy' },
  { id: 'eggetarian', label: '🥚 Eggetarian', desc: 'Vegetarian plus eggs' },
  { id: 'non-vegetarian', label: '🍗 Non-Vegetarian', desc: 'Seafood, poultry, all options' },
  { id: 'any', label: '🍽️ No Strong Preference', desc: 'Excited to try anything local' }
];

const ACCOMMODATION_TYPES = [
  { id: 'hotel', label: '🏨 Boutique Hotel', desc: 'Comfortable mid-tier stays' },
  { id: 'hostel', label: '🎒 Backpacker Hostel', desc: 'Social vibes & value' },
  { id: 'homestay', label: '🏡 Local Homestay', desc: 'Warm hospitality & food' },
  { id: 'resort', label: '🌴 Heritage Resort', desc: 'Scenic relaxation' },
  { id: 'guesthouse', label: '🛏️ Guesthouse / B&B', desc: 'Cozy and relaxed' },
  { id: 'apartment', label: '🏢 Serviced Apartment', desc: 'Kitchen & extra space' },
  { id: 'none', label: '❌ Already Arranged', desc: 'Do not budget for stay' },
  { id: 'flexible', label: '✨ Flexible Options', desc: 'Show best available stays' }
];

const TRANSPORT_MODES = [
  { id: 'public', label: '🚌 Public Transit & Ferry', icon: 'directions_bus' },
  { id: 'train', label: '🚆 Scenic Train', icon: 'train' },
  { id: 'rideshare', label: '🚕 Taxi / Tuk-Tuk / Auto', icon: 'local_taxi' },
  { id: 'self-drive', label: '🚗 Self-Drive / Rental', icon: 'directions_car' },
  { id: 'walking', label: '🚶 Walking & Cycling', icon: 'directions_walk' }
];

export default function OnboardingWizard({ onComplete, onBackToAuth }) {
  const s = useStore();
  const [stepIndex, setStepIndex] = useState(0);

  // Form State
  const [intent, setIntent] = useState('specific'); // 'specific' | 'surprise' | 'budget' | 'nearby'
  const [city, setCity] = useState(s.userPrefs?.city || 'Kochi');
  const [origin, setOrigin] = useState(s.userPrefs?.origin || 'Bengaluru');
  const [budgetMode, setBudgetMode] = useState('total'); // 'total' | 'per_person' | 'flexible'
  const [budgetAmount, setBudgetAmount] = useState(s.budgetEnvelope || 20000);
  const [travelers, setTravelers] = useState(s.userPrefs?.travelers || 2);
  const [days, setDays] = useState(s.userPrefs?.days || 3);
  const [startDate, setStartDate] = useState(s.userPrefs?.startDate || '');
  const [pace, setPace] = useState(s.userPrefs?.pace || 'balanced');
  const [vibes, setVibes] = useState(s.userPrefs?.vibes?.length ? s.userPrefs.vibes : ['culture', 'food', 'beach']);
  const [dietary, setDietary] = useState('any');
  const [foodNotes, setFoodNotes] = useState('');
  const [stayType, setStayType] = useState('homestay');
  const [includeStayInBudget, setIncludeStayInBudget] = useState(true);
  const [transports, setTransports] = useState(['public', 'rideshare', 'walking']);

  const steps = [
    { id: 'intent', title: 'Destination Intent', mood: 'welcoming' },
    { id: 'budget', title: 'Budget Envelope', mood: 'thinking' },
    { id: 'dates', title: 'Departure & Dates', mood: 'planning' },
    { id: 'style', title: 'Travel Style & Pace', mood: 'excited' },
    { id: 'food', title: 'Food & Dietary', mood: 'hungry' },
    { id: 'stay', title: 'Accommodation', mood: 'planning' },
    { id: 'transport', title: 'Getting Around', mood: 'curious' },
    { id: 'recap', title: 'Trip Blueprint', mood: 'proud' }
  ];

  const currentStep = steps[stepIndex];

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleFinalize();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    } else if (onBackToAuth) {
      onBackToAuth();
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const toggleVibe = (id) => {
    setVibes(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const toggleTransport = (id) => {
    setTransports(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleFinalize = async () => {
    const calculatedTotalBudget = budgetMode === 'flexible'
      ? 0
      : budgetMode === 'per_person'
      ? Number(budgetAmount) * Number(travelers)
      : Number(budgetAmount);

    const prefsPayload = {
      origin: origin.trim(),
      city,
      days: Number(days),
      travelers: Number(travelers),
      startDate,
      pace,
      vibes,
      dietary,
      foodNotes,
      stayType,
      includeStayInBudget,
      transports,
      budgetMode,
      perPersonBudget: budgetMode === 'per_person' ? Number(budgetAmount) : Math.round(calculatedTotalBudget / travelers),
      groupType: travelers === 1 ? 'Solo' : travelers === 2 ? 'Couple' : 'Friends',
      accessibility: {
        wheelchair: vibes.includes('accessible'),
        lowStairs: vibes.includes('accessible'),
        vegetarian: dietary === 'vegetarian' || dietary === 'vegan'
      }
    };

    s.setPrefs(prefsPayload);
    s.setBudget(calculatedTotalBudget);
    s.setMode(transports.includes('self-drive') ? 'fast' : 'convenient');
    s.updateProfile({
      travelStyle: pace === 'packed' ? 'Packed' : pace === 'relaxed' ? 'Relaxed' : 'Balanced',
      budgetDefault: calculatedTotalBudget
    });

    if (isSupabaseConfigured() && s.user?.uid) {
      try {
        await savePreferences({
          user_id: s.user.uid,
          home_city: origin.trim(),
          budget_tier: calculatedTotalBudget > 30000 ? 'lavish' : calculatedTotalBudget > 15000 ? 'balanced' : 'conservative',
          budget_default: calculatedTotalBudget,
          travel_pace: pace,
          vibes,
          dietary_preference: dietary,
          transport_preference: transports.join(','),
          accessibility_needs: vibes.includes('accessible') ? ['step_free'] : []
        });
      } catch (err) {
        console.warn('Could not sync preferences to cloud:', err);
      }
    }

    onComplete?.();
  };

  return (
    <div className="onboarding-wizard-container" style={{ width: '100%', maxWidth: '540px', margin: '0 auto', padding: '16px' }}>
      {/* Top Header & Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button
          type="button"
          onClick={handleBack}
          style={{ fontSize: '13px', color: 'var(--coral)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← {stepIndex === 0 ? 'Account' : 'Back'}
        </button>

        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--muted)', textTransform: 'uppercase' }}>
          STEP {stepIndex + 1} OF {steps.length}
        </span>

        {stepIndex < steps.length - 1 && (
          <button
            type="button"
            onClick={handleSkip}
            style={{ fontSize: '13px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            Skip
          </button>
        )}
      </div>

      {/* Progress Line */}
      <div style={{ height: '4px', width: '100%', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden', marginBottom: '20px' }}>
        <motion.div
          style={{ height: '100%', background: 'var(--coral)' }}
          animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Pico Mascot Speech Bubble */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
        <div style={{ flexShrink: 0 }}>
          <PicoMascot mood={currentStep.mood} size="sm" />
        </div>
        <div
          style={{
            flex: 1,
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '14px 18px',
            boxShadow: 'var(--elevation)',
            position: 'relative'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '-8px',
              top: '18px',
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderRight: '8px solid var(--card)'
            }}
          />
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px', color: 'var(--ink)' }}>
            {stepIndex === 0 && "Do you have a place in mind, or should we find somewhere together?"}
            {stepIndex === 1 && "How much are we planning to spend on this trip?"}
            {stepIndex === 2 && "Where are you setting off from, and when?"}
            {stepIndex === 3 && "What kind of tempo and vibe makes your heart race?"}
            {stepIndex === 4 && "Food is the soul of travel. What's on your plate?"}
            {stepIndex === 5 && "Where should we rest our wings at night?"}
            {stepIndex === 6 && "How do you prefer to get between stops?"}
            {stepIndex === 7 && "Here is our trip blueprint! Ready to explore?"}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
            {stepIndex === 0 && "Choose a destination or let me inspire you with curated regional secrets."}
            {stepIndex === 1 && "We track realistic activity costs, meals, and stays so you never overspend."}
            {stepIndex === 2 && "Helps me calculate intercity travel time and departure schedules."}
            {stepIndex === 3 && "We'll tailor the daily density of sights and rest breaks to your rhythm."}
            {stepIndex === 4 && "Dietary preferences directly shape the restaurant recommendations in your plan."}
            {stepIndex === 5 && "We can include accommodation in your budget envelope or leave it out."}
            {stepIndex === 6 && "We connect places using realistic transport times and verified paths."}
            {stepIndex === 7 && "You can adjust any choice now, or jump straight into the discovery deck."}
          </p>
        </div>
      </div>

      {/* Main Form Body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="panel"
          style={{ background: 'var(--card)', borderRadius: '24px', padding: '20px', border: '1px solid var(--line)', marginBottom: '20px' }}
        >
          {/* STEP A: DESTINATION INTENT */}
          {stepIndex === 0 && (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { id: 'specific', label: '📍 I know where to go', desc: 'Pick a destination' },
                  { id: 'surprise', label: '🎲 Surprise me', desc: 'Curated coastal adventure' },
                  { id: 'budget', label: '💰 Best for my budget', desc: 'Value-optimized' },
                  { id: 'nearby', label: '🧭 Explore nearby', desc: 'Closest gateway' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setIntent(opt.id);
                      if (opt.id === 'surprise') setCity('Kozhikode');
                      if (opt.id === 'nearby') setCity('Kochi');
                    }}
                    style={{
                      padding: '14px 12px',
                      borderRadius: '16px',
                      border: intent === opt.id ? '2px solid var(--coral)' : '1px solid var(--line)',
                      background: intent === opt.id ? 'color-mix(in srgb, var(--coral) 8%, var(--paper))' : 'var(--paper)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>{opt.label}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{opt.desc}</span>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                  Target Destination
                </label>
                <select
                  id="onboard-city-select"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1px solid var(--line)',
                    background: 'var(--paper)',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--ink)'
                  }}
                >
                  {supportedCities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <small style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginTop: '6px' }}>
                  Active travel database with verified pins: Kochi, Kozhikode, Bengaluru, Munnar, Mysuru, Goa.
                </small>
              </div>
            </div>
          )}

          {/* STEP B: BUDGET */}
          {stepIndex === 1 && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Budget Accounting Basis
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'total', label: 'Total Group' },
                    { id: 'per_person', label: 'Per Person' },
                    { id: 'flexible', label: 'Flexible / Open' }
                  ].map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBudgetMode(b.id)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: budgetMode === b.id ? '2px solid var(--coral)' : '1px solid var(--line)',
                        background: budgetMode === b.id ? 'color-mix(in srgb, var(--coral) 8%, var(--paper))' : 'var(--paper)',
                        color: budgetMode === b.id ? 'var(--coral)' : 'var(--ink)',
                        cursor: 'pointer'
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {budgetMode !== 'flexible' && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                    {budgetMode === 'per_person' ? 'Per-Person Budget Amount (₹)' : 'Total Trip Budget Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    value={budgetAmount}
                    onChange={e => setBudgetAmount(Math.max(0, Number(e.target.value)))}
                    step={1000}
                    min={0}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1px solid var(--line)',
                      background: 'var(--paper)',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      marginBottom: '10px'
                    }}
                  />
                  {/* Quick Presets */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[10000, 15000, 25000, 40000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBudgetAmount(val)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: 'var(--line)',
                          color: 'var(--ink)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        ₹{val.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                    Travellers
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={travelers}
                    onChange={e => setTravelers(Math.max(1, Number(e.target.value)))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                    Trip Duration (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={days}
                    onChange={e => setDays(Math.max(1, Number(e.target.value)))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '14px' }}
                  />
                </div>
              </div>

              {budgetMode === 'flexible' && (
                <div style={{ padding: '12px', borderRadius: '14px', background: 'color-mix(in srgb, var(--gold) 15%, var(--paper))', border: '1px solid var(--gold)', fontSize: '12px', color: 'var(--muted)' }}>
                  💡 <strong>Flexible Budget Mode:</strong> We won't enforce a hard spending ceiling. When you save places, we tally the realistic estimated cost from zero.
                </div>
              )}
            </div>
          )}

          {/* STEP C: DATES & STARTING POINT */}
          {stepIndex === 2 && (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                  Departure City / Origin
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                    placeholder="e.g. Bengaluru, Mumbai, Chennai"
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          () => setOrigin('Bengaluru'),
                          () => {}
                        );
                      }
                    }}
                    style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--line)', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    📍 Detect
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                    Destination
                  </label>
                  <input
                    type="text"
                    value={city}
                    disabled
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--line)', color: 'var(--ink)', fontSize: '13px', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP D: TRAVEL STYLE & PACE */}
          {stepIndex === 3 && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Daily Tempo
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'relaxed', label: '🌿 Relaxed', desc: '1-2 sights / day' },
                    { id: 'balanced', label: '⚖️ Balanced', desc: '2-3 sights + rest' },
                    { id: 'packed', label: '⚡ Packed', desc: 'Full exploration' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPace(p.id)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '12px',
                        border: pace === p.id ? '2px solid var(--coral)' : '1px solid var(--line)',
                        background: pace === p.id ? 'color-mix(in srgb, var(--coral) 8%, var(--paper))' : 'var(--paper)',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '12px', color: 'var(--ink)' }}>{p.label}</strong>
                      <small style={{ fontSize: '10px', color: 'var(--muted)' }}>{p.desc}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Affinities & Interests (Select all that fit)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {TRAVEL_VIBES.map(v => {
                    const active = vibes.includes(v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleVibe(v.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '14px',
                          border: active ? '1.5px solid var(--teal)' : '1px solid var(--line)',
                          background: active ? 'color-mix(in srgb, var(--teal) 10%, var(--paper))' : 'var(--paper)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 700, color: active ? 'var(--teal)' : 'var(--ink)' }}>
                          {v.label}
                        </span>
                        <small style={{ fontSize: '10px', color: 'var(--muted)' }}>
                          {v.desc}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP E: FOOD & DIETARY PREFERENCES */}
          {stepIndex === 4 && (
            <div style={{ display: 'grid', gap: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>
                Primary Dining Style
              </span>
              <div style={{ display: 'grid', gap: '8px' }}>
                {DIETARY_OPTIONS.map(d => {
                  const selected = dietary === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDietary(d.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        border: selected ? '2px solid var(--coral)' : '1px solid var(--line)',
                        background: selected ? 'color-mix(in srgb, var(--coral) 8%, var(--paper))' : 'var(--paper)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong style={{ display: 'block', fontSize: '13px', color: 'var(--ink)' }}>{d.label}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{d.desc}</span>
                      </div>
                      {selected && <span style={{ color: 'var(--coral)', fontWeight: 800 }}>✓</span>}
                    </button>
                  );
                })}
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                  Allergies, Cuisine Wishes or Preferences (Optional)
                </label>
                <input
                  type="text"
                  value={foodNotes}
                  onChange={e => setFoodNotes(e.target.value)}
                  placeholder="e.g. Nut allergy, love Malabar Biryani & filter coffee"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                />
              </div>
            </div>
          )}

          {/* STEP F: ACCOMMODATION */}
          {stepIndex === 5 && (
            <div style={{ display: 'grid', gap: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>
                Preferred Accommodation Category
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {ACCOMMODATION_TYPES.map(a => {
                  const selected = stayType === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setStayType(a.id)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: '14px',
                        border: selected ? '2px solid var(--teal)' : '1px solid var(--line)',
                        background: selected ? 'color-mix(in srgb, var(--teal) 8%, var(--paper))' : 'var(--paper)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                    >
                      <strong style={{ fontSize: '12px', color: 'var(--ink)' }}>{a.label}</strong>
                      <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{a.desc}</span>
                    </button>
                  );
                })}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '12px', background: 'var(--paper)', border: '1px solid var(--line)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeStayInBudget}
                  onChange={e => setIncludeStayInBudget(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--coral)' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--ink)', fontWeight: 600 }}>
                  Include estimated accommodation cost inside total trip budget envelope
                </span>
              </label>
            </div>
          )}

          {/* STEP G: TRANSPORT PREFERENCES */}
          {stepIndex === 6 && (
            <div style={{ display: 'grid', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>
                Preferred Travel Modes
              </span>
              <div style={{ display: 'grid', gap: '8px' }}>
                {TRANSPORT_MODES.map(t => {
                  const active = transports.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTransport(t.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        border: active ? '2px solid var(--coral)' : '1px solid var(--line)',
                        background: active ? 'color-mix(in srgb, var(--coral) 8%, var(--paper))' : 'var(--paper)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: active ? 'var(--coral)' : 'var(--muted)' }}>
                          {t.icon}
                        </span>
                        <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>{t.label}</strong>
                      </div>
                      {active && <span style={{ color: 'var(--coral)', fontWeight: 800 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP H: INTERACTIVE RECAP */}
          {stepIndex === 7 && (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Trip Summary
                </span>
                <span style={{ fontSize: '11px', color: 'var(--teal)', fontWeight: 700 }}>
                  Ready to launch
                </span>
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'var(--paper)', border: '1px solid var(--line)' }}>
                  <div>
                    <small style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>DESTINATION</small>
                    <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>{city} ({days} days)</strong>
                  </div>
                  <button type="button" onClick={() => setStepIndex(0)} style={{ fontSize: '11px', color: 'var(--coral)', fontWeight: 600 }}>Edit</button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'var(--paper)', border: '1px solid var(--line)' }}>
                  <div>
                    <small style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>BUDGET</small>
                    <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>
                      {budgetMode === 'flexible' ? 'Flexible Mode (Zero baseline)' : `₹${Number(budgetAmount).toLocaleString('en-IN')} (${budgetMode === 'per_person' ? 'per person' : 'total'})`}
                    </strong>
                  </div>
                  <button type="button" onClick={() => setStepIndex(1)} style={{ fontSize: '11px', color: 'var(--coral)', fontWeight: 600 }}>Edit</button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'var(--paper)', border: '1px solid var(--line)' }}>
                  <div>
                    <small style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>STYLE & DIET</small>
                    <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>
                      {pace.toUpperCase()} · {dietary.toUpperCase()}
                    </strong>
                  </div>
                  <button type="button" onClick={() => setStepIndex(3)} style={{ fontSize: '11px', color: 'var(--coral)', fontWeight: 600 }}>Edit</button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'var(--paper)', border: '1px solid var(--line)' }}>
                  <div>
                    <small style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>STAY & TRANSPORT</small>
                    <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>
                      {stayType.toUpperCase()} · {transports.slice(0, 2).join(', ').toUpperCase()}
                    </strong>
                  </div>
                  <button type="button" onClick={() => setStepIndex(5)} style={{ fontSize: '11px', color: 'var(--coral)', fontWeight: 600 }}>Edit</button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Primary Action Button */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
          style={{ width: '100%', minHeight: '48px', fontSize: '14px', fontWeight: 700 }}
        >
          {stepIndex === steps.length - 1 ? 'Start Discovering Places →' : 'Continue →'}
        </Button>
      </div>
    </div>
  );
}
