import { todayKey } from './time';
import { estimateMinutes } from './predict';
import { wasOnTime } from './speed';
import type { Category, CommunityPlace, CommunityReport, Place, Ticket } from './types';

/**
 * Sample city: a live, simulated set of places so Turnly never looks empty.
 *
 * Everything runs in the browser. Each sample place has counters that serve
 * people and new people arriving, driven by a time-of-day rush curve, so the
 * numbers on the map drift like a real city. Anyone can join a sample queue
 * (it then runs faster so you can watch your turn arrive) or run a sample
 * branch from the staff console. Real places in Firestore are never touched.
 *
 * Tabs stay in step through a BroadcastChannel, and queues you've touched are
 * saved locally so a reload picks up where you left off.
 */

export type CityId = 'kl' | 'kannur';

export const CITIES: Record<CityId, { id: CityId; name: string; country: string; center: { lat: number; lng: number }; langs: string[] }> = {
  kl: { id: 'kl', name: 'Kuala Lumpur', country: 'Malaysia', center: { lat: 3.0575, lng: 101.6985 }, langs: ['en', 'ms'] },
  kannur: { id: 'kannur', name: 'Kannur', country: 'India', center: { lat: 11.8745, lng: 75.3704 }, langs: ['en', 'ml'] },
};

interface Seed {
  key: string;
  name: string;
  cat: Category;
  lat: number;
  lng: number;
  address: string;
  counters: number;
  /** Typical seconds to serve one person. */
  svc: number;
  /** How many people wait here at the busiest hour. */
  peak: number;
  closed?: boolean;
}

const SEEDS: Record<CityId, Seed[]> = {
  kl: [
    { key: 'bank', name: 'Unity Bank, Bukit Jalil', cat: 'bank', lat: 3.0597, lng: 101.6906, address: 'Jalan Jalil Perkasa 1', counters: 3, svc: 300, peak: 16 },
    { key: 'klinik', name: 'Klinik Sejahtera', cat: 'clinic', lat: 3.0628, lng: 101.6957, address: 'Jalan 3/155B, Bukit Jalil', counters: 2, svc: 480, peak: 12 },
    { key: 'pharm', name: 'Sentosa Pharmacy', cat: 'pharmacy', lat: 3.0545, lng: 101.6943, address: 'Pavilion Walk, Bukit Jalil', counters: 1, svc: 150, peak: 5 },
    { key: 'post', name: 'Community Post Counter', cat: 'government', lat: 3.0679, lng: 101.6893, address: 'Sri Petaling', counters: 2, svc: 240, peak: 10 },
    { key: 'barber', name: 'Jalil Barbers & Co', cat: 'barber', lat: 3.0571, lng: 101.7051, address: 'Technology Park Malaysia', counters: 2, svc: 1200, peak: 4 },
    { key: 'kopi', name: 'Kopi & Kaya Corner', cat: 'restaurant', lat: 3.0512, lng: 101.7008, address: 'Jalan Teknologi 5', counters: 3, svc: 110, peak: 14 },
    { key: 'nasi', name: 'Nasi Lemak Express', cat: 'restaurant', lat: 3.0489, lng: 101.6969, address: 'Bukit Jalil Food Street', counters: 2, svc: 90, peak: 11 },
    { key: 'road', name: 'Road Transport Service Centre', cat: 'government', lat: 3.0712, lng: 101.6982, address: 'Jalan Bukit Jalil Raya', counters: 4, svc: 420, peak: 28 },
    { key: 'fix', name: 'TechFix Phone Repair', cat: 'service', lat: 3.0536, lng: 101.7062, address: 'Endah Parade', counters: 1, svc: 600, peak: 3, closed: true },
    { key: 'print', name: 'Campus Print & Copy', cat: 'shop', lat: 3.0558, lng: 101.6998, address: 'Near APU, TPM', counters: 1, svc: 150, peak: 7 },
    { key: 'dental', name: 'Bukit Jalil Dental Care', cat: 'clinic', lat: 3.0641, lng: 101.7031, address: 'Jalan Jalil Jaya', counters: 1, svc: 900, peak: 4 },
    { key: 'mart', name: 'FreshMart Grocer', cat: 'shop', lat: 3.0466, lng: 101.7039, address: 'Jalan Merah Saga', counters: 3, svc: 150, peak: 13 },
    { key: 'telco', name: 'Telco Service Point', cat: 'service', lat: 3.0602, lng: 101.7084, address: 'Pusat Bandar Bukit Jalil', counters: 2, svc: 480, peak: 9 },
    { key: 'admit', name: 'Student Admissions Office', cat: 'school', lat: 3.0553, lng: 101.7012, address: 'Technology Park Malaysia', counters: 2, svc: 540, peak: 10 },
  ],
  kannur: [
    { key: 'bank', name: 'Malabar Co-op Bank, Thavakkara', cat: 'bank', lat: 11.8745, lng: 75.3704, address: 'Thavakkara Road', counters: 3, svc: 300, peak: 15 },
    { key: 'pharm', name: 'City Pharmacy', cat: 'pharmacy', lat: 11.869, lng: 75.377, address: 'Fort Road', counters: 1, svc: 150, peak: 5 },
    { key: 'barber', name: 'Style Studio Barbers', cat: 'barber', lat: 11.879, lng: 75.364, address: 'SN Park Road', counters: 2, svc: 1200, peak: 4 },
    { key: 'ecentre', name: 'Citizen Service e-Centre', cat: 'service', lat: 11.882, lng: 75.375, address: 'Talap', counters: 1, svc: 420, peak: 9 },
    { key: 'kopi', name: 'Kopi House', cat: 'restaurant', lat: 11.872, lng: 75.362, address: 'Caltex Junction', counters: 2, svc: 120, peak: 10 },
    { key: 'clinic', name: 'District Health Clinic', cat: 'clinic', lat: 11.8668, lng: 75.3655, address: 'Hospital Road', counters: 3, svc: 420, peak: 22 },
    { key: 'village', name: 'Village Office Help Desk', cat: 'government', lat: 11.8775, lng: 75.3712, address: 'Collectorate Road', counters: 1, svc: 480, peak: 8 },
    { key: 'bakery', name: 'Fort Road Bakery', cat: 'restaurant', lat: 11.8702, lng: 75.3672, address: 'Fort Road', counters: 2, svc: 90, peak: 9 },
    { key: 'mobile', name: 'Mobile Care Repairs', cat: 'service', lat: 11.8761, lng: 75.3668, address: 'Bank Road', counters: 1, svc: 600, peak: 3 },
    { key: 'mart', name: 'Supermart Caltex', cat: 'shop', lat: 11.8818, lng: 75.3732, address: 'Caltex', counters: 3, svc: 150, peak: 12 },
    { key: 'dental', name: 'Smile Dental Studio', cat: 'clinic', lat: 11.8728, lng: 75.3801, address: 'Pallikunnu', counters: 1, svc: 900, peak: 3, closed: true },
    { key: 'rto', name: 'Vehicle Licence Help Counter', cat: 'government', lat: 11.8812, lng: 75.3641, address: 'Civil Station', counters: 3, svc: 360, peak: 20 },
  ],
};

