import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Maximize, Volume2 } from 'lucide-react';
import Logo from '../components/Logo';
import SplitFlap from '../components/SplitFlap';
import CategoryArt from '../components/CategoryArt';
import { Empty, Spinner } from '../components/States';
import { usePlace, useTick, useTickets } from '../lib/hooks';
import { formatMinutes, placeWaitMinutes } from '../lib/predict';
import { announce, chime } from '../lib/speech';
import type { Ticket } from '../lib/types';

export default function TV() {
  const { placeId } = useParams();
  const { place, loading } = usePlace(placeId);
  const { tickets } = useTickets(placeId);
  const [started, setStarted] = useState(false);
  const [flash, setFlash] = useState<Ticket | null>(null);
  const seen = useRef<Map<string, number> | null>(null);
  useTick(1000 * 30);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const serving = useMemo(() => {
    const byCounter = new Map<number, Ticket>();
    tickets
      .filter((t) => t.status === 'called' && t.counter)
      .forEach((t) => {
        const prev = byCounter.get(t.counter!);
        if (!prev || (t.calledAt ?? 0) > (prev.calledAt ?? 0)) byCounter.set(t.counter!, t);
      });
    return Array.from(byCounter.values()).sort((a, b) => (a.counter ?? 0) - (b.counter ?? 0));
  }, [tickets]);
  const upNext = tickets.filter((t) => t.status === 'waiting').slice(0, 8);

  // Announce every new call or recall (but not the ones already on screen when the TV opened).
  useEffect(() => {
    if (!place) return;
    if (seen.current === null) {
      seen.current = new Map(tickets.filter((t) => t.announceAt).map((t) => [t.id, t.announceAt!]));
      return;
    }
    for (const t of tickets) {
      if (t.status !== 'called' || !t.announceAt) continue;
      if (seen.current.get(t.id) === t.announceAt) continue;
      seen.current.set(t.id, t.announceAt);
      setFlash(t);
      setTimeout(() => setFlash((f) => (f?.id === t.id ? null : f)), 6000);
      if (started) {
        chime();
        setTimeout(() => announce(t.number, t.counter ?? 1, place.languages?.length ? place.languages : ['en']), 700);
      }
    }
  }, [tickets, place, started]);

  if (loading) return <Spinner />;
  if (!place) return <Empty title="Queue not found" />;
  const joinUrl = `${window.location.origin}/q/${place.id}`;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-[26rem] w-[26rem] rounded-full bg-sun-500/10 blur-3xl" />

      {/* Header */}
      <header className="relative flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-24 overflow-hidden rounded-2xl ring-1 ring-white/15">
            <CategoryArt category={place.category} className="h-full w-full" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-300">Now serving</p>
            <h1 className="text-4xl font-extrabold">{place.name}</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-5xl font-extrabold tabular-nums">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-slate-400">{now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </header>

      <div className="relative grid gap-8 px-10 pb-24 lg:grid-cols-[1.6fr_1fr]">
        {/* Serving grid */}
        <section className="grid content-start gap-5 sm:grid-cols-2">
          {serving.length === 0 && (
            <div className="col-span-full grid h-72 place-items-center rounded-3xl bg-white/5 ring-1 ring-white/10">
              <p className="text-3xl font-bold text-slate-500">Waiting for the first call…</p>
            </div>
          )}
          <AnimatePresence>
            {serving.map((t) => (
              <motion.div
                key={`${t.counter}-${t.id}`}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`rounded-3xl p-8 ring-1 ${flash?.id === t.id ? 'bg-brand-600 ring-brand-300' : 'bg-white/5 ring-white/10'}`}
              >
                <p className="text-xl font-semibold text-slate-300">Counter {t.counter}</p>
                <SplitFlap value={t.number} tone="dark" className="mt-3 text-[5.5rem]" />
                <p className="mt-2 truncate text-2xl font-semibold text-slate-200">{t.name}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>

        {/* Side: up next + join */}
        <aside className="space-y-6">
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold">Up next</p>
              <p className="text-slate-400">Wait ~{formatMinutes(placeWaitMinutes(place))}</p>
            </div>
            <ul className="mt-4 grid grid-cols-4 gap-3">
              <AnimatePresence>
                {upNext.map((t) => (
                  <motion.li
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="rounded-2xl bg-white/10 py-3 text-center text-3xl font-extrabold tabular-nums"
                  >
                    {t.number}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            {upNext.length === 0 && <p className="mt-4 text-slate-500">Nobody waiting. Walk right in!</p>}
          </div>
          <div className="flex items-center gap-5 rounded-3xl bg-white p-5 text-slate-900">
            <QRCodeSVG value={joinUrl} size={132} />
            <div>
              <p className="text-2xl font-extrabold leading-tight">Skip the line.</p>
              <p className="mt-1 text-slate-600">Scan to get a token on your phone and wait anywhere.</p>
              <div className="mt-3"><Logo size={22} /></div>
            </div>
          </div>
        </aside>
      </div>

      {/* Ticker */}
      <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-white/10 bg-white/[0.04] py-3 backdrop-blur">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap text-lg font-bold text-slate-300">
          {Array.from({ length: 2 }, (_, k) => (
            <span key={k} className="flex gap-12">
              <span>
                Up next: <span className="text-white">{upNext.slice(0, 5).map((t) => t.number).join('  ·  ') || '—'}</span>
              </span>
              <span className="text-brand-300">Skip the line: scan the QR code and wait anywhere</span>
              <span>
                Estimated wait <span className="text-white">{formatMinutes(placeWaitMinutes(place))}</span>
              </span>
              <span className="text-sun-300">Powered by Turnly</span>
            </span>
          ))}
        </div>
      </div>

      {/* Big flash on a new call */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-brand-700/90 backdrop-blur"
          >
            <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 14 }} className="text-center">
              <p className="text-3xl font-semibold text-brand-100">Token</p>
              <p className="text-[14rem] font-extrabold leading-none tabular-nums">{flash.number}</p>
              <p className="text-5xl font-bold">→ Counter {flash.counter}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start overlay: browsers need one tap before they allow sound */}
      {!started && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-slate-950/85 backdrop-blur">
          <div className="text-center">
            <Logo size={48} withText={false} />
            <h2 className="mt-4 text-3xl font-extrabold">TV mode</h2>
            <p className="mt-2 text-slate-400">Put this on any screen. Tokens are announced out loud.</p>
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
              <Maximize size={16} /> Start silently
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
