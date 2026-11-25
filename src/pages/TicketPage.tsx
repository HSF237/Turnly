import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, Footprints, LogOut, MapPin, Share2, Users } from 'lucide-react';
import { Empty, ErrorNote, Spinner } from '../components/States';
import { useAuth, useGeolocation, usePlace, useTick, useTickets } from '../lib/hooks';
import { formatMinutes, ticketPosition } from '../lib/predict';
import { checkIn, deferTicket, forgetTicket, leaveQueue, markDone } from '../lib/queue';
import SwapPanel from '../components/SwapPanel';
import Confetti from '../components/Confetti';
import SplitFlap from '../components/SplitFlap';
import { buzz, chime, notify } from '../lib/speech';
import { distanceM } from '../lib/time';
import { travelMinutes } from '../lib/planner';

function Ring({ progress, children }: { progress: number; children: React.ReactNode }) {
  const r = 108;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto h-64 w-64">
      <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90">
        <circle cx="120" cy="120" r={r} stroke="rgba(255,255,255,.15)" strokeWidth="14" fill="none" />
        <motion.circle
          cx="120"
          cy="120"
          r={r}
          stroke="#fbab30"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - Math.max(0.02, Math.min(1, progress))) }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export default function TicketPage() {
  const { placeId, ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { place, loading } = usePlace(placeId);
  const { tickets, loading: tLoading } = useTickets(placeId);
  const geo = useGeolocation();
  const [error, setError] = useState<string | null>(null);
  const [notifPerm, setNotifPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  useTick(15000);

  const ticket = tickets.find((t) => t.id === ticketId) ?? null;
  const pos = useMemo(() => (ticket && place ? ticketPosition(ticket, tickets, place) : null), [ticket, tickets, place]);

  // Remember how many were ahead when we first saw the ticket, for the progress ring.
  const startKey = `turnly:start:${ticketId}`;
  const initialAhead = useRef<number | null>(null);
  if (initialAhead.current === null && pos) {
    const saved = Number(localStorage.getItem(startKey));
    initialAhead.current = saved > 0 ? saved : Math.max(1, pos.ahead);
    if (!saved) localStorage.setItem(startKey, String(initialAhead.current));
  }

  // Alerts: "almost" once, "your turn" whenever called / recalled.
  const almostSent = useRef(false);
  const lastAnnounce = useRef<number | null>(null);
  useEffect(() => {
    if (!ticket || !place) return;
    if (ticket.status === 'waiting' && pos && pos.ahead <= 2 && !almostSent.current) {
      almostSent.current = true;
      buzz();
      notify('Almost your turn', `${pos.ahead === 0 ? 'You are next' : `${pos.ahead} ahead of you`} at ${place.name}.`);
    }
    if (ticket.status === 'called' && ticket.announceAt && ticket.announceAt !== lastAnnounce.current) {
      lastAnnounce.current = ticket.announceAt;
      chime();
      buzz();
      notify("It's your turn!", `Token ${ticket.number}: please go to counter ${ticket.counter} at ${place.name}.`);
    }
  }, [ticket?.status, ticket?.announceAt, pos?.ahead]);

  useEffect(() => {
    if (ticket && ['done', 'skipped', 'left'].includes(ticket.status) && placeId) forgetTicket(placeId);
  }, [ticket?.status]);

  if (loading || tLoading) return <Spinner label="Finding your token…" />;
  if (!place || !ticket) return <Empty title="Token not found">It may be from another day.</Empty>;

  const mine = user?.uid === ticket.uid;
  const ended = ['done', 'skipped', 'left'].includes(ticket.status);
  const dist = geo.pos ? distanceM(geo.pos, place) : null;
  const travel = dist !== null ? travelMinutes(dist) : null;
  const leaveIn = travel !== null && pos ? pos.etaMin - travel : null;
  const canCheckIn = place.checkInRadius > 0 && !ticket.checkedInAt && ticket.status === 'waiting';
  const progress = pos && initialAhead.current ? 1 - pos.ahead / initialAhead.current : 0;

  const act = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      {/* Your-turn overlay */}
      <AnimatePresence>
        {ticket.status === 'called' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-brand-700/95 p-6 text-center text-white backdrop-blur"
          >
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
              <motion.div
                className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-white/15"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              >
                <Bell size={40} />
              </motion.div>
              <p className="text-lg font-semibold text-brand-100">It's your turn!</p>
              <p className="text-8xl font-extrabold leading-none">{ticket.number}</p>
              <p className="mt-4 text-2xl font-bold">Go to counter {ticket.counter}</p>
              <p className="mt-1 text-brand-100">{place.name}</p>
              {mine && (
                <div className="mt-10 flex flex-col items-center gap-3">
                  <button className="btn bg-white px-6 py-3 text-base text-brand-800 hover:bg-brand-50" onClick={() => act(() => markDone(place.id, ticket.id))}>
                    <CheckCircle2 size={18} /> I'm done
                  </button>
                  <button className="text-sm font-semibold text-brand-100 underline-offset-4 hover:underline" onClick={() => act(() => deferTicket(place.id, ticket.id, 5))}>
                    Can't come yet? Hold my spot 5 min
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl bg-gradient-to-b from-brand-600 to-brand-800 p-6 text-white shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-100">Your token</p>
            <p className="mt-0.5 font-semibold">{place.name}</p>
          </div>
          {ticket.partySize > 1 && (
            <span className="chip bg-white/15 text-white ring-white/20">
              <Users size={12} /> {ticket.partySize}
            </span>
          )}
        </div>

        {ended ? (
          <div className="py-10 text-center">
            {ticket.status === 'done' && <Confetti />}
            <p className="text-7xl font-extrabold">{ticket.number}</p>
            <p className="mt-3 text-xl font-bold">
              {ticket.status === 'done' ? 'All done. Thanks for not waiting! 🎉' : ticket.status === 'left' ? 'You left the queue' : 'This token was skipped'}
            </p>
            <Link to={`/q/${place.id}`} className="btn mt-6 bg-white text-brand-800 hover:bg-brand-50" onClick={() => forgetTicket(place.id)}>
              Join again
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <Ring progress={progress}>
                <div>
                  <p className="text-sm text-brand-100">Token</p>
                  <SplitFlap value={ticket.number} tone="brand" className="mt-1 text-6xl" />
                  <p className="mt-2 text-sm font-semibold text-brand-100">
                    {pos?.ahead === 0 ? "You're next!" : `${pos?.ahead} ahead of you`}
                  </p>
                </div>
              </Ring>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs text-brand-100">Your turn in about</p>
                <p className="text-2xl font-extrabold">{formatMinutes(pos?.etaMin ?? 0)}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs text-brand-100">Now serving</p>
                <p className="text-2xl font-extrabold">{pos?.nowServing ? pos.nowServing.number : '—'}</p>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {error && <div className="mt-4"><ErrorNote message={error} /></div>}

      {!ended && (
        <div className="mt-4 space-y-3">
          {/* Leave home now */}
          <div className="card p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sun-50 text-sun-600">
                <Footprints size={20} />
              </span>
              <div className="flex-1">
                {leaveIn === null ? (
                  <>
                    <p className="font-bold">When should I leave?</p>
                    <p className="text-sm text-slate-500">Share your location and Turnly times your arrival to your turn.</p>
                    <button className="btn-soft mt-2 py-1.5 text-xs" onClick={() => geo.request()}>
                      <MapPin size={14} /> Use my location
                    </button>
                    {geo.error && <p className="mt-1 text-xs text-red-600">{geo.error}</p>}
                  </>
                ) : dist !== null && dist < 150 ? (
                  <>
                    <p className="font-bold">You're here 👋</p>
                    <p className="text-sm text-slate-500">Relax nearby. We'll buzz you when you're close.</p>
                  </>
                ) : leaveIn <= 0 ? (
                  <>
                    <p className="font-bold text-sun-600">Leave now</p>
                    <p className="text-sm text-slate-500">About {travel} min away. Your turn is coming up.</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold">Leave in about {formatMinutes(leaveIn)}</p>
                    <p className="text-sm text-slate-500">You're ~{travel} min away. Wait wherever you like until then.</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <SwapPanel place={place} ticket={ticket} tickets={tickets} mine={mine} />

          {canCheckIn && mine && (
            <button
              className="btn-dark w-full py-3"
              onClick={async () => {
                const p = geo.pos ?? (await geo.request());
                if (!p) return;
                const d = distanceM(p, place);
                if (d > place.checkInRadius) {
                  setError(`You're ${Math.round(d)} m away. Check in when you're within ${place.checkInRadius} m.`);
                  return;
                }
                act(() => checkIn(place.id, ticket.id));
              }}
            >
              <MapPin size={16} /> I've arrived: check in
            </button>
          )}
          {ticket.checkedInAt && <p className="text-center text-sm font-semibold text-brand-700">✓ Checked in</p>}

          <div className="grid grid-cols-2 gap-3">
            {notifPerm !== 'granted' && typeof Notification !== 'undefined' ? (
              <button
                className="btn-ghost"
                onClick={async () => {
                  const r = await Notification.requestPermission();
                  setNotifPerm(r);
                }}
              >
                <Bell size={16} /> Turn on alerts
              </button>
            ) : (
              <button
                className="btn-ghost"
                onClick={() => navigator.share?.({ title: `My token at ${place.name}`, url: window.location.href }).catch(() => {})}
              >
                <Share2 size={16} /> Share
              </button>
            )}
            {mine && (
              <button
                className="btn-danger"
                onClick={async () => {
                  if (!confirm('Leave the queue? You will lose your place.')) return;
                  await act(() => leaveQueue(place.id, ticket.id));
                  forgetTicket(place.id);
                  navigate(`/q/${place.id}`, { replace: true });
                }}
              >
                <LogOut size={16} /> Leave queue
              </button>
            )}
          </div>
          <p className="text-center text-xs text-slate-400">Keep this page open, or come back with the same link. It updates live.</p>
        </div>
      )}
    </div>
  );
}
