# Pico build status

## Git safety checkpoint — 2026-10-10

- Original frontend: `8ea54ad`, pushed to `checkpoint/frontend-2026-10-10`.
- Working branch: `integration/frontend-services-2026-10-10`.
- Merge: `7848024`, preserving both unrelated histories without conflicts.
- Teammate main: `3c4dbc5`, including `4f90a71`, `65ce53e`, `687eb21`, `d554738`.
- Main has not been overwritten or pushed. No source exports deleted.
- Added `.gitattributes` to preserve export bytes across Git line-ending conversion; extended `.gitignore` for local screenshots, coverage and credential files.

## Architecture and audit

React 19 / Vite 8 / JavaScript / regular CSS / Framer Motion / Zustand.
Hash navigation in App; Discover plus Journey screens; persisted device-local trip and diary.
The existing UI consumes three Kochi design fixtures and deterministic transport estimates.
The teammate's root services/data/scripts were merged unchanged. A successful frontend build alone does not validate unimported service dependencies.

| Contract | Actual shape / integration constraint |
| --- | --- |
| `getPlaces(city,prefs)` | Array of 50 Goa records: id, coords `[lat,lng]`, avg_cost_inr, images, category, reality_check. Fallback ignores requested city/prefs. Images are placeholders; frontend requires cost/image/caveat/time normalization. |
| `getRealityCheck(id)` | String; generic text on unknown IDs. |
| `searchTrains/Buses/Flights(origin,dest,date)` | Arrays with mode, cost, duration string, url and provider metadata. Not frontend mode-selection objects. Missing railkit/apify-client dependencies; missing trains/buses fallback JSON; flights fallback empty. Never interpret absent fares as free. |
| `getNearby(coords,placeIds,mode)` | Array `{place,mode,time,traffic}`; fallback returns uniform 20-min estimates without provenance. |
| `createTrip(userId,dest,dates,budget)` | `{code,tripId}`; Firestore trip stores budgetEnvelope and member/pool data. Requires Firebase and auth/rules configuration. |
| `joinTrip(code)` | `{tripId}`; authentication required. |
| `subscribeTrip(tripId,callback)` | API wrapper returns Promise of unsubscribe; underlying service is synchronous. Await cleanup carefully. |
| `getPool(tripId)` | `{pool,perPerson}`; not the frontend budget shape. |
| `updatePosition`, `updateDestination`, friends | Firebase writes; deliberately not tested against a real account. |
| `uberLink`, `olaLink` | Pure URL helpers with real coordinates; no booking confirmation. |
| `uploadImage(file)` | Cloudinary unsigned preset `pico_unsigned`; returns URL. Local diary currently needs no cloud credentials. |

## Environment and provider blockers

Existing modules read VITE_GOOGLE_PLACES_KEY, VITE_IRCTC_KEY, VITE_APIFY_KEY,
VITE_NOBLE_KEY, VITE_AVIATIONSTACK_KEY, VITE_FIREBASE_CONFIG and VITE_CLOUDINARY_URL.
No configured credentials were found. Vite exposes VITE variables to the browser:
private transport/API credentials need a server boundary, not frontend environment injection.
Cloudinary must use only a public cloud name with an unsigned preset, never a credential URL.
Firebase web config is public but still requires auth setup and security rules.
No dependencies installed or backend implementation rewritten during preparation.

## Rebuild in progress

User explicitly confirmed full rebuild after the checkpoint. Original tokens/motion remain unchanged;
previously frozen App/Nav/store can change only as needed for this explicitly authorized rebuild.
Source collection: 25 HTML exports, 26 PNG files and two DESIGN notes (53 baseline files).
13 screenshot files contain `<FIFE Image failed to fetch>` rather than image bytes.
Original screenshots cannot supply missing high-resolution destination images.

**Update: 2026-10-10**
- Addressed the competing 544px desktop layout width limit in `styles.css`.
- Fixed missing chip styles (`.chips`, `.chip`) in `styles.css`.
- Core journey successfully verified across Home, Discover, Plan, Reroute, Diary, and Travel DNA via end-to-end browser test.
- Production build runs cleanly (`npm run build`). No console errors in the browser.
- Real services (`getPlaces`, `getRealityCheck`) are integrated and function correctly for the Goa catalog (falling back to placeholder UI where images are null).
- Transport estimates correctly remain labelled as demo data.

Next steps for the next agent:
- Implement a secure backend boundary for transport/API credentials (Firebase, Cloudinary, etc.) to integrate the remaining services.
- Set up authentication flows required for trip joining/creation.
