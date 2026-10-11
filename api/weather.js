import { json, method } from '../server/api-utils.js';
import { fetchWeather } from '../server/providers/weather.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed. Use GET or POST.' });
  }

  try {
    const city = req.query?.city || req.body?.city || 'Kochi';
    const coords = req.body?.coords || null;

    const weather = await fetchWeather(coords || city);
    return json(res, 200, weather);
  } catch (err) {
    return json(res, 500, {
      status: 'ERROR',
      error: 'Weather service could not process request.',
      source: 'UNAVAILABLE'
    });
  }
}