const COMMUNITY_SEEDS: Record<CityId, { key: string; name: string; cat: Category; lat: number; lng: number; address: string; m: number }[]> = {
  kl: [
    { key: 'satay', name: 'Night Market Satay Stall', cat: 'restaurant', lat: 3.0498, lng: 101.6921, address: 'Bukit Jalil pasar malam', m: 15 },
    { key: 'shuttle', name: 'T-Park Shuttle Bus Stop', cat: 'service', lat: 3.0548, lng: 101.6973, address: 'Technology Park Malaysia', m: 10 },
    { key: 'tickets', name: 'Stadium Ticket Booth', cat: 'service', lat: 3.0546, lng: 101.6914, address: 'Bukit Jalil', m: 35 },
    { key: 'hospharm', name: 'Hospital Pharmacy Window', cat: 'pharmacy', lat: 3.0689, lng: 101.7058, address: 'Jalan Jalil Utama', m: 40 },
  ],
  kannur: [
    { key: 'rail', name: 'Railway Ticket Counter', cat: 'government', lat: 11.8706, lng: 75.364, address: 'Kannur Railway Station', m: 20 },
    { key: 'passport', name: 'Passport Help Desk', cat: 'government', lat: 11.8655, lng: 75.3721, address: 'Thavakkara', m: 45 },
    { key: 'busstand', name: 'Bus Stand Enquiry', cat: 'service', lat: 11.8761, lng: 75.3712, address: 'New Bus Stand', m: 8 },
    { key: 'icecream', name: 'Payyambalam Beach Ice-cream Cart', cat: 'restaurant', lat: 11.8823, lng: 75.3548, address: 'Payyambalam', m: 12 },
  ],
};

