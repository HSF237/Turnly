import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Crosshair, MapPinned, Search, Sparkles, Store, Wand2 } from 'lucide-react';
import CategoryArt from '../components/CategoryArt';
import CityPulse from '../components/CityPulse';
import Footer from '../components/Footer';
import PlaceCard from '../components/PlaceCard';
import SplitFlap from '../components/SplitFlap';
import TokenCard from '../components/TokenCard';
import { Skeleton } from '../components/States';
import { useAuth, useGeolocation, usePlaces } from '../lib/hooks';
import { placeWaitMinutes } from '../lib/predict';
import { allRememberedTickets } from '../lib/queue';
import { distanceM, todayKey } from '../lib/time';
import { CATEGORY_META, type Category } from '../lib/types';

const CATS: Category[] = ['bank', 'clinic', 'pharmacy', 'government', 'barber', 'shop', 'restaurant', 'service', 'school'];
const SHORT: Partial<Record<Category, string>> = {
  bank: 'Banks',
  clinic: 'Clinics',
  pharmacy: 'Pharmacy',
  government: 'Offices',
  barber: 'Barbers',
  shop: 'Shops',
  restaurant: 'Cafés',
  service: 'Repairs',
  school: 'Schools',
};
const SUGGEST = ['a bank', 'the passport office', 'a barber', 'a pharmacy', 'the clinic', 'a service centre'];
const FLOATERS = [
  { n: 12, x: '8%', y: '22%', d: 6 },
  { n: 27, x: '84%', y: '18%', d: 7 },
  { n: 5, x: '72%', y: '62%', d: 5.5 },
  { n: 41, x: '92%', y: '48%', d: 8 },
  { n: 18, x: '3%', y: '70%', d: 6.5 },
];

function useCycle(n: number, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % n), ms);
    return () => clearInterval(id);
  }, [n, ms]);
  return i;
}

function SectionTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        {sub && <p className="text-sm text-slate-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Carousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  return (
    <div className="relative">
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-1 sm:-mx-6 sm:px-6">
        {children}
      </div>
      <div className="pointer-events-none absolute -top-14 right-0 hidden gap-2 md:flex">
        <button className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-white shadow-soft ring-1 ring-slate-200 hover:bg-slate-50" onClick={() => scroll(-1)} aria-label="Scroll left">
          <ChevronLeft size={18} />
        </button>
        <button className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-white shadow-soft ring-1 ring-slate-200 hover:bg-slate-50" onClick={() => scroll(1)} aria-label="Scroll right">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isMember } = useAuth();
  const { places, loading } = usePlaces();
  const geo = useGeolocation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [sortNear, setSortNear] = useState(false);
  const suggestion = useCycle(SUGGEST.length, 2400);
  const flapN = useCycle(100, 2600);
  const mine = allRememberedTickets();
  const today = todayKey();

  const open = places.filter((p) => p.isOpen);
  const waitingNow = open.reduce((s, p) => s + (p.dayKey === today ? p.waiting : 0), 0);
  const list = useMemo(() => {
    const items = open.map((p) => ({ p, min: placeWaitMinutes(p) ?? 999, dist: geo.pos ? distanceM(geo.pos, p) : null }));
    items.sort((a, b) => (sortNear && a.dist !== null && b.dist !== null ? a.dist - b.dist : a.min - b.min));
    return items;
  }, [open, geo.pos, sortNear]);

  const hour = new Date().getHours();
  const greet = hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const first = isMember ? user?.displayName?.split(' ')[0] : null;

  return (
    <div className="overflow-x-clip">
      {/* ── Hero header ── */}
      <section className="relative isolate overflow-hidden rounded-b-[2.5rem] bg-slate-950 pb-24 pt-8 text-white sm:pb-28 sm:pt-14">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-600/40 blur-[110px] animate-aurora" />
        <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-sun-500/20 blur-[100px] animate-aurora2" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:36px_36px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
        {/* Floating tokens */}
        {FLOATERS.map((f, i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute hidden rounded-xl bg-white/[0.07] px-2.5 py-1.5 text-sm font-extrabold text-white/40 ring-1 ring-white/10 backdrop-blur sm:block"
            style={{ left: f.x, top: f.y }}
            animate={{ y: [0, -16, 0], rotate: [0, i % 2 ? 6 : -6, 0] }}
            transition={{ duration: f.d, repeat: Infinity, ease: 'easeInOut' }}
          >
            #{f.n}
          </motion.span>
        ))}

        <div className="container-x relative">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-300">
              {greet}
              {first ? `, ${first}` : ''} 👋
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-brand-200 ring-1 ring-white/10">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
              </span>
              {open.length} {open.length === 1 ? 'place' : 'places'} live{waitingNow ? ` · ${waitingNow} waiting from anywhere` : ''}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="mt-4 max-w-3xl text-[2.5rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl"
          >
            Skip every line.
            <br />
            <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-sun-300 bg-clip-text text-transparent">Wait anywhere.</span>
          </motion.h1>

          {/* Search */}
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.6 }}
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/explore${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
            }}
            className="group relative mt-7 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-2 pl-4 text-slate-900 shadow-[0_20px_60px_-20px_rgba(14,165,143,.6)] ring-4 ring-white/10 transition focus-within:ring-brand-400/40"
          >
            <Search size={20} className="shrink-0 text-slate-400" />
            <div className="relative flex-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-transparent py-2.5 text-base font-medium outline-none"
                aria-label="Search places"
              />
              {!q && (
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-base text-slate-400">
                  Find&nbsp;
                  <AnimatePresence mode="wait">
                    <motion.span key={suggestion} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                      {SUGGEST[suggestion]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={async () => {
                const p = await geo.request();
                if (p) setSortNear(true);
              }}
              className="hidden items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 sm:flex"
            >
              <Crosshair size={16} /> Near me
            </button>
            <button className="btn-primary px-4 py-3">
              <span className="hidden sm:inline">Search</span>
              <ArrowRight size={18} className="sm:hidden" />
            </button>
          </motion.form>
        </div>
      </section>

      <div className="container-x relative -mt-16 space-y-10 pb-12 sm:-mt-20">
        {/* ── Categories ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-3xl bg-white p-4 shadow-lift ring-1 ring-slate-200/70 sm:p-5">
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 sm:grid sm:grid-cols-9 sm:overflow-visible">
            {CATS.map((c, i) => (
              <motion.div key={c} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.04 }} className="shrink-0">
                <Link to={`/explore?cat=${c}`} className="group flex w-[4.75rem] flex-col items-center gap-1.5 sm:w-auto">
                  <span className="block h-[4.25rem] w-[4.25rem] overflow-hidden rounded-2xl ring-1 ring-black/5 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lift sm:h-20 sm:w-20">
                    <CategoryArt category={c} className="h-full w-full scale-[1.35] transition duration-500 group-hover:scale-[1.5]" />
                  </span>
                  <span className="max-w-full truncate text-[11px] font-bold text-slate-700 sm:text-xs">{SHORT[c] ?? CATEGORY_META[c].label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── My tokens ── */}
        {mine.length > 0 && (
          <section>
            <SectionTitle
              title="Your tokens"
              sub="Live. We'll buzz you when it's your turn."
              action={
                <Link to="/me" className="text-sm font-bold text-brand-700">
                  See all
                </Link>
              }
            />
            <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
              {mine.map((m, i) => (
                <TokenCard key={m.ticketId} placeId={m.placeId} ticketId={m.ticketId} i={i} compact />
              ))}
            </div>
          </section>
        )}

        {/* ── Places ── */}
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{sortNear ? 'Closest to you' : 'Shortest waits right now'}</h2>
              <p className="text-sm text-slate-500">Tap a place to join its line from here.</p>
            </div>
            <div className="mr-0 inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold md:mr-24">
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
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-56 w-[16.5rem] shrink-0 rounded-3xl" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-4 overflow-hidden rounded-3xl bg-white p-8 text-center ring-1 ring-slate-200/70 sm:flex-row sm:text-left">
              <div className="h-28 w-44 shrink-0 overflow-hidden rounded-2xl">
                <CategoryArt category="shop" className="h-full w-full" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-extrabold">No places open nearby yet</p>
                <p className="text-sm text-slate-500">Own a shop, office or clinic? Put it on Turnly in two minutes.</p>
              </div>
              <Link to="/business/new" className="btn-primary">
                Add a place
              </Link>
            </div>
          ) : (
            <Carousel>
              {list.map(({ p, dist }, i) => (
                <PlaceCard key={p.id} place={p} distance={dist} i={i} />
              ))}
            </Carousel>
          )}
        </section>

        {/* ── Feature banners ── */}
        <section className="grid gap-4 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -4 }}>
            <Link to="/plan" className="group relative block h-full min-h-[15rem] overflow-hidden rounded-3xl bg-gradient-to-br from-sun-400 via-orange-400 to-orange-600 p-6 text-slate-900 shadow-soft">
              <svg viewBox="0 0 300 160" className="absolute -bottom-6 -right-4 w-[62%] opacity-90 sm:-bottom-2 sm:right-0 sm:w-[66%]">
                <motion.path
                  d="M20 130 C 80 40, 140 150, 190 80 S 270 30, 285 40"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray="14 12"
                  animate={{ strokeDashoffset: [0, -52] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                />
                {[
                  [20, 130],
                  [190, 80],
                  [285, 40],
                ].map(([x, y], k) => (
                  <g key={k}>
                    <circle cx={x} cy={y} r="15" fill="#0f172a" />
                    <text x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="white">
                      {k + 1}
                    </text>
                  </g>
                ))}
              </svg>
              <span className="chip bg-white/40 text-slate-900 ring-white/50">
                <Wand2 size={12} /> Route planner
              </span>
              <h3 className="mt-3 max-w-[16rem] text-2xl font-extrabold leading-tight">Plan my day in the fastest order</h3>
              <p className="mt-1 max-w-[13rem] text-sm font-medium text-slate-800">Bank, barber, post office? Turnly tests every order for you.</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold">
                Plan now <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }} whileHover={{ y: -4 }}>
            <Link to="/explore" className="group relative block h-full min-h-[15rem] overflow-hidden rounded-3xl shadow-soft">
              <div className="absolute inset-0">
                <CityPulse className="h-full w-full rounded-3xl" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent" />
              <div className="relative p-6 text-white">
                <span className="chip bg-white/10 text-brand-200 ring-white/15">
                  <MapPinned size={12} /> Live map
                </span>
                <h3 className="mt-3 max-w-[15rem] text-2xl font-extrabold leading-tight">The whole city's waiting, live</h3>
                <p className="mt-1 max-w-[14rem] text-sm text-slate-300">Green is quiet. Red is packed. Go where it's green.</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-brand-200">
                  Open map <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </motion.div>
        </section>

        {/* ── Business ── */}
        <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 p-6 text-white sm:p-10">
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
            <div>
              <span className="chip bg-white/10 text-brand-100 ring-white/15">
                <Store size={12} /> For business
              </span>
              <h3 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">Run your queue from one phone.</h3>
              <p className="mt-2 max-w-md text-brand-100">A QR code for the door, a “Next” button for staff, and a TV board that calls tokens out loud. Free to start.</p>
              <Link to="/business" className="btn mt-5 bg-white px-5 py-3 text-brand-800 hover:bg-brand-50">
                Set up my queue <ArrowRight size={16} />
              </Link>
            </div>
            <div className="mx-auto w-full max-w-xs rounded-3xl bg-slate-950 p-6 text-center ring-1 ring-white/10">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Now serving</p>
              <SplitFlap value={(flapN % 90) + 10} digits={2} tone="dark" className="mt-3 text-7xl" />
              <p className="mt-3 text-sm font-bold text-brand-300">→ Counter 2</p>
            </div>
          </div>
        </motion.section>

        {/* ── About link ── */}
        <Link to="/about" className="group flex items-center justify-between gap-4 rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 transition hover:shadow-lift">
          <span className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Sparkles size={22} />
            </span>
            <span>
              <span className="block font-extrabold">New to Turnly?</span>
              <span className="block text-sm text-slate-500">See how it works, and try the live demo queue.</span>
            </span>
          </span>
          <ArrowRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-600" />
        </Link>
      </div>
      <Footer />
    </div>
  );
}
