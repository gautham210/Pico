import {validatePlannerInput} from './validate.js';
import {scopeAndFilterPlaces} from './places.js';
import {generateDeterministicPlan} from './fallback.js';
import {callAiPlanner, isAiConfigured} from './ai-provider.js';
import {redactSecrets} from '../api-utils.js';

export async function orchestratePlan(body) {
  const validation = validatePlannerInput(body);
  if (!validation.valid) {
    return {
      status: 'ERROR',
      error: validation.error,
      source: 'UNAVAILABLE',
      days: [],
      warnings: [validation.error]
    };
  }

  const input = validation.data;
  const { places: scopedPlaces, warnings: scopingWarnings } = scopeAndFilterPlaces(input);

  // If AI credentials are present, attempt AI planning first
  let plan = null;
  let fallbackReason = null;

  if (isAiConfigured()) {
    try {
      const aiResult = await callAiPlanner(input, scopedPlaces);
      if (aiResult.ok) {
        plan = {
          status: 'SUCCESS',
          source: 'AI_PLAN',
          model: aiResult.model,
          confidence: aiResult.budget.unknownCostCount === 0 ? 'high' : 'medium',
          destination: input.destination,
          days: aiResult.days,
          budget: aiResult.budget,
          transport: aiResult.transport,
          warnings: [...scopingWarnings, ...aiResult.warnings],
          provenance: {
            method: 'ai_orchestrator',
            provider: aiResult.provider,
            model: aiResult.model,
            generatedAt: new Date().toISOString(),
            aiConfigured: true,
            notes: 'Synthesized with Pico AI planning engine. Stored reality checks and heuristics applied.'
          }
        };
      } else {
        fallbackReason = aiResult.error || aiResult.message || 'AI planning call was unsuccessful';
      }
    } catch (err) {
      fallbackReason = err.message || 'AI orchestrator threw an unexpected exception';
    }
  } else {
    fallbackReason = 'No AI provider credentials configured in environment';
  }

  // If AI plan was not produced (or failed validation), use the deterministic fallback engine
  if (!plan) {
    const fallbackPlan = generateDeterministicPlan(input, scopedPlaces);
    plan = {
      ...fallbackPlan,
      status: 'SUCCESS',
      warnings: [...scopingWarnings, ...fallbackPlan.warnings],
      provenance: {
        ...fallbackPlan.provenance,
        aiConfigured: isAiConfigured(),
        fallbackReason: redactSecrets(fallbackReason)
      }
    };
  }

  return redactSecrets(plan);
}
