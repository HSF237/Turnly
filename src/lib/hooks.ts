import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, doc, limit, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { todayKey } from './time';
import type { Place, SchoolEvent, Ticket } from './types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(!auth.currentUser);
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      }),
    [],
  );
  return { user, loading, isMember: !!user && !user.isAnonymous };
}

export function usePlace(placeId: string | undefined) {
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!placeId) return;
    setLoading(true);
    return onSnapshot(
      doc(db, 'places', placeId),
      (snap) => {
        setPlace(snap.exists() ? ({ id: snap.id, ...snap.data() } as Place) : null);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
  }, [placeId]);
  return { place, loading, error };
}

/** Today's tickets for a place, sorted by token number. */
export function useTickets(placeId: string | undefined) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const day = todayKey();
  useEffect(() => {
    if (!placeId) return;
    const q = query(collection(db, 'places', placeId, 'tickets'), where('dayKey', '==', day));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Ticket);
        list.sort((a, b) => a.number - b.number);
        setTickets(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [placeId, day]);
  return { tickets, loading };
}

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const q = query(collection(db, 'places'), limit(300));
    return onSnapshot(
      q,
      (snap) => {
        setPlaces(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Place).filter((p) => !p.hidden));
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
  }, []);
  return { places, loading, error };
}

export function useMyPlaces(uid: string | undefined) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'places'), where('ownerUid', '==', uid));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Place).filter((p) => !p.hidden);
        list.sort((a, b) => b.createdAt - a.createdAt);
        setPlaces(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [uid]);
  return { places, loading };
}

/** Re-render every `ms` so "x min ago" style text stays fresh. */
export function useTick(ms = 15000) {
  const [, set] = useState(0);
  useEffect(() => {
    const id = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

export function useGeolocation() {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const request = () =>
    new Promise<{ lat: number; lng: number } | null>((resolve) => {
      if (!navigator.geolocation) {
        setError('Location is not available on this device.');
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const v = { lat: p.coords.latitude, lng: p.coords.longitude };
          setPos(v);
          setError(null);
          resolve(v);
        },
        (e) => {
          setError(e.message || 'Location permission was denied.');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  return { pos, error, request };
}

export function useSchoolEvent(eventId: string | undefined) {
  const [event, setEvent] = useState<SchoolEvent | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!eventId) return;
    return onSnapshot(
      doc(db, 'schoolEvents', eventId),
      (snap) => {
        setEvent(snap.exists() ? ({ id: snap.id, ...snap.data() } as SchoolEvent) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [eventId]);
  return { event, loading };
}

export function useEventTeachers(eventId: string | undefined) {
  const [teachers, setTeachers] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!eventId) return;
    const q = query(collection(db, 'places'), where('eventId', '==', eventId));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Place);
        list.sort((a, b) => a.createdAt - b.createdAt || a.name.localeCompare(b.name));
        setTeachers(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [eventId]);
  return { teachers, loading };
}

export function useMySchoolEvents(uid: string | undefined) {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'schoolEvents'), where('ownerUid', '==', uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SchoolEvent);
      list.sort((a, b) => b.createdAt - a.createdAt);
      setEvents(list);
    });
  }, [uid]);
  return events;
}

/** Today's tickets for many places at once: placeId → tickets. */
export function useMultiTickets(placeIds: string[]) {
  const [map, setMap] = useState<Record<string, Ticket[]>>({});
  const day = todayKey();
  const key = placeIds.join(',');
  useEffect(() => {
    if (!placeIds.length) return;
    const unsubs = placeIds.map((pid) =>
      onSnapshot(query(collection(db, 'places', pid, 'tickets'), where('dayKey', '==', day)), (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Ticket).sort((a, b) => a.number - b.number);
        setMap((m) => ({ ...m, [pid]: list }));
      }),
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, day]);
  return map;
}
