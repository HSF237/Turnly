# Turnly: developer guide

A handover for any developer or AI model working on this codebase.
Turnly is a virtual-queue web app, a live map of how long every line is. People
join a queue from their phone, watch their position, and get alerted when it's
their turn. Businesses call the next person from a staff console and show a TV
board that announces tokens out loud.

Live site: https://turnly-teal.vercel.app · Repo: https://github.com/HSF237/Turnly

## Stack
- **React 18 + TypeScript (strict) + Vite 5**
- **Tailwind CSS 3**: brand colours `brand-*` (teal) and `sun-*` (amber) are in `tailwind.config.js`
- **Framer Motion 11** for all animation, **lucide-react** icons
- **Firebase**: Auth (Google sign-in for businesses, anonymous for customers) and Firestore (live data via `onSnapshot`, transactions for tokens)
- **MapLibre GL** with a MapTiler map style
- **PWA**: `public/manifest.webmanifest` + `public/sw.js`, installable on iPhone/Android
- Hosted on **Vercel**. Every push to `main` deploys to production automatically. `vercel.json` has the single-page-app rewrites.

## Run it
```
npm install
npm run dev          # http://localhost:5173
npm run build        # type-checks, then builds to dist/
npx vite preview     # serve the build
```
Copy `.env.example` to `.env` only if you want a different Firebase project or MapTiler key. Defaults are built in (`src/lib/firebase.ts`, `src/components/MapView.tsx`).

## Folder map
```
src/
  App.tsx                routes, splash, onboarding, navbar/tab bar, page transitions, quick search, offline banner
  index.css              Tailwind layers, buttons/inputs/cards, map marker styles
  lib/
    types.ts             Place, Ticket, CommunityPlace, SchoolEvent, CATEGORY_META
    firebase.ts          Firebase config, signInWithGoogle, ensureGuest (anonymous), logOut
    hooks.ts             data hooks: useAuth, usePlace, useTickets, usePlaces, useMyPlaces,
                         useMultiTickets, useCommunity, useGeolocation, useTick, useSim …
    queue.ts             every queue action: createPlace, joinQueue, callNext, recall, finishCounter,
                         skipTicket, leaveQueue, checkIn, markDone, swaps, deferTicket (hold my spot) …
    predict.ts           wait-time maths: estimateMinutes, placeWaitMinutes, waitLevel, LEVEL_STYLE, formatMinutes
    planner.ts           errand route planner: tries every order (up to 7 stops), greedy beyond that
    community.ts         crowd reports for places not on Turnly (recency-weighted median estimate)
    speed.ts             "on time" badges: was the promised wait kept?
    speech.ts            voice announcements in 6 languages, chime, vibration, notifications
    school.ts            school parent-teacher meeting mode
    sim.ts               THE SAMPLE CITY (see below)
    mock.ts, ../dev/Mocked.tsx   a fake-data provider used only for screenshots/testing
    useTitle.ts          browser tab titles
  components/            reusable UI (MapView, PlaceCard, TokenCard, SplitFlap, CityPicker, LiveFeed,
                         CityGlance, CommandPalette, BestTime, SwapPanel, community/* sheets …)
  pages/                 one file per route (see below)
firestore.rules          database security rules: paste into Firebase console → Firestore → Rules
public/                  icons, manifest, service worker
```

### Routes (`src/App.tsx`)
| Path | Page | What it is |
|---|---|---|
| `/` | Home | hero, places near you, live feed, city at a glance |
| `/about` | Landing | the story/marketing page |
| `/explore` | Explore | live map + list, crowd reports, heat map |
| `/plan` | Plan | errand route planner |
| `/me` | MyTokens | all your tokens |
| `/q/:placeId` | Join | join a queue (what the QR code opens) |
| `/t/:placeId/:ticketId` | TicketPage | your live token, countdown, alerts |
| `/business` | BusinessHome | owner's places |
| `/business/new` | NewPlace | create a queue |
| `/business/:placeId` | Counter | staff console (live board, call next) |
| `/business/:placeId/poster` | QrPoster | printable QR poster |
| `/tv/:placeId` | TV | full-screen board for a TV at the venue |
| `/business/school/*`, `/s/:eventId*` | School… | parent-teacher meeting mode |

