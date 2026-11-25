import { useEffect, useState, type ReactNode } from 'react';
import { MockContext, type MockData } from '../lib/mock';
import { todayKey } from '../lib/time';
import type { CommunityPlace, Place, Ticket } from '../lib/types';

/**
 * Design/QA harness: wraps a real screen in sample data and keeps the queue
 * moving, so screens can be checked visually without touching Firestore.
 * Not linked from any real route.
 */
const day = todayKey();
const T0 = Date.now();
const NAMES = ['Aisha', 'Rahul', 'Mei Ling', 'Arjun', 'Fatima', 'Daniel', 'Nur', 'Vikram', 'Sara', 'Hafiz', 'Priya', 'Omar', 'Lena', 'Kiran'];

function place(id: string, name: string, category: Place['category'], lat: number, lng: number, waiting: number, extra: Partial<Place> = {}): Place {
  const arrivals: Record<string, number> = {};
  for (let d = 0; d < 7; d++) for (let h = 8; h < 22; h++) arrivals[`${d}-${h}`] = Math.round(4 + 10 * Math.abs(Math.sin((h + d) / 2.3)));
  return {
    id, name, category, address: 'MG Road, Kannur', lat, lng, ownerUid: 'me', counters: 2, avgServiceSec: 300,
    lastTicket: 30, waiting, servedToday: 24, dayKey: day, isOpen: true, languages: ['en', 'ms'], checkInRadius: 0,
    createdAt: T0, updatedAt: T0, arrivals, speed: { n: 12, onTime: 11 }, ...extra,
  };
}

const PLACES: Place[] = [
  place('p1', 'Federal Bank, Thavakkara', 'bank', 11.8745, 75.3704, 6),
  place('p2', 'Style Studio Barbers', 'barber', 11.879, 75.364, 2, { counters: 1, speed: { n: 3, onTime: 3 } }),
  place('p3', 'City Pharmacy', 'pharmacy', 11.869, 75.377, 0, { counters: 1 }),
  place('p4', 'Akshaya e-Centre', 'service', 11.882, 75.375, 9, { counters: 1, avgServiceSec: 420 }),
  place('p5', 'Kopi House', 'restaurant', 11.872, 75.362, 3),
];

const COMMUNITY: CommunityPlace[] = [
  { id: 'c1', name: 'Passport Seva Kendra', category: 'government', address: 'Kannur', lat: 11.866, lng: 75.369, createdBy: 'x', createdAt: T0, updatedAt: T0,
    reports: [{ m: 45, at: T0 - 3 * 60000, v: true }, { m: 40, at: T0 - 9 * 60000, v: true }, { m: 50, at: T0 - 25 * 60000, v: false }] },
  { id: 'c2', name: 'SBI Main Branch', category: 'bank', address: '', lat: 11.877, lng: 75.381, createdBy: 'x', createdAt: T0, updatedAt: T0 - 60000,
    reports: [{ m: 15, at: T0 - 6 * 60000, v: true }] },
];

function ticket(n: number, status: Ticket['status'], extra: Partial<Ticket> = {}): Ticket {
  return {
    id: `t${n}`, number: n, name: NAMES[n % NAMES.length], partySize: n % 5 === 0 ? 3 : 1, uid: n === 27 ? 'me' : `u${n}`,
    status, dayKey: day, createdAt: T0 - (40 - n) * 60000, calledAt: status === 'called' ? T0 - 60000 : null,
    announceAt: status === 'called' ? T0 - 60000 : null, doneAt: null, counter: null, walkIn: n % 4 === 0, promisedMin: 8, ...extra,
  };
}

function initialTickets(): Ticket[] {
  return [
    ...[18, 19, 20, 21].map((n) => ticket(n, 'done')),
    ticket(22, 'called', { counter: 1 }),
    ticket(23, 'called', { counter: 2 }),
    ...[24, 25, 26, 27, 28, 29].map((n) => ticket(n, 'waiting')),
  ];
}

export default function Mocked({ children, moving = true }: { children: ReactNode; moving?: boolean }) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);

  // Keep the line moving: alternate counters calling the next token, new people join.
  useEffect(() => {
    if (!moving) return;
    let counter = 1;
    const id = setInterval(() => {
      setTickets((list) => {
        const now = Date.now();
        const waiting = list.filter((t) => t.status === 'waiting').sort((a, b) => a.number - b.number);
        const next = waiting[0];
        const out = list.map((t) => {
          if (t.status === 'called' && t.counter === counter) return { ...t, status: 'done' as const, doneAt: now };
          if (next && t.id === next.id) return { ...t, status: 'called' as const, counter, calledAt: now, announceAt: now };
          return t;
        });
        const maxN = Math.max(...out.map((t) => t.number));
        out.push(ticket(maxN + 1, 'waiting', { createdAt: now }));
        counter = counter === 1 ? 2 : 1;
        return out;
      });
    }, 2600);
    return () => clearInterval(id);
  }, [moving]);

  const waitingCount = tickets.filter((t) => t.status === 'waiting').length;
  const data: MockData = {
    user: { uid: 'me', displayName: 'Hasan Demo', photoURL: null },
    places: PLACES.map((p) => (p.id === 'p1' ? { ...p, waiting: waitingCount } : p)),
    tickets: { p1: tickets },
    community: COMMUNITY,
  };
  return <MockContext.Provider value={data}>{children}</MockContext.Provider>;
}
