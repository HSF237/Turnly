import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Sparkles } from 'lucide-react';
import type { Place } from '../lib/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8am – 9pm

const label = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`;

/**
 * "Best time to come": every join is counted by weekday and hour, so each place
 * learns its own rhythm. No AI, just the place's real history.
 */
export default function BestTime({ place }: { place: Place }) {
  const today = new Date().getDay();
  const [day, setDay] = useState(today);
  const a = place.arrivals ?? {};
  const counts = HOURS.map((h) => a[`${day}-${h}`] ?? 0);
  const total = Object.values(a).reduce((s, n) => s + n, 0);
  const max = Math.max(1, ...counts);
  const nowH = new Date().getHours();
  // Quietest upcoming hour (today) or quietest hour (other days), among hours with some history.
  const candidates = HOURS.map((h, i) => ({ h, n: counts[i] })).filter((x) => (day === today ? x.h >= nowH : true));
  const best = total >= 5 && candidates.length ? candidates.reduce((m, x) => (x.n < m.n ? x : m), candidates[0]) : null;
  const learning = total < 5;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-extrabold">
            <CalendarClock size={18} className="text-brand-600" /> Best time to come
          </p>
          <p className="text-xs text-slate-500">{learning ? 'Learning this place’s busy hours from every visit…' : 'Learned from real visits to this place.'}</p>
        </div>
        {best && (
          <span className="chip shrink-0 bg-brand-50 text-brand-700 ring-brand-200">
            <Sparkles size={12} /> {label(best.h)}
          </span>
        )}
      </div>

      <div className="no-scrollbar -mx-1 mt-4 flex gap-1 overflow-x-auto px-1">
        {DAYS.map((d, i) => (
          <button
            key={d}
            onClick={() => setDay(i)}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition ${day === i ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            {i === today ? 'Today' : d}
          </button>
        ))}
      </div>

      <div className="mt-4 flex h-28 items-end gap-1">
        {HOURS.map((h, i) => {
          const isBest = best?.h === h;
          const isNow = day === today && h === nowH;
          return (
            <div key={h} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <motion.div
                key={`${day}-${h}`}
                initial={{ height: 0 }}
                animate={{ height: learning ? `${18 + ((h * 37) % 50)}%` : `${Math.max(6, (counts[i] / max) * 100)}%` }}
                transition={{ delay: i * 0.025, type: 'spring', stiffness: 140, damping: 16 }}
                className={`w-full rounded-t-md ${
                  learning ? 'bg-slate-100' : isBest ? 'bg-brand-500' : isNow ? 'bg-sun-400' : 'bg-brand-200'
                }`}
                title={`${label(h)}: ${counts[i]} arrivals`}
              />
              <span className={`text-[9px] font-bold ${isNow ? 'text-sun-600' : 'text-slate-400'}`}>{h % 3 === 2 ? label(h) : ''}</span>
            </div>
          );
        })}
      </div>
      {!learning && best && (
        <p className="mt-3 text-sm text-slate-600">
          {day === today ? 'Today, the quietest time left is' : `On ${DAYS[day]}s, it's usually quietest at`} <b>{label(best.h)}</b>.
        </p>
      )}
    </div>
  );
}
