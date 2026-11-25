import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Users } from 'lucide-react';
import { isOnTime } from '../lib/speed';
import CategoryArt from './CategoryArt';
import WaitBadge from './WaitBadge';
import { placeWaitMinutes } from '../lib/predict';
import { todayKey } from '../lib/time';
import { CATEGORY_META, type Place } from '../lib/types';

export function formatDistance(m: number | null) {
  if (m === null) return null;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

/** Big illustrated card for carousels. */
export default function PlaceCard({ place, distance = null, i = 0, wide = false }: { place: Place; distance?: number | null; i?: number; wide?: boolean }) {
  const min = placeWaitMinutes(place);
  const waiting = place.dayKey === todayKey() && place.isOpen ? place.waiting : 0;
  const dist = formatDistance(distance);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(i, 6) * 0.06, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      className={`shrink-0 snap-start ${wide ? 'w-full' : 'w-[16.5rem]'}`}
    >
      <Link to={`/q/${place.id}`} className="group block overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-slate-200/70 transition-shadow hover:shadow-lift">
        <div className="relative h-36 overflow-hidden">
          <CategoryArt category={place.category} className="h-full w-full transition duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
          <span className="absolute left-3 top-3">
            <WaitBadge minutes={min} />
          </span>
          {isOnTime(place) && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-extrabold text-brand-700 shadow-soft">
              <BadgeCheck size={13} /> On time
            </span>
          )}
          <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-slate-900/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
            <Users size={12} /> {waiting} in line
            <span className="ml-0.5 flex gap-0.5">
              {Array.from({ length: Math.min(waiting, 5) }, (_, k) => (
                <motion.i key={k} className="block h-1.5 w-1.5 rounded-full bg-sun-300" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: k * 0.15 }} />
              ))}
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate font-extrabold text-slate-900">{place.name}</p>
            <p className="truncate text-xs font-medium text-slate-500">
              {CATEGORY_META[place.category].label}
              {dist && ` · ${dist}`}
            </p>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
            <ArrowRight size={16} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