const NAMES: Record<CityId, string[]> = {
  kl: ['Aisha', 'Wei Jie', 'Arjun', 'Nurul', 'Daniel', 'Mei Ling', 'Hafiz', 'Siti', 'Ravi', 'Farah', 'Jun Hao', 'Priya', 'Amir', 'Chloe', 'Kumar', 'Zara', 'Imran', 'Li Ying'],
  kannur: ['Anjali', 'Rahul', 'Fathima', 'Arjun', 'Nihal', 'Sneha', 'Shibu', 'Ameen', 'Divya', 'Joseph', 'Lakshmi', 'Hiba', 'Vishnu', 'Riya', 'Faisal', 'Meera'],
};

/** How busy a kind of place is at an hour (0 quiet … 1 peak). */
const PEAKS: Record<Category, [number, number][]> = {
  bank: [[11, 1], [15, 0.8]],
  clinic: [[10, 1], [18, 0.85]],
  pharmacy: [[11, 0.7], [19, 1]],
  government: [[10, 1], [14, 0.8]],
  barber: [[12, 0.6], [19, 1]],
  restaurant: [[13, 1], [20, 0.9]],
  shop: [[12, 0.6], [19, 1]],
  service: [[11, 0.9], [17, 1]],
  school: [[9, 1], [14, 0.7]],
  other: [[12, 1]],
};
export function busyness(cat: Category, hour: number, dow: number) {
  let v = 0;
  for (const [h, w] of PEAKS[cat]) v = Math.max(v, w * Math.exp(-((hour - h) ** 2) / 5));
  const weekend = dow === 0 || dow === 6;
  const f = cat === 'restaurant' || cat === 'barber' || cat === 'shop' ? (weekend ? 1.2 : 1) : weekend ? 0.55 : 1;
  return Math.min(1, Math.max(0.18, v * f));
}

// ---------- small helpers ----------
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = Math.random;
const expo = (meanMs: number) => -Math.log(1 - R() * 0.999) * meanMs;

export const isSim = (id?: string | null) => !!id && id.startsWith('demo-');
/** KL's sample places are spread over a few suburbs around APU. */
const SPREAD: Record<CityId, number> = { kl: 2.1, kannur: 1 };
const spread = (c: CityId, lat: number, lng: number) => ({
  lat: CITIES[c].center.lat + (lat - CITIES[c].center.lat) * SPREAD[c],
  lng: CITIES[c].center.lng + (lng - CITIES[c].center.lng) * SPREAD[c],
});
const cityOf = (id: string): CityId => (id.startsWith('demo-kl-') ? 'kl' : 'kannur');

