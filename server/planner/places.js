export function scopeAndFilterPlaces(input) {
  const { destination, destinations, multiCity, savedPlaces, rejectedPlaces, constraints } = input;
  const warnings = [];

  const allowedCities = new Set(
    multiCity 
      ? destinations.map(d => d.toLowerCase())
      : [destination.toLowerCase()]
  );

  const scopedPlaces = [];
  const foreignPlaces = [];

  for (const place of savedPlaces) {
    // If place specifies a city, verify it matches the active destination scope
    const placeCity = (place.city || '').toLowerCase();
    if (placeCity && !allowedCities.has(placeCity)) {
      foreignPlaces.push(place);
    } else {
      scopedPlaces.push(place);
    }
  }

  if (foreignPlaces.length > 0) {
    warnings.push(
      `Filtered out ${foreignPlaces.length} saved place(s) belonging to other destinations (${[...new Set(foreignPlaces.map(p => p.city))].join(', ')}) to preserve destination isolation.`
    );
  }

  // Filter out any place present in rejectedPlaces
  const rejectedSet = new Set(rejectedPlaces);
  const unrejectedPlaces = scopedPlaces.filter(p => {
    if (rejectedSet.has(p.id)) {
      warnings.push(`Excluded rejected place: "${p.name}".`);
      return false;
    }
    return true;
  });

  // Filter out avoided categories if specified in constraints
  const avoidSet = new Set((constraints?.avoidCategories || []).map(c => c.toLowerCase()));
  const finalPlaces = unrejectedPlaces.filter(p => {
    if (avoidSet.has((p.category || '').toLowerCase())) {
      warnings.push(`Excluded "${p.name}" matching avoided category: ${p.category}.`);
      return false;
    }
    return true;
  });

  // Check mustVisit constraints
  if (Array.isArray(constraints?.mustVisit) && constraints.mustVisit.length > 0) {
    for (const must of constraints.mustVisit) {
      const match = finalPlaces.some(p => p.id === must || p.name.toLowerCase() === must.toLowerCase());
      if (!match) {
        warnings.push(`Must-visit place "${must}" is not in saved places for this destination.`);
      }
    }
  }

  return {
    places: finalPlaces,
    warnings
  };
}
