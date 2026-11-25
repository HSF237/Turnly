import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BellRing, Crosshair, Footprints, Search, Sparkles, Ticket } from 'lucide-react';
import CategoryArt from '../components/CategoryArt';
import CityPicker from '../components/CityPicker';
import Logo from '../components/Logo';
import { useGeolocation, usePlaces } from '../lib/hooks';
import { formatMinutes, LEVEL_STYLE, placeWaitMinutes, waitLevel } from '../lib/predict';
import { CITIES, getCity, sampleBranchId } from '../lib/sim';
import { distanceM, todayKey } from '../lib/time';
import { CATEGORY_META, type Category, type Place } from '../lib/types';
import { ART } from '../lib/art';

const CATS: Category[] = ['bank', 'clinic', 'pharmacy', 'government', 'barber', 'shop', 'restaurant', 'service'];
const SHORT: Partial<Record<Category, string>> = {
  bank: 'Banks', clinic: 'Clinics', pharmacy: 'Pharmacies', government: 'Offices', barber: 'Barbers',
  shop: 'Shops', restaurant: 'Cafés', service: 'Repairs',
};
const ease = [0.2, 0.8, 0.2, 1] as const;

/** A picture that quietly falls back when its file isn't there yet. */
function Art({ src, className, fallback = null }: { src: string; className?: string; fallback?: React.ReactNode }) {
  const [ok, setOk] = useState(true);
  if (!ok) return <>{fallback}</>;
  return <img src={src} alt="" aria-hidden="true" onError={() => setOk(false)} className={className} />;
}

/** Hero picture: the 3D city, with a few live chips floating over it. */
function HeroVisual({ chips }: { chips: { p: Place; min: number }[] }) {
  const fallback = (
    <div className="grid h-full w-full grid-cols-2 gap-5 p-8">
      {(['bank', 'restaurant', 'clinic', 'barber'] as Category[]).map((c, i) => (
        <motion.div
          key={c}
          initial={{ opacity: 0, y: 20, rotate: i % 2 ? 3 : -3 }}
          animate={{ opacity: 1, y: 0, rotate: i % 2 ? 2 : -2 }}
          transition={{ delay: 0.2 + i * 0.1, duration: 0.7, ease }}
          className="overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-30px_rgba(15,23,42,.35)] ring-1 ring-black/5"
        >
          <CategoryArt category={c} className="h-full w-full" />
        </motion.div>
      ))}
    </div>
  );
  const spots = [
    { left: '-4%', top: '16%', d: 0 },
    { left: '62%', top: '6%', d: 0.6 },
    { left: '58%', top: '74%', d: 1.2 },
  ];
  return (
    <div className="relative aspect-[4/3] w-full">
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease }} className="absolute inset-0">
        <Art src={ART.hero} className="h-full w-full object-contain" fallback={fallback} />
      </motion.div>
      {chips.slice(0, 3).map(({ p, min }, i) => {
        const hex = LEVEL_STYLE[waitLevel(min)].hex;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{ opacity: { delay: 0.6 + i * 0.15 }, y: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: spots[i].d } }}
            className="absolute"
            style={{ left: spots[i].left, top: spots[i].top }}
          >
            <Link
              to={`/q/${p.id}`}
              className="flex items-center gap-3 rounded-2xl bg-white/90 py-2.5 pl-2.5 pr-4 shadow-[0_20px_50px_-20px_rgba(15,23,42,.35)] ring-1 ring-slate-200/80 backdrop-blur-md transition hover:-translate-y-0.5"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl text-lg" style={{ background: `${hex}1f` }}>
                {CATEGORY_META[p.category].emoji}
              </span>
              <span>
                <span className="block max-w-[11rem] truncate text-sm font-bold text-slate-900">{p.name}</span>
                <span className="block text-xs font-semibold" style={{ color: hex }}>
                  {formatMinutes(min)} wait · live
                </span>
              </span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

function PlaceTile({ p, min, i }: { p: Place; min: number; i: number }) {
  const hex = LEVEL_STYLE[waitLevel(min)].hex;
  const waiting = p.dayKey === todayKey() ? p.waiting : 0;
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.6, ease }}>
      <Link to={`/q/${p.id}`} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-slate-100">
          <CategoryArt category={p.category} className="h-full w-full transition duration-700 group-hover:scale-105" />
          <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full" style={{ background: hex }} />
            {waiting} in line
          </span>
        </div>
        <div className="mt-4 flex items-start justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-slate-900">{p.name}</p>
            <p className="text-sm text-slate-500">{CATEGORY_META[p.category].label}</p>
          </div>
          <div className="text-right">
            <p className="whitespace-nowrap text-2xl font-extrabold tracking-tight" style={{ color: hex }}>
              {formatMinutes(min)}
            </p>
            <p className="text-xs font-semibold text-slate-400">wait now</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/** Home for laptops and desktops: bright, calm, a few big things. */
