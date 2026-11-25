import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPinned, Ticket } from 'lucide-react';
import Aurora from '../components/Aurora';
import { Skeleton } from '../components/States';
import { usePlace, useTickets } from '../lib/hooks';
import { formatMinutes, ticketPosition } from '../lib/predict';
import { allRememberedTickets } from '../lib/queue';
import { CATEGORY_META } from '../lib/types';

function TokenCard({ placeId, ticketId, i }: { placeId: string; ticketId: string; i: number }) {
  const { place } = usePlace(placeId);
  const { tickets, loading } = useTickets(placeId);
  const ticket = tickets.find((t) => t.id === ticketId);
  if (loading || !place) return <Skeleton className="h-40" />;
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
    <motion.div initial={{ opacity: 0, y: 16, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}>
      <Link
        to={`/t/${placeId}/${ticketId}`}
        className={`relative block overflow-hidden rounded-3xl p-5 text-white shadow-lift ${ended ? 'bg-slate-400' : 'bg-gradient-to-br from-brand-600 to-brand-800'}`}
      >
        {/* Ticket notches */}
        <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-50" />
        <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-50" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand-100">
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

export default function MyTokens() {
  const mine = allRememberedTickets();
  return (
    <div className="relative isolate min-h-[70vh]">
      <Aurora />
      <div className="container-x py-10">
        <h1 className="text-4xl font-extrabold tracking-tight">My tokens</h1>
        <p className="mt-1 text-slate-500">Every queue you're in today, live.</p>
        {mine.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card mt-8 grid place-items-center p-12 text-center">
            <motion.span animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 2.4, repeat: Infinity }} className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Ticket size={30} />
            </motion.span>
            <h2 className="mt-4 text-xl font-bold">No tokens yet today</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">Find a place on the map and join its queue. Your tokens will show up here.</p>
            <Link to="/explore" className="btn-primary mt-6">
              <MapPinned size={16} /> Explore the map
            </Link>
          </motion.div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((m, i) => (
              <TokenCard key={m.ticketId} placeId={m.placeId} ticketId={m.ticketId} i={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
