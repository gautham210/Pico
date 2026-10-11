import { fetchWeather } from '../providers/weather.js';
import { scopeAndFilterPlaces } from './places.js';
import { estimateRoadRoute } from './routes.js';
import { calculatePlannerBudget } from './budget.js';
import { generateDeterministicPlan } from './fallback.js';
import { redactSecrets } from '../api-utils.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_places',
    description: 'Search validated catalog destinations and attractions for a given city and category/keywords.',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'Destination city (e.g. Kochi, Goa, Bengaluru)' },
        category: { type: 'string', description: 'Category (beach, fort, cafe, heritage, nature, culture)' },
        query: { type: 'string', description: 'Optional search keyword' }
      },
      required: ['destination']
    }
  },
  {
    name: 'get_place_details',
    description: 'Retrieve validated details, coordinates, estimated visit length, entry fees, and reality checks for a specific place ID.',
    parameters: {
      type: 'object',
      properties: {
        placeId: { type: 'string', description: 'Unique identifier of the place' }
      },
      required: ['placeId']
    }
  },
  {
    name: 'get_route',
    description: 'Calculate driving route, road distance, and travel duration between two or more geographical coordinates using OSRM.',
    parameters: {
      type: 'object',
      properties: {
        points: {
          type: 'array',
          items: {
            type: 'array',
            items: { type: 'number' }
          },
          description: 'Array of [latitude, longitude] pairs in sequential order'
        }
      },
      required: ['points']
    }
  },
  {
    name: 'get_weather',
    description: 'Fetch current weather conditions, temperature, and rainfall advisories for a travel destination.',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'Destination city name' }
      },
      required: ['city']
    }
  },
  {
    name: 'calculate_budget',
    description: 'Calculate total cost per person, group cost, transit cost, and remaining budget across saved stops and transport mode.',
    parameters: {
      type: 'object',
      properties: {
        placeCosts: { type: 'array', items: { type: 'number' }, description: 'Array of admitted place ticket costs' },
        mode: { type: 'string', description: 'Transport mode: fastest, convenient, or cheapest' },
        travelers: { type: 'number', description: 'Number of travellers' },
        budgetEnvelope: { type: 'number', description: 'Total budget envelope per person' }
      },
      required: ['placeCosts', 'mode', 'travelers', 'budgetEnvelope']
    }
  },
  {
    name: 'check_trip_constraints',
    description: 'Validate that an itinerary schedule does not exceed daily travel limits, pace guidelines, or budget.',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Trip duration in days' },
        pace: { type: 'string', description: 'Travel pace: relaxed, balanced, or full' },
        stopsPerDay: { type: 'array', items: { type: 'number' }, description: 'Number of stops allocated each day' },
        totalCost: { type: 'number', description: 'Estimated total cost per person' },
        budgetEnvelope: { type: 'number', description: 'Allocated budget envelope per person' }
      },
      required: ['days', 'pace', 'stopsPerDay', 'totalCost', 'budgetEnvelope']
    }
  }
];

export async function executeTool(toolName, args = {}, context = {}) {
  try {
    switch (toolName) {
      case 'search_places': {
        const destination = args.destination || context.destination || 'Kochi';
        const { places } = scopeAndFilterPlaces({ destination, vibes: args.category ? [args.category] : [] });
        let filtered = places;
        if (args.query) {
          const q = args.query.toLowerCase();
          filtered = places.filter(p => p.name.toLowerCase().includes(q) || (p.subtitle && p.subtitle.toLowerCase().includes(q)));
        }
        return {
          status: 'SUCCESS',
          count: filtered.length,
          places: filtered.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            cost: p.cost,
            time: p.time,
            coords: p.coords,
            caveat: p.caveat
          }))
        };
      }

      case 'get_place_details': {
        const id = args.placeId;
        const allPlaces = context.scopedPlaces || [];
        const found = allPlaces.find(p => p.id === id);
        if (!found) {
          return { status: 'NOT_FOUND', error: `Place with ID ${id} not found in destination catalog.` };
        }
        return {
          status: 'SUCCESS',
          place: found
        };
      }

      case 'get_route': {
        const points = args.points || [];
        if (!Array.isArray(points) || points.length < 2) {
          return { status: 'INVALID_INPUT', error: 'At least 2 coordinate pairs are required for routing.' };
        }
        const routeResult = await estimateRoadRoute(points[0], points[1]);
        return {
          status: 'SUCCESS',
          distanceKm: routeResult.distanceKm,
          minutes: routeResult.minutes,
          source: routeResult.source
        };
      }

      case 'get_weather': {
        const city = args.city || context.destination || 'Kochi';
        const weather = await fetchWeather(city);
        return {
          status: 'SUCCESS',
          weather
        };
      }

      case 'calculate_budget': {
        const budgetResult = calculatePlannerBudget({
          placeCosts: args.placeCosts || [],
          mode: args.mode || 'convenient',
          travelers: args.travelers || 1,
          budgetEnvelope: args.budgetEnvelope || 20000
        });
        return {
          status: 'SUCCESS',
          budget: budgetResult
        };
      }

      case 'check_trip_constraints': {
        const maxStops = { relaxed: 3, balanced: 4, full: 6 }[args.pace] || 4;
        const overstuffedDays = (args.stopsPerDay || []).filter(n => n > maxStops).length;
        const isOverBudget = args.totalCost > args.budgetEnvelope;

        const warnings = [];
        if (overstuffedDays > 0) {
          warnings.push(`${overstuffedDays} day(s) exceed recommended maximum ${maxStops} stops for a ${args.pace} pace.`);
        }
        if (isOverBudget) {
          warnings.push(`Planned costs (₹${args.totalCost}) exceed your budget envelope (₹${args.budgetEnvelope}).`);
        }

        return {
          status: 'SUCCESS',
          feasible: warnings.length === 0,
          warnings
        };
      }

      default:
        return {
          status: 'UNKNOWN_TOOL',
          error: `Tool '${toolName}' is not registered.`
        };
    }
  } catch (err) {
    return {
      status: 'ERROR',
      error: redactSecrets(err.message || 'Tool execution encountered an exception')
    };
  }
}
