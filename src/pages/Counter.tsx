import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
  Users,
} from 'lucide-react';
import { Empty, ErrorNote, Spinner } from '../components/States';
import WaitBadge from '../components/WaitBadge';
import SplitFlap from '../components/SplitFlap';
import CategoryArt from '../components/CategoryArt';
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

function HoursChart({ tickets }: { tickets: Ticket[] }) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8am–9pm
  const counts = hours.map((h) => tickets.filter((t) => new Date(t.createdAt).getHours() === h).length);
  const max = Math.max(1, ...counts);
  const nowH = new Date().getHours();
  return (
    <div className="card p-5">
      <p className="font-bold">Arrivals by hour, today</p>
      <p className="text-xs text-slate-500">Over the weeks, this becomes the “best time to come” chart customers see.</p>
      <div className="mt-4 flex h-28 items-end gap-1.5">
        {hours.map((h, i) => (
          <div key={h} className="flex flex-1 flex-col items-center gap-1">
            <motion.div
              className={`w-full rounded-md ${h === nowH ? 'bg-brand-500' : 'bg-brand-200'}`}
              initial={{ height: 0 }}
              animate={{ height: `${(counts[i] / max) * 100}%` }}
              style={{ minHeight: counts[i] ? 4 : 2 }}
              title={`${counts[i]} arrivals`}
            />
            <span className="text-[10px] font-semibold text-slate-400">{h > 12 ? h - 12 : h}{h >= 12 ? 'p' : 'a'}</span>
          </div>
        ))}
      </div>
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
  const [counter, setCounter] = useState(1);
  const [busy, setBusy] = useState(false);
  const [opError, setOpError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useTick(10000);

  useEffect(() => {
    if (place && user && place.ownerUid === user.uid) rollDayIfNeeded(place).catch(() => {});
  }, [place?.id, place?.dayKey, user?.uid]);

  useEffect(() => {
    if (place && counter > place.counters) setCounter(place.counters);
  }, [place?.counters]);

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
  const current = calledByCounter.get(counter) ?? null;
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
        <Stat label="Avg per customer" value={formatMinutes(Math.max(1, Math.round(place.avgServiceSec / 60)))} hint="learned live" />
        <Stat label="New arrival waits" value={formatMinutes(placeWaitMinutes(place))} hint={`${place.counters} counter${place.counters > 1 ? 's' : ''} open`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        {/* Counter console */}
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-1 overflow-x-auto">
                {Array.from({ length: place.counters }, (_, i) => i + 1).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCounter(c)}
                    className={`relative rounded-lg px-3 py-1.5 text-sm font-bold whitespace-nowrap ${counter === c ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    Counter {c}
                    {calledByCounter.has(c) && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-500" />}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="Remove a counter" onClick={() => run(() => updatePlace(place.id, { counters: Math.max(1, place.counters - 1) }))}>
                  <Minus size={16} />
                </button>
                <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="Add a counter" onClick={() => run(() => updatePlace(place.id, { counters: Math.min(30, place.counters + 1) }))}>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-sm font-semibold text-slate-500">Now serving at counter {counter}</p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current?.id ?? 'none'}
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  >
                    {current ? (
                      <div className="mt-1">
                        <SplitFlap value={current.number} tone="light" className="mt-1 text-6xl text-slate-900" />
                        <p className="mt-2 font-semibold text-slate-700">
                          {current.name}
                          {current.partySize > 1 && <span className="ml-2 chip bg-sun-50 text-sun-600 ring-sun-100"><Users size={12} /> {current.partySize}</span>}
                        </p>
                        <p className="text-xs text-slate-400">Called {current.calledAt ? timeAgo(current.calledAt) : ''}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-2xl font-bold text-slate-300">Nobody yet</p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  className="btn-primary h-20 min-w-[200px] text-xl"
                  disabled={busy || (!waiting.length && !current)}
                  onClick={() => run(() => (waiting.length ? callNext(place, tickets, counter) : finishCounter(place, tickets, counter)))}
                >
                  <BellRing size={22} /> {waiting.length ? 'Call next' : 'Finish'}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-ghost" disabled={busy || !current} onClick={() => current && run(() => recall(place.id, current))}>
                    <Megaphone size={16} /> Recall
                  </button>
                  <button className="btn-ghost" disabled={busy || !current} onClick={() => run(() => finishCounter(place, tickets, counter))}>
                    <Check size={16} /> Done
                  </button>
                </div>
              </div>
            </div>
          </div>

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
          <HoursChart tickets={tickets} />
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
