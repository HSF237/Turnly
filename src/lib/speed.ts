import type { Place, Ticket } from './types';

/**
 * Speed badges: Turnly checks itself. When someone joins we store the wait we
 * promised; when they're called we compare. A place earns "On time" when at
 * least 80% of its last measured calls came within the promise (with 20% + 2
 * minutes of grace), over at least 5 calls.
 */
export const MIN_SAMPLES = 5;

export function wasOnTime(ticket: Ticket, calledAt: number) {
  if (ticket.promisedMin == null) return null;
  const actualMin = (calledAt - ticket.createdAt) / 60000;
  return actualMin <= ticket.promisedMin * 1.2 + 2;
}

export function isOnTime(place: Place) {
  const s = place.speed;
  return !!s && s.n >= MIN_SAMPLES && s.onTime / s.n >= 0.8;
}

export function onTimeRate(place: Place) {
  const s = place.speed;
  return s && s.n ? Math.round((s.onTime / s.n) * 100) : null;
}
