function extractCoord(location) {
  if (!location) return null;
  const raw = Array.isArray(location)
    ? { lat: location[0], lng: location[1], name: '' }
    : { lat: location.lat ?? location.coords?.[0], lng: location.lng ?? location.coords?.[1], name: location.name || '' };
  const number = value => typeof value === 'number' || typeof value === 'string' && value.trim() ? Number(value) : NaN;
  const lat = number(raw.lat), lng = number(raw.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng, name: String(raw.name || '') };
}

export function uberLink(pickup, dropoff) {
  const p = extractCoord(pickup);
  const d = extractCoord(dropoff);
  if (!p || !d) return null;

  const params = new URLSearchParams({
    action: 'setPickup',
    'pickup[latitude]': p.lat.toString(),
    'pickup[longitude]': p.lng.toString(),
    'pickup[nickname]': p.name || 'Pickup Location',
    'dropoff[latitude]': d.lat.toString(),
    'dropoff[longitude]': d.lng.toString(),
    'dropoff[nickname]': d.name || 'Dropoff Location'
  });

  return `https://m.uber.com/ul/?${params.toString()}`;
}

export function olaLink(pickup, dropoff) {
  const p = extractCoord(pickup);
  const d = extractCoord(dropoff);
  if (!p || !d) return null;

  const params = new URLSearchParams({
    lat: p.lat.toString(),
    lng: p.lng.toString(),
    drop_lat: d.lat.toString(),
    drop_lng: d.lng.toString(),
    dsw: 'yes'
  });

  return `https://book.olacabs.com/?${params.toString()}`;
}
