import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, doc, limit, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { todayKey } from './time';
import type { Place, Ticket } from './types';

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
        setPlaces(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Place));
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
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Place);
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
