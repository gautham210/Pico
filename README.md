# Pico

Run from `C:\dev\Pico` with `npm run dev`. Open http://127.0.0.1:5173.

`npm run build` produces `dist`. `npm run preview` serves the production build. The final browser smoke check used `npm run preview -- --port 5180 --strictPort` at http://127.0.0.1:5180. Temporary edit-time reload messages were absent in this fresh production session.
`node tests/core.mjs` checks selection, budget invariants, ordering, transport modes,
reroute decisions, empty trips, persistence, diary state, provider shape and the
SHA-256 hashes of all 53 original source files. No dependencies were added.

## Implemented journey

The shared header and six-tab navigation connect Home, Discover, Plan, Reroute,
Diary and Travel DNA. Browser back and reload retain trip state. Trips is reached
from Home; the schematic Route Explorer is reached from Plan.

Discover has three source-backed places, drag or button pass/keep actions,
place-specific Reality Checks, a budget sheet, details sheet and revisit state.
Plan reflects selections, supports ordering/removal and three distinct transport
estimates. Reroute compares a simulated delay/replacement transfer and supports
accept/reject with synchronised spending. Empty trips clear route adjustments.
Diary supports device-local notes, tier ratings and validated image previews.
DNA calculates the selection mix, shares through browser-native capabilities
with a manual-copy fallback, and exports a self-contained SVG with original branding.
Pico uses extracted original artwork with idle/excited/worried motion; reduced
motion keeps the essential button controls available.

## Source integration and preservation

All 25 HTML exports were inventoried, alongside their screenshots, two design
notes and `Logo.png`. The original exports are preserved byte for byte.

The Discover presentation and photography come from
`discover_swipe_deck_reality_check`. Home follows the Trip Architect setup export.
Plan uses the adaptive itinerary's timeline and transport treatments. Reroute
uses the disruption diff. Diary uses the memory-vault forms and empty/populated
states. DNA preserves its editorial keepsake, affinity chips, spectrum and exact
inline tern illustration. Trips and the dark schematic route follow the vault
and route-explorer visual language. The mascot SVG is extracted from the planning
export, and the shared header uses the original `Logo.png` Arctic Tern wordmark.
Kashi's photo comes from the supplied tier-list export; the profile photo comes
from the supplied travel-vault/profile export. No new artwork was generated.

Thirteen supplied `screen.png` files contain the text `<FIFE Image failed to fetch>`
instead of PNG data. They are not rendered as images. No separate higher-resolution
local destination photography was found. The working original source URLs return
512px images, constrained to appropriate display widths; Google fonts and these
photos still require network access. The original files were not overwritten.

## Provider and scope limits

Costs, transport times, practical caveats and disruption scenarios are demo
estimates, not verified live information, reservations or bookings. Activities
plus one inbound transport leg are included per traveller; accommodation and
return travel are excluded. No configured transport API, backend or valid booking
URLs were found. `src/lib/provider.js` exposes a deterministic provider contract
and the shared mode fixtures. A real provider still needs integration with the
trip-pricing state; no live provider is claimed.

The map is an ordered schematic, not GPS navigation. Trips contains the current
local trip rather than a server-backed trip archive. DNA stamps mean planned
places, not verified visits. The SVG export uses installed font fallbacks; it does
not embed the Google font binaries. Native sharing/clipboard may be denied by the
host browser; copyable text remains available. Diary photos are stored on this
device only, with a visible warning if storage is full or unavailable.

The functional core is implemented. Leaderboards, friend approval, convoy/social
features, carbon/fog-of-war, hotel search, multi-leg booking and full standalone
passport/tier-list screens remain deferred. The source layouts were adapted to
shared live state and responsive screens; this is not an exact pixel reproduction
of every static export.

## Verification

Production build and the core assertions pass. Browser checks exercised both drag
directions and button alternatives, details/Escape, affordability rejection,
empty-trip restart, itinerary ordering/removal, all three modes, reroute accept and
reject, diary note/save/delete, valid preview and invalid-image rejection, DNA
manual-copy fallback and real SVG download, navigation/back and persistence.
The core screens were visually inspected, with representative layouts at actual
viewport widths 320, 360, 375, 390, 430, 768, 1024 and 1440. This was not an exhaustive
screen-by-width cross product. No horizontal overflow was seen in those checks.
Working rendered photos and brand assets were checked for successful load and
native/display dimensions. Browser warning/error logs were clear in the final
smoke check. Screenshots are retained in `tests/screenshots`.

## Files changed in this rescue

Modified: `index.html`, `src/App.jsx`, `src/styles.css`,
`src/components/Button.jsx`, `src/components/Nav.jsx`,
`src/components/Sheet.jsx`, `src/lib/store.js`.

Added: `.gitignore`, `README.md`, `src/screens/Discover.jsx`,
`src/screens/Journey.jsx`, `src/data/places.js`, `src/lib/provider.js`,
`src/assets/tern.svg`, `src/assets/dna-tern.svg`, `tests/core.mjs`,
`tests/source-baseline.json` and visual evidence under `tests/screenshots`.

The existing tokens, motion constants, Badge, entry point, Vite configuration,
package manifest and lockfile were preserved. The checkout began uncommitted,
with no configured remote, so no commit or push was made.
