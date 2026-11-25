import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, Megaphone, UserPlus } from 'lucide-react';
import { useSim, useTick } from '../lib/hooks';
import { CITIES, getCity, simFeed, type FeedItem } from '../lib/sim';
import { formatMinutes } from '../lib/predict';

function ago(at: number) {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m}m` : `${Math.round(m / 60)}h`;
}

const KIND = {
  call: { icon: BellRing, tint: 'bg-brand-100 text-brand-700' },
  join: { icon: UserPlus, tint: 'bg-sky-100 text-sky-700' },
  report: { icon: Megaphone, tint: 'bg-sun-100 text-sun-800' },
} as const;

function Line({ f }: { f: FeedItem }) {
  if (f.kind === 'call')
    return (
      <>
        Token <b>{f.number}</b> called to counter {f.counter}
      </>
    );
  if (f.kind === 'join')
    return (
      <>
        {f.who ?? 'Someone'} joined, token <b>{f.number}</b>
      </>
    );
  return (
    <>
      Someone in line says <b>~{formatMinutes(f.minutes ?? 0)}</b>
    </>
  );
}

/** "Happening now": a live stream of calls, joins and crowd reports around the city. */
export default function LiveFeed({ max = 6 }: { max?: number }) {
  useSim();
  useTick(5000);
  const items = simFeed().slice(0, max);
  if (!items.length) return null;
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="flex items-center gap-2 font-extrabold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
            Happening now
          </p>
          <p className="text-xs text-slate-500">Around {CITIES[getCity()].name}</p>
        </div>
        <Link to="/explore" className="text-sm font-bold text-brand-700">
          Open map
        </Link>
      </div>
      <ul className="divide-y divide-slate-100">
        <AnimatePresence initial={false}>
          {items.map((f) => {
            const K = KIND[f.kind];
            const to = f.kind === 'report' ? `/explore?c=${f.placeId}` : `/q/${f.placeId}`;
            return (
              <motion.li
                key={f.id}
                layout
                initial={{ opacity: 0, height: 0, backgroundColor: 'rgba(14,165,143,0.10)' }}
                animate={{ opacity: 1, height: 'auto', backgroundColor: 'rgba(14,165,143,0)' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1], backgroundColor: { duration: 2 } }}
              >
                <Link to={to} className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${K.tint}`}>
                    <K.icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-slate-700">
                      <Line f={f} />
                    </span>
                    <span className="block truncate text-xs font-semibold text-slate-400">{f.place}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-400">{ago(f.at)}</span>
                </Link>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
