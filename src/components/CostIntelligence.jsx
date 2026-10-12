import { useStore, committed, activeTripPlaces, unknownPlaceCosts } from '../lib/store';
import { modes, money } from '../lib/provider';
import Button from './Button';

export default function CostIntelligence({ onAdjustPlan }) {
  const s = useStore();
  const activePlaces = activeTripPlaces(s);
  const unknownCount = unknownPlaceCosts(s);
  const travelers = Math.max(1, Number(s.userPrefs?.travelers) || 1);
  const days = Math.max(1, Number(s.userPrefs?.days) || 3);
  const mode = modes[s.mode] || modes.convenient;

  // Breakdown Calculations
  const intercityCost = mode.cost;
  const localTransferCost = (s.routeExtra || 0) + (activePlaces.length > 2 ? (activePlaces.length - 1) * 60 : 0);
  
  // Accommodation: if selected stay is booked, use its rate; else estimated based on tier
  const stayCostPerNight = s.selectedAccommodation?.cost || 1800;
  const nights = Math.max(1, days - 1);
  const accommodationTotal = s.userPrefs?.stayType === 'none' ? 0 : stayCostPerNight * nights;

  // Food & Dining: sum of meals or daily food allowance (e.g. 600 INR/day/person)
  const mealsSum = activePlaces.filter(p => p.isMeal || p.category === 'Foodie').reduce((sum, p) => sum + (Number.isFinite(p.cost) ? p.cost : 400), 0);
  const foodEstimate = mealsSum > 0 ? mealsSum : days * 550;

  // Attractions & Activities: places that are not meals or stays
  const activityPlaces = activePlaces.filter(p => !p.isMeal && !p.isAccommodation && p.category !== 'Foodie');
  const attractionsTotal = activityPlaces.reduce((sum, p) => sum + (Number.isFinite(p.cost) ? p.cost : 0), 0);

  // Contingency Buffer (8%)
  const subtotal = intercityCost + localTransferCost + (accommodationTotal / travelers) + foodEstimate + attractionsTotal;
  const contingency = Math.round(subtotal * 0.08);

  const totalPerPerson = Math.round(subtotal + contingency);
  const groupTotal = totalPerPerson * travelers;
  const envelope = s.budgetEnvelope;
  const isOverBudget = envelope > 0 && totalPerPerson > envelope;
  const budgetMode = s.userPrefs?.budgetMode || 'fixed';

  const categories = [
    {
      id: 'intercity',
      name: 'Intercity Transport',
      icon: 'flight_takeoff',
      amount: intercityCost,
      status: 'ESTIMATE',
      note: `${mode.name} (${mode.vehicle})`
    },
    {
      id: 'local',
      name: 'Local Transport & Transfers',
      icon: 'local_taxi',
      amount: localTransferCost,
      status: s.routeExtra > 0 ? 'ADJUSTED' : 'ESTIMATE',
      note: s.routeDelay > 0 ? `Includes +${s.routeDelay}m delay` : 'Autos, ferries & transfers'
    },
    {
      id: 'stay',
      name: 'Accommodation & Stays',
      icon: 'hotel',
      amount: s.userPrefs?.stayType === 'none' ? 0 : Math.round(accommodationTotal / travelers),
      status: s.selectedAccommodation ? 'CONFIRMED_CHOICE' : 'ESTIMATE',
      note: s.selectedAccommodation ? s.selectedAccommodation.name : `${nights} night(s) estimate`
    },
    {
      id: 'food',
      name: 'Food & Regional Dining',
      icon: 'restaurant',
      amount: foodEstimate,
      status: 'ESTIMATE',
      note: `${s.userPrefs?.dietary || 'Flexible'} dietary preference`
    },
    {
      id: 'attractions',
      name: 'Attractions & Heritage Admissions',
      icon: 'museum',
      amount: attractionsTotal,
      status: 'VERIFIED_FEES',
      note: `${activityPlaces.length} activity stop(s)`
    },
    {
      id: 'contingency',
      name: 'Contingency & Incidentals (8%)',
      icon: 'savings',
      amount: contingency,
      status: 'BUFFER',
      note: 'Emergency & unexpected fares'
    }
  ];

  return (
    <section className="panel cost-intelligence-card" style={{ marginTop: '16px' }}>
      <div className="row spread" style={{ marginBottom: '8px' }}>
        <div>
          <small className="eyebrow">PICO COST INTELLIGENCE · WHERE THE MONEY GOES</small>
          <h2 style={{ margin: '2px 0 0', fontSize: '20px' }}>Trip Cost Model</h2>
        </div>
        <span className={`status-tag ${isOverBudget ? 'status-danger' : 'status-live'}`}>
          {budgetMode === 'flexible' ? 'ZERO-BASELINE TALLY' : isOverBudget ? 'EXCEEDS BUDGET' : 'WITHIN BUDGET'}
        </span>
      </div>

      <div className="cost-summary-tiles" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', margin: '12px 0' }}>
        <div className="cost-tile" style={{ padding: '10px 12px', borderRadius: '12px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border)' }}>
          <small style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Per Traveller</small>
          <div style={{ fontSize: '20px', fontWeight: 700, color: isOverBudget ? '#ef4444' : 'var(--ink)' }}>
            {money(totalPerPerson)}
          </div>
          <small style={{ fontSize: '11px', color: 'var(--muted)' }}>
            {envelope > 0 ? `${money(Math.max(0, envelope - totalPerPerson))} remaining` : 'Flexible zero baseline'}
          </small>
        </div>

        <div className="cost-tile" style={{ padding: '10px 12px', borderRadius: '12px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border)' }}>
          <small style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Group Total ({travelers}p)</small>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>
            {money(groupTotal)}
          </div>
          <small style={{ fontSize: '11px', color: 'var(--muted)' }}>{days} days · {nights} nights</small>
        </div>
      </div>

      {isOverBudget && (
        <div style={{ padding: '10px 14px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', marginBottom: '14px', fontSize: '13px', color: '#991b1b' }}>
          <strong>⚠️ Budget advisory:</strong> Your planned stops and transit exceed your {money(envelope)} envelope by {money(totalPerPerson - envelope)}.
          Consider switching to <em>Cheapest</em> transit ({modes.cheapest.name}: {money(modes.cheapest.cost)}) or adjusting your pace.
          {onAdjustPlan && (
            <div style={{ marginTop: '8px' }}>
              <Button variant="secondary" onClick={onAdjustPlan} style={{ fontSize: '12px', minHeight: '30px' }}>
                Adjust Trip Parameters →
              </Button>
            </div>
          )}
        </div>
      )}

      {unknownCount > 0 && (
        <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '4px 0 12px' }}>
          ℹ️ {unknownCount} stop(s) have unverified pricing and are excluded from commitments until confirmed.
        </p>
      )}

      {/* Itemized Categories */}
      <div className="cost-breakdown-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {categories.map(cat => {
          const percent = Math.min(100, Math.round((cat.amount / Math.max(1, totalPerPerson)) * 100));
          return (
            <div key={cat.id} className="cost-cat-row" style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--coral)' }}>{cat.icon}</span>
                  {cat.name}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{money(cat.amount)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--muted)' }}>
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${percent}%`, height: '100%', background: 'var(--teal)', borderRadius: '2px' }} />
                </div>
                <span>{percent}%</span>
                <span>· {cat.note}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
