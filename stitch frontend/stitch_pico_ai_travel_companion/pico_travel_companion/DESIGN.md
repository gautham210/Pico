---
name: Pico Travel Companion
colors:
  surface: '#f8f9ff'
  surface-dim: '#d2dbe9'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5effd'
  surface-container-high: '#e0e9f7'
  surface-container-highest: '#dae3f1'
  on-surface: '#131c26'
  on-surface-variant: '#5a403d'
  inverse-surface: '#28313c'
  inverse-on-surface: '#e9f1ff'
  outline: '#8e706b'
  outline-variant: '#e3beb9'
  surface-tint: '#b5261b'
  primary: '#b5261b'
  on-primary: '#ffffff'
  primary-container: '#ff5b49'
  on-primary-container: '#600001'
  inverse-primary: '#ffb4a9'
  secondary: '#006a64'
  on-secondary: '#ffffff'
  secondary-container: '#77f3e9'
  on-secondary-container: '#006f69'
  tertiary: '#7e5700'
  on-tertiary: '#ffffff'
  tertiary-container: '#c38806'
  on-tertiary-container: '#3d2800'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4a9'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#920505'
  secondary-fixed: '#7af6ec'
  secondary-fixed-dim: '#5bdad0'
  on-secondary-fixed: '#00201e'
  on-secondary-fixed-variant: '#00504b'
  tertiary-fixed: '#ffdead'
  tertiary-fixed-dim: '#fdbb42'
  on-tertiary-fixed: '#281900'
  on-tertiary-fixed-variant: '#604100'
  background: '#f8f9ff'
  on-background: '#131c26'
  surface-variant: '#dae3f1'
typography:
  display-hero:
    fontFamily: Bricolage Grotesque
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 60px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 38px
    fontWeight: '800'
    lineHeight: 42px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Bricolage Grotesque
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Bricolage Grotesque
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 18px
  label-code-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: -0.01em
  label-code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system expresses the poetic wonder of discovery fused with the calculated precision of an intelligent travel copilot. Drawing visual inspiration from the serene architectural geometries of *Monument Valley* and the tactile luxury of independent editorial travel magazines (like *Cereal* and *Drift*), it intentionally diverges from clinical, transaction-obsessed travel booking platforms.

### Core Character & Atmosphere
- **Editorial Warmth:** Warm ivory backgrounds simulate heavyweight uncoated art paper, creating an inviting, unhurried reading environment.
- **Vibrant Serendipity:** Saturated coral and oceanic teal anchor key moments of excitement and navigational reassurance, mimicking coastal dawns and tranquil shores.
- **Tactile Companionship:** Smooth squircle surfaces, nested pill indicators, and the watchful presence of the Arctic Tern mascot cultivate deep personal trust and playfulness.
- **Architectural Clarity:** Layouts celebrate deliberate asymmetry, sweeping scenic heroes, and calm typography hierarchy that treats itineraries as curated narratives rather than dense spreadsheets.

## Colors

The palette balances warm organic substrates with vivid navigation accents and deep, legible ink.

### Palette Architecture
- **Base Canvas (`#F7F3EA`):** Warm Ivory serving as the default ambient canvas, cutting harsh digital glare and evoking unbleached paper.
- **Surface Elevation (`#FFFCF7`):** Warm Pure Paper used for cards, floating modals, and bottom sheets to lift interactive elements softly off the canvas.
- **Deep Ink (`#17202A`):** The foundational dark neutral for headlines, deep contrast cards, and high-emphasis body text, ensuring pristine legibility.
- **Primary Coral (`#FF5B49`):** The signature action color. Drives primary calls-to-action, itinerary selections, love reactions, and key highlights.
- **Calm Sea Teal (`#2DB7AE`):** The secondary anchor. Denotes progress, real-time tracking, validated paths, water-adjacent elements, and smart confirmations.
- **Saffron Gold (`#F4B33B`):** The tertiary accent. Used for ratings, curated gems, badges, weather cues, and "Trophy/Tier" stamps.
- **Muted Slate (`#8B8B9E`):** Secondary metadata, inactive states, hairline dividers, and supporting travel notes.
- **Alert Red (`#E5484D`):** Disruption alerts, delayed connections, and immediate warnings requiring traveler attention.
- **Subtle Border (`#EADBCE`):** Delicate warm hairline strokes that outline squircle cards without introducing cold synthetic borders.

## Typography

The typographic hierarchy intentionally combines personality, human warmth, and computational precision.

- **Bricolage Grotesque (Headlines & Editorial Titles):** Infuses organic curves, expressive ink-traps, and confident European editorial voice. Used for all primary page titles, destination names, and hero headlines.
- **Plus Jakarta Sans (Body & Narrative Interfaces):** Ensures clean, balanced legibility across long itinerary descriptions, travel tips, and conversational assistant cards.
- **JetBrains Mono (Metadata, Timestamps & Costs):** Anchors operational travel logistics—such as `10:20 AM`, `₹12,650`, flight callouts `IndiGo 6E 722`, and live delay badges `+95m`. This technical contrast prevents the editorial feel from obscuring critical logistical clarity.

