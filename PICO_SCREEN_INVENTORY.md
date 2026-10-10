# Pico Stitch screen inventory

Repository/source comparison performed 2026-10-11 on `integration/frontend-services-2026-10-10` at `d868c6c`.

The `stitch frontend` root contains 21 design folders, 25 HTML exports, two `DESIGN.md` files and 25 `screen.png` files. The two folders without standalone HTML are shared design references. Several screenshots are tiny failed-fetch markers; do not treat those files as usable visual references. The HTML exports embed their styles and scripts and include responsive viewport metadata. The original export tree is preserved.

| Stitch folder | Intended stage / source pattern | Current React mapping and navigation | State / interaction coverage | Responsive notes / status |
|---|---|---|---|---|
| `pico_ai_travel_companion_landing_page` | Welcome / product landing and primary call to action | `src/screens/Login.jsx`, shown before `Home` | Local guest entry works; Firebase sign-in is not connected in this checkout | Source has responsive viewport; landing/auth treatment is only partial |
| `pico_travel_companion` | Shared design tokens, typography and layout rules | `src/styles.css`, `src/lib/tokens.js` | Shared styles exist; export notes document brand palette and typography | Design reference only; source note preserved |
| `stitch_pico_ai_travel_companion` | Alternate / consolidated product reference | No dedicated React screen | No state mapping | Folder contains no standalone HTML or screenshot |
| `where_to_next_discovery_trip_setup` | Home, destination, budget and trip setup | `Home` / `TripParameters`, `#home` | Origin, city, date, days, travellers, per-person budget and pace persist locally | Responsive form; only Kochi/Goa collections are available |
| `discover_swipe_deck_reality_check` | Place discovery, keep/pass and caveats | `src/screens/Discover.jsx`, `#discover` | Touch drag and buttons keep/pass, details sheet, local filters, budget; unknown costs are now retained as unknown | Responsive deck/sidebar; curated Goa entries have no source photos |
| `live_map_dark_mode_route_explorer` | Map exploration and ordered route | `src/components/InteractiveMap.jsx`, `MapScreen`, `#map` from Plan | OSM tiles, attribution, validated pins, selection and OSRM route when available; geolocation is explicit | Desktop view was previously inspected; exact phone matrix not reverified in this recovery |
| `plan_my_trip_intelligent_planning_state` | Planning/loading and transport comparison | `Plan`, `#plan` | Itinerary uses deterministic rules; provider lookup endpoints can be queried separately; actual transport results are unavailable without credentials | Partial: no live AI planner or sourced three-mode comparison |
| `your_itinerary_adaptive_timeline` | Multi-day timeline and cost summary | `Plan`, `#plan` | Reorder/remove, pace buffer, budget and route action; local deterministic split | Partial: dates/transfers/feasibility are not provider-backed |
| `disruption_diff_adaptive_resilience` | Proposed change and before/after diff | `Reroute`, `#reroute` | Reproducible local simulation; accept/reject changes local estimate and timing | Clearly demo-only; no disruption feed |
| `group_travel_lobby_live_convoy` | Authenticated trip lobby and convoy | `Trips`, `#trips` | UI explicitly disables create/join as the active identity is a local guest; Firebase services exist but are not wired | No real group or realtime layout yet |
| `trips_dashboard_upcoming_past_journeys` | Upcoming/past trip overview | `Trips`, `#trips` | Current local draft summary and shortcuts | Partial: no remote trip history |
| `trips_empty_state` | No trips empty state | `Trips`, `#trips` | Local empty state links to Discover/Plan | Source empty state represented, but not pixel-matched |
| `trips_interactive_empty_populated_state` | Empty and populated trip variants | `Trips`, `#trips` | Draft state can be empty/populated from saved places | No authenticated trip collection or past-trip lifecycle |
| `trip_diary_empty_state` | Diary empty state | `Diary`, `#diary` | Empty prompt and local create flow | Partial source treatment |
| `trip_diary_interactive_empty_populated_state` | Diary with saved memories | `Diary`, `#diary` | Add/edit/delete, IndexedDB photo blobs, local persistence | Browser file selection and photo refresh still require fresh verification |
| `trip_diary_rating_travel_memory` | Rated memory detail | `Diary`, `#diary`; separate `Reviews` at `#reviews` | Diary tier rating and a distinct 4-part local review editor | Public reviews are unavailable; no server feed/visibility rules |
| `your_travel_dna_archetype_stamps` | Archetype, affinities and share card | `DNA`, `#dna` | Local selected places/memories drive archetype; card export/share | PNG code and original brand art exist; actual download file inspection is outstanding |
| `passport_stamps_empty_state` | Passport / stamps empty state | No dedicated React screen | Not implemented | Missing screen |
| `passport_stamps_interactive_empty_unlocked_state` | Stamp unlock and passport collection | No dedicated React screen | Not implemented | Missing screen |
| `place_tier_list_s_to_d_ratings` | Post-visit place rating and tiers | Diary offers one tier field; no tier-list screen | Rating stored locally in a diary memory, not a standalone tier workflow | Missing designed screen and tier sorting |
| `profile_travel_vault_accolades` | Profile, preferences, travel vault | `Profile`, `#profile` | Local name/avatar/preferences and review link | Partial: no Firebase identity, friends or remote history |

## Implementation gaps confirmed

- Frontend entry/build infrastructure exists only on the integration branch. `origin/main` is an ancestor of that branch and has a minimal backend `package.json`/lockfile, but no root `index.html`, frontend `src/`, Vite configuration, `api/` functions or Vercel configuration; this explains a root deployment 404 at that revision.
- Firebase Auth, Firestore and Realtime Database modules exist, but the current UI is local guest-only. There are no Firebase rules/config files in the repository, and the ignored local Firebase config value is not valid JSON. No two-account verification is available.
- Train, bus and flight serverless adapters are present, but their private server credentials and usable cached results are absent. Transport tabs on the itinerary remain explicitly demo estimates.
- AI/orchestrator code and provider configuration are absent. The itinerary is deterministic; it does not claim that a model generated it.
- Public reviews, friend workflows, shared expenses and trip membership UI are not integrated. Local reviews are never labelled public.
- The Stitch source is retained and hash-checked, but most screens are React recreations rather than pixel-exact ports. Original Stitch screenshots with failed image fetches cannot validate exact pixels.

## Recovery approach

The integration branch is clean and pushed at `d868c6c`; `origin/main` and the original frontend checkpoint are ancestors, so history is related and can be reconciled with a normal fast-forward after product acceptance. Do not force-push or merge into `main` before authentication, deployment target, service configuration and browser acceptance are established. No actual Vercel URL or linked Vercel project is recorded in the repository, so the reported production URL cannot yet be independently tested.
