import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
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
import { useTitle } from '../lib/useTitle';

export default function TV() {
  const { placeId } = useParams();
  const { place, loading } = usePlace(placeId);
  const { tickets } = useTickets(placeId);
  useTitle(place ? `TV · ${place.name}` : null);
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
      // Let the token fly from "Up next" to its counter first, then the big moment.
      setTimeout(() => setFlash(t), 900);
      setTimeout(() => setFlash((f) => (f?.id === t.id ? null : f)), 900 + 4200);
      if (started) {
        chime();
        setTimeout(() => announce(t.number, t.counter ?? 1, place.languages?.length ? place.languages : ['en']), 700);
      }
    }
  }, [tickets, place, started]);

  if (loading) return <Spinner />;
  if (!place) return <Empty title="Queue not found" />;
  const numSize = place.counters <= 2 ? 'text-[9rem]' : place.counters <= 4 ? 'text-[6rem]' : 'text-[4.5rem]';
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

      <LayoutGroup>
      <div className="relative grid gap-8 px-10 pb-24 lg:h-[calc(100dvh-14.75rem)] lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-h-0 flex-col gap-6">
        {/* Counters */}
        <section className={`grid min-h-0 flex-1 auto-rows-fr gap-5 ${place.counters > 1 ? 'sm:grid-cols-2' : ''}`}>
          {Array.from({ length: place.counters }, (_, i) => i + 1).map((c) => {
            const t = serving.find((x) => x.counter === c);
            const hot = !!t && flash?.id === t.id;
            return (
              <div
                key={c}
                className={`relative flex min-h-[15rem] flex-col overflow-hidden rounded-3xl p-7 ring-1 transition-colors duration-500 ${hot ? 'bg-brand-600/90 ring-brand-300' : 'bg-white/5 ring-white/10'}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-slate-300">Counter {c}</p>
                  <span className={`h-3 w-3 rounded-full ${t ? 'bg-brand-400 shadow-[0_0_16px_rgba(45,212,191,.9)]' : 'bg-slate-600'}`} />
                </div>
                <div className="flex flex-1 items-center justify-center py-3">
                  <AnimatePresence mode="popLayout">
                    {t ? (
                      <motion.div
                        key={t.id}
                        layoutId={`tv-${t.id}`}
                        exit={{ opacity: 0, y: -30, transition: { duration: 0.4 } }}
                        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                        className="rounded-[2rem] bg-white px-8 py-3 text-slate-900 shadow-[0_30px_80px_-30px_rgba(45,212,191,.7)]"
                      >
                        <span className={`${numSize} block font-extrabold leading-none tabular-nums`}>{t.number}</span>
                      </motion.div>
                    ) : (
                      <motion.p key={`free-${c}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-3xl font-bold text-slate-600">
                        Open
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <p className="h-8 truncate text-center text-2xl font-semibold text-slate-200">{t?.name ?? ''}</p>
              </div>
            );
          })}
        </section>

        {/* Today strip */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { k: 'Waiting now', v: String(tickets.filter((x) => x.status === 'waiting').length) },
            { k: 'Served today', v: String(place.servedToday ?? 0) },
            { k: 'Avg. service', v: `${Math.max(1, Math.round((place.avgServiceSec || 180) / 60))} min` },
            { k: 'On time', v: place.speed && place.speed.n >= 5 ? `${Math.round((place.speed.onTime / place.speed.n) * 100)}%` : 'New' },
          ].map((x) => (
            <div key={x.k} className="rounded-2xl bg-white/5 px-5 py-4 ring-1 ring-white/10">
              <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">{x.k}</p>
              <p className="mt-1 text-4xl font-extrabold tabular-nums">{x.v}</p>
            </div>
          ))}
        </section>
        </div>

        {/* Side: up next + join */}
        <aside className="flex min-h-0 flex-col gap-6">
          <div className="flex-1 rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold">Up next</p>
              <p className="text-slate-400">Wait ~{formatMinutes(placeWaitMinutes(place))}</p>
            </div>
            <ul className="mt-4 grid grid-cols-4 gap-3">
              {upNext.map((t, i) => (
                <motion.li
                  key={t.id}
                  layoutId={`tv-${t.id}`}
                  transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                  className={`rounded-2xl py-4 text-center text-4xl font-extrabold tabular-nums ${i === 0 ? 'bg-brand-500 text-white shadow-[0_12px_40px_-12px_rgba(45,212,191,.9)]' : 'bg-white/10'}`}
                >
                  {t.number}
                </motion.li>
              ))}
            </ul>
            {upNext.length === 0 && <p className="mt-4 text-slate-500">Nobody waiting. Walk right in!</p>}
            {upNext[0] && (
              <p className="mt-6 text-lg text-slate-400">
                Token <span className="font-extrabold text-white">{upNext[0].number}</span>, please get ready.
              </p>
            )}
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
      </LayoutGroup>

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
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="pointer-events-none absolute inset-0 z-20 grid place-items-center overflow-hidden bg-slate-950/80 backdrop-blur-md"
          >
            {[0, 1, 2].map((k) => (
              <motion.span
                key={k}
                className="absolute h-[30rem] w-[30rem] rounded-full border-4 border-brand-400/60"
                initial={{ scale: 0.3, opacity: 0.9 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1.8, delay: k * 0.35, ease: 'easeOut' }}
              />
            ))}
            <motion.div initial={{ scale: 0.6, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 170, damping: 14 }} className="relative text-center">
              <p className="text-3xl font-bold uppercase tracking-[0.3em] text-brand-300">Now calling</p>
              <div className="mx-auto mt-6 w-fit rounded-[2.5rem] bg-white px-12 py-4 text-slate-900 shadow-[0_40px_120px_-20px_rgba(14,165,143,.8)]">
                <SplitFlap value={flash.number} tone="light" className="text-[11rem]" />
              </div>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 text-6xl font-extrabold text-white">
                Counter {flash.counter}
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-3 text-3xl font-semibold text-slate-300">
                {flash.name}
              </motion.p>
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
