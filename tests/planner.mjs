import assert from 'node:assert/strict';
import {validatePlannerInput} from '../server/planner/validate.js';
import {scopeAndFilterPlaces} from '../server/planner/places.js';
import {calculatePlannerBudget} from '../server/planner/budget.js';
import {estimateTravelLeg, buildTravelLegs} from '../server/planner/routes.js';
import {generateDeterministicPlan} from '../server/planner/fallback.js';
import {callAiPlanner} from '../server/planner/ai-provider.js';
import {orchestratePlan} from '../server/planner/index.js';
import planHandler from '../api/plan.js';

// Setup in-memory localStorage for store verification
const storage = new Map();
globalThis.localStorage = {
  getItem: k => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, v),
  removeItem: k => storage.delete(k)
};

const {useStore, committed, unknownPlaceCosts, activeTripPlaces} = await import('../src/lib/store.js');

async function invoke(handler, req) {
  let status = 200, body = null;
  const res = {
    status(code) { status = code; return this; },
    json(value) { body = value; return value; },
    setHeader() {}
  };
  await handler(req, res);
  return { status, body };
}

const sampleKochiPlaces = [
  { id: 'kochi-fort', name: 'Fort Kochi', city: 'Kochi', category: 'heritage', cost: 1200, time: 90, coords: [9.965, 76.242], caveat: 'Crowded on weekends.' },
  { id: 'kochi-mattancherry', name: 'Mattancherry Palace', city: 'Kochi', category: 'culture', cost: 800, time: 60, coords: [9.958, 76.259], caveat: 'Closed on Fridays.' },
  { id: 'kochi-marine', name: 'Marine Drive', city: 'Kochi', category: 'nature', cost: null, time: 75, coords: [9.980, 76.275], caveat: 'Humid in midday.' }
];

const foreignGoaPlace = {
  id: 'goa-baga', name: 'Baga Beach', city: 'Goa', category: 'beach', cost: 500, time: 90, coords: [15.555, 73.751], caveat: 'Traffic congestion.'
};

console.log('--- Testing AI Planning Engine (Phase 1) ---');

