# Pico environment-variable audit

This audit lists references in application and service code, not values in any local environment file. `.env`, `.env.local`, `.env.*`, and root `/env` are ignored by Git; `.env.example` is the only exception and contains placeholders only.

## Vercel Function provider variables

| Vercel variable | Read by | Requiredness and safe exposure | Expected format | Missing behavior |
| --- | --- | --- | --- | --- |
| `IRCTC_KEY` | `services/trains.js:7`, through alias mapping in `services/env.js:3` | Optional for the app; required for live train search. Server only; never use the supplied `VITE_` spelling in Vercel. | Opaque Railkit provider API key. Requests require 2–5 character uppercase/digit station codes and the service converts ISO date to Railkit's `DD-MM-YYYY`. | Train module checks `data/fallback/trains.json`; it is currently empty, so endpoint says `UNAVAILABLE`. |
| `APIFY_KEY` | `services/buses.js:7`, through `services/env.js:3` | Optional for the app; required for live bus search. Server only. | Apify API token. Existing code calls `curious_coder/redbus-scraper` with `from`, `to`, `date`; run timeout is bounded. | Checks `data/fallback/buses.json`; it is currently empty, so endpoint says `UNAVAILABLE`. |
| `NOBLE_KEY` | `services/flights.js:47`, through `services/env.js:3` | Optional; first-choice live flight provider. Server only. | Opaque Noble bearer/API key sent in authorization headers. Flight inputs must be 3-letter IATA codes. | Falls through to Aviationstack if its key is also configured; otherwise checks the empty flight fallback and returns `UNAVAILABLE`. |
| `AVIATIONSTACK_KEY` | `services/flights.js:48`, through `services/env.js:3` | Optional; secondary flight provider, or sole provider if Noble is absent. Server only. | Aviationstack access key. The upstream provider expects IATA codes. It is sent only from the server function. | Empty local flight fallback produces `UNAVAILABLE`. |
| `GOOGLE_PLACES_KEY` | `api/places.js:10`, `services/providers/google-places.js:6`, `services/providers/google-distance.js:7`, via `services/env.js:3` | Optional Google Places and Distance Matrix provider. Server only. | Google Cloud API key with the Places API and, for matrix calls, the required Distance Matrix API enabled and billing configured. | Place requests use the local city catalogue when available; distance requests report `UNAVAILABLE` and never invent a route. |
| `OSM_PLACES_ENDPOINT` | `api/places.js:11`, via `services/env.js:3` | Optional custom named-place search service. Server only (URL is not sent back). | HTTPS endpoint compatible with the existing Nominatim-style query and response contract. The public `nominatim.openstreetmap.org` host is explicitly rejected by the service. | Named OSM search reports unavailable; curated city data remains available. |

The server helper maps `env('VITE_X')` to `process.env.X` in Node (`services/env.js:3`) and no longer falls back to `process.env.VITE_X`. Configure the unprefixed names above in Vercel Preview. Do not configure provider keys as `VITE_*`: Vite-prefixed variables are client-build inputs by convention. Automated coverage confirms a prefixed Noble key is ignored by the server adapter.

## Browser configuration and optional values

| Variable | Read by | Requiredness and safe exposure | Expected format | Missing behavior |
| --- | --- | --- | --- | --- |
| `VITE_FIREBASE_CONFIG` | `services/firebase.js:7`, via `services/env.js:4` | Optional for the current local/demo frontend; required if Firebase auth/database modules are used. Browser-visible Firebase Web App configuration is public by design, but authorization must come from Firebase Auth, Security Rules and App Check—not the config string. | JSON object serialized as a string, normally containing `apiKey`, `authDomain`, `projectId`, `appId`, and `databaseURL` for the initialized Realtime Database. This project initializes Firebase Auth, Firestore, and Realtime Database. | Firebase modules initialize without a usable project configuration; authentication and remote data operations cannot work. Shared trips are not verified. |
| `VITE_CLOUDINARY_URL` | `services/media.js:5`, filtered by `services/env.js:5` | Optional and public only when it contains a cloud name. The browser helper rejects values containing `://`, so do not supply a credential URL or API secret. | Cloudinary cloud name only. Upload code uses the existing unsigned upload preset `pico_unsigned`; that preset must exist and allow unsigned image uploads. | Existing upload module throws when invoked. Current diary uses local IndexedDB and does not require this. |
| `VITE_OSM_TILE_URL` | `src/components/InteractiveMap.jsx:21` | Optional, browser-visible tile URL template. | HTTPS tile URL containing `{z}`, `{x}`, `{y}` placeholders. | Uses the existing OpenStreetMap tile URL and attribution. |
| `VITE_RAPIDAPI_KEY` | No application-code reference found | Unused; do not add it to Vercel unless a future inspected integration requires it. | None. | No current feature changes. |

No AI-provider environment variable or `process.env` access was found in the inspected app/service code. The currently supplied `VITE_IRCTC_KEY`, `VITE_APIFY_KEY`, `VITE_NOBLE_KEY`, and `VITE_AVIATIONSTACK_KEY` names do not need to be renamed in source because `services/env.js` strips the `VITE_` prefix in Node; for Vercel, set the corresponding unprefixed server names above so they stay out of the browser build.

## Vercel Preview configuration checklist

No provider credential is required for a build or for the local/demo journey. To enable actual provider requests, add these as Preview-only Vercel environment variables:

- Train search: `IRCTC_KEY`.
- Bus search: `APIFY_KEY`.
- Flight search: at least one of `NOBLE_KEY` or `AVIATIONSTACK_KEY`.
- Google place search / Google distance alternatives: optional `GOOGLE_PLACES_KEY` with the matching APIs enabled.
- Custom OSM-compatible named place search: optional `OSM_PLACES_ENDPOINT`.
- Firebase-backed auth/data, if enabled in a later UI integration: `VITE_FIREBASE_CONFIG` containing the public Web App config; Firebase project Auth providers, Firestore, Realtime Database, Security Rules, and authorized Preview domains must be configured separately.
- Cloudinary uploads, if enabled in a later UI integration: optional `VITE_CLOUDINARY_URL` cloud name and the existing unsigned `pico_unsigned` preset configured in Cloudinary.
- Map tiles require no extra value; `VITE_OSM_TILE_URL` is optional.

No `.vercel` project link was found during this pass. The Vercel CLI is installed, but no deployment or Preview credential configuration was attempted. The repository's `api/*.js` files use Vercel's default Node.js Function convention and ESM package mode; Vercel documents root `api/` functions for Vite projects and Node.js as the default Function runtime. `vercel.json` caps each function at 15 seconds; provider fetches use 8-second timeouts and the handler boundary responds unavailable after 12 seconds. The package pins Vercel's Node major to 22, compatible with the local Node 22.18 build runtime. Vercel deployment was not performed.

## Secret-file ignore verification

`git check-ignore -v` confirmed ignore rules for `.env`, `.env.local`, and root `env`; `.env.example` is intentionally not ignored. The ignore patterns also cover `.pem`, `.key`, `credentials*.json`, and `service-account*.json`. The actual ignored local `env` file was not opened, printed, staged, or changed.