// ---------- settings ----------
const CITY_KEY = 'turnly:city';
const SAMPLES_KEY = 'turnly:samples';
function guessCity(): CityId {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (/Kolkata|Calcutta/.test(tz)) return 'kannur';
  } catch {
    /* ignore */
  }
  return 'kl';
}
let city: CityId = (() => {
  try {
    const v = localStorage.getItem(CITY_KEY);
    if (v === 'kl' || v === 'kannur') return v;
  } catch {
    /* ignore */
  }
  return guessCity();
})();
let samples = (() => {
  try {
    return localStorage.getItem(SAMPLES_KEY) !== '0';
  } catch {
    return true;
  }
})();
export const getCity = () => city;
export const samplesOn = () => samples;
export function setCity(c: CityId) {
  city = c;
  try {
    localStorage.setItem(CITY_KEY, c);
  } catch {
    /* ignore */
  }
  ensureCity(c);
  emit();
}
export function setSamplesOn(on: boolean) {
  samples = on;
  try {
    localStorage.setItem(SAMPLES_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  emit();
}

// ---------- activity feed ----------
export interface FeedItem {
  id: string;
  at: number;
  kind: 'call' | 'join' | 'report';
  placeId: string;
  place: string;
  who?: string;
  number?: number;
  counter?: number;
  minutes?: number;
}
const feed: FeedItem[] = [];
let feedN = 0;
function log(item: Omit<FeedItem, 'id'>) {
  if (Date.now() - item.at > 15 * 60000) return;
  feed.push({ ...item, id: `f${feedN++}` });
  feed.sort((a, b) => b.at - a.at);
  if (feed.length > 60) feed.length = 60;
}

// ---------- state ----------
interface SimPlace {
  seed: Seed;
  city: CityId;
  place: Place;
  tickets: Ticket[];
  /** Per counter: when the person there will be finished. */
  free: number[];
  nextArrival: number;
  /** Time compression while you have a token here. */
  speed: number;
  /** A person (staff console) is calling tokens by hand. */
  manual: boolean;
  /** Another tab is driving this place until then. */
  followUntil: number;
}

const state = new Map<string, SimPlace>();
const community = new Map<CityId, CommunityPlace[]>();
const owned = new Set<string>();
const staffPages = new Map<string, number>();
const loadedCities = new Set<CityId>();
let version = 0;
let beat = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let cache: { v: number; places: Place[]; community: CommunityPlace[] } = { v: -1, places: [], community: [] };
const tabId = Math.random().toString(36).slice(2);
const channel: BroadcastChannel | null = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('turnly-sim') : null;

function emit() {
  version++;
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  ensureCity(city);
  if (!timer) timer = setInterval(tick, 1000);
  return () => {
    listeners.delete(fn);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}
export const getVersion = () => version;

function waitingOf(s: SimPlace) {
  return s.tickets.filter((t) => t.status === 'waiting').length;
}

function sync(s: SimPlace) {
  const svc = s.manual ? s.seed.svc : Math.round(s.seed.svc / s.speed);
  s.place = { ...s.place, waiting: waitingOf(s), avgServiceSec: svc, dayKey: todayKey(), updatedAt: Date.now() };
}

function mkTicket(s: SimPlace, number: number, status: Ticket['status'], at: number, extra: Partial<Ticket> = {}): Ticket {
  const names = NAMES[s.city];
  return {
    id: `s${number}-${Math.random().toString(36).slice(2, 7)}`,
    number,
    name: names[(number * 7 + s.seed.key.length) % names.length],
    partySize: R() < 0.15 ? 2 + Math.floor(R() * 3) : 1,
    uid: 'sim',
    status,
    dayKey: todayKey(),
    createdAt: at,
    calledAt: null,
    announceAt: null,
    doneAt: null,
    counter: null,
    walkIn: R() < 0.25,
    promisedMin: null,
    ...extra,
  };
}

function build(c: CityId, seed: Seed): SimPlace {
  const now = Date.now();
  const d = new Date();
  const r = rng(hash(`${c}-${seed.key}-${todayKey()}-${d.getHours()}`));
  const id = `demo-${c}-${seed.key}`;
  const arrivals: Record<string, number> = {};
  for (let dow = 0; dow < 7; dow++)
    for (let h = 7; h <= 22; h++) arrivals[`${dow}-${h}`] = Math.round(busyness(seed.cat, h, dow) * (8 + seed.peak * 2) * (0.85 + r() * 0.3));
  const n = 18 + Math.floor(r() * 40);
  const place: Place = {
    id,
    name: seed.name,
    category: seed.cat,
    address: seed.address,
    ...spread(c, seed.lat, seed.lng),
    ownerUid: 'sample',
    counters: seed.counters,
    avgServiceSec: seed.svc,
    lastTicket: 0,
    waiting: 0,
    servedToday: 0,
    dayKey: todayKey(),
    isOpen: !seed.closed,
    languages: CITIES[c].langs,
    checkInRadius: 0,
    createdAt: now - 86400000 * 40,
    updatedAt: now,
    arrivals,
    speed: { n, onTime: Math.round(n * (0.7 + r() * 0.29)) },
  };
  const s: SimPlace = { seed, city: c, place, tickets: [], free: [], nextArrival: 0, speed: 1, manual: false, followUntil: 0 };
  const hoursOpen = Math.max(1, Math.min(10, d.getHours() - 8));
  // Tokens served so far today (kept to believable token numbers).
  const done = seed.closed ? 0 : Math.round(Math.min(hoursOpen * (3600 / seed.svc) * seed.counters * (0.35 + r() * 0.3), 28 + r() * 110));
  if (seed.closed) {
    s.place = { ...place, servedToday: 0, lastTicket: 0 };
    return s;
  }
  const target = Math.round(seed.peak * busyness(seed.cat, d.getHours(), d.getDay()) * (0.7 + r() * 0.6));
  let num = Math.max(0, done - 6);
  for (let i = 0; i < Math.min(6, done); i++) {
    num++;
    s.tickets.push(mkTicket(s, num, 'done', now - (6 - i) * seed.svc * 1000, { doneAt: now - (5 - i) * seed.svc * 1000 }));
  }
  num = done;
  for (let k = 1; k <= seed.counters; k++) {
    if (r() < 0.12) {
      s.free.push(now + 2000 + r() * 8000);
      continue;
    }
    num++;
    const calledAt = now - r() * seed.svc * 800;
    s.tickets.push(mkTicket(s, num, 'called', calledAt - 300000, { calledAt, announceAt: calledAt, counter: k }));
    s.free.push(now + r() * seed.svc * 1000);
  }
  const served = num;
  for (let i = 0; i < target; i++) {
    num++;
    const createdAt = now - (target - i) * (seed.svc / seed.counters) * 1000 * (0.5 + r());
    s.tickets.push(mkTicket(s, num, 'waiting', createdAt, { promisedMin: estimateMinutes(i, seed.svc, seed.counters) }));
  }
  s.place = { ...place, servedToday: served, lastTicket: num };
  s.nextArrival = now + expo((seed.svc / seed.counters) * 1000);
  for (const t of s.tickets)
    if (t.status === 'called' && t.calledAt) log({ at: t.calledAt, kind: 'call', placeId: id, place: seed.name, number: t.number, counter: t.counter ?? 1, who: t.name });
  sync(s);
  return s;
}

function buildCommunity(c: CityId): CommunityPlace[] {
  const now = Date.now();
  const d = new Date();
  return COMMUNITY_SEEDS[c].map((cs) => {
    const r = rng(hash(`${c}-${cs.key}-${todayKey()}-${d.getHours()}`));
    const k = 1 + Math.floor(r() * 4);
    const base = cs.m * (0.6 + busyness(cs.cat, d.getHours(), d.getDay()) * 0.7);
    const reports: CommunityReport[] = Array.from({ length: k }, (_, i) => ({
      m: Math.max(0, Math.round(base + (r() - 0.5) * cs.m * 0.4)),
      at: now - (i * 11 + r() * 9 + 1) * 60000,
      v: r() < 0.6,
    }));
    for (const r0 of reports) log({ at: r0.at, kind: 'report', placeId: `demo-${c}-c-${cs.key}`, place: cs.name, minutes: r0.m });
    return {
      id: `demo-${c}-c-${cs.key}`,
      name: cs.name,
      category: cs.cat,
      address: cs.address,
      ...spread(c, cs.lat, cs.lng),
      createdBy: 'sample',
      createdAt: now - 86400000 * 5,
      updatedAt: reports[0].at,
      reports,
    } as CommunityPlace;
  });
}

// ---------- persistence ----------
const SAVE_KEY = 'turnly:sim:v1';
type Saved = { day: string; at: number; places: Record<string, Pick<SimPlace, 'place' | 'tickets' | 'free' | 'nextArrival' | 'speed'>> };
function loadSaved(): Saved | null {
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') as Saved | null;
    return v && v.day === todayKey() && Date.now() - v.at < 4 * 3600000 ? v : null;
  } catch {
    return null;
  }
}
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      const prev = loadSaved();
      const places: Saved['places'] = { ...(prev?.places ?? {}) };
      for (const id of owned) {
        const s = state.get(id);
        if (s) places[id] = { place: s.place, tickets: s.tickets, free: s.free, nextArrival: s.nextArrival, speed: s.speed };
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify({ day: todayKey(), at: Date.now(), places }));
    } catch {
      /* storage full or unavailable */
    }
  }, 800);
}

