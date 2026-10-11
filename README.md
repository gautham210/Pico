# PICO

<h3 align="center"><em>Swipe the world. Pico plans it, books it, and remembers it.</em></h3>

<p align="center">
  <strong>Built in 12 hours at LAYOVER 2026 — TinkerSpace Calicut</strong>
</p>

---

**Pico** is an **agentic travel companion** built around a **swipe deck**.

Swipe places instead of profiles. Every swipe trains a preference model. When you're done, an **AI orchestrator** builds a **real, costed, bookable, multi-modal itinerary** — then hands you a booking link. During the trip, it watches for disruptions and shows you a **diff**, not a re-plan.

Live Website Link : https://pico-vert.vercel.app/

---

## 💡 The Idea

AI travel planners are everywhere. Most of them **lie** — not on purpose, but because they only tell you the good parts.

**Pico is the one that tells the truth.**

Every place carries a **Reality Check** — one honest caveat a traveler would want to know.

> *"Locals say it's packed after 2 PM."*
> *"Closed Mondays — plan around it."*

**No other planner does this**, because the biggest one sells placements to the businesses it reviews.

---

## 🔄 The Loop

```
   SWIPE  →  PLAN  →  TRAVEL  →  UPLOAD  →  RATE  →  SHARE
     ↑                                                  │
     └───────── preference model learns every cycle ────┘
```

| Stage | What happens |
|---|---|
| 🃏 **Swipe** | Discover places. Budget updates live. AI learns what you like. |
| 🧠 **Plan** | AI queries real trains, buses, and flights **in parallel**, then builds a costed itinerary. |
| ✈️ **Travel** | Deep links to Uber and IRCTC. Live group map. Disruption recovery. |
| 📸 **Upload** | Photos → AI writes your travel diary. |
| ⭐ **Rate** | Tier list (S/A/B/C/D) on every place you actually visited. |
| 🎴 **Share** | Travel DNA card, exportable as an image. |

---

## 🎯 Features

### 🃏 Discovery

- **Swipe deck** — 3 cards visible, drag to commit, spring physics
- **Reality Check** — one honest caveat per place, **written by hand**
- **Live budget counter** — morphs on every swipe
- **Rarity tiers** — Common / Rare / **Legendary Hidden Gem**
- **Pico mascot** — an Arctic Tern that reacts to your decisions

### 🧠 Planning

- **Agentic orchestrator** — a **tool-calling agent**, not a chatbot. It never invents a price.
- **Three transport modes** — **Cheapest · Fastest · Convenient**, ranked from the same data
- **Custom constraints** — no flights, depart after, must arrive by, budget cap
- **Pacing heuristic** — one major timed ticket per day, rest flexible
- **Day-level route optimization** — minimize backtracking

### ✈️ Travel

- **Disruption diff** — when a train is delayed, see **old plan vs. new plan**, not a re-plan
- **Live group map** — two phones, one map, real-time member pins
- **Pooled budget** — one shared pot, per-person spend tracking
- **Uber / Ola deep links** — one tap to book a ride

### 📖 Memory

- **AI-written diary** — upload photos, get a journal entry
- **Tier list** — S/A/B/C/D on every place you visited
- **Preference model** — tier ratings weighted **4×** above swipes
- **Travel DNA card** — shareable identity card

---

## ⚡ The Four Differentiators

> **1. Reality Check** — one honest caveat per place. **Structurally impossible for TripAdvisor** because they sell placements to the businesses they review.

> **2. Three transport modes** — Cheapest, Fastest, Convenient, from a **single API call**.

> **3. Disruption diff** — show the **diff**, not a re-plan. **Nobody does this.**

> **4. Tier ratings weighted 4×** — the AI learns more from **one real trip** than a hundred swipes.

---

## 🛠️ Tech Stack

| Layer | Choice |
|---|---|
| **Frontend** | React + Vite |
| **Styling** | Tailwind |
| **Animation** | framer-motion |
| **Mascot** | Rive |
| **Maps** | MapLibre GL |
| **State** | Zustand |
| **Backend** | Node + Express |
| **AI** | GPT-6 Astra / Gemini 2.5 Flash |
| **Database** | Firestore (metadata) + Realtime DB (live positions) |
| **Auth** | Firebase Auth |
| **Media** | Cloudinary |
| **Deploy** | Vercel |

### 🔌 APIs

| Service | Purpose |
|---|---|
| **Google Places (New)** | Place data, `neighborhoodSummary` for Reality Checks |
| **Distance Matrix** | Traffic-aware travel times for the hotel-nearby panel |
| **railkit** | Indian Railways (trains) |
| **Apify redBus** | Bus schedules and fares |
| **Aviationstack / Noble** | Flight status and search |
| **Uber / Ola** | Deep links for ride hailing |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────┐
│  React Client                            │
│  Swipe deck · Budget bar · Itinerary     │
│  Pico · Lobby · Live map · Diary         │
└────────────────┬─────────────────────────┘
                 │
┌────────────────▼─────────────────────────┐
│  AI Orchestrator                         │
│  Tool registry · Preference model        │
│  Modes · Disruption engine               │
└────────────────┬─────────────────────────┘
                 │
   ┌──────┬──────┼──────┬──────┬─────────┐
   ▼      ▼      ▼      ▼      ▼         ▼
