import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import {
  BellRing,
  Check,
  Copy,
  ExternalLink,
  FlaskConical,
  Megaphone,
  Minus,
  Monitor,
  Plus,
  Power,
  Printer,
  SkipForward,
  UserPlus,
} from 'lucide-react';
import { Empty, ErrorNote, Spinner } from '../components/States';
import WaitBadge from '../components/WaitBadge';
import CategoryArt from '../components/CategoryArt';
import BestTime from '../components/BestTime';
import { useAuth, usePlace, useTick, useTickets } from '../lib/hooks';
import { formatMinutes, placeWaitMinutes } from '../lib/predict';
import {
  addTestWalkIns,
  callNext,
  finishCounter,
  joinQueue,
  recall,
  rollDayIfNeeded,
  skipTicket,
  updatePlace,
} from '../lib/queue';
import { clock, timeAgo, todayKey } from '../lib/time';
import { isOnTime, onTimeRate } from '../lib/speed';
import type { Place, Ticket } from '../lib/types';

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function WalkInForm({ place, uid }: { place: Place; uid: string }) {
  const [name, setName] = useState('');
  const [party, setParty] = useState(1);
  const [issued, setIssued] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="card p-5">
      <p className="flex items-center gap-2 font-bold">
        <UserPlus size={18} /> Add a walk-in
      </p>
      <p className="text-xs text-slate-500">For people without a phone. Give them the token number.</p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const r = await joinQueue(place.id, { name: name || 'Walk-in', partySize: party, uid, walkIn: true });
            setIssued(r.number);
            setName('');
            setParty(1);
          } finally {
            setBusy(false);
          }
        }}
      >
        <input className="input" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="input w-24" value={party} onChange={(e) => setParty(Number(e.target.value))} aria-label="Party size">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'person' : 'people'}
            </option>
          ))}
        </select>
        <button className="btn-dark" disabled={busy || !place.isOpen}>
          Add
        </button>
      </form>
      <AnimatePresence>
        {issued !== null && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-3 flex items-center justify-between rounded-xl bg-sun-50 px-4 py-3 ring-1 ring-sun-100">
            <span className="text-sm font-semibold text-sun-600">Token issued</span>
            <span className="text-3xl font-extrabold text-slate-900">{issued}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Counter() {
  const { placeId } = useParams();
  const { user, isMember, loading: authLoading } = useAuth();
  const { place, loading, error } = usePlace(placeId);
  const { tickets } = useTickets(placeId);
  const [busy, setBusy] = useState(false);
  const [opError, setOpError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useTick(10000);

  useEffect(() => {
    if (place && user && place.ownerUid === user.uid) rollDayIfNeeded(place).catch(() => {});
  }, [place?.id, place?.dayKey, user?.uid]);


  // Keyboard: press 1–9 to call the next person at that counter.
  const keyRef = useRef({ place, tickets, uid: user?.uid });
  keyRef.current = { place, tickets, uid: user?.uid };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.metaKey || e.ctrlKey || e.altKey) return;
      const d = Number(e.key);
      const { place: p, tickets: ts, uid } = keyRef.current;
      if (!p || !d || d > p.counters || p.ownerUid !== uid) return;
      e.preventDefault();
      const any = ts.some((t) => t.status === 'waiting');
      (any ? callNext(p, ts, d) : finishCounter(p, ts, d)).catch(() => {});
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const waiting = useMemo(() => tickets.filter((t) => t.status === 'waiting'), [tickets]);
  const calledByCounter = useMemo(() => {
    const m = new Map<number, Ticket>();
    tickets.filter((t) => t.status === 'called').forEach((t) => t.counter && m.set(t.counter, t));
    return m;
  }, [tickets]);

  if (authLoading || loading) return <Spinner />;
  if (!isMember) return <Navigate to={`/login?next=/business/${placeId}`} replace />;
  if (error) return <div className="container-x py-10"><ErrorNote message={error} /></div>;
  if (!place) return <Empty title="Queue not found" action={<Link className="btn-ghost" to="/business">Back to my queues</Link>} />;
  if (place.ownerUid !== user!.uid) return <Empty title="This isn't your queue">Only the owner can run its counter.</Empty>;

  const joinUrl = `${window.location.origin}/q/${place.id}`;
  const today = todayKey();
  const done = tickets.filter((t) => t.status === 'done').length;
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setOpError(null);
    try {
      await fn();
    } catch (e) {
      setOpError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-x py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="hidden h-20 w-28 shrink-0 overflow-hidden rounded-2xl shadow-soft ring-1 ring-black/5 sm:block">
            <CategoryArt category={place.category} className="h-full w-full" />
          </div>
          <div>
          <Link to={place.eventId ? `/business/school/${place.eventId}` : '/business'} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
            ← {place.eventId ? 'School event' : 'My queues'}
          </Link>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{place.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <WaitBadge minutes={placeWaitMinutes(place)} />
            <span className="text-sm text-slate-500">{place.address}</span>
          </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={place.isOpen ? 'btn-ghost' : 'btn-primary'}
            onClick={() => run(() => updatePlace(place.id, { isOpen: !place.isOpen }))}
          >
            <Power size={16} /> {place.isOpen ? 'Close queue' : 'Open queue'}
          </button>
          <Link to={`/tv/${place.id}`} target="_blank" className="btn-ghost">
            <Monitor size={16} /> TV mode
          </Link>
          <Link to={`/business/${place.id}/poster`} target="_blank" className="btn-ghost">
            <Printer size={16} /> QR poster
          </Link>
          <button
            className="btn-ghost"
            onClick={async () => {
              await navigator.clipboard?.writeText(joinUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Join link'}
          </button>
        </div>
      </div>

      {opError && <div className="mt-4"><ErrorNote message={opError} /></div>}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Waiting now" value={waiting.length} hint={`${waiting.reduce((s, t) => s + t.partySize, 0)} people incl. families`} />
        <Stat label="Served today" value={place.dayKey === today ? place.servedToday : 0} hint={`${done} finished`} />
        <Stat
          label="Avg per customer"
          value={formatMinutes(Math.max(1, Math.round(place.avgServiceSec / 60)))}
          hint={onTimeRate(place) !== null ? `${onTimeRate(place)}% on time${isOnTime(place) ? ' · badge earned ✓' : ''}` : 'learned live'}
        />
        <Stat label="New arrival waits" value={formatMinutes(placeWaitMinutes(place))} hint={`${place.counters} counter${place.counters > 1 ? 's' : ''} open`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        {/* Live board */}
        <div className="space-y-6">
          <LayoutGroup>
            <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-lift sm:p-6">
              <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
              <div className="relative flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
                  </span>
                  Live board
                </p>
                <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
                  <button className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10" title="Remove a counter" onClick={() => run(() => updatePlace(place.id, { counters: Math.max(1, place.counters - 1) }))}>
                    <Minus size={14} />
                  </button>
                  <span className="px-1 text-xs font-bold text-slate-300">{place.counters} counter{place.counters > 1 ? 's' : ''}</span>
                  <button className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10" title="Add a counter" onClick={() => run(() => updatePlace(place.id, { counters: Math.min(30, place.counters + 1) }))}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* The line */}
              <div className="relative mt-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">In line · {waiting.length}</p>
                <div className="mt-2 flex min-h-[3.5rem] flex-wrap items-center gap-2">
                  {waiting.slice(0, 10).map((t, i) => (
                    <motion.div
                      key={t.id}
                      layoutId={`tok-${t.id}`}
                      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                      className={`flex h-12 min-w-[3.25rem] flex-col items-center justify-center rounded-2xl px-2 ${
                        i === 0 ? 'bg-brand-500 text-white shadow-[0_8px_24px_-8px_rgba(14,165,143,.9)]' : 'bg-white/10 text-white'
                      }`}
                      title={t.name}
                    >
                      <span className="text-lg font-extrabold leading-none">{t.number}</span>
                      <span className="mt-0.5 max-w-[3rem] truncate text-[9px] font-semibold text-white/60">{t.name.split(' ')[0]}</span>
                    </motion.div>
                  ))}
                  {waiting.length > 10 && <span className="text-sm font-bold text-slate-400">+{waiting.length - 10}</span>}
                  {!waiting.length && <span className="text-sm text-slate-500">Nobody waiting. Share the QR code.</span>}
                </div>
              </div>

              {/* Counters */}
              <div className={`relative mt-5 grid gap-3 ${place.counters > 1 ? 'sm:grid-cols-2' : ''}`}>
                {Array.from({ length: place.counters }, (_, i) => i + 1).map((c) => {
                  const cur = calledByCounter.get(c) ?? null;
                  return (
                    <div key={c} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-300">Counter {c}</p>
                        {c <= 9 && <span className="hidden rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 lg:inline" title={`Press ${c} on the keyboard to call the next person here`}>key {c}</span>}
                      </div>
                      <div className="mt-3 flex min-h-[5.5rem] items-center gap-3">
                        <AnimatePresence mode="popLayout">
                          {cur ? (
                            <motion.div
                              key={cur.id}
                              layoutId={`tok-${cur.id}`}
                              exit={{ opacity: 0, x: 40, scale: 0.6, transition: { duration: 0.35 } }}
                              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                              className="flex h-20 min-w-[5.5rem] flex-col items-center justify-center rounded-2xl bg-sun-400 px-3 text-slate-900 shadow-[0_10px_30px_-10px_rgba(251,171,48,.9)]"
                            >
                              <span className="text-4xl font-extrabold leading-none">{cur.number}</span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key={`free-${c}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="grid h-20 min-w-[5.5rem] place-items-center rounded-2xl border-2 border-dashed border-white/15 text-sm font-bold text-slate-500"
                            >
                              Free
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="min-w-0">
                          {cur ? (
                            <>
                              <p className="truncate font-bold">
                                {cur.name}
                                {cur.partySize > 1 && <span className="ml-1.5 text-xs font-bold text-sun-300">+{cur.partySize - 1}</span>}
                              </p>
                              <p className="text-xs text-slate-400">Called {cur.calledAt ? timeAgo(cur.calledAt) : ''}</p>
                            </>
                          ) : (
                            <p className="text-sm text-slate-500">Ready for the next person</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="btn bg-brand-500 py-3 text-base text-white shadow-[0_10px_24px_-10px_rgba(14,165,143,.9)] hover:bg-brand-400"
                          disabled={busy || (!waiting.length && !cur)}
                          onClick={() => run(() => (waiting.length ? callNext(place, tickets, c) : finishCounter(place, tickets, c)))}
                        >
                          <BellRing size={18} /> {waiting.length ? 'Call next' : 'Finish'}
                        </motion.button>
                        <button className="btn bg-white/10 px-3 text-white hover:bg-white/15" title="Recall" disabled={busy || !cur} onClick={() => cur && run(() => recall(place.id, cur))}>
                          <Megaphone size={16} />
                        </button>
                        <button className="btn bg-white/10 px-3 text-white hover:bg-white/15" title="Done" disabled={busy || !cur} onClick={() => run(() => finishCounter(place, tickets, c))}>
                          <Check size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </LayoutGroup>

          {/* Waiting list */}
          <div className="card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <p className="font-bold">In line ({waiting.length})</p>
              <button className="btn-soft py-1.5 text-xs" disabled={busy || !place.isOpen} onClick={() => run(() => addTestWalkIns(place.id, user!.uid, 5))}>
                <FlaskConical size={14} /> Add 5 test people
              </button>
            </div>
            {waiting.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">The line is empty. Share the QR code to get started.</p>
            ) : (
              <ul className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
                <AnimatePresence initial={false}>
                  {waiting.map((t, i) => (
                    <motion.li
                      key={t.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`grid h-10 w-12 place-items-center rounded-lg text-lg font-extrabold ${i === 0 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{t.number}</span>
                        <div>
                          <p className="font-semibold">
                            {t.name}
                            {t.partySize > 1 && <span className="ml-2 text-xs font-semibold text-sun-600">+{t.partySize - 1}</span>}
                          </p>
                          <p className="text-xs text-slate-400">
                            Joined {clock(t.createdAt)} · {t.walkIn ? 'walk-in' : 'from phone'}
                            {t.checkedInAt ? ' · ✓ arrived' : ''}
                            {t.swappedAt ? ' · ↔ swapped' : ''}
                            {t.deferUntil && t.deferUntil > Date.now() ? ' · ⏸ busy elsewhere' : ''}
                          </p>
                        </div>
                      </div>
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Skip / remove" onClick={() => run(() => skipTicket(place, t))}>
                        <SkipForward size={16} />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <WalkInForm place={place} uid={user!.uid} />
          <BestTime place={place} />
          <div className="card p-5">
            <p className="font-bold">Customers join here</p>
            <a href={joinUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 break-all text-sm font-semibold text-brand-700 hover:underline">
              {joinUrl} <ExternalLink size={14} className="shrink-0" />
            </a>
            <p className="mt-2 text-xs text-slate-500">Print the QR poster for your door, or share this link on WhatsApp.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
