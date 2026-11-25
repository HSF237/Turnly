import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Clock3, Crosshair, MapPinned, Route, Search, Sparkles, Store, Users } from 'lucide-react';
import CategoryArt from '../components/CategoryArt';
import CityGlance from '../components/CityGlance';
import CityPicker from '../components/CityPicker';
import CommunityCard from '../components/CommunityCard';
import Footer from '../components/Footer';
import LiveFeed from '../components/LiveFeed';
import MapView from '../components/MapView';
import PlaceCard from '../components/PlaceCard';
import { Skeleton } from '../components/States';
import { useAuth, useCommunity, useGeolocation, usePlaces } from '../lib/hooks';
import { formatMinutes, placeWaitMinutes } from '../lib/predict';
import { CITIES, getCity, sampleBranchId } from '../lib/sim';
import { distanceM, todayKey } from '../lib/time';
import { CATEGORY_META, type Category } from '../lib/types';
import { ART } from '../lib/art';

const CATS: Category[] = ['bank', 'clinic', 'pharmacy', 'government', 'barber', 'shop', 'restaurant', 'service', 'school'];
const SHORT: Partial<Record<Category, string>> = {
  bank: 'Banks', clinic: 'Clinics', pharmacy: 'Pharmacy', government: 'Offices', barber: 'Barbers',
  shop: 'Shops', restaurant: 'Cafés', service: 'Repairs', school: 'Schools',
};

