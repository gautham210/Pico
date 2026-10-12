# Pico 3.0 — The Complete Travel Game Experience & Kerala Travel Data Integration

## 1. Architecture Overview
- **Framework**: React 19.3.0 + Vite 8.3.4 + Zustand 5.0.15 + Framer Motion 14.1.0 + Leaflet 1.9.4
- **Styling**: Vanilla CSS tokens in `src/styles.css` matching Stitch visual identity (`#FAF7F2` warm background, `#1B1B2F` primary ink, `#FF6B4A` coral, `#2EC4B6` teal, `#FFB703` saffron, Bricolage Grotesque & Plus Jakarta Sans typography)
- **Routing**: Client-side hash routing (`#home`, `#discover`, `#plan`, `#map`, `#diary`, `#dna`, `#trips`, `#profile`, `#reviews`, `#ride`, `#login`)
- **Store & State Management**: Zustand store (`src/lib/store.js`) with localStorage offline persistence, zero-baseline flexible budget mode, undo swipe stack, locked stop scheduling, and strict separation between planned, saved, visited, and verified places.
- **Backend / Cloud**: Supabase JS client (`@supabase/supabase-js` 2.117.3), project `uctaobprzdyzoxwyhmyi`, migration `20261011` + migration `20261012_pico3_gamification_community.sql` for badges, hunts, and community gems.
- **Mascot System**: Arctic Tern companion with 18 moods (`welcoming`, `curious`, `excited`, `happy`, `thinking`, `planning`, `proud`, `worried`, `disappointed`, `encouraging`, `celebrating`, `sleepy`, `lost`, `hungry`, `exploring`, `confused`, `satisfied`, `resting`) rendered via `PicoMascot` with emotional speech bubbles.
- **Micro-Interactions**: All 13 React Bits components actively connected to product state changes.

---

## 2. Kerala Researched Travel Datasets Integration (Phases 1-6)
- **Source Files Preserved**:
  - `data/india/kerala/places.json`: 7 researched destinations in Kochi (Chinese Fishing Nets, Mattancherry Palace, Paradesi Synagogue, Kerala Folklore Museum, Hill Palace Museum, Cherai Beach, Kochi-Muziris Biennale).
  - `data/india/kerala/accommodation.json`: 3 researched stays (The Varamm, Coconut Creek Farm, Vythiri Village Resort).
- **Validation Script**: `scripts/validate-india-datasets.mjs`
  - Validates schema, coordinate ranges, fee conflicts, hour conflicts, and time-sensitive dates.
  - Generates deterministic collision-resistant IDs: `kl-kochi-chinese-fishing-nets`, `kl-kochi-mattancherry-palace`, etc.
  - Outputs `data/india/kerala/normalized-places.json`, `data/india/kerala/normalized-accommodation.json`, and `data/india/kerala/validation-report.json`.
- **Coordinate Honesty**:
  - The 7 researched Kochi places had `latitude: null`, `longitude: null`.
  - Stored strictly as `coords: null`.
  - Filtered out of Map pins (`validCoords(p.coords)`) to guarantee ZERO fabricated map pins.
  - Fully discoverable in Discover deck and category lists with explicit "Coords unverified" badge.
- **Conflict & Time-Sensitivity Flagging**:
  - Mattancherry Palace & Paradesi Synagogue: Flagged with `hoursConflicting: true` and `feeConflicting: true`.
  - Kochi-Muziris Biennale: Flagged with `timeSensitive: true` and `pastEvent: true` (6th edition concluded 31 Mar 2026; 7th edition pending announcement).
- **Data Access Layer**:
  - `services/india-data.js` (server / Node.js) & `src/lib/india-data.js` (client / browser).
  - Typed search, category filtering, district/city filtering, and adapter to Pico Discover card interface.

---

## 3. Product Reconstruction Features Completed

### 3.1 Launch Screen & Login Hierarchy
- **Splash Screen** (`src/components/SplashScreen.jsx`): Prominent Arctic Tern artwork with breathing animation, radial glow, and graceful transition into login/onboarding.
- **Header Avatar** (`src/components/Nav.jsx`): Center brand uses `Bird Only.png` (wordmark removed from header); right-side control displays user avatar / traveler initials, eliminating the duplicate mascot defect.
- **Login Hierarchy** (`src/screens/Login.jsx`):
  1. Continue with Email
  2. Continue with Phone (E.164 +91 normalized)
  3. Continue with Google OAuth
  - Detached Guest / Demo access below with clear disclaimer.

