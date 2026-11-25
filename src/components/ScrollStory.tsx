import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { Smartphone, User } from 'lucide-react';

const PEOPLE = 9;

function Person({ i, p, gap }: { i: number; p: MotionValue<number>; gap: number }) {
  const offset = (i - (PEOPLE - 1) / 2) * gap;
  const x = useTransform(p, [0.15, 0.6], [offset, 0]);
  const y = useTransform(p, [0.15, 0.6], [0, -10]);
  const scale = useTransform(p, [0.15, 0.6], [1, 0.2]);
  const opacity = useTransform(p, [0.45, 0.62], [1, 0]);
  return (
    <motion.div style={{ x, y, scale, opacity }} className="absolute left-1/2 top-1/2 -ml-5 -mt-5 sm:-ml-6 sm:-mt-6">
      <div className={`grid h-10 w-10 place-items-center rounded-2xl sm:h-12 sm:w-12 ${i === 6 ? 'bg-sun-400 text-slate-900' : 'bg-white/10 text-slate-300'}`}>
        <User size={22} />
      </div>
    </motion.div>
  );
}

/** Scroll-driven story: a physical line of people collapses into one phone. */
export default function ScrollStory() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const phoneScale = useTransform(p, [0.5, 0.72], [0.3, 1]);
  const phoneOpacity = useTransform(p, [0.5, 0.64], [0, 1]);
  const t1 = useTransform(p, [0, 0.12, 0.4, 0.5], [0, 1, 1, 0]);
  const t2 = useTransform(p, [0.62, 0.75], [0, 1]);
  const barW = useTransform(p, [0, 1], ['0%', '100%']);
  const gap = typeof window !== 'undefined' ? Math.min(64, (window.innerWidth - 56) / PEOPLE) : 64;

  return (
    <section ref={ref} className="relative h-[220vh]">
      <div className="sticky top-0 flex h-dvh items-center overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/25 blur-[120px]" />
        <div className="container-x relative">
          <div className="relative h-40">
            <motion.h2 style={{ opacity: t1 }} className="absolute inset-x-0 text-center text-3xl font-extrabold tracking-tight sm:text-6xl">
              Today, waiting looks like <span className="text-slate-400">this.</span>
            </motion.h2>
            <motion.h2 style={{ opacity: t2 }} className="absolute inset-x-0 text-center text-3xl font-extrabold tracking-tight sm:text-6xl">
              With Turnly, it looks like <span className="text-brand-400">this.</span>
            </motion.h2>
          </div>
          <div className="relative mx-auto h-64 max-w-3xl">
            {Array.from({ length: PEOPLE }, (_, i) => (
              <Person key={i} i={i} p={p} gap={gap} />
            ))}
            <motion.div style={{ scale: phoneScale, opacity: phoneOpacity }} className="absolute left-1/2 top-1/2 -ml-20 -mt-36 w-40">
              <div className="rounded-[2rem] bg-slate-800 p-1.5 shadow-[0_30px_80px_-20px_rgba(14,165,143,.7)] ring-1 ring-white/20">
                <div className="flex h-[17rem] flex-col items-center rounded-[1.6rem] bg-gradient-to-b from-brand-500 to-brand-800 px-3 pb-4 pt-3 text-center">
                  <div className="h-3.5 w-14 rounded-full bg-black/30" />
                  <Smartphone className="mt-5 text-brand-200" size={16} />
                  <p className="mt-2 text-[10px] font-semibold text-brand-100">Your token</p>
                  <p className="text-5xl font-extrabold">31</p>
                  <p className="mt-1 text-[11px] font-bold text-sun-300">3 ahead · 9 min</p>
                  <p className="mt-auto w-full rounded-full bg-white/15 py-1.5 text-[10px] font-bold">Wait anywhere you like</p>
                </div>
              </div>
            </motion.div>
          </div>
          <motion.p style={{ opacity: t2 }} className="mx-auto mt-6 max-w-xl text-center text-lg text-slate-300">
            Same queue. No standing. You get your time back, and the shop gets a calmer room.
          </motion.p>
          <div className="mx-auto mt-10 h-1 w-48 overflow-hidden rounded-full bg-white/10">
            <motion.div style={{ width: barW }} className="h-full bg-gradient-to-r from-brand-400 to-sun-400" />
          </div>
        </div>
      </div>
    </section>
  );
}
