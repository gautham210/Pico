import {validCoords} from '../../services/providers/contracts.js';

function haversineDistanceKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function estimateTravelLeg(fromStop, toStop) {
  if (!fromStop || !toStop) return null;

  const hasCoords = validCoords(fromStop.coords) && validCoords(toStop.coords);

  if (hasCoords) {
    const directKm = haversineDistanceKm(fromStop.coords, toStop.coords);
    // Road network curvature factor typically 1.3 - 1.4 in urban/coastal India
    const roadKm = Math.round(directKm * 1.35 * 10) / 10;
    // Estimated average transit speed of 30 km/h + 5 min buffer
    const durationMinutes = Math.max(10, Math.round((roadKm / 30) * 60) + 5);

    return {
      fromStopId: fromStop.id,
      fromStopName: fromStop.name,
      toStopId: toStop.id,
      toStopName: toStop.name,
      distanceKm: roadKm,
      durationMinutes,
      mode: 'driving',
      status: 'ESTIMATED',
      note: 'Estimated road transit based on stop coordinates · driving profile; traffic not included'
    };
  }

  // Fallback when coordinates are missing for one or both stops
  return {
    fromStopId: fromStop.id,
    fromStopName: fromStop.name,
    toStopId: toStop.id,
    toStopName: toStop.name,
    distanceKm: null,
    durationMinutes: 25,
    mode: 'local_transfer',
    status: 'ESTIMATED',
    note: 'Illustrative local transfer buffer · coordinates unverified'
  };
}

export function buildTravelLegs(stops) {
  if (!Array.isArray(stops) || stops.length < 2) return [];
  const legs = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const leg = estimateTravelLeg(stops[i], stops[i + 1]);
    if (leg) legs.push(leg);
  }
  return legs;
}
