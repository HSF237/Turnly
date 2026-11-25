import { placeWaitMinutes } from './predict';
import { distanceM } from './time';
import type { Place } from './types';

type LatLng = { lat: number; lng: number };

/** Rough door-to-door time without a routing API: walk under 1.5 km, city traffic above. */
export function travelMinutes(meters: number) {
  if (meters < 25) return 0;
  if (meters < 1500) return Math.max(1, Math.round(meters / 80)); // ~4.8 km/h walking
  return Math.round(meters / 400) + 3; // ~24 km/h in town + parking
}

export interface Leg {
  place: Place;
  travelMin: number;
  /** Minutes you still stand in line after arriving (Turnly joins you remotely when you leave the previous stop). */
  waitOnSiteMin: number;
  serviceMin: number;
  leaveAt: number; // minutes from now
  arriveAt: number;
  doneAt: number;
}

export interface PlanResult {
  legs: Leg[];
  totalMin: number;
  travelMin: number;
  standingMin: number;
}

/**
 * Simulate a route. The key idea: when you leave one stop, Turnly joins the
 * next queue for you, so the queue moves while you travel. Time at a stop
 * = max(travel, queue wait) — travel and waiting overlap.
 */
export function simulate(order: Place[], start: LatLng | null): PlanResult {
  let t = 0;
  let prev: LatLng | null = start;
  let travelSum = 0;
  let standing = 0;
  const legs: Leg[] = order.map((p) => {
    const travel = prev ? travelMinutes(distanceM(prev, p)) : 0;
    const wait = placeWaitMinutes(p) ?? 0;
    const service = Math.max(1, Math.round(p.avgServiceSec / 60));
    const leaveAt = t;
    const arriveAt = t + travel;
    const turnAt = t + wait;
    const startService = Math.max(arriveAt, turnAt);
    const onSite = startService - arriveAt;
    const doneAt = startService + service;
    travelSum += travel;
    standing += onSite;
    t = doneAt;
    prev = p;
    return { place: p, travelMin: travel, waitOnSiteMin: onSite, serviceMin: service, leaveAt, arriveAt, doneAt };
  });
  return { legs, totalMin: t, travelMin: travelSum, standingMin: standing };
}

/** The old way: walk in and stand in every line, no overlap. */
export function simulateWalkIn(order: Place[], start: LatLng | null) {
  let t = 0;
  let prev: LatLng | null = start;
  for (const p of order) {
    t += prev ? travelMinutes(distanceM(prev, p)) : 0;
    t += placeWaitMinutes(p) ?? 0;
    t += Math.max(1, Math.round(p.avgServiceSec / 60));
    prev = p;
  }
  return t;
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const out: T[][] = [];
  items.forEach((item, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) out.push([item, ...p]);
  });
  return out;
}

/**
 * Find the fastest order. Up to 7 stops we try every order (7! = 5,040
 * simulations, instant in a browser). Beyond that we fall back to greedy:
 * always go next to the stop that finishes soonest.
 */
export function bestPlan(stops: Place[], start: LatLng | null) {
  let best: PlanResult | null = null;
  let checked = 0;
  if (stops.length <= 7) {
    for (const order of permutations(stops)) {
      const r = simulate(order, start);
      checked++;
      if (!best || r.totalMin < best.totalMin) best = r;
    }
  } else {
    const left = [...stops];
    const order: Place[] = [];
    let here = start;
    while (left.length) {
      let bi = 0;
      let bv = Infinity;
      left.forEach((p, i) => {
        const r = simulate([p], here);
        checked++;
        if (r.totalMin < bv) {
          bv = r.totalMin;
          bi = i;
        }
      });
      const [p] = left.splice(bi, 1);
      order.push(p);
      here = p;
    }
    best = simulate(order, start);
  }
  const asPicked = simulate(stops, start);
  const walkIn = simulateWalkIn(stops, start);
  return { best: best!, asPicked, walkIn, checked };
}
