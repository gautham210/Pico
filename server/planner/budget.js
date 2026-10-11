const transportModes = {
  cheapest: { cost: 800, minutes: 320, name: 'Cheapest', vehicle: 'Train + ferry' },
  convenient: { cost: 1800, minutes: 160, name: 'Convenient', vehicle: 'Coach + ferry' },
  fastest: { cost: 3000, minutes: 70, name: 'Fastest', vehicle: 'Flight + taxi' }
};

export function calculatePlannerBudget({ budget, travelers, mode, stops }) {
  const selectedMode = transportModes[mode] || transportModes.convenient;
  const transportCost = stops.length > 0 ? selectedMode.cost : 0;

  let knownPlaceCost = 0;
  let unknownCostCount = 0;

  for (const stop of stops) {
    if (Number.isFinite(stop.cost) && stop.cost >= 0) {
      knownPlaceCost += stop.cost;
    } else {
      unknownCostCount++;
    }
  }

  const perPersonPlannedCost = knownPlaceCost + transportCost;
  const perPersonBudget = Number.isFinite(budget) ? budget : 20000;
  const perPersonRemaining = Math.max(0, perPersonBudget - perPersonPlannedCost);

  const groupTotalBudget = perPersonBudget * travelers;
  const groupTotalPlannedCost = perPersonPlannedCost * travelers;
  const groupTotalRemaining = Math.max(0, groupTotalBudget - groupTotalPlannedCost);

  const warnings = [];
  if (perPersonPlannedCost > perPersonBudget) {
    warnings.push(
      `Planned known costs (₹${perPersonPlannedCost.toLocaleString('en-IN')}) exceed the per-traveller budget envelope (₹${perPersonBudget.toLocaleString('en-IN')}) by ₹${(perPersonPlannedCost - perPersonBudget).toLocaleString('en-IN')}.`
    );
  }

  if (unknownCostCount > 0) {
    warnings.push(
      `${unknownCostCount} stop(s) have unverified prices and are excluded from the known cost total. Stays and intercity transfers are not included.`
    );
  }

  return {
    budget: {
      envelope: perPersonBudget,
      knownPlaceCost,
      transportCost,
      totalPlannedCost: perPersonPlannedCost,
      remainingBudget: perPersonRemaining,
      unknownCostCount,
      perPerson: {
        envelope: perPersonBudget,
        knownCost: perPersonPlannedCost,
        remaining: perPersonRemaining
      },
      group: {
        travelers,
        totalBudget: groupTotalBudget,
        totalCost: groupTotalPlannedCost,
        totalPlannedCost: groupTotalPlannedCost,
        remainingBudget: groupTotalRemaining
      }
    },
    transport: {
      mode: mode in transportModes ? mode : 'convenient',
      modeName: selectedMode.name,
      vehicle: selectedMode.vehicle,
      cost: transportCost,
      inboundMinutes: selectedMode.minutes,
      liveInventoryAvailable: false,
      disclaimer: 'Transport fares and durations are illustrative heuristics, not live booking inventory.'
    },
    warnings
  };
}
