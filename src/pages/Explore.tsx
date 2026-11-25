import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, Search, Users, X } from 'lucide-react';
import MapView from '../components/MapView';
import WaitBadge from '../components/WaitBadge';
import CategoryArt from '../components/CategoryArt';
import { ErrorNote } from '../components/States';
import { useGeolocation, usePlaces } from '../lib/hooks';
import { placeWaitMinutes } from '../lib/predict';
import { distanceM, todayKey } from '../lib/time';
import { CATEGORY_META, type Category, type Place } from '../lib/types';

type SortBy = 'wait' | 'distance';

export default function Explore() {
  const { places, loading, error } = usePlaces();
  const geo = useGeolocation();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [cat, setCat] = useState<Category | 'all'>((params.get('cat') as Category | null) ?? 'all');
  const [sort, setSort] = useState<SortBy>('wait');
  const [selected, setSelected] = useState<Place | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | undefined>(undefined);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const items = places
      .filter((p) => cat === 'all' || p.category === cat)
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.address.toLowerCase().includes(term))
      .map((p) => ({ p, min: placeWaitMinutes(p), dist: geo.pos ? distanceM(geo.pos, p) : null }));
    items.sort((a, b) => {
      if (sort === 'distance' && a.dist !== null && b.dist !== null) return a.dist - b.dist;
      return (a.min ?? 9999) - (b.min ?? 9999);
    });
    return items;
  }, [places, q, cat, sort, geo.pos]);

  const onSelect = useCallback((p: Place) => {
    setSelected(p);
    setFocus({ lat: p.lat, lng: p.lng });
  }, []);

  const usedCats = Array.from(new Set([...places.map((p) => p.category), ...(cat !== 'all' ? [cat] : [])]));
  const today = todayKey();
  const live = selected ? places.find((p) => p.id === selected.id) ?? selected : null;

  return (
    <div className="grid h-[calc(100dvh-4rem-1px)] grid-cols-1 grid-rows-[45dvh_minmax(0,1fr)] overflow-hidden md:grid-cols-[400px_1fr] md:grid-rows-1">
      {/* Sidebar */}
      <aside className="order-2 flex min-h-0 min-w-0 flex-col border-r border-slate-200 bg-white md:order-1">
        <div className="space-y-3 border-b border-slate-100 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input className="input pl-9" placeholder="Search banks, barbers, offices…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button className={`chip whitespace-nowrap ${cat === 'all' ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200'}`} onClick={() => setCat('all')}>
              All
            </button>
            {usedCats.map((c) => (
              <button
                key={c}
                className={`chip whitespace-nowrap ${cat === c ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200'}`}
                onClick={() => setCat(c)}
              >
                {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 font-semibold">
              {(['wait', 'distance'] as SortBy[]).map((s) => (
                <button
                  key={s}
                  className={`rounded-md px-2.5 py-1 ${sort === s ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                  onClick={async () => {
                    if (s === 'distance' && !geo.pos) await geo.request();
                    setSort(s);
                  }}
                >
                  {s === 'wait' ? 'Shortest wait' : 'Nearest'}
                </button>
              ))}
            </div>
            <span className="text-slate-400">{list.length} {list.length === 1 ? "place" : "places"}</span>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-28 md:pb-3">
          {error && <ErrorNote message={error} />}
          {loading && <p className="p-4 text-sm text-slate-500">Loading live queues…</p>}
          {!loading && !list.length && (
            <div className="p-6 text-center text-sm text-slate-500">
              No places yet.{' '}
              <Link className="font-semibold text-brand-700 underline" to="/business/new">
                Add the first one
              </Link>
              .
            </div>
          )}
          <ul className="space-y-2">
            {list.map(({ p, min, dist }, i) => (
              <motion.li key={p.id} layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.04 }}>
                <button
                  onClick={() => onSelect(p)}
                  className={`w-full rounded-xl p-3 text-left transition ${selected?.id === p.id ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <span className="block h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-black/5">
                        <CategoryArt category={p.category} className="h-full w-full scale-[1.4]" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">{p.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {CATEGORY_META[p.category].label}
                          {dist !== null && ` · ${dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`}`}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Users size={12} /> {p.dayKey === today && p.isOpen ? p.waiting : 0} waiting
                        </p>
                      </div>
                    </div>
                    <WaitBadge minutes={min} />
                  </div>
                </button>
              </motion.li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Map */}
      <section className="relative order-1 h-[45dvh] md:order-2 md:h-auto">
        <MapView places={places} selectedId={selected?.id} onSelect={onSelect} center={focus} me={geo.pos} />
        <button
          className="btn-ghost absolute left-3 top-3 shadow-soft"
          onClick={async () => {
            const p = await geo.request();
            if (p) setFocus(p);
          }}
        >
          <Crosshair size={16} /> Near me
        </button>
        <AnimatePresence>
          {live && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="card absolute inset-x-3 bottom-3 overflow-hidden p-4 pt-0 md:inset-x-auto md:right-4 md:w-96"
            >
              <div className="relative -mx-4 mb-3 h-28 overflow-hidden">
                <CategoryArt category={live.category} className="h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
              </div>
              <button className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-500 shadow-soft hover:bg-white" onClick={() => setSelected(null)}>
                <X size={16} />
              </button>
              <p className="text-xs font-semibold text-slate-500">
                {CATEGORY_META[live.category].emoji} {CATEGORY_META[live.category].label}
              </p>
              <h3 className="mt-0.5 pr-6 text-lg font-extrabold">{live.name}</h3>
              <p className="text-sm text-slate-500">{live.address}</p>
              <div className="mt-3 flex items-center gap-3">
                <WaitBadge minutes={placeWaitMinutes(live)} size="lg" />
                <span className="text-sm text-slate-500">
                  {live.dayKey === today ? live.waiting : 0} in line · {live.counters} counter{live.counters > 1 ? 's' : ''}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <Link to={`/q/${live.id}`} className="btn-primary flex-1" aria-disabled={!live.isOpen}>
                  {live.isOpen ? 'Join the queue' : 'Closed now'}
                </Link>
                <a
                  className="btn-ghost"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${live.lat},${live.lng}`}
                >
                  Directions
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