function ensureCity(c: CityId) {
  if (loadedCities.has(c)) return;
  loadedCities.add(c);
  const saved = loadSaved();
  for (const seed of SEEDS[c]) {
    const id = `demo-${c}-${seed.key}`;
    const s = build(c, seed);
    const sv = saved?.places[id];
    if (sv && sv.tickets.some((t) => t.uid !== 'sim')) {
      Object.assign(s, { place: sv.place, tickets: sv.tickets, free: sv.free, nextArrival: sv.nextArrival, speed: sv.speed });
      advance(s, Date.now());
      sync(s);
    }
    state.set(id, s);
  }
  community.set(c, buildCommunity(c));
}

function get(id: string) {
  ensureCity(cityOf(id));
  return state.get(id) ?? null;
}

// ---------- the engine ----------
function hasYou(s: SimPlace) {
  return s.tickets.some((t) => t.uid !== 'sim' && !t.walkIn && (t.status === 'waiting' || t.status === 'called'));
}

function callAt(s: SimPlace, k: number, t: number) {
  // finish whoever is at counter k
  for (const x of s.tickets) if (x.status === 'called' && x.counter === k) Object.assign(x, { status: 'done', doneAt: t });
  const next = s.tickets
    .filter((x) => x.status === 'waiting' && !(x.deferUntil && x.deferUntil > t))
    .sort((a, b) => a.number - b.number)[0];
  if (!next) return null;
  Object.assign(next, { status: 'called', calledAt: t, announceAt: t, counter: k });
  log({ at: t, kind: 'call', placeId: s.place.id, place: s.place.name, number: next.number, counter: k, who: next.uid === 'sim' ? next.name : undefined });
  const ok = next.uid === 'sim' ? R() < 0.88 : wasOnTime(next, t);
  const sp = s.place.speed ?? { n: 0, onTime: 0 };
  s.place = { ...s.place, servedToday: (s.place.servedToday || 0) + 1, speed: ok === null ? sp : { n: sp.n + 1, onTime: sp.onTime + (ok ? 1 : 0) } };
  return next;
}

