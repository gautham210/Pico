import {buildTravelLegs} from './routes.js';
import {calculatePlannerBudget} from './budget.js';

const breakMinutesByPace = {
  relaxed: 60,
  balanced: 30,
  full: 15
};

const inboundMinutesByMode = {
  cheapest: 320,
  convenient: 160,
  fastest: 70
};

function generateFitReason(place, pace, vibes) {
  const cat = (place.category || '').toLowerCase();
  const matchedVibe = vibes.find(v => cat.includes(v) || (place.name || '').toLowerCase().includes(v));

  if (matchedVibe) {
    return `Matches your "${matchedVibe}" interest · curated ${place.category || 'destination'}.`;
  }

  if (/beach|coast|sea/.test(cat)) {
    return pace === 'relaxed'
      ? 'A scenic shoreline stop tailored for an unhurried coastal afternoon.'
      : 'Popular coastal landmark integrated smoothly into your active day.';
  }
  if (/fort|heritage|histor|museum|church|temple/.test(cat)) {
    return 'Historic exploration site offering rich cultural context and scenic vistas.';
  }
  if (/food|cafe|restaurant|bakery|market/.test(cat)) {
    return 'Authentic culinary stop providing a flavourful respite between activities.';
  }
  if (/nature|wildlife|view|park|waterfall/.test(cat)) {
    return 'Refreshing natural oasis selected to balance indoor and urban wandering.';
  }

  return `${place.category || 'Curated stop'} selected for a well-paced ${pace} exploration.`;
}

function generateDayTheme(stops, dayIndex) {
  const categories = [...new Set(stops.map(s => s.category).filter(Boolean))];
  if (!categories.length) return `Day ${dayIndex + 1}: City Exploration`;
  if (dayIndex === 0) {
    return `Arrival & ${categories.slice(0, 2).join(' & ')}`;
  }
  return `${categories.slice(0, 2).join(' & ')} Immersion`;
}

export function generateDeterministicPlan(input, scopedPlaces) {
  const { days: numDays, pace, mode, budget, travelers, startDate, vibes } = input;
  const breakMinutes = breakMinutesByPace[pace] || 30;
  const inboundDelay = inboundMinutesByMode[mode] || 160;

  if (!scopedPlaces.length) {
    const budgetInfo = calculatePlannerBudget({ budget, travelers, mode, stops: [] });
    return {
      source: 'DETERMINISTIC_FALLBACK',
      model: null,
      confidence: 'unverified',
      destination: input.destination,
      days: [],
      budget: budgetInfo.budget,
      transport: budgetInfo.transport,
      warnings: ['No saved places available for this destination.'],
      provenance: {
        method: 'deterministic_rule_engine',
        generatedAt: new Date().toISOString(),
        aiConfigured: false,
        notes: 'Rule-based planner executed because no saved stops were provided.'
      }
    };
  }

  const effectiveDays = Math.min(numDays, scopedPlaces.length);
  const perDay = Math.max(1, Math.ceil(scopedPlaces.length / effectiveDays));

  const days = [];
  const allScheduledStops = [];

  for (let day = 0; day < effectiveDays; day++) {
    const dayStopsRaw = scopedPlaces.slice(day * perDay, (day + 1) * perDay);
    if (!dayStopsRaw.length) continue;

    // Day 1 starts after inbound transport arrival; subsequent days start at 09:00
    let clock = day === 0 ? 9 * 60 + inboundDelay : 9 * 60;
    const dayStops = [];

    for (const place of dayStopsRaw) {
      const visitDuration = Number(place.time) || 90;
      const start = clock;
      const end = start + visitDuration;
      clock = end + breakMinutes;

      const stop = {
        ...place,
        day: day + 1,
        start,
        end,
        visitMinutes: visitDuration,
        costStatus: Number.isFinite(place.cost) ? 'KNOWN' : 'UNKNOWN',
        fitReason: generateFitReason(place, pace, vibes),
        realityCheck: place.caveat || null
      };

      dayStops.push(stop);
      allScheduledStops.push(stop);
    }

    const legs = buildTravelLegs(dayStops);
    let dayDate = null;
    if (startDate) {
      const d = new Date(`${startDate}T12:00:00Z`);
      d.setDate(d.getDate() + day);
      dayDate = d.toISOString().slice(0, 10);
    }

    days.push({
      day: day + 1,
      date: dayDate,
      theme: generateDayTheme(dayStops, day),
      stops: dayStops,
      legs
    });
  }

  const budgetInfo = calculatePlannerBudget({
    budget,
    travelers,
    mode,
    stops: allScheduledStops
  });

  return {
    source: 'DETERMINISTIC_FALLBACK',
    model: null,
    confidence: budgetInfo.budget.unknownCostCount === 0 ? 'high' : 'medium',
    destination: input.destination,
    days,
    budget: budgetInfo.budget,
    transport: budgetInfo.transport,
    warnings: budgetInfo.warnings,
    provenance: {
      method: 'deterministic_rule_engine',
      generatedAt: new Date().toISOString(),
      aiConfigured: false,
      notes: 'Built using Pico deterministic planning heuristics. Pace buffers and visit lengths applied.'
    }
  };
}
