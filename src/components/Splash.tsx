import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const KEY = 'turnly:splashed';
const DURATION = 3000;
const WORD = 'Turnly'.split('');

/**
 * The startup screen: a line of queue tokens slides in, rushes to the centre
 * and becomes the Turnly logo. Shown once per browser session; tap to skip.
 */
export default function Splash() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem(KEY);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!show) return;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => setShow(false), DURATION);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, [show]);

  useEffect(() => {
    if (!show) {
      try {
        sessionStorage.setItem(KEY, '1');
      } catch {
        /* ignore */
      }
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] grid cursor-pointer place-items-center overflow-hidden bg-slate-950"
          exit={{ opacity: 0, scale: 1.08, filter: 'blur(10px)' }}
          transition={{ duration: 0.7, ease: [0.7, 0, 0.3, 1] }}
          onClick={() => setShow(false)}
        >
          {/* Aurora */}
          <motion.div
            className="absolute h-[42rem] w-[42rem] rounded-full bg-brand-600/30 blur-[120px]"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute right-[10%] top-[15%] h-72 w-72 rounded-full bg-sun-500/20 blur-[100px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1.4 }}
          />
          {/* Fine grid */}
          <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />

          <div className="relative flex flex-col items-center">
            <div className="relative h-28 w-28">
              {/* The queue: tokens slide in as a line, then rush into the logo */}
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const startX = -260 + i * 48;
                return (
                  <motion.span
                    key={i}
                    className="absolute left-1/2 top-1/2 -ml-2.5 -mt-2.5 h-5 w-5 rounded-full shadow-[0_0_20px_rgba(39,193,168,.7)]"
                    style={{ background: i === 5 ? '#fbab30' : '#27c1a8' }}
                    initial={{ x: startX - 80, opacity: 0, scale: 0.4 }}
                    animate={{ x: [startX - 80, startX, startX, 0], opacity: [0, 1, 1, 0], scale: [0.4, 1, 1, 0.2] }}
                    transition={{ duration: 1.25, times: [0, 0.35, 0.6, 1], delay: 0.05 + i * 0.07, ease: 'easeInOut' }}
                  />
                );
              })}

              {/* Shockwave when the logo lands */}
              <motion.span
                className="absolute inset-0 rounded-[28px] border-2 border-brand-300"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: [0.6, 2.2], opacity: [0, 0.8, 0] }}
                transition={{ delay: 1.2, duration: 0.9, ease: 'easeOut' }}
              />

              <motion.svg
                viewBox="0 0 64 64"
                className="absolute inset-0 h-full w-full drop-shadow-[0_20px_40px_rgba(10,133,118,.55)]"
                initial={{ scale: 0, rotate: -25, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ delay: 1.05, type: 'spring', stiffness: 240, damping: 15 }}
              >
                <rect width="64" height="64" rx="16" fill="#0a8576" />
                <motion.path
                  d="M20 22h24"
                  stroke="#fff"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                  pathLength={1}
                  strokeDasharray="1"
                  initial={{ strokeDashoffset: 1 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ delay: 1.3, duration: 0.3, ease: 'easeOut' }}
                />
                <motion.path
                  d="M32 22v24"
                  stroke="#fff"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                  pathLength={1}
                  strokeDasharray="1"
                  initial={{ strokeDashoffset: 1 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ delay: 1.55, duration: 0.3, ease: 'easeOut' }}
                />
                <motion.circle
                  cx="46"
                  cy="44"
                  r="6"
                  fill="#fbab30"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.6, 1] }}
                  transition={{ delay: 1.8, duration: 0.45 }}
                />
              </motion.svg>
            </div>

            <div className="mt-7 flex overflow-hidden">
              {WORD.map((ch, i) => (
                <motion.span
                  key={i}
                  className="text-5xl font-extrabold tracking-tight text-white"
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ delay: 1.6 + i * 0.05, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  {ch}
                </motion.span>
              ))}
            </div>
            <motion.p
              className="mt-3 text-sm font-medium text-slate-400"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.05, duration: 0.5 }}
            >
              No one should ever wait in line again.
            </motion.p>

            <div className="mt-8 h-[3px] w-40 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-sun-400"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: (DURATION - 200) / 1000, ease: 'easeInOut' }}
              />
            </div>
          </div>
          <p className="absolute bottom-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-600">Tap to skip</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
