import { addDoc, collection, doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { isSim, simReport } from './sim';
import type { Category, CommunityPlace, CommunityReport } from './types';

export const communityRef = (id: string) => doc(db, 'community', id);

const WINDOW_MIN = 90; // reports older than this are ignored
const HALF_LIFE_MIN = 25; // a report loses half its weight every 25 minutes
const KEEP = 12; // reports kept per place

/**
 * Community estimate = recency-weighted median of recent reports.
 *
 * Why a median, not an average: one person typing "120 min" as a joke can't
 * drag the estimate up. Why weighted: a report from 2 minutes ago matters more
 * than one from an hour ago, and on-site (location-verified) reports count 1.5×.
 */
export function communityEstimate(reports: CommunityReport[], now = Date.now()) {
  const recent = reports
    .filter((r) => now - r.at < WINDOW_MIN * 60000)
    .map((r) => ({ m: r.m, w: Math.pow(0.5, (now - r.at) / 60000 / HALF_LIFE_MIN) * (r.v ? 1.5 : 1), at: r.at }));
  if (!recent.length) return null;
  recent.sort((a, b) => a.m - b.m);
  const total = recent.reduce((s, r) => s + r.w, 0);
  let acc = 0;
  let median = recent[recent.length - 1].m;
  for (const r of recent) {
    acc += r.w;
    if (acc >= total / 2) {
      median = r.m;
      break;
    }
  }
  const latest = Math.max(...recent.map((r) => r.at));
  const confidence: 'low' | 'medium' | 'high' = recent.length >= 4 ? 'high' : recent.length >= 2 ? 'medium' : 'low';
  return { minutes: Math.round(median), count: recent.length, latest, confidence };
}

export async function createCommunityPlace(
  uid: string,
  input: { name: string; category: Category; address: string; lat: number; lng: number; firstReport?: { m: number; v: boolean } },
) {
  const now = Date.now();
  const data: Omit<CommunityPlace, 'id'> = {
    name: input.name.trim().slice(0, 80),
    category: input.category,
    address: input.address.trim().slice(0, 120),
    lat: input.lat,
    lng: input.lng,
    createdBy: uid,
    createdAt: now,
    updatedAt: now,
    reports: input.firstReport ? [{ m: input.firstReport.m, v: input.firstReport.v, at: now }] : [],
  };
  const ref = await addDoc(collection(db, 'community'), data);
  return ref.id;
}

/** Add a report, keeping only the newest few so the document stays small. */
export async function reportWait(placeId: string, m: number, verified: boolean) {
  if (isSim(placeId)) return simReport(placeId, m, verified);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(communityRef(placeId));
    if (!snap.exists()) throw new Error('This place no longer exists.');
    const cur = (snap.data() as CommunityPlace).reports ?? [];
    const next = [...cur, { m: Math.max(0, Math.min(240, Math.round(m))), at: Date.now(), v: verified }].slice(-KEEP);
    tx.update(communityRef(placeId), { reports: next, updatedAt: Date.now() });
  });
}

const MINE = 'turnly:reported';
/** Throttle: one report per place every 10 minutes from this device. */
export function canReport(placeId: string) {
  try {
    const all = JSON.parse(localStorage.getItem(MINE) || '{}');
    return !all[placeId] || Date.now() - all[placeId] > 10 * 60000;
  } catch {
    return true;
  }
}
export function markReported(placeId: string) {
  try {
    const all = JSON.parse(localStorage.getItem(MINE) || '{}');
    all[placeId] = Date.now();
    localStorage.setItem(MINE, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