export default function HomeDesktop() {
  const { places } = usePlaces();
  const geo = useGeolocation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const city = CITIES[getCity()];
  const today = todayKey();

  const here = places.filter((p) => p.isOpen && distanceM(city.center, p) < 40000);
  const waitingNow = here.reduce((s, p) => s + (p.dayKey === today ? p.waiting : 0), 0);
  const ranked = useMemo(
    () =>
      here
        .map((p) => ({ p, min: placeWaitMinutes(p) ?? 999 }))
        .filter((x) => x.min < 999)
        .sort((a, b) => a.min - b.min),
    [here],
  );

  return (
    <div className="relative overflow-x-clip bg-white">
      {/* soft colour washes */}
      <div className="pointer-events-none absolute -top-40 left-[-10%] h-[36rem] w-[36rem] rounded-full bg-brand-100/60 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-8%] top-10 h-[32rem] w-[32rem] rounded-full bg-sun-100/70 blur-[120px]" />

      {/* ── Hero ── */}
      <section className="relative mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-center gap-10 px-8 pb-20 pt-16">
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
              {waitingNow} people waiting from anywhere in {city.name}
            </span>
            <CityPicker compact align="left" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.05 }}
            className="mt-7 text-[4.75rem] font-extrabold leading-[0.95] tracking-[-0.045em] text-slate-900"
          >
            Skip every line.
            <br />
            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-sun-500 bg-clip-text pb-2 text-transparent">Wait anywhere.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7, ease }} className="mt-6 max-w-lg text-xl leading-relaxed text-slate-500">
            See how long every queue is right now. Join from your phone, and get called when it's your turn.
          </motion.p>
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7, ease }}
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/explore${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
            }}
            className="mt-9 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 pl-5 shadow-[0_24px_60px_-24px_rgba(15,23,42,.25)] ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-brand-400"
          >
            <Search size={20} className="shrink-0 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a bank, clinic, barber…"
              className="min-w-0 flex-1 bg-transparent py-3 text-base font-medium outline-none placeholder:text-slate-400"
              aria-label="Search places"
            />
            <button
              type="button"
              onClick={async () => {
                if (await geo.request()) navigate('/explore');
              }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            >
              <Crosshair size={16} /> Near me
            </button>
            <button className="btn-primary rounded-xl px-6 py-3">Search</button>
          </motion.form>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6 flex flex-wrap gap-2">
            {CATS.map((c) => (
              <Link
                key={c}
                to={`/explore?cat=${c}`}
                className="rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900"
              >
                {CATEGORY_META[c].emoji} {SHORT[c]}
              </Link>
            ))}
          </motion.div>
        </div>
        <HeroVisual chips={ranked} />
      </section>

      {/* ── Shortest waits ── */}
      <section className="relative mx-auto max-w-[1240px] px-8 py-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">Right now</p>
            <h2 className="mt-2 text-5xl font-extrabold tracking-[-0.035em] text-slate-900">The shortest waits near you.</h2>
          </div>
          <Link to="/explore" className="flex shrink-0 items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700">
            Open the live map <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-4 gap-6">
          {ranked.slice(0, 4).map(({ p, min }, i) => (
            <PlaceTile key={p.id} p={p} min={min} i={i} />
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative mx-auto max-w-[1240px] px-8 py-16">
        <h2 className="text-center text-5xl font-extrabold tracking-[-0.035em] text-slate-900">Three taps. Zero standing.</h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-500">No app to install and no account to make. It works from the QR code at the door, or from right here.</p>
        <div className="mt-12 grid grid-cols-3 gap-6">
          {[
            { icon: Ticket, t: 'Join the line', d: 'Pick a place and get your token in seconds.', tint: 'from-brand-50 to-white', ic: 'bg-brand-500' },
            { icon: Footprints, t: 'Go live your day', d: 'Grab a coffee or run an errand. Your place counts down live.', tint: 'from-sky-50 to-white', ic: 'bg-sky-500' },
            { icon: BellRing, t: 'Come back on time', d: "We buzz you when it's your turn, with your counter number.", tint: 'from-sun-50 to-white', ic: 'bg-sun-500' },
          ].map(({ icon: Icon, t, d, tint, ic }, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease }}
              className={`rounded-[2rem] bg-gradient-to-b ${tint} p-8 ring-1 ring-slate-200/70`}
            >
              <span className={`grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg ${ic}`}>
                <Icon size={24} />
              </span>
              <p className="mt-6 text-sm font-bold text-slate-400">Step {i + 1}</p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{t}</p>
              <p className="mt-2 text-base text-slate-500">{d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── For business ── */}
      <section className="relative mx-auto max-w-[1240px] px-8 py-16">
        <div className="grid grid-cols-2 items-center gap-12 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-50 via-white to-sun-50 p-12 ring-1 ring-slate-200/70">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">For business</p>
            <h2 className="mt-3 text-5xl font-extrabold leading-[1.02] tracking-[-0.035em] text-slate-900">Run your queue from one screen.</h2>
            <p className="mt-5 text-lg text-slate-500">A QR code for the door, one tap to call the next person, and a TV board that calls tokens out loud. Free to start.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/business" className="btn-primary rounded-xl px-6 py-3.5">
                Set up my queue <ArrowRight size={16} />
              </Link>
              <Link to={`/business/${sampleBranchId()}`} className="btn rounded-xl bg-white px-6 py-3.5 text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">
                <Sparkles size={16} className="text-sun-500" /> Try the staff console
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3]">
            <Art
              src={ART.business}
              className="h-full w-full object-contain"
              fallback={
                <div className="grid h-full place-items-center">
                  <div className="w-full max-w-sm rounded-[2rem] bg-slate-900 p-8 text-center text-white shadow-lift">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Now serving</p>
                    <p className="mt-3 text-8xl font-extrabold tabular-nums">27</p>
                    <p className="mt-2 font-bold text-brand-300">→ Counter 2</p>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mx-auto mt-8 max-w-[1240px] border-t border-slate-200 px-8 py-10">
        <div className="flex items-center justify-between gap-6">
          <Logo />
          <nav className="flex gap-6 text-sm font-semibold text-slate-500">
            <Link to="/explore" className="hover:text-slate-900">Live map</Link>
            <Link to="/plan" className="hover:text-slate-900">Plan my errands</Link>
            <Link to="/me" className="hover:text-slate-900">My tokens</Link>
            <Link to="/business" className="hover:text-slate-900">For business</Link>
            <Link to="/about" className="hover:text-slate-900">How it works</Link>
          </nav>
        </div>
        <p className="mt-6 text-sm text-slate-400">Built by Muhammad Hasan · Kannur, Kerala</p>
      </footer>
    </div>
  );
}
