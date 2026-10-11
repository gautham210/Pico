import {withTimeout, redactSecrets} from '../api-utils.js';
import {buildTravelLegs} from './routes.js';
import {calculatePlannerBudget} from './budget.js';

function getAiConfig() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey && typeof geminiKey === 'string' && geminiKey.trim().length > 0) {
    return {
      provider: 'gemini',
      apiKey: geminiKey.trim(),
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && typeof openaiKey === 'string' && openaiKey.trim().length > 0) {
    return {
      provider: 'openai',
      apiKey: openaiKey.trim(),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    };
  }

  return null;
}

export function isAiConfigured() {
  return getAiConfig() !== null;
}

function buildPrompt(input, scopedPlaces) {
  const simplifiedPlaces = scopedPlaces.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    coords: p.coords,
    cost: p.cost,
    suggestedTime: p.time,
    caveat: p.caveat
  }));

  const systemInstruction = `You are Pico's AI itinerary planning engine.
Your objective: arrange the traveller's SAVED places into a balanced, logical, day-by-day travel plan.

CRITICAL RULES:
1. ONLY schedule places from the provided 'savedPlaces' list. NEVER invent, fabricate, or add new places.
2. Every stop MUST retain its exact 'id'.
3. Assign each stop a 'day' (1 to ${input.days}).
4. Sequence stops in a logical order within each day (e.g., morning outdoor/heritage, midday food/indoor, evening sunset/dining).
5. Provide a specific, concise 'fitReason' for each stop explaining why it matches the traveller's pace (${input.pace}) and interests (${input.vibes.join(', ') || 'general'}).
6. Suggest a 'visitMinutes' (between 30 and 180 min).
7. Suggest a short descriptive 'theme' for each day (e.g. "Historic Forts & Coastal Sunset").
8. Do not invent live train, bus or flight schedules, live prices, or live seat availability.
9. Return STRICT JSON matching the schema:
{
  "days": [
    {
      "day": 1,
      "theme": "Day Theme",
      "stops": [
        {
          "id": "exact_place_id",
          "visitMinutes": 90,
          "fitReason": "Why this fits"
        }
      ]
    }
  ],
  "warnings": ["any constraint warnings if applicable"]
}`;

  const userContent = JSON.stringify({
    destination: input.destination,
    days: input.days,
    travelers: input.travelers,
    pace: input.pace,
    interests: input.vibes,
    constraints: input.constraints,
    savedPlaces: simplifiedPlaces
  });

  return { systemInstruction, userContent };
}

