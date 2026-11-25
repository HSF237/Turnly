import type { Place, Ticket } from './types';
import { todayKey } from './time';

/**
 * Wait prediction (queueing theory, kept simple and explainable):
 *
 *   W ≈ (people ahead × average serving time) ÷ open counters
 *
 * The average serving time is an exponential moving average (EMA) that is
 * updated every time a customer finishes, so one slow customer doesn't throw
 * the estimate off, but a genuinely slower day pulls it up quickly.
 */
export const EMA_WEIGHT = 0.3;
export const MIN_SERVICE_SEC = 20;
export const MAX_SERVICE_SEC = 60 * 60;

export function nextAverage(oldAvg: number, sampleSec: number) {
  if (!Number.isFinite(sampleSec) || sampleSec < 5 || sampleSec > 2 * 60 * 60) return oldAvg;
  const next = oldAvg * (1 - EMA_WEIGHT) + sampleSec * EMA_WEIGHT;
  return Math.round(Math.min(MAX_SERVICE_SEC, Math.max(MIN_SERVICE_SEC, next)));
}

export function estimateSeconds(ahead: number, avgServiceSec: number, counters: number) {
  return Math.max(0, (ahead * avgServiceSec) / Math.max(1, counters));
}

export function estimateMinutes(ahead: number, avgServiceSec: number, counters: number) {
  return Math.round(estimateSeconds(ahead, avgServiceSec, counters) / 60);
}

/** Live wait for someone joining right now. */
export function placeWaitMinutes(place: Place) {
  if (!place.isOpen) return null;
  const waiting = place.dayKey === todayKey() ? place.waiting : 0;
  return estimateMinutes(waiting, place.avgServiceSec, place.counters);
}

export type WaitLevel = 'quiet' | 'busy' | 'packed' | 'closed';

export function waitLevel(minutes: number | null): WaitLevel {
  if (minutes === null) return 'closed';
  if (minutes < 10) return 'quiet';
  if (minutes < 30) return 'busy';
  return 'packed';
}

export const LEVEL_STYLE: Record<WaitLevel, { label: string; dot: string; chip: string; hex: string }> = {
  quiet: { label: 'Quiet', dot: 'bg-brand-500', chip: 'bg-brand-50 text-brand-700 ring-brand-200', hex: '#0ea58f' },
  busy: { label: 'Busy', dot: 'bg-sun-400', chip: 'bg-sun-50 text-sun-600 ring-sun-100', hex: '#fbab30' },
  packed: { label: 'Packed', dot: 'bg-rose-500', chip: 'bg-red-50 text-red-600 ring-red-100', hex: '#ef4444' },
  closed: { label: 'Closed', dot: 'bg-slate-300', chip: 'bg-slate-100 text-slate-500 ring-slate-200', hex: '#94a3b8' },
};

export function formatMinutes(min: number | null) {
  if (min === null) return 'Closed';
  if (min <= 0) return 'No wait';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Position info for one ticket inside today's queue. */
export function ticketPosition(ticket: Ticket, tickets: Ticket[], place: Place) {
  const waitingAhead = tickets.filter((t) => t.status === 'waiting' && t.number < ticket.number).length;
  const nowServing = tickets
    .filter((t) => t.status === 'called')
    .sort((a, b) => (b.calledAt ?? 0) - (a.calledAt ?? 0))[0];
  const etaMin = estimateMinutes(waitingAhead, place.avgServiceSec, place.counters);
  return { ahead: waitingAhead, nowServing, etaMin };
}
