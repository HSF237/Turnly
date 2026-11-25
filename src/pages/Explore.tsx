import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Crosshair, Flame, MessageSquarePlus, Plus, Search, Users, X } from 'lucide-react';
import MapView from '../components/MapView';
import WaitBadge from '../components/WaitBadge';
import CategoryArt from '../components/CategoryArt';
import ReportSheet from '../components/community/ReportSheet';
import AddPlaceSheet from '../components/community/AddPlaceSheet';
import { ErrorNote } from '../components/States';
import { useCommunity, useGeolocation, usePlaces, useTick } from '../lib/hooks';
import { placeWaitMinutes } from '../lib/predict';
import { communityEstimate } from '../lib/community';
import { distanceM, timeAgo, todayKey } from '../lib/time';
import { CATEGORY_META, type Category, type CommunityPlace, type Place } from '../lib/types';
import { isOnTime } from '../lib/speed';

type SortBy = 'wait' | 'distance';
type Sel = { kind: 'official' | 'community'; id: string } | null;
type Item =
  | { kind: 'official'; id: string; p: Place; min: number | null; dist: number | null }
  | { kind: 'community'; id: string; c: CommunityPlace; min: number | null; dist: number | null; count: number; latest: number | null };

export default function Explore() {
  useTick(30000);
  const { places, loading, error } = usePlaces();
  const { places: community } = useCommunity();
  const geo = useGeolocation();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [cat, setCat] = useState<Category | 'all'>((params.get('cat') as Category | null) ?? 'all');
  const [sort, setSort] = useState<SortBy>('wait');
  const [sel, setSel] = useState<Sel>(() => (params.get('c') ? { kind: 'community', id: params.get('c')! } : params.get('p') ? { kind: 'official', id: params.get('p')! } : null));
  const [focus, setFocus] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [heat, setHeat] = useState(false);
  const [adding, setAdding] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickedPos, setPickedPos] = useState<{ lat: number; lng: number } | null>(null);
  const [reporting, setReporting] = useState<CommunityPlace | null>(null);

  // Deep link (?c= / ?p=): centre the map on that place once it has loaded.
  useEffect(() => {
    if (!sel || focus) return;
    const hit = sel.kind === 'community' ? community.find((c) => c.id === sel.id) : places.find((p) => p.id === sel.id);
    if (hit) setFocus({ lat: hit.lat, lng: hit.lng });
  }, [community, places]);

  const items = useMemo<Item[]>(() => {
    const term = q.trim().toLowerCase();
    const match = (name: string, address: string, category: Category) =>
      (cat === 'all' || category === cat) && (!term || name.toLowerCase().includes(term) || address.toLowerCase().includes(term));
    const out: Item[] = [
      ...places
        .filter((p) => match(p.name, p.address, p.category))
        .map((p) => ({ kind: 'official' as const, id: p.id, p, min: placeWaitMinutes(p), dist: geo.pos ? distanceM(geo.pos, p) : null })),
      ...community
        .filter((c) => match(c.name, c.address ?? '', c.category))
        .map((c) => {
          const est = communityEstimate(c.reports ?? []);
          return {
            kind: 'community' as const,
            id: c.id,
            c,
            min: est ? est.minutes : null,
            dist: geo.pos ? distanceM(geo.pos, c) : null,
            count: est?.count ?? 0,
            latest: est?.latest ?? null,
          };
        }),
    ];
    out.sort((a, b) => {
      if (sort === 'distance' && a.dist !== null && b.dist !== null) return a.dist - b.dist;
      return (a.min ?? 9999) - (b.min ?? 9999);
    });
    return out;
  }, [places, community, q, cat, sort, geo.pos]);

  const selectOfficial = useCallback((p: Place) => {
    setSel({ kind: 'official', id: p.id });
    setFocus({ lat: p.lat, lng: p.lng });
  }, []);
  const selectCommunity = useCallback((c: CommunityPlace) => {
    setSel({ kind: 'community', id: c.id });
    setFocus({ lat: c.lat, lng: c.lng });
  }, []);

  const usedCats = Array.from(new Set([...places.map((p) => p.category), ...community.map((c) => c.category), ...(cat !== 'all' ? [cat] : [])]));
  const today = todayKey();
  const liveP = sel?.kind === 'official' ? places.find((p) => p.id === sel.id) ?? null : null;
  const liveC = sel?.kind === 'community' ? community.find((c) => c.id === sel.id) ?? null : null;
  const estC = liveC ? communityEstimate(liveC.reports ?? []) : null;

  return (
    <>
    <div className="grid h-[calc(100dvh-4rem-1px-env(safe-area-inset-top))] grid-cols-1 grid-rows-[40dvh_minmax(0,1fr)] overflow-hidden md:grid-cols-[400px_1fr] md:grid-rows-1">
      {/* Sidebar */}
      <aside className="order-2 flex min-h-0 min-w-0 flex-col border-r border-slate-200 bg-white md:order-1">
        <div className="space-y-3 border-b border-slate-100 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input className="input pl-9" placeholder="Search banks, barbers, offices…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
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
                  className={`rounded-md px-2.5 py-1 ${sort === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  onClick={async () => {
                    if (s === 'distance' && !geo.pos) await geo.request();
                    setSort(s);
                  }}
                >
                  {s === 'wait' ? 'Shortest wait' : 'Nearest'}
                </button>
              ))}
            </div>
            <span className="text-slate-400">
              {items.length} {items.length === 1 ? 'place' : 'places'}
            </span>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-28 md:pb-3">
          {error && <ErrorNote message={error} />}
          {loading && <p className="p-4 text-sm text-slate-500">Loading live queues…</p>}
          <ul className="space-y-2">
            {items.map((it, i) => {
              const category = it.kind === 'official' ? it.p.category : it.c.category;
              const name = it.kind === 'official' ? it.p.name : it.c.name;
              const active = sel?.id === it.id;
              return (
                <motion.li key={it.id} layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.04 }}>
                  <button
                    onClick={() => (it.kind === 'official' ? selectOfficial(it.p) : selectCommunity(it.c))}
                    className={`w-full rounded-xl p-3 text-left transition ${active ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-black/5">
                          <CategoryArt category={category} className="h-full w-full scale-[1.4]" />
                          {it.kind === 'community' && <span className="absolute bottom-0.5 right-0.5 rounded-md bg-white/90 px-1 text-[10px]">👥</span>}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 truncate font-bold text-slate-900">
                            <span className="truncate">{name}</span>
                            {it.kind === 'official' && isOnTime(it.p) && <BadgeCheck size={15} className="shrink-0 text-brand-600" />}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {it.kind === 'official' ? CATEGORY_META[category].label : 'Community · not on Turnly yet'}
                            {it.dist !== null && ` · ${it.dist < 1000 ? `${Math.round(it.dist)} m` : `${(it.dist / 1000).toFixed(1)} km`}`}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <Users size={12} />
                            {it.kind === 'official'
                              ? `${it.p.dayKey === today && it.p.isOpen ? it.p.waiting : 0} waiting`
                              : it.count
                                ? `${it.count} report${it.count === 1 ? '' : 's'} · ${timeAgo(it.latest!)}`
                                : 'No recent reports'}
                          </p>
                        </div>
                      </div>
                      <WaitBadge minutes={it.min} approx={it.kind === 'community'} empty={it.kind === 'community' ? 'Unknown' : 'Closed'} />
                    </div>
                    {it.min !== null && (
                      <div className="ml-[4.25rem] mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          className={`h-full rounded-full ${it.min <= 10 ? 'bg-brand-500' : it.min <= 30 ? 'bg-sun-400' : 'bg-rose-500'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(4, Math.min(100, (it.min / 60) * 100))}%` }}
                          transition={{ duration: 0.9, delay: 0.15 + Math.min(i, 10) * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
                        />
                      </div>
                    )}
                  </button>
                </motion.li>
              );
            })}
          </ul>
          {!loading && (
            <button
              onClick={() => {
                setPickedPos(null);
                setAdding(true);
              }}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Plus size={20} />
              </span>
              <span>
                <span className="block font-bold">Missing a place?</span>
                <span className="block text-xs text-slate-500">Add it, and people in its line can share the wait.</span>
              </span>
            </button>
          )}
        </div>
      </aside>

      {/* Map */}
      <section className="relative order-1 min-h-0 md:order-2">
        <MapView
          places={places}
          community={community}
          selectedId={sel?.id}
          onSelect={selectOfficial}
          onSelectCommunity={selectCommunity}
          center={focus}
          me={geo.pos}
          heat={heat}
          picked={adding ? pickedPos : null}
          onPick={(pos) => {
            if (picking) {
              setPickedPos(pos);
              setPicking(false);
            }
          }}
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <button
            className="btn-ghost shadow-soft"
            onClick={async () => {
              const p = await geo.request();
              if (p) setFocus(p);
            }}
          >
            <Crosshair size={16} /> <span className="hidden sm:inline">Near me</span>
          </button>
          <motion.button
            whileTap={{ scale: 0.94 }}
            className={`btn shadow-soft ${heat ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}
            onClick={() => setHeat((h) => !h)}
          >
            <Flame size={16} className={heat ? 'text-sun-400' : ''} /> City pulse
          </motion.button>
        </div>

        {/* Pick-on-map banner */}
        <AnimatePresence>
          {picking && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-x-3 top-16 z-20 flex items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lift"
            >
              Tap the map where the place is
              <button className="rounded-lg bg-white/10 px-3 py-1" onClick={() => setPicking(false)}>
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating add button (phones) */}
        {!sel && !adding && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setPickedPos(null);
              setAdding(true);
            }}
            className="absolute bottom-12 right-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-white shadow-lift md:hidden"
            aria-label="Add a place"
          >
            <Plus size={22} />
          </motion.button>
        )}

        {/* Selected place sheet */}
        <AnimatePresence>
          {(liveP || liveC) && (
            <motion.div
              key={sel!.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 70) setSel(null);
              }}
              className="card fixed inset-x-3 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 overflow-hidden p-4 pt-0 shadow-lift md:absolute md:inset-x-auto md:bottom-4 md:right-4 md:w-96"
            >
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-300 md:hidden" />
              <div className="relative -mx-4 mb-3 mt-2 h-20 overflow-hidden md:mt-0 md:h-28">
                <CategoryArt category={(liveP ?? liveC)!.category} className="h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
              </div>
              <button className="absolute right-3 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-500 shadow-soft hover:bg-white" onClick={() => setSel(null)}>
                <X size={16} />
              </button>

              {liveP && (
                <>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    {CATEGORY_META[liveP.category].emoji} {CATEGORY_META[liveP.category].label}
                    {isOnTime(liveP) && (
                      <span className="chip bg-brand-50 py-0.5 text-brand-700 ring-brand-200">
                        <BadgeCheck size={12} /> On time
                      </span>
                    )}
                  </p>
                  <h3 className="mt-0.5 pr-6 text-lg font-extrabold">{liveP.name}</h3>
                  <p className="text-sm text-slate-500">{liveP.address}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <WaitBadge minutes={placeWaitMinutes(liveP)} size="lg" />
                    <span className="text-sm text-slate-500">
                      {liveP.dayKey === today ? liveP.waiting : 0} in line · {liveP.counters} counter{liveP.counters > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      to={liveP.isOpen ? `/q/${liveP.id}` : '#'}
                      className={`btn-primary flex-1 ${liveP.isOpen ? '' : 'pointer-events-none opacity-50'}`}
                      aria-disabled={!liveP.isOpen}
                    >
                      {liveP.isOpen ? 'Join the queue' : 'Closed now'}
                    </Link>
                    <a className="btn-ghost" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${liveP.lat},${liveP.lng}`}>
                      Directions
                    </a>
                  </div>
                </>
              )}

              {liveC && (
                <>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    {CATEGORY_META[liveC.category].emoji} {CATEGORY_META[liveC.category].label}
                    <span className="chip bg-slate-100 py-0.5 text-slate-600 ring-slate-200">👥 Community</span>
                  </p>
                  <h3 className="mt-0.5 pr-6 text-lg font-extrabold">{liveC.name}</h3>
                  {liveC.address && <p className="text-sm text-slate-500">{liveC.address}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <WaitBadge minutes={estC ? estC.minutes : null} size="lg" approx empty="No recent reports" />
                    {estC && (
                      <span className="text-sm text-slate-500">
                        {estC.count} report{estC.count === 1 ? '' : 's'} · {timeAgo(estC.latest)}
                      </span>
                    )}
                  </div>
                  {estC && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      Confidence
                      {[0, 1, 2].map((k) => (
                        <span
                          key={k}
                          className={`h-1.5 w-5 rounded-full ${
                            k < (estC.confidence === 'high' ? 3 : estC.confidence === 'medium' ? 2 : 1) ? 'bg-brand-500' : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button className="btn-primary flex-1" onClick={() => setReporting(liveC)}>
                      <MessageSquarePlus size={16} /> I'm here: report the wait
                    </button>
                    <a className="btn-ghost" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${liveC.lat},${liveC.lng}`}>
                      Go
                    </a>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    Not on Turnly yet. Own this place?{' '}
                    <Link to="/business/new" className="font-bold text-brand-700">
                      Set up a real queue
                    </Link>
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>

      {/* Sheets live outside the grid so they never take a layout cell */}
      <AnimatePresence>{reporting && <ReportSheet key="report" place={reporting} onClose={() => setReporting(null)} />}</AnimatePresence>
      {/* Kept mounted (hidden) while picking on the map, so typed details aren't lost */}
      <div className={picking ? 'hidden' : ''}>
        <AnimatePresence>
          {adding && (
            <AddPlaceSheet
              key="add"
              picked={pickedPos}
              onPickOnMap={() => setPicking(true)}
              onClose={() => {
                setAdding(false);
                setPicking(false);
                setPickedPos(null);
              }}
              onCreated={(id) => {
                setAdding(false);
                setPickedPos(null);
                setSel({ kind: 'community', id });
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
