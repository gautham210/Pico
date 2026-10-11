import { withTimeout, redactSecrets } from '../api-utils.js';

const CITY_COORDS = {
  Kochi: { lat: 9.9312, lon: 76.2673 },
  Goa: { lat: 15.4909, lon: 73.8278 },
  Bengaluru: { lat: 12.9716, lon: 77.5946 },
  Kozhikode: { lat: 11.2588, lon: 75.7804 },
  Mysuru: { lat: 12.2958, lon: 76.6394 }
};

const weatherCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function fetchWeather(cityOrCoords) {
  let lat = null;
  let lon = null;
  let cityName = typeof cityOrCoords === 'string' ? cityOrCoords : 'Destination';

  if (typeof cityOrCoords === 'string' && CITY_COORDS[cityOrCoords]) {
    lat = CITY_COORDS[cityOrCoords].lat;
    lon = CITY_COORDS[cityOrCoords].lon;
  } else if (Array.isArray(cityOrCoords) && cityOrCoords.length === 2 && Number.isFinite(cityOrCoords[0])) {
    lat = cityOrCoords[0];
    lon = cityOrCoords[1];
  } else if (cityOrCoords && typeof cityOrCoords.lat === 'number' && typeof cityOrCoords.lon === 'number') {
    lat = cityOrCoords.lat;
    lon = cityOrCoords.lon;
    if (cityOrCoords.name) cityName = cityOrCoords.name;
  }

  if (lat === null || lon === null) {
    lat = 9.9312;
    lon = 76.2673;
    cityName = 'Kochi';
  }

  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      ...cached.data,
      source: 'CACHED'
    };
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 10) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(apiKey.trim())}&units=metric`;
      const response = await withTimeout(fetch(url), 6000);
      if (response.ok) {
        const raw = await response.json();
        const data = {
          status: 'SUCCESS',
          source: 'LIVE',
          city: raw.name || cityName,
          tempC: Math.round(raw.main?.temp ?? 28),
          feelsLikeC: Math.round(raw.main?.feels_like ?? 30),
          condition: raw.weather?.[0]?.main || 'Clear',
          description: raw.weather?.[0]?.description || 'Clear skies',
          humidity: raw.main?.humidity ?? 70,
          windSpeedKmh: Math.round((raw.wind?.speed ?? 3) * 3.6),
          advisory: (raw.weather?.[0]?.main || '').toLowerCase().includes('rain')
            ? 'Rain expected. Carry umbrella or plan indoor heritage visits.'
            : 'Favourable outdoor conditions.',
          updatedAt: new Date().toISOString(),
          provenance: {
            provider: 'OpenWeather',
            source: 'LIVE_API',
            verified: true,
            notes: 'Current telemetry data from OpenWeather API.'
          }
        };
        weatherCache.set(cacheKey, { timestamp: Date.now(), data });
        return redactSecrets(data);
      }
    } catch {}
  }

  // Realistic seasonal estimate fallback
  const fallbackEstimates = {
    Goa: { temp: 31, condition: 'Sunny & Coastal', humidity: 72, advisory: 'High UV midday. Sun protection recommended.' },
    Kochi: { temp: 29, condition: 'Humid & Tropical', humidity: 80, advisory: 'Warm afternoon humidity. Early morning outdoor visits recommended.' },
    Bengaluru: { temp: 26, condition: 'Pleasant & Mild', humidity: 55, advisory: 'Comfortable weather for city walking and cycling.' },
    Kozhikode: { temp: 30, condition: 'Coastal Breeze', humidity: 75, advisory: 'Breezy coastal evening recommended along the beach.' },
    Mysuru: { temp: 28, condition: 'Clear Skies', humidity: 60, advisory: 'Good visibility for palace illumination and hill views.' }
  };

  const est = fallbackEstimates[cityName] || { temp: 28, condition: 'Mild', humidity: 65, advisory: 'Standard seasonal weather.' };

  const fallbackData = {
    status: 'SUCCESS',
    source: 'CACHED_ESTIMATE',
    city: cityName,
    tempC: est.temp,
    feelsLikeC: est.temp + 2,
    condition: est.condition,
    description: est.condition,
    humidity: est.humidity,
    windSpeedKmh: 12,
    advisory: est.advisory,
    updatedAt: new Date().toISOString(),
    provenance: {
      provider: 'Pico Climatology Baseline',
      source: 'OFFLINE_ESTIMATE',
      verified: false,
      notes: 'Seasonal historical baseline. Configure OPENWEATHER_API_KEY for live telemetry.'
    }
  };

  return redactSecrets(fallbackData);
}