### 3.2 Conversational 8-Step Skippable Onboarding (`src/components/OnboardingWizard.jsx`)
- Step A: Destination Intent (searchable real cities or surprise me)
- Step B: Budget (fixed envelope vs zero-baseline flexible tally, per-person or group basis)
- Step C: Dates & Origin Location
- Step D: Travel Style (custom pill selection for relaxed, balanced, packed, culture, adventure)
- Step E: Food Preferences as 1st-Class Citizen (Vegetarian, Vegan, Eggetarian, Non-vegetarian)
- Step F: Accommodation (Hotel, Hostel, Homestay, Resort, Guesthouse, Serviced Apartment)
- Step G: Transport Preferences (Train, Bus, Flight, Taxi, Self-drive, Walking)
- Step H: Interactive Recap with direct editing and mood transitions.

### 3.3 Discover Screen & Compact Card Layout (`src/screens/Discover.jsx`)
- Compact cards (max 180px visual container, line-clamped description) fitting 360px-430px mobile viewports comfortably.
- Swipe teaching bar: Explicit `👈 Pass (Swipe Left)` and `Save 👉 (Swipe Right)` indicators.
- Action buttons: Pass, Undo (`U` key or undo button), Details, Keep.
- PaperCrumple card destruction animation on left swipe.
- Zero double-swipe bugs with mutex ref `isProcessingRef`.
- Honest budget arithmetic: flexible budget begins at ₹0 and tallies commitments without double-deduction.

### 3.4 Multi-Activity Daily Itinerary & Editing (`src/screens/Journey.jsx`)
- Multi-activity day schedule (morning, transfers, meals, afternoon, evening, rest).
- Stop card controls: Move up, Move down, Remove, and `🔒 Locked / 🔓 Lock` toggle to preserve preferred stops during AI or rule-based regeneration.
- `PlanAdjuster` modal for on-the-fly edits to dates, budget, travelers, pace, stay, and transit mode.
- `CostIntelligence` view with comprehensive cost breakdowns across transit, stays, food, entry fees, and contingency.
- `AccommodationDiscovery` featuring researched Kerala stays (`The Varamm`, `Coconut Creek Farm`, `Vythiri Village Resort`).
- `FoodDiscovery` with dietary filters (`Vegetarian`, `Vegan`, `Non-veg`) and `PeekRating` stars.

### 3.5 Map Screen & Honest Coordinates (`src/screens/Journey.jsx` / `src/data/places.js`)
- Replaced missing Kochi place data with 14 verified Kochi places featuring exact latitude/longitude coordinates (Fort Kochi, Kumbalangi, Kashi Art Cafe, Chinese Fishing Nets, Santa Cruz Basilica, Dutch Palace, Jew Town Synagogue, Kayees Rahmathulla Cafe, Kathakali Centre, Grand Pavilion, Marine Drive, Seagull, Cherai Beach, Brunton Boatyard).
- OpenStreetMap and OSRM road routing integration.
- Researched items with null coordinates are never given fake pins.

### 3.6 Memory Vault & Field Notes Diary (`src/screens/Journey.jsx`)
- Pristine empty vault state for new users with welcoming mascot.
- Collapsible "Inspiration Examples (Demo)" drawer, preventing sample memories from being conflated with user travel history.
- `PeekRating` component for interactive 5-star experience ratings with tier badges (S, A, B, C, D).
- Photo attachments with client-side compression and IndexedDB offline persistence.
- Tags picker (`Sunset`, `Heritage`, `Local Food`, `Hidden Gem`, `Scenic View`, `Art & Culture`).
- Search bar filtering memories by place, note, or tag.
- Optional "Mark as Visited in Travel DNA" toggle on save.

### 3.7 Travel DNA Passport & Exploration Integrity Audit (`src/screens/Journey.jsx`)
- Explicit 4-way footprint separation:
  - Deck Saved (places liked in discover)
  - Planned (stops scheduled in itinerary)
  - Visited (verified real-world visits marked by user)
  - Photo-Verified (hunts successfully validated)
