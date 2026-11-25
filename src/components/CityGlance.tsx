import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { CITIES, getCity } from '../lib/sim';
import { formatMinutes, LEVEL_STYLE, placeWaitMinutes, waitLevel } from '../lib/predict';
import { distanceM, todayKey } from '../lib/time';
import { CATEGORY_META, type Category, type Place } from '../lib/types';

/** The city in one card: average wait, waits by kind of place, quietest and busiest. */
export default function CityGlance({ places }: { places: Place[] }) {
  const city = CITIES[getCity()];
  const today = todayKey();
  const here = places.filter((p) => p.isOpen && distanceM(city.center, p) < 40000);
  const rows = here.map((p) => ({ p, min: placeWaitMinutes(p) ?? 0 }));
  if (rows.length < 2) return null;
  const avg = Math.round(rows.reduce((s, r) => s + r.min, 0) / rows.length);
  const people = here.reduce((s, p) => s + (p.dayKey === today ? p.waiting : 0), 0);
  const byCat = new Map<Category, number[]>();
  rows.forEach((r) => byCat.set(r.p.category, [...(byCat.get(r.p.category) ?? []), r.min]));
  const cats = Array.from(byCat.entries())
    .map(([c, v]) => ({ c, min: Math.round(v.reduce((a, b) => a + b, 0) / v.length) }))
    .sort((a, b) => b.min - a.min)
    .slice(0, 5);
  const top = Math.max(10, ...cats.map((c) => c.min));
  const sorted = [...rows].sort((a, b) => a.min - b.min);
  const quiet = sorted[0];
  const busy = sorted[sorted.length - 1];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-lift sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-sun-500/15 blur-3xl" />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{city.name} right now</p>
        <div className="mt-3 flex items-end gap-6">
          <div>
            <p className="text-5xl font-extrabold leading-none tabular-nums">{formatMinutes(avg)}</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">average wait</p>
          </div>
          <div className="pb-1">
            <p className="text-2xl font-extrabold tabular-nums">{people}</p>
            <p className="text-xs font-semibold text-slate-400">waiting in {here.length} places</p>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5">
          {cats.map(({ c, min }, i) => (
            <li key={c} className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3 text-sm">
              <span className="truncate text-slate-300">
                {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.span
                  className="block h-full rounded-full"
                  style={{ background: LEVEL_STYLE[waitLevel(min)].hex }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.max(6, (min / top) * 100)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.1 + i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
                />
              </span>
              <span className="text-right font-bold tabular-nums">{formatMinutes(min)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link to={`/q/${quiet.p.id}`} className="rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10 transition hover:bg-white/10">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-brand-300">
              <TrendingDown size={13} /> Quietest
            </p>
            <p className="mt-1 truncate text-sm font-bold">{quiet.p.name}</p>
            <p className="text-xs text-slate-400">{formatMinutes(quiet.min)}</p>
          </Link>
          <Link to={`/q/${busy.p.id}`} className="rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10 transition hover:bg-white/10">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-rose-300">
              <TrendingUp size={13} /> Busiest
            </p>
            <p className="mt-1 truncate text-sm font-bold">{busy.p.name}</p>
            <p className="text-xs text-slate-400">{formatMinutes(busy.min)}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
