# Pico Audit and Implementation Plan

## 1. Feature Inventory

| Feature | Status | Implementation details & remaining work |
|---|---|---|
| **Swipe Deck** | **Working** | Implemented in `src/screens/Discover.jsx` with Framer Motion. Uses `useStore`. Needs integration with real places data. |
| **Live Budget Counter** | **Working** | Implemented in `src/components/JourneyUI.jsx`. Accurately reflects state in `useStore`. |
| **Reality Check** | **Working** | Shows local caveats from `reality_checks.json`. |
| **AI Orchestrator / Itinerary** | **Partial** | UI exists in `src/screens/Journey.jsx` (`Plan` component), but transport logic relies on deterministic demo data in `provider.js`. Needs real mode comparisons. |
| **Three Transport Modes** | **Mocked** | Uses hardcoded demo estimates (`cheapest`, `convenient`, `fastest`) from `provider.js`. |
| **Disruption Diff** | **Mocked** | Hardcoded toggle in `Reroute` screen. Shows a fixed diff. |
| **Diary** | **Working** | Device-local state. Supports photo persistence via base64 encoded strings in memory/localStorage. |
| **Travel DNA** | **Working** | Correctly computes affinities based on selected places and exports a generated SVG. |
| **Pico Mascot (3 states)** | **Working** | Implemented in `src/App.jsx`. Mascot animates between idle, excited, and worried. |
| **Transport API** | **Broken** | The teammate's `services/` (trains, buses, flights) use unconfigured APIs and lack dependencies (`railkit`, `apify-client`). |
| **Auth & Profile** | **Missing** | No login screen, no customizable profile. |
| **Maps & Location** | **Blocked** | `services/places.js` and `distance.js` use Google Places API (which is blocked without keys). Needs migration to OpenStreetMap (OSRM/Nominatim). |
| **Offline Mode (PWA)** | **Missing** | No service worker or `vite-plugin-pwa` installed. Data relies on `zustand-persist` but app shell is not cached. |
| **Uber/Ola Deep Links** | **Missing** | Not present in the frontend UI. |

## 2. Backend & Service Provider Status

- **Places (`services/places.js`)**: Currently tries to hit `places.googleapis.com`. Fallbacks to `places.json` if key is missing. **Must be rewritten to use OSM (Overpass/Nominatim).**
- **Distance/Routing (`services/distance.js`)**: Hits `maps.googleapis.com/maps/api/distancematrix`. **Must be rewritten to use OSRM.**
- **Transport (`services/flights.js`, `trains.js`, `buses.js`)**: Require `VITE_AVIATIONSTACK_KEY`, `VITE_IRCTC_KEY`, `VITE_APIFY_KEY`. These credentials cannot be injected into the frontend. Currently broken.
- **Firebase (`services/firebase.js`, `auth.js`, `trips.js`)**: Real but missing configuration. Cannot be used without real keys and auth setup.
- **Image Upload (`services/media.js`)**: Uses Cloudinary unsigned preset.
- **Overall**: Most services cannot be used in a serverless frontend without exposing keys. We will retain the mock transport data while replacing the location/routing services with free OSM endpoints, which do not require secret keys.

## 3. Prioritized Implementation Plan

1. **Demo Login & Profile**: Create a simple demo auth flow. Create a customizable profile screen. Add the original `Full Logo.png` and `Bird Only.png` properly.
2. **OSM Integration**: Replace Google Places API in `services/places.js` with Nominatim/Overpass. Replace `services/distance.js` with OSRM.
3. **Offline Mode**: Install and configure `vite-plugin-pwa` to cache the app shell and static assets for true offline support. Ensure IndexedDB or localStorage successfully persists data.
4. **Final Polish**: Hook up the profile data to the store, ensure the end-to-end journey respects the profile settings, and perform deep testing on offline scenarios and responsiveness.

## Recovery correction — 2026-10-11

This older inventory is historical. The integration branch now has a local guest/profile, PWA, interactive OSM/OSRM map, local diary/reviews, Travel DNA export, local trips and Vercel provider adapters. Optional Firebase Google sign-in UI is present but cannot activate with the current malformed config. These do not establish live transport, AI, public reviews or shared collaboration. See `PICO_BUILD_STATUS.md` for current verification, blockers and branch reconciliation.