// 1. Input Validation
{
  assert.equal(validatePlannerInput(null).valid, false);
  assert.equal(validatePlannerInput('not-an-object').valid, false);
  assert.equal(validatePlannerInput({}).valid, false, 'Missing destination must fail');

  const valid = validatePlannerInput({
    destination: 'Kochi',
    days: 5,
    travelers: 2,
    budget: 30000,
    startDate: '2026-11-01',
    pace: 'relaxed',
    vibes: ['heritage', 'nature'],
    savedPlaces: sampleKochiPlaces,
    mode: 'convenient'
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.data.destination, 'Kochi');
  assert.equal(valid.data.days, 5);
  assert.equal(valid.data.travelers, 2);
  assert.equal(valid.data.budget, 30000);
  assert.equal(valid.data.pace, 'relaxed');
  assert.equal(valid.data.savedPlaces.length, 3);

  // Clamping and normalization
  const clamped = validatePlannerInput({
    destination: 'Goa',
    days: 99,
    travelers: 0,
    budget: -500,
    startDate: 'invalid-date'
  });
  assert.equal(clamped.valid, true);
  assert.equal(clamped.data.days, 7, 'Days clamped to max 7');
  assert.equal(clamped.data.travelers, 1, 'Travelers clamped to min 1');
  assert.equal(clamped.data.budget, 20000, 'Negative budget defaults safely');
  assert.equal(clamped.data.startDate, null, 'Invalid date set to null');
  console.log('PASS: Input validation and normalization');
}

// 2. Destination Scoping and Constraint Filtering
{
  const scoped = scopeAndFilterPlaces({
    destination: 'Kochi',
    destinations: ['Kochi'],
    multiCity: false,
    savedPlaces: [...sampleKochiPlaces, foreignGoaPlace],
    rejectedPlaces: ['kochi-mattancherry'],
    constraints: { avoidCategories: ['culture'] }
  });

  assert.equal(scoped.places.length, 2, 'Foreign Goa place and rejected Mattancherry excluded');
  assert.ok(scoped.places.every(p => p.city === 'Kochi'), 'All places scoped to Kochi');
  assert.ok(scoped.warnings.some(w => w.includes('Filtered out 1 saved place')), 'Destination isolation warning emitted');
  assert.ok(scoped.warnings.some(w => w.includes('Excluded rejected place')), 'Rejected place warning emitted');
  console.log('PASS: Destination isolation and constraint filtering');
}

// 3. Route and Distance Estimation (Honest, No Invented Navigation)
{
  const leg = estimateTravelLeg(sampleKochiPlaces[0], sampleKochiPlaces[1]);
  assert.ok(leg, 'Travel leg estimated');
  assert.ok(leg.distanceKm > 0, 'Distance computed via coordinates');
  assert.ok(leg.durationMinutes > 0, 'Duration computed');
  assert.equal(leg.status, 'ESTIMATED');
  assert.match(leg.note, /driving profile/);

  // Leg with place missing coordinates
  const noCoordsPlace = { id: 'x', name: 'No Coords', coords: null };
  const fallbackLeg = estimateTravelLeg(sampleKochiPlaces[0], noCoordsPlace);
  assert.equal(fallbackLeg.distanceKm, null, 'Missing coordinates returns null distance');
  assert.equal(fallbackLeg.status, 'ESTIMATED');
  assert.match(fallbackLeg.note, /coordinates unverified/);

  const legs = buildTravelLegs(sampleKochiPlaces);
  assert.equal(legs.length, 2, '2 travel legs for 3 consecutive stops');
  console.log('PASS: Honest travel route and duration estimation');
}

// 4. Budget Arithmetic and Unknown Costs
{
  const budgetCalc = calculatePlannerBudget({
    budget: 20000,
    travelers: 2,
    mode: 'convenient',
    stops: sampleKochiPlaces // 1200 + 800 + null + convenient transport 1800 = 3800
  });

  assert.equal(budgetCalc.budget.knownPlaceCost, 2000);
  assert.equal(budgetCalc.budget.transportCost, 1800);
  assert.equal(budgetCalc.budget.totalPlannedCost, 3800);
  assert.equal(budgetCalc.budget.remainingBudget, 16200);
  assert.equal(budgetCalc.budget.unknownCostCount, 1, 'Marine Drive price is null/unknown');
  assert.equal(budgetCalc.budget.group.totalPlannedCost, 3800 * 2);
  assert.equal(budgetCalc.transport.liveInventoryAvailable, false, 'No fabricated live inventory claimed');
  assert.ok(budgetCalc.warnings.some(w => w.includes('unverified prices')), 'Unknown prices warning emitted');
  console.log('PASS: Budget arithmetic and unknown-cost tracking');
}

// 5. Deterministic Fallback Engine
{
  const fallbackPlan = generateDeterministicPlan({
    destination: 'Kochi',
    days: 2,
    travelers: 1,
    budget: 20000,
    pace: 'balanced',
    mode: 'convenient',
    startDate: '2026-11-01',
    vibes: ['heritage']
  }, sampleKochiPlaces);

  assert.equal(fallbackPlan.source, 'DETERMINISTIC_FALLBACK');
  assert.equal(fallbackPlan.model, null);
  assert.equal(fallbackPlan.days.length, 2);
  assert.ok(fallbackPlan.days[0].stops.length > 0);
  assert.ok(fallbackPlan.days[0].stops[0].fitReason, 'Stop has fitReason');
  assert.ok(fallbackPlan.days[0].theme, 'Day has descriptive theme');
  assert.equal(fallbackPlan.provenance.method, 'deterministic_rule_engine');
  assert.equal(fallbackPlan.transport.liveInventoryAvailable, false);
  console.log('PASS: Deterministic fallback planning engine');
}

// 6. Orchestrator with No AI Credentials (Clean Fallback)
{
  delete process.env.GEMINI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const result = await orchestratePlan({
    destination: 'Kochi',
    days: 3,
    travelers: 1,
    budget: 20000,
    savedPlaces: sampleKochiPlaces
  });

  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.source, 'DETERMINISTIC_FALLBACK');
  assert.equal(result.model, null);
  assert.ok(result.days.length > 0);
  assert.equal(result.provenance.aiConfigured, false);
  console.log('PASS: Orchestrator falls back cleanly without AI credentials');
}

// 7. Mocked AI Integration and Output Validation
{
  const originalFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'mock-gemini-test-secret-key-12345';

  try {
    // 7A: Successful AI generation
    globalThis.fetch = async (url, options) => {
      assert.match(url, /gemini-2\.5-flash/);
      return new Response(JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                days: [
                  {
                    day: 1,
                    theme: 'Historic Fort & Culture',
                    stops: [
                      { id: 'kochi-fort', visitMinutes: 100, fitReason: 'Perfect start to explore colonial history.' },
                      { id: 'kochi-mattancherry', visitMinutes: 60, fitReason: 'Murals and royal history nearby.' }
                    ]
                  },
                  {
                    day: 2,
                    theme: 'Waterfront Promenade',
                    stops: [
                      { id: 'kochi-marine', visitMinutes: 75, fitReason: 'Sunset views along the harbour.' }
                    ]
                  }
                ],
                warnings: []
              })
            }]
          }
        }]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    const aiPlan = await orchestratePlan({
      destination: 'Kochi',
      days: 2,
      travelers: 1,
      budget: 20000,
      savedPlaces: sampleKochiPlaces
    });

    assert.equal(aiPlan.status, 'SUCCESS');
    assert.equal(aiPlan.source, 'AI_PLAN');
    assert.equal(aiPlan.model, 'gemini-2.5-flash');
    assert.equal(aiPlan.provenance.aiConfigured, true);
    assert.equal(aiPlan.days.length, 2);
    assert.equal(aiPlan.days[0].stops[0].fitReason, 'Perfect start to explore colonial history.');
    assert.equal(JSON.stringify(aiPlan).includes('mock-gemini-test-secret-key-12345'), false, 'AI secret must be redacted');

    // 7B: Hallucinated stop IDs rejected -> graceful fallback
    globalThis.fetch = async () => new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              days: [{
                day: 1,
                theme: 'Invented Place',
                stops: [{ id: 'hallucinated-invented-hotel', visitMinutes: 60, fitReason: 'Never in saved places.' }]
              }]
            })
          }]
        }
      }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const hallucinationFallback = await orchestratePlan({
      destination: 'Kochi',
      days: 2,
      savedPlaces: sampleKochiPlaces
    });

    assert.equal(hallucinationFallback.status, 'SUCCESS');
    assert.equal(hallucinationFallback.source, 'DETERMINISTIC_FALLBACK', 'Must fall back when AI hallucinates stop ID');
    assert.ok(hallucinationFallback.provenance.fallbackReason.includes('HALLUCINATED_PLACE') || hallucinationFallback.provenance.fallbackReason.includes('unknown place ID'));

    // 7C: Provider timeout / network failure -> graceful fallback
    globalThis.fetch = async () => { throw new Error('AI connection timed out'); };

    const timeoutFallback = await orchestratePlan({
      destination: 'Kochi',
      days: 2,
      savedPlaces: sampleKochiPlaces
    });

    assert.equal(timeoutFallback.status, 'SUCCESS');
    assert.equal(timeoutFallback.source, 'DETERMINISTIC_FALLBACK', 'Must fall back on provider error');
    assert.ok(timeoutFallback.provenance.fallbackReason.includes('timed out'));

    console.log('PASS: Mocked AI provider generation, validation, and error recovery');
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.GEMINI_API_KEY;
  }
}

