import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { createPlace } from './queue';
import type { Place, Ticket } from './types';
import { ticketPosition } from './predict';

export interface TeacherInput {
  name: string;
  subject: string;
  room: string;
}

export const eventRef = (id: string) => doc(db, 'schoolEvents', id);

/** Create a PTM event: one hidden queue per teacher, all sharing the school's location. */
export async function createSchoolEvent(
  ownerUid: string,
  input: { name: string; schoolName: string; date: string; slotMinutes: number; lat: number; lng: number; teachers: TeacherInput[] },
) {
  const ev = await addDoc(collection(db, 'schoolEvents'), {
    name: input.name.trim(),
    schoolName: input.schoolName.trim(),
    date: input.date,
    ownerUid,
    slotMinutes: input.slotMinutes,
    lat: input.lat,
    lng: input.lng,
    teacherIds: [],
    isOpen: true,
    createdAt: Date.now(),
  });
  const ids: string[] = [];
  for (const t of input.teachers) {
    const id = await createPlace(ownerUid, {
      name: t.name.trim(),
      category: 'school',
      address: [t.subject.trim(), t.room.trim() && `Room ${t.room.trim()}`].filter(Boolean).join(' · '),
      lat: input.lat,
      lng: input.lng,
      counters: 1,
      avgMinutes: input.slotMinutes,
      languages: ['en'],
      checkInRadius: 0,
      hidden: true,
      eventId: ev.id,
      teacher: { name: t.name.trim(), subject: t.subject.trim(), room: t.room.trim() },
    });
    ids.push(id);
  }
  await updateDoc(eventRef(ev.id), { teacherIds: ids });
  return ev.id;
}

/** Parse "Name, Subject, Room" lines pasted from a spreadsheet or WhatsApp. */
export function parseTeacherList(text: string): TeacherInput[] {
  return text
    .split('\n')
    .map((l) => l.split(/[,\t|]/).map((x) => x.trim()))
    .filter((parts) => parts[0])
    .map(([name, subject = '', room = '']) => ({ name, subject, room }));
}

export interface Journey {
  parentName: string;
  childName: string;
  /** teacher placeId → ticketId */
  tickets: Record<string, string>;
  startedAt: number;
}

const jKey = (eventId: string) => `turnly:ptm:${eventId}`;
export function loadJourney(eventId: string): Journey | null {
  try {
    return JSON.parse(localStorage.getItem(jKey(eventId)) || 'null');
  } catch {
    return null;
  }
}
export function saveJourney(eventId: string, j: Journey | null) {
  try {
    if (j) localStorage.setItem(jKey(eventId), JSON.stringify(j));
    else localStorage.removeItem(jKey(eventId));
  } catch {
    /* ignore */
  }
}

/**
 * The PTM planner. A parent holds a place in every chosen teacher's line at
 * once. Each teacher would be ready for them at time W (their queue estimate).
 * We greedily go to whichever teacher can start soonest given when we're free,
 * which is optimal for this "earliest available" scheduling and re-runs live.
 */
export function planPtm(
  teachers: { place: Place; waitMin: number }[],
  walkMin = 1,
) {
  let t = 0;
  const left = [...teachers];
  const steps: { place: Place; startAt: number; endAt: number; idleMin: number }[] = [];
  while (left.length) {
    let bi = 0;
    let best = Infinity;
    left.forEach((x, i) => {
      const start = Math.max(t + (steps.length ? walkMin : 0), x.waitMin);
      if (start < best || (start === best && x.place.avgServiceSec < left[bi].place.avgServiceSec)) {
        best = start;
        bi = i;
      }
    });
    const [x] = left.splice(bi, 1);
    const service = Math.max(1, Math.round(x.place.avgServiceSec / 60));
    steps.push({ place: x.place, startAt: best, endAt: best + service, idleMin: Math.max(0, best - t) });
    t = best + service;
  }
  // The old way: one corridor queue after another, no overlap.
  const oldWay = teachers.reduce((s, x) => s + x.waitMin + Math.max(1, Math.round(x.place.avgServiceSec / 60)) + walkMin, 0);
  return { steps, totalMin: Math.round(t), oldWayMin: Math.round(oldWay) };
}

export function teacherWait(place: Place, ticket: Ticket | undefined, tickets: Ticket[]) {
  if (!ticket) return 0;
  if (ticket.status === 'called') return 0;
  return ticketPosition(ticket, tickets, place).etaMin;
}
