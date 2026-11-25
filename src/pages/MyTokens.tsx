import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPinned, Ticket } from 'lucide-react';
import Aurora from '../components/Aurora';
import TokenCard from '../components/TokenCard';
import PlaceCard from '../components/PlaceCard';
import { usePlaces } from '../lib/hooks';
import { placeWaitMinutes } from '../lib/predict';
import { allRememberedTickets } from '../lib/queue';
import { useTitle } from '../lib/useTitle';

export default function MyTokens() {
  useTitle('My tokens');
  const mine = allRememberedTickets();
  const { places } = usePlaces();
  const joined = new Set(mine.map((m) => m.placeId));
  const suggest = places
    .filter((p) => p.isOpen && !joined.has(p.id))
    .map((p) => ({ p, m: placeWaitMinutes(p) ?? 999 }))
    .sort((a, b) => a.m - b.m)
    .slice(0, 4)
    .map((x) => x.p);
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

        {suggest.length > 0 && (
          <section className="mt-12">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">{mine.length ? 'Need another stop?' : 'Shortest waits right now'}</h2>
                <p className="text-sm text-slate-500">Join from here and keep both tokens on this page.</p>
              </div>
              <Link to="/explore" className="text-sm font-bold text-brand-700">Open map</Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {suggest.map((p, i) => (
                <PlaceCard key={p.id} place={p} i={i} wide />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
