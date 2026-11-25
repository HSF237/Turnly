import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPinned, Ticket } from 'lucide-react';
import Aurora from '../components/Aurora';
import TokenCard from '../components/TokenCard';
import { allRememberedTickets } from '../lib/queue';

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
