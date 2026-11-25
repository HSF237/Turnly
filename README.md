# Turnly — No one should ever wait in line again

**Google Maps for waiting.** See the live wait at any bank, shop, office or school counter, join from anywhere, and get called when it's your turn.

Entry for the 6th International Digital Fest 2027 (Web & Mobile Applications), Asia Pacific University, Kuala Lumpur — by Muhammad Hasan.

## What works now (round 1)

| Area | Features |
| --- | --- |
| Customers | Join by QR or link with no account, family token, live position + ETA ring, “almost your turn” and “your turn” alerts (chime, vibration, notification), leave-home-now timing, fair check-in by location, leave queue, “I'm done” |
| Staff counter | Call next, recall, done, skip, multiple counters, open/close queue, walk-in tokens for people without phones, test people for demos, arrivals-by-hour chart, live stats |
| TV mode | Full-screen token board, big flash on every call, spoken announcements in English, Malay, Malayalam, Tamil, Hindi and Arabic, join QR |
| Explore | Live wait map with colour-coded markers, search, category filters, sort by shortest wait or nearest, directions |
| Business | Google sign-in, create a queue with map location, printable QR poster |

**Wait prediction:** `wait ≈ (people ahead × average serving time) ÷ open counters`, where the average serving time is an exponential moving average learned from every finished customer (`src/lib/predict.ts`).

## Also built

- **Startup screen** (tokens fly into the logo), interactive hero queue, scroll story, animated bento feature tiles, split-flap token digits, ticket-printing animation, magnetic buttons, wordmark footer, mobile tab bar
- **Plan my errands** — tests every visiting order (up to 7! = 5,040) with live waits; Turnly joins your next queue as you leave each stop
- **Swap my spot** — ask someone ahead to trade numbers; they earn kindness points
- **Hold my spot** — called while busy elsewhere? You're skipped for 5 minutes, not lost
- **School mode** — parent-teacher meetings: parents hold a place in every teacher's line at once and are sent to whoever is free next; hall board for the big screen

## Coming next

Community mode (crowd-reported waits), City pulse on live data, Best time to come from history, Speed badges, Wait somewhere better.

## Run it

```bash
npm install
npm run dev
```

## One-time Firebase setup (project `turnly-72b21`)

1. **Authentication → Sign-in method:** enable **Google** and **Anonymous** (customers join as anonymous guests).
2. **Firestore Database:** create it (production mode), then paste `firestore.rules` into the **Rules** tab and publish.
3. **Authentication → Settings → Authorized domains:** add your Vercel domain once deployed.

Optional: put `VITE_MAPTILER_KEY` in `.env` (see `.env.example`) for nicer map tiles. Without it the map uses OpenStreetMap.

## Deploy

Import the repo into Vercel (framework: Vite). `vercel.json` already handles page routes.

## Stack

React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Firebase (Auth + Firestore), MapLibre GL, qrcode.react.
