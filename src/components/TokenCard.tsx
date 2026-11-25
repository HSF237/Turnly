import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from './States';
import { usePlace, useTickets } from '../lib/hooks';
import { formatMinutes, ticketPosition } from '../lib/predict';
import { CATEGORY_META } from '../lib/types';

/** A live ticket-shaped card for one of my tokens. */
export default function TokenCard({ placeId, ticketId, i = 0, compact = false }: { placeId: string; ticketId: string; i?: number; compact?: boolean }) {
  const { place } = usePlace(placeId);
  const { tickets, loading } = useTickets(placeId);
  const ticket = tickets.find((t) => t.id === ticketId);
  if (loading || !place) return <Skeleton className={compact ? 'h-32 w-72 shrink-0' : 'h-40'} />;
  if (!ticket) return null;
  const pos = ticketPosition(ticket, tickets, place);
  const status =
    ticket.status === 'called'
      ? { text: `Your turn! Counter ${ticket.counter}`, cls: 'bg-sun-400 text-slate-900' }
      : ticket.status === 'waiting'
        ? { text: pos.ahead === 0 ? "You're next" : `${pos.ahead} ahead · ~${formatMinutes(pos.etaMin)}`, cls: 'bg-white/15 text-white' }
        : { text: ticket.status === 'done' ? 'Done' : ticket.status === 'left' ? 'Left' : 'Skipped', cls: 'bg-white/10 text-brand-100' };
  const ended = ['done', 'left', 'skipped'].includes(ticket.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ delay: i * 0.08 }}
      whileHover={{ y: -4 }}
      className={compact ? 'w-72 shrink-0 snap-start' : ''}
    >
      <Link
        to={`/t/${placeId}/${ticketId}`}
        className={`relative block overflow-hidden rounded-3xl p-5 text-white shadow-lift ${
          ended ? 'bg-slate-400' : ticket.status === 'called' ? 'bg-gradient-to-br from-sun-500 to-orange-600' : 'bg-gradient-to-br from-brand-600 to-brand-800'
        }`}
      >
        <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-50" />
        <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-50" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white/75">
              {CATEGORY_META[place.category].emoji} {CATEGORY_META[place.category].label}
            </p>
            <p className="truncate text-lg font-extrabold">{place.name}</p>
          </div>
          <p className="text-5xl font-extrabold leading-none">{ticket.number}</p>
        </div>
        <div className="my-4 border-t border-dashed border-white/30" />
        <div className="flex items-center justify-between">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.cls}`}>{status.text}</span>
          <ArrowRight size={18} />
        </div>
      </Link>
    </motion.div>
  );
}