function arrive(s: SimPlace, t: number, extra: Partial<Ticket> = {}) {
  const number = s.place.lastTicket + 1;
  const tk = mkTicket(s, number, 'waiting', t, { promisedMin: estimateMinutes(waitingOf(s), s.place.avgServiceSec, s.place.counters), ...extra });
  s.tickets.push(tk);
  s.place = { ...s.place, lastTicket: number };
  if (!extra.walkIn) log({ at: t, kind: 'join', placeId: s.place.id, place: s.place.name, number, who: tk.name });
  return tk;
}

function trim(s: SimPlace) {
  const done = s.tickets.filter((t) => t.uid === 'sim' && (t.status === 'done' || t.status === 'skipped' || t.status === 'left'));
  if (done.length > 8) {
    const drop = new Set(done.slice(0, done.length - 8).map((t) => t.id));
    s.tickets = s.tickets.filter((t) => !drop.has(t.id));
  }
}

/** Run every event that is due up to `now`. Returns true if anything changed. */
function advance(s: SimPlace, now: number) {
  if (!s.place.isOpen) return false;
  let changed = false;
  let guard = 0;
  while (guard++ < 4000) {
    const svc = s.seed.svc;
    const speed = s.manual ? 1 : s.speed;
    let k = -1;
    let tFree = Infinity;
    if (!s.manual) s.free.forEach((f, i) => f < tFree && ((tFree = f), (k = i)));
    const tArr = s.nextArrival;
    const t = Math.min(tFree, tArr);
    if (t > now) break;
    if (tArr <= tFree) {
      const target = s.seed.peak * busyness(s.seed.cat, new Date(t).getHours(), new Date(t).getDay());
      const w = waitingOf(s);
      if (!(s.manual && w >= 14)) arrive(s, t);
      // With a person at the console, someone new turns up every ~20 seconds.
      const rate = s.manual ? 1 / 20 : (s.place.counters / svc) * (w < target ? 1.3 : 0.7);
      s.nextArrival = t + expo(1000 / rate) / speed;
    } else {
      const called = callAt(s, k + 1, t);
      s.free[k] = t + (called ? svc * 1000 * (0.55 + R() * 0.9) : 15000) / speed;
    }
    changed = true;
  }
  if (changed) {
    if (!hasYou(s) && s.speed !== 1) s.speed = 1;
    trim(s);
    sync(s);
  }
  return changed;
}

function tick() {
  const now = Date.now();
  let changed = false;
  beat++;
  for (const [id, s] of state) {
    if (s.followUntil > now) continue;
    const moved = advance(s, now);
    if (moved) changed = true;
    // Keep other tabs (say, the TV board) following this one.
    if (owned.has(id) && (moved || beat % 2 === 0)) {
      publish(s);
      if (!s.manual && !hasYou(s)) owned.delete(id);
    }
  }
  // Fresh crowd reports now and then.
  if (R() < 1 / 45) {
    const list = community.get(city);
    if (list?.length) {
      const c = list[Math.floor(R() * list.length)];
      const seed = COMMUNITY_SEEDS[city].find((x) => c.id.endsWith(x.key));
      if (seed) {
        const d = new Date();
        const m = Math.max(0, Math.round(seed.m * (0.6 + busyness(seed.cat, d.getHours(), d.getDay()) * 0.7) + (R() - 0.5) * seed.m * 0.4));
        const reports = [{ m, at: now, v: R() < 0.6 }, ...(c.reports ?? [])].slice(0, 12);
        log({ at: now, kind: 'report', placeId: c.id, place: c.name, minutes: m });
        community.set(city, list.map((x) => (x.id === c.id ? { ...x, reports, updatedAt: now } : x)));
        changed = true;
      }
    }
  }
  if (changed) emit();
}

// ---------- cross-tab ----------
function publish(s: SimPlace) {
  save();
  channel?.postMessage({ from: tabId, id: s.place.id, place: s.place, tickets: s.tickets, free: s.free, nextArrival: s.nextArrival, speed: s.speed, manual: s.manual });
}
channel?.addEventListener('message', (e: MessageEvent) => {
  const m = e.data as { from: string; id: string } & Pick<SimPlace, 'place' | 'tickets' | 'free' | 'nextArrival' | 'speed' | 'manual'>;
  if (!m || m.from === tabId || !isSim(m.id)) return;
  const s = get(m.id);
  if (!s) return;
  owned.delete(m.id);
  Object.assign(s, { place: m.place, tickets: m.tickets, free: m.free, nextArrival: m.nextArrival, speed: m.speed });
  s.followUntil = Date.now() + 6000;
  emit();
});