## Layout & Spacing

The layout is architected around a mobile-first companion viewport that expands smoothly into an editorial multi-column magazine format on desktop screens.

### Grid & Composition Rules
- **Mobile Handheld (360px - 430px):** Single-column vertical stream with `1rem` (16px) margins. Bottom nav rail and thumb-zone card swiping retain fixed safe-area offsets (bottom inset: 24px + system nav).
- **Desktop Canvas (1024px+):** Max-width 1280px container utilizing a 12-column grid with `1.5rem` (24px) gutters. Editorial splits pair dynamic itinerary timelines alongside interactive contextual maps and assistant chat drawers.
- **Content Rhythms:** Cards and modules stack with consistent `space-md` (16px) intervals, expanding to `space-xl` (32px) between days or thematic phases of a trip.

## Elevation & Depth

Visual depth follows a tactile "stacked paper and coastal light" metaphor rather than synthetic drop shadows.

- **Level 0 (Base Canvas):** Uncoated `#F7F3EA` ground plane.
- **Level 1 (Card & Module Layer):** `#FFFCF7` paper with a micro hairline border (`1px solid #EADBCE`) and an ambient, low-slung shadow: `box-shadow: 0 4px 16px -2px rgba(23, 32, 42, 0.04), 0 2px 6px -1px rgba(23, 32, 42, 0.02)`.
- **Level 2 (Interactive Floating Cards / Discover Deck):** Swipable discovery cards and active selections float higher: `box-shadow: 0 12px 32px -4px rgba(23, 32, 42, 0.08), 0 4px 12px -2px rgba(23, 32, 42, 0.04)`.
- **Level 3 (Modals, Disruption Drawers & Overlays):** Deep ambient spread: `box-shadow: 0 24px 48px -8px rgba(23, 32, 42, 0.14)`. Accompanied by a warm frosted backdrop blur (`backdrop-filter: blur(8px); background-color: rgba(247, 243, 234, 0.72)`).

## Shapes

The design system embraces generous, friendly geometric roundness inspired by organic stones and architectural archways.

- **Squircle Containers (24px to 32px):** Primary discovery cards, itinerary blocks, and hero image framing utilize `24px` to `32px` corner radii, softening content edges and guiding focus inward.
- **Pill Geometry (Full Capsule):** Buttons, filter tags, category chips, rating badges, and tab bars use full pill radiuses (`rounded-full` / `9999px`) to create an inviting, tap-optimized experience.
- **Stamp & Notch Details:** Selected trip badges and diary passport stamps introduce subtle serrated or notched outlines to emulate physical travel postage.

## Components

### Buttons
- **Primary Coral Action:** Solid `#FF5B49` fill, white `#FFFFFF` text in Plus Jakarta Sans SemiBold, full pill radius (`rounded-full`), padded `14px 24px`. On hover/tap: subtle scale (0.98) with gentle deep coral glow.
- **Secondary Ink Button:** Solid `#17202A` fill with white text, ideal for prominent utility actions like "View on Map".
- **Ghost & Neutral Pills:** Soft `#FFFFFF` or `#F7F3EA` pill backgrounds with `#17202A` text and subtle `#EADBCE` border for secondary navigational steps.

### Chips & Filter Tags
- **Filter Tags:** Pill-shaped capsules. Inactive state: `#FFFFFF` with muted text (`#8B8B9E`) and hairline border. Active state: `#EAF8F7` background with `#2DB7AE` text, or soft coral tint `#FFF0EE` with `#FF5B49` text.
- **Cost & Logistics Chips:** JetBrains Mono font encased in soft rounded badges (`rounded-lg`, 8px padding), utilizing tinted backgrounds (e.g., `#F4F8F7` for cheapest, `#FFF3F1` for fastest).

### Discovery & Itinerary Cards
- **Discovery Swipe Deck:** High aspect ratio squircle container (`rounded-3xl`), overlaid with bottom gradient vignette, rich destination imagery, editorial title (`Bricolage Grotesque`), and nested metadata badges. Floating round action triggers (cross, info, heart) anchored along the bottom.
- **Timeline Step Cards:** Connected by a continuous vertical teal or slate route node. Each step card features crisp JetBrains Mono timestamps (`1:00 PM`), clear venue headings, and real-time transit connectors.

### Mascot States (The Arctic Tern)
- Integrates dynamically into empty states, loading recalculations ("Pico is planning your trip..."), adaptive disruption alerts, and personality milestones. Styled with sharp clean linework and signature coral beak accents.

### Alerts & Disruption Notices
- Pill-curved banner or bottom drawer surfaced in `#FFF3F1` with an `#E5484D` icon and highlight border. Houses clear side-by-side comparative diffs between "Original Plan" and "New Plan" with mono-tagged delta indicators (`+₹770`, `+1h 35m`).

### Passport Stamps & Diary Badges
- Stamp modules with micro serrated borders, saffron gold rating markers (`S Tier`, `4.6 ★`), and postal-style location typography celebrating visited locations.