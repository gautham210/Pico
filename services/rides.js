function extractCoord(location) {
  if (!location) return { lat: 0, lng: 0, name: '' };
  if (Array.isArray(location)) {
    return { lat: location[0], lng: location[1], name: '' };
  }
  return {
    lat: location.lat ?? (location.coords ? location.coords[0] : 0),
    lng: location.lng ?? (location.coords ? location.coords[1] : 0),
    name: location.name || ''
  };
}

export function uberLink(pickup, dropoff) {
  const p = extractCoord(pickup);
  const d = extractCoord(dropoff);

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

  const params = new URLSearchParams({
    lat: p.lat.toString(),
    lng: p.lng.toString(),
    drop_lat: d.lat.toString(),
    drop_lng: d.lng.toString(),
    dsw: 'yes'
  });

  return `https://book.olacabs.com/?${params.toString()}`;
}