/** Something a person did here: this tab now drives the place and tells the others. */
function touched(s: SimPlace) {
  owned.add(s.place.id);
  s.followUntil = 0;
  trim(s);
  sync(s);
  publish(s);
  emit();
}

// ---------- read ----------
export function simPlaces(): Place[] {
  if (cache.v !== version) rebuildCache();
  return cache.places;
}
export function simCommunity(): CommunityPlace[] {
  if (cache.v !== version) rebuildCache();
  return cache.community;
}
function rebuildCache() {
  ensureCity(city);
  const places: Place[] = [];
  for (const s of state.values()) if (s.city === city) places.push(s.place);
  cache = { v: version, places: samples ? places : [], community: samples ? community.get(city) ?? [] : [] };
}
export function simPlace(id: string) {
  return get(id)?.place ?? null;
}
const ticketCache = new Map<string, { v: number; list: Ticket[] }>();
export function simTickets(id: string): Ticket[] {
  const hit = ticketCache.get(id);
  if (hit && hit.v === version) return hit.list;
  const s = get(id);
  const list = s ? s.tickets.map((t) => ({ ...t })).sort((a, b) => a.number - b.number) : [];
  ticketCache.set(id, { v: version, list });
  return list;
}
export const simSpeed = (id: string) => get(id)?.speed ?? 1;

let feedCache: { v: number; list: FeedItem[] } = { v: -1, list: [] };
/** What just happened around the current sample city, newest first. */
export function simFeed(): FeedItem[] {
  if (feedCache.v === version) return feedCache.list;
  ensureCity(city);
  feedCache = { v: version, list: samples ? feed.filter((f) => f.placeId.startsWith(`demo-${city}-`)).slice(0, 30) : [] };
  return feedCache.list;
}

// ---------- actions (mirror queue.ts) ----------
function must(id: string) {
  const s = get(id);
  if (!s) throw new Error('This place no longer exists.');
  advance(s, Date.now());
  return s;
}
const find = (s: SimPlace, ticketId: string) => s.tickets.find((t) => t.id === ticketId);

export async function simJoin(placeId: string, opts: { name: string; partySize: number; uid: string; walkIn?: boolean }) {
  const s = must(placeId);
  if (!s.place.isOpen) throw new Error('This queue is closed right now.');
  const now = Date.now();
  if (!opts.walkIn && !s.manual) {
    // Speed things up so you can watch your turn arrive in a few minutes.
    const was = s.speed;
    s.speed = Math.max(4, Math.min(12, Math.round((waitingOf(s) * s.seed.svc) / s.place.counters / 150)));
    // Counters already busy finish sooner too.
    const f = was / s.speed;
    s.free = s.free.map((x) => (x > now ? now + (x - now) * f : x));
    if (s.nextArrival > now) s.nextArrival = now + (s.nextArrival - now) * f;
    sync(s);
  }
  const tk = arrive(s, now, {
    name: opts.name.trim().slice(0, 40) || 'Guest',
    partySize: Math.min(12, Math.max(1, Math.round(opts.partySize || 1))),
    uid: opts.uid,
    walkIn: !!opts.walkIn,
  });
  const a = s.place.arrivals ?? {};
  const key = `${new Date().getDay()}-${new Date().getHours()}`;
  s.place = { ...s.place, arrivals: { ...a, [key]: (a[key] ?? 0) + 1 } };
  touched(s);
  return { id: tk.id, number: tk.number };
}

