import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownUp, Clock, Heart, X, Zap } from 'lucide-react';
import Confetti from './Confetti';
import { acceptSwap, addKindness, clearSwap, kindnessPoints, requestSwap } from '../lib/queue';
import type { Place, Ticket } from '../lib/types';

/**
 * Swap my spot: someone in a hurry asks a person ahead to trade places.
 * The person ahead accepts and earns a kindness point.
 */
export default function SwapPanel({ place, ticket, tickets, mine }: { place: Place; ticket: Ticket; tickets: Ticket[]; mine: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [points, setPoints] = useState(kindnessPoints());

  const ahead = tickets.filter((t) => t.status === 'waiting' && t.number < ticket.number).sort((a, b) => b.number - a.number);
  const outgoing = tickets.find((t) => t.swapRequest?.fromTicketId === ticket.id) ?? null;
  const incoming = ticket.swapRequest ?? null;

  // Detect a completed swap from the requester's side: our number went down.
  const lastNumber = useRef(ticket.number);
  useEffect(() => {
    if (ticket.number < lastNumber.current) {
      setCelebrate(`You moved up to #${ticket.number}!`);
      setTimeout(() => setCelebrate(null), 2600);
    }
    lastNumber.current = ticket.number;
  }, [ticket.number]);

  if (!mine || ticket.status !== 'waiting') return null;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AnimatePresence>{celebrate && <Confetti key="c" />}</AnimatePresence>
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-28 z-[61] mx-auto max-w-sm rounded-2xl bg-slate-900 p-4 text-center font-bold text-white shadow-lift"
          >
            {celebrate}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Someone is asking ME */}
      <AnimatePresence>
        {incoming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-end bg-slate-900/40 p-3 backdrop-blur-sm sm:place-items-center"
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-lift"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sun-50 text-sun-600"
              >
                <Zap size={26} />
              </motion.div>
              <h3 className="mt-4 text-xl font-extrabold">{incoming.fromName || 'Someone'} is in a hurry</h3>
              <p className="mt-1 text-sm text-slate-500">Swap places with them?</p>
              <div className="mt-5 flex items-center justify-center gap-4">
                <div className="rounded-2xl bg-slate-100 px-5 py-3">
                  <p className="text-[11px] font-semibold text-slate-500">You now</p>
                  <p className="text-3xl font-extrabold">{ticket.number}</p>
                </div>
                <motion.span animate={{ rotate: [0, 180, 360] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}>
                  <ArrowDownUp className="text-brand-600" />
                </motion.span>
                <div className="rounded-2xl bg-brand-50 px-5 py-3 ring-1 ring-brand-200">
                  <p className="text-[11px] font-semibold text-brand-700">You'd be</p>
                  <p className="text-3xl font-extrabold text-brand-700">{incoming.fromNumber}</p>
                </div>
              </div>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-rose-500">
                <Heart size={14} fill="currentColor" /> Earn a kindness point for a priority skip later
              </p>
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
              <div className="mt-6 grid grid-cols-2 gap-2">
                <button className="btn-ghost py-3" disabled={busy} onClick={() => run(() => clearSwap(place.id, ticket.id))}>
                  Not now
                </button>
                <button
                  className="btn-primary py-3"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const ok = await acceptSwap(place.id, ticket.id);
                      if (ok) {
                        addKindness();
                        setPoints(kindnessPoints());
                        setCelebrate('Kind move! +1 kindness point 💚');
                        setTimeout(() => setCelebrate(null), 2600);
                      }
                    })
                  }
                >
                  Swap places
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card overflow-hidden">
        {outgoing ? (
          <div className="flex items-center gap-3 p-4">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sun-50 text-sun-600">
              <Clock size={20} />
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-ping rounded-full bg-sun-400" />
            </span>
            <div className="flex-1">
              <p className="font-bold">Asked #{outgoing.number} to swap</p>
              <p className="text-sm text-slate-500">Waiting for {outgoing.name} to answer…</p>
            </div>
            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" title="Cancel request" onClick={() => run(() => clearSwap(place.id, outgoing.id))}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <button
              className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50"
              onClick={() => setOpen((o) => !o)}
              disabled={!ahead.length}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <ArrowDownUp size={20} />
              </span>
              <span className="flex-1">
                <span className="block font-bold">In a hurry? Swap my spot</span>
                <span className="block text-sm text-slate-500">
                  {ahead.length ? 'Ask someone ahead to trade places with you.' : "You're at the front, no swap needed."}
                </span>
              </span>
              {points > 0 && (
                <span className="chip bg-rose-50 text-rose-500 ring-rose-100">
                  <Heart size={12} fill="currentColor" /> {points}
                </span>
              )}
            </button>
            <AnimatePresence>
              {open && ahead.length > 0 && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="divide-y divide-slate-100 border-t border-slate-100"
                >
                  {ahead.slice(0, 5).map((t, i) => (
                    <motion.li
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <span className="flex items-center gap-3">
                        <span className="grid h-9 w-11 place-items-center rounded-lg bg-slate-100 font-extrabold">{t.number}</span>
                        <span className="text-sm font-semibold">{t.name.split(' ')[0]}</span>
                      </span>
                      {t.walkIn ? (
                        <span className="text-xs text-slate-400">at the counter</span>
                      ) : (
                        <button
                          className="btn-soft px-3 py-1.5 text-xs"
                          disabled={busy || !!t.swapRequest}
                          onClick={() =>
                            run(async () => {
                              await requestSwap(place.id, ticket, t);
                              setOpen(false);
                            })
                          }
                        >
                          {t.swapRequest ? 'Busy' : 'Ask to swap'}
                        </button>
                      )}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </>
        )}
        {error && !incoming && <p className="px-4 pb-3 text-xs text-red-600">{error}</p>}
      </div>
    </>
  );
}