/** A background picture that quietly disappears if the file isn't there yet. */
function Art({ src, className }: { src: string; className?: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return <img src={src} alt="" aria-hidden="true" onError={() => setOk(false)} className={className} />;
}

/** Home for laptops and desktops: a hero banner, then a dashboard of the city. */
export default function HomeDesktop() {
  const { user, isMember } = useAuth();
  const { places, loading } = usePlaces();
  const { places: community } = useCommunity();
  const geo = useGeolocation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [sortNear, setSortNear] = useState(false);
  const city = CITIES[getCity()];
  const today = todayKey();

  const open = places.filter((p) => p.isOpen);
  const here = open.filter((p) => distanceM(city.center, p) < 40000);
  const waitingNow = here.reduce((s, p) => s + (p.dayKey === today ? p.waiting : 0), 0);
  const avg = here.length ? Math.round(here.reduce((s, p) => s + (placeWaitMinutes(p) ?? 0), 0) / here.length) : 0;
  const list = useMemo(() => {
    const items = open.map((p) => ({ p, min: placeWaitMinutes(p) ?? 999, dist: geo.pos ? distanceM(geo.pos, p) : null }));
    items.sort((a, b) => (sortNear && a.dist !== null && b.dist !== null ? a.dist - b.dist : a.min - b.min));
    return items;
  }, [open, geo.pos, sortNear]);
  const nearbyCommunity = community.filter((c) => distanceM(city.center, c) < 40000).slice(0, 4);

  const hour = new Date().getHours();
  const greet = hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const first = isMember ? user?.displayName?.split(' ')[0] : null;

  return (
    <div className="overflow-x-clip">
      <div className="mx-auto max-w-[1360px] space-y-6 px-8 pb-10 pt-6">
        {/* ── Hero banner ── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative isolate overflow-hidden rounded-[2rem] bg-[#060b18] text-white shadow-lift"
        >
          <div className="pointer-events-none absolute -left-24 -top-32 -z-10 h-[30rem] w-[30rem] rounded-full bg-brand-600/35 blur-[110px] animate-aurora" />
          <div className="pointer-events-none absolute bottom-0 right-20 -z-10 h-80 w-80 rounded-full bg-sun-500/20 blur-[100px] animate-aurora2" />
          <motion.div
            className="absolute inset-0 -z-10"
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Art src={ART.hero} className="h-full w-full object-cover object-right" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#060b18] via-[#060b18]/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#060b18]/70 to-transparent" />
          </motion.div>

          <div className="relative max-w-[40rem] px-12 pb-12 pt-11">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-300">
                {greet}
                {first ? `, ${first}` : ''} 👋
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-brand-200 ring-1 ring-white/10 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
                </span>
                Live in {city.name}
              </span>
            </div>
            <h1 className="mt-5 text-[4.25rem] font-extrabold leading-[0.98] tracking-[-0.04em]">
              Skip every line.
              <br />
              <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-sun-300 bg-clip-text pb-1 text-transparent">Wait anywhere.</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-slate-300">See how long every queue is right now, join from here, and get called when it's your turn.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/explore${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
              }}
              className="mt-7 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 pl-4 text-slate-900 shadow-[0_20px_60px_-20px_rgba(14,165,143,.6)] ring-4 ring-white/10 focus-within:ring-brand-400/40"
            >
              <Search size={20} className="shrink-0 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search a bank, clinic, barber…"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-base font-medium outline-none placeholder:text-slate-400"
                aria-label="Search places"
              />
              <button
                type="button"
                onClick={async () => {
                  const p = await geo.request();
                  if (p) setSortNear(true);
                }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
              >
                <Crosshair size={16} /> Near me
              </button>
              <button className="btn-primary px-5 py-3">Search</button>
            </form>

            <div className="mt-8 flex gap-3">
              {[
                { icon: MapPinned, v: String(here.length), k: 'places live' },
                { icon: Users, v: String(waitingNow), k: 'waiting from anywhere' },
                { icon: Clock3, v: formatMinutes(avg), k: 'average wait' },
              ].map(({ icon: Icon, v, k }, i) => (
                <motion.div
                  key={k}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.08 }}
                  className="flex items-center gap-3 rounded-2xl bg-white/[0.07] px-4 py-3 ring-1 ring-white/10 backdrop-blur-md"
                >
                  <Icon size={18} className="text-brand-300" />
                  <div>
                    <p className="text-xl font-extrabold leading-none tabular-nums">{v}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">{k}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="absolute right-6 top-6">
            <CityPicker compact dark />
          </div>
        </motion.section>

        {/* ── Categories ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-9 gap-3 rounded-[1.75rem] bg-white p-3 shadow-soft ring-1 ring-slate-200/70"
        >
          {CATS.map((c, i) => (
            <motion.div key={c} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.03 }}>
              <Link to={`/explore?cat=${c}`} className="group block overflow-hidden rounded-2xl ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-lift">
                <span className="block h-20 overflow-hidden">
                  <CategoryArt category={c} className="h-full w-full transition duration-500 group-hover:scale-110" />
                </span>
                <span className="block truncate px-2 py-2 text-center text-xs font-bold text-slate-700">{SHORT[c] ?? CATEGORY_META[c].label}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Dashboard ── */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-6">
            <section className="rounded-[1.75rem] bg-white p-6 shadow-soft ring-1 ring-slate-200/70">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">{sortNear ? 'Closest to you' : 'Shortest waits right now'}</h2>
                  <p className="text-sm text-slate-500">Click a place to join its line from here.</p>
                </div>
                <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                  <button className={`rounded-lg px-3 py-1.5 ${!sortNear ? 'bg-white shadow-sm' : 'text-slate-500'}`} onClick={() => setSortNear(false)}>
                    Shortest wait
                  </button>
                  <button
                    className={`rounded-lg px-3 py-1.5 ${sortNear ? 'bg-white shadow-sm' : 'text-slate-500'}`}
                    onClick={async () => {
                      if (!geo.pos && !(await geo.request())) return;
                      setSortNear(true);
                    }}
                  >
                    Nearest
                  </button>
                </div>
              </div>
              {loading && !list.length ? (
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-56 rounded-3xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <AnimatePresence initial={false}>
                    {list.slice(0, 6).map(({ p, dist }, i) => (
                      <motion.div key={p.id} layout transition={{ type: 'spring', stiffness: 300, damping: 32 }}>
                        <PlaceCard place={p} distance={dist} i={i} wide />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              <Link to="/explore" className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-slate-50 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
                See all {open.length} places on the map <ArrowRight size={16} />
              </Link>
            </section>

            <div className="grid grid-cols-2 gap-6">
              <CityGlance places={open} />
              <Link
                to="/plan"
                className="group relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-sun-300 via-sun-400 to-orange-500 p-6 text-slate-900 shadow-lift"
              >
                <span className="chip w-fit bg-white/40 text-slate-900 ring-white/50">
                  <Route size={12} /> Route planner
                </span>
                <h3 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight">Plan my day in the fastest order</h3>
                <p className="mt-2 max-w-xs text-sm font-medium text-slate-800">Bank, barber, post office? Turnly tests every order against live queues and joins the next line while you travel.</p>
                <svg viewBox="0 0 300 120" className="mt-auto h-28 w-full" aria-hidden="true">
                  <motion.path
                    d="M20 100 C 80 100, 90 40, 150 55 S 240 20, 280 25"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray="10 12"
                    animate={{ strokeDashoffset: [0, -44] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                  />
                  {[
                    [20, 100, 1],
                    [150, 55, 2],
                    [280, 25, 3],
                  ].map(([x, y, n]) => (
                    <g key={n}>
                      <circle cx={x} cy={y} r="16" fill="#0f172a" />
                      <text x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">
                        {n}
                      </text>
                    </g>
                  ))}
                </svg>
                <span className="mt-2 flex items-center gap-1 text-sm font-extrabold">
                  Plan now <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </span>
              </Link>
            </div>

            {nearbyCommunity.length > 0 && (
              <section className="rounded-[1.75rem] bg-white p-6 shadow-soft ring-1 ring-slate-200/70">
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">Reported by people nearby</h2>
                    <p className="text-sm text-slate-500">Places not on Turnly yet, kept live by people standing in line.</p>
                  </div>
                  <Link to="/explore" className="text-sm font-bold text-brand-700">
                    + Add a place
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {nearbyCommunity.map((c, i) => (
                    <CommunityCard key={c.id} place={c} i={i} wide />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="col-span-4 space-y-6">
            {/* Live mini map */}
            <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-soft ring-1 ring-slate-200/70">
              <div className="flex items-center justify-between px-5 pb-3 pt-4">
                <div>
                  <p className="font-extrabold">Live map</p>
                  <p className="text-xs text-slate-500">{city.name} · updates as queues move</p>
                </div>
                <Link to="/explore" className="flex items-center gap-1 text-sm font-bold text-brand-700">
                  Open <ArrowRight size={14} />
                </Link>
              </div>
              <div className="relative h-72">
                <MapView places={open} community={community} frameNear={city.center} onSelect={(p) => navigate(`/q/${p.id}`)} className="h-full w-full" />
              </div>
            </div>
            <LiveFeed max={7} />
          </aside>
        </div>

        {/* ── For business ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 to-[#06121f] text-white shadow-lift"
        >
          <div className="absolute inset-0 -z-10">
            <Art src={ART.business} className="h-full w-full object-cover object-right" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#06231f] via-[#06231f]/85 to-transparent" />
          </div>
          <div className="max-w-xl px-12 py-12">
            <span className="chip bg-white/15 text-white ring-white/20">
              <Store size={12} /> For business
            </span>
            <h2 className="mt-4 text-5xl font-extrabold leading-[1.02] tracking-tight">Run your queue from one screen.</h2>
            <p className="mt-3 text-lg text-brand-100">A QR code for the door, one tap to call the next person, and a TV board that calls tokens out loud. Free to start.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/business" className="btn bg-white px-5 py-3 text-brand-800 hover:bg-brand-50">
                Set up my queue <ArrowRight size={16} />
              </Link>
              <Link to={`/business/${sampleBranchId()}`} className="btn bg-white/10 px-5 py-3 text-white ring-1 ring-white/25 hover:bg-white/15">
                <Sparkles size={16} /> Try the staff console
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
      <Footer />
    </div>
  );
}
