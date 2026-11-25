import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { DoorOpen, Volume2 } from 'lucide-react';
import Logo from '../components/Logo';
import { Empty, Spinner } from '../components/States';
import { useEventTeachers, useMultiTickets, useSchoolEvent } from '../lib/hooks';
import { chime } from '../lib/speech';
import type { Place, Ticket } from '../lib/types';

function say(text: string) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-IN';
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

/** The hall screen for a parent-teacher meeting: every teacher, who they're with, who's next. */
export default function SchoolBoard() {
  const { eventId } = useParams();
  const { event, loading } = useSchoolEvent(eventId);
  const { teachers } = useEventTeachers(eventId);
  const ticketMap = useMultiTickets(teachers.map((t) => t.id));
  const [started, setStarted] = useState(false);
  const [flash, setFlash] = useState<{ place: Place; ticket: Ticket } | null>(null);
  const seen = useRef<Record<string, number> | null>(null);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const all = teachers.flatMap((p) => (ticketMap[p.id] ?? []).map((t) => ({ p, t })));
    if (!teachers.length || teachers.some((p) => !ticketMap[p.id])) return;
    if (seen.current === null) {
      seen.current = Object.fromEntries(all.filter((x) => x.t.announceAt).map((x) => [x.t.id, x.t.announceAt!]));
      return;
    }
    for (const { p, t } of all) {
      if (t.status !== 'called' || !t.announceAt || seen.current[t.id] === t.announceAt) continue;
      seen.current[t.id] = t.announceAt;
      setFlash({ place: p, ticket: t });
      setTimeout(() => setFlash((f) => (f?.ticket.id === t.id ? null : f)), 5500);
      if (started) {
        chime();
        setTimeout(() => say(`Token ${t.number}, ${t.name}, please meet ${p.name}${p.teacher?.room ? ` in room ${p.teacher.room}` : ''}.`), 700);
      }
    }
  }, [ticketMap, teachers, started]);

  if (loading) return <Spinner />;
  if (!event) return <Empty title="Event not found" />;
  const url = `${window.location.origin}/s/${event.id}`;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-sun-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-brand-600/25 blur-3xl" />
      <header className="relative flex items-center justify-between gap-6 px-10 py-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sun-300">{event.schoolName}</p>
          <h1 className="text-4xl font-extrabold">{event.name}</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-2.5 pr-4 text-slate-900">
            <QRCodeSVG value={url} size={84} />
            <div>
              <p className="font-extrabold leading-tight">Parents: scan to</p>
              <p className="font-extrabold leading-tight text-brand-700">skip the corridor</p>
            </div>
          </div>
          <p className="text-5xl font-extrabold tabular-nums">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </header>

      <div className="relative grid gap-5 px-10 pb-10 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {teachers.map((p, i) => {
          const list = ticketMap[p.id] ?? [];
          const current = list.filter((t) => t.status === 'called').sort((a, b) => (b.calledAt ?? 0) - (a.calledAt ?? 0))[0];
          const waiting = list.filter((t) => t.status === 'waiting');
          const hot = flash?.place.id === p.id;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, scale: hot ? 1.03 : 1 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-3xl p-6 ring-1 transition-colors ${hot ? 'bg-sun-400 text-slate-900 ring-sun-300' : 'bg-white/5 ring-white/10'}`}
            >
              <p className="truncate text-2xl font-extrabold">{p.name}</p>
              <p className={`flex items-center gap-1.5 ${hot ? 'text-slate-800' : 'text-slate-400'}`}>
                <DoorOpen size={16} /> {p.address || 'Room not set'}
              </p>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${hot ? 'text-slate-800' : 'text-slate-400'}`}>With</p>
                  <AnimatePresence mode="popLayout">
                    <motion.p key={current?.id ?? 'none'} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="text-6xl font-extrabold tabular-nums">
                      {current ? current.number : '—'}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold uppercase tracking-wider ${hot ? 'text-slate-800' : 'text-slate-400'}`}>Next</p>
                  <p className="text-2xl font-extrabold tabular-nums">{waiting.slice(0, 3).map((t) => t.number).join(' · ') || '—'}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!started && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-slate-950/85 backdrop-blur">
          <div className="text-center">
            <Logo size={48} withText={false} />
            <h2 className="mt-4 text-3xl font-extrabold">Hall board</h2>
            <p className="mt-2 text-slate-400">Put this on the hall screen. Calls are announced out loud.</p>
            <button
              className="btn-primary mt-6 px-6 py-3 text-lg"
              onClick={() => {
                setStarted(true);
                chime();
                document.documentElement.requestFullscreen?.().catch(() => {});
              }}
            >
              <Volume2 size={20} /> Start with sound
            </button>
            <button className="btn mt-3 block w-full text-slate-400 hover:text-white" onClick={() => setStarted(true)}>
              Start silently
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
