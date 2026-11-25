import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquarePlus } from 'lucide-react';
import CategoryArt from './CategoryArt';
import WaitBadge from './WaitBadge';
import { communityEstimate } from '../lib/community';
import { timeAgo } from '../lib/time';
import type { CommunityPlace } from '../lib/types';

/** Carousel card for a place kept live by community reports. */
export default function CommunityCard({ place, i = 0 }: { place: CommunityPlace; i?: number }) {
  const est = communityEstimate(place.reports ?? []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(i, 6) * 0.06 }}
      whileHover={{ y: -6 }}
      className="w-[15rem] shrink-0 snap-start"
    >
      <Link to={`/explore?c=${place.id}`} className="group block overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-slate-200/70 transition-shadow hover:shadow-lift">
        <div className="relative h-28 overflow-hidden">
          <CategoryArt category={place.category} className="h-full w-full transition duration-700 group-hover:scale-110" />
          <span className="absolute left-3 top-3">
            <WaitBadge minutes={est ? est.minutes : null} approx empty="No reports" />
          </span>
          <span className="absolute bottom-2 right-2 rounded-full bg-slate-900/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">👥 Community</span>
        </div>
        <div className="p-4">
          <p className="truncate font-extrabold">{place.name}</p>
          <p className="flex items-center gap-1 truncate text-xs text-slate-500">
            {est ? `${est.count} report${est.count === 1 ? '' : 's'} · ${timeAgo(est.latest)}` : (
              <>
                <MessageSquarePlus size={12} /> Be the first to report
              </>
            )}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
