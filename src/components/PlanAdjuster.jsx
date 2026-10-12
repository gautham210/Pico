import { useState } from 'react';
import { useStore } from '../lib/store';
import { supportedCities } from '../../data/city-collections.js';
import { modes } from '../lib/provider';
import Button from './Button';

export default function PlanAdjuster({ isOpen, onClose, onPlanRegenerated }) {
  const s = useStore();
  const [prefs, setLocalPrefs] = useState({ ...s.userPrefs });
  const [budget, setLocalBudget] = useState(s.budgetEnvelope);
  const [mode, setLocalMode] = useState(s.mode);
  const [budgetMode, setBudgetMode] = useState(s.userPrefs?.budgetMode || 'fixed');
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    s.setPrefs({
      ...prefs,
      budgetMode
    });
    s.setBudget(budgetMode === 'flexible' ? 0 : Number(budget) || 20000);
    s.setMode(mode);
    setFeedback('Trip preferences updated! Recalculating itinerary…');
    setTimeout(() => {
      setFeedback('');
      if (onPlanRegenerated) onPlanRegenerated();
      if (onClose) onClose();
    }, 600);
  };

  const paces = [
    { id: 'relaxed', label: 'Relaxed (1–2 stops/day, 60m pauses)' },
    { id: 'balanced', label: 'Balanced (2–3 stops/day, 30m pauses)' },
    { id: 'full', label: 'Packed (3–4 stops/day, 15m pauses)' }
  ];

  const diets = [
    { id: 'any', label: 'No strong preference' },
    { id: 'vegetarian', label: 'Vegetarian 🌿' },
    { id: 'vegan', label: 'Vegan 🌱' },
    { id: 'non-vegetarian', label: 'Non-Vegetarian 🍗' }
  ];

  const stays = [
    { id: 'hotel', label: 'Hotel' },
    { id: 'homestay', label: 'Homestay' },
    { id: 'hostel', label: 'Backpacker Hostel' },
    { id: 'resort', label: 'Resort' },
    { id: 'none', label: 'No accommodation needed' }
  ];

  return (
    <div className="plan-adjuster-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="plan-adjuster-sheet" style={{ background: 'var(--bg, #FAF7F2)', width: '100%', maxWidth: '540px', maxHeight: '88vh', overflowY: 'auto', borderRadius: '24px 24px 0 0', padding: '20px 20px 40px', boxShadow: '0 -4px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <small className="eyebrow">CUSTOMIZE TRIP ARCHITECTURE</small>
            <h2 style={{ margin: '2px 0 0', fontSize: '20px' }}>Adjust Trip Plan</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '8px' }}>
            ✕
          </button>
        </div>

        {feedback && (
          <div role="status" style={{ padding: '8px 12px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '13px', marginBottom: '14px' }}>
            {feedback}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Destination */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            Destination City
            <select
              value={prefs.city}
              onChange={e => setLocalPrefs({ ...prefs, city: e.target.value })}
              style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}
            >
              {supportedCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          {/* Dates & Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
              Days (Duration)
              <input
                type="number"
                min="1"
                max="7"
                value={prefs.days}
                onChange={e => setLocalPrefs({ ...prefs, days: Number(e.target.value) })}
                style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
              Travelers
              <input
                type="number"
                min="1"
                max="12"
                value={prefs.travelers}
                onChange={e => setLocalPrefs({ ...prefs, travelers: Number(e.target.value) })}
                style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}
              />
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            Departure Date
            <input
              type="date"
              value={prefs.startDate}
              onChange={e => setLocalPrefs({ ...prefs, startDate: e.target.value })}
              style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}
            />
          </label>

          {/* Budget Mode */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Budget Mode</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`pref-pill ${budgetMode === 'fixed' ? 'active' : ''}`}
                onClick={() => setBudgetMode('fixed')}
                style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '12px' }}
              >
                Fixed Envelope
              </button>
              <button
                type="button"
                className={`pref-pill ${budgetMode === 'flexible' ? 'active' : ''}`}
                onClick={() => setBudgetMode('flexible')}
                style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '12px' }}
              >
                Flexible Zero-Baseline
              </button>
            </div>
            {budgetMode === 'fixed' && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', marginTop: '4px' }}>
                Total Budget per person (₹)
                <input
                  type="number"
                  step="500"
                  min="1000"
                  value={budget}
                  onChange={e => setLocalBudget(e.target.value)}
                  style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}
                />
              </label>
            )}
          </div>

          {/* Daily Pace */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Daily Travel Pace</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {paces.map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="pace"
                    checked={prefs.pace === p.id}
                    onChange={() => setLocalPrefs({ ...prefs, pace: p.id })}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          {/* Dietary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Dietary & Food Focus</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {diets.map(d => (
                <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="dietary"
                    checked={(prefs.dietary || 'any') === d.id}
                    onChange={() => setLocalPrefs({ ...prefs, dietary: d.id })}
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>

          {/* Stay Type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Accommodation Preference</span>
            <select
              value={prefs.stayType || 'hotel'}
              onChange={e => setLocalPrefs({ ...prefs, stayType: e.target.value })}
              style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}
            >
              {stays.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          {/* Transport Mode */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Intercity Transit Mode</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {Object.entries(modes).map(([id, m]) => (
                <button
                  key={id}
                  type="button"
                  className={`pref-pill ${mode === id ? 'active' : ''}`}
                  onClick={() => setLocalMode(id)}
                  style={{ flex: 1, padding: '8px', fontSize: '11px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
                >
                  <strong>{m.name}</strong>
                  <span>{m.vehicle}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="actions" style={{ marginTop: '12px' }}>
            <Button type="submit">Save & Update Itinerary</Button>
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