Trains  Buses  Flights Places  Uber  Cloudinary
```

> **The agent pattern:** the model decides *when* to call real APIs, then reasons over real data. Transport tools are called **in parallel** — sequential calls feel dead on stage.

---

## 📁 Project Structure

```
/
├── app/                    Frontend
│   ├── components/
│   │   ├── SwipeCard.jsx
│   │   ├── BudgetBar.jsx
│   │   ├── RealityCheck.jsx
│   │   ├── Pico.jsx
│   │   ├── ModeToggle.jsx
│   │   └── DisruptionDiff.jsx
│   ├── screens/
│   │   ├── SwipeDeck.jsx
│   │   ├── Itinerary.jsx
│   │   ├── Lobby.jsx
│   │   ├── LiveMap.jsx
│   │   └── Profile.jsx
│   └── lib/
│       ├── tokens.js
│       ├── motion.js
│       └── store.js
│
├── orchestrator/           AI agent
│   ├── index.js
│   ├── systemPrompt.js
│   ├── tools.js
│   ├── modes.js
│   ├── disruption.js
│   └── prompts/
│
├── services/               APIs + Firebase
│   ├── api.js              ← the contract
│   ├── firebase.js
│   ├── auth.js
│   ├── trains.js
│   ├── buses.js
│   ├── flights.js
│   ├── places.js
│   ├── trips.js
│   └── positions.js
│
└── data/                   Static data
    ├── places.json         50 places
    ├── reality_checks.json 50 hand-written caveats
    └── fallback/           Cached API responses
```

---

## 🚀 Setup

### Prerequisites

- **Node.js LTS**
- **npm**
- A **Firebase project**
- **API keys** (see below)

### Install

```bash
git clone <repo>
cd pico
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_GOOGLE_PLACES_KEY=
VITE_IRCTC_KEY=
VITE_APIFY_KEY=
VITE_AVIATIONSTACK_KEY=
VITE_NOBLE_KEY=
VITE_CLOUDINARY_URL=
VITE_FIREBASE_CONFIG=
```

### Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Google + Anonymous
3. Enable **Firestore Database** → test mode
4. Enable **Realtime Database** → test mode
5. Copy the web app config into `VITE_FIREBASE_CONFIG`

### Run

```bash
npm run dev
```

App runs at **http://localhost:5173**.

### Deploy

```bash
vercel
```

Set all environment variables in the **Vercel dashboard**, then redeploy.

---

## 📜 The Contract

All frontend and orchestrator code calls these functions from `/services/api.js`. **Signatures are frozen.** If you need a change, message the services owner.

```js
// ─── External ─────────────────────────────────────
searchTrains(origin, dest, date)   → [{ mode, cost, duration, url }]
searchBuses(origin, dest, date)    → [{ mode, cost, duration, url }]
searchFlights(origin, dest, date)  → [{ mode, cost, duration, url }]
getPlaces(city, prefs)             → [Place]
getRealityCheck(placeId)           → string
getNearby(coords, placeIds, mode)  → [{ place, mode, time, traffic }]

// ─── Social ───────────────────────────────────────
createTrip(userId, dest, dates, budget)  → { code, tripId }
joinTrip(code)                           → { tripId }
subscribeTrip(tripId, cb)                → unsubscribe
updatePosition(tripId, userId, lat, lng)
updateDestination(tripId, place)
getPool(tripId)                          → { pool, perPerson[] }
addFriend(username)
```

---

## 🎨 Design System

| Token | Hex |
|---|---|
| **Background** | `#FAF7F2` |
| **Ink** | `#1B1B2F` |
| **Coral** | `#FF6B4A` |
| **Teal** | `#2EC4B6` |
| **Saffron** | `#FFB703` |
| **Muted** | `#8B8B9E` |
| **Danger** | `#E5484D` |

- **Fonts:** **Bricolage Grotesque** (display) · **Plus Jakarta Sans** (body) · **JetBrains Mono** (labels)
- **Radius:** cards **28px** · pills **999px** · inputs **16px**
- **Shadows:** colored only — `0 8px 32px rgba(255,107,74,0.12)`
- **Motion:** spring `{ stiffness: 180, damping: 20 }` · **200–400ms**
- **Grain:** SVG `feTurbulence` at **3–5% opacity**, fixed

> ⚠️ **Rules:** max **3 colors per screen** · squircle curves **not** circles · no emoji icons · no neon · no rainbow gradients.

---

## 🐦 The Mascot

**Pico** is an **Arctic Tern** — the most-traveled animal on Earth, migrating roughly **90,000 km a year**, pole to pole. He's been everywhere, so he knows everywhere.

**Eight Rive states:**
`Idle · Curious · Excited · Worried · Proud · Sleepy · Lost · Convoy`

**Voice:** dry, warm, understated. Short sentences. **Never exclamatory.**

> *"That's overpriced. I found better."*
> *"I've been here. Go at sunrise."*

<p align="center">
  <strong>He's been everywhere. Now he's going with you.</strong>
</p>
