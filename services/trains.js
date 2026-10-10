import RailKitModule from 'railkit';

export async function searchTrains(origin, dest, date) {
  try {
    const apiKey = import.meta.env.VITE_IRCTC_KEY;
    if (!apiKey) {
      throw new Error('IRCTC API key missing');
    }

    const RailKitConstructor = RailKitModule?.RailKit || RailKitModule?.default || RailKitModule;
    if (typeof RailKitConstructor !== 'function') {
      throw new Error('RailKit client not available');
    }

    const client = new RailKitConstructor({ apiKey });

    // Look up station codes or query train route
    const fromStation = (await client.getStationCode?.(origin)) || origin;
    const toStation = (await client.getStationCode?.(dest)) || dest;

    const response = (await client.getTrainsBetweenStations?.(fromStation, toStation, date))
      || (await client.searchTrains?.(fromStation, toStation, date))
      || [];

    const trains = Array.isArray(response) ? response : response.trains || [];

    if (trains.length === 0) {
      throw new Error('No train data returned');
    }

    return trains.map((t) => ({
      mode: 'train',
      cost: Number(t.fare || t.price || t.cost || 0),
      duration: t.duration || t.travelTime || '0h 0m',
      url: t.bookingUrl || t.url || `https://www.irctc.co.in/nget/booking/train-list?from=${fromStation}&to=${toStation}&date=${date}`,
      name: t.trainName || t.name || 'Express Train',
      number: t.trainNumber || t.number || '',
      departure: t.departureTime || t.departure || '',
      arrival: t.arrivalTime || t.arrival || ''
    }));
  } catch (error) {
    console.warn('searchTrains failed, falling back to cached trains.json:', error.message);
    try {
      const fallback = await import('../data/fallback/trains.json');
      return fallback.default || fallback;
    } catch (fallbackError) {
      console.warn('Fallback trains.json not found or unreadable:', fallbackError.message);
      return [];
    }
  }
}