export async function simCallNext(placeId: string, counter: number) {
  const s = must(placeId);
  const next = callAt(s, counter, Date.now());
  touched(s);
  return next;
}
export async function simFinish(placeId: string, counter: number) {
  const s = must(placeId);
  const now = Date.now();
  for (const x of s.tickets) if (x.status === 'called' && x.counter === counter) Object.assign(x, { status: 'done', doneAt: now });
  touched(s);
}
export async function simRecall(placeId: string, ticketId: string) {
  const s = must(placeId);
  const t = find(s, ticketId);
  if (t) t.announceAt = Date.now();
  touched(s);
}
export async function simSetStatus(placeId: string, ticketId: string, status: Ticket['status']) {
  const s = must(placeId);
  const t = find(s, ticketId);
  if (t) Object.assign(t, { status, doneAt: Date.now() });
  if (status === 'done' && t?.counter && !s.manual) s.free[t.counter - 1] = Date.now() + 3000 / s.speed;
  touched(s);
}
export async function simCheckIn(placeId: string, ticketId: string) {
  const s = must(placeId);
  const t = find(s, ticketId);
  if (t) t.checkedInAt = Date.now();
  touched(s);
}
export async function simDefer(placeId: string, ticketId: string, minutes: number) {
  const s = must(placeId);
  const t = find(s, ticketId);
  if (t && t.status === 'called') {
    const k = t.counter;
    Object.assign(t, { status: 'waiting', calledAt: null, counter: null, deferUntil: Date.now() + (minutes * 60000) / s.speed });
    if (k && !s.manual) s.free[k - 1] = Date.now() + 2000;
  }
  touched(s);
}
export async function simUpdatePlace(placeId: string, patch: Partial<Place>) {
  const s = must(placeId);
  if (patch.counters && patch.counters !== s.place.counters) {
    const now = Date.now();
    while (s.free.length < patch.counters) s.free.push(now + 1500);
    if (s.free.length > patch.counters) {
      for (const x of s.tickets) if (x.status === 'called' && (x.counter ?? 0) > patch.counters!) Object.assign(x, { status: 'done', doneAt: now });
      s.free.length = patch.counters;
    }
  }
  s.place = { ...s.place, ...patch, id: s.place.id };
  touched(s);
}
export async function simAddWalkIns(placeId: string, count: number) {
  const s = must(placeId);
  for (let i = 0; i < count; i++) arrive(s, Date.now(), { walkIn: true });
  touched(s);
}
export async function simRequestSwap(placeId: string, mine: Ticket, targetId: string) {
  const s = must(placeId);
  const target = find(s, targetId);
  if (!target) return;
  target.swapRequest = { fromTicketId: mine.id, fromNumber: mine.number, fromName: mine.name, at: Date.now() };
  touched(s);
  // The sample person ahead thinks about it, then usually says yes.
  setTimeout(() => {
    const t2 = find(s, targetId);
    const me = find(s, mine.id);
    if (!t2 || !me || !t2.swapRequest) return;
    if (R() < 0.75 && t2.status === 'waiting' && me.status === 'waiting') {
      const n = t2.number;
      t2.number = me.number;
      me.number = n;
      t2.swappedAt = me.swappedAt = Date.now();
    }
    t2.swapRequest = null;
    touched(s);
  }, 3500 + R() * 2500);
}
export async function simClearSwap(placeId: string, targetId: string) {
  const s = must(placeId);
  const t = find(s, targetId);
  if (t) t.swapRequest = null;
  touched(s);
}
export async function simAcceptSwap(placeId: string, mineId: string) {
  const s = must(placeId);
  const mine = find(s, mineId);
  const other = mine?.swapRequest ? find(s, mine.swapRequest.fromTicketId) : undefined;
  if (!mine || !other) return false;
  const n = other.number;
  other.number = mine.number;
  mine.number = n;
  mine.swapRequest = null;
  mine.swappedAt = other.swappedAt = Date.now();
  touched(s);
  return true;
}

export async function simReport(id: string, m: number, v: boolean) {
  const c = cityOf(id);
  const name = community.get(c)?.find((x) => x.id === id)?.name ?? '';
  log({ at: Date.now(), kind: 'report', placeId: id, place: name, minutes: m });
  const list = community.get(c) ?? [];
  community.set(
    c,
    list.map((x) => (x.id === id ? { ...x, reports: [{ m, at: Date.now(), v }, ...(x.reports ?? [])].slice(0, 12), updatedAt: Date.now() } : x)),
  );
  emit();
}

/** The staff console is open on this tab: hand calling over to the person. */
export function setStaff(placeId: string, on: boolean) {
  const s = get(placeId);
  if (!s) return;
  staffPages.set(placeId, (staffPages.get(placeId) ?? 0) + (on ? 1 : -1));
  if ((staffPages.get(placeId) ?? 0) <= 0) staffPages.delete(placeId);
  const was = s.manual;
  s.manual = staffPages.has(placeId);
  const now = Date.now();
  if (s.manual) {
    s.speed = 1;
    if (!was) s.nextArrival = now + 6000;
  } else if (was) {
    // Hand back to the automatic counters, lined up from now.
    s.free = s.free.map(() => now + 2000 + R() * 6000);
  }
  touched(s);
}

/** The sample branch the staff console demo uses. */
export const sampleBranchId = () => `demo-${city}-bank`;
