export async function getNearby(coords, placeIds, mode = 'driving') {
  try {
    if (!coords || !Array.isArray(placeIds) || placeIds.length === 0) {
      return [];
    }

    const originLat = Array.isArray(coords) ? coords[0] : coords.lat;
    const originLng = Array.isArray(coords) ? coords[1] : coords.lng;
    
    // OSRM requires coordinates in lon,lat format
    const coordinates = [`${originLng},${originLat}`];
    
    const validPlaces = [];

    placeIds.forEach((p) => {
      if (p && p.coords && Array.isArray(p.coords) && p.coords.length === 2) {
        coordinates.push(`${p.coords[1]},${p.coords[0]}`); // lon,lat
        validPlaces.push(p);
      }
    });

    if (validPlaces.length === 0) {
      throw new Error('No valid destination coordinates provided');
    }

    const coordString = coordinates.join(';');
    const url = `https://router.project-osrm.org/table/v1/driving/${coordString}?sources=0`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM API HTTP error: ${response.status}`);
    }

    const data = await response.json();
    if (data.code !== 'Ok' || !data.durations || !data.durations[0]) {
      throw new Error('OSRM returned invalid status or empty durations');
    }

    // durations[0] is an array of times from the source (index 0) to all points (index 0 is source itself)
    const durations = data.durations[0];

    return validPlaces.map((place, index) => {
      // Index in durations is index + 1 because source is 0
      const durationSeconds = durations[index + 1];
      const durationMins = durationSeconds != null ? Math.round(durationSeconds / 60) : 20;

      return {
        place: place.name || place.id,
        mode: 'driving',
        time: `${durationMins} mins`,
        traffic: 'normal'
      };
    });
  } catch (error) {
    console.warn('getNearby failed, returning estimated distances:', error.message);
    return placeIds.map((place) => ({
      place: typeof place === 'object' ? (place.id || place.name) : place,
      mode,
      time: '20 mins',
      traffic: 'normal'
    }));
  }
}
