import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Bell } from 'lucide-react';
import CategoryArt from './CategoryArt';
import type { Category } from '../lib/types';

const KEY = 'turnly:onboarded';

/* ── Slide visuals ── */

function SeeVisual() {
  const cards: { c: Category; m: string; tone: string; x: number; y: number; r: number }[] = [
    { c: 'bank', m: '4 min', tone: 'bg-brand-500', x: -78, y: -40, r: -8 },
    { c: 'clinic', m: '32 min', tone: 'bg-rose-500', x: 72, y: -58, r: 7 },
    { c: 'barber', m: '12 min', tone: 'bg-sun-400', x: 0, y: 46, r: -2 },
  ];
  return (
    <div className="relative h-64 w-full">
      {cards.map((k, i) => (
        <motion.div
          key={k.c}
          initial={{ opacity: 0, scale: 0.6, x: 0, y: 30, rotate: 0 }}
          animate={{ opacity: 1, scale: 1, x: k.x, y: k.y, rotate: k.r }}
          transition={{ delay: 0.15 + i * 0.12, type: 'spring', stiffness: 160, damping: 15 }}
          className="absolute left-1/2 top-1/2 -ml-[70px] -mt-[48px] w-[140px] overflow-hidden rounded-2xl bg-white shadow-lift"
        >
          <CategoryArt category={k.c} className="block h-[70px] w-full" />
          <div className="flex items-center justify-between px-2.5 py-2">
            <span className="text-[11px] font-bold capitalize text-slate-700">{k.c}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white ${k.tone}`}>{k.m}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function JoinVisual() {
  const [n, setN] = useState(5);
  useEffect(() => {
    const id = setInterval(() => setN((x) => (x <= 1 ? 5 : x - 1)), 1100);
    return () => clearInterval(id);
  }, []);
  const r = 56;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-64 w-full place-items-center">
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-44 rounded-[2rem] bg-slate-800 p-2 shadow-lift ring-1 ring-white/10">
        <div className="rounded-[1.6rem] bg-gradient-to-b from-brand-500 to-brand-800 p-4 text-center text-white">
          <div className="mx-auto mb-2 h-3 w-12 rounded-full bg-black/30" />
          <div className="relative mx-auto h-32 w-32">
            <svg viewBox="0 0 130 130" className="h-full w-full -rotate-90">
              <circle cx="65" cy="65" r={r} stroke="rgba(255,255,255,.15)" strokeWidth="9" fill="none" />
              <motion.circle cx="65" cy="65" r={r} stroke="#fbab30" strokeWidth="9" strokeLinecap="round" fill="none" strokeDasharray={c} animate={{ strokeDashoffset: c * (n / 6) }} transition={{ type: 'spring', stiffness: 70, damping: 15 }} />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <p className="text-4xl font-extrabold">27</p>
                <motion.p key={n} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-bold text-sun-300">
                  {n} ahead
                </motion.p>
              </div>
            </div>
          </div>
          <p className="mt-2 rounded-full bg-white/15 py-1 text-[10px] font-bold">Wait anywhere ☕</p>
        </div>
      </motion.div>
    </div>
  );
}

function CallVisual() {
  return (
    <div className="relative grid h-64 w-full place-items-center">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute h-40 w-40 rounded-full border-2 border-sun-400"
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 1.7, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
        />
      ))}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="relative rounded-3xl bg-gradient-to-br from-sun-400 to-orange-500 px-8 py-6 text-center text-slate-900 shadow-lift"
      >
        <motion.div animate={{ rotate: [0, -18, 18, -12, 12, 0] }} transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.8 }} className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/50">
          <Bell size={28} />
        </motion.div>
        <p className="mt-3 text-sm font-bold">It's your turn!</p>
        <p className="text-5xl font-extrabold">27</p>
        <p className="text-sm font-bold">Counter 2</p>
      </motion.div>
    </div>
  );
}

const SLIDES = [
  { title: 'See the wait before you go', text: 'Live waiting times for banks, clinics, offices and shops near you.', Visual: SeeVisual },
  { title: 'Join the line from anywhere', text: 'Get a token on your phone. Wait at home, in a café, anywhere you like.', Visual: JoinVisual },
  { title: "We'll call you when it's time", text: 'Your phone buzzes when you are close, and again when it is your turn.', Visual: CallVisual },
];

/** First-visit welcome: three swipeable slides, shown once per device on the home screen. */
export default function Onboarding() {
  const { pathname } = useLocation();
  const [show, setShow] = useState(() => {
    try {
      return !localStorage.getItem(KEY);
    } catch {
      return false;
    }
  });
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);

  const finish = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    setShow(false);
  };
  const go = (n: number) => {
    if (n < 0) return;
    if (n >= SLIDES.length) return finish();
    setDir(n > i ? 1 : -1);
    setI(n);
  };

  if (pathname !== '/') return null;
  const { title, text, Visual } = SLIDES[i];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="onboarding"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-slate-950 text-white"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-600/40 blur-[110px] animate-aurora" />
          <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-sun-500/20 blur-[100px] animate-aurora2" />

          <div className="relative flex items-center justify-between px-6 pt-5">
            <img src="/icon-192.png" alt="Turnly" className="h-9 w-9 rounded-xl" />
            <button className="rounded-full px-3 py-1.5 text-sm font-bold text-slate-400 hover:text-white" onClick={finish}>
              Skip
            </button>
          </div>

          <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={i}
                custom={dir}
                initial={{ opacity: 0, x: dir * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -60 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) go(i + 1);
                  else if (info.offset.x > 60) go(i - 1);
                }}
                className="cursor-grab touch-pan-y active:cursor-grabbing"
              >
                <Visual />
                <h2 className="mt-8 text-center text-3xl font-extrabold leading-tight tracking-tight">{title}</h2>
                <p className="mx-auto mt-3 max-w-xs text-center text-slate-400">{text}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative mx-auto w-full max-w-md px-6 pb-8">
            <div className="mb-6 flex justify-center gap-2">
              {SLIDES.map((_, k) => (
                <button key={k} onClick={() => go(k)} aria-label={`Slide ${k + 1}`} className="py-2">
                  <motion.span className="block h-1.5 rounded-full" animate={{ width: k === i ? 28 : 8, backgroundColor: k === i ? '#27c1a8' : 'rgba(255,255,255,.25)' }} />
                </button>
              ))}
            </div>
            <motion.button whileTap={{ scale: 0.97 }} className="btn-primary w-full py-4 text-base" onClick={() => go(i + 1)}>
              {i === SLIDES.length - 1 ? "Let's go" : 'Next'} <ArrowRight size={18} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