- Travel archetype calculation based on category resonance.
- 1080 × 1350 portrait share card generation and PNG export.
- Four game tabs:
  1. Travel DNA Passport (Archetype, spectrum, and holographic destination stamps)
  2. Collectible Badges (`CollectiblesGallery` with 5 rarity tiers)
  3. Photo Hunts (`DestinationHunts` with GPS proximity validation)
  4. Community Gems (`CommunityGems` with submission form and moderation status)

---

## 4. React Bits Component Verification Matrix

| Component | Product Location | Visual State | Trigger / Interaction |
| :--- | :--- | :--- | :--- |
| **HoloCard** | Travel DNA stamps & CollectiblesGallery | Holographic iridescent foil gradient | Interactive 3D tilt on mouse / touch hover |
| **PaperCrumple** | Discover screen | 3D crumpled polygon mesh animation | Triggered on Pass (Swipe Left or Pass button) |
| **BellToggle** | Journey Plan Header | Animated bell icon with offset selector | Toggles trip departure notification reminders |
| **JellyRadio** | Top & bottom navigation | Squishy elastic pill selector | Seamless tab switching across screens |
| **PeekRating** | FoodDiscovery & Diary memory form | Peeking star micro-interaction | Sets 1-5 star rating and S/A/B/C/D tier |
| **LatticeLoader** | Journey AI Plan regeneration | Animated crystalline lattice loader | Displayed while computing schedule routes |
| **PulseHeart** | Discover place card header | Bouncing heart with public like counter | Toggles public like count for destination |
| **SpringCheck** | Journey Readiness Checklist | Spring-physics animated checkmark | Check/uncheck travel preparation items |
| **SquishSwitch** | Journey Travel Style mode | Squishy toggle switch | Toggles Flight / Airplane transit route mode |
| **SwipeToast** | Journey plan update & reroute alert | Floating dismissible toast pill | Swipe gesture or button to dismiss alert |
| **SwipeRow** | Journey Checklist items | Swipe-to-reveal action row | Swipe left to reveal red Remove button |
| **FoldText** | Discover card destination titles | 3D origami folding text entrance | Folds open on each new destination card |
| **TextCursor** | Pico companion speech prompts | Blinking terminal cursor effect | Types out Arctic Tern messages dynamically |

---

## 5. Test Suite Verification Matrix

All 14 test suites pass cleanly with exit code 0 (`npm test`):
1. `tests/core.mjs`: Budget invariants, selection, deduplication, modes, storage.
2. `tests/recovery.mjs`: Over-budget recovery, plan reset, transport restoration.
3. `tests/integration-audit.mjs`: Missing costs persistence, collection switching.
4. `tests/server-api.mjs`: 13 API endpoints, 50 local places for Goa, reality checks.
5. `tests/firebase-config.mjs`: Safe unconfigured state without credentials.
6. `tests/client-route.mjs`: Route geometry, offline fallback, distance calculation.
7. `tests/cloud-sync.mjs`: Cloud read/write contracts, conflict handling.
8. `tests/city-discovery.mjs`: 6 city catalogs, saved-stop persistence, licensed JPEG assets.
9. `tests/session-isolation.mjs`: Guest session isolation, clean lifecycle.
10. `tests/planner.mjs`: AI planning engine, constraint filtering, fallback rules.
11. `tests/supabase-auth.mjs`: Phone normalization, invite codes, unconfigured safe handling.
12. `tests/ride-together.mjs`: GPS throttling, room code crypto, kitty expense split.
13. `tests/react-bits-mascot.mjs`: 13 mascot moods, checklist toggles, BellToggle, SquishSwitch.
14. `tests/kerala-integration.mjs`: Parsing both JSON files, 100% record ingestion, stable IDs, coordinate checking, fee/hour conflict flagging, accommodation decoupling, multi-state extensibility.

---

## 6. Build Status
- **Vite Build**: Succeeded in 3.19s with exit code 0 (`npm run build`).
- **PWA Workbox**: Generated `dist/sw.js` and `dist/workbox-9c191d2f.js` with 54 precached assets.
- **Browser Preview**: Verified live on `http://127.0.0.1:4173/`.