// 8. API Route Handler Contract
{
  const getReq = await invoke(planHandler, { method: 'GET', body: {} });
  assert.equal(getReq.status, 405, 'GET method rejected');

  const invalidPost = await invoke(planHandler, { method: 'POST', body: {} });
  assert.equal(invalidPost.status, 400, 'Empty POST body rejected');

  const validPost = await invoke(planHandler, {
    method: 'POST',
    body: { destination: 'Kochi', days: 2, savedPlaces: sampleKochiPlaces }
  });
  assert.equal(validPost.status, 200);
  assert.equal(validPost.body.status, 'SUCCESS');
  assert.ok(validPost.body.days.length > 0);
  console.log('PASS: API route handler contract (405, 400, 200)');
}

// 9. Store Integration, Manual Edits, and Session Isolation
{
  const getS = () => useStore.getState();

  // Fresh session starts with null plan
  getS().startGuestSession('Plan Tester', { city: 'Kochi' });
  assert.equal(getS().itineraryPlan, null, 'Clean guest session starts with null itineraryPlan');

  // Like sample places
  sampleKochiPlaces.forEach(p => getS().likePlace(p));
  assert.equal(getS().likedPlaces.length, 3);

  // Set an AI itinerary plan in store
  const mockPlan = {
    status: 'SUCCESS',
    source: 'AI_PLAN',
    model: 'gemini-2.5-flash',
    days: [
      {
        day: 1,
        theme: 'Day 1 Theme',
        stops: [
          { ...sampleKochiPlaces[0], fitReason: 'AI reason 1' },
          { ...sampleKochiPlaces[1], fitReason: 'AI reason 2' }
        ]
      },
      {
        day: 2,
        theme: 'Day 2 Theme',
        stops: [
          { ...sampleKochiPlaces[2], fitReason: 'AI reason 3' }
        ]
      }
    ]
  };

  getS().setItineraryPlan(mockPlan);
  assert.equal(getS().itineraryPlan.source, 'AI_PLAN');
  assert.equal(getS().itineraryPlan.days[0].stops[0].fitReason, 'AI reason 1');

  // Manual reorder preserves plan and marks as manually modified
  getS().movePlace(sampleKochiPlaces[1].id, -1);
  assert.equal(getS().itineraryPlan.manuallyModified, true, 'Manual move marks plan as modified');
  assert.equal(getS().likedPlaces[0].id, sampleKochiPlaces[1].id, 'Liked places reordered');

  // Manual remove preserves plan and updates stops
  getS().removePlace(sampleKochiPlaces[0].id);
  assert.equal(getS().likedPlaces.length, 2);
  const remainingStopsInPlan = getS().itineraryPlan.days.flatMap(d => d.stops);
  assert.ok(!remainingStopsInPlan.some(p => p.id === sampleKochiPlaces[0].id), 'Removed place gone from plan');

  // Persistence across rehydration
  await useStore.persist.rehydrate();
  assert.ok(getS().itineraryPlan, 'Itinerary plan persisted and rehydrated');
  assert.equal(getS().itineraryPlan.source, 'AI_PLAN');

  // New guest session isolation: resets everything cleanly
  getS().startGuestSession('Another Guest', { city: 'Goa' });
  assert.equal(getS().itineraryPlan, null, 'Second guest session has clean null plan');
  assert.equal(getS().likedPlaces.length, 0, 'Second guest session has 0 liked places');

  console.log('PASS: Store integration, manual edit preservation, and session isolation');
}

console.log('ALL PLANNER TESTS PASSED SUCCESSFULLY.');
