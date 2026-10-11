import {json, method} from '../server/api-utils.js';
import {orchestratePlan} from '../server/planner/index.js';

export default async function handler(req, res) {
  if (!method(req, res, 'POST')) return;

  try {
    const body = req.body || {};
    const plan = await orchestratePlan(body);

    if (plan.status === 'ERROR') {
      return json(res, 400, plan);
    }

    return json(res, 200, plan);
  } catch (err) {
    return json(res, 500, {
      status: 'ERROR',
      source: 'UNAVAILABLE',
      error: 'Planning orchestrator encountered an internal error.',
      days: [],
      warnings: ['Internal server error during plan generation.']
    });
  }
}
