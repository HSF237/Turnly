import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Crosshair, Footprints, Hourglass, Search, Sparkles, TrendingDown, Wand2, X } from 'lucide-react';
import Aurora from '../components/Aurora';
import MapView from '../components/MapView';
import WaitBadge from '../components/WaitBadge';
import { ErrorNote } from '../components/States';
import { useGeolocation, usePlaces } from '../lib/hooks';
import { bestPlan } from '../lib/planner';
import { formatMinutes, placeWaitMinutes } from '../lib/predict';
import { clock } from '../lib/time';
import { CATEGORY_META, type Place } from '../lib/types';

const MAX = 7;
type Result = ReturnType<typeof bestPlan>;

function Thinking({ total }: { total: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card grid h-full min-h-[420px] place-items-center p-10 text-center">
      <div>
        <div className="relative mx-auto h-24 w-24">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border-2 border-brand-400"
              initial={{ scale: 0.4, opacity: 0.8 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
          <span className="absolute inset-0 grid place-items-center rounded-full bg-brand-600 text-white">
            <Wand2 size={30} />
          </span>
        </div>
        <p className="mt-6 text-xl font-extrabold">Testing every possible route…</p>
        <p className="mt-1 text-sm text-slate-500">
          Checking {total.toLocaleString()} orders against live queue times and travel time.
        </p>
      </div>
    </motion.div>
  );
}

function LegBar({ travel, standing, service, scale }: { travel: number; standing: number; service: number; scale: number }) {
  const w = (n: number) => `${Math.max(n ? 3 : 0, (n / scale) * 100)}%`;
  return (
    <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <motion.span initial={{ width: 0 }} animate={{ width: w(travel) }} transition={{ duration: 0.7 }} className="bg-sky-400" title="Travel" />
      <motion.span initial={{ width: 0 }} animate={{ width: w(standing) }} transition={{ duration: 0.7, delay: 0.1 }} className="bg-sun-400" title="Standing in line" />
      <motion.span initial={{ width: 0 }} animate={{ width: w(service) }} transition={{ duration: 0.7, delay: 0.2 }} className="bg-brand-500" title="Being served" />
    </div>
  );
}

export default function Plan() {
  const { places, loading, error } = usePlaces();
  const geo = useGeolocation();
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Place[]>([]);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [startedAt, setStartedAt] = useState(Date.now());

  const open = useMemo(
    () =>
      places
        .filter((p) => p.isOpen)
        .filter((p) => !q.trim() || `${p.name} ${p.address}`.toLowerCase().includes(q.trim().toLowerCase())),
    [places, q],
  );

  const toggle = (p: Place) => {
    setResult(null);
    setPicked((cur) => (cur.some((x) => x.id === p.id) ? cur.filter((x) => x.id !== p.id) : cur.length >= MAX ? cur : [...cur, p]));
  };

  const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));

  const run = () => {
    // Use the freshest data for every picked stop.
    const fresh = picked.map((p) => places.find((x) => x.id === p.id) ?? p);
    setThinking(true);
    setResult(null);
    setTimeout(() => {
      setResult(bestPlan(fresh, geo.pos));
      setStartedAt(Date.now());
      setThinking(false);
    }, 1400);
  };

  const order = useMemo(() => {
    const m: Record<string, number> = {};
    result?.best.legs.forEach((l, i) => (m[l.place.id] = i + 1));
    return m;
  }, [result]);

  const route = result ? [...(geo.pos ? [geo.pos] : []), ...result.best.legs.map((l) => ({ lat: l.place.lat, lng: l.place.lng }))] : null;
  const savedVsWalkIn = result ? Math.max(0, result.walkIn - result.best.totalMin) : 0;
  const savedVsPicked = result ? Math.max(0, result.asPicked.totalMin - result.best.totalMin) : 0;
  const at = (min: number) => clock(startedAt + min * 60000);
  const scale = result ? Math.max(...result.best.legs.map((l) => l.travelMin + l.waitOnSiteMin + l.serviceMin), 1) : 1;

  return (
    <div className="relative isolate">
      <Aurora />
      <div className="container-x py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <span className="chip bg-white/80 text-brand-700 ring-brand-200">
            <Sparkles size={12} /> Route planner
          </span>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Plan my errands</h1>
          <p className="mt-2 max-w-2xl text-lg text-slate-600">
            Pick the places you need today. Turnly tests every possible order against live queues and travel time, and joins your next queue
            as you leave each stop, so the line moves while you travel.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Picker */}
          <div className="card flex max-h-[720px] flex-col overflow-hidden">
            <div className="space-y-3 border-b border-slate-100 p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input className="input pl-9" placeholder="Search places…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <button
                className={`btn w-full ${geo.pos ? 'bg-brand-50 text-brand-700' : 'btn-ghost'}`}
                onClick={() => {
                  setResult(null);
                  geo.request();
                }}
              >
                <Crosshair size={16} /> {geo.pos ? 'Starting from your location' : 'Start from my location'}
              </button>
              {geo.error && <p className="text-xs text-red-600">{geo.error}</p>}
              {/* Picked chips */}
              <div className="flex min-h-[32px] flex-wrap gap-1.5">
                <AnimatePresence>
                  {picked.map((p) => (
                    <motion.button
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      onClick={() => toggle(p)}
                      className="chip bg-slate-900 text-white ring-slate-900"
                    >
                      {CATEGORY_META[p.category].emoji} {p.name.length > 16 ? `${p.name.slice(0, 15)}…` : p.name} <X size={12} />
                    </motion.button>
                  ))}
                </AnimatePresence>
                {!picked.length && <span className="text-xs text-slate-400">Pick 2 to {MAX} places below.</span>}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {error && <ErrorNote message={error} />}
              {loading && <p className="p-4 text-sm text-slate-500">Loading places…</p>}
              {!loading && !open.length && <p className="p-4 text-sm text-slate-500">No open places yet.</p>}
              {open.map((p) => {
                const on = picked.some((x) => x.id === p.id);
                return (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggle(p)}
                    className={`mb-1 flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${on ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50'}`}
                  >
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ring-1 transition ${on ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white ring-slate-300'}`}>
                      {on && <Check size={14} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{p.name}</span>
                      <span className="block truncate text-xs text-slate-500">{CATEGORY_META[p.category].label}</span>
                    </span>
                    <WaitBadge minutes={placeWaitMinutes(p)} />
                  </motion.button>
                );
              })}
            </div>
            <div className="border-t border-slate-100 p-4">
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="btn-primary w-full py-3.5 text-base"
                disabled={picked.length < 2 || thinking}
                onClick={run}
              >
                <Wand2 size={18} /> Plan my day
              </motion.button>
            </div>
          </div>

          {/* Result */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              {thinking ? (
                <Thinking key="thinking" total={fact(picked.length)} />
              ) : result ? (
                <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                      { label: 'All done in', value: formatMinutes(result.best.totalMin), sub: `by ${at(result.best.totalMin)}`, icon: Hourglass },
                      { label: 'Saved vs walking in', value: formatMinutes(savedVsWalkIn), sub: 'by overlapping travel + queue', icon: TrendingDown },
                      { label: 'Better than your order', value: formatMinutes(savedVsPicked), sub: `${result.checked.toLocaleString()} routes tested`, icon: Sparkles },
                      { label: 'Standing in lines', value: formatMinutes(result.best.standingMin), sub: `${formatMinutes(result.best.travelMin)} travelling`, icon: Footprints },
                    ].map((s, i) => (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 14, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: i * 0.08 }}
                        className={`rounded-2xl p-4 ring-1 ${i === 1 ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white ring-slate-200/70 shadow-soft'}`}
                      >
                        <s.icon size={18} className={i === 1 ? 'text-brand-100' : 'text-brand-600'} />
                        <p className={`mt-2 text-xs font-semibold ${i === 1 ? 'text-brand-100' : 'text-slate-500'}`}>{s.label}</p>
                        <p className="text-2xl font-extrabold">{s.value}</p>
                        <p className={`text-[11px] ${i === 1 ? 'text-brand-100' : 'text-slate-400'}`}>{s.sub}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
                    <div className="card p-5">
                      <p className="font-extrabold">Your best route</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sky-400" /> travel</span>
                        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sun-400" /> standing</span>
                        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-brand-500" /> being served</span>
                      </div>
                      <ol className="relative mt-4 space-y-4 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-0.5 before:bg-slate-200">
                        {result.best.legs.map((l, i) => (
                          <motion.li
                            key={l.place.id}
                            initial={{ opacity: 0, x: -14 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 + i * 0.12 }}
                            className="relative flex gap-3"
                          >
                            <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-extrabold text-white ring-4 ring-white">
                              {i + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="truncate font-bold">
                                  {CATEGORY_META[l.place.category].emoji} {l.place.name}
                                </p>
                                <Link to={`/q/${l.place.id}`} className="btn-soft shrink-0 px-2.5 py-1 text-xs">
                                  Join
                                </Link>
                              </div>
                              <p className="text-xs text-slate-500">
                                Leave {at(l.leaveAt)} · {l.travelMin} min there · stand {l.waitOnSiteMin} min · done {at(l.doneAt)}
                              </p>
                              <LegBar travel={l.travelMin} standing={l.waitOnSiteMin} service={l.serviceMin} scale={scale} />
                            </div>
                          </motion.li>
                        ))}
                      </ol>
                    </div>
                    <div className="card relative min-h-[380px] overflow-hidden">
                      <MapView places={result.best.legs.map((l) => l.place)} order={order} route={route} me={geo.pos} />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card grid min-h-[420px] place-items-center p-10 text-center">
                  <div>
                    <svg viewBox="0 0 220 120" className="mx-auto w-64">
                      <motion.path
                        d="M20 90 C 60 20, 100 120, 140 50 S 200 30, 200 30"
                        stroke="#0a8576"
                        strokeWidth="4"
                        strokeDasharray="8 8"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 0 }}
                        animate={{ strokeDashoffset: -32 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      />
                      {[
                        [20, 90],
                        [140, 50],
                        [200, 30],
                      ].map(([x, y], i) => (
                        <g key={i}>
                          <circle cx={x} cy={y} r="11" fill={i === 2 ? '#fbab30' : '#0f172a'} />
                          <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="white">
                            {i + 1}
                          </text>
                        </g>
                      ))}
                    </svg>
                    <p className="mt-4 text-xl font-extrabold">Your day, in the smartest order.</p>
                    <p className="mt-1 text-sm text-slate-500">Pick at least two places, then tap “Plan my day”.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
