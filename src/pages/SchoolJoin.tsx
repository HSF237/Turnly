import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Bell, Check, CheckCircle2, Clock, DoorOpen, GraduationCap, Hourglass, LogOut, Sparkles, TrendingDown, Users } from 'lucide-react';
import Aurora from '../components/Aurora';
import Confetti from '../components/Confetti';
import WaitBadge from '../components/WaitBadge';
import { Empty, ErrorNote, Spinner } from '../components/States';
import { ensureGuest } from '../lib/firebase';
import { useEventTeachers, useMultiTickets, useSchoolEvent, useTick } from '../lib/hooks';
import { formatMinutes, placeWaitMinutes, ticketPosition } from '../lib/predict';
import { deferTicket, joinQueue, leaveQueue, markDone } from '../lib/queue';
import { loadJourney, planPtm, saveJourney, teacherWait, type Journey } from '../lib/school';
import { buzz, chime, notify } from '../lib/speech';
import { clock } from '../lib/time';
import type { Place, SchoolEvent, Ticket } from '../lib/types';

const NAME_KEY = 'turnly:name';

function Avatar({ name, done }: { name: string; done?: boolean }) {
  return (
    <span
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg font-extrabold text-white ${
        done ? 'bg-brand-500' : 'bg-gradient-to-br from-sun-300 to-sun-500'
      }`}
    >
      {done ? <Check size={20} /> : name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/* ───────────────────────── Setup: pick teachers ───────────────────────── */

function Setup({ event, teachers, onStart }: { event: SchoolEvent; teachers: Place[]; onStart: (j: Journey) => void }) {
  const [parent, setParent] = useState(() => localStorage.getItem(NAME_KEY) || '');
  const [child, setChild] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chosen = teachers.filter((t) => picked.includes(t.id));
  const preview = useMemo(() => planPtm(chosen.map((p) => ({ place: p, waitMin: placeWaitMinutes(p) ?? 0 }))), [chosen]);
  const saved = Math.max(0, preview.oldWayMin - preview.totalMin);

  const start = async () => {
    if (!parent.trim()) return setError('Add your name so teachers know who you are.');
    if (!chosen.length) return setError('Pick at least one teacher.');
    setError(null);
    try {
      const user = await ensureGuest();
      localStorage.setItem(NAME_KEY, parent);
      const label = child.trim() ? `${parent.trim()} (${child.trim()})` : parent.trim();
      const tickets: Record<string, string> = {};
      for (let i = 0; i < chosen.length; i++) {
        setProgress(`Joining ${chosen[i].name}'s line… ${i + 1}/${chosen.length}`);
        const t = await joinQueue(chosen[i].id, { name: label, partySize: 1, uid: user.uid });
        tickets[chosen[i].id] = t.id;
      }
      const j: Journey = { parentName: parent.trim(), childName: child.trim(), tickets, startedAt: Date.now() };
      saveJourney(event.id, j);
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
      onStart(j);
    } catch (e) {
      setError((e as Error).message);
      setProgress(null);
    }
  };

  return (
    <div className="container-x max-w-5xl py-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-900 to-brand-900 p-7 text-white sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sun-400/25 blur-3xl" />
        <span className="chip bg-white/10 text-sun-300 ring-white/15">
          <GraduationCap size={14} /> {event.schoolName}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">{event.name}</h1>
        <p className="mt-2 max-w-xl text-slate-300">
          Pick the teachers you want to meet. Turnly holds your place in every line at once and sends you to whoever is free next. Wait
          anywhere, even the canteen.
        </p>
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="card grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="pn">Your name</label>
              <input id="pn" className="input py-3" placeholder="Parent's name" value={parent} onChange={(e) => setParent(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="cn">Child's name &amp; class</label>
              <input id="cn" className="input py-3" placeholder="e.g. Aman, 8B" value={child} onChange={(e) => setChild(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-xl font-extrabold">Who do you want to meet?</h2>
              <button className="text-sm font-semibold text-brand-700" onClick={() => setPicked(picked.length === teachers.length ? [] : teachers.map((t) => t.id))}>
                {picked.length === teachers.length ? 'Clear' : 'Select all'}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {teachers.map((t, i) => {
                const on = picked.includes(t.id);
                return (
                  <motion.button
                    key={t.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPicked((p) => (on ? p.filter((x) => x !== t.id) : [...p, t.id]))}
                    className={`relative flex items-center gap-3 rounded-2xl p-4 text-left ring-1 transition ${
                      on ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-white ring-slate-200 hover:ring-slate-300'
                    }`}
                  >
                    <Avatar name={t.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{t.name}</span>
                      <span className="block truncate text-xs text-slate-500">{t.address}</span>
                    </span>
                    <WaitBadge minutes={placeWaitMinutes(t)} />
                    <AnimatePresence>
                      {on && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white ring-2 ring-white"
                        >
                          <Check size={14} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live plan preview */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-100">
                <Sparkles size={12} /> Your plan
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-brand-100">With Turnly</p>
                  <p className="text-2xl font-extrabold">{chosen.length ? formatMinutes(preview.totalMin) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-100">Corridor queues</p>
                  <p className="text-2xl font-extrabold text-brand-200 line-through decoration-sun-400 decoration-2">
                    {chosen.length ? formatMinutes(preview.oldWayMin) : '—'}
                  </p>
                </div>
              </div>
              {saved > 0 && (
                <motion.p key={saved} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-3 rounded-xl bg-sun-400 px-3 py-2 text-sm font-extrabold text-slate-900">
                  You save about {formatMinutes(saved)}
                </motion.p>
              )}
            </div>
            <LayoutGroup>
              <ol className="space-y-1 p-3">
                {preview.steps.map((s, i) => (
                  <motion.li key={s.place.id} layout className="flex items-center gap-3 rounded-xl px-2 py-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-xs font-extrabold text-white">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{s.place.name}</span>
                    <span className="text-xs text-slate-500">~{Math.round(s.startAt)} min</span>
                  </motion.li>
                ))}
                {!preview.steps.length && <li className="p-3 text-center text-sm text-slate-400">Pick teachers to see your route.</li>}
              </ol>
            </LayoutGroup>
            <div className="border-t border-slate-100 p-4">
              {error && <div className="mb-3"><ErrorNote message={error} /></div>}
              <motion.button whileTap={{ scale: 0.97 }} className="btn-primary w-full py-3.5 text-base" disabled={!!progress} onClick={start}>
                {progress ?? `Join ${chosen.length || ''} teacher line${chosen.length === 1 ? '' : 's'}`}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Journey: live route ───────────────────────── */

function JourneyView({ event, teachers, journey, onEnd }: { event: SchoolEvent; teachers: Place[]; journey: Journey; onEnd: () => void }) {
  useTick(10000);
  const ids = Object.keys(journey.tickets);
  const ticketMap = useMultiTickets(ids);
  const [error, setError] = useState<string | null>(null);

  const rows = ids
    .map((pid) => {
      const place = teachers.find((t) => t.id === pid);
      const tickets = ticketMap[pid] ?? [];
      const ticket = tickets.find((t) => t.id === journey.tickets[pid]);
      return place ? { place, ticket, tickets } : null;
    })
    .filter(Boolean) as { place: Place; ticket: Ticket | undefined; tickets: Ticket[] }[];

  const isEnded = (t?: Ticket) => !!t && ['done', 'skipped', 'left'].includes(t.status);
  const active = rows.filter((r) => r.ticket && !isEnded(r.ticket));
  const done = rows.filter((r) => isEnded(r.ticket));
  const called = active.filter((r) => r.ticket!.status === 'called');
  const plan = planPtm(active.map((r) => ({ place: r.place, waitMin: teacherWait(r.place, r.ticket, r.tickets) })));
  const allDone = rows.length > 0 && done.length === rows.length;
  const saved = Math.max(0, plan.oldWayMin - plan.totalMin);

  // Alerts for every new call.
  const seen = useRef<Record<string, number>>({});
  useEffect(() => {
    for (const r of called) {
      const at = r.ticket!.announceAt ?? 0;
      if (seen.current[r.ticket!.id] === at) continue;
      seen.current[r.ticket!.id] = at;
      chime();
      buzz();
      notify(`${r.place.name} is ready for you`, `Go to ${r.place.address || 'their room'} now.`);
    }
  }, [called.map((r) => `${r.ticket!.id}:${r.ticket!.announceAt}`).join('|')]);

  const act = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const loadedAll = ids.every((id) => ticketMap[id]);
  if (loadedAll && rows.length && rows.every((r) => !r.ticket)) {
    return (
      <Empty
        title="This plan has expired"
        action={
          <button
            className="btn-primary"
            onClick={() => {
              saveJourney(event.id, null);
              onEnd();
            }}
          >
            Make a new plan
          </button>
        }
      >
        Your tokens were from another day.
      </Empty>
    );
  }

  if (allDone) {
    const mins = Math.max(1, Math.round((Date.now() - journey.startedAt) / 60000));
    return (
      <div className="container-x grid min-h-[70vh] max-w-lg place-items-center py-10 text-center">
        <Confetti />
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }}>
          <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }} className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-600 text-white shadow-lift">
            <CheckCircle2 size={40} />
          </motion.div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight">All done!</h1>
          <p className="mt-2 text-lg text-slate-600">
            You met {rows.length} teacher{rows.length === 1 ? '' : 's'} in {formatMinutes(mins)}
            {journey.childName && <> for {journey.childName}</>}.
          </p>
          <button
            className="btn-ghost mt-8"
            onClick={() => {
              saveJourney(event.id, null);
              onEnd();
            }}
          >
            Start a new plan
          </button>
        </motion.div>
      </div>
    );
  }

  const next = plan.steps[0];
  const nextRow = next ? active.find((r) => r.place.id === next.place.id) : null;

  return (
    <div className="container-x max-w-3xl py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{event.schoolName}</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Hi {journey.parentName.split(' ')[0]} 👋</h1>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500">Progress</p>
          <p className="text-lg font-extrabold">
            {done.length}/{rows.length}
          </p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sun-400" animate={{ width: `${(done.length / Math.max(1, rows.length)) * 100}%` }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} />
      </div>

      {error && <div className="mt-4"><ErrorNote message={error} /></div>}

      {/* NOW card */}
      <div className="mt-5 space-y-3">
        <AnimatePresence mode="popLayout">
          {called.length > 0 ? (
            called.map((r) => (
              <motion.div
                key={r.ticket!.id}
                layout
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sun-400 to-sun-500 p-6 text-slate-900 shadow-lift"
              >
                <motion.span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/30" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
                <p className="relative flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest">
                  <Bell size={16} /> Go now
                </p>
                <p className="relative mt-2 text-3xl font-extrabold">{r.place.name}</p>
                <p className="relative flex items-center gap-1.5 font-semibold">
                  <DoorOpen size={16} /> {r.place.address || 'Their room'} · token {r.ticket!.number}
                </p>
                <div className="relative mt-5 grid grid-cols-2 gap-2">
                  <button className="btn bg-slate-900 py-3 text-white hover:bg-slate-800" onClick={() => act(() => markDone(r.place.id, r.ticket!.id))}>
                    <Check size={16} /> Done here
                  </button>
                  <button className="btn bg-white/70 py-3 text-slate-900 hover:bg-white" onClick={() => act(() => deferTicket(r.place.id, r.ticket!.id, 5))}>
                    <Clock size={16} /> Busy, 5 min
                  </button>
                </div>
              </motion.div>
            ))
          ) : next && nextRow ? (
            <motion.div key={`next-${next.place.id}`} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-lift">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-100">Next up</p>
              <p className="mt-2 text-3xl font-extrabold">{next.place.name}</p>
              <p className="flex items-center gap-1.5 text-brand-100">
                <DoorOpen size={16} /> {next.place.address || 'Their room'} · token {nextRow.ticket?.number}
              </p>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-xs text-brand-100">Ready for you in about</p>
                  <p className="text-4xl font-extrabold">{formatMinutes(Math.round(next.startAt))}</p>
                </div>
                <p className="max-w-[10rem] text-right text-sm text-brand-100">Relax anywhere. We'll buzz you.</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="card p-4">
          <Hourglass size={18} className="text-brand-600" />
          <p className="mt-2 text-xs font-semibold text-slate-500">Finish around</p>
          <p className="text-2xl font-extrabold">{clock(Date.now() + plan.totalMin * 60000)}</p>
        </div>
        <div className="card p-4">
          <TrendingDown size={18} className="text-brand-600" />
          <p className="mt-2 text-xs font-semibold text-slate-500">Saved vs corridor queues</p>
          <p className="text-2xl font-extrabold">{formatMinutes(saved)}</p>
        </div>
      </div>

      {/* Live route */}
      <div className="card mt-4 p-5">
        <div className="flex items-baseline justify-between">
          <p className="font-extrabold">Your live route</p>
          <p className="flex items-center gap-1 text-xs font-semibold text-brand-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" /> re-planned as lines move
          </p>
        </div>
        <LayoutGroup>
          <ol className="relative mt-4 space-y-3 before:absolute before:bottom-5 before:left-[21px] before:top-5 before:w-0.5 before:bg-slate-200">
            {plan.steps.map((s, i) => {
              const r = active.find((x) => x.place.id === s.place.id)!;
              const pos = r.ticket && r.ticket.status === 'waiting' ? ticketPosition(r.ticket, r.tickets, r.place) : null;
              const deferred = r.ticket?.deferUntil && r.ticket.deferUntil > Date.now();
              return (
                <motion.li key={s.place.id} layout transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="relative flex items-center gap-3">
                  <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-900 font-extrabold text-white ring-4 ring-white">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{s.place.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {s.place.address} · token {r.ticket?.number}
                      {pos && ` · ${pos.ahead} ahead`}
                      {deferred && ' · holding your spot'}
                    </p>
                  </div>
                  <span className="text-right text-xs font-semibold text-slate-500">
                    {r.ticket?.status === 'called' ? <span className="chip bg-sun-50 text-sun-600 ring-sun-100">Now</span> : clock(Date.now() + s.startAt * 60000)}
                  </span>
                </motion.li>
              );
            })}
            {done.map((r) => (
              <motion.li key={r.place.id} layout className="relative flex items-center gap-3 opacity-60">
                <span className="relative z-10 ring-4 ring-white rounded-2xl">
                  <Avatar name={r.place.name} done />
                </span>
                <p className="flex-1 truncate font-semibold line-through">{r.place.name}</p>
                <span className="text-xs font-semibold text-brand-700">Met ✓</span>
              </motion.li>
            ))}
          </ol>
        </LayoutGroup>
      </div>

      <button
        className="btn-danger mt-6 w-full"
        onClick={async () => {
          if (!confirm('Leave all your teacher lines?')) return;
          await act(async () => {
            for (const r of active) await leaveQueue(r.place.id, r.ticket!.id);
          });
          saveJourney(event.id, null);
          onEnd();
        }}
      >
        <LogOut size={16} /> Leave all lines
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        <Users size={12} /> Keep this page open. It updates live.
      </p>
    </div>
  );
}

export default function SchoolJoin() {
  const { eventId } = useParams();
  const { event, loading } = useSchoolEvent(eventId);
  const { teachers, loading: tLoading } = useEventTeachers(eventId);
  const [journey, setJourney] = useState<Journey | null>(() => (eventId ? loadJourney(eventId) : null));

  if (loading || tLoading) return <Spinner label="Loading the meeting…" />;
  if (!event) return <Empty title="This meeting link isn't valid">Ask the school for a fresh link.</Empty>;

  return (
    <div className="relative isolate min-h-[80vh]">
      <Aurora />
      {journey ? (
        <JourneyView event={event} teachers={teachers} journey={journey} onEnd={() => setJourney(null)} />
      ) : (
        <Setup event={event} teachers={teachers} onStart={setJourney} />
      )}
    </div>
  );
}