async function callGemini(config, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
  
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${prompt.systemInstruction}\n\nTraveller Request Data:\n${prompt.userContent}` }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Gemini API error status ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response text from Gemini.');
  return JSON.parse(rawText);
}

async function callOpenAi(config, prompt) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: config.model,
    messages: [
      { role: 'system', content: prompt.systemInstruction },
      { role: 'user', content: prompt.userContent }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI API error status ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Empty response text from OpenAI.');
  return JSON.parse(rawText);
}

export async function callAiPlanner(input, scopedPlaces) {
  const config = getAiConfig();
  if (!config) {
    return { ok: false, code: 'NO_CREDENTIALS', message: 'No AI provider credentials configured.' };
  }

  if (!scopedPlaces.length) {
    return { ok: false, code: 'EMPTY_PLACES', message: 'No saved places to plan.' };
  }

  const prompt = buildPrompt(input, scopedPlaces);
  const placesById = new Map(scopedPlaces.map(p => [p.id, p]));

  let rawResult;
  try {
    const promise = config.provider === 'gemini'
      ? callGemini(config, prompt)
      : callOpenAi(config, prompt);
    rawResult = await withTimeout(promise, 15000);
  } catch (err) {
    return {
      ok: false,
      code: 'PROVIDER_ERROR',
      error: redactSecrets(err.message || 'AI provider request failed.')
    };
  }

  // Strict structured output validation
  if (!rawResult || !Array.isArray(rawResult.days) || !rawResult.days.length) {
    return { ok: false, code: 'INVALID_OUTPUT', error: 'AI response missing days array.' };
  }

  const breakMinutes = { relaxed: 60, balanced: 30, full: 15 }[input.pace] || 30;
  const inboundDelay = { cheapest: 320, convenient: 160, fastest: 70 }[input.mode] || 160;

  const validatedDays = [];
  const seenPlaceIds = new Set();
  const allScheduledStops = [];

  for (let dIdx = 0; dIdx < rawResult.days.length; dIdx++) {
    const dayItem = rawResult.days[dIdx];
    if (!dayItem || !Array.isArray(dayItem.stops)) continue;

    let clock = dIdx === 0 ? 9 * 60 + inboundDelay : 9 * 60;
    const dayStops = [];

    for (const stopRef of dayItem.stops) {
      if (!stopRef || typeof stopRef.id !== 'string') continue;
      const originalPlace = placesById.get(stopRef.id);
      
      // CRITICAL: Reject hallucinated place IDs
      if (!originalPlace) {
        return {
          ok: false,
          code: 'HALLUCINATED_PLACE',
          error: `AI response returned unknown place ID "${stopRef.id}".`
        };
      }

      if (seenPlaceIds.has(stopRef.id)) continue;
      seenPlaceIds.add(stopRef.id);

      const visitDuration = Number(stopRef.visitMinutes) || originalPlace.time || 90;
      const clampedDuration = Math.max(30, Math.min(240, visitDuration));
      const start = clock;
      const end = start + clampedDuration;
      clock = end + breakMinutes;

      const stop = {
        ...originalPlace,
        day: dIdx + 1,
        start,
        end,
        visitMinutes: clampedDuration,
        costStatus: Number.isFinite(originalPlace.cost) ? 'KNOWN' : 'UNKNOWN',
        fitReason: typeof stopRef.fitReason === 'string' && stopRef.fitReason.trim().length > 0
          ? stopRef.fitReason.trim()
          : `Curated stop matching your ${input.pace} pace.`,
        realityCheck: originalPlace.caveat || null
      };

      dayStops.push(stop);
      allScheduledStops.push(stop);
    }

    if (dayStops.length > 0) {
      const legs = buildTravelLegs(dayStops);
      let dayDate = null;
      if (input.startDate) {
        const d = new Date(`${input.startDate}T12:00:00Z`);
        d.setDate(d.getDate() + dIdx);
        dayDate = d.toISOString().slice(0, 10);
      }

      validatedDays.push({
        day: validatedDays.length + 1,
        date: dayDate,
        theme: typeof dayItem.theme === 'string' && dayItem.theme.trim().length > 0
          ? dayItem.theme.trim()
          : `Day ${validatedDays.length + 1} Itinerary`,
        stops: dayStops,
        legs
      });
    }
  }

  // If any saved places were omitted by the AI, append them to remaining days
  const unplaced = scopedPlaces.filter(p => !seenPlaceIds.has(p.id));
  if (unplaced.length > 0 && validatedDays.length > 0) {
    const lastDay = validatedDays[validatedDays.length - 1];
    let lastClock = lastDay.stops[lastDay.stops.length - 1]?.end || 9 * 60;

    for (const p of unplaced) {
      const visitDuration = Number(p.time) || 90;
      const start = lastClock + breakMinutes;
      const end = start + visitDuration;
      lastClock = end;

      const stop = {
        ...p,
        day: lastDay.day,
        start,
        end,
        visitMinutes: visitDuration,
        costStatus: Number.isFinite(p.cost) ? 'KNOWN' : 'UNKNOWN',
        fitReason: `Saved stop included in your ${input.pace} schedule.`,
        realityCheck: p.caveat || null
      };
      lastDay.stops.push(stop);
      allScheduledStops.push(stop);
    }
    lastDay.legs = buildTravelLegs(lastDay.stops);
  }

  if (!validatedDays.length) {
    return { ok: false, code: 'EMPTY_SCHEDULE', error: 'AI failed to schedule any valid stops.' };
  }

  const budgetInfo = calculatePlannerBudget({
    budget: input.budget,
    travelers: input.travelers,
    mode: input.mode,
    stops: allScheduledStops
  });

  const aiWarnings = Array.isArray(rawResult.warnings)
    ? rawResult.warnings.filter(w => typeof w === 'string').map(w => w.trim()).filter(Boolean)
    : [];

  return {
    ok: true,
    model: config.model,
    provider: config.provider,
    days: validatedDays,
    budget: budgetInfo.budget,
    transport: budgetInfo.transport,
    warnings: [...aiWarnings, ...budgetInfo.warnings]
  };
}
