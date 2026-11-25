import { useEffect, useReducer, useRef } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Bell, BellRing, Footprints, Users } from 'lucide-react';

const ME = 27;
const START = { queue: [24, 25, 26, 27, 28, 29, 30], serving: 23, turn: false };
type State = typeof START;

function reducer(s: State, a: 'next' | 'reset'): State {
  if (a === 'reset') return START;
  if (s.turn) return s;
  const [first, ...rest] = s.queue;
  return { queue: [...rest, s.queue[s.queue.length - 1] + 1], serving: first, turn: first === ME };
}

/**
 * The interactive hero: a real (simulated) queue. Visitors can tap "Call next"
 * on the counter and watch the phone count down to "It's your turn".
 */
export default function LiveQueueDemo() {
  const [s, dispatch] = useReducer(reducer, START);
  const pausedUntil = useRef(0);
  const ahead = Math.max(0, s.queue.indexOf(ME));
  const progress = s.turn ? 1 : 1 - ahead / 3;

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() > pausedUntil.current) dispatch('next');
    }, 2600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!s.turn) return;
    const t = setTimeout(() => dispatch('reset'), 3600);
    return () => clearTimeout(t);
  }, [s.turn]);

  // Mouse tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 120, damping: 14 });
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 14 });

  const r = 62;
  const c = 2 * Math.PI * r;

  return (
    <div
      className="relative mx-auto h-[520px] w-full max-w-[520px] [perspective:1200px]"
      onMouseMove={(e) => {
        const b = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - b.left) / b.width - 0.5);
        my.set((e.clientY - b.top) / b.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {/* Phone */}
      <div className="absolute left-1/2 top-4 w-[270px] -translate-x-1/2">
      <motion.div
        style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d' }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
        className="rounded-[2.6rem] bg-slate-900 p-2.5 shadow-[0_40px_80px_-20px_rgba(15,23,42,.45)]"
      >
        <div className="relative h-[470px] overflow-hidden rounded-[2.15rem] bg-gradient-to-b from-brand-600 via-brand-700 to-brand-900 p-5 text-white">
          <div className="mx-auto mb-4 h-6 w-24 rounded-full bg-black/40" />
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-100">Federal Bank · Kannur</p>
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sun-400" /> LIVE
            </span>
          </div>

          {/* Ring */}
          <div className="relative mx-auto mt-5 h-40 w-40">
            <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
              <circle cx="70" cy="70" r={r} stroke="rgba(255,255,255,.14)" strokeWidth="10" fill="none" />
              <motion.circle
                cx="70"
                cy="70"
                r={r}
                stroke="#fbab30"
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={c}
                animate={{ strokeDashoffset: c * (1 - Math.max(0.04, progress)) }}
                transition={{ type: 'spring', stiffness: 60, damping: 16 }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-[11px] text-brand-100">Your token</p>
                <p className="text-5xl font-extrabold leading-none">{ME}</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={ahead}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mt-1 text-[11px] font-bold text-sun-300"
                  >
                    {s.turn ? 'Your turn!' : ahead === 0 ? "You're next" : `${ahead} ahead`}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[10px] text-brand-100">Your turn in</p>
              <p className="whitespace-nowrap text-xl font-extrabold">{s.turn ? 'Now' : `${ahead * 3 + 1} min`}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[10px] text-brand-100">Now serving</p>
              <AnimatePresence mode="popLayout">
                <motion.p
                  key={s.serving}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -16, opacity: 0 }}
                  className="text-xl font-extrabold"
                >
                  {s.serving}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <div className="mt-3 rounded-2xl bg-white p-3 text-slate-900">
            <p className="flex items-center gap-2 text-xs font-bold text-brand-700">
              <Footprints size={14} /> {ahead <= 1 ? 'Leave now' : `Leave home in ${ahead * 3 - 2} min`}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">You'll walk in right as your turn comes.</p>
          </div>

          {/* Your-turn takeover */}
          <AnimatePresence>
            {s.turn && (
              <motion.div
                initial={{ clipPath: 'circle(0% at 50% 100%)' }}
                animate={{ clipPath: 'circle(150% at 50% 100%)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 grid place-items-center bg-gradient-to-b from-sun-400 to-sun-500 text-center text-slate-900"
              >
                <div>
                  <motion.div
                    animate={{ rotate: [0, -16, 16, -10, 10, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.4 }}
                    className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/40"
                  >
                    <Bell size={30} />
                  </motion.div>
                  <p className="mt-4 text-sm font-bold">It's your turn!</p>
                  <p className="text-7xl font-extrabold leading-none">{ME}</p>
                  <p className="mt-2 font-bold">Go to counter 2</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      </div>

      {/* Floating: the line */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="absolute left-0 top-10 z-10 w-[190px] rounded-2xl sm:w-[230px] bg-white/90 p-3 shadow-lift ring-1 ring-slate-200/70 backdrop-blur sm:-left-6"
      >
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          <Users size={12} /> In line, live
        </p>
        <div className="mt-2 flex gap-1.5 overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout">
            {s.queue.slice(0, 4).map((n) => (
              <motion.span
                key={n}
                layout
                initial={{ opacity: 0, scale: 0.5, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.4, y: -20 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${
                  n === ME ? 'bg-sun-400 text-slate-900 ring-2 ring-sun-300' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {n}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Floating: the counter you can press */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute bottom-6 right-0 z-10 w-[190px] rounded-2xl sm:w-[220px] bg-slate-900 p-4 text-white shadow-lift sm:-right-6"
      >
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Counter 2 · staff</p>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xs text-slate-400">Serving</span>
          <AnimatePresence mode="popLayout">
            <motion.span key={s.serving} initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-extrabold">
              {s.serving}
            </motion.span>
          </AnimatePresence>
        </div>
        <motion.button
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.03 }}
          onClick={() => {
            pausedUntil.current = Date.now() + 6000;
            dispatch('next');
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-bold shadow-[0_8px_24px_-6px_rgba(14,165,143,.8)] hover:bg-brand-400"
        >
          <BellRing size={16} /> Call next
        </motion.button>
        <p className="mt-2 text-center text-[10px] text-slate-500">Try it: press to move the line</p>
      </motion.div>

      {/* Floating: notification */}
      <AnimatePresence>
        {ahead === 2 && !s.turn && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-0 z-20 flex w-[210px] items-start gap-2 rounded-2xl bg-white p-3 shadow-lift ring-1 ring-slate-200 sm:-right-4"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-white">
              <Bell size={14} />
            </span>
            <div>
              <p className="text-xs font-bold">Almost your turn</p>
              <p className="text-[11px] text-slate-500">2 ahead at Federal Bank</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
