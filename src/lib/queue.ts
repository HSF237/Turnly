import {
  addDoc,
  collection,
  doc,
  increment,
  runTransaction,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { estimateMinutes, nextAverage } from './predict';
import { wasOnTime } from './speed';
import { todayKey } from './time';
import type { Category, Place, Ticket } from './types';

export const placeRef = (placeId: string) => doc(db, 'places', placeId);
export const ticketsCol = (placeId: string) => collection(db, 'places', placeId, 'tickets');
export const ticketRef = (placeId: string, ticketId: string) => doc(db, 'places', placeId, 'tickets', ticketId);

export interface NewPlaceInput {
  name: string;
  category: Category;
  address: string;
  lat: number;
  lng: number;
  counters: number;
  avgMinutes: number;
  languages: string[];
  checkInRadius: number;
  hidden?: boolean;
  eventId?: string | null;
  teacher?: { name: string; subject: string; room: string } | null;
}

export async function createPlace(ownerUid: string, input: NewPlaceInput) {
  const now = Date.now();
  const data: Omit<Place, 'id'> = {
    name: input.name.trim(),
    category: input.category,
    address: input.address.trim(),
    lat: input.lat,
    lng: input.lng,
    ownerUid,
    counters: Math.max(1, Math.round(input.counters)),
    avgServiceSec: Math.max(30, Math.round(input.avgMinutes * 60)),
    lastTicket: 0,
    waiting: 0,
    servedToday: 0,
    dayKey: todayKey(),
    isOpen: true,
    languages: input.languages.length ? input.languages : ['en'],
    checkInRadius: input.checkInRadius,
    createdAt: now,
    updatedAt: now,
    hidden: !!input.hidden,
    eventId: input.eventId ?? null,
    teacher: input.teacher ?? null,
  };
  const ref = await addDoc(collection(db, 'places'), data);
  return ref.id;
}

export async function updatePlace(placeId: string, patch: Partial<Omit<Place, 'id'>>) {
  await updateDoc(placeRef(placeId), { ...patch, updatedAt: Date.now() });
}

/** Owner: start a fresh day if the stored counters belong to an older day. */
export async function rollDayIfNeeded(place: Place) {
  const today = todayKey();
  if (place.dayKey === today) return;
  await updateDoc(placeRef(place.id), {
    dayKey: today,
    lastTicket: 0,
    waiting: 0,
    servedToday: 0,
    updatedAt: Date.now(),
  });
}

/**
 * Join the queue. A transaction hands out the next token number so two
 * people joining at the same moment can never get the same number.
 */
export async function joinQueue(
  placeId: string,
  opts: { name: string; partySize: number; uid: string; walkIn?: boolean },
) {
  const today = todayKey();
  return runTransaction(db, async (tx) => {
    const pSnap = await tx.get(placeRef(placeId));
    if (!pSnap.exists()) throw new Error('This place no longer exists.');
    const p = pSnap.data() as Omit<Place, 'id'>;
    if (!p.isOpen) throw new Error('This queue is closed right now.');

    const sameDay = p.dayKey === today;
    const number = (sameDay ? p.lastTicket : 0) + 1;
    const waiting = (sameDay ? p.waiting : 0) + 1;

    const tRef = doc(ticketsCol(placeId));
    const ticket: Omit<Ticket, 'id'> = {
      number,
      name: opts.name.trim().slice(0, 40) || 'Guest',
      partySize: Math.min(12, Math.max(1, Math.round(opts.partySize || 1))),
      uid: opts.uid,
      status: 'waiting',
      dayKey: today,
      createdAt: Date.now(),
      calledAt: null,
      announceAt: null,
      doneAt: null,
      counter: null,
      walkIn: !!opts.walkIn,
      promisedMin: estimateMinutes(sameDay ? p.waiting : 0, p.avgServiceSec, p.counters),
    };
    tx.set(tRef, ticket);
    const patch: Record<string, unknown> = { lastTicket: number, waiting, updatedAt: Date.now() };
    if (!sameDay) {
      patch.dayKey = today;
      patch.servedToday = 0;
    }
    tx.update(placeRef(placeId), patch);
    return { id: tRef.id, number };
  }).then((res) => {
    // Learn this place's rhythm for "Best time to come". Separate and best-effort:
    // a failure here must never stop someone joining.
    const d = new Date();
    updateDoc(placeRef(placeId), { [`arrivals.${d.getDay()}-${d.getHours()}`]: increment(1) }).catch(() => {});
    return res;
  });
}

/**
 * Staff: finish whoever is at this counter and call the next waiting token.
 * The finished customer's serving time feeds the moving average.
 */
export async function callNext(place: Place, tickets: Ticket[], counter: number) {
  const now0 = Date.now();
  const next = tickets
    .filter((t) => t.status === 'waiting' && !(t.deferUntil && t.deferUntil > now0))
    .sort((a, b) => a.number - b.number)[0];
  const current = tickets.filter((t) => t.status === 'called' && t.counter === counter);

  return runTransaction(db, async (tx) => {
    const pSnap = await tx.get(placeRef(place.id));
    const p = pSnap.data() as Omit<Place, 'id'>;
    let nextSnapOk = false;
    if (next) {
      const nSnap = await tx.get(ticketRef(place.id, next.id));
      nextSnapOk = nSnap.exists() && (nSnap.data() as Ticket).status === 'waiting';
    }

    const now = Date.now();
    let avg = p.avgServiceSec;
    for (const c of current) {
      if (c.calledAt) avg = nextAverage(avg, (now - c.calledAt) / 1000);
      tx.update(ticketRef(place.id, c.id), { status: 'done', doneAt: now });
    }

    const patch: Record<string, unknown> = { avgServiceSec: avg, updatedAt: now };
    if (next && nextSnapOk) {
      tx.update(ticketRef(place.id, next.id), {
        status: 'called',
        calledAt: now,
        announceAt: now,
        counter,
      });
      patch.waiting = Math.max(0, p.waiting - 1);
      patch.servedToday = (p.servedToday || 0) + 1;
      // Speed badge: did we keep the promise we made when they joined? (Test walk-ins don't count.)
      const ok = next.walkIn ? null : wasOnTime(next, now);
      if (ok !== null) {
        const sp = p.speed ?? { n: 0, onTime: 0 };
        patch.speed = { n: sp.n + 1, onTime: sp.onTime + (ok ? 1 : 0) };
      }
    }
    tx.update(placeRef(place.id), patch);
    return next && nextSnapOk ? next : null;
  });
}

/** Customer: ask the person ahead to swap places. */
export function requestSwap(placeId: string, mine: Ticket, target: Ticket) {
  return updateDoc(ticketRef(placeId, target.id), {
    swapRequest: { fromTicketId: mine.id, fromNumber: mine.number, fromName: mine.name, at: Date.now() },
  });
}

export function clearSwap(placeId: string, targetId: string) {
  return updateDoc(ticketRef(placeId, targetId), { swapRequest: null });
}

/** Customer: accept a swap. Both tokens trade numbers in one transaction. */
export async function acceptSwap(placeId: string, mineId: string) {
  return runTransaction(db, async (tx) => {
    const mSnap = await tx.get(ticketRef(placeId, mineId));
    const mine = mSnap.data() as Ticket;
    const req = mine.swapRequest;
    if (!req) throw new Error('This swap request has expired.');
    const oSnap = await tx.get(ticketRef(placeId, req.fromTicketId));
    const other = oSnap.data() as Ticket;
    if (mine.status !== 'waiting' || other.status !== 'waiting') {
      tx.update(ticketRef(placeId, mineId), { swapRequest: null });
      return false;
    }
    const now = Date.now();
    tx.update(ticketRef(placeId, mineId), { number: other.number, swapRequest: null, swappedAt: now });
    tx.update(ticketRef(placeId, req.fromTicketId), { number: mine.number, swappedAt: now });
    return true;
  });
}

/** Customer: "I'm busy with someone else" — go back to waiting, skipped for a few minutes. */
export async function deferTicket(placeId: string, ticketId: string, minutes = 5) {
  await runTransaction(db, async (tx) => {
    const pSnap = await tx.get(placeRef(placeId));
    const p = pSnap.data() as Omit<Place, 'id'>;
    const tSnap = await tx.get(ticketRef(placeId, ticketId));
    const t = tSnap.data() as Ticket;
    if (t.status !== 'called') return;
    tx.update(ticketRef(placeId, ticketId), {
      status: 'waiting',
      calledAt: null,
      counter: null,
      deferUntil: Date.now() + minutes * 60000,
    });
    tx.update(placeRef(placeId), { waiting: (p.waiting || 0) + 1, updatedAt: Date.now() });
  });
}

const KINDNESS = 'turnly:kindness';
export function kindnessPoints() {
  return Number(localStorage.getItem(KINDNESS) || 0);
}
export function addKindness() {
  localStorage.setItem(KINDNESS, String(kindnessPoints() + 1));
}

/** Staff: announce the same token again. */
export function recall(placeId: string, ticket: Ticket) {
  return updateDoc(ticketRef(placeId, ticket.id), { announceAt: Date.now() });
}

/** Staff: finish the customer at a counter without calling anyone. */
export async function finishCounter(place: Place, tickets: Ticket[], counter: number) {
  const current = tickets.filter((t) => t.status === 'called' && t.counter === counter);
  if (!current.length) return;
  await runTransaction(db, async (tx) => {
    const pSnap = await tx.get(placeRef(place.id));
    const p = pSnap.data() as Omit<Place, 'id'>;
    const now = Date.now();
    let avg = p.avgServiceSec;
    for (const c of current) {
      if (c.calledAt) avg = nextAverage(avg, (now - c.calledAt) / 1000);
      tx.update(ticketRef(place.id, c.id), { status: 'done', doneAt: now });
    }
    tx.update(placeRef(place.id), { avgServiceSec: avg, updatedAt: now });
  });
}

/** Staff: skip a token (no-show) or remove someone from the line. */
export async function skipTicket(place: Place, ticket: Ticket) {
  await runTransaction(db, async (tx) => {
    const pSnap = await tx.get(placeRef(place.id));
    const p = pSnap.data() as Omit<Place, 'id'>;
    const tSnap = await tx.get(ticketRef(place.id, ticket.id));
    const t = tSnap.data() as Ticket;
    tx.update(ticketRef(place.id, ticket.id), { status: 'skipped', doneAt: Date.now() });
    if (t.status === 'waiting') {
      tx.update(placeRef(place.id), { waiting: Math.max(0, p.waiting - 1), updatedAt: Date.now() });
    }
  });
}

/** Customer: leave the line. */
export async function leaveQueue(placeId: string, ticketId: string) {
  await runTransaction(db, async (tx) => {
    const pSnap = await tx.get(placeRef(placeId));
    const p = pSnap.data() as Omit<Place, 'id'>;
    const tSnap = await tx.get(ticketRef(placeId, ticketId));
    const t = tSnap.data() as Ticket;
    tx.update(ticketRef(placeId, ticketId), { status: 'left', doneAt: Date.now() });
    if (t.status === 'waiting') {
      tx.update(placeRef(placeId), { waiting: Math.max(0, p.waiting - 1), updatedAt: Date.now() });
    }
  });
}

/** Customer: confirm arrival (only allowed inside the place's check-in radius, checked by the caller). */
export function checkIn(placeId: string, ticketId: string) {
  return updateDoc(ticketRef(placeId, ticketId), { checkedInAt: Date.now() });
}

/** Customer: "I'm done" — frees the counter so the queue can move. */
export function markDone(placeId: string, ticketId: string) {
  return updateDoc(ticketRef(placeId, ticketId), { status: 'done', doneAt: Date.now() });
}

const DEMO_NAMES = ['Aisha', 'Rahul', 'Mei Ling', 'Arjun', 'Fatima', 'Daniel', 'Nur', 'Vikram', 'Sara', 'Hafiz', 'Priya', 'Omar'];

/** Staff: add test walk-ins to see the queue move (for demos and testing). */
export async function addTestWalkIns(placeId: string, uid: string, count = 5) {
  for (let i = 0; i < count; i++) {
    const name = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
    await joinQueue(placeId, { name, partySize: Math.random() < 0.2 ? 3 : 1, uid, walkIn: true });
  }
}

/** Remember the customer's active ticket per place on this device. */
const KEY = 'turnly:tickets';
export function rememberTicket(placeId: string, ticketId: string) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    all[placeId] = { ticketId, day: todayKey() };
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
}
export function rememberedTicket(placeId: string): string | null {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    const hit = all[placeId];
    return hit && hit.day === todayKey() ? hit.ticketId : null;
  } catch {
    return null;
  }
}
/** All of today's remembered tickets on this device. */
export function allRememberedTickets(): { placeId: string; ticketId: string }[] {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, { ticketId: string; day: string }>;
    return Object.entries(all)
      .filter(([, v]) => v.day === todayKey())
      .map(([placeId, v]) => ({ placeId, ticketId: v.ticketId }));
  } catch {
    return [];
  }
}

export function forgetTicket(placeId: string) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    delete all[placeId];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
}