## Data model (Firestore)
- `places/{placeId}`: name, category, lat/lng, counters, avgServiceSec (learned), lastTicket, waiting, servedToday, dayKey, isOpen, languages, arrivals (visits by weekday-hour, used for "best time to come"), speed (on-time stats), ownerUid
  - `places/{placeId}/tickets/{ticketId}`: number, name, partySize, uid, status (`waiting|called|done|skipped|left`), dayKey, createdAt, calledAt, announceAt, counter, promisedMin, swapRequest, deferUntil …
- `community/{placeId}`: crowd-reported places, with the last 12 `reports` ({m minutes, at, v verified})
- `schoolEvents/{eventId}`: school meeting events

Queues reset each day through `dayKey` (`rollDayIfNeeded`). A token number comes from a Firestore **transaction** on `lastTicket`, so two people never get the same number.

Wait estimate ≈ people ahead × average serving time ÷ counters. The average serving time is an exponential moving average updated on every "call next" (weight 0.3).

## The sample city (`src/lib/sim.ts`)
So the app never looks empty, the browser simulates ~14 places in **Kuala Lumpur** and ~12 in **Kannur**. They have moving queues, crowd reports and an activity feed. Customers in the simulation arrive according to a rush-hour curve for each type of place.

- Sample ids start with `demo-`. **Every function in `queue.ts`/`community.ts` checks `isSim(id)` first** and sends sample places to the simulator, so nothing fake is ever written to Firestore.
- The hooks in `hooks.ts` merge sample places into real data. `useSim()` re-renders when the simulation changes.
- If you join a sample queue, it speeds up (4–12×) so your turn comes in a few minutes.
- Opening the staff console on a sample place (for example `/business/demo-kl-bank`) hands calling over to you.
- Tabs stay in sync through a BroadcastChannel, so a TV tab follows the staff tab. Queues you've touched are saved in localStorage.
- Users switch city or turn samples off with the city picker (`CityPicker.tsx`), stored in `localStorage` (`turnly:city`, `turnly:samples`). The default city is guessed from the time zone.
- Sample places are labelled "Sample" in the UI (marked `data-sample` in the markup).

## Gotchas learned the hard way
- **Framer Motion transforms override Tailwind `translate-*` classes.** Don't put `-translate-x-1/2` on a `motion.*` element. Wrap it in a plain div, or position it with `calc()`.
- **A `transform` or `filter` on an ancestor breaks `position: fixed`** (sheets and modals end up inside the page). The page transition in `App.tsx` uses `transitionEnd: { transform: 'none' }` for this reason. Don't add a filter to it.
- **CSS grid layouts:** a hidden extra child still becomes a grid item and can collapse the map (the blank-map bug). Render sheets and overlays outside the grid.
- **iPhone:** use `100dvh` and `env(safe-area-inset-*)`. Test in the installed (home-screen) mode too.
- Hooks must stay above any early `return` in a component.
- `motion.path` typing: use `pathLength={1} strokeDasharray="1"` and animate `strokeDashoffset`.
- Firestore from Node (server scripts) needs normal network access. Change data through the app or the Firebase console.

## Checking a change
1. `npx tsc --noEmit --noUnusedLocals` must be clean.
2. `npm run build`, then `npx vite preview` and click through on a phone-sized window (390×844): Home, Explore, Join a sample queue until it calls you, the staff console on `/business/demo-kl-bank`, and TV mode.
3. Look for horizontal scrolling on mobile. Nothing should be wider than the screen.

## Deploying
Push to `main` on GitHub, and Vercel builds and deploys within about a minute. If you change `firestore.rules`, also publish it in the Firebase console (project `turnly-72b21`).
