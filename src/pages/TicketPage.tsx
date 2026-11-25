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
import CategoryArt from '../components/CategoryArt';
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
  const aheadList = tickets.filter((t) => t.status === 'waiting' && t.number < ticket.number).sort((a, b) => a.number - b.number);
  const stage = ticket.status === 'done' ? 3 : ticket.status === 'called' ? 2 : pos && pos.ahead <= 2 ? 1 : 0;

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

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[2rem] bg-brand-800 text-white shadow-lift">
        {/* Illustrated header */}
        <div className="relative h-32 overflow-hidden">
          <CategoryArt category={place.category} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-800/40 to-brand-800" />
          <div className="absolute inset-x-5 bottom-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-100">Your token at</p>
              <p className="truncate text-lg font-extrabold">{place.name}</p>
            </div>
            {ticket.partySize > 1 && (
              <span className="chip shrink-0 bg-white/15 text-white ring-white/20 backdrop-blur">
                <Users size={12} /> {ticket.partySize}
              </span>
            )}
          </div>
        </div>
        <div className="bg-gradient-to-b from-brand-800 to-brand-900 px-6 pb-6">
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

            {/* The line ahead of you */}
            <div className="mt-4 rounded-2xl bg-black/15 p-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-100">The line</p>
              <div className="mt-2 flex items-center gap-1.5 overflow-hidden">
                {pos?.nowServing && (
                  <span className="grid h-8 shrink-0 place-items-center rounded-full bg-sun-400 px-2 text-[11px] font-extrabold text-slate-900">#{pos.nowServing.number}</span>
                )}
                <AnimatePresence initial={false} mode="popLayout">
                  {aheadList.slice(-6).map((t) => (
                    <motion.span
                      key={t.id}
                      layout
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.3, x: -20 }}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 text-[11px] font-bold"
                      title={`#${t.number}`}
                    >
                      {t.name.slice(0, 1).toUpperCase()}
                    </motion.span>
                  ))}
                </AnimatePresence>
                {aheadList.length > 6 && <span className="text-xs font-bold text-brand-100">+{aheadList.length - 6}</span>}
                <motion.span layout className="grid h-8 shrink-0 place-items-center rounded-full bg-white px-2.5 text-[11px] font-extrabold text-brand-800 ring-2 ring-sun-300">
                  You
                </motion.span>
              </div>
            </div>

            {/* Journey */}
            <div className="mt-5">
              <div className="relative flex justify-between">
                <div className="absolute left-3 right-3 top-3 h-0.5 bg-white/15" />
                <motion.div
                  className="absolute left-3 top-3 h-0.5 bg-sun-400"
                  animate={{ width: `calc(${(stage / 3) * 100}% - ${(stage / 3) * 24}px)` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                />
                {['Joined', 'Almost', 'Your turn', 'Done'].map((label, k) => (
                  <div key={label} className="relative flex w-16 flex-col items-center">
                    <motion.span
                      animate={{ scale: k === stage ? [1, 1.2, 1] : 1, backgroundColor: k <= stage ? '#fbab30' : 'rgba(255,255,255,0.15)' }}
                      transition={{ scale: { repeat: k === stage ? Infinity : 0, duration: 1.6 } }}
                      className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-extrabold text-slate-900"
                    >
                      {k < stage ? '✓' : k + 1}
                    </motion.span>
                    <span className={`mt-1.5 text-[10px] font-bold ${k <= stage ? 'text-white' : 'text-brand-200/70'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        </div>
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
